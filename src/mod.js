// ---------------------------------------------------------------- strikes, warnings, suspensions
// Owner-only moderation. Data:
//   mod/{uid}                 {strikes, suspendedUntil, suspendReason, suspensions}
//   mod/{uid}/notices/{id}    {kind:"warning"|"strike", reason, at, strikes?, ackAt:null}
// A warning or strike pops up full screen for that person until they press "I understand".
// The 3rd strike suspends them for SUSPEND_DAYS: a full-screen block they can't close, plus a
// timeout in config/main (so the database rules stop them posting). Strikes reset after that.
const MAX_STRIKES = 3, SUSPEND_DAYS = 7;
S.mod = {}; S.myMod = null; S.myNotices = [];

function watchMod(){
  if (S.modSubs) return; S.modSubs = true;
  onSnapshot(doc(db, "mod", S.uid), s => { S.myMod = s.exists() ? s.data() : null; enforceMod(); }, () => {});
  onSnapshot(query(collection(db, "mod", S.uid, "notices"), where("ackAt", "==", null)), s => {
    S.myNotices = s.docs.map(d => Object.assign({id:d.id}, d.data())).sort((a, b) => a.at - b.at); enforceMod();
  }, () => {});
  if (isOwner()) onSnapshot(collection(db, "mod"), s => { const m = {}; s.docs.forEach(d => m[d.id] = d.data()); S.mod = m; refreshOpenPane(); }, () => {});
}
const strikesOf = uid => (S.mod[uid] && S.mod[uid].strikes) || 0;
const suspendedUntil = uid => { const m = uid === S.uid ? S.myMod : S.mod[uid]; const t = m && m.suspendedUntil; return t && t > Date.now() ? t : 0; };

function reasonModal(title, text, okLabel, onOk, required){
  modal((m, close) => {
    const r = h("textarea",{class:"inp", rows:"3", maxlength:"300", placeholder: required ? "What did they do? (they'll see this)" : "Reason (optional, they'll see this)"});
    const err = h("div",{class:"note",style:{color:"#f0565c",minHeight:"16px"}});
    m.append(h("h3",{text:title}), h("p",{class:"note",text}), r, err,
      h("div",{class:"foot"}, h("button",{class:"btn ghost",onclick:close},"Cancel"),
        h("button",{class:"btn small danger", onclick:() => { const v = r.value.trim(); if (required && v.length < 3){ err.textContent = "Write a short reason."; return; } close(); onOk(v); }}, okLabel)));
    setTimeout(() => r.focus(), 50);
  });
}

function giveWarning(uid){
  const who = nickOf(uid);
  reasonModal("Warn " + who, "A warning doesn't do anything else: it just takes up " + who + "'s whole screen until they press \"I understand\".", "Send warning", async reason => {
    try{ await setDoc(doc(collection(db, "mod", uid, "notices")), {kind:"warning", reason, at:Date.now(), by:S.uid, ackAt:null}); toast("Warning sent to " + who); }
    catch(e){ toast("Couldn't warn: " + errMsg(e)); }
  }, true);
}

function giveStrike(uid){
  const who = nickOf(uid), n = strikesOf(uid) + 1, last = n >= MAX_STRIKES;
  reasonModal("Strike " + n + " of " + MAX_STRIKES + " for " + who,
    last ? "This is their 3rd strike, so " + who + " gets suspended for " + SUSPEND_DAYS + " days: they can't use CampusCord until it's over. Their strikes reset afterwards."
         : who + " sees it full screen and has to accept it. At " + MAX_STRIKES + " strikes they get suspended for " + SUSPEND_DAYS + " days.",
    last ? "Strike & suspend" : "Give strike", async reason => {
    try{
      const b = writeBatch(db), now = Date.now(), prev = S.mod[uid] || {};
      if (last){
        const until = now + SUSPEND_DAYS * 864e5;
        b.set(doc(db, "mod", uid), {strikes:0, suspendedUntil:until, suspendReason:reason, suspendedAt:now, suspensions:(prev.suspensions || 0) + 1});
        b.update(doc(db, "config/main"), {["timeouts." + uid]:until});
      } else {
        b.set(doc(db, "mod", uid), Object.assign({}, prev, {strikes:n, lastStrikeAt:now}));
        b.set(doc(collection(db, "mod", uid, "notices")), {kind:"strike", reason, strikes:n, at:now, by:S.uid, ackAt:null});
      }
      await b.commit();
      toast(last ? who + " is suspended for " + SUSPEND_DAYS + " days" : "Strike " + n + " given to " + who);
    }catch(e){ toast("Couldn't give strike: " + errMsg(e)); }
  }, true);
}

