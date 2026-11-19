// Puts site changes live when the owner approves them in CampusCord (Admin → Site changes).
// Runs every few minutes on GitHub Actions. The app only records "approve pull request #N at
// commit SHA" in Firestore (only the owner can write that); this script checks it and merges.
// Safety checks before merging:
//   - the pull request is still open and its code is EXACTLY the version the owner approved
//   - the automatic tests passed for that version
//   - it doesn't touch owner-only files (workflows, scripts, tests, database rules)
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { appendFileSync } from "node:fs";

initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = getFirestore();
const REPO = process.env.GITHUB_REPOSITORY;
const OWNER_ONLY = /^(\.github\/|scripts\/|tests\/|firestore\.rules$|firebase\.json$)/;

async function gh(path, opts = {}){
  const r = await fetch("https://api.github.com/repos/" + REPO + path, {
    ...opts,
    headers: { Accept: "application/vnd.github+json", Authorization: "Bearer " + process.env.GITHUB_TOKEN, "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const body = r.status === 204 ? {} : await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.message || "GitHub said " + r.status);
  return body;
}

const snap = await db.collection("devApprovals").where("status", "in", ["queued", "rejecting"]).get();
if (snap.empty){ console.log("Nothing to do."); process.exit(0); }

let merged = 0;
for (const d of snap.docs){
  const a = d.data(), n = d.id;
  const done = (status, extra = {}) => d.ref.set({ status, doneAt: Date.now(), ...extra }, { merge: true });
  const fail = msg => { console.log(`#${n}: ${msg}`); return done("error", { error: msg }); };
  try{
    const pr = await gh("/pulls/" + n);
    if (pr.state !== "open"){ await fail("it was already closed on GitHub"); continue; }

    if (a.status === "rejecting"){
      await gh("/issues/" + n + "/comments", { method: "POST", body: JSON.stringify({ body: "Massimo turned this change down in CampusCord. Feel free to send a new version!" }) });
      await gh("/pulls/" + n, { method: "PATCH", body: JSON.stringify({ state: "closed" }) });
      await done("rejected"); console.log(`#${n}: closed`); continue;
    }

    if (pr.head.sha !== a.sha){ await fail("it was changed after you approved it, so approve the new version"); continue; }
    const files = await gh("/pulls/" + n + "/files?per_page=100");
    const bad = files.map(f => f.filename).filter(f => OWNER_ONLY.test(f));
    if (bad.length){ await fail("it touches owner-only files (" + bad.join(", ") + "); approve it on GitHub instead"); continue; }
    const runs = (await gh("/commits/" + a.sha + "/check-runs")).check_runs || [];
    if (!runs.length || runs.some(c => c.status !== "completed" || !["success", "skipped", "neutral"].includes(c.conclusion))){
      await fail("the automatic tests haven't passed for this version"); continue;
    }

    await gh("/pulls/" + n + "/merge", { method: "PUT", body: JSON.stringify({
      sha: a.sha, merge_method: "squash", commit_title: pr.title + " (#" + n + ")",
      commit_message: "Approved by Massimo in CampusCord.",
    }) });
    await done("merged"); merged++; console.log(`#${n}: merged`);
  }catch(e){ await fail(String(e.message || e)); }
}
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, "merged=" + merged + "\n");
