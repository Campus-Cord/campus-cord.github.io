// ---------------------------------------------------------------- profile badges (v3.9)
// Detailed, original SVG badges. Some evolve through metal/gem tiers, like a loyalty badge.
const TIERS = {
  bronze:  {name:"Bronze",   c:["#ffd9b8","#d9844f","#7a3a17"], r:"Common"},
  silver:  {name:"Silver",   c:["#ffffff","#c3cbd3","#5f6a76"], r:"Common"},
  gold:    {name:"Gold",     c:["#fff6c2","#f6c033","#a15c00"], r:"Rare"},
  platinum:{name:"Platinum", c:["#f0fdff","#a5e4f3","#3f8197"], r:"Rare"},
  diamond: {name:"Diamond",  c:["#eaf6ff","#7cc4ff","#2357d6"], r:"Epic"},
  emerald: {name:"Emerald",  c:["#d7ffe9","#34d399","#03684a"], r:"Epic"},
  ruby:    {name:"Ruby",     c:["#ffe0e6","#fb4f72","#8f0f33"], r:"Mythic"},
  opal:    {name:"Opal",     c:["#fff0fb","#c9b8ff","#5fb7d9"], r:"Mythic"},
};
const RARITY_COLOR = {Common:"#b5bac1", Rare:"#3fb8ff", Epic:"#c084fc", Mythic:"#ffb84d"};
function grad(id, c, vertical){ return '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="' + (vertical ? 0 : 1) + '" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".5" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[2] + '"/></linearGradient></defs>'; }
const SHINE = '<path d="M5 6.5C7 3.8 11 2.6 14.2 3.6" stroke="#fff" stroke-opacity=".75" stroke-width="1.3" stroke-linecap="round" fill="none"/>';
const BADGE_ART = {
  owner: () => '<defs><linearGradient id="bo-r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#9aa1a9"/><stop offset=".55" stop-color="#e8ebee"/><stop offset="1" stop-color="#3b4047"/></linearGradient></defs>'
    + '<circle cx="12" cy="12" r="11.2" fill="url(#bo-r)"/><circle cx="12" cy="12" r="9" fill="#0b0b0c"/>'
    + '<path d="M12 3a9 9 0 0 1 0 18a4.5 4.5 0 0 1 0-9a4.5 4.5 0 0 0 0-9z" fill="#fff"/><circle cx="12" cy="7.5" r="1.5" fill="#fff"/><circle cx="12" cy="16.5" r="1.5" fill="#0b0b0c"/>'
    + '<circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".6"/>',
  dev: () => grad("bd-g", ["#a7f3d0","#10b981","#065f46"]) + '<path d="M12 1.2l9.6 5.5v10.6L12 22.8 2.4 17.3V6.7z" fill="url(#bd-g)" stroke="#064e3b" stroke-width=".8"/>'
    + '<path d="M12 2.6l8.4 4.8" stroke="#fff" stroke-opacity=".6" stroke-width="1" stroke-linecap="round"/>'
    + '<path d="M9.3 8.6 5.9 12l3.4 3.4M14.7 8.6l3.4 3.4-3.4 3.4M13 7.6l-2 8.8" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  pp: () => '<defs><linearGradient id="bp-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7ac6"/><stop offset=".35" stop-color="#ffd166"/><stop offset=".65" stop-color="#7ef0e6"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>'
    + '<path d="M12 1l3.2 6.3L22 8.6l-4.9 5 1.2 7L12 17.4 5.7 20.6l1.2-7L2 8.6l6.8-1.3z" fill="url(#bp-g)" stroke="#4c1d95" stroke-width=".8" stroke-linejoin="round"/>'
    + '<path d="M12 5.2l1.9 3.8 4.2.7-3 3 .7 4.2L12 15l-3.8 1.9.7-4.2-3-3 4.2-.7z" fill="#fff" fill-opacity=".55"/><path d="M12 1v16.4M2 8.6l10 3.4 10-3.4" stroke="#fff" stroke-opacity=".5" stroke-width=".6" fill="none"/>',
  plus: () => grad("bl-g", ["#ffc4e6","#d946ef","#6d28d9"]) + '<path d="M12 1.5l8.8 3.2v6.4c0 5.6-3.8 9.8-8.8 11.4-5-1.6-8.8-5.8-8.8-11.4V4.7z" fill="url(#bl-g)" stroke="#4c1d95" stroke-width=".8"/>'
    + '<path d="M12 6.3l1.6 3.4 3.7.5-2.7 2.6.7 3.7L12 14.7l-3.3 1.8.7-3.7-2.7-2.6 3.7-.5z" fill="#fff"/><path d="M5 5.6 12 3" stroke="#fff" stroke-opacity=".7" stroke-width="1" stroke-linecap="round"/>',
  sup: () => grad("bs-g", ["#ffd1e8","#ff4f9a","#a3124f"]) + '<path d="M12 21.3S2.6 15.6 2.6 9.1A5 5 0 0 1 12 6.4a5 5 0 0 1 9.4 2.7c0 6.5-9.4 12.2-9.4 12.2z" fill="url(#bs-g)" stroke="#831843" stroke-width=".8"/>'
    + '<path d="M6 7.2c1.2-1 2.8-1.1 4 .1" stroke="#fff" stroke-opacity=".85" stroke-width="1.4" stroke-linecap="round" fill="none"/><circle cx="16.5" cy="9" r="1" fill="#fff" fill-opacity=".7"/>',
  early: () => grad("be-g", ["#bfe3ff","#3b82f6","#1e3a8a"]) + '<circle cx="12" cy="12" r="10.6" fill="url(#be-g)" stroke="#fcd34d" stroke-width="1.4"/>'
    + '<path d="M12 18.5v-6.8" stroke="#bbf7d0" stroke-width="1.6" stroke-linecap="round"/><path d="M12 12.2c0-3.3 2.2-5.5 5.6-5.5 0 3.3-2.2 5.5-5.6 5.5z" fill="#4ade80"/><path d="M12 13.4c0-2.7-1.9-4.5-4.6-4.5 0 2.7 1.9 4.5 4.6 4.5z" fill="#86efac"/>'
    + '<path d="M7.5 18.6h9" stroke="#fcd34d" stroke-width="1.4" stroke-linecap="round"/>' + SHINE,
  quest: t => grad("bq-" + t, TIERS[t].c) + '<circle cx="12" cy="12" r="10.8" fill="url(#bq-' + t + ')" stroke="' + TIERS[t].c[2] + '" stroke-width=".8"/><circle cx="12" cy="12" r="7.4" fill="#16181d" stroke="#fff" stroke-opacity=".25" stroke-width=".6"/>'
    + '<path d="M12 4.9v1.5M12 17.6v1.5M4.9 12h1.5M17.6 12h1.5" stroke="#fff" stroke-opacity=".6" stroke-width=".9"/><path d="M14.6 9.4 12.9 12.9 9.4 14.6l1.7-3.5z" fill="#fff"/><path d="M14.6 9.4l-3.5 1.7 1.8 1.8z" fill="#ff5470"/>' + SHINE,
  collector: () => grad("bc-g", ["#e9d5ff","#9333ea","#4c1d95"], true) + '<path d="M3 10.5a9 5.2 0 0 1 18 0V12H3z" fill="url(#bc-g)" stroke="#3b0764" stroke-width=".8"/>'
    + '<rect x="3" y="11.5" width="18" height="9" rx="1.6" fill="url(#bc-g)" stroke="#3b0764" stroke-width=".8"/><path d="M3 12h18" stroke="#fbbf24" stroke-width="1.6"/><path d="M8 6.4v14M16 6.4v14" stroke="#fbbf24" stroke-width="1.2"/>'
    + '<rect x="10.3" y="11" width="3.4" height="4" rx=".8" fill="#fde68a" stroke="#92400e" stroke-width=".6"/><path d="M6.5 7.6c1.4-1 3-1.4 4.4-1.4" stroke="#fff" stroke-opacity=".7" stroke-width="1" stroke-linecap="round" fill="none"/>',
  spender: t => grad("bg-" + t, TIERS[t].c) + '<path d="M6.2 3h11.6l4.2 6L12 21.4 2 9z" fill="url(#bg-' + t + ')" stroke="' + TIERS[t].c[2] + '" stroke-width=".8" stroke-linejoin="round"/>'
    + '<path d="M2 9h20M9.3 3 7.6 9 12 21.4 16.4 9l-1.7-6M7.6 9 12 3l4.4 6" stroke="#fff" stroke-opacity=".55" stroke-width=".8" fill="none" stroke-linejoin="round"/><path d="M6.2 3H12L7.6 9H2z" fill="#fff" fill-opacity=".35"/>',
  loyal: t => grad("by-" + t, TIERS[t].c) + '<path d="M7.5 14.5 5 22.5l3.2-1.6 2 2.6 1.8-7.5zM16.5 14.5l2.5 8-3.2-1.6-2 2.6-1.8-7.5z" fill="#e11d48" stroke="#881337" stroke-width=".6"/>'
    + '<circle cx="12" cy="9.6" r="8.4" fill="url(#by-' + t + ')" stroke="' + TIERS[t].c[2] + '" stroke-width=".8"/><circle cx="12" cy="9.6" r="6.1" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width=".7"/>'
    + '<path d="M12 5.4l1.3 2.7 3 .4-2.2 2.1.5 3L12 12.2l-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="#fff"/>',
  voice: () => grad("bv-g", ["#a5f3fc","#06b6d4","#155e75"]) + '<rect x="1.5" y="1.5" width="21" height="21" rx="6.5" fill="url(#bv-g)" stroke="#164e63" stroke-width=".8"/>'
    + '<rect x="9" y="4.8" width="6" height="9.6" rx="3" fill="#fff"/><path d="M6.6 11.2a5.4 5.4 0 0 0 10.8 0M12 16.6v2.6M9.2 19.2h5.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/>' + SHINE,
  founder: () => '<defs><linearGradient id="bf-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b0764"/><stop offset="1" stop-color="#0f0524"/></linearGradient><linearGradient id="bf-au" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c2"/><stop offset=".5" stop-color="#f6c033"/><stop offset="1" stop-color="#a15c00"/></linearGradient></defs>'
    + '<circle cx="12" cy="12" r="10.8" fill="url(#bf-g)" stroke="url(#bf-au)" stroke-width="1.5"/>'
    + '<path d="M5.2 15.5c-1.4-2.6-1-5.6.8-7.8M18.8 15.5c1.4-2.6 1-5.6-.8-7.8" stroke="url(#bf-au)" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M5 12.4l1.6.3M5.6 10l1.5.6M19 12.4l-1.6.3M18.4 10l-1.5.6" stroke="#f6c033" stroke-width="1.1" stroke-linecap="round"/>'
    + '<path d="M7.8 15.2 7 9.4l2.8 2.2L12 7.6l2.2 4 2.8-2.2-.8 5.8z" fill="url(#bf-au)" stroke="#7c4a03" stroke-width=".5" stroke-linejoin="round"/><path d="M7.9 16.6h8.2" stroke="url(#bf-au)" stroke-width="1.3" stroke-linecap="round"/><circle cx="12" cy="7.3" r=".9" fill="#fff6c2"/>',
  photo: () => grad("bph-g", ["#ffd6ec","#ff4fa3","#9d174d"]) + '<rect x="1.8" y="5" width="20.4" height="15" rx="4" fill="url(#bph-g)" stroke="#831843" stroke-width=".8"/><path d="M8 5l1.4-2.4h5.2L16 5" fill="#ff7ac6" stroke="#831843" stroke-width=".8" stroke-linejoin="round"/>'
    + '<circle cx="12" cy="12.4" r="4.6" fill="#1f1020" stroke="#fff" stroke-width="1.4"/><circle cx="12" cy="12.4" r="2.2" fill="#6ee7ff"/><circle cx="11.1" cy="11.5" r=".8" fill="#fff"/><circle cx="18.4" cy="8.2" r="1" fill="#fff6c2"/>',
  bughunter: () => grad("bb-g", ["#d9f99d","#65a30d","#1a2e05"]) + '<circle cx="12" cy="12" r="10.8" fill="url(#bb-g)" stroke="#1a2e05" stroke-width=".8"/>'
    + '<ellipse cx="12" cy="13.4" rx="3.8" ry="4.8" fill="#1a2e05"/><circle cx="12" cy="8" r="2.2" fill="#1a2e05"/><path d="M12 9.6v8.4" stroke="#bef264" stroke-width=".9"/><path d="M8.2 11.2 5.4 9.6M8 14l-3 .2M8.6 16.8l-2.4 2M15.8 11.2l2.8-1.6M16 14l3 .2M15.4 16.8l2.4 2M10.8 6.2 9.6 4.4M13.2 6.2l1.2-1.8" stroke="#1a2e05" stroke-width="1.2" stroke-linecap="round"/>' + SHINE,
  helper: () => grad("bh-g", ["#bae6fd","#0ea5e9","#0c4a6e"]) + '<circle cx="12" cy="12" r="10.6" fill="#fff" stroke="#0c4a6e" stroke-width=".8"/><circle cx="12" cy="12" r="10.6" fill="none" stroke="url(#bh-g)" stroke-width="5" stroke-dasharray="8.3 8.3" transform="rotate(-22 12 12)"/>'
    + '<circle cx="12" cy="12" r="4.6" fill="#0c1a2a" stroke="#0c4a6e" stroke-width=".8"/><path d="M12 9.6v4.8M9.6 12h4.8" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>',
  mvp: () => grad("bm-g", ["#fff6c2","#f6c033","#a15c00"], true) + '<path d="M7 3h10v5.5a5 5 0 0 1-10 0z" fill="url(#bm-g)" stroke="#7c4a03" stroke-width=".8"/><path d="M7 4.6H4.2c0 3 1.2 4.6 3.4 5M17 4.6h2.8c0 3-1.2 4.6-3.4 5" stroke="#f6c033" stroke-width="1.4" fill="none"/>'
    + '<path d="M10.4 13.2h3.2l.6 3.6h-4.4z" fill="#d99a14"/><rect x="7.4" y="16.8" width="9.2" height="4.2" rx="1" fill="#5b3a0a" stroke="#f6c033" stroke-width=".8"/><path d="M12 5l.9 1.9 2 .3-1.4 1.4.3 2L12 9.7l-1.8.9.3-2-1.4-1.4 2-.3z" fill="#fff"/>',
  artist: () => grad("ba-g", ["#fde7c7","#f5c08a","#9a5b20"]) + '<path d="M12 2.2c5.6 0 9.8 3.8 9.8 8.6 0 3.3-2.6 4.4-4.6 4.4-1.6 0-2.4 1-2 2.4.5 1.6-.4 4.2-3.4 4.2-5.4 0-9.6-4.4-9.6-9.8S6.3 2.2 12 2.2z" fill="url(#ba-g)" stroke="#7c4a1a" stroke-width=".8"/>'
    + '<circle cx="7" cy="10" r="1.7" fill="#ef4444"/><circle cx="9.8" cy="6.2" r="1.7" fill="#facc15"/><circle cx="14.6" cy="6" r="1.7" fill="#22c55e"/><circle cx="17.6" cy="9.6" r="1.7" fill="#3b82f6"/><circle cx="8.4" cy="15" r="1.9" fill="#fde7c7" stroke="#9a5b20" stroke-width=".6"/>',
  og: () => grad("bog-g", ["#e9d5ff","#7c3aed","#2e1065"]) + '<rect x="1.6" y="4.2" width="20.8" height="15.6" rx="5" fill="url(#bog-g)" stroke="#2e1065" stroke-width=".8"/>'
    + '<text x="12" y="15.9" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="9.4" fill="#fff" stroke="#2e1065" stroke-width=".5" paint-order="stroke">OG</text><path d="M4.8 7c1.6-1.2 3.6-1.4 5.4-1" stroke="#fff" stroke-opacity=".7" stroke-width="1" stroke-linecap="round" fill="none"/>',
  hype: () => '<defs><linearGradient id="bhy-g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#b91c1c"/><stop offset=".5" stop-color="#f97316"/><stop offset="1" stop-color="#fde047"/></linearGradient></defs>'
    + '<path d="M12 1.6c.6 3.4 4.2 5 5.6 8.6 1.6 4.2-.8 10.2-5.6 10.2S4.6 15.6 6 11.6c.6-1.8 1.8-2.6 2.6-3.4.2 1.6.8 2.6 1.8 3.2C10.2 7.6 11 4.4 12 1.6z" fill="url(#bhy-g)" stroke="#7f1d1d" stroke-width=".8" stroke-linejoin="round"/>'
    + '<path d="M12 11c.4 2 2.6 3 2.6 5.2a2.6 2.6 0 0 1-5.2 0c0-1.4.8-2 1.4-2.6.2.8.6 1.2 1 1.4-.2-1.4-.2-2.6.2-4z" fill="#fef08a"/>',
  event: () => grad("bev-g", ["#fbcfe8","#ec4899","#831843"]) + '<path d="M3 21l4.6-12.4 7.8 7.8z" fill="url(#bev-g)" stroke="#831843" stroke-width=".8" stroke-linejoin="round"/><path d="M5.2 15.2l3.6 3.6M6.6 11.4l6 6" stroke="#fff" stroke-opacity=".6" stroke-width="1"/>'
    + '<path d="M13 6.8c.8-1.8 2.6-2.6 4.4-2.2M15.6 10.2c1.6-.8 3.6-.4 4.8.8M11.6 4.2l.6-2" stroke="#facc15" stroke-width="1.4" stroke-linecap="round" fill="none"/><circle cx="19.4" cy="4.4" r="1.2" fill="#22d3ee"/><circle cx="20.6" cy="14.6" r="1" fill="#a78bfa"/><circle cx="9" cy="3.4" r=".9" fill="#4ade80"/>',
};
// Badges only the owner can hand out (stored in config/main.badges = {uid: [ids]}).
const SPECIAL_BADGES = [
  {id:"mvp", name:"MVP", how:"Given by the owner to the server's most valuable player.", rarity:"Mythic"},
  {id:"og", name:"OG", how:"Given by the owner to the originals.", rarity:"Epic"},
  {id:"bughunter", name:"Bug Hunter", how:"Given by the owner for finding and reporting bugs.", rarity:"Epic"},
  {id:"helper", name:"Helper", how:"Given by the owner for helping others out.", rarity:"Rare"},
  {id:"artist", name:"Artist", how:"Given by the owner for great art, memes or emotes.", rarity:"Rare"},
  {id:"hype", name:"Hype Squad", how:"Given by the owner to the people who keep chat alive.", rarity:"Rare"},
  {id:"event", name:"Event Winner", how:"Given by the owner to whoever won a server event.", rarity:"Epic"},
];
function specialOf(uid){ return ((S.config && S.config.badges) || {})[uid] || []; }
// Evolving badges: [threshold, tier]
const SPEND_TIERS = [[500,"bronze"],[1500,"silver"],[3000,"gold"],[6000,"platinum"],[10000,"diamond"],[20000,"emerald"],[35000,"ruby"],[60000,"opal"]];
const LOYAL_TIERS = [[7,"bronze"],[30,"silver"],[90,"gold"],[180,"platinum"],[365,"diamond"]];
const QUEST_TIERS = [[1,"bronze"],[5,"silver"],[12,"gold"]];
function tierFor(list, v){ let t = null, next = list[0]; for (let i = 0; i < list.length; i++){ if (v >= list[i][0]){ t = list[i]; next = list[i + 1] || null; } } return {tier: t && t[1], at: t && t[0], next}; }
function memberDays(uid){ const m = member(uid) || {}; return m.joinedAt ? Math.floor((Date.now() - m.joinedAt) / 864e5) : 0; }

// Every badge that exists, in display order, with how it's earned. state(uid) -> null (locked) or {tier?, progress?}
const BADGES = [
  {id:"owner", name:"Server Owner", how:"Runs this CampusCord.", rarity:"Mythic", state:uid => isOwnerUid(uid) ? {} : null},
  {id:"dev", name:"Developer", how:"Helps build CampusCord. Given by the owner.", rarity:"Epic", state:uid => isDev(uid) ? {} : null},
  {id:"pp", name:"Campus++", how:"Subscribe to Campus++.", rarity:"Epic", state:uid => rankOf(uid) === "plusplus" ? {} : null},
  {id:"plus", name:"Campus+", how:"Subscribe to Campus+.", rarity:"Rare", state:uid => rankOf(uid) === "plus" ? {} : null},
  {id:"founder", name:"Founder", how:"Buy the Founder badge in Ranks & Sparks. One of the first backers.", rarity:"Mythic", state:uid => perkActive(((S.perks[uid] || {}).items || {}).founder) ? {} : null},
  ...SPECIAL_BADGES.map(b => Object.assign({special:true, state:uid => specialOf(uid).includes(b.id) ? {} : null}, b)),
  {id:"spender", name:"Sparks Spender", how:"Spend Sparks in the Shop. Evolves from Bronze to Opal.", evolve:SPEND_TIERS, unit:"Sparks spent", state:uid => { if (isOwnerUid(uid)) return null; const t = tierFor(SPEND_TIERS, wal(uid).spent || 0); return t.tier ? t : null; }, val:uid => wal(uid).spent || 0},
  {id:"sup", name:"Supporter", how:"Buy the Supporter badge in Ranks & Sparks.", rarity:"Rare", state:uid => perkActive(((S.perks[uid] || {}).items || {}).supporter) ? {} : null},
  {id:"loyal", name:"Loyal Member", how:"Stick around. Evolves at 7, 30, 90, 180 and 365 days.", evolve:LOYAL_TIERS, unit:"days in CampusCord", state:uid => { const t = tierFor(LOYAL_TIERS, memberDays(uid)); return t.tier ? t : null; }, val:uid => memberDays(uid)},
  {id:"early", name:"Early Member", how:"Joined during CampusCord's first week.", rarity:"Epic", state:uid => { const m = member(uid) || {}; return S.config && m.joinedAt && m.joinedAt < (S.config.createdAt || 0) + 7 * 864e5 ? {} : null; }},
  {id:"quest", name:"Explorer", how:"Complete Quests. Evolves at 1, 5 and every quest.", evolve:QUEST_TIERS, unit:"quests done", state:uid => { const t = tierFor(QUEST_TIERS.map(x => x[1] === "gold" ? [QUESTS.length, "gold"] : x), (wal(uid).quests || []).length); return t.tier ? t : null; }, val:uid => (wal(uid).quests || []).length},
  {id:"collector", name:"Collector", how:"Own 5 or more cosmetics.", rarity:"Rare", state:uid => !isOwnerUid(uid) && ownedCount(uid) >= 5 ? {} : null},
  {id:"photo", name:"Photogenic", how:"Set a real photo as your profile picture.", rarity:"Common", state:uid => isPhotoAvatar(profile(uid).avatar) ? {} : null},
  {id:"voice", name:"Voice Regular", how:"Finish the Hop in voice quest.", rarity:"Common", state:uid => (wal(uid).quests || []).includes("q_voice") ? {} : null},
];
function badgeSvg(id, tier){ return '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' + BADGE_ART[id](tier) + '</svg>'; }
function badgeEl(b, st, size){ const s = h("span",{class:"pbadge b-" + b.id + (st && st.tier ? " t-" + st.tier : "") + (size ? " " + size : "")}); s.innerHTML = badgeSvg(b.id, (st && st.tier) || (b.evolve ? b.evolve[0][1] : null)); return s; }
function badgesOf(uid){ return BADGES.map(b => ({b, st:b.state(uid)})).filter(x => x.st); }
function showcaseOf(uid){ const sc = profile(uid).showcase; return Array.isArray(sc) ? sc : null; }
function displayBadges(uid){ const all = badgesOf(uid), sc = showcaseOf(uid); if (!sc || !sc.length) return all;
  const pinned = sc.map(id => all.find(x => x.b.id === id)).filter(Boolean); return pinned.length ? pinned : all; }
async function toggleBadgePin(id){ const all = badgesOf(S.uid).map(x => x.b.id); let sc = (showcaseOf(S.uid) || []).filter(x => all.includes(x));
  if (sc.includes(id)) sc = sc.filter(x => x !== id); else { if (sc.length >= 6){ toast("You can pin up to 6 badges"); return; } sc.push(id); }
  try{ await setMyProfile({showcase:sc}); toast(sc.includes(id) ? "Pinned to your profile" : "Unpinned"); }catch(e){ toast("Couldn't save: " + errMsg(e)); } }
function badgeTitle(b, st){ return b.name + (st && st.tier ? " · " + TIERS[st.tier].name : ""); }
function badgeRarity(b, st){ return st && st.tier ? TIERS[st.tier].r : b.rarity || (b.evolve ? TIERS[b.evolve[0][1]].r : "Common"); }
function badgeRow(uid){
  const list = displayBadges(uid); if (!list.length) return null;
  const shown = list.slice(0, 6);
  const row = h("div",{class:"bdgrow", title:"", onclick:e => { e.stopPropagation(); badgeDirectory(uid); }},
    shown.map(({b, st}) => { const el = badgeEl(b, st); el.dataset.tipT = badgeTitle(b, st); el.dataset.tipR = badgeRarity(b, st); el.dataset.tipD = b.how; return el; }),
    list.length > 6 ? h("span",{class:"bmore",text:"+" + (list.length - 6)}) : null);
  return row;
}
function evolveList(b){ return b.id === "quest" ? QUEST_TIERS.map(x => x[1] === "gold" ? [QUESTS.length, "gold"] : x) : b.evolve; }
async function setSpecial(uid, id, on){
  try{ await updateDoc(doc(db, "config/main"), {["badges." + uid]: on ? arrayUnion(id) : arrayRemove(id)}); toast((on ? "Gave " : "Removed ") + BADGES.find(x => x.id === id).name + (on ? " to " : " from ") + nickOf(uid)); }
  catch(e){ toast("Couldn't update badge: " + errMsg(e)); }
}
function badgeDirectory(uid){
  closeLayer("profile");
  modal((m, close, bg) => {
    const draw = () => {
      m.innerHTML = "";
      const mine = uid === S.uid, have = badgesOf(uid), sc = showcaseOf(S.uid) || [];
      const shown = mine ? BADGES : BADGES.filter(b => !b.special || b.state(uid) || isOwner());
      m.append(h("button",{class:"ib close",title:"Close (Esc)",onclick:close}, ic("x")),
        h("div",{class:"bdhead"}, h("div",{class:"bdhero"}, ...have.slice(0, 5).map(({b, st}) => badgeEl(b, st, "lg"))),
          h("h2",{text: mine ? "Your badges" : nickOf(uid) + "'s badges"}),
          h("p",{class:"note",style:{margin:0},text: have.length + " of " + BADGES.length + " collected" + (mine ? " · pin up to 6 to show on your profile" : "")}),
          h("div",{class:"bdbar"}, h("i",{style:{width: Math.round(have.length / BADGES.length * 100) + "%"}}))));
      ["Mythic","Epic","Rare","Common"].forEach(rar => {
        const group = shown.filter(b => (b.evolve ? "Evolving" : b.rarity) === rar); if (!group.length) return;
        m.append(h("div",{class:"bdsec", style:{color:RARITY_COLOR[rar]}, text:rar}));
        m.append(bdGrid(group));
      });
      const evo = shown.filter(b => b.evolve); if (evo.length){ m.append(h("div",{class:"bdsec", style:{color:"#7ef0e6"}, text:"Evolving"})); m.append(bdGrid(evo)); }
      function bdGrid(list){
        const grid = h("div",{class:"bdgrid"});
        list.forEach(b => { const st = b.state(uid); const r = badgeRarity(b, st);
          let prog = null;
          if (b.evolve && b.val){ const v = b.val(uid); const tl = evolveList(b); const t = tierFor(tl, v);
            const prevAt = t.at || 0, nextAt = t.next ? t.next[0] : prevAt; const pct = t.next ? Math.max(0, Math.min(100, (v - prevAt) / (nextAt - prevAt) * 100)) : 100;
            prog = h("div",{class:"bdevo"},
              h("div",{class:"bdtiers"}, tl.map(([n, tn]) => { const e = badgeEl(b, {tier:tn}, "sm"); if (v < n) e.classList.add("blk"); e.dataset.tipT = TIERS[tn].name; e.dataset.tipR = TIERS[tn].r; e.dataset.tipD = n.toLocaleString() + " " + b.unit; return e; })),
              h("div",{class:"bdbar sm"}, h("i",{style:{width:pct + "%"}})),
              h("span",{class:"note",style:{margin:0,fontSize:"11px"},text: t.next ? v.toLocaleString() + " / " + nextAt.toLocaleString() + " " + b.unit + " to " + TIERS[t.next[1]].name : "Max tier reached!"})); }
          const pinned = mine && sc.includes(b.id);
          const actions = h("div",{class:"bdacts"},
            mine && st ? h("button",{class:"bdpin" + (pinned ? " on" : ""), title: pinned ? "Unpin from profile" : "Pin to profile", onclick:async () => { await toggleBadgePin(b.id); setTimeout(draw, 250); }}, ic("pin","sm"), pinned ? " Pinned" : " Pin") : null,
            b.special && isOwner() && !mine ? h("button",{class:"btn small" + (st ? " ghost" : ""), onclick:async () => { await setSpecial(uid, b.id, !st); setTimeout(draw, 250); }}, st ? "Remove" : "Give") : null);
          grid.appendChild(h("div",{class:"bdcard r-" + r.toLowerCase() + (st ? " have" : " blk")},
            (() => { const e = badgeEl(b, st, "lg"); if (!st) e.classList.add("blk"); return e; })(),
            h("div",{class:"bdtxt"}, h("b",{text: badgeTitle(b, st)}), h("span",{class:"rar",style:{color:RARITY_COLOR[r]},text:r + (b.special ? " · Owner-given" : "")}), h("span",{class:"note",style:{margin:0},text:b.how}), prog, actions),
            st ? h("span",{class:"owned"}, ic("check","sm")) : h("span",{class:"lockic"}, ic("lock","sm")))); });
        return grid;
      }
    };
    S.paneRefresh = {bg, draw}; draw();
  }, "bdmodal");
}
// New badge / tier unlocked → celebrate once.
function badgeKeys(uid){ return badgesOf(uid).map(({b, st}) => b.id + (st.tier ? ":" + st.tier : "")); }
function checkNewBadges(){
  if (!S.uid || !S.walletsLoaded || !member(S.uid) || window.__ccNoPop || document.hidden || $("layer").children.length) return;
  const now = badgeKeys(S.uid);
  if (!Array.isArray(prefs.seenBadges)){ prefs.seenBadges = now; savePrefs(); return; }
  const fresh = now.filter(k => !prefs.seenBadges.includes(k)); if (!fresh.length) return;
  prefs.seenBadges = [...new Set([...prefs.seenBadges, ...now])]; savePrefs();
  const [id, tier] = fresh[fresh.length - 1].split(":"); const b = BADGES.find(x => x.id === id); if (!b) return;
  const st = tier ? {tier} : {}; const r = badgeRarity(b, st);
  modal((m, close) => {
    m.append(h("div",{class:"pfx pfx-confetti"}), h("div",{class:"nbglow r-" + r.toLowerCase()}, badgeEl(b, st, "xl")),
      h("span",{class:"ichip",style:{background:RARITY_COLOR[r],color:"#111"}}, tier ? "BADGE EVOLVED" : "NEW BADGE"),
      h("h2",{text: badgeTitle(b, st)}), h("span",{class:"rar",style:{color:RARITY_COLOR[r]},text:r}), h("p",{class:"note",text:b.how}),
      h("div",{class:"foot",style:{justifyContent:"center"}}, h("button",{class:"btn ghost", onclick:() => { close(); badgeDirectory(S.uid); }}, "See all badges"), h("button",{class:"btn", onclick:close}, "Nice!")));
    try{ tone(true); }catch(e){}
  }, "newbadge");
}
setInterval(() => { try{ checkNewBadges(); }catch(e){} }, 4000);
// rich hover tooltips for badges
(() => { let tip = null;
  document.addEventListener("mouseover", e => { const el = e.target.closest && e.target.closest(".pbadge[data-tip-t]"); if (!el){ if (tip){ tip.remove(); tip = null; } return; }
    if (tip && tip._for === el) return; if (tip) tip.remove();
    tip = h("div",{class:"rtip up btip"}, h("b",{text:el.dataset.tipT}), h("span",{class:"rar",style:{color:RARITY_COLOR[el.dataset.tipR] || "#b5bac1"},text:el.dataset.tipR || ""}), h("span",{class:"d",text:el.dataset.tipD || ""})); tip._for = el; document.body.appendChild(tip);
    const b = el.getBoundingClientRect(); tip.style.top = (b.top - tip.offsetHeight - 8) + "px"; tip.style.left = Math.max(8, Math.min(window.innerWidth - tip.offsetWidth - 8, b.left + b.width / 2 - tip.offsetWidth / 2)) + "px"; });
})();
