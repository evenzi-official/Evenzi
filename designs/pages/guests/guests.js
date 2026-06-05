/* ════════════════════════════════════════════════════════════════════
   Guest Management — page behaviour (prototype).
   Sample data → render rows + stats → search / filter / sort →
   add/edit/remove modals → CSV import sim → manual RSVP setter
   (sheet on phone / popover on desktop) with optimistic update + rollback.
   Generic primitives + modal controller come from shared/shell.{css,js}.
   DOM is built with createElement / textContent (no innerHTML) so guest-
   supplied text can never be interpreted as markup.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var toast = function (t) { if (window.evenzi && window.evenzi.showToast) window.evenzi.showToast(t); };

  /* tiny element builder — attrs: class, text, or any attribute name (aria-, data-, role…) */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else n.setAttribute(k, v);
    });
    if (kids != null) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function icon(name, extra) {
    return el('span', { class: 'material-symbols-outlined' + (extra ? ' ' + extra : ''), 'aria-hidden': 'true', text: name });
  }

  var STATUSES = {
    confirmed: { label: 'Confirmed', icon: 'check_circle', cls: 'status-confirmed' },
    declined:  { label: 'Declined',  icon: 'cancel',       cls: 'status-declined'  },
    maybe:     { label: 'Maybe',     icon: 'help',         cls: 'status-maybe'     },
    pending:   { label: 'Pending',   icon: 'schedule',     cls: 'status-pending'   }
  };
  var SORT_STATUS_ORDER = { pending: 0, maybe: 1, confirmed: 2, declined: 3 };
  var IMPORT_NAMES = ['Lakshmi Rao', 'Sanjay Gupta', 'Pooja Verma', 'Imran Khan', 'Neha Bansal'];

  /* ── Event sub-events (owned by the event wizard; fixed sample here) ── */
  var EVENT_SUBEVENTS = [
    { id: 'haldi', label: 'Haldi' },
    { id: 'mehendi', label: 'Mehendi' },
    { id: 'sangeet', label: 'Sangeet' },
    { id: 'wedding', label: 'Wedding' },
    { id: 'reception', label: 'Reception' }
  ];
  var ALL_SUBEVENTS = EVENT_SUBEVENTS.map(function (s) { return s.id; });
  function subEventLabel(id) { var s = EVENT_SUBEVENTS.filter(function (x) { return x.id === id; })[0]; return s ? s.label : id; }

  /* ── Tag registry (seed; hosts can create more) ── */
  var TAGS = ['Family', 'Bride’s side', 'Groom’s side', 'Out-of-town', 'Friends', 'Colleagues', 'Table 5', 'A-list'];

  /* ── Sample data (varied: 30+char name, Devanagari, missing email,
        not-invited, zero-function, 0–2 tags — exercises content resilience) ── */
  var nextId = 1;
  var guests = [
    g('Rajeshwari Venkataraman Iyer', '9876543210', 'rajeshwari.iyer@example.com', 'confirmed', true,  ALL_SUBEVENTS.slice(),                  ['Family', 'Bride’s side']),
    g('आरव शर्मा',                    '9811122233', '',                            'pending',   true,  ALL_SUBEVENTS.slice(),                  ['Family', 'Groom’s side']),
    g('Priya Nair',                   '9844455566', 'priya.nair@example.com',      'confirmed', true,  ['wedding', 'reception'],               ['Friends']),
    g('Karthik Reddy',                '9988776655', 'karthik.r@example.com',       'declined',  true,  ['wedding', 'reception'],               ['Out-of-town']),
    g('Ananya Krishnan',              '9933221100', 'ananya.k@example.com',        'maybe',     true,  ALL_SUBEVENTS.slice(),                  ['Bride’s side', 'Table 5']),
    g('Vikram Singh',                 '9090909090', 'vikram.singh@example.com',    'pending',   false, [],                                     ['Colleagues']),
    g('Meera Patel',                  '9700012345', '',                            'confirmed', true,  ['mehendi', 'sangeet', 'wedding', 'reception'], ['Family']),
    g('Rohan Desai',                  '9811199881', 'rohan.desai@example.com',     'pending',   false, ['reception'],                          []),
    g('Sneha Joshi',                  '9822233445', 'sneha.j@example.com',         'confirmed', true,  ALL_SUBEVENTS.slice(),                  ['Friends', 'A-list']),
    g('Arjun Menon',                  '9745612300', 'arjun.menon@example.com',     'declined',  true,  ['wedding'],                            ['Groom’s side']),
    g('Divya Pillai',                 '9633344556', 'divya.pillai@example.com',    'maybe',     true,  ALL_SUBEVENTS.slice(),                  ['Bride’s side']),
    g('Aditya Kapoor',                '9900088776', 'aditya.kapoor@example.com',   'pending',   false, [],                                     ['Colleagues', 'Out-of-town'])
  ];
  function g(name, phone, email, status, invited, subEvents, tags) {
    return {
      id: nextId++, name: name, phone: phone, email: email, status: status, invited: invited,
      subEvents: subEvents || ALL_SUBEVENTS.slice(), tags: tags || [], order: nextId
    };
  }

  /* ── View state ── */
  var state = { search: '', filter: 'all', sort: 'name', subFilters: [], tagFilters: [], onlyUnassigned: false };

  /* ── Elements ── */
  var listEl     = $('#gm-list');
  var skeletonEl = $('#gm-skeleton');
  var emptyZero  = $('#gm-empty-zero');
  var emptyFilt  = $('#gm-empty-filtered');
  var emptyFiltSub = $('#gm-empty-filtered-sub');
  var liveEl     = $('#gm-live');

  /* ════════════════ helpers ════════════════ */
  function initials(name) {
    var parts = name.trim().split(/\s+/);
    var a = parts[0] ? parts[0][0] : '';
    var b = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (a + b).toUpperCase();
  }
  function fmtPhone(p) { return p ? '+91 ' + p.replace(/(\d{5})(\d{5})/, '$1 $2') : 'No phone'; }
  function contactLine(gst) {
    var bits = [];
    if (gst.phone) bits.push(fmtPhone(gst.phone));
    bits.push(gst.email || 'No email');
    return bits.join('  ·  ');
  }

  /* ════════════════ derive ════════════════ */
  function counts() {
    var c = { total: guests.length, confirmed: 0, declined: 0, pending: 0, maybe: 0 };
    guests.forEach(function (gst) { c[gst.status]++; });
    return c;
  }
  function uninvitedCount() { return guests.filter(function (gst) { return !gst.invited; }).length; }

  function visibleGuests() {
    var q = state.search.trim().toLowerCase();
    var out = guests.filter(function (gst) {
      if (state.filter !== 'all' && gst.status !== state.filter) return false;
      if (state.onlyUnassigned && (gst.subEvents || []).length !== 0) return false;
      if (state.subFilters.length && !state.subFilters.some(function (s) { return gst.subEvents.indexOf(s) > -1; })) return false;
      if (state.tagFilters.length && !state.tagFilters.some(function (t) { return gst.tags.indexOf(t) > -1; })) return false;
      if (!q) return true;
      return (gst.name.toLowerCase().indexOf(q) > -1) ||
             (gst.phone.indexOf(q) > -1) ||
             (gst.email.toLowerCase().indexOf(q) > -1);
    });
    out.sort(function (a, b) {
      if (state.sort === 'recent') return b.order - a.order;
      if (state.sort === 'status') {
        var d = SORT_STATUS_ORDER[a.status] - SORT_STATUS_ORDER[b.status];
        return d !== 0 ? d : a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
    return out;
  }

  /* ════════════════ render ════════════════ */
  function createRow(gst) {
    var s = STATUSES[gst.status];
    var li = el('li', { class: 'guest-row' + (selecting && selected[gst.id] ? ' is-selected' : ''), 'data-id': gst.id });
    var surface = el('div', { class: 'guest-row-surface' });

    surface.appendChild(el('span', { class: 'guest-row-avatar', 'aria-hidden': 'true', text: initials(gst.name) }));
    // name+contact = the edit trigger (tap to edit) OR a checkbox while selecting — both keyboard-accessible <button>
    var idAttrs = { type: 'button', class: 'guest-row-id', 'data-gm-edit': '', 'aria-label': 'Edit ' + gst.name };
    if (selecting) { idAttrs.role = 'checkbox'; idAttrs['aria-checked'] = selected[gst.id] ? 'true' : 'false'; idAttrs['aria-label'] = 'Select ' + gst.name; }
    surface.appendChild(el('button', idAttrs, [
      el('span', { class: 'guest-row-name', title: gst.name, text: gst.name }),
      el('span', { class: 'guest-row-contact', text: contactLine(gst) })
    ]));

    // row-2 meta strip — show only what's notable (collapses otherwise)
    var meta = el('div', { class: 'guest-row-meta' });
    if (!gst.invited) {
      meta.appendChild(el('span', { class: 'guest-invite-chip guest-invite-none' }, [icon('schedule_send'), 'Not invited']));
    }
    var assigned = (gst.subEvents || []).length, total = ALL_SUBEVENTS.length;
    if (assigned !== total) {
      meta.appendChild(el('span', {
        class: 'guest-assign-chip' + (assigned === 0 ? ' is-none' : ''),
        title: assigned === 0 ? 'Not invited to any function' : assigned + ' of ' + total + ' functions',
        'aria-label': assigned === 0 ? 'Not invited to any function' : 'Invited to ' + assigned + ' of ' + total + ' functions'
      }, [icon(assigned === 0 ? 'event_busy' : 'event'), assigned + '/' + total]));
    }
    // fewer tags when the row already carries exception chips (keeps row-2 to one line)
    var tags = gst.tags || [];
    var exceptions = (gst.invited ? 0 : 1) + (assigned !== total ? 1 : 0);
    var tagLimit = exceptions >= 2 ? 0 : exceptions === 1 ? 1 : 2;
    tags.slice(0, tagLimit).forEach(function (t) {
      meta.appendChild(el('span', { class: 'tag-chip' }, el('span', { class: 'tag-chip-label', text: t })));
    });
    if (tags.length > tagLimit) {
      meta.appendChild(el('span', { class: 'tag-chip tag-chip-more', text: '+' + (tags.length - tagLimit) }));
    }
    surface.appendChild(meta);

    surface.appendChild(el('button', {
      type: 'button', class: 'guest-row-rsvp status-badge ' + s.cls,
      'data-gm-setrsvp': '', 'aria-haspopup': 'true', 'aria-expanded': 'false',
      'aria-label': 'RSVP for ' + gst.name + ': ' + s.label + '. Tap to change.'
    }, [
      el('span', { class: 'status-dot', 'aria-hidden': 'true' }),
      s.label,
      icon('expand_more')
    ]));

    li.appendChild(surface);
    // swipe action rail (touch shortcut; redundant w/ badge + edit, so aria-hidden)
    if (!selecting) {
      li.appendChild(el('div', { class: 'guest-row-rail', 'aria-hidden': 'true' }, [
        el('button', { type: 'button', class: 'gr-swipe gr-swipe-rsvp', 'data-swipe': 'rsvp', tabindex: '-1' }, [icon('how_to_reg'), el('span', { text: 'RSVP' })]),
        el('button', { type: 'button', class: 'gr-swipe gr-swipe-assign', 'data-swipe': 'assign', tabindex: '-1' }, [icon('event'), el('span', { text: 'Assign' })]),
        el('button', { type: 'button', class: 'gr-swipe gr-swipe-send', 'data-swipe': 'send', tabindex: '-1' }, [icon('send'), el('span', { text: 'Send' })])
      ]));
    }
    return li;
  }

  function render() {
    var c = counts();

    $$('[data-gm-count]').forEach(function (el2) { el2.textContent = c[el2.getAttribute('data-gm-count')]; });
    $$('[data-gm-chip]').forEach(function (el2) {
      var k = el2.getAttribute('data-gm-chip');
      el2.textContent = k === 'all' ? c.total : c[k];
    });

    var responded = c.confirmed + c.declined + c.maybe;
    var rate = c.total ? Math.round((responded / c.total) * 100) : 0;
    $('[data-gm-rate]').textContent = rate;
    $('[data-gm-responded]').textContent = responded;
    $('[data-gm-total]').textContent = c.total;
    $('[data-gm-rate-fill]').style.width = rate + '%';

    var un = uninvitedCount();
    var sendBtn = $('.gm-send-btn');
    var sendCount = $('[data-gm-uninvited-count]');
    sendCount.textContent = un;
    sendCount.hidden = un === 0;
    sendBtn.disabled = un === 0;
    sendBtn.title = un === 0 ? 'Everyone has been invited' : un + ' guests not yet invited';

    $$('.gm-count').forEach(function (el2) {
      var on = el2.getAttribute('data-gm-jump') === state.filter;
      el2.classList.toggle('is-active', on);
      el2.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    var rows = visibleGuests();
    var zero = guests.length === 0;
    emptyZero.hidden = !zero;
    if (zero) { listEl.replaceChildren(); emptyFilt.hidden = true; return; }

    if (rows.length === 0) {
      listEl.replaceChildren();
      emptyFilt.hidden = false;
      emptyFiltSub.textContent = state.search
        ? 'Nothing matches “' + state.search + '”.'
        : 'No ' + (state.filter !== 'all' ? STATUSES[state.filter].label.toLowerCase() + ' ' : '') + 'guests yet.';
    } else {
      emptyFilt.hidden = true;
      listEl.replaceChildren.apply(listEl, rows.map(createRow));   // createRow applies is-selected + aria-checked in selection mode
    }
    if (typeof updateUnassignedBanner === 'function') updateUnassignedBanner();
    // SR announcement when a search/filter is narrowing the list (polite, coalesced)
    if (liveEl && (state.search || state.filter !== 'all')) {
      liveEl.textContent = rows.length + (rows.length === 1 ? ' guest' : ' guests') + ' shown';
    } else if (liveEl) {
      liveEl.textContent = '';
    }
  }

  function byId(id) { return guests.filter(function (gg) { return gg.id === +id; })[0]; }
  function rowEl(id) { return $('.guest-row[data-id="' + id + '"]'); }

  /* ════════════════ search / sort / filter ════════════════ */
  $('#gm-search-input').addEventListener('input', function (e) {
    state.search = e.target.value || '';
    render();
  });
  $('[data-gm-sort]').addEventListener('click', function () { openSortSheet(this); });

  function setFilter(f) {
    state.filter = f;
    $$('.dp-filter-chip', $('.gm-filters')).forEach(function (chip) {
      var on = chip.getAttribute('data-gm-filter') === f;
      chip.classList.toggle('is-active', on);
      chip.setAttribute('aria-checked', on ? 'true' : 'false');
      chip.tabIndex = on ? 0 : -1;
    });
    render();
  }
  var filtersWrap = $('.gm-filters');
  filtersWrap.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-gm-filter]');
    if (chip) setFilter(chip.getAttribute('data-gm-filter'));
  });
  filtersWrap.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var chips = $$('.dp-filter-chip', filtersWrap);
    var i = chips.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    var n = e.key === 'ArrowRight' ? (i + 1) % chips.length : (i - 1 + chips.length) % chips.length;
    chips[n].focus();
    setFilter(chips[n].getAttribute('data-gm-filter'));
  });
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('.gm-count').forEach(function (elc) {
    elc.addEventListener('click', function () {
      setFilter(elc.getAttribute('data-gm-jump'));
      $('.gm-list-card').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });
  $('[data-gm-clear-filters]').addEventListener('click', function () {
    state.search = '';
    $('#gm-search-input').value = '';
    $('.form-input-search').classList.remove('is-filled');
    state.subFilters = []; state.tagFilters = []; state.onlyUnassigned = false;
    updateFilterBadge();
    setFilter('all');
  });

  /* ════════════════ Add / Edit modal ════════════════ */
  var guestForm = $('#gm-guest-form');
  var editingId = null;
  // Reset editing state whenever the modal closes by ANY path (Esc / scrim / Cancel / X).
  (function () {
    var gm = $('#gm-guest-modal');
    new MutationObserver(function () {
      if (gm.getAttribute('aria-hidden') === 'true') editingId = null;
    }).observe(gm, { attributes: true, attributeFilter: ['aria-hidden'] });
  })();

  function openGuestModal(id) {
    editingId = id || null;
    var editing = !!id;
    $('#gm-guest-h').textContent = editing ? 'Edit guest' : 'Add guest';
    $('#gm-f-save').textContent = editing ? 'Save changes' : 'Save guest';
    clearErr();
    $$('.gm-edit-only').forEach(function (el2) { el2.hidden = !editing; });

    if (editing) {
      var gst = byId(id);
      $('#gm-f-name').value = gst.name;
      $('#gm-f-phone').value = gst.phone;
      $('#gm-f-email').value = gst.email;
      buildEditRsvpPills(gst);
      buildInviteState(gst);
      buildFunctions(gst.subEvents);
      initTags(gst.tags);
    } else {
      guestForm.reset();
      buildFunctions(ALL_SUBEVENTS);   // new guest defaults to all functions
      initTags([]);
    }
    window.evenzi.openModal('gm-guest-modal');
  }

  /* Functions checklist (assignment) */
  function buildFunctions(assignedIds) {
    var wrap = $('#gm-f-functions');
    wrap.replaceChildren.apply(wrap, EVENT_SUBEVENTS.map(function (se) {
      var input = el('input', { type: 'checkbox', value: se.id });
      input.checked = assignedIds.indexOf(se.id) > -1;
      return el('label', { class: 'form-check' }, [input, el('span', { text: se.label })]);
    }));
    syncFuncWarn();
  }
  function syncFuncWarn() {
    var checked = $$('#gm-f-functions input:checked');
    $('#gm-f-func-warn').hidden = checked.length > 0;
    var labels = checked.map(function (i) { return subEventLabel(i.value); });
    $('#gm-f-func-preview').textContent = labels.length ? 'This guest will see: ' + labels.join(', ') : '';
  }
  $('#gm-f-functions').addEventListener('change', syncFuncWarn);

  /* Tags combobox */
  var formTags = [];
  var tagInput = $('#gm-f-tag-input'), tagListbox = $('#gm-f-tag-listbox'), tagActive = -1;
  function initTags(tags) { formTags = (tags || []).slice(); renderTagChips(); tagInput.value = ''; closeTagListbox(); }
  function renderTagChips() {
    var wrap = $('#gm-f-tag-chips');
    wrap.replaceChildren.apply(wrap, formTags.map(function (t) {
      return el('span', { class: 'tag-chip tag-chip-removable' }, [
        el('span', { class: 'tag-chip-label', text: t }),
        el('button', { type: 'button', class: 'tag-chip-x', 'aria-label': 'Remove tag ' + t, 'data-rm-tag': t }, icon('close'))
      ]);
    }));
  }
  function addTag(name) {
    name = (name || '').trim(); if (!name) return;
    var dup = formTags.some(function (t) { return t.toLowerCase() === name.toLowerCase(); });
    if (!dup) {
      var reg = TAGS.filter(function (t) { return t.toLowerCase() === name.toLowerCase(); })[0];
      var canonical = reg || name;
      formTags.push(canonical);
      if (!reg) TAGS.push(canonical);   // create new in the registry
      renderTagChips();
    }
    tagInput.value = ''; tagInput.focus(); openTagListbox();   // keep open for rapid multi-tag entry
  }
  function removeTag(name) { formTags = formTags.filter(function (t) { return t !== name; }); renderTagChips(); }
  $('#gm-f-tag-chips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-rm-tag]'); if (b) removeTag(b.getAttribute('data-rm-tag'));
  });
  function openTagListbox() {
    var q = tagInput.value.trim(), ql = q.toLowerCase();
    var sugg = TAGS.filter(function (t) { return formTags.indexOf(t) === -1 && (!ql || t.toLowerCase().indexOf(ql) > -1); });
    var exact = TAGS.concat(formTags).some(function (t) { return t.toLowerCase() === ql; });
    var items = sugg.map(function (t, i) {
      return el('li', { id: 'gm-tagopt-' + i, class: 'tag-input-option', role: 'option', 'aria-selected': 'false', 'data-tag': t }, [icon('sell'), t]);
    });
    if (q && !exact) items.push(el('li', { id: 'gm-tagopt-new', class: 'tag-input-option tag-input-option-new', role: 'option', 'aria-selected': 'false', 'data-new': q }, [icon('add'), 'Create “' + q + '”']));
    if (!items.length) { closeTagListbox(); return; }
    tagListbox.replaceChildren.apply(tagListbox, items);
    tagListbox.hidden = false; tagInput.setAttribute('aria-expanded', 'true'); tagActive = -1;
  }
  function closeTagListbox() {
    tagListbox.hidden = true; tagListbox.replaceChildren();
    tagInput.setAttribute('aria-expanded', 'false'); tagInput.removeAttribute('aria-activedescendant'); tagActive = -1;
  }
  function moveTagActive(d) {
    var opts = $$('.tag-input-option', tagListbox); if (!opts.length) return;
    tagActive = (tagActive + d + opts.length) % opts.length;
    opts.forEach(function (o, i) { o.setAttribute('aria-selected', i === tagActive ? 'true' : 'false'); });
    tagInput.setAttribute('aria-activedescendant', opts[tagActive].id);
    opts[tagActive].scrollIntoView({ block: 'nearest' });
  }
  function commitTagOption(opt) { addTag(opt.getAttribute('data-new') != null ? opt.getAttribute('data-new') : opt.getAttribute('data-tag')); }
  tagInput.addEventListener('input', openTagListbox);
  tagInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (tagListbox.hidden) openTagListbox(); else moveTagActive(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveTagActive(-1); }
    else if (e.key === 'Enter') {
      e.preventDefault();   // never submit the parent form
      var opts = $$('.tag-input-option', tagListbox);
      if (!tagListbox.hidden && tagActive > -1 && opts[tagActive]) commitTagOption(opts[tagActive]);
      else if (tagInput.value.trim()) addTag(tagInput.value);
    } else if (e.key === 'Escape') { if (!tagListbox.hidden) { e.preventDefault(); closeTagListbox(); } }
    else if (e.key === 'Backspace' && !tagInput.value && formTags.length) { removeTag(formTags[formTags.length - 1]); }
  });
  tagListbox.addEventListener('click', function (e) {
    var opt = e.target.closest('.tag-input-option'); if (opt) commitTagOption(opt);
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#gm-f-tags') && !e.target.closest('#gm-f-tag-listbox')) closeTagListbox();
  });

  function buildEditRsvpPills(gst) {
    var wrap = $('#gm-f-rsvp');
    wrap.replaceChildren.apply(wrap, Object.keys(STATUSES).map(function (k) {
      var s = STATUSES[k], on = gst.status === k;
      return el('button', {
        type: 'button', role: 'radio',
        class: 'radio-pill radio-pill--' + k + (on ? ' is-checked' : ''),
        'aria-checked': on ? 'true' : 'false', tabindex: on ? '0' : '-1', 'data-rsvp': k
      }, [icon(s.icon, 'icon-fill'), s.label]);
    }));
  }
  function buildInviteState(gst) {
    var wrap = $('#gm-f-invite');
    var btn = el('button', { type: 'button', class: 'gm-resend', 'data-gm-resend': '' }, [
      icon(gst.invited ? 'refresh' : 'send'), gst.invited ? 'Resend' : 'Send invite'
    ]);
    wrap.replaceChildren(el('span', { text: gst.invited ? 'Invitation sent · WhatsApp' : 'Not invited yet' }), btn);
  }
  $('#gm-f-rsvp').addEventListener('click', function (e) {
    var pill = e.target.closest('[data-rsvp]');
    if (!pill) return;
    $$('.radio-pill', this).forEach(function (p) {
      var on = p === pill;
      p.classList.toggle('is-checked', on);
      p.setAttribute('aria-checked', on ? 'true' : 'false');
      p.tabIndex = on ? 0 : -1;
    });
  });

  function clearErr() {
    $('#gm-err-name').hidden = true; $('#gm-err-phone').hidden = true;
    $('#gm-f-name').removeAttribute('aria-invalid'); $('#gm-f-phone').removeAttribute('aria-invalid');
  }

  guestForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearErr();
    var name = $('#gm-f-name').value.trim();
    var phone = $('#gm-f-phone').value.replace(/\D/g, '');
    var email = $('#gm-f-email').value.trim();
    var bad = false;
    if (phone.length !== 10) { $('#gm-err-phone').hidden = false; $('#gm-f-phone').setAttribute('aria-invalid', 'true'); $('#gm-f-phone').focus(); bad = true; }
    if (!name) { $('#gm-err-name').hidden = false; $('#gm-f-name').setAttribute('aria-invalid', 'true'); $('#gm-f-name').focus(); bad = true; }
    if (bad) return;

    var funcs = $$('#gm-f-functions input:checked').map(function (i) { return i.value; });
    var tags = formTags.slice();
    if (editingId) {
      var gst = byId(editingId);
      gst.name = name; gst.phone = phone; gst.email = email;
      gst.subEvents = funcs; gst.tags = tags;
      var picked = $('#gm-f-rsvp .radio-pill[aria-checked="true"]');
      if (picked) gst.status = picked.getAttribute('data-rsvp');
      toast('GUEST UPDATED');
    } else {
      guests.push(g(name, phone, email, 'pending', false, funcs, tags));
      toast('GUEST ADDED');
    }
    window.evenzi.closeModal('gm-guest-modal');
    render();
  });

  $$('[data-gm-add]').forEach(function (b) { b.addEventListener('click', function () { openGuestModal(null); }); });
  $$('[data-gm-open]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.disabled) return;
      var target = b.getAttribute('data-gm-open');
      if (target === 'gm-send-modal') { sendMode = 'all'; prepSend(); }
      window.evenzi.openModal(target);
    });
  });
  listEl.addEventListener('click', function (e) {
    if (selecting) { var row = e.target.closest('.guest-row'); if (row) toggleSelect(row); return; }
    var sw = e.target.closest('[data-swipe]');
    if (sw) {
      var sgid = +sw.closest('.guest-row').getAttribute('data-id'), act = sw.getAttribute('data-swipe');
      if (act === 'rsvp') openSetter(sw);
      else if (act === 'assign') openAssignForGuest(sgid, sw);
      else if (act === 'send') { byId(sgid).invited = true; toast('INVITE SENT'); render(); }
      return;
    }
    var ed = e.target.closest('[data-gm-edit]');
    if (ed) { openGuestModal(ed.closest('.guest-row').getAttribute('data-id')); return; }
    var rs = e.target.closest('[data-gm-setrsvp]');
    if (rs) openSetter(rs);
  });
  $('#gm-f-invite').addEventListener('click', function (e) {
    if (!e.target.closest('[data-gm-resend]')) return;
    var gst = byId(editingId); if (!gst) return;
    gst.invited = true;
    toast('INVITE SENT');
    window.evenzi.closeModal('gm-guest-modal');
    render();
  });

  /* ════════════════ Remove ════════════════ */
  $('#gm-f-remove').addEventListener('click', function () {
    var gst = byId(editingId); if (!gst) return;
    $('#gm-remove-name').textContent = gst.name;
    window.evenzi.openModal('gm-remove-modal');
  });
  $('#gm-remove-confirm').addEventListener('click', function () {
    if (editingId != null) {
      guests = guests.filter(function (gg) { return gg.id !== editingId; });
      toast('GUEST REMOVED');
    }
    window.evenzi.closeModal('gm-remove-modal');
    window.evenzi.closeModal('gm-guest-modal');
    editingId = null;
    render();
  });

  /* ════════════════ Send invitations ════════════════ */
  var sendMode = 'all';   // 'all' (uninvited) | 'selected' (bulk)
  function prepSend() {
    var n = sendMode === 'selected' ? selectedIds().length : uninvitedCount();
    $('#gm-send-count-line').textContent = (n === 1 ? '1 guest' : n + ' guests') + ' will be invited';
  }
  $('#gm-send-confirm').addEventListener('click', function () {
    if (sendMode === 'selected') {
      var ids = selectedIds(); ids.forEach(function (id) { byId(id).invited = true; });
      window.evenzi.closeModal('gm-send-modal'); exitSelect();
      toast('INVITED ' + ids.length + ' GUESTS'); render();
    } else {
      var n = uninvitedCount();
      guests.forEach(function (gg) { gg.invited = true; });
      window.evenzi.closeModal('gm-send-modal');
      toast(n > 0 ? 'INVITATIONS SENT' : 'EVERYONE INVITED'); render();
    }
  });

  /* ════════════════ CSV import (simulated) ════════════════ */
  var importFile = null;
  var dropzone = $('#gm-dropzone');
  var fileInput = $('#gm-file');
  dropzone.addEventListener('click', function () { fileInput.click(); });
  dropzone.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
  dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('is-dragover'); });
  dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('is-dragover'); });
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault(); dropzone.classList.remove('is-dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', function () { if (fileInput.files[0]) handleFile(fileInput.files[0]); });

  function handleFile(file) {
    var errEl = $('#gm-import-error'), resEl = $('#gm-import-result');
    errEl.hidden = true; resEl.hidden = true;
    var isCsv = /\.csv$/i.test(file.name) || file.type === 'text/csv';
    if (!isCsv) return importError('That doesn’t look like a CSV. Export your sheet as .csv and try again.');
    if (file.size > 5 * 1024 * 1024) return importError('That file is over 5 MB. Trim it and try again.');
    importFile = file;
    $('#gm-dropzone-title').textContent = file.name;
    $('#gm-dropzone-hint').textContent = 'Ready to import · tap to choose a different file';
    // sim: N new guests will be added; some rows skipped as duplicates (informational)
    var added = IMPORT_NAMES.length, skipped = 2;
    resEl.hidden = false;
    resEl.replaceChildren(icon('task_alt'),
      added + ' new guests' + (skipped ? ' · ' + skipped + ' duplicates skipped' : ''));
    importFile.parsed = added;
    syncImportBtn();
  }
  function importError(msg) {
    importFile = null;
    $('#gm-import-error-text').textContent = msg;
    $('#gm-import-error').hidden = false;
    $('#gm-import-result').hidden = true;
    syncImportBtn();
  }
  function syncImportBtn() {
    $('#gm-import-confirm').disabled = !(importFile && $('#gm-consent').checked);
  }
  $('#gm-consent').addEventListener('change', syncImportBtn);
  $('[data-gm-template]').addEventListener('click', function (e) { e.preventDefault(); toast('TEMPLATE DOWNLOADED'); });
  $('#gm-import-confirm').addEventListener('click', function () {
    var n = (importFile && importFile.parsed) || 0;
    for (var i = 0; i < n && i < IMPORT_NAMES.length; i++) guests.push(g(IMPORT_NAMES[i], '90000000' + (10 + i), '', 'pending', false));
    window.evenzi.closeModal('gm-import-modal');
    toast(n + ' GUESTS IMPORTED');
    importFile = null; fileInput.value = ''; $('#gm-consent').checked = false;
    $('#gm-dropzone-title').textContent = 'Tap to choose a CSV file';
    $('#gm-dropzone-hint').textContent = 'or drag it here · max 5 MB';
    $('#gm-import-result').hidden = true; syncImportBtn();
    render();
  });

  /* ════════════════ Generic picker (sheet <480 / popover ≥480) ═════════
     Reused by the manual-RSVP setter and the Sort control. cfg:
       { anchor, ariaLabel, title:[nodes], options:[{value,label,icon}],
         current, onPick(value), refocus?():Element } */
  var pickerEl = null, pickerScrim = null, pickerTrigger = null, pickerCfg = null;

  function openPicker(cfg) {
    teardownPicker();
    pickerTrigger = cfg.anchor; pickerCfg = cfg;
    cfg.anchor.setAttribute('aria-expanded', 'true');

    pickerScrim = el('div', { class: 'gm-setter-scrim' });
    pickerScrim.addEventListener('click', closePicker);

    var title = el('p', { class: 'gm-setter-title' }, cfg.title);
    var curSet = cfg.multi ? (cfg.current || []).slice() : null;
    var menuKids = [], lastGroup = null;
    cfg.options.forEach(function (o) {
      if (o.group && o.group !== lastGroup) { lastGroup = o.group; menuKids.push(el('p', { class: 'gm-setter-group' }, o.group)); }
      var on = cfg.multi ? curSet.indexOf(o.value) > -1 : (o.value === cfg.current);
      var kids = [];
      if (o.icon) kids.push(icon(o.icon, 'icon-fill'));
      kids.push(o.label);
      kids.push(icon('check', 'gm-setter-check'));
      menuKids.push(el('button', {
        type: 'button', class: 'gm-setter-opt', role: cfg.multi ? 'menuitemcheckbox' : 'menuitemradio', 'data-val': o.value,
        'aria-checked': on ? 'true' : 'false', tabindex: cfg.multi ? '0' : (on ? '0' : '-1')
      }, kids));
    });
    var menu = el('div', { class: 'gm-setter-opts', role: 'menu', 'aria-label': cfg.ariaLabel }, menuKids);
    var children = [title, menu];
    if (cfg.multi) {
      children.push(el('div', { class: 'gm-setter-foot' }, [
        el('button', { type: 'button', class: 'gm-setter-clear', 'data-picker-clear': '' }, 'Clear'),
        el('button', { type: 'button', class: 'btn-pill btn-pill-primary gm-setter-apply', 'data-picker-apply': '' }, 'Apply')
      ]));
    }
    pickerEl = el('div', { class: 'gm-setter' + (cfg.multi ? ' gm-setter-multi' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': cfg.ariaLabel }, children);

    document.body.appendChild(pickerScrim);
    document.body.appendChild(pickerEl);
    positionPicker();

    pickerEl.addEventListener('click', onPickerClick);
    pickerEl.addEventListener('keydown', onPickerKey);
    document.addEventListener('keydown', onPickerEsc, true);
    window.addEventListener('resize', positionPicker);
    window.addEventListener('scroll', positionPicker, true);

    var checked = pickerEl.querySelector('[aria-checked="true"]') || pickerEl.querySelector('.gm-setter-opt');
    if (checked) checked.focus();
  }

  function positionPicker() {
    if (!pickerEl || !pickerTrigger) return;
    if (window.innerWidth < 480) { pickerEl.style.top = ''; pickerEl.style.left = ''; return; }
    var r = pickerTrigger.getBoundingClientRect();
    var w = pickerEl.offsetWidth || 280;
    var left = Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8);
    var top = r.bottom + 6;
    var h = pickerEl.offsetHeight || 240;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
    pickerEl.style.left = left + 'px';
    pickerEl.style.top = top + 'px';
  }
  function onPickerClick(e) {
    if (pickerCfg && pickerCfg.multi) {
      if (e.target.closest('[data-picker-apply]')) { commitMulti(); return; }
      if (e.target.closest('[data-picker-clear]')) { $$('.gm-setter-opt', pickerEl).forEach(function (o) { o.setAttribute('aria-checked', 'false'); }); return; }
      var mo = e.target.closest('.gm-setter-opt');
      if (mo) mo.setAttribute('aria-checked', mo.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
      return;
    }
    var opt = e.target.closest('[data-val]');
    if (opt) commitPick(opt.getAttribute('data-val'));
  }
  function onPickerKey(e) {
    // multi: native Enter/Space toggles the focused option-button; just trap Tab inside the dialog
    if (pickerCfg && pickerCfg.multi) {
      if (e.key !== 'Tab') return;
      var f = $$('button', pickerEl); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    var opts = $$('.gm-setter-opt', pickerEl);
    var i = opts.indexOf(document.activeElement);
    function move(n) { n = (n + opts.length) % opts.length; opts.forEach(function (o, k) { o.tabIndex = k === n ? 0 : -1; }); opts[n].focus(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); move(i + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(i - 1); }
    else if (e.key === 'Tab') { e.preventDefault(); move(e.shiftKey ? i - 1 : i + 1); }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      var cur = document.activeElement;
      if (cur && cur.getAttribute('data-val')) commitPick(cur.getAttribute('data-val'));
    }
  }
  function commitMulti() {
    var vals = $$('.gm-setter-opt[aria-checked="true"]', pickerEl).map(function (o) { return o.getAttribute('data-val'); });
    var cfg = pickerCfg, trigger = pickerTrigger;
    teardownPicker(); pickerTrigger = pickerCfg = null;
    if (cfg && cfg.onApply) cfg.onApply(vals);
    if (trigger && document.contains(trigger)) { trigger.setAttribute('aria-expanded', 'false'); trigger.focus(); }
  }
  function onPickerEsc(e) { if (e.key === 'Escape') { e.preventDefault(); closePicker(); } }

  function teardownPicker() {
    if (!pickerEl) return;
    document.removeEventListener('keydown', onPickerEsc, true);
    window.removeEventListener('resize', positionPicker);
    window.removeEventListener('scroll', positionPicker, true);
    if (pickerScrim) pickerScrim.remove();
    pickerEl.remove();
    pickerEl = pickerScrim = null;
  }
  function commitPick(val) {
    var cfg = pickerCfg, trigger = pickerTrigger;
    teardownPicker(); pickerTrigger = pickerCfg = null;
    if (cfg && cfg.onPick) cfg.onPick(val);            // may re-render the list
    var t = (cfg && cfg.refocus) ? cfg.refocus() : (document.contains(trigger) ? trigger : null);
    if (t) { t.setAttribute('aria-expanded', 'false'); t.focus(); }
  }
  function closePicker() {
    if (!pickerEl) return;
    var trigger = pickerTrigger;
    teardownPicker(); pickerTrigger = pickerCfg = null;
    if (trigger && document.contains(trigger)) { trigger.setAttribute('aria-expanded', 'false'); trigger.focus(); }
  }

  /* RSVP setter — thin wrapper over openPicker */
  function openSetter(badge) {
    var gid = +badge.closest('.guest-row').getAttribute('data-id');
    var gst = byId(gid);
    openPicker({
      anchor: badge,
      ariaLabel: 'Set RSVP for ' + gst.name,
      title: [document.createTextNode('RSVP for '), el('strong', { text: gst.name })],
      options: Object.keys(STATUSES).map(function (k) { return { value: k, label: STATUSES[k].label, icon: STATUSES[k].icon }; }),
      current: gst.status,
      onPick: function (val) { applyRsvp(gid, val); },
      refocus: function () { var row = rowEl(gid); return row && row.querySelector('.guest-row-rsvp'); }
    });
  }

  /* Sort control — thin wrapper over openPicker (replaces the native <select>) */
  var SORTS = [
    { value: 'name', label: 'Name A–Z' },
    { value: 'recent', label: 'Recently added' },
    { value: 'status', label: 'Status · needs attention' }
  ];
  function updateSortLabel() {
    var l = $('.gm-sort-label'); if (!l) return;
    var s = SORTS.filter(function (o) { return o.value === state.sort; })[0];
    l.textContent = s ? s.label : '';
  }
  function openSortSheet(btn) {
    openPicker({
      anchor: btn, ariaLabel: 'Sort guests', title: ['Sort by'],
      options: SORTS, current: state.sort,
      onPick: function (val) { state.sort = val; updateSortLabel(); render(); }
    });
  }

  /* Filter by function + tag — multi-select picker */
  function openFilterPicker(btn) {
    var options = EVENT_SUBEVENTS.map(function (se) { return { value: 'se:' + se.id, label: se.label, group: 'Functions' }; })
      .concat(TAGS.map(function (t) { return { value: 'tag:' + t, label: t, group: 'Tags' }; }));
    var current = state.subFilters.map(function (s) { return 'se:' + s; }).concat(state.tagFilters.map(function (t) { return 'tag:' + t; }));
    openPicker({
      anchor: btn, ariaLabel: 'Filter by function or tag', title: ['Filter'], multi: true,
      options: options, current: current,
      onApply: function (vals) {
        state.subFilters = vals.filter(function (v) { return v.indexOf('se:') === 0; }).map(function (v) { return v.slice(3); });
        state.tagFilters = vals.filter(function (v) { return v.indexOf('tag:') === 0; }).map(function (v) { return v.slice(4); });
        updateFilterBadge(); render();
      }
    });
  }
  function updateFilterBadge() {
    var n = state.subFilters.length + state.tagFilters.length;
    var badge = $('[data-gm-filter-count]'); badge.textContent = n; badge.hidden = n === 0;
    $('.gm-filter-btn').classList.toggle('is-active', n > 0);
  }
  $('[data-gm-filter-btn]').addEventListener('click', function () { openFilterPicker(this); });

  /* Assign functions to a single guest (swipe-rail "Assign") — pre-fills current */
  function openAssignForGuest(gid, anchor) {
    var gst = byId(gid);
    openPicker({
      anchor: anchor, ariaLabel: 'Functions for ' + gst.name, title: ['Invited to functions'], multi: true,
      options: EVENT_SUBEVENTS.map(function (se) { return { value: se.id, label: se.label }; }),
      current: gst.subEvents.slice(),
      onApply: function (vals) { gst.subEvents = vals.slice(); toast('FUNCTIONS UPDATED'); render(); }
    });
  }

  /* ════════════════ Selection mode + bulk actions ════════════════ */
  var selecting = false, selected = {};
  var listCard = $('.gm-list-card');
  function selectedIds() { return Object.keys(selected).map(Number); }
  function enterSelect() {
    selecting = true; selected = {};
    listCard.classList.add('is-selecting');
    $('#gm-bulkbar').hidden = false;
    var fab = $('.gm-add-fab'); if (fab) fab.hidden = true;   // clear the bottom bar's space
    render();                         // rebuild rows with checkbox semantics
    updateBulkBar();
    if (liveEl) liveEl.textContent = 'Selection mode on. Choose guests, then pick a bulk action.';
    var firstBtn = listEl.querySelector('.guest-row .guest-row-id');
    if (firstBtn) firstBtn.focus();
  }
  function exitSelect() {
    selecting = false; selected = {};
    listCard.classList.remove('is-selecting');
    $('#gm-bulkbar').hidden = true;
    var fab = $('.gm-add-fab'); if (fab) fab.hidden = false;
    render();
    $('[data-gm-select-mode]').focus();
  }
  function toggleSelect(row) {
    var id = +row.getAttribute('data-id');
    var on = !selected[id];
    if (on) selected[id] = true; else delete selected[id];
    row.classList.toggle('is-selected', on);
    var idBtn = row.querySelector('.guest-row-id');
    if (idBtn) idBtn.setAttribute('aria-checked', on ? 'true' : 'false');
    updateBulkBar();
  }
  function selectAllVisible() { visibleGuests().forEach(function (gg) { selected[gg.id] = true; }); render(); updateBulkBar(); }
  function updateBulkBar() {
    var n = selectedIds().length;
    $('[data-gm-sel-count]').textContent = n;
    $$('.gm-bulk-act').forEach(function (b) { b.disabled = n === 0; });
    var sa = $('[data-gm-select-all]');
    if (sa) { var vis = visibleGuests().length; sa.textContent = (n >= vis && vis > 0) ? 'Clear' : 'Select all'; }
  }
  $('[data-gm-select-mode]').addEventListener('click', enterSelect);
  $('[data-gm-bulk-cancel]').addEventListener('click', exitSelect);
  $('[data-gm-select-all]').addEventListener('click', function () {
    var vis = visibleGuests().length;
    if (selectedIds().length >= vis) { selected = {}; render(); updateBulkBar(); } else selectAllVisible();
  });
  $('[data-gm-bulk-tag]').addEventListener('click', function () {
    openPicker({
      anchor: this, ariaLabel: 'Add tags to selected guests', title: ['Add tags'], multi: true,
      options: TAGS.map(function (t) { return { value: t, label: t }; }), current: [],
      onApply: function (vals) {
        if (!vals.length) return;
        selectedIds().forEach(function (id) { var gg = byId(id); vals.forEach(function (t) { if (gg.tags.indexOf(t) === -1) gg.tags.push(t); }); });
        toast('TAGGED ' + selectedIds().length + ' GUESTS'); render();
      }
    });
  });
  $('[data-gm-bulk-assign]').addEventListener('click', function () {
    openPicker({
      anchor: this, ariaLabel: 'Set functions for selected guests', title: ['Set functions — replaces current'], multi: true,
      options: EVENT_SUBEVENTS.map(function (se) { return { value: se.id, label: se.label }; }), current: [],
      onApply: function (vals) {
        var n = selectedIds().length;
        selectedIds().forEach(function (id) { byId(id).subEvents = vals.slice(); });
        toast(vals.length ? 'SET ' + n + ' GUESTS TO ' + vals.length + ' FUNCTIONS' : 'CLEARED FUNCTIONS FOR ' + n + ' GUESTS'); render();
      }
    });
  });
  $('[data-gm-bulk-send]').addEventListener('click', function () {
    sendMode = 'selected'; prepSend(); window.evenzi.openModal('gm-send-modal');   // confirm before a bulk WhatsApp blast
  });

  /* Zero-assigned banner */
  function updateUnassignedBanner() {
    var n = guests.filter(function (gg) { return (gg.subEvents || []).length === 0; }).length;
    $('[data-gm-unassigned-count]').textContent = n;   // content change drives the role=status announcement
    $('#gm-unassigned-banner').classList.toggle('is-hidden', n === 0);
  }
  $('[data-gm-review-unassigned]').addEventListener('click', function () {
    state.onlyUnassigned = !state.onlyUnassigned;
    this.textContent = state.onlyUnassigned ? 'Show all' : 'Review';
    render();
  });

  /* ════════════════ Tag manager ════════════════ */
  function tagCount(name) { return guests.filter(function (gg) { return gg.tags.indexOf(name) > -1; }).length; }
  function buildTagmanList() {
    var ul = $('#gm-tagman-list');
    if (!TAGS.length) { ul.replaceChildren(el('li', { class: 'gm-tagman-empty', text: 'No tags yet.' })); return; }
    ul.replaceChildren.apply(ul, TAGS.slice().sort(function (a, b) { return a.localeCompare(b); }).map(function (t) {
      var n = tagCount(t);
      return el('li', { class: 'gm-tagman-row', 'data-tag': t }, [
        el('span', { class: 'gm-tagman-name', text: t }),
        el('span', { class: 'gm-tagman-count', text: n + (n === 1 ? ' guest' : ' guests') }),
        el('button', { type: 'button', class: 'gm-tagman-del', 'data-tagman-del': t, 'aria-label': 'Remove tag ' + t }, icon('delete'))
      ]);
    }));
  }
  function openTagManager() { buildTagmanList(); $('#gm-tagman-input').value = ''; window.evenzi.openModal('gm-tags-modal'); }
  $$('[data-gm-manage-tags]').forEach(function (b) { b.addEventListener('click', openTagManager); });
  function tagmanAdd() {
    var inp = $('#gm-tagman-input'), name = inp.value.trim(); if (!name) return;
    if (!TAGS.some(function (t) { return t.toLowerCase() === name.toLowerCase(); })) { TAGS.push(name); toast('TAG CREATED'); }
    inp.value = ''; buildTagmanList(); inp.focus();
  }
  $('[data-gm-tagman-add]').addEventListener('click', tagmanAdd);
  $('#gm-tagman-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); tagmanAdd(); } });
  $('#gm-tagman-list').addEventListener('click', function (e) {
    var del = e.target.closest('[data-tagman-del]'); if (del) { showTagmanConfirm(del.closest('.gm-tagman-row'), del.getAttribute('data-tagman-del')); return; }
    if (e.target.closest('[data-tagman-cancel]')) { buildTagmanList(); return; }
    var conf = e.target.closest('[data-tagman-confirm]'); if (conf) deleteTag(conf.getAttribute('data-tagman-confirm'));
  });
  function showTagmanConfirm(row, name) {
    var n = tagCount(name);
    row.replaceChildren(el('div', { class: 'gm-tagman-confirm' }, [
      el('span', { class: 'gm-tagman-c-msg', text: 'Remove “' + name + '”' + (n ? ' from ' + n + ' guest' + (n === 1 ? '' : 's') : '') + '? They keep their other tags.' }),
      el('button', { type: 'button', class: 'gm-tagman-c-cancel', 'data-tagman-cancel': '' }, 'Cancel'),
      el('button', { type: 'button', class: 'gm-tagman-c-del', 'data-tagman-confirm': name }, 'Remove')
    ]));
  }
  function deleteTag(name) {
    TAGS = TAGS.filter(function (t) { return t !== name; });
    guests.forEach(function (gg) { gg.tags = gg.tags.filter(function (t) { return t !== name; }); });
    state.tagFilters = state.tagFilters.filter(function (t) { return t !== name; });
    updateFilterBadge(); toast('TAG REMOVED'); buildTagmanList(); render();
  }

  /* optimistic update with simulated failure + rollback */
  function applyRsvp(id, status) {
    var gst = byId(id); if (!gst || gst.status === status) return;
    var prev = gst.status;
    gst.status = status;
    render();
    flashRow(id, 'gm-flash-ok');
    if (window.__gmForceFail) {
      setTimeout(function () {
        gst.status = prev; render();
        flashRow(id, 'gm-flash-err');
        toast('COULDN’T UPDATE — TAP TO RETRY');
      }, 600);
    } else {
      toast('RSVP UPDATED · ' + STATUSES[status].label);
    }
  }
  function flashRow(id, cls) {
    var el2 = rowEl(id); if (!el2) return;
    el2.classList.add(cls);
    setTimeout(function () { if (el2) el2.classList.remove(cls); }, 900);
  }

  /* ════════════════ Offline banner (demo) ════════════════ */
  var offlineEl = $('#gm-offline');
  function syncOnline() { offlineEl.hidden = navigator.onLine; }
  window.addEventListener('online', syncOnline);
  window.addEventListener('offline', syncOnline);

  /* ════════════════ boot ════════════════ */
  setTimeout(function () {
    if (skeletonEl) skeletonEl.hidden = true;
    render();
    listEl.setAttribute('aria-busy', 'false');
    syncOnline();
  }, 450);
})();
