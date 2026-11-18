// ---------------------------------------------------------------- camera (Photo Booth style) + photo cropper
// Effects run on every video frame: a distortion (pixel remap table) then a color pass, so the photo matches the preview exactly.
const CAM_FX = [
  {id:"normal", name:"Normal", page:0},
  {id:"twirl", name:"Twirl", page:0, dist:true},
  {id:"bulge", name:"Bulge", page:0, dist:true},
  {id:"dent", name:"Dent", page:0, dist:true},
  {id:"squeeze", name:"Squeeze", page:0, dist:true},
  {id:"stretch", name:"Stretch", page:0, dist:true},
  {id:"mirror", name:"Mirror", page:0, dist:true},
  {id:"tunnel", name:"Light Tunnel", page:0, dist:true},
  {id:"fisheye", name:"Fish Eye", page:0, dist:true},
  {id:"kaleido", name:"Kaleidoscope", page:1, dist:true},
  {id:"pixel", name:"Pixelate", page:1, dist:true},
  {id:"thermal", name:"Thermal", page:1},
  {id:"xray", name:"X-Ray", page:1},
  {id:"comic", name:"Comic Book", page:1},
  {id:"mono", name:"Black & White", page:1},
  {id:"sepia", name:"Sepia", page:1},
  {id:"pop", name:"Pop Art", page:1},
  {id:"glow", name:"Glow", page:1},
];
const CAM_LUTS = {};
function camLUT(fx, w, hh){
  const key = fx + w + "x" + hh; if (CAM_LUTS[key]) return CAM_LUTS[key];
  const lut = new Int32Array(w * hh), cx = w / 2, cy = hh / 2, R = Math.min(w, hh) / 2, R2 = Math.hypot(cx, cy);
  for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++){
    let dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx), sx = x, sy = y;
    if (fx === "twirl"){ const RR = R * 1.05; if (d < RR){ const t = 1 - d / RR; const na = a + t * t * 4.2; sx = cx + Math.cos(na) * d; sy = cy + Math.sin(na) * d; } }
    else if (fx === "bulge"){ const RR = R * .95; if (d < RR){ const nd = RR * Math.pow(d / RR, 1.9) * .55 + d * .45 * (d / RR); sx = cx + Math.cos(a) * nd; sy = cy + Math.sin(a) * nd; } }
    else if (fx === "dent"){ const RR = R * .95; if (d < RR && d > 0){ const nd = RR * Math.pow(d / RR, .5); sx = cx + Math.cos(a) * nd; sy = cy + Math.sin(a) * nd; } }
    else if (fx === "squeeze"){ const nx = dx / (w / 2); sx = cx + Math.sign(nx) * Math.pow(Math.abs(nx), .55) * (w / 2); }
    else if (fx === "stretch"){ const nx = dx / (w / 2); sx = cx + Math.sign(nx) * Math.pow(Math.abs(nx), 1.9) * (w / 2); }
    else if (fx === "mirror"){ if (x > cx) sx = w - 1 - x; }
    else if (fx === "tunnel"){ const R0 = R * .42; if (d > R0){ sx = cx + Math.cos(a) * R0 * (1 - (d - R0) / R2 * .25); sy = cy + Math.sin(a) * R0 * (1 - (d - R0) / R2 * .25); } }
    else if (fx === "fisheye"){ const nd = d * d / R2 * 1.15; sx = cx + Math.cos(a) * nd; sy = cy + Math.sin(a) * nd; }
    else if (fx === "kaleido"){ const seg = Math.PI / 3; let t = ((a % seg) + seg) % seg; if (t > seg / 2) t = seg - t; sx = cx + Math.cos(t) * d * .9; sy = cy + Math.sin(t) * d * .9; }
    else if (fx === "pixel"){ const bs = Math.max(4, Math.round(w / 40)); sx = Math.floor(x / bs) * bs + bs / 2; sy = Math.floor(y / bs) * bs + bs / 2; }
    sx = Math.round(sx); sy = Math.round(sy);
    lut[y * w + x] = sx < 0 || sy < 0 || sx >= w || sy >= hh ? -1 : sy * w + sx;
  }
  return CAM_LUTS[key] = lut;
}
const THERMAL = (() => { const stops = [[0,[10,0,60]],[.25,[80,0,170]],[.45,[220,0,120]],[.62,[255,80,0]],[.8,[255,210,0]],[1,[255,255,230]]]; const t = [];
  for (let i = 0; i < 256; i++){ const v = i / 255; let k = 0; while (k < stops.length - 2 && v > stops[k + 1][0]) k++; const [p0, c0] = stops[k], [p1, c1] = stops[k + 1]; const f = (v - p0) / (p1 - p0);
    t.push(c0.map((c, j) => Math.round(c + (c1[j] - c) * f))); } return t; })();
