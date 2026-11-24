// ---------------------------------------------------------------- Sparks economy: cosmetics, bundles, quests
// Prices and rewards are mirrored into config/catalog (written by the owner's app) so the
// Firestore rules can check every purchase and claim. Bump CAT_V whenever they change.
const CAT_V = 7;
const COSM = [
  // avatar decorations
  {id:"d_cosmic", type:"deco", name:"Cosmic Swirl", price:700, tag:"exclusive", desc:"A galaxy that never stops turning around your avatar."},
  {id:"d_aurora", type:"deco", name:"Aurora Mist", price:600, tag:"new", desc:"Soft northern lights drifting around you."},
  {id:"d_ember", type:"deco", name:"Ember", price:600, desc:"Flickering flames for the hottest takes."},
  {id:"d_halo", type:"deco", name:"Golden Halo", price:800, tag:"exclusive", desc:"A floating golden halo. Angelic. Allegedly."},
  {id:"d_frost", type:"deco", name:"Frostbite", price:500, desc:"An icy ring with glittering snowflakes."},
  {id:"d_sakura", type:"deco", name:"Sakura Bloom", price:500, desc:"Cherry blossom petals circling your avatar."},
  {id:"d_pixel", type:"deco", name:"Pixel Frame", price:300, desc:"A retro 8-bit frame."},
  {id:"d_bubble", type:"deco", name:"Bubble", price:0, tag:"free", desc:"A shiny bubble. Free for everyone — grab it!"},
  // profile effects
  {id:"e_starfall", type:"pfx", name:"Starfall", price:500, tag:"exclusive", desc:"Shooting stars fall across your profile card."},
  {id:"e_aurora", type:"pfx", name:"Northern Lights", price:600, tag:"new", desc:"Aurora waves ripple over your banner."},
  {id:"e_snow", type:"pfx", name:"Snow Day", price:400, desc:"Gentle snowfall on your profile."},
  {id:"e_confetti", type:"pfx", name:"Confetti", price:400, desc:"It's always a party on your profile."},
  {id:"e_hearts", type:"pfx", name:"Floating Hearts", price:400, desc:"Little hearts drift up your card."},
  {id:"e_matrix", type:"pfx", name:"Code Rain", price:500, desc:"Green code rains down. Very hacker."},
  // nameplates
  {id:"p_nebula", type:"plate", name:"Nebula", price:400, tag:"exclusive", desc:"A starry purple glow behind your name in member lists."},
  {id:"p_gold", type:"plate", name:"Gilded", price:600, tag:"exclusive", desc:"A shimmering gold nameplate."},
  {id:"p_sunset", type:"plate", name:"Sunset", price:300, desc:"Warm orange and pink."},
  {id:"p_ocean", type:"plate", name:"Deep Ocean", price:300, desc:"Cool teal waves."},
  {id:"p_matcha", type:"plate", name:"Matcha", price:300, tag:"new", desc:"Fresh green, very calming."},
  {id:"p_candy", type:"plate", name:"Cotton Candy", price:300, desc:"Pink and blue, extra sweet."},
  {id:"p_midnight", type:"plate", name:"Midnight", price:400, desc:"Deep navy with tiny stars."},
  // animated profile banners
  {id:"n_galaxy", type:"pban", name:"Galaxy", price:600, tag:"exclusive", desc:"A slowly swirling galaxy with twinkling stars."},
  {id:"n_aurora", type:"pban", name:"Aurora Flow", price:500, tag:"new", desc:"Northern-light colors flowing across your banner."},
  {id:"n_synth", type:"pban", name:"Synthwave", price:600, tag:"exclusive", desc:"A neon grid racing toward a retro sunset."},
  {id:"n_lava", type:"pban", name:"Lava Lamp", price:500, desc:"Warm blobs drifting around."},
  {id:"n_ocean", type:"pban", name:"Ocean Waves", price:400, desc:"Rolling waves in deep blue."},
  {id:"n_holo", type:"pban", name:"Holographic", price:700, tag:"exclusive", desc:"A shimmering rainbow foil."},
  {id:"n_sakura", type:"pban", name:"Sakura Breeze", price:400, desc:"Soft pink with drifting petals."},

  // --- SCI-FI & GALAXY THEME ---
  {id:"d_plasma", type:"deco", name:"Plasma Blade", price:800, tag:"exclusive", desc:"An elegant, glowing energy sword that hums with power."},
  {id:"e_force", type:"pfx", name:"Telekinetic Aura", price:1500, tag:"new", desc:"Floating debris and a mystical blue glow surround your profile."},
  {id:"p_empire", type:"plate", name:"Galactic Enforcer", price:500, desc:"A sleek, dark metallic nameplate inspired by galactic troopers."},
  {id:"n_hyper", type:"pban", name:"Lightspeed Jump", price:1200, tag:"exclusive", desc:"Watch the stars streak by as your profile jumps to hyperspace."},

  // --- SUPERHERO THEME ---
  {id:"d_spider", type:"deco", name:"Web Slinger", price:850, tag:"new", desc:"A masked hood with expressive white eyes and animated webbing."},
  {id:"e_multiverse", type:"pfx", name:"Reality Glitch", price:1600, tag:"exclusive", desc:"Your profile glitches between different dimensions and comic styles."},
  {id:"p_stark", type:"plate", name:"Billionaire Tech", price:600, desc:"A glowing arc-reactor blue nameplate with a high-tech HUD overlay."},
  {id:"n_cityswing", type:"pban", name:"Midnight Skyline", price:1100, desc:"A looping animation swinging through a neon-lit city at night."},
  
  // --- MAGIC & MYSTIC THEME ---
  {id:"d_sorcerer", type:"deco", name:"Mystic Cloak", price:900, desc:"A sentient red cloak that floats around your avatar."},
  {id:"e_time", type:"pfx", name:"Time Loop", price:1400, desc:"Glowing green runes circle your profile, reversing time."},
  {id:"n_mirror", type:"pban", name:"Mirror Dimension", price:1300, tag:"exclusive", desc:"Shattered, folding reality twisting in the background."},

  // --- ANIME & ACTION THEME ---
  {id:"d_supersaiyan", type:"deco", name:"Golden Aura", price:1000, tag:"exclusive", desc:"Spiky glowing hair and crackling energy for your avatar."},
  {id:"p_shinobi", type:"plate", name:"Hidden Village", price:400, desc:"A carved stone nameplate with a slashed headband motif."},
  {id:"n_spirit", type:"pban", name:"Energy Blast", price:1150, desc:"A massive, screen-shaking energy beam tearing through the banner."},
  // ---- Winter 2026 drop ----
  {id:"d_void", type:"deco", name:"Black Hole", price:2000, tag:"exclusive", desc:"A swirling accretion disk that bends the light around your avatar."},
  {id:"d_crown", type:"deco", name:"Royal Crown", price:1500, tag:"exclusive", desc:"A floating gold crown with sparkling jewels. Bow down."},
  {id:"d_storm", type:"deco", name:"Thunderstorm", price:900, tag:"new", desc:"A dark storm ring with lightning that strikes every few seconds."},
  {id:"d_orbit", type:"deco", name:"Orbit", price:800, tag:"new", desc:"Two tiny planets orbiting your avatar on glowing paths."},
  {id:"d_neon", type:"deco", name:"Neon Sign", price:700, tag:"new", desc:"A buzzing pink and cyan neon ring that flickers like a real sign."},
  {id:"d_prism", type:"deco", name:"Prism", price:600, tag:"new", desc:"A rainbow ring that shifts through every color."},
  {id:"e_fireflies", type:"pfx", name:"Fireflies", price:700, tag:"new", desc:"Glowing fireflies drift and blink across your profile."},
  {id:"e_lightning", type:"pfx", name:"Lightning Strike", price:900, tag:"new", desc:"Lightning flashes across your profile card."},
  {id:"e_bubbles", type:"pfx", name:"Bubble Up", price:500, tag:"new", desc:"Shiny bubbles float up your card."},
  {id:"p_neon", type:"plate", name:"Neon Pulse", price:600, tag:"new", desc:"A flickering pink and cyan neon nameplate."},
  {id:"p_prism", type:"plate", name:"Prism", price:500, tag:"new", desc:"A rainbow that sweeps across your name."},
  {id:"p_molten", type:"plate", name:"Molten", price:700, tag:"new", desc:"Glowing lava flowing behind your name."},
  {id:"n_storm", type:"pban", name:"Thunder Clouds", price:1000, tag:"new", desc:"Dark rolling clouds lit up by lightning."},
  {id:"n_cyber", type:"pban", name:"Cyber City", price:1200, tag:"new", desc:"A neon city skyline at night with a scanning light."},
  {id:"n_rgb", type:"pban", name:"RGB Setup", price:800, tag:"new", desc:"Gamer RGB lighting rolling across your banner."},

  // ---- Cute, Critter & Neon Drop ----
  {id:"d_kittyears", type:"deco", name:"Kitty Ears", price:650, tag:"new", desc:"Plush cat ears with pink inner tufts that periodically twitch!"},
  {id:"d_catearsneon", type:"deco", name:"Cyber Kitty Ears", price:950, tag:"exclusive", desc:"Glowing holographic cyan & pink cat ears with neon pulse."},
  {id:"d_bunnyears", type:"deco", name:"Bunny Ears", price:600, tag:"new", desc:"Tall soft bunny ears with a playful floppy bounce."},
  {id:"d_foxears", type:"deco", name:"Kitsune Fox Ears", price:850, tag:"new", desc:"Fiery fox ears surrounded by floating spirit embers."},
  {id:"d_devilhorns", type:"deco", name:"Devil Horns", price:750, tag:"new", desc:"Curved crimson horns with a smoldering ember glow."},
  {id:"d_angelwings", type:"deco", name:"Seraph Wings", price:1200, tag:"exclusive", desc:"Feathered angel wings that gently flap beside your avatar."},
  {id:"d_headphones", type:"deco", name:"Bass Headphones", price:700, tag:"new", desc:"RGB studio headphones bouncing to a live bass beat."},
  {id:"d_froghat", type:"deco", name:"Froggy Hood", price:550, tag:"new", desc:"Cute frog eyes peeking over your avatar that blink at chat."},
  {id:"d_bearhat", type:"deco", name:"Cozy Bear Ears", price:550, tag:"new", desc:"Round teddy-bear ears with warm caramel tufts that wiggle."},
  {id:"d_dragonhorns", type:"deco", name:"Dragon Horns", price:1100, tag:"exclusive", desc:"Swept obsidian dragon horns with orbiting emerald sparks."},
  {id:"d_phoenix", type:"deco", name:"Phoenix Crest", price:1350, tag:"exclusive", desc:"Blazing golden fire plumes rising around your avatar."},
  {id:"d_arcade", type:"deco", name:"Pixel Hearts", price:650, tag:"new", desc:"Floating 8-bit retro hearts orbiting your avatar."},

  {id:"e_sakura", type:"pfx", name:"Cherry Blossom Storm", price:750, tag:"new", desc:"Swirling pink sakura petals drift across your profile card."},
  {id:"e_cyberglitch", type:"pfx", name:"Neon Scanline", price:950, tag:"new", desc:"A sweeping cyan & magenta laser scanner over your profile."},
  {id:"e_stardust", type:"pfx", name:"Cosmic Stardust", price:1100, tag:"exclusive", desc:"Twinkling 4-point star sparkles rising across your card."},
  {id:"e_embers", type:"pfx", name:"Rising Embers", price:850, tag:"new", desc:"Glowing orange-gold fire sparks floating up your profile."},
  {id:"e_kittypaws", type:"pfx", name:"Kitty Paw Prints", price:700, tag:"new", desc:"Cute pastel pink paw prints and sparkles drift up your card."},
  {id:"e_lasergrid", type:"pfx", name:"Synth Laser Grid", price:1250, tag:"exclusive", desc:"Animated prism beams and neon rays sweep your profile."},

  {id:"n_kittycafe", type:"pban", name:"Kitty Café", price:750, tag:"new", desc:"Strawberry-cream banner with floating pastel paw prints & shimmer."},
  {id:"n_meteor", type:"pban", name:"Meteor Shower", price:1100, tag:"exclusive", desc:"Midnight sky with twinkling stars and streaking shooting meteors."},
  {id:"n_arcade", type:"pban", name:"Retro Arcade", price:850, tag:"new", desc:"Neon perspective grid floor with glowing arcade lights."},
  {id:"n_cherrynight", type:"pban", name:"Tokyo Rain", price:950, tag:"new", desc:"Moody neon-violet rain falling past glowing city lights."},
  {id:"n_solarflare", type:"pban", name:"Solar Eclipse", price:1300, tag:"exclusive", desc:"A glowing black-and-gold eclipse corona pulsing with solar flares."},

  {id:"p_kitty", type:"plate", name:"Kitty Whiskers", price:450, tag:"new", desc:"Pastel pink & cream shimmer nameplate with floating sparkles."},
  {id:"p_cyber", type:"plate", name:"Cyber Grid", price:550, tag:"new", desc:"Electric cyan and violet laser sweep with micro-grid lines."},
  {id:"p_sakura", type:"plate", name:"Blossom Breeze", price:450, tag:"new", desc:"Delicate cherry-blossom pink and pearl glow."},
  {id:"p_galaxy", type:"plate", name:"Starlight Nebula", price:650, tag:"exclusive", desc:"Deep cosmic indigo with twinkling stars and aurora shimmer."},
  {id:"p_toxic", type:"plate", name:"Acid Glitch", price:600, tag:"new", desc:"Radioactive lime-green and electric-teal energy wave."},
  {id:"p_liquidgold", type:"plate", name:"Liquid Gold", price:800, tag:"exclusive", desc:"A rich, flowing metallic gold gradient."}
];
const BUNDLES = [
  {id:"b_cosmic", type:"bundle", name:"Cosmic Bundle", items:["d_cosmic","e_starfall","p_nebula"], tag:"exclusive", desc:"Cosmic Swirl, Starfall and the Nebula nameplate."},
  {id:"b_aurora", type:"bundle", name:"Aurora Bundle", items:["d_aurora","e_aurora","p_matcha"], tag:"new", desc:"Aurora Mist, Northern Lights and the Matcha nameplate."},
  {id:"b_storm", type:"bundle", name:"Storm Bundle", items:["d_storm","e_lightning","n_storm"], desc:"Thunderstorm, Lightning Strike and Thunder Clouds."},
  {id:"b_neon", type:"bundle", name:"Neon Nights Bundle", items:["d_neon","p_neon","n_cyber"], desc:"Neon Sign, Neon Pulse and Cyber City."},
  {id:"b_winter", type:"bundle", name:"Winter Bundle", items:["d_frost","e_snow","p_ocean"], desc:"Frostbite, Snow Day and the Deep Ocean nameplate."},
  {id:"b_love", type:"bundle", name:"Sweetheart Bundle", items:["d_sakura","e_hearts","p_candy"], desc:"Sakura Bloom, Floating Hearts and Cotton Candy."},
  {id:"b_galaxy", type:"bundle", name:"Deep Space Bundle", items:["d_cosmic","e_starfall","p_midnight","n_galaxy"], tag:"exclusive", desc:"The full space look: Cosmic Swirl, Starfall, Midnight nameplate and the animated Galaxy banner."},
];
const COSM_BY = {}; COSM.forEach(c => COSM_BY[c.id] = c);
// Owner-only looks: not sold in the Shop (missing from the catalog, so they can't be bought).
[{id:"d_yinyang", type:"deco", name:"Yin-Yang", price:0, own:true, desc:"A black-and-white outline. Owner only."},
 {id:"p_yinyang", type:"plate", name:"Yin-Yang", price:0, own:true, desc:"Black fading into white. Owner only."}].forEach(c => COSM_BY[c.id] = c);
