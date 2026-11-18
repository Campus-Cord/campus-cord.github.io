// ---------------------------------------------------------------- camera (Photo Booth style) + photo cropper
const CAM_FX = [
  {id:"normal", name:"Normal", css:"none"},
  {id:"mono", name:"Black & White", css:"grayscale(1)"},
  {id:"noir", name:"Noir", css:"grayscale(1) contrast(1.6) brightness(.95)"},
  {id:"sepia", name:"Sepia", css:"sepia(.9) contrast(1.05)"},
  {id:"vivid", name:"Vivid", css:"saturate(1.8) contrast(1.1)"},
  {id:"cool", name:"Cool", css:"hue-rotate(-12deg) saturate(1.2) brightness(1.04)"},
  {id:"warm", name:"Warm", css:"sepia(.25) saturate(1.4) hue-rotate(-8deg)"},
  {id:"pop", name:"Pop Art", css:"saturate(3) contrast(1.8)"},
  {id:"invert", name:"X-Ray", css:"invert(1) grayscale(.3)"},
];
// Pixel versions of the filters so the saved photo matches the preview in every browser (Safari ignores canvas filters).
function camApplyFx(ctx, w, hgt, fx){
  if (fx === "normal") return;
  const d = ctx.getImageData(0, 0, w, hgt), p = d.data;
  const sat = (r, g, b, k) => { const l = .299*r + .587*g + .114*b; return [l + (r - l)*k, l + (g - l)*k, l + (b - l)*k]; };
  const con = (v, k) => (v - 128) * k + 128;
  for (let i = 0; i < p.length; i += 4){
    let r = p[i], g = p[i+1], b = p[i+2];
    if (fx === "mono"){ const l = .299*r + .587*g + .114*b; r = g = b = l; }
    else if (fx === "noir"){ let l = .299*r + .587*g + .114*b; l = con(l, 1.6) * .95; r = g = b = l; }
    else if (fx === "sepia"){ const nr = .393*r + .769*g + .189*b, ng = .349*r + .686*g + .168*b, nb = .272*r + .534*g + .131*b; r = con(nr, 1.05); g = con(ng, 1.05); b = con(nb, 1.05); }
    else if (fx === "vivid"){ [r, g, b] = sat(r, g, b, 1.8); r = con(r, 1.1); g = con(g, 1.1); b = con(b, 1.1); }
    else if (fx === "cool"){ [r, g, b] = sat(r * .94, g * 1.02, b * 1.12, 1.2); }
    else if (fx === "warm"){ [r, g, b] = sat(r * 1.1, g * 1.02, b * .86, 1.35); }
    else if (fx === "pop"){ [r, g, b] = sat(r, g, b, 3); r = con(r, 1.8); g = con(g, 1.8); b = con(b, 1.8); }
    else if (fx === "invert"){ [r, g, b] = sat(255 - r, 255 - g, 255 - b, .7); }
    p[i] = r < 0 ? 0 : r > 255 ? 255 : r; p[i+1] = g < 0 ? 0 : g > 255 ? 255 : g; p[i+2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
  ctx.putImageData(d, 0, 0);
}
function dataURLtoFile(url, name){ const [head, b64] = url.split(","); const mime = (head.match(/data:(.*?);/) || [])[1] || "image/jpeg"; const bin = atob(b64); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new File([a], name, {type:mime}); }

// openCamera({title, square, onShot(dataURL)})
function openCamera(opts){
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ toast("Your browser can't use the camera here."); return; }
  let stream = null, fx = "normal", shot = null, counting = false;
  modal((m, close) => {
    const video = h("video",{class:"camvid", autoplay:"", playsinline:"", muted:""}); video.muted = true;
    const still = h("img",{class:"camvid still hidden", alt:""});
    const flash = h("div",{class:"camflash"}), count = h("div",{class:"camcount"});
    const stage = h("div",{class:"camstage" + (opts.square ? " sq" : "")}, video, still, flash, count, h("div",{class:"camerr hidden"}));
    const fxRow = h("div",{class:"camfx"});
    const drawFx = () => { fxRow.innerHTML = ""; CAM_FX.forEach(f => fxRow.appendChild(h("button",{class:"camfxb" + (fx === f.id ? " on" : ""), onclick:() => { fx = f.id; video.style.filter = f.css; drawFx(); }},
      h("span",{class:"sw", style:{filter:f.css}}), h("small",{text:f.name})))); };
    const snap = h("button",{class:"camsnap", title:"Take photo (Space)", onclick:() => takeShot()}, h("span"));
    const timerBtn = h("button",{class:"btn ghost small camtimer", title:"3-second timer", onclick:() => { timerBtn.classList.toggle("on"); }}, ic("hourglass","sm"), " 3s");
    const retake = h("button",{class:"btn ghost hidden", onclick:() => { shot = null; still.classList.add("hidden"); video.classList.remove("hidden"); retake.classList.add("hidden"); use.classList.add("hidden"); snap.classList.remove("hidden"); fxRow.classList.remove("hidden"); timerBtn.classList.remove("hidden"); }}, ic("refresh","sm"), " Retake");
    const use = h("button",{class:"btn hidden", onclick:() => { const u = shot; stop(); close(); opts.onShot(u); }}, ic("check","sm"), " " + (opts.useLabel || "Use photo"));
    m.append(h("button",{class:"ib close",title:"Close (Esc)",onclick:() => { stop(); close(); }}, ic("x")),
      h("h2",{class:"camh",text:opts.title || "Take a photo"}), stage, fxRow,
      h("div",{class:"camacts"}, timerBtn, snap, retake, use));
    drawFx();
    const stop = () => { if (stream){ stream.getTracks().forEach(t => t.stop()); stream = null; } document.removeEventListener("keydown", key); };
    const key = e => { if (e.code === "Space" && !shot && !counting && document.activeElement.tagName !== "INPUT"){ e.preventDefault(); takeShot(); } };
    document.addEventListener("keydown", key);
    m._onClose = stop;
    navigator.mediaDevices.getUserMedia({video:{width:{ideal:1280}, height:{ideal:720}, facingMode:"user"}, audio:false}).then(s => { stream = s; video.srcObject = s; })
      .catch(e => { const er = stage.querySelector(".camerr"); er.classList.remove("hidden"); er.textContent = e && e.name === "NotAllowedError" ? "Camera access was blocked. Allow the camera for this site in your browser settings, then try again." : "No camera found."; snap.disabled = true; });
    async function takeShot(){
      if (!stream || counting) return;
      if (timerBtn.classList.contains("on")){ counting = true; for (const n of [3, 2, 1]){ count.textContent = n; count.classList.remove("go"); void count.offsetWidth; count.classList.add("go"); await new Promise(r => setTimeout(r, 900)); } count.textContent = ""; counting = false; }
      const vw = video.videoWidth || 640, vh = video.videoHeight || 480;
      let sx = 0, sy = 0, sw = vw, sh = vh; if (opts.square){ const s = Math.min(vw, vh); sx = (vw - s) / 2; sy = (vh - s) / 2; sw = sh = s; }
      const scale = Math.min(1, (opts.square ? 512 : 1280) / Math.max(sw, sh));
      const c = document.createElement("canvas"); c.width = Math.round(sw * scale); c.height = Math.round(sh * scale);
      const ctx = c.getContext("2d"); ctx.translate(c.width, 0); ctx.scale(-1, 1); // mirror like Photo Booth
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, c.width, c.height); ctx.setTransform(1, 0, 0, 1, 0, 0);
      camApplyFx(ctx, c.width, c.height, fx);
      shot = c.toDataURL("image/jpeg", .86);
      flash.classList.remove("go"); void flash.offsetWidth; flash.classList.add("go"); camClick();
      still.src = shot; still.classList.remove("hidden"); video.classList.add("hidden");
      snap.classList.add("hidden"); fxRow.classList.add("hidden"); timerBtn.classList.add("hidden"); retake.classList.remove("hidden"); use.classList.remove("hidden");
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
