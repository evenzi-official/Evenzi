/* ════════════════════════════════════════════════════════════════════
   Evenzi · Shared shell scripts
   Theme switcher, breadcrumb interactivity, tool-rail / nav-tab
   active-state resolution, scroll-progress, scroll-reveal.
   Active state is driven by body[data-page] / body[data-section]
   so it works the same when served as static .html (file or dev).
   ════════════════════════════════════════════════════════════════════ */

/* ── Theme switcher (default dark, persists) ───────── */
(function () {
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem('evenzi-theme'); } catch (e) {}
  if (stored === 'light') root.classList.remove('dark');
  else root.classList.add('dark');
  var btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', function () {
      root.classList.toggle('dark');
      try { localStorage.setItem('evenzi-theme', root.classList.contains('dark') ? 'dark' : 'light'); } catch (e) {}
    });
  }
})();

/* ── Breadcrumb interactivity (clock, ripple, copy, toast) ── */
(function () {
  var clock = document.getElementById('bc-clock');
  function pad(n){ return n < 10 ? '0'+n : ''+n; }
  function tickClock() {
    if (!clock) return;
    if (document.hidden) return;
    var d = new Date();
    var ist = new Date(d.getTime() + (d.getTimezoneOffset()*60000) + (5.5*3600000));
    var h = ist.getHours();
    var ampm = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    clock.textContent = h12 + ':' + pad(ist.getMinutes()) + ':' + pad(ist.getSeconds()) + ' ' + ampm + ' IST';
  }
  tickClock();
  setInterval(tickClock, 1000);
  document.addEventListener('visibilitychange', tickClock);

  function spawnRipple(host, e) {
    var rect = host.getBoundingClientRect();
    var x = (e.clientX || (rect.left + rect.width/2)) - rect.left;
    var y = (e.clientY || (rect.top + rect.height/2)) - rect.top;
    var r = document.createElement('span');
    r.className = 'bc-ripple';
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    r.style.width = r.style.height = Math.max(rect.width, rect.height) * 0.4 + 'px';
    host.appendChild(r);
    setTimeout(function(){ r.remove(); }, 600);
  }
  var rippleTargets = document.querySelectorAll('[data-bc-back],[data-bc-link],[data-bc-copy]');
  rippleTargets.forEach(function (el) {
    var prev = getComputedStyle(el).position;
    if (prev === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.addEventListener('click', function (e) { spawnRipple(el, e); });
  });

  var toast = document.getElementById('bc-toast');
  var toastText = document.getElementById('bc-toast-text');
  var toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toastText.textContent = msg;
    toast.classList.add('is-show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove('is-show'); }, 1800);
  }

  /* Back chip — demo toast (real route hop is the href) */
  var back = document.querySelector('[data-bc-back]');
  if (back) {
    back.addEventListener('click', function (e) {
      /* allow normal navigation; toast just confirms */
      showToast('RETURN: ' + (back.getAttribute('data-bc-back-label') || 'DASHBOARD'));
    });
  }

  var copyBtn = document.querySelector('[data-bc-copy]');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var path = copyBtn.getAttribute('data-bc-copy-path') || ('evenzi://' + (document.body.dataset.page || 'dashboard'));
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(path).then(function () {
          showToast('PATH COPIED');
        }).catch(function () {
          showToast('COPY FAILED');
        });
      } else {
        showToast('COPY UNSUPPORTED');
      }
    });
  }

  document.querySelectorAll('[data-bc-link]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      /* allow normal nav; toast confirms */
      showToast('NAVIGATE: ' + a.textContent.trim());
    });
  });
})();