BUNDLES.forEach(b => { const full = b.items.reduce((n, i) => n + COSM_BY[i].price, 0); b.full = full; b.price = Math.round(full * 0.85 / 10) * 10; COSM_BY[b.id] = b; });
const SLOT_NAME = {deco:"Avatar decoration", pfx:"Profile effect", plate:"Nameplate", pban:"Profile banner", bundle:"Bundle"};
const DAILY_SPARKS = 50, DAILY_MS = 20 * 3600 * 1000, STREAK_MS = 48 * 3600 * 1000, STREAK_BONUS = 150;
const QUESTS = [
  {id:"q_first", icon:"message", name:"Say hello", desc:"Send your first message.", goal:1, stat:"msgs", reward:25},
  {id:"q_avatar", icon:"smile", name:"Glow up", desc:"Customize your avatar in Settings → My Account.", goal:1, check:() => profile(S.uid).avatar ? 1 : 0, reward:50},
  {id:"q_bio", icon:"user", name:"About me", desc:"Write a bio in Settings → Profile.", goal:1, check:() => profile(S.uid).bio ? 1 : 0, reward:50},
  {id:"q_dm", icon:"message", name:"Slide in", desc:"Start a direct message with someone.", goal:1, check:() => S.dms.length ? 1 : 0, reward:50},
  {id:"q_react", icon:"smileplus", name:"Reactor", desc:"React to 5 messages.", goal:5, stat:"reacts", reward:50},
  {id:"q_poll", icon:"grid", name:"Pollster", desc:"Start a poll with /poll.", goal:1, stat:"polls", reward:50},
  {id:"q_vote", icon:"check", name:"Have your say", desc:"Vote in a poll.", goal:1, stat:"votes", reward:25},
  {id:"q_equip", icon:"sparkles", name:"Drip check", desc:"Equip something from the Shop.", goal:1, check:() => { const p = profile(S.uid); return p.deco || p.pfx || p.plate || p.pban ? 1 : 0; }, reward:50},
  {id:"q_voice", icon:"volume", name:"Hop in voice", desc:"Join a voice channel.", goal:1, stat:"voice", reward:75},
  {id:"q_chatty", icon:"zap", name:"Chatterbox", desc:"Send 25 messages.", goal:25, stat:"msgs", reward:100},
  {id:"q_games", icon:"grid", name:"Big Brain", desc:"Win 5 daily games (Games on the left).", goal:5, stat:"gameWins", reward:150},
  {id:"q_buy", icon:"bag", name:"First purchase", desc:"Buy something with Sparks in the Shop.", goal:1, check:() => (wal(S.uid).items || []).some(i => COSM_BY[i] && COSM_BY[i].price > 0) ? 1 : 0, reward:50},
];
const DAILY_QUEST_POOL = [
  {id:"dq_chat5", name:"Chatterbox", desc:"Send 5 messages today", icon:"chat", stat:"msgs", goal:5, reward:60},
  {id:"dq_chat15", name:"Yap Session", desc:"Send 15 messages today", icon:"chat", stat:"msgs", goal:15, reward:100},
  {id:"dq_react3", name:"Hype Squad", desc:"React to 3 messages today", icon:"smile", stat:"reacts", goal:3, reward:50},
  {id:"dq_react8", name:"Reaction Spree", desc:"React to 8 messages today", icon:"smile", stat:"reacts", goal:8, reward:80},
  {id:"dq_reply2", name:"Conversationalist", desc:"Reply to 2 messages today", icon:"reply", stat:"replies", goal:2, reward:60},
  {id:"dq_dm2", name:"Slide In", desc:"Send 2 direct messages today", icon:"at", stat:"dms", goal:2, reward:60},
  {id:"dq_gif1", name:"GIF Master", desc:"Send a GIF today", icon:"gif", stat:"gifs", goal:1, reward:50},
  {id:"dq_poll1", name:"Voice Heard", desc:"Vote in a poll today", icon:"poll", stat:"votes", goal:1, reward:50},
  {id:"dq_vouch1", name:"Good Vibes", desc:"Post a vouch today", icon:"star", stat:"vouches", goal:1, reward:90},
  {id:"dq_game1", name:"Puzzle Solver", desc:"Win a daily game today", icon:"grid", stat:"gameWins", goal:1, reward:75}
];

