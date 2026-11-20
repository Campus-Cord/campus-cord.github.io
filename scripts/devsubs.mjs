// Tests and publishes changes that helpers send from CampusCord's Dev panel (devSubs/{id}).
//   status "new"       → apply the FIND/REPLACE blocks to a copy, build the site, syntax-check it → "ready" or "failed"
//   status "approved"  → (owner pressed Approve) apply to the real code, rebuild, commit, push → "live" or "error"
//   status "rejecting" → "rejected"
// The block format and how blocks are applied MUST match src/submit.js.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, writeFileSync, mkdtempSync, cpSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = getFirestore();
const ROOT = process.cwd();
const FILES_RE = /^(src\/[\w-]+\.(js|css|html)|firestore\.rules|tests\/rules\.test\.mjs)$/;
// Changes to the database rules never go live from here: they become a GitHub pull request that
// Massimo merges himself; deploy-rules.yml then tests the rules before they go live.
const NEEDS_PR = f => f === "firestore.rules" || f.startsWith("tests/");
const NO_FILES = new Set(["src/build.py", "src/firebase-config.js"]);
const FLAGS = ["STRIPE_LINKS", "buy.stripe.com", "const CATALOG", "ownerUid", "giveSparks", "earned:", "firestore.rules"];

function parseEdits(text){
  const lines = String(text || "").replace(/\r/g, "").split("\n"), blocks = [];
  let file = null, mode = null, find = [], rep = [];
  const clean = arr => { while (arr.length && /^\s*```/.test(arr[0])) arr.shift(); while (arr.length && /^\s*```\s*$/.test(arr[arr.length - 1])) arr.pop(); return arr.join("\n"); };
  for (const l of lines){
    const fm = mode === null && l.match(/^[\s#*>`_-]*FILE:\s*[`*"']*\s*((?:src\/)?[\w.\/-]+?)[`*"']*\s*$/i);
    if (fm){ file = fm[1].startsWith("src/") ? fm[1] : "src/" + fm[1]; continue; }
    // Markers: @@FIND / @@REPLACE / @@END (safe from chat formatting), or the older <<<<<<< FIND / ======= / >>>>>>> REPLACE
    if (/^\s*(<{5,}\s*FIND|@@\s*FIND)\s*:?\s*$/i.test(l)){ mode = "find"; find = []; rep = []; continue; }
    if (mode === "find" && (/^\s*={5,}\s*$/.test(l) || /^\s*@@\s*REPLACE(\s+WITH)?\s*:?\s*$/i.test(l))){ mode = "rep"; continue; }
    if (mode === "rep" && (/^\s*>{5,}\s*REPLACE\s*$/i.test(l) || /^\s*@@\s*END\s*$/i.test(l))){ blocks.push({file, find:clean(find), rep:clean(rep)}); mode = null; continue; }
    if (mode === "find") find.push(l); else if (mode === "rep") rep.push(l);
  }
  return {blocks, unfinished: mode !== null};
}
function applyEdit(content, b){
  if (!b.find.trim()) return {text: content.replace(/\s*$/, "\n") + b.rep + "\n"};
  const n = content.split(b.find).length - 1;
  if (n === 1) return {text: content.replace(b.find, () => b.rep)};
  if (n > 1) return {err:"matches " + n + " places"};
  const cl = content.split("\n"), fl = b.find.split("\n").map(x => x.trim());
  while (fl.length && !fl[0]) fl.shift(); while (fl.length && !fl[fl.length - 1]) fl.pop();
  const hits = [];
  for (let i = 0; i + fl.length <= cl.length && hits.length < 2; i++){ let ok = true; for (let k = 0; k < fl.length; k++) if (cl[i + k].trim() !== fl[k]){ ok = false; break; } if (ok) hits.push(i); }
  if (hits.length === 1){ cl.splice(hits[0], fl.length, ...b.rep.split("\n")); return {text: cl.join("\n")}; }
  return {err: hits.length ? "matches more than one place" : "isn't in the code"};
}
// Apply all blocks to files under `base`. Returns {files:{path:newText}, flags} or throws a friendly error.
function applyAll(base, answer){
  const {blocks, unfinished} = parseEdits(answer);
  if (!blocks.length) throw new Error("No changes found. The AI has to use the FIND / REPLACE format.");
  if (unfinished) throw new Error("The AI's answer got cut off in the middle of a change.");
  const files = {}, flags = new Set();
  blocks.forEach((b, i) => { const no = "Change " + (i + 1);
    if (!b.file) throw new Error(no + " doesn't say which FILE it's for.");
    if (!FILES_RE.test(b.file) || NO_FILES.has(b.file)) throw new Error(no + " changes " + b.file + ", which isn't allowed.");
    const p = join(base, b.file); if (files[b.file] == null && !existsSync(p)) throw new Error(no + " is for " + b.file + ", which doesn't exist.");
    const cur = files[b.file] != null ? files[b.file] : readFileSync(p, "utf8");
    const r = applyEdit(cur, b);
    if (r.err) throw new Error(no + " (" + b.file + "): the FIND text " + r.err + ". The code may have changed since; ask the AI again with the newest code.");
    files[b.file] = r.text; FLAGS.forEach(f => { if (b.find.includes(f) || b.rep.includes(f)) flags.add(f); });
  });
  return {files, flags:[...flags]};
}
// Build into `out` from the src folder under `base`, then syntax-check the page's script.
function buildAndCheck(base, out){
  execFileSync("python3", [join(base, "src/build.py"), "check", out], {stdio:"pipe"});
  const html = readFileSync(out, "utf8"); const m = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  if (!m) throw new Error("The built page has no app script.");
  const js = out + ".mjs"; writeFileSync(js, m[1]);
  try{ execFileSync("node", ["--check", js], {stdio:"pipe"}); }
  catch(e){ const msg = String(e.stderr || e.message).split("\n").filter(l => /Error/.test(l))[0] || "a JavaScript error";
    throw new Error("The code has a mistake (" + msg.trim().slice(0, 160) + "). Ask the AI to check its changes for missing brackets or typos."); }
}
function diffOf(base, files){
  let d = "";
  for (const [f, text] of Object.entries(files)){ const tmp = join(mkdtempSync(join(tmpdir(), "d-")), "new"); writeFileSync(tmp, text);
    try{ execFileSync("diff", ["-u", "--label", "a/" + f, "--label", "b/" + f, join(base, f), tmp]); }catch(e){ d += String(e.stdout || ""); } }
  return d.slice(0, 250000);
}
async function openPR(id, x, r){
  const branch = "helper-" + id.slice(0, 12);
  git("checkout", "-q", "-B", branch);
  for (const [f, t] of Object.entries(r.files)) writeFileSync(join(ROOT, f), t);
  try{ buildAndCheck(ROOT, join(tmpdir(), "pr-check.html")); }
  catch(e){ git("checkout", "-q", "--", "."); git("checkout", "-q", "main"); throw e; }
  git("add", ...Object.keys(r.files));
  git("-c", "user.name=github-actions[bot]", "-c", "user.email=41898282+github-actions[bot]@users.noreply.github.com",
    "commit", "-q", "-m", x.title + " (by " + (x.nick || "a helper") + ", approved in CampusCord)");
  git("push", "-q", "-f", "origin", branch); git("checkout", "-q", "main");
  const res = await fetch("https://api.github.com/repos/" + process.env.GITHUB_REPOSITORY + "/pulls", {method:"POST",
    headers:{Authorization:"Bearer " + process.env.GITHUB_TOKEN, Accept:"application/vnd.github+json"},
    body:JSON.stringify({title:x.title + " (by " + (x.nick || "a helper") + ")", head:branch, base:"main",
      body:"Sent from CampusCord's Dev panel and approved by Massimo. It changes the database rules, so it waits for Massimo to press **Merge** here. After the merge, deploy-rules.yml tests the rules and only puts them live if every test passes."})});
  const pr = await res.json();
  if (!pr.html_url) throw new Error("Couldn't open the GitHub pull request: " + String(pr.message || res.status));
  await d_set(id, {status:"pr", prUrl:pr.html_url, files:Object.keys(r.files)});
  console.log(id, "pull request", pr.html_url);
}
const d_set = (id, patch) => db.collection("devSubs").doc(id).set(Object.assign({checkedAt:Date.now()}, patch), {merge:true});
const git = (...a) => execFileSync("git", a, {cwd:ROOT, stdio:"pipe"}).toString().trim();

const snap = await db.collection("devSubs").where("status", "in", ["new", "approved", "rejecting"]).get();
if (snap.empty){ console.log("Nothing to do."); process.exit(0); }
for (const d of snap.docs){
  const x = d.data(), set = patch => d.ref.set(Object.assign({checkedAt:Date.now()}, patch), {merge:true});
  try{
    if (x.status === "rejecting"){ await set({status:"rejected"}); console.log(d.id, "rejected"); continue; }
    if (x.status === "new"){
      // test on a throwaway copy
      const tmp = mkdtempSync(join(tmpdir(), "sub-")); cpSync(join(ROOT, "src"), join(tmp, "src"), {recursive:true}); cpSync(join(ROOT, "tests"), join(tmp, "tests"), {recursive:true}); cpSync(join(ROOT, "firestore.rules"), join(tmp, "firestore.rules"));
      const r = applyAll(tmp, x.answer);
      for (const [f, t] of Object.entries(r.files)) writeFileSync(join(tmp, f), t);
      buildAndCheck(tmp, join(tmp, "out.html"));
      await set({status:"ready", files:Object.keys(r.files), flags:r.flags, diff:diffOf(ROOT, r.files), error:null});
      console.log(d.id, "ready");
      continue;
    }
    if (x.status === "approved"){
      git("pull", "-q", "--rebase", "origin", "main");
      const r = applyAll(ROOT, x.answer);
      if (Object.keys(r.files).some(NEEDS_PR)){ await openPR(d.id, x, r); continue; }
      for (const [f, t] of Object.entries(r.files)) writeFileSync(join(ROOT, f), t);
      try{ buildAndCheck(ROOT, join(tmpdir(), "live-check.html")); }
      catch(e){ git("checkout", "--", "src"); throw e; }
      execFileSync("python3", ["src/build.py"], {cwd:ROOT, stdio:"pipe"});
      git("add", "src", "index.html", "version.json");
      git("-c", "user.name=github-actions[bot]", "-c", "user.email=41898282+github-actions[bot]@users.noreply.github.com",
        "commit", "-q", "-m", x.title + " (by " + (x.nick || "a helper") + ", approved in CampusCord)");
      git("push", "-q", "origin", "HEAD:main");
      await set({status:"live", sha:git("rev-parse", "HEAD"), liveAt:Date.now()});
      console.log(d.id, "live");
    }
  }catch(e){
    const msg = String(e.message || e).slice(0, 400);
    await set({status: x.status === "approved" ? "error" : "failed", error:msg});
    console.log(d.id, "problem:", msg);
  }
}
