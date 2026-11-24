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
      "Only real 5-letter English words are accepted — gibberish won't submit!",
      "Choose Easy, Medium, or Hard difficulty anytime before you guess (5 daily plays total)."
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
  },
  {
    id: "flappy",
    name: "Flappy Cord",
    badge: "ARCADE",
    accent: "#38bdf8",
    icon: "🐦",
    tagline: "Tap or press Space to fly through the pipes without crashing.",
    how: [
      "Click, tap, or press Space / Up Arrow to make your bird flap upward.",
      "Guide the bird safely through the gaps between the green pipes.",
      "Each pipe pair you pass earns 1 point.",
      "Score 5 or more points in a run to count it as a win, and try to beat your personal high score!",
      "You get 5 arcade runs per day."
    ]
  },
  {
    id: "mario",
    name: "Super Cord Bros",
    badge: "PLATFORMER",
    accent: "#ef4444",
    icon: "🍄",
    tagline: "Run, jump, collect coins, stomp baddies, and reach the flagpole!",
    how: [
      "Use Left / Right Arrow keys (or A / D) to run, and Up Arrow, W, or Space to jump.",
      "On phones or tablets, use the on-screen touch buttons below the game.",
      "Hit yellow ? blocks from below to pop out bonus coins and super mushrooms!",
      "Jump on top of walking enemies to stomp them—don't touch them from the side or fall into pits.",
      "Reach the flagpole at the end of a stage to clear it and advance to the next level (unlimited plays)!"
    ]
  }
];

const WORDLE_EASY = [
  "ABOUT","ABOVE","ACTOR","ADULT","AFTER","AGAIN","AGENT","AGREE","AHEAD","ALARM","ALBUM","ALERT","ALIEN","ALIVE","ALONE",
  "ALONG","ANGEL","ANGRY","APPLE","ARENA","ARGUE","ARISE","ARMOR","ARROW","ASIDE","ASSET","AUDIO","AVOID","AWAKE","AWARD",
  "AWARE","AWFUL","BACON","BADGE","BAKER","BEACH","BEARD","BEAST","BEGIN","BEING","BELOW","BENCH","BERRY","BIRTH","BLACK",
  "BLADE","BLAME","BLANK","BLAST","BLEND","BLESS","BLIND","BLOCK","BLOOD","BLOOM","BOARD","BOOST","BOOTH","BOUND","BRAIN",
  "BRAKE","BRAND","BRAVE","BREAD","BREAK","BRICK","BRIDE","BRIEF","BRING","BROAD","BROWN","BRUSH","BUILD","BUILT","BUNCH",
  "BURST","BUYER","CABIN","CABLE","CAMEL","CANDY","CARRY","CATCH","CAUSE","CHAIN","CHAIR","CHALK","CHARM","CHART","CHASE",
  "CHEAP","CHEAT","CHECK","CHEEK","CHEER","CHESS","CHEST","CHIEF","CHILD","CHILL","CHINA","CHOIR","CHORD","CHUNK","CIDER",
  "CLAIM","CLASS","CLEAN","CLEAR","CLERK","CLICK","CLIFF","CLIMB","CLOCK","CLOSE","CLOTH","CLOUD","CLOWN","COACH","COAST",
  "COCOA","COLOR","COMET","COMIC","CORAL","COUCH","COUGH","COULD","COUNT","COURT","COVER","CRACK","CRAFT","CRANE","CRASH",
  "CRAZY","CREAM","CREEK","CREEP","CRIME","CRISP","CROSS","CROWD","CROWN","CRUEL","CRUSH","CURVE","CYCLE","DAILY","DAIRY",
  "DANCE","DEATH","DELAY","DEPTH","DIARY","DIRTY","DISCO","DITCH","DIZZY","DOUBT","DOUGH","DOZEN","DRAFT","DRAIN","DRAMA",
  "DREAM","DRESS","DRIFT","DRILL","DRINK","DRIVE","DRONE","DROWN","DRYER","EAGLE","EARLY","EARTH","EIGHT","ELBOW","ELDER",
  "ELECT","EMPTY","ENEMY","ENJOY","ENTER","ENTRY","EQUAL","ERROR","ESSAY","EVENT","EVERY","EXACT","EXIST","EXTRA","FAITH",
  "FALSE","FANCY","FAULT","FAVOR","FEAST","FENCE","FERRY","FEVER","FIBER","FIELD","FIFTH","FIFTY","FIGHT","FINAL","FIRST",
  "FLAME","FLASH","FLEET","FLESH","FLOAT","FLOOD","FLOOR","FLOUR","FLUID","FLUSH","FLUTE","FOCUS","FORCE","FORTH","FORTY",
  "FORUM","FOUND","FRAME","FRESH","FRONT","FROST","FRUIT","FULLY","FUNNY","GHOST","GIANT","GLASS","GLOBE","GLORY","GLOVE",
  "GRACE","GRADE","GRAIN","GRAND","GRANT","GRAPE","GRAPH","GRASP","GRASS","GRAVE","GREAT","GREEN","GREET","GRIEF","GRILL",
  "GROUP","GROVE","GROWN","GUARD","GUESS","GUEST","GUIDE","HABIT","HAPPY","HARSH","HASTE","HEART","HEAVY","HEDGE","HELLO",
  "HONEY","HONOR","HORSE","HOTEL","HOUSE","HUMAN","HUMOR","HURRY","IDEAL","IMAGE","INDEX","INNER","INPUT","ISSUE","ITEMS",
  "JEANS","JELLY","JEWEL","JOINT","JOKER","JOLLY","JUDGE","JUICE","KNIFE","KNOCK","KNOWN","LABEL","LABOR","LARGE","LASER",
  "LATER","LAUGH","LAYER","LEARN","LEASE","LEAST","LEAVE","LEGAL","LEMON","LEVEL","LIGHT","LIMIT","LOCAL","LOGIC","LOOSE",
  "LOVER","LOWER","LOYAL","LUCKY","LUNAR","LUNCH","MAGIC","MAJOR","MAKER","MANGO","MAPLE","MARCH","MATCH","MAYOR","MEDAL",
  "MEDIA","MELON","MERCY","MERGE","MERIT","MERRY","METAL","METER","MIGHT","MINOR","MINUS","MODEL","MONEY","MONTH","MORAL",
  "MOTOR","MOUNT","MOUSE","MOUTH","MOVIE","MUDDY","MUSIC","NASTY","NERVE","NEVER","NEWLY","NIGHT","NINTH","NOBLE","NOISE",
  "NOISY","NORTH","NOTCH","NOVEL","NURSE","NYLON","OCEAN","OFFER","OFTEN","OLIVE","ONION","OPERA","ORBIT","ORDER","ORGAN",
  "OTHER","OUGHT","OUTER","OWNER","PAINT","PANEL","PANIC","PAPER","PARTY","PASTA","PASTE","PATCH","PAUSE","PEACE","PEACH",
  "PEARL","PEDAL","PENNY","PETAL","PHASE","PHONE","PHOTO","PIANO","PIECE","PILOT","PINCH","PITCH","PIXEL","PIZZA","PLACE",
  "PLAIN","PLANE","PLANT","PLATE","PLAZA","POINT","POLAR","PORCH","POUND","POWER","PRESS","PRICE","PRIDE","PRIME","PRINT",
  "PRIOR","PRIZE","PROOF","PROUD","PROVE","PULSE","PUNCH","PUPIL","PURSE","QUEEN","QUEST","QUEUE","QUICK","QUIET","QUILT",
  "QUITE","QUOTE","RADAR","RADIO","RAISE","RALLY","RANCH","RANGE","RAPID","RATIO","REACH","REACT","READY","REALM","REBEL",
  "REFER","RELAX","REPLY","RESET","RIDER","RIDGE","RIFLE","RIGHT","RIGID","RINSE","RISKY","RIVAL","RIVER","ROAST","ROBIN",
  "ROBOT","ROCKY","ROMAN","ROUGH","ROUND","ROUTE","ROYAL","RULER","RURAL","SAINT","SALAD","SAUCE","SCALE","SCARE","SCARF",
  "SCARY","SCENE","SCENT","SCOPE","SCORE","SCOUT","SCRAP","SENSE","SERVE","SEVEN","SHADE","SHAFT","SHAKE","SHALL","SHAME",
  "SHAPE","SHARE","SHARK","SHARP","SHEEP","SHEER","SHEET","SHELF","SHELL","SHIFT","SHINE","SHINY","SHIRT","SHOCK","SHOOT",
  "SHORE","SHORT","SHOUT","SHOWN","SIGHT","SILLY","SINCE","SIXTH","SIXTY","SKILL","SKIRT","SKULL","SLATE","SLAVE","SLEEP",
  "SLICE","SLIDE","SLOPE","SMALL","SMART","SMELL","SMILE","SMOKE","SNACK","SNAKE","SNOWY","SOLAR","SOLID","SOLVE","SORRY",
  "SOUND","SOUTH","SPACE","SPARE","SPARK","SPEAK","SPEED","SPELL","SPEND","SPENT","SPICE","SPICY","SPIKE","SPILL","SPINE",
  "SPLIT","SPOKE","SPORT","SPRAY","SQUAD","STACK","STAFF","STAGE","STAIN","STAIR","STAKE","STAMP","STAND","STARE","STARS",
  "START","STATE","STEAK","STEAL","STEAM","STEEL","STEEP","STEER","STICK","STIFF","STILL","STOCK","STONE","STOOD","STOOL",
  "STORE","STORM","STORY","STOVE","STRAP","STRAW","STRIP","STUCK","STUDY","STUFF","STYLE","SUGAR","SUITE","SUNNY","SUPER",
  "SWEAR","SWEAT","SWEEP","SWEET","SWELL","SWEPT","SWIFT","SWING","SWIRL","SWORD","TABLE","TAKEN","TASTE","TASTY","TEACH",
  "TEETH","THANK","THEFT","THEME","THERE","THESE","THICK","THIEF","THING","THINK","THIRD","THORN","THOSE","THREE","THREW",
  "THROW","THUMB","TIGER","TIGHT","TIMER","TIRED","TITLE","TOAST","TODAY","TOKEN","TOPIC","TORCH","TOTAL","TOUCH","TOUGH",
  "TOWEL","TOWER","TOXIC","TRACE","TRACK","TRADE","TRAIL","TRAIN","TRAIT","TRASH","TREAT","TREND","TRIAL","TRIBE","TRICK",
  "TRIED","TROOP","TRUCK","TRULY","TRUNK","TRUST","TRUTH","TULIP","TWICE","TWIST","ULTRA","UNCLE","UNDER","UNION","UNITE",
  "UNITY","UNTIL","UPPER","UPSET","URBAN","USAGE","USUAL","VALID","VALUE","VALVE","VAULT","VIDEO","VIRAL","VIRUS","VISIT",
  "VITAL","VIVID","VOCAL","VOICE","WAGON","WAIST","WASTE","WATCH","WATER","WEARY","WEAVE","WEIGH","WEIRD","WHALE","WHEAT",
  "WHEEL","WHERE","WHICH","WHILE","WHITE","WHOLE","WHOSE","WIDTH","WINDY","WITCH","WOMAN","WOMEN","WORLD","WORRY","WORSE",
  "WORST","WORTH","WOULD","WOUND","WRIST","WRITE","WRONG","WROTE","YOUNG","YOUTH","ZEBRA"
];

