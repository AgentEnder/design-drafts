/* Real-time 3D turnbuckle separators.
   Each .tb3d <canvas> gets a procedural galvanized turnbuckle whose open frame
   rotates (tightens) as the separator scrolls through the viewport. Falls back
   to the static photoreal image (.tb-fallback) when WebGL/modules are missing
   or the user prefers reduced motion. */

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduce && document.querySelector('.tb3d')) {
  import('three').then(THREE => init(THREE)).catch(() => {/* keep fallback image */});
}

function init(THREE) {
  // studio environment: bright sky → horizon → dark floor + two window highlights
  function studioEnv(renderer) {
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const c = cv.getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#fbfcfe'); g.addColorStop(.42, '#cfd6df'); g.addColorStop(.5, '#eef3f8'); g.addColorStop(.58, '#9aa2ad'); g.addColorStop(1, '#3c4047');
    c.fillStyle = g; c.fillRect(0, 0, 1024, 512);
    for (const cx of [300, 660]) { const rg = c.createRadialGradient(cx, 150, 8, cx, 150, 150); rg.addColorStop(0, 'rgba(255,255,255,0.95)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = rg; c.fillRect(cx - 170, 0, 340, 320); }
    const tex = new THREE.CanvasTexture(cv); tex.mapping = THREE.EquirectangularReflectionMapping; tex.colorSpace = THREE.SRGBColorSpace;
    const p = new THREE.PMREMGenerator(renderer); const t = p.fromEquirectangular(tex).texture; tex.dispose(); p.dispose(); return t;
  }
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
  function buildTurnbuckle() {
    // galvanized spangle texture (mottle + faint scratches) → matte, non-flat metal
    function galvTex() {
      const s = 256, cv = document.createElement('canvas'); cv.width = cv.height = s; const x = cv.getContext('2d');
      x.fillStyle = '#8a8a8a'; x.fillRect(0, 0, s, s);
      for (let i = 0; i < 2800; i++) { const v = 110 + (Math.random() * 120 | 0); x.fillStyle = `rgba(${v},${v},${v},${Math.random() * 0.5 + 0.15})`; x.beginPath(); x.arc(Math.random() * s, Math.random() * s, Math.random() * 2.3 + 0.4, 0, 7); x.fill(); }
      for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(225,225,225,${Math.random() * 0.22})`; x.lineWidth = Math.random() * 1.1 + 0.3; const x0 = Math.random() * s, y0 = Math.random() * s, a = Math.random() * Math.PI, l = Math.random() * 60 + 20; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + Math.cos(a) * l, y0 + Math.sin(a) * l); x.stroke(); }
      const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4); return t;
    }
    const tex = galvTex();
    const metal = new THREE.MeshStandardMaterial({ color: 0xc9ccd2, metalness: 0.82, roughness: 0.5, roughnessMap: tex, bumpMap: tex, bumpScale: 0.012, envMapIntensity: 1.1 });
    const root = new THREE.Group();
    // open frame body — flat stock <==>: straight rails, 30° angled ends; window follows the same contour
    const shape = forgedContour(() => new THREE.Shape(), 0.66, 1.4, 0.18);
    shape.holes.push(forgedContour(() => new THREE.Path(), 0.36, 1.15, 0.1));
    const frameGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2, steps: 1 });
    frameGeo.center();
    const body = new THREE.Mesh(frameGeo, metal); root.add(body);
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
    // threaded shaft (threads cut on this side only), backed out with a gap at center
    const threadGeo = threadedRod(3.6, 0.2, 0.1, 0.03);
    [-1, 1].forEach(s => { const m = new THREE.Mesh(threadGeo, metal); m.rotation.z = Math.PI / 2; m.position.x = s * 2.25; root.add(m); });
    // forged TEARDROP eye: shaft bends in at the pinched neck, bulges round at the far end,
    // tip curves back to rest against the shank (small opening at the neck). Centered on the axis.
    function makeEye() {
      const rr = 0.19;
      const P = [[-0.26, 0], [0, 0], [0.22, 0.27], [0.56, 0.45], [0.92, 0.43], [1.18, 0.18], [1.25, 0], [1.18, -0.18], [0.92, -0.43], [0.56, -0.45], [0.27, -0.28], [0.09, -0.08]];
      const pts = P.map(p => new THREE.Vector3(p[0], p[1], 0)), tip = pts[pts.length - 1];
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 180, rr, 20, false), metal));
      const cap = new THREE.Mesh(new THREE.SphereGeometry(rr, 16, 12), metal); cap.position.copy(tip); g.add(cap);
      return g;
    }
    { const e = makeEye(); e.position.x = 4.05; root.add(e); }
    { const e = makeEye(); e.position.x = -4.05; e.scale.x = -1; root.add(e); }
    return { root, body };
  }
  function makeScene(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    const scene = new THREE.Scene();
    scene.environment = studioEnv(renderer);
    const cam = new THREE.PerspectiveCamera(22, 3, 0.1, 100);
    cam.position.set(0, 1.4, 17); cam.lookAt(0, 0, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.14));
    const key = new THREE.DirectionalLight(0xffffff, 0.6); key.position.set(-4, 6, 8); scene.add(key);
    const { root, body } = buildTurnbuckle(); scene.add(root);
    const resize = () => { const r = canvas.getBoundingClientRect(); if (!r.width) return; renderer.setSize(r.width, r.height, false); cam.aspect = r.width / r.height; cam.updateProjectionMatrix(); };
    resize();
    return { renderer, scene, cam, body, resize };
  }

  const items = [...document.querySelectorAll('.tb3d')].map(canvas => {
    let s; try { s = makeScene(canvas); } catch (e) { return null; }
    const fb = canvas.parentElement.querySelector('.tb-fallback'); if (fb) fb.style.display = 'none';
    canvas.style.display = 'block';
    return Object.assign({ canvas }, s);
  }).filter(Boolean);

  addEventListener('resize', () => items.forEach(it => it.resize()));
  function tick() {
    const vh = innerHeight;
    for (const it of items) {
      const r = it.canvas.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) continue;
      const p = 1 - (r.top + r.height / 2) / vh;          // 0 at viewport bottom → 1 at top
      it.body.rotation.x = p * Math.PI * 2;                // one full turn per pass
      it.renderer.render(it.scene, it.cam);
    }
    requestAnimationFrame(tick);
  }
  tick();
}
