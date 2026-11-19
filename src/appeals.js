// ---------------------------------------------------------------- ban appeals
// A banned person sees their username, "pending review", and 3 questions with a 30-minute timer that starts the first
// time they see the screen. Answers go to appeals/{uid}; the owner reviews them in Admin → Appeals.
const APPEAL_MS = 30 * 60000;
const APPEAL_QS = [
  {k:"names", q:"What was your real username?"},
  {k:"main", q:"Retype the username you want unbanned."},
  {k:"promise", q:"Will you change your name and provide vouches when you get back in?"},
];
let appealUnsub = null, appealTick = null;
function bannedName(){ const c = S.config || {}; return (c.bannedNames || {})[S.uid] || (c.bannedDevNames || {})[deviceId()] || (member(S.uid) || {}).nick || "this account"; }
function showBanAppeal(){
  S.routed = "banned"; stopAppSubs();
  const box = $("g-msg").querySelector(".card"); show("g-msg");
  const ref = doc(db, "appeals", S.uid);
  const draw = ap => {
    clearInterval(appealTick); box.innerHTML = "";
    box.classList.add("bancard");
    box.append(h("div",{class:"banic",text:"⛔"}), h("h1",{text:"You have been banned"}),
      h("div",{class:"banname"}, "Account: ", h("b",{text:bannedName()})),
      h("div",{class:"banstatus"}, h("span",{class:"dot"}), "Your account status is currently ", h("b",{text: ap && ap.status === "denied" ? "denied" : ap && ap.status === "approved" ? "unbanned" : "pending review"}), "."));
    if (ap && ap.status === "approved"){ S.holdBan = true; try{ localStorage.setItem("ccJoinCode", ap.code || ""); }catch(e){}
      box.append(h("p",{class:"sub",text:"Good news — the owner unbanned you. Rejoin with this invite code and use your real name:"}), h("div",{class:"bancode",text:ap.code || "(ask the owner)"}),
        h("button",{class:"btn", onclick:() => { S.holdBan = false; location.reload(); }}, "Rejoin CampusCord")); return; }
    if (ap && ap.status === "denied"){ box.append(h("p",{class:"sub",text:"The owner reviewed your answers and kept the ban."})); return; }
    if (ap && ap.submittedAt){ box.append(h("p",{class:"sub",text:"Thanks — your answers were sent. The owner will review them soon. Keep this page open or check back later."})); return; }
    const start = ap && ap.startedAt; const left = start ? start + APPEAL_MS - Date.now() : APPEAL_MS;
    if (left <= 0){ box.append(h("p",{class:"sub",text:"Time's up. The 30 minutes to answer the unban questions have passed."})); return; }
    const timer = h("div",{class:"bantimer"});
    const tick = () => { const l = Math.max(0, (start || Date.now()) + APPEAL_MS - Date.now()); timer.innerHTML = ""; timer.append(ic("hourglass","sm"), " ", h("b",{text:Math.floor(l / 60000) + ":" + String(Math.floor(l / 1000) % 60).padStart(2, "0")}), " left · time started when you opened this page"); if (l <= 0) draw(Object.assign({}, ap, {startedAt:start || 1})); };
    tick(); appealTick = setInterval(tick, 1000);
    const ins = APPEAL_QS.map(x => ({k:x.k, el:h(x.k === "promise" ? "textarea" : "input",{class:"inp", maxlength:"300", rows: x.k === "promise" ? "2" : null})}));
    const err = h("div",{class:"note",style:{color:"#f0565c",minHeight:"16px",margin:"4px 0 0"}});
    const send = h("button",{class:"btn", onclick:async () => {
      const a = {}; for (const i of ins){ const v = i.el.value.trim(); if (v.length < 2){ err.textContent = "Please answer every question."; return; } a[i.k] = v.slice(0, 300); }
      send.disabled = true; send.textContent = "Sending…";
      try{ await setDoc(ref, Object.assign({answers:a, submittedAt:Date.now()}, start ? {} : {startedAt:Date.now(), nick:bannedName(), dev:deviceId()}), {merge:true}); }
      catch(e){ err.textContent = "Couldn't send: " + errMsg(e); send.disabled = false; send.textContent = "Submit answers"; } }}, "Submit answers");
    box.append(h("p",{class:"sub",style:{margin:"6px 0 0"},text:"To proceed with the unban process, answer these questions within the next 30 minutes:"}), timer,
      h("div",{class:"banqs"}, APPEAL_QS.map((x, i) => h("label",{class:"banq"}, h("span",{text:(i + 1) + ". " + x.q}), ins[i].el))), err, send);
  };
  if (appealUnsub) appealUnsub();
  let started = false;
  appealUnsub = onSnapshot(ref, s => { const ap = s.exists() ? s.data() : null;
    if (!ap && !started){ started = true; setDoc(ref, {startedAt:Date.now(), nick:bannedName(), dev:deviceId(), status:"pending"}).catch(e => console.warn("appeal start", e)); }
    draw(ap); }, () => draw(null));
}
// ---- owner side
S.appeals = [];
function watchAppeals(){ if (!isOwner() || S.appealsUnsub) return;
  S.appealsUnsub = onSnapshot(collection(db, "appeals"), s => { S.appeals = s.docs.map(d => Object.assign({id:d.id}, d.data())); need("rail", "side"); refreshOpenPane(); }, () => {}); }