const WORDLE_MEDIUM = [
  "ABIDE","ABODE","ACORN","ACUTE","ADAPT","ADMIT","ADOBE","ADOPT","ADORE","AGILE","AGING","AGONY","ALGAE","ALIGN","ALIKE",
  "ALLEY","ALLOT","ALLOW","ALLOY","ALOUD","ALPHA","ALTAR","ALTER","AMBER","AMEND","AMONG","AMPLE","AMUSE","ANKLE","APART",
  "APPLY","APRON","AROMA","AROSE","ARRAY","ASHES","ATLAS","ATTIC","AUDIT","AVERT","AZURE","BAGEL","BANJO","BARON","BASIC",
  "BASIL","BASIN","BASIS","BATCH","BINGE","BIRCH","BISON","BLEAK","BLINK","BLISS","BLOWN","BLUNT","BOAST","BONUS","BOXER",
  "BRASS","BREED","BRISK","BROKE","BROOK","CACTI","CADET","CANAL","CANOE","CARGO","CARVE","CEDAR","CELLO","CHANT","CHAOS",
  "CHIME","CHIRP","CHOSE","CIVIC","CLAMP","CLASH","CLASP","CLEAT","CLEFT","CLING","CLOAK","CLONE","CLOVE","COBRA","COMMA",
  "CONCH","CORPS","CRATE","CRAVE","CRAWL","CRAZE","CREAK","CREST","CROOK","CRUDE","CRUMB","DEALT","DEBIT","DEBUG","DEBUT",
  "DECAY","DECOR","DEPOT","DERBY","DETER","DINGO","DIVER","DODGE","DONOR","DONUT","DREAD","DWARF","EAGER","EASEL","EBONY",
  "ELITE","EMBER","ENACT","EQUIP","ERUPT","ETHER","ETHIC","EVADE","EXCEL","EXERT","EXILE","FABLE","FAINT","FAIRY","FATAL",
  "FIERY","FINCH","FLANK","FLARE","FLASK","FLICK","FLING","FLINT","FLIRT","FLOCK","FLORA","FLOSS","FOAMY","FOCAL","FOGGY",
  "FRANK","FRAUD","FRISK","FROCK","FROWN","FUZZY","GEESE","GENIE","GENRE","GIDDY","GLAND","GLARE","GLEAM","GLIDE","GLOOM",
  "GLOSS","GROAN","GROIN","GROOM","GROPE","GROWL","GRUNT","GULLY","HAVEN","HAZEL","HEAVE","HOMER","HOUND","HUMID","HUSKY",
  "IDIOM","IGLOO","IMPLY","INTRO","IVORY","JAZZY","JERKY","JIFFY","JUMBO","JUMPY","KAYAK","KEBAB","KNEEL","KNELT","KOALA",
  "LAGER","LEDGE","LEECH","LEGGY","LEPER","LIEGE","LOBBY","LODGE","LOOPY","LORRY","LOUSY","LOWLY","LUMPY","LUSTY","LYNCH",
  "LYRIC","MACHO","MADAM","MAFIA","MANLY","MANOR","MASSE","MATEY","MEDIC","MICRO","MIDST","MINTY","MOODY","MOOSE","MORON",
  "MORPH","MOSSY","MOTEL","MOTTO","MOULT","MOUND","MOWER","MUCKY","MUCUS","MUMMY","MUNCH","MUSHY","MUSKY","MUSTY","NANNY",
  "NASAL","NAVAL","NEEDY","NEIGH","NERDY","NICER","NIECE","NINJA","NINNY","NUDGE","NUTTY","OBESE","OCTAL","ODDER","OLDEN",
  "OLDER","OMBRE","OPIUM","OTTER","OUTDO","OUTGO","OVARY","OVATE","OVINE","OVOID","OWING","OXIDE","OZONE","PADDY","PALER",
  "PANSY","PAPAL","PARER","PATIO","PATSY","PATTY","PAYEE","PAYER","PENCE","PENNE","PERKY","PESKY","PESTO","PETTY","PHONY",
  "PIGGY","PINEY","PINKY","PINTO","PIPER","PIXIE","PLANK","PLEAD","PLEAT","PLIED","PLIER","PLUCK","PLUMP","PLUNK","PLUSH",
  "POESY","POKER","POLKA","POOCH","POPPY","POSER","POSIT","POUCH","POUTY","PRANK","PRICK","PRIED","PRIMO","PROBE","PROSE",
  "PRUNE","PUBIC","PUDGY","PUFFY","PULPY","PUPAL","PUPPY","PUREE","PURER","PURGE","PUSHY","PUTTY","QUACK","QUAKE","QUART",
  "QUEER","RABBI","RACER","RAINY","RAJAH","RANDY","RARER","RASPY","RAVEN","RAYON","RAZOR","REARM","REBAR","RECAP","RECUT",
  "REEDY","REFIT","REHAB","RELAY","RENEW","REPAY","RERUN","RETCH","RETRO","RETRY","REUSE","REVUE","RHINO","RIPEN","RIPER",
  "RISEN","RISER","ROACH","RODEO","ROGER","ROOMY","RUDER","RUGBY","RUMBA","RUMOR","SAFER","SALLY","SALON","SALSA","SALTY",
  "SANDY","SANER","SAPPY","SASSY","SATIN","SAUCY","SAVOY","SCOLD","SCOOP","SEEDY","SEMEN","SETUP","SEWER","SHADY","SHAKY",
  "SHALT","SHANK","SHARD","SHAVE","SHIED","SHONE","SHOOK","SHORN","SHOVE","SHOWY","SHRUG","SHUCK","SHUSH","SHYLY","SILKY",
  "SISSY","SKATE","SKIER","SKUNK","SLANG","SLANT","SLASH","SLEEK","SLEPT","SLICK","SLIME","SLIMY","SLING","SLOOP","SLOSH",
  "SLUNG","SLUNK","SLURP","SLUSH","SLYLY","SMACK","SMASH","SMEAR","SMITH","SMOCK","SMOKY","SMOTE","SNAIL","SNAKY","SNEAK",
  "SNIFF","SNOOP","SNORE","SNORT","SNOUT","SNUCK","SNUFF","SOAPY","SOGGY","SONIC","SOOTY","SOWER","SPADE","SPANK","SPEAR",
  "SPELT","SPERM","SPIED","SPIKY","SPILT","SPINY","SPLAT","SPOIL","SPOOK","SPOOL","SPOON","SPOUT","SPREE","SQUAT","STALE",
  "STALL","STANK","STARK","STASH","STOMP","STONY","STOOP","STRAY","STUMP","STUNG","STUNK","STUNT","SUING","SULKY","SURER",
  "SUSHI","SWAMP","SWARM","SWASH","SWILL","SWINE","SWISH","SWOOP","SWORE","SWORN","SWUNG","SYRUP","TABBY","TACKY","TAFFY",
  "TAKER","TALLY","TAMER","TANGO","TANGY","TARDY","TATTY","TEARY","TEASE","TEDDY","TENSE","TENTH","TEPEE","TESTY","THEIR",
  "THIGH","THONG","THROB","THRUM","THUMP","TODDY","TONGA","TOOTH","TROLL","TROUT","TRUER","TRUMP","TUBAL","TUMOR","TURBO",
  "TWEED","TWEET","TWIXT","TYING","UDDER","UNCUT","UNDID","UNFED","UNLIT","UNMET","UNSET","UNTIE","UNWED","UNZIP","URINE",
  "USING","UTILE","VEGAN","VILLA","VINYL","VODKA","VOMIT","VOTER","VOWEL","WACKY","WARTY","WAXEN","WEEDY","WELCH","WELSH",
  "WENCH","WHACK","WHINE","WHINY","WHOOP","WIDEN","WIDER","WIDOW","WIGHT","WILLY","WIMPY","WISER","WITTY","WOKEN","WOODY",
  "WOOER","WOOLY","WOOZY","WORDY","WRECK","WRYLY"
];

const WORDLE_HARD = [
  "ABYSS","ACRID","ADEPT","ADORN","AEGIS","AFFIX","AGAPE","ALLAY","ALOFT","AMASS","AMITY","ANNEX","ARDOR","ASKEW","ATONE",
  "AUGUR","AVAIL","AXIOM","BALMY","BANAL","BASAL","BASTE","BEGET","BELCH","BERTH","BESET","BEVEL","BLAND","BLEAT","BLOAT",
  "BLURT","BOGUS","BRAWN","BRINE","BRUNT","CACHE","CADRE","CAIRN","CANNY","CAPER","CARAT","CASTE","CAVIL","CHAFE","CHAFF",
  "CHASM","CHIDE","CHUTE","CINCH","CLOUT","COVEN","COVET","COWER","CRASS","CREDO","CRONY","CRYPT","CUMIN","CURIO","CYNIC",
  "DAUNT","DECOY","DEFER","DEITY","DELVE","DEMUR","DIRGE","DITTY","DOGMA","DROLL","DROOP","DROSS","DUNCE","EDICT","EERIE",
  "ELATE","ELEGY","ELFIN","ELUDE","EMCEE","ENDOW","ENNUI","ENSUE","EPOCH","EPOXY","ERODE","ETHOS","EVICT","EVOKE","EXALT",
  "EXTOL","EXUDE","EXULT","FACET","FARCE","FAUNA","FEIGN","FEINT","FERAL","FETID","FIEND","FJORD","FLAIR","FLECK","FLOUT",
  "FLUKE","FLUME","FOLLY","FORAY","FORGO","FORTE","FRAIL","FRIAR","FROND","FROTH","FUGUE","FUNGI","FUROR","GAFFE","GAMUT",
  "GAUDY","GAUNT","GAUZE","GAVEL","GAWKY","GHOUL","GIRTH","GLADE","GLEAN","GLOAT","GNASH","GNOME","GOUGE","GOURD","GRAFT",
  "GRAIL","GRIME","GRIPE","GROUT","GRUEL","GRUFF","GUILE","GUISE","GULCH","GUSTO","HAVOC","HEATH","HEFTY","HEIST","HELIX",
  "HOARD","HOIST","HORDE","HUMUS","HUNCH","HYENA","IDYLL","IMBUE","IMPEL","INANE","INEPT","INERT","INFER","INGOT","INLAY",
  "INLET","IONIC","IRATE","ISLET","JAUNT","JOUST","JUNTA","JUROR","KARMA","KHAKI","KIOSK","KNAVE","KNEAD","KNOLL","KRILL",
  "LADEN","LADLE","LANCE","LANKY","LAPEL","LAPSE","LARVA","LATHE","LEACH","LEERY","LEMUR","LEVEE","LIBEL","LIKEN","LILAC",
  "LIMBO","LINGO","LITHE","LIVID","LOATH","LOCUS","LOFTY","LUCID","LUMEN","LURCH","LURID","LYMPH","MACAW","MACRO","MAGMA",
  "MAIZE","MANIA","MANIC","MAUVE","MAXIM","MECCA","MELEE","MIDGE","MIMIC","MINCE","MIRTH","MISER","MOCHA","MOGUL","MOLAR",
  "MOTIF","MOURN","MULCH","MURAL","MURKY","MYRRH","NADIR","NAIVE","NATAL","NAVEL","NICHE","NOMAD","NOOSE","NYMPH","OAKEN",
  "OCCUR","OCTET","OFFAL","OMEGA","ONSET","OPINE","OPTIC","OUNCE","OVERT","PAGAN","PALSY","PARKA","PARRY","PARSE","PECAN",
  "PENAL","PERCH","PERIL","PIETY","PIQUE","PITHY","PIVOT","PLAID","PLAIT","PLUMB","PLUME","POISE","POLYP","POSSE","PRAWN",
  "PREEN","PRISM","PRIVY","PRONE","PRONG","PROWL","PROXY","PRUDE","PSALM","PYGMY","QUAIL","QUALM","QUARK","QUASH","QUASI",
  "QUELL","QUERY","QUIRK","QUOTA","RABID","RADII","RAMEN","REBUS","REBUT","RECUR","REGAL","REIGN","RELIC","REMIT","RENAL",
  "REPEL","RESIN","REVEL","RHYME","RIGOR","RIVET","ROGUE","ROOST","ROTOR","ROUGE","ROUSE","ROWDY","RUDDY","RUPEE","SALVE",
  "SALVO","SATYR","SAUNA","SAUTE","SAVOR","SAVVY","SCALD","SCALP","SCAMP","SCANT","SCION","SCOFF","SCONE","SCORN","SCOUR",
  "SCOWL","SCRAM","SCREE","SCRUM","SEDAN","SEGUE","SEIZE","SEPIA","SERIF","SERUM","SEVER","SHACK","SHALE","SHAWL","SHEAR",
  "SHEEN","SHEIK","SHIRE","SHIRK","SHOAL","SHREW","SHRUB","SHUNT","SIEGE","SIEVE","SIGMA","SINEW","SINGE","SIREN","SKIFF",
  "SKIMP","SKULK","SLACK","SLAIN","SLEET","SLINK","SLOTH","SLUMP","SMELT","SMIRK","SMITE","SNARE","SNARL","SNEER","SNIDE",
  "SNIPE","SOBER","SONAR","SOOTH","SPASM","SPAWN","SPECK","SPIEL","SPIRE","SPITE","SPOOF","SPORE","SPRIG","SPUNK","SPURN",
  "SPURT","SQUIB","STAID","STALK","STAVE","STEAD","STEED","STEIN","STERN","STILT","STING","STINK","STINT","STOIC","STOKE",
  "STORK","STOUT","STRUT","SUAVE","SULLY","SUMAC","SURGE","SURLY","SWAMI","SWATH","SWOON","SYNOD","TABOO","TACIT","TAINT",
  "TALON","TAPER","TAPIR","TAROT","TAUNT","TAWNY","TEMPO","TENET","TENOR","TEPID","TERRA","TERSE","THETA","THYME","TIARA",
  "TIBIA","TIDAL","TILDE","TIMID","TITAN","TITHE","TONAL","TONIC","TOPAZ","TORSO","TORUS","TOTEM","TOXIN","TRACT","TRAWL",
  "TREAD","TRIAD","TRICE","TRIPE","TRITE","TROPE","TROVE","TRUCE","TRUSS","TRYST","TUBER","TULLE","TUNIC","TWANG","TWEAK",
  "TWINE","ULCER","UMBRA","UNDUE","UNIFY","USHER","USURP","UTTER","VAGUE","VALET","VALOR","VAPID","VAPOR","VAUNT","VENOM",
  "VENUE","VERGE","VERVE","VICAR","VIGIL","VIGOR","VIOLA","VIPER","VISOR","VISTA","VIXEN","VOGUE","VOILA","VOUCH","VYING",
  "WAFER","WAGER","WAIVE","WALTZ","WAVER","WEDGE","WHARF","WHELP","WHIFF","WHISK","WIELD","WINCE","WINCH","WISPY","WOVEN",
  "WRATH","WREAK","WREST","WRING","WRUNG","YACHT","YEARN","YEAST","YIELD","ZESTY","ZONAL"
];

const WORDLE_EXTRA_VALID = [
  "ACRES","ACTED","ADIEU","AUNTS","AUTOS","BABES","BACKS","BAKES","BALLS","BANDS","BANGS","BARNS","BASED","BASES","BATHS",
  "BEADS","BEAMS","BEANS","BEARS","BEATS","BEERS","BEETS","BELTS","BENDS","BIKES","BILLS","BIRDS","BITES","BLOWS","BOATS",
  "BOMBS","BONDS","BOOKS","BOOTS","BOWLS","BOXES","BUCKS","BULBS","BUMPS","BURNS","BUSES","BYTES","CAGES","CAKES","CALLS",
  "CAMPS","CANES","CAPES","CARDS","CARES","CARTS","CASES","CAVES","CHATS","CHEFS","CHINS","CHIPS","CLAMS","CLANS","CLAPS",
  "CLAWS","CLIPS","CLUBS","COALS","COATS","CODES","COINS","COLDS","COMES","CONES","COOKS","COOLS","CORDS","CORES","CORNS",
  "COSTS","CRABS","CREWS","CROPS","CROWS","CRWTH","CUBES","CURES","CURLS","DARTS","DATED","DATES","DEALS","DECKS","DEEDS",
  "DEERS","DENTS","DESKS","DIETS","DIMES","DINES","DIRTS","DISCS","DISKS","DOCKS","DOLLS","DOMES","DOORS","DOSES","DOVES",
  "DOWNS","DRAWS","DRIPS","DROPS","DRUGS","DRUMS","DUCKS","DUMPS","DUNES","DUSKS","DUSTS","EARNS","EDGES","ENDED","FAILS",
  "FAIRS","FAKES","FALLS","FANGS","FARMS","FEARS","FEEDS","FEELS","FILES","FILMS","FINDS","FIRED","FIRES","FIRMS","FIVES",
  "FIXED","FLATS","FLIES","FLIPS","FLOWS","FOAMS","FOLDS","FOLKS","FOODS","FOOLS","FORKS","FORMS","FORTS","FOXES","FROGS",
  "FUELS","FUMES","FUNDS","GAINS","GAMES","GANGS","GASES","GATES","GEARS","GENES","GERMS","GIFTS","GIRLS","GIVES","GLOWS",
  "GLUES","GOALS","GOATS","GOLDS","GOLFS","GOWNS","GRABS","GRAMS","GRIDS","GRINS","GRIPS","GROWS","HAIRS","HALLS","HALTS",
  "HANDS","HANGS","HARMS","HARPS","HATES","HEADS","HEALS","HEAPS","HEARS","HEATS","HEELS","HELPS","HERBS","HERDS","HIDES",
  "HIKES","HILLS","HINTS","HIRES","HIVES","HOLDS","HOLES","HOMES","HOOKS","HOPED","HOPES","HORNS","HOSTS","HOURS","HUNTS",
  "ICONS","IDEAS","JAILS","JOINS","JOKES","JUMPS","KEEPS","KICKS","KILLS","KINDS","KINGS","KITES","KNEES","KNITS","KNOTS",
  "KNOWS","LACES","LACKS","LAMBS","LAMPS","LANDS","LANES","LASTS","LAWNS","LEADS","LEAFS","LEAKS","LEANS","LEAPS","LENDS",
  "LIARS","LIFTS","LIKES","LIMBS","LIMES","LINES","LINKS","LIONS","LISTS","LIVED","LIVES","LOADS","LOANS","LOCKS","LOOKS",
  "LOOMS","LOOPS","LORDS","LOSES","LOVED","LOVES","LUMPS","LUNGS","MAIDS","MAILS","MAKES","MALLS","MARKS","MASKS","MATES",
  "MATHS","MEALS","MEANS","MEATS","MELTS","MEMES","MENDS","MENUS","MILES","MILKS","MILLS","MINDS","MINES","MINTS","MISTS",
  "MODES","MOLDS","MOODS","MOONS","MOTHS","MOVED","MOVES","NAILS","NAMED","NAMES","NECKS","NEEDS","NESTS","NODES","NOONS",
  "NORMS","NOSES","NOTED","NOTES","NOUNS","OATHS","ODORS","OMENS","OPENS","OUIJA","OVENS","OWNED","PACED","PACES","PACKS",
  "PAGES","PAINS","PAIRS","PALMS","PANTS","PARKS","PARTS","PATHS","PAVES","PEAKS","PEARS","PEELS","PEERS","PERKS","PESTS",
  "PICKS","PIERS","PIKES","PILES","PILLS","PINES","PINKS","PIPES","PLANS","PLAYS","PLOTS","PLUGS","POEMS","POETS","POKES",
  "POLES","POLLS","PONDS","POOLS","PORTS","POSED","POSES","POSTS","POURS","PRAYS","PULLS","PUMPS","QUITS","RACKS","RAGES",
  "RAILS","RAINS","RAKES","RAMPS","RANKS","RATED","RATES","READS","REEDS","REEFS","REELS","RENTS","RESTS","RIDES","RINGS",
  "RIOTS","RISES","RISKS","ROADS","ROARS","ROATE","ROCKS","ROLES","ROLLS","ROOFS","ROOMS","ROOTS","ROPES","ROSES","RUINS",
  "RULES","SACKS","SAGES","SAILS","SALES","SALET","SALTS","SANDS","SAVED","SAVES","SCANS","SCARS","SEALS","SEAMS","SEATS",
  "SEEDS","SEEKS","SEEMS","SELLS","SENDS","SHEDS","SHIPS","SHOES","SHOPS","SHOTS","SHOWS","SHUTS","SICKS","SIDES","SIGHS",
  "SIGNS","SILKS","SINGS","SINKS","SITES","SIZED","SIZES","SKINS","SKIPS","SLABS","SLAMS","SLAPS","SLEDS","SLIPS","SLOTS",
  "SLOWS","SNAPS","SNOWS","SOAPS","SOARE","SOCKS","SOFAS","SOILS","SONGS","SORTS","SOULS","SOUPS","SOURS","SPANS","SPINS",
  "SPITS","SPOTS","STABS","STAYS","STEMS","STEPS","STIRS","STOPS","SUITS","SWANS","SWIMS","TAILS","TALKS","TANKS","TAPES",
  "TARSE","TASKS","TAXES","TEAMS","TEARS","TEENS","TELLS","TENDS","TENTS","TERMS","TESTS","TEXTS","TIDES","TILES","TIMES",
  "TIRES","TOADS","TONES","TOOLS","TOURS","TOWNS","TRAPS","TRAYS","TREES","TRIES","TRIMS","TRIPS","TUBES","TUNES","TURNS",
  "TWINS","TYPED","TYPES","UNITS","USERS","VEINS","VENTS","VERBS","VESTS","VIBES","VIEWS","VINES","VOIDS","VOLTS","VOTES",
  "WAGES","WAITS","WAKES","WALKS","WALLS","WANTS","WARDS","WARMS","WARNS","WASPS","WAVES","WAXES","WEARS","WEEDS","WEEKS",
  "WELLS","WHIPS","WINDS","WINES","WINGS","WINKS","WIPES","WIRES","WOODS","WORDS","WORKS","WORMS","WRAPS","YARDS","YARNS",
  "YEARS","YELLS","ZONES"
];

