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
    h("details",{class:"chfiles"}, h("summary",{text:"What it changes (" + c.files.length + " file" + (c.files.length === 1 ? "" : "s") + ")"}),
      h("ul",null, c.files.map(f => h("li",null, h("code",{text:f.name}), " ", h("span",{class:"add",text:"+" + f.add}), " ", h("span",{class:"del",text:"−" + f.del}),
        OWNER_ONLY_FILES.test(f.name) ? h("span",{class:"chwarn",text:" owner-only"}) : null)))),
    owner.length ? h("p",{class:"chalert",text:"⚠️ This touches owner-only files (security, payments or automation). Approve it on GitHub after checking it with Claude, not here."}) : null,
    note ? h("p",{class:"chnote",text:note}) : null);
  const btns = h("div",{class:"foot",style:{justifyContent:"flex-start",marginTop:"8px",flexWrap:"wrap"}});
  btns.append(h("a",{class:"btn small ghost",href:c.url + "/files",target:"_blank",rel:"noopener"}, "See the code"));
  const done = a && (a.status === "queued" && a.sha === c.sha || a.status === "rejecting");
  if (isOwner() && !done){
    const ok = c.light === "green" && !owner.length;
    const ap = h("button",{class:"btn small", disabled: ok ? null : "", title: ok ? "Put this change live" : owner.length ? "Owner-only files: approve on GitHub" : "Wait for the tests to pass"}, ic("check"), " Approve");
    ap.onclick = () => decideChange(c, true, ap);
    const no = h("button",{class:"btn small ghost"}, "Turn down"); no.onclick = () => decideChange(c, false, no);
    btns.append(ap, no);
    if (c.light === "waiting") btns.append(h("a",{class:"btn small ghost",href:c.url + "/checks",target:"_blank",rel:"noopener"}, "Start tests on GitHub"));
  }
  card.append(btns);
  return card;
}

function adminChanges(p){
  watchApprovals();
  p.append(h("p",{class:"note",style:{marginTop:0},text: isOwner()
    ? "Changes Elliott (or anyone) sends to the site show up here. Green means GitHub tested it and it won't break anything. Tap Approve and it goes live within about 5 minutes."
    : "Changes sent to the site show up here. Massimo approves them, then they go live within about 5 minutes."}));
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
  p.append(h("div",{class:"foot",style:{justifyContent:"flex-start",margin:"0 0 10px"}}, refresh,
    h("a",{class:"btn small ghost",href:"https://github.com/" + GH_REPO + "/blob/main/CONTRIBUTING.md",target:"_blank",rel:"noopener"}, "How to send a change")), list, histEl);
  draw(false);
}