// Color pass on raw pixels (also used for Safari, which ignores canvas filters).
function camColor(p, fx){
  if (fx === "normal" || CAM_FX.find(f => f.id === fx && f.dist)) return;
  const sat = (r, g, b, k) => { const l = .299*r + .587*g + .114*b; return [l + (r - l)*k, l + (g - l)*k, l + (b - l)*k]; };
  const con = (v, k) => (v - 128) * k + 128;
  for (let i = 0; i < p.length; i += 4){
    let r = p[i], g = p[i+1], b = p[i+2];
    if (fx === "mono"){ r = g = b = .299*r + .587*g + .114*b; }
    else if (fx === "sepia"){ const nr = .393*r + .769*g + .189*b, ng = .349*r + .686*g + .168*b, nb = .272*r + .534*g + .131*b; r = nr; g = ng; b = nb; }
    else if (fx === "pop"){ [r, g, b] = sat(r, g, b, 3); r = con(r, 1.8); g = con(g, 1.8); b = con(b, 1.8); }
    else if (fx === "xray"){ const l = 255 - (.299*r + .587*g + .114*b); r = l * .75; g = l * .92; b = l * 1.08; }
    else if (fx === "thermal"){ const c = THERMAL[Math.max(0, Math.min(255, Math.round(.299*r + .587*g + .114*b)))]; r = c[0]; g = c[1]; b = c[2]; }
    else if (fx === "comic"){ [r, g, b] = sat(r, g, b, 1.7); r = Math.round(r / 64) * 64; g = Math.round(g / 64) * 64; b = Math.round(b / 64) * 64; }
    else if (fx === "glow"){ [r, g, b] = sat(r * 1.12 + 18, g * 1.06 + 14, b * 1.12 + 22, 1.25); }
    p[i] = r < 0 ? 0 : r > 255 ? 255 : r; p[i+1] = g < 0 ? 0 : g > 255 ? 255 : g; p[i+2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
}
// Draw one mirrored frame of `video` into canvas `c` (size w×h, cropped to fill) with effect fx.
function camFrame(video, c, fx, work){
  const w = c.width, hh = c.height, vw = video.videoWidth, vh = video.videoHeight; if (!vw) return;
  const k = Math.max(w / vw, hh / vh), sw = w / k, sh = hh / k, sx = (vw - sw) / 2, sy = (vh - sh) / 2;
  const W = work || document.createElement("canvas"); if (W.width !== w || W.height !== hh){ W.width = w; W.height = hh; }
  const wc = W.getContext("2d", {willReadFrequently:true}); wc.setTransform(-1, 0, 0, 1, w, 0); wc.drawImage(video, sx, sy, sw, sh, 0, 0, w, hh); wc.setTransform(1, 0, 0, 1, 0, 0);
  const ctx = c.getContext("2d", {willReadFrequently:true});
  if (fx === "normal"){ ctx.drawImage(W, 0, 0); return; }
  const src = wc.getImageData(0, 0, w, hh); let out = src;
  const f = CAM_FX.find(x => x.id === fx);
  if (f && f.dist){ out = ctx.createImageData(w, hh); const lut = camLUT(fx, w, hh), s32 = new Uint32Array(src.data.buffer), o32 = new Uint32Array(out.data.buffer);
    for (let i = 0; i < lut.length; i++){ const j = lut[i]; o32[i] = j < 0 ? 0xff000000 : s32[j]; } }
  else camColor(out.data, fx);
  ctx.putImageData(out, 0, 0);
}
function dataURLtoFile(url, name){ const [head, b64] = url.split(","); const mime = (head.match(/data:(.*?);/) || [])[1] || "image/jpeg"; const bin = atob(b64); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new File([a], name, {type:mime}); }

// openCamera({title, square, onShot(dataURL)})
function openCamera(opts){
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ toast("Your browser can't use the camera here."); return; }
  let stream = null, fx = "normal", shot = null, counting = false, raf = 0, grid = false, page = 0;
  const PW = opts.square ? 480 : 640, PH = opts.square ? 480 : 360;
  modal((m, close) => {
    const video = h("video",{autoplay:"", playsinline:"", muted:"", style:{display:"none"}}); video.muted = true;
    const view = h("canvas",{class:"camvid"}); view.width = PW; view.height = PH;
    const work = document.createElement("canvas");
    const still = h("img",{class:"camvid still hidden", alt:""});
    const flash = h("div",{class:"camflash"}), count = h("div",{class:"camcount"});
    const gridEl = h("div",{class:"camgrid hidden"});
    const stage = h("div",{class:"camstage" + (opts.square ? " sq" : "")}, video, view, still, gridEl, flash, count, h("div",{class:"camerr hidden"}));
    const label = h("div",{class:"camlabel"});
    const tiles = [];
    const buildGrid = () => { gridEl.innerHTML = ""; tiles.length = 0;
      CAM_FX.filter(f => f.page === page).forEach(f => { const c = h("canvas"); c.width = opts.square ? 160 : 192; c.height = opts.square ? 160 : 108;
        tiles.push({c, fx:f.id}); gridEl.appendChild(h("button",{class:"camtile" + (fx === f.id ? " on" : ""), onclick:() => { pick(f.id); toggleGrid(false); }}, c, h("span",{text:f.name}))); });
      gridEl.appendChild(h("div",{class:"campager"},
        h("button",{class:page === 0 ? "on" : "", onclick:e => { e.stopPropagation(); page = 0; buildGrid(); }}, "Distort"),
        h("button",{class:page === 1 ? "on" : "", onclick:e => { e.stopPropagation(); page = 1; buildGrid(); }}, "Color & Fun"))); };
    const toggleGrid = on => { grid = on; gridEl.classList.toggle("hidden", !on); view.classList.toggle("hidden", on); fxBtn.classList.toggle("on", on); label.classList.toggle("hidden", on); if (on) buildGrid(); };
    const pick = id => { fx = id; label.textContent = id === "normal" ? "" : CAM_FX.find(f => f.id === id).name; drawStrip(); };
    const strip = h("div",{class:"camfx"});
    const drawStrip = () => { strip.innerHTML = ""; CAM_FX.forEach(f => strip.appendChild(h("button",{class:"camchip" + (fx === f.id ? " on" : ""), onclick:() => pick(f.id)}, f.name))); };
    const fxBtn = h("button",{class:"btn ghost small camtimer", title:"See all effects live", onclick:() => toggleGrid(!grid)}, ic("grid","sm"), " Effects");
    const snap = h("button",{class:"camsnap", title:"Take photo (Space)", onclick:() => takeShot()}, h("span"));
    const timerBtn = h("button",{class:"btn ghost small camtimer", title:"3-second timer", onclick:() => { timerBtn.classList.toggle("on"); }}, ic("hourglass","sm"), " 3s");
    const live = [fxBtn, snap, timerBtn, strip];
    const retake = h("button",{class:"btn ghost hidden", onclick:() => { shot = null; still.classList.add("hidden"); view.classList.remove("hidden"); retake.classList.add("hidden"); use.classList.add("hidden"); live.forEach(x => x.classList.remove("hidden")); loop(); }}, ic("refresh","sm"), " Retake");
    const use = h("button",{class:"btn hidden", onclick:() => { const u = shot; stop(); close(); opts.onShot(u); }}, ic("check","sm"), " " + (opts.useLabel || "Use photo"));
    m.append(h("button",{class:"ib close",title:"Close (Esc)",onclick:() => { stop(); close(); }}, ic("x")),
      h("h2",{class:"camh",text:opts.title || "Take a photo"}), h("div",{class:"camwrap"}, stage, label), strip,
      h("div",{class:"camacts"}, fxBtn, snap, timerBtn, retake, use));
    drawStrip();
    function loop(){ cancelAnimationFrame(raf); const tick = () => { if (!stream || shot) return;
        if (grid) tiles.forEach(t => camFrame(video, t.c, t.fx, work)); else camFrame(video, view, fx, work);
        raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); }
    const stop = () => { cancelAnimationFrame(raf); if (stream){ stream.getTracks().forEach(t => t.stop()); stream = null; } document.removeEventListener("keydown", key); };
    const key = e => { if (e.code === "Space" && !shot && !counting && document.activeElement.tagName !== "INPUT"){ e.preventDefault(); takeShot(); } };
    document.addEventListener("keydown", key);
    m._onClose = stop;
    navigator.mediaDevices.getUserMedia({video:{width:{ideal:1280}, height:{ideal:720}, facingMode:"user"}, audio:false}).then(s => { stream = s; video.srcObject = s; video.play().catch(()=>{}); loop(); })
      .catch(e => { const er = stage.querySelector(".camerr"); er.classList.remove("hidden"); er.textContent = e && e.name === "NotAllowedError" ? "Camera access was blocked. Allow the camera for this site in your browser settings, then try again." : "No camera found."; snap.disabled = true; });
    async function takeShot(){
      if (!stream || counting) return;
      if (grid) toggleGrid(false);
      if (timerBtn.classList.contains("on")){ counting = true; for (const n of [3, 2, 1]){ count.textContent = n; count.classList.remove("go"); void count.offsetWidth; count.classList.add("go"); await new Promise(r => setTimeout(r, 900)); } count.textContent = ""; counting = false; }
      const vw = video.videoWidth || 640, vh = video.videoHeight || 480;
      const out = h("canvas"); const big = opts.square ? Math.min(512, vw, vh) : Math.min(1280, vw); out.width = big; out.height = opts.square ? big : Math.round(big * PH / PW);
      camFrame(video, out, fx, null);
      shot = out.toDataURL("image/jpeg", .86);
      flash.classList.remove("go"); void flash.offsetWidth; flash.classList.add("go"); camClick();
      still.src = shot; still.classList.remove("hidden"); view.classList.add("hidden");
      live.forEach(x => x.classList.add("hidden")); retake.classList.remove("hidden"); use.classList.remove("hidden");
    }
  }, "cammodal");
}
function camClick(){ try{ const a = new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(), g = a.createGain(); o.type = "square"; o.frequency.value = 1800; g.gain.setValueAtTime(.08, a.currentTime); g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + .08); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + .09); setTimeout(() => a.close(), 300); }catch(e){} }

