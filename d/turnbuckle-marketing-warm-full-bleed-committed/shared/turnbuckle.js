/* Real-time 3D turnbuckle separators — single source of truth for the model.
   `buildTurnbuckle(THREE)` and `studioEnv(THREE, renderer)` are exported so the
   dev lab (pages/dev/turnbuckle-3d.html) renders the EXACT same model under
   angle control. Here, each .tb3d <canvas> gets the model and rotates (tightens)
   as the separator scrolls through the viewport. Falls back to the static
   photoreal image (.tb-fallback) when WebGL/modules are missing or the user
   prefers reduced motion. */

// studio environment: bright sky → horizon → dark floor + two window highlights
export function studioEnv(THREE, renderer) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#fbfcfe'); g.addColorStop(.42, '#cfd6df'); g.addColorStop(.5, '#eef3f8'); g.addColorStop(.58, '#9aa2ad'); g.addColorStop(1, '#3c4047');
  c.fillStyle = g; c.fillRect(0, 0, 1024, 512);
  for (const cx of [300, 660]) { const rg = c.createRadialGradient(cx, 150, 8, cx, 150, 150); rg.addColorStop(0, 'rgba(255,255,255,0.95)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = rg; c.fillRect(cx - 170, 0, 340, 320); }
  const tex = new THREE.CanvasTexture(cv); tex.mapping = THREE.EquirectangularReflectionMapping; tex.colorSpace = THREE.SRGBColorSpace;
  const p = new THREE.PMREMGenerator(renderer); const t = p.fromEquirectangular(tex).texture; tex.dispose(); p.dispose(); return t;
}

// arena environment: what the hardware reflects when it lives INSIDE the venue
// imagery instead of a photo studio — dark rigging overhead, a warm haze band of
// house light, near-black floor, amber spotlights in the rig, and a faint crimson
// crowd-glow at the horizon. Metals pick up dim warm glints instead of bright
// daylight, so the separators sit in the same world as the scrimmed venue photos.
export function arenaEnv(THREE, renderer) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#16100b'); g.addColorStop(.4, '#3d2c1d'); g.addColorStop(.52, '#523822'); g.addColorStop(.62, '#241813'); g.addColorStop(1, '#0b0807');
  c.fillStyle = g; c.fillRect(0, 0, 1024, 512);
  // amber spots hanging in the rig — these become the metal's hot glints
  for (const [cx, str] of [[230, .85], [540, .65], [830, .8]]) {
    const rg = c.createRadialGradient(cx, 88, 6, cx, 88, 130);
    rg.addColorStop(0, `rgba(255,208,150,${str})`); rg.addColorStop(1, 'rgba(255,208,150,0)');
    c.fillStyle = rg; c.fillRect(cx - 150, 0, 300, 260);
  }
  // crimson crowd-glow band just below the horizon (the page's heat color, dimmed)
  const cg = c.createLinearGradient(0, 280, 0, 380);
  cg.addColorStop(0, 'rgba(141,30,42,0)'); cg.addColorStop(.5, 'rgba(141,30,42,0.30)'); cg.addColorStop(1, 'rgba(141,30,42,0)');
  c.fillStyle = cg; c.fillRect(0, 280, 1024, 100);
  const tex = new THREE.CanvasTexture(cv); tex.mapping = THREE.EquirectangularReflectionMapping; tex.colorSpace = THREE.SRGBColorSpace;
  const p = new THREE.PMREMGenerator(renderer); const t = p.fromEquirectangular(tex).texture; tex.dispose(); p.dispose(); return t;
}

// rig constants: how far each eye loop tilts out of the camera plane (about X).
// LEFT (anchor side): steep, so the loop visibly wraps the anchor fork — with 52°
// arms the loop tube clears the bars (min distance R·sin52°·sin61° ≈ 0.35 against
// a 0.30 radii sum). RIGHT (rope side): nearly camera-facing, so the ring reads as
// a loop slid down the taut rope and pulled tight against its end.
export const EYE_TILT_L = Math.PI * 0.34;
export const EYE_TILT_R = Math.PI * 0.06;

