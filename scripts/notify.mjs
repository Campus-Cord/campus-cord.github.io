// Push notifications for CampusCord. Runs every few minutes on GitHub Actions.
// First run: makes the push key pair (private half stays in a server-only Firestore doc, public half goes to config/push).
// Every run: finds what's new since the last run (DMs, @mentions, vouches/feedback for admins, approved rewards)
// and sends a notification to each person's phones and computers that turned notifications on.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import webpush from "web-push";

initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = getFirestore();
const SITE = "https://campus-cord.github.io/";

// keys
const keyRef = db.doc("secret/vapid");
let keys = (await keyRef.get()).data();
if (!keys){ keys = webpush.generateVAPIDKeys(); await keyRef.set(keys); console.log("Made a new push key pair."); }
await db.doc("config/push").set({ publicKey: keys.publicKey }, { merge: true });
webpush.setVapidDetails("mailto:massimotestaiuti112@gmail.com", keys.publicKey, keys.privateKey);

// what changed since last time (first run only looks back 10 minutes so nobody gets a flood)
const stateRef = db.doc("secret/pushState");
const state = (await stateRef.get()).data() || {};
const now = Date.now();
const since = state.lastRun || now - 10 * 60000;

const cfg = (await db.doc("config/main").get()).data() || {};
const admins = new Set([cfg.ownerUid, ...(cfg.admins || [])].filter(Boolean));
const members = Object.fromEntries((await db.collection("members").get()).docs.map(d => [d.id, d.data()]));
const nick = u => (members[u] && members[u].nick) || "Someone";
const out = {}; // uid -> [{title, body, url, tag, kind}]
const add = (uid, kind, n) => { if (!members[uid]) return; (out[uid] = out[uid] || []).push(Object.assign({ kind }, n)); };

// DMs
for (const d of (await db.collection("dms").where("lastTs", ">", since).get()).docs){
  const x = d.data(); for (const u of x.users || []) if (u !== x.lastUid) add(u, "dms", { title: x.lastNick || nick(x.lastUid), body: x.lastPreview || "sent you a message", url: SITE + "?open=dm:" + d.id, tag: "dm-" + d.id });
}
// @mentions / @everyone in rooms (private rooms only notify people in them)
const rooms = Object.fromEntries((await db.collection("rooms").get()).docs.map(d => [d.id, d.data()]));
for (const d of (await db.collection("meta").where("lastTs", ">", since).get()).docs){
  const x = d.data(), r = rooms[d.id]; if (!r) continue;
  const can = u => !r.private || u === cfg.ownerUid || (r.allowed || []).includes(u);
  const who = x.lastEveryone ? Object.keys(members) : (x.lastMentions || []);
  for (const u of who) if (u !== x.lastUid && can(u)) add(u, "mentions", { title: (x.lastNick || nick(x.lastUid)) + " in #" + (r.name || "room"), body: r.private ? "mentioned you" : (x.lastPreview || "mentioned you"), url: SITE + "?open=room:" + d.id, tag: "room-" + d.id });
}
// new vouches (for admins to review) and approved vouches (for authors)
for (const [rid, r] of Object.entries(rooms)){
  if (r.type !== "vouches") continue;
  for (const d of (await db.collection("rooms").doc(rid).collection("msgs").where("ts", ">", now - 14 * 864e5).get()).docs){
    const m = d.data(); if (!m.vouch) continue;
    if (m.ts > since && !m.approved && !m.rejected) for (const a of admins) if (a !== m.uid) add(a, "vouches", { title: "New vouch to review", body: nick(m.uid) + " left a " + m.vouch.stars + "★ vouch: " + (m.text || "").slice(0, 80), url: SITE + "?open=room:" + rid, tag: "vouch-review" });
    if (m.approved && !(state.approved || []).includes(d.id)) { if (state.lastRun) add(m.uid, "rewards", { title: "Your vouch was approved ✅", body: "Open CampusCord to collect your Sparks.", url: SITE + "?open=room:" + rid, tag: "vouch-ok" }); (state.approved = state.approved || []).push(d.id); }
  }
}
// feedback: new posts (admins) and accepted posts (authors)
for (const d of (await db.collection("feedback").get()).docs){
  const f = d.data();
  if (f.ts > since) for (const a of admins) if (a !== f.uid) add(a, "feedback", { title: "New " + (f.type || "feedback") + " from " + nick(f.uid), body: f.title || "", url: SITE + "?open=feedback:all", tag: "feedback" });
  if (f.statusAt > since && ["planned", "working", "done"].includes(f.status)) add(f.uid, "rewards", { title: "Your feedback was " + (f.status === "done" ? "completed" : "accepted") + " 🎉", body: (f.title || "") + " — open CampusCord to collect +200 Sparks.", url: SITE + "?open=feedback:all", tag: "fb-" + d.id });
}
state.approved = (state.approved || []).slice(-300);

// send
let sent = 0, gone = 0;
for (const [uid, list] of Object.entries(out)){
  const prefs = (await db.doc("push/" + uid).get()).data() || {};
  const wanted = list.filter(n => prefs[n.kind] !== false);
  if (!wanted.length) continue;
  const subs = (await db.collection("push").doc(uid).collection("subs").get()).docs;
  if (!subs.length) continue;
  // collapse: one notification per tag, newest wins
  const byTag = {}; wanted.forEach(n => byTag[n.tag || Math.random()] = n);
  for (const n of Object.values(byTag)){
    for (const s of subs){ const sub = s.data();
      try{ await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(n), { TTL: 3600 }); sent++; }
      catch(e){ if (e.statusCode === 404 || e.statusCode === 410){ await s.ref.delete(); gone++; } else console.log("push failed", e.statusCode || e.message); }
    }
  }
}
state.lastRun = now;
await stateRef.set(state);
console.log("Sent", sent, "notifications;", gone, "old devices removed.");