const openAppeals = () => S.appeals.filter(a => a.submittedAt && (!a.status || a.status === "pending"));
async function decideAppeal(a, ok){
  try{
    if (ok){
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      await setDoc(doc(db, "secret/invite"), {code});
      const upd = {banned:arrayRemove(a.id), ["bannedNames." + a.id]:deleteField()};
      if (a.dev) upd.bannedDevices = arrayRemove(a.dev);
      await updateDoc(doc(db, "config/main"), upd);
      await updateDoc(doc(db, "appeals", a.id), {status:"approved", code, decidedAt:Date.now()});
      toast("Unbanned " + (a.nick || "them") + " — they'll see the new invite code " + code, 8000);
    } else { await updateDoc(doc(db, "appeals", a.id), {status:"denied", decidedAt:Date.now()}); toast("Appeal denied"); }
  }catch(e){ toast("Couldn't update: " + errMsg(e)); }
}
function adminAppeals(p){
  watchAppeals();
  const list = [...S.appeals].sort((a, b) => (b.submittedAt || b.startedAt || 0) - (a.submittedAt || a.startedAt || 0));
  p.append(h("p",{class:"note",style:{marginTop:0},text:"When someone's banned they get 30 minutes to answer three questions. Approve to unban them (they get a new invite code), or deny to keep the ban."}));
  if (!list.length){ p.append(h("p",{class:"note",text:"No appeals yet."})); return; }
  list.forEach(a => {
    const st = a.status === "approved" ? "Unbanned" : a.status === "denied" ? "Denied" : a.submittedAt ? "Waiting for you" : (Date.now() - (a.startedAt || 0) > APPEAL_MS ? "Ran out of time" : "Answering now…");
    p.append(h("div",{class:"appeal" + (a.submittedAt && (!a.status || a.status === "pending") ? " open" : "")},
      h("div",{class:"aph"}, h("b",{text:a.nick || "Banned member"}), h("span",{class:"apst",text:st}), h("span",{class:"note",style:{margin:"0 0 0 auto"},text: a.submittedAt ? fmtDay(a.submittedAt) : a.startedAt ? "opened " + fmtDay(a.startedAt) : ""})),
      a.answers ? h("div",{class:"apqs"}, APPEAL_QS.map(x => h("div",{class:"apq"}, h("span",{text:x.q}), h("b",{text:a.answers[x.k] || "—"})))) : null,
      a.submittedAt && (!a.status || a.status === "pending") ? h("div",{class:"foot",style:{justifyContent:"flex-start",marginTop:"8px"}},
        h("button",{class:"btn small", onclick:() => decideAppeal(a, true)}, "Unban"), h("button",{class:"btn small ghost", onclick:() => decideAppeal(a, false)}, "Keep banned")) : null));
  });
}
