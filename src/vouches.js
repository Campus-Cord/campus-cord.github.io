// ---------------------------------------------------------------- #vouches channel (Discord vouch-bot style)
// A text room with type "vouches". People run /vouch (or the Write a vouch button): pick who it's for — a person or
// CampusCord itself — give 1–5 stars, write a review and optionally attach proof. It posts as a numbered vouch card.
// ---------------------------------------------------------------- #daily-poll channel
const isPollRoom = r => r && (r.type === "polls" || /^(daily-?poll|qotd)$/i.test((r.name || "").trim()));
const DAILY_POLLS = [
  {q:"Would you rather always have to sing instead of speak, or dance everywhere you walk?", opts:["Sing instead of speak","Dance everywhere"]},
  {q:"Best school lunch side?", opts:["Fries","Tater tots","Mozzarella sticks","Cookies"]},
  {q:"If you could have one superpower, which one?", opts:["Invisibility","Teleportation","Time travel","Mind reading"]},
  {q:"Pineapple on pizza?", opts:["Yes, 100%","No way","Only if there's jalapeño too"]},
  {q:"Which is worse?", opts:["Waking up 5 mins before your alarm","Stepping in water with socks on","Phone dying at 1%"]},
  {q:"Ideal weekend vibe?", opts:["Gaming all day","Hanging out with friends","Sleeping 12 hours","Going somewhere new"]},
  {q:"Cats or dogs?", opts:["Dogs","Cats","Both","Neither"]},
  {q:"Summer break or winter break?", opts:["Summer break","Winter break"]},
  {q:"Sweet or savory snacks?", opts:["Sweet (candy/chocolate)","Savory (chips/pretzels)","Both mixed together"]},
  {q:"Would you rather fight 1 horse-sized duck or 100 duck-sized horses?", opts:["1 horse-sized duck","100 duck-sized horses"]},
  {q:"Best fast food fries?", opts:["McDonald's","Chick-fil-A","Wendy's","Five Guys","Arby's curly fries"]},
  {q:"If animals could talk, which would be the rudest?", opts:["Cats","Geese","Squirrels","Chihuahuas"]},
  {q:"Night owl or early bird?", opts:["Night owl","Early bird","Tired 24/7"]},
  {q:"Is a hot dog a sandwich?", opts:["Yes","No","It's a taco"]},
  {q:"Which app could you NOT live without?", opts:["YouTube","TikTok","Spotify / Music","CampusCord"]},
  {q:"Would you rather live in space or underwater?", opts:["In space","Underwater"]},
  {q:"Best season of the year?", opts:["Spring","Summer","Fall","Winter"]},
  {q:"Cereal first or milk first?", opts:["Cereal first","Milk first (psychopath)"]},
  {q:"If you won $1,000,000 today, what's the first thing you buy?", opts:["Dream car","House / room setup","Travel the world","Save / invest it"]},
  {q:"Music with headphones or out loud on a speaker?", opts:["Headphones","Speaker","Depends on the mood"]},
  {q:"Would you rather never use social media again or never watch movies/TV again?", opts:["No social media","No movies/TV"]},
  {q:"Best ice cream flavor?", opts:["Cookies & cream","Chocolate","Strawberry","Mint chocolate chip","Vanilla"]},
  {q:"Texting or calling?", opts:["Texting","Calling / FaceTime","Voice notes"]},
  {q:"Could you survive a zombie apocalypse?", opts:["Easily","Maybe for a week","First one gone"]},
  {q:"Which time period would you visit?", opts:["The 1980s / 90s","Ancient Egypt / Rome","100 years in the future","Dinosaurs"]},
  {q:"Homework right after school or right before bed?", opts:["Right after school","Right before bed","In homeroom the next morning"]},
  {q:"Unlimited free flights or unlimited free food?", opts:["Unlimited free flights","Unlimited free food"]},
  {q:"Best Mario Kart item?", opts:["Blue Shell","Bullet Bill","Star","Red Shell"]},
  {q:"Cold weather or hot weather?", opts:["Cold weather (hoodie season)","Hot weather (beach season)"]},
  {q:"Would you rather be famous or rich & unknown?", opts:["Rich & unknown","Famous"]},
  {q:"Best movie genre?", opts:["Action / Sci-Fi","Comedy","Horror / Thriller","Animated"]},
  {q:"How many tabs do you have open right now?", opts:["1–5","6–15","16–50","50+ (lost count)"]},
  {q:"Pancakes or waffles?", opts:["Waffles","Pancakes","French toast"]},
  {q:"Would you rather know every language or play every instrument?", opts:["Speak every language","Play every instrument"]},
  {q:"Biggest pet peeve?", opts:["Loud chewing","Slow walkers in the hallway","People who don't text back","Spoilers"]},
  {q:"Teleport to school every day or never have homework again?", opts:["Teleport to school","Never have homework again"]},
  {q:"Best video game genre?", opts:["FPS / Shooter","Sandbox / Survival","Sports / Racing","RPG / Story"]},
  {q:"Morning shower or night shower?", opts:["Night shower","Morning shower","Both"]},
  {q:"Would you rather lose your phone for a week or your favorite shoes for a month?", opts:["Lose phone for a week","Lose favorite shoes for a month"]},
  {q:"Most underrated snack?", opts:["Goldfish","Cheez-Its","Fruit snacks","Pretzels & Nutella"]},
  {q:"If you had to eat one meal forever, what is it?", opts:["Pizza","Tacos","Burgers & fries","Sushi","Pasta"]},
  {q:"Are aliens real?", opts:["Definitely","Probably not","They're already here"]},
  {q:"Best superpower for school?", opts:["Photographic memory","Stopping time","Reading teachers' minds","Teleporting between classes"]},
  {q:"Dark mode or light mode?", opts:["Dark mode","Light mode (why?!)"]},
  {q:"Would you rather explore the deepest ocean or outer space?", opts:["Outer space","Deepest ocean"]},
  {q:"Best gaming platform?", opts:["PC","PlayStation","Xbox","Nintendo Switch","Mobile"]},
  {q:"Chocolate chip cookies: soft & chewy or crispy?", opts:["Soft & chewy","Crispy","Raw cookie dough"]},
  {q:"Would you rather always be 10 minutes late or 20 minutes early?", opts:["20 minutes early","10 minutes late"]},
  {q:"Best holiday of the year?", opts:["Halloween","Thanksgiving","Winter Holidays","Your Birthday"]},
  {q:"Invisible to cameras or invisible to people?", opts:["Invisible to people","Invisible to cameras"]},
  {q:"Favorite drink?", opts:["Iced coffee / matcha","Soda","Juice / lemonade","Plain cold water"]},
  {q:"Would you rather have a rewind button or a pause button on your life?", opts:["Rewind button","Pause button"]},
  {q:"Most chaotic school subject?", opts:["Gym / PE","Science lab","Art","Lunch period"]},
  {q:"Dogs wearing pants: 2 legs or all 4 legs?", opts:["2 back legs","All 4 legs"]},
  {q:"If you were a teacher, what subject would you teach?", opts:["PE / Sports","History","Art / Music","Computer Science"]},
  {q:"Best road trip seat?", opts:["Shotgun (front passenger)","Driver","Backseat napper"]},
  {q:"Would you rather live without music or without video games?", opts:["Live without video games","Live without music"]},
  {q:"Pick a free pet:", opts:["Golden retriever","Capuchin monkey","Capybara","Red panda"]},
  {q:"First thing you do when you get home from school?", opts:["Drop bag & lie on bed","Grab a snack","Hop on games / phone","Actually do homework"]},
  {q:"Today's mood in one button:", opts:["Locked in 🔥","Sleepy 😴","Chaotic 🤪","Chilling 😎"]}
];
let dailyPollPosting = false;
async function ensureDailyPoll(r){
  if (!isPollRoom(r) || dailyPollPosting || !S.uid) return;
  const dayNum = Math.floor((Date.now() - 18000000) / 86400000);
  const pollId = "daily-" + dayNum;
  if (S.msgs.some(m => m.id === pollId)) return;
  dailyPollPosting = true;
  try{
    const pick = DAILY_POLLS[dayNum % DAILY_POLLS.length];
    const body = {uid:S.uid, text:"", ts:Date.now(), poll:{q:"📅 Question of the Day: " + pick.q, opts:pick.opts}};
    await setDoc(doc(db, "rooms", r.id, "msgs", pollId), body);
    setDoc(doc(db, "meta", r.id), {lastTs:body.ts, lastUid:S.uid, lastNick:"Daily Poll", lastPreview:"📊 " + pick.q, lastMentions:[], lastEveryone:false}).catch(() => {});
  }catch(e){ console.warn("daily poll", e); }
const isVouchRoom = r => r && r.type === "vouches";
const VOUCH_GOLD = "#f5b83d";
// Weekly vouch rewards: resets Monday 00:00 Eastern. 1st vouch +200, 2nd +150, then just for fun.
const VOUCH_REWARDS = [200, 150];
const weekId = () => Math.floor((Date.now() - 363600000) / 604800000);
function vouchesThisWeek(){ const w = wal(S.uid); return w.vWeek === weekId() ? (w.vCount || 0) : 0; }
function nextVouchReward(){ return VOUCH_REWARDS[vouchesThisWeek()] || 0; }
// Rewards only after the owner (or a developer) approves a vouch. The author's app then claims it automatically.
// Vouch tries: everyone gets VOUCH_TRIES; the owner can give more (vouchQuota/{uid}.extra).
const VOUCH_TRIES = 4, VOUCH_MIN_CHARS = 40, VOUCH_MIN_WORDS = 8;
S.vq = {}; S.myVq = null;
function watchVouchQuota(){
  if (S.vqSub) return; S.vqSub = true;
  onSnapshot(doc(db, "vouchQuota", S.uid), s => { S.myVq = s.exists() ? s.data() : {}; need("msgs"); maybeVouchPopup(); }, () => {});
  if (isOwner()) onSnapshot(collection(db, "vouchQuota"), s => { const q = {}; s.docs.forEach(d => q[d.id] = d.data()); S.vq = q; refreshOpenPane(); }, () => {});
}
function vouchTries(uid){ if (isOwnerUid(uid)) return {left:Infinity, total:Infinity, used:0};
  const q = (uid === S.uid ? S.myVq : S.vq[uid]) || {}; const total = VOUCH_TRIES + (q.extra || 0), used = q.used || 0;
  return {left:Math.max(0, total - used), total, used}; }
async function giveVouchTries(uid, n){
  try{ const q = S.vq[uid] || {}; await setDoc(doc(db, "vouchQuota", uid), Object.assign({}, q, {extra:(q.extra || 0) + n}));
    toast(nickOf(uid) + " got " + n + " more vouch tr" + (n === 1 ? "y" : "ies")); }
  catch(e){ toast("Couldn't update: " + errMsg(e)); }
}
// The "Submit vouches for Sparks" pop-up: shows at most every 3 days, only if they have tries left and a reward to earn.
function maybeVouchPopup(){
  if (isOwner() || S.vPopShown || window.__ccNoPop) return;
  const vr = S.rooms.find(isVouchRoom); if (!vr || !S.myVq) return;
  const t = vouchTries(S.uid); if (!t.left || !nextVouchReward()) return;
  let last = 0; try{ last = +localStorage.getItem("ccVouchPop") || 0; }catch(e){}
  if (Date.now() - last < 3 * 864e5) return;
  S.vPopShown = true;
  const tryShow = () => { if (document.querySelector(".modalbg") || document.getElementById("modnote") || document.getElementById("modsus") || document.getElementById("namelock")) return setTimeout(tryShow, 30000); vouchPopup(); };
  setTimeout(tryShow, 20000);
}
function vouchPopup(){
  try{ localStorage.setItem("ccVouchPop", String(Date.now())); }catch(e){}
  const t = vouchTries(S.uid), [a, b] = VOUCH_REWARDS, done = vouchesThisWeek();
  modal((m, close) => {
    m.append(h("div",{class:"vpop"},
      h("div",{class:"vpopic"}, ic("spark")),
      h("h2",{text:"Submit vouches for Sparks!"}),
      h("p",{text:"Write a vouch about CampusCord or a friend. When Massimo approves it, you get Sparks to spend in the Shop."}),
      h("div",{class:"vpoprw"},
        h("div",{class:"vprow" + (done >= 1 ? " done" : "")}, h("span",{text:"1st vouch this week"}), h("b",{text:"+" + a + " Sparks"})),
        h("div",{class:"vprow" + (done >= 2 ? " done" : "")}, h("span",{text:"2nd vouch this week"}), h("b",{text:"+" + b + " Sparks"}))),
      h("div",{class:"vptries"}, "You have ", h("b",{text:t.left + " of " + t.total}), " vouch tries left"),
      h("p",{class:"note",style:{margin:0},text:"Rewards reset every Monday. Only real, specific vouches get approved."}),
      h("div",{class:"foot",style:{justifyContent:"center"}}, h("button",{class:"btn ghost",onclick:close},"Maybe later"),
        h("button",{class:"btn",onclick:() => { close(); openVouchModal(); }}, "Write a vouch"))));
  }, "vpopmodal");
}

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
  vFeedUnsub = onSnapshot(query(collection(db, "rooms", vr.id, "msgs"), orderBy("ts", "desc"), limit(40)), snap => {
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
  const tries = vouchTries(S.uid);
  if (!tries.left){ modal((m, close) => m.append(h("h3",{text:"You're out of vouch tries"}),
      h("p",{class:"note",text:"Everyone gets " + VOUCH_TRIES + " vouch tries so nobody can spam. You've used all " + tries.total + ". Ask Massimo if you want more."}),
      h("div",{class:"foot"}, h("button",{class:"btn small",onclick:close},"OK")))); return; }
  modal((m, close) => {
    let to = preTo || "server", stars = 5, file = null;
    const people = Object.keys(S.members).filter(u => u !== S.uid && !isBanned(u)).sort((a, b) => nickOf(a).localeCompare(nickOf(b)));
    const sel = h("select",{class:"inp", onchange:e => { to = e.target.value; }},
      h("option",{value:"server", text:"🏫 CampusCord (the whole server)", selected: to === "server" ? "" : null}),
      people.map(u => h("option",{value:u, text:"👤 " + nickOf(u), selected: to === u ? "" : null})));
    const starRow = h("div",{class:"vstars"}); const drawStars = () => { starRow.innerHTML = "";
      for (let i = 1; i <= 5; i++) starRow.appendChild(h("button",{class:"vstar" + (i <= stars ? " on" : ""), title:i + " star" + (i > 1 ? "s" : ""), onclick:() => { stars = i; drawStars(); }}, "★"));
      starRow.appendChild(h("span",{class:"vstxt",text:["","Bad","Meh","Okay","Good","Amazing"][stars]})); }; drawStars();
    const txt = h("textarea",{class:"inp", maxlength:"1000", rows:"4", placeholder:"Be specific! What do you like, and why? Is there anything that could be better?\ne.g. “Voice chat works way better than Discord on my school Chromebook, and the badges are fun to collect.”"});
    const meter = h("div",{class:"vmeter"});
    const upd = () => { const v = txt.value.trim(), w = v ? v.split(/\s+/).length : 0, ok = v.length >= VOUCH_MIN_CHARS && w >= VOUCH_MIN_WORDS;
      meter.className = "vmeter" + (ok ? " ok" : ""); meter.textContent = ok ? "✓ Long enough. Massimo still decides if it's approved." : w + " / " + VOUCH_MIN_WORDS + " words · one-liners like “it's good” get rejected"; };
    txt.addEventListener("input", upd); upd();
    const proof = h("span",{class:"note",style:{margin:0},text:"No image"});
    const pick = h("button",{class:"btn small ghost", onclick:() => pickPhotoFile(f => { file = f; proof.textContent = f.name; })}, ic("image","sm"), " Add proof (optional)");
    const go = async () => {
      const review = txt.value.trim();
      if (review.length < VOUCH_MIN_CHARS || review.split(/\s+/).length < VOUCH_MIN_WORDS){ toast("Too short. Write at least " + VOUCH_MIN_WORDS + " words: what you like and why."); return; }
      const why = spamCheck(review); if (why){ toast(why); return; }
      btn.disabled = true; btn.textContent = "Posting…";
      try{
        const body = {uid:S.uid, text:review.slice(0, 1000), ts:Date.now(), vouch:{to, stars, n:vouchCount() + 1}};
        if (to !== "server") body.mentions = [to];
        if (file) body.img = await imageToData(file);
        const id = Date.now().toString(36) + "-v" + Math.random().toString(36).slice(2, 6);
        const b = writeBatch(db);
        b.set(doc(db, "rooms", r.id, "msgs", id), body);
        if (!isOwnerUid(S.uid)) b.set(doc(db, "vouchQuota", S.uid), {used:(S.myVq && S.myVq.used || 0) + 1, lastMsg:r.id + "/" + id}, {merge:true});
        await b.commit();
        setDoc(doc(db, "rooms", r.id, "reacts", id + "__" + S.uid + "__" + eKey("✅")), {mid:id, uid:S.uid, e:"✅", ts:Date.now()}).catch(() => {});
        setDoc(doc(db, "meta", r.id), {lastTs:body.ts, lastUid:S.uid, lastNick:nickOf(S.uid), lastPreview:"left a " + stars + "★ vouch" + (to === "server" ? "" : " for " + nickOf(to)), lastMentions:body.mentions || [], lastEveryone:false}).catch(() => {});
        bumpStat("vouch"); close();
        toast("Vouch #" + body.vouch.n + " posted ✦" + (isOwnerUid(S.uid) ? "" : " " + (tries.left - 1) + " tr" + (tries.left - 1 === 1 ? "y" : "ies") + " left.") + (nextVouchReward() && !isOwnerUid(S.uid) ? " Once it's approved you'll get +" + nextVouchReward() + " Sparks." : ""));
      }catch(e){ toast("Couldn't post: " + errMsg(e)); btn.disabled = false; btn.textContent = "Post vouch"; }
    };
    const btn = h("button",{class:"btn", onclick:go}, "Post vouch");
    const rw = nextVouchReward();
    m.append(h("div",{class:"vmhead"}, h("span",{class:"vmic"}, "🎉"), h("div",null, h("h3",{style:{margin:0},text:"Write a vouch"}), h("div",{class:"note",style:{margin:0},text:"Vouch #" + (vouchCount() + 1) + " · shows up in #" + r.name + " for everyone"}))),
      isOwnerUid(S.uid) ? null : h("div",{class:"vreward" + (rw ? "" : " none")}, rw ? [ic("spark","sm"), " Earn ", h("b",{text:"+" + rw + " Sparks"}), " when the owner approves this vouch. Write something real and specific — short or low-effort vouches won't be approved."] : "You've earned this week's vouch rewards — they reset Monday. You can still vouch!"),
      isOwnerUid(S.uid) ? null : h("div",{class:"vptries small"}, "Vouch tries left: ", h("b",{text:tries.left + " of " + tries.total}), tries.left === 1 ? " · this is your last one!" : ""),
      h("label",{class:"f",text:"Vouching for"}), sel, h("label",{class:"f",text:"Stars"}), starRow, h("label",{class:"f",text:"Review"}), txt, meter,
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