function dailyQuests(day = etDay()){
  const n = DAILY_QUEST_POOL.length, out = [];
  for (let i = 0; i < 3; i++){
    const base = DAILY_QUEST_POOL[((day * 3) + i * 4) % n];
    out.push({...base, baseId: base.id, id: "dq_" + day + "_" + base.id, daily: true});
  }
  return out;
}

function dailyStats(){
  const d = store("dqstats_" + S.uid);
  return d && d.day === etDay() ? d : {day: etDay()};
}

function catalogDoc(){ const prices = {}; Object.values(COSM_BY).filter(c => !c.own).forEach(c => prices[c.id] = c.price); const quests = {}; QUESTS.forEach(q => quests[q.id] = q.reward);
  return {v:CAT_V, prices, quests, daily:DAILY_SPARKS, dailyQuests: true}; }

// ---- wallet + ownership
const EMPTY_WALLET = {earned:0, spent:0, items:[], quests:[], lastDaily:0, lastItem:"", lastQuest:""};
function wal(uid){ return Object.assign({}, EMPTY_WALLET, S.wallets[realUid(uid)] || {}); }
function sparks(uid){ const w = wal(uid); return Math.max(0, (w.earned || 0) - (w.spent || 0)); }
function owns(uid, id){ if (isOwnerUid(uid)) return true; const items = wal(uid).items || [];
  if (items.includes(id)) return true; return BUNDLES.some(b => b.items.includes(id) && items.includes(b.id)); }
