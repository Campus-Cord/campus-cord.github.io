// ---------------------------------------------------------------- voice channels (WebRTC mesh, Firestore signaling)
// Each person in a voice room connects directly to everyone else in it. Up to 20 people; audio quality steps down a little as rooms fill up so it stays smooth.
const VOICE_MAX = 20;
// Firestore only carries the connection setup ("signals") and who is in the room — never the audio.
// STUN finds each person's public address. A TURN relay passes audio along when two networks can't connect directly
// (school/work Wi-Fi, some phone hotspots). Audio stays encrypted end-to-end, so a relay can't listen in.
// The owner adds a relay (a free Metered account) in Admin → Overview. The old public relay stopped working.
function rtcConfig(){
  const ice = [{urls:["stun:stun.l.google.com:19302","stun:stun1.l.google.com:19302","stun:stun.cloudflare.com:3478"]}];
  const t = S.config && S.config.turn;
  if (t && t.urls) ice.push({urls:String(t.urls).split(/[\s,]+/).filter(Boolean), username:t.username || "", credential:t.credential || ""});
  return {iceServers:ice};
}
const VOICE_STALE = 95000;
const V = {room:null, stream:null, peers:{}, early:{}, tries:{}, warned:{}, audio:{}, unsubs:[], parts:{}, muted:!!store("vmuted"), deaf:!!store("vdeaf"), hb:null, chain:Promise.resolve(), speaking:{}, meters:{}, actx:null, seq:0};
S.voiceParts = {}; S.voiceSubs = {};
const isVoiceRoom = r => r && r.type === "voice";
// Presence uses *our* clock: when someone's lastSeen value changes we note the local time we saw it. A friend whose
// computer clock is a minute off used to look "gone", so nobody ever connected to them.
function liveVoice(parts){ return Object.keys(parts || {}).filter(u => member(u) && (u === S.uid || Date.now() - seenAt("v:" + u + ":" + (parts[u].joinedAt || 0), parts[u].lastSeen) < VOICE_STALE)); }
// keep a live list of who's in every voice room (for the sidebar)
function syncVoiceSubs(){
  const want = new Set(S.rooms.filter(isVoiceRoom).map(r => r.id));
  Object.keys(S.voiceSubs).forEach(id => { if (!want.has(id)){ S.voiceSubs[id](); delete S.voiceSubs[id]; delete S.voiceParts[id]; } });
  want.forEach(id => { if (S.voiceSubs[id]) return;
    let first = true;
    S.voiceSubs[id] = onSnapshot(collection(db, "rooms", id, "voice"), snap => { const p = {}; snap.docs.forEach(d => p[d.id] = d.data()); S.voiceParts[id] = p;
      // a change we just received is fresh activity, whatever the sender's clock says
      if (!first) snap.docChanges().forEach(c => { if (c.type === "removed") return; const x = c.doc.data(); if (x.lastSeen) SEEN["v:" + c.doc.id + ":" + (x.joinedAt || 0)] = {v:x.lastSeen, at:Date.now()}; });
      first = false;
      if (V.room === id){ V.parts = p; syncPeers(); need("me"); } need("side"); }, () => {}); });
}
setInterval(() => { if (Object.keys(S.voiceParts).length) need("side"); }, 20000);
function tone(up){ if (!prefs.sound) return; try{ const a = V.actx || (V.actx = new (window.AudioContext || window.webkitAudioContext)()); const t = a.currentTime;
  [up ? 520 : 660, up ? 780 : 440].forEach((f, i) => { const o = a.createOscillator(), g = a.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0.0001, t + i*0.1); g.gain.exponentialRampToValueAtTime(0.1, t + i*0.1 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i*0.1 + 0.16); o.connect(g).connect(a.destination); o.start(t + i*0.1); o.stop(t + i*0.1 + 0.2); }); }catch(e){} }