async function clearStrikes(uid){
  try{ await setDoc(doc(db, "mod", uid), Object.assign({}, S.mod[uid] || {}, {strikes:0})); toast(nickOf(uid) + "'s strikes were cleared"); }
  catch(e){ toast(errMsg(e)); }
}
async function endSuspension(uid){
  try{ const b = writeBatch(db);
    b.set(doc(db, "mod", uid), Object.assign({}, S.mod[uid] || {}, {suspendedUntil:0}));
    b.update(doc(db, "config/main"), {["timeouts." + uid]:deleteField()});
    await b.commit(); toast(nickOf(uid) + "'s suspension was ended"); }
  catch(e){ toast(errMsg(e)); }
}

function modMenuItems(uid){
  if (!isOwner() && isHeadDev(S.uid) && uid !== S.uid && !isOwnerUid(uid) && !isHeadDev(uid)) return ["-", {label:"Give warning…", icon:"alert", run:() => giveWarning(uid)}];
  if (!isOwner() || uid === S.uid) return [];
  const n = strikesOf(uid), sus = suspendedUntil(uid);
  return ["-",
    {label:"Give warning…", icon:"alert", run:() => giveWarning(uid)},
    sus ? {label:"End suspension", icon:"check", run:() => endSuspension(uid)}
        : {label:"Give strike… (" + n + "/" + MAX_STRIKES + ")", icon:"flag", danger:true, run:() => giveStrike(uid)},
    n && !sus ? {label:"Clear strikes", icon:"check", run:() => clearStrikes(uid)} : null];
}
function modLabel(uid){
  if (!isOwner()) return null;
  const sus = suspendedUntil(uid); if (sus) return "⛔ Suspended until " + fmtDay(sus);
  const n = strikesOf(uid); return n ? "Strikes: " + n + "/" + MAX_STRIKES : null;
}

