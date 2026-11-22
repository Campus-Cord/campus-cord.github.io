// ---------------------------------------------------------------- #daily-poll
// A room of type "poll": no regular chatting, just one new poll every day (midnight Eastern).
// The first person to open the room that day posts it. Its message id is fixed for the day
// ("daily-<day>"), so two people opening it at once can't post it twice.
const DAILY_POLLS = [
  ["Best way to spend a Saturday?", "Gaming all day", "Out with friends", "Sleeping in", "Sports"],
  ["Pizza or burgers?", "Pizza 🍕", "Burgers 🍔"],
  ["Which superpower would you pick?", "Flying", "Invisibility", "Teleporting", "Mind reading"],
  ["Best school subject?", "Math", "Science", "English", "Gym", "Lunch 😂"],
  ["Cats or dogs?", "Cats 🐱", "Dogs 🐶", "Both", "Neither"],
  ["Morning person or night owl?", "Morning ☀️", "Night 🌙"],
  ["Best snack?", "Chips", "Candy", "Fruit", "Cookies"],
  ["If you could live anywhere?", "Beach", "Big city", "Mountains", "Space 🚀"],
  ["Best season?", "Summer", "Fall", "Winter", "Spring"],
  ["Would you rather be able to talk to animals or speak every language?", "Talk to animals", "Every language"],
  ["Favorite way to listen to music?", "Headphones", "Speaker", "In the car", "Live concert"],
  ["Best fast food place?", "McDonald's", "Chick-fil-A", "Taco Bell", "Wendy's", "Chipotle"],
  ["Would you rather never do homework again or never have a test again?", "No homework", "No tests"],
  ["What's the best kind of game?", "Shooters", "Sports games", "Minecraft-type", "Racing", "Board games"],
  ["Ice cream flavor?", "Chocolate", "Vanilla", "Cookies & cream", "Mint chip", "Strawberry"],
  ["Would you rather time travel to the past or the future?", "Past", "Future"],
  ["Best day of the week?", "Friday", "Saturday", "Sunday", "Any day off"],
  ["Hot or cold weather?", "Hot 🔥", "Cold ❄️"],
  ["What would you do with $1,000?", "Save it", "Games/tech", "Clothes/shoes", "Food", "Give some away"],
  ["Best pet that isn't a cat or dog?", "Fish", "Hamster", "Snake", "Bird", "Lizard"],
  ["Would you rather be the funniest or the smartest person in the room?", "Funniest", "Smartest"],
  ["Which would you give up for a month?", "Phone", "Video games", "Sweets", "YouTube"],
  ["Best breakfast?", "Pancakes", "Cereal", "Eggs & bacon", "Waffles", "Skip it"],
  ["Movie night pick?", "Comedy", "Action", "Horror", "Animated"],
  ["Would you rather explore the ocean or outer space?", "Ocean 🌊", "Space 🌌"],
  ["Best sport to watch?", "Football", "Basketball", "Soccer", "Baseball", "Hockey"],
  ["Rate CampusCord today", "10/10 🔥", "Pretty good", "It's okay", "Needs work"],
  ["What should CampusCord add next?", "Group chats", "More games", "More shop items", "More voice stuff"],
];
const isPollRoom = r => !!r && r.type === "poll";
function dailyPollFor(day){ const p = DAILY_POLLS[((day % DAILY_POLLS.length) + DAILY_POLLS.length) % DAILY_POLLS.length]; return {q:p[0], opts:p.slice(1)}; }
const dailyTried = new Set();
async function ensureDailyPoll(r){
  if (!r || !isPollRoom(r) || S.cur !== r.id || !S.roomLoaded) return;
  const day = etDay(), key = r.id + ":" + day;
  if (dailyTried.has(key) || S.msgs.some(m => m.daily === day)) return;
  dailyTried.add(key);
  const id = "daily-" + day, ref = doc(db, "rooms", r.id, "msgs", id);
  try{
    if ((await getDoc(ref)).exists()) return;
    const p = dailyPollFor(day), ts = Date.now();
    await setDoc(ref, {uid:S.uid, text:"📊 Daily Poll: " + p.q, ts, poll:p, daily:day});
    setDoc(doc(db, "meta", r.id), {lastTs:ts, lastUid:S.uid, lastNick:"Daily Poll", lastPreview:"📊 " + p.q, lastMentions:[], lastEveryone:false}).catch(() => {});
  }catch(e){ /* someone else posted it first, or no permission: fine */ }
}

// ================= Daily Mini Games (NYT-style suite) =================
const MG_DAILY_LIMIT = 5;

const MG_META = [
  {
    id: "wordle",
    name: "Wordle",
    badge: "5 LETTERS",
    accent: "#538d4e",
    icon: "🟩",
    tagline: "Guess the hidden 5-letter word in 6 tries.",
    how: [
      "Guess the secret 5-letter word in 6 tries or fewer.",
      "After each guess, tiles flip color to show how close you were:",
      "🟩 Green: The letter is in the word and in the exact right spot.",
      "🟨 Yellow: The letter is in the word, but in a different spot.",
      "⬛ Gray: The letter is not in the word at all.",
      "You get 5 fresh non-repeating words every day from a 950+ word dictionary!"
    ]
  },
  {
    id: "bee",
    name: "Spelling Bee",
    badge: "HONEYCOMB",
    accent: "#eab308",
    icon: "🐝",
    tagline: "Build as many words as you can from 7 hive letters.",
    how: [
      "Create words using only the 7 letters in the honeycomb.",
      "Every word must be at least 4 letters long and MUST include the center gold letter.",
      "Letters can be used more than once in the same word.",
      "4-letter words earn 1 point; longer words earn 1 point per letter.",
      "Pangrams use all 7 letters at least once for a +7 bonus! Hit Finish anytime to reveal all remaining words."
    ]
  },
  {
    id: "sudoku",
    name: "Sudoku",
    badge: "9×9 LOGIC",
    accent: "#3b82f6",
    icon: "🔢",
    tagline: "Fill every row, column, and 3×3 box with digits 1–9.",
    how: [
      "Fill all empty squares with numbers from 1 to 9.",
      "Each horizontal row must contain the numbers 1–9 without repeating.",
      "Each vertical column must contain the numbers 1–9 without repeating.",
      "Each outlined 3×3 box must also contain the numbers 1–9 without repeating.",
      "Use Notes mode to jot down candidate numbers, or Check Mistakes to spot errors."
    ]
  },
  {
    id: "crossword",
    name: "Mini Crossword",
    badge: "5×5 CLUES",
    accent: "#818cf8",
    icon: "✏️",
    tagline: "Solve bite-sized Across and Down trivia clues.",
    how: [
      "Fill in the 5×5 grid using the Across and Down clues.",
      "Click a square to type; click the same square again (or press Space) to switch between Across and Down.",
      "Use Arrow keys to move around the grid and Backspace to clear a letter.",
      "Need a nudge? Use Reveal Letter anytime."
    ]
  }
];