function ownsBundleFully(uid, b){ return owns(uid, b.id) || b.items.every(i => owns(uid, i)); }
function equipped(uid, slot){ const id = profile(uid)[slot]; if (id && COSM_BY[id] && COSM_BY[id].own) return isOwnerUid(uid) && COSM_BY[id].type === slot ? id : null; return id && COSM_BY[id] && COSM_BY[id].type === slot && owns(uid, id) ? id : null; }
function qstats(){ return Object.assign({msgs:0, reacts:0, votes:0, polls:0, dailies:0, voice:0}, store("qstats_" + S.uid) || {}); }
function bumpStat(k, n){
  const add = n || 1;
  const s = qstats(); s[k] = (s[k] || 0) + add; store("qstats_" + S.uid, s);
  const ds = dailyStats(); ds[k] = (ds[k] || 0) + add; store("dqstats_" + S.uid, ds);
  if (S.kind === "quests") need("msgs");
}
function questProgress(q){
  if (q.daily) return Math.min(q.goal, dailyStats()[q.stat] || 0);
  return Math.min(q.goal, q.check ? q.check() : (qstats()[q.stat] || 0));
}
async function ensureWallet(){ if (S.walletsLoaded && !S.wallets[S.uid] && !S.walletCreating){ S.walletCreating = true;
  try{ await setDoc(doc(db, "wallet", S.uid), Object.assign({}, EMPTY_WALLET)); }catch(e){ console.warn("wallet", e); } S.walletCreating = false; } }
function econError(e){ return e && e.code === "permission-denied" ? "The shop is still being set up — ask the admin to open CampusCord once, then try again." : errMsg(e); }
async function buyCosmetic(id){
  const c = COSM_BY[id]; if (!c) return;
  if (owns(S.uid, id)){ toast("You already own " + c.name); return; }
  if (sparks(S.uid) < c.price){ toast("You need " + (c.price - sparks(S.uid)).toLocaleString() + " more Sparks"); openSparks(); return; }
  await ensureWallet(); const w = wal(S.uid);
  try{ await updateDoc(doc(db, "wallet", S.uid), {spent:(w.spent || 0) + c.price, items:[...(w.items || []), id], lastItem:id});
    toast((c.price ? "Bought " : "Claimed ") + c.name + "! ✦"); if (c.type !== "bundle") await equip(c.type, id, true); }
  catch(e){ toast("Couldn't buy: " + econError(e)); }
}
async function equip(slot, id, quiet){ try{ await setMyProfile({[slot]: id || ""}); if (!quiet) toast(id ? COSM_BY[id].name + " equipped" : "Removed"); }catch(e){} }
// Daily reward + login streak (must match the wallet rules in firestore.rules).
function streakNow(w){ return w.lastDaily && Date.now() - w.lastDaily <= STREAK_MS ? (w.streak || 0) : 0; }
async function claimDaily(btn){
  await ensureWallet(); const w = wal(S.uid), now = Date.now();
  if (w.lastDaily && now - w.lastDaily < DAILY_MS) return;
  const streak = w.lastDaily && now - w.lastDaily <= STREAK_MS ? (w.streak || 0) + 1 : 1;
  const bonus = streak % 7 === 0 ? STREAK_BONUS : 0, total = DAILY_SPARKS + bonus;
  if (btn) btn.disabled = true;
  try{ await updateDoc(doc(db, "wallet", S.uid), {earned:(w.earned || 0) + total, lastDaily:now, streak});
    toast(bonus ? "🔥 " + streak + "-day streak! +" + total + " Sparks" : "+" + total + " Sparks · 🔥 " + streak + "-day streak"); }
  catch(e){ if (btn) btn.disabled = false; toast("Couldn't claim: " + econError(e)); }
}
function dailyCardEl(){
  const w = wal(S.uid), now = Date.now(), ready = !w.lastDaily || now - w.lastDaily >= DAILY_MS;
  const cur = streakNow(w), next = cur + 1, inWeek = ready ? (next - 1) % 7 : (cur - 1) % 7 + 1;
  const wait = w.lastDaily ? Math.max(0, w.lastDaily + DAILY_MS - now) : 0;
  const left = Math.ceil(wait / 6e4), hrs = Math.floor(left / 60), mins = left % 60;
  const dots = h("div",{class:"dstreak"}, [1,2,3,4,5,6,7].map(d => h("span",{class:"dsd" + (d <= inWeek ? " on" : "") + (d === 7 ? " big" : ""), text: d === 7 ? "+150" : String(d)})));
  return h("div",{class:"dailycard" + (ready ? " ready" : "")},
    h("div",{class:"dcfire",text:"🔥"}),
    h("div",{class:"dcmain"}, h("b",{text: cur ? cur + "-day streak" : "Start a streak"}),
      h("span",{class:"note",style:{margin:0},text: ready ? "Claim your daily Sparks. Every 7th day in a row pays +" + STREAK_BONUS + " extra!" : "Come back in " + (hrs ? hrs + "h " : "") + mins + "m to keep your streak going."}), dots),
    ready ? h("button",{class:"btn", onclick:e => claimDaily(e.currentTarget)}, "Claim +" + (DAILY_SPARKS + (next % 7 === 0 ? STREAK_BONUS : 0))) : h("span",{class:"owned"}, ic("check","sm"), " Claimed today"));
}
async function claimQuest(q){
  const w = wal(S.uid); if ((w.quests || []).includes(q.id) || questProgress(q) < q.goal) return;
  await ensureWallet(); const w2 = wal(S.uid);
  const keepQuests = w2.quests || [];  // keep every claimed quest (the rules don't allow removing any)
  const rw = q.reward || 0;
  try{
    await updateDoc(doc(db, "wallet", S.uid), {earned:(w2.earned || 0) + rw, quests:[...keepQuests, q.id], lastQuest:q.id});
    toast("Quest complete — " + q.name + (rw ? " (+" + rw + " Sparks!)" : " ✦ Explorer badge progress!"));
  }
  catch(e){ toast("Couldn't claim: " + econError(e)); }
}
async function giveSparks(uid, n){ const w = wal(uid);
  try{ await setDoc(doc(db, "wallet", uid), Object.assign({}, EMPTY_WALLET, S.wallets[uid] || {}, {earned:(w.earned || 0) + n})); toast("Gave " + n + " Sparks to " + nickOf(uid)); }
  catch(e){ toast("Couldn't give Sparks: " + errMsg(e)); } }

