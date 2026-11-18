import re, sys, html, json
V = sys.argv[1] if len(sys.argv) > 1 else "dev"
d = "/home/claude/v3/"
css = open(d+"style.css").read(); body = open(d+"body.html").read(); js = open(d+"app.js").read()
js = js.replace("// __COSMETICS__", open(d+"cosmetics.js").read())
js = js.replace("// __BADGES__", open(d+"badges.js").read())
js = js.replace("// __PUSH__", open(d+"push.js").read())
js = js.replace("// __VOUCHES__", open(d+"vouches.js").read())
js = js.replace("// __FEEDBACK__", open(d+"feedback.js").read())
js = js.replace("// __CAMERA__", open(d+"camera.js").read())
js = js.replace("// __VOICE__", open(d+"voice.js").read())
cfg = re.search(r'const firebaseConfig = (\{[^}]*\});', open("/home/claude/campus-cord.github.io/index.html").read()).group(1)
js = js.replace("__FIREBASE_CONFIG__", cfg).replace("__APP_VERSION__", V)
out = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#17181c">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="CampusCord">
<title>CampusCord</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%237c5cff'/%3E%3Cstop offset='1' stop-color='%233fb8ff'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='16' fill='url(%23g)'/%3E%3Ctext x='32' y='42' font-family='Arial' font-weight='900' font-size='28' text-anchor='middle' fill='white'%3ECC%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
{css}</style>
</head>
<body>
{body}
<script type="module">
{js}</script>
</body>
</html>
'''
open(sys.argv[2] if len(sys.argv) > 2 else d+"index.html", "w").write(out)
print("built", V, len(out))
