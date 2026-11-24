// =====================================================================
//  CampusCord v3 — single-file client. Firebase config below.
// =====================================================================
const firebaseConfig = __FIREBASE_CONFIG__;

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, linkWithCredential, EmailAuthProvider, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, collection, onSnapshot, setDoc, updateDoc, deleteDoc, getDocs, query, where, orderBy, limit, writeBatch, arrayUnion, arrayRemove, deleteField, increment, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Bump APP_VERSION (and version.json) on every release so open tabs offer a refresh.
const APP_VERSION = "__APP_VERSION__";
const LIVE_URL = "https://campus-cord.github.io/";

// ---------------------------------------------------------------- constants
const COLORS = ["#7c5cff","#3fb8ff","#3ecf7a","#f5b83d","#f0565c","#ff7ac6","#22d3c5","#ff9447"];
const QUICK = ["👍","❤️","😂","😮","😢","🔥","💀","🎉"];
const EMOJIS = "😀 😃 😄 😁 😆 😅 🤣 😂 🙂 😉 😊 😇 🥰 😍 🤩 😘 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 😮‍💨 🤥 😌 😔 😪 😴 😷 🤒 🤕 🤢 🤮 🥵 🥶 🥴 😵 🤯 🤠 🥳 😎 🤓 🧐 😕 😟 🙁 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 💀 ☠️ 💩 🤡 👻 👽 🤖 🙈 🙉 🙊 💯 💥 💫 💦 💨 💬 💭 💤 👋 🤚 ✋ 🖖 👌 🤌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 👍 👎 ✊ 👊 👏 🙌 👐 🤲 🤝 🙏 💪 🧠 👀 🫡 🫠 🫶 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 ❣️ 💕 💞 💓 💗 💖 💘 🔥 ✨ ⭐ 🌟 ⚡ 🌈 ☀️ 🌙 ❄️ 🎉 🎊 🎈 🎁 🏆 🥇 🎮 🕹️ 🎧 🎵 🎶 📚 📝 ✏️ 📌 📎 💻 📱 ☕ 🍕 🍔 🍟 🌮 🍿 🍩 🍪 🎂 🍦 🧃 🥤 🐶 🐱 🐸 🐵 🦄 🐢 🐍 🦖 🐙 🦋 🌸 🌵 🍀 🚀 ✈️ 🚗 🏀 ⚽ 🏈 ⚾ 🎾 🏐 ✅ ❌ ⚠️ ❓ ❗ 💡 🔔 🔒 🗿 🤷 🤦 🙋 💁 🙆 🙅".split(" ");
const ONLINE_MS = 330000, HEARTBEAT_MS = 150000, PAGE = 100;

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
const NAME_FX = [{id:"yinyang",name:"Yin-Yang",own:true},{id:"rainbow",name:"Rainbow"},{id:"gold",name:"Gold"},{id:"fire",name:"Fire"},{id:"ocean",name:"Ocean"},{id:"neon",name:"Neon"},{id:"prism",name:"Prism",ex:true},{id:"aurora",name:"Aurora",ex:true},{id:"glitched",name:"Glitched"}];
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
  yinyang:'<circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20a5 5 0 0 1 0-10a5 5 0 0 0 0-10z" fill="currentColor"/><circle cx="12" cy="7" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="17" r="1.6" stroke="none" style="fill:var(--yyb,#000)"/>',
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
  volume:'<path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5ZM16 9a5 5 0 0 1 0 6M19.4 18.4a9 9 0 0 0 0-12.8"/>',
  mic:'<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>',
  micoff:'<path d="M2 2l20 20M18.89 13.23A7.12 7.12 0 0 0 19 12v-2M5 10v2a7 7 0 0 0 12 5M15 9.34V5a3 3 0 0 0-5.68-1.33M9 9v3a3 3 0 0 0 5.12 2.12M12 19v3"/>',
  headphones:'<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  headoff:'<path d="M2 2l20 20M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 2.6-6.4M21 14v-2a9 9 0 0 0-13.4-7.9M21 14h-1M18 21a2 2 0 0 1-2-2v-1"/>',
  phoneoff:'<path d="M10.7 13.3a16 16 0 0 0 3.4 2.6l1.3-1.3a2 2 0 0 1 2.1-.4 12.8 12.8 0 0 0 2.8.7 2 2 0 0 1 1.7 2v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1M5.2 13.2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9M22 2 2 22"/>',
  signal:'<path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/>',
  flag:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
  trophy:'<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  arrowdown:'<path d="M12 5v14M19 12l-7 7-7-7"/>',
  bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  receipt:'<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 17.5v-11"/>',
  grid:'<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  keyboard:'<rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>',
  alert:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
  refresh:'<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5"/>',
  pen:'<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
  camera:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  star:'<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  spark:'<path d="M12 2.5l2.3 6.2 6.2 2.3-6.2 2.3L12 19.5l-2.3-6.2L3.5 11l6.2-2.3z"/><path d="M19 17.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  heart:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  hourglass:'<path d="M5 22h14M5 2h14M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/>',
};
function ic(name, cls){ const s = document.createElement("span"); s.className = "i" + (cls ? " " + cls : ""); s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || "") + "</svg>"; return s; }

// Perk shop. Prices/links are set by the owner in Admin → Shop (stored in config/shop).
const CATALOG = [
  {id:"plus", icon:"sparkles", name:"Campus+", price:"$2.99 / month", months:1, tier:1,
   desc:"The essentials, all in one.", list:["PLUS rank badge next to your name","5 animated name effects","All 5 premium themes","Custom profile banner","Bigger uploads (GIFs up to 900 KB)"]},
  {id:"plusplus", icon:"zap", name:"Campus++", price:"$5.99 / month", months:1, tier:2,
   desc:"Everything in Campus+, turned all the way up.", list:["Everything in Campus+","Holographic PLUS+ rank badge","Exclusive Prism & Aurora name effects","Animated glowing avatar ring","Gradient profile banner","Listed in its own Campus++ section"]},
  {id:"name_fx", icon:"wand", name:"Animated Name", price:"$1.99", desc:"Rainbow, Gold, Fire, Ocean, Neon or Glitched — your name shimmers everywhere."},
  {id:"themes", icon:"palette", name:"Theme Pack", price:"$0.99", desc:"Unlock Midnight, Ocean, Sunset, Forest and Sakura."},
  {id:"banner", icon:"image", name:"Profile Banner", price:"$0.99", desc:"Pick a custom banner color for your profile card."},
  {id:"plus_year", icon:"sparkles", name:"Campus+ · 1 year", price:"$24.99", months:12, perk:"plus", desc:"Twelve months of Campus+ for the price of about eight."},
  {id:"plusplus_year", icon:"zap", name:"Campus++ · 1 year", price:"$49.99", months:12, perk:"plusplus", desc:"Twelve months of Campus++. Best deal on the top rank."},
  {id:"founder", icon:"crown", name:"Founder Badge", price:"$4.99", desc:"A Mythic Founder badge on your profile, for the people who backed CampusCord first."},
  {id:"sparks_1000", icon:"spark", name:"1,000 Sparks", price:"$0.99", coins:1000, desc:"A little top-up for one decoration or nameplate."},
  {id:"sparks_3000", icon:"spark", name:"3,000 Sparks", price:"$2.49", coins:3000, desc:"Enough for a bundle. 20% bonus value."},
  {id:"sparks_7500", icon:"spark", name:"7,500 Sparks", price:"$4.99", coins:7500, desc:"A whole new look. 50% bonus value."},
  {id:"sparks_15000", icon:"spark", name:"15,000 Sparks", price:"$8.99", coins:15000, desc:"Most of the shop. 67% bonus value."},
  {id:"sparks_40000", icon:"spark", name:"40,000 Sparks", price:"$19.99", coins:40000, desc:"Everything, plus extra for new drops. 100% bonus value."},
  {id:"supporter", icon:"gem", name:"Supporter Badge", price:"$0.99", desc:"A heart badge on your profile to show you back CampusCord."},
];
const PLUS_INCLUDES = ["name_fx","themes","banner","big_uploads","supporter"];
const PLUSPLUS_INCLUDES = [...PLUS_INCLUDES, "plus", "fx_exclusive", "ring", "banner_gradient"];

