// ---------------------------------------------------------------- linked accounts
// The owner can link a friend's OLD account into their NEW one. The new account gets the old one's Sparks,
// shop items, perks and special badges, and keeps the earliest "member since" date. Everything the old account
// ever posted shows up under the new name and avatar (config/main.aliases: {oldUid: newUid}).
// The old account is removed from the member list. Old DMs stay readable only by the old account.
function linkCandidates(newUid){
  const al = (S.config && S.config.aliases) || {}, names = (S.config && S.config.bannedNames) || {};
  const ids = new Set([...Object.keys(S.members), ...Object.keys(S.wallets), ...((S.config && S.config.banned) || [])]);
  return [...ids].filter(u => u !== newUid && !isOwnerUid(u) && !al[u] && realUid(u) === u)
    .map(u => ({uid:u, name: (S.members[u] && S.members[u].nick) || names[u] || "Former member (" + u.slice(0, 6) + ")", sparks:sparks(u), items:(wal(u).items || []).length, here:!!S.members[u], joined:(S.members[u] || {}).joinedAt || 0}))
    .sort((a, b) => b.sparks - a.sparks || a.name.localeCompare(b.name));
}
function linkAccountModal(newUid){
  const who = nickOf(newUid);
  modal((m, close) => {
    const f = h("input",{class:"inp", placeholder:"Search by name, or paste the old account's ID"});
    const list = h("div",{class:"list"});
    const draw = () => { list.innerHTML = ""; const q = f.value.trim().toLowerCase();
      const rows = linkCandidates(newUid).filter(c => !q || c.name.toLowerCase().includes(q) || c.uid.toLowerCase() === q);
      if (!rows.length) list.append(h("div",{class:"note",text:"No accounts found."}));
      rows.slice(0, 40).forEach(c => list.append(h("div",{class:"li", style:{cursor:"pointer"}, onclick:() => { close(); confirmLink(c, newUid); }},
        c.here ? avatar(c.uid, "sm") : h("div",{class:"av sm",text:"?"}),
        h("span",{class:"nm"}, h("b",{text:c.name}), h("span",{class:"s",text:"  · " + c.sparks.toLocaleString() + " Sparks · " + c.items + " items" + (c.here ? "" : " · not in the server")}))))); };
    f.oninput = draw; draw();
    m.append(h("h3",{text:"Link an old account to " + who}),
      h("p",{class:"note",text:"Pick " + who + "'s OLD account. Its Sparks, shop items, perks and badges move to " + who + ", and its old messages will show as " + who + "."}),
      f, list, h("div",{class:"foot"}, h("button",{class:"btn ghost",onclick:close},"Cancel")));
  });
}
function confirmLink(c, newUid){
  const who = nickOf(newUid);
  confirmBox("Link " + c.name + " into " + who + "?",
    who + " gets " + c.sparks.toLocaleString() + " Sparks, " + c.items + " shop items, and all of " + c.name + "'s perks and badges. Messages " + c.name + " sent will show as " + who + ". " + c.name + " is removed from the member list. Only do this if they're really the same person.",
    "Link accounts", () => linkAccounts(c.uid, newUid), true);
}
async function linkAccounts(oldUid, newUid){
  try{
    const ow = wal(oldUid), nw = wal(newUid), uni = (a, b) => [...new Set([...(a || []), ...(b || [])])];
    // 1) Sparks + items
    const merged = Object.assign({}, nw, {earned:(nw.earned || 0) + (ow.earned || 0), spent:(nw.spent || 0) + (ow.spent || 0),
      items:uni(nw.items, ow.items), quests:uni(nw.quests, ow.quests), lastDaily:Math.max(nw.lastDaily || 0, ow.lastDaily || 0)});
    await setDoc(doc(db, "wallet", newUid), merged);
    if (S.wallets[oldUid]) await setDoc(doc(db, "wallet", oldUid), Object.assign({}, EMPTY_WALLET, {linkedTo:newUid}));
    // 2) perks: keep whichever lasts longer
    const op = ((S.perks[oldUid] || {}).items) || {}, np = ((S.perks[newUid] || {}).items) || {}, items = Object.assign({}, np);
    Object.entries(op).forEach(([k, v]) => { const cur = items[k]; if (!cur || (cur.until && (!v.until || v.until > cur.until))) items[k] = v; });
    if (Object.keys(op).length) await setDoc(doc(db, "perks", newUid), {items}, {merge:true});
    // 3) config: alias (and re-point any older aliases), badges, earliest join date
    const al = (S.config && S.config.aliases) || {}, upd = {["aliases." + oldUid]:newUid};
    Object.entries(al).forEach(([a, b]) => { if (b === oldUid) upd["aliases." + a] = newUid; });
    const ob = specialOf(oldUid); if (ob.length) upd["badges." + newUid] = uni(specialOf(newUid), ob);
    const oj = Math.min(...[(S.members[oldUid] || {}).joinedAt, ((S.config.linkedJoined || {})[oldUid])].filter(Boolean)), nj = (S.members[newUid] || {}).joinedAt;
    if (isFinite(oj) && (!nj || oj < nj)) upd["linkedJoined." + newUid] = Math.min(oj, (S.config.linkedJoined || {})[newUid] || oj);
    await updateDoc(doc(db, "config/main"), upd);
    // 4) take the old account out of the member list and free its name
    const om = S.members[oldUid];
    if (om){ await deleteDoc(doc(db, "members", oldUid)).catch(() => {});
      try{ const ref = doc(db, "names", nameKey(om.nick)); const cur = await getDoc(ref); if (cur.exists() && cur.data().uid === oldUid) await deleteDoc(ref); }catch(e){} }
    toast("Linked! " + nickOf(newUid) + " now has everything from the old account.", 6000);
    refreshOpenPane(); need("side", "msgs", "rpanel");
  }catch(e){ toast("Couldn't link: " + errMsg(e)); }
}
// On the new account's own device: copy the old profile (avatar, bio, decorations…) once, for anything not set yet.
function adoptLinkedProfile(){
  if (!S.uid || !S.config || !S.config.aliases) return;
  const olds = Object.entries(S.config.aliases).filter(([, n]) => n === S.uid).map(([o]) => o);
  prefs.adopted = prefs.adopted || {};
  olds.forEach(o => { if (prefs.adopted[o]) return; const p = S.profiles[o]; if (!p) return;
    const mine = S.profiles[S.uid] || {}, patch = {};
    ["avatar", "bio", "customStatus", "nameFx", "banner", "deco", "pfx", "plate", "pban", "showcase"].forEach(k => { if (p[k] != null && mine[k] == null) patch[k] = p[k]; });
    prefs.adopted[o] = Date.now(); savePrefs();
    if (Object.keys(patch).length) setMyProfile(patch).then(() => toast("Your old account's profile was added to this one ✨")).catch(() => {}); });
}