// ---- rendering helpers
function sparkPill(n, cls){ return h("span",{class:"spk" + (cls ? " " + cls : "")}, ic("spark"), h("b",{text: (n || 0).toLocaleString()})); }
const DECO_PAIR_KEYS = new Set([
  "kittyears","catearsneon","bunnyears","foxears","devilhorns",
  "angelwings","headphones","froghat","bearhat","dragonhorns","phoenix","arcade"
]);
function decoEl(id){
  const k = id.slice(2);
  const el = h("span",{class:"deco deco-" + k});
  if (DECO_PAIR_KEYS.has(k)) el.append(h("span",{class:"d-l"}), h("span",{class:"d-r"}));
  return el;
}
function previewAvatar(id, size){ const a = avatar(S.uid, size || "xl"); a.querySelectorAll(".deco").forEach(x => x.remove()); a.classList.remove("ring"); if (id) a.appendChild(decoEl(id)); return a; }
function itemArt(c){
  const art = h("div",{class:"art art-" + c.type + " tint-" + (c.items ? c.items[0] : c.id).slice(2)});
  if (c.type === "deco") art.appendChild(previewAvatar(c.id));
  else if (c.type === "pfx"){ art.appendChild(h("div",{class:"minicard"}, h("div",{class:"mb2"}), h("div",{class:"mav"}, previewAvatar(null, "sm")), h("i",{class:"l1"}), h("i",{class:"l2"}), h("div",{class:"pfx pfx-" + c.id.slice(2)}))); }
  else if (c.type === "pban"){ art.appendChild(h("div",{class:"minicard"}, h("div",{class:"mb2 ban-" + c.id.slice(2)}), h("div",{class:"mav"}, previewAvatar(null, "sm")), h("i",{class:"l1"}), h("i",{class:"l2"}))); }
  else if (c.type === "plate"){ art.appendChild(h("div",{class:"platedemo"}, h("div",{class:"pd ghost"}, h("i"), h("b")),
      h("div",{class:"pd plate plate-" + c.id.slice(2)}, previewAvatar(null, "sm"), paintName(h("span",{text:nickOf(S.uid)}), S.uid)), h("div",{class:"pd ghost"}, h("i"), h("b")))); }
  else if (c.type === "bundle"){ const [d, e, p, n] = c.items;
    if (n) art.appendChild(h("div",{class:"bban ban-" + n.slice(2)}));
    art.append(h("div",{class:"pfx pfx-" + e.slice(2)}), h("div",{class:"bdeco"}, previewAvatar(d)), h("div",{class:"bplate pd plate plate-" + p.slice(2)}, paintName(h("span",{text:nickOf(S.uid)}), S.uid))); }
  return art;
}
function itemChip(c){
  if (c.type === "bundle") return h("span",{class:"ichip disc",text:"-15%"});
  if (c.tag === "exclusive") return h("span",{class:"ichip"}, ic("spark"), "SPARKS EXCLUSIVE");
  if (c.tag === "new") return h("span",{class:"ichip new",text:"NEW"});
  if (c.tag === "free") return h("span",{class:"ichip free",text:"FREE"});
  return null;
}
function priceEl(c){
  if (owns(S.uid, c.id) || (c.type === "bundle" && ownsBundleFully(S.uid, c))){ const on = c.type !== "bundle" && equipped(S.uid, c.type) === c.id;
    return h("div",{class:"iprice owned"}, ic("check","sm"), on ? "Equipped" : "Owned"); }
  return h("div",{class:"iprice"}, c.price ? sparkPill(c.price) : h("b",{text:"Free"}), c.full ? h("s",{text:c.full.toLocaleString()}) : null);
}
function wished(id){ return !!(prefs.wish || {})[id]; }
function toggleWish(id){ prefs.wish = prefs.wish || {}; if (prefs.wish[id]) delete prefs.wish[id]; else prefs.wish[id] = true; savePrefs(); need("msgs"); }
// Rarity comes from the price: the pricier, the rarer (just a look; prices don't change).
const RARITY = [{id:"common", name:"Common", max:300}, {id:"rare", name:"Rare", max:600}, {id:"epic", name:"Epic", max:999}, {id:"legendary", name:"Legendary", max:Infinity}];
function rarityOf(c){ const p = c.price || 0; if (!p) return {id:"free", name:"Free"}; return RARITY.find(r => p <= r.max); }
function itemCard(c){
  const r = rarityOf(c);
  const card = h("div",{class:"icard r-" + r.id, onclick:() => itemModal(c)},
    itemArt(c), itemChip(c), h("i",{class:"ishine"}),
    h("button",{class:"iheart" + (wished(c.id) ? " on" : ""), title: wished(c.id) ? "Remove from wishlist" : "Add to wishlist", onclick:e => { e.stopPropagation(); toggleWish(c.id); }}, ic("heart")),
    h("div",{class:"iinfo"}, h("div",{class:"irar",text:r.name}), h("div",{class:"iname",text:c.name}), priceEl(c)));
  // little 3D tilt that follows the mouse
  card.addEventListener("mousemove", e => { const b = card.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
    card.style.transform = "perspective(700px) rotateY(" + (x * 8) + "deg) rotateX(" + (-y * 8) + "deg) translateY(-4px)"; card.style.setProperty("--mx", (x + .5) * 100 + "%"); });
  card.addEventListener("mouseleave", () => { card.style.transform = ""; });
  return card;
}
const etDay = () => Math.floor((Date.now() - 5 * 36e5) / 864e5);
function spotlightItems(){ const d = etDay(), hash = str => { let x = d * 2654435761 >>> 0; for (const ch of str) x = Math.imul(x ^ ch.charCodeAt(0), 16777619) >>> 0; return x; };
  return COSM.filter(c => c.price > 0 && !c.own).sort((a, b) => hash(a.id) - hash(b.id)).slice(0, 4); }
