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
  if (clock) {
    tickClock();
    setInterval(tickClock, 1000);
    document.addEventListener('visibilitychange', tickClock);
  }

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
  /* Expose toast helper for page-specific scripts (auth.js, settings.js, etc.) */
  window.evenzi = window.evenzi || {};
  window.evenzi.showToast = showToast;

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

/* ── Password show/hide toggle ─────────────────────
   <div class="form-password">
     <input type="password" class="form-input">
     <button class="form-password-toggle" data-pw-toggle>
       <span class="material-symbols-outlined">visibility</span>
     </button>
   </div>
   data-pw-toggle="<input-id>" also supported. With no value the
   button targets the previous-sibling .form-input within the
   same .form-password wrapper.
*/
(function () {
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-pw-toggle]');
    if (!btn) return;
    var targetId = btn.getAttribute('data-pw-toggle');
    var input = targetId
      ? document.getElementById(targetId)
      : btn.parentElement && btn.parentElement.querySelector('input.form-input');
    if (!input) return;
    var hidden = input.type === 'password';
    input.type = hidden ? 'text' : 'password';
    var icon = btn.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = hidden ? 'visibility_off' : 'visibility';
    btn.setAttribute('aria-label', hidden ? 'Hide password' : 'Show password');
  });
})();

/* ── Toggle switch (role="switch") ──────────────────
   <button class="toggle-switch" role="switch" aria-checked="false">
     <span class="toggle-switch-thumb"></span>
   </button>
   Click + Space/Enter both flip aria-checked. Space.preventDefault()
   stops the page from scrolling when the switch is below the fold.
*/
(function () {
  function toggle(btn) {
    var on = btn.getAttribute('aria-checked') === 'true';
    btn.setAttribute('aria-checked', on ? 'false' : 'true');
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[role="switch"].toggle-switch');
    if (!btn || btn.disabled || btn.getAttribute('aria-disabled') === 'true') return;
    toggle(btn);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== ' ' && e.key !== 'Enter' && e.key !== 'Spacebar') return;
    var btn = e.target.closest && e.target.closest('[role="switch"].toggle-switch');
    if (!btn || btn.disabled || btn.getAttribute('aria-disabled') === 'true') return;
    e.preventDefault();
    toggle(btn);
  });
})();

/* ── Radio pill group ──────────────────────────────
   <div class="radio-pill-group" role="radiogroup">
     <button role="radio" aria-checked="true" class="radio-pill is-checked"…>
     <button role="radio" aria-checked="false" class="radio-pill"…>
   </div>
   Click toggles aria-checked + .is-checked across the group.
*/
(function () {
  function isDisabled(el){
    return el.disabled || el.getAttribute('aria-disabled') === 'true';
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.radio-pill[role="radio"]');
    if (!btn) return;
    if (isDisabled(btn)) return; /* disabled pills opt-out of selection — page-level handler can still toast */
    var group = btn.closest('.radio-pill-group');
    if (!group) return;
    group.querySelectorAll('.radio-pill[role="radio"]').forEach(function (p) {
      p.setAttribute('aria-checked', 'false');
      p.classList.remove('is-checked');
    });
    btn.setAttribute('aria-checked', 'true');
    btn.classList.add('is-checked');
  });
  document.addEventListener('keydown', function (e) {
    var btn = e.target.closest && e.target.closest('.radio-pill[role="radio"]');
    if (!btn) return;
    var group = btn.closest('.radio-pill-group');
    if (!group) return;
    var pills = Array.prototype.slice.call(group.querySelectorAll('.radio-pill[role="radio"]'));
    var idx = pills.indexOf(btn);
    var next = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      do { idx = (idx + 1) % pills.length; next = pills[idx]; } while (isDisabled(next) && next !== btn);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      do { idx = (idx - 1 + pills.length) % pills.length; next = pills[idx]; } while (isDisabled(next) && next !== btn);
    }
    if (!next || next === btn) return;
    e.preventDefault();
    next.focus();
    next.click();
  });
})();

