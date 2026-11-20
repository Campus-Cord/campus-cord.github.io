// ---------------------------------------------------------------- Easy changes (no GitHub needed)
// 1. "Copy everything for AI": the instructions + ALL of CampusCord's code, ready for Gemini.
// 2. The AI answers with FIND/REPLACE blocks. The helper pastes that answer here and presses Send.
// 3. devSubs/{id} is checked by the GitHub robot (scripts/devsubs.mjs, every few minutes): it applies the
//    blocks, builds the site and checks the code. The owner then presses Approve and the robot puts it live.
// The block format and how blocks are applied MUST stay the same as in scripts/devsubs.mjs.
// Helpers may change anything in the app (src/). Database security rules (firestore.rules) go through Massimo.
const SUB_FILES_RE = /^src\/[\w-]+\.(js|css|html)$/;
const SUB_NO_FILES = new Set(["src/build.py", "src/firebase-config.js"]);
const SUB_FLAGS = ["STRIPE_LINKS", "buy.stripe.com", "const CATALOG", "ownerUid", "giveSparks", "earned:", "allow ", "isOwner"];

function parseEdits(text){
  const lines = String(text || "").replace(/\r/g, "").split("\n"), blocks = [];
  let file = null, mode = null, find = [], rep = [];
  const clean = arr => { while (arr.length && /^\s*```/.test(arr[0])) arr.shift(); while (arr.length && /^\s*```\s*$/.test(arr[arr.length - 1])) arr.pop(); return arr.join("\n"); };
  for (const l of lines){
    const fm = mode === null && l.match(/^[\s#*>`_-]*FILE:\s*[`*"']*\s*([\w.\/-]+?)[`*"']*\s*$/i);
    if (fm){ const f = fm[1].replace(/^\.?\//, ""); file = /^(src|tests)\//.test(f) || f === "firestore.rules" ? f : f === "rules.test.mjs" ? "tests/rules.test.mjs" : "src/" + f; continue; }
    if (/^\s*<{5,}\s*FIND\s*$/i.test(l)){ mode = "find"; find = []; rep = []; continue; }
    if (mode === "find" && /^\s*={5,}\s*$/.test(l)){ mode = "rep"; continue; }
    if (mode === "rep" && /^\s*>{5,}\s*REPLACE\s*$/i.test(l)){ blocks.push({file, find:clean(find), rep:clean(rep)}); mode = null; continue; }
    if (mode === "find") find.push(l); else if (mode === "rep") rep.push(l);
  }
  return {blocks, unfinished: mode !== null};
}
// Apply one block to a file's text. Exact match first; then the same lines ignoring spaces at the ends.
function applyEdit(content, b){
  if (!b.find.trim()) return {text: content.replace(/\s*$/, "\n") + b.rep + "\n"};
  const n = content.split(b.find).length - 1;
  if (n === 1) return {text: content.replace(b.find, () => b.rep)};
  if (n > 1) return {err:"matches " + n + " places"};
  const cl = content.split("\n"), fl = b.find.split("\n").map(x => x.trim());
  while (fl.length && !fl[0]) fl.shift(); while (fl.length && !fl[fl.length - 1]) fl.pop();
  const hits = [];
  for (let i = 0; i + fl.length <= cl.length && hits.length < 2; i++){ let ok = true; for (let k = 0; k < fl.length; k++) if (cl[i + k].trim() !== fl[k]){ ok = false; break; } if (ok) hits.push(i); }
  if (hits.length === 1){ cl.splice(hits[0], fl.length, ...b.rep.split("\n")); return {text: cl.join("\n")}; }
  return {err: hits.length ? "matches more than one place" : "isn't in the code"};
}
// Check a whole AI answer against the current code. Returns {ok, files, count, problems, flags}.
function checkEdits(text){
  const {blocks, unfinished} = parseEdits(text), problems = [], files = {}, flags = new Set();
  if (!blocks.length) return {ok:false, count:0, problems:[unfinished ? "The AI's answer got cut off in the middle of a change." : "There are no changes in this answer. The AI has to use the FIND / REPLACE format."], files, flags:[]};
  const src = {}; (srcCache || []).forEach(f => src[f.path] = f.lines.join("\n"));
  blocks.forEach((b, i) => { const no = "Change " + (i + 1);
    if (!b.file){ problems.push(no + " doesn't say which FILE it's for."); return; }
    if (!SUB_FILES_RE.test(b.file) || SUB_NO_FILES.has(b.file)){ problems.push(no + " changes " + b.file + ". From here you can change any file in src/. Changes to " + b.file + " have to go through Massimo."); return; }
    const cur = files[b.file] != null ? files[b.file] : src[b.file];
    if (cur == null){ problems.push(no + " is for " + b.file + ", but that file doesn't exist. Add new code to an existing file instead."); return; }
    const r = applyEdit(cur, b);
    if (r.err){ problems.push(no + " (" + b.file + "): the FIND text " + r.err + ". It starts with: " + JSON.stringify((b.find.split("\n").find(x => x.trim()) || "").trim().slice(0, 80))); return; }
    files[b.file] = r.text;
    SUB_FLAGS.forEach(f => { if (b.find.includes(f) || b.rep.includes(f)) flags.add(f); });
  });
  if (unfinished) problems.push("The AI's answer got cut off at the end. Ask it to finish.");
  return {ok:!problems.length, count:blocks.length, problems, files, flags:[...flags]};
}
function fixMessageForAI(problems){
  return "CampusCord couldn't use your changes:\n- " + problems.join("\n- ") +
    "\n\nPlease send ALL the changes again in the exact format (FILE: line, then <<<<<<< FIND, =======, >>>>>>> REPLACE). Copy the FIND lines character for character from the code I gave you, include 2-5 lines so they're unique, and don't shorten anything with \"...\".";
}

// ---- the instructions + all the code, for the AI
function aiStarter(){
  const me = nickOf(S.uid);
  return `I'm ${me}, helping build CampusCord, a Discord-style chat app for our friend group (made by Massimo, the owner). I'm not a coder, so explain things simply and keep it short. You write all the code.

IMPORTANT: This file already contains ALL of CampusCord's code, below these instructions. NEVER ask me to paste code or "sections" of the file. Search this file yourself whenever you need to see something.

YOU CAN CHANGE ANYTHING IN src/ (the whole app: looks, features, the shop, everything). Massimo reviews every change before it goes live and turns down what he doesn't want, so don't refuse ideas because they seem big or touch something important. Just do them well.

HOW CAMPUSCORD WORKS (don't guess):
- There is NO backend server, NO SQL tables, NO API endpoints and NO routes. It's ONE web page: plain JavaScript in the browser (no React or frameworks) that talks straight to a Firebase Firestore database (collections and documents) using the Firebase modular SDK v10.12.2. Images are stored inside documents as data URLs.
- The files in src/ are joined into one page by a build script. All the .js files share ONE scope (no imports or exports between them), so a function in one file can be used in another. Before adding a function, search this file to make sure the name isn't already used, or the whole app crashes.
- Security lives in firestore.rules (who can read and write each collection). You can read it below, but I can't send changes to it from here. If a feature needs a NEW collection or new fields the rules don't allow yet (for example group chats), do this: give me the src/ changes as usual, AND write the exact firestore.rules changes plus tests for tests/rules.test.mjs in a separate section titled "FOR MASSIMO: DATABASE RULES". I'll send that part to Massimo, who adds it. Copy how the existing "dms" rules and tests work.
- Useful helpers: h(tag, attrs, ...children) builds HTML elements; S is the app state (S.uid = me, S.members, S.rooms, S.dms); nickOf(uid) gives a name; avatar(uid, "sm") gives an avatar; toast(text) shows a message; need("side","msgs") redraws parts of the screen; openChat(kind, id) opens a chat; modal((m, close) => {...}) opens a pop-up; isOwner() and isAdmin() check roles.
- Where things are in src/app.js: messages are drawn in "function messageEl", sending is "function send", chats open in "function openChat", DMs are "function openDM" and "function renderDMList", the left list is "function renderSide", the top bar is "function renderHeader", the right panel is "function renderRPanel". The shop is src/cosmetics.js, styles are src/style.css.

HOW TO WORK WITH ME:
1. When I give you an idea, first explain your plan in 2-4 simple sentences and ask if it's OK.
2. Then give me ALL the changes at once in EXACTLY this format. I paste your whole answer into CampusCord, which applies it automatically. I do NOT edit any files myself:

FILE: src/app.js
<<<<<<< FIND
(2-5 lines copied EXACTLY from the code below, so they only match one place)
=======
(what those lines should become)
>>>>>>> REPLACE

Rules for the format:
- Put a FILE: line before each block. Use as many blocks and files in src/ as you need.
- The FIND lines must match the code below character for character. Never shorten them with "..." and never make them up.
- To add brand-new code (a new function, new CSS), leave the FIND part EMPTY and it gets added to the END of that file.
- Don't change index.html or src/build.py.
3. If CampusCord tells me your changes have a problem, I'll paste you its message. Fix it and send ALL the changes again.

Got it? Ask me what I'd like to work on.

`;
}
function allCodeText(){ return "I attached CampusCord's code. Read the instructions at the top of the file and follow them.\n\n" + aiStarter() + "======================== ALL OF CAMPUSCORD'S CODE ========================\n\n" + (srcCache || []).map(f => "===== " + f.path + " =====\n" + f.lines.join("\n")).join("\n\n"); }

// ---- submissions
S.subs = [];
function watchSubs(){
  if (S.subsSub || !(isOwner() || isDev(S.uid))) return; S.subsSub = true;
  const q = isOwner() ? collection(db, "devSubs") : query(collection(db, "devSubs"), where("uid", "==", S.uid));
  onSnapshot(q, s => { S.subs = s.docs.map(d => Object.assign({id:d.id}, d.data())).sort((a, b) => b.ts - a.ts); need("rail"); if (S.kind === "dev") need("msgs"); }, () => {});
}
const subsWaiting = () => S.subs.filter(x => x.status === "ready").length;
async function sendSub(title, answer, check){
  const id = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  await setDoc(doc(db, "devSubs", id), {uid:S.uid, nick:nickOf(S.uid), title:title.slice(0, 100), answer:answer.slice(0, 300000), ts:Date.now(), status:"new"});
  return id;
}
async function decideSub(x, ok){
  try{ await updateDoc(doc(db, "devSubs", x.id), {status: ok ? "approved" : "rejecting", decidedAt:Date.now()}); toast(ok ? "Approved! It goes live in a few minutes." : "Turned down."); }
  catch(e){ toast("Couldn't save: " + errMsg(e)); }
}
function diffModal(x){
  modal((m, close) => {
    const pre = h("pre",{class:"diffview"});
    (x.diff || "No details yet.").split("\n").forEach(l => pre.append(h("span",{class: l.startsWith("+") && !l.startsWith("+++") ? "dadd" : l.startsWith("-") && !l.startsWith("---") ? "ddel" : l.startsWith("@@") ? "dhunk" : "", text:l + "\n"})));
    m.append(h("h3",{text:x.title}), h("p",{class:"note",text:"Green lines are added, red lines are removed. From " + (x.nick || "someone") + "."}), pre,
      h("div",{class:"foot"}, h("button",{class:"btn small",onclick:close},"Close")));
  }, "diffmodal");
}
const SUB_STATUS = {
  new:["⏳", "Testing it… this takes up to 10 minutes."],
  ready:["✅", "Passed the tests."],
  failed:["❌", "Didn't pass the tests."],
  approved:["🚀", "Approved! Going live in a few minutes…"],
  live:["🎉", "Live on CampusCord!"],
  error:["⚠️", "Couldn't put it live."],
  rejecting:["✖", "Turned down."], rejected:["✖", "Turned down."],
};
function subCard(x){
  const st = SUB_STATUS[x.status] || ["•", x.status];
  const card = h("div",{class:"subcard s-" + x.status},
    h("div",{class:"subtop"}, h("b",{text:x.title}), h("span",{class:"note",style:{margin:0},text:(isOwner() ? "from " + (x.nick || "someone") + " · " : "") + fmtDay(x.ts)})),
    h("div",{class:"subst"}, h("span",{text:st[0]}), h("span",{text: x.status === "ready" && !isOwner() ? "Passed the tests. Waiting for Massimo to approve it." : st[1]})),
    x.files ? h("div",{class:"note",style:{margin:"2px 0 0"},text:"Changes " + x.files.join(", ")}) : null,
    x.error ? h("div",{class:"suberr",text:x.error}) : null,
    x.flags && x.flags.length && isOwner() ? h("div",{class:"chalert",text:"⚠️ This touches payments or owner stuff (" + x.flags.join(", ") + "). Look at the code carefully before approving."}) : null);
  const btns = h("div",{class:"foot",style:{justifyContent:"flex-start",marginTop:"8px",flexWrap:"wrap",gap:"8px"}});
  if (isOwner() && x.status === "ready"){
    btns.append(h("button",{class:"btn approve", onclick:e => { e.currentTarget.disabled = true; decideSub(x, true); }}, ic("check"), " Approve & put it live"),
      h("button",{class:"btn ghost", onclick:() => confirmBox("Turn down \"" + x.title + "\"?", (x.nick || "They") + " can send a new version.", "Turn down", () => decideSub(x, false))}, "Turn down"));
  }
  if (x.diff) btns.append(h("button",{class:"btn small ghost", onclick:() => diffModal(x)}, "See the code"));
  if (!isOwner() && (x.status === "failed" || x.status === "error") && x.error) btns.append(h("button",{class:"btn small", onclick:() => copy(fixMessageForAI([x.error]), "Copied! Paste it to your AI so it can fix it.")}, ic("copy","sm"), " Copy a fix message for your AI"));
  if (["new", "failed", "error", "rejected", "live"].includes(x.status) && (isOwner() || x.uid === S.uid)) btns.append(h("button",{class:"btn small ghost", onclick:() => deleteDoc(doc(db, "devSubs", x.id)).catch(e => toast(errMsg(e)))}, x.status === "live" ? "Clear" : "Remove"));
  if (btns.children.length) card.append(btns);
  return card;
}

// ---- the easy panel
function easyPanelEl(){
  const box = h("div",{class:"easy"});
  const step = (n, title, text, ...rest) => h("div",{class:"estep"}, h("div",{class:"gnum",text:String(n)}), h("div",{class:"gbody"}, h("b",{text:title}), text ? h("p",{text}) : null, ...rest));
  // 1
  const dl = h("button",{class:"btn", onclick:async () => { const old = dl.innerHTML; dl.disabled = true; dl.textContent = "Getting the code…";
      try{ await loadSources(); const a = h("a",{href:URL.createObjectURL(new Blob([allCodeText()], {type:"text/plain"})), download:"campuscord-for-ai.txt"}); document.body.appendChild(a); a.click(); a.remove(); toast("Downloaded! Now attach it in Gemini."); }
      catch(e){ toast("Couldn't get the code. Check your internet and try again."); }
      dl.disabled = false; dl.innerHTML = old; }}, ic("arrowdown","sm"), " Download the code file");
  // 3
  const title = h("input",{class:"inp", maxlength:"100", placeholder:"What does it do? e.g. Purple send button"});
  const ans = h("textarea",{class:"inp eans", rows:"6", placeholder:"Paste the AI's whole answer here (the part with <<<<<<< FIND in it). Extra text around it is fine."});
  const res = h("div",{class:"eres"});
  const send = h("button",{class:"btn approve", disabled:""}, "Send to Massimo");
  let last = null;
  const check = async () => { res.innerHTML = ""; send.disabled = true; last = null; const v = ans.value; if (!v.trim()) return;
    try{ await loadSources(); }catch(e){ res.append(h("p",{class:"note",text:"Couldn't load the code to check it. Check your internet."})); return; }
    const c = checkEdits(v); last = c;
    if (c.ok){ res.append(h("div",{class:"eok"}, "✓ ", h("b",{text:c.count + " change" + (c.count === 1 ? "" : "s")}), " in " + Object.keys(c.files).join(", ") + " look good.")); send.disabled = !title.value.trim(); if (!title.value.trim()) res.append(h("p",{class:"note",style:{margin:"4px 0 0"},text:"Now type what it does above, then press Send."})); }
    else res.append(h("div",{class:"ebad"}, h("b",{text:"The AI made a mistake, so this can't be sent yet:"}), h("ul",null, c.problems.map(p => h("li",{text:p}))),
      h("button",{class:"btn small", onclick:() => copy(fixMessageForAI(c.problems), "Copied! Paste it to your AI, then paste its new answer here.")}, ic("copy","sm"), " Copy a fix message for your AI")));
  };
  let t = null; ans.addEventListener("input", () => { clearTimeout(t); t = setTimeout(check, 350); });
  title.addEventListener("input", () => { if (last && last.ok) send.disabled = !title.value.trim(); });
  send.onclick = async () => { if (!last || !last.ok || !title.value.trim()) return; send.disabled = true; send.textContent = "Sending…";
    try{ await sendSub(title.value.trim(), ans.value, last); toast("Sent! It's being tested now. You'll see it below."); ans.value = ""; title.value = ""; res.innerHTML = ""; last = null; }
    catch(e){ toast("Couldn't send: " + errMsg(e)); }
    send.textContent = "Send to Massimo"; };
  box.append(h("div",{class:"ehead"}, h("h3",{text:"Make a change in 3 steps"}), h("span",{class:"note",style:{margin:0},text:"No GitHub needed. Massimo approves every change."})),
    step(1, "Give your AI all the code", null,
      h("ol",{class:"esub"},
        h("li",null, "Press ", h("b",{text:"Download the code file"}), "."),
        h("li",null, "Open Gemini and start a ", h("b",{text:"new chat"}), "."),
        h("li",null, "Click the ", h("b",{text:"+"}), " next to the message box and attach ", h("b",{text:"campuscord-for-ai.txt"}), " (it's in your Downloads)."),
        h("li",null, "Press send. If Gemini wants you to type something, just type ", h("b",{text:"go"}), ".")),
      h("div",{class:"gbtns"}, dl, h("a",{class:"btn ghost", href:"https://gemini.google.com/app", target:"_blank", rel:"noopener"}, "Open Gemini"))),
    step(2, "Tell the AI your idea", "Just chat in normal words, like \"make the send button purple\" or \"add a dark green theme\". When it's ready, it gives you the changes in a special format with <<<<<<< FIND in it."),
    step(3, "Paste the AI's answer and send it", null, title, ans, res, h("div",{class:"gbtns"}, send)));
  return box;
}
function subsListEl(){
  const list = S.subs.filter(x => isOwner() || x.uid === S.uid);
  const wrap = h("div",{class:"subs"}, h("div",{class:"chtop"}, h("h4",{text: isOwner() ? "Changes from your helpers" : "Your changes"})));
  if (!list.length) wrap.append(h("p",{class:"note",text: isOwner() ? "Nothing yet. When a helper sends a change, it shows up here with an Approve button." : "Nothing sent yet. Your changes show up here after you send them."}));
  list.slice(0, 15).forEach(x => wrap.append(subCard(x)));
  return wrap;
}
