// =====================================================================
//  CampusCord v3 — single-file client. Firebase config below.
// =====================================================================
const firebaseConfig = __FIREBASE_CONFIG__;

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, collection, onSnapshot, setDoc, updateDoc, deleteDoc, getDocs, query, where, orderBy, limit, writeBatch, arrayUnion, arrayRemove, deleteField } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Bump APP_VERSION (and version.json) on every release so open tabs offer a refresh.
const APP_VERSION = "__APP_VERSION__";
const LIVE_URL = "https://campus-cord.github.io/";

// ---------------------------------------------------------------- constants
const COLORS = ["#7c5cff","#3fb8ff","#3ecf7a","#f5b83d","#f0565c","#ff7ac6","#22d3c5","#ff9447"];
const QUICK = ["👍","❤️","😂","😮","😢","🔥","💀","🎉"];
const EMOJIS = "😀 😃 😄 😁 😆 😅 🤣 😂 🙂 😉 😊 😇 🥰 😍 🤩 😘 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 😮‍💨 🤥 😌 😔 😪 😴 😷 🤒 🤕 🤢 🤮 🥵 🥶 🥴 😵 🤯 🤠 🥳 😎 🤓 🧐 😕 😟 🙁 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 💀 ☠️ 💩 🤡 👻 👽 🤖 🙈 🙉 🙊 💯 💥 💫 💦 💨 💬 💭 💤 👋 🤚 ✋ 🖖 👌 🤌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 👍 👎 ✊ 👊 👏 🙌 👐 🤲 🤝 🙏 💪 🧠 👀 🫡 🫠 🫶 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 ❣️ 💕 💞 💓 💗 💖 💘 🔥 ✨ ⭐ 🌟 ⚡ 🌈 ☀️ 🌙 ❄️ 🎉 🎊 🎈 🎁 🏆 🥇 🎮 🕹️ 🎧 🎵 🎶 📚 📝 ✏️ 📌 📎 💻 📱 ☕ 🍕 🍔 🍟 🌮 🍿 🍩 🍪 🎂 🍦 🧃 🥤 🐶 🐱 🐸 🐵 🦄 🐢 🐍 🦖 🐙 🦋 🌸 🌵 🍀 🚀 ✈️ 🚗 🏀 ⚽ 🏈 ⚾ 🎾 🏐 ✅ ❌ ⚠️ ❓ ❗ 💡 🔔 🔒 🗿 🤷 🤦 🙋 💁 🙆 🙅".split(" ");
const ONLINE_MS = 75000, HEARTBEAT_MS = 30000, PAGE = 100;

const THEMES = [
  {id:"dark", name:"Dark", c:["#17181c","#22242a","#2b2d34"]},
  {id:"amoled", name:"Pitch Black", c:["#000","#0a0a0b","#000"]},
  {id:"light", name:"Light", c:["#e3e5e8","#f2f3f5","#ffffff"]},
  {id:"midnight", name:"Midnight", c:["#0d0b1e","#15122e","#1b1739"], premium:true},
  {id:"ocean", name:"Ocean", c:["#04161f","#0a2230","#0e2c3d"], premium:true},
  {id:"sunset", name:"Sunset", c:["#1d0f17","#2a1520","#331a27"], premium:true},
  {id:"forest", name:"Forest", c:["#0d1710","#142219","#1a2b20"], premium:true},
  {id:"sakura", name:"Sakura", c:["#f7dce6","#fdeef3","#fff7fa"], premium:true},
];
const ACCENTS = ["#7c5cff","#5865f2","#3fb8ff","#22d3c5","#3ecf7a","#f5b83d","#ff9447","#f0565c","#ff7ac6"];
const NAME_FX = [{id:"rainbow",name:"Rainbow"},{id:"gold",name:"Gold"},{id:"fire",name:"Fire"},{id:"ocean",name:"Ocean"},{id:"neon",name:"Neon"},{id:"prism",name:"Prism",ex:true},{id:"aurora",name:"Aurora",ex:true}];
const STATUSES = [{id:"online",name:"Online",d:""},{id:"idle",name:"Idle",d:"Shows a moon"},{id:"dnd",name:"Do Not Disturb",d:"Mutes your notifications"},{id:"invisible",name:"Invisible",d:"Look offline to others"}];

// ---------------------------------------------------------------- icons (Lucide, MIT)
const ICONS = {
  message:'<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  hash:'<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
  megaphone:'<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  sparkles:'<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M5 3v4M3 5h4M19 17v4M17 19h4"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  pin:'<path d="M12 17v5"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  plus:'<path d="M5 12h14M12 5v14"/>',
  pluscircle:'<circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>',
  smile:'<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  smileplus:'<path d="M22 11v1a10 10 0 1 1-9-10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01M16 5h6M19 2v6"/>',
  reply:'<path d="M9 14 4 9l5-5"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>',
  pencil:'<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  copy:'<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  trash:'<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  crown:'<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zM5 20h14"/>',
  code:'<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  gem:'<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6M2 9h20"/>',
  chevron:'<path d="m6 9 6 6 6-6"/>',
  chevronup:'<path d="m18 15-6-6-6 6"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  bag:'<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
  lock:'<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  image:'<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  palette:'<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.83-.44-1.12-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/>',
  wand:'<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72ZM14 7l3 3M5 6v4M19 14v4M10 2v2M7 8H3M21 16h-4M11 3H9"/>',
  zap:'<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  arrowdown:'<path d="M12 5v14M19 12l-7 7-7-7"/>',
  bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  receipt:'<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 17.5v-11"/>',
  grid:'<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  keyboard:'<rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>',
  alert:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
  camera:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  star:'<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  hourglass:'<path d="M5 22h14M5 2h14M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/>',
};
function ic(name, cls){ const s = document.createElement("span"); s.className = "i" + (cls ? " " + cls : ""); s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || "") + "</svg>"; return s; }

// Perk shop. Prices/links are set by the owner in Admin → Shop (stored in config/shop).
const CATALOG = [
  {id:"plus", icon:"sparkles", name:"Campus+", price:"$2.99 / month", months:1, tier:1,
   desc:"The essentials, all in one.", list:["PLUS rank badge next to your name","5 animated name effects","All 5 premium themes","Custom profile banner","Bigger uploads (GIFs up to 900 KB)"]},
  {id:"plusplus", icon:"zap", name:"Campus++", price:"$5.99 / month", months:1, tier:2,
   desc:"Everything in Campus+, turned all the way up.", list:["Everything in Campus+","Holographic PLUS+ rank badge","Exclusive Prism & Aurora name effects","Animated glowing avatar ring","Gradient profile banner","Listed in its own Campus++ section"]},
  {id:"name_fx", icon:"wand", name:"Animated Name", price:"$1.99", desc:"Rainbow, Gold, Fire, Ocean or Neon — your name shimmers everywhere."},
  {id:"themes", icon:"palette", name:"Theme Pack", price:"$0.99", desc:"Unlock Midnight, Ocean, Sunset, Forest and Sakura."},
  {id:"banner", icon:"image", name:"Profile Banner", price:"$0.99", desc:"Pick a custom banner color for your profile card."},
  {id:"supporter", icon:"gem", name:"Supporter Badge", price:"$0.99", desc:"A gem badge next to your name to show you back CampusCord."},
];
const PLUS_INCLUDES = ["name_fx","themes","banner","big_uploads","supporter"];
const PLUSPLUS_INCLUDES = [...PLUS_INCLUDES, "plus", "fx_exclusive", "ring", "banner_gradient"];

const SLASH = [
  {c:"shrug", a:"[message]", d:"Appends ¯\\_(ツ)_/¯"},
  {c:"tableflip", a:"[message]", d:"(╯°□°)╯︵ ┻━┻"},
  {c:"unflip", a:"[message]", d:"┬─┬ノ( º _ ºノ)"},
  {c:"lenny", a:"[message]", d:"( ͡° ͜ʖ ͡°)"},
  {c:"me", a:"<action>", d:"Says it as an action"},
  {c:"spoiler", a:"<message>", d:"Hides your message behind a spoiler"},
  {c:"roll", a:"[sides]", d:"Rolls a die (default 6)"},
  {c:"flip", a:"", d:"Flips a coin"},
  {c:"nick", a:"<new name>", d:"Changes your display name"},
  {c:"status", a:"<text>", d:"Sets your custom status"},
];

// ---------------------------------------------------------------- prefs (per device)
const DEFAULT_PREFS = {theme:"dark", accent:"", fs:15, compact:false, time24:false, reduceMotion:false, sound:true, desktop:"mentions", collapsed:{}, showMembers:true, enterSends:true};
let prefs = Object.assign({}, DEFAULT_PREFS, store("prefs") || {});
function savePrefs(){ store("prefs", prefs); }
function applyPrefs(){
  const theme = THEMES.find(t => t.id === prefs.theme) || THEMES[0];
  const allowed = !theme.premium || (S.uid && hasPerk(S.uid, "themes"));
  const r = document.documentElement;
  r.dataset.theme = allowed ? theme.id : "dark";
  r.style.setProperty("--accent", prefs.accent || "#7c5cff");
  r.style.setProperty("--fs", (prefs.fs || 15) + "px");
  r.classList.toggle("compact", !!prefs.compact);
  r.classList.toggle("reduce-motion", !!prefs.reduceMotion);
}

// ---------------------------------------------------------------- state
const S = {
  uid:null, config:null, configLoaded:false, invite:null, shop:{},
  rooms:[], members:{}, membersLoaded:false, profiles:{}, perks:{}, orders:[], myOrders:[],
  kind:"room", cur:null, mode:"server", msgs:[], reacts:[], typing:[], gifs:[], meta:{}, dms:[],
  msgLimit:PAGE, olderLoading:false, hasMore:false, roomLoaded:false,
  unsubRoom:[], unsubApp:[], pending:null, replyTo:null, editing:null, joinColor:COLORS[0],
  hiddenCount:0, loadedAt:Date.now(), lastRead:store("lastRead") || {}, mentions:store("mentions") || {}, notified:{},
  routed:null, rpanel:"members", searchQ:"", pins:null, ac:null
};
let db, auth;

// ---------------------------------------------------------------- helpers
function store(k, v){ try{ if (v === undefined) return JSON.parse(localStorage.getItem("cc_"+k)); localStorage.setItem("cc_"+k, JSON.stringify(v)); }catch(e){ return null; } }
const $ = id => document.getElementById(id);
// let append()/prepend() skip null/false children so conditional UI stays tidy
for (const fn of ["append","prepend"]){ const orig = Element.prototype[fn]; Element.prototype[fn] = function(...a){ return orig.apply(this, a.flat(Infinity).filter(x => x != null && x !== false)); }; }
function h(tag, props, ...kids){
  const e = document.createElement(tag);
  if (props) for (const k in props){ const v = props[k]; if (v == null || v === false) continue;
    if (k === "class") e.className = v; else if (k === "text") e.textContent = v; else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else if (k === "style") Object.assign(e.style, v);
    else e.setAttribute(k, v === true ? "" : v); }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : String(c));
  return e;
}
function toast(t){ const d = h("div",{class:"toast",text:t}); document.body.appendChild(d); setTimeout(()=>d.remove(), 3400); }
function rid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function eKey(e){ return [...e].map(c => c.codePointAt(0).toString(16)).join("-"); }
function initials(n){ n = (n||"?").trim(); const p = n.split(/\s+/); return ((p[0]||"?")[0] + (p[1] ? p[1][0] : "")).toUpperCase(); }
function show(id){ ["g-load","g-setup","g-join","g-msg","app"].forEach(x => $(x).classList.toggle("hidden", x !== id)); }
function gateMsg(t, s, showId){ $("gm-t").textContent = t; $("gm-s").textContent = s; $("gm-id").textContent = showId && S.uid ? "Your ID: " + S.uid + "  (click to copy)" : ""; $("gm-id").onclick = () => copy(S.uid, "ID copied"); show("g-msg"); }
function fmtTime(ts){ return new Date(ts).toLocaleTimeString([], {hour:"numeric", minute:"2-digit", hour12:!prefs.time24}); }
function dayLabel(ts){ const d = new Date(ts), n = new Date(), y = new Date(); y.setDate(n.getDate()-1);
  if (d.toDateString() === n.toDateString()) return "Today"; if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], {weekday:"long", month:"long", day:"numeric", year: d.getFullYear() === n.getFullYear() ? undefined : "numeric"}); }
function fmtDay(ts){ const l = dayLabel(ts); return (l === "Today" || l === "Yesterday" ? l : new Date(ts).toLocaleDateString()) + " at " + fmtTime(ts); }
function slug(s){ return s.toLowerCase().trim().replace(/\s+/g,"-").replace(/[^a-z0-9\-_]/g,"").slice(0,32); }
function errMsg(e){ return e && e.code === "permission-denied" ? "permission denied (the admin may need to publish the latest Firestore rules)" : (e && (e.message || e.code)) || String(e); }
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function reEsc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function copy(t, msg){ (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast(msg || "Copied"), () => toast("Couldn't copy — select it and copy manually")); }

// identity
const isOwnerUid = uid => !!(S.config && S.config.ownerUid === uid);
const isOwner = () => isOwnerUid(S.uid);
const isDev = uid => !!(S.config && (S.config.admins||[]).includes(uid));
const isAdmin = () => isOwner() || (isDev(S.uid) && !!member(S.uid));
function member(uid){ return S.members[uid] || null; }
function profile(uid){ return S.profiles[uid] || {}; }
function nickOf(uid){ const m = member(uid); return (m && m.nick) || "Former member"; }
function colorOf(uid){ const m = member(uid); return (m && m.color) || "#6f7480"; }
function isBanned(uid){ return !!(S.config && Array.isArray(S.config.banned) && S.config.banned.includes(uid)); }
function perkActive(entry){ return !!entry && (!entry.until || entry.until > Date.now()); }
function hasPerk(uid, key){
  if (isOwnerUid(uid)) return true;
  const items = (S.perks[uid] && S.perks[uid].items) || {};
  if (perkActive(items[key])) return true;
  if (PLUS_INCLUDES.includes(key) && perkActive(items.plus)) return true;
  if (PLUSPLUS_INCLUDES.includes(key) && perkActive(items.plusplus)) return true;
  return false;
}
function hasPlus(uid){ return hasPerk(uid, "plus"); }
// rank for display: "plusplus" | "plus" | "supporter" | null (the owner shows ADMIN instead)
function rankOf(uid){ const items = ((S.perks[uid]||{}).items)||{};
  if (perkActive(items.plusplus)) return "plusplus"; if (perkActive(items.plus)) return "plus"; if (perkActive(items.supporter)) return "supporter"; return null; }
function statusOf(uid){
  const p = profile(uid), m = member(uid);
  if (uid === S.uid) return p.status === "invisible" ? "offline" : (p.status || "online");
  if (!m || !m.lastSeen || Date.now() - m.lastSeen > ONLINE_MS || p.status === "invisible") return "offline";
  return p.status === "idle" || p.status === "dnd" ? p.status : "online";
}
const isOn = uid => statusOf(uid) !== "offline";
function fxOf(uid){ if (!hasPerk(uid, "name_fx")) return null; const f = profile(uid).nameFx; if (f === "none") return null;
  const fx = NAME_FX.find(x => x.id === f); if (fx && (!fx.ex || hasPerk(uid, "fx_exclusive"))) return f; return isOwnerUid(uid) ? "rainbow" : null; }