/* ── Date / time picker trigger ────────────────────
   <button class="form-input form-input-trigger" data-date-trigger>
     <span class="form-input-trigger-value">Sat · 22 Dec 2025</span>
     <span class="material-symbols-outlined">calendar_month</span>
   </button>
   <input type="date" class="sr-only" tabindex="-1" aria-hidden="true">
   The hidden native input must be the trigger's immediate next sibling.
   data-time-trigger uses 12-hour AM/PM rendering.
*/
(function () {
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function fmtDate(iso) {
    if (!iso) return '';
    var parts = iso.split('-');
    if (parts.length !== 3) return iso;
    var d = new Date(parts[0], parseInt(parts[1], 10) - 1, parts[2]);
    if (isNaN(d.getTime())) return iso;
    return DAYS[d.getDay()] + ' · ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }
  function fmtTime(value) {
    if (!value) return '';
    var hm = value.split(':');
    if (hm.length < 2) return value;
    var h = parseInt(hm[0], 10);
    var m = hm[1];
    var ampm = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return h12 + ':' + m + ' ' + ampm;
  }

  /* ── Custom Evenzi calendar (replaces the native date picker) ──────
     Singleton popover/sheet. The hidden <input type="date"> stays the
     value store; we write YYYY-MM-DD + dispatch 'change' so all existing
     formatting/state logic is untouched. Native picker is the fallback. */
  var DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function toISO(y, m, d) { return y + '-' + pad2(m + 1) + '-' + pad2(d); }
  function parseISO(s) {
    if (!s) return null;
    var p = s.split('-');
    if (p.length !== 3) return null;
    var y = +p[0], m = +p[1] - 1, d = +p[2];
    var dt = new Date(y, m, d);
    return isNaN(dt.getTime()) ? null : { y: y, m: m, d: d };
  }
  var cal = (function () {
    var scrim, pop, titleEl, titleBtn, prevBtn, nextBtn, dowRow, gridEl, anchorBtn, input;
    var viewY, viewM, selISO, minISO, maxISO, lastFocused, mode;

    function build() {
      scrim = document.createElement('div');
      scrim.className = 'cal-scrim';
      pop = document.createElement('div');
      pop.className = 'cal-pop';
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-modal', 'true');
      pop.setAttribute('aria-label', 'Choose a date');

      var head = document.createElement('div');
      head.className = 'cal-head';
      prevBtn = navBtn('chevron_left', 'Previous month', -1);
      titleBtn = document.createElement('button');
      titleBtn.type = 'button';
      titleBtn.className = 'cal-title-btn';
      titleBtn.setAttribute('aria-label', 'Switch to month and year selection');
      titleBtn.setAttribute('aria-expanded', 'false');
      titleEl = document.createElement('span');
      titleEl.className = 'cal-title';
      titleEl.setAttribute('aria-live', 'polite');
      var caret = document.createElement('span');
      caret.className = 'material-symbols-outlined cal-title-caret';
      caret.setAttribute('aria-hidden', 'true');
      caret.textContent = 'expand_more';
      titleBtn.appendChild(titleEl);
      titleBtn.appendChild(caret);
      titleBtn.addEventListener('click', function () {
        setMode(mode === 'days' ? 'months' : 'days');
      });
      nextBtn = navBtn('chevron_right', 'Next month', 1);
      head.appendChild(prevBtn); head.appendChild(titleBtn); head.appendChild(nextBtn);

      dowRow = document.createElement('div');
      dowRow.className = 'cal-dow-row';
      DOW.forEach(function (d) {
        var c = document.createElement('span');
        c.className = 'cal-dow'; c.textContent = d;
        c.setAttribute('aria-hidden', 'true');
        dowRow.appendChild(c);
      });

      gridEl = document.createElement('div');
      gridEl.className = 'cal-grid';
      gridEl.setAttribute('role', 'grid');

      pop.appendChild(head);
      pop.appendChild(dowRow);
      pop.appendChild(gridEl);
      scrim.appendChild(pop);
      document.body.appendChild(scrim);

      scrim.addEventListener('click', function (e) {
        if (e.target === scrim) close();
      });
      /* Capture keydown so Esc/arrows act on the calendar, not a modal
         underneath it (modal listeners are bubble-phase on document). */
      scrim.addEventListener('keydown', onKey, true);
    }
    function navBtn(icon, label, delta) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'cal-nav';
      b.setAttribute('aria-label', label);
      var i = document.createElement('span');
      i.className = 'material-symbols-outlined';
      i.setAttribute('aria-hidden', 'true');
      i.textContent = icon;
      b.appendChild(i);
      b.addEventListener('click', function () { shift(delta); });
      return b;
    }
    function inRange(iso) {
      if (minISO && iso < minISO) return false;
      if (maxISO && iso > maxISO) return false;
      return true;
    }
    var MONTHS_FULL = ['January','February','March','April','May','June','July',
      'August','September','October','November','December'];
    var MONTHS_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    function setMode(m) {
      mode = m;
      if (titleBtn) titleBtn.setAttribute('aria-expanded', m === 'months' ? 'true' : 'false');
      render();
      if (pendingFocus) pendingFocus.focus();
    }
    function renderMonths() {
      dowRow.style.display = 'none';
      gridEl.classList.add('cal-grid--months');
      titleEl.textContent = String(viewY);
      if (prevBtn) prevBtn.setAttribute('aria-label', 'Previous year');
      if (nextBtn) nextBtn.setAttribute('aria-label', 'Next year');
      while (gridEl.firstChild) gridEl.removeChild(gridEl.firstChild);
      var t = new Date(), tY = t.getFullYear(), tM = t.getMonth();
      var selP = selISO ? parseISO(selISO) : null;
      var focusTarget = null;
      for (var m = 0; m < 12; m++) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'cal-month';
        b.textContent = MONTHS_ABBR[m];
        b.setAttribute('data-m', m);
        b.setAttribute('aria-label', MONTHS_FULL[m] + ' ' + viewY);
        if (viewY === tY && m === tM) b.classList.add('is-current');
        if (selP && selP.y === viewY && selP.m === m) {
          b.classList.add('is-sel');
          b.setAttribute('aria-selected', 'true');
        }
        (function (mm) {
          b.addEventListener('click', function () { viewM = mm; setMode('days'); });
        })(m);
        gridEl.appendChild(b);
        if (!focusTarget && b.classList.contains('is-sel')) focusTarget = b;
        if (!focusTarget && !selP && b.classList.contains('is-current')) focusTarget = b;
      }
      if (!focusTarget) focusTarget = gridEl.querySelector('.cal-month');
      pendingFocus = focusTarget;
    }
    function render() {
      if (mode === 'months') { renderMonths(); return; }
      var months = MONTHS_FULL;
      dowRow.style.display = '';
      gridEl.classList.remove('cal-grid--months');
      if (prevBtn) prevBtn.setAttribute('aria-label', 'Previous month');
      if (nextBtn) nextBtn.setAttribute('aria-label', 'Next month');
      titleEl.textContent = months[viewM] + ' ' + viewY;
      while (gridEl.firstChild) gridEl.removeChild(gridEl.firstChild);
      var first = new Date(viewY, viewM, 1);
      var startCol = (first.getDay() + 6) % 7; /* Monday-first */
      var daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
      var prevDays = new Date(viewY, viewM, 0).getDate();
      var today = new Date();
      var todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());
      var cells = 42, focusTarget = null;
      for (var i = 0; i < cells; i++) {
        var dayNum, oy = viewY, om = viewM, outside = false;
        if (i < startCol) { dayNum = prevDays - startCol + 1 + i; om = viewM - 1; outside = true; }
        else if (i >= startCol + daysInMonth) { dayNum = i - startCol - daysInMonth + 1; om = viewM + 1; outside = true; }
        else { dayNum = i - startCol + 1; }
        if (om < 0) { om = 11; oy = viewY - 1; }
        if (om > 11) { om = 0; oy = viewY + 1; }
        var iso = toISO(oy, om, dayNum);
        var btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'cal-day';
        btn.textContent = dayNum;
        btn.setAttribute('role', 'gridcell');
        btn.setAttribute('data-iso', iso);
        if (outside) btn.classList.add('is-outside');
        if (iso === todayISO) btn.classList.add('is-today');
        if (iso === selISO) {
          btn.classList.add('is-selected');
          btn.setAttribute('aria-selected', 'true');
        }
        if (!inRange(iso)) { btn.disabled = true; }
        btn.setAttribute('aria-label', new Date(oy, om, dayNum)
          .toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' }));
        btn.addEventListener('click', function () {
          if (this.disabled) return;
          choose(this.getAttribute('data-iso'));
        });
        gridEl.appendChild(btn);
        if (!focusTarget && !btn.disabled && (iso === selISO)) focusTarget = btn;
        if (!focusTarget && !outside && iso === todayISO && !selISO) focusTarget = btn;
      }
      if (!focusTarget) {
        focusTarget = gridEl.querySelector('.cal-day:not(.is-outside):not(:disabled)');
      }
      pendingFocus = focusTarget;
    }
    var pendingFocus = null;
    function shift(delta) {
      if (mode === 'months') {
        viewY += delta;
        render();
        if (pendingFocus) pendingFocus.focus();
        return;
      }
      viewM += delta;
      if (viewM < 0) { viewM = 11; viewY--; }
      if (viewM > 11) { viewM = 0; viewY++; }
      render();
      if (pendingFocus) pendingFocus.focus();
    }
    function moveMonthFocus(delta) {
      var cur = document.activeElement;
      if (!cur || !cur.classList.contains('cal-month')) return;
      var idx = parseInt(cur.getAttribute('data-m'), 10) + delta;
      if (idx < 0) idx = 0;
      if (idx > 11) idx = 11;
      var tgt = gridEl.querySelector('.cal-month[data-m="' + idx + '"]');
      if (tgt) tgt.focus();
    }
    function moveFocus(days) {
      var cur = document.activeElement;
      if (!cur || !cur.classList.contains('cal-day')) return;
      var iso = cur.getAttribute('data-iso');
      var p = parseISO(iso);
      var nd = new Date(p.y, p.m, p.d + days);
      var nISO = toISO(nd.getFullYear(), nd.getMonth(), nd.getDate());
      if ((nd.getMonth() !== viewM) || (nd.getFullYear() !== viewY)) {
        viewY = nd.getFullYear(); viewM = nd.getMonth(); render();
      }
      var tgt = gridEl.querySelector('.cal-day[data-iso="' + nISO + '"]');
      if (tgt) tgt.focus();
    }
    function onKey(e) {
      if (mode === 'months') {
        if (e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); setMode('days'); return; }
        if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopImmediatePropagation(); moveMonthFocus(-1); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); e.stopImmediatePropagation(); moveMonthFocus(1); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); e.stopImmediatePropagation(); moveMonthFocus(-3); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); e.stopImmediatePropagation(); moveMonthFocus(3); return; }
        if (e.key === 'PageUp') { e.preventDefault(); e.stopImmediatePropagation(); shift(-1); return; }
        if (e.key === 'PageDown') { e.preventDefault(); e.stopImmediatePropagation(); shift(1); return; }
        if (e.key === 'Tab') {
          e.stopImmediatePropagation();
          var fm = pop.querySelectorAll('button:not(:disabled)');
          if (!fm.length) return;
          var fmFirst = fm[0], fmLast = fm[fm.length - 1];
          if (e.shiftKey && document.activeElement === fmFirst) { e.preventDefault(); fmLast.focus(); }
          else if (!e.shiftKey && document.activeElement === fmLast) { e.preventDefault(); fmFirst.focus(); }
          return;
        }
        return; /* Enter/Space on a .cal-month → native button click fires */
      }
      if (e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); close(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopImmediatePropagation(); moveFocus(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); e.stopImmediatePropagation(); moveFocus(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopImmediatePropagation(); moveFocus(-7); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); e.stopImmediatePropagation(); moveFocus(7); }
      else if (e.key === 'PageUp') { e.preventDefault(); e.stopImmediatePropagation(); shift(-1); }
      else if (e.key === 'PageDown') { e.preventDefault(); e.stopImmediatePropagation(); shift(1); }
      else if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        var a = document.activeElement;
        if (a && a.classList.contains('cal-day') && !a.disabled) {
          e.preventDefault(); e.stopImmediatePropagation();
          choose(a.getAttribute('data-iso'));
        }
      } else if (e.key === 'Tab') {
        /* Keep focus within the popover. */
        e.stopImmediatePropagation();
        var f = pop.querySelectorAll('button:not(:disabled)');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    function choose(iso) {
      if (!inRange(iso)) return;
      input.value = iso;
      input.dispatchEvent(new Event('change', { bubbles: false }));
      close();
    }
    function position() {
      if (window.matchMedia('(max-width:767px)').matches) {
        pop.style.position = ''; pop.style.top = ''; pop.style.left = '';
        return; /* CSS handles the bottom-sheet */
      }
      pop.style.position = 'fixed';
      var r = anchorBtn.getBoundingClientRect();
      var pw = 320, ph = pop.offsetHeight || 340;
      var left = Math.min(r.left, window.innerWidth - pw - 12);
      left = Math.max(12, left);
      var top = r.bottom + 8;
      if (top + ph > window.innerHeight - 12) {
        top = Math.max(12, r.top - ph - 8);
      }
      pop.style.left = left + 'px';
      pop.style.top = top + 'px';
    }
    function open(inp, btn) {
      if (!scrim) build();
      input = inp; anchorBtn = btn;
      lastFocused = document.activeElement;
      var sel = parseISO(input.value);
      selISO = sel ? input.value : null;
      minISO = input.getAttribute('min') || (input.min || '') || null;
      maxISO = input.getAttribute('max') || (input.max || '') || null;
      var base = sel || (function () {
        var t = new Date(); return { y: t.getFullYear(), m: t.getMonth() };
      })();
      viewY = base.y; viewM = base.m;
      mode = 'days';
      if (titleBtn) titleBtn.setAttribute('aria-expanded', 'false');
      render();
      scrim.classList.add('is-open');
      document.body.classList.add('no-scroll');
      position();
      requestAnimationFrame(function () {
        if (pendingFocus) pendingFocus.focus();
      });
    }
    function close() {
      if (!scrim) return;
      scrim.classList.remove('is-open');
      if (!document.querySelector('.modal-scrim.is-open')) {
        document.body.classList.remove('no-scroll');
      }
      if (lastFocused && lastFocused.focus) {
        try { lastFocused.focus(); } catch (_) {}
      }
    }
    window.addEventListener('resize', function () {
      if (scrim && scrim.classList.contains('is-open')) position();
    });
    return { open: open };
  })();

  function nativeOpen(input) {
    if (typeof input.showPicker === 'function') {
      try { input.showPicker(); return; } catch (_) {}
    }
    input.focus();
    input.click();
  }
  function openDateCalendar(input, btn) {
    if (btn.hasAttribute('data-native-date')) { nativeOpen(input); return; }
    try { cal.open(input, btn); }
    catch (e) { nativeOpen(input); }
  }

  /* ── Custom Evenzi time picker (replaces native time input) ────────
     Hour (1-12) + minute (00-59) scroll columns + AM/PM. The hidden
     <input type="time"> stays the value store (24h "HH:MM"). */
  var tp = (function () {
    var scrim, pop, hCol, mCol, amBtn, pmBtn, tpReadout, anchorBtn, input;
    var h12, mm, ap, lastFocused;

    function build() {
      scrim = document.createElement('div');
      scrim.className = 'tp-scrim';
      pop = document.createElement('div');
      pop.className = 'tp-pop';
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-modal', 'true');
      pop.setAttribute('aria-label', 'Choose a time');

      var title = document.createElement('p');
      title.className = 'tp-title';
      var titleLabel = document.createElement('span');
      titleLabel.textContent = 'Select time';
      tpReadout = document.createElement('span');
      tpReadout.className = 'tp-readout';
      tpReadout.setAttribute('aria-live', 'polite');
      title.appendChild(titleLabel);
      title.appendChild(tpReadout);

      var cols = document.createElement('div');
      cols.className = 'tp-cols';
      hCol = mkCol('Hour', 'h');
      mCol = mkCol('Min', 'm');
      var amWrap = document.createElement('div');
      amWrap.className = 'tp-ampm';
      var cap = document.createElement('div');
      cap.className = 'tp-ampm-cap'; cap.textContent = 'AM/PM';
      amBtn = mkAmpm('AM');
      pmBtn = mkAmpm('PM');
      amWrap.appendChild(cap); amWrap.appendChild(amBtn); amWrap.appendChild(pmBtn);
      cols.appendChild(hCol.col); cols.appendChild(mCol.col); cols.appendChild(amWrap);

      var actions = document.createElement('div');
      actions.className = 'tp-actions';
      var cancel = document.createElement('button');
      cancel.type = 'button'; cancel.className = 'btn-pill btn-pill-secondary';
      cancel.textContent = 'Cancel';
      cancel.addEventListener('click', close);
      var setb = document.createElement('button');
      setb.type = 'button'; setb.className = 'btn-pill btn-pill-primary';
      setb.textContent = 'Set';
      setb.addEventListener('click', apply);
      actions.appendChild(cancel); actions.appendChild(setb);

      pop.appendChild(title);
      pop.appendChild(cols);
      pop.appendChild(actions);
      scrim.appendChild(pop);
      document.body.appendChild(scrim);

      scrim.addEventListener('click', function (e) { if (e.target === scrim) close(); });
      scrim.addEventListener('keydown', onKey, true);
    }
    function mkCol(capText, kind) {
      var col = document.createElement('div');
      col.className = 'tp-col';
      var cap = document.createElement('div');
      cap.className = 'tp-col-cap'; cap.textContent = capText;
      var scroll = document.createElement('div');
      scroll.className = 'tp-scroll';
      scroll.setAttribute('role', 'listbox');
      scroll.setAttribute('aria-label', capText);
      var max = kind === 'h' ? 12 : 60, start = kind === 'h' ? 1 : 0;
      for (var v = start; v < start + max; v++) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'tp-opt';
        b.setAttribute('role', 'option');
        b.setAttribute('data-val', v);
        b.textContent = kind === 'h' ? v : pad2(v);
        (function (val) {
          b.addEventListener('click', function () {
            if (kind === 'h') h12 = val; else mm = val;
            mark();
          });
        })(v);
        scroll.appendChild(b);
      }
      col.appendChild(cap); col.appendChild(scroll);
      return { col: col, scroll: scroll };
    }
    function mkAmpm(val) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'tp-ampm-btn';
      b.textContent = val;
      b.addEventListener('click', function () { ap = val; mark(); });
      return b;
    }
    function markCol(c, val) {
      var opts = c.scroll.querySelectorAll('.tp-opt');
      opts.forEach(function (o) {
        var on = +o.getAttribute('data-val') === val;
        o.classList.toggle('is-sel', on);
        o.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) {
          /* Centre within the scroll container only — never scroll the
             page/ancestor (scrollIntoView could on some WebViews). */
          var or = o.getBoundingClientRect(), sr = c.scroll.getBoundingClientRect();
          c.scroll.scrollTop += (or.top - sr.top) - (sr.height / 2) + (or.height / 2);
        }
      });
    }
    function mark() {
      markCol(hCol, h12);
      markCol(mCol, mm);
      amBtn.classList.toggle('is-sel', ap === 'AM');
      pmBtn.classList.toggle('is-sel', ap === 'PM');
      if (tpReadout) tpReadout.textContent = h12 + ':' + pad2(mm) + ' ' + ap;
    }
    function apply() {
      var h24 = (h12 % 12) + (ap === 'PM' ? 12 : 0);
      input.value = pad2(h24) + ':' + pad2(mm);
      input.dispatchEvent(new Event('change', { bubbles: false }));
      close();
    }
    function moveSel(col, getv, setv, lo, hi) {
      return function (dir) {
        var v = getv();
        v += dir;
        if (v < lo) v = hi;
        if (v > hi) v = lo;
        setv(v); mark();
      };
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); close(); return; }
      if (e.key === 'Enter') {
        if (document.activeElement && document.activeElement.classList.contains('tp-opt')) return;
        e.stopImmediatePropagation(); e.preventDefault(); apply(); return;
      }
      if (e.key === 'Tab') {
        e.stopImmediatePropagation();
        var f = pop.querySelectorAll('button');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    function position() {
      if (window.matchMedia('(max-width:767px)').matches) {
        pop.style.position = ''; pop.style.top = ''; pop.style.left = '';
        return;
      }
      pop.style.position = 'fixed';
      var r = anchorBtn.getBoundingClientRect();
      var pw = 320, ph = pop.offsetHeight || 320;
      var left = Math.max(12, Math.min(r.left, window.innerWidth - pw - 12));
      var top = r.bottom + 8;
      if (top + ph > window.innerHeight - 12) top = Math.max(12, r.top - ph - 8);
      pop.style.left = left + 'px';
      pop.style.top = top + 'px';
    }
    function open(inp, btn) {
      if (!scrim) build();
      input = inp; anchorBtn = btn;
      lastFocused = document.activeElement;
      var v = (input.value || '').split(':');
      if (v.length === 2) {
        var h = parseInt(v[0], 10), m = parseInt(v[1], 10);
        ap = h >= 12 ? 'PM' : 'AM';
        h12 = h % 12 || 12;
        mm = isNaN(m) ? 0 : m;
      } else {
        var now = new Date();
        var hh = now.getHours();
        ap = hh >= 12 ? 'PM' : 'AM';
        h12 = hh % 12 || 12;
        mm = now.getMinutes();
      }
      mark();
      scrim.classList.add('is-open');
      document.body.classList.add('no-scroll');
      position();
      requestAnimationFrame(function () {
        var sel = hCol.scroll.querySelector('.tp-opt.is-sel');
        if (sel) sel.focus();
        mark();
      });
    }
    function close() {
      if (!scrim) return;
      scrim.classList.remove('is-open');
      if (!document.querySelector('.modal-scrim.is-open')) {
        document.body.classList.remove('no-scroll');
      }
      if (lastFocused && lastFocused.focus) { try { lastFocused.focus(); } catch (_) {} }
    }
    window.addEventListener('resize', function () {
      if (scrim && scrim.classList.contains('is-open')) position();
    });
    return { open: open };
  })();

  function openTimePicker(input, btn) {
    if (btn.hasAttribute('data-native-time')) { nativeOpen(input); return; }
    try { tp.open(input, btn); }
    catch (e) { nativeOpen(input); }
  }

  function wire(triggerSel, fmt, opener) {
    var triggers = document.querySelectorAll(triggerSel);
    triggers.forEach(function (btn) {
      var input = btn.nextElementSibling;
      if (!input || (input.type !== 'date' && input.type !== 'time')) return;
      var label = btn.querySelector('.form-input-trigger-value');

      /* Future-only date inputs (event/ceremony dates): floor at today so
         past days render disabled in the custom calendar. */
      if (btn.hasAttribute('data-min-today') && input.type === 'date' && !input.getAttribute('min')) {
        var _t = new Date();
        input.setAttribute('min', _t.getFullYear() + '-' + pad2(_t.getMonth() + 1) + '-' + pad2(_t.getDate()));
      }

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (opener) { opener(input, btn); return; }
        nativeOpen(input);
      });
      input.addEventListener('change', function () {
        if (label) label.textContent = fmt(input.value);
      });
      if (input.value && label && !label.textContent.trim()) {
        label.textContent = fmt(input.value);
      }
    });
  }

  wire('[data-date-trigger]', fmtDate, openDateCalendar);
  wire('[data-time-trigger]', fmtTime, openTimePicker);
})();