// forged flat-stock contour: straight rails, ~30° inward bend at each end, rounded tip.
// Used for BOTH the outer body and the inner window (so the cutout ends aren't circular).
function forgedContour(make, H, xb, tipR) {
  const slope = Math.tan(Math.PI / 9), xtc = xb + (H - tipR) / slope, X = xtc + tipR, N = 72;
  const yTop = x => { const ax = Math.abs(x); if (ax <= xb) return H; const yl = H - (ax - xb) * slope; if (yl > tipR) return yl; const dx = ax - xtc; return Math.max(0, Math.sqrt(Math.max(0, tipR * tipR - dx * dx))); };
  const c = make(); c.moveTo(-X, 0);
  for (let i = 0; i <= N; i++) { const x = -X + (i / N) * 2 * X; c.lineTo(x, yTop(x)); }
  for (let i = N; i >= 0; i--) { const x = -X + (i / N) * 2 * X; c.lineTo(x, -yTop(x)); }
  c.closePath(); return c;
}

export function buildTurnbuckle(THREE) {
  // soft low-frequency blotches — the noise that actually survives at render scale.
  // Fine speckle goes sub-pixel on a ~150px-tall canvas; these big soft stains are
  // what keeps a surface from reading as flat CG. Painted as radial gradients.
  function blotches(x, s, n, rMin, rMax, aMin, aMax, vMin, vMax) {
    for (let i = 0; i < n; i++) {
      const cx = Math.random() * s, cy = Math.random() * s, r = rMin + Math.random() * (rMax - rMin);
      const v = vMin + (Math.random() * (vMax - vMin) | 0), a = aMin + Math.random() * (aMax - aMin);
      const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      rg.addColorStop(0, `rgba(${v},${v},${v},${a})`); rg.addColorStop(1, `rgba(${v},${v},${v},0)`);
      x.fillStyle = rg; x.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
  }
  // galvanized spangle texture (stains + mottle + scratches) → matte, non-flat metal
  function galvTex() {
    const s = 256, cv = document.createElement('canvas'); cv.width = cv.height = s; const x = cv.getContext('2d');
    x.fillStyle = '#a4a4a4'; x.fillRect(0, 0, s, s);
    blotches(x, s, 30, 24, 70, 0.06, 0.16, 100, 215);                 // big tonal stains/dents
    // warm grime smudges — weathering that agrees with the venue light
    for (let i = 0; i < 9; i++) {
      const cx = Math.random() * s, cy = Math.random() * s, r = 20 + Math.random() * 40;
      const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      const a = 0.05 + Math.random() * 0.08;
      rg.addColorStop(0, `rgba(96,74,52,${a})`); rg.addColorStop(1, 'rgba(96,74,52,0)');
      x.fillStyle = rg; x.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    for (let i = 0; i < 1100; i++) { const v = 105 + (Math.random() * 115 | 0); x.fillStyle = `rgba(${v},${v},${v},${Math.random() * 0.34 + 0.1})`; x.beginPath(); x.arc(Math.random() * s, Math.random() * s, Math.random() * 2.4 + 0.4, 0, 7); x.fill(); }
    for (let i = 0; i < 22; i++) { const dark = Math.random() < 0.45, v = dark ? 70 : 228; x.strokeStyle = `rgba(${v},${v},${v},${Math.random() * 0.16 + 0.04})`; x.lineWidth = Math.random() * 1.1 + 0.3; const x0 = Math.random() * s, y0 = Math.random() * s, a = Math.random() * Math.PI, l = Math.random() * 60 + 18; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + Math.cos(a) * l, y0 + Math.sin(a) * l); x.stroke(); }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); return t;
  }
  // machined bright-steel finish for the eye bolts: turned grain + dings, smoother + shinier than the forged shackle
  function machinedTex() {
    const s = 256, cv = document.createElement('canvas'); cv.width = cv.height = s; const x = cv.getContext('2d');
    x.fillStyle = '#c9ccd2'; x.fillRect(0, 0, s, s);
    blotches(x, s, 18, 22, 60, 0.04, 0.1, 120, 230);                  // soft tonal patches under the grain
    for (let i = 0; i < 220; i++) { const y = Math.random() * s, v = 150 + (Math.random() * 80 | 0); x.strokeStyle = `rgba(${v},${v},${v},${Math.random() * 0.18 + 0.05})`; x.lineWidth = Math.random() * 1.0 + 0.3; x.beginPath(); x.moveTo(0, y); x.lineTo(s, y + (Math.random() * 4 - 2)); x.stroke(); }
    for (let i = 0; i < 180; i++) { const v = 205 + (Math.random() * 45 | 0); x.fillStyle = `rgba(${v},${v},${v},${Math.random() * 0.2})`; x.beginPath(); x.arc(Math.random() * s, Math.random() * s, Math.random() * 1.0 + 0.2, 0, 7); x.fill(); }
    // handling dings: short dark nicks across the grain
    for (let i = 0; i < 26; i++) { x.strokeStyle = `rgba(70,72,78,${Math.random() * 0.18 + 0.06})`; x.lineWidth = Math.random() * 1.4 + 0.5; const x0 = Math.random() * s, y0 = Math.random() * s, a = Math.random() * Math.PI, l = Math.random() * 9 + 3; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + Math.cos(a) * l, y0 + Math.sin(a) * l); x.stroke(); }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); return t;
  }
  // shackle (central forged frame): coarse galvanized spangle, matte, slightly darker + cooler.
  // The texture feeds the COLOR map too — a metal's color is its reflection tint, so
  // a uniform color reads flat no matter how the roughness varies.
  const shackleTex = galvTex();
  const shackle = new THREE.MeshStandardMaterial({ color: 0xeff2fa, map: shackleTex, metalness: 0.8, roughness: 0.62, roughnessMap: shackleTex, bumpMap: shackleTex, bumpScale: 0.07, envMapIntensity: 1.0 });
  // bolt/hook (machined eye bolts + threads): bright steel, smoother, more reflective
  const boltTex = machinedTex();
  const bolt = new THREE.MeshStandardMaterial({ color: 0xffffff, map: boltTex, metalness: 0.92, roughness: 0.33, roughnessMap: boltTex, bumpMap: boltTex, bumpScale: 0.02, envMapIntensity: 1.3 });
  const root = new THREE.Group();
  // open frame body — flat stock <==>: straight rails, 30° angled ends; window follows the same contour
  const shape = forgedContour(() => new THREE.Shape(), 0.66, 1.4, 0.18);
  shape.holes.push(forgedContour(() => new THREE.Path(), 0.36, 1.15, 0.1));
  const frameGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2, steps: 1 });
  frameGeo.center();
  const body = new THREE.Mesh(frameGeo, shackle); root.add(body);
  // REAL thread geometry: a lathed triangular profile = sharp machine threads (not a coil)
  function threadedRod(len, rad, pitch, depth) {
    const steps = Math.max(64, Math.round(len / pitch) * 10), pts = [];
    pts.push(new THREE.Vector2(0, -len / 2)); // solid flat end cap
    for (let i = 0; i <= steps; i++) {
      const y = -len / 2 + (i / steps) * len;
      const frac = (y / pitch) - Math.floor(y / pitch), tri = 1 - Math.abs(frac * 2 - 1);
      pts.push(new THREE.Vector2(rad - depth * 0.5 + tri * depth, y));
    }
    pts.push(new THREE.Vector2(0, len / 2)); // solid flat end cap
    return new THREE.LatheGeometry(pts, 48);
  }
  // threaded shaft (threads cut on this side only), backed out with a gap at center.
  // Each side (rod + its eye) lives in a group so tightening can draw it inward.
  const sideL = new THREE.Group(), sideR = new THREE.Group(); root.add(sideL, sideR);
  const threadGeo = threadedRod(3.6, 0.2, 0.1, 0.03);
  [-1, 1].forEach(s => { const m = new THREE.Mesh(threadGeo, bolt); m.rotation.z = Math.PI / 2; m.position.x = s * 2.25; (s < 0 ? sideL : sideR).add(m); });
  // forged EYE: a tangent-neck hook. The shank leaves the rod, runs tangent into a
  // circular loop, sweeps the major arc, and the tip curls back toward the shank —
  // leaving a clear mouth (the "opening"). Because the neck is tangent, the shank
  // flows smoothly into the loop with no wedge gap.
  function makeEye(mat) {
    const g = new THREE.Group();
    const rr = 0.18;       // tube (stock) radius
    const R = 0.5;         // loop centerline radius
    const cx = 0.92;       // loop center distance from the neck origin
    const gamma = Math.acos(R / cx);     // tangent half-angle (shank tangent to loop)
    const aU = Math.PI - gamma;          // upper tangent point — where the shank meets the loop
    const arc = Math.PI * 2 - 2 * gamma; // major arc, tangent point to tangent point
    const steps = 120;
    // short straight lead-in overlaps the rod end so the join is solid
    const pts = [new THREE.Vector3(-0.22, 0, 0), new THREE.Vector3(0, 0, 0)];
    for (let i = 0; i <= steps; i++) { const a = aU - (i / steps) * arc; pts.push(new THREE.Vector3(cx + R * Math.cos(a), R * Math.sin(a), 0)); }
    // tip curls back toward the shank but stops short, leaving a clear open mouth
    const tip = new THREE.Vector3(0.4, -0.27, 0); pts.push(tip);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, rr, 22, false), mat));
    const cap = new THREE.Mesh(new THREE.SphereGeometry(rr, 16, 12), mat); cap.position.copy(tip); g.add(cap);
    return g;
  }
  // two eye bolts, mouths facing opposite ways (right opens up, left opens down) like a real turnbuckle
  const eyeR = makeEye(bolt); eyeR.position.x = 4.05; eyeR.rotation.x = Math.PI; sideR.add(eyeR);
  const eyeL = makeEye(bolt); eyeL.position.x = -4.05; eyeL.scale.x = -1; sideL.add(eyeL);
  return { root, body, eyeL, eyeR, sideL, sideR, mats: { shackle, bolt } };
}

