// Firestore security-rules tests. Run by GitHub Actions in the Firestore emulator
// before firestore.rules is published; if any check fails, nothing is deployed.
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";

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
});
const as = u => env.authenticatedContext(u).firestore();
let pass = 0, fail = 0;
async function t(name, p){ try{ await p; pass++; console.log("  ✓", name); }catch(e){ fail++; console.log("  ✗", name, "—", e.message.split("\n")[0]); } }

console.log("Membership");
await t("new person joins with the right code", assertSucceeds(setDoc(doc(as("carol"), "members/carol"), { nick: "carol", color: "#fff", joinedAt: now, lastSeen: now, code: "TEST" })));
await t("wrong invite code is refused", assertFails(setDoc(doc(as("dave"), "members/dave"), { nick: "dave", color: "#fff", joinedAt: now, lastSeen: now, code: "NOPE" })));

console.log("Rooms");
await t("member posts in a public room", assertSucceeds(setDoc(doc(as("alice"), "rooms/general/msgs/m1"), { uid: "alice", text: "hi", ts: now })));
await t("timed-out member can't post", assertFails(setDoc(doc(as("timed"), "rooms/general/msgs/m2"), { uid: "timed", text: "hi", ts: now })));
await t("invited member reads private room", assertSucceeds(getDoc(doc(as("alice"), "rooms/secret/msgs/x"))));
await t("uninvited member can't read private room", assertFails(getDoc(doc(as("bob"), "rooms/secret/msgs/x"))));

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
await t("equip cosmetics on your profile", assertSucceeds(setDoc(doc(as("alice"), "profiles/alice"), { deco: "d_cosmic", pfx: "", plate: "" }, { merge: true })));
await t("can't edit someone else's profile", assertFails(setDoc(doc(as("bob"), "profiles/alice"), { bio: "hacked" }, { merge: true })));

console.log("Shop");
await t("members can't grant themselves perks", assertFails(setDoc(doc(as("alice"), "perks/alice"), { items: { plus: { since: now } } })));
await t("members can't change the catalog", assertFails(setDoc(doc(as("alice"), "config/catalog"), { v: 1, prices: { d_cosmic: 0 } })));

await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
