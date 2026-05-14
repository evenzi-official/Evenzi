/* ════════════════════════════════════════════════════════════════════
   Evenzi · Celebratory Curator wizard script
   Shared by step-1-type.html · step-2-details.html · step-3-celebrations.html
   step-4-review.html · success.html

   State model — keyed in sessionStorage as 'evz-event':
   {
     type: 'wedding' | 'birthday' | 'anniversary' | 'corporate' | 'custom',
     customType: '<free text>',     // only when type === 'custom'
     title, partnerOne, partnerTwo, eventDate, guestCount, venue,
     celebrations: [{ id, name, time, venue }],
     createdAt: '<ISO>'
   }
   ════════════════════════════════════════════════════════════════════ */

(function () {
  var STORAGE_KEY = 'evz-event';

  /* ── Shared helpers ─────────────────────────────── */
  function getState() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  function setState(patch) {
    var s = getState();
    Object.keys(patch).forEach(function (k) { s[k] = patch[k]; });
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
    return s;
  }
  function clearState() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }
  function toast(msg) {
    if (window.evenzi && window.evenzi.showToast) window.evenzi.showToast(msg);
  }
  function setLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.classList.add('is-loading');
      btn.setAttribute('aria-busy', 'true');
      btn.disabled = true;
    } else {
      btn.classList.remove('is-loading');
      btn.removeAttribute('aria-busy');
      btn.disabled = false;
    }
  }
  function showError(el, msg) {
    if (!el) return;
    el.hidden = false;
    el.textContent = msg;
  }
  function clearError(el) {
    if (!el) return;
    el.hidden = true;
    el.textContent = '';
  }
  /* Render a title string that may contain an <em>...</em> brand-color span.
     Builds DOM nodes (no innerHTML) so user-data never reaches the parser. */
  function renderEmTitle(el, raw) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
    var parts = raw.split(/<em>|<\/em>/);
    parts.forEach(function (p, i) {
      if (i % 2 === 0) el.appendChild(document.createTextNode(p));
      else {
        var em = document.createElement('em');
        em.textContent = p;
        el.appendChild(em);
      }
    });
  }
  /* Convert event type to route — Wedding goes via celebrations step,
     other types skip step 3 and jump from details → review. */
  function nextStepAfter(currentStep, type) {
    if (currentStep === 'type')         return 'step-2-details.html';
    if (currentStep === 'details')      return type === 'wedding' ? 'step-3-celebrations.html' : 'step-4-review.html';
    if (currentStep === 'celebrations') return 'step-4-review.html';
    if (currentStep === 'review')       return 'success.html';
    return 'step-1-type.html';
  }
  function prevStepBefore(currentStep, type) {
    if (currentStep === 'details')      return 'step-1-type.html';
    if (currentStep === 'celebrations') return 'step-2-details.html';
    if (currentStep === 'review')       return type === 'wedding' ? 'step-3-celebrations.html' : 'step-2-details.html';
    return 'step-1-type.html';
  }

  window.evenzi = window.evenzi || {};
  window.evenzi.cc = { getState: getState, setState: setState, clearState: clearState, toast: toast };

  var page = document.body.dataset.step || '';

  /* ════════════════════════════════════════════════════════════════════
     Step 1 — Event Type
     ════════════════════════════════════════════════════════════════════ */
  if (page === 'type') {
    var continueBtn = document.querySelector('[data-cc-continue]');
    var typeErr = document.getElementById('cc-type-err');
    var currentType = null;

    function refreshContinueState() {
      var valid = !!currentType;
      if (continueBtn) {
        continueBtn.disabled = !valid;
        if (valid) continueBtn.removeAttribute('aria-disabled');
        else continueBtn.setAttribute('aria-disabled', 'true');
      }
    }
    function selectType(type) {
      currentType = type;
      var cards = document.querySelectorAll('.cc-type-card');
      cards.forEach(function (c) {
        var match = c.getAttribute('data-cc-type') === type;
        c.setAttribute('aria-checked', match ? 'true' : 'false');
        c.classList.toggle('is-selected', match);
      });
      clearError(typeErr);
      refreshContinueState();
    }
    /* Hydrate from state on load */
    var s0 = getState();
    if (s0.type) selectType(s0.type);

    document.addEventListener('click', function (e) {
      var card = e.target.closest && e.target.closest('.cc-type-card[data-cc-type]');
      if (!card) return;
      if (card.getAttribute('aria-disabled') === 'true') {
        var typeName = card.getAttribute('data-cc-type') || '';
        toast(typeName.toUpperCase() + ' COMING SOON');
        return;
      }
      selectType(card.getAttribute('data-cc-type'));
    });

    if (continueBtn) {
      continueBtn.addEventListener('click', function () {
        if (continueBtn.disabled) return;
        if (!currentType) {
          showError(typeErr, 'Pick an event type to continue');
          return;
        }
        setState({ type: currentType });
        setLoading(continueBtn, true);
        setTimeout(function () {
          window.location.href = nextStepAfter('type', currentType);
        }, 600);
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════
     Step 2 — Basic Details
     ════════════════════════════════════════════════════════════════════ */
  if (page === 'details') {
    var s = getState();
    if (!s.type) { window.location.href = 'step-1-type.html'; return; }

    var COPY = {
      wedding:     { title: 'Tell us about <em>your union</em>',       lead: "We're curating a bespoke experience tailored to your unique journey. Let's start with the foundational details of your big day." },
      birthday:    { title: 'Tell us about <em>your birthday</em>',    lead: "We're crafting a celebration that feels distinctly yours. Start with the essentials and we'll handle the rest." },
      anniversary: { title: 'Tell us about <em>your anniversary</em>', lead: "A milestone deserves a thoughtful canvas. Set the basics and we'll help you shape the moment." },
      corporate:   { title: 'Tell us about <em>your event</em>',       lead: "Set the foundations so we can prepare invites, schedules, and a polished public page." }
    };
    var copy = COPY[s.type] || COPY.wedding;
    renderEmTitle(document.querySelector('[data-cc-title]'), copy.title);
    var leadEl = document.querySelector('[data-cc-lead]');
    if (leadEl) leadEl.textContent = copy.lead;

    var partnersGroup = document.querySelector('[data-cc-partners-group]');
    if (partnersGroup) partnersGroup.hidden = (s.type !== 'wedding' && s.type !== 'anniversary');

    var titleField = document.getElementById('cc-title');
    if (titleField) {
      var TITLES = {
        wedding:     'e.g. Smith-Jones Wedding Gala',
        birthday:    "e.g. Anya's 30th",
        anniversary: 'e.g. 25 Years Together',
        corporate:   'e.g. Annual Summit 2026'
      };
      titleField.placeholder = TITLES[s.type] || TITLES.wedding;
    }

    var fields = ['title','partnerOne','partnerTwo','eventDate','guestCount','venue'];
    fields.forEach(function (k) {
      var el = document.getElementById('cc-' + k);
      if (el && s[k] != null) el.value = s[k];
    });

    var titleErr = document.getElementById('cc-title-err');
    /* Clear error as soon as the user starts typing again */
    var titleField2 = document.getElementById('cc-title');
    if (titleField2) {
      titleField2.addEventListener('input', function () { clearError(titleErr); });
    }
    /* Debounced autosave — every input event writes back to sessionStorage
       after 250ms idle. Survives accidental refresh / nav. */
    var autosaveTimer = null;
    function autosave() {
      if (autosaveTimer) clearTimeout(autosaveTimer);
      autosaveTimer = setTimeout(function () {
        var patch = {};
        fields.forEach(function (k) {
          var el = document.getElementById('cc-' + k);
          if (el) patch[k] = (el.value || '').trim();
        });
        setState(patch);
      }, 250);
    }
    fields.forEach(function (k) {
      var el = document.getElementById('cc-' + k);
      if (el) el.addEventListener('input', autosave);
    });

    var contBtn = document.querySelector('[data-cc-continue]');
    if (contBtn) {
      contBtn.addEventListener('click', function () {
        var titleVal = (titleField2.value || '').trim();
        if (!titleVal) {
          showError(titleErr, 'Give your event a name to continue');
          titleField2.focus();
          return;
        }
        clearError(titleErr);
        var patch = {};
        fields.forEach(function (k) {
          var el = document.getElementById('cc-' + k);
          patch[k] = el ? (el.value || '').trim() : '';
        });
        setState(patch);
        setLoading(contBtn, true);
        setTimeout(function () {
          window.location.href = nextStepAfter('details', s.type);
        }, 600);
      });
    }
    var backBtn = document.querySelector('[data-cc-back]');
    if (backBtn) {
      backBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = prevStepBefore('details', s.type);
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════
     Step 3 — Celebrations
     ════════════════════════════════════════════════════════════════════ */
  if (page === 'celebrations') {
    var s3 = getState();
    if (!s3.type) { window.location.href = 'step-1-type.html'; return; }
    if (s3.type !== 'wedding') { window.location.href = 'step-4-review.html'; return; }

    var selectedSet = {};
    (s3.celebrations || []).forEach(function (c) { selectedSet[c.id] = c; });

    var countText = document.querySelector('[data-cc-count]');
    var selectionChip = document.querySelector('.cc-selection-chip');
    function refreshCount() {
      var n = Object.keys(selectedSet).length;
      if (countText) countText.textContent = n + (n === 1 ? ' celebration selected' : ' celebrations selected');
      if (selectionChip) selectionChip.classList.toggle('is-empty', n === 0);
      var contBtn = document.querySelector('[data-cc-continue]');
      if (contBtn) {
        contBtn.disabled = n === 0;
        if (n > 0) contBtn.removeAttribute('aria-disabled');
        else contBtn.setAttribute('aria-disabled', 'true');
      }
    }
    document.querySelectorAll('.cc-celebration-card[data-cc-celebration]').forEach(function (card) {
      var id = card.getAttribute('data-cc-celebration');
      var isOn = !!selectedSet[id];
      card.setAttribute('aria-checked', isOn ? 'true' : 'false');
      card.classList.toggle('is-selected', isOn);
    });
    refreshCount();

    function toggleCard(card) {
      var id = card.getAttribute('data-cc-celebration');
      var on = card.getAttribute('aria-checked') === 'true';
      if (on) {
        card.setAttribute('aria-checked', 'false');
        card.classList.remove('is-selected');
        delete selectedSet[id];
      } else {
        card.setAttribute('aria-checked', 'true');
        card.classList.add('is-selected');
        selectedSet[id] = {
          id: id,
          name: card.querySelector('.cc-celebration-name').textContent.trim(),
          time: null,
          venue: null
        };
      }
      /* Persist immediately — refresh-resilient (P1 #1) */
      setState({ celebrations: Object.keys(selectedSet).map(function (k) { return selectedSet[k]; }) });
      refreshCount();
    }
    document.addEventListener('click', function (e) {
      var meta = e.target.closest && e.target.closest('.cc-meta-btn');
      if (meta) {
        e.stopPropagation();
        var kind = meta.getAttribute('data-cc-meta');
        toast((kind === 'time' ? 'TIME PICKER' : 'VENUE PICKER') + ' OPENING');
        meta.classList.add('is-set');
        return;
      }
      var card = e.target.closest && e.target.closest('.cc-celebration-card[data-cc-celebration]');
      if (!card) return;
      toggleCard(card);
    });
    /* Keyboard activation for the role=checkbox cards (Space/Enter).
       Native <div> doesn't get this for free — we need preventDefault on Space
       to stop the viewport from scrolling. */
    document.addEventListener('keydown', function (e) {
      if (e.key !== ' ' && e.key !== 'Spacebar' && e.key !== 'Enter') return;
      var card = e.target.closest && e.target.closest('.cc-celebration-card[data-cc-celebration]');
      if (!card) return;
      /* If focus is on an inner button (meta-btn), let the button handle it. */
      if (e.target.closest('.cc-meta-btn')) return;
      e.preventDefault();
      toggleCard(card);
    });

    var addBtn = document.querySelector('[data-cc-add-custom]');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        toast('CUSTOM CEREMONY PICKER');
      });
    }

    var contBtn3 = document.querySelector('[data-cc-continue]');
    if (contBtn3) {
      contBtn3.addEventListener('click', function () {
        if (contBtn3.disabled) return;
        var arr = Object.keys(selectedSet).map(function (k) { return selectedSet[k]; });
        setState({ celebrations: arr });
        setLoading(contBtn3, true);
        setTimeout(function () {
          window.location.href = nextStepAfter('celebrations', s3.type);
        }, 600);
      });
    }
    var backBtn3 = document.querySelector('[data-cc-back]');
    if (backBtn3) {
      backBtn3.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = prevStepBefore('celebrations', s3.type);
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════
     Step 4 — Review
     ════════════════════════════════════════════════════════════════════ */
  if (page === 'review') {
    var s4 = getState();
    if (!s4.type) { window.location.href = 'step-1-type.html'; return; }

    var TYPE_TITLE = {
      wedding:     'Review your <em>vibrant union</em>',
      birthday:    'Review your <em>birthday celebration</em>',
      anniversary: 'Review your <em>anniversary plan</em>',
      corporate:   'Review your <em>event plan</em>'
    };
    renderEmTitle(document.querySelector('[data-cc-title]'), TYPE_TITLE[s4.type] || TYPE_TITLE.wedding);

    function setText(id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val || '—';
    }
    /* Format ISO date (YYYY-MM-DD from <input type="date">) to DD MMM YYYY (en-IN). */
    function formatDate(iso) {
      if (!iso) return '';
      var d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      try {
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch (e) { return iso; }
    }
    setText('rv-title', s4.title);
    setText('rv-date', formatDate(s4.eventDate));
    setText('rv-venue', s4.venue);
    /* Guest count: append " guests" unit when value present */
    var guestEl = document.getElementById('rv-guests');
    if (guestEl) guestEl.textContent = s4.guestCount ? (s4.guestCount + ' guests') : '—';
    var partnerLine = (s4.partnerOne || '') + (s4.partnerTwo ? (s4.partnerOne ? ' & ' : '') + s4.partnerTwo : '');
    setText('rv-partners', partnerLine.trim());

    /* Hide partners row when neither partner is named (regardless of type) */
    var partnersRow = document.querySelector('[data-rv-partners-row]');
    var hasPartners = !!(s4.partnerOne || s4.partnerTwo);
    var typeAllowsPartners = (s4.type === 'wedding' || s4.type === 'anniversary');
    if (partnersRow) partnersRow.hidden = !(typeAllowsPartners && hasPartners);

    function celebrationIcon(id) {
      var map = { haldi:'spa', mehendi:'palette', sangeet:'music_note', reception:'celebration', engagement:'favorite', ceremony:'auto_awesome' };
      return map[id] || 'event';
    }
    var itinerarySection = document.querySelector('[data-rv-itinerary]');
    var itineraryList = document.querySelector('[data-rv-itinerary-list]');
    if (s4.type === 'wedding' && itineraryList) {
      while (itineraryList.firstChild) itineraryList.removeChild(itineraryList.firstChild);
      var list = s4.celebrations || [];
      if (list.length === 0) {
        var empty = document.createElement('p');
        empty.className = 'cc-form-helper';
        empty.textContent = 'No celebrations selected yet.';
        itineraryList.appendChild(empty);
      } else {
        list.forEach(function (c) {
          var row = document.createElement('div');
          row.className = 'cc-review-event';
          var iconWrap = document.createElement('span');
          iconWrap.className = 'cc-review-event-icon';
          iconWrap.setAttribute('aria-hidden', 'true');
          var icon = document.createElement('span');
          icon.className = 'material-symbols-outlined icon-fill';
          icon.textContent = celebrationIcon(c.id);
          iconWrap.appendChild(icon);
          row.appendChild(iconWrap);
          var body = document.createElement('span');
          body.className = 'cc-review-event-body';
          var name = document.createElement('span');
          name.className = 'cc-review-event-name';
          name.textContent = c.name;
          var meta = document.createElement('span');
          meta.className = 'cc-review-event-meta';
          meta.textContent = (c.time || 'Time TBD') + ' · ' + (c.venue || 'Venue TBD');
          body.appendChild(name);
          body.appendChild(meta);
          row.appendChild(body);
          itineraryList.appendChild(row);
        });
      }
    } else if (itinerarySection) {
      itinerarySection.hidden = true;
    }

    var confirmBtn = document.querySelector('[data-cc-confirm]');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        setState({ createdAt: new Date().toISOString() });
        setLoading(confirmBtn, true);
        setTimeout(function () { window.location.href = 'success.html'; }, 1000);
      });
    }
    var backBtn4 = document.querySelector('[data-cc-back]');
    if (backBtn4) {
      backBtn4.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = prevStepBefore('review', s4.type);
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════
     Success
     ════════════════════════════════════════════════════════════════════ */
  if (page === 'success') {
    var s5 = getState();
    if (!s5.type) { window.location.href = 'step-1-type.html'; return; }
    var greeting = document.querySelector('[data-cc-greeting]');
    if (greeting) {
      var msg = 'Your event is curated and ready.';
      if (s5.type === 'wedding')     msg = "Your wedding is curated and ready. We've synced your vision with our orchestration tools.";
      if (s5.type === 'birthday')    msg = "Your birthday celebration is curated and ready. We've prepped the basics — pick it up from your dashboard.";
      if (s5.type === 'anniversary') msg = "Your anniversary plan is set. Your dashboard now has everything you need to coordinate.";
      if (s5.type === 'corporate')   msg = "Your event plan is locked in. Open the dashboard to invite collaborators and manage logistics.";
      greeting.textContent = msg;
    }
    /* Countdown — swaps copy when the event is past/today vs upcoming */
    var countEl = document.querySelector('[data-cc-countdown]');
    var countLabel = document.querySelector('[data-cc-countdown-label]');
    var countEyebrow = document.querySelector('[data-cc-countdown-eyebrow]');
    if (countEl && s5.eventDate) {
      var target = new Date(s5.eventDate);
      var today = new Date(); today.setHours(0,0,0,0);
      var diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
      if (isNaN(diff)) {
        countEl.textContent = '—';
      } else if (diff > 0) {
        countEl.textContent = diff;
        if (countLabel) countLabel.textContent = diff === 1 ? 'Day left' : 'Days left';
        if (countEyebrow) countEyebrow.textContent = 'The celebration';
      } else if (diff === 0) {
        countEl.textContent = 'Today';
        countEl.classList.add('is-text');
        if (countLabel) countLabel.textContent = 'is the day';
        if (countEyebrow) countEyebrow.textContent = 'It begins';
      } else {
        countEl.textContent = Math.abs(diff);
        if (countLabel) countLabel.textContent = Math.abs(diff) === 1 ? 'Day ago' : 'Days ago';
        if (countEyebrow) countEyebrow.textContent = 'Looking back on';
      }
    } else if (countEl) {
      countEl.textContent = '—';
    }
    var dashBtn = document.querySelector('[data-cc-dashboard]');
    if (dashBtn) {
      dashBtn.addEventListener('click', function () {
        setLoading(dashBtn, true);
        setTimeout(function () {
          clearState();
          window.location.href = '../../index.html';
        }, 600);
      });
    }
  }
})();