const WORDLE_BANK = [...new Set([
  "ABODE","ABOUT","ABOVE","ACORN","ACRES","ACTED","ACTOR","ACUTE","ADAPT","ADMIT","ADOBE","ADOPT","ADORE","ADULT","AFTER",
  "AGAIN","AGENT","AGILE","AGING","AGONY","AGREE","AHEAD","AIDED","AIMED","ALARM","ALBUM","ALERT","ALGAE","ALIEN","ALIGN",
  "ALIKE","ALIVE","ALLEY","ALLOT","ALLOW","ALLOY","ALONE","ALONG","ALOUD","ALPHA","ALTAR","ALTER","AMBER","AMEND","AMONG",
  "AMPLE","AMUSE","ANGEL","ANGER","ANGLE","ANGRY","ANKLE","APART","APPLE","APPLY","APRON","ARENA","ARGUE","ARISE","ARMOR",
  "AROMA","AROSE","ARRAY","ARROW","ASHES","ASIDE","ASKED","ASSET","ATLAS","ATONE","ATTIC","AUDIO","AUDIT","AVERT","AVOID",
  "AWAKE","AWARD","AWARE","AWFUL","AZURE","BACON","BADGE","BADLY","BAGEL","BAKER","BALLS","BANDS","BANJO","BANKS","BARON",
  "BASED","BASES","BASIC","BASIL","BASIN","BASIS","BATCH","BEACH","BEADS","BEANS","BEARD","BEARS","BEAST","BEATS","BEGIN",
  "BEING","BELOW","BENCH","BERRY","BIRCH","BIRTH","BLACK","BLADE","BLAME","BLANK","BLAST","BLAZE","BLEAK","BLEND","BLESS",
  "BLIND","BLINK","BLOCK","BLOOD","BLOOM","BLOWN","BLUES","BLUNT","BOARD","BOAST","BOATS","BONDS","BONES","BONUS","BOOKS",
  "BOOST","BOOTH","BOOTS","BOUND","BOXER","BOXES","BRAIN","BRAKE","BRAND","BRASS","BRAVE","BREAD","BREAK","BREED","BRICK",
  "BRIDE","BRIEF","BRING","BRISK","BROAD","BROKE","BROOK","BROWN","BRUSH","BUILD","BUILT","BUNCH","BURST","BUYER","CABIN",
  "CABLE","CACHE","CADET","CAKES","CALLS","CAMEL","CAMPS","CANAL","CANDY","CANOE","CARDS","CARGO","CARRY","CARVE","CASES",
  "CATCH","CATER","CAUSE","CEASE","CEDAR","CELLO","CELLS","CHAIN","CHAIR","CHALK","CHAMP","CHANT","CHAOS","CHARM","CHART",
  "CHASE","CHEAP","CHEAT","CHECK","CHEEK","CHEER","CHESS","CHEST","CHIEF","CHILD","CHILI","CHILL","CHINA","CHIPS","CHOIR",
  "CHORD","CHOSE","CHUNK","CIDER","CIGAR","CINCH","CIVIC","CIVIL","CLAIM","CLAMP","CLASH","CLASP","CLASS","CLEAN","CLEAR",
  "CLERK","CLICK","CLIFF","CLIMB","CLING","CLOCK","CLOSE","CLOTH","CLOUD","CLOWN","CLUBS","COACH","COAST","COATS","COCOA",
  "CODES","COINS","COLOR","COMET","COMIC","CORAL","CORDS","CORES","COUCH","COUGH","COULD","COUNT","COURT","COVER","CRACK",
  "CRAFT","CRANE","CRASH","CRATE","CRAVE","CRAWL","CRAZE","CRAZY","CREAK","CREAM","CREEK","CREEP","CREST","CRIME","CRISP",
  "CROSS","CROWD","CROWN","CRUDE","CRUEL","CRUSH","CRUST","CURVE","CYBER","CYCLE","DAILY","DAIRY","DANCE","DATED","DATES",
  "DEALT","DEATH","DEBIT","DEBUG","DEBUT","DECAY","DECOR","DECOY","DELAY","DELTA","DENSE","DEPOT","DEPTH","DERBY","DESKS",
  "DIARY","DIGIT","DINER","DIRTY","DISCO","DITCH","DIVER","DIZZY","DODGE","DOING","DOLLS","DONOR","DONUT","DOORS","DOUBT",
  "DOUGH","DOZEN","DRAFT","DRAIN","DRAMA","DRANK","DRAWN","DRAWS","DREAD","DREAM","DRESS","DRIED","DRIFT","DRILL","DRINK",
  "DRIVE","DRONE","DROPS","DROVE","DRUMS","DRYER","DUCKS","DUNES","DUSTY","DWARF","EAGER","EAGLE","EARLY","EARTH","EASEL",
  "EATEN","EATER","EBONY","EDGES","EDITS","EIGHT","ELBOW","ELDER","ELECT","ELITE","EMBER","EMPTY","ENACT","ENDED","ENEMY",
  "ENJOY","ENTER","ENTRY","EQUAL","EQUIP","ERASE","ERECT","ERROR","ESSAY","ETHER","ETHIC","EVADE","EVENT","EVERY","EXACT",
  "EXAMS","EXCEL","EXERT","EXILE","EXIST","EXTRA","FABLE","FACED","FACES","FACTS","FAINT","FAIRY","FAITH","FALLS","FALSE",
  "FANCY","FARMS","FATAL","FAULT","FAVOR","FEAST","FEATS","FENCE","FERRY","FEVER","FIBER","FIELD","FIERY","FIFTH","FIFTY",
  "FIGHT","FINAL","FINCH","FINDS","FIRED","FIRES","FIRST","FIXED","FLAGS","FLAME","FLANK","FLARE","FLASH","FLASK","FLEET",
  "FLESH","FLICK","FLIES","FLING","FLINT","FLOAT","FLOCK","FLOOD","FLOOR","FLORA","FLOUR","FLOWS","FLUID","FLUSH","FLUTE",
  "FOCUS","FOGGY","FOLKS","FORCE","FORGE","FORMS","FORTH","FORTY","FORUM","FOUND","FRAME","FRANK","FRAUD","FRESH","FRIED",
  "FRONT","FROST","FRUIT","FULLY","FUNDS","FUNNY","FUZZY","GAINS","GAMES","GATES","GAUGE","GEARS","GENIE","GENRE","GHOST",
  "GIANT","GIFTS","GIVEN","GIVES","GLASS","GLEAM","GLIDE","GLOBE","GLOOM","GLORY","GLOSS","GLOVE","GOING","GOLDS","GRACE",
  "GRADE","GRAIN","GRAND","GRANT","GRAPE","GRAPH","GRASP","GRASS","GRAVE","GREAT","GREED","GREEN","GREET","GRIEF","GRILL",
  "GRIND","GROAN","GROOM","GROSS","GROUP","GROVE","GROWL","GROWN","GROWS","GUARD","GUESS","GUEST","GUIDE","GUILD","GUILT",
  "GUSTY","HABIT","HANDS","HANDY","HAPPY","HARDY","HARSH","HASTE","HASTY","HATCH","HAVEN","HEADS","HEARD","HEART","HEAVY",
  "HEDGE","HEELS","HELLO","HENCE","HERBS","HERON","HILLS","HINTS","HOBBY","HOLDS","HOLES","HOLLY","HOMES","HONEY","HONOR",
  "HOPED","HOPES","HORSE","HOTEL","HOURS","HOUSE","HOVER","HUMAN","HUMID","HUMOR","HURRY","IDEAL","IDEAS","IDIOM","IMAGE",
  "IMPLY","INDEX","INDIA","INNER","INPUT","IRATE","IRONY","ISSUE","ITEMS","IVORY","JEANS","JELLY","JEWEL","JOINS","JOINT",
  "JOKER","JOKES","JOLLY","JUDGE","JUICE","JUICY","JUMPS","JUMPY","KAYAK","KEEPS","KILLS","KINDS","KINGS","KNIFE","KNOCK",
  "KNOTS","KNOWN","KNOWS","LABEL","LABOR","LAKES","LAMPS","LANCE","LANDS","LANES","LARGE","LASER","LATER","LATHE","LAUGH",
  "LAYER","LEADS","LEARN","LEASE","LEAST","LEAVE","LEDGE","LEGAL","LEMON","LEVEL","LEVER","LIGHT","LILAC","LIMIT","LINES",
  "LINKS","LIONS","LISTS","LIVED","LIVER","LIVES","LOADS","LOANS","LOCAL","LOCKS","LODGE","LOGIC","LOOKS","LOOSE","LORDS",
  "LOSER","LOVED","LOVER","LOVES","LOWER","LOYAL","LUCKY","LUNAR","LUNCH","LYRIC","MAGIC","MAJOR","MAKER","MAKES","MANGO",
  "MANOR","MAPLE","MARCH","MARKS","MARSH","MATCH","MAYOR","MEALS","MEANS","MEANT","MEDAL","MEDIA","MELON","MERCY","MERGE",
  "MERIT","MERRY","METAL","METER","METRO","MICRO","MIDST","MIGHT","MILES","MINDS","MINER","MINOR","MINUS","MISTY","MIXED",
  "MODEL","MODEM","MOIST","MONEY","MONTH","MORAL","MOTOR","MOUNT","MOUSE","MOUTH","MOVED","MOVER","MOVES","MOVIE","MUDDY",
  "MUSIC","NAILS","NAMED","NAMES","NASTY","NATTY","NAVAL","NEEDS","NERVE","NEVER","NEWER","NEWLY","NIGHT","NINTH","NOBLE",
  "NOISE","NOISY","NOMAD","NORTH","NOTCH","NOTED","NOTES","NOVEL","NURSE","NYLON","OASIS","OCEAN","OCHRE","OFFER","OFTEN",
  "OLIVE","ONION","OPENS","OPERA","ORBIT","ORDER","ORGAN","OTHER","OTTER","OUGHT","OUTER","OWNED","OWNER","OXIDE","OZONE",
  "PACED","PACER","PAGES","PAINT","PAIRS","PANEL","PANIC","PAPER","PARKS","PARTS","PARTY","PASTA","PASTE","PATCH","PATHS",
  "PAUSE","PEACE","PEACH","PEARL","PEDAL","PENNY","PERCH","PERIL","PETAL","PHASE","PHONE","PHOTO","PIANO","PIECE","PILOT",
  "PINCH","PIPES","PITCH","PIXEL","PIZZA","PLACE","PLAIN","PLANE","PLANS","PLANT","PLATE","PLAYS","PLAZA","PLEAD","PLUCK",
  "PLUMB","PLUME","PLUTO","POEMS","POINT","POLAR","POLES","PONDS","PORCH","PORTS","POSED","POSES","POUND","POWER","PRESS",
  "PRICE","PRIDE","PRIME","PRINT","PRIOR","PRISM","PRIZE","PROBE","PROOF","PROSE","PROUD","PROVE","PROXY","PULSE","PUMPS",
  "PUNCH","PUPIL","PURSE","QUARK","QUEEN","QUERY","QUEST","QUEUE","QUICK","QUIET","QUILT","QUITE","QUOTE","RADAR","RADIO",
  "RAILS","RAISE","RALLY","RANCH","RANGE","RANKS","RAPID","RATED","RATES","RATIO","RAVEN","REACH","REACT","READS","READY",
  "REALM","REBEL","REDOS","REFER","REIGN","RELAX","RELAY","RELIC","REMIT","RENEW","REPAY","REPLY","RERUN","RESET","RESTS",
  "RETRO","RIDER","RIDES","RIDGE","RIFLE","RIGHT","RIGID","RINGS","RINSE","RISEN","RISES","RISKS","RISKY","RIVAL","RIVER",
  "ROADS","ROAST","ROBIN","ROBOT","ROCKS","ROCKY","RODEO","ROLES","ROLLS","ROMAN","ROOMS","ROOTS","ROPES","ROSES","ROUGH",
  "ROUND","ROUTE","ROYAL","RULER","RULES","RURAL","RUSTY","SADLY","SAFER","SAINT","SALAD","SALES","SALON","SALTY","SANDY",
  "SATIN","SAUCE","SAVED","SAVER","SAVES","SCALE","SCARE","SCARF","SCARY","SCENE","SCENT","SCOPE","SCORE","SCOUT","SCRAP",
  "SEALS","SEAMS","SEATS","SEEDS","SEEKS","SEEMS","SELLS","SENSE","SERVE","SEVEN","SHADE","SHAFT","SHAKE","SHALL","SHAME",
  "SHAPE","SHARE","SHARK","SHARP","SHEEP","SHEER","SHEET","SHELF","SHELL","SHIFT","SHINE","SHINY","SHIPS","SHIRT","SHOCK",
  "SHOES","SHOOT","SHOPS","SHORE","SHORT","SHOUT","SHOWN","SHOWS","SIDES","SIGHT","SIGNS","SILLY","SINCE","SITES","SIXTH",
  "SIXTY","SIZED","SIZES","SKILL","SKIRT","SKULL","SLATE","SLAVE","SLEEP","SLEPT","SLICE","SLIDE","SLOPE","SMALL","SMART",
  "SMELL","SMILE","SMOKE","SNACK","SNAKE","SNEAK","SNOWY","SOLAR","SOLID","SOLVE","SONAR","SONGS","SONIC","SORRY","SORTS",
  "SOULS","SOUND","SOUTH","SPACE","SPARE","SPARK","SPEAK","SPEED","SPELL","SPEND","SPENT","SPICE","SPICY","SPIKE","SPILL",
  "SPINE","SPLIT","SPOKE","SPORT","SPOTS","SPRAY","SQUAD","SQUID","STACK","STAFF","STAGE","STAIN","STAIR","STAKE","STAMP",
  "STAND","STARE","STARS","START","STATE","STAYS","STEAK","STEAL","STEAM","STEEL","STEEP","STEER","STEMS","STEPS","STICK",
  "STIFF","STILL","STOCK","STONE","STOOD","STOOL","STOPS","STORE","STORM","STORY","STOVE","STRAP","STRAW","STRIP","STUCK",
  "STUDY","STUFF","STYLE","SUGAR","SUITE","SUNNY","SUPER","SURGE","SWAMP","SWARM","SWEAR","SWEAT","SWEEP","SWEET","SWELL",
  "SWEPT","SWIFT","SWING","SWIRL","SWORD","TABLE","TAKEN","TAKES","TALES","TALKS","TANKS","TAPES","TASKS","TASTE","TASTY",
  "TEACH","TEAMS","TEARS","TEENS","TEETH","TEMPO","TENDS","TENOR","TENSE","TENTH","TERMS","TESTS","THANK","THEFT","THEME",
  "THERE","THESE","THICK","THIEF","THING","THINK","THIRD","THORN","THOSE","THREE","THREW","THROW","THUMB","THYME","TIGER",
  "TIGHT","TILES","TIMER","TIMES","TIRED","TITLE","TOAST","TODAY","TOKEN","TONER","TONES","TOOLS","TOPAZ","TOPIC","TORCH",
  "TOTAL","TOUCH","TOUGH","TOURS","TOWEL","TOWER","TOWNS","TOXIC","TRACE","TRACK","TRADE","TRAIL","TRAIN","TRAIT","TRASH",
  "TREAT","TREES","TREND","TRESS","TRIAL","TRIBE","TRICK","TRIED","TRIES","TRIPS","TROOP","TRUCK","TRULY","TRUNK","TRUST",
  "TRUTH","TUBES","TULIP","TUNES","TURNS","TUTOR","TWICE","TWIST","TYPED","TYPES","ULTRA","UNCLE","UNDER","UNFIT","UNION",
  "UNITE","UNITS","UNITY","UNTIL","UPPER","UPSET","URBAN","USAGE","USUAL","VALID","VALUE","VALVE","VAULT","VENUS","VERSE",
  "VIDEO","VIEWS","VINYL","VIRAL","VIRUS","VISIT","VITAL","VIVID","VOCAL","VOICE","VOTES","WAGON","WAIST","WALKS","WALLS",
  "WASTE","WATCH","WATER","WAVES","WEARS","WEARY","WEAVE","WEEKS","WEIGH","WEIRD","WHALE","WHEAT","WHEEL","WHERE","WHICH",
  "WHILE","WHITE","WHOLE","WHOSE","WIDER","WIDTH","WINDS","WINDY","WINGS","WIPER","WIRED","WIRES","WITCH","WOMAN","WOMEN",
  "WOODS","WORDS","WORKS","WORLD","WORRY","WORSE","WORST","WORTH","WOULD","WOUND","WRIST","WRITE","WRONG","WROTE","YACHT",
  "YEARS","YEAST","YIELD","YOUNG","YOUTH","ZEBRA","ZONES"
])].filter(w => w.length === 5);