// What the person sees
function strikeDots(n){ return h("div",{class:"mdots"}, [...Array(MAX_STRIKES)].map((_, i) => h("span",{class:"mdot" + (i < n ? " on" : "")}))); }
function enforceMod(){
  if (!S.uid || isOwner()){ ["modsus","modnote","modto"].forEach(id => { const e = document.getElementById(id); if (e) e.remove(); }); return; }
  // Suspension: can't be closed, ends by itself
  const sus = suspendedUntil(S.uid), susEl = document.getElementById("modsus");
  if (sus){
    if (!susEl){
      const left = h("b"); const tick = () => { const ms = sus - Date.now(); if (ms <= 0){ clearInterval(t); enforceMod(); return; }
        const d = Math.floor(ms / 864e5), hr = Math.floor(ms % 864e5 / 36e5), mi = Math.floor(ms % 36e5 / 6e4);
        left.textContent = (d ? d + "d " : "") + (d || hr ? hr + "h " : "") + mi + "m"; };
      const t = setInterval(tick, 30000); tick();
      document.body.appendChild(h("div",{id:"modsus",class:"modlayer"}, h("div",{class:"nlbox"},
        h("div",{class:"nlic",text:"⛔"}), h("h2",{text:"You're suspended"}),
        h("p",{text:"You got " + MAX_STRIKES + " strikes, so you can't use CampusCord for " + SUSPEND_DAYS + " days."}),
        S.myMod.suspendReason ? h("div",{class:"mreason"}, h("span",{text:"Last strike"}), h("b",{text:S.myMod.suspendReason})) : null,
        h("div",{class:"nlstrike"}, "Ends in ", left, " · ", fmtDay(sus)),
        h("p",{class:"note",text:"Your strikes reset when it's over."}))));
    }
  } else if (susEl) susEl.remove();
  // Timeout: covers the whole screen until it runs out (can't be closed)
  const tu = sus ? 0 : timeoutUntil(S.uid), toEl = document.getElementById("modto");
  if (tu && !(toEl && Number(toEl.dataset.until) === tu)){
    if (toEl){ clearInterval(toEl._t); toEl.remove(); }
    const left = h("b");
    const el = h("div",{id:"modto",class:"modlayer","data-until":String(tu)}, h("div",{class:"nlbox"},
      h("div",{class:"nlic",text:"⏳"}), h("h2",{text:"You're timed out"}),
      h("p",{text:"You can't use CampusCord until your timeout ends."}),
      h("div",{class:"nlstrike"}, "Ends in ", left, " · ", fmtTime(tu)),
      h("p",{class:"note",text:"This screen goes away by itself when it's over."})));
    const tick = () => { const ms = tu - Date.now(); if (ms <= 0){ clearInterval(el._t); el.remove(); enforceMod(); need("msgs", "me"); return; }
      const hr = Math.floor(ms / 36e5), mi = Math.floor(ms % 36e5 / 6e4), sec = Math.floor(ms % 6e4 / 1000);
      left.textContent = (hr ? hr + "h " : "") + (hr || mi ? mi + "m " : "") + sec + "s"; };
    el._t = setInterval(tick, 1000); tick(); document.body.appendChild(el);
  } else if (!tu && toEl){ clearInterval(toEl._t); toEl.remove(); }
  // Warnings and strikes: full screen until accepted
  const n = S.myNotices[0], noteEl = document.getElementById("modnote");
  if (!n || sus){ if (noteEl) noteEl.remove(); return; }
  if (noteEl && noteEl.dataset.id === n.id) return;
  if (noteEl) noteEl.remove();
  const strike = n.kind === "strike";
  const ok = h("button",{class:"btn"}, "I understand");
  ok.onclick = async () => { ok.disabled = true;
    try{ await updateDoc(doc(db, "mod", S.uid, "notices", n.id), {ackAt:Date.now()}); }
    catch(e){ ok.disabled = false; toast("Couldn't save: " + errMsg(e)); } };
  document.body.appendChild(h("div",{id:"modnote",class:"modlayer" + (strike ? " strike" : ""),"data-id":n.id}, h("div",{class:"nlbox"},
    h("div",{class:"nlic",text: strike ? "🟥" : "⚠️"}),
    h("h2",{text: strike ? "You got a strike" : "You got a warning"}),
    n.reason ? h("div",{class:"mreason"}, h("span",{text:"Reason"}), h("b",{text:n.reason})) : null,
    strike ? h("div",{class:"nlstrike"}, strikeDots(n.strikes), h("div",null, "Strike ", h("b",{text:n.strikes + " of " + MAX_STRIKES})),
      n.strikes >= MAX_STRIKES - 1 ? h("div",{class:"nlwarn",text:"One more strike and you're suspended for " + SUSPEND_DAYS + " days."}) : h("div",{class:"note",style:{margin:"4px 0 0"},text:"At " + MAX_STRIKES + " strikes you get suspended for " + SUSPEND_DAYS + " days."}))
      : h("p",{text:"This is just a warning from the owner. Please keep CampusCord fun for everyone."}),
    h("p",{class:"note",text:"From the owner · " + fmtDay(n.at)}),
    ok)));
}

