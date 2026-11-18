// Firestore security-rules tests. Run by GitHub Actions in the Firestore emulator
// before firestore.rules is published; if any check fails, nothing is deployed.
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc, getDoc, deleteDoc, getDocs, collection, query, where } from "firebase/firestore";

const env = await initializeTestEnvironment({ projectId: "demo-campuscord", firestore: { rules: readFileSync("firestore.rules", "utf8") } });
const now = Date.now();
await env.withSecurityRulesDisabled(async ctx => {
  const db = ctx.firestore();
  await setDoc(doc(db, "config/main"), { ownerUid: "owner", banned: [], admins: ["dev"], timeouts: { timed: now + 3600000 } });
  await setDoc(doc(db, "secret/invite"), { code: "TEST" });
  for (const u of ["owner", "alice", "bob", "dev", "timed"]) await setDoc(doc(db, "members", u), { nick: u, color: "#fff", joinedAt: now, lastSeen: now, code: "TEST" });
  await setDoc(doc(db, "config/catalog"), { v: 1, prices: { d_bubble: 0, d_cosmic: 700, b_cosmic: 1360 }, quests: { q_first: 100, q_react: 150 }, daily: 50 });
  await setDoc(doc(db, "rooms/general"), { name: "general" });
  await setDoc(doc(db, "rooms/secret"), { name: "secret", private: true, allowed: ["alice"] });
  await setDoc(doc(db, "rooms/lounge"), { name: "lounge", type: "voice" });
  await setDoc(doc(db, "rooms/lounge/signals/s1"), { from: "alice", to: "bob", type: "offer", sdp: "x", ts: now });
});
const as = u => env.authenticatedContext(u).firestore();
let pass = 0, fail = 0;
async function t(name, p){ try{ await p; pass++; console.log("  ✓", name); }catch(e){ fail++; console.log("  ✗", name, "—", e.message.split("\n")[0]); } }

console.log("Membership");
await t("new person joins with the right code", assertSucceeds(setDoc(doc(as("carol"), "members/carol"), { nick: "carol", color: "#fff", joinedAt: now, lastSeen: now, code: "TEST" })));
await t("wrong invite code is refused", assertFails(setDoc(doc(as("dave"), "members/dave"), { nick: "dave", color: "#fff", joinedAt: now, lastSeen: now, code: "NOPE" })));

console.log("Rooms");
await t("member posts in a public room", assertSucceeds(setDoc(doc(as("alice"), "rooms/general/msgs/m1"), { uid: "alice", text: "hi", ts: now })));
await t("post a vouch", assertSucceeds(setDoc(doc(as("alice"), "rooms/general/msgs/v1"), { uid: "alice", text: "great", ts: now, vouch: { to: "bob", stars: 5, n: 1 } })));
await t("can't vouch for yourself", assertFails(setDoc(doc(as("alice"), "rooms/general/msgs/v2"), { uid: "alice", text: "me!", ts: now, vouch: { to: "alice", stars: 5, n: 2 } })));
await t("can't give 6 stars", assertFails(setDoc(doc(as("alice"), "rooms/general/msgs/v3"), { uid: "alice", text: "wow", ts: now, vouch: { to: "server", stars: 6, n: 3 } })));
await t("timed-out member can't post", assertFails(setDoc(doc(as("timed"), "rooms/general/msgs/m2"), { uid: "timed", text: "hi", ts: now })));
await t("invited member reads private room", assertSucceeds(getDoc(doc(as("alice"), "rooms/secret/msgs/x"))));
await t("uninvited member can't read private room", assertFails(getDoc(doc(as("bob"), "rooms/secret/msgs/x"))));

console.log("Presence & voice");
await t("set yourself as away", assertSucceeds(updateDoc(doc(as("alice"), "members/alice"), { away: true, lastSeen: now })));
await t("can't set someone else away", assertFails(updateDoc(doc(as("bob"), "members/alice"), { away: true })));
await t("join a voice channel", assertSucceeds(setDoc(doc(as("alice"), "rooms/lounge/voice/alice"), { joinedAt: now, lastSeen: now, muted: false, deaf: false })));
await t("can't put someone else in voice", assertFails(setDoc(doc(as("bob"), "rooms/lounge/voice/alice"), { joinedAt: now, lastSeen: now })));
await t("timed-out member can't join voice", assertFails(setDoc(doc(as("timed"), "rooms/lounge/voice/timed"), { joinedAt: now, lastSeen: now })));
await t("can't join voice in a private room you're not in", assertFails(setDoc(doc(as("bob"), "rooms/secret/voice/bob"), { joinedAt: now, lastSeen: now })));
await t("send a voice signal as yourself", assertSucceeds(setDoc(doc(as("bob"), "rooms/lounge/signals/s2"), { from: "bob", to: "alice", type: "answer", sdp: "y", ts: now })));
await t("can't send a signal pretending to be someone else", assertFails(setDoc(doc(as("bob"), "rooms/lounge/signals/s3"), { from: "alice", to: "carol", type: "offer", ts: now })));
await t("receiver can list their signals", assertSucceeds(getDocs(query(collection(as("bob"), "rooms/lounge/signals"), where("to", "==", "bob")))));
await t("others can't read your signals", assertFails(getDoc(doc(as("carol"), "rooms/lounge/signals/s1"))));
await t("receiver can delete a used signal", assertSucceeds(deleteDoc(doc(as("bob"), "rooms/lounge/signals/s1"))));
await t("leave voice", assertSucceeds(deleteDoc(doc(as("alice"), "rooms/lounge/voice/alice"))));

