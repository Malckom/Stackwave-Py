/* Stackwave: shared behaviour (mobile menu, toast dismissal). */
(function () {
  'use strict';

  // ---------- Mobile menu ----------
  var toggle = document.getElementById('nav-toggle');
  var menu = document.getElementById('mobile-menu');
  if (toggle && menu) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (e) {
      if (e.matches) setOpen(false);
    });
  }

  // ---------- Toasts ----------
  // The auto-dismiss itself is pure CSS (see .toast in site.css), so it also works
  // without JavaScript. JS only handles the close button and removes finished toasts.
  var dismiss = function (toast) {
    toast.style.transition = 'opacity .25s ease, transform .25s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
    setTimeout(function () { toast.remove(); }, 260);
  };
  document.querySelectorAll('.toast').forEach(function (toast) {
    var close = toast.querySelector('.toast-close');
    if (close) close.addEventListener('click', function () { dismiss(toast); });
    toast.addEventListener('animationend', function (e) {
      if (e.animationName === 'toast-out') toast.remove();
    });
  });
})();

/* ---------- Counters: count up once when scrolled into view ---------- */
(function () {
  'use strict';
  var els = document.querySelectorAll('[data-count]');
  if (!els.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return; // the final number is already in the HTML

  var format = function (n) { return n.toLocaleString('en-US'); };
  var run = function (el) {
    var target = parseInt(el.dataset.count, 10);
    var prefix = el.dataset.prefix || '';
    var start = null, duration = 1300;
    var step = function (ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + format(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = prefix + '0';
    requestAnimationFrame(step);
  };
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.6 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ---------- Logo strip: pause / play button ---------- */
(function () {
  'use strict';
  var btn = document.querySelector('[data-marquee-toggle]');
  var marquee = document.querySelector('[data-marquee]');
  if (!btn || !marquee) return;
  var icon = btn.querySelector('.material-symbols-outlined');
  var text = btn.querySelector('.marquee-toggle-text');
  btn.addEventListener('click', function () {
    var paused = marquee.classList.toggle('is-paused');
    btn.setAttribute('aria-pressed', String(paused));
    icon.textContent = paused ? 'play_arrow' : 'pause';
    text.textContent = paused ? 'Play' : 'Pause';
  });
})();

/* ---------- Before / after slider ---------- */
(function () {
  'use strict';
  document.querySelectorAll('[data-compare]').forEach(function (box) {
    var range = box.querySelector('.compare-range');
    if (!range) return;
    var dragging = false;
    var update = function () {
      box.style.setProperty('--pos', range.value + '%');
      range.setAttribute('aria-valuetext', range.value + '% of the previous site showing');
    };
    var setFromX = function (x) {
      var r = box.getBoundingClientRect();
      range.value = Math.round(Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100)));
      update();
    };
    range.addEventListener('input', update);           // keyboard (arrow keys, Home, End)
    box.addEventListener('pointerdown', function (e) { // mouse, touch and pen
      dragging = true;
      box.setPointerCapture(e.pointerId);
      setFromX(e.clientX);
    });
    box.addEventListener('pointermove', function (e) { if (dragging) setFromX(e.clientX); });
    box.addEventListener('pointerup', function () { dragging = false; range.focus({ preventScroll: true }); });
    box.addEventListener('pointercancel', function () { dragging = false; });
    update();
  });
})();
