// ---------------------------------------------------------------- #vouches channel (Discord vouch-bot style)
// A text room with type "vouches". People run /vouch (or the Write a vouch button): pick who it's for — a person or
// CampusCord itself — give 1–5 stars, write a review and optionally attach proof. It posts as a numbered vouch card.
const isVouchRoom = r => r && r.type === "vouches";
const VOUCH_GOLD = "#f5b83d";
// Weekly vouch rewards: resets Monday 00:00 Eastern. 1st vouch +200, 2nd +150, then just for fun.
const VOUCH_REWARDS = [200, 150];
const weekId = () => Math.floor((Date.now() - 363600000) / 604800000);
function vouchesThisWeek(){ const w = wal(S.uid); return w.vWeek === weekId() ? (w.vCount || 0) : 0; }
function nextVouchReward(){ return VOUCH_REWARDS[vouchesThisWeek()] || 0; }
// Rewards only after the owner (or a developer) approves a vouch. The author's app then claims it automatically.
let vClaiming = false;
async function claimVouchRewards(){
  const vr = S.rooms.find(isVouchRoom); if (!vr || vClaiming || !S.walletsLoaded || isOwnerUid(S.uid)) return; vClaiming = true;
  try{
    const paid = new Set(wal(S.uid).vPaid || []);
    const ready = (S.vouchFeed || []).filter(m => m.uid === S.uid && m.vouch && m.approved && !paid.has(vr.id + "/" + m.id) && Date.now() - m.ts < 13 * 864e5).sort((a, b) => a.ts - b.ts);
    for (const m of ready){ const n = nextVouchReward(); if (!n) break;
      await ensureWallet(); const w = wal(S.uid); const first = w.vWeek !== weekId(); const key = vr.id + "/" + m.id;
      const patch = {earned:(w.earned || 0) + n, vWeek:weekId(), vCount: first ? 1 : (w.vCount || 0) + 1, lastVouch:key, vPaid:[...(w.vPaid || []), key]};
      await updateDoc(doc(db, "wallet", S.uid), patch); S.wallets[S.uid] = Object.assign({}, w, patch);
      toast("✅ Your vouch #" + (m.vouch.n || "") + " was approved — +" + n + " Sparks!"); }
  }catch(e){ console.warn("vouch reward", e); }
  finally{ vClaiming = false; }
}
// Keep an eye on the #vouches room (latest 100) so approvals pay out and the owner sees how many are waiting.
let vFeedUnsub = null, vFeedRoom = null;
function watchVouches(){ const vr = S.rooms.find(isVouchRoom); if (!vr || vFeedRoom === vr.id) return; if (vFeedUnsub) vFeedUnsub(); vFeedRoom = vr.id;
  vFeedUnsub = onSnapshot(query(collection(db, "rooms", vr.id, "msgs"), orderBy("ts", "desc"), limit(100)), snap => {
    S.vouchFeed = snap.docs.map(d => Object.assign({id:d.id}, d.data())); need("side"); setTimeout(claimVouchRewards, 400); }, () => {}); }