const SLASH = [
  {c:"vouch", a:"[@name]", d:"Write a star-rated vouch (in #vouches)"},
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
  {c:"poll", a:"<question> | <option> | <option>…", d:"Starts a poll (up to 10 options)"},
  {c:"help", a:"[question]", d:"Opens the CampusCord help bot"},
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
  rooms:[], members:{}, membersLoaded:false, profiles:{}, perks:{}, wallets:{}, walletsLoaded:false, catalogV:null, orders:[], myOrders:[],
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
function toast(t, ms){ const d = h("div",{class:"toast",text:t}); document.body.appendChild(d); setTimeout(()=>d.remove(), ms || 3400); }
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
// Co-owners (config.coOwners): almost everything the owner can do, except Stripe/payments and managing co-owners.
const isCoOwnerUid = uid => !!(S.config && (S.config.coOwners || []).includes(uid) && !isOwnerUid(uid));
const isRealOwner = () => isOwnerUid(S.uid);
const isOwner = () => isRealOwner() || isCoOwnerUid(S.uid);
const devUntil = uid => ((S.config && S.config.devUntil) || {})[uid] || 0;
const isDev = uid => !!(S.config && (S.config.admins||[]).includes(uid)) && (!devUntil(uid) || devUntil(uid) > Date.now());
// Designers made CampusCord's look (logo, role tags). A title + badge + ring; no extra admin powers.
const isDesigner = uid => !!(S.config && (S.config.designers||[]).includes(uid));
// Head developers: developers with extra powers (the owner picks them).
const isHeadDev = uid => isDev(uid) && ((S.config && S.config.headDevs) || []).includes(uid);
const canPostAnnouncements = () => isOwner() || isHeadDev(S.uid);
const isAdmin = () => isOwner() || (isDev(S.uid) && !!member(S.uid));
// Linked accounts: an old account's uid points at the new one (config/main.aliases), so its messages show the new person.
function realUid(uid){ const al = (S.config && S.config.aliases) || {}; let u = uid, n = 0; while (al[u] && n++ < 5) u = al[u]; return u; }
function member(uid){ uid = realUid(uid); const m = S.members[uid]; if (!m) return null;
  const lj = ((S.config && S.config.linkedJoined) || {})[uid]; return lj && (!m.joinedAt || lj < m.joinedAt) ? Object.assign({}, m, {joinedAt:lj}) : m; }
function profile(uid){ return S.profiles[realUid(uid)] || {}; }
function nickOf(uid){ const m = member(uid); return (m && m.nick) || "Former member"; }
function colorOf(uid){ const m = member(uid); return (m && m.color) || "#6f7480"; }
function isBanned(uid){ return !!(S.config && Array.isArray(S.config.banned) && S.config.banned.includes(uid)); }
function perkActive(entry){ return !!entry && (!entry.until || entry.until > Date.now()); }
function hasPerk(uid, key){
  if (isOwnerUid(uid)) return true;
  uid = realUid(uid); const items = (S.perks[uid] && S.perks[uid].items) || {};
  if (perkActive(items[key])) return true;
  if (PLUS_INCLUDES.includes(key) && perkActive(items.plus)) return true;
  if (PLUSPLUS_INCLUDES.includes(key) && perkActive(items.plusplus)) return true;
  return false;
}
function hasPlus(uid){ return hasPerk(uid, "plus"); }
// rank for display: "plusplus" | "plus" | "supporter" | null (the owner shows ADMIN instead)
function rankOf(uid){ const items = ((S.perks[realUid(uid)]||{}).items)||{};
  if (perkActive(items.plusplus)) return "plusplus"; if (perkActive(items.plus)) return "plus"; if (perkActive(items.supporter)) return "supporter"; return null; }
// Freshness on *our* clock: the first time we see a timestamp we trust it (capped at now); after that, whenever it
// changes we record when we saw the change. Friends whose computer clocks are off no longer look offline.
const SEEN = {};
function seenAt(key, ts){ if (!ts) return 0; const r = SEEN[key];
  if (!r){ SEEN[key] = {v:ts, at:Math.min(Date.now(), ts)}; } else if (r.v !== ts){ r.v = ts; r.at = Date.now(); } return SEEN[key].at; }
function statusOf(uid){
  const p = profile(uid), m = member(uid);
  if (uid === S.uid){ if (p.status === "invisible") return "offline"; if (p.status === "dnd") return "dnd"; return (p.status === "idle" || S.away) ? "idle" : "online"; }
  if (!m || !m.lastSeen || Date.now() - seenAt("m:" + uid, m.lastSeen) > ONLINE_MS || p.status === "invisible") return "offline";
  if (p.status === "dnd") return "dnd";
  return p.status === "idle" || m.away ? "idle" : "online";
}
const isOn = uid => statusOf(uid) !== "offline";
function fxOf(uid){ if (!hasPerk(uid, "name_fx")) return null; const f = profile(uid).nameFx; if (f === "none") return null;
  const fx = NAME_FX.find(x => x.id === f); if (fx && (fx.own ? isOwnerUid(uid) : (!fx.ex || hasPerk(uid, "fx_exclusive")))) return f; return isOwnerUid(uid) ? "yinyang" : null; }
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
function isPhotoAvatar(a){ return typeof a === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(a); }
function avatar(uid, size, withDot){
  const look = lookOf(uid);
  const photo = isPhotoAvatar(profile(uid).avatar) ? profile(uid).avatar : null;
  const face = look.face && AV_FACES.includes(look.face) ? look.face : null;
  const a = h("div",{class:"av" + (size ? " "+size : "") + (face ? " emo" : "")}, face || initials(nickOf(uid)));
  const bg = AV_BGS.find(b => b.id === look.bg);
  if (photo){ a.classList.add("photo"); a.textContent = ""; a.style.backgroundImage = 'url("' + photo + '")'; }
  else if (bg) a.style.background = bg.g;
  else { a.style.background = (look.bg && /^#[0-9a-f]{6}$/i.test(look.bg)) ? look.bg : colorOf(uid); a.style.backgroundImage = "linear-gradient(145deg, rgba(255,255,255,.18), rgba(0,0,0,.18))"; }
  if (hasPerk(uid, "ring")) a.classList.add("ring");
  const dc = size !== "xs" && (equipped(uid, "deco") || (isOwnerUid(uid) ? null : isDev(uid) ? "d_devring" : isDesigner(uid) ? "d_designring" : null)); if (dc){ a.appendChild(decoEl(dc)); a.classList.remove("ring"); }
  if (withDot) a.appendChild(h("span",{class:"dot " + statusOf(uid), title:{online:"Online",idle:"Idle",dnd:"Do Not Disturb",offline:"Offline"}[statusOf(uid)]}));
  return a;
}
let CHIP_MINI = false;
function chip(cls, iconName, text, title){ const mini = CHIP_MINI && iconName; return h("span",{class:"tag " + cls + (mini ? " mini" : "") + (iconName ? "" : " noi"), title: title || null}, iconName ? ic(iconName) : null, text && !mini ? h("b",{text}) : null); }
function miniTags(uid){ CHIP_MINI = true; try{ return roleTags(uid, true); } finally { CHIP_MINI = false; } }
function roleTags(uid, compact){
  const out = [];
  if (isOwnerUid(uid)) out.push(chip("admin",null,"OWNER","Owner of CampusCord"));
  else if (isCoOwnerUid(uid)) out.push(chip("admin coowner",null,"CO-OWNER","Co-owner of CampusCord"));
  else if (isHeadDev(uid)) out.push(chip("dev headdev","code","HEAD DEV","Head Developer"));
  else if (isDev(uid)) out.push(chip("dev","code","DEV","Developer"));
  if (isDesigner(uid) && !isOwnerUid(uid)) out.push(chip("design","pen","DESIGN","Designer — made CampusCord's look"));
  // Owner and co-owners just show their role, not a Campus+ rank.
  const r = isOwnerUid(uid) || isCoOwnerUid(uid) ? null : rankOf(uid);
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

// Looping animations (floating bubbles, rings, shimmer) restart from the beginning whenever the screen redraws,
// which looked like a jump. Pin every looping animation to the page's clock so a redrawn element picks up mid-motion.
let animSyncQ = 0;
function syncLoops(){ animSyncQ = 0; if (!document.getAnimations) return;
  for (const a of document.getAnimations()){ try{ if (a.startTime === 0 || !a.effect || a.effect.getTiming().iterations !== Infinity) continue; a.startTime = 0; }catch(e){} } }
new MutationObserver(() => { if (!animSyncQ) animSyncQ = requestAnimationFrame(syncLoops); }).observe(document.documentElement, {childList:true, subtree:true});
// ---------------------------------------------------------------- boot
function boot(){
  const splash = $("welcome-splash");
  if (splash) setTimeout(() => splash.remove(), 3100);
  applyPrefs();
  document.querySelectorAll("[data-ic]").forEach(b => b.prepend(ic(b.dataset.ic)));
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "PASTE_HERE"){ gateMsg("Not configured", "Paste your Firebase config at the top of the script."); return; }
  try{ const app = initializeApp(firebaseConfig); auth = getAuth(app);
    // Keep a copy of the data on this device: reopening CampusCord only downloads what changed, which keeps us well
    // inside Firebase's free daily limits. Falls back to the normal mode if the browser can't store it.
    try{ db = initializeFirestore(app, {localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})}); }catch(e){ db = getFirestore(app); } }
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
    S.config = snap.exists() ? snap.data() : null; S.configLoaded = true; if (S.routed === "app"){ setTimeout(maybeHeadDevPopup, 1500); setTimeout(maybeCoOwnerPopup, 1800); }
    if (isAdmin() && !S.inviteSub){ S.inviteSub = onSnapshot(doc(db, "secret/invite"), s => { S.invite = s.exists() ? s.data().code : null; }, ()=>{}); }
    route(); applyPrefs(); adoptLinkedProfile(); need("rail","side","header","msgs","rpanel","me","composer");
  }, e => gateMsg("Couldn't load CampusCord", "Make sure the Firestore rules are published. (" + errMsg(e) + ")"));
  onSnapshot(collection(db, "members"), snap => {
    const m = {}; snap.docs.forEach(d => m[d.id] = d.data()); S.members = m; S.membersLoaded = true;
    if (S.routed === "app" && isOwner()){ clearTimeout(S.hkT); S.hkT = setTimeout(ownerHousekeeping, 3000); }
    route(); need("side","msgs","rpanel","me","header","typing");
  }, e => gateMsg("Couldn't load CampusCord", "Make sure the Firestore rules are published. (" + errMsg(e) + ")"));
  // optional collections (need v3 rules) — fail quietly
  onSnapshot(collection(db, "profiles"), snap => { const p = {}; snap.docs.forEach(d => p[d.id] = d.data()); S.profiles = p; adoptLinkedProfile(); need("side","msgs","rpanel","me","header"); }, () => {});
  onSnapshot(collection(db, "wallet"), snap => { const w = {}; snap.docs.forEach(d => w[d.id] = d.data()); S.wallets = w; S.walletsLoaded = true;
    if (S.routed === "app") ensureWallet(); need("side","msgs","rpanel","me","rail"); refreshOpenPane();
    const mw = w[S.uid]; if (mw && mw.welcomed && prefs.sawWelcome !== mw.welcomed){ prefs.sawWelcome = mw.welcomed; savePrefs(); setTimeout(() => welcomeGiftPopup(), 1200); } }, () => {});
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
  if (S.holdBan) return; // showing "you've been unbanned + new code" until they click Rejoin
  if (S.routed === "banned") return; // stay on the ban/appeal screen; only "Rejoin" (a reload) leaves it
  if ((isBanned(S.uid) || deviceBanned()) && !isOwner()){ kickedOut(); return; }
  if (!member(S.uid)){
    if (S.routed === "app"){ stopAppSubs(); S.routed = null; }
    if (S.routed !== "join"){ S.routed = "join"; setupJoin(); show("g-join"); }
    return;
  }
  if (S.routed !== "app"){ S.routed = "app"; show("app"); initApp(); }
}
function kickedOut(){ if (S.routed === "banned") return; showBanAppeal(); }

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
  try{ const jc = localStorage.getItem("ccJoinCode"); if (jc){ $("j-code").value = jc; localStorage.removeItem("ccJoinCode"); } }catch(e){}
  const wrap = $("j-colors"); wrap.innerHTML = "";
  S.joinColor = COLORS[Math.floor(Math.random()*COLORS.length)];
  COLORS.forEach(c => { const b = h("button",{class: c === S.joinColor ? "on" : "", style:{background:c}, onclick: () => { S.joinColor = c; [...wrap.children].forEach(x => x.classList.remove("on")); b.classList.add("on"); }}); wrap.appendChild(b); });
  if (isOwner()){ $("j-codewrap").classList.add("hidden"); $("j-title").textContent = "Welcome back, admin"; $("j-sub").textContent = "Choose the name your friends will see."; }
  $("j-id").textContent = "Your ID: " + S.uid + "  (click to copy)";
  $("j-id").onclick = () => copy(S.uid, "ID copied");
  $("j-login").onclick = loginModal;
  setTimeout(()=> $("j-nick").focus(), 50);
}
// A random ID for this browser, saved with the member profile. Banning someone also bans their browser, so making a
// "new account" in the same browser doesn't get them back in.
function deviceId(){ let d = null; try{ d = localStorage.getItem("ccDevice"); if (!d){ d = "d" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("ccDevice", d); } }catch(e){} return d || "unknown"; }
const deviceBanned = () => !isOwner() && ((S.config && S.config.bannedDevices) || []).includes(deviceId());
// ---- unique names: names/{key} records who owns each name (case-insensitive)
const cleanNick = n => String(n || "").replace(/\s+/g, " ").trim().slice(0, 24);
const nameKey = n => cleanNick(n).toLowerCase().replace(/\//g, "_");
function nameTakenLocally(n, except){ const k = nameKey(n); return Object.entries(S.members).some(([u, m]) => u !== except && nameKey(m.nick) === k); }
async function claimName(n){
  const k = nameKey(n); const ref = doc(db, "names", k); const cur = await getDoc(ref);
  if (cur.exists()){ if (cur.data().uid === S.uid) return; const e = new Error("That name is already taken — pick a different one."); e.code = "name-taken"; throw e; }
  await setDoc(ref, {uid:S.uid, ts:Date.now()});
}
async function releaseName(n){ if (!n) return; try{ const ref = doc(db, "names", nameKey(n)); const cur = await getDoc(ref); if (cur.exists() && cur.data().uid === S.uid) await deleteDoc(ref); }catch(e){} }
// Change my own name (used by Settings, /nick and the real-name screen)
async function changeNick(v, extra){
  v = cleanNick(v); const old = member(S.uid) && member(S.uid).nick;
  if (v.length < 2) throw new Error("Pick a name with at least 2 characters.");
  if (nameTakenLocally(v, S.uid)) throw new Error("Someone already uses that name — pick a different one.");
  if (old && nameKey(old) === nameKey(v) && !(extra && extra.force)){ await updateDoc(doc(db, "members", S.uid), Object.assign({nick:v}, extra && extra.patch || {})); return v; }
  await claimName(v);
  await updateDoc(doc(db, "members", S.uid), Object.assign({nick:v, nickAt:Date.now()}, extra && extra.patch || {}));
  if (old && nameKey(old) !== nameKey(v)) releaseName(old);
  return v;
}
async function doJoin(){
  const nick = cleanNick($("j-nick").value); const code = $("j-code").value.trim();
  if (nick.length < 2){ $("j-err").textContent = "Pick a name with at least 2 characters."; return; }
  if (nameTakenLocally(nick, S.uid)){ $("j-err").textContent = "Someone already uses that name — pick a different one (use your real name)."; return; }
  if (Object.values((S.config && S.config.bannedNames) || {}).some(n => nameKey(n) === nameKey(nick))){ $("j-err").textContent = "That name was banned from this server."; return; }
  $("j-go").disabled = true; $("j-err").textContent = "Joining…";
  S.joining = true;
  try{ await claimName(nick); await setDoc(doc(db, "members", S.uid), {nick, nickAt:Date.now(), dev:deviceId(), color:S.joinColor, joinedAt:Date.now(), lastSeen:Date.now(), code: isOwner() ? "" : code}); $("j-err").textContent = ""; if (!isOwner()) S.announceJoin = true; }
  catch(e){
    $("j-err").textContent = e.code === "name-taken" ? e.message : e.code !== "permission-denied" ? "Couldn't join: " + errMsg(e)
      : isBanned(S.uid) ? "This account was kicked. Ask the admin to unban you."
      : isOwner() ? "Firebase refused the join. Make sure the latest Firestore rules are published."
      : "That invite code isn't right. (Admin? Your ID below doesn't match ownerUid in Firebase yet.)";
    $("j-go").disabled = false;
  }
  finally{ S.joining = false; route(); }
}
$("j-go").onclick = doJoin;
$("j-nick").onkeydown = $("j-code").onkeydown = e => { if (e.key === "Enter") doJoin(); };

// ---- spam filter: slows down floods, repeats and mass pings before they're sent (owner can turn it off in Admin → Overview)
const SPAM = {times:[], last:[], strikes:[], muteUntil:0};
function spamCheck(text){
  if (isOwner() || (S.config && S.config.spamFilter === false)) return null;
  const now = Date.now();
  if (SPAM.muteUntil > now) return "🛑 Spam filter: wait " + Math.ceil((SPAM.muteUntil - now) / 1000) + "s before sending again.";
  const strike = msg => { SPAM.strikes = SPAM.strikes.filter(t => now - t < 60000); SPAM.strikes.push(now);
    if (SPAM.strikes.length >= 3){ SPAM.muteUntil = now + 30000; SPAM.strikes = []; return "🛑 Spam filter: you're paused for 30 seconds."; } return msg; };
  SPAM.times = SPAM.times.filter(t => now - t < 10000);
  if (SPAM.times.length >= 6) return strike("⏳ Slow down! You're sending messages too fast.");
  const norm = (text || "").toLowerCase().replace(/\s+/g, " ").trim();
  if (norm){ SPAM.last = SPAM.last.filter(x => now - x.t < 45000);
    if (SPAM.last.filter(x => x.s === norm).length >= 2) return strike("🔁 You already sent that. Try saying something new.");
    const pings = (text.match(/@\S+/g) || []).length; if (pings > 5 && !isAdmin()) return strike("📣 That's a lot of @mentions — keep it to 5 or fewer.");
    if (/(.)\1{39,}/.test(text)) return strike("That message is mostly one repeated character.");
    if ((text.match(/https?:\/\//g) || []).length > 4 && !isAdmin()) return strike("🔗 That's a lot of links in one message.");
    const lines = text.split("\n").length; if (lines > 60) return strike("That message has way too many lines.");
    SPAM.last.push({s:norm, t:now}); }
  SPAM.times.push(now); return null;
}
// Owner's app quietly: marks launch week (for the Early Member badge) and gives every member a one-time welcome gift.
const WELCOME_SPARKS = 500; const GIFTED = new Set();
let housekeeping = false;
async function ownerHousekeeping(){
  if (!isOwner() || housekeeping || !S.config) return; housekeeping = true;
  try{
    if (!S.config.launchAt) await updateDoc(doc(db, "config/main"), {launchAt:Date.now()});
    const expired = Object.entries(S.config.devUntil || {}).filter(([, t]) => t && t <= Date.now()).map(([u]) => u);
    if (expired.length){ const upd = {admins:arrayRemove(...expired)}; expired.forEach(u => upd["devUntil." + u] = deleteField()); await updateDoc(doc(db, "config/main"), upd).catch(() => {}); }
    if (!S.config.vouchRoomMade && !GIFTED.has("#vouches") && !S.allRooms.some(r => r.type === "vouches")){ GIFTED.add("#vouches");
      await setDoc(doc(db, "rooms", "vouches-" + rid().slice(-4)), {name:"vouches", topic:"Vouch for friends and for CampusCord with /vouch ⭐", category:"Text rooms", readonly:false, type:"vouches", order:S.rooms.length, createdAt:Date.now()});
      await updateDoc(doc(db, "config/main"), {vouchRoomMade:true}); }
    if (!S.config.pollRoomMade && !GIFTED.has("#poll") && !S.allRooms.some(r => r.type === "poll")){ GIFTED.add("#poll");
      await setDoc(doc(db, "rooms", "daily-poll-" + rid().slice(-4)), {name:"daily-poll", topic:"A new poll every day 📊 Click an answer to vote", category:"Text rooms", readonly:false, type:"poll", order:S.rooms.length, createdAt:Date.now()});
      await updateDoc(doc(db, "config/main"), {pollRoomMade:true}); }
    const flags = S.config.nameFlags || {};
    for (const [u, f] of Object.entries(flags)){ if (!f.active || !member(u) || !nameLocked(u) || Date.now() < f.at + NAME_DAYS * 864e5) continue;
      await updateDoc(doc(db, "config/main"), {["nameFlags." + u + ".active"]:false, ["nameFlags." + u + ".removedAt"]:Date.now()});
      await deleteDoc(doc(db, "members", u)); toast(nickOf(u) + " was removed: didn't change to their real name in " + NAME_DAYS + " days"); }
    if (!S.config.namesMigrated && !GIFTED.has("#names")){ GIFTED.add("#names");
      const seen = new Set();
      for (const [u, m] of Object.entries(S.members)){ const k = nameKey(m.nick); if (!k || seen.has(k)) continue; seen.add(k);
        try{ const ref = doc(db, "names", k); const cur = await getDoc(ref); if (!cur.exists()) await setDoc(ref, {uid:u, ts:Date.now()}); }catch(e){} }
      await updateDoc(doc(db, "config/main"), {namesMigrated:true}); }
    const done = new Set([...(S.config.welcomed || []), ...GIFTED]);
    const todo = Object.keys(S.members).filter(u => !isOwnerUid(u) && !done.has(u) && !isBanned(u));
    if (!S.walletsLoaded) return;
    for (const u of todo){ GIFTED.add(u);
      await updateDoc(doc(db, "config/main"), {welcomed:arrayUnion(u)});
      if (S.wallets[u]) await updateDoc(doc(db, "wallet", u), {earned:increment(WELCOME_SPARKS), welcomed:Date.now()});
      else await setDoc(doc(db, "wallet", u), Object.assign({}, EMPTY_WALLET, {earned:WELCOME_SPARKS, welcomed:Date.now()}));
    }
    if (todo.length) toast("🎁 Sent a " + WELCOME_SPARKS + "-Sparks welcome gift to " + todo.map(nickOf).join(", "));
  }catch(e){ console.warn("housekeeping", e); }
  finally{ housekeeping = false; }
}
function welcomeGiftPopup(){
  if (window.__ccNoPop) return; if ($("layer").children.length || document.hidden){ setTimeout(welcomeGiftPopup, 4000); return; }
  modal((m, close) => m.append(h("div",{class:"pfx pfx-confetti"}), h("div",{class:"spbig",style:{margin:"0 auto 10px"}}, ic("spark")),
    h("h2",{style:{textAlign:"center",margin:"0 0 6px"},text:"🎁 Welcome to CampusCord!"}),
    h("p",{class:"note",style:{textAlign:"center"}}, "You got ", sparkPill(WELCOME_SPARKS), " as a welcome gift. Spend them on decorations, banners and nameplates in the Shop."),
    h("div",{class:"foot",style:{justifyContent:"center"}}, h("button",{class:"btn ghost",onclick:close},"Later"), h("button",{class:"btn",onclick:() => { close(); openChat("shop", "featured"); }},"Open the Shop"))), "newbadge");
}
// A "👋 X joined" line in the main room so friends see who's new.
async function announceJoin(){
  const r = S.rooms.find(x => x.name === "general" && !x.readonly && !x.private && !isVoiceRoom(x)) || S.rooms.find(x => !x.readonly && !x.private && !isVoiceRoom(x)); if (!r) return;
  const ts = Date.now(), id = ts.toString(36) + "-join" + Math.random().toString(36).slice(2, 5);
  try{ await setDoc(doc(db, "rooms", r.id, "msgs", id), {uid:S.uid, text:"", join:true, ts});
    await setDoc(doc(db, "meta", r.id), {lastTs:ts, lastUid:S.uid, lastNick:nickOf(S.uid), lastPreview:"joined CampusCord 👋", lastMentions:[], lastEveryone:false}); }catch(e){ console.warn("join msg", e); }
}
const JOIN_LINES = ["just joined. Say hi! 👋", "slid into the server. 😎", "is here. Everyone act normal.", "just showed up. Welcome! 🎉", "joined the party. 🥳", "hopped in. 🐸"];
// ---------------------------------------------------------------- app init
function stopAppSubs(){ S.unsubApp.forEach(u => u()); S.unsubApp = []; S.unsubRoom.forEach(u => u()); S.unsubRoom = []; clearInterval(S.hb); }
function initApp(){
  S.unsubApp.push(onSnapshot(collection(db, "rooms"), snap => {
    S.allRooms = snap.docs.map(d => Object.assign({id:d.id}, d.data()));
    S.rooms = S.allRooms.filter(canSeeRoom).sort((a,b) => (a.order||0) - (b.order||0) || (a.createdAt||0) - (b.createdAt||0));
    if (S.announceJoin && S.rooms.length){ S.announceJoin = false; announceJoin(); }
    watchVouches(); watchMySig(); maybeVouchPopup(); setTimeout(maybePasswordNudge, 6000); setTimeout(maybeHeadDevPopup, 2500); setTimeout(maybeCoOwnerPopup, 3000);
    if (S.kind === "room" && S.cur && !S.rooms.find(r => r.id === S.cur)) S.cur = null;
    syncVoiceSubs(); if (V.room && !S.rooms.find(r => r.id === V.room)) leaveVoice();
    if (!S.cur && S.rooms.length){ const saved = store("chat"); if (saved && saved.kind === "dm") openChat("dm", saved.id); else if (saved && isPage(saved.kind)) openChat(saved.kind, saved.id); else openChat("room", S.rooms.find(r => saved && r.id === saved.id) ? saved.id : S.rooms[0].id); }
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
        else if (!viewing && !mine && !isMuted(id) && prefs.desktop === "all"){ const r = S.rooms.find(x => x.id === id); notify((d.lastNick || "Someone") + " in #" + (r ? r.name : "room"), d.lastPreview || "", "room", id, false); }
      } });
    const m = {}; snap.docs.forEach(d => m[d.id] = d.data()); S.meta = m; need("side","rail");
  }, ()=>{}));
  S.unsubApp.push(onSnapshot(query(collection(db, "groups"), where("users","array-contains",S.uid)), snap => {
    snap.docChanges().forEach(c => { if (c.type === "removed") return; const d = c.doc.data(), id = c.doc.id;
      if (d.lastUid && d.lastUid !== S.uid && d.lastTs > S.loadedAt && S.notified["g:"+id] !== d.lastTs){
        S.notified["g:"+id] = d.lastTs;
        const viewing = S.kind === "group" && S.cur === id && !document.hidden;
        if (!viewing){ notify(d.name || "Group Chat", d.lastPreview || "sent a message", "group", id, true); if (document.hidden){ S.hiddenCount++; updateTitle(); } }
      } });
    S.groups = snap.docs.map(d => Object.assign({id:d.id}, d.data())).sort((a,b) => (b.lastTs||b.createdAt||0) - (a.lastTs||a.createdAt||0));
    need("side","rail","header"); if (S.kind === "home") need("msgs");
  }, e => console.warn("Groups unavailable", e)));
  S.unsubApp.push(onSnapshot(query(collection(db, "dms"), where("users","array-contains",S.uid)), snap => {
    snap.docChanges().forEach(c => { if (c.type === "removed") return; const d = c.doc.data(), id = c.doc.id;
      if (d.lastUid && d.lastUid !== S.uid && d.lastTs > S.loadedAt && S.notified["d:"+id] !== d.lastTs){
        S.notified["d:"+id] = d.lastTs;
        const viewing = S.kind === "dm" && S.cur === id && !document.hidden;
        if (!viewing){ notify(nickOf(d.lastUid), d.lastPreview || "sent you a message", "dm", id, true); if (document.hidden){ S.hiddenCount++; updateTitle(); } }
      } });
    S.dms = snap.docs.map(d => Object.assign({id:d.id}, d.data())).sort((a,b) => (b.lastTs||b.createdAt||0) - (a.lastTs||a.createdAt||0));
    need("side","rail","header"); if (S.kind === "home") need("msgs");
  }, e => console.warn("DMs unavailable", e)));
  S.unsubApp.push(onSnapshot(query(collection(db, "gifs"), orderBy("ts","desc"), limit(30)), snap => { S.gifs = snap.docs.map(d => Object.assign({id:d.id}, d.data())); need("gifs"); }, ()=>{}));
  S.unsubApp.push(onSnapshot(doc(db, "config/shop"), s => { S.shop = s.exists() ? s.data() : {}; refreshOpenPane(); }, ()=>{}));
  S.unsubApp.push(onSnapshot(query(collection(db, "orders"), where("uid","==",S.uid)), s => {
    const before = Object.fromEntries((S.myOrders || []).map(o => [o.id, o.status]));
    S.myOrders = s.docs.map(d => Object.assign({id:d.id}, d.data()));
    S.myOrders.forEach(o => { if (before[o.id] === "pending" && o.status === "approved"){ const c = CATALOG.find(x => x.id === o.item) || {name:"Your purchase"}; toast("✦ " + c.name + " is here! Thanks for supporting CampusCord 💜"); } });
    refreshOpenPane(); need("side", "msgs"); }, ()=>{}));
  if (isRealOwner()) S.unsubApp.push(onSnapshot(collection(db, "orders"), s => { S.orders = s.docs.map(d => Object.assign({id:d.id}, d.data())).sort((a,b) => b.ts - a.ts); need("rail"); refreshOpenPane(); }, ()=>{}));
  S.unsubApp.push(onSnapshot(doc(db, "config/catalog"), s => { S.catalogV = s.exists() ? s.data().v : 0;
    if (isOwner() && !prefs.yy2){ prefs.yy2 = 1; savePrefs(); setMyProfile({deco:"d_yinyang", plate:"p_yinyang"}).catch(()=>{}); }
    if (isOwner() && !prefs.yy){ prefs.yy = 1; savePrefs(); if (profile(S.uid).nameFx !== "yinyang") setMyProfile({nameFx:"yinyang"}).catch(()=>{}); }
    if (isOwner()){ setTimeout(ownerHousekeeping, 2500); clearInterval(S.hkI); S.hkI = setInterval(ownerHousekeeping, 10 * 60000); }
    if (isRealOwner() && S.catalogV !== CAT_V) setDoc(doc(db, "config/catalog"), catalogDoc()).catch(e => console.warn("catalog", e)); }, () => {}));
  ensureWallet(); watchFeedback(); watchPushPrefs(); openFromUrl(); watchAppeals(); watchMod(); watchVouchQuota(); checkChangesBadge(); watchSubs(); watchGameScores();
  heartbeat(); S.hb = setInterval(heartbeat, HEARTBEAT_MS); setTimeout(checkAway, 500);
  clearInterval(S.tick); S.tick = setInterval(() => { need("rpanel","typing","side","header","composer"); if (S.kind === "home" || S.kind === "quests") need("msgs"); }, 15000);
  buildEmojiGrid();
  need("rail","side","header","msgs","rpanel","me","composer","gifs");
  $("input").focus();
  handleReturnFromCheckout();
}
// When you click out of CampusCord (another window/app, or hide the tab) you show as Away (yellow moon).
function setAway(on){ if (S.away === on || !member(S.uid)) return; S.away = on; need("me","rpanel","side");
  updateDoc(doc(db, "members", S.uid), {away:on, lastSeen:Date.now()}).catch(() => {}); }
let awayT = null;
const checkAway = () => { clearTimeout(awayT); const gone = document.hidden || !document.hasFocus();
  if (gone && !V.room) awayT = setTimeout(() => setAway(true), 1500); else setAway(false); };
window.addEventListener("blur", checkAway); window.addEventListener("focus", checkAway); document.addEventListener("visibilitychange", checkAway);
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
function roomUnread(r){ const m = S.meta[r.id]; return !isMuted(r.id) && !(S.kind === "room" && S.cur === r.id) && m && m.lastTs > (S.lastRead[r.id]||0) && m.lastUid !== S.uid; }
function railItem({label, tip, on, cls, onclick, oncontextmenu, content, badge, dot}){
  const btn = h("button",{class:"ri" + (on ? " on" : "") + (cls ? " " + cls : ""), "aria-label":tip || label, onclick, oncontextmenu}, content);
  if (badge) btn.appendChild(h("span",{class:"bdg",text: badge > 99 ? "99+" : String(badge)}));
  else if (dot) btn.appendChild(h("span",{class:"gdot"}));
  const wrap = h("div",{class:"rwrap" + (on ? " on" : ""), "data-tip":tip || label}, h("i",{class:"pill"}), btn, h("span",{class:"rl",text:label}));
  return wrap;
}
function renderRail(){
  const r = $("rail"); r.innerHTML = "";
  const top = h("div",{class:"rgroup"}), bot = h("div",{class:"rgroup"});
  top.appendChild(railItem({label:"Messages", tip:"Direct messages & friends", on: S.mode === "dms", onclick:() => goDMs(), content:ic("message"), badge: unreadDMs().length}));
  top.appendChild(h("div",{class:"sep"}));
  const name = (S.config && S.config.serverName) || "CampusCord";
  const mc = Object.values(S.mentions).reduce((a,b) => a + b, 0);
  top.appendChild(railItem({label:"Rooms", tip: name + " — all rooms", on: S.mode === "server", cls:"srv", onclick:() => goServer(), oncontextmenu:e => serverMenu(e),
    content: h("span",{class:"srvic",text:(S.config && S.config.serverIcon) || "CC"}), badge: mc, dot: !mc && S.rooms.some(roomUnread)}));
  bot.appendChild(railItem({label:"Games", tip:"Daily Mini Games — Wordle, Spelling Bee, Sudoku & Crossword", cls:"gamesri", on: S.kind === "games", onclick:() => openChat("games", "hub"), content:ic("grid")}));
  bot.appendChild(railItem({label:"Shop", tip:"Shop — decorations, effects & ranks", cls:"shopri", on: S.kind === "shop", onclick:() => openShop(), content:ic("bag")}));
  if (!isInstalled() && location.protocol !== "file:") bot.appendChild(railItem({label:"Get app", tip:"Install CampusCord on this computer", cls: installEvt ? "installri" : "", onclick:() => installApp(), content:ic("arrowdown")}));
  if (isOwner() || isDev(S.uid)) bot.appendChild(railItem({label:"Dev", tip:"Dev panel: change CampusCord's code", cls:"devri", on: S.kind === "dev", onclick:() => openChat("dev", "main"), content:h("span",{class:"devglyph",text:"</>"}), badge: (S.openChanges || 0) + (isOwner() ? subsWaiting() : 0)}));
  if (isAdmin()) bot.appendChild(railItem({label:"Admin", tip:"Server settings", onclick:() => openAdmin(), content:ic("shield"), badge: isOwner() ? S.orders.filter(o => o.status === "pending").length + openAppeals().length : 0}));
  bot.appendChild(railItem({label:"Help", tip:"How to use CampusCord", onclick:() => openHelp(), content:ic("info")}));
  r.append(top, bot);
}
// hover tooltips for the left bar
(() => { let tip = null;
  document.addEventListener("mouseover", e => { const w = e.target.closest && e.target.closest(".rwrap"); if (!w){ if (tip){ tip.remove(); tip = null; } return; }
    if (tip && tip._for === w) return; if (tip) tip.remove();
    tip = h("div",{class:"rtip",text:w.dataset.tip}); tip._for = w; document.body.appendChild(tip);
    const b = w.querySelector(".ri").getBoundingClientRect(); tip.style.top = (b.top + b.height / 2 - tip.offsetHeight / 2) + "px"; tip.style.left = (b.right + 12) + "px"; });
  document.addEventListener("mousedown", () => { if (tip){ tip.remove(); tip = null; } }, true);
})();
function renderSide(){
  const hdr = $("sideHdr"), list = $("chList"); hdr.innerHTML = ""; list.innerHTML = "";
  if (S.mode === "dms"){
    hdr.onclick = null; hdr.style.cursor = "default";
    hdr.append(h("span",{class:"hdric"}, ic("message")), h("span",{class:"t",text:"Direct Messages"}), h("button",{class:"ib",title:"New Group",onclick:e => { e.stopPropagation(); newGroupModal(); }}, ic("users")), h("button",{class:"ib",title:"New DM",onclick:e => { e.stopPropagation(); newDMModal(); }}, ic("plus")));
    const f = h("input",{class:"dmsearch", placeholder:"Find a conversation", value:S.dmFilter||"", oninput:e => { S.dmFilter = e.target.value; renderDMList(box); }});
    list.appendChild(f);
    const nav = (kind, page, icn, label, extra) => list.appendChild(h("div",{class:"ch navi" + (S.kind === kind && (kind !== "shop" || (page === "ranks") === (S.page === "ranks")) ? " on" : ""), onclick:() => openChat(kind, page || kind)},
      h("span",{class:"ic"}, ic(icn)), h("span",{class:"nm",text:label}), extra || null));
    nav("home", "home", "users", "Friends");
    nav("shop", "ranks", "sparkles", "Campus+", hasPlus(S.uid) && !isOwner() ? h("span",{class:"ichip free",text:"ACTIVE"}) : null);
    nav("shop", "featured", "bag", "Shop", prefs.shopSeen === CAT_V ? null : h("span",{class:"ichip new"}, ic("spark","sm"), "NEW"));
    const qready = QUESTS.some(q => !(wal(S.uid).quests || []).includes(q.id) && questProgress(q) >= q.goal);
    nav("quests", "all", "star", "Quests", qready ? h("span",{class:"newdot",title:"Rewards ready"}) : null);
    nav("feedback", "all", "message", "Feedback", fbUnseen() ? h("span",{class:"ichip new",text:fbUnseen() + " new"}) : null);
    list.appendChild(h("div",{class:"cat",style:{cursor:"default"}}, h("span",{class:"t",text:"Direct messages"})));
    const box = h("div"); list.appendChild(box); renderDMList(box);
    return;
  }
  hdr.style.cursor = isAdmin() ? "pointer" : "default";
  hdr.onclick = () => { if (isAdmin()) openAdmin(); };
  hdr.append(h("span",{class:"t",text:(S.config && S.config.serverName) || "CampusCord"}), ...roleTags(S.uid, true), isAdmin() ? h("span",{class:"hdrchev"}, ic("chevron")) : null);
  // ---- sections: Pinned (yours only) first, then the server's categories in the owner's order
  const DEF = "Text rooms";
  const catOf = r => r.category || (isVoiceRoom(r) ? "Voice channels" : DEF);
  const pins = (prefs.pins || []).filter(id => S.rooms.find(r => r.id === id));
  const cats = catOrder(); const byCat = {}; cats.forEach(c => byCat[c] = []);
  S.rooms.forEach(r => { if (pins.includes(r.id)) return; const c = catOf(r); (byCat[c] = byCat[c] || []).push(r); if (!cats.includes(c)) cats.push(c); });
  if (!S.rooms.length) list.appendChild(h("div",{class:"empty-note",text:"No rooms yet."}));
  const section = (c, rooms, opts) => {
    const closed = !!prefs.collapsed[c];
    const head = h("div",{class:"cat" + (closed ? " closed" : "") + (opts.pinned ? " pinsec" : ""), "data-cat": opts.pinned ? "" : c, "data-pinsec": opts.pinned ? "1" : null,
        draggable: !opts.pinned && isOwner() ? "true" : null,
        onclick:() => { prefs.collapsed[c] = !closed; savePrefs(); need("side"); }, oncontextmenu: opts.pinned ? null : e => catMenu(e, c)},
      h("span",{class:"ar"}, ic("chevron")), opts.pinned ? h("span",{class:"pinic"}, ic("pin","sm")) : null, h("span",{class:"t",text: opts.pinned ? "Pinned" : c}),
      !opts.pinned && isAdmin() ? h("button",{title:"Create room", onclick:e => { e.stopPropagation(); roomModal(null, c); }}, ic("plus")) : null);
    list.appendChild(head);
    if (!rooms.length && !opts.pinned && isAdmin()) list.appendChild(h("div",{class:"catempty", "data-cat":c, text:"Drag rooms here"}));
    rooms.forEach(r => {
      const on = S.kind === "room" && S.cur === r.id; const un = roomUnread(r); const mc = S.mentions[r.id] || 0;
      if (closed && !on && !un && !mc) return;
      const typ = !on && typersIn("room", r.id).length;
      const vr = isVoiceRoom(r), inV = vr && V.room === r.id, vn = vr ? liveVoice(S.voiceParts[r.id]).length : 0;
      list.appendChild(h("div",{class:"ch" + (on ? " on" : "") + (un ? " unread" : "") + (isMuted(r.id) ? " muted" : "") + (vr ? " voice" : "") + (inV ? " invoice" : ""),
          "data-room": r.id, "data-in": opts.pinned ? "pins" : c, draggable: (opts.pinned || isAdmin()) ? "true" : null,
          onclick:() => { if (vr){ joinVoice(r.id); bumpStat("voice"); } openChat("room", r.id); }, oncontextmenu:e => roomMenu(e, r), title: vr ? (inV ? "You're in this voice channel" : "Click to join voice") : null},
        h("span",{class:"ic"}, isVouchRoom(r) ? h("span",{class:"vico",text:"★"}) : isPollRoom(r) ? h("span",{class:"vico",text:"📊"}) : ic(vr ? "volume" : r.private ? "lock" : r.readonly ? "megaphone" : "hash")), h("span",{class:"nm",text:r.name}),
        vr && vn ? h("span",{class:"vcount",text:vn + "/" + VOICE_MAX}) : null,
        h("button",{class:"x pinb" + (opts.pinned ? " on" : ""), title: opts.pinned ? "Unpin" : "Pin to top", onclick:e => { e.stopPropagation(); togglePinRoom(r.id); }}, ic("pin")),
        isAdmin() && (isOwner() || !r.private) ? h("button",{class:"x edit", title:"Edit room", onclick:e => { e.stopPropagation(); roomModal(r); }}, ic("settings")) : null,
        typ ? h("span",{class:"typ",text:"•••"}) : null,
        isVouchRoom(r) && isAdmin() && pendingVouches().length ? h("span",{class:"mb vpend",title:"Vouches waiting for review",text:String(pendingVouches().length)}) : mc ? h("span",{class:"mb",text:String(mc)}) : (un ? h("span",{class:"newdot",title:"New messages"}) : null)));
      if (vr){ const pl = voiceParticipantsEl(r); if (pl) list.appendChild(pl); }
    });
  };
  if (pins.length) section("__pinned", pins.map(id => S.rooms.find(r => r.id === id)), {pinned:true});
  cats.forEach(c => { if (byCat[c].length || isAdmin()) section(c, byCat[c], {}); });
  if (isOwner()) list.appendChild(h("button",{class:"addcat", onclick:() => newCategory()}, ic("plus","sm"), " Add section"));
  wireSideDrag(list);
}
// Category order lives in config/main.cats (owner edits it); categories only used by rooms are added at the end.
function catOrder(){ const out = [...(((S.config || {}).cats) || [])]; S.rooms.forEach(r => { const c = r.category || (isVoiceRoom(r) ? "Voice channels" : "Text rooms"); if (!out.includes(c)) out.push(c); }); return out; }
async function saveCats(list){ try{ await updateDoc(doc(db, "config/main"), {cats:list}); }catch(e){ toast("Couldn't save sections: " + errMsg(e)); } }
function togglePinRoom(id){ const p = (prefs.pins || []).filter(x => x !== id); const was = (prefs.pins || []).includes(id); if (!was) p.push(id); prefs.pins = p; savePrefs(); need("side"); toast(was ? "Unpinned" : "Pinned to the top — drag to reorder"); }
function newCategory(after){
  modal((m, close) => { const i = h("input",{class:"inp", maxlength:"32", placeholder:"e.g. School, Games, Voice"});
    const go = async () => { const n = i.value.trim().slice(0, 32); if (!n) return; const list = catOrder(); if (list.includes(n)){ toast("That section already exists"); return; }
      const at = after ? list.indexOf(after) + 1 : list.length; list.splice(at, 0, n); await saveCats(list); close(); toast("Section added — drag rooms into it"); };
    i.onkeydown = e => { if (e.key === "Enter") go(); };
    m.append(h("h3",{text:"New section"}), h("p",{class:"note",text:"Sections group your rooms in the sidebar, like Discord categories."}), i,
      h("div",{class:"foot"}, h("button",{class:"btn ghost",onclick:close},"Cancel"), h("button",{class:"btn small",onclick:go},"Create"))); });
}
function renameCategory(c){
  modal((m, close) => { const i = h("input",{class:"inp", maxlength:"32", value:c});
    const go = async () => { const n = i.value.trim().slice(0, 32); if (!n || n === c){ close(); return; }
      const b = writeBatch(db); S.allRooms.filter(r => (r.category || (isVoiceRoom(r) ? "Voice channels" : "Text rooms")) === c).forEach(r => b.update(doc(db, "rooms", r.id), {category:n}));
      try{ await b.commit(); await saveCats(catOrder().map(x => x === c ? n : x).filter((x, k, a) => a.indexOf(x) === k)); if (prefs.collapsed[c]){ prefs.collapsed[n] = true; delete prefs.collapsed[c]; savePrefs(); } close(); }catch(e){ toast("Couldn't rename: " + errMsg(e)); } };
    i.onkeydown = e => { if (e.key === "Enter") go(); };
    m.append(h("h3",{text:"Rename section"}), i, h("div",{class:"foot"}, h("button",{class:"btn ghost",onclick:close},"Cancel"), h("button",{class:"btn small",onclick:go},"Save"))); });
}
async function deleteCategory(c){
  const rooms = S.allRooms.filter(r => (r.category || (isVoiceRoom(r) ? "Voice channels" : "Text rooms")) === c);
  const target = catOrder().find(x => x !== c) || "Text rooms";
  const b = writeBatch(db); rooms.forEach(r => b.update(doc(db, "rooms", r.id), {category:target}));
  try{ if (rooms.length) await b.commit(); await saveCats(catOrder().filter(x => x !== c)); toast(rooms.length ? "Section removed — its rooms moved to " + target : "Section removed"); }catch(e){ toast("Couldn't remove: " + errMsg(e)); }
}
function catMenu(e, c){
  ctxMenu(e, [
    {label: prefs.collapsed[c] ? "Expand section" : "Collapse section", icon:"chevron", run:() => { prefs.collapsed[c] = !prefs.collapsed[c]; savePrefs(); need("side"); }},
    isAdmin() ? {label:"Create room here", icon:"plus", run:() => roomModal(null, c)} : null,
    isOwner() ? "-" : null,
    isOwner() ? {label:"Rename section", icon:"pencil", run:() => renameCategory(c)} : null,
    isOwner() ? {label:"Add section below", icon:"plus", run:() => newCategory(c)} : null,
    isOwner() ? {label:"Move section up", icon:"chevronup", run:() => moveCat(c, -1)} : null,
    isOwner() ? {label:"Move section down", icon:"chevron", run:() => moveCat(c, 1)} : null,
    isOwner() ? {label:"Delete section", icon:"trash", danger:true, run:() => confirmBox("Delete " + c + "?", "Its rooms move to another section. No messages are deleted.", "Delete", () => deleteCategory(c))} : null,
  ]);
}
function moveCat(c, d){ const l = catOrder(); const i = l.indexOf(c), j = i + d; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; saveCats(l); }
// Moves a room to category `cat`, placed before room `beforeId` (or at the end), and renumbers that section.
async function placeRoom(id, cat, beforeId){
  const r = S.allRooms.find(x => x.id === id); if (!r) return;
  const catOfR = x => x.category || (isVoiceRoom(x) ? "Voice channels" : "Text rooms");
  const list = S.rooms.filter(x => catOfR(x) === cat && x.id !== id);
  const at = beforeId ? list.findIndex(x => x.id === beforeId) : -1; list.splice(at < 0 ? list.length : at, 0, r);
  const b = writeBatch(db); list.forEach((x, k) => { const patch = {order:k}; if (x.id === id && catOfR(x) !== cat) patch.category = cat; if (x.order !== k || patch.category) b.update(doc(db, "rooms", x.id), patch); });
  // show it right away
  list.forEach((x, k) => { x.order = k; if (x.id === id) x.category = cat; }); S.rooms.sort((a, c) => catOrder().indexOf(catOfR(a)) - catOrder().indexOf(catOfR(c)) || (a.order||0) - (c.order||0)); need("side");
  try{ await b.commit(); if (!catOrder().includes(cat) || !((S.config || {}).cats || []).includes(cat)) { if (isOwner()) saveCats(catOrder()); } }catch(e){ toast("Couldn't move room: " + errMsg(e)); }
}
function wireSideDrag(list){
  let drag = null;
  const clear = () => list.querySelectorAll(".dropb,.dropa,.dropin").forEach(x => x.classList.remove("dropb","dropa","dropin"));
  list.ondragstart = e => { const row = e.target.closest("[draggable=true]"); if (!row) return;
    drag = row.dataset.room ? {room:row.dataset.room, from:row.dataset.in} : row.dataset.cat ? {cat:row.dataset.cat} : null;
    if (!drag){ e.preventDefault(); return; } e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", drag.room || drag.cat); row.classList.add("dragging"); };
  list.ondragend = e => { list.querySelectorAll(".dragging").forEach(x => x.classList.remove("dragging")); clear(); drag = null; };
  const target = e => { if (!drag) return null; const t = e.target.closest(".ch[data-room],.cat,.catempty"); if (!t) return null;
    const box = t.getBoundingClientRect(), after = e.clientY > box.top + box.height / 2; return {t, after}; };
  list.ondragover = e => { const x = target(e); if (!x) return;
    if (drag.cat && !x.t.dataset.cat) return; // sections only drop on sections
    if (drag.room && drag.from !== "pins" && x.t.dataset.in === "pins" && !isAdmin()) return;
    e.preventDefault(); clear();
    if (x.t.classList.contains("cat") || x.t.classList.contains("catempty")) x.t.classList.add(drag.cat ? (x.after ? "dropa" : "dropb") : "dropin"); else x.t.classList.add(x.after ? "dropa" : "dropb"); };
  list.ondragleave = e => { if (!list.contains(e.relatedTarget)) clear(); };
  list.ondrop = e => { const x = target(e); clear(); if (!x || !drag) return; e.preventDefault(); const d = drag; drag = null;
    if (d.cat){ const c2 = x.t.dataset.cat; if (!c2 || c2 === d.cat) return; const l = catOrder().filter(c => c !== d.cat); const i = l.indexOf(c2); l.splice(x.after ? i + 1 : i, 0, d.cat); saveCats(l); return; }
    const t = x.t;
    // into / within Pinned (personal)
    if (t.dataset.pinsec || t.dataset.in === "pins"){ let p = (prefs.pins || []).filter(id => id !== d.room); let i = t.dataset.in === "pins" ? p.indexOf(t.dataset.room) + (x.after ? 1 : 0) : (x.after ? p.length : 0); if (i < 0) i = p.length;
      p.splice(i, 0, d.room); prefs.pins = p; savePrefs(); need("side"); return; }
    // out of Pinned into a section: unpin, and (admins) also move it there
    if (d.from === "pins"){ prefs.pins = (prefs.pins || []).filter(id => id !== d.room); savePrefs(); need("side"); if (!isAdmin()) return; }
    if (!isAdmin()) return;
    const cat = t.dataset.cat || t.dataset.in;
    let before = null;
    if (t.dataset.room){ if (x.after){ const sib = S.rooms.filter(r => (r.category || (isVoiceRoom(r) ? "Voice channels" : "Text rooms")) === cat && r.id !== d.room); const k = sib.findIndex(r => r.id === t.dataset.room); before = (sib[k + 1] || {}).id || null; } else before = t.dataset.room; }
    else if (!x.after && t.classList.contains("cat")){ const first = S.rooms.find(r => (r.category || (isVoiceRoom(r) ? "Voice channels" : "Text rooms")) === cat && r.id !== d.room); before = first ? first.id : null; }
    placeRoom(d.room, cat, before);
  };
}
function dmHidden(d){ const t = (prefs.hiddenDMs || {})[d.id]; return !!t && (d.lastTs || d.createdAt || 0) <= t && !(S.kind === "dm" && S.cur === d.id); }
function closeDM(d){
  prefs.hiddenDMs = prefs.hiddenDMs || {}; prefs.hiddenDMs[d.id] = Math.max(Date.now(), d.lastTs || 0); savePrefs();
  S.lastRead["dm:" + d.id] = Math.max(Date.now(), d.lastTs || 0); store("lastRead", S.lastRead);
  if (S.kind === "dm" && S.cur === d.id) openChat("home", "home");
  need("side", "rail", "msgs"); toast("Closed your DM with " + nickOf(dmOther(d)) + " — it comes back if they message you");
}
function dmMenu(e, d){ const o = dmOther(d), anchor = e.currentTarget;
  ctxMenu(e, [
    {label:"Profile", icon:"user", run:() => openProfile(o, anchor)},
    {label:"Mark as read", icon:"check", run:() => { S.lastRead["dm:" + d.id] = Date.now(); store("lastRead", S.lastRead); need("side", "rail"); }},
    {label:"Close DM", icon:"x", danger:true, run:() => closeDM(d)}]); }
function renderDMList(box){
  box.innerHTML = "";
  const q = (S.dmFilter||"").toLowerCase();
  let rows = S.dms.filter(d => { const o = dmOther(d); return !isBanned(o) && (member(o) || d.lastTs); })
    .filter(d => q ? nickOf(dmOther(d)).toLowerCase().includes(q) : !dmHidden(d)).map(d => Object.assign(d, {_k:"dm"}));
  let grows = (S.groups||[]).filter(g => q ? groupName(g).toLowerCase().includes(q) : true).map(g => Object.assign(g, {_k:"group"}));
  const all = [...rows, ...grows].sort((a,b) => (b.lastTs||b.createdAt||0) - (a.lastTs||a.createdAt||0));
  if (!all.length){ box.appendChild(h("div",{class:"empty-note",text: q ? "No matches." : "No DMs or groups yet."})); return; }
  all.forEach(d => {
    if (d._k === "group") {
      const on = S.kind === "group" && S.cur === d.id;
      const un = !on && d.lastUid && d.lastUid !== S.uid && d.lastTs > (S.lastRead["group:"+d.id]||0);
      box.appendChild(h("div",{class:"ch dm" + (on ? " on" : "") + (un ? " unread" : ""), onclick:() => openChat("group", d.id)},
        h("div",{class:"av sm", style:{backgroundColor:"var(--b3)",display:"flex",alignItems:"center",justifyContent:"center"}}, ic("users","sm")),
        h("div",{class:"meta"}, h("span",{class:"nm",text:groupName(d)}), typersIn("group", d.id).length ? h("span",{class:"sub",text:"typing…"}) : null),
        un ? h("span",{class:"newdot",title:"New message"}) : null));
      return;
    }
    const o = dmOther(d); const on = S.kind === "dm" && S.cur === d.id;
    const un = !on && d.lastUid && d.lastUid !== S.uid && d.lastTs > (S.lastRead["dm:"+d.id]||0);
    const cs = profile(o).customStatus;
    const pl = equipped(o, "plate");
    box.appendChild(h("div",{class:"ch dm" + (on ? " on" : "") + (un ? " unread" : "") + (pl ? " plate plate-" + pl.slice(2) : ""), onclick:() => openChat("dm", d.id), oncontextmenu:e => dmMenu(e, d)},
      avatar(o, "sm", true),
      h("div",{class:"meta"}, paintName(h("span",{class:"nm",text:nickOf(o)}), o), cs ? h("span",{class:"sub",text:cs}) : (typersIn("dm", d.id).length ? h("span",{class:"sub",text:"typing…"}) : null)),
      un ? h("span",{class:"newdot",title:"New message"}) : null,
      h("button",{class:"dmx", title:"Close DM", onclick:e => { e.stopPropagation(); closeDM(d); }}, ic("x","sm"))));
  });
}
function renderMe(){
  enforceNameLock(); enforceMod(); enforceRules();
  const w = $("meWho"); w.innerHTML = ""; if (!member(S.uid)) return;
  const mb = $("mbar"); if (mb){ mb.innerHTML = ""; const mbar = musicBarEl(); if (mbar) mb.appendChild(mbar); }
  const vb = $("vbar"); vb.innerHTML = ""; const bar = voiceBarEl(); if (bar) vb.appendChild(bar);
  const mic = $("meMic"), hd = $("meDeaf"); mic.innerHTML = ""; hd.innerHTML = "";
  mic.appendChild(ic(V.muted || V.deaf ? "micoff" : "mic")); mic.classList.toggle("off", V.muted || V.deaf); mic.title = V.muted ? "Unmute" : "Mute";
  hd.appendChild(ic(V.deaf ? "headoff" : "headphones")); hd.classList.toggle("off", V.deaf); hd.title = V.deaf ? "Undeafen" : "Deafen";
  renderPromo();
  const st = STATUSES.find(s => s.id === (profile(S.uid).status || "online"));
  const myav = avatar(S.uid, "sm", true); myav.setAttribute("data-vu", S.uid); if (V.speaking[S.uid]) myav.classList.add("speaking");
  w.append(myav, h("div",{style:{minWidth:0}}, paintName(h("div",{class:"nick",text:nickOf(S.uid)}), S.uid),
    h("div",{class:"st",text: profile(S.uid).customStatus || (st ? st.name : "Online")})));
  w.onclick = e => openProfile(S.uid, w, true);
}
$("meSettings").onclick = () => openSettings("account");
$("meMic").onclick = () => setMute(!V.muted || V.deaf ? !V.muted : false);
$("meDeaf").onclick = () => setDeaf(!V.deaf);
$("btnMusic").onclick = () => openMusicModal();
$("btnShop").onclick = () => openShop();
$("btnHelp").onclick = () => openHelp();
const HELP = [
  {q:"How do I send a direct message (DM)?", k:"dm direct message private chat message someone", a:"Click someone's name in the member list and choose Message, or click the chat-bubble button at the top of the left bar and press +."},
  {q:"How do I reply to a message?", k:"reply respond answer quote", a:"Hover the message and click the reply arrow, or right-click it and choose Reply. Press Esc to cancel."},
  {q:"How do I edit or delete my message?", k:"edit change fix typo delete remove message", a:"Hover your message and click the pencil to edit or the trash can to delete. Shortcut: press ↑ in an empty message box to edit your last message."},
  {q:"How do I react with an emoji?", k:"react reaction emoji like", a:"Hover a message and click one of the quick emoji, or the smiley+ button for the full picker. Right-click works too."},
  {q:"How do I mention someone?", k:"mention tag ping @ notify", a:"Type @ and start their name, then pick them from the list. They'll get a highlighted message and a notification."},
  {q:"How do I make a poll?", k:"poll vote survey", a:"Type /poll Question | Option 1 | Option 2 (up to 10 options) and press Enter. Everyone clicks an option to vote."},
  {q:"How do I send images or GIFs?", k:"image picture photo gif upload send file", a:"Click the + next to the message box, paste an image, or drag it in. The GIF button opens the shared GIF library."},
  {q:"How do I change my avatar?", k:"avatar picture pfp profile picture face icon circle", a:"Open Settings (gear, bottom left) → My Account. Pick a background and a face — it saves instantly."},
  {q:"How do I change my name or color?", k:"name nickname rename color", a:"Settings → My Account, or type /nick New Name in chat."},
  {q:"How do I set a status or bio?", k:"status bio about me idle dnd invisible away", a:"Settings → Profile. Choose Online, Idle, Do Not Disturb or Invisible, add a custom status and an About me. Or type /status your text."},
  {q:"How do I change the theme or font size?", k:"theme dark light color appearance font size compact", a:"Settings → Appearance: themes, accent color, font size, compact mode and 24-hour time."},
  {q:"How do I mute a room?", k:"mute silence notifications quiet room", a:"Right-click the room in the sidebar and choose Mute room. You'll still get @mentions."},
  {q:"How do I turn on notifications?", k:"notification alert sound desktop ping", a:"Settings → Notifications → Allow notifications. Choose All messages, Mentions & DMs, or Nothing."},
  {q:"What are unread dots and the NEW line?", k:"unread green dot new line badge", a:"A green dot means a room has new messages. When you open it, a red NEW line shows where you left off. Right-click a message → Mark unread to come back later."},
  {q:"What are Campus+ and Campus++?", k:"campus plus shop buy perks rank badge premium", a:"Paid ranks with badges, animated names, premium themes and more. Click the Shop button at the top to see them."},
  {q:"How do I search messages?", k:"search find look for", a:"Use the Search box at the top right. It searches the messages loaded in the current room or DM."},
  {q:"What keyboard shortcuts are there?", k:"shortcut keyboard keys hotkey", a:"Enter sends, Shift+Enter is a new line, ↑ edits your last message, Ctrl/⌘+K jumps to any room or person, Alt+↑/↓ switches rooms, Esc closes things."},
  {q:"What do the text formats do?", k:"bold italic markdown format spoiler code quote strikethrough", a:"**bold**, *italic*, __underline__, ~~strike~~, `code`, ```code block```, ||spoiler||, and > quote at the start of a line."},
  {q:"What are private rooms?", k:"private room lock hidden secret invite", a:"Rooms with a lock are only visible to the people the admin picked. Everyone else can't see or read them."},
  {q:"What does timed out mean?", k:"timeout timed out muted can't send blocked", a:"An admin paused your posting in rooms for a while. You can still read and use DMs. The message box shows when it ends."},
  {q:"Who are the owner and developers?", k:"owner admin developer dev role crown moderator", a:"The ☯ OWNER runs CampusCord. 💻 DEVs help build CampusCord and can manage rooms, pin, time out and kick regular members."},
];
function helpAnswer(q){
  const words = q.toLowerCase().replace(/[^a-z0-9@ ]/g, " ").split(/\s+/).filter(w => w.length > 1 && !["how","do","i","the","a","to","my","can","what","is","are","in","on","of","and","you","it"].includes(w));
  return HELP.map(h0 => ({h:h0, s:words.reduce((n, w) => n + ((h0.k + " " + h0.q).toLowerCase().includes(w) ? 1 : 0), 0)})).filter(x => x.s > 0).sort((a,b) => b.s - a.s).map(x => x.h);
}
function openHelp(initial){
  modal((m, close) => {
    const chat = h("div",{class:"helpchat"});
    const bot = (text, extra) => { chat.appendChild(h("div",{class:"hb"}, h("div",{class:"hav"}, ic("info")), h("div",{class:"hbody"}, h("b",{text:"CampusCord Help"}), h("div",{text}), extra || null))); chat.scrollTop = chat.scrollHeight; };
    const me = text => { chat.appendChild(h("div",{class:"hb me"}, h("div",{class:"hbody"}, h("div",{text})))); };
    const ask = q => { if (!q.trim()) return; me(q); const hits = helpAnswer(q);
      if (!hits.length) bot("I'm not sure about that one. Try asking about DMs, polls, avatars, themes, notifications or the shop — or ask the admin in #general.");
      else bot(hits[0].a, hits.length > 1 ? h("div",{class:"hrel"}, "Related: ", hits.slice(1, 3).map(x => h("a",{href:"#", onclick:e => { e.preventDefault(); ask(x.q); }}, x.q))) : null); };
    const inp = h("input",{class:"inp", placeholder:"Ask a question, e.g. how do I make a poll?", onkeydown:e => { if (e.key === "Enter"){ ask(inp.value); inp.value = ""; } }});
    m.append(h("h3",null, "Help"), h("p",{class:"note",style:{marginTop:0},text:"Ask anything about using CampusCord."}), chat,
      h("div",{class:"row",style:{marginTop:"10px"}}, inp, h("button",{class:"btn small", onclick:() => { ask(inp.value); inp.value = ""; }}, "Ask")),
      h("div",{class:"hsug"}, HELP.slice(0, 6).map(x => h("button",{onclick:() => ask(x.q)}, x.q))),
      h("button",{class:"btn small ghost",style:{marginTop:"10px"},onclick:rulesModal}, "📜 Read the User Agreement"));
    bot("Hi! I can explain any CampusCord feature. Pick a question below or type your own.");
    if (initial) ask(initial);
    setTimeout(() => inp.focus(), 0);
  }, "helpmodal");
}
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
const base = () => [S.kind === "dm" ? "dms" : S.kind === "group" ? "groups" : "rooms", S.cur];
const readKey = (kind, id) => (kind === "dm" ? "dm:" : kind === "group" ? "group:" : "") + id;
const dmIdWith = uid => [S.uid, uid].sort().join("_");
const dmOther = d => (d.users || (d.id||"").split("_")).find(u => u !== S.uid) || S.uid;
const groupName = g => g.name || g.users.filter(u => u !== S.uid).map(nickOf).join(", ") || "Group Chat";
// Private rooms: only the owner and the people on the room's "allowed" list can see them.
function listNames(a){ return a.length <= 1 ? (a[0] || "you") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }
function roomPeople(r){ const owner = S.config && S.config.ownerUid; return [...new Set([owner, ...(r.allowed || [])])].filter(u => u && member(u) && !isBanned(u)); }
function canSeeRoom(r){ return !r.private || isOwner() || (r.allowed || []).includes(S.uid); }
const curRoom = () => S.kind === "room" ? S.rooms.find(r => r.id === S.cur) : null;
function timeoutUntil(uid){ const t = ((S.config && S.config.timeouts) || {})[uid]; return t && t > Date.now() ? t : 0; }
const isMuted = id => !!(prefs.muted || {})[id];
const canPost = () => { const r = curRoom(); if (timeoutUntil(S.uid) && (S.kind === "room" || S.kind === "group" || (S.kind === "dm" && !String(S.cur).split("_").some(isOwnerUid)))) return false; return !(r && r.readonly) || canPostAnnouncements(); };
// The red NEW line goes away a few seconds after you've actually seen the new messages.
let newT = null;
function scheduleNewClear(){ clearTimeout(newT); if (!S.unreadSince) return;
  newT = setTimeout(() => { if (!document.hidden && document.hasFocus() && S.unreadSince && nearBottom()){ const d = document.querySelector(".newdiv"); if (d) d.classList.add("fade"); setTimeout(() => { S.unreadSince = 0; need("msgs"); }, 600); } else scheduleNewClear(); }, 3000); }
function markRead(){ if (!S.cur) return; S.lastRead[readKey(S.kind, S.cur)] = Date.now(); store("lastRead", S.lastRead);
  if (S.kind === "room" && S.mentions[S.cur]){ delete S.mentions[S.cur]; store("mentions", S.mentions); need("rail"); } }

async function openDM(uid){
  if (!uid || uid === S.uid) return;
  const id = dmIdWith(uid);
  if (prefs.hiddenDMs && prefs.hiddenDMs[id]){ delete prefs.hiddenDMs[id]; savePrefs(); }
  if (!S.dms.find(d => d.id === id)){
    try{ await setDoc(doc(db, "dms", id), {users:id.split("_"), createdAt:Date.now()}, {merge:true}); }
    catch(e){ toast("Couldn't start DM: " + errMsg(e)); return; }
  }
  S.mode = "dms"; openChat("dm", id);
}
const isPage = k => k === "home" || k === "shop" || k === "quests" || k === "feedback" || k === "dev" || k === "games";
function goDMs(){
  if (S.kind === "dm" || (isPage(S.kind) && S.kind !== "home")){ openChat("home", "home"); return; }
  if (S.kind === "home") return;
  const last = store("lastDM");
  if (last && S.dms.find(d => d.id === last)) openChat("dm", last); else openChat("home", "home");
}
function goServer(){
  if (S.kind === "room"){ need("rail","side"); return; }
  const last = store("room"); const r = S.rooms.find(x => x.id === last) || S.rooms[0];
  if (r) openChat("room", r.id); else { S.mode = "server"; need("rail","side"); }
}
function openChat(kind, id){
  closeNav();
  if (isPage(kind)){
    if (S.cur) saveDraft(); stopTyping(); S.unsubRoom.forEach(u => u()); S.unsubRoom = []; if (S.pending) setPending(null);
    if (S.unsubMsgs){ S.unsubMsgs(); S.unsubMsgs = null; }
    if (S.kind !== kind) $("msgs").scrollTop = 0;
    Object.assign(S, {kind, page:id, cur:null, mode:"dms", msgs:[], reacts:[], typing:[], roomLoaded:true, hasMore:false, replyTo:null, editing:null, pins:null});
    if (S.rpanel === "pins" || S.rpanel === "search") S.rpanel = prefs.showMembers === false ? null : "members";
    store("chat", {kind, id});
    need("rail","side","header","msgs","rpanel","composer","typing"); return;
  }
  if (S.cur === id && S.kind === kind && S.unsubRoom.length){ need("side","rail"); return; }
  if (S.cur) saveDraft();
  stopTyping();
  S.unsubRoom.forEach(u => u()); S.unsubRoom = [];
  if (S.pending) setPending(null);
  Object.assign(S, {kind, cur:id, msgs:[], reacts:[], typing:[], roomLoaded:false, msgLimit:PAGE, hasMore:false, replyTo:null, editing:null, pins:null});
  if (kind === "dm" || kind === "group") S.mode = "dms"; else S.mode = "server";
  store("chat", {kind, id}); if (kind === "dm" || kind === "group") store("lastDM", id); else store("room", id);
  if (S.rpanel === "pins") S.rpanel = "members";
  subscribeMsgs(true);
  const b = base();
  S.unsubRoom.push(onSnapshot(query(collection(db, ...b, "reacts"), limit(1000)), snap => { S.reacts = snap.docs.map(d => Object.assign({id:d.id}, d.data())); need("msgs"); }, ()=>{}));
  S.unsubRoom.push(onSnapshot(collection(db, ...b, "typing"), snap => { S.typing = snap.docs.map(d => Object.assign({uid:d.id}, d.data())); need("typing","rpanel","side"); }, ()=>{}));
  S.unreadSince = S.lastRead[readKey(kind, id)] || 0; S.scrollToUnread = S.unreadSince > 0;
  const drafts = store("drafts") || {}; input.value = drafts[readKey(kind, id)] || ""; autoGrow();
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
    if (kind === "room" && isPollRoom(curRoom())) ensureDailyPoll(curRoom());
    if (!document.hidden) markRead();
    need("msgs");
  }, e => toast("Lost connection to this chat: " + errMsg(e)));
  if (first){ const u = () => { if (S.unsubMsgs){ S.unsubMsgs(); S.unsubMsgs = null; } }; S.unsubRoom.push(u); }
}

