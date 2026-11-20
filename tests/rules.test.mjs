// Firestore security-rules tests. Run by GitHub Actions in the Firestore emulator
// before firestore.rules is published; if any check fails, nothing is deployed.
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc, getDoc, deleteDoc, getDocs, collection, query, where, writeBatch } from "firebase/firestore";

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
// Post a vouch the way the app does: the message plus one "vouch try", in one batch.
const vTries = {};
function vouch(u, rid, mid, data, usedOverride){
  const db = as(u), b = writeBatch(db), used = usedOverride ?? (vTries[u] || 0) + 1;
  b.set(doc(db, "rooms", rid, "msgs", mid), data);
  b.set(doc(db, "vouchQuota", u), { used, lastMsg: rid + "/" + mid }, { merge: true });
  return b.commit().then(r => { vTries[u] = used; return r; });
}
async function t(name, p){ try{ await p; pass++; console.log("  ✓", name); }catch(e){ fail++; console.log("  ✗", name, "—", e.message.split("\n")[0]); } }

console.log("Membership");
await t("claim a free name", assertSucceeds(setDoc(doc(as("carol"), "names/carol"), { uid: "carol", ts: now })));
await t("can't claim a name someone has", assertFails(setDoc(doc(as("dave"), "names/carol"), { uid: "dave", ts: now })));
await t("can't join with a name you didn't claim", assertFails(setDoc(doc(as("erin"), "members/erin"), { nick: "carol", color: "#fff", joinedAt: now, lastSeen: now, code: "TEST" })));
await t("new person joins with the right code", assertSucceeds(setDoc(doc(as("carol"), "members/carol"), { nick: "carol", color: "#fff", joinedAt: now, lastSeen: now, code: "TEST" })));
await t("wrong invite code is refused", assertFails(setDoc(doc(as("dave"), "members/dave"), { nick: "dave", color: "#fff", joinedAt: now, lastSeen: now, code: "NOPE" })));

console.log("Rooms");
await t("member posts in a public room", assertSucceeds(setDoc(doc(as("alice"), "rooms/general/msgs/m1"), { uid: "alice", text: "hi", ts: now })));
await t("post a vouch", assertSucceeds(vouch("alice", "general", "v1", { uid: "alice", text: "Bob always helps me with math homework and explains it well", ts: now, vouch: { to: "bob", stars: 5, n: 1 } })));
await t("can't vouch for yourself", assertFails(vouch("alice", "general", "v2", { uid: "alice", text: "me!", ts: now, vouch: { to: "alice", stars: 5, n: 2 } })));
await t("can't give 6 stars", assertFails(vouch("alice", "general", "v3", { uid: "alice", text: "wow", ts: now, vouch: { to: "server", stars: 6, n: 3 } })));
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
await vouch("alice", "general", "v4", { uid: "alice", text: "Voice chat works great and it is really easy to use every day", ts: Date.now(), vouch: { to: "server", stars: 4, n: 4 } });
await updateDoc(doc(as("dev"), "rooms/general/msgs/v4"), { approved: true, approvedBy: "dev" });
await t("2nd approved vouch of the week pays 150", assertSucceeds(updateDoc(doc(as("alice"), "wallet/alice"), { earned: e0 + 350, vWeek: wk, vCount: 2, lastVouch: "general/v4", vPaid: ["general/v1", "general/v4"] })));
await vouch("alice", "general", "v5", { uid: "alice", text: "The badges are fun to collect and the shop has cool stuff in it", ts: Date.now(), vouch: { to: "server", stars: 3, n: 5 } });
await updateDoc(doc(as("dev"), "rooms/general/msgs/v5"), { approved: true, approvedBy: "dev" });
await t("3rd vouch of the week pays nothing", assertFails(updateDoc(doc(as("alice"), "wallet/alice"), { earned: e0 + 500, vWeek: wk, vCount: 3, lastVouch: "general/v5", vPaid: ["general/v1", "general/v4", "general/v5"] })));
await t("can't backdate a vouch", assertFails(vouch("alice", "general", "v6", { uid: "alice", text: "old", ts: Date.now() - 864e5 * 9, vouch: { to: "server", stars: 5, n: 6 } })));
await t("dev marks feedback planned", assertSucceeds(updateDoc(doc(as("dev"), "feedback/f1"), { status: "planned", statusBy: "dev", statusAt: Date.now() })));
e0 = (await aw()).earned;
await t("feedback author gets 200 once it's planned", assertSucceeds(updateDoc(doc(as("alice"), "wallet/alice"), { earned: e0 + 200, fbPaid: ["f1"], lastFb: "f1" })));
await t("can't claim the same feedback twice", assertFails(updateDoc(doc(as("alice"), "wallet/alice"), { earned: e0 + 400, fbPaid: ["f1", "f1x"], lastFb: "f1" })));