/* ── Tool rail + Nav tab active-state ─────── */
(function () {
  var page = document.body.dataset.page || '';
  var section = document.body.dataset.section || '';

  /* Tool rail */
  var rail = document.querySelector('.tool-rail');
  if (rail) {
    var btns = Array.prototype.slice.call(rail.querySelectorAll('.tr-btn[data-page]'));
    btns.forEach(function (btn) {
      var p = btn.getAttribute('data-page');
      btn.classList.toggle('is-active', p === page);
      if (p === page) {
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
    });
  }

  /* Nav tabs (Dashboard / Website segmented) */
  var tabs = document.querySelectorAll('.floating-nav .nav-tab[data-section]');
  if (tabs.length) {
    tabs.forEach(function (tab) {
      var s = tab.getAttribute('data-section');
      var active = s === section;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      if (active) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
  }
})();

/* ── Notification dropdown — auto-injects panel for any bell button
       in the floating nav. One panel per page, anchored to the first
       bell encountered (covers all current page templates). ── */
(function () {
  var bells = document.querySelectorAll('.fn-icon-btn[aria-label^="Notifications"]');
  if (!bells.length) return;

  /* Helper: create an element with attrs + children. textContent only — no innerHTML. */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') node.className = attrs[k];
      else if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    }
    if (children) children.forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }
  function icon(name) {
    return el('span', { 'class': 'material-symbols-outlined', 'aria-hidden': 'true', text: name });
  }
  /* Build a notification list-item.
     parts: array of { strong, plain } objects to render the message
     (lets us bold the prefix without innerHTML). */
  function notifItem(opts) {
    var msg = el('p', { 'class': 'fn-notif-text' });
    opts.parts.forEach(function (p) {
      if (p.strong) msg.appendChild(el('strong', { text: p.strong }));
      if (p.plain)  msg.appendChild(document.createTextNode(p.plain));
    });
    var body = el('div', null, [msg, el('p', { 'class': 'fn-notif-time', text: opts.time })]);
    var iconWrap = el('span', { 'class': 'fn-notif-icon', 'aria-hidden': 'true' }, [icon(opts.icon)]);
    var unread = el('span', { 'class': 'fn-notif-unread', 'aria-label': 'Unread' });
    return el('li', { 'class': 'fn-notif-item' + (opts.unread ? ' is-unread' : '') }, [iconWrap, body, unread]);
  }

  /* Sample notifications */
  var sample = [
    { unread: true,  icon: 'how_to_reg',       parts: [{ strong: 'New RSVP' }, { plain: ' — Karthik & Ananya confirmed for the Reception.' }], time: '2 hours ago' },
    { unread: true,  icon: 'person_add',       parts: [{ strong: 'Co-planner added' }, { plain: ' — Riya joined Anya & Kabir’s Wedding.' }], time: 'Yesterday' },
    { unread: false, icon: 'payments',         parts: [{ strong: 'Payment recorded' }, { plain: ' — ₹50,000 advance to Heritage Palace.' }], time: 'Yesterday' },
    { unread: false, icon: 'check_circle',     parts: [{ strong: 'Vendor confirmed' }, { plain: ' — Mehendi locked for Dec 19 morning.' }], time: '3 days ago' },
    { unread: false, icon: 'forward_to_inbox', parts: [{ strong: 'Invites sent' }, { plain: ' — 156 WhatsApp delivered, 12 bounced.' }], time: '5 days ago' }
  ];

  var header = el('header', { 'class': 'fn-notif-header' }, [
    el('p',      { 'class': 'fn-notif-title', text: 'Notifications' }),
    el('button', { 'class': 'fn-notif-mark-all', type: 'button', text: 'Mark all read' })
  ]);
  var list = el('ul', { 'class': 'fn-notif-list' }, sample.map(notifItem));
  var viewAll = el('a', { 'class': 'fn-notif-view-all', href: '#' });
  viewAll.appendChild(document.createTextNode('View all notifications'));
  viewAll.appendChild(icon('arrow_forward'));
  var footer = el('footer', { 'class': 'fn-notif-footer' }, [viewAll]);

  var panel = el('div', { 'class': 'fn-notif-panel', role: 'dialog', 'aria-label': 'Notifications' }, [header, list, footer]);
  document.body.appendChild(panel);

  var openBell = null;
  function position() {
    if (!openBell) return;
    var rect = openBell.getBoundingClientRect();
    var panelW = panel.offsetWidth;
    var rightOffset = Math.max(12, window.innerWidth - rect.right);
    if (rightOffset + panelW > window.innerWidth - 12) rightOffset = 12;
    panel.style.top = (rect.bottom + 8) + 'px';
    panel.style.right = rightOffset + 'px';
  }
  function open(bell) {
    openBell = bell;
    bell.setAttribute('aria-expanded', 'true');
    position();
    panel.classList.add('is-open');
  }
  function close() {
    if (openBell) openBell.setAttribute('aria-expanded', 'false');
    openBell = null;
    panel.classList.remove('is-open');
  }

  bells.forEach(function (bell) {
    bell.setAttribute('aria-haspopup', 'true');
    bell.setAttribute('aria-expanded', 'false');
    bell.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (openBell === bell) close();
      else open(bell);
    });
  });

  document.addEventListener('click', function (e) {
    if (!openBell) return;
    if (panel.contains(e.target)) return;
    close();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  window.addEventListener('resize', position);
  /* Close on scroll — keeps the dropdown a focused, click-anchored UI */
  window.addEventListener('scroll', function () { if (openBell) close(); }, { passive: true });

  /* Mark-all-read */
  panel.addEventListener('click', function (e) {
    var btn = e.target.closest('.fn-notif-mark-all');
    if (!btn) return;
    panel.querySelectorAll('.fn-notif-item.is-unread').forEach(function (li) { li.classList.remove('is-unread'); });
    bells.forEach(function (b) { var dot = b.querySelector('.fn-dot'); if (dot) dot.style.display = 'none'; });
  });
})();

/* ── Scroll progress bar (top hairline) ───── */
(function () {
  var bar = document.getElementById('scroll-progress');
  if (!bar) return;
  var ticking = false;
  function update() {
    var doc = document.documentElement;
    var max = (doc.scrollHeight - doc.clientHeight) || 1;
    var pct = Math.min(100, Math.max(0, (doc.scrollTop / max) * 100));
    bar.style.setProperty('--scroll-pct', pct.toFixed(2) + '%');
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
})();

/* ── Count-up numbers: ticks 0 → data-count on viewport entry ── */
(function () {
  var nodes = document.querySelectorAll('[data-count]');
  if (!nodes.length) return;
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fmt(n, suffix){ return Math.round(n).toLocaleString() + (suffix || ''); }
  function animate(n) {
    var target = parseFloat(n.dataset.count || '0');
    var suffix = n.dataset.suffix || '';
    var dur = 1200, start = performance.now();
    function tick(t){
      var p = Math.min(1, (t - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      n.textContent = fmt(target * eased, suffix);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if (prefersReduced) {
    nodes.forEach(function (n) { n.textContent = fmt(parseFloat(n.dataset.count || '0'), n.dataset.suffix); });
    return;
  }
  var vh = window.innerHeight || document.documentElement.clientHeight;
  function inViewportNow(el){ var r = el.getBoundingClientRect(); return r.top < vh && r.bottom > 0; }
  if (!('IntersectionObserver' in window)) {
    nodes.forEach(function (n) { animate(n); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      animate(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.4 });
  nodes.forEach(function (n) {
    if (inViewportNow(n)) animate(n);
    else io.observe(n);
  });
})();

/* ── Bar-fill: animate .pf-bar[data-fill] width on viewport entry ── */
(function () {
  var bars = document.querySelectorAll('.pf-bar[data-fill]');
  if (!bars.length) return;
  function fill(b){ b.style.width = (parseFloat(b.dataset.fill || '0')) + '%'; }
  var vh = window.innerHeight || document.documentElement.clientHeight;
  function inViewportNow(el){ var r = el.getBoundingClientRect(); return r.top < vh && r.bottom > 0; }
  if (!('IntersectionObserver' in window)) {
    bars.forEach(fill);
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      fill(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.4 });
  bars.forEach(function (b) {
    if (inViewportNow(b)) fill(b);
    else io.observe(b);
  });
})();

/* ── Scroll-reveal: fade + slide on viewport entry ── */
(function () {
  var els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    els.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  /* Synchronous in-viewport check on observe — kills the initial-paint flash
     for elements that are already visible at scroll = 0 (breadcrumb, page header). */
  var vh = window.innerHeight || document.documentElement.clientHeight;
  function inViewportNow(el) {
    var r = el.getBoundingClientRect();
    return r.top < vh && r.bottom > 0;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(function (el) {
    if (inViewportNow(el)) {
      el.classList.add('in');
    } else {
      io.observe(el);
    }
  });
})();
