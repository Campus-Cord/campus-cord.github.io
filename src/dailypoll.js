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
// The daily poll shows as posted by "Daily Poll", not by whoever happened to open the room first.
function dailyPollEl(m, reacts){
  return h("div",{class:"msg first dailypoll", id:"m-" + m.id},
    h("div",{class:"gut"}, h("div",{class:"av dpav"}, "📊")),
    h("div",{class:"body"}, h("div",{class:"meta"}, h("span",{class:"n dpname",text:"Daily Poll"}), h("span",{class:"tag dev noi"}, h("b",{text:"BOT"})), h("span",{class:"t",text:fmtDay(m.ts)})),
      pollEl(m, reacts || {}),
      h("div",{class:"note dpnext",text:"A new poll drops every day at midnight."})));
}
