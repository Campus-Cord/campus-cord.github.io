// ---------------------------------------------------------------- Feedback board ("vouches")
// Anyone can post a bug or an idea; everyone else can vouch for it (one vouch each). The owner and developers
// mark what's planned or fixed and can reply. Stored in feedback/{id}; rules keep vouches honest.
const FB_TYPES = [{id:"bug", name:"Bug", icon:"alert"}, {id:"idea", name:"Idea", icon:"zap"}, {id:"change", name:"Change", icon:"refresh"}];
const FB_STATUS = {open:{name:"Open", c:"#b5bac1"}, planned:{name:"Planned", c:"#3fb8ff"}, working:{name:"In progress", c:"#ffd166"}, done:{name:"Done", c:"#3ecf7a"}, no:{name:"Won't do", c:"#f0565c"}};
S.feedback = []; S.fbSort = "top"; S.fbFilter = "all";
let fbUnsub = null;
function watchFeedback(){ if (fbUnsub) return;
  fbUnsub = onSnapshot(collection(db, "feedback"), snap => { S.feedback = snap.docs.map(d => Object.assign({id:d.id}, d.data())); if (S.kind === "feedback") need("msgs"); need("side"); }, e => console.warn("feedback", e)); }
function fbUnseen(){ const seen = prefs.fbSeen || 0; return S.feedback.filter(f => f.ts > seen && f.uid !== S.uid).length; }
async function vouch(f){
  const on = (f.votes || []).includes(S.uid);
  try{ await updateDoc(doc(db, "feedback", f.id), {votes: on ? arrayRemove(S.uid) : arrayUnion(S.uid)}); }
  catch(e){ toast("Couldn't vouch: " + errMsg(e)); }
}
async function setFbStatus(f, st){ try{ await updateDoc(doc(db, "feedback", f.id), {status:st, statusBy:S.uid, statusAt:Date.now()}); }catch(e){ toast("Couldn't update: " + errMsg(e)); } }
function fbReplyModal(f){
  modal((m, close) => { const t = h("textarea",{class:"inp", maxlength:"500", rows:"4", placeholder:"Thanks! Fixed in the next update."}); t.value = f.reply || "";
    m.append(h("h3",{text:"Reply to “" + f.title + "”"}), t, h("div",{class:"foot"}, h("button",{class:"btn ghost",onclick:close},"Cancel"),
      h("button",{class:"btn small",onclick:async () => { try{ await updateDoc(doc(db, "feedback", f.id), {reply:t.value.trim().slice(0, 500), replyBy:S.uid, replyAt:Date.now()}); close(); }catch(e){ toast("Couldn't reply: " + errMsg(e)); } }},"Post reply"))); });
}
function fbNewModal(type){
  modal((m, close) => {
    let ty = type || "idea";
    const seg = h("div",{class:"seg"}); const drawSeg = () => { seg.innerHTML = ""; FB_TYPES.forEach(x => seg.appendChild(h("button",{class: ty === x.id ? "on" : "", onclick:() => { ty = x.id; drawSeg(); }}, ic(x.icon, "sm"), " " + x.name))); }; drawSeg();
    const title = h("input",{class:"inp", maxlength:"80", placeholder:"Short title, e.g. “Voice cuts out on school Wi-Fi”"});
    const text = h("textarea",{class:"inp", maxlength:"1000", rows:"5", placeholder:"What happened, or what should change? For bugs: what you clicked and what you expected."});
    const go = async () => { const tt = title.value.trim(); if (tt.length < 4){ toast("Give it a title (at least 4 characters)"); return; }
      const why = spamCheck(tt + " " + text.value); if (why){ toast(why); return; }
      try{ await setDoc(doc(db, "feedback", Date.now().toString(36) + "-" + rid().slice(-4)), {uid:S.uid, nick:nickOf(S.uid), type:ty, title:tt.slice(0, 80), text:text.value.trim().slice(0, 1000), ts:Date.now(), votes:[S.uid], status:"open"});
        close(); toast("Posted! Friends can vouch for it."); bumpStat("feedback"); }
      catch(e){ toast("Couldn't post: " + errMsg(e)); } };
    m.append(h("h3",{text:"Share feedback"}), h("p",{class:"note",text:"Found a bug or have an idea? Post it here. Everyone can vouch for the ones they agree with, so the most-wanted changes rise to the top."}),
      seg, h("label",{class:"f",text:"Title"}), title, h("label",{class:"f",text:"Details"}), text,
      h("div",{class:"foot"}, h("button",{class:"btn ghost",onclick:close},"Cancel"), h("button",{class:"btn small",onclick:go},"Post")));
    setTimeout(() => title.focus(), 0);
  });
}
function renderFeedbackPage(box){
  watchFeedback();
  if (fbUnseen()){ prefs.fbSeen = Date.now(); savePrefs(); need("side"); }
  const keep = box.scrollTop; box.innerHTML = "";
  const wrap = h("div",{class:"shoppage fbpage"});
  const bar = h("div",{class:"shopbar"}, h("span",{class:"sbic"}, ic("message")),
    ...[["all","All"],["bug","Bugs"],["idea","Ideas"],["change","Changes"],["done","Done"]].map(([id, name]) => h("button",{class:"stab" + (S.fbFilter === id ? " on" : ""), onclick:() => { S.fbFilter = id; need("msgs"); }}, name)),
    h("span",{class:"sp"}),
    h("button",{class:"stab" + (S.fbSort === "top" ? " on" : ""), onclick:() => { S.fbSort = "top"; need("msgs"); }}, "Top"),
    h("button",{class:"stab" + (S.fbSort === "new" ? " on" : ""), onclick:() => { S.fbSort = "new"; need("msgs"); }}, "New"),
    h("button",{class:"btn small", style:{marginLeft:"8px"}, onclick:() => fbNewModal()}, ic("plus","sm"), " Post feedback"));
  wrap.appendChild(bar);
  const body = h("div",{class:"sbody"}); wrap.appendChild(body);
  body.appendChild(h("div",{class:"fbhero"}, h("div",null, h("h2",{text:"Feedback & vouches"}),
    h("p",{text:"Report bugs and suggest changes. Vouch for the posts you agree with — the owner sees what everyone wants most."})),
    h("div",{class:"fbhb"}, h("button",{class:"btn", onclick:() => fbNewModal("bug")}, ic("alert","sm"), " Report a bug"), h("button",{class:"btn ghost", onclick:() => fbNewModal("idea")}, ic("zap","sm"), " Suggest an idea"))));
  let list = S.feedback.filter(f => S.fbFilter === "all" ? f.status !== "done" && f.status !== "no" : S.fbFilter === "done" ? (f.status === "done" || f.status === "no") : f.type === S.fbFilter && f.status !== "done" && f.status !== "no");
  list.sort((a, b) => S.fbSort === "new" ? b.ts - a.ts : ((b.votes || []).length - (a.votes || []).length) || b.ts - a.ts);
  if (!list.length) body.appendChild(h("div",{class:"empty-note",style:{padding:"40px",textAlign:"center"},text: S.feedback.length ? "Nothing here." : "No feedback yet. Be the first — what would make CampusCord better?"}));
  list.forEach(f => {
    const n = (f.votes || []).length, mine = (f.votes || []).includes(S.uid), st = FB_STATUS[f.status] || FB_STATUS.open, ty = FB_TYPES.find(x => x.id === f.type) || FB_TYPES[1];
    const canDel = f.uid === S.uid || isAdmin();
    body.appendChild(h("div",{class:"fbcard"},
      h("button",{class:"vouch" + (mine ? " on" : ""), title: mine ? "Remove your vouch" : "Vouch for this", onclick:() => vouch(f)}, ic("chevronup"), h("b",{text:String(n)}), h("small",{text: n === 1 ? "vouch" : "vouches"})),
      h("div",{class:"fbmain"},
        h("div",{class:"fbtop"}, h("span",{class:"fbtype t-" + ty.id}, ic(ty.icon, "sm"), " " + ty.name), h("span",{class:"fbst", style:{color:st.c, borderColor:st.c}, text:st.name}), h("b",{class:"fbt",text:f.title})),
        f.text ? h("div",{class:"fbtx",text:f.text}) : null,
        h("div",{class:"fbmeta"}, avatar(f.uid, "xs"), paintName(h("span",{text:member(f.uid) ? nickOf(f.uid) : (f.nick || "Someone")}), f.uid), h("span",{text:"· " + fmtDay(f.ts)}),
          (f.votes || []).filter(u => u !== f.uid).length ? h("span",{class:"fbv", title:(f.votes || []).map(u => nickOf(u)).join(", "), text:"· vouched by " + (f.votes || []).filter(u => u !== f.uid).slice(0, 3).map(u => nickOf(u)).join(", ") + ((f.votes || []).length > 4 ? " +" + ((f.votes || []).length - 4) : "")}) : null),
        f.reply ? h("div",{class:"fbreply"}, h("b",{}, ic("reply","sm"), " " + nickOf(f.replyBy) + ": "), h("span",{text:f.reply})) : null,
        isAdmin() || canDel ? h("div",{class:"fbacts"},
          isAdmin() ? h("select",{class:"inp fbsel", onchange:e => setFbStatus(f, e.target.value)}, Object.entries(FB_STATUS).map(([k, v]) => h("option",{value:k, selected: (f.status || "open") === k ? "" : null, text:v.name}))) : null,
          isAdmin() ? h("button",{class:"btn small ghost", onclick:() => fbReplyModal(f)}, f.reply ? "Edit reply" : "Reply") : null,
          canDel ? h("button",{class:"btn small ghost", onclick:() => confirmBox("Delete this post?", "It'll be removed for everyone.", "Delete", () => deleteDoc(doc(db, "feedback", f.id)).catch(e => toast(errMsg(e))))}, "Delete") : null) : null)));
  });
  box.appendChild(wrap); box.scrollTop = keep;
}
