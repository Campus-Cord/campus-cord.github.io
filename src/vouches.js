// ---------------------------------------------------------------- #vouches channel (Discord vouch-bot style)
// A text room with type "vouches". People run /vouch (or the Write a vouch button): pick who it's for — a person or
// CampusCord itself — give 1–5 stars, write a review and optionally attach proof. It posts as a numbered vouch card.
const isVouchRoom = r => r && r.type === "vouches";
const VOUCH_GOLD = "#f5b83d";
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
      const review = txt.value.trim(); if (review.length < 3){ toast("Write a short review (at least 3 characters)"); return; }
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
        bumpStat("vouch"); close(); toast("Vouch #" + body.vouch.n + " posted ✦");
      }catch(e){ toast("Couldn't post: " + errMsg(e)); btn.disabled = false; btn.textContent = "Post vouch"; }
    };
    const btn = h("button",{class:"btn", onclick:go}, "Post vouch");
    m.append(h("div",{class:"vmhead"}, h("span",{class:"vmic"}, "🎉"), h("div",null, h("h3",{style:{margin:0},text:"Write a vouch"}), h("div",{class:"note",style:{margin:0},text:"Vouch #" + (vouchCount() + 1) + " · shows up in #" + r.name + " for everyone"}))),
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
        h("div",{class:"vfoot"}, avatar(m.uid, "xs"), h("span",{text:"Vouched by " + nickOf(m.uid) + " • CampusCord Vouches"})))));
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
