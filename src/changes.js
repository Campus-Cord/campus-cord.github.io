// ---------------------------------------------------------------- site changes (pull requests)
// Admin → "Site changes": shows open pull requests from GitHub in plain English, with
// a green/red light from the automatic checks. The owner taps Approve, which writes
// devApprovals/{pr} = {sha}; the merge.yml GitHub Action (every 5 min) merges exactly
// that version and rebuilds the site. No GitHub login is ever stored in the app.
const GH_REPO = "Campus-Cord/campus-cord.github.io";
const GH_API = "https://api.github.com/repos/" + GH_REPO;
const OWNER_ONLY_FILES = /^(\.github\/|scripts\/|tests\/|firestore\.rules$|firebase\.json$)/;
let ghCache = null, ghLoading = null;

function watchApprovals(){
  if (S.approvalsUnsub || !(isOwner() || isDev(S.uid))) return;
  S.approvals = {};
  S.approvalsUnsub = onSnapshot(collection(db, "devApprovals"), s => {
    S.approvals = Object.fromEntries(s.docs.map(d => [d.id, d.data()])); refreshOpenPane();
  }, () => {});
}

async function ghJson(path){
  const r = await fetch(GH_API + path, {headers:{Accept:"application/vnd.github+json"}});
  if (r.status === 403 || r.status === 429) throw new Error("GitHub is limiting requests right now. Try again in a few minutes.");
  if (!r.ok) throw new Error("GitHub said " + r.status);
  return r.json();
}

async function loadChanges(force){
  if (!force && ghCache && Date.now() - ghCache.at < 60000) return ghCache;
  if (ghLoading) return ghLoading;
  ghLoading = (async () => {
    const pulls = await ghJson("/pulls?state=open&per_page=20");
    const items = await Promise.all(pulls.map(async p => {
      const [files, checks] = await Promise.all([
        ghJson("/pulls/" + p.number + "/files?per_page=100").catch(() => []),
        ghJson("/commits/" + p.head.sha + "/check-runs").catch(() => ({check_runs:[]})),
      ]);
      const runs = checks.check_runs || [];
      const light = !runs.length ? "waiting"
        : runs.some(c => c.status !== "completed") ? "running"
        : runs.every(c => c.conclusion === "success" || c.conclusion === "skipped" || c.conclusion === "neutral") ? "green" : "red";
      return {n:p.number, title:p.title, body:p.body || "", who:p.user && p.user.login, at:Date.parse(p.updated_at), sha:p.head.sha, url:p.html_url,
        files:files.map(f => ({name:f.filename, add:f.additions, del:f.deletions})), light};
    }));
    ghCache = {at:Date.now(), items}; S.openChanges = items.length;
    return ghCache;
  })();
  try{ return await ghLoading; } finally { ghLoading = null; }
}

function changeLight(c, ownerOnly){
  if (ownerOnly && c.light === "green") return h("span",{class:"chlight running"}, h("span",{class:"dot"}), "Tests passed, but needs a careful look");
  const t = {green:"Tests passed: safe to go live", red:"Tests failed: this would break something", running:"Testing now…", waiting:"Waiting for tests"}[c.light];
  return h("span",{class:"chlight " + c.light}, h("span",{class:"dot"}), t);
}

function approvalNote(c, a){
  if (!a) return null;
  if (a.status === "queued") return a.sha === c.sha ? "✅ Approved. Going live within about 5 minutes." : "Elliott changed it after you approved, so approve it again.";
  if (a.status === "rejecting") return "Closing this change within about 5 minutes…";
  if (a.status === "error") return "⚠️ Couldn't put it live: " + (a.error || "unknown problem") + ". Try again or open it on GitHub.";
  return null;
}