const BEE_EXTRA_WORDS = [
  "ABLE","ACME","AFAR","ALOE","ANTE","ARCH","ARTS","ATOM","ATTIRE","BAKE","BALE","BALL","BANAL","BANE","BANK","BATE","BEAK",
  "BEAN","BEAT","BEATEN","BEET","BELT","BENT","BETA","BLANKET","BLEAT","CALM","CAME","CAMP","CAPS","CARE","CART","CAST",
  "CATER","CATNIP","CHAPTER","CHAR","CHAT","CHEEK","CHICK","CHICKEN","CHIME","CHIMNEY","CHIN","CITE","CLAN","COAT","COMMA",
  "COMPASS","CORE","COST","CRATE","CREATE","CREATOR","CRYSTAL","CRYSTALS","DAMP","DANGER","DANGERS","DART","DEAR","DEFORM",
  "DEMO","DIAMOND","DING","DOLPHIN","DOMAIN","DOME","DOOM","DOOR","DRAG","DRAGS","DROP","EARL","EARN","EARNS","ETCH",
  "EXPLORE","FACT","FAIR","FANS","FARCE","FAST","FATS","FEED","FIST","FLAT","FOOD","FORD","FORM","FORMED","FORTUNE","FRACT",
  "FREEDOM","FROM","GALE","GANDER","GARDEN","GARDENS","GATE","GAVE","GAVEL","GEAR","GIFT","GOAL","GOAT","GOWN","GRADED",
  "GRADES","HARE","HARM","HARMONY","HARP","HART","HATE","HATER","HEAP","HEAR","HEAT","HEATER","HECTIC","HERE","HERO","HICK",
  "HOARD","HOLD","HOLLOW","HOOD","HOOP","HORN","ICON","IDOL","IMPACT","INAPT","INCH","INCHES","INDOOR","INERTIA","INSECT",
  "INTO","ISLE","ITCH","JOIN","JOURNEY","JUNE","JUNIOR","JURY","KICK","KIND","KING","KINGDOM","KITCHEN","KNOT","KNOW","LACE",
  "LACY","LANE","LANTERN","LAPSE","LATE","LAVE","LEAK","LEAKS","LEAN","LEANS","LEAP","LEAPS","LENS","LIAR","LICE","LICENSE",
  "LIME","LINE","LINEN","LION","LOAD","LOIN","LOOP","LOOPER","LORD","LORE","LOVE","MAID","MAIN","MANY","MAPS","MARE","MARRY",
  "MASS","MAST","MEAL","MENTOR","MENTORS","MESSY","MICE","MILE","MIND","MINI","MINK","MINT","MIRACLE","MOAN","MODE","MONK",
  "MONSTER","MONSTERS","MOOD","MOON","MOONS","MORE","MORN","MORNS","MOSS","MOST","NEAR","NEARS","NEAT","NECK","NETWORK",
  "NEWTON","NEWT","NICE","NICHE","NICK","NINE","NOON","NORM","NORMS","NOTER","OINK","OMEN","OMENS","ONYX","OPEN","OPINION",
  "OPTION","ORATOR","ORCA","ORCHARD","OUTRE","OVAL","PACT","PAIN","PAINTER","PAIR","PALE","PALES","PALEST","PANE","PANELS",
  "PANT","PANTS","PARK","PARKS","PART","PASS","PAST","PASTEL","PATCHER","PATINA","PATIO","PEAK","PEAKS","PEAL","PEALS",
  "PEARLS","PEAT","PEEL","PEER","PERK","PERKS","PERTAIN","PETALS","PHEW","PICNIC","PINION","PINT","PIRATE","PLANES","PLANET",
  "PLANETS","PLANTS","PLATES","PLEA","PLEAS","PLEAT","PLEATS","PLOD","POET","POLE","POND","POOL","PORE","PORTION","POST",
  "PRACTICE","PREY","PROP","PURE","RACE","RACY","RAGE","RAGES","RAIN","RAKE","RAKES","RANGED","RANGES","RANT","RARE","RATE",
  "REACTOR","READ","REAP","REAPS","REBEL","REED","REEL","REIN","REMOTE","REMOTES","RENT","RENTAL","REPAINT","REPEL","RETAIN",
  "RICE","RICH","RIFT","RING","RIOT","RIPE","RIPEN","ROAD","ROAM","ROAR","ROBE","RODE","ROLE","ROOM","ROPE","ROTE","ROYALS",
  "SAFE","SAGE","SALE","SALLY","SALT","SAND","SANG","SCALY","SCAM","SCAMP","SEAL","SEEN","SEND","SHIN","SHREW","SIDE","SIFT",
  "SIGN","SILENCE","SINE","SING","SLANT","SLAP","SLAY","SNAP","SOAP","SOME","SONG","SPAN","SPAT","SPEAKER","SPEAR","SPOT",
  "STAPLE","STAR","STAY","STEM","STOP","STORMS","STRAY","TALE","TALLY","TAPE","TARO","TEAL","TEALS","TEAR","TECH","TERM",
  "TERN","THICK","THICKEN","TICK","TIER","TINY","TIRE","TOME","TOMES","TORE","TORY","TOUR","TOWN","TRAYS","TREE","TRIO",
  "TRIP","TRIPE","TROUT","TRUCE","TRYST","TUNER","VALE","VEAL","VERY","VICE","VOID","VOLT","VOLTAGE","VOTE","WARE","WEAR",
  "WEIR","WENT","WERE","WHAT","WHIP","WHIPS","WHIR","WHIRS","WHISPER","WHISPERS","WINE","WING","WIPE","WIPERS","WIPES","WIRE",
  "WISE","WISER","WISH","WISHER","WISP","WISPS","WOKE","WOKEN","WORE","WORK","WORKER","WORN","YARN","YEAR","YEARLY","YOUR"
];

const BEE_DICT = [...new Set([
  ...WORDLE_BANK,
  ...BEE_EXTRA_WORDS
])].filter(w => /^[A-Z]{4,}$/.test(w) && new Set(w).size <= 7);

const BEE_PANGRAM_SEEDS = (() => {
  const seeds = [];
  const seenSets = new Set();
  for (const w of BEE_DICT){
    const letters = [...new Set(w)].sort();
    if (letters.length !== 7) continue;
    const sig = letters.join("");
    if (seenSets.has(sig)) continue;
    seenSets.add(sig);
    const lset = new Set(letters);
    const sub = BEE_DICT.filter(cand => [...cand].every(ch => lset.has(ch)));
    const bestCount = Math.max(...letters.map(c => sub.filter(cand => cand.includes(c)).length));
    if (bestCount >= 14) seeds.push({ sig, letters });
  }
  return seeds;
})();

function mgBuildBee(day, playNum){
  const seedObj = mgPickFromPool("bee", BEE_PANGRAM_SEEDS, s => s.sig);
  const rng = mgRng(day + ":bee:" + playNum + ":" + (S.uid || "u"));
  const lset = new Set(seedObj.letters);
  const sub = BEE_DICT.filter(w => [...w].every(ch => lset.has(ch)));
  const viableCenters = seedObj.letters.filter(c => sub.filter(w => w.includes(c)).length >= 14);
  const poolCenters = viableCenters.length ? viableCenters : seedObj.letters;
  const center = poolCenters[Math.floor(rng() * poolCenters.length)];
  const valid = sub.filter(w => w.includes(center)).sort();
  const outer = seedObj.letters.filter(ch => ch !== center).sort(() => rng() - 0.5);
  return {
    day,
    playNum,
    id: seedObj.sig + "_" + center,
    center,
    outer,
    valid,
    found: [],
    cur: "",
    done: false
  };
}