const pendingVouches = () => (S.vouchFeed || []).filter(m => m.vouch && !m.approved && !m.rejected && m.uid !== S.uid);
async function reviewVouch(m, ok){
  const r = S.rooms.find(isVouchRoom); if (!r) return;
  try{ await updateDoc(doc(db, "rooms", r.id, "msgs", m.id), ok ? {approved:true, approvedBy:S.uid, rejected:deleteField()} : {rejected:true, approved:false, approvedBy:S.uid});
    toast(ok ? "Approved — " + nickOf(m.uid) + " gets their Sparks" : "Marked as not approved (no Sparks)"); }
  catch(e){ toast("Couldn't update: " + errMsg(e)); }
}
// Feedback that the owner/devs accept (Planned, In progress or Done) pays its author 200 Sparks, once per post.
const FEEDBACK_REWARD = 200; let fbClaiming = false;
async function claimFeedbackRewards(){
  if (fbClaiming || !S.walletsLoaded || isOwnerUid(S.uid)) return; fbClaiming = true;
  try{
    for (const f of S.feedback.filter(f => f.uid === S.uid && ["planned", "working", "done"].includes(f.status))){
      const w = wal(S.uid); const paid = w.fbPaid || []; if (paid.includes(f.id)) continue;
      await ensureWallet();
      await updateDoc(doc(db, "wallet", S.uid), {earned:(wal(S.uid).earned || 0) + FEEDBACK_REWARD, fbPaid:[...paid, f.id], lastFb:f.id});
      S.wallets[S.uid] = Object.assign({}, wal(S.uid), {earned:(wal(S.uid).earned || 0) + FEEDBACK_REWARD, fbPaid:[...paid, f.id]});
      toast("🎉 Your feedback “" + f.title + "” was " + (FB_STATUS[f.status] || {}).name.toLowerCase() + " — +" + FEEDBACK_REWARD + " Sparks!");
    }
  }catch(e){ console.warn("feedback reward", e); }
  finally{ fbClaiming = false; }
}
function starsText(n){ return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }
function vouchCount(){ return S.msgs.filter(m => m.vouch).length; }
function openVouchModal(preTo){
  const r = curRoom(); if (!isVouchRoom(r)){ const vr = S.rooms.find(isVouchRoom); if (vr){ openChat("room", vr.id); setTimeout(() => openVouchModal(preTo), 600); } else toast("Ask the owner to make a #vouches room first"); return; }
  modal((m, close) => {
    let to = preTo || "server", stars = 5, file = null;
    const people = Object.keys(S.members).filter(u => u !== S.uid && !isBanned(u)).sort((a, b) => nickOf(a).localeCompare(nickOf(b)));
    const sel = h("select",{class:"inp", onchange:e => { to = e.target.value; }},
      h("option",{value:"server", text:"🏫 CampusCord (the whole server)", selected: to === "server" ? "" : null}),
      people.map(u => h("option",{value:u, text:"👤 " + nickOf(u), selected: to === u ? "" : null})));
    const starRow = h("div",{class:"vstars"}); const drawStars = () => { starRow.innerHTML = "";
      for (let i = 1; i <= 5; i++) starRow.appendChild(h("button",{class:"vstar" + (i <= stars ? " on" : ""), title:i + " star" + (i > 1 ? "s" : ""), onclick:() => { stars = i; drawStars(); }}, "★"));
      starRow.appendChild(h("span",{class:"vstxt",text:["","Bad","Meh","Okay","Good","Amazing"][stars]})); }; drawStars();
    const txt = h("textarea",{class:"inp", maxlength:"1000", rows:"4", placeholder:"What was good (or not)? e.g. “Helped me with my homework, super fast and nice.”"});
    const proof = h("span",{class:"note",style:{margin:0},text:"No image"});
    const pick = h("button",{class:"btn small ghost", onclick:() => pickPhotoFile(f => { file = f; proof.textContent = f.name; })}, ic("image","sm"), " Add proof (optional)");
    const go = async () => {
      const review = txt.value.trim(); if (review.length < 12){ toast("Write a real review — at least a sentence (12+ characters)"); return; }
      const why = spamCheck(review); if (why){ toast(why); return; }
      btn.disabled = true; btn.textContent = "Posting…";
      try{
        const body = {uid:S.uid, text:review.slice(0, 1000), ts:Date.now(), vouch:{to, stars, n:vouchCount() + 1}};
        if (to !== "server") body.mentions = [to];
        if (file) body.img = await imageToData(file);
        const id = Date.now().toString(36) + "-v" + Math.random().toString(36).slice(2, 6);
        await setDoc(doc(db, "rooms", r.id, "msgs", id), body);
        setDoc(doc(db, "rooms", r.id, "reacts", id + "__" + S.uid + "__" + eKey("✅")), {mid:id, uid:S.uid, e:"✅", ts:Date.now()}).catch(() => {});
        setDoc(doc(db, "meta", r.id), {lastTs:body.ts, lastUid:S.uid, lastNick:nickOf(S.uid), lastPreview:"left a " + stars + "★ vouch" + (to === "server" ? "" : " for " + nickOf(to)), lastMentions:body.mentions || [], lastEveryone:false}).catch(() => {});
        bumpStat("vouch"); close();
        toast("Vouch #" + body.vouch.n + " posted ✦" + (nextVouchReward() && !isOwnerUid(S.uid) ? " Once it's approved you'll get +" + nextVouchReward() + " Sparks." : ""));
      }catch(e){ toast("Couldn't post: " + errMsg(e)); btn.disabled = false; btn.textContent = "Post vouch"; }
    };
    const btn = h("button",{class:"btn", onclick:go}, "Post vouch");
    const rw = nextVouchReward();
    m.append(h("div",{class:"vmhead"}, h("span",{class:"vmic"}, "🎉"), h("div",null, h("h3",{style:{margin:0},text:"Write a vouch"}), h("div",{class:"note",style:{margin:0},text:"Vouch #" + (vouchCount() + 1) + " · shows up in #" + r.name + " for everyone"}))),
      isOwnerUid(S.uid) ? null : h("div",{class:"vreward" + (rw ? "" : " none")}, rw ? [ic("spark","sm"), " Earn ", h("b",{text:"+" + rw + " Sparks"}), " when the owner approves this vouch. Write something real and specific — short or low-effort vouches won't be approved."] : "You've earned this week's vouch rewards — they reset Monday. You can still vouch!"),
      h("label",{class:"f",text:"Vouching for"}), sel, h("label",{class:"f",text:"Stars"}), starRow, h("label",{class:"f",text:"Review"}), txt,
      h("div",{class:"row",style:{marginTop:"10px",alignItems:"center",gap:"10px"}}, pick, proof),
      h("div",{class:"foot"}, h("button",{class:"btn ghost",onclick:close},"Cancel"), btn));
    setTimeout(() => txt.focus(), 0);
  }, "vouchmodal");
}
// The vouch card (like a vouch bot's embed)
function vouchEl(m){
  const v = m.vouch, who = v.to === "server" ? null : v.to;
  const field = (label, ...val) => h("div",{class:"vf"}, h("div",{class:"vfl",text:label}), h("div",{class:"vfv"}, ...val));
  const row = h("div",{class:"msg first vouchmsg", id:"m-" + m.id},
    h("div",{class:"gut"}, h("div",{class:"av vbot"}, h("span",{text:"✓"}))),
    h("div",{class:"body"},
      h("div",{class:"meta"}, h("span",{class:"n",style:{color:VOUCH_GOLD},text:"Vouches"}), h("span",{class:"tag bot noi"}, h("b",{text:"APP"})), h("span",{class:"t",text:fmtDay(m.ts)})),
      h("div",{class:"vcard"},
        h("div",{class:"vtitle"}, "🎉 Vouch ", h("span",{class:"vnum",text:"(#" + (v.n || "?") + ")"})),
        m.text ? h("div",{class:"vdesc",text:m.text}) : null,
        h("div",{class:"vfields"},
          field("Vouched " + (who ? "User" : "For"), who ? h("span",{class:"vwho", onclick:e => openProfile(who, e.currentTarget)}, avatar(who, "xs"), paintName(h("b",{text:nickOf(who)}), who)) : h("b",{text:"CampusCord"})),
          field("Vouched By", h("span",{class:"vwho", onclick:e => openProfile(m.uid, e.currentTarget)}, avatar(m.uid, "xs"), paintName(h("b",{text:nickOf(m.uid)}), m.uid))),
          field("Stars", h("span",{class:"vstarsro",text:starsText(v.stars || 0)}), h("span",{class:"vsn",text:" " + (v.stars || 0) + "/5"})),
          field("Vouched At", h("span",{text:new Date(m.ts).toLocaleString([], {month:"short", day:"numeric", year:"numeric", hour:"numeric", minute:"2-digit"})}))),
        m.img ? h("img",{class:"vimg", src:m.img, alt:"Proof", onclick:() => window.open(m.img, "_blank")}) : null,
        h("div",{class:"vfoot"}, avatar(m.uid, "xs"), h("span",{text:"Vouched by " + nickOf(m.uid) + " • CampusCord Vouches"})),
        (isAdmin() || m.uid === S.uid) ? h("div",{class:"vrev " + (m.approved ? "ok" : m.rejected ? "no" : "wait")},
          m.approved ? [ic("check","sm"), " Approved" + (m.approvedBy ? " by " + nickOf(m.approvedBy) : "")]
          : m.rejected ? [ic("x","sm"), " Not approved — no Sparks"]
          : [ic("hourglass","sm"), m.uid === S.uid ? " Waiting for the owner to review" : " Needs review"],
          isAdmin() && m.uid !== S.uid ? h("span",{class:"sp"}) : null,
          isAdmin() && m.uid !== S.uid && !m.approved ? h("button",{class:"btn small", onclick:() => reviewVouch(m, true)}, "Approve") : null,
          isAdmin() && m.uid !== S.uid && !m.rejected ? h("button",{class:"btn small ghost", onclick:() => reviewVouch(m, false)}, m.approved ? "Undo" : "Reject") : null) : null)));
  return row;
}
// Profile stats: how many vouches someone has and their average rating (reads the #vouches room once per open).
const VSTATS = {};
async function vouchStats(uid){
  const vr = S.rooms.find(isVouchRoom); if (!vr) return null;
  const c = VSTATS[vr.id]; let list;
  if (c && Date.now() - c.at < 60000) list = c.list;
  else { try{ const snap = await getDocs(query(collection(db, "rooms", vr.id, "msgs"), orderBy("ts", "desc"), limit(500))); list = snap.docs.map(d => d.data()).filter(m => m.vouch); VSTATS[vr.id] = {at:Date.now(), list}; }catch(e){ return null; } }
  const mine = list.filter(m => m.vouch.to === uid); if (!mine.length) return {n:0, avg:0};
  return {n:mine.length, avg:mine.reduce((a, m) => a + (m.vouch.stars || 0), 0) / mine.length};
}
function vouchProfileEl(uid){
  const box = h("div",{class:"sect vprof hidden"});
  vouchStats(uid).then(st => { if (!st) return; box.classList.remove("hidden");
    box.append(h("h4",{text:"Vouches"}), h("div",{class:"vpr"}, st.n ? [h("span",{class:"vstarsro",text:starsText(Math.round(st.avg))}), h("b",{text:" " + st.avg.toFixed(1)}), h("span",{class:"note",style:{margin:"0 0 0 6px"},text:"from " + st.n + " vouch" + (st.n > 1 ? "es" : "")})] : h("span",{class:"note",style:{margin:0},text:"No vouches yet."}),
      uid !== S.uid ? h("button",{class:"btn small ghost",style:{marginLeft:"auto"}, onclick:() => { closeLayer("profile"); openVouchModal(uid); }}, "Vouch") : null)); });
  return box;
}