console.log("Wallet");
const W = { earned: 0, spent: 0, items: [], quests: [], lastDaily: 0, lastItem: "", lastQuest: "" };
await t("start an empty wallet", assertSucceeds(setDoc(doc(as("alice"), "wallet/alice"), W)));
await t("can't start with free Sparks", assertFails(setDoc(doc(as("bob"), "wallet/bob"), { ...W, earned: 5000 })));
await t("can't create someone else's wallet", assertFails(setDoc(doc(as("bob"), "wallet/carol"), W)));
await t("claim a quest for its reward", assertSucceeds(updateDoc(doc(as("alice"), "wallet/alice"), { earned: 100, quests: ["q_first"], lastQuest: "q_first" })));
await t("can't claim the same quest twice", assertFails(updateDoc(doc(as("alice"), "wallet/alice"), { earned: 200, quests: ["q_first", "q_first"], lastQuest: "q_first" })));
await t("can't inflate a quest reward", assertFails(updateDoc(doc(as("alice"), "wallet/alice"), { earned: 1100, quests: ["q_first", "q_react"], lastQuest: "q_react" })));
await t("claim the free decoration", assertSucceeds(updateDoc(doc(as("alice"), "wallet/alice"), { spent: 0, items: ["d_bubble"], lastItem: "d_bubble" })));
await t("can't buy without enough Sparks", assertFails(updateDoc(doc(as("alice"), "wallet/alice"), { spent: 700, items: ["d_bubble", "d_cosmic"], lastItem: "d_cosmic" })));
await t("can't underpay", assertFails(updateDoc(doc(as("alice"), "wallet/alice"), { spent: 1, items: ["d_bubble", "d_cosmic"], lastItem: "d_cosmic" })));
await t("can't add Sparks to yourself", assertFails(updateDoc(doc(as("alice"), "wallet/alice"), { earned: 99999 })));
await t("daily reward works", assertSucceeds(updateDoc(doc(as("alice"), "wallet/alice"), { earned: 150, lastDaily: Date.now() })));
await t("daily reward can't be claimed twice", assertFails(updateDoc(doc(as("alice"), "wallet/alice"), { earned: 200, lastDaily: Date.now() + 1000 })));
await t("owner can gift Sparks", assertSucceeds(updateDoc(doc(as("owner"), "wallet/alice"), { earned: 1150 })));
await t("buy at the catalog price", assertSucceeds(updateDoc(doc(as("alice"), "wallet/alice"), { spent: 700, items: ["d_bubble", "d_cosmic"], lastItem: "d_cosmic" })));
await t("others can't touch your wallet", assertFails(updateDoc(doc(as("bob"), "wallet/alice"), { spent: 0 })));

console.log("Profiles");
await t("equip cosmetics on your profile", assertSucceeds(setDoc(doc(as("alice"), "profiles/alice"), { deco: "d_cosmic", pfx: "", plate: "", pban: "n_galaxy" }, { merge: true })));
await t("pin up to 6 badges", assertSucceeds(setDoc(doc(as("alice"), "profiles/alice"), { showcase: ["early", "photo"] }, { merge: true })));
await t("can't pin more than 6 badges", assertFails(setDoc(doc(as("alice"), "profiles/alice"), { showcase: ["a", "b", "c", "d", "e", "f", "g"] }, { merge: true })));
await t("photo profile picture fits", assertSucceeds(setDoc(doc(as("alice"), "profiles/alice"), { avatar: "data:image/jpeg;base64," + "A".repeat(60000) }, { merge: true })));
await t("huge profile picture is refused", assertFails(setDoc(doc(as("alice"), "profiles/alice"), { avatar: "data:image/jpeg;base64," + "A".repeat(130000) }, { merge: true })));
await t("post feedback", assertSucceeds(setDoc(doc(as("alice"), "feedback/f1"), { uid: "alice", nick: "Alice", type: "bug", title: "Voice cuts out", text: "on school wifi", ts: 1, votes: ["alice"], status: "open" })));
await t("can't post feedback with fake vouches", assertFails(setDoc(doc(as("alice"), "feedback/f2"), { uid: "alice", nick: "Alice", type: "idea", title: "More emojis", text: "", ts: 1, votes: ["alice", "bob"], status: "open" })));
await t("vouch for feedback", assertSucceeds(updateDoc(doc(as("bob"), "feedback/f1"), { votes: ["alice", "bob"] })));
await t("can't vouch for someone else", assertFails(updateDoc(doc(as("bob"), "feedback/f1"), { votes: ["alice", "bob", "carol"] })));
await t("can't set feedback status as a member", assertFails(updateDoc(doc(as("bob"), "feedback/f1"), { status: "done" })));
await t("can't edit someone else's profile", assertFails(setDoc(doc(as("bob"), "profiles/alice"), { bio: "hacked" }, { merge: true })));

