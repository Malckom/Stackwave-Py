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