const CROSS_BANK = [
  {
    id: "cw_heart",
    grid: ["HEART","EMBER","ABODE","REDOS","TRESS"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Organ that pumps blood" },
      { n: 2, r: 1, c: 0, clue: "Glowing coal in a campfire" },
      { n: 3, r: 2, c: 0, clue: "Humble home or dwelling" },
      { n: 4, r: 3, c: 0, clue: "Fresh room makeovers" },
      { n: 5, r: 4, c: 0, clue: "Long lock of hair" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Red playing card suit" },
      { n: 2, r: 0, c: 1, clue: "Fading spark of a fire" },
      { n: 3, r: 0, c: 2, clue: "Place of residence" },
      { n: 4, r: 0, c: 3, clue: "Second attempts" },
      { n: 5, r: 0, c: 4, clue: "Braided strand" }
    ]
  },
  {
    id: "cw_crane",
    grid: ["CRANE","RAVEN","AVERT","NERVE","ENTER"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Tall wading bird or lifting machine" },
      { n: 2, r: 1, c: 0, clue: "Edgar Allan Poe's famous bird" },
      { n: 3, r: 2, c: 0, clue: "Turn away, as one's gaze" },
      { n: 4, r: 3, c: 0, clue: "Courage or boldness" },
      { n: 5, r: 4, c: 0, clue: "Keyboard return key" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Origami paper bird" },
      { n: 2, r: 0, c: 1, clue: "Glossy black crow cousin" },
      { n: 3, r: 0, c: 2, clue: "Prevent from happening" },
      { n: 4, r: 0, c: 3, clue: "Body's signal fiber" },
      { n: 5, r: 0, c: 4, clue: "Step inside a room" }
    ]
  },
  {
    id: "cw_brave",
    grid: ["BRAVE","RAVEN","AVERT","VERSE","ENTER"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Courageous and fearless" },
      { n: 2, r: 1, c: 0, clue: "Jet-black bird" },
      { n: 3, r: 2, c: 0, clue: "Ward off danger" },
      { n: 4, r: 3, c: 0, clue: "Stanza of a song or poem" },
      { n: 5, r: 4, c: 0, clue: "Walk through the door" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Pixar Scottish princess movie" },
      { n: 2, r: 0, c: 1, clue: "Midnight-feathered bird" },
      { n: 3, r: 0, c: 2, clue: "Look away" },
      { n: 4, r: 0, c: 3, clue: "Lines of poetry" },
      { n: 5, r: 0, c: 4, clue: "Go inside" }
    ]
  },
  {
    id: "cw_satin",
    grid: ["SATIN","ARENA","TENET","INERT","NATTY"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Smooth, glossy fabric" },
      { n: 2, r: 1, c: 0, clue: "Concert or sports stadium" },
      { n: 3, r: 2, c: 0, clue: "Core principle or belief" },
      { n: 4, r: 3, c: 0, clue: "Chemically unreactive, like neon" },
      { n: 5, r: 4, c: 0, clue: "Dressed sharply and neatly" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Silky ribbon material" },
      { n: 2, r: 0, c: 1, clue: "Basketball venue" },
      { n: 3, r: 0, c: 2, clue: "2020 Christopher Nolan sci-fi film" },
      { n: 4, r: 0, c: 3, clue: "Motionless or inactive" },
      { n: 5, r: 0, c: 4, clue: "Dapper and stylish" }
    ]
  },
  {
    id: "cw_magic",
    grid: ["MAGIC","ALONE","GOLDS","INDIA","CESAR"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Wizardry and illusions" },
      { n: 2, r: 1, c: 0, clue: "Solo, by oneself" },
      { n: 3, r: 2, c: 0, clue: "First-place Olympic medals" },
      { n: 4, r: 3, c: 0, clue: "Home of the Taj Mahal" },
      { n: 5, r: 4, c: 0, clue: "___ salad (romaine classic)" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Card tricks and spells" },
      { n: 2, r: 0, c: 1, clue: "Without company" },
      { n: 3, r: 0, c: 2, clue: "Top podium prizes" },
      { n: 4, r: 0, c: 3, clue: "New Delhi's nation" },
      { n: 5, r: 0, c: 4, clue: "Famous salad dressing namesake" }
    ]
  },
  {
    id: "cw_panic",
    grid: ["PANIC","AROMA","NOMAD","IMAGE","CADET"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Sudden burst of alarm" },
      { n: 2, r: 1, c: 0, clue: "Delicious baking scent" },
      { n: 3, r: 2, c: 0, clue: "Wandering desert traveler" },
      { n: 4, r: 3, c: 0, clue: "Picture or reflection" },
      { n: 5, r: 4, c: 0, clue: "Military academy trainee" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "___! At the Disco" },
      { n: 2, r: 0, c: 1, clue: "Fragrant coffee smell" },
      { n: 3, r: 0, c: 2, clue: "Person with no fixed home" },
      { n: 4, r: 0, c: 3, clue: "Snapshot or photo" },
      { n: 5, r: 0, c: 4, clue: "Space ___ (rookie)" }
    ]
  },
  {
    id: "cw_smart",
    grid: ["SMART","MANOR","ANGLE","ROLES","TRESS"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Clever and quick-witted" },
      { n: 2, r: 1, c: 0, clue: "Grand historic estate" },
      { n: 3, r: 2, c: 0, clue: "90 degrees, for a right corner" },
      { n: 4, r: 3, c: 0, clue: "Parts played by movie actors" },
      { n: 5, r: 4, c: 0, clue: "Lock of hair" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Brainy" },
      { n: 2, r: 0, c: 1, clue: "Stately mansion" },
      { n: 3, r: 0, c: 2, clue: "Geometry corner" },
      { n: 4, r: 0, c: 3, clue: "Cast assignments" },
      { n: 5, r: 0, c: 4, clue: "Flowing hair strand" }
    ]
  },
  {
    id: "cw_above",
    grid: ["ABOVE","BARON","ORBIT","VOICE","ENTER"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Overhead or higher than" },
      { n: 2, r: 1, c: 0, clue: "Nobleman rank" },
      { n: 3, r: 2, c: 0, clue: "Planet's path around a star" },
      { n: 4, r: 3, c: 0, clue: "Singing sound" },
      { n: 5, r: 4, c: 0, clue: "Go inside" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "On top of" },
      { n: 2, r: 0, c: 1, clue: "Aristocrat title" },
      { n: 3, r: 0, c: 2, clue: "Satellite loop" },
      { n: 4, r: 0, c: 3, clue: "Vocal tone" },
      { n: 5, r: 0, c: 4, clue: "Step through the doorway" }
    ]
  },
  {
    id: "cw_acres",
    grid: ["ACRES","CHINA","RIVAL","ENACT","SALTY"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Units of farmland" },
      { n: 2, r: 1, c: 0, clue: "Fine porcelain tableware" },
      { n: 3, r: 2, c: 0, clue: "Direct competitor" },
      { n: 4, r: 3, c: 0, clue: "Pass into law" },
      { n: 5, r: 4, c: 0, clue: "Like ocean water or pretzels" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Plots of land" },
      { n: 2, r: 0, c: 1, clue: "Beijing's country" },
      { n: 3, r: 0, c: 2, clue: "Arch-opponent" },
      { n: 4, r: 0, c: 3, clue: "Put a bill into effect" },
      { n: 5, r: 0, c: 4, clue: "Seasoned with NaCl" }
    ]
  },
  {
    id: "cw_acted",
    grid: ["ACTED","CHILI","TIGER","ELECT","DIRTY"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Performed in a play" },
      { n: 2, r: 1, c: 0, clue: "Spicy bowl of beans and beef" },
      { n: 3, r: 2, c: 0, clue: "Striped jungle big cat" },
      { n: 4, r: 3, c: 0, clue: "Choose by voting" },
      { n: 5, r: 4, c: 0, clue: "Covered in mud" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Took action" },
      { n: 2, r: 0, c: 1, clue: "Hot pepper stew" },
      { n: 3, r: 0, c: 2, clue: "Bengal predator" },
      { n: 4, r: 0, c: 3, clue: "Vote into office" },
      { n: 5, r: 0, c: 4, clue: "Needing laundry" }
    ]
  },
  {
    id: "cw_adapt",
    grid: ["ADAPT","DONOR","ANGLE","POLES","TRESS"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Adjust to new conditions" },
      { n: 2, r: 1, c: 0, clue: "Charity contributor" },
      { n: 3, r: 2, c: 0, clue: "Corner measured in degrees" },
      { n: 4, r: 3, c: 0, clue: "North and South extremes" },
      { n: 5, r: 4, c: 0, clue: "Lock of hair" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Evolve to fit" },
      { n: 2, r: 0, c: 1, clue: "Blood drive giver" },
      { n: 3, r: 0, c: 2, clue: "Triangle vertex" },
      { n: 4, r: 0, c: 3, clue: "Flagstaffs" },
      { n: 5, r: 0, c: 4, clue: "Braided strand" }
    ]
  },
  {
    id: "cw_after",
    grid: ["AFTER","FLARE","TAKES","ERECT","RESTS"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Following in time" },
      { n: 2, r: 1, c: 0, clue: "Bright emergency signal light" },
      { n: 3, r: 2, c: 0, clue: "Movie scene attempts" },
      { n: 4, r: 3, c: 0, clue: "Build upright" },
      { n: 5, r: 4, c: 0, clue: "Takes a breather" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Later than" },
      { n: 2, r: 0, c: 1, clue: "Solar burst" },
      { n: 3, r: 0, c: 2, clue: "Grabs hold of" },
      { n: 4, r: 0, c: 3, clue: "Construct tall" },
      { n: 5, r: 0, c: 4, clue: "Relaxes" }
    ]
  },
  {
    id: "cw_agree",
    grid: ["AGREE","GRILL","RIGID","ELITE","ELDER"],
    across: [
      { n: 1, r: 0, c: 0, clue: "See eye to eye" },
      { n: 2, r: 1, c: 0, clue: "Backyard barbecue cooker" },
      { n: 3, r: 2, c: 0, clue: "Stiff and inflexible" },
      { n: 4, r: 3, c: 0, clue: "Top-tier group" },
      { n: 5, r: 4, c: 0, clue: "Older community member" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Say 'yes' to a deal" },
      { n: 2, r: 0, c: 1, clue: "Cook burgers over flame" },
      { n: 3, r: 0, c: 2, clue: "Unbending" },
      { n: 4, r: 0, c: 3, clue: "Best of the best" },
      { n: 5, r: 0, c: 4, clue: "Senior" }
    ]
  },
  {
    id: "cw_alert",
    grid: ["ALERT","LEVER","EVADE","REDOS","TRESS"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Wide awake and watchful" },
      { n: 2, r: 1, c: 0, clue: "Prying bar or switch handle" },
      { n: 3, r: 2, c: 0, clue: "Dodge or slip away from" },
      { n: 4, r: 3, c: 0, clue: "Second attempts" },
      { n: 5, r: 4, c: 0, clue: "Long strand of hair" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Warning notification" },
      { n: 2, r: 0, c: 1, clue: "Simple fulcrum machine" },
      { n: 3, r: 0, c: 2, clue: "Elude capture" },
      { n: 4, r: 0, c: 3, clue: "Fresh starts" },
      { n: 5, r: 0, c: 4, clue: "Flowing hair lock" }
    ]
  },
  {
    id: "cw_altar",
    grid: ["ALTAR","LARGE","TRAIN","AGILE","RENEW"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Wedding ceremony table" },
      { n: 2, r: 1, c: 0, clue: "Big in size" },
      { n: 3, r: 2, c: 0, clue: "Locomotive on rails" },
      { n: 4, r: 3, c: 0, clue: "Nimble and quick" },
      { n: 5, r: 4, c: 0, clue: "Extend a subscription" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Sanctuary table" },
      { n: 2, r: 0, c: 1, clue: "Oversized" },
      { n: 3, r: 0, c: 2, clue: "Practice for a sport" },
      { n: 4, r: 0, c: 3, clue: "Acrobatic" },
      { n: 5, r: 0, c: 4, clue: "Refresh" }
    ]
  },
  {
    id: "cw_amend",
    grid: ["AMEND","MINER","ENTRY","NERVE","DRYER"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Revise or improve a law" },
      { n: 2, r: 1, c: 0, clue: "Underground coal digger" },
      { n: 3, r: 2, c: 0, clue: "Doorway or contest submission" },
      { n: 4, r: 3, c: 0, clue: "Boldness or signal fiber" },
      { n: 5, r: 4, c: 0, clue: "Laundry room appliance" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Modify text" },
      { n: 2, r: 0, c: 1, clue: "Gold rush worker" },
      { n: 3, r: 0, c: 2, clue: "Way in" },
      { n: 4, r: 0, c: 3, clue: "Courage" },
      { n: 5, r: 0, c: 4, clue: "Machine paired with a washer" }
    ]
  },
  {
    id: "cw_anger",
    grid: ["ANGER","NERVE","GROAN","EVADE","RENEW"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Fury or wrath" },
      { n: 2, r: 1, c: 0, clue: "Sheer audacity" },
      { n: 3, r: 2, c: 0, clue: "Moan at a bad pun" },
      { n: 4, r: 3, c: 0, clue: "Avoid artfully" },
      { n: 5, r: 4, c: 0, clue: "Sign up again" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Strong irritation" },
      { n: 2, r: 0, c: 1, clue: "Optic ___" },
      { n: 3, r: 0, c: 2, clue: "Dad-joke reaction" },
      { n: 4, r: 0, c: 3, clue: "Sidestep" },
      { n: 5, r: 0, c: 4, clue: "Keep a library book longer" }
    ]
  },
  {
    id: "cw_apart",
    grid: ["APART","POLAR","ALIVE","RAVEN","TREND"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Separated by distance" },
      { n: 2, r: 1, c: 0, clue: "___ bear (Arctic swimmer)" },
      { n: 3, r: 2, c: 0, clue: "Full of life" },
      { n: 4, r: 3, c: 0, clue: "Poe's 'Nevermore' bird" },
      { n: 5, r: 4, c: 0, clue: "Viral social media craze" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "In separate pieces" },
      { n: 2, r: 0, c: 1, clue: "Relating to North or South Pole" },
      { n: 3, r: 0, c: 2, clue: "Breathing and active" },
      { n: 4, r: 0, c: 3, clue: "Glossy black bird" },
      { n: 5, r: 0, c: 4, clue: "Popular fashion direction" }
    ]
  },
  {
    id: "cw_argue",
    grid: ["ARGUE","RAILS","GIFTS","ULTRA","ESSAY"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Debate back and forth" },
      { n: 2, r: 1, c: 0, clue: "Steel train tracks" },
      { n: 3, r: 2, c: 0, clue: "Birthday presents" },
      { n: 4, r: 3, c: 0, clue: "Extreme or super" },
      { n: 5, r: 4, c: 0, clue: "Written school paper" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Disagree verbally" },
      { n: 2, r: 0, c: 1, clue: "Staircase banisters" },
      { n: 3, r: 0, c: 2, clue: "Wrapped boxes" },
      { n: 4, r: 0, c: 3, clue: "___-violet light" },
      { n: 5, r: 0, c: 4, clue: "Opinion article" }
    ]
  },
  {
    id: "cw_arose",
    grid: ["AROSE","RELAX","OLIVE","SAVER","EXERT"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Got up from bed" },
      { n: 2, r: 1, c: 0, clue: "Kick back and chill" },
      { n: 3, r: 2, c: 0, clue: "Green pizza topping" },
      { n: 4, r: 3, c: 0, clue: "Person who puts money away" },
      { n: 5, r: 4, c: 0, clue: "Put forth physical effort" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Emerged or stood up" },
      { n: 2, r: 0, c: 1, clue: "Unwind after class" },
      { n: 3, r: 0, c: 2, clue: "___ oil" },
      { n: 4, r: 0, c: 3, clue: "Thrifty spender" },
      { n: 5, r: 0, c: 4, clue: "Apply force" }
    ]
  },
  {
    id: "cw_ashes",
    grid: ["ASHES","STEAL","HEDGE","EAGLE","SLEEP"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Fireplace cinders" },
      { n: 2, r: 1, c: 0, clue: "Swipe or take without asking" },
      { n: 3, r: 2, c: 0, clue: "Trimmed garden bush wall" },
      { n: 4, r: 3, c: 0, clue: "Bald ___ (national bird)" },
      { n: 5, r: 4, c: 0, clue: "Nightly slumber" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Campfire residue" },
      { n: 2, r: 0, c: 1, clue: "Incredible bargain" },
      { n: 3, r: 0, c: 2, clue: "Shrubbery border" },
      { n: 4, r: 0, c: 3, clue: "Soaring raptor" },
      { n: 5, r: 0, c: 4, clue: "Catch some Z's" }
    ]
  },
  {
    id: "cw_chess",
    grid: ["CHESS","HELLO","ELBOW","SLOPE","SOWER"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Game of checkmate" },
      { n: 2, r: 1, c: 0, clue: "Friendly greeting" },
      { n: 3, r: 2, c: 0, clue: "Arm bend joint" },
      { n: 4, r: 3, c: 0, clue: "Ski mountain trail" },
      { n: 5, r: 4, c: 0, clue: "Farmer scattering seeds" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "64-square strategy game" },
      { n: 2, r: 0, c: 1, clue: "'Hi there!'" },
      { n: 3, r: 0, c: 2, clue: "Funny bone spot" },
      { n: 4, r: 0, c: 3, clue: "Hill incline" },
      { n: 5, r: 0, c: 4, clue: "Seed planter" }
    ]
  },
  {
    id: "cw_toast",
    grid: ["TOAST","ORDER","ADORE","SERVE","TREES"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Crisp browned bread" },
      { n: 2, r: 1, c: 0, clue: "Restaurant food request" },
      { n: 3, r: 2, c: 0, clue: "Love dearly" },
      { n: 4, r: 3, c: 0, clue: "Start a tennis point" },
      { n: 5, r: 4, c: 0, clue: "Oaks and maples" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Clink glasses in celebration" },
      { n: 2, r: 0, c: 1, clue: "Neat sequence" },
      { n: 3, r: 0, c: 2, clue: "Cherish deeply" },
      { n: 4, r: 0, c: 3, clue: "Dish out dinner" },
      { n: 5, r: 0, c: 4, clue: "Forest canopy" }
    ]
  },
  {
    id: "cw_dream",
    grid: ["DREAM","RODEO","EDITS","AEONS","MOSSY"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Sleeping vision or big goal" },
      { n: 2, r: 1, c: 0, clue: "Cowboy bull-riding event" },
      { n: 3, r: 2, c: 0, clue: "Polishes a rough draft" },
      { n: 4, r: 3, c: 0, clue: "Billions of years" },
      { n: 5, r: 4, c: 0, clue: "Covered in soft green forest growth" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Day___ (wander in thought)" },
      { n: 2, r: 0, c: 1, clue: "Wild West show" },
      { n: 3, r: 0, c: 2, clue: "Fixes typos" },
      { n: 4, r: 0, c: 3, clue: "Vast ages of time" },
      { n: 5, r: 0, c: 4, clue: "Velvety green like damp rocks" }
    ]
  },
  {
    id: "cw_laser",
    grid: ["LASER","ABODE","SOFAS","EDICT","RESTS"],
    across: [
      { n: 1, r: 0, c: 0, clue: "Focused beam of light" },
      { n: 2, r: 1, c: 0, clue: "Home sweet home" },
      { n: 3, r: 2, c: 0, clue: "Living room couches" },
      { n: 4, r: 3, c: 0, clue: "Official royal decree" },
      { n: 5, r: 4, c: 0, clue: "Takes a nap" }
    ],
    down: [
      { n: 1, r: 0, c: 0, clue: "Sci-fi light beam" },
      { n: 2, r: 0, c: 1, clue: "Dwelling place" },
      { n: 3, r: 0, c: 2, clue: "Plush couches" },
      { n: 4, r: 0, c: 3, clue: "Formal proclamation" },
      { n: 5, r: 0, c: 4, clue: "Relaxes" }
    ]
  }
];

function ensureMgStyles(){
  if (document.getElementById("mg-styles")) return;
  const st = document.createElement("style");
  st.id = "mg-styles";
  st.textContent = `
    .mg-wrap { max-width: 960px; margin: 0 auto; padding: 22px 18px 40px; }
    .mg-hero { background: linear-gradient(135deg, rgba(88,101,242,.22), rgba(234,179,8,.14)); border: 1px solid rgba(255,255,255,.1); border-radius: 16px; padding: 22px 24px; margin-bottom: 20px; }
    .mg-hero-badge { display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: .08em; padding: 4px 10px; border-radius: 999px; background: rgba(255,255,255,.1); margin-bottom: 8px; }
    .mg-hero h2 { margin: 0 0 6px; font-size: 24px; }
    .mg-hero p { margin: 0 0 12px; color: var(--t2); font-size: 14px; }
    .mg-hub-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
    .mg-card { background: var(--b2); border: 1px solid rgba(255,255,255,.08); border-top: 4px solid var(--mg-accent, #5865f2); border-radius: 14px; padding: 16px; cursor: pointer; display: flex; flex-direction: column; gap: 10px; transition: transform .15s ease, border-color .15s ease; }
    .mg-card:hover { transform: translateY(-3px); border-color: var(--mg-accent, #5865f2); }
    .mg-card-top { display: flex; align-items: center; justify-content: space-between; }
    .mg-card-icon { font-size: 28px; }
    .mg-card-tag { font-size: 10px; font-weight: 800; letter-spacing: .06em; padding: 3px 8px; border-radius: 999px; background: rgba(255,255,255,.08); color: var(--t2); }
    .mg-card h3 { margin: 0; font-size: 18px; }
    .mg-card p { margin: 0; font-size: 13px; color: var(--t2); flex: 1; }
    .mg-card-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px; color: var(--t2); }
    .mg-card-btns { display: flex; gap: 8px; margin-top: 4px; }
    .mg-pips { display: inline-flex; gap: 4px; }
    .mg-pip { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,.5); }
    .mg-pip.used { background: rgba(255,255,255,.18); box-shadow: none; }
    .mg-topbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding-bottom: 14px; margin-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,.08); }
    .mg-toptitle { display: flex; align-items: center; gap: 8px; font-size: 17px; }
    .mg-pill { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; background: rgba(255,255,255,.08); color: var(--t2); }
    .mg-topright { display: flex; align-items: center; gap: 10px; }
    .mg-how-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
    .mg-how-item { background: rgba(255,255,255,.05); padding: 9px 12px; border-radius: 9px; font-size: 13.5px; line-height: 1.4; }
    .mg-result { background: var(--b2); border: 1px solid rgba(255,255,255,.12); border-radius: 12px; padding: 14px 16px; margin: 14px auto; max-width: 440px; text-align: center; display: flex; flex-direction: column; gap: 10px; }
    .mg-res-btns { display: flex; justify-content: center; align-items: center; gap: 8px; flex-wrap: wrap; }
    .mg-done-box { background: var(--b2); border-radius: 14px; padding: 32px; text-align: center; }
    .wd-board { display: flex; flex-direction: column; gap: 6px; align-items: center; margin-bottom: 18px; }
    .wd-row { display: flex; gap: 6px; }
    .wd-tile { width: 52px; height: 52px; border: 2px solid rgba(255,255,255,.16); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; text-transform: uppercase; transition: transform .12s ease, background .25s ease; }
    .wd-tile.filled { border-color: rgba(255,255,255,.45); transform: scale(1.04); }
    .wd-tile.correct { background: #538d4e; border-color: #538d4e; color: #fff; }
    .wd-tile.present { background: #b59f3b; border-color: #b59f3b; color: #fff; }
    .wd-tile.absent { background: #3a3a3c; border-color: #3a3a3c; color: #d4d4d8; }
    .wd-kb { display: flex; flex-direction: column; gap: 6px; align-items: center; }
    .wd-kb-row { display: flex; gap: 5px; }
    .wd-key { min-width: 34px; height: 44px; padding: 0 8px; border: none; border-radius: 7px; background: rgba(255,255,255,.14); color: var(--t1); font-weight: 700; font-size: 13px; cursor: pointer; }
    .wd-key:hover { filter: brightness(1.15); }
    .wd-key.wide { min-width: 56px; font-size: 11px; }
    .wd-key.correct { background: #538d4e; color: #fff; }
    .wd-key.present { background: #b59f3b; color: #fff; }
    .wd-key.absent { background: #27272a; color: #71717a; }
    .bee-layout { display: grid; grid-template-columns: 1fr 270px; gap: 20px; align-items: start; }
    @media (max-width: 720px) { .bee-layout { grid-template-columns: 1fr; } }
    .bee-left { display: flex; flex-direction: column; align-items: center; gap: 14px; }
    .bee-rank { width: 100%; max-width: 340px; }
    .bee-rank-top { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; }
    .bee-bar { height: 8px; border-radius: 999px; background: rgba(255,255,255,.1); overflow: hidden; }
    .bee-bar-fill { height: 100%; background: #eab308; transition: width .25s ease; }
    .bee-typed { min-height: 36px; font-size: 26px; font-weight: 800; letter-spacing: .08em; display: flex; align-items: center; justify-content: center; }
    .bee-placeholder { font-size: 14px; font-weight: 500; letter-spacing: 0; color: var(--t2); }
    .bee-ch-center { color: #eab308; }
    .bee-hive { position: relative; width: 230px; height: 220px; margin: 4px 0; }
    .bee-hex { position: absolute; width: 74px; height: 66px; left: 78px; top: 77px; border: none; background: rgba(255,255,255,.14); color: var(--t1); font-size: 22px; font-weight: 800; cursor: pointer; clip-path: polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0% 50%); transition: transform .1s ease; }
    .bee-hex:hover { filter: brightness(1.15); }
    .bee-hex.center { background: #eab308; color: #111; }
    .bee-hex.pos-1 { transform: translate(0, -70px); }
    .bee-hex.pos-2 { transform: translate(60px, -35px); }
    .bee-hex.pos-3 { transform: translate(60px, 35px); }
    .bee-hex.pos-4 { transform: translate(0, 70px); }
    .bee-hex.pos-5 { transform: translate(-60px, 35px); }
    .bee-hex.pos-6 { transform: translate(-60px, -35px); }
    .bee-controls { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
    .bee-right { background: var(--b2); border: 1px solid rgba(255,255,255,.08); border-radius: 12px; padding: 14px; min-height: 220px; }
    .bee-found-hdr { font-size: 13px; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,.08); }
    .bee-words { display: flex; flex-wrap: wrap; gap: 6px; }
    .bee-word { font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 6px; background: rgba(255,255,255,.08); }
    .bee-word.pan { background: rgba(234,179,8,.22); color: #fde047; border: 1px solid rgba(234,179,8,.45); }
    .bee-word.missed { opacity: .55; }
    .sdk-layout { display: flex; gap: 22px; justify-content: center; align-items: flex-start; flex-wrap: wrap; }
    .sdk-grid { display: grid; grid-template-columns: repeat(9, 40px); grid-template-rows: repeat(9, 40px); border: 2px solid rgba(255,255,255,.45); border-radius: 8px; overflow: hidden; background: var(--b2); }
    @media (max-width: 480px) { .sdk-grid { grid-template-columns: repeat(9, 34px); grid-template-rows: repeat(9, 34px); } }
    .sdk-cell { border-right: 1px solid rgba(255,255,255,.12); border-bottom: 1px solid rgba(255,255,255,.12); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #60a5fa; cursor: pointer; user-select: none; }
    .sdk-cell.given { color: var(--t1); font-weight: 800; }
    .sdk-cell.peer { background: rgba(255,255,255,.04); }
    .sdk-cell.samenum { background: rgba(59,130,246,.22); }
    .sdk-cell.sel { background: rgba(59,130,246,.42); }
    .sdk-cell.bad { background: rgba(239,68,68,.35); color: #fca5a5; }
    .sdk-cell.b-right { border-right: 2px solid rgba(255,255,255,.45); }
    .sdk-cell.b-bottom { border-bottom: 2px solid rgba(255,255,255,.45); }
    .sdk-notes { display: grid; grid-template-columns: repeat(3, 1fr); width: 100%; height: 100%; font-size: 9px; line-height: 1; color: var(--t2); align-items: center; justify-items: center; }
    .sdk-side { display: flex; flex-direction: column; gap: 12px; min-width: 210px; }
    .sdk-pad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
    .sdk-num { height: 44px; border: 1px solid rgba(255,255,255,.12); border-radius: 9px; background: var(--b2); color: var(--t1); font-size: 18px; font-weight: 800; cursor: pointer; }
    .sdk-num:hover { background: rgba(59,130,246,.25); }
    .sdk-tools { display: flex; flex-direction: column; gap: 6px; }
    .cw-layout { display: grid; grid-template-columns: auto 1fr; gap: 22px; align-items: start; }
    @media (max-width: 680px) { .cw-layout { grid-template-columns: 1fr; } }
    .cw-left { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .cw-banner { background: rgba(129,140,248,.18); border: 1px solid rgba(129,140,248,.35); padding: 8px 12px; border-radius: 9px; font-size: 13px; max-width: 290px; text-align: center; }
    .cw-grid { display: grid; grid-template-columns: repeat(5, 52px); grid-template-rows: repeat(5, 52px); border: 2px solid rgba(255,255,255,.45); border-radius: 8px; overflow: hidden; background: var(--b2); }
    .cw-cell { position: relative; border-right: 1px solid rgba(255,255,255,.18); border-bottom: 1px solid rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center; cursor: pointer; user-select: none; }
    .cw-cell.word { background: rgba(129,140,248,.16); }
    .cw-cell.sel { background: rgba(129,140,248,.42); }
    .cw-num { position: absolute; top: 3px; left: 5px; font-size: 10px; font-weight: 700; color: var(--t2); }
    .cw-let { font-size: 22px; font-weight: 800; }
    .cw-tools { display: flex; gap: 8px; }
    .cw-clues { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: var(--b2); border: 1px solid rgba(255,255,255,.08); border-radius: 12px; padding: 14px; }
    .cw-col h4 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: var(--t2); }
    .cw-clue { font-size: 13px; padding: 5px 7px; border-radius: 6px; cursor: pointer; margin-bottom: 3px; }
    .cw-clue:hover { background: rgba(255,255,255,.06); }
    .cw-clue.on { background: rgba(129,140,248,.25); font-weight: 600; }
  `;
  document.head.appendChild(st);
}

function mgReadStore(k){
  if (typeof store === "function") return store(k);
  try { return JSON.parse(localStorage.getItem(k) || "null"); } catch(e){ return null; }
}

function mgWriteStore(k, v){
  if (typeof store === "function"){ store(k, v); return; }
  try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){}
}

function mgCopyText(txt, msg){
  if (typeof copy === "function"){ copy(txt, msg); return; }
  if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => toast(msg || "Copied!")).catch(() => toast("Couldn't copy"));
}

function mgShowModal(buildFn){
  if (typeof modal === "function"){ modal(buildFn); return; }
  const bg = h("div",{class:"mbg",onclick:e => { if (e.target === bg) bg.remove(); }});
  const box = h("div",{class:"modal"});
  buildFn(box, () => bg.remove());
  bg.appendChild(box);
  document.body.appendChild(bg);
}

function mgHash(str){
  let h1 = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++){
    h1 ^= str.charCodeAt(i);
    h1 = Math.imul(h1, 16777619);
  }
  return h1 >>> 0;
}

function mgRng(seedStr){
  let a = mgHash(seedStr) || 123456789;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function mgStorageKey(){ return "cc_minigames_" + (S.uid || "guest"); }

function mgState(){
  const today = String(etDay());
  let st = mgReadStore(mgStorageKey());
  if (!st || typeof st !== "object"){
    st = { day: today, plays: {}, active: {}, used: {}, wins: {} };
  }
  st.plays = st.plays || {};
  st.active = st.active || {};
  st.used = st.used || {};
  st.wins = st.wins || {};
  if (st.day !== today){
    st.day = today;
    st.plays = { wordle: 0, bee: 0, sudoku: 0, crossword: 0 };
    st.active = { wordle: null, bee: null, sudoku: null, crossword: null };
    mgWriteStore(mgStorageKey(), st);
  }
  return st;
}

function mgSave(st){ mgWriteStore(mgStorageKey(), st); }

function mgPlaysUsed(game){
  const st = mgState();
  return Math.min(MG_DAILY_LIMIT, st.plays[game] || 0);
}

function mgPlaysLeft(game){
  return Math.max(0, MG_DAILY_LIMIT - mgPlaysUsed(game));
}

function mgPickFromPool(game, pool, idFn){
  const st = mgState();
  const used = st.used[game] || [];
  let candidates = pool.filter(item => !used.includes(idFn(item)));
  if (!candidates.length){
    st.used[game] = [];
    candidates = pool.slice();
  }
  const playNum = (st.plays[game] || 0) + 1;
  const rng = mgRng(st.day + ":" + game + ":" + playNum + ":" + (S.uid || "u"));
  const pick = candidates[Math.floor(rng() * candidates.length)];
  const pid = idFn(pick);
  st.used[game] = [...(st.used[game] || []), pid].slice(-900);
  mgSave(st);
  return pick;
}

function mgHelpModal(gameId){
  const meta = MG_META.find(g => g.id === gameId) || MG_META[0];
  mgShowModal((m, close) => {
    m.append(
      h("div",{style:{display:"flex",alignItems:"center",gap:"10px",marginBottom:"6px"}},
        h("span",{style:{fontSize:"26px"},text:meta.icon}),
        h("div",null,
          h("h3",{style:{margin:0},text:"How to Play " + meta.name}),
          h("div",{class:"note",style:{margin:0},text:meta.tagline})
        )
      ),
      h("div",{class:"mg-how-list"},
        ...meta.how.map(line => h("div",{class:"mg-how-item",text:line}))
      ),
      h("div",{class:"note",style:{marginTop:"12px"},text:"Daily Limit: You can play up to 5 puzzles of " + meta.name + " every day. Your 5 plays reset automatically at midnight ET!"}),
      h("div",{class:"foot"}, h("button",{class:"btn",onclick:close},"Got it!"))
    );
  });
}

function mgEnsureActive(game){
  const st = mgState();
  if (st.active[game]) return st.active[game];
  if (mgPlaysLeft(game) <= 0) return null;
  const playNum = (st.plays[game] || 0) + 1;
  let puzzle = null;
  if (game === "wordle"){
    const word = mgPickFromPool("wordle", WORDLE_BANK, w => w);
    puzzle = { day: st.day, playNum, word, guesses: [], cur: "", done: false, won: false };
  } else if (game === "bee"){
    puzzle = mgBuildBee(st.day, playNum);
  } else if (game === "sudoku"){
    puzzle = mgBuildSudoku(st.day, playNum);
  } else if (game === "crossword"){
    const cw = mgPickFromPool("crossword", CROSS_BANK, c => c.id);
    const entries = Array.from({length:5}, () => Array(5).fill(""));
    puzzle = { day: st.day, playNum, id: cw.id, grid: cw.grid, across: cw.across, down: cw.down, entries, r: 0, c: 0, dir: "across", done: false, won: false };
  }
  st.active[game] = puzzle;
  mgSave(st);
  return puzzle;
}

function mgStartNextPuzzle(game){
  const st = mgState();
  if (mgPlaysLeft(game) <= 0){
    toast("No plays left for today — resets at midnight ET!");
    return;
  }
  st.active[game] = null;
  mgSave(st);
  mgEnsureActive(game);
  need("msgs");
}

function mgCompletePuzzle(game, won){
  const st = mgState();
  const p = st.active[game];
  if (!p || p.done) return;
  p.done = true;
  if (won !== undefined) p.won = !!won;
  st.plays[game] = Math.min(MG_DAILY_LIMIT, (st.plays[game] || 0) + 1);
  if (won) st.wins[game] = (st.wins[game] || 0) + 1;
  mgSave(st);
}

function mgBuildSudoku(day, playNum){
  const rng = mgRng(day + ":sudoku:" + playNum + ":" + (S.uid || "u"));
  const shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--){
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const digits = shuffle([1,2,3,4,5,6,7,8,9]);
  const bandOrder = shuffle([0,1,2]);
  const stackOrder = shuffle([0,1,2]);
  const rows = bandOrder.flatMap(b => shuffle([0,1,2]).map(r => b * 3 + r));
  const cols = stackOrder.flatMap(s => shuffle([0,1,2]).map(c => s * 3 + c));
  const transpose = rng() > 0.5;
  const sol = Array.from({length:9}, (_, r) => Array.from({length:9}, (_, c) => {
    const rr = transpose ? cols[c] : rows[r];
    const cc = transpose ? rows[r] : cols[c];
    const baseVal = (rr * 3 + Math.floor(rr / 3) + cc) % 9;
    return digits[baseVal];
  }));
  const givens = sol.map(row => row.slice());
  const coords = shuffle(Array.from({length:81}, (_, i) => [Math.floor(i / 9), i % 9]));
  const blanks = 44;
  for (let i = 0; i < blanks; i++){
    const [r, c] = coords[i];
    givens[r][c] = 0;
  }
  const board = givens.map(row => row.slice());
  const notes = Array.from({length:9}, () => Array.from({length:9}, () => []));
  return { day, playNum, sol, givens, board, notes, sel: [0, 0], noteMode: false, mistakes: [], done: false, won: false };
}

function wordleScoreRow(guess, target){
  const res = Array(5).fill("absent");
  const counts = {};
  for (let i = 0; i < 5; i++){
    if (guess[i] === target[i]) res[i] = "correct";
    else counts[target[i]] = (counts[target[i]] || 0) + 1;
  }
  for (let i = 0; i < 5; i++){
    if (res[i] === "correct") continue;
    const ch = guess[i];
    if (counts[ch] > 0){
      res[i] = "present";
      counts[ch]--;
    }
  }
  return res;
}

function mgTopBar(meta, p){
  const left = mgPlaysLeft(meta.id);
  const used = mgPlaysUsed(meta.id);
  return h("div",{class:"mg-topbar"},
    h("button",{class:"btn ghost small",onclick:() => openChat("games", "hub")}, "← All Games"),
    h("div",{class:"mg-toptitle"},
      h("span",{style:{fontSize:"20px"},text:meta.icon}),
      h("b",{text:meta.name}),
      p ? h("span",{class:"mg-pill",text:"Puzzle #" + p.playNum + " of " + MG_DAILY_LIMIT}) : null
    ),
    h("div",{class:"mg-topright"},
      h("div",{class:"mg-pips",title:left + " plays remaining today"},
        ...Array.from({length:MG_DAILY_LIMIT}, (_, i) => h("span",{class:"mg-pip" + (i < used ? " used" : "")}))
      ),
      h("button",{class:"btn ghost small",onclick:() => mgHelpModal(meta.id)}, "? How to Play")
    )
  );
}

function renderGamesPage(box){
  ensureMgStyles();
  if (!window._mgKeyBound){
    window._mgKeyBound = true;
    window.addEventListener("keydown", mgHandleKey);
  }
  const page = S.page || "hub";
  box.innerHTML = "";
  const wrap = h("div",{class:"mg-wrap"});
  if (page === "hub"){
    const st = mgState();
    const totalLeft = MG_META.reduce((sum, g) => sum + mgPlaysLeft(g.id), 0);
    wrap.appendChild(h("div",{class:"mg-hero"},
      h("div",{class:"mg-hero-badge"}, "DAILY ARCADE · RESETS MIDNIGHT ET"),
      h("h2",{text:"CampusCord Mini Games"}),
      h("p",{text:"Four classic daily brainteasers. You get 5 fresh, non-repeating puzzles of each game every day — " + totalLeft + " total plays left today!"}),
      h("div",{class:"mg-hero-actions"},
        h("button",{class:"btn small",onclick:() => mgHelpModal("wordle")}, "? How to Play")
      )
    ));
    const grid = h("div",{class:"mg-hub-grid"});
    MG_META.forEach(g => {
      const left = mgPlaysLeft(g.id);
      const used = mgPlaysUsed(g.id);
      const act = st.active[g.id];
      const statusText = act && !act.done ? "In progress (Puzzle #" + act.playNum + ")" : left > 0 ? left + " of 5 plays left today" : "All 5 plays done today!";
      grid.appendChild(h("div",{class:"mg-card", style:{"--mg-accent": g.accent}, onclick:() => openChat("games", g.id)},
        h("div",{class:"mg-card-top"},
          h("span",{class:"mg-card-icon",text:g.icon}),
          h("span",{class:"mg-card-tag",text:g.badge})
        ),
        h("h3",{text:g.name}),
        h("p",{text:g.tagline}),
        h("div",{class:"mg-card-foot"},
          h("div",{class:"mg-pips"}, ...Array.from({length:MG_DAILY_LIMIT}, (_, i) => h("span",{class:"mg-pip" + (i < used ? " used" : "")}))),
          h("span",{class:"mg-card-stat",text:statusText})
        ),
        h("div",{class:"mg-card-btns"},
          h("button",{class:"btn small", style:{background:g.accent, color:"#111", fontWeight:"700"}}, act && !act.done ? "Resume" : left > 0 ? "Play" : "View Board"),
          h("button",{class:"btn ghost small", onclick:e => { e.stopPropagation(); mgHelpModal(g.id); }}, "? Rules")
        )
      ));
    });
    wrap.appendChild(grid);
    box.appendChild(wrap);
    return;
  }
  const meta = MG_META.find(g => g.id === page);
  if (!meta){ openChat("games", "hub"); return; }
  const p = mgEnsureActive(page);
  wrap.appendChild(mgTopBar(meta, p));
  if (!p){
    wrap.appendChild(h("div",{class:"mg-done-box"},
      h("h3",{text:"You've finished all 5 " + meta.name + " puzzles for today!"}),
      h("p",{class:"note",text:"Come back tomorrow after midnight ET for 5 brand-new puzzles."}),
      h("button",{class:"btn",onclick:() => openChat("games", "hub")}, "Back to Mini Games")
    ));
    box.appendChild(wrap);
    return;
  }
  if (page === "wordle") renderWordle(wrap, p);
  else if (page === "bee") renderBee(wrap, p);
  else if (page === "sudoku") renderSudoku(wrap, p);
  else if (page === "crossword") renderCrossword(wrap, p);
  box.appendChild(wrap);
}

function wordleInput(ch){
  const st = mgState();
  const p = st.active.wordle;
  if (!p || p.done) return;
  if (ch === "BACK"){
    p.cur = p.cur.slice(0, -1);
  } else if (ch === "ENTER"){
    if (p.cur.length < 5){ toast("Not enough letters (need 5)"); return; }
    const guess = p.cur.toUpperCase();
    p.guesses.push(guess);
    p.cur = "";
    if (guess === p.word){
      mgSave(st);
      mgCompletePuzzle("wordle", true);
      toast("🎉 Splendid! You got " + p.word + " in " + p.guesses.length + "/6!");
      need("msgs");
      return;
    }
    if (p.guesses.length >= 6){
      mgSave(st);
      mgCompletePuzzle("wordle", false);
      toast("Out of tries! The word was " + p.word);
      need("msgs");
      return;
    }
  } else if (/^[A-Z]$/.test(ch) && p.cur.length < 5){
    p.cur += ch;
  }
  mgSave(st);
  need("msgs");
}

function renderWordle(wrap, p){
  const board = h("div",{class:"wd-board"});
  const keyState = {};
  for (let r = 0; r < 6; r++){
    const row = h("div",{class:"wd-row"});
    const guess = p.guesses[r];
    const evals = guess ? wordleScoreRow(guess, p.word) : null;
    if (guess && evals){
      for (let i = 0; i < 5; i++){
        const l = guess[i], ev = evals[i];
        if (ev === "correct") keyState[l] = "correct";
        else if (ev === "present" && keyState[l] !== "correct") keyState[l] = "present";
        else if (!keyState[l]) keyState[l] = "absent";
      }
    }
    for (let c = 0; c < 5; c++){
      let ch = "", cls = "wd-tile";
      if (guess){
        ch = guess[c];
        cls += " " + evals[c];
      } else if (r === p.guesses.length && p.cur[c]){
        ch = p.cur[c];
        cls += " filled";
      }
      row.appendChild(h("div",{class:cls, text:ch}));
    }
    board.appendChild(row);
  }
  wrap.appendChild(board);

  if (p.done){
    const emojiGrid = p.guesses.map(g => wordleScoreRow(g, p.word).map(s => s === "correct" ? "🟩" : s === "present" ? "🟨" : "⬛").join("")).join("\n");
    const shareTxt = "CampusCord Wordle #" + p.playNum + " (" + (p.won ? p.guesses.length + "/6" : "X/6") + ")\n" + emojiGrid;
    wrap.appendChild(h("div",{class:"mg-result"},
      h("b",{text: p.won ? "Solved in " + p.guesses.length + "/6 tries!" : "The word was " + p.word}),
      h("div",{class:"mg-res-btns"},
        h("button",{class:"btn small ghost",onclick:() => mgCopyText(shareTxt, "Wordle grid copied!")}, "Share Result"),
        mgPlaysLeft("wordle") > 0
          ? h("button",{class:"btn small",onclick:() => mgStartNextPuzzle("wordle")}, "Next Word (" + mgPlaysLeft("wordle") + " left)")
          : h("span",{class:"note",text:"All 5 daily Wordles complete!"})
      )
    ));
  }

  const rows = ["QWERTYUIOP","ASDFGHJKL","ZXCVBNM"];
  const kb = h("div",{class:"wd-kb"});
  rows.forEach((letters, idx) => {
    const kr = h("div",{class:"wd-kb-row"});
    if (idx === 2) kr.appendChild(h("button",{class:"wd-key wide",onclick:() => wordleInput("ENTER")}, "ENTER"));
    for (const ch of letters){
      kr.appendChild(h("button",{class:"wd-key " + (keyState[ch] || ""),onclick:() => wordleInput(ch)}, ch));
    }
    if (idx === 2) kr.appendChild(h("button",{class:"wd-key wide",onclick:() => wordleInput("BACK")}, "⌫"));
    kb.appendChild(kr);
  });
  wrap.appendChild(kb);
}

function beeWordPoints(w, allLetters){
  const uniq = new Set(w.split(""));
  const isPan = allLetters.every(l => uniq.has(l));
  return (w.length === 4 ? 1 : w.length) + (isPan ? 7 : 0);
}

function beeInput(act){
  const st = mgState();
  const p = st.active.bee;
  if (!p || p.done) return;
  const all = [p.center, ...p.outer];
  if (act === "BACK"){
    p.cur = p.cur.slice(0, -1);
  } else if (act === "SHUFFLE"){
    p.outer = p.outer.slice().sort(() => Math.random() - 0.5);
  } else if (act === "ENTER"){
    const w = p.cur.toUpperCase();
    p.cur = "";
    if (w.length < 4){ toast("Too short (4 letters minimum)"); }
    else if (!w.includes(p.center)){ toast("Missing center letter (" + p.center + ")"); }
    else if (p.found.includes(w)){ toast("Already found " + w + "!"); }
    else if (!p.valid.includes(w)){ toast("Not in word list"); }
    else {
      p.found.push(w);
      const pts = beeWordPoints(w, all);
      const isPan = all.every(l => w.includes(l));
      toast(isPan ? "🌟 PANGRAM! +" + pts + " pts!" : "✨ +" + pts + " pts (" + w + ")");
      if (p.found.length >= p.valid.length){
        mgSave(st);
        mgCompletePuzzle("bee", true);
        need("msgs");
        return;
      }
    }
  } else if (all.includes(act) && p.cur.length < 15){
    p.cur += act;
  }
  mgSave(st);
  need("msgs");
}

function renderBee(wrap, p){
  const all = [p.center, ...p.outer];
  const score = p.found.reduce((s, w) => s + beeWordPoints(w, all), 0);
  const maxScore = p.valid.reduce((s, w) => s + beeWordPoints(w, all), 0) || 20;
  const pct = Math.min(100, Math.round((score / maxScore) * 100));
  const rank = pct >= 70 ? "Genius 🧠" : pct >= 50 ? "Amazing 🔥" : pct >= 30 ? "Great ⭐" : pct >= 15 ? "Good 👍" : "Beginner 🌱";

  const main = h("div",{class:"bee-layout"});
  const left = h("div",{class:"bee-left"});

  left.appendChild(h("div",{class:"bee-rank"},
    h("div",{class:"bee-rank-top"}, h("b",{text:rank}), h("span",{text:score + " / " + maxScore + " pts"})),
    h("div",{class:"bee-bar"}, h("div",{class:"bee-bar-fill",style:{width:pct + "%"}}))
  ));

  const typed = h("div",{class:"bee-typed"});
  if (!p.cur) typed.appendChild(h("span",{class:"bee-placeholder",text:"Type or click letters"}));
  else {
    for (const ch of p.cur){
      typed.appendChild(h("span",{class: ch === p.center ? "bee-ch-center" : "", text:ch}));
    }
  }
  left.appendChild(typed);

  const hive = h("div",{class:"bee-hive"});
  const hexBtn = (ch, isCenter, posIdx) => h("button",{
    class:"bee-hex" + (isCenter ? " center" : " pos-" + posIdx),
    onclick:() => beeInput(ch)
  }, ch);
  hive.appendChild(hexBtn(p.center, true, 0));
  p.outer.forEach((ch, idx) => hive.appendChild(hexBtn(ch, false, idx + 1)));
  left.appendChild(hive);

  if (!p.done){
    left.appendChild(h("div",{class:"bee-controls"},
      h("button",{class:"btn ghost small",onclick:() => beeInput("BACK")}, "Delete"),
      h("button",{class:"btn ghost small",onclick:() => beeInput("SHUFFLE")}, "↻ Shuffle"),
      h("button",{class:"btn small",style:{background:"#eab308",color:"#111",fontWeight:"700"},onclick:() => beeInput("ENTER")}, "Enter"),
      h("button",{class:"btn ghost small",onclick:() => { mgCompletePuzzle("bee", score > 0); need("msgs"); }}, "Finish & Reveal")
    ));
  } else {
    const shareTxt = "CampusCord Spelling Bee #" + p.playNum + ": " + rank + " (" + score + " pts, " + p.found.length + "/" + p.valid.length + " words)";
    left.appendChild(h("div",{class:"mg-result"},
      h("b",{text:"Round complete! " + p.found.length + " of " + p.valid.length + " words found."}),
      h("div",{class:"mg-res-btns"},
        h("button",{class:"btn small ghost",onclick:() => mgCopyText(shareTxt, "Spelling Bee score copied!")}, "Share Score"),
        mgPlaysLeft("bee") > 0
          ? h("button",{class:"btn small",onclick:() => mgStartNextPuzzle("bee")}, "Next Hive (" + mgPlaysLeft("bee") + " left)")
          : h("span",{class:"note",text:"All 5 daily Bees complete!"})
      )
    ));
  }

  const right = h("div",{class:"bee-right"},
    h("div",{class:"bee-found-hdr"}, h("b",{text:"Found Words (" + p.found.length + "/" + p.valid.length + ")"})),
    h("div",{class:"bee-words"},
      ...(p.done ? p.valid : p.found).slice().sort().map(w => {
        const isFound = p.found.includes(w);
        const isPan = all.every(l => w.includes(l));
        return h("span",{class:"bee-word" + (isPan ? " pan" : "") + (!isFound ? " missed" : ""), text:w});
      })
    )
  );

  main.append(left, right);
  wrap.appendChild(main);
}

function sudokuInput(val){
  const st = mgState();
  const p = st.active.sudoku;
  if (!p || p.done) return;
  const [r, c] = p.sel;
  if (p.givens[r][c] !== 0) return;
  p.mistakes = [];
  if (val === 0){
    p.board[r][c] = 0;
    p.notes[r][c] = [];
  } else if (p.noteMode){
    const arr = p.notes[r][c] || [];
    p.notes[r][c] = arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val].sort();
  } else {
    p.board[r][c] = val;
    p.notes[r][c] = [];
    let full = true, ok = true;
    for (let rr = 0; rr < 9; rr++){
      for (let cc = 0; cc < 9; cc++){
        if (p.board[rr][cc] === 0) full = false;
        else if (p.board[rr][cc] !== p.sol[rr][cc]) ok = false;
      }
    }
    if (full && ok){
      mgSave(st);
      mgCompletePuzzle("sudoku", true);
      toast("🎉 Sudoku solved! Genius logic!");
      need("msgs");
      return;
    }
  }
  mgSave(st);
  need("msgs");
}

function sudokuCheck(){
  const st = mgState();
  const p = st.active.sudoku;
  if (!p || p.done) return;
  const bad = [];
  for (let r = 0; r < 9; r++){
    for (let c = 0; c < 9; c++){
      if (p.board[r][c] !== 0 && p.board[r][c] !== p.sol[r][c]) bad.push(r + "," + c);
    }
  }
  p.mistakes = bad;
  mgSave(st);
  toast(bad.length ? "Highlighted " + bad.length + " mistake" + (bad.length === 1 ? "" : "s") + " in red." : "No mistakes so far!");
  need("msgs");
}

function renderSudoku(wrap, p){
  const [sr, sc] = p.sel;
  const selVal = p.board[sr][sc];
  const layout = h("div",{class:"sdk-layout"});
  const grid = h("div",{class:"sdk-grid"});
  for (let r = 0; r < 9; r++){
    for (let c = 0; c < 9; c++){
      const v = p.board[r][c];
      const given = p.givens[r][c] !== 0;
      const isSel = r === sr && c === sc;
      const sameGroup = r === sr || c === sc || (Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3));
      const sameNum = selVal !== 0 && v === selVal;
      const isBad = (p.mistakes || []).includes(r + "," + c);
      let cls = "sdk-cell";
      if (given) cls += " given";
      if (isSel) cls += " sel";
      else if (sameNum) cls += " samenum";
      else if (sameGroup) cls += " peer";
      if (isBad) cls += " bad";
      if (c === 2 || c === 5) cls += " b-right";
      if (r === 2 || r === 5) cls += " b-bottom";
      const cell = h("div",{class:cls, onclick:() => { const st = mgState(); st.active.sudoku.sel = [r, c]; mgSave(st); need("msgs"); }});
      if (v !== 0) cell.textContent = String(v);
      else if (p.notes[r][c] && p.notes[r][c].length){
        const ng = h("div",{class:"sdk-notes"});
        for (let d = 1; d <= 9; d++) ng.appendChild(h("span",{text: p.notes[r][c].includes(d) ? String(d) : ""}));
        cell.appendChild(ng);
      }
      grid.appendChild(cell);
    }
  }
  layout.appendChild(grid);

  const side = h("div",{class:"sdk-side"});
  const pad = h("div",{class:"sdk-pad"});
  for (let d = 1; d <= 9; d++){
    pad.appendChild(h("button",{class:"sdk-num",onclick:() => sudokuInput(d)}, String(d)));
  }
  side.appendChild(pad);
  side.appendChild(h("div",{class:"sdk-tools"},
    h("button",{class:"btn small" + (p.noteMode ? "" : " ghost"),onclick:() => { const st = mgState(); st.active.sudoku.noteMode = !p.noteMode; mgSave(st); need("msgs"); }}, p.noteMode ? "✎ Notes: ON" : "✎ Notes: OFF"),
    h("button",{class:"btn small ghost",onclick:() => sudokuInput(0)}, "Erase"),
    h("button",{class:"btn small ghost",onclick:sudokuCheck}, "Check Mistakes")
  ));

  if (p.done){
    const shareTxt = "CampusCord Sudoku #" + p.playNum + " — Solved! 🔢✅";
    side.appendChild(h("div",{class:"mg-result"},
      h("b",{text:"Puzzle Solved!"}),
      h("div",{class:"mg-res-btns"},
        h("button",{class:"btn small ghost",onclick:() => mgCopyText(shareTxt, "Sudoku result copied!")}, "Share Result"),
        mgPlaysLeft("sudoku") > 0
          ? h("button",{class:"btn small",onclick:() => mgStartNextPuzzle("sudoku")}, "Next Sudoku (" + mgPlaysLeft("sudoku") + " left)")
          : h("span",{class:"note",text:"All 5 daily Sudokus complete!"})
      )
    ));
  }
  layout.appendChild(side);
  wrap.appendChild(layout);
}

function cwSelect(r, c){
  const st = mgState();
  const p = st.active.crossword;
  if (!p) return;
  if (p.r === r && p.c === c) p.dir = p.dir === "across" ? "down" : "across";
  else { p.r = r; p.c = c; }
  mgSave(st);
  need("msgs");
}

function cwInput(ch){
  const st = mgState();
  const p = st.active.crossword;
  if (!p || p.done) return;
  if (ch === "SPACE"){
    p.dir = p.dir === "across" ? "down" : "across";
  } else if (ch === "BACK"){
    if (p.entries[p.r][p.c]){
      p.entries[p.r][p.c] = "";
    } else if (p.dir === "across" && p.c > 0){
      p.c--; p.entries[p.r][p.c] = "";
    } else if (p.dir === "down" && p.r > 0){
      p.r--; p.entries[p.r][p.c] = "";
    }
  } else if (/^[A-Z]$/.test(ch)){
    p.entries[p.r][p.c] = ch;
    if (p.dir === "across" && p.c < 4) p.c++;
    else if (p.dir === "down" && p.r < 4) p.r++;
    let solved = true;
    for (let r = 0; r < 5; r++){
      for (let c = 0; c < 5; c++){
        if (p.entries[r][c] !== p.grid[r][c]) solved = false;
      }
    }
    if (solved){
      mgSave(st);
      mgCompletePuzzle("crossword", true);
      toast("🎉 Mini Crossword complete!");
      need("msgs");
      return;
    }
  }
  mgSave(st);
  need("msgs");
}

function cwRevealCell(){
  const st = mgState();
  const p = st.active.crossword;
  if (!p || p.done) return;
  cwInput(p.grid[p.r][p.c]);
}

function renderCrossword(wrap, p){
  const layout = h("div",{class:"cw-layout"});
  const left = h("div",{class:"cw-left"});

  const activeClueList = p.dir === "across" ? p.across : p.down;
  const activeClue = activeClueList.find(cl => p.dir === "across" ? cl.r === p.r : cl.c === p.c) || activeClueList[0];
  left.appendChild(h("div",{class:"cw-banner"},
    h("b",{text: activeClue.n + (p.dir === "across" ? "A" : "D") + ": "}),
    h("span",{text: activeClue.clue})
  ));

  const grid = h("div",{class:"cw-grid"});
  for (let r = 0; r < 5; r++){
    for (let c = 0; c < 5; c++){
      const isSel = r === p.r && c === p.c;
      const inWord = p.dir === "across" ? r === p.r : c === p.c;
      const num = r === 0 ? c + 1 : (c === 0 ? r + 1 : null);
      grid.appendChild(h("div",{
        class:"cw-cell" + (isSel ? " sel" : inWord ? " word" : ""),
        onclick:() => cwSelect(r, c)
      },
        num ? h("span",{class:"cw-num",text:String(num)}) : null,
        h("span",{class:"cw-let",text:p.entries[r][c] || ""})
      ));
    }
  }
  left.appendChild(grid);

  if (!p.done){
    left.appendChild(h("div",{class:"cw-tools"},
      h("button",{class:"btn small ghost",onclick:() => cwInput("SPACE")}, "Switch Direction"),
      h("button",{class:"btn small ghost",onclick:cwRevealCell}, "Reveal Letter")
    ));
  } else {
    const shareTxt = "CampusCord Mini Crossword #" + p.playNum + " — Solved! ✏️✅";
    left.appendChild(h("div",{class:"mg-result"},
      h("b",{text:"Mini Crossword Solved!"}),
      h("div",{class:"mg-res-btns"},
        h("button",{class:"btn small ghost",onclick:() => mgCopyText(shareTxt, "Crossword result copied!")}, "Share Result"),
        mgPlaysLeft("crossword") > 0
          ? h("button",{class:"btn small",onclick:() => mgStartNextPuzzle("crossword")}, "Next Crossword (" + mgPlaysLeft("crossword") + " left)")
          : h("span",{class:"note",text:"All 5 daily Crosswords complete!"})
      )
    ));
  }

  const clues = h("div",{class:"cw-clues"});
  const makeCol = (title, dir, list) => h("div",{class:"cw-col"},
    h("h4",{text:title}),
    ...list.map(cl => {
      const on = p.dir === dir && (dir === "across" ? p.r === cl.r : p.c === cl.c);
      return h("div",{
        class:"cw-clue" + (on ? " on" : ""),
        onclick:() => { const st = mgState(); st.active.crossword.dir = dir; st.active.crossword.r = cl.r; st.active.crossword.c = cl.c; mgSave(st); need("msgs"); }
      }, h("b",{text:cl.n + ". "}), h("span",{text:cl.clue}));
    })
  );
  clues.append(makeCol("Across", "across", p.across), makeCol("Down", "down", p.down));
  layout.append(left, clues);
  wrap.appendChild(layout);
}

function mgHandleKey(e){
  if (S.kind !== "games") return;
  if (document.querySelector(".mbg, .modal")) return;
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  const page = S.page || "hub";
  if (page === "hub") return;
  const k = e.key;
  if (page === "wordle"){
    if (k === "Enter"){ e.preventDefault(); wordleInput("ENTER"); }
    else if (k === "Backspace"){ e.preventDefault(); wordleInput("BACK"); }
    else if (/^[a-zA-Z]$/.test(k)){ e.preventDefault(); wordleInput(k.toUpperCase()); }
  } else if (page === "bee"){
    if (k === "Enter"){ e.preventDefault(); beeInput("ENTER"); }
    else if (k === "Backspace"){ e.preventDefault(); beeInput("BACK"); }
    else if (k === " "){ e.preventDefault(); beeInput("SHUFFLE"); }
    else if (/^[a-zA-Z]$/.test(k)){ e.preventDefault(); beeInput(k.toUpperCase()); }
  } else if (page === "sudoku"){
    const st = mgState(), p = st.active.sudoku;
    if (!p) return;
    if (/^[1-9]$/.test(k)){ e.preventDefault(); sudokuInput(Number(k)); }
    else if (k === "Backspace" || k === "Delete" || k === "0"){ e.preventDefault(); sudokuInput(0); }
    else if (k === "n" || k === "N"){ e.preventDefault(); p.noteMode = !p.noteMode; mgSave(st); need("msgs"); }
    else if (k === "ArrowUp"){ e.preventDefault(); p.sel[0] = (p.sel[0] + 8) % 9; mgSave(st); need("msgs"); }
    else if (k === "ArrowDown"){ e.preventDefault(); p.sel[0] = (p.sel[0] + 1) % 9; mgSave(st); need("msgs"); }
    else if (k === "ArrowLeft"){ e.preventDefault(); p.sel[1] = (p.sel[1] + 8) % 9; mgSave(st); need("msgs"); }
    else if (k === "ArrowRight"){ e.preventDefault(); p.sel[1] = (p.sel[1] + 1) % 9; mgSave(st); need("msgs"); }
  } else if (page === "crossword"){
    const st = mgState(), p = st.active.crossword;
    if (!p) return;
    if (k === " "){ e.preventDefault(); cwInput("SPACE"); }
    else if (k === "Backspace"){ e.preventDefault(); cwInput("BACK"); }
    else if (/^[a-zA-Z]$/.test(k)){ e.preventDefault(); cwInput(k.toUpperCase()); }
    else if (k === "ArrowUp"){ e.preventDefault(); p.r = (p.r + 4) % 5; mgSave(st); need("msgs"); }
    else if (k === "ArrowDown"){ e.preventDefault(); p.r = (p.r + 1) % 5; mgSave(st); need("msgs"); }
    else if (k === "ArrowLeft"){ e.preventDefault(); p.c = (p.c + 4) % 5; mgSave(st); need("msgs"); }
    else if (k === "ArrowRight"){ e.preventDefault(); p.c = (p.c + 1) % 5; mgSave(st); need("msgs"); }
  }
}
// The daily poll shows as posted by "Daily Poll", not by whoever happened to open the room first.
function dailyPollEl(m, reacts){
  const locked = isPollLocked(m);
  return h("div",{class:"msg first dailypoll", id:"m-" + m.id},
    h("div",{class:"gut"}, h("div",{class:"av dpav"}, "📊")),
    h("div",{class:"body"}, h("div",{class:"meta"}, h("span",{class:"n dpname",text:"Daily Poll"}), h("span",{class:"tag dev noi"}, h("b",{text:"BOT"})), h("span",{class:"t",text:fmtDay(m.ts)})),
      pollEl(m, reacts || {}),
      h("div",{class:"note dpnext",text: locked ? "Voting is closed for this poll." : "A new poll drops every day at midnight."})));
}
