# CampusCord

A Discord-style group chat for friends, running on Firebase.

**Live app:** https://massimotestaiuti112-a11y.github.io/campuscord/

- `index.html` is the whole app (rooms, DMs, images, GIFs, reactions, typing, online status, admin and developer roles).
- `firestore.rules` holds the Firestore security rules. Paste them into Firebase console → Firestore → Rules → Publish whenever they change.
- `version.json` must match `APP_VERSION` in `index.html`. Bump both on every release so open tabs show a "Refresh" bar.