console.log("Shop");
await t("members can't grant themselves perks", assertFails(setDoc(doc(as("alice"), "perks/alice"), { items: { plus: { since: now } } })));
await t("members can't change the catalog", assertFails(setDoc(doc(as("alice"), "config/catalog"), { v: 1, prices: { d_cosmic: 0 } })));

console.log("Vouch & feedback rewards");
const wk = Math.floor((Date.now() - 363600000) / 604800000);
const aw = async () => (await getDoc(doc(as("alice"), "wallet/alice"))).data();
let e0 = (await aw()).earned;
await t("can't claim a vouch before it's approved", assertFails(updateDoc(doc(as("alice"), "wallet/alice"), { earned: e0 + 200, vWeek: wk, vCount: 1, lastVouch: "general/v1", vPaid: ["general/v1"] })));
await t("members can't approve vouches", assertFails(updateDoc(doc(as("bob"), "rooms/general/msgs/v1"), { approved: true, approvedBy: "bob" })));
await t("dev approves a vouch", assertSucceeds(updateDoc(doc(as("dev"), "rooms/general/msgs/v1"), { approved: true, approvedBy: "dev" })));
await t("1st approved vouch of the week pays 200", assertSucceeds(updateDoc(doc(as("alice"), "wallet/alice"), { earned: e0 + 200, vWeek: wk, vCount: 1, lastVouch: "general/v1", vPaid: ["general/v1"] })));
await t("can't claim the same vouch twice", assertFails(updateDoc(doc(as("alice"), "wallet/alice"), { earned: e0 + 350, vWeek: wk, vCount: 2, lastVouch: "general/v1", vPaid: ["general/v1", "general/v1"] })));
await t("can't claim someone else's vouch", assertFails(updateDoc(doc(as("bob"), "wallet/bob"), { earned: 200, vWeek: wk, vCount: 1, lastVouch: "general/v1", vPaid: ["general/v1"] })));
await setDoc(doc(as("alice"), "rooms/general/msgs/v4"), { uid: "alice", text: "again and again", ts: Date.now(), vouch: { to: "server", stars: 4, n: 4 } });
await updateDoc(doc(as("dev"), "rooms/general/msgs/v4"), { approved: true, approvedBy: "dev" });
await t("2nd approved vouch of the week pays 150", assertSucceeds(updateDoc(doc(as("alice"), "wallet/alice"), { earned: e0 + 350, vWeek: wk, vCount: 2, lastVouch: "general/v4", vPaid: ["general/v1", "general/v4"] })));
await setDoc(doc(as("alice"), "rooms/general/msgs/v5"), { uid: "alice", text: "more more more", ts: Date.now(), vouch: { to: "server", stars: 3, n: 5 } });
await updateDoc(doc(as("dev"), "rooms/general/msgs/v5"), { approved: true, approvedBy: "dev" });
await t("3rd vouch of the week pays nothing", assertFails(updateDoc(doc(as("alice"), "wallet/alice"), { earned: e0 + 500, vWeek: wk, vCount: 3, lastVouch: "general/v5", vPaid: ["general/v1", "general/v4", "general/v5"] })));
await t("can't backdate a vouch", assertFails(setDoc(doc(as("alice"), "rooms/general/msgs/v6"), { uid: "alice", text: "old", ts: Date.now() - 864e5 * 9, vouch: { to: "server", stars: 5, n: 6 } })));
await t("dev marks feedback planned", assertSucceeds(updateDoc(doc(as("dev"), "feedback/f1"), { status: "planned", statusBy: "dev", statusAt: Date.now() })));
e0 = (await aw()).earned;
await t("feedback author gets 200 once it's planned", assertSucceeds(updateDoc(doc(as("alice"), "wallet/alice"), { earned: e0 + 200, fbPaid: ["f1"], lastFb: "f1" })));
await t("can't claim the same feedback twice", assertFails(updateDoc(doc(as("alice"), "wallet/alice"), { earned: e0 + 400, fbPaid: ["f1", "f1x"], lastFb: "f1" })));

await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