function paintName(node, uid){ const fx = fxOf(uid); if (fx){ node.classList.add("fx","fx-"+fx); } else node.style.color = colorOf(uid); return node; }
const AV_BGS = [
  {id:"sunset", g:"linear-gradient(135deg,#ff7ac6,#ffd166)"}, {id:"ocean", g:"linear-gradient(135deg,#22d3c5,#3fb8ff)"},
  {id:"grape", g:"linear-gradient(135deg,#c084fc,#7c5cff)"}, {id:"lime", g:"linear-gradient(135deg,#3ecf7a,#c6f36b)"},
  {id:"fire", g:"linear-gradient(135deg,#ff4d4d,#ff9447)"}, {id:"night", g:"linear-gradient(135deg,#2b2d64,#5865f2)"},
  {id:"candy", g:"linear-gradient(135deg,#ff7ac6,#7ef0e6)"}, {id:"gold", g:"linear-gradient(135deg,#ffe08a,#f5a524)"},
  {id:"mint", g:"linear-gradient(135deg,#a7f3d0,#22d3c5)"}, {id:"berry", g:"linear-gradient(135deg,#f0565c,#a78bfa)"},
  {id:"steel", g:"linear-gradient(135deg,#94a3b8,#475569)"}, {id:"holo", g:"conic-gradient(from 210deg,#ff7ac6,#ffd166,#7ef0e6,#a78bfa,#ff7ac6)"},
];
const AV_FACES = "😎 🤠 🥳 🤓 😈 👻 👽 🤖 💀 🤡 🐸 🐱 🐶 🦊 🐼 🐨 🐯 🦁 🐵 🐧 🦄 🐙 🦖 🐢 🐝 🦋 🍕 🍩 🍉 🌮 ⚡ 🔥 ⭐ 🌙 🌈 ❄️ 🎮 🎧 ⚽ 🏀 🎨 🚀 💎 👑 🍀 🌸".split(" ");
// The avatar look is stored in the profile's "avatar" field as "look:<bg>|<face>" so it fits the published rules.
function lookOf(uid){ const a = profile(uid).avatar; if (typeof a === "string" && a.startsWith("look:")){ const [bg, face] = a.slice(5).split("|"); return {bg:bg || "", face:face || ""}; } return {}; }
function avatar(uid, size, withDot){
  const look = lookOf(uid);
  const face = look.face && AV_FACES.includes(look.face) ? look.face : null;
  const a = h("div",{class:"av" + (size ? " "+size : "") + (face ? " emo" : "")}, face || initials(nickOf(uid)));
  const bg = AV_BGS.find(b => b.id === look.bg);
  if (bg) a.style.background = bg.g;
  else { a.style.background = (look.bg && /^#[0-9a-f]{6}$/i.test(look.bg)) ? look.bg : colorOf(uid); a.style.backgroundImage = "linear-gradient(145deg, rgba(255,255,255,.18), rgba(0,0,0,.18))"; }
  if (hasPerk(uid, "ring")) a.classList.add("ring");
  if (withDot) a.appendChild(h("span",{class:"dot " + statusOf(uid), title:{online:"Online",idle:"Idle",dnd:"Do Not Disturb",offline:"Offline"}[statusOf(uid)]}));
  return a;
}
let CHIP_MINI = false;
function chip(cls, iconName, text, title){ return h("span",{class:"tag " + cls + (CHIP_MINI ? " mini" : ""), title: title || null}, iconName ? ic(iconName) : null, text && !CHIP_MINI ? h("b",{text}) : null); }
function miniTags(uid){ CHIP_MINI = true; try{ return roleTags(uid, true); } finally { CHIP_MINI = false; } }
function roleTags(uid, compact){
  const out = [];
  if (isOwnerUid(uid)) out.push(chip("admin","crown","ADMIN","Server admin"));
  else if (isDev(uid)) out.push(chip("dev","code","DEV","Developer"));
  const r = rankOf(uid);
  if (r === "plusplus") out.push(chip("pp","zap","PLUS+","Campus++"));
  else if (r === "plus") out.push(chip("plus","sparkles","PLUS","Campus+"));
  else if (r === "supporter") out.push(chip("sup","gem", compact ? "" : "SUPPORTER","Supporter"));
  return out;
}
function gem(){ return null; }

// render scheduler
const dirty = new Set(); let raf = 0;
function need(...k){ k.forEach(x => dirty.add(x)); if (!raf) raf = requestAnimationFrame(flush); }
function flush(){ raf = 0; if (S.routed !== "app"){ dirty.clear(); return; } const d = [...dirty]; dirty.clear();
  for (const k of d){ try{ ({rail:renderRail, side:renderSide, header:renderHeader, msgs:renderMessages, rpanel:renderRPanel, me:renderMe, composer:renderComposer, typing:renderTyping, gifs:renderGifs}[k] || (()=>{}))(); }catch(e){ console.error("render", k, e); } } }

// ---------------------------------------------------------------- boot
function boot(){
  applyPrefs();
  document.querySelectorAll("[data-ic]").forEach(b => b.prepend(ic(b.dataset.ic)));
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "PASTE_HERE"){ gateMsg("Not configured", "Paste your Firebase config at the top of the script."); return; }
  try{ const app = initializeApp(firebaseConfig); auth = getAuth(app); db = getFirestore(app); }
  catch(e){ gateMsg("Firebase config problem", "Double-check the Firebase config in this file. (" + errMsg(e) + ")"); return; }
  const t = setTimeout(() => { $("loadmsg").textContent = "Still connecting… check your internet connection."; }, 10000);
  onAuthStateChanged(auth, user => {
    if (!user){ signInAnonymously(auth).catch(e => { clearTimeout(t); gateMsg("Couldn't sign in", "Anonymous sign-in must be on in Firebase → Authentication. (" + errMsg(e) + ")"); }); return; }
    clearTimeout(t);
    if (S.uid === user.uid) return;
    S.uid = user.uid; start();
  });
}

function start(){
  onSnapshot(doc(db, "config/main"), snap => {
    S.config = snap.exists() ? snap.data() : null; S.configLoaded = true;
    if (isAdmin() && !S.inviteSub){ S.inviteSub = onSnapshot(doc(db, "secret/invite"), s => { S.invite = s.exists() ? s.data().code : null; }, ()=>{}); }
    route(); applyPrefs(); need("rail","side","header","msgs","rpanel","me","composer");
  }, e => gateMsg("Couldn't load CampusCord", "Make sure the Firestore rules are published. (" + errMsg(e) + ")"));
  onSnapshot(collection(db, "members"), snap => {
    const m = {}; snap.docs.forEach(d => m[d.id] = d.data()); S.members = m; S.membersLoaded = true;
    route(); need("side","msgs","rpanel","me","header","typing");
  }, e => gateMsg("Couldn't load CampusCord", "Make sure the Firestore rules are published. (" + errMsg(e) + ")"));
  // optional collections (need v3 rules) — fail quietly
  onSnapshot(collection(db, "profiles"), snap => { const p = {}; snap.docs.forEach(d => p[d.id] = d.data()); S.profiles = p; need("side","msgs","rpanel","me","header"); }, () => {});
  onSnapshot(collection(db, "perks"), snap => { const p = {}; snap.docs.forEach(d => p[d.id] = d.data()); S.perks = p; applyPrefs(); need("side","msgs","rpanel","me"); }, () => {});
}

function route(){
  if (!S.configLoaded) return;
  if (!S.config){
    if (S.routed !== "setup"){ S.routed = "setup"; $("su-code").value = Math.random().toString(36).slice(2,8).toUpperCase(); show("g-setup"); }
    return;
  }
  if (!S.membersLoaded) return;
  if (S.joining) return; // wait for Firebase to confirm the join before switching screens
  if (isBanned(S.uid) && !isOwner()){ kickedOut(); return; }
  if (!member(S.uid)){
    if (S.routed === "app"){ stopAppSubs(); S.routed = null; }
    if (S.routed !== "join"){ S.routed = "join"; setupJoin(); show("g-join"); }
    return;
  }
  if (S.routed !== "app"){ S.routed = "app"; show("app"); initApp(); }
}
function kickedOut(){ S.routed = "banned"; stopAppSubs(); gateMsg("You've been removed", "An admin kicked this account from CampusCord. If that's a mistake, ask the admin to unban you.", true); }

// ---------------------------------------------------------------- setup + join
$("su-go").onclick = async () => {
  const code = $("su-code").value.trim();
  const names = [...new Set($("su-rooms").value.split(",").map(slug).filter(Boolean))];
  if (code.length < 3){ $("su-err").textContent = "Invite code needs at least 3 characters."; return; }
  if (!names.length) names.push("general");
  $("su-go").disabled = true; $("su-err").textContent = "";
  try{
    const b = writeBatch(db);
    b.set(doc(db, "config/main"), {ownerUid:S.uid, banned:[], admins:[], serverName:"CampusCord", createdAt:Date.now()});
    b.set(doc(db, "secret/invite"), {code});
    await b.commit();
    let i = 0;
    for (const n of names) await setDoc(doc(db, "rooms", n + "-" + rid().slice(-4)), {name:n, topic:"", category:"Text rooms", order:i++, createdAt:Date.now()});
  }catch(e){ $("su-err").textContent = "Couldn't save: " + errMsg(e); $("su-go").disabled = false; }
};
function setupJoin(){
  const wrap = $("j-colors"); wrap.innerHTML = "";
  S.joinColor = COLORS[Math.floor(Math.random()*COLORS.length)];
  COLORS.forEach(c => { const b = h("button",{class: c === S.joinColor ? "on" : "", style:{background:c}, onclick: () => { S.joinColor = c; [...wrap.children].forEach(x => x.classList.remove("on")); b.classList.add("on"); }}); wrap.appendChild(b); });
  if (isOwner()){ $("j-codewrap").classList.add("hidden"); $("j-title").textContent = "Welcome back, admin"; $("j-sub").textContent = "Choose the name your friends will see."; }
  $("j-id").textContent = "Your ID: " + S.uid + "  (click to copy)";
  $("j-id").onclick = () => copy(S.uid, "ID copied");
  setTimeout(()=> $("j-nick").focus(), 50);
}
async function doJoin(){
  const nick = $("j-nick").value.trim(); const code = $("j-code").value.trim();
  if (nick.length < 2){ $("j-err").textContent = "Pick a name with at least 2 characters."; return; }
  $("j-go").disabled = true; $("j-err").textContent = "Joining…";
  S.joining = true;
  try{ await setDoc(doc(db, "members", S.uid), {nick, color:S.joinColor, joinedAt:Date.now(), lastSeen:Date.now(), code: isOwner() ? "" : code}); $("j-err").textContent = ""; }
  catch(e){
    $("j-err").textContent = e.code !== "permission-denied" ? "Couldn't join: " + errMsg(e)
      : isBanned(S.uid) ? "This account was kicked. Ask the admin to unban you."
      : isOwner() ? "Firebase refused the join. Make sure the latest Firestore rules are published."
      : "That invite code isn't right. (Admin? Your ID below doesn't match ownerUid in Firebase yet.)";
    $("j-go").disabled = false;
  }
  finally{ S.joining = false; route(); }
}
$("j-go").onclick = doJoin;
$("j-nick").onkeydown = $("j-code").onkeydown = e => { if (e.key === "Enter") doJoin(); };

// ---------------------------------------------------------------- app init
function stopAppSubs(){ S.unsubApp.forEach(u => u()); S.unsubApp = []; S.unsubRoom.forEach(u => u()); S.unsubRoom = []; clearInterval(S.hb); }
function initApp(){
  S.unsubApp.push(onSnapshot(collection(db, "rooms"), snap => {
    S.allRooms = snap.docs.map(d => Object.assign({id:d.id}, d.data()));
    S.rooms = S.allRooms.filter(canSeeRoom).sort((a,b) => (a.order||0) - (b.order||0) || (a.createdAt||0) - (b.createdAt||0));
    if (S.kind === "room" && S.cur && !S.rooms.find(r => r.id === S.cur)) S.cur = null;
    if (!S.cur && S.rooms.length){ const saved = store("chat"); if (saved && saved.kind === "dm") openChat("dm", saved.id); else openChat("room", S.rooms.find(r => saved && r.id === saved.id) ? saved.id : S.rooms[0].id); }
    need("side","header","composer");
  }, ()=>{}));
  S.unsubApp.push(onSnapshot(collection(db, "meta"), snap => {
    snap.docChanges().forEach(c => { if (c.type === "removed") return; const d = c.doc.data(), id = c.doc.id;
      if (!S.rooms.find(x => x.id === id)) return;
      if (d.lastUid !== S.uid && d.lastTs > S.loadedAt && S.notified["r:"+id] !== d.lastTs){
        S.notified["r:"+id] = d.lastTs;
        const mine = (d.lastMentions||[]).includes(S.uid) || d.lastEveryone;
        const viewing = S.kind === "room" && S.cur === id && !document.hidden;
        if (mine && !viewing){ S.mentions[id] = (S.mentions[id]||0) + 1; store("mentions", S.mentions); const r = S.rooms.find(x => x.id === id);
          notify((d.lastNick || "Someone") + " in #" + (r ? r.name : "room"), d.lastPreview || "mentioned you", "room", id, true); }
        else if (!viewing && !mine && prefs.desktop === "all"){ const r = S.rooms.find(x => x.id === id); notify((d.lastNick || "Someone") + " in #" + (r ? r.name : "room"), d.lastPreview || "", "room", id, false); }
      } });
    const m = {}; snap.docs.forEach(d => m[d.id] = d.data()); S.meta = m; need("side","rail");
  }, ()=>{}));
  S.unsubApp.push(onSnapshot(query(collection(db, "dms"), where("users","array-contains",S.uid)), snap => {
    snap.docChanges().forEach(c => { if (c.type === "removed") return; const d = c.doc.data(), id = c.doc.id;
      if (d.lastUid && d.lastUid !== S.uid && d.lastTs > S.loadedAt && S.notified["d:"+id] !== d.lastTs){
        S.notified["d:"+id] = d.lastTs;
        const viewing = S.kind === "dm" && S.cur === id && !document.hidden;
        if (!viewing){ notify(nickOf(d.lastUid), d.lastPreview || "sent you a message", "dm", id, true); if (document.hidden){ S.hiddenCount++; updateTitle(); } }
      } });
    S.dms = snap.docs.map(d => Object.assign({id:d.id}, d.data())).sort((a,b) => (b.lastTs||b.createdAt||0) - (a.lastTs||a.createdAt||0));
    need("side","rail","header");
  }, e => console.warn("DMs unavailable", e)));
  S.unsubApp.push(onSnapshot(query(collection(db, "gifs"), orderBy("ts","desc"), limit(60)), snap => { S.gifs = snap.docs.map(d => Object.assign({id:d.id}, d.data())); need("gifs"); }, ()=>{}));
  S.unsubApp.push(onSnapshot(doc(db, "config/shop"), s => { S.shop = s.exists() ? s.data() : {}; refreshOpenPane(); }, ()=>{}));
  S.unsubApp.push(onSnapshot(query(collection(db, "orders"), where("uid","==",S.uid)), s => { S.myOrders = s.docs.map(d => Object.assign({id:d.id}, d.data())); refreshOpenPane(); }, ()=>{}));
  if (isOwner()) S.unsubApp.push(onSnapshot(collection(db, "orders"), s => { S.orders = s.docs.map(d => Object.assign({id:d.id}, d.data())).sort((a,b) => b.ts - a.ts); need("rail"); refreshOpenPane(); }, ()=>{}));
  heartbeat(); S.hb = setInterval(heartbeat, HEARTBEAT_MS);
  setInterval(() => need("rpanel","typing","side","header"), 15000);
  buildEmojiGrid();
  need("rail","side","header","msgs","rpanel","me","composer","gifs");
  $("input").focus();
  handleReturnFromCheckout();
}
function heartbeat(){ if (!member(S.uid)) return; const inv = profile(S.uid).status === "invisible"; if (inv && S.sentInvisible) return; S.sentInvisible = inv;
  updateDoc(doc(db, "members", S.uid), {lastSeen: inv ? 0 : Date.now()}).catch(()=>{}); }
window.addEventListener("beforeunload", () => { if (member(S.uid)) updateDoc(doc(db, "members", S.uid), {lastSeen:0}).catch(()=>{}); });

// ---------------------------------------------------------------- notifications
let audioCtx = null;
function ping(){ if (!prefs.sound) return; try{ audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  const t = audioCtx.currentTime; [880, 1320].forEach((f, i) => { const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t + i*0.09); g.gain.exponentialRampToValueAtTime(0.12, t + i*0.09 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + i*0.09 + 0.18);
    o.connect(g).connect(audioCtx.destination); o.start(t + i*0.09); o.stop(t + i*0.09 + 0.2); }); }catch(e){} }
function notify(title, body, kind, id, important){
  if (statusOf(S.uid) === "dnd" || prefs.desktop === "none" && !important) return;
  if (!important && prefs.desktop !== "all") return;
  ping();
  if (document.hidden && "Notification" in window && Notification.permission === "granted" && prefs.desktop !== "none"){
    try{ const n = new Notification(title, {body: String(body).slice(0,140), tag: kind + id}); n.onclick = () => { window.focus(); openChat(kind, id); n.close(); }; }catch(e){}
  }
}
function updateTitle(){ document.title = S.hiddenCount ? "(" + S.hiddenCount + ") CampusCord" : (S.config && S.config.serverName || "CampusCord"); }
document.addEventListener("visibilitychange", () => { if (!document.hidden){ S.hiddenCount = 0; updateTitle(); markRead(); need("side","rail"); } });