// anchor: the post is off-screen — only a ">"-shaped fork shows. It is one continuous bent
// bar: two constant-width arms (open ends bleeding past the screen edge) meeting at a vertex
// that points toward the middle. The vertex sits exactly AT the eye loop's center (native
// x -4.97), so the tilted loop genuinely encircles it: the loop plane splits the fork, one
// arm exiting through the front of the loop and one through the back. Arm angle (52°) and
// bar radius (0.12) are chosen so the loop tube clears the bars — see EYE_TILT above.
function makeAnchor(THREE, mat) {
  const g = new THREE.Group();
  const EDGE = -7.6;   // open ends run well past the screen edge (fork bleeds out the corner)
  const CV = -4.97;    // vertex — at the eye loop center, threaded through it
  const ARM_R = 0.12;  // bar radius, slimmer than the loop's 0.18 stock
  const H = (CV - EDGE) * Math.tan(Math.PI * 52 / 180); // 52° arms clear the loop crossings
  const up = new THREE.Vector3(0, 1, 0);
  for (const s of [1, -1]) {
    const a = new THREE.Vector3(EDGE, s * H, 0), b = new THREE.Vector3(CV, 0, 0);
    const dir = b.clone().sub(a), len = dir.length();
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(ARM_R, ARM_R, len, 14), mat);
    arm.position.copy(a.clone().add(b).multiplyScalar(0.5));
    arm.quaternion.setFromUnitVectors(up, dir.normalize());
    g.add(arm);
  }
  const bend = new THREE.Mesh(new THREE.SphereGeometry(ARM_R * 1.18, 16, 12), mat); bend.position.set(CV, 0, 0); g.add(bend);
  return g;
}

