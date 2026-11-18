// ---------------------------------------------------------------- phone & desktop push notifications
// Each device that turns this on saves a push "subscription" in push/{uid}/subs/{id}. The Notify GitHub Action checks
// every few minutes for new DMs, @mentions (and, for the owner, vouches and feedback) and sends a real notification.
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
function pushSupported(){ return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window; }
function b64ToBytes(s){ const pad = "=".repeat((4 - s.length % 4) % 4); const b = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(b, c => c.charCodeAt(0)); }
async function subHash(endpoint){ const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint)); return [...new Uint8Array(d)].slice(0, 12).map(x => x.toString(16).padStart(2, "0")).join(""); }
async function pushKey(){ return S.pushKey || null; }
async function enablePush(){
  if (!pushSupported()){ toast(isIOS && !isStandalone() ? "On iPhone: tap Share → Add to Home Screen, open CampusCord from there, then turn this on." : "This browser can't do push notifications."); return false; }
  if (isIOS && !isStandalone()){ toast("On iPhone: tap Share → Add to Home Screen, open CampusCord from there, then turn this on."); return false; }
  const key = S.pushKey || await pushKey(); if (!key){ toast("Notifications are still being set up — try again in a few minutes."); return false; }
  const perm = await Notification.requestPermission(); if (perm !== "granted"){ toast("Notifications are blocked. Allow them in your browser or phone settings."); return false; }
  try{
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:b64ToBytes(key)});
    const j = sub.toJSON(); const id = await subHash(j.endpoint);
    await setDoc(doc(db, "push", S.uid, "subs", id), {endpoint:j.endpoint, keys:j.keys, ua:navigator.userAgent.slice(0, 120), device: isIOS ? "iPhone/iPad" : /Android/.test(navigator.userAgent) ? "Android" : "Computer", ts:Date.now()});
    prefs.pushOn = id; savePrefs(); toast("🔔 Notifications are on for this device"); return true;
  }catch(e){ toast("Couldn't turn on notifications: " + errMsg(e)); return false; }
}
async function disablePush(){
  try{ const reg = await navigator.serviceWorker.ready; const sub = await reg.pushManager.getSubscription();
    if (sub){ const id = await subHash(sub.endpoint); await deleteDoc(doc(db, "push", S.uid, "subs", id)).catch(() => {}); await sub.unsubscribe(); } }catch(e){}
  prefs.pushOn = null; savePrefs(); toast("Notifications turned off for this device");
}
async function savePushPrefs(p){ try{ await setDoc(doc(db, "push", S.uid), p, {merge:true}); }catch(e){ toast("Couldn't save: " + errMsg(e)); } }
function pushPane(p){
  const on = !!prefs.pushOn && "Notification" in window && Notification.permission === "granted";
  const box = h("div",{class:"preview-card pushcard"},
    h("div",{class:"pushhead"}, h("span",{class:"pushic"}, ic("bell")), h("div",{style:{flex:"1"}}, h("b",{text:"Phone & push notifications"}),
      h("div",{class:"note",style:{margin:0},text: on ? "On for this device ✓ — you'll get notified even when CampusCord is closed." : "Get notified on your phone or computer even when CampusCord is closed."})),
      on ? h("button",{class:"btn small ghost", onclick:async () => { await disablePush(); refreshOpenPane(); }}, "Turn off") : h("button",{class:"btn small", onclick:async () => { await enablePush(); refreshOpenPane(); }}, "Turn on")),
    isIOS && !isStandalone() ? h("div",{class:"pushios"}, h("b",{text:"iPhone setup: "}), "tap the ", h("b",{text:"Share"}), " button in Safari → ", h("b",{text:"Add to Home Screen"}), ", open CampusCord from your home screen, then come back here and tap Turn on.") : null,
    h("div",{class:"note",style:{margin:"8px 0 0"},text:"Notifications arrive within a few minutes. Turn it on separately on each phone or computer you use."}));
  p.append(box);
  // what to get notified about (saved on the server so the sender knows)
  const pp = (S.pushPrefs || {});
  const row = (key, label, desc, def) => toggleRow(label, desc, pp[key] === undefined ? def : !!pp[key], v => { S.pushPrefs = Object.assign({}, S.pushPrefs || {}, {[key]:v}); savePushPrefs({[key]:v}); });
  p.append(h("label",{class:"f",text:"Send me push notifications for"}),
    row("dms", "Direct messages", "When someone DMs you", true),
    row("mentions", "@mentions", "When someone @mentions you or uses @everyone", true),
    isAdmin() ? row("vouches", "New vouches to review", "When someone posts a vouch that needs your review", true) : null,
    isAdmin() ? row("feedback", "New feedback", "When someone posts a bug or idea", true) : null,
    row("rewards", "Sparks & rewards", "When your vouch or feedback is approved", true));
}
// load my push prefs once
function watchPushPrefs(){ onSnapshot(doc(db, "push", S.uid), s => { S.pushPrefs = s.exists() ? s.data() : {}; }, () => {});
  onSnapshot(doc(db, "config/push"), s => { S.pushKey = s.exists() ? s.data().publicKey : null; }, () => {}); }
// tapping a notification opens the right chat
if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", e => { const d = e.data || {}; if (d.type === "open" && d.url){ try{ const u = new URL(d.url); const k = u.searchParams.get("open"); if (k){ const [kind, id] = k.split(":"); openChat(kind, id); } }catch(err){} } });
function openFromUrl(){ try{ const k = new URLSearchParams(location.search).get("open"); if (!k) return; history.replaceState(null, "", location.pathname); const [kind, id] = k.split(":"); setTimeout(() => openChat(kind, id), 800); }catch(e){} }