// ---------------------------------------------------------------- rail + sidebar
function unreadDMs(){ return S.dms.filter(d => d.lastUid && d.lastUid !== S.uid && d.lastTs > (S.lastRead["dm:"+d.id]||0) && !(S.kind === "dm" && S.cur === d.id)); }
function roomUnread(r){ const m = S.meta[r.id]; return !(S.kind === "room" && S.cur === r.id) && m && m.lastTs > (S.lastRead[r.id]||0) && m.lastUid !== S.uid; }
function renderRail(){
  const r = $("rail"); r.innerHTML = "";
  const dmU = unreadDMs().length;
  const home = h("button",{class:"ri" + (S.mode === "dms" ? " on" : ""), title:"Direct messages", onclick:() => { S.mode = "dms"; need("rail","side"); }}, ic("message"));
  if (dmU) home.appendChild(h("span",{class:"bdg",text:String(dmU)}));
  r.appendChild(home);
  r.appendChild(h("div",{class:"sep"}));
  const icon = (S.config && S.config.serverIcon) || "CC";
  const srv = h("button",{class:"ri srv" + (S.mode === "server" ? " on" : ""), title:(S.config && S.config.serverName) || "CampusCord", onclick:() => { S.mode = "server"; need("rail","side"); }}, icon);
  const mc = Object.values(S.mentions).reduce((a,b) => a + b, 0); if (mc) srv.appendChild(h("span",{class:"bdg",text:String(mc)}));
  else if (S.rooms.some(roomUnread)) srv.appendChild(h("span",{class:"gdot",title:"New messages"}));
  r.appendChild(srv);
  r.appendChild(h("div",{class:"sp"}));
  r.appendChild(h("button",{class:"ri shopri", title:"Campus+ Shop", onclick:() => openShop()}, ic("bag")));
  if (isAdmin()){ const ab = h("button",{class:"ri", title:"Server settings", onclick:() => openAdmin()}, ic("shield"));
    const pend = isOwner() ? S.orders.filter(o => o.status === "pending").length : 0; if (pend) ab.appendChild(h("span",{class:"bdg",text:String(pend)})); r.appendChild(ab); }
}
function renderSide(){
  const hdr = $("sideHdr"), list = $("chList"); hdr.innerHTML = ""; list.innerHTML = "";
  if (S.mode === "dms"){
    hdr.onclick = null; hdr.style.cursor = "default";
    hdr.append(h("span",{class:"t",text:"Direct Messages"}), h("button",{class:"ib",title:"New DM",onclick:e => { e.stopPropagation(); newDMModal(); }}, ic("plus")));
    const f = h("input",{class:"dmsearch", placeholder:"Find a conversation", value:S.dmFilter||"", oninput:e => { S.dmFilter = e.target.value; renderDMList(box); }});
    list.appendChild(f); const box = h("div"); list.appendChild(box); renderDMList(box);
    return;
  }
  hdr.style.cursor = isAdmin() ? "pointer" : "default";
  hdr.onclick = () => { if (isAdmin()) openAdmin(); };
  hdr.append(h("span",{class:"t",text:(S.config && S.config.serverName) || "CampusCord"}), ...roleTags(S.uid, true), isAdmin() ? h("span",{class:"hdrchev"}, ic("chevron")) : null);
  // group by category
  const cats = []; const byCat = {};
  S.rooms.forEach(r => { const c = r.category || "Text rooms"; if (!byCat[c]){ byCat[c] = []; cats.push(c); } byCat[c].push(r); });
  if (!cats.length) list.appendChild(h("div",{class:"empty-note",text:"No rooms yet."}));
  cats.forEach(c => {
    const closed = !!prefs.collapsed[c];
    const head = h("div",{class:"cat" + (closed ? " closed" : ""), onclick:() => { prefs.collapsed[c] = !closed; savePrefs(); need("side"); }},
      h("span",{class:"ar"}, ic("chevron")), h("span",{class:"t",text:c}),
      isAdmin() ? h("button",{title:"Create room", onclick:e => { e.stopPropagation(); roomModal(null, c); }}, ic("plus")) : null);
    list.appendChild(head);
    byCat[c].forEach(r => {
      const on = S.kind === "room" && S.cur === r.id; const un = roomUnread(r); const mc = S.mentions[r.id] || 0;
      if (closed && !on && !un && !mc) return;
      const typ = !on && typersIn("room", r.id).length;
      list.appendChild(h("div",{class:"ch" + (on ? " on" : "") + (un ? " unread" : ""), onclick:() => openChat("room", r.id)},
        h("span",{class:"ic"}, ic(r.private ? "lock" : r.readonly ? "megaphone" : "hash")), h("span",{class:"nm",text:r.name}),
        isAdmin() && (isOwner() || !r.private) ? h("button",{class:"x edit", title:"Edit room", onclick:e => { e.stopPropagation(); roomModal(r); }}, ic("settings")) : null,
        typ ? h("span",{class:"typ",text:"•••"}) : null, mc ? h("span",{class:"mb",text:String(mc)}) : (un ? h("span",{class:"newdot",title:"New messages"}) : null)));
    });
  });
}
function renderDMList(box){
  box.innerHTML = "";
  const q = (S.dmFilter||"").toLowerCase();
  const rows = S.dms.filter(d => { const o = dmOther(d); return member(o) || d.lastTs; }).filter(d => !q || nickOf(dmOther(d)).toLowerCase().includes(q));
  if (!rows.length){ box.appendChild(h("div",{class:"empty-note",text: q ? "No matches." : "No DMs yet. Click ＋ above, or click anyone's name and choose Message."})); return; }
  rows.forEach(d => {
    const o = dmOther(d); const on = S.kind === "dm" && S.cur === d.id;
    const un = !on && d.lastUid && d.lastUid !== S.uid && d.lastTs > (S.lastRead["dm:"+d.id]||0);
    const cs = profile(o).customStatus;
    box.appendChild(h("div",{class:"ch dm" + (on ? " on" : "") + (un ? " unread" : ""), onclick:() => openChat("dm", d.id)},
      avatar(o, "sm", true),
      h("div",{class:"meta"}, paintName(h("span",{class:"nm",text:nickOf(o)}), o), cs ? h("span",{class:"sub",text:cs}) : (typersIn("dm", d.id).length ? h("span",{class:"sub",text:"typing…"}) : null)),
      un ? h("span",{class:"newdot",title:"New message"}) : null));
  });
}
function renderMe(){
  const w = $("meWho"); w.innerHTML = ""; if (!member(S.uid)) return;
  renderPromo();
  const st = STATUSES.find(s => s.id === (profile(S.uid).status || "online"));
  w.append(avatar(S.uid, "sm", true), h("div",{style:{minWidth:0}}, paintName(h("div",{class:"nick",text:nickOf(S.uid)}), S.uid),
    h("div",{class:"st",text: profile(S.uid).customStatus || (st ? st.name : "Online")})));
  w.onclick = e => openProfile(S.uid, w, true);
}
$("meSettings").onclick = () => openSettings("account");
$("btnShop").onclick = () => openShop();
function renderPromo(){
  const p = $("promo"); p.innerHTML = "";
  if (rankOf(S.uid) === "plusplus" || isOwner() || (prefs.promoHiddenAt && Date.now() - prefs.promoHiddenAt < 7*864e5)) return;
  const has = hasPlus(S.uid);
  p.appendChild(h("div",{class:"promo", onclick:() => openShop()},
    h("button",{class:"px", title:"Hide for a week", onclick:e => { e.stopPropagation(); prefs.promoHiddenAt = Date.now(); savePrefs(); renderPromo(); }}, ic("x")),
    h("div",{class:"pt"}, ic(has ? "zap" : "sparkles"), h("b",{text: has ? "Go Campus++" : "Get Campus+"})),
    h("div",{class:"pd",text: has ? "Holographic PLUS+ badge, exclusive name effects and a glowing avatar ring." : "Rank badge, animated name, premium themes and more."}),
    h("div",{class:"pb"}, "Open shop ", ic("chevron","rot"))));
}

// ---------------------------------------------------------------- chats
const base = () => [S.kind === "dm" ? "dms" : "rooms", S.cur];
const readKey = (kind, id) => (kind === "dm" ? "dm:" : "") + id;
const dmIdWith = uid => [S.uid, uid].sort().join("_");
const dmOther = d => (d.users || (d.id||"").split("_")).find(u => u !== S.uid) || S.uid;
// Private rooms: only the owner and the people on the room's "allowed" list can see them.
function listNames(a){ return a.length <= 1 ? (a[0] || "you") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }
function roomPeople(r){ const owner = S.config && S.config.ownerUid; return [...new Set([owner, ...(r.allowed || [])])].filter(u => u && member(u) && !isBanned(u)); }
function canSeeRoom(r){ return !r.private || isOwner() || (r.allowed || []).includes(S.uid); }
const curRoom = () => S.kind === "room" ? S.rooms.find(r => r.id === S.cur) : null;
const canPost = () => { const r = curRoom(); return !(r && r.readonly) || isAdmin(); };
function markRead(){ if (!S.cur) return; S.lastRead[readKey(S.kind, S.cur)] = Date.now(); store("lastRead", S.lastRead);
  if (S.kind === "room" && S.mentions[S.cur]){ delete S.mentions[S.cur]; store("mentions", S.mentions); need("rail"); } }

async function openDM(uid){
  if (!uid || uid === S.uid) return;
  const id = dmIdWith(uid);
  if (!S.dms.find(d => d.id === id)){
    try{ await setDoc(doc(db, "dms", id), {users:id.split("_"), createdAt:Date.now()}, {merge:true}); }
    catch(e){ toast("Couldn't start DM: " + errMsg(e)); return; }
  }
  S.mode = "dms"; openChat("dm", id);
}
function openChat(kind, id){
  closeNav();
  if (S.cur === id && S.kind === kind && S.unsubRoom.length){ need("side","rail"); return; }
  stopTyping();
  S.unsubRoom.forEach(u => u()); S.unsubRoom = [];
  if (S.pending) setPending(null);
  Object.assign(S, {kind, cur:id, msgs:[], reacts:[], typing:[], roomLoaded:false, msgLimit:PAGE, hasMore:false, replyTo:null, editing:null, pins:null});
  if (kind === "dm") S.mode = "dms"; else S.mode = "server";
  store("chat", {kind, id});
  if (S.rpanel === "pins") S.rpanel = "members";
  subscribeMsgs(true);
  const b = base();
  S.unsubRoom.push(onSnapshot(query(collection(db, ...b, "reacts"), limit(1000)), snap => { S.reacts = snap.docs.map(d => Object.assign({id:d.id}, d.data())); need("msgs"); }, ()=>{}));
  S.unsubRoom.push(onSnapshot(collection(db, ...b, "typing"), snap => { S.typing = snap.docs.map(d => Object.assign({uid:d.id}, d.data())); need("typing","rpanel","side"); }, ()=>{}));
  markRead(); S.stickBottom = true;
  need("rail","side","header","msgs","rpanel","composer","typing");
  setTimeout(() => $("input").focus(), 0);
}
function subscribeMsgs(first){
  if (S.unsubMsgs) S.unsubMsgs();
  const b = base(), kind = S.kind, id = S.cur;
  S.unsubMsgs = onSnapshot(query(collection(db, ...b, "msgs"), orderBy("ts","desc"), limit(S.msgLimit)), snap => {
    if (S.kind !== kind || S.cur !== id) return;
    const msgs = snap.docs.map(d => Object.assign({id:d.id}, d.data())).reverse();
    S.hasMore = snap.docs.length >= S.msgLimit;
    if (S.roomLoaded) snap.docChanges().forEach(c => { if (c.type !== "added") return; const m = c.doc.data();
      if (m.uid === S.uid || m.ts < S.loadedAt) return;
      if (document.hidden){ S.hiddenCount++; updateTitle(); }
      const mentioned = (m.mentions||[]).includes(S.uid) || m.everyone;
      if (document.hidden && kind === "room") notify(nickOf(m.uid) + " in #" + ((curRoom()||{}).name||""), m.text || "sent an image", kind, id, mentioned);
      if (!S.stickBottom && !document.hidden) $("jump").classList.remove("hidden");
    });
    S.msgs = msgs; S.roomLoaded = true;
    if (!document.hidden) markRead();
    need("msgs");
  }, e => toast("Lost connection to this chat: " + errMsg(e)));
  if (first){ const u = () => { if (S.unsubMsgs){ S.unsubMsgs(); S.unsubMsgs = null; } }; S.unsubRoom.push(u); }
}

function renderHeader(){
  const icon = $("topIcon"), t = $("topTitle"), d = $("topDesc");
  icon.innerHTML = "";
  if (S.kind === "dm" && S.cur){
    const o = dmOther({id:S.cur}); icon.appendChild(avatar(o, "xs", false)); t.textContent = nickOf(o);
    const st = statusOf(o); d.textContent = profile(o).customStatus || ({online:"Online",idle:"Idle",dnd:"Do Not Disturb",offline:"Offline"}[st]);
  } else { const r = curRoom(); icon.appendChild(ic(r && r.private ? "lock" : r && r.readonly ? "megaphone" : "hash")); t.textContent = r ? r.name : ""; d.textContent = r && r.topic ? r.topic : ""; }
  $("btnMembers").classList.toggle("on", S.rpanel === "members");
  $("btnPins").classList.toggle("on", S.rpanel === "pins");
  updateTitle();
}

