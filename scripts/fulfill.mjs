// Automatic order fulfillment for CampusCord.
// Runs on GitHub Actions every few minutes: asks Stripe for paid checkouts, matches each one to its
// CampusCord order (Stripe's client_reference_id = the order ID), and hands out the Sparks or perk.
// Nothing here trusts the browser: only payments Stripe confirms as paid are fulfilled, and each
// Stripe checkout is fulfilled at most once (recorded in fulfilled/{sessionId}).
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const STRIPE_KEY = process.env.STRIPE_KEY;
const SA = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!STRIPE_KEY || !SA){ console.error("Missing STRIPE_KEY or FIREBASE_SERVICE_ACCOUNT secret."); process.exit(1); }

initializeApp({ credential: cert(JSON.parse(SA)) });
const db = getFirestore();

// What each payment link sells. Keep in sync with STRIPE_LINKS / CATALOG in the app.
const ITEMS = {
  sparks_1000:   {coins:1000,  cents:99},
  sparks_3000:   {coins:3000,  cents:249},
  sparks_7500:   {coins:7500,  cents:499},
  sparks_15000:  {coins:15000, cents:899},
  sparks_40000:  {coins:40000, cents:1999},
  plus:          {perk:"plus",      months:1,  cents:299},
  plusplus:      {perk:"plusplus",  months:1,  cents:599},
  plus_year:     {perk:"plus",      months:12, cents:2499},
  plusplus_year: {perk:"plusplus",  months:12, cents:4999},
  name_fx:       {perk:"name_fx",   cents:199},
  themes:        {perk:"themes",    cents:99},
  banner:        {perk:"banner",    cents:99},
  supporter:     {perk:"supporter", cents:99},
  founder:       {perk:"founder",   cents:499},
};
const MONTH = 31 * 864e5;

async function stripe(path){
  const r = await fetch("https://api.stripe.com/v1/" + path, { headers: { Authorization: "Bearer " + STRIPE_KEY } });
  const j = await r.json(); if (!r.ok) throw new Error("Stripe " + r.status + ": " + (j.error && j.error.message)); return j;
}
const linkItem = {};
async function itemForLink(id){
  if (!id) return null; if (id in linkItem) return linkItem[id];
  const l = await stripe("payment_links/" + id); return linkItem[id] = (l.metadata && l.metadata.app === "campuscord" && l.metadata.item) || null;
}

async function grant(uid, itemId, sessionId){
  const it = ITEMS[itemId];
  if (it.coins){
    const ref = db.doc("wallet/" + uid);
    await db.runTransaction(async t => { const s = await t.get(ref);
      if (s.exists) t.update(ref, { earned: FieldValue.increment(it.coins) });
      else t.set(ref, { earned: it.coins, spent: 0, items: [], quests: [], lastDaily: 0, lastItem: "", lastQuest: "" }); });
    return;
  }
  const ref = db.doc("perks/" + uid);
  await db.runTransaction(async t => { const s = await t.get(ref); const prev = ((s.exists && s.data().items) || {})[it.perk] || {};
    const entry = { since: prev.since || Date.now(), stripe: sessionId };
    if (it.months) entry.until = Math.max(Date.now(), prev.until || 0) + it.months * MONTH;
    t.set(ref, { items: { [it.perk]: entry } }, { merge: true }); });
}

const since = Math.floor(Date.now() / 1000) - 3 * 86400; // look back 3 days
let after = null, done = 0, skipped = 0;
for (let page = 0; page < 20; page++){
  const res = await stripe("checkout/sessions?limit=100&status=complete&created[gte]=" + since + (after ? "&starting_after=" + after : ""));
  for (const s of res.data){
    if (s.payment_status !== "paid" || !s.client_reference_id || !/^cc_[a-z0-9]+$/i.test(s.client_reference_id)) continue;
    const mark = db.doc("fulfilled/" + s.id);
    if ((await mark.get()).exists) continue;
    const itemId = await itemForLink(s.payment_link);
    if (!itemId || !ITEMS[itemId]){ continue; } // not a CampusCord checkout
    const orderRef = db.doc("orders/" + s.client_reference_id); const order = await orderRef.get();
    if (!order.exists){ console.log("No order for", s.client_reference_id, "- leaving it for the owner"); skipped++; continue; }
    const o = order.data();
    if (o.status === "approved"){ await mark.set({ order: order.id, at: Date.now(), note: "already approved by hand" }); continue; }
    if ((s.amount_total || 0) < ITEMS[itemId].cents){ console.log("Amount too low on", s.id); skipped++; continue; }
    await grant(o.uid, itemId, s.id);
    await orderRef.update({ status: "approved", item: itemId, approvedAt: Date.now(), auto: true, stripeSession: s.id });
    await mark.set({ order: order.id, uid: o.uid, item: itemId, at: Date.now() });
    console.log("Fulfilled", itemId, "for", o.nick || o.uid, "(" + order.id + ")"); done++;
  }
  if (!res.has_more) break; after = res.data[res.data.length - 1].id;
}
console.log("Done:", done, "fulfilled,", skipped, "need a look.");
