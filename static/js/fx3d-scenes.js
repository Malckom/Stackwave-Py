// Stackwave 3D scenes: Nairobi globe (contact page) + magnetic tech-stack constellation (home page).
// Needs Three.js. Each scene runs only if its container exists; both pause off-screen and respect reduced motion.
(function () {
  'use strict';
  var T = window.THREE;
  if (!T) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.min(Math.max(v, a), b); };

  // Shared loop helper: runs fn(now) while visible & tab active (once only if reduced motion).
  function runner(el, fn) {
    var on = false, vis = true;
    function tick(now) { if (!on) return; fn(now); if (!reduce) requestAnimationFrame(tick); }
    function go() { if (!on && vis && !document.hidden) { on = true; requestAnimationFrame(tick); } }
    function halt() { on = false; }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; vis ? go() : halt(); }).observe(el);
    document.addEventListener('visibilitychange', function () { document.hidden ? halt() : go(); });
    go();
    return { redraw: function () { requestAnimationFrame(fn); } };
  }
  function makeRenderer(canvas, maxDpr) {
    try {
      var r = new T.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      return r;
    } catch (e) { return null; }
  }

  // =====================================================================
  // 1) Nairobi globe
  // =====================================================================
  (function globe() {
    var wrap = document.getElementById('contact-globe');
    if (!wrap) return;
    var canvas = wrap.querySelector('canvas'), label = wrap.querySelector('.globe-label');
    var renderer = makeRenderer(canvas, 2);
    if (!renderer) return;
    var LAND = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPCf//8HAAAAAAAAAAAAAAAAyPzz//8A4AAAAAADAAAAAACAlAnw//8AAAAAB4AfAAAAAADAAywA/P8AAABgAP4fAAEAAQIAPvYH+H8AAABguP//7x8A4P//K9wc+B8AgH+g1///////z////z98+AMC4L/8////////AP///684+AAB8P7///////9/wP///wMGcAAAfP7//////38fgAf+/wd+AAAAfP7//////wEBAAH4/x9+AABAKP//////f8ABAADw/3//AQCw+P///////8AAAADg////AwDA/////////wAAAADA//8vBwDA/////////wAAAADA//8/AACA/6/v////fwAAAADA//8PAACA1wf3////PwIAAADA//8HAADwYW/P////DwEAAACA//8DAADwQPnP//9/BAEAAACA//8DAAAAD+D/////yAAAAAAA/v8BAADgD8D/////IAAAAAAA+n8AAADwf9f/////AQAAAAAA/IMAAADw///3////AQAAAAAA8IEAAAD8/7/P////AAAAAAAA4AEAAAD8/79/+P9/AQAAAAAAwBEAAAD+/3//8OcHAAAAAAAAwBsYAAD8/39/4MMLAAAAAAAAAB4AAAD+//8e4IEHAQAAAAAAAHAAAAD+//8HwIAPAwAAAAAAAAAUAAD8//8JwIAGAAAAAAAAAID+AAD4//8PAIAABAAAAAAAAAD+AQDw/f8PAAEBAAAAAAAAAAD+DwAA8P8HAIBhAAAAAAAAAAD/DwAA8P8DAABzAAAAAAAAAAD/PwAA8P8BAABzMQAAAAAAAAD//wEA8P8AAAACwQMAAAAAAAD//wMA4P8AAAAEgAcAAAAAAAD//wMA4P8AAACABQEAAAAAAAD+/wEA4P8AAAAAAAAAAAAAAAD+/wAA4P8IAAAAMAAAAAAAAAD4/wAA4P8MAAAAfgIAAAAAAADw/wAA4D8MAAAA/gcAAAAAAADw/wAA4D8GAADA/w8AAAAAAADwPwAAwD8GAADg/w8AAAAAAADwHwAAwB8AAADg/x8AAAAAAAD4DwAAgB8AAADA/x8AAAAAAAD4DwAAgA8AAADA/x8AAAAAAAD4BwAAgAMAAADAwx8AAAAAAAD4AQAAAAAAAAAAAA8AAAAAAAD4AAAAAAAAAAAAAARAAAAAAAA8AAAAAAAAAAAAAAQgAAAAAAA4AAAAAAAAAAAAAAAQAAAAAAAcAAAAAAAAAAAAAAAIAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAMAQAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', KENYA = [[38.9,-4.4],[39.5,-4.4],[38.3,-3.8],[38.9,-3.8],[39.5,-3.8],[38.3,-3.2],[38.9,-3.2],[39.5,-3.2],[40.1,-3.2],[37.1,-2.6],[37.7,-2.6],[38.3,-2.6],[38.9,-2.6],[39.5,-2.6],[40.1,-2.6],[35.9,-2],[36.5,-2],[37.1,-2],[37.7,-2],[38.3,-2],[38.9,-2],[39.5,-2],[40.1,-2],[40.7,-2],[34.7,-1.4],[35.3,-1.4],[35.9,-1.4],[36.5,-1.4],[37.1,-1.4],[37.7,-1.4],[38.3,-1.4],[38.9,-1.4],[39.5,-1.4],[40.1,-1.4],[40.7,-1.4],[41.3,-1.4],[34.1,-0.8],[34.7,-0.8],[35.3,-0.8],[35.9,-0.8],[36.5,-0.8],[37.1,-0.8],[37.7,-0.8],[38.3,-0.8],[38.9,-0.8],[39.5,-0.8],[40.1,-0.8],[40.7,-0.8],[34.1,-0.2],[34.7,-0.2],[35.3,-0.2],[35.9,-0.2],[36.5,-0.2],[37.1,-0.2],[37.7,-0.2],[38.3,-0.2],[38.9,-0.2],[39.5,-0.2],[40.1,-0.2],[40.7,-0.2],[34.1,0.4],[34.7,0.4],[35.3,0.4],[35.9,0.4],[36.5,0.4],[37.1,0.4],[37.7,0.4],[38.3,0.4],[38.9,0.4],[39.5,0.4],[40.1,0.4],[40.7,0.4],[34.7,1],[35.3,1],[35.9,1],[36.5,1],[37.1,1],[37.7,1],[38.3,1],[38.9,1],[39.5,1],[40.1,1],[40.7,1],[35.3,1.6],[35.9,1.6],[36.5,1.6],[37.1,1.6],[37.7,1.6],[38.3,1.6],[38.9,1.6],[39.5,1.6],[40.1,1.6],[40.7,1.6],[35.3,2.2],[35.9,2.2],[36.5,2.2],[37.1,2.2],[37.7,2.2],[38.3,2.2],[38.9,2.2],[39.5,2.2],[40.1,2.2],[40.7,2.2],[34.7,2.8],[35.3,2.8],[35.9,2.8],[36.5,2.8],[37.1,2.8],[37.7,2.8],[38.3,2.8],[38.9,2.8],[39.5,2.8],[40.1,2.8],[40.7,2.8],[34.7,3.4],[35.3,3.4],[35.9,3.4],[36.5,3.4],[37.1,3.4],[37.7,3.4],[38.3,3.4],[38.9,3.4],[39.5,3.4],[40.1,3.4],[40.7,3.4],[41.3,3.4],[34.7,4],[35.3,4],[35.9,4],[36.5,4],[37.1,4],[40.7,4],[34.7,4.6],[35.3,4.6],[35.9,4.6],[35.3,5.2]];
    var R = 1.6, scene = new T.Scene(), camera = new T.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 0, 6.2);
    var tilt = new T.Group(), spin = new T.Group(); scene.add(tilt); tilt.add(spin);
    var rad = Math.PI / 180;
    function ll(lat, lon, r) { var p = lat * rad, l = lon * rad; return new T.Vector3(r * Math.cos(p) * Math.sin(l), r * Math.sin(p), r * Math.cos(p) * Math.cos(l)); }

    // body (occludes the far side) + soft atmosphere
    spin.add(new T.Mesh(new T.SphereGeometry(R * 0.995, 48, 32), new T.MeshBasicMaterial({ color: 0x0a1020 })));
    tilt.add(new T.Mesh(new T.SphereGeometry(R * 1.16, 48, 32), new T.ShaderMaterial({
      transparent: true, side: T.BackSide, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { c: { value: new T.Color(0x3d63ff) } },
      vertexShader: 'varying vec3 n;void main(){n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'varying vec3 n;uniform vec3 c;void main(){float i=pow(max(0.62-dot(n,vec3(0.,0.,1.)),0.),2.6);gl_FragColor=vec4(c,1.)*i*1.6;}'
    })));

    // land dots from the embedded Natural Earth mask (thinned toward the poles)
    var bin = atob(LAND), pts = [], r, c;
    for (r = 0; r < 72; r++) {
      var lat = 88.75 - r * 2.5, step = Math.max(1, Math.round(1 / Math.cos(lat * rad)));
      for (c = 0; c < 144; c += step) {
        var i = r * 144 + c;
        if (bin.charCodeAt(i >> 3) & (1 << (i & 7))) { var v = ll(lat, -178.75 + c * 2.5, R); pts.push(v.x, v.y, v.z); }
      }
    }
    function dots(arr, size, color, op) {
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(arr, 3));
      var p = new T.Points(g, new T.PointsMaterial({ size: size, color: color, transparent: true, opacity: op, depthWrite: false })); spin.add(p); return p;
    }
    dots(pts, 0.03, 0x5877ff, 0.85);
    var kp = []; KENYA.forEach(function (k) { var v = ll(k[1], k[0], R * 1.002); kp.push(v.x, v.y, v.z); });
    dots(kp, 0.042, 0x26fedc, 1);

    // Nairobi + pulse rings
    var NAI = ll(-1.2921, 36.8219, R * 1.004), rings = [];
    [0, 0.5].forEach(function (ph) {
      var m = new T.Mesh(new T.RingGeometry(0.05, 0.062, 40), new T.MeshBasicMaterial({ color: 0x26fedc, transparent: true, side: T.DoubleSide, depthWrite: false }));
      m.position.copy(NAI); m.lookAt(NAI.clone().multiplyScalar(2)); m.userData.ph = ph; spin.add(m); rings.push(m);
    });
    dots([NAI.x, NAI.y, NAI.z], 0.09, 0xeafffb, 1);

    // fiber-optic arcs to global server hubs, with travelling packets
    var hubs = [[51.5, -0.1], [50.1, 8.7], [25.2, 55.3], [19.1, 72.9], [1.35, 103.8], [6.5, 3.4], [-26.2, 28.0], [40.7, -74], [-23.5, -46.6], [-33.9, 151.2], [35.7, 139.7]];
    var arcs = [], hp = [];
    hubs.forEach(function (h, idx) {
      var p1 = ll(h[0], h[1], R * 1.004), ang = NAI.angleTo(p1);
      var ctrl = NAI.clone().add(p1).normalize().multiplyScalar(R * (1.02 + ang * 0.3));
      var curve = new T.QuadraticBezierCurve3(NAI.clone(), ctrl, p1);
      spin.add(new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(48)), new T.LineBasicMaterial({ color: 0x26fedc, transparent: true, opacity: 0.28, depthWrite: false })));
      hp.push(p1.x, p1.y, p1.z);
      arcs.push({ curve: curve, off: idx / hubs.length, spd: 0.16 + (idx % 4) * 0.03 });
    });
    dots(hp, 0.055, 0xb8c3ff, 1);
    var pk = dots(new Array(arcs.length * 2 * 3).fill(0), 0.07, 0xeafffb, 1), pa = pk.geometry.attributes.position;

    // interaction: hover = faster + tilts toward pointer; drag = spin
    var spinY = -36.8 * rad, velY = 0.0, tiltX = 0.28, tiltTarget = 0.28, dragX = 0, hover = false, drag = false, lastX = 0, lastY = 0, t0 = performance.now(), prev = t0, W = 1, H = 1;
    function resize() { W = wrap.clientWidth; H = wrap.clientHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
    resize(); window.addEventListener('resize', function () { resize(); if (reduce) draw(performance.now()); });
    canvas.addEventListener('pointerenter', function () { hover = true; });
    canvas.addEventListener('pointerleave', function () { hover = false; tiltTarget = 0.28; });
    canvas.addEventListener('pointermove', function (e) {
      var b = canvas.getBoundingClientRect(), y = (e.clientY - b.top) / b.height - 0.5;
      if (!drag) tiltTarget = 0.28 + y * 0.45;
      if (drag) { velY = (e.clientX - lastX) * 0.006; spinY += velY; tiltTarget = clamp(tiltTarget + (e.clientY - lastY) * 0.004, -0.6, 0.9); lastX = e.clientX; lastY = e.clientY; }
    });
    canvas.addEventListener('pointerdown', function (e) { drag = true; lastX = e.clientX; lastY = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (x) {} canvas.classList.add('is-drag'); });
    var up = function () { drag = false; canvas.classList.remove('is-drag'); };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

    var wp = new T.Vector3();
    function draw(now) {
      var dt = Math.min((now - prev) / 1000, 0.05), t = (now - t0) / 1000; prev = now;
      if (!reduce) {
        if (!drag) { spinY += (hover ? 0.55 : 0.14) * dt + velY; velY *= 0.94; }
      }
      tiltX += (tiltTarget - tiltX) * 0.06;
      spin.rotation.y = spinY; tilt.rotation.x = tiltX; tilt.rotation.z = -0.12;
      rings.forEach(function (m) { var k = ((t * 0.7 + m.userData.ph) % 1); m.scale.setScalar(1 + k * 4); m.material.opacity = (1 - k) * 0.9; });
      arcs.forEach(function (a, i) {
        for (var j = 0; j < 2; j++) { var q = a.curve.getPoint(((t * a.spd + a.off + j * 0.5) % 1)); pa.setXYZ(i * 2 + j, q.x, q.y, q.z); }
      });
      pa.needsUpdate = true;
      tilt.updateMatrixWorld(true);
      if (label) {
        wp.copy(NAI).applyMatrix4(spin.matrixWorld);
        var facing = wp.z > 0.35; wp.project(camera);
        label.style.transform = 'translate(' + ((wp.x * 0.5 + 0.5) * W).toFixed(1) + 'px,' + ((-wp.y * 0.5 + 0.5) * H).toFixed(1) + 'px)';
        label.style.opacity = facing ? '1' : '0';
      }
      renderer.render(scene, camera);
    }
    runner(wrap, draw);
    wrap.classList.add('is-on');
  })();

  // =====================================================================
  // 2) Magnetic tech-stack constellation
  // =====================================================================
  (function constellation() {
    var wrap = document.getElementById('constellation');
    if (!wrap) return;
    var canvas = wrap.querySelector('canvas'), holder = wrap.querySelector('.const-labels');
    var renderer = makeRenderer(canvas, 1.75);
    if (!renderer) return;
    var scene = new T.Scene(), camera = new T.PerspectiveCamera(45, 1, 0.1, 50);
    var CZ = 9.5; camera.position.set(0, 0, CZ);

    // central core
    var core = new T.Group(); scene.add(core);
    core.add(new T.Mesh(new T.IcosahedronGeometry(0.85, 1), new T.MeshBasicMaterial({ color: 0x26fedc, wireframe: true, transparent: true, opacity: 0.55 })));
    core.add(new T.Mesh(new T.IcosahedronGeometry(0.42, 0), new T.MeshBasicMaterial({ color: 0x26fedc, transparent: true, opacity: 0.85 })));
    var halo = new T.Mesh(new T.SphereGeometry(1.25, 24, 16), new T.MeshBasicMaterial({ color: 0x3d63ff, transparent: true, opacity: 0.08, depthWrite: false })); scene.add(halo);

    var defs = [
      ['Python / Flask', new T.OctahedronGeometry(0.34), 0x26fedc], ['Node.js', new T.BoxGeometry(0.46, 0.46, 0.46), 0x8ff3ff],
      ['React', new T.TorusGeometry(0.28, 0.09, 8, 20), 0x5b7bff], ['Tailwind CSS', new T.TetrahedronGeometry(0.42), 0x26fedc],
      ['SQLite', new T.CylinderGeometry(0.3, 0.3, 0.42, 14), 0xb18cff], ['M-Pesa', new T.IcosahedronGeometry(0.34, 0), 0x8ff3ff],
      ['Paystack', new T.DodecahedronGeometry(0.33), 0x5b7bff], ['Git', new T.ConeGeometry(0.32, 0.55, 5), 0xb18cff]
    ];
    var nodes = defs.map(function (d, i) {
      var g = new T.Group(), col = d[2];
      g.add(new T.Mesh(d[1], new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.22, depthWrite: false })));
      g.add(new T.LineSegments(new T.EdgesGeometry(d[1]), new T.LineBasicMaterial({ color: col })));
      scene.add(g);
      var el = null; if (holder) { el = document.createElement('div'); el.className = 'const-label'; el.textContent = d[0]; holder.appendChild(el); }
      return { g: g, el: el, col: new T.Color(col), a: 2.3 + (i % 4) * 0.55, spd: (0.16 + (i % 3) * 0.05) * (i % 2 ? -1 : 1), ph: i * Math.PI * 0.25, inc: (i * 0.55) % 1.2 - 0.4,
        cur: new T.Vector3(), base: new T.Vector3(), pull: 0 };
    });

    // dynamic laser lines: node pairs (28) + core links (8) + cursor links (8)
    var N = nodes.length, SEG = N * (N - 1) / 2 + N + N;
    var lp = new Float32Array(SEG * 6), lc = new Float32Array(SEG * 6), lg = new T.BufferGeometry();
    lg.setAttribute('position', new T.BufferAttribute(lp, 3)); lg.setAttribute('color', new T.BufferAttribute(lc, 3));
    scene.add(new T.LineSegments(lg, new T.LineBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false })));

    var ndc = new T.Vector2(), ray = new T.Raycaster(), plane = new T.Plane(new T.Vector3(0, 0, 1), 0), hit = new T.Vector3(), inside = false, mx = 0;
    var W = 1, H = 1, t0 = performance.now(), v = new T.Vector3(), tmp = new T.Color();
    function resize() { W = wrap.clientWidth; H = wrap.clientHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
    resize(); window.addEventListener('resize', function () { resize(); if (reduce) draw(performance.now()); });
    wrap.addEventListener('pointermove', function (e) {
      var b = wrap.getBoundingClientRect(); ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); inside = true;
    });
    wrap.addEventListener('pointerleave', function () { inside = false; });

    function seg(k, a, b, ca, cb) {
      lp[k * 6] = a.x; lp[k * 6 + 1] = a.y; lp[k * 6 + 2] = a.z; lp[k * 6 + 3] = b.x; lp[k * 6 + 4] = b.y; lp[k * 6 + 5] = b.z;
      lc[k * 6] = ca.r; lc[k * 6 + 1] = ca.g; lc[k * 6 + 2] = ca.b; lc[k * 6 + 3] = cb.r; lc[k * 6 + 4] = cb.g; lc[k * 6 + 5] = cb.b;
    }
    var black = new T.Color(0, 0, 0), ca = new T.Color(), cb = new T.Color(), mint = new T.Color(0x26fedc);
    function draw(now) {
      var t = reduce ? 0 : (now - t0) / 1000;
      mx += ((inside ? ndc.x : 0) - mx) * 0.05;
      camera.position.x = mx * 0.7; camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
      ray.setFromCamera(ndc, camera);
      var has = inside && !!ray.ray.intersectPlane(plane, hit);
      core.rotation.y = t * 0.5; core.rotation.x = t * 0.3; halo.scale.setScalar(1 + Math.sin(t * 1.6) * 0.06);
      nodes.forEach(function (n) {
        var th = n.ph + t * n.spd, x = Math.cos(th) * n.a, z = Math.sin(th) * n.a * 0.55;
        n.base.set(x, Math.sin(th * 0.7) * 0.5 + z * Math.sin(n.inc), z * Math.cos(n.inc));
        var tgt = n.base, pull = 0;
        if (has) {
          var d = v.copy(hit).sub(n.base), dist = d.length();
          if (dist < 3.4) { pull = Math.pow(1 - dist / 3.4, 2) * 0.7; tgt = n.base.clone().addScaledVector(d, pull); }
        }
        n.pull += (pull - n.pull) * 0.15;
        n.cur.lerp(tgt, 0.14);
        n.g.position.copy(n.cur); n.g.scale.setScalar(1 + n.pull * 0.9); n.g.rotation.x = t * 0.6 + n.ph; n.g.rotation.y = t * 0.8;
      });
      var k = 0, i, j, a, b, d, s;
      for (i = 0; i < N; i++) for (j = i + 1; j < N; j++) {
        a = nodes[i]; b = nodes[j]; d = a.cur.distanceTo(b.cur);
        s = d < 3.6 ? (1 - d / 3.6) * (0.1 + Math.max(a.pull, b.pull) * 1.6) : 0;
        seg(k++, a.cur, b.cur, ca.copy(a.col).multiplyScalar(s), cb.copy(b.col).multiplyScalar(s));
      }
      for (i = 0; i < N; i++) { a = nodes[i]; s = 0.14 + a.pull * 1.1; seg(k++, a.cur, core.position, ca.copy(mint).multiplyScalar(s * 0.7), cb.copy(a.col).multiplyScalar(s)); }
      for (i = 0; i < N; i++) { a = nodes[i]; s = has ? a.pull * 1.8 : 0; seg(k++, hit, a.cur, ca.copy(white()).multiplyScalar(s), cb.copy(a.col).multiplyScalar(s)); }
      lg.attributes.position.needsUpdate = true; lg.attributes.color.needsUpdate = true;
      nodes.forEach(function (n) {
        if (!n.el) return;
        v.copy(n.cur); v.project(camera);
        n.el.style.transform = 'translate(' + ((v.x * 0.5 + 0.5) * W + 16).toFixed(1) + 'px,' + ((-v.y * 0.5 + 0.5) * H).toFixed(1) + 'px) translateY(-50%)';
        n.el.style.opacity = (0.5 + n.pull * 0.9).toFixed(2);
      });
      renderer.render(scene, camera);
    }
    var _w = new T.Color(0xdff6ff); function white() { return _w; }
    runner(wrap, draw);
    wrap.classList.add('is-on');
    var sec = wrap.closest('.stack'); if (sec) sec.classList.add('stack--3d');
  })();
})();