const WORDLE_BANK = [...new Set([...WORDLE_EASY, ...WORDLE_MEDIUM, ...WORDLE_HARD])].filter(w => /^[A-Z]{5}$/.test(w));
const WORDLE_VALID_SET = new Set([...WORDLE_BANK, ...WORDLE_EXTRA_VALID].filter(w => /^[A-Z]{5}$/.test(w)));

const WORDLE_DIFFS = [
  { id: "easy", label: "Easy", desc: "Everyday familiar words" },
  { id: "medium", label: "Medium", desc: "Classic Wordle challenge" },
  { id: "hard", label: "Hard", desc: "Less common words, still fair & gettable" }
];

function mgWordlePool(diff){
  if (diff === "easy") return WORDLE_EASY;
  if (diff === "hard") return WORDLE_HARD;
  return WORDLE_MEDIUM;
}

function mgSetWordleDiff(diff){
  if (!["easy","medium","hard"].includes(diff)) return;
  const st = mgState();
  const p = st.active.wordle;
  st.wordleDiff = diff;
  if (!p){
    mgSave(st);
    need("msgs");
    return;
  }
  if (p.done){
    mgSave(st);
    if (mgPlaysLeft("wordle") > 0) mgStartNextPuzzle("wordle");
    else need("msgs");
    return;
  }
  if ((p.diff || "medium") === diff){
    mgSave(st);
    return;
  }
  const applySwitch = () => {
    const s2 = mgState();
    const cur = s2.active.wordle;
    if (cur && !cur.done && cur.guesses.length > 0){
      s2.plays.wordle = Math.min(MG_DAILY_LIMIT, (s2.plays.wordle || 0) + 1);
    }
    if (mgPlaysLeft("wordle") <= 0){
      s2.active.wordle = null;
      mgSave(s2);
      need("msgs");
      return;
    }
    const playNum = (s2.plays.wordle || 0) + 1;
    const word = mgPickFromPool("wordle", mgWordlePool(diff), w => w);
    s2.wordleDiff = diff;
    s2.active.wordle = { day: s2.day, playNum, diff, word, guesses: [], cur: "", done: false, won: false };
    mgSave(s2);
    toast("Switched to " + diff[0].toUpperCase() + diff.slice(1) + " Wordle");
    need("msgs");
  };
  if (p.guesses.length === 0){
    applySwitch();
  } else if (typeof confirmBox === "function"){
    confirmBox("Switch difficulty?", "You already started guessing this word. Switching to " + diff[0].toUpperCase() + diff.slice(1) + " will start a new word and count this attempt.", "Switch", applySwitch);
  } else if (window.confirm("Switch difficulty and start a new word?")){
    applySwitch();
  }
}

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
    .wd-diff-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-bottom: 14px; }
    .wd-diff-bar { display: inline-flex; gap: 4px; padding: 4px; border-radius: 999px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); }
    .wd-diff-btn { border: none; border-radius: 999px; padding: 5px 14px; font-size: 12px; font-weight: 700; cursor: pointer; background: transparent; color: var(--t2); transition: background .15s ease, color .15s ease; }
    .wd-diff-btn:hover { color: var(--t1); }
    .wd-diff-btn.on { background: #538d4e; color: #fff; }
    .wd-diff-btn.on.medium { background: #eab308; color: #111; }
    .wd-diff-btn.on.hard { background: #ef4444; color: #fff; }
    .wd-diff-sub { font-size: 12px; color: var(--t2); }
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
    .flp-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .flp-hud { display: flex; gap: 18px; align-items: center; font-size: 14px; font-weight: 700; background: var(--b2); padding: 8px 16px; border-radius: 999px; border: 1px solid rgba(255,255,255,.08); }
    .flp-canvas { border-radius: 14px; border: 2px solid rgba(255,255,255,.16); background: #0c4a6e; cursor: pointer; max-width: 100%; height: auto; touch-action: manipulation; box-shadow: 0 10px 28px rgba(0,0,0,.35); }
    .flp-tip { font-size: 12.5px; color: var(--t2); }
    .mg-lb { margin-top: 22px; background: var(--b2); border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 18px 20px; }
    .mg-lb-hdr { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
    .mg-lb-hdr h3 { margin: 0; font-size: 18px; display: flex; align-items: center; gap: 8px; }
    .mg-lb-tabs { display: flex; flex-wrap: wrap; gap: 6px; }
    .mg-lb-tab { border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.05); color: var(--t2); font-size: 12px; font-weight: 700; padding: 5px 11px; border-radius: 999px; cursor: pointer; transition: background .15s, color .15s; }
    .mg-lb-tab:hover { background: rgba(255,255,255,.12); color: var(--t1); }
    .mg-lb-tab.on { background: #5865f2; border-color: #5865f2; color: #fff; }
    .mg-lb-list { display: flex; flex-direction: column; gap: 7px; }
    .mg-lb-row { display: flex; align-items: center; gap: 11px; padding: 9px 12px; border-radius: 11px; background: rgba(255,255,255,.035); border: 1px solid rgba(255,255,255,.05); }
    .mg-lb-row.me { background: rgba(88,101,242,.16); border-color: rgba(88,101,242,.4); }
    .mg-lb-row.top1 { background: linear-gradient(90deg, rgba(234,179,8,.16), rgba(255,255,255,.035)); border-color: rgba(234,179,8,.35); }
    .mg-lb-rank { width: 28px; text-align: center; font-weight: 900; font-size: 14px; color: var(--t2); flex-shrink: 0; }
    .mg-lb-user { display: flex; align-items: center; gap: 9px; flex: 1; min-width: 0; cursor: pointer; }
    .mg-lb-name { font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mg-lb-sub { font-size: 11.5px; color: var(--t2); }
    .mg-lb-score { font-weight: 800; font-size: 13.5px; padding: 4px 10px; border-radius: 999px; background: rgba(255,255,255,.08); white-space: nowrap; }
    .mg-lb-empty { text-align: center; padding: 22px 12px; color: var(--t2); font-size: 13.5px; }
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
  if (game === "flappy" || game === "mario") return Infinity;
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
      h("div",{class:"note",style:{marginTop:"12px"},text:(meta.id === "flappy" || meta.id === "mario") ? ("Unlimited Plays: Play " + meta.name + " as many times as you want and chase the high score!") : ("Daily Limit: You can play up to 5 puzzles of " + meta.name + " every day. Your 5 plays reset automatically at midnight ET!")}),
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
    const diff = ["easy","medium","hard"].includes(st.wordleDiff) ? st.wordleDiff : "medium";
    st.wordleDiff = diff;
    const word = mgPickFromPool("wordle", mgWordlePool(diff), w => w);
    puzzle = { day: st.day, playNum, diff, word, guesses: [], cur: "", done: false, won: false };
  } else if (game === "bee"){
    puzzle = mgBuildBee(st.day, playNum);
  } else if (game === "sudoku"){
    puzzle = mgBuildSudoku(st.day, playNum);
  } else if (game === "crossword"){
    const cw = mgPickFromPool("crossword", CROSS_BANK, c => c.id);
    const entries = Array.from({length:5}, () => Array(5).fill(""));
    puzzle = { day: st.day, playNum, id: cw.id, grid: cw.grid, across: cw.across, down: cw.down, entries, r: 0, c: 0, dir: "across", done: false, won: false };
  } else if (game === "flappy" || game === "mario"){
    puzzle = { day: st.day, playNum, score: 0, done: false, won: false };
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
  if (game === "flappy" || game === "mario") st.plays[game] = (st.plays[game] || 0) + 1;
  else st.plays[game] = Math.min(MG_DAILY_LIMIT, (st.plays[game] || 0) + 1);
  if (won){ st.wins[game] = (st.wins[game] || 0) + 1; bumpStat("gameWins"); }
  mgSave(st);
  syncGameScore(game, p.score);
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
  const isUnlimited = meta.id === "flappy";
  const left = mgPlaysLeft(meta.id);
  const used = mgPlaysUsed(meta.id);
  return h("div",{class:"mg-topbar"},
    h("button",{class:"btn ghost small",onclick:() => openChat("games", "hub")}, "← All Games"),
    h("div",{class:"mg-toptitle"},
      h("span",{style:{fontSize:"20px"},text:meta.icon}),
      h("b",{text:meta.name}),
      p ? h("span",{class:"mg-pill",text:isUnlimited ? "Run #" + p.playNum + " · Unlimited" : "Puzzle #" + p.playNum + " of " + MG_DAILY_LIMIT}) : null
    ),
    h("div",{class:"mg-topright"},
      isUnlimited
        ? h("span",{class:"mg-pill",text:"∞ Unlimited Plays"})
        : h("div",{class:"mg-pips",title:left + " plays remaining today"},
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
    const dailyGames = MG_META.filter(g => g.id !== "flappy" && g.id !== "mario");
    const totalLeft = dailyGames.reduce((sum, g) => sum + mgPlaysLeft(g.id), 0);
    wrap.appendChild(h("div",{class:"mg-hero"},
      h("div",{class:"mg-hero-badge"}, "DAILY ARCADE · RESETS MIDNIGHT ET"),
      h("h2",{text:"CampusCord Mini Games"}),
      h("p",{text:"Daily brainteasers (5 plays each — " + totalLeft + " left today) plus unlimited Flappy Cord & Super Cord Bros!"}),
      h("div",{class:"mg-hero-actions"},
        h("button",{class:"btn small",onclick:() => mgHelpModal("wordle")}, "? How to Play")
      )
    ));
    const grid = h("div",{class:"mg-hub-grid"});
    MG_META.forEach(g => {
      const isUnlimited = g.id === "flappy" || g.id === "mario";
      const left = mgPlaysLeft(g.id);
      const used = mgPlaysUsed(g.id);
      const act = st.active[g.id];
      const statusText = isUnlimited
        ? (act && !act.done ? "In progress (Run #" + act.playNum + ")" : "Unlimited plays · " + used + " played today")
        : (act && !act.done ? "In progress (Puzzle #" + act.playNum + ")" : left > 0 ? left + " of 5 plays left today" : "All 5 plays done today!");
      grid.appendChild(h("div",{class:"mg-card", style:{"--mg-accent": g.accent}, onclick:() => openChat("games", g.id)},
        h("div",{class:"mg-card-top"},
          h("span",{class:"mg-card-icon",text:g.icon}),
          h("span",{class:"mg-card-tag",text:g.badge})
        ),
        h("h3",{text:g.name}),
        h("p",{text:g.tagline}),
        h("div",{class:"mg-card-foot"},
          isUnlimited
            ? h("span",{class:"mg-pill",text:"∞ Unlimited"})
            : h("div",{class:"mg-pips"}, ...Array.from({length:MG_DAILY_LIMIT}, (_, i) => h("span",{class:"mg-pip" + (i < used ? " used" : "")}))),
          h("span",{class:"mg-card-stat",text:statusText})
        ),
        h("div",{class:"mg-card-btns"},
          h("button",{class:"btn small", style:{background:g.accent, color:"#111", fontWeight:"700"}}, act && !act.done ? "Resume" : (isUnlimited || left > 0) ? "Play" : "View Board"),
          h("button",{class:"btn ghost small", onclick:e => { e.stopPropagation(); mgHelpModal(g.id); }}, "? Rules")
        )
      ));
    });
    wrap.appendChild(grid);
    wrap.appendChild(mgLeaderboardEl());
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
  else if (page === "flappy") renderFlappy(wrap, p);
  else if (page === "mario") renderMario(wrap, p);
  box.appendChild(wrap);
}

function wordleInput(ch){
  const st = mgState();
  const p = st.active.wordle;
  if (!p || p.done) return;
  p.cur = String(p.cur || "").replace(/[^A-Za-z]/g, "").slice(0, 5).toUpperCase();
  if (ch === "BACK"){
    p.cur = p.cur.slice(0, -1);
  } else if (ch === "ENTER"){
    if (p.cur.length < 5){ toast("Not enough letters (need 5)"); return; }
    const guess = p.cur.toUpperCase();
    if (!WORDLE_VALID_SET.has(guess)){
      toast("Not in word list");
      return;
    }
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
  const curDiff = ["easy","medium","hard"].includes(p.diff) ? p.diff : "medium";
  const diffMeta = WORDLE_DIFFS.find(d => d.id === curDiff) || WORDLE_DIFFS[1];
  wrap.appendChild(h("div",{class:"wd-diff-wrap"},
    h("div",{class:"wd-diff-bar"},
      ...WORDLE_DIFFS.map(d => h("button",{
        class:"wd-diff-btn" + (curDiff === d.id ? " on " + d.id : ""),
        onclick:() => mgSetWordleDiff(d.id)
      }, d.label))
    ),
    h("div",{class:"wd-diff-sub",text:diffMeta.label + " · " + diffMeta.desc})
  ));

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
    const diffLabel = curDiff[0].toUpperCase() + curDiff.slice(1);
    const emojiGrid = p.guesses.map(g => wordleScoreRow(g, p.word).map(s => s === "correct" ? "🟩" : s === "present" ? "🟨" : "⬛").join("")).join("\n");
    const shareTxt = "CampusCord Wordle (" + diffLabel + ") #" + p.playNum + " (" + (p.won ? p.guesses.length + "/6" : "X/6") + ")\n" + emojiGrid;
    wrap.appendChild(h("div",{class:"mg-result"},
      h("b",{text: p.won ? "Solved (" + diffLabel + ") in " + p.guesses.length + "/6 tries!" : "The word was " + p.word}),
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
  if (e.ctrlKey || e.metaKey || e.altKey) return;
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
  } else if (page === "flappy"){
    if (k === " " || k === "ArrowUp" || k === "w" || k === "W"){
      e.preventDefault();
      if (window._flappyFlap) window._flappyFlap();
    }
  } else if (page === "mario"){
    if (k === " " || k === "ArrowUp" || k === "ArrowDown" || k === "ArrowLeft" || k === "ArrowRight"){
      e.preventDefault();
    }
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
function renderFlappy(wrap, p){
  if (window._flappyRaf){
    cancelAnimationFrame(window._flappyRaf);
    window._flappyRaf = null;
  }
  const bestKey = "cc_flappy_best";
  const muteKey = "cc_flappy_mute";
  let best = Number(mgReadStore(bestKey) || 0);
  let muted = mgReadStore(muteKey) === "1";

  function sfx(type){
    if (muted) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!window._flpAc) window._flpAc = new AC();
      const ac = window._flpAc;
      if (ac.state === "suspended") ac.resume();
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      if (type === "flap"){
        osc.type = "triangle";
        osc.frequency.setValueAtTime(290, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.085);
        gain.gain.setValueAtTime(0.13, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "score"){
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.3, now);
        osc.frequency.setValueAtTime(880, now + 0.065);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.23);
      } else if (type === "hit"){
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(165, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + 0.24);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
        osc.start(now);
        osc.stop(now + 0.27);
      }
    } catch (e) {}
  }

  const box = h("div", {class: "flp-wrap"});
  const scoreEl = h("span", {text: "Score: " + (p.score || 0)});
  const bestEl = h("span", {text: "Best: " + best});
  const muteBtn = h("button", {
    class: "btn ghost small",
    style: {padding: "2px 8px", fontSize: "12px"},
    text: muted ? "🔇 Muted" : "🔊 SFX",
    onclick: () => {
      muted = !muted;
      mgWriteStore(muteKey, muted ? "1" : "0");
      muteBtn.textContent = muted ? "🔇 Muted" : "🔊 SFX";
    }
  });
  const hud = h("div", {class: "flp-hud"}, scoreEl, bestEl, muteBtn);
  const canvas = h("canvas", {class: "flp-canvas", width: 380, height: 500});
  const tip = h("div", {class: "flp-tip", text: "Click, tap, or press Space / Up Arrow to flap!"});
  box.append(hud, canvas, tip);

  const resSlot = h("div");
  box.appendChild(resSlot);
  wrap.appendChild(box);

  function showResult(){
    resSlot.innerHTML = "";
    if (!p.done) return;
    const shareTxt = "CampusCord Flappy Cord #" + p.playNum + "\nScore: " + p.score + " (Best: " + best + ")";
    resSlot.appendChild(h("div", {class: "mg-result"},
      h("b", {text: p.score >= 5 ? "Nice flight! Run complete!" : "Crashed!"}),
      h("div", {class: "note", text: "Final Score: " + p.score + " · Best: " + best + (p.score >= 5 ? " (Counts as a win!)" : "")}),
      h("div", {class: "mg-res-btns"},
        h("button", {class: "btn small", onclick: () => mgCopyText(shareTxt, "Score copied!")}, "Share Score"),
        h("button", {class: "btn primary small", onclick: () => mgStartNextPuzzle("flappy")}, "Play Again (Unlimited)"),
        h("button", {class: "btn small", onclick: () => openChat("games", "hub")}, "Back to Games")
      )
    ));
  }

  const ctx = canvas.getContext("2d");
  const W = 380, H = 500, GROUND = 64, BIRD_X = 92, BIRD_R = 14;
  const GRAVITY = 0.42, FLAP = -7.35, PIPE_W = 58, GAP = 132, SPEED = 2.65, PIPE_SPACING = 215;

  const skyGrad = ctx.createLinearGradient(0, 0, 0, H - GROUND);
  skyGrad.addColorStop(0, "#0369a1");
  skyGrad.addColorStop(0.55, "#38bdf8");
  skyGrad.addColorStop(1, "#bae6fd");

  const sunX = 305, sunY = 76;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 72);
  sunGlow.addColorStop(0, "rgba(254, 249, 195, 0.95)");
  sunGlow.addColorStop(0.35, "rgba(253, 224, 71, 0.35)");
  sunGlow.addColorStop(1, "rgba(253, 224, 71, 0)");

  const dirtGrad = ctx.createLinearGradient(0, H - GROUND + 16, 0, H);
  dirtGrad.addColorStop(0, "#d97706");
  dirtGrad.addColorStop(0.35, "#b45309");
  dirtGrad.addColorStop(1, "#78350f");

  const buildings = [
    {w: 34, h: 92}, {w: 28, h: 125}, {w: 40, h: 78}, {w: 32, h: 142},
    {w: 36, h: 105}, {w: 30, h: 86}, {w: 38, h: 132}, {w: 26, h: 96}
  ];

  function drawBackdrop(scroll){
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H - GROUND);

    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fef9c3";
    ctx.beginPath();
    ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
    ctx.fill();

    // Soft layered clouds with shaded undersides
    for (let i = 0; i < 4; i++){
      const cx = ((i * 135 - scroll * 0.25) % (W + 140) + (W + 140)) % (W + 140) - 70;
      const cy = 54 + (i % 3) * 42;
      ctx.fillStyle = "rgba(186, 230, 253, 0.65)";
      ctx.beginPath();
      ctx.arc(cx, cy + 5, 19, 0, Math.PI * 2);
      ctx.arc(cx + 20, cy + 3, 23, 0, Math.PI * 2);
      ctx.arc(cx + 42, cy + 5, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      ctx.arc(cx, cy, 19, 0, Math.PI * 2);
      ctx.arc(cx + 19, cy - 6, 24, 0, Math.PI * 2);
      ctx.arc(cx + 40, cy, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distant city skyline parallax
    const citySpan = 266;
    const cityOff = (scroll * 0.45) % citySpan;
    for (let rep = -1; rep <= 2; rep++){
      let bx = rep * citySpan - cityOff;
      for (let i = 0; i < buildings.length; i++){
        const b = buildings[i];
        const by = H - GROUND - b.h;
        ctx.fillStyle = i % 2 === 0 ? "#60a5fa" : "#7dd3fc";
        ctx.fillRect(bx, by, b.w - 2, b.h);
        // Lit building windows
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        for (let wy = by + 10; wy < H - GROUND - 16; wy += 16){
          for (let wx = bx + 5; wx < bx + b.w - 9; wx += 9){
            if (((Math.floor(wx) + wy + i) % 3) !== 0) ctx.fillRect(wx, wy, 4, 7);
          }
        }
        bx += b.w;
      }
    }

    // Midground foliage hills
    const hillSpan = 160;
    const hillOff = (scroll * 0.95) % hillSpan;
    ctx.fillStyle = "#34d399";
    for (let x = -hillSpan; x < W + hillSpan; x += 40){
      const hx = x - hillOff;
      ctx.beginPath();
      ctx.arc(hx + 20, H - GROUND + 4, 28, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillStyle = "#10b981";
    for (let x = -hillSpan; x < W + hillSpan; x += 52){
      const hx = x - hillOff * 1.15;
      ctx.beginPath();
      ctx.arc(hx + 26, H - GROUND + 8, 24, Math.PI, 0);
      ctx.fill();
    }
  }

  function drawGround(scroll){
    const gy = H - GROUND;
    ctx.fillStyle = dirtGrad;
    ctx.fillRect(0, gy + 16, W, GROUND - 16);

    // Subtle soil pebbles
    ctx.fillStyle = "rgba(69, 26, 3, 0.35)";
    const pebOff = (scroll * SPEED) % 48;
    for (let x = -48; x < W + 48; x += 48){
      ctx.beginPath();
      ctx.ellipse(x - pebOff + 14, gy + 32, 6, 3, 0.2, 0, Math.PI * 2);
      ctx.ellipse(x - pebOff + 36, gy + 47, 5, 2.5, -0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Scrolling diagonal grass turf strip
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(0, gy, W, 16);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, gy, W, 16);
    ctx.clip();
    ctx.fillStyle = "#4ade80";
    const stripeW = 24;
    const off = (scroll * SPEED) % stripeW;
    for (let x = -stripeW; x < W + stripeW; x += stripeW){
      ctx.beginPath();
      ctx.moveTo(x - off, gy + 16);
      ctx.lineTo(x - off + 10, gy);
      ctx.lineTo(x - off + 20, gy);
      ctx.lineTo(x - off + 10, gy + 16);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Crisp turf borders
    ctx.fillStyle = "#86efac";
    ctx.fillRect(0, gy, W, 2.5);
    ctx.fillStyle = "#14532d";
    ctx.fillRect(0, gy - 1, W, 2);
    ctx.fillRect(0, gy + 15, W, 2.5);
  }

  function drawPipe(x, y, w, h, isTop){
    if (h <= 0) return;
    ctx.fillStyle = "#16a34a";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#4ade80";
    ctx.fillRect(x + 6, y, 12, h);
    ctx.fillStyle = "#86efac";
    ctx.fillRect(x + 11, y, 4, h);
    ctx.fillStyle = "#15803d";
    ctx.fillRect(x + w - 10, y, 10, h);

    ctx.fillStyle = "rgba(5, 46, 22, 0.45)";
    ctx.fillRect(x, isTop ? y + h - 24 : y + 18, w, 6);

    ctx.strokeStyle = "#052e16";
    ctx.lineWidth = 2.2;
    ctx.strokeRect(x, isTop ? y - 2 : y, w, h + 2);

    const lipH = 20;
    const lipY = isTop ? y + h - lipH : y;
    const lipX = x - 4;
    const lipW = w + 8;

    ctx.fillStyle = "#16a34a";
    ctx.fillRect(lipX, lipY, lipW, lipH);
    ctx.fillStyle = "#4ade80";
    ctx.fillRect(lipX + 7, lipY, 14, lipH);
    ctx.fillStyle = "#bbf7d0";
    ctx.fillRect(lipX + 12, lipY, 5, lipH);
    ctx.fillStyle = "#14532d";
    ctx.fillRect(lipX + lipW - 11, lipY, 11, lipH);

    // Top specular highlight on lip
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fillRect(lipX + 2, lipY + 2, lipW - 4, 2.5);

    ctx.strokeStyle = "#052e16";
    ctx.lineWidth = 2.2;
    ctx.strokeRect(lipX, lipY, lipW, lipH);

    // Rivets on lip
    ctx.fillStyle = "#052e16";
    ctx.beginPath();
    ctx.arc(lipX + 7, lipY + lipH / 2, 1.8, 0, Math.PI * 2);
    ctx.arc(lipX + lipW - 7, lipY + lipH / 2, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBird(x, y, angle, wingPhase, dead){
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Soft drop shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    ctx.beginPath();
    ctx.ellipse(1, 4, BIRD_R + 3, BIRD_R, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tail feathers
    ctx.fillStyle = "#d97706";
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-12, -2);
    ctx.lineTo(-21, -6);
    ctx.lineTo(-18, 0);
    ctx.lineTo(-21, 5);
    ctx.lineTo(-12, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_R + 3, BIRD_R, 0, 0, Math.PI * 2);
    ctx.fill();

    // Warm cream belly patch
    ctx.fillStyle = "#fef9c3";
    ctx.beginPath();
    ctx.ellipse(2, 5, BIRD_R - 2, 6.5, -0.1, 0, Math.PI);
    ctx.fill();

    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_R + 3, BIRD_R, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Rosy cheek
    ctx.fillStyle = "rgba(249, 115, 22, 0.45)";
    ctx.beginPath();
    ctx.ellipse(5, 3, 3.5, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Expressive eye
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(6.5, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    if (dead){
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(4.5, -6); ctx.lineTo(8.5, -2);
      ctx.moveTo(8.5, -6); ctx.lineTo(4.5, -2);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(8, -4, 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(8.8, -5, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    // Two-part layered beak
    ctx.fillStyle = "#f97316";
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(12, -1.5);
    ctx.quadraticCurveTo(22, -1, 22, 2);
    ctx.lineTo(12, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ea580c";
    ctx.beginPath();
    ctx.moveTo(12, 2.5);
    ctx.lineTo(20, 2.5);
    ctx.quadraticCurveTo(19, 6.5, 12, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Articulated flapping wing
    const wingY = Math.sin(wingPhase) * 4.5;
    const wingRot = Math.sin(wingPhase) * 0.45;
    ctx.save();
    ctx.translate(-3, 1 + wingY * 0.35);
    ctx.rotate(wingRot);
    ctx.fillStyle = "#fef9c3";
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  if (p.done){
    drawBackdrop(12);
    drawGround(12);
    ctx.fillStyle = "rgba(15, 23, 42, 0.58)";
    ctx.fillRect(36, 145, W - 72, 165);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(36, 145, W - 72, 165);
    ctx.fillStyle = "#fff";
    ctx.font = "900 26px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Run Finished!", W / 2, 192);
    ctx.font = "700 19px system-ui, sans-serif";
    ctx.fillStyle = "#fde047";
    ctx.fillText("Score: " + p.score + "  ·  Best: " + best, W / 2, 230);
    const medal = p.score >= 25 ? "👑 Platinum Medal" : p.score >= 15 ? "🥇 Gold Medal" : p.score >= 8 ? "🥈 Silver Medal" : p.score >= 5 ? "🥉 Bronze Medal" : "Keep Practicing!";
    ctx.font = "700 14px system-ui, sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(medal, W / 2, 266);
    showResult();
    return;
  }

  let state = "ready"; // ready | playing | dead
  let birdY = (H - GROUND) / 2;
  let velY = 0;
  let score = 0;
  let pipes = [];
  let particles = [];
  let popups = [];
  let frame = 0;
  let scroll = 0;
  let wingPhase = 0;
  let shake = 0;
  let flash = 0;
  let deadAt = 0;
  let lastTs = 0;
  let acc = 0;
  let active = true;
  const FIXED_STEP = 1000 / 60;

  function addParticles(x, y, count, colors, speed){
    for (let i = 0; i < count; i++){
      const a = Math.random() * Math.PI * 2;
      const sp = (0.35 + Math.random() * 0.65) * speed;
      particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1.2,
        r: 2.2 + Math.random() * 2.8,
        color: colors[i % colors.length],
        life: 1
      });
    }
  }

  function spawnPipe(x){
    const minTop = 58;
    const maxTop = H - GROUND - GAP - 58;
    const topH = Math.floor(minTop + Math.random() * (maxTop - minTop));
    pipes.push({ x, topH, passed: false });
  }

  function flap(){
    if (!document.body.contains(canvas)) return;
    if (state === "ready"){
      state = "playing";
      pipes = [];
      spawnPipe(W + 40);
      spawnPipe(W + 40 + PIPE_SPACING);
      velY = FLAP;
      wingPhase = 1.4;
      sfx("flap");
      addParticles(BIRD_X - 10, birdY + 4, 6, ["#fff", "#fef08a", "#bae6fd"], 2.4);
    } else if (state === "playing"){
      velY = FLAP;
      wingPhase = 1.4;
      sfx("flap");
      addParticles(BIRD_X - 10, birdY + 4, 6, ["#fff", "#fef08a", "#bae6fd"], 2.4);
    } else if (state === "dead"){
      if (performance.now() - deadAt > 450){
        mgStartNextPuzzle("flappy");
      }
    }
  }

  window._flappyFlap = flap;
  canvas.addEventListener("pointerdown", e => {
    e.preventDefault();
    flap();
  });

  function finishRun(){
    if (state === "dead") return;
    state = "dead";
    deadAt = performance.now();
    active = false;
    shake = 10;
    flash = 0.75;
    sfx("hit");
    addParticles(BIRD_X, birdY, 18, ["#facc15", "#fef08a", "#f97316", "#fff"], 4.8);
    draw();
    if (window._flappyRaf){
      cancelAnimationFrame(window._flappyRaf);
      window._flappyRaf = null;
    }
    if (score > best){
      best = score;
      mgWriteStore(bestKey, String(best));
      bestEl.textContent = "Best: " + best;
    }
    const st = mgState();
    if (st.active.flappy){
      st.active.flappy.score = score;
      mgSave(st);
    }
    p.score = score;
    mgCompletePuzzle("flappy", score >= 5);
    p.done = true;
    p.score = score;
    p.won = score >= 5;
    showResult();
    need("side");
  }

  function draw(){
    ctx.save();
    if (shake > 0.2){
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }

    drawBackdrop(scroll);

    for (const pp of pipes){
      const botY = pp.topH + GAP;
      const botH = H - GROUND - botY;
      drawPipe(pp.x, 0, PIPE_W, pp.topH, true);
      drawPipe(pp.x, botY, PIPE_W, botH, false);
    }

    drawGround(scroll);

    // Feather / sparkle particles
    for (const pt of particles){
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const angle = state === "ready"
      ? Math.sin(frame * 0.08) * 0.08
      : Math.max(-0.48, Math.min(1.35, velY * 0.072));
    drawBird(BIRD_X, birdY, angle, wingPhase, state === "dead");

    // Floating +1 score popups
    for (const pop of popups){
      ctx.globalAlpha = Math.max(0, pop.life);
      ctx.font = "900 20px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0,0,0,0.65)";
      ctx.lineWidth = 3.5;
      ctx.strokeText(pop.text, pop.x, pop.y);
      ctx.fillStyle = "#fde047";
      ctx.fillText(pop.text, pop.x, pop.y);
    }
    ctx.globalAlpha = 1;

    // Arcade HUD score
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "rgba(15, 23, 42, 0.75)";
    ctx.lineWidth = 5;
    ctx.font = "900 40px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.strokeText(String(score), W / 2, 58);
    ctx.fillText(String(score), W / 2, 58);

    if (state === "ready"){
      ctx.fillStyle = "rgba(15, 23, 42, 0.62)";
      ctx.fillRect(46, 198, W - 92, 88);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(46, 198, W - 92, 88);
      ctx.fillStyle = "#fff";
      ctx.font = "800 20px system-ui, sans-serif";
      ctx.fillText("Tap or Press Space", W / 2, 235);
      ctx.font = "600 13px system-ui, sans-serif";
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText("Fly through the pipes!", W / 2, 261);
    }

    if (flash > 0.01){
      ctx.fillStyle = "rgba(255, 255, 255, " + flash + ")";
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
  }

  function stepPhysics(){
    frame += 1;
    wingPhase += (state === "playing" && velY < 0 ? 0.55 : 0.24);
    if (shake > 0) shake *= 0.82;
    if (flash > 0) flash = Math.max(0, flash - 0.08);

    for (let i = particles.length - 1; i >= 0; i--){
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.16;
      pt.life -= 0.035;
      if (pt.life <= 0) particles.splice(i, 1);
    }
    for (let i = popups.length - 1; i >= 0; i--){
      const pop = popups[i];
      pop.y -= 0.9;
      pop.life -= 0.028;
      if (pop.life <= 0) popups.splice(i, 1);
    }

    if (state === "ready"){
      scroll += 0.75;
      birdY = (H - GROUND) / 2 + Math.sin(frame * 0.08) * 6;
    } else if (state === "playing"){
      scroll += 1;
      velY += GRAVITY;
      birdY += velY;

      for (const pp of pipes){
        pp.x -= SPEED;
        if (!pp.passed && pp.x + PIPE_W < BIRD_X){
          pp.passed = true;
          score++;
          sfx("score");
          popups.push({ x: BIRD_X + 18, y: birdY - 22, text: "+1", life: 1 });
          addParticles(BIRD_X + 10, birdY - 12, 8, ["#fde047", "#fff", "#4ade80"], 2.8);
          scoreEl.textContent = "Score: " + score;
          if (score > best){
            best = score;
            mgWriteStore(bestKey, String(best));
            bestEl.textContent = "Best: " + best;
          }
        }
        const hitX = BIRD_X + BIRD_R - 4 > pp.x && BIRD_X - BIRD_R + 4 < pp.x + PIPE_W;
        const hitY = birdY - BIRD_R + 4 < pp.topH || birdY + BIRD_R - 4 > pp.topH + GAP;
        if (hitX && hitY){
          finishRun();
          return;
        }
      }

      if (pipes.length){
        const lastPipe = pipes[pipes.length - 1];
        if (lastPipe.x < W - PIPE_SPACING + 40){
          spawnPipe(lastPipe.x + PIPE_SPACING);
        }
      }
      if (pipes.length && pipes[0].x + PIPE_W < -25){
        pipes.shift();
      }

      if (birdY + BIRD_R >= H - GROUND){
        birdY = H - GROUND - BIRD_R;
        finishRun();
        return;
      }
      if (birdY - BIRD_R < 0){
        birdY = BIRD_R;
        velY = 0;
      }
    }
  }

  function loop(ts){
    if (!active || !document.body.contains(canvas)){
      if (window._flappyFlap === flap) window._flappyFlap = null;
      return;
    }
    if (!lastTs) lastTs = ts;
    acc += Math.min(100, ts - lastTs);
    lastTs = ts;

    while (acc >= FIXED_STEP && active){
      stepPhysics();
      acc -= FIXED_STEP;
    }

    if (active){
      draw();
      window._flappyRaf = requestAnimationFrame(loop);
    }
  }

  window._flappyRaf = requestAnimationFrame(loop);
}
let mgLbTab = "wins";
let mgLbUnsub = null;

function watchGameScores(){
  if (mgLbUnsub || !S.uid) return;
  mgLbUnsub = onSnapshot(collection(db, "gameScores"), snap => {
    S.gameScores = snap.docs.map(d => Object.assign({ uid: d.id }, d.data()));
    if (S.kind === "games" && (S.page || "hub") === "hub") need("msgs");
  }, () => {});
  S.unsubApp.push(() => { if (mgLbUnsub){ mgLbUnsub(); mgLbUnsub = null; } });
  syncGameScore();
}

async function syncGameScore(lastGame, runScore){
  if (!S.uid || !member(S.uid)) return;
  try {
    const st = mgState();
    const w = st.wins || {};
    const wordle = Math.max(0, Math.floor(Number(w.wordle || 0)));
    const bee = Math.max(0, Math.floor(Number(w.bee || 0)));
    const sudoku = Math.max(0, Math.floor(Number(w.sudoku || 0)));
    const crossword = Math.max(0, Math.floor(Number(w.crossword || 0)));
    const flappyWins = Math.max(0, Math.floor(Number(w.flappy || 0)));
    const marioWins = Math.max(0, Math.floor(Number(w.mario || 0)));
    const localBest = Math.max(0, Math.floor(Number(mgReadStore("cc_flappy_best") || 0)));
    const localMarioBest = Math.max(0, Math.floor(Number(mgReadStore("cc_mario_best") || 0)));
    const existing = (S.gameScores || []).find(x => x.uid === S.uid) || {};
    const flappyBest = Math.max(localBest, Number(existing.flappyBest || 0), lastGame === "flappy" ? Math.max(0, Math.floor(Number(runScore || 0))) : 0);
    const marioBest = Math.max(localMarioBest, Number(existing.marioBest || 0), lastGame === "mario" ? Math.max(0, Math.floor(Number(runScore || 0))) : 0);
    const totalWins = Math.max(wordle + bee + sudoku + crossword + flappyWins + marioWins, Number(existing.totalWins || 0));
    const payload = {
      uid: S.uid,
      totalWins,
      wordle: Math.max(wordle, Number(existing.wordle || 0)),
      bee: Math.max(bee, Number(existing.bee || 0)),
      sudoku: Math.max(sudoku, Number(existing.sudoku || 0)),
      crossword: Math.max(crossword, Number(existing.crossword || 0)),
      flappyWins: Math.max(flappyWins, Number(existing.flappyWins || 0)),
      flappyBest,
      marioWins: Math.max(marioWins, Number(existing.marioWins || 0)),
      marioBest,
      updatedAt: Date.now()
    };
    await setDoc(doc(db, "gameScores", S.uid), payload, { merge: true });
  } catch (e) {}
}

function mgLeaderboardEl(){
  watchGameScores();
  const tabs = [
    { id: "wins", label: "🏆 Overall Wins" },
    { id: "mario", label: "🍄 Cord Bros" },
    { id: "flappy", label: "🐦 Flappy Best" },
    { id: "wordle", label: "🟩 Wordle" },
    { id: "bee", label: "🐝 Spelling Bee" },
    { id: "sudoku", label: "🔢 Sudoku" },
    { id: "crossword", label: "📰 Crossword" }
  ];
  const valFor = row => {
    if (mgLbTab === "mario") return Number(row.marioBest || 0);
    if (mgLbTab === "flappy") return Number(row.flappyBest || 0);
    if (mgLbTab === "wordle") return Number(row.wordle || 0);
    if (mgLbTab === "bee") return Number(row.bee || 0);
    if (mgLbTab === "sudoku") return Number(row.sudoku || 0);
    if (mgLbTab === "crossword") return Number(row.crossword || 0);
    return Number(row.totalWins || 0);
  };
  const labelFor = v => (mgLbTab === "flappy" || mgLbTab === "mario") ? (v + " pts") : (v + (v === 1 ? " win" : " wins"));
  const rows = (S.gameScores || [])
    .filter(r => member(r.uid) && !isBanned(r.uid) && valFor(r) > 0)
    .sort((a, b) => valFor(b) - valFor(a) || (a.updatedAt || 0) - (b.updatedAt || 0))
    .slice(0, 15);

  const box = h("div", { class: "mg-lb" },
    h("div", { class: "mg-lb-hdr" },
      h("h3", {}, "🏆 Mini Games Leaderboard"),
      h("div", { class: "mg-lb-tabs" }, ...tabs.map(tb =>
        h("button", {
          class: "mg-lb-tab" + (mgLbTab === tb.id ? " on" : ""),
          onclick: () => { mgLbTab = tb.id; need("msgs"); }
        }, tb.label)
      ))
    )
  );

  if (!rows.length){
    box.appendChild(h("div", { class: "mg-lb-empty" }, "No scores on this board yet — play a game to claim #1!"));
    return box;
  }

  const medals = ["🥇", "🥈", "🥉"];
  const list = h("div", { class: "mg-lb-list" });
  rows.forEach((r, idx) => {
    const isMe = r.uid === S.uid;
    const score = valFor(r);
    const nameEl = h("span", { class: "mg-lb-name" }, nickOf(r.uid));
    paintName(nameEl, r.uid);
    const subParts = [];
    if (r.marioBest) subParts.push("Cord Bros: " + r.marioBest);
    if (r.flappyBest) subParts.push("Flappy: " + r.flappyBest);
    if (r.totalWins) subParts.push("Total Wins: " + r.totalWins);
    const rowEl = h("div", {
      class: "mg-lb-row" + (isMe ? " me" : "") + (idx === 0 ? " top1" : "")
    },
      h("div", { class: "mg-lb-rank" }, medals[idx] || ("#" + (idx + 1))),
      h("div", { class: "mg-lb-user", onclick: e => openProfile(r.uid, e.currentTarget) },
        avatar(r.uid, "sm"),
        h("div", { style: { minWidth: 0 } },
          h("div", { style: { display: "flex", alignItems: "center", gap: "6px" } }, nameEl, roleTags(r.uid, true)),
          subParts.length ? h("div", { class: "mg-lb-sub" }, subParts.join(" · ")) : null
        )
      ),
      h("div", { class: "mg-lb-score" }, labelFor(score))
    );
    list.appendChild(rowEl);
  });
  box.appendChild(list);
  return box;
}

function renderMario(wrap, p){
  if (window._marioRaf){
    cancelAnimationFrame(window._marioRaf);
    window._marioRaf = null;
  }
  const bestKey = "cc_mario_best";
  const muteKey = "cc_mario_mute";
  let best = Number(mgReadStore(bestKey) || 0);
  let muted = mgReadStore(muteKey) === "1";

  function sfx(type){
    if (muted) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!window._marioAc) window._marioAc = new AC();
      const ac = window._marioAc;
      if (ac.state === "suspended") ac.resume();
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      if (type === "jump"){
        osc.type = "square";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.14);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now); osc.stop(now + 0.17);
      } else if (type === "coin"){
        osc.type = "sine";
        osc.frequency.setValueAtTime(987.8, now);
        osc.frequency.setValueAtTime(1318.5, now + 0.06);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.start(now); osc.stop(now + 0.25);
      } else if (type === "stomp"){
        osc.type = "triangle";
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.11);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now); osc.stop(now + 0.13);
      } else if (type === "powerup"){
        osc.type = "triangle";
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.setValueAtTime(440, now + 0.07);
        osc.frequency.setValueAtTime(554, now + 0.14);
        osc.frequency.setValueAtTime(659, now + 0.21);
        gain.gain.setValueAtTime(0.13, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.start(now); osc.stop(now + 0.33);
      } else if (type === "bump"){
        osc.type = "triangle";
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(95, now + 0.07);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now); osc.stop(now + 0.09);
      } else if (type === "win"){
        osc.type = "triangle";
        [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => osc.frequency.setValueAtTime(f, now + idx * 0.09));
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
        osc.start(now); osc.stop(now + 0.5);
      } else if (type === "die"){
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.38);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now); osc.stop(now + 0.42);
      }
    } catch (e) {}
  }

  const box = h("div", {class: "flp-wrap", style: {maxWidth: "660px"}});
  const stageEl = h("span", {text: "Stage 1-1"});
  const scoreEl = h("span", {text: "Score: " + (p.score || 0)});
  const coinsEl = h("span", {text: "🪙 0"});
  const bestEl = h("span", {text: "Best: " + best});
  const muteBtn = h("button", {
    class: "btn ghost small",
    style: {padding: "2px 8px", fontSize: "12px"},
    text: muted ? "🔇 Muted" : "🔊 SFX",
    onclick: () => {
      muted = !muted;
      mgWriteStore(muteKey, muted ? "1" : "0");
      muteBtn.textContent = muted ? "🔇 Muted" : "🔊 SFX";
    }
  });
  const hud = h("div", {class: "flp-hud", style: {maxWidth: "640px", flexWrap: "wrap", gap: "8px"}}, stageEl, coinsEl, scoreEl, bestEl, muteBtn);
  const canvas = h("canvas", {
    class: "flp-canvas",
    width: 640,
    height: 360,
    style: {width: "100%", maxWidth: "640px", height: "auto", aspectRatio: "16 / 9"}
  });

  const keys = { left: false, right: false, jump: false };
  function touchBtn(label, keyName, extraStyle){
    const btn = h("button", {
      class: "btn small",
      style: Object.assign({minWidth: "64px", minHeight: "42px", fontSize: "16px", fontWeight: "800", userSelect: "none", touchAction: "none"}, extraStyle || {}),
      text: label
    });
    const set = v => e => { e.preventDefault(); keys[keyName] = v; if (v && keyName === "jump") triggerJump(); };
    btn.addEventListener("pointerdown", set(true));
    btn.addEventListener("pointerup", set(false));
    btn.addEventListener("pointerleave", set(false));
    btn.addEventListener("pointercancel", set(false));
    return btn;
  }
  const controlsBar = h("div", {
    style: {display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: "640px", marginTop: "8px", gap: "10px"}
  },
    h("div", {style: {display: "flex", gap: "8px"}},
      touchBtn("◀ Left", "left"),
      touchBtn("Right ▶", "right")
    ),
    touchBtn("▲ JUMP", "jump", {background: "#ef4444", color: "#fff", minWidth: "104px"})
  );
  const tip = h("div", {class: "flp-tip", text: "Arrow Keys / A & D to run · Space / W / Up to jump · Reach the flagpole!"});
  const resSlot = h("div", {style: {width: "100%", maxWidth: "640px"}});
  box.append(hud, canvas, controlsBar, tip, resSlot);
  wrap.appendChild(box);

  function showResult(){
    resSlot.innerHTML = "";
    if (!p.done) return;
    const shareTxt = "CampusCord Super Cord Bros #" + p.playNum + "\nScore: " + p.score + " (Best: " + best + ")";
    resSlot.appendChild(h("div", {class: "mg-result"},
      h("b", {text: p.won ? "🏆 Stage Cleared! Great Run!" : "Game Over!"}),
      h("div", {class: "note", text: "Final Score: " + p.score + " · Best: " + best + (p.won ? " (Counts as a win!)" : " (Clear Stage 1-1 for a win!)")}),
      h("div", {class: "mg-res-btns"},
        h("button", {class: "btn small", onclick: () => mgCopyText(shareTxt, "Score copied!")}, "Share Score"),
        h("button", {class: "btn primary small", onclick: () => mgStartNextPuzzle("mario")}, "Play Again (Unlimited)"),
        h("button", {class: "btn small", onclick: () => openChat("games", "hub")}, "Back to Games")
      )
    ));
  }

  const ctx = canvas.getContext("2d");
  const W = 640, H = 360, TILE = 32;
  const ROWS = 11; // 11 * 32 = 352, + 8px top sky

  if (p.done){
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
    ctx.fillRect(90, 75, W - 180, 210);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.strokeRect(90, 75, W - 180, 210);
    ctx.fillStyle = "#fff";
    ctx.font = "900 28px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(p.won ? "Course Cleared!" : "Run Finished!", W / 2, 132);
    ctx.font = "700 20px system-ui, sans-serif";
    ctx.fillStyle = "#fde047";
    ctx.fillText("Score: " + p.score + "  ·  Best: " + best, W / 2, 178);
    ctx.font = "600 14px system-ui, sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("Hit Play Again below to jump back in!", W / 2, 222);
    showResult();
    return;
  }

  let stage = 1;
  let score = 0;
  let coins = 0;
  let state = "ready"; // ready | playing | stageclear | dead
  let camX = 0;
  let particles = [];
  let popups = [];
  let mushrooms = [];
  let enemies = [];
  let grid = [];
  let usedBlocks = new Set();
  let bumpOffsets = {};
  let levelCols = 75;
  let flagCol = 70;
  let flagSlideY = 0;
  let clearTimer = 0;
  let active = true;
  let lastTs = 0;
  let frame = 0;
  let shake = 0;

  const player = {
    x: 64, y: 200, vx: 0, vy: 0,
    w: 22, h: 28,
    onGround: false,
    wasOnGround: false,
    facing: 1,
    big: false,
    invuln: 0,
    coyote: 0,
    jumpBuf: 0,
    walkFrame: 0,
    squashX: 1,
    squashY: 1
  };

  function addPop(x, y, text, color){
    popups.push({ x, y, text, color: color || "#fde047", life: 1 });
  }
  function addBurst(x, y, colors, n){
    for (let i = 0; i < (n || 10); i++){
      const a = Math.random() * Math.PI * 2;
      const sp = 1.2 + Math.random() * 3.4;
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5, r: 2.5 + Math.random() * 2.5, color: colors[i % colors.length], life: 1 });
    }
  }
  function addScore(pts, x, y, label){
    score += pts;
    scoreEl.textContent = "Score: " + score;
    if (x !== undefined) addPop(x, y, label || ("+" + pts));
    if (score > best){
      best = score;
      mgWriteStore(bestKey, String(best));
      bestEl.textContent = "Best: " + best;
    }
  }

  // Tile codes: '.' empty, 'G' ground, 'B' brick, '?' question coin, 'M' question mushroom, 'P' pipe body, 'T' pipe top, 'C' coin, 'S' stone block
  function buildStage(num){
    stageEl.textContent = "Stage 1-" + num;
    levelCols = 74 + Math.min(36, (num - 1) * 10);
    flagCol = levelCols - 6;
    grid = Array.from({length: ROWS}, () => Array(levelCols).fill("."));
    usedBlocks = new Set();
    bumpOffsets = {};
    mushrooms = [];
    enemies = [];
    flagSlideY = 0;
    clearTimer = 0;

    // Ground floor (rows 9 and 10)
    for (let c = 0; c < levelCols; c++){
      grid[9][c] = "G";
      grid[10][c] = "G";
    }

    const rng = mgRng("cord-mario-stage-" + num + "-" + p.playNum);
    let c = 9;
    while (c < flagCol - 9){
      const pattern = Math.floor(rng() * 5);
      if (pattern === 0){
        // Classic brick + ? block row with coins & enemy
        const len = 4 + Math.floor(rng() * 3);
        const row = 5;
        for (let i = 0; i < len && c + i < flagCol - 7; i++){
          grid[row][c + i] = (i === 1) ? (rng() < 0.35 ? "M" : "?") : (i === len - 2 ? "?" : "B");
          if (rng() < 0.5) grid[row - 1][c + i] = "C";
        }
        enemies.push({ x: (c + 2) * TILE, y: 8 * TILE + 6, vx: -(1.05 + num * 0.12), w: 26, h: 24, dead: false, squash: 0, type: rng() < 0.35 ? "spiky" : "goomba" });
        c += len + 3;
      } else if (pattern === 1){
        // Pit with floating coins above
        const pitW = Math.min(3, 2 + Math.floor(rng() * (num > 1 ? 2 : 1)));
        for (let i = 0; i < pitW && c + i < flagCol - 8; i++){
          grid[9][c + i] = ".";
          grid[10][c + i] = ".";
          grid[6][c + i] = "C";
        }
        c += pitW + 3;
      } else if (pattern === 2){
        // Green warp pipe + enemy after it
        const pipeH = 2 + Math.floor(rng() * 2);
        for (let r = 9 - pipeH; r <= 8; r++){
          grid[r][c] = (r === 9 - pipeH) ? "T" : "P";
          grid[r][c + 1] = (r === 9 - pipeH) ? "T" : "P";
        }
        grid[8 - pipeH][c] = "C";
        grid[8 - pipeH][c + 1] = "C";
        if (c + 5 < flagCol - 7){
          enemies.push({ x: (c + 4) * TILE, y: 8 * TILE + 6, vx: -(1.1 + num * 0.12), w: 26, h: 24, dead: false, squash: 0, type: "goomba" });
        }
        c += 6;
      } else if (pattern === 3){
        // Two-tier platform jump
        for (let i = 0; i < 3 && c + i < flagCol - 8; i++) grid[6][c + i] = "B";
        for (let i = 3; i < 6 && c + i < flagCol - 8; i++){
          grid[3][c + i] = i === 4 ? "?" : "B";
          grid[2][c + i] = "C";
        }
        enemies.push({ x: (c + 1) * TILE, y: 5 * TILE + 6, vx: -0.95, w: 26, h: 24, dead: false, squash: 0, type: "goomba" });
        c += 8;
      } else {
        // Ascending stone steps
        const steps = 3 + Math.floor(rng() * 2);
        for (let s = 0; s < steps && c + s < flagCol - 8; s++){
          for (let h = 0; h <= s; h++){
            grid[8 - h][c + s] = "S";
          }
          grid[7 - s][c + s] = "C";
        }
        c += steps + 3;
      }
    }

    // Final staircase before flagpole
    for (let s = 0; s < 4; s++){
      for (let h = 0; h <= s; h++){
        grid[8 - h][flagCol - 6 + s] = "S";
      }
    }
    grid[8][flagCol] = "S"; // Flagpole base block

    player.x = 56;
    player.y = 8 * TILE - (player.big ? 40 : 28);
    player.vx = 0;
    player.vy = 0;
    player.h = player.big ? 40 : 28;
    player.onGround = false;
    player.facing = 1;
    camX = 0;
  }

  buildStage(1);

  function triggerJump(){
    if (!active || !document.body.contains(canvas)) return;
    if (state === "ready"){
      state = "playing";
    }
    if (state === "playing"){
      player.jumpBuf = 7;
    }
  }

  if (window._marioCleanup) window._marioCleanup();
  function clearKeys(){
    keys.left = false;
    keys.right = false;
    keys.jump = false;
  }
  function onKeyDown(e){
    if (!document.body.contains(canvas)){
      cleanup();
      return;
    }
    if (S.kind !== "games" || S.page !== "mario") return;
    if (document.querySelector(".mbg, .modal")){
      clearKeys();
      return;
    }
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W"){
      if (!keys.jump) triggerJump();
      keys.jump = true;
    }
  }
  function onKeyUp(e){
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W"){
      keys.jump = false;
      if (player.vy < -3.5) player.vy *= 0.58; // Variable jump height
    }
  }
  function cleanup(){
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", clearKeys);
    if (window._marioCleanup === cleanup) window._marioCleanup = null;
  }
  window._marioCleanup = cleanup;
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", clearKeys);

  function isSolid(tile){
    return tile === "G" || tile === "B" || tile === "?" || tile === "M" || tile === "P" || tile === "T" || tile === "S";
  }

  function tileAt(c, r){
    if (r < 0) return ".";
    if (r >= ROWS || c < 0 || c >= levelCols) return ".";
    return grid[r][c];
  }

  function hitBlock(c, r){
    const t = tileAt(c, r);
    const key = c + "," + r;
    bumpOffsets[key] = -8;
    if ((t === "?" || t === "M") && !usedBlocks.has(key)){
      usedBlocks.add(key);
      if (t === "M"){
        sfx("powerup");
        mushrooms.push({ x: c * TILE + 4, y: (r - 1) * TILE + 4, vx: 1.4, vy: 0, w: 24, h: 24 });
        addPop(c * TILE + 16, r * TILE - 8, "POWER-UP!", "#4ade80");
      } else {
        sfx("coin");
        coins++;
        coinsEl.textContent = "🪙 " + coins;
        addScore(100, c * TILE + 16, r * TILE - 8, "+100");
        addBurst(c * TILE + 16, r * TILE - 10, ["#fde047", "#facc15", "#fff"], 8);
      }
    } else if (t === "B"){
      if (player.big){
        grid[r][c] = ".";
        shake = 6;
        sfx("stomp");
        addScore(50, c * TILE + 16, r * TILE, "+50");
        addBurst(c * TILE + 16, r * TILE + 16, ["#b45309", "#d97706", "#78350f"], 12);
      } else {
        shake = 3;
        sfx("bump");
      }
    } else {
      sfx("bump");
    }
  }

  function moveAndCollide(ent, onHeadBump, dt){
    const step = dt || 1;
    // Horizontal
    ent.x += ent.vx * step;
    if (ent.x < 0){ ent.x = 0; ent.vx = 0; }
    if (ent.x + ent.w > levelCols * TILE){ ent.x = levelCols * TILE - ent.w; ent.vx = 0; }
    const leftC = Math.floor((ent.x + 1) / TILE);
    const rightC = Math.floor((ent.x + ent.w - 1) / TILE);
    const topR = Math.floor((ent.y + 4) / TILE);
    const botR = Math.floor((ent.y + ent.h - 4) / TILE);
    for (let r = topR; r <= botR; r++){
      for (let c = leftC; c <= rightC; c++){
        if (isSolid(tileAt(c, r))){
          if (ent.vx > 0){
            ent.x = c * TILE - ent.w;
            ent.vx = 0;
          } else if (ent.vx < 0){
            ent.x = (c + 1) * TILE;
            ent.vx = 0;
          }
        }
      }
    }

    // Vertical
    ent.onGround = false;
    ent.y += ent.vy * step;
    const lC = Math.floor((ent.x + 3) / TILE);
    const rC = Math.floor((ent.x + ent.w - 3) / TILE);
    const tR = Math.floor(ent.y / TILE);
    const bR = Math.floor((ent.y + ent.h - 0.01) / TILE);
    let bumpedCol = -1, bumpedRow = -1, bestOverlap = -1;
    const centerX = ent.x + ent.w / 2;
    for (let r = tR; r <= bR; r++){
      for (let c = lC; c <= rC; c++){
        if (isSolid(tileAt(c, r))){
          if (ent.vy > 0){
            ent.y = r * TILE - ent.h;
            ent.vy = 0;
            ent.onGround = true;
          } else if (ent.vy < 0){
            ent.y = (r + 1) * TILE;
            ent.vy = 0;
            const tileCenter = c * TILE + TILE / 2;
            const dist = Math.abs(centerX - tileCenter);
            if (bestOverlap < 0 || dist < bestOverlap){
              bestOverlap = dist;
              bumpedCol = c;
              bumpedRow = r;
            }
          }
        }
      }
    }
    if (onHeadBump && bumpedCol >= 0) onHeadBump(bumpedCol, bumpedRow);
  }

  function hurtOrDie(){
    if (player.invuln > 0) return;
    if (player.big){
      player.big = false;
      player.y += 12;
      player.h = 28;
      player.invuln = 90;
      sfx("bump");
      addPop(player.x + 11, player.y - 8, "SHRUNK!", "#fca5a5");
      return;
    }
    state = "dead";
    active = false;
    shake = 10;
    sfx("die");
    addBurst(player.x + 11, player.y + 14, ["#ef4444", "#fde047", "#fff"], 18);
    draw();
    if (window._marioRaf){
      cancelAnimationFrame(window._marioRaf);
      window._marioRaf = null;
    }
    const st = mgState();
    if (st.active.mario){
      st.active.mario.score = score;
      mgSave(st);
    }
    p.score = score;
    const clearedAny = stage > 1;
    mgCompletePuzzle("mario", clearedAny);
    p.done = true;
    p.score = score;
    p.won = clearedAny;
    showResult();
    need("side");
  }

  function drawTiles(){
    const startC = Math.max(0, Math.floor(camX / TILE) - 1);
    const endC = Math.min(levelCols - 1, Math.ceil((camX + W) / TILE) + 1);
    for (let r = 0; r < ROWS; r++){
      for (let c = startC; c <= endC; c++){
        const t = grid[r][c];
        if (t === ".") continue;
        const key = c + "," + r;
        const bump = bumpOffsets[key] || 0;
        const x = c * TILE;
        const y = r * TILE + bump;

        if (t === "G"){
          const dirtGrad = ctx.createLinearGradient(0, y, 0, y + TILE);
          dirtGrad.addColorStop(0, r === 9 ? "#b45309" : "#92400e");
          dirtGrad.addColorStop(1, r === 9 ? "#78350f" : "#451a03");
          ctx.fillStyle = dirtGrad;
          ctx.fillRect(x, y, TILE, TILE);

          // Earth pebbles & texture
          ctx.fillStyle = "rgba(69, 26, 3, 0.42)";
          ctx.beginPath();
          ctx.ellipse(x + 8, y + (r === 9 ? 17 : 10), 4, 2.5, 0.2, 0, Math.PI * 2);
          ctx.ellipse(x + 23, y + (r === 9 ? 24 : 21), 5, 3, -0.15, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(253, 224, 71, 0.14)";
          ctx.fillRect(x + 6, y + (r === 9 ? 14 : 7), 3, 2);

          if (r === 9){
            // Lush 3D grass cap with overhang tufts
            const turfGrad = ctx.createLinearGradient(0, y, 0, y + 9);
            turfGrad.addColorStop(0, "#4ade80");
            turfGrad.addColorStop(0.6, "#16a34a");
            turfGrad.addColorStop(1, "#14532d");
            ctx.fillStyle = turfGrad;
            ctx.fillRect(x, y, TILE, 8);
            ctx.fillStyle = "#86efac";
            ctx.fillRect(x, y, TILE, 2);
            // Grass blade tufts hanging over soil
            ctx.fillStyle = "#15803d";
            ctx.beginPath();
            ctx.moveTo(x + 2, y + 8); ctx.lineTo(x + 6, y + 12); ctx.lineTo(x + 10, y + 8);
            ctx.moveTo(x + 15, y + 8); ctx.lineTo(x + 19, y + 11); ctx.lineTo(x + 23, y + 8);
            ctx.fill();
          }
        } else if (t === "B"){
          // Beveled clay brick block
          const bGrad = ctx.createLinearGradient(x, y, x, y + TILE);
          bGrad.addColorStop(0, "#ea580c");
          bGrad.addColorStop(0.5, "#c2410c");
          bGrad.addColorStop(1, "#7c2d12");
          ctx.fillStyle = bGrad;
          ctx.fillRect(x, y, TILE, TILE);
          // Specular top/left bevels
          ctx.fillStyle = "rgba(254, 215, 170, 0.35)";
          ctx.fillRect(x + 1, y + 1, TILE - 2, 2);
          ctx.fillRect(x + 1, y + 17, TILE - 2, 1.5);
          // Mortar lines
          ctx.strokeStyle = "#431407";
          ctx.lineWidth = 1.6;
          ctx.strokeRect(x + 0.8, y + 0.8, TILE - 1.6, TILE - 1.6);
          ctx.beginPath();
          ctx.moveTo(x, y + 16); ctx.lineTo(x + TILE, y + 16);
          ctx.moveTo(x + 16, y); ctx.lineTo(x + 16, y + 16);
          ctx.moveTo(x + 8, y + 16); ctx.lineTo(x + 8, y + TILE);
          ctx.moveTo(x + 24, y + 16); ctx.lineTo(x + 24, y + TILE);
          ctx.stroke();
        } else if (t === "?" || t === "M"){
          const used = usedBlocks.has(key);
          if (used){
            ctx.fillStyle = "#57534e";
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = "#78716c";
            ctx.fillRect(x + 2, y + 2, TILE - 4, 3);
          } else {
            const pulse = 0.85 + Math.sin(frame * 0.12 + c) * 0.15;
            const qGrad = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
            qGrad.addColorStop(0, "#fde047");
            qGrad.addColorStop(0.5, "#f59e0b");
            qGrad.addColorStop(1, "#b45309");
            ctx.fillStyle = qGrad;
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = "rgba(255,255,255," + (0.38 * pulse) + ")";
            ctx.fillRect(x + 2, y + 2, TILE - 4, 3);
          }
          ctx.strokeStyle = "#451a03";
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
          // Corner rivets
          ctx.fillStyle = "#451a03";
          ctx.fillRect(x + 3, y + 3, 2, 2);
          ctx.fillRect(x + TILE - 5, y + 3, 2, 2);
          ctx.fillRect(x + 3, y + TILE - 5, 2, 2);
          ctx.fillRect(x + TILE - 5, y + TILE - 5, 2, 2);
          if (!used){
            ctx.fillStyle = "#78350f";
            ctx.font = "900 20px system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("?", x + 17, y + 24);
            ctx.fillStyle = "#fef9c3";
            ctx.fillText("?", x + 16, y + 23);
          }
        } else if (t === "P" || t === "T"){
          // Cylindrical 3D metallic warp pipe
          const pGrad = ctx.createLinearGradient(x, 0, x + TILE, 0);
          pGrad.addColorStop(0, "#14532d");
          pGrad.addColorStop(0.25, "#4ade80");
          pGrad.addColorStop(0.45, "#bbf7d0");
          pGrad.addColorStop(0.8, "#16a34a");
          pGrad.addColorStop(1, "#052e16");
          ctx.fillStyle = pGrad;
          ctx.fillRect(x, y, TILE, TILE);
          ctx.strokeStyle = "#052e16";
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
          if (t === "T"){
            const lipGrad = ctx.createLinearGradient(x - 3, 0, x + TILE + 3, 0);
            lipGrad.addColorStop(0, "#14532d");
            lipGrad.addColorStop(0.25, "#4ade80");
            lipGrad.addColorStop(0.45, "#dcfce7");
            lipGrad.addColorStop(0.8, "#15803d");
            lipGrad.addColorStop(1, "#052e16");
            ctx.fillStyle = lipGrad;
            ctx.fillRect(x - 3, y, TILE + 6, 12);
            ctx.fillStyle = "rgba(5, 46, 22, 0.38)";
            ctx.fillRect(x, y + 12, TILE, 4);
            ctx.strokeStyle = "#052e16";
            ctx.strokeRect(x - 3, y, TILE + 6, 12);
          }
        } else if (t === "S"){
          const sGrad = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
          sGrad.addColorStop(0, "#94a3b8");
          sGrad.addColorStop(0.5, "#64748b");
          sGrad.addColorStop(1, "#334155");
          ctx.fillStyle = sGrad;
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = "rgba(255,255,255,0.28)";
          ctx.fillRect(x + 2, y + 2, TILE - 4, 3);
          ctx.fillRect(x + 2, y + 2, 3, TILE - 4);
          ctx.strokeStyle = "#1e293b";
          ctx.lineWidth = 1.8;
          ctx.strokeRect(x + 0.9, y + 0.9, TILE - 1.8, TILE - 1.8);
        } else if (t === "C"){
          const bob = Math.sin(frame * 0.08 + c) * 2;
          const spin = Math.abs(Math.cos(frame * 0.09 + c));
          const rx = Math.max(3, 9.5 * spin);
          const cy = y + 16 + bob;
          // Soft golden glow
          ctx.fillStyle = "rgba(250, 204, 21, 0.25)";
          ctx.beginPath();
          ctx.arc(x + 16, cy, 13, 0, Math.PI * 2);
          ctx.fill();

          const cGrad = ctx.createLinearGradient(x + 16 - rx, cy - 11, x + 16 + rx, cy + 11);
          cGrad.addColorStop(0, "#fef08a");
          cGrad.addColorStop(0.5, "#facc15");
          cGrad.addColorStop(1, "#ca8a04");
          ctx.fillStyle = cGrad;
          ctx.beginPath();
          ctx.ellipse(x + 16, cy, rx, 11, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#854d0e";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          if (rx > 4.5){
            ctx.strokeStyle = "#fef9c3";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(x + 16, cy - 6);
            ctx.lineTo(x + 16, cy + 6);
            ctx.stroke();
          }
        }
      }
    }

    // Metallic Flagpole & Finial
    const poleX = flagCol * TILE + 14;
    const poleGrad = ctx.createLinearGradient(poleX, 0, poleX + 6, 0);
    poleGrad.addColorStop(0, "#94a3b8");
    poleGrad.addColorStop(0.4, "#f8fafc");
    poleGrad.addColorStop(1, "#475569");
    ctx.fillStyle = poleGrad;
    ctx.fillRect(poleX, 2 * TILE, 6, 6 * TILE);

    const orbGrad = ctx.createRadialGradient(poleX + 1, 2 * TILE - 2, 1, poleX + 3, 2 * TILE, 8);
    orbGrad.addColorStop(0, "#fef9c3");
    orbGrad.addColorStop(0.5, "#facc15");
    orbGrad.addColorStop(1, "#a16207");
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(poleX + 3, 2 * TILE, 8, 0, Math.PI * 2);
    ctx.fill();

    // Waving Flag Pennant
    const fy = 2 * TILE + 10 + flagSlideY;
    const wave = Math.sin(frame * 0.14) * 2.5;
    ctx.fillStyle = "#ef4444";
    ctx.strokeStyle = "#7f1d1d";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(poleX + 6, fy);
    ctx.quadraticCurveTo(poleX + 22, fy + 4 + wave, poleX + 40, fy + 11 - wave);
    ctx.quadraticCurveTo(poleX + 22, fy + 18 + wave, poleX + 6, fy + 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Detailed Stone Castle
    const cx = (flagCol + 2) * TILE;
    const castleGrad = ctx.createLinearGradient(cx, 5 * TILE, cx + 3 * TILE, 9 * TILE);
    castleGrad.addColorStop(0, "#cbd5e1");
    castleGrad.addColorStop(1, "#64748b");
    ctx.fillStyle = castleGrad;
    ctx.fillRect(cx, 6 * TILE, 3 * TILE, 3 * TILE);
    ctx.fillRect(cx + 16, 4.7 * TILE, 2 * TILE, 1.3 * TILE);
    // Battlements
    ctx.fillStyle = "#94a3b8";
    for (let b = 0; b < 4; b++){
      ctx.fillRect(cx + b * 24 + 2, 5.75 * TILE, 14, 8);
    }
    for (let b = 0; b < 3; b++){
      ctx.fillRect(cx + 18 + b * 22, 4.45 * TILE, 12, 8);
    }
    // Castle window & arched doorway
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(cx + 1.5 * TILE - 5, 5.1 * TILE, 10, 14);
    ctx.beginPath();
    ctx.arc(cx + 1.5 * TILE, 9 * TILE, 18, Math.PI, 0);
    ctx.fill();
  }

  function drawPlayer(){
    if (player.invuln > 0 && Math.floor(player.invuln / 4) % 2 === 0) return;
    ctx.save();
    const cx = player.x + player.w / 2;
    const footY = player.y + player.h;

    // Ground contact shadow
    if (player.onGround){
      ctx.fillStyle = "rgba(15, 23, 42, 0.28)";
      ctx.beginPath();
      ctx.ellipse(cx, footY, 11, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.translate(cx, player.y + player.h / 2);
    ctx.scale(player.facing * player.squashX, (player.big ? 1.38 : 1) * player.squashY);

    const running = player.onGround && Math.abs(player.vx) > 0.35;
    const stride = running ? Math.sin(player.walkFrame) * 3.5 : 0;
    const armSwing = !player.onGround ? -5 : (running ? -Math.sin(player.walkFrame) * 4 : 0);

    // Back arm & white glove
    ctx.fillStyle = "#b91c1c";
    ctx.fillRect(-3 - armSwing * 0.5, -3, 5, 7);
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(-1 - armSwing * 0.5, 4, 2.6, 0, Math.PI * 2);
    ctx.fill();

    // Boots
    ctx.fillStyle = "#78350f";
    ctx.beginPath();
    ctx.roundRect(-8 + stride, 9.5, 7.5, 4.5, 2);
    ctx.roundRect(1 - stride, 9.5, 7.5, 4.5, 2);
    ctx.fill();

    // Blue overalls + gold buttons
    ctx.fillStyle = "#1d4ed8";
    ctx.beginPath();
    ctx.roundRect(-8, -2, 16, 12, 2);
    ctx.fill();
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(-9, -4, 18, 5.5);
    // Straps
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(-5, -4, 3, 4);
    ctx.fillRect(2, -4, 3, 4);
    ctx.fillStyle = "#fde047";
    ctx.fillRect(-4.5, -1, 2, 2);
    ctx.fillRect(2.5, -1, 2, 2);

    // Head, nose, ear & hair
    ctx.fillStyle = "#fed7aa";
    ctx.beginPath();
    ctx.roundRect(-7, -13, 14, 10, 3);
    ctx.fill();
    ctx.fillStyle = "#fdba74";
    ctx.beginPath();
    ctx.arc(7.5, -8.5, 2.6, 0, Math.PI * 2); // Nose
    ctx.fill();
    ctx.fillStyle = "#78350f";
    ctx.fillRect(-7.5, -10.5, 3, 5); // Sideburn/hair

    // Red cap & emblem
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.roundRect(-8.5, -15.5, 17, 4.5, 2);
    ctx.fill();
    ctx.fillRect(-1, -13, 12, 2.8);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(3, -13.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Eye & mustache
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(3, -10.5, 2.4, 3.2);
    ctx.fillStyle = "#fff";
    ctx.fillRect(3.8, -10.2, 1, 1.1);
    ctx.fillStyle = "#451a03";
    ctx.fillRect(2, -6.2, 6.5, 2.2);

    // Front arm & glove
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(-2 + armSwing * 0.6, -3, 5, 7);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0.5 + armSwing * 0.6, 4, 2.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function draw(){
    ctx.save();
    if (shake > 0.2){
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }

    // Atmospheric sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#0369a1");
    sky.addColorStop(0.55, "#38bdf8");
    sky.addColorStop(1, "#e0f2fe");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Warm sun & radial glow
    const sunX = 535, sunY = 58;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 85);
    sunGlow.addColorStop(0, "rgba(254, 249, 195, 0.95)");
    sunGlow.addColorStop(0.35, "rgba(253, 224, 71, 0.32)");
    sunGlow.addColorStop(1, "rgba(253, 224, 71, 0)");
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 85, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fef9c3";
    ctx.beginPath();
    ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
    ctx.fill();

    // Distant snow-capped mountains (slowest parallax)
    for (let i = 0; i < 5; i++){
      const mx = ((i * 220 - camX * 0.14) % (W + 240) + (W + 240)) % (W + 240) - 120;
      const mh = 95 + (i % 2) * 32;
      const baseY = 9 * TILE;
      ctx.fillStyle = i % 2 === 0 ? "#7dd3fc" : "#93c5fd";
      ctx.beginPath();
      ctx.moveTo(mx, baseY);
      ctx.lineTo(mx + 85, baseY - mh);
      ctx.lineTo(mx + 170, baseY);
      ctx.closePath();
      ctx.fill();
      // Snow peak
      ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
      ctx.beginPath();
      ctx.moveTo(mx + 85, baseY - mh);
      ctx.lineTo(mx + 63, baseY - mh + 26);
      ctx.lineTo(mx + 78, baseY - mh + 20);
      ctx.lineTo(mx + 87, baseY - mh + 28);
      ctx.lineTo(mx + 107, baseY - mh + 26);
      ctx.closePath();
      ctx.fill();
    }

    // Layered clouds with shaded undersides
    for (let i = 0; i < 6; i++){
      const cx = ((i * 190 - camX * 0.25) % (W + 160) + (W + 160)) % (W + 160) - 80;
      const cy = 42 + (i % 3) * 26;
      ctx.fillStyle = "rgba(186, 230, 253, 0.7)";
      ctx.beginPath();
      ctx.arc(cx, cy + 5, 18, 0, Math.PI * 2);
      ctx.arc(cx + 18, cy + 2, 22, 0, Math.PI * 2);
      ctx.arc(cx + 38, cy + 5, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.arc(cx + 18, cy - 5, 22, 0, Math.PI * 2);
      ctx.arc(cx + 38, cy, 17, 0, Math.PI * 2);
      ctx.fill();
    }

    // Midground shaded rolling hills + bushes
    for (let i = 0; i < 7; i++){
      const hx = ((i * 170 - camX * 0.48) % (W + 180) + (W + 180)) % (W + 180) - 90;
      const hGrad = ctx.createLinearGradient(0, 9 * TILE - 54, 0, 9 * TILE + 8);
      hGrad.addColorStop(0, "#4ade80");
      hGrad.addColorStop(1, "#15803d");
      ctx.fillStyle = hGrad;
      ctx.beginPath();
      ctx.arc(hx + 55, 9 * TILE + 8, 58, Math.PI, 0);
      ctx.fill();
      // Foreground bush tuft
      ctx.fillStyle = "#16a34a";
      ctx.beginPath();
      ctx.arc(hx + 115, 9 * TILE, 14, Math.PI, 0);
      ctx.arc(hx + 130, 9 * TILE, 18, Math.PI, 0);
      ctx.arc(hx + 146, 9 * TILE, 13, Math.PI, 0);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(-Math.floor(camX), 0);

    drawTiles();

    // Detailed Mushrooms with shadow & spots
    for (const m of mushrooms){
      ctx.fillStyle = "rgba(15, 23, 42, 0.25)";
      ctx.beginPath();
      ctx.ellipse(m.x + 12, m.y + 24, 10, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fef3c7";
      ctx.beginPath();
      ctx.roundRect(m.x + 5, m.y + 12, 14, 12, 3);
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(m.x + 9, m.y + 15, 1.8, 3.5);
      ctx.fillRect(m.x + 13.5, m.y + 15, 1.8, 3.5);

      const capGrad = ctx.createRadialGradient(m.x + 9, m.y + 6, 2, m.x + 12, m.y + 11, 13);
      capGrad.addColorStop(0, "#f87171");
      capGrad.addColorStop(1, "#b91c1c");
      ctx.fillStyle = capGrad;
      ctx.beginPath();
      ctx.arc(m.x + 12, m.y + 13, 12, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(m.x + 7.5, m.y + 7.5, 3, 0, Math.PI * 2);
      ctx.arc(m.x + 16.5, m.y + 7.5, 3, 0, Math.PI * 2);
      ctx.arc(m.x + 12, m.y + 3.5, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Detailed Enemies with walking feet, eyebrows & spikes
    for (const en of enemies){
      if (en.dead && en.squash <= 0) continue;
      ctx.save();
      ctx.translate(en.x + en.w / 2, en.y + en.h);
      if (!en.dead){
        ctx.fillStyle = "rgba(15, 23, 42, 0.25)";
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (en.dead) ctx.scale(1.25, 0.32);

      const step = en.dead ? 0 : Math.sin(frame * 0.22 + en.x * 0.1) * 2.5;
      // Walking feet
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.ellipse(-6 + step, -2, 5, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(6 - step, -2, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shaded dome cap
      const eGrad = ctx.createRadialGradient(-3, -17, 2, 0, -12, 14);
      if (en.type === "spiky"){
        eGrad.addColorStop(0, "#a855f7");
        eGrad.addColorStop(1, "#581c87");
      } else {
        eGrad.addColorStop(0, "#b45309");
        eGrad.addColorStop(1, "#451a03");
      }
      ctx.fillStyle = eGrad;
      ctx.beginPath();
      ctx.arc(0, -11, 13, Math.PI, 0);
      ctx.fill();

      // Metallic spikes for spiky enemy
      if (en.type === "spiky"){
        ctx.fillStyle = "#e2e8f0";
        for (const sx of [-7, 0, 7]){
          ctx.beginPath();
          ctx.moveTo(sx - 3, -22);
          ctx.lineTo(sx, -29);
          ctx.lineTo(sx + 3, -22);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Face & angry eyebrows
      ctx.fillStyle = "#fed7aa";
      ctx.beginPath();
      ctx.roundRect(-8, -12, 16, 8, 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(-5.5, -10.5, 3.5, 4.5);
      ctx.fillRect(2, -10.5, 3.5, 4.5);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-4.5, -9.5, 2, 3);
      ctx.fillRect(3, -9.5, 2, 3);
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-6, -11.5); ctx.lineTo(-1.5, -9.5);
      ctx.moveTo(6, -11.5); ctx.lineTo(1.5, -9.5);
      ctx.stroke();
      ctx.restore();
    }

    drawPlayer();

    for (const pt of particles){
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const pop of popups){
      ctx.globalAlpha = Math.max(0, pop.life);
      ctx.font = "900 15px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.lineWidth = 3;
      ctx.strokeText(pop.text, pop.x, pop.y);
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, pop.x, pop.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.restore();

    if (state === "ready"){
      ctx.fillStyle = "rgba(15, 23, 42, 0.58)";
      ctx.fillRect(145, 95, W - 290, 82);
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.strokeRect(145, 95, W - 290, 82);
      ctx.fillStyle = "#fff";
      ctx.font = "800 19px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Super Cord Bros · Stage 1-" + stage, W / 2, 130);
      ctx.font = "600 13px system-ui, sans-serif";
      ctx.fillStyle = "#fde047";
      ctx.fillText("Press Arrow Keys / WASD or Tap Below to Start!", W / 2, 155);
    }
  }

  function loop(ts){
    if (!active || !document.body.contains(canvas)) return;
    if (!lastTs) lastTs = ts;
    const rawDt = (ts - lastTs) / 16.667;
    lastTs = ts;
    if (rawDt > 5){
      window._marioRaf = requestAnimationFrame(loop);
      return;
    }
    const dt = Math.min(1.5, Math.max(0.25, rawDt));
    frame += dt;
    if (shake > 0) shake *= Math.pow(0.82, dt);
    player.squashX += (1 - player.squashX) * 0.22 * dt;
    player.squashY += (1 - player.squashY) * 0.22 * dt;

    for (const k in bumpOffsets){
      bumpOffsets[k] += 0.9 * dt;
      if (bumpOffsets[k] >= 0) delete bumpOffsets[k];
    }
    for (let i = particles.length - 1; i >= 0; i--){
      const pt = particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 0.18 * dt;
      pt.life -= 0.035 * dt;
      if (pt.life <= 0) particles.splice(i, 1);
    }
    for (let i = popups.length - 1; i >= 0; i--){
      const pop = popups[i];
      pop.y -= 0.8 * dt;
      pop.life -= 0.026 * dt;
      if (pop.life <= 0) popups.splice(i, 1);
    }

    if (state === "ready" && (keys.left || keys.right || keys.jump)){
      state = "playing";
    }

    if (state === "playing"){
      if (player.invuln > 0) player.invuln = Math.max(0, player.invuln - dt);
      const accel = 0.42 * dt;
      const maxSpd = 3.85;
      if (keys.left){
        player.vx = Math.max(-maxSpd, player.vx - accel);
        player.facing = -1;
      } else if (keys.right){
        player.vx = Math.min(maxSpd, player.vx + accel);
        player.facing = 1;
      } else {
        player.vx *= Math.pow(0.8, dt);
        if (Math.abs(player.vx) < 0.08) player.vx = 0;
      }

      if (player.onGround) player.coyote = 6;
      else player.coyote = Math.max(0, player.coyote - dt);
      if (player.jumpBuf > 0) player.jumpBuf = Math.max(0, player.jumpBuf - dt);

      if (player.jumpBuf > 0 && player.coyote > 0){
        player.vy = -10.4;
        player.onGround = false;
        player.coyote = 0;
        player.jumpBuf = 0;
        player.squashX = 0.78;
        player.squashY = 1.24;
        addBurst(player.x + player.w / 2, player.y + player.h, ["rgba(255,255,255,0.7)", "#e2e8f0"], 5);
        sfx("jump");
      }

      player.wasOnGround = player.onGround;
      player.vy = Math.min(11, player.vy + 0.48 * dt);
      moveAndCollide(player, hitBlock, dt);
      if (!player.wasOnGround && player.onGround){
        player.squashX = 1.25;
        player.squashY = 0.78;
        addBurst(player.x + player.w / 2, player.y + player.h, ["rgba(255,255,255,0.65)", "#cbd5e1"], 4);
      }
      if (player.onGround && Math.abs(player.vx) > 0.3){
        player.walkFrame += 0.32 * dt;
        if (Math.random() < 0.22 * dt){
          particles.push({
            x: player.x + (player.facing > 0 ? 3 : player.w - 3),
            y: player.y + player.h - 2,
            vx: -player.facing * (0.4 + Math.random() * 0.6),
            vy: -0.3 - Math.random() * 0.5,
            r: 2 + Math.random() * 1.5,
            color: "rgba(255, 255, 255, 0.55)",
            life: 0.65
          });
        }
      }

      // Pit fall
      if (player.y > H + 20){
        player.big = false;
        player.invuln = 0;
        hurtOrDie();
        return;
      }

      // Collect floating coins
      const cMin = Math.floor(player.x / TILE);
      const cMax = Math.floor((player.x + player.w) / TILE);
      const rMin = Math.floor(player.y / TILE);
      const rMax = Math.floor((player.y + player.h) / TILE);
      for (let r = rMin; r <= rMax; r++){
        for (let c = cMin; c <= cMax; c++){
          if (tileAt(c, r) === "C"){
            grid[r][c] = ".";
            coins++;
            coinsEl.textContent = "🪙 " + coins;
            sfx("coin");
            addScore(50, c * TILE + 16, r * TILE, "+50");
          }
        }
      }

      // Update mushrooms
      for (let i = mushrooms.length - 1; i >= 0; i--){
        const m = mushrooms[i];
        const prevVx = m.vx;
        m.vy = Math.min(9, m.vy + 0.42 * dt);
        moveAndCollide(m, null, dt);
        if (m.vx === 0) m.vx = -prevVx;
        if (m.y > H + 30){ mushrooms.splice(i, 1); continue; }
        if (player.x < m.x + m.w && player.x + player.w > m.x && player.y < m.y + m.h && player.y + player.h > m.y){
          mushrooms.splice(i, 1);
          sfx("powerup");
          if (!player.big){
            player.big = true;
            player.y -= 12;
            player.h = 40;
          }
          addScore(500, player.x + 11, player.y - 10, "SUPER +500!");
        }
      }

      // Update enemies
      for (const en of enemies){
        if (en.dead){
          if (en.squash > 0) en.squash -= dt;
          continue;
        }
        if (Math.abs(en.x - player.x) > W + 120) continue;
        const prevVx = en.vx;
        en.vy = Math.min(9, (en.vy || 0) + 0.42 * dt);
        moveAndCollide(en, null, dt);
        if (en.vx === 0) en.vx = -prevVx;
        if (en.y > H + 30){ en.dead = true; continue; }

        const overlap = player.x + 3 < en.x + en.w && player.x + player.w - 3 > en.x &&
                        player.y + 3 < en.y + en.h && player.y + player.h > en.y;
        if (overlap){
          const stomping = player.vy > 0 && (player.y + player.h - player.vy * dt) <= en.y + 12;
          if (stomping && en.type !== "spiky"){
            en.dead = true;
            en.squash = 22;
            player.vy = -7.6;
            sfx("stomp");
            addScore(200, en.x + 13, en.y - 6, "+200");
            addBurst(en.x + 13, en.y + 12, ["#fde047", "#fff", "#fb923c"], 8);
          } else {
            hurtOrDie();
            if (!active) return;
          }
        }
      }

      // Flagpole finish check
      if (player.x + player.w >= flagCol * TILE + 12){
        state = "stageclear";
        sfx("win");
        const heightBonus = Math.max(200, Math.round((9 * TILE - player.y) * 5));
        addScore(heightBonus, flagCol * TILE + 16, player.y, "CLEAR +" + heightBonus + "!");
        addBurst(flagCol * TILE + 16, player.y, ["#fde047", "#4ade80", "#38bdf8", "#f43f5e"], 22);
      }

      const targetCam = Math.max(0, Math.min(levelCols * TILE - W, player.x - W * 0.34));
      camX += (targetCam - camX) * (1 - Math.pow(0.86, dt));
    } else if (state === "stageclear"){
      flagSlideY = Math.min(5 * TILE - 12, flagSlideY + 3.5 * dt);
      player.vy = 2.5;
      moveAndCollide(player, null, dt);
      clearTimer += dt;
      if (clearTimer > 75){
        stage++;
        state = "playing";
        buildStage(stage);
      }
    }

    draw();
    window._marioRaf = requestAnimationFrame(loop);
  }

  window._marioRaf = requestAnimationFrame(loop);
}