async function joinVoice(roomId){
  if (V.room === roomId) return;
  if (V.room) await leaveVoice(true);
  const r = S.rooms.find(x => x.id === roomId); if (!r) return;
  if (timeoutUntil(S.uid)){ toast("You're timed out — you can't join voice right now."); return; }
  if (!navigator.mediaDevices || !window.RTCPeerConnection){ toast("This browser doesn't support voice. Try Chrome or Edge."); return; }
  if (liveVoice(S.voiceParts[roomId]).length >= VOICE_MAX){ toast("That voice room is full (" + VOICE_MAX + " people max)."); return; }
  try{ V.stream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true, noiseSuppression:true, autoGainControl:true}, video:false}); }
  catch(e){ toast("CampusCord needs your microphone for voice. Allow it in the browser's address bar, then try again."); return; }
  V.room = roomId; V.parts = S.voiceParts[roomId] || {};
  V.stream.getAudioTracks().forEach(t => t.enabled = !V.muted && !V.deaf);
  // Listen for connection messages *before* announcing ourselves. Anything already waiting is left over from an
  // earlier call, so it's cleared instead of processed (this used to rely on comparing clocks across computers).
  let firstSignals = true, ready;
  const gotFirst = new Promise(r => ready = r);
  V.unsubs.push(onSnapshot(query(collection(db, "rooms", roomId, "signals"), where("to", "==", S.uid)), snap => {
    const added = snap.docChanges().filter(c => c.type === "added").sort((a, b) => a.doc.id < b.doc.id ? -1 : 1);
    if (firstSignals){ firstSignals = false; added.forEach(c => deleteDoc(doc(db, "rooms", roomId, "signals", c.doc.id)).catch(() => {})); ready(); return; }
    added.forEach(c => { const s = c.doc.data(), id = c.doc.id;
      deleteDoc(doc(db, "rooms", roomId, "signals", id)).catch(() => {});
      V.chain = V.chain.then(() => handleSignal(s)).catch(e => console.warn("signal", e)); }); }, e => { console.warn("signals", e); ready(); toast("Voice couldn't connect to the server: " + errMsg(e)); }));
  await Promise.race([gotFirst, new Promise(r => setTimeout(r, 4000))]);
  try{ await setDoc(doc(db, "rooms", roomId, "voice", S.uid), {joinedAt:Date.now(), lastSeen:Date.now(), muted:V.muted, deaf:V.deaf}); }
  catch(e){ toast("Couldn't join voice: " + errMsg(e)); V.unsubs.forEach(u => u()); V.unsubs = []; stopStream(); V.room = null; need("side","me"); return; }
  // retry any connection that hasn't come up within 8 seconds
  V.retry = setInterval(() => { Object.keys(V.peers).forEach(u => { const p = V.peers[u]; const st = p.pc.connectionState;
    const wait = Math.min(24000, 8000 + (p.tries || 0) * 4000);
    if ((p.tries || 0) >= 3 && !V.warned[u]){ V.warned[u] = true; toast("Voice can't reach " + nickOf(u) + " yet. One of your networks may be blocking calls — try another Wi-Fi or a hotspot." + (isOwner() ? " (You can add a voice relay in Admin → Overview.)" : "")); }
    if ((st === "new" || st === "connecting" || st === "disconnected") && Date.now() - p.created > wait && S.uid < u){ V.tries[u] = (p.tries || 0) + 1; closePeer(u); makePeer(u, true); } });
    syncPeers(); }, 3000);
  V.hb = setInterval(() => { if (V.room) updateDoc(doc(db, "rooms", V.room, "voice", S.uid), {lastSeen:Date.now()}).catch(() => {}); syncPeers(); }, 30000);
  watchLevel(S.uid, V.stream);
  syncPeers(); tone(true); need("side","composer","me","msgs");
}
function stopStream(){ if (V.stream) V.stream.getTracks().forEach(t => t.stop()); V.stream = null; }
async function leaveVoice(quiet){
  if (!V.room) return; const roomId = V.room;
  clearInterval(V.hb); clearInterval(V.retry); V.unsubs.forEach(u => u()); V.unsubs = [];
  Object.keys(V.peers).forEach(closePeer); V.early = {}; V.tries = {}; V.warned = {};
  Object.keys(V.meters).forEach(u => stopLevel(u));
  stopStream(); V.room = null; V.speaking = {};
  await deleteDoc(doc(db, "rooms", roomId, "voice", S.uid)).catch(() => {});
  if (!quiet) tone(false); need("side","me","msgs");
}
window.addEventListener("pagehide", () => { if (V.room) deleteDoc(doc(db, "rooms", V.room, "voice", S.uid)).catch(() => {}); });
function syncPeers(){
  if (!V.room) return;
  const live = liveVoice(V.parts).filter(u => u !== S.uid);
  live.forEach(u => { if (!V.peers[u] && S.uid < u) makePeer(u, true); });
  Object.keys(V.peers).forEach(u => { if (!live.includes(u)) closePeer(u); });
}
function sendSignal(to, data){ if (!V.room) return Promise.resolve();
  const id = Date.now().toString(36).padStart(9, "0") + "-" + (V.seq++).toString(36).padStart(4, "0") + "-" + Math.random().toString(36).slice(2, 6);
  return setDoc(doc(db, "rooms", V.room, "signals", id), Object.assign({from:S.uid, to, ts:Date.now()}, data)).catch(e => console.warn("send signal", e)); }