// ---------------------------------------------------------------- Member agreement (everyone signs before using the app)
// Bump RULES_V when the agreement changes and everyone has to sign again. Signatures are saved in
// signatures/{uid} (only the owner and the signer can read them); members/{uid}.rulesOk records that they signed.
const RULES_V = 3;
const RULES_DATE = "November 23, 2026";
const agreePhrase = uid => "I, " + nickOf(uid) + ", am responsible for myself and I will not use CampusCord in class.";
const AGREEMENT = [
  ["About CampusCord", "CampusCord is a private, independent online chat service operated by students. It is not owned, operated, sponsored, endorsed or supervised by any school, school district or teacher."],
  ["Personal Responsibility", "I accept full responsibility for my own use of CampusCord, including when, where and how I use it, and for all messages, images and other content I post, send or share."],
  ["School Rules", "I will follow all rules of my school. I will not use CampusCord during class, or on any school device or network where it is not permitted."],
  ["Conduct", "I will not bully, harass, threaten or impersonate anyone, and I will not post hateful, violent, sexual or otherwise inappropriate content."],
  ["Privacy and Safety", "I will not share personal information about myself or others, such as addresses, phone numbers or passwords. If anything on CampusCord makes me feel unsafe or uncomfortable, I will tell a parent, guardian or another trusted adult."],
  ["Enforcement", "CampusCord moderators may warn me, time me out, suspend me or remove my account if I break this agreement."],
  ["Acknowledgment", "I understand that the operators of CampusCord are not responsible for my choices or actions. By signing below, I confirm that I have read and understood this agreement and agree to follow it."],
];
const normPhrase = t => String(t || "").toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
function agreementDocEl(){ return h("div",{class:"adoc"},
  h("div",{class:"adoctitle"}, h("div",{text:"CAMPUSCORD"}), h("b",{text:"Member Agreement and Acknowledgment of Responsibility"})),
  h("div",{class:"adocmeta",text:"Effective " + RULES_DATE + " · Version " + RULES_V}),
  AGREEMENT.map(([t, d], i) => h("p",null, h("b",{text:(i + 1) + ". " + t + ". "}), d))); }
// A signature pad: draw with a mouse, finger or pen.
function sigPad(){
  const c = h("canvas",{class:"sigpad", width:"1000", height:"260"}), ctx = c.getContext("2d");
  let drawing = false, last = null, ink = 0; const pad = {el:c, ink:() => ink, onchange:null};
  const pos = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
  const style = () => { ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#13235b"; };
  c.onpointerdown = e => { e.preventDefault(); c.setPointerCapture(e.pointerId); drawing = true; last = pos(e); style(); ctx.beginPath(); ctx.arc(last[0], last[1], 2, 0, 7); ctx.fillStyle = "#13235b"; ctx.fill(); };
  c.onpointermove = e => { if (!drawing) return; const p = pos(e); style(); ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
    ink += Math.hypot(p[0] - last[0], p[1] - last[1]); last = p; if (pad.onchange) pad.onchange(); };
  c.onpointerup = c.onpointercancel = () => { drawing = false; };
  pad.clear = () => { ctx.clearRect(0, 0, c.width, c.height); ink = 0; if (pad.onchange) pad.onchange(); };
  // Small JPEG on white so it stays a few KB.
  pad.image = () => { const o = document.createElement("canvas"); o.width = 500; o.height = 130; const x = o.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, 500, 130); x.drawImage(c, 0, 0, 500, 130); return o.toDataURL("image/jpeg", 0.7); };
  return pad;
}
// Agreement ID like CC-2026-7KQ2M (from the signer and the time, so it never changes).
function makeSigId(uid, at){ let x = 0; for (const ch of uid + at) x = (x * 31 + ch.charCodeAt(0)) >>> 0;
  return "CC-" + new Date(at).getFullYear() + "-" + x.toString(36).toUpperCase().padStart(5, "0").slice(-5); }