function decideChange(c, ok, btn){
  if (!isOwner()) return;
  if (!ok) return confirmBox("Turn down this change?", "\"" + c.title + "\" will be closed on GitHub. Elliott can still send a new version.", "Turn down", () => saveDecision(c, false, btn));
  saveDecision(c, true, btn);
}
async function saveDecision(c, ok, btn){
  if (btn) btn.disabled = true;
  try{
    await setDoc(doc(db, "devApprovals", String(c.n)), {sha:c.sha, status: ok ? "queued" : "rejecting", title:c.title.slice(0, 200), by:S.uid, at:Date.now()});
    toast(ok ? "Approved! It'll be live in about 5 minutes." : "Turned down.");
  }catch(e){ toast("Couldn't save: " + (e.message || e)); if (btn) btn.disabled = false; }
}

function changeCard(c){
  const a = S.approvals[String(c.n)];
  const owner = c.files.filter(f => OWNER_ONLY_FILES.test(f.name));
  const note = approvalNote(c, a);
  const desc = c.body.replace(/🤖 Generated with[\s\S]*$/, "").replace(/[#*`>_]/g, "").trim();
  const card = h("div",{class:"chcard " + c.light},
    h("div",{class:"chh"}, h("b",{text:c.title}), changeLight(c, owner.length > 0)),
    h("div",{class:"note",style:{margin:"2px 0 0"},text:"#" + c.n + " · from " + (c.who || "someone") + " · " + fmtDay(c.at)}),
    desc ? h("p",{class:"chdesc",text: desc.length > 600 ? desc.slice(0, 600) + "…" : desc}) : null,
    h("details",{class:"chfiles"}, h("summary",{text:"Details: " + c.files.length + " file" + (c.files.length === 1 ? "" : "s") + " changed"}),
      h("ul",null, c.files.map(f => h("li",null, h("code",{text:f.name}), " ", h("span",{class:"add",text:"+" + f.add}), " ", h("span",{class:"del",text:"−" + f.del}),
        OWNER_ONLY_FILES.test(f.name) ? h("span",{class:"chwarn",text:" owner-only"}) : null)))),
    owner.length ? h("p",{class:"chalert",text:"⚠️ This touches owner-only files (security, payments or automation). Approve it on GitHub after checking it with Claude, not here."}) : null,
    note ? h("p",{class:"chnote",text:note}) : null);
  const btns = h("div",{class:"foot",style:{justifyContent:"flex-start",marginTop:"8px",flexWrap:"wrap"}});
  const done = a && (a.status === "queued" && a.sha === c.sha || a.status === "rejecting");
  if (isOwner() && !done){
    const ok = c.light === "green" && !owner.length;
    const ap = h("button",{class:"btn approve", disabled: ok ? null : "", title: ok ? "Put this change live" : owner.length ? "Owner-only files: approve on GitHub" : "Wait for the tests to pass"}, ic("check"), ok ? " Approve & put it live" : c.light === "red" ? " Can't approve: tests failed" : " Waiting for tests…");
    ap.onclick = () => decideChange(c, true, ap);
    const no = h("button",{class:"btn ghost"}, "Turn down"); no.onclick = () => decideChange(c, false, no);
    btns.append(ap, no);
    if (c.light === "waiting") btns.append(h("a",{class:"btn small ghost",href:c.url + "/checks",target:"_blank",rel:"noopener"}, "Start tests on GitHub"));
  }
  if (!isOwner() && !done) card.append(h("p",{class:"chnote",text: c.light === "red" ? "❌ The safety tests failed. Ask Gemini to help fix it, then commit again on your copy." : c.light === "green" ? "⏳ Waiting for Massimo to approve it." : "🔄 GitHub is testing it. This takes about 2 minutes."}));
  card.append(btns);
  btns.append(h("a",{class:"btn small ghost",href:c.url + "/files",target:"_blank",rel:"noopener"}, "See the code"));
  return card;
}

const AI_PROMPT = `I'm helping my friend with his website, CampusCord (a Discord-style chat app for our friends). I'm not a coder, so explain things simply, one step at a time, and wait for me to say "done" before the next step.

ABOUT THE PROJECT
- My friend's main code: https://github.com/Campus-Cord/campus-cord.github.io
- I have my own copy (a fork) on my GitHub account.
- If you can see the project's files, read AGENTS.md and CONTRIBUTING.md first. They explain how everything works.
- The real code is in the src folder. Never edit index.html (it gets rebuilt automatically).

YOU ARE NOT ALLOWED TO CHANGE THESE, EVEN IF I ASK:
- Sparks prices, Sparks rewards, or anything that gives out free Sparks or items
- Payments, Stripe, or the shop
- Owner or admin powers, badges, roles, or bans
- The .github folder, the scripts folder, the tests folder, or firestore.rules
If I ask for one of these, say no and tell me to ask Massimo.

NEED TO SEE CODE? Never guess file or function names. Ask me for a function by its exact name (like "function messageEl") or for a word to search for. CampusCord has a Code Finder that finds the current code and copies it for me, so I can paste it to you in one step.
The files in src: app.js (main app: messages, rooms, DMs, admin), style.css (all styling), body.html (page skeleton), cosmetics.js (shop), badges.js, voice.js (voice chat), camera.js (photo booth), vouches.js, dailypoll.js, feedback.js, push.js, appeals.js, mod.js, changes.js (dev panel). They all share one scope.

HOW TO MAKE CHANGES
- Tell me exactly what to do on the GitHub website: which file in the src folder to open, what to search for (Ctrl+F or Cmd+F), and exactly what to replace it with.
- Then remind me to click "Commit changes".
- If you need to see some code before you can help, tell me which file to open and what to copy and paste to you.
- Keep each change to one idea.

Got it? Ask me what I'd like to work on.`;

function ghUser(){ try{ return localStorage.getItem("ccGhUser") || ""; }catch(e){ return ""; } }
function changeGuide(){
  const step = (n, title, text, ...btns) => h("div",{class:"gstep"}, h("div",{class:"gnum",text:String(n)}),
    h("div",{class:"gbody"}, h("b",{text:title}), h("p",{text}), btns.length ? h("div",{class:"gbtns"}, ...btns) : null));
  const link = (label, href, primary) => h("a",{class:"btn small" + (primary ? "" : " ghost"), href, target:"_blank", rel:"noopener"}, label);
  const user = h("input",{class:"inp", placeholder:"Your GitHub username", value:ghUser(), style:{maxWidth:"220px"}});
  const send = h("div",{class:"gbtns"});
  const drawSend = () => { const u = user.value.trim().replace(/^@/, ""); try{ localStorage.setItem("ccGhUser", u); }catch(e){}
    send.innerHTML = "";
    if (u) send.append(link("Open my copy", "https://github.com/" + u + "/campus-cord.github.io"),
      link("Send my change to Massimo", "https://github.com/" + GH_REPO + "/compare/main..." + u + ":campus-cord.github.io:main?expand=1", true)); };
  const syncBtn = h("div",{class:"gbtns"});
  const drawSync = () => { const u = user.value.trim().replace(/^@/, ""); syncBtn.innerHTML = "";
    syncBtn.append(u ? link("Open my copy to sync it", "https://github.com/" + u + "/campus-cord.github.io", true) : h("span",{class:"note",style:{margin:0},text:"Type your GitHub username in step 5 and a button shows up here."})); };
  user.addEventListener("input", drawSync); drawSync();
  user.oninput = drawSend; drawSend();
  const copyBtn = h("button",{class:"btn small", onclick:() => copy(AI_PROMPT, "Copied! Paste it into Gemini as your first message.")}, ic("copy"), " Copy the AI message");
  return h("div",{class:"guide"},
    step(1, "Make a GitHub account", "GitHub is the website where CampusCord's code lives. It's free. Skip this if you already have one.",
      link("Sign up for GitHub", "https://github.com/signup")),
    step(2, "Make your own copy of CampusCord", "Click the button, then click the green \"Create fork\" button. Now you have your own copy to change. Nothing you do there touches the real site.",
      link("Make my copy", "https://github.com/" + GH_REPO + "/fork", true)),
    h("div",{class:"gstep"}, h("div",{class:"gnum",text:"3"}), h("div",{class:"gbody"}, h("b",{text:"Every time: update your copy first"}),
      h("p",{text:"Before each new change, open your copy and click \"Sync fork\" → \"Update branch\", so you're working on the newest code. If it says \"Discard commits\", that's only safe once Massimo has approved or turned down your last change."}),
      syncBtn)),
    step(4, "Ask AI to help you change it", "Copy the AI message, paste it into Gemini as your first message, then just chat. Tell it your idea (like \"make the send button purple\") and do what it says. When the AI asks to see some code, use the Code Finder at the top of this page.",
      copyBtn, link("Open Gemini", "https://gemini.google.com/")),
    h("div",{class:"gstep"}, h("div",{class:"gnum",text:"5"}), h("div",{class:"gbody"}, h("b",{text:"Send your change to Massimo"}),
      h("p",{text:"Type your GitHub username once, then press the purple button. On the page that opens, write what you changed in normal words and click the green \"Create pull request\" button."}),
      user, send)),
    step(6, "Wait for Massimo to approve it", "Your change shows up right below this guide. Green light = it passed the safety tests. When Massimo approves it, it's live on CampusCord about 5 minutes later."));
}

// Owner: count waiting changes once at startup so the Admin button shows a red number.
function checkChangesBadge(){ if (!(isOwner() || isDev(S.uid)) || S.changesChecked) return; S.changesChecked = true;
  loadChanges(false).then(() => need("rail")).catch(() => {}); setTimeout(() => { S.changesChecked = false; }, 10 * 60000); }
function adminChanges(p, noIntro){
  watchApprovals();
  const guide = h("details",{class:"gwrap"}, h("summary",null, ic("info"), isOwner() ? " How changes work (and how Elliott sends them)" : " How to make a change to CampusCord"), changeGuide());
  if (!isOwner()) guide.open = true;
  p.append(noIntro ? null : h("p",{class:"note",style:{marginTop:0},text: isOwner()
    ? "When someone changes the site, it shows up here. Green light = it passed the safety tests. Press Approve and it goes live in about 5 minutes."
    : "Want to change something on CampusCord? Follow the steps below. Massimo approves every change before it goes live."}), guide);
  const list = h("div",{class:"chlist"}, h("p",{class:"note",text:"Loading changes from GitHub…"}));
  const refresh = h("button",{class:"btn small ghost"}, ic("refresh"), " Refresh");
  const draw = force => loadChanges(force).then(r => {
    list.innerHTML = "";
    if (!r.items.length){ list.append(h("p",{class:"note",text:"No changes waiting. When someone sends one, it shows up here."})); return; }
    r.items.forEach(c => list.append(changeCard(c)));
  }).catch(e => { list.innerHTML = ""; list.append(h("p",{class:"note",text:"Couldn't load changes: " + (e.message || e)})); });
  const hist = Object.entries(S.approvals).filter(([, a]) => a.status === "merged" || a.status === "rejected").sort((x, y) => (y[1].doneAt || 0) - (x[1].doneAt || 0)).slice(0, 8);
  const histEl = hist.length ? h("div",{class:"chhist"}, h("h4",{text:"Recently decided"}),
    hist.map(([n, a]) => h("div",{class:"chrow"}, h("span",{text: a.status === "merged" ? "✅ Live" : "✖ Turned down"}), h("b",{text:a.title || "#" + n}), h("span",{class:"note",style:{margin:"0 0 0 auto"},text:fmtDay(a.doneAt || a.at)})))) : null;
  refresh.onclick = () => { list.innerHTML = ""; list.append(h("p",{class:"note",text:"Refreshing…"})); draw(true); };
  p.append(h("div",{class:"chtop"}, h("h4",{text:"Waiting for approval"}), refresh), list, histEl);
  draw(false);
}

// The Dev panel: its own page on the left bar (</> button), only for developers and the owner.
function renderDevPage(box){
  watchSubs();
  const keep = box.scrollTop, focus = document.activeElement && box.contains(document.activeElement);
  if (focus && box.querySelector(".easy")){ const old = box.querySelector(".subs"); if (old) old.replaceWith(subsListEl()); return; } // don't wipe what they're typing
  box.innerHTML = "";
  const wrap = h("div",{class:"devpage"});
  if (!(isOwner() || isDev(S.uid))){ wrap.append(h("p",{class:"note",text:"The Dev panel is only for developers."})); box.append(wrap); return; }
  const who = isOwner() ? "owner" : "developer", waiting = S.subs.filter(x => x.status === "ready").length;
  wrap.append(h("div",{class:"devhero"},
    h("div",{class:"devterm"},
      h("div",{class:"devbar"}, h("i"), h("i"), h("i"), h("span",{text:"campuscord — dev"})),
      h("pre",null, h("span",{class:"c1",text:"$ "}), "whoami\n", h("span",{class:"c2",text: nickOf(S.uid) + " (" + who + ")"}), "\n",
        h("span",{class:"c1",text:"$ "}), "status\n", h("span",{class:"c3",text: waiting + " change" + (waiting === 1 ? "" : "s") + " waiting for approval"}), h("span",{class:"cur",text:"▋"}))),
    h("div",{class:"devtxt"}, h("h2",{text:"Dev panel"}),
      h("p",{text: isOwner() ? "Your helpers' changes show up below. Green check = it passed the tests. Press Approve and it's live in a few minutes."
        : "Change CampusCord with an AI in 3 steps. Massimo approves it, then it's live for everyone."}))));
  if (isOwner()) wrap.append(subsListEl(), easyPanelEl());
  else wrap.append(easyPanelEl(), subsListEl());
  const adv = h("details",{class:"gwrap advanced"}, h("summary",null, ic("code"), " Advanced: Code Finder and GitHub"));
  adv.append(h("div",{style:{padding:"10px 12px"}}, codeFinderEl(), (() => { const p = h("div",{class:"devbody"}); adminChanges(p, true); return p; })()));
  wrap.append(adv);
  box.append(wrap); box.scrollTop = keep;
}

// ---------------------------------------------------------------- Code Finder
// Find any piece of CampusCord's code by name or by a word in it, and copy it ready to paste into an AI.
// Reads the newest code straight from GitHub (public), so it always matches the live site.
const SRC_FILES = ["app.js", "style.css", "body.html", "cosmetics.js", "badges.js", "voice.js", "camera.js", "vouches.js", "dailypoll.js", "feedback.js", "push.js", "appeals.js", "mod.js", "changes.js"];
let srcCache = null, srcLoading = null;
function loadSources(){
  if (srcCache) return Promise.resolve(srcCache);
  if (srcLoading) return srcLoading;
  const paths = [...SRC_FILES.map(f => "src/" + f), "firestore.rules", "tests/rules.test.mjs"];
  srcLoading = Promise.all(paths.map(p => fetch("https://raw.githubusercontent.com/" + GH_REPO + "/main/" + p, {cache:"no-cache"})
      .then(r => r.ok ? r.text() : "").catch(() => "").then(t => ({path:p, text:t}))))
    .then(list => { srcCache = list.filter(x => x.text).map(x => { const lines = x.text.split("\n"); return {file:x.path.split("/").pop(), path:x.path, lines, blocks:codeBlocks(x.path, lines)}; }); srcLoading = null; return srcCache; });
  return srcLoading;
}
// Split a file into named top-level pieces: functions and consts in JS, rules in CSS, the whole file for HTML.
function codeBlocks(file, lines){
  const out = [];
  if (/\.m?js$/.test(file)){
    const starts = [];
    lines.forEach((l, i) => { const m = l.match(/^(async function|function|const|let|class)\s+([A-Za-z_$][\w$]*)/); if (m) starts.push({i, kind:m[1].replace("async ", "async "), name:m[2]}); else if (/^\/\/ -{8,}/.test(l)) starts.push({i, sep:true}); });
    starts.forEach((st, k) => { if (st.sep) return; let end = (starts[k + 1] ? starts[k + 1].i : lines.length) - 1; while (end > st.i && !lines[end].trim()) end--;
      // pull in the comment lines right above it
      let a = st.i; while (a > 0 && /^\/\/(?! -{8})/.test(lines[a - 1])) a--;
      out.push({file, kind:st.kind, name:st.name, a:a + 1, b:end + 1, code:lines.slice(a, end + 1).join("\n")}); });
  } else if (file.endsWith(".css")){
    lines.forEach((l, i) => { if (!l.trim() || l.trim().startsWith("/*") && l.trim().endsWith("*/")) return; const sel = l.split("{")[0].trim().slice(0, 80);
      out.push({file, kind:"css", name:sel || "(css)", a:i + 1, b:i + 1, code:l}); });
  } else out.push({file, kind:"file", name:file, a:1, b:lines.length, code:lines.join("\n")});
  return out;
}
// Pull out what the AI is asking for from whatever it said: `backticked` names, "function x", x(), .css-classes, camelCase words.
function wantedNames(text){
  const out = new Set(), add = (n, short) => { n = (n || "").trim().replace(/^(async\s+)?(function|const|let|class)\s+/, "").replace(/\(.*$/, "").replace(/[;,:'"]+$/, ""); if (n.length > 1 || (short && n)) out.add(n); };
  // "const S" / "function h" / `S`: one-letter names count when the AI says exactly which kind it is
  (text.match(/\b(?:function|const|let|class)\s+([A-Za-z_$])\b(?![\w$])/g) || []).forEach(x => add(x, true));
  (text.match(/`([A-Za-z_$])`/g) || []).forEach(x => add(x.slice(1, -1), true));
  (text.match(/`([^`\n]{1,60})`/g) || []).forEach(x => { const v = x.slice(1, -1); add(v, /^[A-Za-z_$]$/.test(v)); });
  (text.match(/\b(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/g) || []).forEach(add);
  (text.match(/\b([A-Za-z_$][\w$]{2,})\s*\(/g) || []).forEach(add);
  (text.match(/(^|\s)(\.[a-z][\w-]{1,30})/g) || []).forEach(x => add(x.trim()));
  (text.match(/\b([a-z]+[A-Z][\w]*)\b/g) || []).forEach(add);
  if (!out.size){ const STOP = new Set("show me how the a an and or of to for in on it is are was this that what where which who why can you please need see look find get give make let lets code file function part work works working does do send paste copy into with from there here about like just want would could should open search".split(" "));
    text.toLowerCase().replace(/[^a-z0-9_.\s-]/g, " ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)).forEach(w => add(w.length > 4 && w.endsWith("s") ? w.slice(0, -1) : w)); }
  return [...out];
}
const SKIP_NAMES = new Set(["src", "app.js", "style.css", "Ctrl", "Cmd", "GitHub", "Commit", "done", "querySelector", "getElementById", "addEventListener", "appendChild", "console.log"]);
function findCode(q, fileFilter){
  if (!q.trim() || !srcCache) return {best:[], more:[]};
  const all = []; srcCache.forEach(f => { if (!fileFilter || f.file === fileFilter) f.blocks.forEach(b => all.push(b)); });
  const names = wantedNames(q).filter(n => !SKIP_NAMES.has(n));
  const best = [], seen = new Set(), more = [];
  // 1) exact name matches, one per name the AI asked for (in the order it asked)
  names.forEach(n => { const low = n.toLowerCase();
    const hit = all.find(b => b.kind !== "css" && b.name.toLowerCase() === low) || (n.startsWith(".") ? null : null);
    if (hit && !seen.has(hit)){ seen.add(hit); best.push(hit); return; }
    if (n.startsWith(".")){ const css = all.filter(b => b.kind === "css" && b.code.includes(n)); if (css.length){ const merged = {file:css[0].file, kind:"css", name:n + " styles", a:css[0].a, b:css[css.length - 1].b, code:css.map(c => c.code).join("\n")}; best.push(merged); css.forEach(c => seen.add(c)); } } });
  // names the AI asked for exactly ("const X", `X`) that don't exist: say so instead of guessing something else
  const exact = new Set(); (q.match(/`([^`\n]{1,60})`/g) || []).forEach(x => exact.add(x.slice(1, -1).replace(/^(async\s+)?(function|const|let|class)\s+/, "").replace(/\(.*$/, "").trim()));
  (q.match(/\b(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/g) || []).forEach(x => exact.add(x.replace(/^(async\s+)?(function|const|let|class)\s+/, "")));
  const missing = [...exact].filter(n => !n.startsWith(".") && !/\//.test(n) && !best.some(b => b.name.toLowerCase() === n.toLowerCase()) && !(srcCache || []).some(f => f.path === n || f.file === n));
  // whole files asked for by name (firestore.rules, tests/rules.test.mjs, src/body.html)
  (srcCache || []).forEach(f => { const big = /^src\/.*\.(js|css)$/.test(f.path);
    const asked = exact.has(f.path) || exact.has(f.file) || q.includes(f.path) || new RegExp("(^|[\\s`(])" + f.file.replace(/\./g, "\\.") + "($|[\\s`),.])").test(q);
    if (!big && asked && !best.some(b => b.file === f.path && b.kind === "file")) best.push({file:f.path, kind:"file", name:f.path, a:1, b:f.lines.length, code:f.lines.join("\n")}); });
  // 2) nothing exact: best partial match on the longest word
  if (!best.length && !exact.size){ const words = names.length ? names : [q.trim()];
    words.sort((a, b) => b.length - a.length).forEach(w => { const low = w.toLowerCase();
      all.forEach(b => { if (seen.has(b)) return; const n = b.name.toLowerCase(); let sc = n.startsWith(low) ? 60 : n.includes(low) ? 40 : b.code.toLowerCase().includes(low) ? 10 : 0; if (sc) more.push(Object.assign({score:sc}, b)); }); });
    more.sort((x, y) => y.score - x.score || x.code.length - y.code.length);
    const top = more.shift(); if (top){ best.push(top); seen.add(top); } }
  // 3) other things that mention the same words, for "not it?"
  names.forEach(n => { const low = n.toLowerCase(); all.forEach(b => { if (!seen.has(b) && b.kind !== "css" && (b.name.toLowerCase().includes(low) || b.code.includes(n))) { seen.add(b); more.push(b); } }); });
  return {best, missing, more:more.filter((b, k, a) => a.indexOf(b) === k).slice(0, 8)};
}
function aiCopyText(b){
  const what = b.kind === "css" ? "this CSS from " + b.file : b.kind === "file" ? "the whole file " + b.file : b.kind + " " + b.name + " from " + b.file;
  return "Here's " + what + " (line" + (b.a === b.b ? " " + b.a : "s " + b.a + "–" + b.b) + "). This is the current code on the real site:\n\n```" + (b.file.endsWith(".css") ? "css" : b.file.endsWith(".html") ? "html" : "js") + "\n" + b.code + "\n```";
}
const CF_MAX_LINES = 1000;
function codeFinderEl(){
  const box = h("div",{class:"cfind"});
  const q = h("textarea",{class:"inp cfq", rows:"3", placeholder:"Paste what your AI said here (the whole message is fine), or just type a name like messageEl"});
  const out = h("div",{class:"cfout"});
  const hitEl = (b, open) => { const pre = h("pre",{class:"cfcode" + (open ? "" : " hidden"), text:b.code.length > 4000 ? b.code.slice(0, 4000) + "\n… (Copy gets all of it)" : b.code});
    return h("div",{class:"cfhit"}, h("div",{class:"cfrow"}, h("span",{class:"cfkind",text: b.kind === "css" ? "CSS" : b.kind === "file" ? "FILE" : b.kind}), h("b",{class:"cfname",text:b.name}),
      h("span",{class:"note",style:{margin:0},text:b.file + " · line " + b.a + (b.b > b.a ? "–" + b.b : "")}), h("span",{class:"sp"}),
      h("button",{class:"btn small ghost", onclick:() => pre.classList.toggle("hidden")}, open ? "Hide" : "Show")), pre); };
  const run = () => { const v = q.value; out.innerHTML = ""; if (!v.trim()) return;
    if (!srcCache){ out.append(h("p",{class:"note",text:"Loading the code…"})); loadSources().then(run).catch(() => { out.innerHTML = ""; out.append(h("p",{class:"note",text:"Couldn't load the code. Check your internet and try again."})); }); return; }
    const r = findCode(v);
    const miss = (r.missing || []).length ? "\n\n(These names don't exist in CampusCord's code, so they're not included: " + r.missing.join(", ") + ". Check the map for the right name.)" : "";
    if (!r.best.length){ out.append(h("p",{class:"note",text: miss ? "None of these exist in the code: " + r.missing.join(", ") + ". Ask your AI to check the map for the right names." : "Couldn't tell what code the AI wants. Ask your AI: \"What's the exact name of the function you need?\" and paste its answer here."})); if (miss) out.append(h("button",{class:"btn small", onclick:() => copy(miss.trim(), "Copied! Paste it to your AI.")}, ic("copy","sm"), " Copy a note for your AI")); return; }
    // Split into parts of at most CF_MAX_LINES lines each (a huge piece gets cut into several parts).
    const pieces = [];
    r.best.forEach(b => { const ls = b.code.split("\n");
      for (let k = 0; k < ls.length; k += CF_MAX_LINES) pieces.push(ls.length <= CF_MAX_LINES ? b : Object.assign({}, b, {a:b.a + k, b:Math.min(b.b, b.a + k + CF_MAX_LINES - 1), code:ls.slice(k, k + CF_MAX_LINES).join("\n")})); });
    const parts = []; let cur = [], used = 0;
    pieces.forEach(b => { const n = b.code.split("\n").length; if (cur.length && used + n > CF_MAX_LINES){ parts.push(cur); cur = []; used = 0; } cur.push(b); used += n; });
    if (cur.length) parts.push(cur);
    const N = parts.length;
    const partText = (k) => (N > 1 ? "PART " + (k + 1) + " OF " + N + (k + 1 < N ? ". More code is coming, so just reply \"OK, next\" and wait for the next part." : ". That's all the code you asked for. Now continue.") + "\n\n" : "") +
      parts[k].map(aiCopyText).join("\n\n") + (k === N - 1 ? miss : "");
    const btnRow = h("div",{class:"cfparts"});
    parts.forEach((p, k) => btnRow.append(h("button",{class:"btn cfcopy", onclick:e => { copy(partText(k), N > 1 ? "Copied part " + (k + 1) + "! Paste it into your AI." : "Copied! Now paste it into your AI."); e.currentTarget.classList.add("done"); }},
      ic("copy"), N > 1 ? " Copy part " + (k + 1) + " of " + N : " Copy for AI")));
    out.append(h("div",{class:"cfbig"},
      h("div",null, h("b",{text: r.best.length === 1 ? "Found it: " + r.best[0].name : "Found " + r.best.length + " things: " + r.best.map(b => b.name).join(", ")}),
        h("div",{class:"note",style:{margin:0},text: N > 1 ? "That's a lot of code, so it's split into " + N + " parts. Copy part 1 and paste it into your AI, then part 2, and so on." : "Press the button, then paste into your AI."})),
      btnRow));
    r.best.forEach(b => out.append(hitEl(b, r.best.length === 1)));
    if (r.more.length){ const d = h("details",{class:"cfmore"}, h("summary",{text:"Not the right code? See " + r.more.length + " other matches"}));
      r.more.forEach(b => { const one = hitEl(b, false); one.querySelector(".cfrow").append(h("button",{class:"btn small ghost", onclick:() => copy(aiCopyText(b), "Copied! Now paste it into your AI.")}, "Copy this one")); d.append(one); });
      out.append(d); } };
  let t = null; q.addEventListener("input", () => { clearTimeout(t); t = setTimeout(run, 300); });
  q.addEventListener("focus", () => loadSources().catch(() => {}), {once:true});
  box.append(h("div",{class:"cfhead"}, h("span",{class:"cfic"}, ic("search")), h("div",null, h("b",{text:"Give your AI the code it asks for"}), h("div",{class:"note",style:{margin:0},text:"Paste the AI's message here (the one that asks for code), then press Copy for AI and paste it back."}))),
    q, out);
  return box;
}
