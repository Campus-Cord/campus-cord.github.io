// Nightly full backup of the CampusCord database (every collection, including subcollections like messages).
// The JSON is gzipped and then encrypted by the workflow with BACKUP_PASSWORD, so the file is useless without it.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = getFirestore();
let docs = 0;
const plain = v => v && typeof v.toDate === "function" ? v.toDate().toISOString() : v;
async function dumpCollection(col){
  const out = {};
  for (const d of (await col.get()).docs){
    docs++;
    const data = Object.fromEntries(Object.entries(d.data()).map(([k, v]) => [k, plain(v)]));
    const subs = await d.ref.listCollections();
    const entry = { data };
    if (subs.length){ entry.sub = {}; for (const s of subs) entry.sub[s.id] = await dumpCollection(s); }
    out[d.id] = entry;
  }
  // documents that only exist as parents of subcollections
  for (const ref of await col.listDocuments()){
    if (out[ref.id]) continue;
    const subs = await ref.listCollections(); if (!subs.length) continue;
    out[ref.id] = { data: null, sub: {} }; for (const s of subs) out[ref.id].sub[s.id] = await dumpCollection(s);
  }
  return out;
}
const backup = { app: "CampusCord", exportedAt: new Date().toISOString(), collections: {} };
for (const c of await db.listCollections()) backup.collections[c.id] = await dumpCollection(c);
writeFileSync("backup.json.gz", gzipSync(Buffer.from(JSON.stringify(backup))));
console.log("Backed up", docs, "documents from", Object.keys(backup.collections).length, "collections.");