function makePeer(u, initiator){
  const tries = ((V.peers[u] || {}).tries || V.tries[u] || 0);
  const pc = new RTCPeerConnection(rtcConfig()); const p = {pc, ice:[], created:Date.now(), sid: initiator ? Math.random().toString(36).slice(2, 10) : null, tries}; V.peers[u] = p;
  V.stream.getTracks().forEach(t => pc.addTrack(t, V.stream));
  pc.onicecandidate = e => { if (e.candidate && p.sid) sendSignal(u, {type:"ice", sid:p.sid, c:JSON.stringify(e.candidate)}); };
  pc.ontrack = e => { let a = V.audio[u]; if (!a){ a = document.createElement("audio"); a.autoplay = true; a.setAttribute("playsinline", ""); audioBox().appendChild(a); V.audio[u] = a; }
    a.srcObject = e.streams[0] || new MediaStream([e.track]); a.muted = V.deaf; a.volume = (prefs.vol || {})[u] ?? 1; playAudio(a); watchLevel(u, a.srcObject); };
  pc.onconnectionstatechange = () => { const st = pc.connectionState;
    if (st === "failed"){ closePeer(u); if (S.uid < u) setTimeout(syncPeers, 1500); }
    if (st === "connected"){ p.tries = 0; V.tries[u] = 0; tuneBitrate(); }
    need("side","me"); };
  if (initiator) pc.createOffer().then(o => pc.setLocalDescription(o)).then(() => sendSignal(u, {type:"offer", sid:p.sid, sdp:pc.localDescription.sdp})).catch(e => console.warn("offer", e));
  return p;
}
// Fewer bits per person in big rooms: 20 people × 20 kbps is easy on home Wi-Fi.
function tuneBitrate(){ const n = Object.keys(V.peers).length; const br = n <= 5 ? 48000 : n <= 10 ? 32000 : 20000;
  Object.values(V.peers).forEach(p => p.pc.getSenders().forEach(sd => { if (!sd.track || sd.track.kind !== "audio") return;
    try{ const prm = sd.getParameters(); if (!prm.encodings || !prm.encodings.length) prm.encodings = [{}]; if (prm.encodings[0].maxBitrate === br) return; prm.encodings[0].maxBitrate = br; sd.setParameters(prm).catch(() => {}); }catch(e){} })); }
function audioBox(){ let b = document.getElementById("vaudio"); if (!b){ b = h("div",{id:"vaudio", style:{position:"fixed", width:"0", height:"0", overflow:"hidden"}}); document.body.appendChild(b); } return b; }
// Some browsers (Safari especially) refuse to start audio without a click. If that happens, show a button that does it.
function playAudio(a){ const p = a.play(); if (p && p.catch) p.catch(() => { if (document.querySelector(".vunlock")) return;
  const btn = h("button",{class:"vunlock", onclick:() => { Object.values(V.audio).forEach(x => x.play().catch(() => {})); if (V.actx && V.actx.state === "suspended") V.actx.resume(); btn.remove(); }}, ic("volume"), " Click to hear voice chat");
  document.body.appendChild(btn); }); }
function closePeer(u){ const p = V.peers[u]; if (!p) return; try{ p.pc.close(); }catch(e){} delete V.peers[u]; tuneBitrate();
  const a = V.audio[u]; if (a){ a.srcObject = null; a.remove(); delete V.audio[u]; } stopLevel(u); }
