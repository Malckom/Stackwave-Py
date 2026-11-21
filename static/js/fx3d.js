// Stackwave 3D layer: hero (wave terrain + stack monolith), card tilt/spotlight, magnetic buttons, cursor trail.
// Everything skips itself for reduced-motion users; WebGL parts skip if WebGL or Three.js is unavailable.
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var qsa = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(Math.max(v, a), b); };

  // ---------- Cards: 3D tilt + gliding spotlight ----------
  if (fine) {
    qsa('.stack-tile, .ppanel-shot, .acc-item').forEach(function (el) {
      el.classList.add('tilt', 'spot');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        var max = r.width > 600 ? 3.5 : 9;
        el.style.setProperty('--ry', (x * max).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-y * max).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--ry', '0deg');
        el.style.setProperty('--rx', '0deg');
      });
    });
  }

  // ---------- Magnetic, depressible buttons ----------
  if (fine) {
    var mags = qsa('.btn').map(function (el) { return { el: el, x: 0, y: 0, s: 1, tx: 0, ty: 0, ts: 1, down: false }; });
    var magRun = false;
    var magLoop = function () {
      var busy = false;
      mags.forEach(function (m) {
        m.x += (m.tx - m.x) * 0.18; m.y += (m.ty - m.y) * 0.18; m.s += (m.ts - m.s) * 0.25;
        var moving = Math.abs(m.tx - m.x) > 0.05 || Math.abs(m.ty - m.y) > 0.05 || Math.abs(m.ts - m.s) > 0.001;
        if (moving) busy = true;
        m.el.style.translate = m.x.toFixed(2) + 'px ' + m.y.toFixed(2) + 'px';
        m.el.style.scale = m.s.toFixed(3);
      });
      if (busy) requestAnimationFrame(magLoop); else magRun = false;
    };
    var kick = function () { if (!magRun) { magRun = true; requestAnimationFrame(magLoop); } };
    window.addEventListener('pointermove', function (e) {
      mags.forEach(function (m) {
        var r = m.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = e.clientX - cx, dy = e.clientY - cy, reach = Math.max(r.width, r.height) / 2 + 70;
        var d = Math.hypot(dx, dy), pull = d < reach ? (1 - d / reach) : 0;
        var nx = dx * pull * 0.35, ny = dy * pull * 0.35 + (m.down ? 3 : 0);
        if (nx !== m.tx || ny !== m.ty) { m.tx = nx; m.ty = ny; kick(); }
      });
    }, { passive: true });
    mags.forEach(function (m) {
      m.el.addEventListener('pointerdown', function () { m.down = true; m.ty += 3; m.ts = 0.96; kick(); });
      var up = function () { if (m.down) { m.down = false; m.ty -= 3; m.ts = 1; kick(); } };
      m.el.addEventListener('pointerup', up); m.el.addEventListener('pointerleave', up);
    });
  }

  // ---------- Cursor-reactive glowing trail ----------
  if (fine) {
    var tc = document.createElement('canvas'), tctx = tc.getContext('2d'), parts = [], last = null, tRun = false;
    tc.className = 'fx-trail'; tc.setAttribute('aria-hidden', 'true'); document.body.appendChild(tc);
    var tsize = function () { tc.width = window.innerWidth; tc.height = window.innerHeight; };
    tsize(); window.addEventListener('resize', tsize);
    var tframe = function (now) {
      tctx.clearRect(0, 0, tc.width, tc.height);
      tctx.globalCompositeOperation = 'lighter';
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i], age = (now - p.t) / p.life;
        if (age >= 1) { parts.splice(i, 1); continue; }
        p.x += p.vx; p.y += p.vy; p.vy -= 0.004;
        var a = Math.pow(1 - age, 1.6) * 0.55, rad = p.r * (1 - age * 0.55);
        tctx.fillStyle = 'rgba(' + p.c + ',' + a.toFixed(3) + ')';
        tctx.beginPath(); tctx.arc(p.x, p.y, rad, 0, 6.2832); tctx.fill();
      }
      if (parts.length) requestAnimationFrame(tframe); else { tRun = false; tctx.clearRect(0, 0, tc.width, tc.height); }
    };
    window.addEventListener('pointermove', function (e) {
      var n = 1;
      if (last) n = clamp(Math.floor(Math.hypot(e.clientX - last.x, e.clientY - last.y) / 14), 1, 5);
      for (var i = 0; i < n; i++) {
        var k = last ? (i + 1) / n : 1, mint = Math.random() < 0.5;
        parts.push({ x: last ? last.x + (e.clientX - last.x) * k : e.clientX, y: last ? last.y + (e.clientY - last.y) * k : e.clientY,
          vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5 - 0.1, r: 1.4 + Math.random() * 2, life: 700 + Math.random() * 500,
          t: performance.now(), c: mint ? '38,254,220' : '90,120,255' });
      }
      if (parts.length > 180) parts.splice(0, parts.length - 180);
      last = { x: e.clientX, y: e.clientY };
      if (!tRun) { tRun = true; requestAnimationFrame(tframe); }
    }, { passive: true });
  }

  // ---------- Hero: wave terrain + stack monolith (WebGL) ----------
  var canvas = document.getElementById('hero-3d');
  if (!canvas || !window.THREE) return;
  var hero = canvas.parentElement, T = window.THREE, renderer;
  try { renderer = new T.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); } catch (e) { return; }

  var small = window.innerWidth < 768, wide = fine && window.innerWidth >= 900;
  var COLS = small ? 64 : 120, ROWS = small ? 36 : 64, SP = 0.22;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75));
  var scene = new T.Scene();
  scene.fog = new T.Fog(0x101415, 6, 20);
  var camera = new T.PerspectiveCamera(55, 1, 0.1, 60);
  var CAMY = 3.1;

  // terrain
  var count = COLS * ROWS, pos = new Float32Array(count * 3), col = new Float32Array(count * 3), k = 0, r, c;
  for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) { pos[k * 3] = (c - COLS / 2) * SP; pos[k * 3 + 2] = (r - ROWS / 2) * SP - 2; k++; }
  var geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  geo.setAttribute('color', new T.BufferAttribute(col, 3));
  scene.add(new T.Points(geo, new T.PointsMaterial({ size: small ? 0.055 : 0.05, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false })));
  var blue = new T.Color(0x3d63ff), mint = new T.Color(0x26fedc), white = new T.Color(0xeafffb), tmp = new T.Color();

  // monolith
  var mono = null, slabs = [], labels = [];
  if (wide) {
    mono = new T.Group(); scene.add(mono);
    scene.add(new T.AmbientLight(0xffffff, 0.55));
    var light = new T.PointLight(0x9fb4ff, 1.4, 16); light.position.set(0, 3, 5); scene.add(light);
    var layers = [['UI', 0x26fedc], ['API', 0x6f8bff], ['Database', 0xb18cff], ['Cloud', 0x8ff3ff]];
    var holder = document.getElementById('mono-labels');
    layers.forEach(function (L) {
      var g = new T.BoxBufferGeometry(2.6, 0.34, 2.6);
      var body = new T.Mesh(g, new T.MeshStandardMaterial({ color: L[1], emissive: L[1], emissiveIntensity: 0.08, roughness: 0.15, metalness: 0.6, transparent: true, opacity: 0.16, depthWrite: false, fog: false }));
      var edges = new T.LineSegments(new T.EdgesGeometry(g), new T.LineBasicMaterial({ color: L[1], transparent: true, opacity: 0.5, fog: false }));
      var slab = new T.Group(); slab.add(body, edges); mono.add(slab);
      slabs.push({ slab: slab, body: body, edges: edges, glow: 0 });
      if (holder) { var d = document.createElement('div'); d.className = 'mono-label'; d.textContent = L[0]; d.style.setProperty('--lc', '#' + ('000000' + L[1].toString(16)).slice(-6)); holder.appendChild(d); labels.push(d); }
    });
    hero.classList.add('hero--3d');
  }

  var ndc = new T.Vector2(0, 0), ray = new T.Raycaster(), plane = new T.Plane(new T.Vector3(0, 1, 0), 0), hit = new T.Vector3();
  var mx = 0, my = 0, tx = 0, ty = 0, inside = false, amp = 0, hx = 0, hz = 0, hasHit = false;
  var running = false, visible = true, t0 = performance.now(), W = 1, H = 1, v = new T.Vector3(), prox = 0;

  function resize() {
    W = hero.clientWidth; H = hero.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    if (mono) { mono.position.x = clamp(1.9 * camera.aspect, 2.6, 4.2); mono.scale.setScalar(clamp(H / 760, 0.8, 1.2)); }
  }
  function frame(now) {
    if (!running) return;
    var t = (now - t0) / 1000;
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
    camera.position.set(mx * 1.2, CAMY + my * 0.5, 7.5); camera.lookAt(0, 0, -1);
    camera.updateMatrixWorld();
    // pointer on terrain plane
    ray.setFromCamera(ndc, camera);
    hasHit = inside && !!ray.ray.intersectPlane(plane, hit);
    if (hasHit) { hx = hit.x; hz = hit.z; }
    amp += ((hasHit ? 1 : 0) - amp) * 0.06;
    var p = geo.attributes.position.array, cl = geo.attributes.color.array, n = 0, x, z, y, m, dx, dz, d2, f, rr, cc;
    for (rr = 0; rr < ROWS; rr++) for (cc = 0; cc < COLS; cc++) {
      x = p[n * 3]; z = p[n * 3 + 2];
      y = Math.sin(x * 0.55 + t * 0.9) * 0.45 + Math.cos(z * 0.6 + t * 0.7) * 0.4 + Math.sin((x + z) * 0.3 + t * 0.5) * 0.3;
      m = clamp((y + 1.1) / 2.2, 0, 1); f = 0;
      if (amp > 0.01) { dx = x - hx; dz = z - hz; d2 = dx * dx + dz * dz; if (d2 < 9) { f = Math.exp(-d2 * 0.6) * amp; y += Math.sin(Math.sqrt(d2) * 3.2 - t * 5) * 0.75 * f; } }
      p[n * 3 + 1] = y;
      tmp.copy(blue).lerp(mint, m); if (f > 0) tmp.lerp(white, f * 0.7);
      cl[n * 3] = tmp.r; cl[n * 3 + 1] = tmp.g; cl[n * 3 + 2] = tmp.b; n++;
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;

    if (mono) {
      mono.position.y = 1.5 + Math.sin(t * 0.8) * 0.12;
      mono.rotation.y = t * 0.22 + mx * 0.9; mono.rotation.x = 0.32 + my * 0.5;
      mono.updateMatrixWorld(true);
      v.setFromMatrixPosition(mono.matrixWorld).project(camera);
      var near = inside ? clamp(1 - Math.hypot(ndc.x - v.x, (ndc.y - v.y) * 0.8) / 0.9, 0, 1) : 0;
      prox += (near - prox) * 0.08;
      var gap = 0.55 + prox * 0.6, sc = mono.scale.x;
      light.position.set(ndc.x * 6, ndc.y * 3 + 2.5, 4.5);
      slabs.forEach(function (s, i) {
        s.slab.position.y = (1.5 - i) * gap;
        s.slab.rotation.y = (i - 1.5) * prox * 0.3 + Math.sin(t * 0.6 + i) * 0.04;
        s.slab.updateMatrixWorld(true);
        v.setFromMatrixPosition(s.slab.matrixWorld).project(camera);
        var local = inside ? clamp(1 - Math.abs(v.y - ndc.y) / 0.3, 0, 1) : 0;
        s.glow += (clamp(prox * 0.5 + local * 0.9, 0, 1) - s.glow) * 0.12;
        s.edges.material.opacity = 0.4 + s.glow * 0.6;
        s.body.material.emissiveIntensity = 0.08 + s.glow * 0.55;
        s.body.material.opacity = 0.14 + s.glow * 0.16;
        var lab = labels[i];
        if (lab) {
          v.setFromMatrixPosition(s.slab.matrixWorld); v.x += 1.9 * sc; v.project(camera);
          lab.style.transform = 'translate(' + ((v.x * 0.5 + 0.5) * W).toFixed(1) + 'px,' + ((-v.y * 0.5 + 0.5) * H).toFixed(1) + 'px) translateY(-50%)';
          lab.style.opacity = (0.55 + s.glow * 0.45).toFixed(2);
        }
      });
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  function start() { if (!running && visible && !document.hidden) { running = true; requestAnimationFrame(frame); } }
  function stop() { running = false; }

  resize(); window.addEventListener('resize', resize);
  hero.addEventListener('pointermove', function (e) {
    var b = hero.getBoundingClientRect();
    tx = (e.clientX - b.left) / b.width - 0.5; ty = (e.clientY - b.top) / b.height - 0.5;
    ndc.set(tx * 2, -ty * 2); inside = true;
  });
  hero.addEventListener('pointerleave', function () { inside = false; tx = 0; ty = 0; });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? start() : stop(); }).observe(hero);
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  canvas.classList.add('is-on'); start();
})();