console.log("Push");
await t("save your own push device", assertSucceeds(setDoc(doc(as("alice"), "push/alice/subs/d1"), { endpoint: "https://push.example/1", keys: { p256dh: "x", auth: "y" }, ts: now })));
await t("can't read someone else's push devices", assertFails(getDoc(doc(as("bob"), "push/alice/subs/d1"))));
await t("can't add a device for someone else", assertFails(setDoc(doc(as("bob"), "push/alice/subs/d2"), { endpoint: "https://evil", keys: {}, ts: now })));
await t("can't read the push private key", assertFails(getDoc(doc(as("alice"), "secret/vapid"))));
await t("anyone signed in can read the push public key", assertSucceeds(getDoc(doc(as("alice"), "config/push"))));

console.log("Names, strikes, vouch-only");
await setDoc(doc(as("carol"), "names/carol 2"), { uid: "carol", ts: now });
await t("rename to a name you claimed", assertSucceeds(updateDoc(doc(as("carol"), "members/carol"), { nick: "carol 2", nickAt: Date.now() })));
await setDoc(doc(as("bob"), "names/zed"), { uid: "bob", ts: now });
await t("can't rename to someone else's name", assertFails(updateDoc(doc(as("carol"), "members/carol"), { nick: "Zed", nickAt: Date.now() })));
await setDoc(doc(as("owner"), "rooms/vch"), { name: "vouches", type: "vouches", createdAt: 1 });
await updateDoc(doc(as("owner"), "config/main"), { "nameFlags.carol": { count: 1, at: Date.now() + 1000, active: true } });
await t("only vouches can be posted in #vouches", assertFails(setDoc(doc(as("alice"), "rooms/vch/msgs/x1"), { uid: "alice", text: "hey", ts: Date.now() })));
await t("a vouch can be posted in #vouches", assertSucceeds(vouch("alice", "vch", "x2", { uid: "alice", text: "Bob is a great friend and always answers when I need help", ts: Date.now(), vouch: { to: "bob", stars: 5, n: 1 } })));
await t("a name-flagged person can't post", assertFails(setDoc(doc(as("carol"), "rooms/general/msgs/c1"), { uid: "carol", text: "hi", ts: Date.now() })));
await t("can't unlock without actually changing your name", assertFails(updateDoc(doc(as("carol"), "members/carol"), { nickAt: Date.now() + 9000 })));
await setDoc(doc(as("carol"), "names/carol parker"), { uid: "carol", ts: now });
await updateDoc(doc(as("carol"), "members/carol"), { nick: "carol parker", nickAt: Date.now() + 5000 });
await t("after changing their name they can post again", assertSucceeds(setDoc(doc(as("carol"), "rooms/general/msgs/c2"), { uid: "carol", text: "hi", ts: Date.now() })));

console.log("Bans");
await updateDoc(doc(as("owner"), "config/main"), { banned: ["bob"], bannedDevices: ["devX"] });
await t("banned person can't send a DM", assertFails(setDoc(doc(as("bob"), "dms/alice_bob/msgs/b1"), { uid: "bob", text: "hi", ts: Date.now() })));
await t("banned person can't update a DM thread", assertFails(setDoc(doc(as("bob"), "dms/alice_bob"), { users: ["alice", "bob"], lastTs: Date.now() })));
await t("banned person can't post in rooms", assertFails(setDoc(doc(as("bob"), "rooms/general/msgs/b2"), { uid: "bob", text: "hi", ts: Date.now() })));
await setDoc(doc(as("frank"), "names/frank"), { uid: "frank", ts: now });
await t("a banned browser can't join with a new account", assertFails(setDoc(doc(as("frank"), "members/frank"), { nick: "frank", color: "#fff", joinedAt: now, lastSeen: now, code: "TEST", dev: "devX" })));