// openCropper(src, onDone(dataURL)) — drag to move, slider/wheel to zoom, outputs a 256px square JPEG
function openCropper(src, onDone){
  const img = new Image();
  img.onload = () => modal((m, close) => {
    const V = 280; let z = 1, x = 0, y = 0;
    const base = Math.max(V / img.width, V / img.height);
    const pic = h("img",{src, class:"cropimg", draggable:"false"});
    const view = h("div",{class:"cropview"}, pic, h("div",{class:"cropring"}));
    const clamp = () => { const w = img.width * base * z, hh = img.height * base * z; x = Math.min(0, Math.max(V - w, x)); y = Math.min(0, Math.max(V - hh, y)); };
    const draw = () => { clamp(); pic.style.width = img.width * base * z + "px"; pic.style.transform = "translate(" + x + "px," + y + "px)"; };
    const center = () => { x = (V - img.width * base * z) / 2; y = (V - img.height * base * z) / 2; };
    center(); draw();
    const zoomTo = nz => { const cx = V / 2, cy = V / 2; const k = nz / z; x = cx - (cx - x) * k; y = cy - (cy - y) * k; z = nz; draw(); };
    const slider = h("input",{type:"range", min:"1", max:"4", step:"0.01", value:"1", class:"cropzoom", oninput:e => zoomTo(+e.target.value)});
    let drag = null;
    view.addEventListener("pointerdown", e => { drag = {px:e.clientX, py:e.clientY, x, y}; view.setPointerCapture(e.pointerId); });
    view.addEventListener("pointermove", e => { if (!drag) return; x = drag.x + e.clientX - drag.px; y = drag.y + e.clientY - drag.py; draw(); });
    view.addEventListener("pointerup", () => { drag = null; });
    view.addEventListener("wheel", e => { e.preventDefault(); const nz = Math.min(4, Math.max(1, z * (e.deltaY < 0 ? 1.08 : 0.93))); slider.value = nz; zoomTo(nz); }, {passive:false});
    const save = () => { const out = 256, c = document.createElement("canvas"); c.width = c.height = out; const k = out / V;
      c.getContext("2d").drawImage(img, x * k, y * k, img.width * base * z * k, img.height * base * z * k);
      let d = c.toDataURL("image/jpeg", .86); if (d.length > 110000) d = c.toDataURL("image/jpeg", .7); close(); onDone(d); };
    m.append(h("button",{class:"ib close",title:"Close (Esc)",onclick:close}, ic("x")), h("h2",{class:"camh",text:"Position your photo"}),
      h("p",{class:"note",style:{marginTop:0,textAlign:"center"},text:"Drag to move · scroll or use the slider to zoom"}), view,
      h("div",{class:"cropbar"}, ic("image","sm"), slider, ic("image")),
      h("div",{class:"camacts"}, h("button",{class:"btn ghost", onclick:close}, "Cancel"), h("button",{class:"btn", onclick:save}, ic("check","sm"), " Save")));
  }, "cropmodal");
  img.onerror = () => toast("That file isn't an image we can open.");
  img.src = src;
}
async function setPhotoAvatar(d){ try{ await setMyProfile({avatar:d}); toast("Profile picture updated"); refreshOpenPane(); need("side", "msgs", "members", "me"); bumpStat("photo"); }catch(e){ toast("Couldn't save photo: " + errMsg(e)); } }
function pickPhotoFile(cb){ const i = h("input",{type:"file", accept:"image/*", style:{display:"none"}}); i.onchange = () => { const f = i.files[0]; i.remove(); if (f) cb(f); }; document.body.appendChild(i); i.click(); }
function avatarPhotoControls(){
  const has = isPhotoAvatar(profile(S.uid).avatar);
  return h("div",{class:"avphoto"},
    h("button",{class:"btn small", onclick:() => pickPhotoFile(f => { const u = URL.createObjectURL(f); openCropper(u, setPhotoAvatar); })}, ic("image","sm"), " Upload photo"),
    h("button",{class:"btn small", onclick:() => openCamera({title:"Smile! 📸", square:true, onShot:d => openCropper(d, setPhotoAvatar)})}, ic("camera","sm"), " Take photo"),
    has ? h("button",{class:"btn small ghost", onclick:() => { setMyProfile({avatar:""}).then(() => { toast("Photo removed"); refreshOpenPane(); need("side", "msgs", "members", "me"); }).catch(()=>{}); }}, "Remove photo") : null);
}
function cameraToChat(){
  if (!S.cur){ toast("Pick a room or DM first"); return; }
  if (!canPost()){ toast("You can't post here"); return; }
  openCamera({title:"Snap a photo", useLabel:"Add to message", onShot:d => setPending(dataURLtoFile(d, "photo-" + Date.now() + ".jpg"))});
}
