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

// ---------------------------------------------------------------- CampusCord Rules (everyone agrees before using the app)
// Bump RULES_V when the rules change and everyone has to agree again.
const RULES_V = 1;
const RULES = [
  ["🏫", "CampusCord is not a school app", "It's a private chat run by students. No school made it, runs it, or is responsible for it."],
  ["📚", "I follow my school's rules", "I won't use CampusCord in class or when a teacher says not to. If my school doesn't allow it on school devices or Wi-Fi, I won't use it there."],
  ["🙋", "I'm responsible for what I do", "Everyone is responsible for their own messages, pictures and actions. Nobody else is responsible for what I post."],
  ["💬", "I'm kind", "No bullying, threats, hate, or anything inappropriate. No posting other people's pictures or private stuff without asking."],
  ["🔒", "I keep personal info private", "I don't share my address, phone number, passwords, or anyone else's."],
  ["🧑‍🤝‍🧑", "I talk to an adult if something's wrong", "If something here makes me uncomfortable or unsafe, I tell a parent or trusted adult."],
  ["⚖️", "Breaking the rules has consequences", "I can be warned, timed out, or removed."],
];
function rulesListEl(){ return h("div",{class:"rlist"}, RULES.map(([ic, t, d], i) =>
  h("div",{class:"ritem"}, h("div",{class:"ric",text:ic}), h("div",null, h("b",{text:(i + 1) + ". " + t}), h("div",{class:"rdesc",text:d}))))); }
function enforceRules(){
  const me = member(S.uid), el = document.getElementById("rulesgate");
  const need = me && (me.rulesOk || 0) < RULES_V && S.routed === "app";
  if (!need){ if (el) el.remove(); return; }
  if (el) return;
  const box = h("input",{type:"checkbox", id:"rules-ok"});
  const go = h("button",{class:"btn", disabled:true}, "I agree");
  box.onchange = () => { go.disabled = !box.checked; };
  go.onclick = async () => { go.disabled = true; go.textContent = "Saving…";
    try{ await updateDoc(doc(db, "members", S.uid), {rulesOk:RULES_V, rulesAt:Date.now()}); }
    catch(e){ go.disabled = false; go.textContent = "I agree"; toast("Couldn't save: " + errMsg(e)); } };
  document.body.appendChild(h("div",{id:"rulesgate",class:"modlayer"}, h("div",{class:"nlbox rbox"},
    h("div",{class:"nlic",text:"📜"}), h("h2",{text:"CampusCord Rules"}),
    h("p",{class:"note",text:"Read these and agree before using CampusCord."}),
    rulesListEl(),
    h("label",{class:"ragree",for:"rules-ok"}, box, h("span",{text:"I've read the rules. I agree to follow them, and I understand I'm responsible for what I do on CampusCord."})),
    go)));
}
function rulesModal(){ modal((m, close) => m.append(h("h3",{text:"📜 CampusCord Rules"}), rulesListEl(),
  h("div",{class:"row",style:{justifyContent:"flex-end",marginTop:"10px"}}, h("button",{class:"btn",onclick:close},"Close")))); }