console.log("Ban appeals");
const ap = { startedAt: Date.now(), nick: "bob", dev: "devX", status: "pending" };
await t("someone not banned can't open an appeal", assertFails(setDoc(doc(as("alice"), "appeals/alice"), { startedAt: Date.now(), nick: "alice", status: "pending" })));
await t("can't open an appeal for someone else", assertFails(setDoc(doc(as("bob"), "appeals/alice"), ap)));
await t("can't fake an older start time", assertFails(setDoc(doc(as("bob"), "appeals/bob"), { ...ap, startedAt: Date.now() - 3600000 })));
await t("can't self-approve when opening", assertFails(setDoc(doc(as("bob"), "appeals/bob"), { ...ap, status: "approved" })));
await t("banned person opens their appeal", assertSucceeds(setDoc(doc(as("bob"), "appeals/bob"), ap)));
await t("other members can't read the appeal", assertFails(getDoc(doc(as("alice"), "appeals/bob"))));
await t("can't approve your own appeal", assertFails(updateDoc(doc(as("bob"), "appeals/bob"), { status: "approved" })));
await t("banned person submits answers", assertSucceeds(updateDoc(doc(as("bob"), "appeals/bob"), { answers: { names: "a, b", main: "bob", promise: "yes" }, submittedAt: Date.now() })));
await t("can only submit once", assertFails(updateDoc(doc(as("bob"), "appeals/bob"), { answers: { names: "x", main: "x", promise: "x" }, submittedAt: Date.now() })));
await t("owner reads the appeal", assertSucceeds(getDoc(doc(as("owner"), "appeals/bob"))));
await t("owner approves the appeal", assertSucceeds(updateDoc(doc(as("owner"), "appeals/bob"), { status: "approved", code: "NEW123" })));
await updateDoc(doc(as("owner"), "config/main"), { banned: ["bob", "gus"] });
await setDoc(doc(as("gus"), "appeals/gus"), { startedAt: Date.now(), nick: "gus", status: "pending" });
await updateDoc(doc(as("owner"), "appeals/gus"), { startedAt: Date.now() - 40 * 60000 });
await t("can't submit after 30 minutes", assertFails(updateDoc(doc(as("gus"), "appeals/gus"), { answers: { names: "x", main: "x", promise: "x" }, submittedAt: Date.now() })));

console.log("Kick reasons");
const why = { reason: "Spamming", by: "Dev", at: Date.now() };
await t("developer kicks someone with a reason (and their device)", assertSucceeds(updateDoc(doc(as("dev"), "config/main"), { banned: ["bob", "gus", "zed"], "bannedNames.zed": "Zed", bannedDevices: ["devX", "devZ"], "bannedDevNames.devZ": "Zed", "banReasons.zed": why, "banReasons.devZ": why })));
await t("developer still can't ban the owner", assertFails(updateDoc(doc(as("dev"), "config/main"), { banned: ["bob", "gus", "zed", "owner"], "banReasons.owner": why })));
await t("regular member can't write ban reasons", assertFails(updateDoc(doc(as("alice"), "config/main"), { "banReasons.zed": { reason: "lol", by: "alice", at: Date.now() } })));
await t("developer can't change other settings while kicking", assertFails(updateDoc(doc(as("dev"), "config/main"), { "banReasons.zed": why, serverName: "Hacked" })));

console.log("Temporary developers");
await t("owner makes someone a developer for 1 hour", assertSucceeds(updateDoc(doc(as("owner"), "config/main"), { admins: ["dev", "carol"], "devUntil.carol": Date.now() + 3600000 })));
await t("temporary developer can use developer powers", assertSucceeds(updateDoc(doc(as("carol"), "config/main"), { timeouts: { timed: Date.now() + 3600000, alice: Date.now() + 60000 } })));
await t("temporary developer can't extend their own time", assertFails(updateDoc(doc(as("carol"), "config/main"), { "devUntil.carol": Date.now() + 999999999 })));
await updateDoc(doc(as("owner"), "config/main"), { "devUntil.carol": Date.now() - 1000 });
await t("when the time runs out, developer powers stop", assertFails(updateDoc(doc(as("carol"), "config/main"), { timeouts: { timed: Date.now() + 3600000 } })));
await updateDoc(doc(as("owner"), "config/main"), { admins: ["dev"], timeouts: { timed: Date.now() + 3600000 } });