function untilNextDay(){ const ms = (etDay() + 1) * 864e5 + 5 * 36e5 - Date.now(); const hh = Math.floor(ms / 36e5), mm = Math.floor(ms % 36e5 / 6e4); return hh + "h " + mm + "m"; }
const HERO = [
  {b:"b_storm", chip:"NEW DROP", title:"Thunderstorm", text:"Lightning that actually strikes: a storm ring, flashes across your profile and rolling thunder clouds.", bg:"storm"},
  {b:"b_neon", chip:"NEW DROP", title:"Neon Nights", text:"A buzzing neon ring, a flickering nameplate and a glowing city skyline.", bg:"neon"},
  {b:"b_galaxy", chip:"NEW COLLECTION", title:"Deep Space", text:"Go full galaxy: a cosmic ring, falling stars, a midnight nameplate and an animated banner.", bg:"space"},
  {b:"b_aurora", chip:"JUST DROPPED", title:"Northern Lights", text:"Glowing green and blue light that flows around your avatar and profile.", bg:"aurora"},
  {b:"b_winter", chip:"SEASONAL", title:"Winter Wonderland", text:"Frosty rings, a snow-day profile and a deep ocean nameplate.", bg:"winter"},
  {b:"b_love", chip:"FAN FAVORITE", title:"Sweetheart", text:"Cherry blossoms, floating hearts and a cotton-candy name.", bg:"love"},
];
function heroEl(){
  S.heroI = S.heroI || 0;
  const box = h("div",{class:"sherowrap"});
  const draw = () => {
    const hs = HERO[S.heroI % HERO.length], b = BUNDLES.find(x => x.id === hs.b); if (!b) return;
    box.innerHTML = "";
    box.append(h("div",{class:"shero hero-" + hs.bg, onclick:() => itemModal(b)},
      h("div",{class:"pfx pfx-" + b.items[1].slice(2)}), h("div",{class:"hglow"}),
      h("div",{class:"shtext"}, h("span",{class:"ichip"}, ic("spark"), hs.chip), h("h2",{text:hs.title}), h("p",{text:hs.text}),
        h("div",{class:"hrow"}, h("button",{class:"btn", onclick:e => { e.stopPropagation(); itemModal(b); }}, ownsBundleFully(S.uid, b) ? "You own this" : "Get the bundle"),
          ownsBundleFully(S.uid, b) ? null : h("span",{class:"hprice"}, sparkPill(b.price), b.full ? h("s",{text:b.full.toLocaleString()}) : null))),
      h("div",{class:"shart"}, previewAvatar(b.items[0]), h("div",{class:"pd plate plate-" + b.items[2].slice(2)}, paintName(h("span",{text:nickOf(S.uid)}), S.uid)))),
      h("div",{class:"hdots"}, HERO.map((_, i) => h("button",{class:"hdot" + (i === S.heroI % HERO.length ? " on" : ""), title:HERO[i].title, onclick:() => { S.heroI = i; draw(); }}))));
  };
  draw();
  clearInterval(S.heroT);
  S.heroT = setInterval(() => { if (!document.body.contains(box)){ clearInterval(S.heroT); return; } if (box.matches(":hover")) return; S.heroI++; draw(); }, 6000);
  return box;
}
function collectionBar(){
  const all = COSM.filter(c => !c.own), have = all.filter(c => owns(S.uid, c.id)).length, pct = Math.round(have / all.length * 100);
  return h("div",{class:"colbar"}, h("div",{class:"colic"}, ic("gem")),
    h("div",{class:"colmain"}, h("div",{class:"coltop"}, h("b",{text:"Your collection"}), h("span",{text:have + " / " + all.length + " items · " + pct + "%"})),
      h("div",{class:"coltrack"}, h("div",{class:"colfill",style:{width:Math.max(2, pct) + "%"}}))));
}
function itemModal(c){
  modal((m, close, bg) => {
    const draw = () => {
      m.innerHTML = "";
      const isB = c.type === "bundle"; const own = isB ? ownsBundleFully(S.uid, c) : owns(S.uid, c.id);
      const on = !isB && equipped(S.uid, c.type) === c.id; const can = sparks(S.uid) >= c.price;
      const acts = h("div",{class:"iacts"});
      if (!own) acts.append(h("button",{class:"btn buy", disabled: !can, onclick:async () => { await buyCosmetic(c.id); }}, c.price ? ["Buy for ", sparkPill(c.price, "inv")] : "Claim for free"),
        !can ? h("div",{class:"note"}, "You have ", sparkPill(sparks(S.uid)), ". ", h("a",{href:"#", onclick:e => { e.preventDefault(); close(); openSparks(); }}, "Get more Sparks →")) : null);
      else if (isB) acts.append(h("div",{class:"note",text:"You own everything in this bundle. Equip each piece below."}));
      else acts.append(on ? h("button",{class:"btn ghost wide", onclick:() => equip(c.type, "")}, "Unequip") : h("button",{class:"btn", onclick:() => equip(c.type, c.id)}, "Equip"));
      m.append(h("button",{class:"ib close",title:"Close (Esc)",onclick:close}, ic("x")),
        h("div",{class:"ibig"}, itemArt(c)),
        h("div",{class:"ibody"},
          h("div",{class:"ikind"}, SLOT_NAME[c.type], itemChip(c)),
          h("h2",{text:c.name}), h("p",{class:"note",style:{fontSize:"14px",marginTop:0},text:c.desc}),
          isB ? h("div",{class:"list"}, c.items.map(i => { const x = COSM_BY[i]; const eq = equipped(S.uid, x.type) === i;
            return h("div",{class:"li"}, h("span",{class:"nm"}, h("b",{text:x.name}), h("span",{class:"s",text:"  · " + SLOT_NAME[x.type]})),
              owns(S.uid, i) ? h("button",{class:"btn small" + (eq ? " ghost" : ""), onclick:() => equip(x.type, eq ? "" : i)}, eq ? "Unequip" : "Equip") : h("span",{class:"s"}, sparkPill(x.price))); })) : null,
          h("div",{class:"iprow"}, priceEl(c)), acts));
    };
    S.paneRefresh = {bg, draw}; draw();
  }, "itemmodal");
}

// ---- Shop page
const SHOP_TABS = [{id:"featured", name:"Featured", ic:"star"}, {id:"deco", name:"Decorations", ic:"user"}, {id:"pfx", name:"Profile Effects", ic:"sparkles"}, {id:"pban", name:"Banners", ic:"image"}, {id:"plate", name:"Nameplates", ic:"pen"}, {id:"bundle", name:"Bundles", ic:"gem"}, {id:"ranks", name:"Ranks & Sparks", ic:"crown"}];
function shopHeaderBar(active){
  const bar = h("div",{class:"shopbar"});
  bar.append(h("span",{class:"sbic"}, ic("bag")));
  SHOP_TABS.forEach(t => bar.appendChild(h("button",{class:"stab" + (active === t.id ? " on" : ""), onclick:() => { S.page = t.id; store("chat", {kind:"shop", id:t.id}); $("msgs").scrollTop = 0; need("msgs"); }}, ic(t.ic, "sm"), t.name)));
  bar.append(h("span",{class:"sp"}),
    active !== "ranks" ? h("label",{class:"ssearch"}, ic("search"), h("input",{placeholder:"Search the shop", value:S.shopQ || "", oninput:e => { S.shopQ = e.target.value; clearTimeout(S.shopQT); S.shopQT = setTimeout(() => { const pos = e.target.selectionStart; need("msgs"); setTimeout(() => { const i = document.querySelector(".ssearch input"); if (i){ i.focus(); i.selectionStart = i.selectionEnd = pos; } }, 0); }, 250); }})) : null,
    active !== "ranks" ? h("button",{class:"swish" + (S.wishOnly ? " on" : ""), title:"Show my wishlist", onclick:() => { S.wishOnly = !S.wishOnly; need("msgs"); }}, ic("heart")) : null,
    h("button",{class:"sbal", title:"Your Sparks — click to buy more", onclick:() => openSparks()}, sparkPill(sparks(S.uid)), h("span",{class:"sbplus"}, ic("plus","sm"))));
  return bar;
}
function filterItems(list){ const q = (S.shopQ || "").toLowerCase().trim();
  return list.filter(c => (!q || c.name.toLowerCase().includes(q) || (c.desc || "").toLowerCase().includes(q)) && (!S.wishOnly || wished(c.id))); }