const escH = t => String(t || "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
// A printable copy of a signed agreement. Opens the print window, where "Save as PDF" makes the PDF.
function printAgreement(g){
  const when = new Date(g.at).toLocaleString(undefined, {year:"numeric", month:"long", day:"numeric", hour:"numeric", minute:"2-digit"});
  const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>CampusCord Agreement ' + escH(g.sigId) + '</title><style>' +
    'body{font-family:Georgia,serif;color:#111;max-width:720px;margin:40px auto;padding:0 30px;line-height:1.55}' +
    '.top{text-align:center;border-top:6px solid #13235b;padding-top:18px}.top div{letter-spacing:.3em;font-size:12px;color:#13235b;font-weight:bold}' +
    'h1{font-size:22px;margin:6px 0}.meta{text-align:center;font-style:italic;color:#555;font-size:13px;margin-bottom:20px}' +
    'p{text-align:justify;font-size:14.5px}.stmt{border:1px solid #13235b55;background:#f4f5fb;padding:10px 14px;font-weight:bold}' +
    '.sig{display:flex;gap:30px;margin-top:26px}.sig>div{flex:1}.sig img{height:70px;display:block}.line{border-top:1px solid #111;padding-top:4px;font-size:12px;color:#444}' +
    '.id{margin-top:30px;font-size:12px;color:#555;text-align:center;border-top:1px solid #ccc;padding-top:10px}</style></head><body>' +
    '<div class="top"><div>CAMPUSCORD</div><h1>Member Agreement and Acknowledgment of Responsibility</h1></div>' +
    '<div class="meta">Effective ' + RULES_DATE + ' · Version ' + escH(g.v) + '</div>' +
    AGREEMENT.map(([t, d], i) => '<p><b>' + (i + 1) + '. ' + escH(t) + '.</b> ' + escH(d) + '</p>').join("") +
    '<p class="stmt">“' + escH(g.typed) + '”</p>' +
    '<div class="sig"><div>' + (g.img ? '<img src="' + g.img + '">' : '') + '<div class="line">Signature</div></div>' +
    '<div><div style="height:70px;display:flex;align-items:flex-end;font-size:18px">' + escH(g.fullName) + '</div><div class="line">Printed name (CampusCord name: ' + escH(g.nick) + ')</div></div></div>' +
    '<div class="sig"><div><div style="font-size:16px">' + escH(when) + '</div><div class="line">Date signed</div></div><div><div style="font-size:16px">' + escH(g.sigId) + '</div><div class="line">Agreement ID</div></div></div>' +
    '<div class="id">Signed electronically on CampusCord. Agreement ID ' + escH(g.sigId) + '.</div></body></html>';
  const f = document.createElement("iframe"); f.style.cssText = "position:fixed;width:0;height:0;border:0;right:0;bottom:0";
  document.body.appendChild(f); f.srcdoc = html;
  f.onload = () => { setTimeout(() => { try{ f.contentWindow.focus(); f.contentWindow.print(); }catch(e){ toast("Couldn't open the copy"); } setTimeout(() => f.remove(), 60000); }, 200); };
}
function enforceRules(){
  const me = member(S.uid), el = document.getElementById("rulesgate");
  const need = me && !isOwner() && (me.rulesOk || 0) < RULES_V && S.routed === "app";
  if (!need){ if (el) el.remove(); return; }
  if (el) return;
  const PH = agreePhrase(S.uid);
  const typed = h("input",{class:"inp atype", maxlength:"200", placeholder:"Type the statement above", autocomplete:"off", spellcheck:"false"});
  const full = h("input",{class:"inp", maxlength:"60", placeholder:"First and last name", autocomplete:"name"});
  const fullOk = () => /^[A-Za-z][A-Za-z'.-]+(\s+[A-Za-z'.-]+)+$/.test(full.value.trim());
  const pad = sigPad();
  const go = h("button",{class:"btn big", disabled:true}, "Sign and agree");
  const hint = h("div",{class:"ahint"});
  const check = () => { const okT = normPhrase(typed.value) === normPhrase(PH), okN = fullOk(), okS = pad.ink() > 150;
    typed.classList.toggle("ok", okT); full.classList.toggle("ok", okN); go.disabled = !(okT && okN && okS);
    hint.textContent = !okT ? "" : !okS ? "Now sign in the box with your mouse or finger." : !okN ? "Type your first and last name." : "✅ Ready to sign"; };
  typed.oninput = check; full.oninput = check; pad.onchange = check;
  typed.onpaste = e => { e.preventDefault(); hint.textContent = "Type it yourself, no pasting."; };
  go.onclick = async () => { go.disabled = true; go.textContent = "Saving…";
    try{ const at = Date.now(), b = writeBatch(db);
      const g = {v:RULES_V, at, nick:nickOf(S.uid), typed:typed.value.trim().slice(0, 200), img:pad.image(), fullName:full.value.trim().replace(/\s+/g, " ").slice(0, 60), sigId:makeSigId(S.uid, at)};
      b.set(doc(db, "signatures", S.uid), g);
      b.update(doc(db, "members", S.uid), {rulesOk:RULES_V, rulesAt:at});
      await b.commit();
      modal((m, close) => m.append(h("div",{class:"hdpop"}, h("div",{class:"hdcrown",text:"✍️"}), h("h2",{text:"Agreement signed"}),
        h("p",{class:"note",text:"Your Agreement ID:"}), h("div",{class:"sigidbig",text:g.sigId}),
        h("p",{class:"note",text:"Keep a copy for yourself. In the print window, pick \"Save as PDF\"."}),
        h("div",{class:"row",style:{justifyContent:"center",gap:"8px"}}, h("button",{class:"btn ghost",onclick:() => printAgreement(g)},"Download a copy (PDF)"), h("button",{class:"btn",onclick:close},"Done"))))); }
    catch(e){ go.disabled = false; go.textContent = "Sign and agree"; toast("Couldn't save: " + errMsg(e)); } };
  const today = new Date().toLocaleDateString(undefined, {year:"numeric", month:"long", day:"numeric"});
  const docEl = agreementDocEl();
  // The signing part unlocks once they've scrolled to the end of the agreement.
  const unlock = () => { const page = document.querySelector("#rulesgate .rbox"); if (!page) return;
    if (docEl.getBoundingClientRect().bottom <= page.getBoundingClientRect().bottom + 12){ const a = document.querySelector("#rulesgate .asign"); if (a) a.classList.remove("locked");
    const sc = document.querySelector("#rulesgate .ascroll"); if (sc) sc.remove(); page.removeEventListener("scroll", unlock); } };
  setTimeout(() => { const page = document.querySelector("#rulesgate .rbox"); if (page){ page.addEventListener("scroll", unlock); unlock(); } }, 300);
  document.body.appendChild(h("div",{id:"rulesgate",class:"modlayer"}, h("div",{class:"nlbox rbox"},
    h("div",{class:"newupd",text:"NEW UPDATE"}),
    h("h1",{class:"ahead",text:"THIS IS ON YOU!"}),
    h("div",{class:"asub",text:"You are responsible for yourself."}),
    h("p",{class:"note",text:"Read the agreement. To keep using CampusCord, you must sign it."}),
    docEl,
    h("div",{class:"ascroll"}, "⬇️ Scroll to the end of the agreement to sign it"),
    h("div",{class:"asign locked"},
      h("label",{class:"alabel",text:"1. Type this statement exactly:"}),
      h("div",{class:"aphrase",text:PH}), typed,
      h("label",{class:"alabel",style:{marginTop:"14px"}}, "2. Sign below ", h("button",{class:"linkbtn", onclick:() => pad.clear()}, "Clear")),
      h("div",{class:"sigwrap"}, pad.el, h("div",{class:"sigline"}, h("span",{text:"✕"}))),
      h("label",{class:"alabel",style:{marginTop:"14px"},text:"3. Printed full name (first and last):"}), full,
      h("div",{class:"sigmeta"}, h("div",null, h("span",{text:"CampusCord name"}), h("b",{text:nickOf(S.uid)})), h("div",null, h("span",{text:"Date"}), h("b",{text:today}))),
      hint),
    go)));
}
function rulesModal(){ modal((m, close) => m.append(agreementDocEl(),
  h("div",{class:"row",style:{justifyContent:"flex-end",marginTop:"10px"}}, h("button",{class:"btn",onclick:close},"Close")))); }