// tape-wrapped ring rope: a real ring rope is steel cable spiral-wrapped in tape,
// so the surface is one solid color broken only by the faint diagonal seam where
// each wrap overlaps the last, with the occasional frayed tape edge. The tape is
// brand crimson (#c8102e — classic red ring rope); seams are thin darker creases
// (4 wraps per tile) with a soft overlap shadow on one side and sparse fray specks
// nearby. Used as BOTH the color map and the bump map so the seams crease in the
// shading too.
function ropeTex(THREE) {
  const s = 256, cv = document.createElement('canvas'); cv.width = cv.height = s; const x = cv.getContext('2d');
  const img = x.createImageData(s, s), d = img.data, wraps = 4;
  const p1 = Math.random() * 7, p2 = Math.random() * 7, p3 = Math.random() * 7; // random phases per build
  for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) {
    const u = i / s, v = j / s;
    const f = ((v * wraps - u) % 1 + 1) % 1;         // spiral seam coordinate (0 = seam line)
    const dist = Math.min(f, 1 - f);                 // distance to nearest seam, in wrap-widths
    const seam = 0.16 * Math.exp(-Math.pow(dist / 0.014, 2));       // thin dark crease at the seam
    const lap = f < 0.5 ? 0.05 * Math.exp(-f / 0.06) : 0;           // overlap shadow on the new-wrap side
    let fray = 0;
    if (dist < 0.045 && Math.random() < 0.22) fray = -(Math.random() * 0.14);  // ragged darker nicks at edges
    if (dist < 0.06 && Math.random() < 0.04) fray = Math.random() * 0.10;      // lifted tape catching light
    // low-frequency life: uneven wrap tension (broad light/dark patches) plus
    // handling grime banded along the run — kept subtle so the red stays CLEAR
    const lf = 0.045 * Math.sin(u * 6.28 + p1) * Math.sin(v * 12.56 + p2)
             + 0.03 * Math.sin(v * 31.4 + p3 + u * 2.2);
    const lit = 1 - seam - lap + fray + lf + (Math.random() - 0.5) * 0.04;     // vinyl with faint tooth
    const k = (j * s + i) * 4;
    d[k]     = 208 * lit | 0;                        // brand crimson tape (~#c8102e,
    d[k + 1] = 28 * lit | 0;                         // nudged up so the dim house
    d[k + 2] = 50 * lit | 0;                         // light doesn't crush it)
    d[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

// the divider rope: a TAUT, straight line at y=0. The right eye's loop simply
// wraps it — like a loop slid down a rope and pulled tight against the end — so
// from the side you see the ring and one solid line. The slight interpenetration
// between ring tube and rope is invisible from this angle and intentional. The
// rounded end stops just past the ring's CENTER, leaving clear air before the
// ring's far side. Rebuilt per-resize in native cluster units.
const ROPE_R = 0.28;
function rebuildRope(THREE, group, mat, tex, xRight) {
  for (const ch of [...group.children]) { ch.geometry.dispose(); group.remove(ch); }
  // ring center is 4.97; cylinder ends at 5.05 so the rounded cap's tip lands at
  // ~4.77 — past center, with ~0.12 of air before the far tube's inner face (4.65)
  const x0 = 5.05;
  const len = Math.max(0.01, xRight - x0);
  const geo = new THREE.CylinderGeometry(ROPE_R, ROPE_R, len, 22, Math.max(16, Math.round(len * 6)));
  // slight bumpiness: low-frequency lumps plus a ripple at the tape-wrap pitch, so
  // the silhouette undulates a hair instead of reading as a machined cylinder
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const bump = 1 + 0.035 * Math.sin(y * 2.3 + 0.7) + 0.02 * Math.sin(y * 12.6);
    pos.setX(i, pos.getX(i) * bump); pos.setZ(i, pos.getZ(i) * bump);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat);
  m.rotation.z = Math.PI / 2;                          // lay along X
  m.position.set(x0 + len / 2, 0, 0);
  tex.repeat.set(1, Math.max(6, Math.round(len * 0.5))); // constant tape-wrap pitch vs length
  group.add(m);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(ROPE_R, 20, 14), mat);
  cap.position.set(x0, 0, 0); group.add(cap);         // rounded rope end
}