/* ── PIN / OTP input ─────────────────────────────
   <div class="pin-input" data-len="6" role="group" aria-label="6-digit code">
     <input class="pin-input-cell" maxlength="1" inputmode="numeric"
            autocomplete="one-time-code"> ×N
   </div>
   Auto-advance on input, backspace falls back to previous cell,
   paste distributes across cells, ArrowLeft/Right navigate.
*/
(function () {
  var groups = document.querySelectorAll('.pin-input');
  if (!groups.length) return;

  groups.forEach(function (group) {
    var cells = Array.prototype.slice.call(group.querySelectorAll('.pin-input-cell'));
    if (!cells.length) return;

    cells.forEach(function (cell, idx) {
      cell.addEventListener('input', function (e) {
        var digits = (cell.value || '').replace(/\D/g, '');
        if (digits.length <= 1) {
          /* Normal typing — keep single digit, auto-advance */
          cell.value = digits;
          if (digits && idx < cells.length - 1) cells[idx + 1].focus();
          return;
        }
        /* Multi-digit input — likely iOS SMS auto-fill ("123456" into cell 0).
           Distribute across cells starting from this index. */
        cell.value = digits[0];
        for (var i = 1; i < cells.length - idx && i < digits.length; i++) {
          cells[idx + i].value = digits[i];
        }
        var next = Math.min(idx + digits.length, cells.length - 1);
        cells[next].focus();
      });
      cell.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !cell.value && idx > 0) {
          cells[idx - 1].focus();
        } else if (e.key === 'ArrowLeft' && idx > 0) {
          e.preventDefault(); cells[idx - 1].focus();
        } else if (e.key === 'ArrowRight' && idx < cells.length - 1) {
          e.preventDefault(); cells[idx + 1].focus();
        }
      });
      cell.addEventListener('paste', function (e) {
        var text = (e.clipboardData || window.clipboardData).getData('text');
        if (!text) return;
        e.preventDefault();
        var digits = text.replace(/\D/g, '').split('');
        for (var i = 0; i < cells.length - idx && i < digits.length; i++) {
          cells[idx + i].value = digits[i];
        }
        var next = Math.min(idx + digits.length, cells.length - 1);
        cells[next].focus();
      });
    });
  });
})();