console.log("Site changes");
const sha = "a".repeat(40);
await t("owner approves a site change", assertSucceeds(setDoc(doc(as("owner"), "devApprovals/5"), { sha, status: "queued", title: "Purple button", by: "owner", at: Date.now() })));
await t("developer can see the approval", assertSucceeds(getDoc(doc(as("dev"), "devApprovals/5"))));
await t("regular member can't see approvals", assertFails(getDoc(doc(as("alice"), "devApprovals/5"))));
await t("developer can't approve their own change", assertFails(setDoc(doc(as("dev"), "devApprovals/6"), { sha, status: "queued", title: "x", by: "dev", at: Date.now() })));
await t("owner can't fake a 'merged' result", assertFails(setDoc(doc(as("owner"), "devApprovals/7"), { sha, status: "merged", title: "x", by: "owner", at: Date.now() })));
await t("approval needs a real commit id", assertFails(setDoc(doc(as("owner"), "devApprovals/8"), { sha: "main", status: "queued", title: "x", by: "owner", at: Date.now() })));

console.log("Vouch tries");
await t("5th vouch is blocked (4 tries each)", assertFails(vouch("alice", "general", "v7", { uid: "alice", text: "one more please", ts: Date.now(), vouch: { to: "server", stars: 5, n: 7 } })));
await t("can't post a vouch without using a try", assertFails(setDoc(doc(as("carol"), "rooms/general/msgs/c9"), { uid: "carol", text: "sneaky vouch", ts: Date.now(), vouch: { to: "server", stars: 5, n: 9 } })));
await t("can't reset your own tries", assertFails(setDoc(doc(as("alice"), "vouchQuota/alice"), { used: 0, lastMsg: "general/v1" })));
await t("can't give yourself extra tries", assertFails(updateDoc(doc(as("alice"), "vouchQuota/alice"), { extra: 10 })));
await t("can't use someone else's vouch to fake a try", assertFails(setDoc(doc(as("carol"), "vouchQuota/carol"), { used: 1, lastMsg: "general/v1" })));
await t("owner gives 2 more tries", assertSucceeds(setDoc(doc(as("owner"), "vouchQuota/alice"), { extra: 2 }, { merge: true })));
await t("with extra tries the 5th vouch works", assertSucceeds(vouch("alice", "general", "v8", { uid: "alice", text: "Thanks for the extra tries, the new pop-up is really helpful", ts: Date.now(), vouch: { to: "server", stars: 5, n: 8 } })));
await t("a lazy one-line vouch is blocked", assertFails(vouch("carol", "general", "lz1", { uid: "carol", text: "Everyone is awesome", ts: Date.now(), vouch: { to: "server", stars: 5, n: 9 } })));

console.log("Strikes & warnings");
await t("owner gives a warning", assertSucceeds(setDoc(doc(as("owner"), "mod/alice/notices/w1"), { kind: "warning", reason: "be nice", at: Date.now(), by: "owner", ackAt: null })));
await t("owner gives a strike", assertSucceeds(setDoc(doc(as("owner"), "mod/alice"), { strikes: 1 })));
await t("person can read their own warning", assertSucceeds(getDoc(doc(as("alice"), "mod/alice/notices/w1"))));
await t("others can't read someone's warnings", assertFails(getDoc(doc(as("carol"), "mod/alice/notices/w1"))));
await t("others can't read someone's strikes", assertFails(getDoc(doc(as("carol"), "mod/alice"))));
await t("can't remove your own strikes", assertFails(setDoc(doc(as("alice"), "mod/alice"), { strikes: 0 })));
await t("developer can't give strikes", assertFails(setDoc(doc(as("dev"), "mod/carol"), { strikes: 1 })));
await t("can't change the warning's reason", assertFails(updateDoc(doc(as("alice"), "mod/alice/notices/w1"), { reason: "nothing" })));
await t("can't delete your own warning", assertFails(deleteDoc(doc(as("alice"), "mod/alice/notices/w1"))));
await t("person accepts the warning", assertSucceeds(updateDoc(doc(as("alice"), "mod/alice/notices/w1"), { ackAt: Date.now() })));
await t("can only accept once", assertFails(updateDoc(doc(as("alice"), "mod/alice/notices/w1"), { ackAt: Date.now() + 5 })));

await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