function renderHeader(){
  const icon = $("topIcon"), t = $("topTitle"), d = $("topDesc");
  icon.innerHTML = "";
  $("btnPins").classList.toggle("hidden", isPage(S.kind)); $("search").parentElement.classList.toggle("hidden", isPage(S.kind));
  $("btnMembers").classList.toggle("hidden", S.kind === "shop" || S.kind === "quests" || S.kind === "feedback" || S.kind === "dev" || S.kind === "games"); $("btnShop").classList.toggle("hidden", S.kind === "shop");
  if (S.kind === "games"){ icon.appendChild(ic("grid")); t.textContent = "Daily Mini Games"; d.textContent = "Wordle, Spelling Bee, Sudoku & Mini Crossword · 5 plays each per day"; updateTitle(); return; }
  if (S.kind === "shop"){ icon.appendChild(ic("bag")); t.textContent = "Shop"; d.textContent = "Decorations, effects, nameplates and ranks"; updateTitle(); return; }
  if (S.kind === "quests"){ icon.appendChild(ic("star")); t.textContent = "Quests"; d.textContent = "Earn badges"; updateTitle(); return; }
  if (S.kind === "dev"){ icon.appendChild(h("span",{class:"devglyph",text:"</>"})); t.textContent = "Dev panel"; d.textContent = "Change CampusCord's code · only developers can see this"; updateTitle(); return; }
  if (S.kind === "feedback"){ icon.appendChild(ic("message")); t.textContent = "Feedback"; d.textContent = "Bugs, ideas and vouches"; updateTitle(); return; }
  if (S.kind === "home"){ icon.appendChild(ic("users")); t.textContent = "Friends"; d.textContent = "Everyone on " + ((S.config && S.config.serverName) || "CampusCord"); updateTitle(); return; }
  if (S.kind === "dm" && S.cur){
    const o = dmOther({id:S.cur}); icon.appendChild(avatar(o, "xs", false)); t.textContent = nickOf(o);
    const st = statusOf(o); d.textContent = profile(o).customStatus || ({online:"Online",idle:"Idle",dnd:"Do Not Disturb",offline:"Offline"}[st]);
  } else { const r = curRoom(); icon.appendChild(ic(isVoiceRoom(r) ? "volume" : r && r.private ? "lock" : r && r.readonly ? "megaphone" : "hash")); t.textContent = r ? r.name : ""; d.textContent = r && r.topic ? r.topic : ""; }
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

function renderHome(box){
  box.innerHTML = "";
  const wrap = h("div",{class:"dmhome"});
  const people = Object.keys(S.members).filter(u => u !== S.uid && !isBanned(u)).sort((a,b) => (isOn(b) - isOn(a)) || nickOf(a).localeCompare(nickOf(b)));
  const on = people.filter(isOn);
  wrap.append(h("div",{class:"dhh"}, h("h2",{text:"Direct Messages"}), h("p",{text:"Private chats between you and one other person. Nobody else can read them — not even admins."}),
    h("button",{class:"btn small", onclick:() => newDMModal()}, ic("plus"), " New message")));
  const recent = S.dms.filter(d => member(dmOther(d)) && d.lastTs && !dmHidden(d)).slice(0, 6);
  if (recent.length){
    wrap.appendChild(h("div",{class:"cat",text:"Recent conversations"}));
    wrap.appendChild(h("div",{class:"dmcards"}, recent.map(d => { const o = dmOther(d); const un = d.lastUid && d.lastUid !== S.uid && d.lastTs > (S.lastRead["dm:"+d.id]||0);
      return h("button",{class:"dmcard" + (un ? " unread" : ""), onclick:() => openChat("dm", d.id)}, avatar(o, null, true),
        h("div",{class:"dmc"}, paintName(h("b",{text:nickOf(o)}), o), h("span",{text:(d.lastUid === S.uid ? "You: " : "") + (d.lastPreview || "")})), un ? h("span",{class:"newdot"}) : null); })));
  }
  wrap.appendChild(h("div",{class:"cat",text:"Online — " + on.length}));
  const list = h("div",{class:"friends"});
  if (!people.length) list.appendChild(h("div",{class:"empty-note",text:"Nobody else has joined yet. Share the invite link!"}));
  people.forEach(u => list.appendChild(h("div",{class:"friend" + (isOn(u) ? "" : " off") + (equipped(u, "plate") ? " plate plate-" + equipped(u, "plate").slice(2) : ""), onclick:() => openDM(u)},
    avatar(u, null, true), h("div",{class:"fi"}, paintName(h("b",{text:nickOf(u)}), u), h("span",{text: profile(u).customStatus || ({online:"Online",idle:"Idle",dnd:"Do Not Disturb",offline:"Offline"}[statusOf(u)])})),
    h("button",{class:"ib", title:"Message " + nickOf(u), onclick:e => { e.stopPropagation(); openDM(u); }}, ic("message")))));
  wrap.appendChild(list);
  box.appendChild(wrap);
}
function renderMessages(){
  const box = $("msgs");
  if (S.kind === "home"){ renderHome(box); return; }
  if (S.kind === "games"){ renderGamesPage(box); return; }
  if (S.kind === "shop"){ renderShopPage(box); return; }
  if (S.kind === "quests"){ renderQuestsPage(box); return; }
  if (S.kind === "feedback"){ renderFeedbackPage(box); return; }
  if (S.kind === "dev"){ renderDevPage(box); return; }
  const atBottom = S.stickBottom !== false;
  const prevTop = box.scrollTop;
  box.innerHTML = "";
  if (S.hasMore) box.appendChild(h("div",{class:"loadmore",text:"Loading older messages…"}));
  else box.appendChild(welcomeBlock());
  const byMsg = {}; S.reacts.forEach(x => { (byMsg[x.mid] = byMsg[x.mid] || {}); (byMsg[x.mid][x.e] = byMsg[x.mid][x.e] || []).push(x); });
  const q = S.searchQ.toLowerCase();
  let prev = null, prevDay = "", divDone = false;
  S.msgs.forEach(m => {
    const dl = new Date(m.ts).toDateString();
    if (dl !== prevDay){ box.appendChild(h("div",{class:"day",text:dayLabel(m.ts)})); prevDay = dl; prev = null; }
    if (!divDone && S.unreadSince && m.ts > S.unreadSince && m.uid !== S.uid){ box.appendChild(h("div",{class:"newdiv"}, h("span",{text:"NEW"}))); divDone = true; prev = null; }
    const first = !prev || prev.uid !== m.uid || (m.ts - prev.ts) > 5*60*1000 || m.reply || m.me || prev.join || prev.vouch;
    box.appendChild(messageEl(m, first, byMsg[m.id]));
    prev = m;
  });
  if (S.keepFromBottom != null){ box.scrollTop = box.scrollHeight - S.keepFromBottom; S.keepFromBottom = null; }
  else if (atBottom) box.scrollTop = box.scrollHeight; else box.scrollTop = prevTop;
  if (S.unreadSince && S.roomLoaded) scheduleNewClear();
  if (S.scrollToUnread && S.roomLoaded){ const d = box.querySelector(".newdiv"); if (d){ box.scrollTop = Math.max(0, d.offsetTop - 80); S.stickBottom = nearBottom(); } S.scrollToUnread = false; }
  if (S.flashId){ const el = $("m-" + S.flashId); if (el){ el.scrollIntoView({block:"center"}); el.classList.add("flash"); S.flashId = null; } }
}
function welcomeBlock(){
  const w = h("div",{class:"welcome"});
  if (S.kind === "dm"){ const o = dmOther({id:S.cur}); const big = avatar(o, "xl"); big.style.marginBottom = "12px"; w.append(big, h("h2",null, nickOf(o)),
      h("p",null, S.roomLoaded ? "This is the start of your private messages with " + nickOf(o) + ". Only the two of you can see them." : "Loading messages…")); }
  else { const r = curRoom(); if (isVoiceRoom(r)){ w.append(h("div",{class:"big"}, ic("volume")), h("h2",null, r.name), h("p",null, V.room === r.id ? "You're in voice. This is the text chat for the channel — share links and talk while you're connected." : "Click the channel in the sidebar to join voice. You can chat here too."),
      V.room === r.id ? h("button",{class:"btn small danger",style:{marginTop:"12px"},onclick:() => leaveVoice()}, ic("phoneoff"), " Leave voice") : h("button",{class:"btn small",style:{marginTop:"12px"},onclick:() => { joinVoice(r.id); bumpStat("voice"); }}, ic("volume"), " Join voice")); return w; }
    w.append(h("div",{class:"big"}, ic(r && r.private ? "lock" : r && r.readonly ? "megaphone" : "hash")), h("h2",null,"Welcome to #" + (r ? r.name : "…")),
      h("p",null, !S.roomLoaded ? "Loading messages…" : (r && r.private) ? "Private room — only " + listNames(roomPeople(r).map(nickOf)) + " can see this." : (r && r.topic) ? r.topic : "This is the start of the #" + (r ? r.name : "") + " room.")); }
  return w;
}
function reactionRow(m, reacts){
  const rkeys = reacts ? Object.keys(reacts).filter(e => !e.startsWith("poll:")) : []; if (!rkeys.length) return null;
  const wrap = h("div",{class:"reacts"});
  rkeys.forEach(e => { const arr = reacts[e]; const mine = arr.some(x => x.uid === S.uid);
    wrap.appendChild(h("button",{class:"rc" + (mine ? " mine" : ""), title:arr.map(x => nickOf(x.uid)).join(", "), onclick:() => toggleReact(m, e)}, e + " ", h("b",{text:String(arr.length)}))); });
  wrap.appendChild(h("button",{class:"rc add", title:"Add reaction", onclick:ev => quickReact(ev, m)}, ic("smileplus")));
  return wrap;
}
function blockedKey(){ return "cc_blocked_" + (S.uid || "guest"); }
function getBlocked(){
  try {
    const raw = typeof store === "function" ? store(blockedKey()) : JSON.parse(localStorage.getItem(blockedKey()) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch(e){ return []; }
}
function isBlocked(uid){ return !!uid && uid !== S.uid && getBlocked().includes(uid); }
function toggleBlock(uid){
  if (!uid || uid === S.uid) return;
  const cur = new Set(getBlocked());
  const nowBlocked = !cur.has(uid);
  if (nowBlocked) cur.add(uid); else cur.delete(uid);
  const list = [...cur];
  try {
    if (typeof store === "function") store(blockedKey(), list);
    else localStorage.setItem(blockedKey(), JSON.stringify(list));
  } catch(e){}
  if (typeof setDoc === "function" && typeof doc === "function" && typeof db !== "undefined" && S.uid){
    setDoc(doc(db, "users", S.uid), { blocked: list }, { merge: true }).catch(() => {});
  }
  document.querySelectorAll('#msgs [data-uid="' + uid + '"]').forEach(el => {
    el.style.display = nowBlocked ? "none" : "";
  });
  toast(nowBlocked ? "Blocked " + nickOf(uid) + " — their messages are now hidden." : "Unblocked " + nickOf(uid) + " — their messages are visible again.");
  if (typeof need === "function") need("msgs");
}

function messageEl(m, first, reacts){
  if (m.daily && m.poll) return dailyPollEl(m, reacts);
  if (m.vouch){ const el = vouchEl(m); const rw = reactionRow(m, reacts); if (rw) el.querySelector(".body").appendChild(rw); el.oncontextmenu = e => msgMenu(e, m); el.dataset.uid = m.uid || ""; if (isBlocked(m.uid)) el.style.display = "none"; return el; }
  if (m.join){ const line = JOIN_LINES[parseInt(m.id.replace(/\D/g, "").slice(-3) || "0", 10) % JOIN_LINES.length];
    const jel = h("div",{class:"msg joinmsg first", id:"m-" + m.id, "data-uid": m.uid || ""}, h("div",{class:"gut"}, h("span",{class:"joinic"}, ic("arrowdown"))),
      h("div",{class:"body"}, h("div",{class:"jl"}, paintName(h("b",{class:"n",text:nickOf(m.uid), onclick:e => openProfile(m.uid, e.target)}), m.uid), " " + line, h("span",{class:"t",text:" " + fmtDay(m.ts)}))));
    if (isBlocked(m.uid)) jel.style.display = "none";
    return jel; }
  const mentioned = m.uid !== S.uid && ((m.mentions||[]).includes(S.uid) || m.everyone || (m.reply && m.reply.uid === S.uid));
  const row = h("div",{class:"msg" + (first ? " first" : "") + (mentioned ? " mention" : ""), id:"m-" + m.id, "data-uid": m.uid || ""});
  const gut = h("div",{class:"gut"});
  if (first){ const a = avatar(m.uid); a.onclick = e => openProfile(m.uid, a); gut.appendChild(a); }
  else gut.appendChild(h("span",{class:"tm",text:fmtTime(m.ts)}));
  row.appendChild(gut);
  const body = h("div",{class:"body"});
  if (m.reply){ const r = m.reply; body.appendChild(h("div",{class:"reply", onclick:() => jumpTo(r.id)}, h("b",{text:"@" + nickOf(r.uid)}), h("span",{text: isBlocked(r.uid) ? "Message from blocked user" : (r.text || "Click to see attachment")}))); }
  if (first){ const n = paintName(h("span",{class:"n",text:nickOf(m.uid), onclick:e => openProfile(m.uid, e.target)}), m.uid);
    body.appendChild(h("div",{class:"meta"}, n, ...roleTags(m.uid, true), gem(m.uid), h("span",{class:"t",text:fmtDay(m.ts)}))); }
  if (S.editing === m.id) body.appendChild(editBox(m));
  else if (m.poll) body.appendChild(pollEl(m, reacts || {}));
  else if (m.text){
    const tx = h("div",{class:"tx" + (m.me ? " me" : "") + (onlyEmoji(m.text) && !m.img ? " jumbo" : "")});
    tx.innerHTML = md(m.me ? nickOf(m.uid) + " " + m.text : m.text);
    if (m.edited) tx.appendChild(h("span",{class:"edited",title: m.editedAt ? fmtDay(m.editedAt) : "", text:"(edited)"}));
    tx.addEventListener("click", e => { const sp = e.target.closest(".spoiler"); if (sp) sp.classList.toggle("open"); const mn = e.target.closest(".men[data-uid]"); if (mn) openProfile(mn.dataset.uid, mn); });
    body.appendChild(tx);
  }
  if (m.text && !m.poll && S.editing !== m.id) embedsFor(m.text).forEach(e => body.appendChild(e));
  if (m.img){ const im = h("img",{class:"att", src:m.img, alt: m.gif ? "GIF" : "image", loading:"lazy", onclick:() => lightbox(m.img)});
    im.onload = () => { if (S.stickBottom){ const b = $("msgs"); b.scrollTop = b.scrollHeight; } }; body.appendChild(im); }
  const rw = reactionRow(m, reacts); if (rw) body.appendChild(rw);
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
  row.addEventListener("contextmenu", e => msgMenu(e, m));
  if (isBlocked(m.uid)) row.style.display = "none";
  return row;
}
// ---------------------------------------------------------------- polls
function isPollLocked(m){
  if (!m || !m.daily) return false;
  if (m.daily !== etDay()) return true;
  return (S.msgs || []).some(x => x.daily && x.daily > m.daily);
}
function pollEl(m, reacts){
  const locked = isPollLocked(m);
  const opts = (m.poll.opts || []).slice(0, 10);
  const counts = opts.map((_, i) => (reacts["poll:" + i] || []).length);
  const total = counts.reduce((a, b) => a + b, 0);
  const box = h("div",{class:"poll" + (locked ? " locked" : "")}, h("div",{class:"pq"}, ic("grid","sm"), h("span",{text:m.poll.q})));
  opts.forEach((o, i) => { const arr = reacts["poll:" + i] || []; const mine = arr.some(x => x.uid === S.uid); const pct = total ? Math.round(counts[i] / total * 100) : 0;
    box.appendChild(h("button",{class:"popt" + (mine ? " mine" : ""), disabled: locked || null, style: locked ? {cursor:"default", opacity: mine ? "1" : "0.75"} : null, title: arr.map(x => nickOf(x.uid)).join(", ") || "No votes yet", onclick: locked ? null : () => votePoll(m, i)},
      h("i",{class:"bar", style:{width:pct + "%"}}), h("span",{class:"ot"}, mine ? ic("check","sm") : null, h("span",{text:o})), h("b",{text: pct + "%"}))); });
  box.appendChild(h("div",{class:"pf",text: total + " vote" + (total === 1 ? "" : "s") + (locked ? " · Poll closed (final results)" : " · click an option to vote, click again to remove")}));
  return box;
}
async function votePoll(m, i){
  if (isPollLocked(m)) return toast("This daily poll is closed.");
  const b = base(); const mine = S.reacts.filter(x => x.mid === m.id && x.uid === S.uid && String(x.e).startsWith("poll:"));
  const had = mine.some(x => x.e === "poll:" + i);
  try{ for (const x of mine) await deleteDoc(doc(db, ...b, "reacts", x.id));
    if (!had){ await setDoc(doc(db, ...b, "reacts", m.id + "__" + S.uid + "__poll" + i), {mid:m.id, uid:S.uid, e:"poll:" + i, ts:Date.now()}); bumpStat("votes"); } }
  catch(e){ toast("Couldn't vote: " + errMsg(e)); }
}
// ---------------------------------------------------------------- embeds (YouTube + image links)
function embedsFor(text){
  const out = []; const urls = (text.match(/https?:\/\/[^\s<]+/g) || []).slice(0, 2);
  urls.forEach(u => { let m;
    if ((m = u.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/))){
      const vid = m[1]; const box = h("div",{class:"embed yt lite", title:"Play video", onclick:() => { box.innerHTML = ""; box.classList.remove("lite");
          box.appendChild(h("iframe",{src:"https://www.youtube-nocookie.com/embed/" + vid + "?autoplay=1", allow:"accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture", allowfullscreen:true, title:"YouTube video"})); }},
        h("img",{src:"https://i.ytimg.com/vi/" + vid + "/hqdefault.jpg", alt:"", loading:"lazy"}), h("span",{class:"ytplay"}));
      out.push(box);
      out.push(h("button",{class:"btn small ghost", style:{marginTop:"4px"}, onclick:() => playMusic(vid, "YouTube Track")}, ic("headphones","sm"), " Listen in player"));
    } else if (/\.(png|jpe?g|gif|webp)(\?|#|$)/i.test(u)){
      out.push(h("img",{class:"att", src:u, loading:"lazy", referrerpolicy:"no-referrer", onclick:() => lightbox(u), onerror:function(){ this.remove(); }}));
    } });
  return out;
}
// ---------------------------------------------------------------- context menus
function ctxMenu(ev, items){
  ev.preventDefault(); document.querySelectorAll(".ctx").forEach(x => x.remove());
  const menu = h("div",{class:"ctx"});
  items.filter(Boolean).forEach(it => {
    if (it === "-"){ menu.appendChild(h("div",{class:"sep"})); return; }
    if (it.row){ menu.appendChild(it.row); return; }
    menu.appendChild(h("button",{class: it.danger ? "danger" : null, onclick:() => { menu.remove(); it.run(); }}, h("span",{text:it.label}), it.icon ? ic(it.icon) : null));
  });
  document.body.appendChild(menu);
  const x = Math.min(ev.clientX, window.innerWidth - menu.offsetWidth - 8), y = Math.min(ev.clientY, window.innerHeight - menu.offsetHeight - 8);
  menu.style.left = Math.max(8, x) + "px"; menu.style.top = Math.max(8, y) + "px";
  setTimeout(() => document.addEventListener("mousedown", function hh(e){ if (!menu.contains(e.target)){ menu.remove(); document.removeEventListener("mousedown", hh); } }), 0);
}
function msgMenu(ev, m){
  if (ev.target.closest("a")) return;
  const mine = m.uid === S.uid;
  ctxMenu(ev, [
    {row: h("div",{class:"ctxreact"}, QUICK.slice(0, 6).map(e => h("button",{onclick:() => { document.querySelectorAll(".ctx").forEach(x => x.remove()); toggleReact(m, e); }}, e)))},
    "-",
    canPost() ? {label:"Reply", icon:"reply", run:() => startReply(m)} : null,
    mine && m.text != null && !m.me && !m.poll ? {label:"Edit message", icon:"pencil", run:() => { S.editing = m.id; S.editDraft = null; S.editCaret = null; need("msgs"); }} : null,
    canPin() ? {label: m.pinned ? "Unpin message" : "Pin message", icon:"pin", run:() => togglePin(m)} : null,
    m.text ? {label:"Copy text", icon:"copy", run:() => copy(m.text)} : null,
    {label:"Mark unread", icon:"bell", run:() => { S.lastRead[readKey(S.kind, S.cur)] = m.ts - 1; store("lastRead", S.lastRead); S.unreadSince = m.ts - 1; need("msgs","side","rail"); toast("Marked unread from here"); }},
    !mine ? {label:"Mention " + nickOf(m.uid), icon:"message", run:() => insertAt("@" + nickOf(m.uid) + " ")} : null,
    (mine || (isAdmin() && S.kind === "room")) ? "-" : null,
    (mine || (isAdmin() && S.kind === "room")) ? {label:"Delete message", icon:"trash", danger:true, run:() => confirmBox("Delete message?", "This can't be undone.", "Delete", () => deleteMsg(m))} : null,
  ]);
}
function roomMenu(ev, r){
  ctxMenu(ev, [
    {label:"Mark as read", icon:"check", run:() => { S.lastRead[r.id] = Date.now(); delete S.mentions[r.id]; store("lastRead", S.lastRead); store("mentions", S.mentions); need("side","rail"); }},
    {label: isMuted(r.id) ? "Unmute room" : "Mute room", icon:"bell", run:() => { prefs.muted = prefs.muted || {}; if (prefs.muted[r.id]) delete prefs.muted[r.id]; else prefs.muted[r.id] = true; savePrefs(); need("side","rail"); toast(isMuted(r.id) ? "#" + r.name + " muted — you'll still get @mentions" : "#" + r.name + " unmuted"); }},
    {label: (prefs.pins || []).includes(r.id) ? "Unpin" : "Pin to top", icon:"pin", run:() => togglePinRoom(r.id)},
    isAdmin() && (isOwner() || !r.private) ? "-" : null,
    isAdmin() ? {label:"Move to section…", icon:"menu", run:() => moveRoomModal(r)} : null,
    isAdmin() && (isOwner() || !r.private) ? {label:"Edit room", icon:"settings", run:() => roomModal(r)} : null,
  ]);
}
function moveRoomModal(r){
  modal((m, close) => { m.append(h("h3",{text:"Move #" + r.name}), h("p",{class:"note",text:"Pick a section. Tip: you can also drag rooms in the sidebar."}),
    h("div",{class:"list"}, catOrder().map(c => h("button",{class:"li", style:{cursor:"pointer",border:0,width:"100%",textAlign:"left"}, onclick:() => { close(); placeRoom(r.id, c, null); }}, ic("menu","sm"), h("span",{class:"nm",text:c}))),
      isOwner() ? h("button",{class:"li", style:{cursor:"pointer",border:0,width:"100%",textAlign:"left"}, onclick:() => { close(); newCategory(); }}, ic("plus","sm"), h("span",{class:"nm",text:"New section…"})) : null),
    h("div",{class:"foot"}, h("button",{class:"btn ghost",onclick:close},"Cancel"))); });
}
function serverMenu(ev){
  ctxMenu(ev, [
    {label:"Mark all as read", icon:"check", run:() => { S.rooms.forEach(r => S.lastRead[r.id] = Date.now()); S.mentions = {}; store("lastRead", S.lastRead); store("mentions", {}); need("side","rail"); }},
    isAdmin() ? {label:"Copy invite", icon:"copy", run:() => copy("Join me on CampusCord! " + LIVE_URL + "  Invite code: " + (S.invite || "(ask me)"), "Invite copied")} : null,
    isAdmin() ? {label:"Server settings", icon:"shield", run:() => openAdmin()} : null,
    isOwner() ? {label:"Add section", icon:"plus", run:() => newCategory()} : null,
    {label:"Campus+ Shop", icon:"bag", run:() => openShop()},
    {label:"Help", icon:"info", run:() => openHelp()},
    {label:"User Agreement", icon:"info", run:() => rulesModal()},
    {label:"Feedback & bugs", icon:"message", run:() => openChat("feedback", "all")},
    !isInstalled() ? {label:"Install desktop app", icon:"arrowdown", run:() => installApp()} : null,
  ]);
}
function canModerate(uid){ return isAdmin() && uid !== S.uid && !isOwnerUid(uid) && (isRealOwner() || !isCoOwnerUid(uid)) && (isOwner() || !isDev(uid) || (isHeadDev(S.uid) && !isHeadDev(uid))); }
function memberMenu(ev, uid){
  const tu = timeoutUntil(uid);
  ctxMenu(ev, [
    {label:"Profile", icon:"user", run:() => openProfile(uid, ev.target.closest(".mrow") || ev.target)},
    uid !== S.uid ? {label:"Message", icon:"message", run:() => openDM(uid)} : null,
    uid !== S.uid && S.kind === "room" && canPost() ? {label:"Mention", icon:"message", run:() => insertAt("@" + nickOf(uid) + " ")} : null,
    isOwner() && uid !== S.uid ? "-" : null,
    isOwner() && uid !== S.uid ? (nameLocked(uid) ? {label:"Remove name flag", icon:"check", run:() => clearNameFlag(uid)} : {label:"Not their real name…", icon:"alert", danger:true, run:() => flagName(uid)}) : null,
    isRealOwner() && uid !== S.uid ? {label: isCoOwnerUid(uid) ? "Remove Co-owner" : "Make Co-owner…", icon:"crown", run:() => isCoOwnerUid(uid) ? setCoOwner(uid, false) : coOwnerConfirm(uid)} : null,
    isOwner() && uid !== S.uid ? {label: isHeadDev(uid) ? "Remove Head Dev" : "Make Head Dev", icon:"star", run:() => setHeadDev(uid, !isHeadDev(uid))} : null,
    !isOwner() && isHeadDev(S.uid) && uid !== S.uid && !isOwnerUid(uid) && !isHeadDev(uid) ? {label: isDev(uid) ? "Remove developer" : "Make developer…", icon:"code", run:() => devModal(uid)} : null,
    isOwner() && uid !== S.uid ? {label: isDev(uid) ? "Remove developer" + (devUntil(uid) ? " (until " + devTimeLabel(devUntil(uid)) + ")" : "") : "Make developer…", icon:"code", run:() => devModal(uid)} : null,
    isOwner() && uid !== S.uid ? {label: isDesigner(uid) ? "Remove designer" : "Make designer", icon:"pen", run:() => setDesigner(uid, !isDesigner(uid))} : null,
    ...modMenuItems(uid),
    isOwner() && !isOwnerUid(uid) ? {label:"Link an old account…", icon:"users", run:() => linkAccountModal(uid)} : null,
    isOwner() && uid !== S.uid ? {label:"Give 2 more vouch tries (" + vouchTries(uid).left + " left)", icon:"star", run:() => giveVouchTries(uid, 2)} : null,
    canModerate(uid) ? "-" : null,
    canModerate(uid) && !tu ? {label:"Timeout 5 minutes", icon:"hourglass", run:() => setTimeoutFor(uid, 5)} : null,
    canModerate(uid) && !tu ? {label:"Timeout 1 hour", icon:"hourglass", run:() => setTimeoutFor(uid, 60)} : null,
    canModerate(uid) && !tu ? {label:"Timeout 1 day", icon:"hourglass", run:() => setTimeoutFor(uid, 1440)} : null,
    canModerate(uid) && tu ? {label:"Remove timeout", icon:"hourglass", run:() => setTimeoutFor(uid, 0)} : null,
    canModerate(uid) ? {label:"Kick " + nickOf(uid), icon:"x", danger:true, run:() => kickWithReason(uid)} : null,
  ]);
}
async function setTimeoutFor(uid, mins){
  try{ await updateDoc(doc(db, "config/main"), {["timeouts." + uid]: mins ? Date.now() + mins * 60000 : deleteField()});
    toast(mins ? nickOf(uid) + " is timed out for " + (mins >= 1440 ? "1 day" : mins >= 60 ? "1 hour" : mins + " minutes") : nickOf(uid) + "'s timeout was removed"); }
  catch(e){ toast("Couldn't update timeout: " + errMsg(e)); }
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
  try{ if (S.reacts.some(x => x.id === id)) await deleteDoc(ref); else { await setDoc(ref, {mid:m.id, uid:S.uid, e, ts:Date.now()}); bumpStat("reacts"); } }
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
window.addEventListener("resize", () => { clearTimeout(S.rsT); S.rsT = setTimeout(() => need("rpanel","header"), 120); });
document.addEventListener("mousedown", e => { if (window.innerWidth < 1100 && S.rpanelForced && !e.target.closest("#rpanel,#btnMembers,.profile,.ctx")){ S.rpanelForced = false; need("rpanel","header"); } });
$("btnMembers").onclick = () => { if (window.innerWidth < 1100){ const vis = !$("rpanel").classList.contains("hidden") && S.rpanel === "members"; S.rpanel = "members"; S.rpanelForced = !vis; need("rpanel","header"); return; }
  S.rpanel = S.rpanel === "members" ? null : "members"; prefs.showMembers = S.rpanel === "members"; savePrefs(); need("rpanel","header"); };
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
  if (S.kind === "shop" || S.kind === "quests" || S.kind === "feedback" || S.kind === "dev" || S.kind === "games"){ p.classList.add("hidden"); return; }
  const narrow = window.innerWidth < 1100;
  if (S.rpanel === null && prefs.showMembers === false || !S.rpanel || (narrow && S.rpanel === "members" && !S.rpanelForced)){ p.classList.add("hidden"); $("btnMembers").classList.remove("on"); return; }
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
  // The owner and co-owners share the Owner section (the owner first).
  const isTopUid = u => isOwnerUid(u) || isCoOwnerUid(u);
  const special = u => isTopUid(u) || ((isDev(u) || isDesigner(u)) && isOn(u)) || (rankOf(u) === "plusplus" && isOn(u));
  const groups = [["Owner", uids.filter(isTopUid).sort((a, b) => isOwnerUid(b) - isOwnerUid(a))], ["Developers", uids.filter(u => !isTopUid(u) && isDev(u) && isOn(u))],
    ["Design", uids.filter(u => !isTopUid(u) && !isDev(u) && isDesigner(u) && isOn(u))],
    ["Campus++", uids.filter(u => !isTopUid(u) && !isDev(u) && !isDesigner(u) && rankOf(u) === "plusplus" && isOn(u))],
    ["Online", uids.filter(u => !special(u) && isOn(u))], ["Offline", uids.filter(u => !isTopUid(u) && !isOn(u))]];
  groups.forEach(([label, arr]) => {
    if (!arr.length) return;
    b.appendChild(h("div",{class:"cat",text: label + " — " + arr.length}));
    arr.sort(sortN).forEach(u => {
      const cs = profile(u).customStatus; const typing = typersIn(S.kind, S.cur).includes(u);
      const pl = equipped(u, "plate");
      const row = h("div",{class:"mrow" + (isOn(u) ? "" : " off") + (pl ? " plate plate-" + pl.slice(2) : ""), onclick:e => openProfile(u, row), oncontextmenu:e => memberMenu(e, u)},
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
  const pe = equipped(uid, "pfx");
  const card = h("div",{class:"profile", "data-layer":"profile"}, pe ? h("div",{class:"pfx pfx-" + pe.slice(2)}) : null,
    h("div",{class:"banner" + (equipped(uid, "pban") ? " ban-" + equipped(uid, "pban").slice(2) : ""), style:{background: hasPerk(uid, "banner_gradient") ? "linear-gradient(135deg," + bannerColor + ",#a78bfa 55%,#3fb8ff)" : bannerColor}}),
    h("div",{class:"pav"}, big),
    h("div",{class:"pbadges"}, badgeRow(uid)),
    h("div",{class:"pb"},
      h("div",{class:"pname"}, paintName(h("span",{text:nickOf(uid)}), uid), ...miniTags(uid)),
      h("div",{class:"pstat",text: (p.customStatus ? p.customStatus + " · " : "") + ({online:"Online",idle:"Idle",dnd:"Do Not Disturb",offline:"Offline"}[st])}),
      timeoutUntil(uid) ? h("div",{class:"pstat tmo"}, ic("hourglass","sm"), " Timed out until " + fmtTime(timeoutUntil(uid))) : null,
      uid !== S.uid && isBlocked(uid) ? h("div",{class:"pstat tmo", text:"Blocked · You won't see their messages"}) : null,
      p.bio ? h("div",{class:"sect"}, h("h4",{text:"About me"}), h("div",{text:p.bio})) : null,
      vouchProfileEl(uid),
      h("div",{class:"sect"}, h("h4",{text:"Member since"}), h("div",{text: member(uid).joinedAt ? new Date(member(uid).joinedAt).toLocaleDateString([], {month:"long", day:"numeric", year:"numeric"}) : "—"})),
      h("div",{class:"acts"},
        uid === S.uid ? h("button",{class:"btn small", onclick:() => { closeLayer("profile"); openSettings("profile"); }}, "Edit profile") : h("button",{class:"btn small", onclick:() => { closeLayer("profile"); openDM(uid); }}, ic("message"), " Message"),
        uid !== S.uid ? h("button",{class:"btn small" + (isBlocked(uid) ? "" : " danger"), onclick:() => { toggleBlock(uid); closeLayer("profile"); }}, isBlocked(uid) ? "Unblock" : "Block") : null,
        uid === S.uid ? statusPicker() : null,
        isAdmin() && uid !== S.uid && !isOwnerUid(uid) && !(isDev(uid) && !isOwner()) ? h("button",{class:"btn small danger", onclick:() => { closeLayer("profile"); kickWithReason(uid); }}, "Kick") : null),
      isOwner() && uid !== S.uid ? h("div",{class:"proles"}, h("span",{class:"pl",text:"Roles"}),
        h("button",{class:"rolepill dev" + (isDev(uid) ? " on" : ""), title: isDev(uid) ? "Remove developer" : "Make developer", onclick:() => { closeLayer("profile"); devModal(uid); }}, isDev(uid) ? (devUntil(uid) ? "⏱ DEV" : "✓ DEV") : "+ DEV"),
        h("button",{class:"rolepill design" + (isDesigner(uid) ? " on" : ""), title: isDesigner(uid) ? "Remove designer" : "Make designer", onclick:() => { closeLayer("profile"); setDesigner(uid, !isDesigner(uid)); }}, isDesigner(uid) ? "✓ DESIGN" : "+ DESIGN"),
        nameLocked(uid) ? h("button",{class:"rolepill nameflag on", title:"Remove the name flag", onclick:() => { closeLayer("profile"); clearNameFlag(uid); }}, "✓ FLAGGED")
          : h("button",{class:"rolepill nameflag", title:"This isn't their real name", onclick:() => { closeLayer("profile"); flagName(uid); }}, "NOT REAL NAME")) : null,
      isOwner() && uid !== S.uid && nameFlagLabel(uid) ? h("div",{class:"note nfl",text:nameFlagLabel(uid)}) : null,
      uid !== S.uid && modLabel(uid) ? h("div",{class:"note nfl",text:modLabel(uid)}) : null,
      isOwner() && uid !== S.uid ? h("div",{class:"note nfl",text:"Vouch tries left: " + vouchTries(uid).left + " of " + vouchTries(uid).total}) : null));
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
  if (Date.now() - typingSent > 6000){ typingSent = Date.now(); typingPath = base(); setDoc(doc(db, ...typingPath, "typing", S.uid), {t:typingSent}).catch(()=>{}); }
  clearTimeout(typingT); typingT = setTimeout(stopTyping, 4000);
}
function stopTyping(){ clearTimeout(typingT); if (typingSent && typingPath) deleteDoc(doc(db, ...typingPath, "typing", S.uid)).catch(()=>{}); typingSent = 0; typingPath = null; }
function typersIn(kind, id){ if (kind !== S.kind || id !== S.cur) return []; return S.typing.filter(x => x.uid !== S.uid && Date.now() - seenAt("t:" + x.uid, x.t) < 10000 && member(x.uid)).map(x => x.uid); }
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
  $("composer").classList.toggle("hidden", isPage(S.kind)); if (isPage(S.kind)) return;
  const dmGone = S.kind === "dm" && (isBanned(dmOther({id:S.cur})) || !member(dmOther({id:S.cur})));
  const ok = canPost() && !dmGone; const vroom = S.kind === "room" && isVouchRoom(curRoom());
  const proom = S.kind === "room" && isPollRoom(curRoom());
  if (proom) ensureDailyPoll(curRoom());
  // #vouches and #daily-poll: no regular chatting, just vouches / voting
  $("cbox").classList.toggle("hidden", !ok || vroom || proom); $("locked").classList.toggle("hidden", ok);
  if (!ok){ const lk = $("locked"); lk.innerHTML = ""; const tu = timeoutUntil(S.uid);
    lk.append(ic(tu ? "hourglass" : "lock"), dmGone ? "This person isn't in CampusCord anymore." : tu ? "You're timed out until " + fmtTime(tu) + ". You can still read, and you can DM Massimo." : "Only admins can post in this announcement room."); }
  if (S.replyTo) bars.appendChild(h("div",{class:"cbar"}, "Replying to ", h("b",{text:nickOf(S.replyTo.uid)}), h("span",{class:"sp"}), h("button",{class:"ib", style:{width:"24px",height:"24px",fontSize:"13px"}, title:"Cancel reply", onclick:() => { S.replyTo = null; need("composer"); }}, ic("x"))));
  if (S.pending) bars.appendChild(h("div",{class:"cbar"}, h("img",{src:S.pendingUrl}), h("span",{id:"prevName",text:S.pending.name + " · " + Math.round(S.pending.size/1024) + " KB"}), h("span",{class:"sp"}), h("button",{class:"ib", title:"Remove", onclick:() => setPending(null)}, ic("x"))));
  const r = curRoom();
  input.placeholder = S.kind === "dm" ? "Message @" + nickOf(dmOther({id:S.cur})) : isVouchRoom(r) ? "Type /vouch or click Write a vouch" : "Message #" + (r ? r.name : "");
  if (isPollRoom(r) && ok) bars.appendChild(h("div",{class:"cbar vbarw vonly"}, h("span",{text:"📊"}), h("span",{text:"This channel is for the daily poll — click an answer to vote. A new poll drops every day at midnight."})));
  if (isVouchRoom(r) && ok) bars.appendChild(h("div",{class:"cbar vbarw vonly"}, h("span",{text:"🎉"}), h("span",{text:"This channel is for vouches only — rate a friend or CampusCord with stars, a short review and optional proof."}), h("span",{class:"sp"}), h("button",{class:"btn small", onclick:() => openVouchModal()}, "Write a vouch")));
  $("hintline").textContent = "";
  requestAnimationFrame(autoGrow);
}
let draftT = null;
function saveDraft(){ if (!S.cur) return; const d = store("drafts") || {}; const k = readKey(S.kind, S.cur);
  if (input.value.trim()) d[k] = input.value.slice(0, 4000); else delete d[k]; store("drafts", d); }
input.addEventListener("input", () => { clearTimeout(draftT); draftT = setTimeout(saveDraft, 400); });
function autoGrow(){ if (!input.offsetParent) return; input.style.height = "auto"; input.style.height = Math.min(200, input.scrollHeight) + "px"; }
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
  if (it.insert && it.insert.trim() === "/vouch" && it.start === 0){ hideAutocomplete(); input.value = ""; autoGrow(); openVouchModal(); return; }
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
    case "vouch": { const at = arg.match(/^@?(\S+)/); const u = at ? Object.keys(S.members).find(x => nickOf(x).toLowerCase() === at[1].toLowerCase()) : null; openVouchModal(u || undefined); return null; }
    case "flip": return {text:"🪙 flipped a coin: **" + (Math.random() < .5 ? "Heads" : "Tails") + "**"};
    case "nick": if (arg.length >= 2){ try{ const v = await changeNick(arg); toast("Name changed to " + v); }catch(e){ toast(e.message || errMsg(e)); } } else toast("Usage: /nick <new name>"); return null;
    case "status": try{ await setMyProfile({customStatus:arg.slice(0,60)}); toast(arg ? "Status set" : "Status cleared"); }catch(e){} return null;
    case "poll": { const parts = arg.split("|").map(x => x.trim()).filter(Boolean);
      if (parts.length < 3){ toast("Usage: /poll Question | Option 1 | Option 2"); return null; }
      const q = parts[0].slice(0, 200), opts = parts.slice(1, 11).map(o => o.slice(0, 80));
      return {text:"📊 Poll: " + q, poll:{q, opts}}; }
    case "help": openHelp(arg); return null;
    default: return {text:raw};
  }
}

let sending = false;
async function send(extra){
  if (sending) return;
  let raw = input.value.trim(); const f = S.pending;
  if ((raw || f) && !extra){ const why = spamCheck(raw); if (why){ toast(why); return; } }
  if (!raw && !f && !extra) return;
  if (!S.cur){ toast("Pick a room or DM first"); return; }
  if (!canPost()){ toast("Only admins can post here"); return; }
  sending = true; stopTyping(); hideAutocomplete();
  // Lock in which chat this message belongs to *before* any awaits, so switching chats mid-send can't misroute it.
  const b = base(), kind = S.kind, chatId = S.cur, roomAtSend = curRoom(), replyTo = S.replyTo;
  try{
    let out = {text:raw};
    if (raw.startsWith("/") && !extra){ out = await runSlash(raw); if (!out){ input.value = ""; autoGrow(); return; } }
    const text = (out.text || "").slice(0, 4000);
    const body = {uid:S.uid, text, ts:Date.now()};
    if (out.me) body.me = true;
    if (out.poll){ body.poll = out.poll; bumpStat("polls"); }
    const mentions = findMentions(text); if (mentions.length) body.mentions = mentions;
    if (/@everyone\b/.test(text) && isAdmin() && kind === "room") body.everyone = true;
    if (replyTo){ body.reply = replyTo; }
    if (f){ const pn = $("prevName"); if (pn) pn.textContent = "Uploading…"; body.img = await imageToData(f); if (/gif/.test(f.type)) body.gif = true; }
    if (extra) Object.assign(body, extra);
    const id = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,7);
    const stillHere = S.kind === kind && S.cur === chatId;
    if (stillHere){ input.value = ""; autoGrow(); saveDraft(); S.unreadSince = 0; } S.replyTo = null; setPending(null); S.stickBottom = true;
    await setDoc(doc(db, ...b, "msgs", id), body); bumpStat("msgs");
    const preview = (body.me ? nickOf(S.uid) + " " : "") + (text || (body.gif ? "sent a GIF" : body.img ? "sent an image" : "")).slice(0, 120);
    const priv = kind === "room" && (roomAtSend || {}).private;
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
$("camBtn").onclick = () => cameraToChat();
$("gifBtn").onclick = e => { e.stopPropagation(); const open = !$("gifPop").classList.contains("hidden"); closePops(); if (!open) $("gifPop").classList.remove("hidden"); };
document.addEventListener("click", e => { if (!e.target.closest(".pop") && !e.target.closest("#emoBtn") && !e.target.closest("#gifBtn") && !e.target.closest(".quick")) closePops(); });
document.addEventListener("keydown", e => {
  if (e.key === "Escape"){
    const top = $("layer").lastElementChild;
    if (document.querySelector(".lightbox,.quick,.profile,.ctx")){ document.querySelectorAll(".lightbox,.quick,.profile,.ctx").forEach(x => x.remove()); return; }
    if (top && top._close){ top._close(); return; }
    closePops(); closeNav(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && S.routed === "app"){ e.preventDefault(); quickSwitcher(); }
  if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown") && S.routed === "app"){
    e.preventDefault(); const list = S.mode === "dms" ? S.dms.map(d => ["dm", d.id]) : S.rooms.map(r => ["room", r.id]);
    const i = list.findIndex(x => x[0] === S.kind && x[1] === S.cur); const nx = list[(i + (e.key === "ArrowDown" ? 1 : -1) + list.length) % list.length]; if (nx) openChat(nx[0], nx[1]); }
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
  const close = () => { if (m._onClose){ try{ m._onClose(); }catch(e){} } bg.remove(); if (S.paneRefresh && S.paneRefresh.bg === bg) S.paneRefresh = null; };
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
function newGroupModal(){
  let sel = [];
  modal((m, close) => {
    m.append(h("h3",{text:"New Group Chat"}), h("p",{class:"note",text:"Name your group and select friends to add."}));
    const nameInp = h("input",{class:"inp", placeholder:"Group name (optional)", maxLength:40, style:{marginBottom:"10px"}}); m.appendChild(nameInp);
    const selDiv = h("div",{style:{marginBottom:"10px",fontSize:"13px",color:"var(--t2)"}}); m.appendChild(selDiv);
    const f = h("input",{class:"inp", placeholder:"Search friends", style:{marginBottom:"10px"}}); m.appendChild(f);
    const list = h("div",{class:"list"}); m.appendChild(list);
    const updateSel = () => { selDiv.textContent = sel.length ? "Selected: " + sel.map(nickOf).join(", ") : ""; };
    const draw = () => { list.innerHTML = ""; const q = f.value.toLowerCase();
      const us = Object.keys(S.members).filter(u => u !== S.uid && !isBanned(u) && nickOf(u).toLowerCase().includes(q)).sort((a,b) => (isOn(b) - isOn(a)) || nickOf(a).localeCompare(nickOf(b)));
      if (!us.length) list.appendChild(h("div",{class:"note",text:"Nobody found."}));
      us.forEach(u => {
        const isSel = sel.includes(u);
        list.appendChild(h("div",{class:"li", style:{cursor:"pointer", backgroundColor: isSel ? "var(--hl)" : ""}, onclick:() => { 
          if (isSel) sel = sel.filter(x => x !== u); else sel.push(u); 
          updateSel(); draw(); 
        }}, avatar(u, "sm", true), paintName(h("span",{class:"nm",text:nickOf(u)}), u), isSel ? h("span",{style:{marginLeft:"auto"}}, ic("check","sm")) : null));
      }); 
    };
    f.oninput = draw; draw();
    m.appendChild(h("div",{class:"foot"}, 
      h("button",{class:"btn ghost",onclick:close},"Cancel"),
      h("button",{class:"btn", onclick:async () => {
        if (!sel.length) return toast("Select at least one person.");
        close();
        const id = rid();
        const name = nameInp.value.trim().slice(0, 40);
        const data = {uid: S.uid, users: [S.uid, ...sel], createdAt: Date.now()};
        if (name) data.name = name;
        try {
          await setDoc(doc(db, "groups", id), data);
          S.mode = "dms"; openChat("group", id);
        } catch(e) { toast("Couldn't start group: " + errMsg(e)); }
      }},"Create Group")
    ));
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
    let ro = !!(room && room.readonly), vc = !!(room && room.type === "voice"), vch = !!(room && room.type === "vouches"), pch = !!(room && room.type === "poll");
    const sw = h("button",{class:"sw" + (ro ? " on" : ""), onclick:() => { ro = !ro; sw.classList.toggle("on", ro); }});
    const vsw = h("button",{class:"sw" + (vc ? " on" : ""), onclick:() => { vc = !vc; vsw.classList.toggle("on", vc); if (vc && !room && (c.value === "Text rooms" || !c.value)) c.value = "Voice rooms"; }});
    m.append(h("label",{class:"f",text:"Room name"}), n, h("label",{class:"f",text:"Topic"}), t, h("label",{class:"f",text:"Category"}), c, dl,
      h("div",{class:"toggle"}, h("div",{class:"tl"}, h("b",{}, ic("volume","sm"), " Voice channel"), h("span",{text:"People can talk live (up to 20). It also has a text chat."})), vsw),
      h("div",{class:"toggle"}, h("div",{class:"tl"}, h("b",{}, "🎉 Vouches channel"), h("span",{text:"People post star-rated vouch cards with /vouch"})), (() => { const b = h("button",{class:"sw" + (vch ? " on" : ""), onclick:() => { vch = !vch; b.classList.toggle("on", vch); }}); return b; })()),
      h("div",{class:"toggle"}, h("div",{class:"tl"}, h("b",{}, "📊 Daily poll channel"), h("span",{text:"A new poll every day; people just vote, no chatting"})), (() => { const b = h("button",{class:"sw" + (pch ? " on" : ""), onclick:() => { pch = !pch; b.classList.toggle("on", pch); }}); return b; })()),
      h("div",{class:"toggle"}, h("div",{class:"tl"}, h("b",{text:"Announcement room"}), h("span",{text:"Only Head Devs and the owner can post"})), canPostAnnouncements() ? sw : h("span",{class:"note",style:{margin:0},text: ro ? "On" : "Off"})));
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
      const data = {name:s, topic:t.value.trim().slice(0,120), category:(c.value.trim() || "Text rooms").slice(0,32), readonly:ro, type: vc ? "voice" : vch ? "vouches" : pch ? "poll" : "text"};
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
      sections.forEach(s => { if (s.hidden) return; if (s.header){ nav.appendChild(h("div",{class:"h",text:s.header})); return; }
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
    {id:"about", label:"Desktop app & about", icon:"info", render:paneAbout},
  ], start === "shop" ? "account" : (start || "account"));
  if (start === "shop"){ closeTopModal(); openShop(); }
}
function paneAccount(p){
  const me = member(S.uid); let color = me.color;
  const n = h("input",{class:"inp", value:me.nick, maxlength:"24"});
  const cs = h("div",{class:"colors"}, COLORS.map(c => { const b = h("button",{class: c === color ? "on" : "", style:{background:c}, onclick:() => { color = c; [...cs.children].forEach(x => x.classList.remove("on")); b.classList.add("on"); }}); return b; }));
  const av = avatar(S.uid, "xl", true);
  p.append(h("div",{class:"preview-card", style:{display:"flex",gap:"14px",alignItems:"center"}}, av, h("div",null, paintName(h("div",{style:{fontSize:"20px",fontWeight:"800"},text:nickOf(S.uid)}), S.uid), h("div",{class:"note",text: isOwner() ? "☯ Owner of CampusCord" : isDev(S.uid) ? "💻 Developer" : "Member"}))),
    h("label",{class:"f",text:"Profile picture"}), avatarPhotoControls(),
    avatarMaker(),
    h("label",{class:"f",text:"Display name"}), n, h("label",{class:"f",text:"Name color"}), cs,
    h("button",{class:"btn small", style:{marginTop:"16px"}, onclick:async () => { const v = n.value.trim(); if (v.length < 2){ toast("Name needs at least 2 characters"); return; }
      try{ await changeNick(v, {patch:{color}}); toast("Saved"); }catch(e){ toast(e.message || ("Couldn't save: " + errMsg(e))); } }}, "Save changes"),
    h("label",{class:"f",text:"Your user ID"}), h("div",{class:"li"}, h("span",{class:"nm",style:{fontFamily:"monospace",fontSize:"12px"},text:S.uid}), h("button",{class:"btn small ghost",onclick:() => copy(S.uid,"ID copied")},"Copy")),
    accountSafetyEl());
}
function paneProfile(p){
  const pr = profile(S.uid);
  { const row = badgeRow(S.uid); p.append(h("div",{class:"preview-card bdset"}, h("div",{style:{flex:"1"}}, h("b",{text:"Badges"}), h("div",{class:"note",style:{margin:0},text: badgesOf(S.uid).length + " collected · pin your favorites to show them on your profile"})), row, h("button",{class:"btn small", onclick:() => { closeTopModal(); badgeDirectory(S.uid); }}, "Manage badges"))); }
  const bio = h("textarea",{class:"inp", maxlength:"190", placeholder:"Tell people a bit about yourself"}); bio.value = pr.bio || "";
  const cst = h("input",{class:"inp", maxlength:"60", placeholder:"e.g. 📚 studying for finals", value:pr.customStatus || ""});
  const st = h("div",{class:"seg"}, STATUSES.map(s => h("button",{class: (pr.status || "online") === s.id ? "on" : "", title:s.d, onclick:async () => { await setMyProfile({status:s.id}).catch(()=>{}); S.sentInvisible = false; heartbeat(); refreshOpenPane(); }}, s.name)));
  p.append(h("label",{class:"f",text:"Status"}), st, h("label",{class:"f",text:"Custom status"}), cst, h("label",{class:"f",text:"About me"}), bio,
    h("button",{class:"btn small", style:{marginTop:"14px"}, onclick:async () => { try{ await setMyProfile({bio:bio.value.trim().slice(0,190), customStatus:cst.value.trim().slice(0,60)}); toast("Profile saved"); }catch(e){} }}, "Save profile"));
  // name effect
  const fxOk = hasPerk(S.uid, "name_fx");
  p.append(h("label",{class:"f"}, "Name effect ", fxOk ? null : ic("lock","sm")));
  const cur = pr.nameFx || (isOwner() ? "yinyang" : "none");
  p.append(h("div",{class:"seg wrap"}, [{id:"none",name:"None"}, ...NAME_FX.filter(x => !x.own || isOwner())].map(fx => { const ok = fx.own ? isOwner() : fx.ex ? hasPerk(S.uid, "fx_exclusive") : fxOk;
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
  pushPane(p);
  const perm = "Notification" in window ? Notification.permission : "unsupported";
  p.append(h("label",{class:"f",text:"While CampusCord is open"}),
    perm === "granted" ? h("p",{class:"note",style:{marginTop:0},text:"Allowed in this browser ✓"}) :
    perm === "unsupported" ? h("p",{class:"note",style:{marginTop:0},text:"This browser doesn't support notifications."}) :
    h("button",{class:"btn small", onclick:() => Notification.requestPermission().then(refreshOpenPane)}, "Allow notifications"),
    h("label",{class:"f",text:"Notify me about"}),
    h("div",{class:"seg"}, [["all","All messages"],["mentions","Mentions & DMs"],["none","Nothing"]].map(([id, n]) => h("button",{class: prefs.desktop === id ? "on" : "", onclick:() => { prefs.desktop = id; savePrefs(); refreshOpenPane(); }}, n))),
    toggleRow("Sounds", "Play a ping for new notifications", prefs.sound, v => { prefs.sound = v; savePrefs(); if (v) ping(); }),
    h("p",{class:"note",text:"Setting your status to Do Not Disturb mutes everything."}));
}
function paneShortcuts(p){
  const rows = [["Enter","Send message"],["Shift + Enter","New line"],["↑ (empty box)","Edit your last message"],["Esc","Cancel reply / close popups"],["Ctrl/⌘ + K","Jump to a room or person"],["Alt + ↑ / ↓","Previous / next room"],["Right-click","Menus for messages, rooms and people"],["Shift + click 🗑️","Delete without confirming"],["@name","Mention someone"],["**bold**  *italic*  __underline__  ~~strike~~",""],["`code`   ```code block```","Code"],["||spoiler||","Hidden until clicked"],["> quote","Block quote"]];
  p.append(h("div",{class:"list"}, rows.map(r => h("div",{class:"li"}, h("span",{class:"nm",style:{fontFamily:"monospace"},text:r[0]}), h("span",{class:"s",text:r[1]})))));
  p.append(h("label",{class:"f",text:"Slash commands"}), h("div",{class:"list"}, SLASH.map(c => h("div",{class:"li"}, h("span",{class:"nm",style:{fontFamily:"monospace"},text:"/" + c.c + " " + c.a}), h("span",{class:"s",text:c.d})))));
}
function paneAbout(p){
  p.append(h("div",{class:"preview-card",style:{display:"flex",gap:"14px",alignItems:"center",marginBottom:"16px"}},
    h("img",{src:"icons/icon-192.png", style:{width:"56px",height:"56px",borderRadius:"14px"}}),
    h("div",{style:{flex:"1"}}, h("b",{text:"CampusCord desktop app"}), h("div",{class:"note",style:{margin:"2px 0 0"},text: isInstalled() ? "Installed ✓ — it updates itself." : "Get CampusCord in its own window, in your Dock."})),
    isInstalled() ? null : h("button",{class:"btn small", onclick:() => installApp()}, ic("arrowdown"), " Install app")));
  p.append(h("p",{class:"note",style:{fontSize:"14px"}}, "CampusCord version ", h("b",{text:APP_VERSION}), ". Live at ", h("a",{href:LIVE_URL,target:"_blank"},LIVE_URL), "."),
    h("p",{class:"note",text:"When a new version is published, a Refresh bar appears at the top of the app."}));
}

// ---------------------------------------------------------------- shop
const STRIPE_LINKS = {"sparks_1000": "https://buy.stripe.com/9B6eVd2tSaCzfH99mB4ow1I", "sparks_3000": "https://buy.stripe.com/5kQ6oH8SgcKH2Un6ap4ow1J", "sparks_7500": "https://buy.stripe.com/7sY8wPb0o4ebgLd9mB4ow1K", "sparks_15000": "https://buy.stripe.com/3cI14ngkIaCz1Qj8ix4ow1L", "sparks_40000": "https://buy.stripe.com/aFa28recAaCzgLd42h4ow1M", "plus": "https://buy.stripe.com/4gM7sL8SgeSPfH9dCR4ow1N", "plusplus": "https://buy.stripe.com/14A00jecAcKH2UndCR4ow1O", "plus_year": "https://buy.stripe.com/8x2bJ1b0o5if0MfaqF4ow1P", "plusplus_year": "https://buy.stripe.com/5kQ00jb0oeSP52veGV4ow1Q", "name_fx": "https://buy.stripe.com/cNidR9ecA7qn8eH8ix4ow1R", "themes": "https://buy.stripe.com/8x25kD2tS4eb66z0Q54ow1S", "banner": "https://buy.stripe.com/5kQ00j1pObGDcuX2Yd4ow1T", "supporter": "https://buy.stripe.com/00w28r6K826352v8ix4ow1U", "founder": "https://buy.stripe.com/eVqfZh1pOaCzeD5eGV4ow1V"};
function shopItem(id){ const base = CATALOG.find(c => c.id === id); const o = ((S.shop||{}).items||{})[id] || {}; return Object.assign({}, base, {price:o.price || base.price, link:o.link || STRIPE_LINKS[id] || "", enabled:o.enabled !== false}); }
function shopButton(c){
  const it = shopItem(c.id);
  const owned = hasPerk(S.uid, c.id);
  const pend = pendingOrder(c.id);
  const until = (((S.perks[S.uid]||{}).items||{})[c.id]||{}).until;
  if (owned) return h("div",{class:"owned"}, ic("check"), isOwner() ? " Included — you're the admin" : " Active" + (until ? " until " + new Date(until).toLocaleDateString() : ""));
  if (pend) return h("div",{class:"pending"}, ic("hourglass"), " Checking your payment… it's added automatically a few minutes after you pay.");
  if (!it.link) return h("button",{class:"btn buy",disabled:true},"Coming soon");
  return h("button",{class:"btn buy", onclick:() => buy(c.id)}, c.tier ? "Get " + c.name : "Buy");
}
function openShop(tab){ openChat("shop", tab || "featured"); shopFireworks(); }
function drawRanks(m, draw){
  const close = () => {};
  m.innerHTML = "";
      const r = rankOf(S.uid);
      m.append(h("button",{class:"ib close",title:"Close (Esc)",onclick:close}, ic("x")),
        h("div",{class:"shophero"},
          h("div",{class:"shg"}, ic("sparkles")),
          h("div",null, h("h2",{text:"Campus+ Shop"}), h("p",{text:"Ranks, animated names and themes. Every purchase supports the server."})),
          h("div",{class:"myrank"}, h("span",{text:"Your rank"}), isRealOwner() ? chip("admin",null,"OWNER") : isCoOwnerUid(S.uid) ? chip("admin coowner",null,"CO-OWNER") : r ? roleTags(S.uid).slice(-1)[0] : h("span",{class:"tag none",text:"MEMBER"}))));
      const tiers = h("div",{class:"tiers"});
      CATALOG.filter(c => c.tier).forEach(c => {
        const it = shopItem(c.id); if (!it.enabled && !isOwner()) return;
        tiers.appendChild(h("div",{class:"tier t" + c.tier},
          c.tier === 2 ? h("div",{class:"ribbon",text:"BEST VALUE"}) : null,
          h("div",{class:"th"}, c.tier === 2 ? chip("pp","zap","PLUS+") : chip("plus","sparkles","PLUS")),
          h("div",{class:"tn",text:c.name}), h("div",{class:"td",text:c.desc}),
          h("div",{class:"tp"}, h("b",{text:it.price.split("/")[0].trim()}), it.price.includes("/") ? h("span",{text:" / " + it.price.split("/")[1].trim()}) : null),
          h("div",{class:"tnote",text:"One-time payment · no auto-renew"}),
          h("ul",{class:"feat"}, c.list.map(x => h("li",null, ic("check"), h("span",{text:x})))),
          shopButton(c),
          (() => { const y = CATALOG.find(x => x.perk === c.id); const yi = y && shopItem(y.id); return yi && yi.enabled && yi.link ? h("button",{class:"btn ghost small yearbtn", onclick:() => buy(y.id)}, "Or 1 year for " + yi.price) : null; })()));
      });
      m.appendChild(tiers);
      // name effect preview
      const prev = h("div",{class:"fxrow"});
      NAME_FX.filter(x => !x.own || isOwner()).forEach(fx => { const ok = fx.own ? isOwner() : hasPerk(S.uid, fx.ex ? "fx_exclusive" : "name_fx");
        prev.appendChild(h("button",{class:"fxpv" + ((profile(S.uid).nameFx || (isOwner() ? "yinyang" : "")) === fx.id ? " on" : ""), title: ok ? "Use " + fx.name : (fx.ex ? "Campus++ only" : "Unlock with Animated Name or Campus+"),
          onclick:() => { if (!ok){ toast(fx.ex ? fx.name + " is a Campus++ exclusive" : "Unlock animated names first"); return; } setMyProfile({nameFx:fx.id}).then(() => { toast(fx.name + " equipped"); draw(); }).catch(()=>{}); }},
          h("span",{class:"fx fx-" + fx.id, text:nickOf(S.uid)}), h("small",null, ok ? null : ic("lock","sm"), " " + fx.name + (fx.ex ? " ++" : "")))); });
      m.append(h("h3",{class:"sh3",text:"Preview your name"}), prev);
      const grid = h("div",{class:"shop"});
      CATALOG.filter(c => !c.tier && !c.coins).forEach(c => { const it = shopItem(c.id); if (!it.enabled && !isOwner()) return;
        grid.appendChild(h("div",{class:"item"}, h("div",{class:"ii"}, ic(c.icon)), h("div",{class:"in",text:c.name}), h("div",{class:"id",text:c.desc}), h("div",{class:"ip",text:it.price}), shopButton(c))); });
      m.append(h("h3",{class:"sh3",text:"Individual perks"}), grid);
      if (S.myOrders.length){
        m.append(h("h3",{class:"sh3",text:"My purchases"}), h("div",{class:"list"}, [...S.myOrders].sort((a,b) => b.ts - a.ts).map(o => h("div",{class:"li"},
          ic((CATALOG.find(c => c.id === o.item)||{icon:"receipt"}).icon), h("span",{class:"nm",text:(CATALOG.find(c => c.id === o.item)||{name:o.item}).name}), h("span",{class:"s",text:new Date(o.ts).toLocaleDateString()}),
          h("span",{class:"s st-" + o.status,text: o.status === "approved" ? "Active" : o.status === "rejected" ? "Not approved" : "Pending"})))));
      }
      m.append(h("p",{class:"note shopnote"}, ic("lock","sm"), " Checkout is handled securely by Stripe. Perks are cosmetic. After you pay, your perk turns on automatically — usually within 5–15 minutes."));

  const sp = sparkPacksEl(); if (sp) m.append(h("h3",{class:"sh3",text:"Spark packs"}), h("p",{class:"note",style:{padding:"0 28px",marginTop:"-4px"},text:"Sparks are bought with real money and spent on anything in the Shop."}), sp);
}
// A checkout counts as "in progress" for 30 minutes; after that you can try again (unpaid checkouts just expire).
function pendingOrder(id){ return S.myOrders.find(o => o.item === id && o.status === "pending" && Date.now() - (o.ts || 0) < 30 * 60000); }
function sparkPacksEl(){
  const packs = CATALOG.filter(c => c.coins && (shopItem(c.id).enabled || isOwner())); if (!packs.length) return null;
  const grid = h("div",{class:"shop spacks"});
  packs.forEach((c, i) => { const it = shopItem(c.id); const pend = pendingOrder(c.id);
    grid.appendChild(h("div",{class:"item spackitem sp" + i}, i === packs.length - 1 ? h("span",{class:"ichip best",text:"BEST VALUE"}) : i === 2 ? h("span",{class:"ichip pop",text:"POPULAR"}) : null,
      h("div",{class:"spkart"}, Array.from({length:Math.min(3, i + 1)}, (_, k) => h("span",{class:"spk3 k" + k}, ic("spark"))), i >= 3 ? h("span",{class:"spkx",text:"×" + (i === 3 ? 2 : 5)}) : null),
      h("div",{class:"in",text:c.name}), h("div",{class:"id",text:c.desc}), h("div",{class:"ip",text:it.price}),
      pend ? h("div",{class:"pending"}, ic("hourglass"), " Payment pending") : !it.link ? h("button",{class:"btn buy",disabled:true}, isOwner() ? "Add a Stripe link in Admin → Shop" : "Coming soon") : h("button",{class:"btn buy", onclick:() => buy(c.id)}, "Buy for " + it.price))); });
  return grid;
}
function openSparks(){
  modal((m, close) => {
    m.append(h("button",{class:"ib close",title:"Close (Esc)",onclick:close}, ic("x")),
      h("div",{class:"sphead"}, h("div",{class:"spbig"}, ic("spark")), h("h2",{text:"Get Sparks"}),
        h("p",{class:"note",style:{margin:0}}, "You have ", sparkPill(sparks(S.uid)), ". Spend Sparks on decorations, effects, banners and nameplates.")));
    const sp = sparkPacksEl(); m.append(sp || h("p",{class:"note",style:{textAlign:"center",padding:"20px"},text:"Spark packs aren't on sale yet — check back soon."}));
    m.append(h("p",{class:"note shopnote"}, ic("lock","sm"), " Checkout is handled securely by Stripe. After you pay, your Sparks are added automatically — usually within 5–15 minutes."));
  }, "sparksmodal");
}
async function buy(itemId){
  const it = shopItem(itemId); if (!it.link) return;
  const orderId = "cc_" + rid();
  // Open Stripe right away (before any await) so Safari/Chrome don't block it as a pop-up.
  const url = it.link + (it.link.includes("?") ? "&" : "?") + "client_reference_id=" + encodeURIComponent(orderId);
  const w = window.open(url, "_blank"); if (w){ try{ w.opener = null; }catch(e){} }
  try{ await setDoc(doc(db, "orders", orderId), {uid:S.uid, nick:nickOf(S.uid), item:itemId, price:it.price, ts:Date.now(), status:"pending"}); }
  catch(e){ toast("Couldn't record your order: " + errMsg(e) + " — tell the admin your order ID " + orderId); return; }
  if (!w) location.href = url; // pop-up blocked: go to checkout in this tab instead
  toast("Opening Stripe checkout… it's added automatically a few minutes after you pay.");
}
async function cancelOrder(o){ try{ await deleteDoc(doc(db, "orders", o.id)); }catch(e){ toast("Couldn't cancel: " + errMsg(e)); } }
function handleReturnFromCheckout(){ if (location.hash === "#thanks"){ history.replaceState(null, "", location.pathname); setTimeout(() => toast("Thanks for your purchase! 💜 It'll show up automatically in a few minutes."), 800); } }

// ---------------------------------------------------------------- admin
function openAdmin(start){
  bigModal([
    {header:(S.config && S.config.serverName) || "CampusCord"},
    {id:"overview", label:"Overview", icon:"grid", render:adminOverview, hidden:!isOwner()},
    {id:"rooms", label:"Rooms", icon:"hash", render:adminRooms},
    {id:"members", label:"Members & roles", icon:"users", render:adminMembers, hidden:!isOwner()},
    {id:"agreements", label:"Agreements", icon:"info", render:adminAgreements, hidden:!isOwner()},
    {header:"Monetization", hidden:!isOwner()},
    {id:"shop", label:"Shop & Stripe", icon:"bag", render:adminShop, hidden:!isRealOwner()},
    {id:"appeals", icon:"alert", label:"Ban appeals" + (openAppeals().length ? " (" + openAppeals().length + ")" : ""), render:adminAppeals, hidden:!isOwner()},
    {id:"orders", icon:"receipt", label:"Orders" + (S.orders.filter(o => o.status === "pending").length ? " (" + S.orders.filter(o => o.status === "pending").length + ")" : ""), render:adminOrders, hidden:!isRealOwner()},
  ], isOwner() ? (start || "overview") : "rooms");
}
async function downloadBackup(btn, st){
  const old = btn.innerHTML; btn.disabled = true;
  const step = t => { btn.textContent = t; };
  try{
    const out = {app:"CampusCord", version:APP_VERSION, exportedAt:new Date().toISOString(), exportedBy:S.uid, collections:{}};
    const grab = async (path, q) => { const snap = await getDocs(q || collection(db, ...path.split("/"))); return Object.fromEntries(snap.docs.map(d => [d.id, d.data()])); };
    step("Saving settings…"); out.config = {main:S.config || null, shop:S.shop || null};
    for (const c of ["members", "profiles", "wallet", "perks", "orders"]){ step("Saving " + c + "…"); try{ out.collections[c] = await grab(c); }catch(e){ out.collections[c] = {error:String(e.message || e)}; } }
    out.rooms = {}; let n = 0;
    for (const r of S.allRooms){ step("Saving #" + r.name + "…");
      const room = {info:Object.assign({}, r), msgs:{}, reacts:{}};
      try{ room.msgs = await grab("rooms/" + r.id + "/msgs", query(collection(db, "rooms", r.id, "msgs"), orderBy("ts", "asc"))); n += Object.keys(room.msgs).length; }catch(e){ room.msgs = {error:String(e.message || e)}; }
      try{ room.reacts = await grab("rooms/" + r.id + "/reacts"); }catch(e){}
      out.rooms[r.id] = room; }
    out.myDMs = {};
    for (const d of S.dms){ step("Saving your DMs…"); try{ out.myDMs[d.id] = {info:d, msgs:await grab("dms/" + d.id + "/msgs", query(collection(db, "dms", d.id, "msgs"), orderBy("ts", "asc")))}; }catch(e){} }
    const blob = new Blob([JSON.stringify(out, null, 1)], {type:"application/json"});
    const a = h("a",{href:URL.createObjectURL(blob), download:"campuscord-backup-" + new Date().toISOString().slice(0, 10) + ".json"}); document.body.appendChild(a); a.click(); a.remove();
    prefs.lastBackup = Date.now(); savePrefs(); if (st) st.textContent = "Last downloaded today.";
    toast("Backup saved — " + n.toLocaleString() + " messages in " + S.allRooms.length + " rooms");
  }catch(e){ toast("Backup failed: " + errMsg(e)); }
  finally{ btn.disabled = false; btn.innerHTML = old; }
}
function adminOverview(p){
  const code = h("input",{class:"inp", value:S.invite || "", maxlength:"24"});
  p.append(h("label",{class:"f",text:"Invite code"}), h("div",{class:"row"}, code,
      h("button",{class:"btn small", onclick:async () => { const v = code.value.trim(); if (v.length < 3){ toast("At least 3 characters"); return; } try{ await setDoc(doc(db, "secret/invite"), {code:v}); toast("Invite code updated"); }catch(e){ toast("Couldn't save: " + errMsg(e)); } }}, "Save"),
      h("button",{class:"btn small ghost", onclick:() => copy("Join me on CampusCord! " + LIVE_URL + "  Invite code: " + code.value, "Invite message copied")}, "Copy invite")),
    h("p",{class:"note",text:"Friends type this the first time they join. Changing it doesn't kick anyone."}));
  if (isOwner()){ let on = !(S.config && S.config.spamFilter === false);
    const sw = h("button",{class:"sw" + (on ? " on" : ""), onclick:async () => { on = !on; sw.classList.toggle("on", on); try{ await updateDoc(doc(db, "config/main"), {spamFilter:on}); toast(on ? "Spam filter on" : "Spam filter off"); }catch(e){ toast("Couldn't save: " + errMsg(e)); } }});
    p.append(h("div",{class:"toggle",style:{marginTop:"14px"}}, h("div",{class:"tl"}, h("b",{},"Spam filter"), h("span",{text:"Slows down people who flood the chat, repeat the same message, mass-@mention or post walls of links. Repeat offenders get paused for 30 seconds. Doesn't apply to you."})), sw)); }
  if (isOwner()){ const t = (S.config && S.config.turn) || {};
    // Paste anything Metered shows (the iceServers code or just the username/password): we pick out what's needed.
    const box = h("textarea",{class:"inp", rows:"4", placeholder:"Paste the TURN server code from your Metered dashboard here"});
    const parseTurn = txt => { const urls = [...new Set((txt.match(/turns?:[^\s"',\]\}]+/g) || []))];
      const user = (txt.match(/username["']?\s*[:=]\s*["']([^"']+)["']/) || [])[1], cred = (txt.match(/credential["']?\s*[:=]\s*["']([^"']+)["']/) || [])[1];
      return urls.length && user && cred ? {urls:urls.join(", "), username:user, credential:cred} : null; };
    p.append(h("div",{class:"preview-card",style:{marginTop:"14px"}}, h("b",{text:"Voice relay " + (t.urls ? "✅ set up" : "⚠️ not set up")}),
      h("div",{class:"note",style:{margin:"2px 0 8px"}}, t.urls ? "Voice works on school Wi-Fi. To change it, paste new code below." :
        h("span",null, "Without this, voice usually fails on school Wi-Fi. It's free: ",
          h("a",{href:"https://dashboard.metered.ca/signup?tool=turnserver", target:"_blank", rel:"noopener", text:"make a Metered account"}),
          ", open TURN Server, press \"Show ICE Servers Array\" (or the credentials), copy it all and paste it here.")),
      box,
      h("div",{class:"row",style:{marginTop:"6px",justifyContent:"flex-end"}},
        t.urls ? h("button",{class:"btn small ghost", onclick:async () => { try{ await updateDoc(doc(db, "config/main"), {turn:deleteField()}); toast("Voice relay removed"); refreshOpenPane(); }catch(e){ toast("Couldn't save: " + errMsg(e)); } }}, "Remove") : null,
        h("button",{class:"btn small", onclick:async () => { const v = parseTurn(box.value);
          if (!v){ toast("Couldn't find the TURN address, username and password in that. Copy the whole thing from Metered."); return; }
          try{ await updateDoc(doc(db, "config/main"), {turn:v}); toast("Voice relay saved! Leave and rejoin voice to use it."); box.value = ""; refreshOpenPane(); }catch(e){ toast("Couldn't save: " + errMsg(e)); } }}, "Save")))); }
  if (isRealOwner()){ const last = prefs.lastBackup; const days = last ? Math.floor((Date.now() - last) / 864e5) : null;
    const st = h("span",{class:"note",style:{margin:0},text: last ? "Last downloaded " + (days === 0 ? "today" : days === 1 ? "yesterday" : days + " days ago") + "." : "You haven't downloaded a backup yet."});
    p.append(h("div",{class:"preview-card bkcard"}, h("div",{style:{flex:"1"}}, h("b",{text:"Backups"}),
        h("div",{class:"note",style:{margin:"2px 0 0"},text:"Download every room's messages, reactions, pins, members, profiles, Sparks and purchases as one file. Other people's DMs aren't included — they're private."}), st),
      h("button",{class:"btn small", onclick:e => downloadBackup(e.currentTarget, st)}, ic("arrowdown","sm"), " Download backup"))); }
  if (isOwner()){
    const nm = h("input",{class:"inp", value:(S.config.serverName || "CampusCord"), maxlength:"32"});
    const ic = h("input",{class:"inp", value:(S.config.serverIcon || "CC"), maxlength:"4", style:{width:"90px"}});
    p.append(h("label",{class:"f",text:"Server name & icon"}), h("div",{class:"row"}, nm, ic,
      h("button",{class:"btn small", onclick:async () => { try{ await updateDoc(doc(db, "config/main"), {serverName:nm.value.trim().slice(0,32) || "CampusCord", serverIcon:ic.value.trim().slice(0,4) || "CC"}); toast("Saved"); }catch(e){ toast("Couldn't save: " + errMsg(e)); } }}, "Save")),
      h("p",{class:"note",text:"The icon can be 1–4 letters or an emoji."}));
  }
  if (isRealOwner()){
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
  // Delete everything in big batches (up to 400 at a time) until the room is empty.
  const wipe = async sub => { let n = 0;
    for (;;){ const snap = await getDocs(query(collection(db, "rooms", roomId, sub), limit(400)));
      if (snap.empty) return n;
      const b = writeBatch(db); snap.docs.forEach(d => b.delete(d.ref)); await b.commit(); n += snap.size;
      if (sub === "msgs") toast("Clearing… " + n + " messages deleted"); } };
  try{ toast("Clearing…"); const n = await wipe("msgs"); await wipe("reacts");
    toast("Room cleared (" + n + " messages deleted)"); }
  catch(e){ toast("Couldn't clear: " + errMsg(e)); }
}
function adminMembers(p){
  const list = h("div",{class:"list"});
  Object.keys(S.members).filter(u => !isBanned(u)).sort((a,b) => nickOf(a).localeCompare(nickOf(b))).forEach(u => {
    const perks = Object.keys(((S.perks[u]||{}).items)||{}).filter(k => perkActive(S.perks[u].items[k]));
    const bl = badgesOf(u); const welcomed = (S.config.welcomed || []).includes(u);
    list.appendChild(h("div",{class:"li amem"}, avatar(u, "sm", true),
      h("div",{class:"nm"}, h("div",null, paintName(h("b",{text:nickOf(u)}), u), " ", ...roleTags(u, true)),
        h("div",{class:"amsub"}, h("span",{class:"ambd", title:bl.map(x => badgeTitle(x.b, x.st)).join(", ")}, ...bl.slice(0, 8).map(x => badgeEl(x.b, x.st, "sm")), bl.length > 8 ? h("small",{text:"+" + (bl.length - 8)}) : null),
          isOwnerUid(u) ? null : sparkPill(sparks(u)), perks.length ? h("span",{class:"s",text:"✦ " + perks.join(", ")}) : null,
          !isOwnerUid(u) ? h("span",{class:"s",text: welcomed ? "🎁 welcomed" : "🎁 gift pending"}) : null,
          h("span",{class:"s",title: S.members[u].rulesAt ? "Signed " + fmtDay(S.members[u].rulesAt) + (S.members[u].rulesSig ? ": \u201c" + S.members[u].rulesSig + "\u201d" : "") : "", text: (S.members[u].rulesOk || 0) >= RULES_V ? "📜 signed " + fmtDay(S.members[u].rulesAt) : "📜 hasn't signed yet"}),
          nameFlagLabel(u) ? h("span",{class:"s",style:{color: nameLocked(u) ? "#f0565c" : ""},text:nameFlagLabel(u)}) : null)),
      isOwner() && u !== S.uid ? h("button",{class:"rolepill dev" + (isDev(u) ? " on" : ""), onclick:() => devModal(u)}, isDev(u) ? (devUntil(u) ? "⏱ DEV" : "✓ DEV") : "+ DEV") : null,
      isOwner() && u !== S.uid ? h("button",{class:"rolepill design" + (isDesigner(u) ? " on" : ""), onclick:() => setDesigner(u, !isDesigner(u))}, isDesigner(u) ? "✓ DESIGN" : "+ DESIGN") : null,
      isOwner() && u !== S.uid ? h("button",{class:"btn small ghost", onclick:() => grantModal(u)}, "Perks") : null,
      u !== S.uid && !isOwnerUid(u) && (isOwner() || !isDev(u)) ? h("button",{class:"btn small danger", onclick:() => kickWithReason(u)}, "Kick") : null));
  });
  p.append(h("label",{class:"f",text:"Members"}), list);
  const banned = S.config.banned || [], names = S.config.bannedNames || {};
  p.append(h("label",{class:"f",text:"Kicked (" + banned.length + ")"}));
  if (!banned.length) p.append(h("p",{class:"note",style:{marginTop:0},text:"Nobody."}));
  p.append(h("div",{class:"list"}, banned.map(u => h("div",{class:"li"}, h("span",{class:"nm"}, h("b",{text:names[u] || "Kicked member"}), banReasonOf(u) ? h("span",{class:"s",text:"  · " + banReasonOf(u).reason}) : null),
    h("button",{class:"btn small ghost", onclick:() => decideAppeal(Object.assign({id:u, nick:names[u]}, (S.appeals.find(a => a.id === u) || {}), {dev:(S.appeals.find(a => a.id === u) || {}).dev}), true)}, "Unban")))));
}
function grantModal(uid){
  modal((m, close) => {
    m.append(h("h3",{text:"Perks for " + nickOf(uid)}), h("p",{class:"note",text:"Grant or remove perks by hand (gifts, giveaways, refunds)."}));
    const list = h("div",{class:"list"});
    CATALOG.filter(c => !c.coins && !c.perk).forEach(c => { const items = (S.perks[uid]||{}).items || {}; const on = perkActive(items[c.id]);
      list.appendChild(h("div",{class:"li"}, ic(c.icon), h("span",{class:"nm",text:c.name + (on && items[c.id].until ? " (until " + new Date(items[c.id].until).toLocaleDateString() + ")" : "")}),
        on ? h("button",{class:"btn small danger", onclick:async () => { await revokePerk(uid, c.id); close(); }}, "Remove") : h("button",{class:"btn small", onclick:async () => { await grantPerk(uid, c.id); close(); }}, "Grant"))); });
    const sb = h("div",{class:"spbadges"}, SPECIAL_BADGES.map(b => { const on = specialOf(uid).includes(b.id); const el = badgeEl(BADGES.find(x => x.id === b.id), {}, "sm");
      return h("button",{class:"spb" + (on ? " on" : ""), title:(on ? "Remove " : "Give ") + b.name, onclick:async () => { await setSpecial(uid, b.id, !on); close(); }}, el, h("small",{text:b.name})); }));
    m.append(list, h("label",{class:"f",text:"Special badges (click to give or remove)"}), sb, h("label",{class:"f",text:"Give Sparks (" + sparks(uid).toLocaleString() + " now)"}),
      h("div",{class:"row"}, [100, 500, 1000, 5000].map(n => h("button",{class:"btn small ghost", onclick:async () => { await giveSparks(uid, n); close(); }}, "+" + n.toLocaleString()))),
      h("div",{class:"foot"}, h("button",{class:"btn ghost",onclick:close},"Close")));
  });
}
async function grantPerk(uid, item){
  const c = CATALOG.find(x => x.id === item) || {};
  if (c.coins){ await giveSparks(uid, c.coins); return; }
  if (c.perk) item = c.perk;
  const prev = (((S.perks[uid]||{}).items||{})[item]) || {};
  const entry = {since:Date.now()};
  if (c.months){ const startAt = Math.max(Date.now(), prev.until || 0); entry.until = startAt + c.months * 31 * 864e5; }
  try{ await setDoc(doc(db, "perks", uid), {items:{[item]:entry}}, {merge:true}); toast("✦ " + (c.name || item) + " granted to " + nickOf(uid)); }
  catch(e){ toast("Couldn't grant: " + errMsg(e)); throw e; }
}
async function revokePerk(uid, item){ try{ await updateDoc(doc(db, "perks", uid), {["items." + item]:deleteField()}); toast("Removed"); }catch(e){ toast("Couldn't remove: " + errMsg(e)); } }
function adminShop(p){
  p.append(h("div",{class:"preview-card"},
    h("b",{text:"Payments are set up ✓"}),
    h("ul",{class:"steps",style:{marginTop:"8px",fontSize:"13px"}},
      h("li",null, "Every item below already has a live Stripe payment link (one-time payments, no auto-renew). Turn an item off to hide it from the shop."),
      h("li",null, "When someone pays, the “Deliver purchases” job checks Stripe every few minutes and hands out their Sparks or perk automatically. You don't have to approve anything."),
      h("li",null, "See payments in your ", h("a",{href:"https://dashboard.stripe.com/payments",target:"_blank",rel:"noopener"},"Stripe dashboard"), ". Refunds are done there too."),
      h("li",null, "Only change a link or price here if you made a new one in Stripe."))));
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
async function setDesigner(uid, on){
  try{ await updateDoc(doc(db, "config/main"), {designers: on ? arrayUnion(uid) : arrayRemove(uid)}); toast(on ? nickOf(uid) + " is now a Designer ✏️" : nickOf(uid) + " is no longer a designer"); refreshOpenPane(); }
  catch(e){ toast("Couldn't update: " + errMsg(e)); }
}
async function setCoOwner(uid, on){
  try{ await updateDoc(doc(db, "config/main"), {coOwners: on ? arrayUnion(uid) : arrayRemove(uid)});
    toast(on ? nickOf(uid) + " is now a Co-owner 👑" : nickOf(uid) + " is no longer a Co-owner"); refreshOpenPane(); need("members", "side", "msgs"); }
  catch(e){ toast("Couldn't update: " + errMsg(e)); }
}
function coOwnerConfirm(uid){
  modal((m, close) => m.append(h("h3",{text:"Make " + nickOf(uid) + " a Co-owner?"}),
    h("p",{class:"note",text:"They'll be able to do almost everything you can: members, bans, strikes, rooms, giving Sparks and items, devs and Head Devs, agreements, the Dev panel and the invite code."}),
    h("p",{class:"note",text:"Only you keep: Stripe and real-money orders, the Sparks price list, and choosing co-owners. They can't ban, kick, time out, warn or strike you."}),
    h("div",{class:"row",style:{justifyContent:"flex-end"}}, h("button",{class:"btn ghost",onclick:close},"Cancel"),
      h("button",{class:"btn",onclick:() => { close(); setCoOwner(uid, true); }},"Make Co-owner"))));
}
// Shown once to a new co-owner.
function maybeCoOwnerPopup(){
  if (!isCoOwnerUid(S.uid) || S.routed !== "app" || window.__ccNoPop) return;
  const key = "coOwnerSeen_" + S.uid; try{ if (localStorage.getItem(key)) return; }catch(e){ return; }
  if ($("layer").children.length){ setTimeout(maybeCoOwnerPopup, 5000); return; }
  try{ localStorage.setItem(key, "1"); }catch(e){}
  modal((m, close) => m.append(h("div",{class:"hdpop"},
    h("div",{class:"hdcrown",text:"👑"}), h("h2",{text:"You are Co-owner!"}),
    h("p",{class:"note",text:"You help run CampusCord. You can now:"}),
    h("ul",{class:"hdlist"},
      h("li",null, "🛡️ ", h("b",{text:"Moderate anyone"}), ": kick, ban, time out, warn, strikes and suspensions"),
      h("li",null, "🏠 ", h("b",{text:"Run the server"}), ": rooms, private rooms, invite code, appeals"),
      h("li",null, "✨ ", h("b",{text:"Give Sparks, items and badges"})),
      h("li",null, "💻 ", h("b",{text:"Make devs and Head Devs"}), ", approve changes in the Dev panel"),
      h("li",null, "📜 ", h("b",{text:"Agreements"}), ": see signatures and ask people to fix them")),
    h("button",{class:"btn",onclick:close},"Let's go"))), "hdmodal");
}
async function setHeadDev(uid, on){
  try{ await updateDoc(doc(db, "config/main"), on ? {headDevs:arrayUnion(uid), admins:arrayUnion(uid), ["devUntil." + uid]:deleteField()} : {headDevs:arrayRemove(uid)});
    toast(on ? nickOf(uid) + " is now Head Dev 👑" : nickOf(uid) + " is a regular developer again"); refreshOpenPane(); need("members", "side", "msgs"); }
  catch(e){ toast("Couldn't update: " + errMsg(e)); }
}
// Shown once to a new head developer.
function maybeHeadDevPopup(){
  if (!isHeadDev(S.uid) || S.routed !== "app" || window.__ccNoPop) return;
  const key = "headDevSeen_" + S.uid; try{ if (localStorage.getItem(key)) return; }catch(e){ return; }
  if ($("layer").children.length){ setTimeout(maybeHeadDevPopup, 5000); return; }
  try{ localStorage.setItem(key, "1"); }catch(e){}
  modal((m, close) => m.append(h("div",{class:"hdpop"},
    h("div",{class:"hdcrown",text:"👑"}), h("h2",{text:"You are Head Dev!"}),
    h("p",{class:"note",text:"You lead CampusCord's developers. Here's what you can do now:"}),
    h("ul",{class:"hdlist"},
      h("li",null, "✅ ", h("b",{text:"Approve changes"}), " from helpers in the </> Dev panel"),
      h("li",null, "💻 ", h("b",{text:"Make and remove developers"})),
      h("li",null, "🛡️ ", h("b",{text:"Moderate developers"}), ": time out, warn or kick them"),
      h("li",null, "📣 ", h("b",{text:"Post in announcements"})),
      h("li",null, "🏷️ ", h("b",{text:"HEAD DEV"}), " tag next to your name")),
    h("button",{class:"btn",onclick:close},"Let's go"))), "hdmodal");
}
async function setDev(uid, on, ms){
  try{ const until = on && ms ? Date.now() + ms : 0;
    await updateDoc(doc(db, "config/main"), {admins: on ? arrayUnion(uid) : arrayRemove(uid), ["devUntil." + uid]: until ? until : deleteField()});
    toast(on ? nickOf(uid) + " is now a developer 💻" + (until ? " until " + devTimeLabel(until) : "") : nickOf(uid) + " is no longer a developer"); refreshOpenPane(); need("members", "side"); }
  catch(e){ toast("Couldn't update: " + errMsg(e)); }
}
function devTimeLabel(t){ const d = new Date(t), today = new Date().toDateString() === d.toDateString();
  return (today ? "" : d.toLocaleDateString([], {weekday:"short", month:"short", day:"numeric"}) + " ") + d.toLocaleTimeString([], {hour:"numeric", minute:"2-digit"}); }
const DEV_TIMES = [{label:"1 hour", ms:36e5}, {label:"1 day", ms:864e5}, {label:"3 days", ms:3 * 864e5}, {label:"1 week", ms:7 * 864e5}, {label:"Forever", ms:0}];
function devModal(uid){
  const who = nickOf(uid);
  if (isDev(uid)) return confirmBox("Remove " + who + " as developer?", devUntil(uid) ? "Their developer access would end on its own at " + devTimeLabel(devUntil(uid)) + "." : "They'll go back to being a regular member.", "Remove", () => setDev(uid, false));
  modal((m, close) => {
    m.append(h("h3",{text:"Make " + who + " a developer"}),
      h("p",{class:"note",text:"Developers get the </> Dev panel, can manage rooms, delete and pin messages, and kick regular members. Pick how long. It turns off by itself when the time's up."}),
      h("div",{class:"devtimes"}, DEV_TIMES.map(t => h("button",{class:"btn" + (t.ms ? " ghost" : ""), onclick:() => { close(); setDev(uid, true, t.ms); }}, t.ms ? "For " + t.label : "Forever"))),
      h("div",{class:"foot"}, h("button",{class:"btn ghost",onclick:close},"Cancel")));
  });
}
// ---- real-name strikes
// The owner flags a name that isn't someone's real name. That person's account locks until they change it, and they
// get 3 days. Not changed in time → removed from the server (they can rejoin with the code). After 3 strikes, the next
// flag bans them permanently.
const NAME_DAYS = 3, NAME_STRIKES = 3;
const nameFlag = uid => ((S.config && S.config.nameFlags) || {})[uid] || null;
function nameLocked(uid){ const f = nameFlag(uid), m = member(uid); return !!(f && f.active && m && f.at > (m.nickAt || 0)); }
function flagName(uid){
  const f = nameFlag(uid) || {count:0}; const n = (f.count || 0) + 1; const who = nickOf(uid);
  if (f.count >= NAME_STRIKES){
    confirmBox("Ban " + who + " for good?", who + " already used all " + NAME_STRIKES + " chances to use their real name. This bans them permanently.", "Ban permanently", async () => {
      try{ await updateDoc(doc(db, "config/main"), {["nameFlags." + uid]:Object.assign({}, f, {active:false, bannedAt:Date.now()})}); await kick(uid, "Didn't change to your real name after 3 strikes"); toast(who + " was banned permanently"); }catch(e){ toast("Couldn't ban: " + errMsg(e)); } });
    return;
  }
  confirmBox("Not a real name: strike " + n + " of " + NAME_STRIKES, "“" + who + "” will be locked out until they change to their real name. If they don't within " + NAME_DAYS + " days they're removed from the server." + (n === NAME_STRIKES ? " This is their last chance — next time they're banned for good." : ""), "Send strike " + n, async () => {
    try{ await updateDoc(doc(db, "config/main"), {["nameFlags." + uid]:{count:n, at:Date.now(), active:true, old:who}}); toast("Strike " + n + " sent to " + who); refreshOpenPane(); }catch(e){ toast("Couldn't flag: " + errMsg(e)); } }, true);
}
async function clearNameFlag(uid){ try{ await updateDoc(doc(db, "config/main"), {["nameFlags." + uid + ".active"]:false}); toast("Name flag removed"); refreshOpenPane(); }catch(e){ toast(errMsg(e)); } }
function nameFlagLabel(uid){ const f = nameFlag(uid); if (!f || !f.count) return null;
  if (nameLocked(uid)){ const left = f.at + NAME_DAYS * 864e5 - Date.now(); return "⚠ Name flagged · strike " + f.count + "/" + NAME_STRIKES + " · " + (left > 864e5 ? Math.ceil(left / 864e5) + "d" : Math.max(1, Math.ceil(left / 36e5)) + "h") + " left"; }
  return "Name strikes: " + f.count + "/" + NAME_STRIKES; }
// The lock screen a flagged person sees
function enforceNameLock(){
  const el = document.getElementById("namelock");
  if (!S.uid || isOwner() || !nameLocked(S.uid)){ if (el) el.remove(); return; }
  if (el) return;
  const f = nameFlag(S.uid); const left = f.at + NAME_DAYS * 864e5 - Date.now();
  const inp = h("input",{class:"inp", maxlength:"24", placeholder:"Your real name (e.g. Jordan Smith)"});
  const err = h("div",{class:"note",style:{color:"#f0565c",minHeight:"18px"}});
  const go = async () => { const v = cleanNick(inp.value);
    if (nameKey(v) === nameKey(f.old || nickOf(S.uid))){ err.textContent = "That's the same name — use your real name."; return; }
    try{ await changeNick(v, {force:true}); toast("Thanks! You're all set, " + v + " 👋"); }catch(e){ err.textContent = e.message || errMsg(e); } };
  inp.onkeydown = e => { if (e.key === "Enter") go(); };
  document.body.appendChild(h("div",{id:"namelock"}, h("div",{class:"nlbox"},
    h("div",{class:"nlic",text:"🪪"}), h("h2",{text:"Please use your real name"}),
    h("p",{text:"The owner flagged “" + (f.old || nickOf(S.uid)) + "” as not your real name. CampusCord is just for friends, so everyone uses their real name. Your account is paused until you change it."}),
    h("div",{class:"nlstrike"}, "Strike ", h("b",{text:f.count + " of " + NAME_STRIKES}), " · ", h("b",{text: left > 0 ? (left > 864e5 ? Math.ceil(left / 864e5) + " days" : Math.max(1, Math.ceil(left / 36e5)) + " hours") + " left" : "time's up"}), " to change it",
      f.count >= NAME_STRIKES ? h("div",{class:"nlwarn",text:"This is your last chance — another flag means a permanent ban."}) : null),
    inp, err, h("button",{class:"btn", onclick:go}, "Change my name"))));
  setTimeout(() => inp.focus(), 50);
}
const BAN_REASONS = ["Spamming", "Not using your real name", "Being mean or bullying", "Using another account to get around a ban", "Posting inappropriate stuff", "Farming Sparks with fake vouches"];
function banReasonOf(uid){ const r = (S.config && S.config.banReasons) || {}; return r[uid] || null; }
function kickWithReason(uid){
  const who = nickOf(uid);
  modal((m, close) => {
    let picked = "";
    const txt = h("textarea",{class:"inp", rows:"2", maxlength:"200", placeholder:"Or write your own reason…"});
    const chips = h("div",{class:"rchips"}, BAN_REASONS.map(r => { const b = h("button",{class:"rchip", type:"button", text:r});
      b.onclick = () => { picked = picked === r ? "" : r; chips.querySelectorAll(".rchip").forEach(x => x.classList.toggle("on", x.textContent === picked)); if (picked) txt.value = ""; }; return b; }));
    txt.oninput = () => { if (txt.value.trim()){ picked = ""; chips.querySelectorAll(".rchip").forEach(x => x.classList.remove("on")); } };
    const err = h("div",{class:"note",style:{color:"#f0565c",minHeight:"16px",margin:"4px 0 0"}});
    m.append(h("h3",{text:"Kick & ban " + who}),
      h("p",{class:"note",text:who + " gets locked out right away and sees this reason on their screen. They can ask to be unbanned."}),
      h("label",{class:"f",text:"Why?"}), chips, txt, err,
      h("div",{class:"foot"}, h("button",{class:"btn ghost",onclick:close},"Cancel"),
        h("button",{class:"btn danger", onclick:() => { const reason = (picked || txt.value.trim()).slice(0, 200);
          if (reason.length < 3){ err.textContent = "Pick a reason or write one."; return; } close(); kick(uid, reason); }}, "Kick & ban")));
  });
}
async function kick(uid, reason){
  try{ const m = member(uid) || {}; const upd = {banned:arrayUnion(uid), bannedNames:Object.assign({}, S.config.bannedNames||{}, {[uid]:nickOf(uid)})};
    if (reason){ const r = {reason:String(reason).slice(0, 200), by:nickOf(S.uid), at:Date.now()}; upd["banReasons." + uid] = r; if (m.dev) upd["banReasons." + m.dev] = r; }
    if (m.dev){ upd.bannedDevices = arrayUnion(m.dev); upd["bannedDevNames." + m.dev] = nickOf(uid); }
    if (isOwner() && isDev(uid)) upd.admins = arrayRemove(uid);
    await updateDoc(doc(db, "config/main"), upd);
    await deleteDoc(doc(db, "members", uid));
    // New invite code so they can't come back with a fresh account on another browser
    let note = "";
    if (isOwner()){ const code = Math.random().toString(36).slice(2, 8).toUpperCase(); try{ await setDoc(doc(db, "secret/invite"), {code}); S.inviteCode = code; note = " · New invite code: " + code; }catch(e){} }
    toast("Banned" + note, 9000); refreshOpenPane(); need("side", "members");
  }catch(e){ toast("Couldn't kick: " + errMsg(e)); }
}

// ---------------------------------------------------------------- install as an app
let installEvt = null;
const isInstalled = () => matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: window-controls-overlay)").matches || navigator.standalone === true;
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; need("rail"); refreshOpenPane(); });
window.addEventListener("appinstalled", () => { installEvt = null; toast("CampusCord is installed! Find it in your Dock or Applications."); need("rail"); refreshOpenPane(); });
function installApp(){
  if (installEvt){ installEvt.prompt(); installEvt.userChoice.finally(() => { installEvt = null; need("rail"); }); return; }
  modal((m, close) => {
    const safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    m.append(h("h3",{text:"Install CampusCord"}),
      isInstalled() ? h("p",{class:"note",text:"You're already using the installed app ✓"}) :
      safari ? h("ol",{class:"steps",style:{marginTop:"10px"}}, h("li",null, "In Safari's menu bar, click ", h("b",{text:"File → Add to Dock"}), "."), h("li",null, "Click ", h("b",{text:"Add"}), ". CampusCord appears in your Dock and Launchpad."))
      : h("ol",{class:"steps",style:{marginTop:"10px"}},
          h("li",null, "Open ", h("b",{text:"campus-cord.github.io"}), " in ", h("b",{text:"Chrome"}), " or ", h("b",{text:"Edge"}), "."),
          h("li",null, "Click the ", h("b",{text:"install icon"}), " at the right end of the address bar (a monitor with a down arrow), or the ⋮ menu → ", h("b",{text:"Cast, save and share → Install page as app"}), "."),
          h("li",null, "Click ", h("b",{text:"Install"}), ". It opens in its own window and shows up in your Dock and Applications folder.")),
      h("p",{class:"note",text:"The app updates itself automatically — you never need to download it again."}),
      h("div",{class:"foot"}, h("button",{class:"btn small",onclick:close},"Got it")));
  });
}

// __COSMETICS__
// __APPEALS__
// __CHANGES__
// __MOD__
// __DAILYPOLL__
// __SUBMIT__
// __LINK__
// __ACCOUNT__
// __PUSH__
// __VOUCHES__
// __FEEDBACK__
// __CAMERA__
// __VOICE__
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

const MUSIC_PRESETS = [
  { id: "jfKfPfyJRdk", title: "Lofi Hip Hop Radio", sub: "Chill beats to study/relax" },
  { id: "4xDzrJKXOOY", title: "Synthwave Radio", sub: "Retro chill & gaming beats" },
  { id: "5qap5aO4i9A", title: "Chillhop Beats", sub: "Smooth instrumental hip hop" },
  { id: "lTRiuFIWV54", title: "1 A.M Study Session", sub: "Warm lofi & ambient" }
];
const M = { vid: null, title: "", open: false };

function parseYouTubeId(raw){
  if (!raw) return null;
  const s = raw.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function playMusic(vid, title){
  if (!vid) return;
  M.vid = vid;
  M.title = title || "YouTube Track";
  ensureMusicHost();
  renderMe();
  toast("Now playing: " + M.title);
}

function stopMusic(){
  M.vid = null;
  M.title = "";
  const host = $("musicHost");
  if (host) host.innerHTML = "";
  renderMe();
}

function ensureMusicHost(){
  let host = $("musicHost");
  if (!host){
    host = h("div",{id:"musicHost", class:"mhost hidden"});
    document.body.appendChild(host);
  }
  host.innerHTML = "";
  if (M.vid){
    host.appendChild(h("iframe",{
      src: "https://www.youtube-nocookie.com/embed/" + M.vid + "?autoplay=1&loop=1&playlist=" + M.vid,
      allow: "accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture",
      title: "CampusCord Music Player"
    }));
  }
}

function musicBarEl(){
  if (!M.vid) return null;
  return h("div",{class:"vbar mbar"},
    h("div",{class:"vinfo", onclick:() => openMusicModal()},
      h("b",{class:"ok"}, ic("headphones","sm"), " Playing Music"),
      h("span",{text: M.title})),
    h("button",{class:"ib", title:"Open player", onclick:() => openMusicModal()}, ic("sparkles")),
    h("button",{class:"ib danger", title:"Stop music", onclick:() => stopMusic()}, ic("phoneoff")));
}

function openMusicModal(){
  modal((m, close) => {
    const inp = h("input",{class:"inp", placeholder:"Paste a YouTube link or video ID…", autocomplete:"off"});
    const go = () => {
      const id = parseYouTubeId(inp.value);
      if (!id) return toast("Paste a valid YouTube link first!");
      playMusic(id, "Custom YouTube Track");
      close();
    };
    inp.onkeydown = e => { if (e.key === "Enter") go(); };
    m.append(
      h("h2",{style:{marginTop:0}}, "CampusCord Music"),
      h("p",{class:"sub"}, "Pick a station or paste any YouTube song link to listen while you chat."),
      h("div",{style:{display:"flex", gap:"8px", marginBottom:"14px"}},
        inp,
        h("button",{class:"btn", onclick: go}, "Play")),
      h("label",{class:"f"}, "Built-in Stations"),
      h("div",{class:"mgrid"},
        ...MUSIC_PRESETS.map(p => h("button",{
          class: "mcard" + (M.vid === p.id ? " on" : ""),
          onclick: () => { playMusic(p.id, p.title); close(); }
        },
          h("b",{text: p.title}),
          h("span",{text: p.sub})))),
      M.vid ? h("div",{style:{marginTop:"14px", display:"flex", justifyContent:"space-between", alignItems:"center"}},
        h("span",{class:"sub", style:{margin:0}}, "Playing: " + M.title),
        h("button",{class:"btn danger small", onclick:() => { stopMusic(); close(); }}, "Stop Music")) : null
    );
  });
}