function initSeparators(THREE) {
  // builds one full-bleed divider: ring post at one edge → turnbuckle → rope to the far edge.
  // `flip` mirrors the whole assembly so successive separators alternate sides.
  function makeScene(canvas, flip) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
    const scene = new THREE.Scene();
    scene.environment = arenaEnv(THREE, renderer);
    const camHalfH = 1.12;
    const cam = new THREE.OrthographicCamera(-1, 1, camHalfH, -camHalfH, -50, 50);
    // slightly elevated 3/4 view (~16° down) so tops of the bars and rope catch light —
    // a dead-on orthographic view is what made the assembly read flat
    cam.position.set(0, 2.8, 10); cam.lookAt(0, 0, 0);
    // in-venue lighting: a warm house spot as key, and a dim crimson crowd-glow rim
    // from below-behind — the same light the scrimmed venue photos are living in
    scene.add(new THREE.AmbientLight(0xffdfc0, 0.14));
    const key = new THREE.DirectionalLight(0xffd9a8, 1.0); key.position.set(-3, 5, 8); scene.add(key);    // amber spot, upper left
    const rim = new THREE.DirectionalLight(0xb8323e, 0.4); rim.position.set(4, -2.5, -6); scene.add(rim); // crowd-glow rim, lower right behind

    const S = 0.4;                                   // native turnbuckle units → world (compact corner fitting)
    const divider = new THREE.Group(); divider.scale.x = flip ? -1 : 1; scene.add(divider);
    // turnbuckle + post + rope ALL share the scaled cluster (native units)
    const cluster = new THREE.Group(); cluster.scale.setScalar(S); divider.add(cluster);
    const { root: tb, body, eyeL, eyeR, sideR, mats } = buildTurnbuckle(THREE); cluster.add(tb);
    // tilt both eye loops out of the camera plane: the left one wraps the anchor fork in
    // 3D (one arm in front of the loop, one behind), the right one presents its hole
    // axis to the rope so the taut tie-off can thread it for real.
    eyeL.rotation.x = EYE_TILT_L;
    eyeR.rotation.x = Math.PI + EYE_TILT_R;
    // yaw the right eye so the far side of its loop — the part the rope wraps —
    // passes BEHIND the rope and is obscured by it, instead of grazing out
    // through the rope's front face. Ortho projection means this costs nothing
    // positionally; it only fixes the occlusion order.
    eyeR.rotation.y = -Math.PI * 0.09;
    const postMat = mats.shackle.clone();            // forged like the frame, in a darker steel
    postMat.color.set(0x7d828c); postMat.envMapIntensity = 0.75;
    cluster.add(makeAnchor(THREE, postMat));
    // rope: crimson tape wrap (semi-gloss vinyl). Slightly glossier than cloth so a
    // highlight runs along the top of the rope — that running glint is what makes a
    // red rope read crisp under house light. Color + bump from the same seam texture.
    const rTex = ropeTex(THREE);
    const ropeMat = new THREE.MeshStandardMaterial({ map: rTex, bumpMap: rTex, bumpScale: 0.06, metalness: 0.0, roughness: 0.48, envMapIntensity: 0.65 });
    const ropeGroup = new THREE.Group(); cluster.add(ropeGroup);

    const resize = () => {
      const r = canvas.getBoundingClientRect(); if (!r.width) return;
      renderer.setSize(r.width, r.height, false);
      const camHalfW = camHalfH * (r.width / r.height);
      cam.left = -camHalfW; cam.right = camHalfW; cam.top = camHalfH; cam.bottom = -camHalfH; cam.updateProjectionMatrix();
      const leftEdge = -camHalfW;
      // the fork shows as a SMALL "<" triangle — about one eye-bolt-loop wide — with
      // its arms bleeding off the left edge; the vertex (at the eye loop center,
      // native -4.97) sits just 0.55 world units in from the edge
      cluster.position.x = leftEdge + 0.55 + 4.97 * S;
      const xRight = (camHalfW + 0.6 - cluster.position.x) / S; // right edge + bleed, in native units
      rebuildRope(THREE, ropeGroup, ropeMat, rTex, xRight);
    };
    resize();
    return { renderer, scene, cam, body, sideR, rope: ropeGroup, resize };
  }

  const items = [...document.querySelectorAll('.tb3d')].map(canvas => {
    const flip = canvas.closest('.scene-break')?.dataset.tbFlip === '1';
    let s; try { s = makeScene(canvas, flip); } catch (e) { return null; }
    canvas.style.display = 'block';                 // make visible BEFORE sizing
    const line = canvas.parentElement.querySelector('.tb-line'); if (line) line.style.display = 'none';
    s.resize();                                     // size now that the canvas has real dimensions (fixes load-time distortion)
    return Object.assign({ canvas }, s);
  }).filter(Boolean);

  const relayout = () => items.forEach(it => it.resize());
  addEventListener('resize', relayout);
  addEventListener('load', relayout);
  if (window.ResizeObserver) { const ro = new ResizeObserver(relayout); items.forEach(it => ro.observe(it.canvas)); }
  function tick() {
    const vh = innerHeight;
    for (const it of items) {
      const r = it.canvas.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) continue;
      const p = Math.min(1, Math.max(0, 1 - (r.top + r.height / 2) / vh)); // 0 at viewport bottom → 1 at top
      // the frame cranks THREE full turns through the pass, and the tighten plays
      // out like the real mechanism with the left eye pinned to its anchor: each
      // turn threads the frame one 0.1 pitch toward the anchor, while the right
      // side closes at double rate (its own threading + riding the frame) and
      // drags the rope with it — pulling rope in from off-screen. The rod tips
      // visibly close their gap inside the frame's open window as it cranks.
      const t = 3 * p;                       // turns completed
      it.body.rotation.x = t * Math.PI * 2;
      it.body.position.x = -0.1 * t;         // frame walks toward the anchor
      it.sideR.position.x = -0.2 * t;        // right rod + eye thread in at 2× pitch
      it.rope.position.x = -0.2 * t;         // ring drags the rope along — real travel
      it.renderer.render(it.scene, it.cam);
    }
    requestAnimationFrame(tick);
  }
  tick();
}

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduce && document.querySelector('.tb3d')) {
  import('three').then(THREE => initSeparators(THREE)).catch(() => {/* keep fallback image */});
}