// ---------------------------------------------------------------- markdown
function md(text){
  let s = esc(text);
  const slots = [];
  const keep = html => "\u0000" + (slots.push(html) - 1) + "\u0000";
  s = s.replace(/```(?:[a-z0-9]+\n)?([\s\S]*?)```/gi, (_, c) => keep("<pre>" + c.replace(/^\n/, "") + "</pre>"));
  s = s.replace(/`([^`\n]+)`/g, (_, c) => keep("<code>" + c + "</code>"));
  s = s.replace(/(https?:\/\/[^\s<]+[^\s<.,:;!?)\]'"])/g, u => keep('<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + u + "</a>"));
  s = s.replace(/\|\|([\s\S]+?)\|\|/g, '<span class="spoiler">$1</span>');
  s = s.replace(/\*\*([\s\S]+?)\*\*/g, "<b>$1</b>");
  s = s.replace(/__([\s\S]+?)__/g, "<u>$1</u>");
  s = s.replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g, "$1<i>$2</i>");
  s = s.replace(/(^|[^_\w])_(?!\s)([^_\n]+?)_(?!\w)/g, "$1<i>$2</i>");
  s = s.replace(/~~([\s\S]+?)~~/g, "<s>$1</s>");
  // mentions
  const nicks = Object.entries(S.members).map(([u, m]) => [u, m.nick]).filter(x => x[1]).sort((a,b) => b[1].length - a[1].length);
  if (nicks.length || /@everyone/.test(s)){
    const re = new RegExp("@(everyone|" + nicks.map(n => reEsc(esc(n[1]))).join("|") + ")(?![\\w])", "gi");
    s = s.replace(re, (all, n) => { if (n.toLowerCase() === "everyone") return keep('<span class="men">@everyone</span>');
      const hit = nicks.find(x => esc(x[1]).toLowerCase() === n.toLowerCase()); return hit ? keep('<span class="men" data-uid="' + esc(hit[0]) + '">@' + n + "</span>") : all; });
  }
  // block quotes + line breaks
  s = s.split("\n").map(line => line.startsWith("&gt; ") ? '<div class="q">' + line.slice(5) + "</div>" : line + "<br>").join("");
  s = s.replace(/<br>$/, "");
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => slots[+i]);
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => slots[+i]);
  return s;
}
function onlyEmoji(t){ if (!t) return false; const s = t.replace(/\s/g,""); return s.length <= 16 && /^(\p{Extended_Pictographic}|\p{Emoji_Component}|‍|️)+$/u.test(s); }
function snippet(m){ return (m.text || (m.img ? (m.gif ? "GIF" : "Image") : "")).replace(/\s+/g, " ").slice(0, 120); }

// ---------------------------------------------------------------- messages
function nearBottom(){ const m = $("msgs"); return m.scrollHeight - m.scrollTop - m.clientHeight < 120; }
$("msgs").addEventListener("scroll", () => {
  const box = $("msgs"); S.stickBottom = nearBottom(); if (S.stickBottom) $("jump").classList.add("hidden");
  if (box.scrollTop < 60 && S.hasMore && !S.olderLoading && S.roomLoaded){ S.olderLoading = true; S.keepFromBottom = box.scrollHeight - box.scrollTop; S.msgLimit += PAGE; subscribeMsgs(false); setTimeout(() => S.olderLoading = false, 800); }
});
$("jump").onclick = () => { const b = $("msgs"); b.scrollTop = b.scrollHeight; $("jump").classList.add("hidden"); };

function renderMessages(){
  const box = $("msgs");
  const atBottom = S.stickBottom !== false;
  const prevTop = box.scrollTop;
  box.innerHTML = "";
  if (S.hasMore) box.appendChild(h("div",{class:"loadmore",text:"Loading older messages…"}));
  else box.appendChild(welcomeBlock());
  const byMsg = {}; S.reacts.forEach(x => { (byMsg[x.mid] = byMsg[x.mid] || {}); (byMsg[x.mid][x.e] = byMsg[x.mid][x.e] || []).push(x); });
  const q = S.searchQ.toLowerCase();
  let prev = null, prevDay = "";
  S.msgs.forEach(m => {
    const dl = new Date(m.ts).toDateString();
    if (dl !== prevDay){ box.appendChild(h("div",{class:"day",text:dayLabel(m.ts)})); prevDay = dl; prev = null; }
    const first = !prev || prev.uid !== m.uid || (m.ts - prev.ts) > 5*60*1000 || m.reply || m.me;
    box.appendChild(messageEl(m, first, byMsg[m.id]));
    prev = m;
  });
  if (S.keepFromBottom != null){ box.scrollTop = box.scrollHeight - S.keepFromBottom; S.keepFromBottom = null; }
  else if (atBottom) box.scrollTop = box.scrollHeight; else box.scrollTop = prevTop;
  if (S.flashId){ const el = $("m-" + S.flashId); if (el){ el.scrollIntoView({block:"center"}); el.classList.add("flash"); S.flashId = null; } }
}
function welcomeBlock(){
  const w = h("div",{class:"welcome"});
  if (S.kind === "dm"){ const o = dmOther({id:S.cur}); const big = avatar(o, "xl"); big.style.marginBottom = "12px"; w.append(big, h("h2",null, nickOf(o)),
      h("p",null, S.roomLoaded ? "This is the start of your private messages with " + nickOf(o) + ". Only the two of you can see them." : "Loading messages…")); }
  else { const r = curRoom(); w.append(h("div",{class:"big"}, ic(r && r.private ? "lock" : r && r.readonly ? "megaphone" : "hash")), h("h2",null,"Welcome to #" + (r ? r.name : "…")),
      h("p",null, !S.roomLoaded ? "Loading messages…" : (r && r.private) ? "Private room — only " + listNames(roomPeople(r).map(nickOf)) + " can see this." : (r && r.topic) ? r.topic : "This is the start of the #" + (r ? r.name : "") + " room.")); }
  return w;
}
function messageEl(m, first, reacts){
  const mentioned = m.uid !== S.uid && ((m.mentions||[]).includes(S.uid) || m.everyone || (m.reply && m.reply.uid === S.uid));
  const row = h("div",{class:"msg" + (first ? " first" : "") + (mentioned ? " mention" : ""), id:"m-" + m.id});
  const gut = h("div",{class:"gut"});
  if (first){ const a = avatar(m.uid); a.onclick = e => openProfile(m.uid, a); gut.appendChild(a); }
  else gut.appendChild(h("span",{class:"tm",text:fmtTime(m.ts)}));
  row.appendChild(gut);
  const body = h("div",{class:"body"});
  if (m.reply){ const r = m.reply; body.appendChild(h("div",{class:"reply", onclick:() => jumpTo(r.id)}, h("b",{text:"@" + nickOf(r.uid)}), h("span",{text:r.text || "Click to see attachment"}))); }
  if (first){ const n = paintName(h("span",{class:"n",text:nickOf(m.uid), onclick:e => openProfile(m.uid, e.target)}), m.uid);
    body.appendChild(h("div",{class:"meta"}, n, ...roleTags(m.uid, true), gem(m.uid), h("span",{class:"t",text:fmtDay(m.ts)}))); }
  if (S.editing === m.id) body.appendChild(editBox(m));
  else if (m.text){
    const tx = h("div",{class:"tx" + (m.me ? " me" : "") + (onlyEmoji(m.text) && !m.img ? " jumbo" : "")});
    tx.innerHTML = md(m.me ? nickOf(m.uid) + " " + m.text : m.text);
    if (m.edited) tx.appendChild(h("span",{class:"edited",title: m.editedAt ? fmtDay(m.editedAt) : "", text:"(edited)"}));
    tx.addEventListener("click", e => { const sp = e.target.closest(".spoiler"); if (sp) sp.classList.toggle("open"); const mn = e.target.closest(".men[data-uid]"); if (mn) openProfile(mn.dataset.uid, mn); });
    body.appendChild(tx);
  }
  if (m.img){ const im = h("img",{class:"att", src:m.img, alt: m.gif ? "GIF" : "image", loading:"lazy", onclick:() => lightbox(m.img)});
    im.onload = () => { if (S.stickBottom){ const b = $("msgs"); b.scrollTop = b.scrollHeight; } }; body.appendChild(im); }
  if (reacts){ const wrap = h("div",{class:"reacts"});
    Object.keys(reacts).forEach(e => { const arr = reacts[e]; const mine = arr.some(x => x.uid === S.uid);
      wrap.appendChild(h("button",{class:"rc" + (mine ? " mine" : ""), title:arr.map(x => nickOf(x.uid)).join(", "), onclick:() => toggleReact(m, e)}, e + " ", h("b",{text:String(arr.length)}))); });
    wrap.appendChild(h("button",{class:"rc add", title:"Add reaction", onclick:ev => quickReact(ev, m)}, ic("smileplus")));
    body.appendChild(wrap); }
  row.appendChild(body);
  if (m.pinned) row.appendChild(h("span",{class:"pinmark",title:"Pinned"}, ic("pin")));
  const mine = m.uid === S.uid;
  const tools = h("div",{class:"tools"},
    QUICK.slice(0,3).map(e => h("button",{title:"React " + e, onclick:() => toggleReact(m, e)}, e)),
    h("i",{class:"tsep"}),
    h("button",{title:"Add reaction", onclick:ev => quickReact(ev, m)}, ic("smileplus")),
    canPost() ? h("button",{title:"Reply", onclick:() => startReply(m)}, ic("reply")) : null,
    mine && m.text != null && !m.me ? h("button",{title:"Edit", onclick:() => { S.editing = m.id; S.editDraft = null; S.editCaret = null; need("msgs"); }}, ic("pencil")) : null,
    canPin() ? h("button",{title: m.pinned ? "Unpin" : "Pin", class: m.pinned ? "on" : null, onclick:() => togglePin(m)}, ic("pin")) : null,
    m.text ? h("button",{title:"Copy text", onclick:() => copy(m.text)}, ic("copy")) : null,
    (mine || (isAdmin() && S.kind === "room")) ? h("button",{title:"Delete", onclick:e => { if (e.shiftKey) deleteMsg(m); else confirmBox("Delete message?", "This can't be undone. (Tip: hold Shift to skip this.)", "Delete", () => deleteMsg(m)); }, class:"danger"}, ic("trash")) : null);
  row.appendChild(tools);
  return row;
}
function canPin(){ return S.kind === "dm" || isAdmin(); }
function jumpTo(id){ const el = $("m-" + id); if (el){ el.scrollIntoView({block:"center", behavior:"smooth"}); el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); } else toast("That message is too far back to load here."); }
function editBox(m){
  const ta = h("textarea",{rows:"1"}); ta.value = S.editDraft != null ? S.editDraft : (m.text || ""); S.editDraft = ta.value;
  ta.addEventListener("input", () => { S.editDraft = ta.value; });
  const save = async () => { const v = ta.value.trim(); if (!v){ confirmBox("Delete message?", "Saving an empty message deletes it.", "Delete", () => deleteMsg(m)); return; }
    S.editing = null; S.editDraft = null; need("msgs"); if (v === m.text) return;
    try{ await updateDoc(doc(db, ...base(), "msgs", m.id), {text:v.slice(0,4000), edited:true, editedAt:Date.now(), mentions:findMentions(v)}); }catch(e){ toast("Couldn't edit: " + errMsg(e)); } };
  const cancel = () => { S.editing = null; S.editDraft = null; need("msgs"); };
  ta.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey){ e.preventDefault(); save(); } if (e.key === "Escape") cancel(); });
  ta.addEventListener("input", () => { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; });
  const caret = S.editCaret != null ? S.editCaret : ta.value.length;
  ta.addEventListener("keyup", () => { S.editCaret = ta.selectionStart; }); ta.addEventListener("click", () => { S.editCaret = ta.selectionStart; });
  setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = Math.min(caret, ta.value.length); ta.style.height = ta.scrollHeight + "px"; }, 0);
  return h("div",{class:"edit-box"}, ta, h("div",{class:"hint"}, "escape to ", h("a",{onclick:cancel},"cancel"), " • enter to ", h("a",{onclick:save},"save")));
}
function lightbox(src){ const d = h("div",{class:"lightbox", onclick:() => d.remove()}, h("img",{src})); document.body.appendChild(d); }

async function toggleReact(m, e){
  pushRecent(e);
  const id = m.id + "__" + S.uid + "__" + eKey(e);
  const ref = doc(db, ...base(), "reacts", id);
  try{ if (S.reacts.some(x => x.id === id)) await deleteDoc(ref); else await setDoc(ref, {mid:m.id, uid:S.uid, e, ts:Date.now()}); }
  catch(err){ toast("Couldn't react: " + errMsg(err)); }
}
function quickReact(ev, m){
  document.querySelectorAll(".quick").forEach(x => x.remove());
  const q = h("div",{class:"quick"}, QUICK.map(e => h("button",{onclick:() => { q.remove(); toggleReact(m, e); }}, e)),
    h("button",{title:"More", onclick:() => { q.remove(); openEmoji(e2 => toggleReact(m, e2)); }}, ic("plus")));
  document.body.appendChild(q);
  const r = ev.currentTarget.getBoundingClientRect(); q.style.top = Math.max(8, r.top - 52) + "px"; q.style.left = Math.max(8, Math.min(window.innerWidth - q.offsetWidth - 8, r.right - q.offsetWidth)) + "px";
  setTimeout(() => document.addEventListener("click", function hh(e){ if (!q.contains(e.target)){ q.remove(); document.removeEventListener("click", hh); } }), 0);
}
async function deleteMsg(m){
  const b = base();
  try{ await deleteDoc(doc(db, ...b, "msgs", m.id));
    for (const r of S.reacts.filter(x => x.mid === m.id)) await deleteDoc(doc(db, ...b, "reacts", r.id)).catch(()=>{});
  }catch(e){ toast("Couldn't delete: " + errMsg(e)); }
}
async function togglePin(m){
  try{ await updateDoc(doc(db, ...base(), "msgs", m.id), {pinned: !m.pinned, pinnedBy:S.uid}); toast(m.pinned ? "Unpinned" : "Pinned 📌"); if (S.rpanel === "pins") loadPins(); }
  catch(e){ toast("Couldn't pin: " + errMsg(e)); }
}
function startReply(m){ S.replyTo = {id:m.id, uid:m.uid, text:snippet(m)}; need("composer"); $("input").focus(); }

// ---------------------------------------------------------------- right panel (members / pins / search)
$("btnMembers").onclick = () => { S.rpanel = S.rpanel === "members" ? null : "members"; prefs.showMembers = S.rpanel === "members"; savePrefs(); need("rpanel","header"); };
$("btnPins").onclick = () => { if (S.rpanel === "pins"){ S.rpanel = prefs.showMembers ? "members" : null; } else { S.rpanel = "pins"; loadPins(); } need("rpanel","header"); };
$("search").addEventListener("input", e => { S.searchQ = e.target.value.trim(); S.rpanel = S.searchQ ? "search" : (prefs.showMembers ? "members" : null); need("rpanel"); });
$("search").addEventListener("keydown", e => { if (e.key === "Escape"){ e.target.value = ""; S.searchQ = ""; S.rpanel = prefs.showMembers ? "members" : null; need("rpanel"); } });
async function loadPins(){
  S.pins = null; need("rpanel");
  try{ const snap = await getDocs(query(collection(db, ...base(), "msgs"), where("pinned","==",true)));
    S.pins = snap.docs.map(d => Object.assign({id:d.id}, d.data())).sort((a,b) => b.ts - a.ts); }
  catch(e){ S.pins = []; toast("Couldn't load pins: " + errMsg(e)); }
  need("rpanel");
}
function renderRPanel(){
  const p = $("rpanel"); p.innerHTML = ""; p.classList.remove("wide");
  if (S.rpanel === null && prefs.showMembers === false || !S.rpanel){ p.classList.add("hidden"); return; }
  p.classList.remove("hidden");
  const close = h("button",{class:"ib",title:"Close",onclick:() => { if (S.rpanel === "search"){ $("search").value = ""; S.searchQ = ""; } S.rpanel = S.rpanel === "members" ? null : (prefs.showMembers ? "members" : null); if (S.rpanel === null){ prefs.showMembers = false; savePrefs(); } need("rpanel","header"); }}, ic("x"));
  if (S.rpanel === "pins"){
    p.classList.add("wide");
    p.append(h("div",{class:"rh"}, h("span",{class:"t"}, ic("pin"), " Pinned messages"), close));
    const b = h("div",{class:"rb"}); p.appendChild(b);
    if (S.pins === null){ b.appendChild(h("div",{class:"empty-note",text:"Loading…"})); return; }
    if (!S.pins.length){ b.appendChild(h("div",{class:"empty-note",text: canPin() ? "Nothing pinned yet. Hover a message and click 📌 to pin it." : "Nothing pinned yet."})); return; }
    S.pins.forEach(m => b.appendChild(resultCard(m)));
    return;
  }
  if (S.rpanel === "search"){
    p.classList.add("wide");
    const q = S.searchQ.toLowerCase();
    const hits = S.msgs.filter(m => (m.text||"").toLowerCase().includes(q) || nickOf(m.uid).toLowerCase().includes(q)).reverse();
    p.append(h("div",{class:"rh"}, h("span",{class:"t",text: hits.length + " result" + (hits.length === 1 ? "" : "s")}), close));
    const b = h("div",{class:"rb"}); p.appendChild(b);
    if (!hits.length) b.appendChild(h("div",{class:"empty-note",text:"No matches in the loaded messages. Scroll up in the chat to load older ones."}));
    hits.slice(0, 80).forEach(m => b.appendChild(resultCard(m, q)));
    return;
  }
  // members
  p.classList.add("mem");
  const b = h("div",{class:"rb"}); p.appendChild(b);
  let uids = Object.keys(S.members).filter(u => !isBanned(u));
  if (S.kind === "dm"){ const o = dmOther({id:S.cur}); uids = [S.uid, o].filter(u => member(u)); }
  else { const r = curRoom(); if (r && r.private) uids = roomPeople(r); }
  const sortN = (a,b) => nickOf(a).localeCompare(nickOf(b));
  const special = u => isOwnerUid(u) || (isDev(u) && isOn(u)) || (rankOf(u) === "plusplus" && isOn(u));
  const groups = [["Admin", uids.filter(isOwnerUid)], ["Developers", uids.filter(u => !isOwnerUid(u) && isDev(u) && isOn(u))],
    ["Campus++", uids.filter(u => !isOwnerUid(u) && !isDev(u) && rankOf(u) === "plusplus" && isOn(u))],
    ["Online", uids.filter(u => !special(u) && isOn(u))], ["Offline", uids.filter(u => !isOwnerUid(u) && !isOn(u))]];
  groups.forEach(([label, arr]) => {
    if (!arr.length) return;
    b.appendChild(h("div",{class:"cat",text: label + " — " + arr.length}));
    arr.sort(sortN).forEach(u => {
      const cs = profile(u).customStatus; const typing = typersIn(S.kind, S.cur).includes(u);
      const row = h("div",{class:"mrow" + (isOn(u) ? "" : " off"), onclick:e => openProfile(u, row)},
        avatar(u, "sm", true),
        h("div",{class:"info"}, h("div",{class:"nm"}, paintName(h("span",{text:nickOf(u)}), u), ...miniTags(u)),
          typing ? h("div",{class:"sub",text:"typing…"}) : cs ? h("div",{class:"sub",text:cs}) : null));
      b.appendChild(row);
    });
  });
}
function resultCard(m, q){
  const tx = h("div",{class:"tx"}); tx.innerHTML = q ? esc(m.text || snippet(m)).replace(new RegExp(reEsc(esc(q)), "gi"), x => "<mark>" + x + "</mark>") : md(m.text || snippet(m));
  return h("div",{class:"res", onclick:() => { if ($("m-" + m.id)) jumpTo(m.id); else toast("That message is further back — scroll up to load it."); }},
    h("div",{class:"rm"}, paintName(h("b",{text:nickOf(m.uid)}), m.uid), h("span",{text:fmtDay(m.ts)})), tx);
}

// ---------------------------------------------------------------- profile popout
function openProfile(uid, anchor, self){
  closeLayer("profile");
  if (!member(uid)) return;
  const p = profile(uid), st = statusOf(uid);
  const bannerColor = hasPerk(uid, "banner") && p.banner ? p.banner : colorOf(uid);
  const big = avatar(uid, "xl", true);
  const card = h("div",{class:"profile", "data-layer":"profile"},
    h("div",{class:"banner", style:{background: hasPerk(uid, "banner_gradient") ? "linear-gradient(135deg," + bannerColor + ",#a78bfa 55%,#3fb8ff)" : bannerColor}}),
    h("div",{class:"pav"}, big),
    h("div",{class:"pb"},
      h("div",{class:"pname"}, paintName(h("span",{text:nickOf(uid)}), uid), gem(uid)),
      h("div",{class:"pstat",text: (p.customStatus ? p.customStatus + " · " : "") + ({online:"Online",idle:"Idle",dnd:"Do Not Disturb",offline:"Offline"}[st])}),
      h("div",{class:"badges"}, ...roleTags(uid), hasPerk(uid,"supporter") && !hasPlus(uid) ? h("span",{class:"tag plus",text:"💎 SUPPORTER"}) : null),
      p.bio ? h("div",{class:"sect"}, h("h4",{text:"About me"}), h("div",{text:p.bio})) : null,
      h("div",{class:"sect"}, h("h4",{text:"Member since"}), h("div",{text: member(uid).joinedAt ? new Date(member(uid).joinedAt).toLocaleDateString([], {month:"long", day:"numeric", year:"numeric"}) : "—"})),
      h("div",{class:"acts"},
        uid === S.uid ? h("button",{class:"btn small", onclick:() => { closeLayer("profile"); openSettings("profile"); }}, "Edit profile") : h("button",{class:"btn small", onclick:() => { closeLayer("profile"); openDM(uid); }}, ic("message"), " Message"),
        uid === S.uid ? statusPicker() : null,
        isOwner() && uid !== S.uid ? h("button",{class:"btn small ghost", onclick:() => { closeLayer("profile"); isDev(uid) ? confirmBox("Remove " + nickOf(uid) + " as developer?", "They'll go back to being a regular member.", "Remove", () => setDev(uid, false)) : confirmBox("Make " + nickOf(uid) + " a developer?", "Developers can manage rooms, delete messages, pin, kick regular members, and see the invite code. Only you can add or remove developers.", "Make developer", () => setDev(uid, true), true); }}, isDev(uid) ? "Remove dev" : "Make developer") : null,
        isAdmin() && uid !== S.uid && !isOwnerUid(uid) && !(isDev(uid) && !isOwner()) ? h("button",{class:"btn small danger", onclick:() => { closeLayer("profile"); confirmBox("Kick " + nickOf(uid) + "?", "They'll be locked out right away and can't rejoin unless unbanned.", "Kick", () => kick(uid)); }}, "Kick") : null)));
  document.body.appendChild(card);
  const r = anchor.getBoundingClientRect();
  let left = r.right + 12, top = r.top - 20;
  if (left + 310 > window.innerWidth) left = Math.max(8, r.left - 312);
  if (self){ left = Math.max(8, r.left); top = r.top - card.offsetHeight - 10; }
  top = Math.max(8, Math.min(window.innerHeight - card.offsetHeight - 8, top));
  card.style.left = left + "px"; card.style.top = top + "px";
  setTimeout(() => document.addEventListener("mousedown", function hh(e){ if (!card.contains(e.target)){ card.remove(); document.removeEventListener("mousedown", hh); } }), 0);
}
function statusPicker(){
  const sel = h("select",{class:"inp", style:{width:"auto", padding:"6px 8px", fontSize:"13px"}, onchange:e => setMyProfile({status:e.target.value}).then(() => { S.sentInvisible = false; heartbeat(); })},
    STATUSES.map(s => h("option",{value:s.id, selected: (profile(S.uid).status || "online") === s.id}, s.name)));
  return sel;
}
function closeLayer(name){ document.querySelectorAll('[data-layer="' + name + '"]').forEach(x => x.remove()); }
async function setMyProfile(patch){
  try{ await setDoc(doc(db, "profiles", S.uid), patch, {merge:true}); }
  catch(e){ toast("Couldn't save profile: " + errMsg(e)); throw e; }
}

// ---------------------------------------------------------------- typing
let typingT = null, typingSent = 0, typingPath = null;
function iAmTyping(){
  if (Date.now() - typingSent > 3000){ typingSent = Date.now(); typingPath = base(); setDoc(doc(db, ...typingPath, "typing", S.uid), {t:typingSent}).catch(()=>{}); }
  clearTimeout(typingT); typingT = setTimeout(stopTyping, 4000);
}
function stopTyping(){ clearTimeout(typingT); if (typingSent && typingPath) deleteDoc(doc(db, ...typingPath, "typing", S.uid)).catch(()=>{}); typingSent = 0; typingPath = null; }
function typersIn(kind, id){ if (kind !== S.kind || id !== S.cur) return []; return S.typing.filter(x => x.uid !== S.uid && Date.now() - x.t < 7000 && member(x.uid)).map(x => x.uid); }
function renderTyping(){
  const t = $("typing"); t.innerHTML = "";
  const who = typersIn(S.kind, S.cur); if (!who.length) return;
  const names = who.map(nickOf);
  t.append(h("span",{class:"bub"}, h("span"), h("span"), h("span")),
    h("span",null, h("b",{text:names.length <= 2 ? names.join(" and ") : "Several people"}), names.length === 1 ? " is typing…" : " are typing…"));
}
setInterval(() => need("typing"), 2000);

// ---------------------------------------------------------------- composer
const input = $("input");
function renderComposer(){
  const bars = $("cbars"); bars.innerHTML = "";
  const ok = canPost();
  $("cbox").classList.toggle("hidden", !ok); $("locked").classList.toggle("hidden", ok);
  if (S.replyTo) bars.appendChild(h("div",{class:"cbar"}, "Replying to ", h("b",{text:nickOf(S.replyTo.uid)}), h("span",{class:"sp"}), h("button",{class:"ib", style:{width:"24px",height:"24px",fontSize:"13px"}, title:"Cancel reply", onclick:() => { S.replyTo = null; need("composer"); }}, ic("x"))));
  if (S.pending) bars.appendChild(h("div",{class:"cbar"}, h("img",{src:S.pendingUrl}), h("span",{id:"prevName",text:S.pending.name + " · " + Math.round(S.pending.size/1024) + " KB"}), h("span",{class:"sp"}), h("button",{class:"ib", title:"Remove", onclick:() => setPending(null)}, ic("x"))));
  const r = curRoom();
  input.placeholder = S.kind === "dm" ? "Message @" + nickOf(dmOther({id:S.cur})) : "Message #" + (r ? r.name : "");
  $("hintline").textContent = "";
}
function autoGrow(){ input.style.height = "auto"; input.style.height = Math.min(200, input.scrollHeight) + "px"; }
input.addEventListener("input", () => { autoGrow(); if (input.value.trim()) iAmTyping(); else stopTyping(); updateAutocomplete(); });
input.addEventListener("keydown", e => {
  if (S.ac && !$("acPop").classList.contains("hidden")){
    if (e.key === "ArrowDown" || e.key === "ArrowUp"){ e.preventDefault(); S.ac.sel = (S.ac.sel + (e.key === "ArrowDown" ? 1 : -1) + S.ac.items.length) % S.ac.items.length; drawAutocomplete(); return; }
    if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)){ e.preventDefault(); pickAutocomplete(S.ac.sel); return; }
    if (e.key === "Escape"){ hideAutocomplete(); return; }
  }
  if (e.key === "Enter" && !e.shiftKey){ e.preventDefault(); send(); return; }
  if (e.key === "Escape" && S.replyTo){ S.replyTo = null; need("composer"); }
  if (e.key === "ArrowUp" && !input.value){ const mine = [...S.msgs].reverse().find(m => m.uid === S.uid && m.text != null && !m.me); if (mine){ e.preventDefault(); S.editing = mine.id; S.editDraft = null; S.editCaret = null; need("msgs"); } }
});
input.addEventListener("paste", e => { const f = [...(e.clipboardData && e.clipboardData.files || [])].find(f => f.type.startsWith("image/")); if (f){ e.preventDefault(); setPending(f); } });
$("msgs").addEventListener("dragover", e => e.preventDefault());
$("msgs").addEventListener("drop", e => { e.preventDefault(); const f = [...e.dataTransfer.files].find(f => f.type.startsWith("image/")); if (f) setPending(f); });
$("attBtn").onclick = () => $("file").click();
$("file").onchange = () => { const f = $("file").files[0]; if (f) setPending(f); $("file").value = ""; };
function setPending(f){ if (S.pendingUrl) URL.revokeObjectURL(S.pendingUrl); S.pending = f; S.pendingUrl = f ? URL.createObjectURL(f) : null; need("composer"); if (f) input.focus(); }

// autocomplete: @mentions and /commands
function updateAutocomplete(){
  const v = input.value.slice(0, input.selectionStart);
  let m;
  if (/^\/[a-z]*$/i.test(v)){
    const q = v.slice(1).toLowerCase();
    const items = SLASH.filter(c => c.c.startsWith(q)).map(c => ({label:"/" + c.c + (c.a ? " " + c.a : ""), desc:c.d, insert:"/" + c.c + " ", start:0}));
    return showAutocomplete("Commands", items);
  }
  if ((m = v.match(/(^|\s)@([^\s@]{0,24})$/))){
    const q = m[2].toLowerCase(), start = v.length - m[2].length - 1;
    let pool = Object.keys(S.members).filter(u => !isBanned(u));
    if (S.kind === "dm") pool = pool.filter(u => S.cur.split("_").includes(u));
    else { const r = curRoom(); if (r && r.private) pool = roomPeople(r); }
    const items = pool.filter(u => nickOf(u).toLowerCase().startsWith(q) || nickOf(u).toLowerCase().includes(" " + q)).sort((a,b) => (isOn(b) - isOn(a)) || nickOf(a).localeCompare(nickOf(b))).slice(0, 8)
      .map(u => ({uid:u, label:nickOf(u), insert:"@" + nickOf(u) + " ", start}));
    if (isAdmin() && S.kind === "room" && "everyone".startsWith(q)) items.push({label:"@everyone", desc:"Notify everyone", insert:"@everyone ", start});
    return showAutocomplete("Members", items);
  }
  hideAutocomplete();
}
function showAutocomplete(title, items){ if (!items.length) return hideAutocomplete(); S.ac = {title, items, sel:0}; drawAutocomplete(); }
function drawAutocomplete(){
  const p = $("acPop"); p.innerHTML = ""; p.classList.remove("hidden");
  p.appendChild(h("div",{class:"h",text:S.ac.title}));
  S.ac.items.forEach((it, i) => p.appendChild(h("div",{class:"it" + (i === S.ac.sel ? " sel" : ""), onmousedown:e => { e.preventDefault(); pickAutocomplete(i); }},
    it.uid ? avatar(it.uid, "xs") : null, it.uid ? paintName(h("span",{text:it.label}), it.uid) : h("b",{text:it.label}), it.desc ? h("span",{class:"d",text:it.desc}) : null)));
}
function pickAutocomplete(i){ const it = S.ac.items[i]; const pos = input.selectionStart;
  input.value = input.value.slice(0, it.start) + it.insert + input.value.slice(pos); const np = it.start + it.insert.length; input.selectionStart = input.selectionEnd = np; hideAutocomplete(); input.focus(); autoGrow(); }
function hideAutocomplete(){ S.ac = null; $("acPop").classList.add("hidden"); }
input.addEventListener("blur", () => setTimeout(hideAutocomplete, 150));

function findMentions(text){
  const out = new Set(); const low = text.toLowerCase();
  Object.keys(S.members).forEach(u => { const n = nickOf(u).toLowerCase(); const i = low.indexOf("@" + n); if (i >= 0 && !/\w/.test(low[i + n.length + 1] || "")) out.add(u); });
  return [...out];
}

// images
function compress(file, maxDim, q){
  return new Promise((res, rej) => { const img = new Image(); img.onload = () => {
    const s = Math.min(1, maxDim / Math.max(img.width, img.height)); const c = document.createElement("canvas");
    c.width = Math.round(img.width*s); c.height = Math.round(img.height*s); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    res(c.toDataURL("image/jpeg", q)); }; img.onerror = rej; img.src = URL.createObjectURL(file); });
}
function avatarMaker(){
  const look = lookOf(S.uid);
  const save = patch => { const l = Object.assign({}, lookOf(S.uid), patch); return setMyProfile({avatar:"look:" + (l.bg || "") + "|" + (l.face || "")}).then(refreshOpenPane).catch(()=>{}); };
  const bgs = h("div",{class:"avbgs"},
    h("button",{class:"avsw" + (!look.bg ? " on" : ""), title:"Match my name color", style:{background:colorOf(S.uid)}, onclick:() => save({bg:""})}, h("span",{text:"Aa"})),
    AV_BGS.map(b => h("button",{class:"avsw" + (look.bg === b.id ? " on" : ""), title:b.id, style:{background:b.g}, onclick:() => save({bg:b.id})})));
  const faces = h("div",{class:"avfaces"},
    h("button",{class:"avface ini" + (!look.face ? " on" : ""), title:"Use my initials", onclick:() => save({face:""})}, initials(nickOf(S.uid))),
    AV_FACES.map(f => h("button",{class:"avface" + (look.face === f ? " on" : ""), onclick:() => save({face:f})}, f)));
  return h("div",null, h("label",{class:"f",text:"Avatar background"}), bgs, h("label",{class:"f",text:"Avatar face"}), faces);
}
function squareAvatar(file){
  return new Promise((res, rej) => { const img = new Image(); img.onload = () => {
    const size = 192, c = document.createElement("canvas"); c.width = c.height = size; const s = Math.min(img.width, img.height);
    c.getContext("2d").drawImage(img, (img.width - s)/2, (img.height - s)/2, s, s, 0, 0, size, size);
    res(c.toDataURL("image/jpeg", 0.82)); }; img.onerror = () => rej(new Error("not an image")); img.src = URL.createObjectURL(file); });
}
function readDataURL(file){ return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); }); }
async function imageToData(file){
  const max = hasPerk(S.uid, "big_uploads") ? 900 : 700;
  if (/gif|webp/.test(file.type)){ if (file.size > max*1024) throw new Error("GIF is too big (max " + max + " KB" + (max < 900 ? " — Campus+ raises it to 900 KB" : "") + ")"); return readDataURL(file); }
  let d = await compress(file, 1600, 0.8); if (d.length > 700000) d = await compress(file, 1100, 0.7); if (d.length > 700000) d = await compress(file, 700, 0.6);
  return d;
}

// slash commands → {text, me?} or null (handled)
async function runSlash(raw){
  const m = raw.match(/^\/(\w+)\s*([\s\S]*)$/); if (!m) return {text:raw};
  const cmd = m[1].toLowerCase(), arg = m[2].trim();
  switch (cmd){
    case "shrug": return {text:(arg ? arg + " " : "") + "¯\\\\_(ツ)\\_/¯"};
    case "tableflip": return {text:(arg ? arg + " " : "") + "(╯°□°)╯︵ ┻━┻"};
    case "unflip": return {text:(arg ? arg + " " : "") + "┬─┬ノ( º _ ºノ)"};
    case "lenny": return {text:(arg ? arg + " " : "") + "( ͡° ͜ʖ ͡°)"};
    case "me": return arg ? {text:arg, me:true} : null;
    case "spoiler": return arg ? {text:"||" + arg + "||"} : null;
    case "roll": { const n = Math.max(2, Math.min(1000, parseInt(arg) || 6)); return {text:"🎲 rolled a **" + (1 + Math.floor(Math.random()*n)) + "** (1–" + n + ")"}; }
    case "flip": return {text:"🪙 flipped a coin: **" + (Math.random() < .5 ? "Heads" : "Tails") + "**"};
    case "nick": if (arg.length >= 2){ try{ await updateDoc(doc(db, "members", S.uid), {nick:arg.slice(0,24)}); toast("Name changed to " + arg.slice(0,24)); }catch(e){ toast("Couldn't change name: " + errMsg(e)); } } else toast("Usage: /nick <new name>"); return null;
    case "status": try{ await setMyProfile({customStatus:arg.slice(0,60)}); toast(arg ? "Status set" : "Status cleared"); }catch(e){} return null;
    default: return {text:raw};
  }
}

let sending = false;
async function send(extra){
  if (sending) return;
  let raw = input.value.trim(); const f = S.pending;
  if (!raw && !f && !extra) return;
  if (!S.cur){ toast("Pick a room or DM first"); return; }
  if (!canPost()){ toast("Only admins can post here"); return; }
  sending = true; stopTyping(); hideAutocomplete();
  try{
    let out = {text:raw};
    if (raw.startsWith("/") && !extra){ out = await runSlash(raw); if (!out){ input.value = ""; autoGrow(); return; } }
    const text = (out.text || "").slice(0, 4000);
    const body = {uid:S.uid, text, ts:Date.now()};
    if (out.me) body.me = true;
    const mentions = findMentions(text); if (mentions.length) body.mentions = mentions;
    if (/@everyone\b/.test(text) && isAdmin() && S.kind === "room") body.everyone = true;
    if (S.replyTo){ body.reply = S.replyTo; }
    if (f){ const pn = $("prevName"); if (pn) pn.textContent = "Uploading…"; body.img = await imageToData(f); if (/gif/.test(f.type)) body.gif = true; }
    if (extra) Object.assign(body, extra);
    const id = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,7);
    const b = base(), kind = S.kind, chatId = S.cur;
    input.value = ""; autoGrow(); S.replyTo = null; setPending(null); S.stickBottom = true;
    await setDoc(doc(db, ...b, "msgs", id), body);
    const preview = (body.me ? nickOf(S.uid) + " " : "") + (text || (body.gif ? "sent a GIF" : body.img ? "sent an image" : "")).slice(0, 120);
    const priv = kind === "room" && (curRoom() || {}).private;
    const meta = {lastTs:body.ts, lastUid:S.uid, lastNick:nickOf(S.uid), lastPreview: priv ? "New message in a private room" : preview, lastMentions:mentions, lastEveryone:!!body.everyone};
    if (kind === "dm") setDoc(doc(db, "dms", chatId), Object.assign({users:chatId.split("_")}, meta), {merge:true}).catch(()=>{});
    else setDoc(doc(db, "meta", chatId), meta).catch(()=>{});
  }catch(e){ toast("Couldn't send: " + errMsg(e)); if (f) setPending(f); }
  finally{ sending = false; input.focus(); }
}

// ---------------------------------------------------------------- emoji + gifs
let emoCb = null, emoCat = null;
const EMOJI_CATS = [
  {id:"recent", tab:"🕘", name:"Recently used"},
  {id:"smileys", tab:"😀", name:"Smileys", list:"😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🫡 🤐 🤨 😐 😑 😶 🫠 😏 😒 🙄 😬 😮‍💨 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🥵 🥶 🥴 😵 🤯 🤠 🥳 🥸 😎 🤓 🧐 😕 😟 🙁 😮 😯 😲 😳 🥺 🥹 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 ☠️ 💩 🤡 👻 👽 🤖 😺 😸 😹 😻 🙈 🙉 🙊"},
  {id:"people", tab:"👋", name:"People", list:"👋 🤚 ✋ 🖖 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 🫶 👐 🤲 🤝 🙏 💪 🦾 🧠 👀 👁️ 👅 👄 🫦 🤷 🤦 🙋 💁 🙆 🙅 🙇 🧍 🏃 💃 🕺 👯 🧑‍💻 🧑‍🎓 🧑‍🍳 🥷 🦸 🧙"},
  {id:"hearts", tab:"❤️", name:"Hearts & fx", list:"❤️ 🧡 💛 💚 💙 🩵 💜 🖤 🩶 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💯 💢 💥 💫 💦 💨 🕳️ 💬 💭 🗯️ 💤 🔥 ✨ ⭐ 🌟 ⚡ 🌈 ☄️ 🎆 🎇"},
  {id:"nature", tab:"🐸", name:"Animals & nature", list:"🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🦆 🦅 🦉 🦇 🐺 🐴 🦄 🐝 🦋 🐌 🐞 🐢 🐍 🦖 🦕 🐙 🦑 🦀 🐠 🐬 🐳 🦈 🐊 🌸 🌹 🌻 🌷 🌵 🌴 🍀 🍁 🍄 🌍 🌙 ☀️ ⛅ 🌧️ ❄️ ☃️ 🌊"},
  {id:"food", tab:"🍕", name:"Food & drink", list:"🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍒 🍑 🥭 🍍 🥥 🥑 🌶️ 🌽 🥕 🥐 🥯 🍞 🧀 🥚 🍳 🥞 🧇 🥓 🍗 🍖 🌭 🍔 🍟 🍕 🥪 🌮 🌯 🥗 🍝 🍜 🍣 🍱 🥟 🍤 🍙 🍚 🍦 🍩 🍪 🎂 🍰 🧁 🍫 🍬 🍭 🍿 ☕ 🧋 🧃 🥤 🍵"},
  {id:"activity", tab:"🎮", name:"Activities & objects", list:"⚽ 🏀 🏈 ⚾ 🎾 🏐 🏉 🎱 🏓 🏸 🏒 ⛳ 🏹 🛹 ⛸️ 🎿 🏆 🥇 🥈 🥉 🏅 🎖️ 🎮 🕹️ 🎲 ♟️ 🧩 🎯 🎳 🎨 🎬 🎤 🎧 🎵 🎶 🎹 🥁 🎸 🎺 🎻 🎉 🎊 🎈 🎁 📚 📖 📝 ✏️ 🖊️ 📌 📎 📐 💻 🖥️ 📱 ⌚ 📷 💡 🔦 💰 💸 💳 🧾 🚀 ✈️ 🚗 🚕 🚲 🛴 🏠 🏫 🗿"},
  {id:"symbols", tab:"✅", name:"Symbols", list:"✅ ☑️ ✔️ ❌ ❎ ➕ ➖ ✖️ ➗ ♾️ ‼️ ⁉️ ❓ ❗ 〰️ ⚠️ 🚫 ⛔ 🔞 📵 🔇 🔈 🔊 🔔 🔕 🔒 🔓 🔑 💯 🆗 🆒 🆕 🆓 🔝 🔜 🔙 ▶️ ⏸️ ⏹️ ⏺️ ⏭️ 🔁 🔀 ℹ️ 🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪ 🟥 🟧 🟨 🟩 🟦 🟪 ⬛ ⬜"},
];
function recentEmoji(){ return prefs.recentEmoji || ["👍","❤️","😂","🔥","💀","🎉","😭","🙏"]; }
function pushRecent(e){ prefs.recentEmoji = [e, ...recentEmoji().filter(x => x !== e)].slice(0, 27); savePrefs(); }
function buildEmojiGrid(cat){
  emoCat = cat || emoCat || "recent";
  const tabs = $("emoTabs"); tabs.innerHTML = "";
  EMOJI_CATS.forEach(c => tabs.appendChild(h("button",{class: c.id === emoCat ? "on" : "", title:c.name, onclick:e => { e.stopPropagation(); buildEmojiGrid(c.id); }}, c.tab)));
  const g = $("emoGrid"); g.innerHTML = "";
  const c = EMOJI_CATS.find(x => x.id === emoCat);
  g.appendChild(h("div",{class:"emohead",text:c.name}));
  const list = c.id === "recent" ? recentEmoji() : c.list.split(" ");
  list.forEach(e => g.appendChild(h("button",{onclick:() => { const cb = emoCb; pushRecent(e); closePops(); if (cb) cb(e); else insertAt(e); }}, e)));
}
function insertAt(t){ const s = input.selectionStart ?? input.value.length; input.value = input.value.slice(0,s) + t + input.value.slice(input.selectionEnd ?? s); input.selectionStart = input.selectionEnd = s + t.length; input.focus(); autoGrow(); }
function openEmoji(cb){ closePops(); emoCb = cb || null; buildEmojiGrid(); $("emoPop").classList.remove("hidden"); }
function closePops(){ $("emoPop").classList.add("hidden"); $("gifPop").classList.add("hidden"); emoCb = null; }
$("emoBtn").onclick = e => { e.stopPropagation(); const open = !$("emoPop").classList.contains("hidden"); closePops(); if (!open) openEmoji(); };
$("gifBtn").onclick = e => { e.stopPropagation(); const open = !$("gifPop").classList.contains("hidden"); closePops(); if (!open) $("gifPop").classList.remove("hidden"); };
document.addEventListener("click", e => { if (!e.target.closest(".pop") && !e.target.closest("#emoBtn") && !e.target.closest("#gifBtn") && !e.target.closest(".quick")) closePops(); });
document.addEventListener("keydown", e => {
  if (e.key === "Escape"){
    const top = $("layer").lastElementChild;
    if (document.querySelector(".lightbox,.quick,.profile")){ document.querySelectorAll(".lightbox,.quick,.profile").forEach(x => x.remove()); return; }
    if (top && top._close){ top._close(); return; }
    closePops(); closeNav(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && S.routed === "app"){ e.preventDefault(); quickSwitcher(); }
});
function renderGifs(){
  const g = $("gifGrid"); g.innerHTML = "";
  if (!S.gifs.length){ g.appendChild(h("div",{class:"empty-note",style:{gridColumn:"1/-1",textAlign:"center",padding:"20px"},text:"No GIFs yet. Upload one and it's saved here for everyone to reuse."})); return; }
  S.gifs.forEach(x => g.appendChild(h("img",{src:x.img, loading:"lazy", title:"Added by " + nickOf(x.uid), onclick:() => { closePops(); send({gif:true, img:x.img}); }})));
}
$("gifUp").onclick = () => $("gifFile").click();
$("gifFile").onchange = async () => {
  const f = $("gifFile").files[0]; $("gifFile").value = ""; if (!f) return;
  toast("Uploading GIF…");
  try{ const img = await imageToData(f); await setDoc(doc(db, "gifs", rid()), {uid:S.uid, ts:Date.now(), img}); closePops(); send({gif:true, img}); }
  catch(e){ toast("Couldn't upload: " + errMsg(e)); }
};

// ---------------------------------------------------------------- mobile nav
$("burger").onclick = () => document.body.classList.add("nav-open");
$("scrim").onclick = closeNav;
function closeNav(){ document.body.classList.remove("nav-open"); }

// ---------------------------------------------------------------- modals
function modal(build, cls){
  const bg = h("div",{class:"modalbg"}); const m = h("div",{class:"modal" + (cls ? " " + cls : "")}); bg.appendChild(m);
  const close = () => { bg.remove(); if (S.paneRefresh && S.paneRefresh.bg === bg) S.paneRefresh = null; };
  bg.addEventListener("mousedown", e => { if (e.target === bg) close(); });
  bg._close = close;
  build(m, close, bg); $("layer").appendChild(bg); const f = m.querySelector("input:not([type=color])"); if (f && !cls) f.focus(); return close;
}
function confirmBox(title, text, okLabel, onOk, positive){
  modal((m, close) => { m.append(h("h3",{text:title}), h("p",{class:"note",text}),
    h("div",{class:"foot"}, h("button",{class:"btn ghost",onclick:close},"Cancel"), h("button",{class:"btn small" + (positive ? "" : " danger"), onclick:() => { close(); onOk(); }}, okLabel))); });
}
function newDMModal(){
  modal((m, close) => {
    m.append(h("h3",{text:"New direct message"}), h("p",{class:"note",text:"Pick someone to message privately."}));
    const f = h("input",{class:"inp", placeholder:"Type a name", style:{marginTop:"10px"}}); m.appendChild(f);
    const list = h("div",{class:"list"}); m.appendChild(list);
    const draw = () => { list.innerHTML = ""; const q = f.value.toLowerCase();
      const us = Object.keys(S.members).filter(u => u !== S.uid && !isBanned(u) && nickOf(u).toLowerCase().includes(q)).sort((a,b) => (isOn(b) - isOn(a)) || nickOf(a).localeCompare(nickOf(b)));
      if (!us.length) list.appendChild(h("div",{class:"note",text:"Nobody found."}));
      us.forEach(u => list.appendChild(h("div",{class:"li", style:{cursor:"pointer"}, onclick:() => { close(); openDM(u); }}, avatar(u, "sm", true), paintName(h("span",{class:"nm",text:nickOf(u)}), u)))); };
    f.oninput = draw; draw();
    m.appendChild(h("div",{class:"foot"}, h("button",{class:"btn ghost",onclick:close},"Close")));
  });
}
function quickSwitcher(){
  modal((m, close) => {
    m.append(h("h3",{text:"Jump to…"}));
    const f = h("input",{class:"inp", placeholder:"Room or person", style:{marginTop:"10px"}}); m.appendChild(f);
    const list = h("div",{class:"list"}); m.appendChild(list);
    let items = [], sel = 0;
    const draw = () => { list.innerHTML = ""; const q = f.value.toLowerCase();
      items = [...S.rooms.filter(r => r.name.includes(q)).map(r => ({label:"# " + r.name, go:() => openChat("room", r.id)})),
        ...Object.keys(S.members).filter(u => u !== S.uid && !isBanned(u) && nickOf(u).toLowerCase().includes(q)).map(u => ({label:"@ " + nickOf(u), go:() => openDM(u)}))].slice(0, 10);
      sel = Math.min(sel, Math.max(0, items.length - 1));
      items.forEach((it, i) => list.appendChild(h("div",{class:"li", style:{cursor:"pointer", outline: i === sel ? "2px solid var(--accent)" : ""}, onclick:() => { close(); it.go(); }}, h("span",{class:"nm",text:it.label})))); };
    f.oninput = () => { sel = 0; draw(); };
    f.onkeydown = e => { if (e.key === "ArrowDown"){ sel = Math.min(items.length - 1, sel + 1); draw(); e.preventDefault(); } if (e.key === "ArrowUp"){ sel = Math.max(0, sel - 1); draw(); e.preventDefault(); } if (e.key === "Enter" && items[sel]){ close(); items[sel].go(); } };
    draw();
    m.appendChild(h("p",{class:"note",text:"Tip: Ctrl/⌘ + K opens this anywhere."}));
  });
}
function roomModal(room, cat){
  modal((m, close) => {
    m.append(h("h3",{text: room ? "Edit #" + room.name : "Create a room"}));
    const n = h("input",{class:"inp", placeholder:"new-room", value: room ? room.name : ""});
    const t = h("input",{class:"inp", placeholder:"What's this room for?", value: room ? room.topic || "" : ""});
    const c = h("input",{class:"inp", placeholder:"Text rooms", value: room ? room.category || "Text rooms" : (cat || "Text rooms"), list:"catlist"});
    const dl = h("datalist",{id:"catlist"}, [...new Set(S.rooms.map(r => r.category || "Text rooms"))].map(x => h("option",{value:x})));
    let ro = !!(room && room.readonly);
    const sw = h("button",{class:"sw" + (ro ? " on" : ""), onclick:() => { ro = !ro; sw.classList.toggle("on", ro); }});
    m.append(h("label",{class:"f",text:"Room name"}), n, h("label",{class:"f",text:"Topic"}), t, h("label",{class:"f",text:"Category"}), c, dl,
      h("div",{class:"toggle"}, h("div",{class:"tl"}, h("b",{text:"Announcement room"}), h("span",{text:"Only admins and developers can post"})), sw));
    let priv = !!(room && room.private); const allowed = new Set((room && room.allowed) || []);
    const people = h("div",{class:"list picker" + (priv ? "" : " hidden")});
    const drawPeople = () => { people.innerHTML = "";
      Object.keys(S.members).filter(u => u !== S.uid && !isBanned(u)).sort((a,b) => nickOf(a).localeCompare(nickOf(b))).forEach(u => {
        const on = allowed.has(u);
        people.appendChild(h("div",{class:"li pick" + (on ? " on" : ""), onclick:() => { on ? allowed.delete(u) : allowed.add(u); drawPeople(); }},
          avatar(u, "sm"), paintName(h("span",{class:"nm",text:nickOf(u)}), u), h("span",{class:"chk"}, on ? ic("check") : null))); });
      if (!people.children.length) people.appendChild(h("div",{class:"note",text:"Nobody else has joined yet."})); };
    if (isOwner()){
      const psw = h("button",{class:"sw" + (priv ? " on" : ""), onclick:() => { priv = !priv; psw.classList.toggle("on", priv); people.classList.toggle("hidden", !priv); }});
      m.append(h("div",{class:"toggle"}, h("div",{class:"tl"}, h("b",{}, ic("lock","sm"), " Private room"), h("span",{text:"Only you and the people you pick can see it"})), psw), people);
      drawPeople();
    }
    const save = async () => { const s = slug(n.value); if (!s){ toast("Give the room a name"); return; }
      const data = {name:s, topic:t.value.trim().slice(0,120), category:(c.value.trim() || "Text rooms").slice(0,32), readonly:ro};
      if (isOwner()){ data.private = priv; data.allowed = priv ? [...allowed] : []; }
      try{ if (room) await updateDoc(doc(db, "rooms", room.id), data);
        else { const id = s + "-" + rid().slice(-4); await setDoc(doc(db, "rooms", id), Object.assign(data, {order:S.rooms.length, createdAt:Date.now()})); close(); openChat("room", id); return; }
        close(); }catch(e){ toast("Couldn't save: " + errMsg(e)); } };
    n.onkeydown = e => { if (e.key === "Enter") save(); };
    m.appendChild(h("div",{class:"foot"}, h("button",{class:"btn ghost",onclick:close},"Cancel"), h("button",{class:"btn small",onclick:save}, room ? "Save" : "Create")));
  });
}

// ---------------------------------------------------------------- big modal (settings / admin)
function bigModal(sections, start, title){
  let cur = start;
  modal((m, close, bg) => {
    const nav = h("div",{class:"nav"}); const pane = h("div",{class:"pane"});
    m.append(nav, pane);
    const draw = () => {
      nav.innerHTML = "";
      sections.forEach(s => { if (s.header){ nav.appendChild(h("div",{class:"h",text:s.header})); return; } if (s.hidden) return;
        nav.appendChild(h("button",{class: (s.id === cur ? "on" : "") + (s.action ? " navshop" : ""), onclick:() => { if (s.action) return s.action(close); cur = s.id; draw(); }}, s.icon ? ic(s.icon) : null, s.label)); });
      pane.innerHTML = ""; const sec = sections.find(s => s.id === cur);
      pane.append(h("button",{class:"ib close",title:"Close (Esc)",onclick:close}, ic("x")), sec.noTitle ? null : h("h2",{text:sec.label}));
      sec.render(pane);
    };
    S.paneRefresh = {bg, draw};
    draw();
  }, "big-modal");
}
function closeTopModal(){ const t = $("layer").lastElementChild; if (t && t._close) t._close(); }
function refreshOpenPane(){ if (S.paneRefresh && document.body.contains(S.paneRefresh.bg)){ const a = document.activeElement; if (a && a.tagName === "INPUT" && S.paneRefresh.bg.contains(a)) return; S.paneRefresh.draw(); } }
function toggleRow(title, desc, on, onChange){ const sw = h("button",{class:"sw" + (on ? " on" : "")}); sw.onclick = () => { on = !on; sw.classList.toggle("on", on); onChange(on); };
  return h("div",{class:"toggle"}, h("div",{class:"tl"}, h("b",{text:title}), desc ? h("span",{text:desc}) : null), sw); }

function openSettings(start){
  bigModal([
    {header:"User settings"},
    {id:"account", label:"My Account", icon:"user", render:paneAccount},
    {id:"profile", label:"Profile", icon:"smile", render:paneProfile},
    {header:"App settings"},
    {id:"appearance", label:"Appearance", icon:"palette", render:paneAppearance},
    {id:"notifications", label:"Notifications", icon:"bell", render:paneNotifications},
    {id:"shortcuts", label:"Shortcuts & commands", icon:"keyboard", render:paneShortcuts},
    {header:"Campus+"},
    {id:"shop", label:"Shop & ranks", icon:"bag", action:close => { close(); openShop(); }},
    {id:"about", label:"About", icon:"info", render:paneAbout},
  ], start === "shop" ? "account" : (start || "account"));
  if (start === "shop"){ closeTopModal(); openShop(); }
}
function paneAccount(p){
  const me = member(S.uid); let color = me.color;
  const n = h("input",{class:"inp", value:me.nick, maxlength:"24"});
  const cs = h("div",{class:"colors"}, COLORS.map(c => { const b = h("button",{class: c === color ? "on" : "", style:{background:c}, onclick:() => { color = c; [...cs.children].forEach(x => x.classList.remove("on")); b.classList.add("on"); }}); return b; }));
  const av = avatar(S.uid, "xl", true);
  p.append(h("div",{class:"preview-card", style:{display:"flex",gap:"14px",alignItems:"center"}}, av, h("div",null, paintName(h("div",{style:{fontSize:"20px",fontWeight:"800"},text:nickOf(S.uid)}), S.uid), h("div",{class:"note",text: isOwner() ? "👑 Server admin" : isDev(S.uid) ? "💻 Developer" : "Member"}))),
    avatarMaker(),
    h("label",{class:"f",text:"Display name"}), n, h("label",{class:"f",text:"Name color"}), cs,
    h("button",{class:"btn small", style:{marginTop:"16px"}, onclick:async () => { const v = n.value.trim(); if (v.length < 2){ toast("Name needs at least 2 characters"); return; }
      try{ await updateDoc(doc(db, "members", S.uid), {nick:v, color}); toast("Saved"); }catch(e){ toast("Couldn't save: " + errMsg(e)); } }}, "Save changes"),
    h("label",{class:"f",text:"Your user ID"}), h("div",{class:"li"}, h("span",{class:"nm",style:{fontFamily:"monospace",fontSize:"12px"},text:S.uid}), h("button",{class:"btn small ghost",onclick:() => copy(S.uid,"ID copied")},"Copy")),
    h("p",{class:"note",text:"Your login is saved in this browser. If you clear your browser data or use another browser, you'll join as a new person."}));
}
function paneProfile(p){
  const pr = profile(S.uid);
  const bio = h("textarea",{class:"inp", maxlength:"190", placeholder:"Tell people a bit about yourself"}); bio.value = pr.bio || "";
  const cst = h("input",{class:"inp", maxlength:"60", placeholder:"e.g. 📚 studying for finals", value:pr.customStatus || ""});
  const st = h("div",{class:"seg"}, STATUSES.map(s => h("button",{class: (pr.status || "online") === s.id ? "on" : "", title:s.d, onclick:async () => { await setMyProfile({status:s.id}).catch(()=>{}); S.sentInvisible = false; heartbeat(); refreshOpenPane(); }}, s.name)));
  p.append(h("label",{class:"f",text:"Status"}), st, h("label",{class:"f",text:"Custom status"}), cst, h("label",{class:"f",text:"About me"}), bio,
    h("button",{class:"btn small", style:{marginTop:"14px"}, onclick:async () => { try{ await setMyProfile({bio:bio.value.trim().slice(0,190), customStatus:cst.value.trim().slice(0,60)}); toast("Profile saved"); }catch(e){} }}, "Save profile"));
  // name effect
  const fxOk = hasPerk(S.uid, "name_fx");
  p.append(h("label",{class:"f"}, "Name effect ", fxOk ? null : ic("lock","sm")));
  const cur = pr.nameFx || (isOwner() ? "rainbow" : "none");
  p.append(h("div",{class:"seg wrap"}, [{id:"none",name:"None"}, ...NAME_FX].map(fx => { const ok = fx.ex ? hasPerk(S.uid, "fx_exclusive") : fxOk;
    return h("button",{class: cur === fx.id ? "on" : "", disabled: !ok, title: ok ? "" : (fx.ex ? "Campus++ exclusive" : "Locked"), onclick:async () => { if (!ok) return; await setMyProfile({nameFx:fx.id}).catch(()=>{}); refreshOpenPane(); }},
    fx.id === "none" ? h("span",{text:"None"}) : h("span",{class:"fx fx-" + fx.id, text:fx.name}), !ok ? ic("lock","sm") : null); })));
  if (!fxOk) p.append(h("p",{class:"note"}, "Unlock animated names with ", h("a",{href:"#", onclick:e => { e.preventDefault(); openShop(); }}, "Animated Name or Campus+"), "."));
  const bnOk = hasPerk(S.uid, "banner");
  p.append(h("label",{class:"f"}, "Profile banner ", bnOk ? null : ic("lock","sm")));
  const bc = h("input",{type:"color", value: pr.banner || colorOf(S.uid), disabled: !bnOk, style:{width:"60px",height:"36px",border:"0",background:"none",cursor: bnOk ? "pointer" : "not-allowed"}, onchange:e => setMyProfile({banner:e.target.value}).then(() => toast("Banner saved")).catch(()=>{})});
  p.append(h("div",{class:"row"}, bc, bnOk ? h("button",{class:"btn small ghost", onclick:() => setMyProfile({banner:deleteField()}).then(refreshOpenPane).catch(()=>{})}, "Reset") : h("span",{class:"note",style:{margin:0},text:"Unlock with Profile Banner or Campus+."})));
}
function paneAppearance(p){
  const premiumOk = hasPerk(S.uid, "themes");
  const grid = h("div",{class:"themes"}, THEMES.map(t => h("button",{class:"theme" + (prefs.theme === t.id ? " on" : ""), onclick:() => {
      if (t.premium && !premiumOk){ toast(t.name + " is a premium theme — unlock it in the Shop"); openShop(); return; }
      prefs.theme = t.id; savePrefs(); applyPrefs(); refreshOpenPane(); }},
    h("div",{class:"pv"}, t.c.map(c => h("i",{style:{background:c}}))), h("div",{class:"lb",text:t.name}), t.premium && !premiumOk ? h("span",{class:"lock"}, ic("lock"), " Premium") : null)));
  p.append(h("label",{class:"f",text:"Theme"}), grid);
  const acc = h("div",{class:"colors"}, ACCENTS.map(c => h("button",{class: (prefs.accent || "#7c5cff") === c ? "on" : "", style:{background:c}, onclick:() => { prefs.accent = c; savePrefs(); applyPrefs(); refreshOpenPane(); }})),
    h("input",{type:"color", value:prefs.accent || "#7c5cff", title:"Custom color", style:{width:"28px",height:"28px",border:"0",padding:"0",background:"none",cursor:"pointer"}, onchange:e => { prefs.accent = e.target.value; savePrefs(); applyPrefs(); }}));
  p.append(h("label",{class:"f",text:"Accent color"}), acc);
  const fsv = h("span",{text:(prefs.fs||15) + "px"});
  p.append(h("label",{class:"f"}, "Chat font size — ", fsv), h("input",{type:"range", min:"12", max:"20", value:String(prefs.fs||15), style:{width:"100%"}, oninput:e => { prefs.fs = +e.target.value; fsv.textContent = prefs.fs + "px"; savePrefs(); applyPrefs(); }}));
  p.append(h("label",{class:"f",text:"Display"}),
    toggleRow("Compact mode", "Fit more messages on screen", prefs.compact, v => { prefs.compact = v; savePrefs(); applyPrefs(); }),
    toggleRow("24-hour time", "Show 14:05 instead of 2:05 PM", prefs.time24, v => { prefs.time24 = v; savePrefs(); need("msgs"); }),
    toggleRow("Reduce motion", "Turn off animations (like animated names)", prefs.reduceMotion, v => { prefs.reduceMotion = v; savePrefs(); applyPrefs(); }),
    toggleRow("Show member list", "The people panel on the right", prefs.showMembers !== false, v => { prefs.showMembers = v; S.rpanel = v ? "members" : null; savePrefs(); need("rpanel","header"); }));
  p.append(h("p",{class:"note",text:"Appearance is saved on this device."}));
}
function paneNotifications(p){
  const perm = "Notification" in window ? Notification.permission : "unsupported";
  p.append(h("label",{class:"f",text:"Desktop notifications"}),
    perm === "granted" ? h("p",{class:"note",style:{marginTop:0},text:"Allowed in this browser ✓"}) :
    perm === "unsupported" ? h("p",{class:"note",style:{marginTop:0},text:"This browser doesn't support notifications."}) :
    h("button",{class:"btn small", onclick:() => Notification.requestPermission().then(refreshOpenPane)}, "Allow notifications"),
    h("label",{class:"f",text:"Notify me about"}),
    h("div",{class:"seg"}, [["all","All messages"],["mentions","Mentions & DMs"],["none","Nothing"]].map(([id, n]) => h("button",{class: prefs.desktop === id ? "on" : "", onclick:() => { prefs.desktop = id; savePrefs(); refreshOpenPane(); }}, n))),
    toggleRow("Sounds", "Play a ping for new notifications", prefs.sound, v => { prefs.sound = v; savePrefs(); if (v) ping(); }),
    h("p",{class:"note",text:"Setting your status to Do Not Disturb mutes everything."}));
}
function paneShortcuts(p){
  const rows = [["Enter","Send message"],["Shift + Enter","New line"],["↑ (empty box)","Edit your last message"],["Esc","Cancel reply / close popups"],["Ctrl/⌘ + K","Jump to a room or person"],["Shift + click 🗑️","Delete without confirming"],["@name","Mention someone"],["**bold**  *italic*  __underline__  ~~strike~~",""],["`code`   ```code block```","Code"],["||spoiler||","Hidden until clicked"],["> quote","Block quote"]];
  p.append(h("div",{class:"list"}, rows.map(r => h("div",{class:"li"}, h("span",{class:"nm",style:{fontFamily:"monospace"},text:r[0]}), h("span",{class:"s",text:r[1]})))));
  p.append(h("label",{class:"f",text:"Slash commands"}), h("div",{class:"list"}, SLASH.map(c => h("div",{class:"li"}, h("span",{class:"nm",style:{fontFamily:"monospace"},text:"/" + c.c + " " + c.a}), h("span",{class:"s",text:c.d})))));
}
function paneAbout(p){
  p.append(h("p",{class:"note",style:{fontSize:"14px"}}, "CampusCord version ", h("b",{text:APP_VERSION}), ". Live at ", h("a",{href:LIVE_URL,target:"_blank"},LIVE_URL), "."),
    h("p",{class:"note",text:"When a new version is published, a Refresh bar appears at the top of the app."}));
}

// ---------------------------------------------------------------- shop
function shopItem(id){ const base = CATALOG.find(c => c.id === id); const o = ((S.shop||{}).items||{})[id] || {}; return Object.assign({}, base, {price:o.price || base.price, link:o.link || "", enabled:o.enabled !== false}); }
function shopButton(c){
  const it = shopItem(c.id);
  const owned = hasPerk(S.uid, c.id);
  const pend = S.myOrders.find(o => o.item === c.id && o.status === "pending");
  const until = (((S.perks[S.uid]||{}).items||{})[c.id]||{}).until;
  if (owned) return h("div",{class:"owned"}, ic("check"), isOwner() ? " Included — you're the admin" : " Active" + (until ? " until " + new Date(until).toLocaleDateString() : ""));
  if (pend) return h("div",{class:"pending"}, ic("hourglass"), " Payment pending — an admin will activate it soon. ", h("a",{href:"#",onclick:e => { e.preventDefault(); cancelOrder(pend); }},"Cancel"));
  if (!it.link) return h("button",{class:"btn buy",disabled:true},"Coming soon");
  return h("button",{class:"btn buy", onclick:() => buy(c.id)}, c.tier ? "Get " + c.name : "Buy");
}
function openShop(){
  modal((m, close, bg) => {
    const draw = () => {
      m.innerHTML = "";
      const r = rankOf(S.uid);
      m.append(h("button",{class:"ib close",title:"Close (Esc)",onclick:close}, ic("x")),
        h("div",{class:"shophero"},
          h("div",{class:"shg"}, ic("sparkles")),
          h("div",null, h("h2",{text:"Campus+ Shop"}), h("p",{text:"Ranks, animated names and themes. Every purchase supports the server."})),
          h("div",{class:"myrank"}, h("span",{text:"Your rank"}), isOwner() ? chip("admin","crown","ADMIN") : r ? roleTags(S.uid).slice(-1)[0] : h("span",{class:"tag none",text:"MEMBER"}))));
      const tiers = h("div",{class:"tiers"});
      CATALOG.filter(c => c.tier).forEach(c => {
        const it = shopItem(c.id); if (!it.enabled && !isOwner()) return;
        tiers.appendChild(h("div",{class:"tier t" + c.tier},
          c.tier === 2 ? h("div",{class:"ribbon",text:"BEST VALUE"}) : null,
          h("div",{class:"th"}, c.tier === 2 ? chip("pp","zap","PLUS+") : chip("plus","sparkles","PLUS")),
          h("div",{class:"tn",text:c.name}), h("div",{class:"td",text:c.desc}),
          h("div",{class:"tp"}, h("b",{text:it.price.split("/")[0].trim()}), it.price.includes("/") ? h("span",{text:" / " + it.price.split("/")[1].trim()}) : null),
          h("ul",{class:"feat"}, c.list.map(x => h("li",null, ic("check"), h("span",{text:x})))),
          shopButton(c)));
      });
      m.appendChild(tiers);
      // name effect preview
      const prev = h("div",{class:"fxrow"});
      NAME_FX.forEach(fx => { const ok = hasPerk(S.uid, fx.ex ? "fx_exclusive" : "name_fx");
        prev.appendChild(h("button",{class:"fxpv" + ((profile(S.uid).nameFx || (isOwner() ? "rainbow" : "")) === fx.id ? " on" : ""), title: ok ? "Use " + fx.name : (fx.ex ? "Campus++ only" : "Unlock with Animated Name or Campus+"),
          onclick:() => { if (!ok){ toast(fx.ex ? fx.name + " is a Campus++ exclusive" : "Unlock animated names first"); return; } setMyProfile({nameFx:fx.id}).then(() => { toast(fx.name + " equipped"); draw(); }).catch(()=>{}); }},
          h("span",{class:"fx fx-" + fx.id, text:nickOf(S.uid)}), h("small",null, ok ? null : ic("lock","sm"), " " + fx.name + (fx.ex ? " ++" : "")))); });
      m.append(h("h3",{class:"sh3",text:"Preview your name"}), prev);
      const grid = h("div",{class:"shop"});
      CATALOG.filter(c => !c.tier).forEach(c => { const it = shopItem(c.id); if (!it.enabled && !isOwner()) return;
        grid.appendChild(h("div",{class:"item"}, h("div",{class:"ii"}, ic(c.icon)), h("div",{class:"in",text:c.name}), h("div",{class:"id",text:c.desc}), h("div",{class:"ip",text:it.price}), shopButton(c))); });
      m.append(h("h3",{class:"sh3",text:"Individual perks"}), grid);
      if (S.myOrders.length){
        m.append(h("h3",{class:"sh3",text:"My purchases"}), h("div",{class:"list"}, [...S.myOrders].sort((a,b) => b.ts - a.ts).map(o => h("div",{class:"li"},
          ic((CATALOG.find(c => c.id === o.item)||{icon:"receipt"}).icon), h("span",{class:"nm",text:(CATALOG.find(c => c.id === o.item)||{name:o.item}).name}), h("span",{class:"s",text:new Date(o.ts).toLocaleDateString()}),
          h("span",{class:"s st-" + o.status,text: o.status === "approved" ? "Active" : o.status === "rejected" ? "Not approved" : "Pending"})))));
      }
      m.append(h("p",{class:"note shopnote"}, ic("lock","sm"), " Checkout is handled securely by Stripe. Perks are cosmetic. After you pay, the server admin activates your perk — usually within a few hours."));
    };
    S.paneRefresh = {bg, draw};
    draw();
  }, "shopmodal");
}
async function buy(itemId){
  const it = shopItem(itemId); if (!it.link) return;
  const orderId = "cc_" + rid();
  try{ await setDoc(doc(db, "orders", orderId), {uid:S.uid, nick:nickOf(S.uid), item:itemId, price:it.price, ts:Date.now(), status:"pending"}); }
  catch(e){ toast("Couldn't start checkout: " + errMsg(e)); return; }
  const url = it.link + (it.link.includes("?") ? "&" : "?") + "client_reference_id=" + encodeURIComponent(orderId);
  window.open(url, "_blank", "noopener");
  toast("Opening Stripe checkout… after you pay, an admin activates your perk.");
}
async function cancelOrder(o){ try{ await deleteDoc(doc(db, "orders", o.id)); }catch(e){ toast("Couldn't cancel: " + errMsg(e)); } }
function handleReturnFromCheckout(){ if (location.hash === "#thanks"){ history.replaceState(null, "", location.pathname); setTimeout(() => toast("Thanks for your purchase! 💜 An admin will activate your perk shortly."), 800); } }

// ---------------------------------------------------------------- admin
function openAdmin(start){
  bigModal([
    {header:(S.config && S.config.serverName) || "CampusCord"},
    {id:"overview", label:"Overview", icon:"grid", render:adminOverview},
    {id:"rooms", label:"Rooms", icon:"hash", render:adminRooms},
    {id:"members", label:"Members & roles", icon:"users", render:adminMembers},
    {header:"Monetization", hidden:!isOwner()},
    {id:"shop", label:"Shop & Stripe", icon:"bag", render:adminShop, hidden:!isOwner()},
    {id:"orders", icon:"receipt", label:"Orders" + (S.orders.filter(o => o.status === "pending").length ? " (" + S.orders.filter(o => o.status === "pending").length + ")" : ""), render:adminOrders, hidden:!isOwner()},
  ], start || "overview");
}
function adminOverview(p){
  const code = h("input",{class:"inp", value:S.invite || "", maxlength:"24"});
  p.append(h("label",{class:"f",text:"Invite code"}), h("div",{class:"row"}, code,
      h("button",{class:"btn small", onclick:async () => { const v = code.value.trim(); if (v.length < 3){ toast("At least 3 characters"); return; } try{ await setDoc(doc(db, "secret/invite"), {code:v}); toast("Invite code updated"); }catch(e){ toast("Couldn't save: " + errMsg(e)); } }}, "Save"),
      h("button",{class:"btn small ghost", onclick:() => copy("Join me on CampusCord! " + LIVE_URL + "  Invite code: " + code.value, "Invite message copied")}, "Copy invite")),
    h("p",{class:"note",text:"Friends type this the first time they join. Changing it doesn't kick anyone."}));
  if (isOwner()){
    const nm = h("input",{class:"inp", value:(S.config.serverName || "CampusCord"), maxlength:"32"});
    const ic = h("input",{class:"inp", value:(S.config.serverIcon || "CC"), maxlength:"4", style:{width:"90px"}});
    p.append(h("label",{class:"f",text:"Server name & icon"}), h("div",{class:"row"}, nm, ic,
      h("button",{class:"btn small", onclick:async () => { try{ await updateDoc(doc(db, "config/main"), {serverName:nm.value.trim().slice(0,32) || "CampusCord", serverIcon:ic.value.trim().slice(0,4) || "CC"}); toast("Saved"); }catch(e){ toast("Couldn't save: " + errMsg(e)); } }}, "Save")),
      h("p",{class:"note",text:"The icon can be 1–4 letters or an emoji."}));
  }
  if (isOwner()){
    let gifsToo = false;
    const gsw = h("button",{class:"sw", onclick:() => { gifsToo = !gifsToo; gsw.classList.toggle("on", gifsToo); }});
    p.append(h("div",{class:"danger-zone"},
      h("div",{class:"dzh"}, ic("alert"), h("b",{text:"Danger zone"})),
      h("div",{class:"toggle"}, h("div",{class:"tl"}, h("b",{text:"Delete all messages"}), h("span",{text:"Wipes every message, reaction and pin in every room, plus your own DM messages. Rooms, members and settings stay. Other people's DMs are private, so only they can delete those."})),
        h("button",{class:"btn small danger", onclick:() => wipeConfirm(() => gifsToo)}, ic("trash"), " Delete all")),
      h("div",{class:"toggle",style:{borderBottom:0}}, h("div",{class:"tl"}, h("b",{text:"Also clear the GIF library"}), h("span",{text:"Removes every saved GIF."})), gsw)));
  }
  const n = Object.keys(S.members).length, on = Object.keys(S.members).filter(isOn).length;
  p.append(h("label",{class:"f",text:"Stats"}), h("div",{class:"list"},
    h("div",{class:"li"}, h("span",{class:"nm",text:"Members"}), h("b",{text:String(n)})),
    h("div",{class:"li"}, h("span",{class:"nm",text:"Online now"}), h("b",{text:String(on)})),
    h("div",{class:"li"}, h("span",{class:"nm",text:"Rooms"}), h("b",{text:String(S.rooms.length)}))));
}
function adminRooms(p){
  p.append(h("button",{class:"btn small", onclick:() => roomModal()}, "+ New room"));
  const list = h("div",{class:"list", style:{marginTop:"12px"}});
  S.rooms.forEach((r, i) => list.appendChild(h("div",{class:"li"},
    ic(r.private ? "lock" : r.readonly ? "megaphone" : "hash"), h("span",{class:"nm"}, h("b",{text:r.name}), h("span",{class:"s",text:"  · " + (r.category || "Text rooms")})),
    h("button",{class:"ib", title:"Move up", disabled: i === 0, onclick:() => moveRoom(i, -1)}, ic("chevronup")),
    h("button",{class:"ib", title:"Move down", disabled: i === S.rooms.length - 1, onclick:() => moveRoom(i, 1)}, ic("chevron")),
    h("button",{class:"btn small ghost", onclick:() => roomModal(r)}, "Edit"),
    h("button",{class:"btn small ghost", onclick:() => confirmBox("Clear #" + r.name + "?", "Deletes the most recent messages in this room for everyone.", "Clear", () => clearRoom(r.id))}, "Clear"),
    h("button",{class:"btn small danger", onclick:() => confirmBox("Delete #" + r.name + "?", "The room disappears for everyone.", "Delete", async () => { await clearRoom(r.id); deleteDoc(doc(db, "rooms", r.id)).catch(()=>{}); deleteDoc(doc(db, "meta", r.id)).catch(()=>{}); })}, "Delete"))));
  p.appendChild(list);
}
function wipeConfirm(gifsToo){
  modal((m, close) => {
    const inp = h("input",{class:"inp", placeholder:"Type DELETE to confirm"});
    const go = h("button",{class:"btn small danger", disabled:true, onclick:async () => { close(); await wipeAll(gifsToo()); }}, "Delete everything");
    inp.oninput = () => { go.disabled = inp.value.trim() !== "DELETE"; };
    m.append(h("h3",{text:"Delete all messages?"}), h("p",{class:"note",text:"This permanently removes every message in every room for everyone. It can't be undone."}), inp,
      h("div",{class:"foot"}, h("button",{class:"btn ghost",onclick:close},"Cancel"), go));
  });
}
async function wipeAll(gifsToo){
  let n = 0;
  const t = h("div",{class:"toast",text:"Deleting messages…"}); document.body.appendChild(t);
  const drain = async (q) => { for (let guard = 0; guard < 200; guard++){ const snap = await getDocs(q); if (snap.empty) break;
      const b = writeBatch(db); snap.docs.forEach(d => b.delete(d.ref)); await b.commit(); n += snap.size; t.textContent = "Deleted " + n + " items…"; if (snap.size < 400) break; } };
  try{
    for (const r of S.rooms){
      for (const sub of ["msgs","reacts"]) await drain(query(collection(db, "rooms", r.id, sub), limit(400)));
      await deleteDoc(doc(db, "meta", r.id)).catch(()=>{});
    }
    for (const d of S.dms){
      await drain(query(collection(db, "dms", d.id, "msgs"), where("uid","==",S.uid), limit(400))).catch(()=>{});
      await drain(query(collection(db, "dms", d.id, "reacts"), where("uid","==",S.uid), limit(400))).catch(()=>{});
    }
    if (gifsToo) await drain(query(collection(db, "gifs"), limit(400)));
    S.mentions = {}; store("mentions", {});
    t.remove(); toast("Done — deleted " + n + " items.");
  }catch(e){ t.remove(); toast("Stopped after " + n + " items: " + errMsg(e)); }
}
async function moveRoom(i, d){ const a = S.rooms[i], b = S.rooms[i + d]; if (!a || !b) return;
  try{ await updateDoc(doc(db, "rooms", a.id), {order:i + d}); await updateDoc(doc(db, "rooms", b.id), {order:i});
    for (let k = 0; k < S.rooms.length; k++){ const r = S.rooms[k]; if (r !== a && r !== b && r.order !== k) await updateDoc(doc(db, "rooms", r.id), {order:k}); } }
  catch(e){ toast("Couldn't reorder: " + errMsg(e)); } }
async function clearRoom(roomId){
  try{ const snap = await getDocs(query(collection(db, "rooms", roomId, "msgs"), orderBy("ts","desc"), limit(300)));
    for (const d of snap.docs) await deleteDoc(d.ref);
    const rs = await getDocs(query(collection(db, "rooms", roomId, "reacts"), limit(1000)));
    for (const d of rs.docs) await deleteDoc(d.ref);
    toast("Room cleared");
  }catch(e){ toast("Couldn't clear: " + errMsg(e)); }
}
function adminMembers(p){
  const list = h("div",{class:"list"});
  Object.keys(S.members).filter(u => !isBanned(u)).sort((a,b) => nickOf(a).localeCompare(nickOf(b))).forEach(u => {
    const perks = Object.keys(((S.perks[u]||{}).items)||{}).filter(k => perkActive(S.perks[u].items[k]));
    list.appendChild(h("div",{class:"li"}, avatar(u, "sm", true), h("span",{class:"nm"}, paintName(h("b",{text:nickOf(u)}), u), " ", ...roleTags(u, true), perks.length ? h("span",{class:"s",text:"  ✦ " + perks.join(", ")}) : null),
      isOwner() && u !== S.uid ? h("button",{class:"btn small ghost", onclick:() => setDev(u, !isDev(u))}, isDev(u) ? "Remove dev" : "Make developer") : null,
      isOwner() && u !== S.uid ? h("button",{class:"btn small ghost", onclick:() => grantModal(u)}, "Perks") : null,
      u !== S.uid && !isOwnerUid(u) && (isOwner() || !isDev(u)) ? h("button",{class:"btn small danger", onclick:() => confirmBox("Kick " + nickOf(u) + "?", "They'll be locked out and can't rejoin unless unbanned.", "Kick", () => kick(u))}, "Kick") : null));
  });
  p.append(h("label",{class:"f",text:"Members"}), list);
  const banned = S.config.banned || [], names = S.config.bannedNames || {};
  p.append(h("label",{class:"f",text:"Kicked (" + banned.length + ")"}));
  if (!banned.length) p.append(h("p",{class:"note",style:{marginTop:0},text:"Nobody."}));
  p.append(h("div",{class:"list"}, banned.map(u => h("div",{class:"li"}, h("span",{class:"nm",text:names[u] || "Kicked member"}),
    h("button",{class:"btn small ghost", onclick:async () => { try{ await updateDoc(doc(db, "config/main"), {banned:arrayRemove(u)}); toast("Unbanned"); }catch(e){ toast("Couldn't unban: " + errMsg(e)); } }}, "Unban")))));
}
function grantModal(uid){
  modal((m, close) => {
    m.append(h("h3",{text:"Perks for " + nickOf(uid)}), h("p",{class:"note",text:"Grant or remove perks by hand (gifts, giveaways, refunds)."}));
    const list = h("div",{class:"list"});
    CATALOG.forEach(c => { const items = (S.perks[uid]||{}).items || {}; const on = perkActive(items[c.id]);
      list.appendChild(h("div",{class:"li"}, ic(c.icon), h("span",{class:"nm",text:c.name + (on && items[c.id].until ? " (until " + new Date(items[c.id].until).toLocaleDateString() + ")" : "")}),
        on ? h("button",{class:"btn small danger", onclick:async () => { await revokePerk(uid, c.id); close(); }}, "Remove") : h("button",{class:"btn small", onclick:async () => { await grantPerk(uid, c.id); close(); }}, "Grant"))); });
    m.append(list, h("div",{class:"foot"}, h("button",{class:"btn ghost",onclick:close},"Close")));
  });
}
async function grantPerk(uid, item){
  const c = CATALOG.find(x => x.id === item) || {};
  const prev = (((S.perks[uid]||{}).items||{})[item]) || {};
  const entry = {since:Date.now()};
  if (c.months){ const startAt = Math.max(Date.now(), prev.until || 0); entry.until = startAt + c.months * 31 * 864e5; }
  try{ await setDoc(doc(db, "perks", uid), {items:{[item]:entry}}, {merge:true}); toast("✦ " + (c.name || item) + " granted to " + nickOf(uid)); }
  catch(e){ toast("Couldn't grant: " + errMsg(e)); throw e; }
}
async function revokePerk(uid, item){ try{ await updateDoc(doc(db, "perks", uid), {["items." + item]:deleteField()}); toast("Removed"); }catch(e){ toast("Couldn't remove: " + errMsg(e)); } }
function adminShop(p){
  p.append(h("div",{class:"preview-card"},
    h("b",{text:"How payments work"}),
    h("ol",{class:"steps",style:{marginTop:"8px",fontSize:"13px"}},
      h("li",null, "In your ", h("a",{href:"https://dashboard.stripe.com/payment-links",target:"_blank",rel:"noopener"},"Stripe dashboard → Payment Links"), ", create one link per perk (subscription for Campus+, one-time for the rest)."),
      h("li",null, "Under ", h("b",{text:"After payment"}), ", set it to redirect to ", h("code",{text:LIVE_URL + "#thanks"}), "."),
      h("li",null, "Paste each link below and Save. Buyers' orders show up under Orders."),
      h("li",null, "Each checkout carries the order ID as the Stripe ", h("code",{text:"client_reference_id"}), ". Find the matching payment in Stripe, then click Approve."))));
  const rows = CATALOG.map(c => { const it = shopItem(c.id);
    const price = h("input",{class:"inp", value:it.price, style:{width:"140px"}}); const link = h("input",{class:"inp", value:it.link, placeholder:"https://buy.stripe.com/…"});
    let en = it.enabled; const sw = h("button",{class:"sw" + (en ? " on" : ""), title:"Show in shop", onclick:() => { en = !en; sw.classList.toggle("on", en); }});
    p.append(h("label",{class:"f"}, c.name), h("div",{class:"row"}, price, link, sw));
    return {id:c.id, price, link, get en(){ return en; }}; });
  p.append(h("button",{class:"btn small", style:{marginTop:"18px"}, onclick:async () => {
    const items = {}; for (const r of rows){ const l = r.link.value.trim(); if (l && !/^https:\/\/(buy\.stripe\.com|checkout\.stripe\.com|donate\.stripe\.com)\//.test(l)){ toast("That doesn't look like a Stripe payment link: " + l.slice(0,40)); return; } items[r.id] = {price:r.price.value.trim().slice(0,30), link:l, enabled:r.en}; }
    try{ await setDoc(doc(db, "config/shop"), {items, updatedAt:Date.now()}); toast("Shop saved"); }catch(e){ toast("Couldn't save: " + errMsg(e)); } }}, "Save shop"));
}
function adminOrders(p){
  if (!S.orders.length){ p.append(h("p",{class:"note",text:"No orders yet."})); return; }
  const list = h("div",{class:"list"});
  S.orders.forEach(o => { const c = CATALOG.find(x => x.id === o.item) || {name:o.item, icon:"receipt"};
    list.appendChild(h("div",{class:"li", style:{flexWrap:"wrap"}},
      ic(c.icon), h("span",{class:"nm"}, h("b",{text:(member(o.uid) ? nickOf(o.uid) : o.nick || "Someone") + " — " + c.name}), h("div",{class:"s",text:new Date(o.ts).toLocaleString() + " · " + (o.price||"")})),
      h("button",{class:"btn small ghost", title:"Copy order ID to search in Stripe", onclick:() => copy(o.id, "Order ID copied — search it in Stripe")}, o.id.slice(0, 14) + "…"),
      o.status === "pending" ? [h("button",{class:"btn small ok", onclick:async () => { try{ await grantPerk(o.uid, o.item); await updateDoc(doc(db, "orders", o.id), {status:"approved", decidedAt:Date.now()}); }catch(e){} }}, "Approve"),
        h("button",{class:"btn small danger", onclick:async () => { try{ await updateDoc(doc(db, "orders", o.id), {status:"rejected", decidedAt:Date.now()}); }catch(e){ toast(errMsg(e)); } }}, "Reject")]
      : h("span",{class:"s",text: o.status === "approved" ? "Approved ✓" : "Rejected"})));
  });
  p.append(h("p",{class:"note",style:{marginTop:0,marginBottom:"10px"},text:"Only approve an order after you see its payment in Stripe (search the order ID)."}), list);
}
async function setDev(uid, on){
  try{ await updateDoc(doc(db, "config/main"), {admins: on ? arrayUnion(uid) : arrayRemove(uid)}); toast(on ? nickOf(uid) + " is now a developer 💻" : nickOf(uid) + " is no longer a developer"); refreshOpenPane(); }
  catch(e){ toast("Couldn't update: " + errMsg(e)); }
}
async function kick(uid){
  try{ const upd = {banned:arrayUnion(uid), bannedNames:Object.assign({}, S.config.bannedNames||{}, {[uid]:nickOf(uid)})};
    if (isOwner() && isDev(uid)) upd.admins = arrayRemove(uid);
    await updateDoc(doc(db, "config/main"), upd);
    await deleteDoc(doc(db, "members", uid)); toast("Kicked"); refreshOpenPane();
  }catch(e){ toast("Couldn't kick: " + errMsg(e)); }
}

// ---------------------------------------------------------------- updates
function updBar(nodes){ const b = $("updbar"); b.innerHTML = ""; b.append(...nodes, h("button",{class:"x",onclick:() => b.classList.add("hidden")}, ic("x"))); b.classList.remove("hidden"); }
if (location.protocol === "file:"){
  setTimeout(() => updBar([h("span",{text:"CampusCord now lives online and updates itself."}), h("a",{href:LIVE_URL,target:"_blank",rel:"noopener"},"Open the live link")]), 1500);
} else {
  const check = async () => { try{
    const r = await fetch("version.json?t=" + Date.now(), {cache:"no-store"}); if (!r.ok) return;
    const v = (await r.json()).version;
    if (v && v !== APP_VERSION) updBar([h("span",{text:"A new version of CampusCord is available."}), h("button",{onclick:() => location.reload()},"Refresh")]);
  }catch(e){} };
  setTimeout(check, 5000); setInterval(check, 5*60*1000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
}

boot();