async function flushIce(p){ const list = p.ice; p.ice = []; for (const c of list) await p.pc.addIceCandidate(c).catch(() => {}); }
async function handleSignal(s){
  if (!V.room || !s) return;
  const u = s.from;
  if (s.type === "offer"){
    if (V.peers[u]) closePeer(u);
    const p = makePeer(u, false); p.sid = s.sid || null;
    (V.early[u] || []).filter(x => x.sid === p.sid).forEach(x => p.ice.push(x.c)); delete V.early[u];
    await p.pc.setRemoteDescription({type:"offer", sdp:s.sdp});
    const ans = await p.pc.createAnswer(); await p.pc.setLocalDescription(ans);
    await sendSignal(u, {type:"answer", sid:p.sid, sdp:ans.sdp}); await flushIce(p);
  } else if (s.type === "answer"){
    const p = V.peers[u]; if (p && p.sid === (s.sid || null) && p.pc.signalingState === "have-local-offer"){ await p.pc.setRemoteDescription({type:"answer", sdp:s.sdp}); await flushIce(p); }
  } else if (s.type === "ice"){
    const c = JSON.parse(s.c); const p = V.peers[u];
    if (p && p.sid === (s.sid || null)){ if (p.pc.remoteDescription) await p.pc.addIceCandidate(c).catch(() => {}); else p.ice.push(c); }
    else (V.early[u] = V.early[u] || []).push({sid:s.sid || null, c}); // offer for this session hasn't arrived yet
  }
}
// speaking indicator
function watchLevel(u, stream){
  stopLevel(u);
  try{ const a = V.actx || (V.actx = new (window.AudioContext || window.webkitAudioContext)()); if (a.state === "suspended") a.resume();
    const src = a.createMediaStreamSource(stream), an = a.createAnalyser(); an.fftSize = 512; src.connect(an);
    const buf = new Uint8Array(an.fftSize); let quiet = 0;
    const t = setInterval(() => { an.getByteTimeDomainData(buf); let sum = 0; for (let i = 0; i < buf.length; i++){ const v = (buf[i] - 128) / 128; sum += v * v; }
      const loud = Math.sqrt(sum / buf.length) > 0.035 && !(u === S.uid && (V.muted || V.deaf));
      quiet = loud ? 0 : quiet + 1; const on = loud || (V.speaking[u] && quiet < 4);
      if (on !== !!V.speaking[u]){ V.speaking[u] = on; document.querySelectorAll('[data-vu="' + u + '"]').forEach(el => el.classList.toggle("speaking", on)); } }, 120);
    V.meters[u] = {t, src};
  }catch(e){}
}
function stopLevel(u){ const m = V.meters[u]; if (m){ clearInterval(m.t); try{ m.src.disconnect(); }catch(e){} delete V.meters[u]; } V.speaking[u] = false; }
function setMute(on){ V.muted = on; store("vmuted", on); if (!on && V.deaf) setDeaf(false);
  if (V.stream) V.stream.getAudioTracks().forEach(t => t.enabled = !V.muted && !V.deaf);
  if (V.room) updateDoc(doc(db, "rooms", V.room, "voice", S.uid), {muted:V.muted}).catch(() => {}); need("me","side"); }
function setDeaf(on){ V.deaf = on; store("vdeaf", on);
  Object.values(V.audio).forEach(a => a.muted = on);
  if (V.stream) V.stream.getAudioTracks().forEach(t => t.enabled = !V.muted && !V.deaf);
  if (V.room) updateDoc(doc(db, "rooms", V.room, "voice", S.uid), {deaf:V.deaf}).catch(() => {}); need("me","side"); }
function setPeerVolume(u, v){ prefs.vol = prefs.vol || {}; prefs.vol[u] = v; savePrefs(); if (V.audio[u]) V.audio[u].volume = v; }
function voiceStatusText(){ const n = Object.values(V.peers).filter(p => p.pc.connectionState === "connected").length, total = liveVoice(V.parts).filter(u => u !== S.uid).length;
  if (!total) return "Waiting for others to join"; if (n < total) return "Connecting… (" + n + "/" + total + ")"; return "Connected · " + (total + 1) + " in voice"; }