function shopSection(title, items, tab){
  if (!items.length) return null;
  return h("div",{class:"ssec"}, h("div",{class:"ssh"}, h("h3",{text:title}), tab ? h("button",{class:"seeall", onclick:() => { S.page = tab; $("msgs").scrollTop = 0; need("msgs"); }}, "See all ", ic("chevron","rot")) : null),
    h("div",{class:"igrid"}, items.map(itemCard)));
}
function renderShopPage(box){
  if (prefs.shopSeen !== CAT_V){ prefs.shopSeen = CAT_V; savePrefs(); need("side"); }
  const keep = box.scrollTop; box.innerHTML = "";
  const tab = S.page || "featured";
  const wrap = h("div",{class:"shoppage"}); wrap.appendChild(shopHeaderBar(tab));
  const body = h("div",{class:"sbody"}); wrap.appendChild(body);
  if (tab === "ranks"){ const r = h("div",{class:"ranksinline"}); drawRanks(r, () => need("msgs")); body.appendChild(r); box.appendChild(wrap); box.scrollTop = keep; return; }
  const filtering = (S.shopQ || "").trim() || S.wishOnly;
  if (tab === "featured" && !filtering){
    body.append(heroEl(), collectionBar());
    if (!owns(S.uid, "d_bubble")) body.appendChild(h("div",{class:"freebar", onclick:() => itemModal(COSM_BY.d_bubble)}, previewAvatar("d_bubble", "sm"),
      h("div",{style:{flex:"1"}}, h("b",{text:"Free avatar decoration!"}), h("div",{class:"note",style:{margin:0},text:"Claim the Bubble decoration — on the house."})), h("button",{class:"btn small"}, "Claim")));
    const spot = spotlightItems();
    body.appendChild(h("div",{class:"ssec spot"}, h("div",{class:"ssh"}, h("h3",null, ic("sparkles"), " Today's Spotlight"), h("span",{class:"spottimer"}, ic("hourglass","sm"), " New picks in " + untilNextDay())),
      h("div",{class:"igrid"}, spot.map(itemCard))));
    const categories = [
      { name: "Bundles", items: [BUNDLES[4], BUNDLES[0], BUNDLES[1], BUNDLES[2]].filter(Boolean), type: "bundle" },
      { name: "Avatar Decorations", items: COSM.filter(c => c.type === "deco"), type: "deco" },
      { name: "Animated Banners", items: COSM.filter(c => c.type === "pban"), type: "pban" },
      { name: "Profile Effects", items: COSM.filter(c => c.type === "pfx"), type: "pfx" },
      { name: "Nameplates", items: COSM.filter(c => c.type === "plate"), type: "plate" }
    ];
    categories.forEach(cat => {
      const displayItems = [...cat.items]
        .sort((a, b) => (b.tag === "new" ? 1 : 0) - (a.tag === "new" ? 1 : 0))
        .slice(0, 8);
      if (displayItems.length) body.appendChild(shopSection(cat.name, displayItems, cat.type));
    });
    
    body.appendChild(h("div",{class:"earnbar"}, ic("spark"), h("div",{style:{flex:"1"}}, h("b",{text:"Need more Sparks?"}), h("div",{class:"note",style:{margin:0},text:"You currently have " + sparks(S.uid).toLocaleString() + " Sparks available. Sparks can be used on anything in the Shop."})),
      h("button",{class:"btn small", onclick:() => openSparks()}, "Get Sparks")));
  } else {
    const all = [...BUNDLES, ...COSM];
    const list = filterItems(tab === "featured" ? all : all.filter(c => c.type === tab));
    if (!list.length) {
      body.appendChild(h("div",{class:"empty-note",style:{padding:"60px 20px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:"8px",color:"var(--t2)"}},
        h("div",{style:{transform:"scale(1.5)",marginBottom:"10px"}}, ic(S.wishOnly ? "heart" : "search")),
        h("b",{text: S.wishOnly ? "Your wishlist is empty" : "No matches found", style:{fontSize:"16px",color:"var(--t1)"}}),
        h("div",{text: S.wishOnly ? "Browse the shop and tap the heart on items you love to save them here." : "Try adjusting your search terms to find what you're looking for."})));
    }
    else body.appendChild(h("div",{class:"ssec"}, h("div",{class:"ssh"}, h("h3",{text: tab === "featured" ? (S.wishOnly ? "Wishlist" : "Results") : SHOP_TABS.find(t => t.id === tab).name})), h("div",{class:"igrid"}, list.map(itemCard))));
  }
  box.appendChild(wrap); box.scrollTop = keep;
}

function playShopFanfare(){
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const now = audioCtx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0.001, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.08, now + i * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.35);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(now + i * 0.07); osc.stop(now + i * 0.07 + 0.36);
    });
  } catch (e) {}
}