// Owner's box: everyone's signature, with an Approve button. Loads once when opened (no live listener).
async function adminAgreements(p){
  p.append(h("div",{class:"note",text:"Loading signatures…"}));
  let sigs = {};
  try{ (await getDocs(collection(db, "signatures"))).docs.forEach(d => { sigs[d.id] = d.data(); }); }
  catch(e){ p.innerHTML = ""; p.append(h("div",{class:"err",text:"Couldn't load: " + errMsg(e)})); return; }
  p.innerHTML = "";
  const ms = Object.keys(S.members).filter(u => !isBanned(u) && !isOwnerUid(u));
  const signed = u => sigs[u] && sigs[u].v >= RULES_V, ok = u => signed(u) && sigs[u].approved === RULES_V;
  ms.sort((a, b) => (signed(b) && !ok(b)) - (signed(a) && !ok(a)) || signed(b) - signed(a) || nickOf(a).localeCompare(nickOf(b)));
  const nS = ms.filter(signed).length, nA = ms.filter(ok).length;
  p.append(h("div",{class:"agstats"},
    h("div",null, h("b",{text:String(nS)}), h("span",{text:"signed"})),
    h("div",null, h("b",{text:String(ms.length - nS)}), h("span",{text:"not yet"})),
    h("div",null, h("b",{text:String(nA)}), h("span",{text:"approved"}))),
    h("button",{class:"btn small ghost",style:{marginBottom:"12px"},onclick:rulesModal}, "📜 Read the agreement"));
  ms.forEach(u => { const g = sigs[u];
    const btn = signed(u) && !ok(u) ? h("button",{class:"btn small", onclick:async e => { e.target.disabled = true;
      try{ await updateDoc(doc(db, "signatures", u), {approved:RULES_V}); e.target.replaceWith(h("span",{class:"agok",text:"✅ Approved"})); }
      catch(err){ e.target.disabled = false; toast("Couldn't save: " + errMsg(err)); } }}, "Approve") : null;
    p.append(h("div",{class:"agcard" + (signed(u) ? "" : " no")},
      h("div",{class:"agtop"}, avatar(u, "sm", true), h("b",{text:nickOf(u)}),
        h("span",{class:"agstat",text: signed(u) ? "Signed " + fmtDay(g.at) : "Hasn't signed yet"}),
        ok(u) ? h("span",{class:"agok",text:"✅ Approved"}) : btn),
      signed(u) ? h("div",{class:"agmeta"}, g.fullName ? h("span",null, "Name: ", h("b",{text:g.fullName})) : null,
        g.sigId ? h("span",null, "ID: ", h("b",{text:g.sigId})) : null,
        h("button",{class:"linkbtn",style:{float:"none"},onclick:() => printAgreement(g)}, "Copy (PDF)")) : null,
      signed(u) ? h("div",{class:"agdoc"},
        h("div",{class:"agsig",text:"“" + (g.typed || "") + "”"}),
        g.img ? h("img",{class:"agimg", src:g.img, alt:"Signature of " + nickOf(u)}) : null) : null)); });
}