/* ── Modal / bottom-sheet ─────────────────────────
   <button data-modal-target="#m1">Open</button>
   <div id="m1" class="modal-scrim" data-modal>
     <div class="modal-card lg-glass-card" role="dialog" aria-modal="true">…</div>
   </div>
   Open via .is-open class. Esc, scrim click, [data-modal-close] all close.
   Body scroll locked while any modal is open. Focus is trapped inside the
   card while open and restored to the trigger on close.
   Static showcase modals (.modal-static) are excluded — they're inline demos.
*/
/*
  STACKING-SAFE modal controller.
  - openStack[]      tracks open modals in open order (last = top-most).
  - focusReturnMap[] pairs each open modal with the element to refocus on close,
    so out-of-order closes still restore focus correctly.
  - z-index is assigned dynamically per open depth (base 80, +10 each level).
  - Esc / Tab-trap always operate on the TOP modal only.
  - openModal/closeModal accept an element OR an id string ("#id" or "id"),
    and are exposed on window.evenzi for page scripts (no per-page re-impl).
*/
(function () {
  var FOCUSABLE = 'button, a[href], [tabindex]:not([tabindex="-1"]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])';
  var MODAL_Z_BASE = 80;
  var openStack = [];        /* modal elements, open order */
  var focusReturnMap = [];   /* [{modal, target}] */

  function resolve(modalOrId) {
    if (!modalOrId) return null;
    if (typeof modalOrId === 'string') {
      return document.getElementById(modalOrId.replace(/^#/, '')) ||
             document.querySelector(modalOrId);
    }
    return modalOrId;
  }

  function getFocusable(card) {
    return Array.prototype.slice.call(card.querySelectorAll(FOCUSABLE))
      .filter(function (el) { return !el.hasAttribute('disabled') && el.offsetParent !== null; });
  }

  function trapTab(e, modal) {
    if (e.key !== 'Tab') return;
    var card = modal.querySelector('.modal-card');
    if (!card) return;
    var focusables = getFocusable(card);
    if (!focusables.length) {
      e.preventDefault();
      card.focus();
      return;
    }
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function topModal() {
    return openStack.length ? openStack[openStack.length - 1] : null;
  }

  function openModal(modalOrId) {
    var modal = resolve(modalOrId);
    if (!modal || modal.classList.contains('modal-static')) return;
    if (modal.classList.contains('is-open')) return;          /* already open */
    focusReturnMap.push({ modal: modal, target: document.activeElement });
    openStack.push(modal);
    modal.style.zIndex = String(MODAL_Z_BASE + openStack.length * 10);
    modal.classList.add('is-open');
    modal.removeAttribute('aria-hidden');
    document.body.classList.add('no-scroll');
    var card = modal.querySelector('.modal-card');
    if (card) {
      if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '-1');
      /* Force a synchronous style+layout flush so the just-applied
         `.is-open` visibility:visible is committed before .focus()
         (a .focus() on a still-`visibility:hidden` element is a silent
         no-op). Reading offsetHeight triggers the reflow. */
      void modal.offsetHeight;
      var focusables = getFocusable(card);
      (focusables[0] || card).focus();
      /* Belt-and-suspenders: if the sync focus didn't take (rare timing
         on some engines), retry once after the next frame. */
      if (!modal.contains(document.activeElement)) {
        requestAnimationFrame(function () {
          if (!modal.classList.contains('is-open')) return;
          var f = getFocusable(card);
          (f[0] || card).focus();
        });
      }
    }
  }

  function closeModal(modalOrId) {
    var modal = resolve(modalOrId);
    if (!modal || modal.classList.contains('modal-static')) return;
    if (!modal.classList.contains('is-open')) return;
    /* Blur any focused element still inside the modal before it hides,
       so focus doesn't get stranded on an invisible control. */
    if (modal.contains(document.activeElement) &&
        typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    modal.style.zIndex = '';
    var si = openStack.indexOf(modal);
    if (si !== -1) openStack.splice(si, 1);
    if (!openStack.length) document.body.classList.remove('no-scroll');
    /* Restore focus to whatever was focused when THIS modal opened */
    for (var i = focusReturnMap.length - 1; i >= 0; i--) {
      if (focusReturnMap[i].modal === modal) {
        var target = focusReturnMap[i].target;
        focusReturnMap.splice(i, 1);
        if (target && typeof target.focus === 'function' &&
            document.contains(target)) {
          try { target.focus(); } catch (_) {}
        }
        break;
      }
    }
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-modal-target]');
    if (trigger) {
      e.preventDefault();
      openModal(trigger.getAttribute('data-modal-target'));
      return;
    }
    var closer = e.target.closest('[data-modal-close]');
    if (closer) {
      closeModal(closer.closest('.modal-scrim'));
      return;
    }
    /* scrim click (only on the scrim itself, not its children) — top modal only */
    if (e.target.classList && e.target.classList.contains('modal-scrim') && !e.target.classList.contains('modal-static')) {
      if (e.target === topModal()) closeModal(e.target);
    }
  });

  document.addEventListener('keydown', function (e) {
    var open = topModal();
    if (!open) return;
    if (e.key === 'Escape') {
      closeModal(open);
    } else if (e.key === 'Tab') {
      trapTab(e, open);
    }
  });

  /* Expose for page scripts — no per-page re-implementation. */
  window.evenzi = window.evenzi || {};
  window.evenzi.openModal = openModal;
  window.evenzi.closeModal = closeModal;
})();

/* ── Avatar file-input change handler ──────────────
   <div class="avatar-edit">
     <span class="avatar-edit-img">A</span>
     <input type="file" class="avatar-edit-input" id="avatar-upload" accept="image/*">
     <label for="avatar-upload" class="avatar-edit-btn" aria-label="Change avatar">
       <span class="material-symbols-outlined">photo_camera</span>
     </label>
   </div>
   On file pick: announce via toast. Enforces 5 MB cap with #avatar-error fallback.
*/
(function () {
  document.addEventListener('change', function (e) {
    var input = e.target.closest && e.target.closest('.avatar-edit-input');
    if (!input || !input.files || !input.files[0]) return;
    var file = input.files[0];
    var sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    var errEl = document.getElementById('avatar-error');
    if (file.size > 5 * 1024 * 1024) {
      if (errEl) { errEl.hidden = false; errEl.textContent = 'Photo is ' + sizeMb + ' MB — max 5 MB.'; }
      input.value = '';
      return;
    }
    if (errEl) errEl.hidden = true;
    if (window.evenzi && window.evenzi.showToast) {
      window.evenzi.showToast('PHOTO READY');
    }
  });
})();

/* ── Search input: toggle .is-filled + clear button ──────────────
   Delegated so any .form-input-search on any page inherits it.
   Clear refocuses the field and re-fires `input` so list filters react. */
(function () {
  function sync(input) {
    var wrap = input.closest('.form-input-search');
    if (!wrap) return;
    wrap.classList.toggle('is-filled', input.value.length > 0);
  }
  document.addEventListener('input', function (e) {
    var input = e.target.closest && e.target.closest('.form-input-search input');
    if (input) sync(input);
  });
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.form-input-search-clear');
    if (!btn) return;
    var wrap = btn.closest('.form-input-search');
    var input = wrap && wrap.querySelector('input');
    if (!input) return;
    input.value = '';
    sync(input);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  });
})();