function shopFireworks(){
  playShopFanfare();
  const old = document.querySelector(".shop-fw-canvas");
  if (old) old.remove();
  const c = document.createElement("canvas");
  c.className = "shop-fw-canvas";
  document.body.appendChild(c);
  const ctx = c.getContext("2d");
  const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
  resize();
  const colors = ["#ff4d6d", "#ffd166", "#06d6a0", "#4cc9f0", "#c77dff", "#ff9e00", "#ffffff"];
  const rockets = [];
  const sparks = [];
  const launch = (delay) => setTimeout(() => {
    if (!c.isConnected) return;
    rockets.push({
      x: c.width * (0.2 + Math.random() * 0.6),
      y: c.height + 10,
      vx: (Math.random() - 0.5) * 3,
      vy: -(c.height * (0.014 + Math.random() * 0.006)),
      targetY: c.height * (0.18 + Math.random() * 0.28),
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }, delay);

  [0, 180, 360, 580, 820].forEach(launch);

  let raf;
  const start = performance.now();
  function tick(now){
    if (now - start > 3200){ c.remove(); return; }
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.globalCompositeOperation = "lighter";

    for (let i = rockets.length - 1; i >= 0; i--){
      const r = rockets[i];
      r.x += r.vx; r.y += r.vy; r.vy *= 0.985;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = r.color;
      ctx.fill();
      if (r.y <= r.targetY || r.vy > -1.5){
        for (let k = 0; k < 42; k++){
          const ang = (Math.PI * 2 * k) / 42 + (Math.random() - 0.5) * 0.2;
          const spd = 2 + Math.random() * 5.5;
          sparks.push({
            x: r.x, y: r.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            alpha: 1,
            decay: 0.015 + Math.random() * 0.015,
            size: 2 + Math.random() * 2.5,
            color: Math.random() > 0.25 ? r.color : "#ffffff"
          });
        }
        rockets.splice(i, 1);
      }
    }

    for (let i = sparks.length - 1; i >= 0; i--){
      const s = sparks[i];
      s.x += s.vx; s.y += s.vy;
      s.vx *= 0.96; s.vy = s.vy * 0.96 + 0.08;
      s.alpha -= s.decay;
      if (s.alpha <= 0){ sparks.splice(i, 1); continue; }
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
}

// ---- Quests page
function renderQuestsPage(box){
  const keep = box.scrollTop; box.innerHTML = "";
  const tab = S.page === "claimed" ? "claimed" : "all";
  const w = wal(S.uid); const done = w.quests || [];
  const wrap = h("div",{class:"shoppage"});
  const bar = h("div",{class:"shopbar"}, h("span",{class:"sbic"}, ic("star")),
    h("button",{class:"stab" + (tab === "all" ? " on" : ""), onclick:() => { S.page = "all"; need("msgs"); }}, "All Quests"),
    h("button",{class:"stab" + (tab === "claimed" ? " on" : ""), onclick:() => { S.page = "claimed"; need("msgs"); }}, "Claimed"),
    h("span",{class:"sp"}), h("button",{class:"sbal", title:"Spend Sparks in the Shop", onclick:() => openChat("shop", "featured")}, sparkPill(sparks(S.uid))));
  wrap.appendChild(bar);
  const body = h("div",{class:"sbody"}); wrap.appendChild(body);
  if (tab === "all") body.appendChild(dailyCardEl());
  if (tab === "all"){
    const qb = BADGES.find(x => x.id === "quest"), st = qb.state(S.uid), n = done.length;
    const nextAt = st && st.tier === "gold" ? null : n < 1 ? 1 : n < 5 ? 5 : n < QUESTS.length ? QUESTS.length : null;
    body.appendChild(h("div",{class:"qhero"},
      h("div",{class:"pfx pfx-confetti"}),
      h("div",{class:"shtext"}, h("span",{class:"ichip"}, ic("star"), "EXPLORER BADGE"), h("h2",{text: st ? "Explorer · " + TIERS[st.tier].name : "Earn the Explorer badge"}),
        h("p",{text: nextAt ? "Finish quests to evolve your badge: Bronze at 1, Silver at 5, Gold when you've done them all. " + (nextAt - n) + " more to the next tier." : "You've maxed out the Explorer badge. Legend."}),
        h("button",{class:"btn", onclick:() => badgeDirectory(S.uid)}, "View my badges")),
      h("div",{class:"qbig qbadge"}, badgeEl(qb, st || {tier:"bronze"}, "xl"))));
  }
  const renderQuestCard = q => {
    const p = questProgress(q), ok = p >= q.goal, claimed = done.includes(q.id);
    return h("div",{class:"qcard" + (ok && !claimed ? " ready" : "") + (claimed ? " claimed" : "")},
      h("div",{class:"qic"}, ic(q.icon)),
      h("div",{class:"qmain"}, h("b",{text:q.name}), h("span",{class:"note",style:{margin:0},text:q.desc}),
        h("div",{class:"qbar"}, h("i",{style:{width:(p / q.goal * 100) + "%"}})), h("span",{class:"qprog",text: p + " / " + q.goal})),
      h("div",{class:"qside"},
        q.reward ? sparkPill(q.reward) : h("span",{class:"qrw", title:"Explorer badge progress"}, ic("star","sm"), " +1"),
        claimed ? h("span",{class:"owned"}, ic("check","sm"), " Claimed") : h("button",{class:"btn small", disabled:!ok, onclick:() => claimQuest(q)}, ok ? "Claim" : "In progress")));
  };

  const dailies = dailyQuests();
  if (tab === "all"){
    const dailyDone = dailies.filter(q => done.includes(q.id)).length;
    body.appendChild(h("div",{class:"ssh"},
      h("h3",{text:"Daily Quests"}),
      h("span",{class:"note",style:{margin:0},text: dailyDone + " of " + dailies.length + " done · New quests in " + untilNextDay()})));
    const dgrid = h("div",{class:"qgrid"});
    dailies.slice().sort((a, b) => (done.includes(a.id) - done.includes(b.id)) || ((questProgress(b) >= b.goal) - (questProgress(a) >= a.goal))).forEach(q => dgrid.appendChild(renderQuestCard(q)));
    body.appendChild(dgrid);
  }

  const permDone = done.filter(id => !id.startsWith("dq_"));
  const list = (tab === "claimed" ? [...dailies, ...QUESTS] : QUESTS)
    .filter(q => tab === "claimed" ? done.includes(q.id) : !done.includes(q.id))
    .sort((a, b) => (questProgress(b) >= b.goal) - (questProgress(a) >= a.goal));
  body.appendChild(h("div",{class:"ssh", style: tab === "all" ? {marginTop:"22px"} : {}},
    h("h3",{text: tab === "claimed" ? "Claimed quests" : "Explorer Quests"}),
    h("span",{class:"note",style:{margin:0},text: permDone.length + " of " + QUESTS.length + " complete"})));
  if (!list.length) body.appendChild(h("div",{class:"empty-note",style:{padding:"30px",textAlign:"center"},text: tab === "claimed" ? "Nothing claimed yet — finish a quest to earn Sparks and grow your Explorer badge." : "You've finished every Explorer quest! Check back tomorrow for fresh Daily Quests."}));
  const grid = h("div",{class:"qgrid"});
  list.forEach(q => grid.appendChild(renderQuestCard(q)));
  body.appendChild(grid);
  body.appendChild(h("p",{class:"note",style:{textAlign:"center",marginTop:"20px"},text:"Complete Daily Quests for Sparks every day, and Explorer Quests to level up your badge!"}));
  box.appendChild(wrap); box.scrollTop = keep;
}

// ---------------------------------------------------------------- profile badges
function ownedCount(uid){ const items = wal(uid).items || []; const set = new Set(); items.forEach(i => { const c = COSM_BY[i]; if (!c) return; if (c.items) c.items.forEach(x => set.add(x)); else set.add(i); }); return set.size; }
// __BADGES__
