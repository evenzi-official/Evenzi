/* ════════════════════════════════════════════════════════════════════
   Evenzi · Event Control page scripts
   Load after ../../shared/shell.js
   ════════════════════════════════════════════════════════════════════ */

/* ── Hero parallax: bg follows mouse, mandala counter-parallaxes ── */
(function () {
  var hero = document.getElementById('hero');
  if (!hero) return;
  var bg = document.getElementById('hero-bg-img');
  var mandala = document.getElementById('hero-mandala');
  var content = document.getElementById('hero-content');
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;
  var rafId = null;
  var targetX = 0, targetY = 0, currentX = 0, currentY = 0;
  function update() {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    if (bg) bg.style.transform = 'translate(' + (currentX * 24).toFixed(2) + 'px,' + (currentY * 24).toFixed(2) + 'px) scale(1.06)';
    if (mandala) mandala.style.transform = 'translate(calc(-50% + ' + (currentX * -32).toFixed(2) + 'px), calc(-50% + ' + (currentY * -32).toFixed(2) + 'px))';
    if (content) content.style.transform = 'translate(' + (currentX * -8).toFixed(2) + 'px,' + (currentY * -8).toFixed(2) + 'px)';
    if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
      rafId = requestAnimationFrame(update);
    } else {
      rafId = null;
    }
  }
  hero.addEventListener('mousemove', function (e) {
    var rect = hero.getBoundingClientRect();
    targetX = (e.clientX - rect.left) / rect.width - 0.5;
    targetY = (e.clientY - rect.top) / rect.height - 0.5;
    if (!rafId) rafId = requestAnimationFrame(update);
  });
  hero.addEventListener('mouseleave', function () {
    targetX = 0; targetY = 0;
    if (!rafId) rafId = requestAnimationFrame(update);
  });
  /* Touch — tilt by device orientation if available */
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', function (e) {
      if (e.gamma == null || e.beta == null) return;
      targetX = Math.max(-0.5, Math.min(0.5, e.gamma / 60));
      targetY = Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 60));
      if (!rafId) rafId = requestAnimationFrame(update);
    });
  }
})();

/* ── Quick-action card: tile + composer toasts ─────── */
(function () {
  var tiles = document.querySelectorAll('.qa-tile[data-qa]');
  tiles.forEach(function (t) {
    t.addEventListener('click', function () {
      var label = t.querySelector('.font-display').textContent.trim();
      var toast = document.getElementById('bc-toast');
      var toastText = document.getElementById('bc-toast-text');
      if (!toast) return;
      toastText.textContent = 'OPEN: ' + label.toUpperCase();
      toast.classList.add('is-show');
      setTimeout(function () { toast.classList.remove('is-show'); }, 1600);
    });
  });
  var form = document.getElementById('qa-composer');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input');
      if (!input || !input.value.trim()) return;
      var toast = document.getElementById('bc-toast');
      var toastText = document.getElementById('bc-toast-text');
      if (toast) {
        toastText.textContent = 'SENT TO CO-PLANNERS';
        toast.classList.add('is-show');
        setTimeout(function () { toast.classList.remove('is-show'); }, 1800);
      }
      input.value = '';
    });
  }
})();

/* ── Circular journey ring fills from 0 → target on view ────── */
(function () {
  var ring = document.querySelector('svg circle[stroke-dasharray]');
  if (!ring) return;
  var targetOffset = parseFloat(ring.getAttribute('stroke-dashoffset')) || 0;
  ring.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.2,.8,.2,1)';
  ring.setAttribute('stroke-dashoffset', '276.46'); // start empty
  if (!('IntersectionObserver' in window)) {
    ring.setAttribute('stroke-dashoffset', targetOffset);
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) {
      requestAnimationFrame(function () {
        ring.setAttribute('stroke-dashoffset', targetOffset);
      });
      io.disconnect();
    }
  }, { threshold: 0.4 });
  io.observe(ring);
})();
