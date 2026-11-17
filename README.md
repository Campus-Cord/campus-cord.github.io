# CampusCord

A Discord-style group chat for friends, running on Firebase.

**Live app:** https://campus-cord.github.io/

## Features
- Rooms with categories, topics and 📣 announcement rooms (admin-only posting)
- Private DMs with unread badges
- Replies, editing (↑ on an empty box), pins, reactions, @mentions, @everyone
- Markdown: **bold**, *italic*, __underline__, ~~strike~~, `code`, ```blocks```, ||spoilers||, > quotes
- Slash commands: /shrug /tableflip /unflip /lenny /me /spoiler /roll /flip /nick /status
- Profiles: bio, custom status, Online / Idle / Do Not Disturb / Invisible
- Images, GIF library, typing indicators, online status, search, Ctrl/⌘+K quick switcher
- Desktop notifications + sounds, phone-friendly layout
- Appearance: 8 themes, accent color, font size, compact mode, 24h time
- Roles: 👑 Admin (owner) and 💻 Developers
- Campus+ and Campus++ ranks with PLUS / PLUS+ badges, plus individual perks, sold through Stripe Payment Links and approved by the owner
- Profile pictures, categorized emoji picker with recents, SVG icon set
- Owner Danger Zone: delete all messages

## Files
- `index.html` — the whole app (built from `src/` with `python3 src/build.py <version> index.html`)
- `firestore.rules` — paste into Firebase console → Firestore → Rules → Publish whenever it changes
- `version.json` — must match `APP_VERSION` in `index.html`; bump both every release so open tabs show "Refresh"

## Setting up the shop (owner)
1. Stripe dashboard → Payment Links → create one link per perk (Campus+ and Campus++ as monthly subscriptions, the rest one-time).
2. In each link's "After payment" settings, redirect to `https://campus-cord.github.io/#thanks`.
3. In CampusCord: 🛠️ Server settings → Shop & Stripe → paste the links → Save shop.
4. When someone buys, their order appears under Orders. Search the order ID in Stripe (it's the `client_reference_id`), then click Approve.
