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
  user.oninput = drawSend; drawSend();
  const copyBtn = h("button",{class:"btn small", onclick:() => copy(AI_PROMPT, "Copied! Paste it into Gemini as your first message.")}, ic("copy"), " Copy the AI message");
  return h("div",{class:"guide"},
    step(1, "Make a GitHub account", "GitHub is the website where CampusCord's code lives. It's free. Skip this if you already have one.",
      link("Sign up for GitHub", "https://github.com/signup")),
    step(2, "Make your own copy of CampusCord", "Click the button, then click the green \"Create fork\" button. Now you have your own copy to change. Nothing you do there touches the real site.",
      link("Make my copy", "https://github.com/" + GH_REPO + "/fork", true)),
    step(3, "Ask AI to help you change it", "Copy the AI message, paste it into Gemini as your first message, then just chat. Tell it your idea (like \"make the send button purple\") and do what it says. You don't need to know how to code.",
      copyBtn, link("Open Gemini", "https://gemini.google.com/")),
    h("div",{class:"gstep"}, h("div",{class:"gnum",text:"4"}), h("div",{class:"gbody"}, h("b",{text:"Send your change to Massimo"}),
      h("p",{text:"Type your GitHub username once, then press the purple button. On the page that opens, write what you changed in normal words and click the green \"Create pull request\" button."}),
      user, send)),
    step(5, "Wait for Massimo to approve it", "Your change shows up right below this guide. Green light = it passed the safety tests. When Massimo approves it, it's live on CampusCord about 5 minutes later."));
}

// Owner: count waiting changes once at startup so the Admin button shows a red number.
function checkChangesBadge(){ if (!isOwner() || S.changesChecked) return; S.changesChecked = true;
  loadChanges(false).then(() => need("rail")).catch(() => {}); setTimeout(() => { S.changesChecked = false; }, 10 * 60000); }
function adminChanges(p){
  watchApprovals();
  const guide = h("details",{class:"gwrap"}, h("summary",null, ic("info"), isOwner() ? " How changes work (and how Elliott sends them)" : " How to make a change to CampusCord"), changeGuide());
  if (!isOwner()) guide.open = true;
  p.append(h("p",{class:"note",style:{marginTop:0},text: isOwner()
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