function voiceParticipantsEl(r){
  const parts = S.voiceParts[r.id] || {}; const live = liveVoice(parts); if (!live.length) return null;
  return h("div",{class:"vlist"}, live.sort((a, b) => (parts[a].joinedAt || 0) - (parts[b].joinedAt || 0)).map(u => { const d = parts[u];
    const av = avatar(u, "xs"); av.setAttribute("data-vu", u); if (V.speaking[u]) av.classList.add("speaking");
    return h("div",{class:"vp", onclick:e => openProfile(u, e.currentTarget), oncontextmenu:e => voiceMemberMenu(e, u)}, av, paintName(h("span",{class:"nm",text:nickOf(u)}), u),
      d.deaf ? ic("headoff","sm") : d.muted ? ic("micoff","sm") : null); }));
}
function voiceMemberMenu(ev, u){
  if (u === S.uid) return memberMenu(ev, u);
  const cur = (prefs.vol || {})[u] ?? 1;
  const slider = h("input",{type:"range", min:"0", max:"1", step:"0.05", value:String(cur), oninput:e => setPeerVolume(u, +e.target.value), style:{width:"100%"}});
  ctxMenu(ev, [{row: h("div",{class:"ctxvol"}, h("span",{text:"Volume for " + nickOf(u)}), slider)}, "-",
    {label:"Profile", icon:"user", run:() => openProfile(u, ev.target)}, {label:"Message", icon:"message", run:() => openDM(u)}]);
}
function voiceBarEl(){
  if (!V.room) return null; const r = S.rooms.find(x => x.id === V.room);
  const good = Object.values(V.peers).every(p => p.pc.connectionState === "connected");
  return h("div",{class:"vbar"},
    h("div",{class:"vinfo", onclick:() => openChat("room", V.room)}, h("b",{class: good ? "ok" : "wait"}, ic("signal","sm"), " Voice Connected"), h("span",{text:(r ? r.name : "voice") + " · " + voiceStatusText()})),
    h("button",{class:"ib", title:"Connection details", onclick:() => voiceDetails()}, ic("info")),
    h("button",{class:"ib danger", title:"Disconnect", onclick:() => leaveVoice()}, ic("phoneoff")));
}
// Shows each connection's state and whether audio goes direct or through the relay — handy when something's wrong.
async function pairType(pc){ try{ const st = await pc.getStats(); let pair = null; st.forEach(r => { if (r.type === "transport" && r.selectedCandidatePairId) pair = st.get(r.selectedCandidatePairId); });
  if (!pair) st.forEach(r => { if (r.type === "candidate-pair" && (r.selected || r.nominated) && r.state === "succeeded") pair = r; });
  if (!pair) return "—"; const loc = st.get(pair.localCandidateId), rem = st.get(pair.remoteCandidateId);
  const t = [loc && loc.candidateType, rem && rem.candidateType]; return t.includes("relay") ? "through relay" : t.includes("srflx") || t.includes("prflx") ? "direct (internet)" : "direct (same network)"; }catch(e){ return "—"; } }
function voiceDetails(){
  modal((m, close, bg) => {
    const draw = async () => { if (!V.room){ close(); return; }
      const rows = await Promise.all(liveVoice(V.parts).filter(u => u !== S.uid).map(async u => { const p = V.peers[u]; const st = p ? p.pc.connectionState : "not started";
        return h("div",{class:"li"}, avatar(u, "sm"), h("span",{class:"nm",text:nickOf(u)}), h("span",{class:"s vst " + st,text:st}), h("span",{class:"s",text: p && st === "connected" ? await pairType(p.pc) : (p && p.tries ? "retry " + p.tries : "")})); }));
      const track = V.stream && V.stream.getAudioTracks()[0];
      m.innerHTML = "";
      m.append(h("button",{class:"ib close",title:"Close (Esc)",onclick:close}, ic("x")), h("h3",{text:"Voice connection"}),
        h("p",{class:"note",text:"Your mic: " + (track ? (track.label || "microphone") + (track.enabled ? "" : " (muted)") : "none")}),
        rows.length ? h("div",{class:"list"}, rows) : h("p",{class:"note",text:"Nobody else is here yet."}),
        h("p",{class:"note",text:"“connecting” for a long time usually means a network is blocking calls (school or work Wi-Fi). Try another network or a phone hotspot."}),
        h("div",{class:"foot"}, h("button",{class:"btn ghost", onclick:() => { Object.keys(V.peers).forEach(u => { if (S.uid < u){ closePeer(u); makePeer(u, true); } }); toast("Reconnecting…"); }}, ic("refresh","sm"), " Reconnect"), h("button",{class:"btn small", onclick:close}, "Done")));
    };
    draw(); const t = setInterval(() => { if (!document.body.contains(bg)){ clearInterval(t); return; } draw(); }, 2000);
  });
}
window.__cc = {V, S, statusOf: u => statusOf(u), setAway: on => setAway(on)};
