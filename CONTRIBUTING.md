# Working on CampusCord

CampusCord is owned by Massimo. Changes go in through **pull requests**: you propose a change, GitHub checks it automatically, and Massimo approves it. Once he merges it, the site rebuilds and goes live by itself in about a minute.

## One-time setup (Elliott)

1. Sign in to GitHub and open https://github.com/Campus-Cord/campus-cord.github.io
2. Click **Fork** (top right). This gives you your own copy to edit freely.
3. Clone your fork: `git clone https://github.com/<your-username>/campus-cord.github.io`

## Making a change

1. Pull Massimo's latest code first, so you don't work on an old version:
   ```
   git remote add upstream https://github.com/Campus-Cord/campus-cord.github.io   # first time only
   git pull upstream main
   ```
2. Edit files in **`src/`** (see the map below). Don't edit `index.html` directly: it is generated and gets overwritten.
3. Try it locally (optional): `python3 src/build.py dev /tmp/cc.html`, then open `/tmp/cc.html` in a browser. It connects to the real database, so be careful what you click.
4. Commit, push to your fork, and open a **Pull request** on GitHub. Say what you changed and why.
5. GitHub runs the checks (the build works, the JavaScript has no syntax errors, the database-rules tests pass). Massimo reviews and merges.

Using Claude Code or another AI helper? Point it at this file and `CLAUDE.md`.

## Map of the code

| File | What's in it |
|---|---|
| `src/app.js` | The main app: sign-in, rooms, DMs, messages, members, admin panel, moderation, names |
| `src/badges.js` | Profile badges, evolving tiers, badge collection |
| `src/cosmetics.js` | Sparks shop: decorations, effects, nameplates |
| `src/voice.js` | Voice channels (WebRTC, up to 20 people) |
| `src/camera.js` | Photo Booth camera and effects |
| `src/vouches.js` | #vouches room and vouch rewards |
| `src/feedback.js` | Feedback board |
| `src/push.js` | Phone notifications |
| `src/appeals.js` | Ban screen and unban appeals |
| `src/style.css` | All styling |
| `src/body.html` | The page's HTML skeleton |
| `src/build.py` | Glues everything into `index.html` |
| `firestore.rules` | Database security rules: who can read or write what |
| `tests/rules.test.mjs` | Tests for the rules; every rules change needs a matching test |
| `scripts/`, `.github/workflows/` | Background jobs (Stripe delivery, push, backups); owner-only, see below |

## Ground rules

- **Owner-only areas:** `.github/workflows/`, `scripts/`, payments (`STRIPE_LINKS`, `CATALOG` in `src/app.js`) and the owner/admin checks. Changes there need Massimo to agree first. Ask before opening the PR.
- **Rules changes are live security.** If you change `firestore.rules`, add tests to `tests/rules.test.mjs` showing both what's now allowed and what's still blocked.
- Keep pull requests small and about one thing; it makes them faster to review.
- Never put passwords, keys or tokens in the code. The Firebase web config in `src/firebase-config.js` is public by design; everything secret lives in GitHub secrets, which only Massimo can see.
