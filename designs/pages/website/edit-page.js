/* ════════════════════════════════════════════════════════════════════
   Evenzi · Website · Edit Pages — per-page section editor (page JS)
   Owner: designs/pages/website/edit-page.*

   Loaded only on edit-page.html (guarded by [data-wb-page="edit"]).
   Builds on shell.js (modal controller, toast, clock) + website.js
   (device-toggle + cross-cutting modals).

   A small section-editor engine:
   - SECTION_TYPES registry — 11 types, each with editor(fields) + render(preview)
   - Seed page loaded by ?page=<id> (+ sessionStorage fallback)
   - .dp-section-block per section: reorder ▲▼ · visibility · delete · collapse
   - Add-section picker (single-select, hardened radiogroup a11y, no filters)
   - Live preview rebuilt from visible sections, in the page palette/font
   - Field-blur autosave → live preview (SYNCED clock is the saved signal)

   All DOM built via el() — no innerHTML (XSS-safe for host-typed content).
   ════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';
  if (document.body.dataset.wbPage !== 'edit') return;

  /* ── DOM builder ───────────────────────────────────────────────── */
  function el(tag, opts) {
    var e = document.createElement(tag);
    opts = opts || {};
    if (opts.cls) e.className = opts.cls;
    if (opts.text != null) e.textContent = opts.text;
    if (opts.attrs) Object.keys(opts.attrs).forEach(function (k) { e.setAttribute(k, opts.attrs[k]); });
    if (opts.kids) opts.kids.forEach(function (k) { if (k) e.appendChild(k); });
    return e;
  }
  function icon(name) { return el('span', { cls: 'material-symbols-outlined', text: name, attrs: { 'aria-hidden': 'true' } }); }
  function iconBtn(glyph, attrs) { return el('button', { cls: 'dp-icon-btn-sm', attrs: Object.assign({ type: 'button' }, attrs), kids: [icon(glyph)] }); }

  function toast(msg) { if (window.evenzi && window.evenzi.showToast) window.evenzi.showToast(msg); }

  /* sr-only live region for reorder announcements (P1-3). */
  var liveRegion = el('div', { cls: 'sr-only', attrs: { 'aria-live': 'polite', role: 'status' } });
  document.body.appendChild(liveRegion);
  function announce(msg) { liveRegion.textContent = ''; liveRegion.textContent = msg; }

  /* ── Field helpers (reuse shell .form-*) ───────────────────────── */
  function fieldLabel(t, forId) { return el('label', { cls: 'ep-field-label', text: t, attrs: forId ? { 'for': forId } : {} }); }
  function textInput(val, ph, oninput) {
    var i = el('input', { cls: 'form-input', attrs: { type: 'text', placeholder: ph || '' } });
    i.value = val || '';
    i.addEventListener('input', function () { oninput(i.value); });
    return i;
  }
  function textArea(val, ph, oninput) {
    var t = el('textarea', { cls: 'form-input', attrs: { rows: '3', placeholder: ph || '' } });
    t.value = val || '';
    t.addEventListener('input', function () { oninput(t.value); });
    return t;
  }
  function labeled(labelText, control) { return el('div', { kids: [fieldLabel(labelText), control] }); }
  function imgSlot(label) {
    return el('button', { cls: 'ep-img-slot', attrs: { type: 'button' }, kids: [icon('add_photo_alternate'), el('span', { text: label || 'Add photo' })] });
  }
  function toggleRow(labelText, on, onchange) {
    var sw = el('button', { cls: 'toggle-switch', attrs: { type: 'button', role: 'switch', 'aria-checked': on ? 'true' : 'false', 'aria-label': labelText } , kids: [el('span', { cls: 'toggle-switch-thumb', attrs: { 'aria-hidden': 'true' } })] });
    /* shell.js owns the aria-checked flip for BOTH click and Space/Enter
       (and preventDefaults Space, which suppresses the native click). Observe
       aria-checked directly so we catch the change however it was triggered. */
    new MutationObserver(function () { onchange(sw.getAttribute('aria-checked') === 'true'); })
      .observe(sw, { attributes: true, attributeFilter: ['aria-checked'] });
    return el('div', { cls: 'ep-toggle-row', kids: [el('span', { text: labelText }), sw] });
  }
  function selectInput(val, options, onchange) {
    var wrap = el('div', { cls: 'form-select' });
    var sel = el('select');
    options.forEach(function (o) {
      var opt = el('option', { text: o, attrs: { value: o } });
      if (o === val) opt.setAttribute('selected', 'selected');
      sel.appendChild(opt);
    });
    sel.addEventListener('change', function () { onchange(sel.value); });
    wrap.appendChild(sel);
    return wrap;
  }

  /* ════════════════════════════════════════════════════════════════
     SECTION TYPE REGISTRY — editor(data, ch) → [field nodes]
                             render(data)    → preview node
     ════════════════════════════════════════════════════════════════ */
  var SECTION_TYPES = {
    heading: {
      name: 'Heading + paragraph', icon: 'title', blank: { heading: '', body: '', twocol: false },
      editor: function (d, ch) {
        return [
          labeled('Heading', textInput(d.heading, 'Section heading', function (v) { d.heading = v; ch(); })),
          labeled('Paragraph', textArea(d.body, 'Body text', function (v) { d.body = v; ch(); })),
          toggleRow('Two-column layout', d.twocol, function (on) { d.twocol = on; ch(); })
        ];
      },
      render: function (d) {
        var kids = [];
        if (d.heading) kids.push(el('p', { cls: 'epv-heading', text: d.heading }));
        if (d.body) kids.push(el('p', { cls: 'epv-paragraph' + (d.twocol ? ' epv-twocol' : ''), text: d.body }));
        if (!kids.length) kids.push(el('p', { cls: 'epv-paragraph', text: 'Heading + paragraph' }));
        return el('div', { cls: 'epv-section', kids: kids });
      }
    },
    photo: {
      name: 'Photo', icon: 'image', blank: {},
      editor: function () { return [labeled('Photo', imgSlot('Add a photo'))]; },
      render: function () { return el('div', { cls: 'epv-section', kids: [el('div', { cls: 'epv-photo', kids: [icon('image')] })] }); }
    },
    photogrid: {
      name: 'Photo grid', icon: 'grid_view', blank: { count: 4 },
      editor: function (d, ch) {
        var grid = el('div', { cls: 'ep-img-grid' });
        for (var i = 0; i < (d.count || 4); i++) grid.appendChild(imgSlot('Photo ' + (i + 1)));
        return [labeled('Photos (2–4)', grid)];
      },
      render: function (d) {
        var grid = el('div', { cls: 'epv-photogrid' });
        for (var i = 0; i < (d.count || 4); i++) grid.appendChild(el('div', { cls: 'epv-photo', kids: [icon('image')] }));
        return el('div', { cls: 'epv-section', kids: [grid] });
      }
    },
    schedule: {
      name: 'Schedule item', icon: 'event', blank: { name: '', date: '', time: '', venue: '', dress: '', note: '' },
      editor: function (d, ch) {
        return [
          labeled('Event name', textInput(d.name, 'e.g. Mehendi', function (v) { d.name = v; ch(); })),
          el('div', { cls: 'dp-section-row', kids: [
            labeled('Date', textInput(d.date, '14 Feb 2026', function (v) { d.date = v; ch(); })),
            labeled('Time', textInput(d.time, '7:00 PM', function (v) { d.time = v; ch(); }))
          ] }),
          labeled('Venue', textInput(d.venue, 'Venue name', function (v) { d.venue = v; ch(); })),
          el('div', { cls: 'dp-section-row', kids: [
            labeled('Dress code', textInput(d.dress, 'e.g. Traditional', function (v) { d.dress = v; ch(); })),
            labeled('Note', textInput(d.note, 'Optional', function (v) { d.note = v; ch(); }))
          ] })
        ];
      },
      render: function (d) {
        var meta = [];
        if (d.date || d.time) meta.push(el('span', { text: [d.date, d.time].filter(Boolean).join(' · ') }));
        if (d.venue) meta.push(el('span', { text: d.venue }));
        if (d.dress) meta.push(el('span', { text: 'Dress: ' + d.dress }));
        return el('div', { cls: 'epv-section', kids: [el('div', { cls: 'epv-schedule', kids: [
          el('p', { cls: 'epv-schedule-name', text: d.name || 'Sub-event' }),
          el('p', { cls: 'epv-schedule-meta', kids: meta })
        ] })] });
      }
    },
    person: {
      name: 'Person card', icon: 'person', blank: { name: '', relation: '', side: 'Bride' },
      editor: function (d, ch) {
        return [
          labeled('Photo', imgSlot('Add photo')),
          labeled('Name', textInput(d.name, 'Full name', function (v) { d.name = v; ch(); })),
          labeled('Relation', textInput(d.relation, 'e.g. Sister of the Bride', function (v) { d.relation = v; ch(); })),
          labeled('Side', selectInput(d.side, ['Bride', 'Groom', 'Both'], function (v) { d.side = v; ch(); }))
        ];
      },
      render: function (d) {
        return el('div', { cls: 'epv-section', kids: [el('div', { cls: 'epv-person', kids: [
          el('div', { cls: 'epv-person-avatar', kids: [icon('person')] }),
          el('div', { kids: [
            el('p', { cls: 'epv-person-name', text: d.name || 'Name' }),
            el('p', { cls: 'epv-person-rel', text: d.relation || 'Relation' })
          ] })
        ] })] });
      }
    },
    hotel: {
      name: 'Hotel / venue card', icon: 'hotel', blank: { name: '', distance: '', link: '' },
      editor: function (d, ch) {
        return [
          labeled('Photo', imgSlot('Add photo')),
          labeled('Name', textInput(d.name, 'Hotel / venue name', function (v) { d.name = v; ch(); })),
          labeled('Distance / note', textInput(d.distance, 'e.g. 2 km from venue', function (v) { d.distance = v; ch(); })),
          labeled('Booking / map link', textInput(d.link, 'https://…', function (v) { d.link = v; ch(); }))
        ];
      },
      render: function (d) {
        return el('div', { cls: 'epv-section', kids: [el('div', { cls: 'epv-hotel', kids: [
          el('div', { cls: 'epv-hotel-thumb', kids: [icon('hotel')] }),
          el('div', { kids: [
            el('p', { cls: 'epv-hotel-name', text: d.name || 'Hotel / venue' }),
            el('p', { cls: 'epv-hotel-meta', text: d.distance || 'Distance / booking note' })
          ] })
        ] })] });
      }
    },
    qa: {
      name: 'Q&A item', icon: 'help', blank: { q: '', a: '' },
      editor: function (d, ch) {
        return [
          labeled('Question', textInput(d.q, 'Guest question', function (v) { d.q = v; ch(); })),
          labeled('Answer', textArea(d.a, 'Your answer', function (v) { d.a = v; ch(); }))
        ];
      },
      render: function (d) {
        return el('div', { cls: 'epv-section', kids: [
          el('p', { cls: 'epv-qa-q', kids: [icon('help'), document.createTextNode(d.q || 'Question?')] }),
          el('p', { cls: 'epv-qa-a', text: d.a || 'Answer text.' })
        ] });
      }
    },
    divider: {
      name: 'Divider', icon: 'horizontal_rule', blank: {},
      editor: function () { return [el('p', { cls: 'ep-field-help', text: 'A simple horizontal rule between sections.' })]; },
      render: function () { return el('div', { cls: 'epv-section', kids: [el('hr', { cls: 'epv-divider' })] }); }
    },
    map: {
      name: 'Map embed', icon: 'map', blank: { address: '' },
      editor: function (d, ch) { return [labeled('Address / place', textInput(d.address, 'Venue address', function (v) { d.address = v; ch(); }))]; },
      render: function (d) {
        return el('div', { cls: 'epv-section', kids: [el('div', { cls: 'epv-map', kids: [icon('map'), el('span', { cls: 'epv-map-addr', text: d.address || 'Venue address' })] })] });
      }
    },
    countdown: {
      name: 'Countdown', icon: 'timer', blank: { date: '', label: 'Until we celebrate' },
      editor: function (d, ch) {
        return [
          labeled('Target date', textInput(d.date, '14 Feb 2026', function (v) { d.date = v; ch(); })),
          labeled('Label', textInput(d.label, 'Until we celebrate', function (v) { d.label = v; ch(); }))
        ];
      },
      render: function (d) {
        return el('div', { cls: 'epv-section', kids: [el('div', { cls: 'epv-countdown', kids: [
          el('p', { cls: 'epv-countdown-num', text: '268 days' }),
          el('p', { cls: 'epv-countdown-label', text: d.label || 'Until we celebrate' })
        ] })] });
      }
    },
    video: {
      name: 'Video embed', icon: 'movie', blank: { url: '' },
      editor: function (d, ch) { return [labeled('YouTube / Vimeo URL', textInput(d.url, 'https://youtube.com/…', function (v) { d.url = v; ch(); }))]; },
      render: function () { return el('div', { cls: 'epv-section', kids: [el('div', { cls: 'epv-video', kids: [icon('play_circle')] })] }); }
    }
  };
  var TYPE_ORDER = ['heading', 'photo', 'photogrid', 'schedule', 'person', 'hotel', 'qa', 'divider', 'map', 'countdown', 'video'];
  var TYPE_DESC = {
    heading: 'A title with body text.', photo: 'A single image.', photogrid: '2–4 images in a grid.',
    schedule: 'A sub-event with time + venue.', person: 'Photo, name, and relation.',
    hotel: 'Hotel/venue with a booking link.', qa: 'A question and answer.', divider: 'A line between sections.',
    map: 'An embedded location map.', countdown: 'A countdown to the big day.', video: 'A YouTube/Vimeo embed.'
  };

  /* ════════════════════════════════════════════════════════════════
     PAGE STATE + SEED
     ════════════════════════════════════════════════════════════════ */
  var SEED = {
    story: { name: 'Story', tier: 'private', sections: [
      { type: 'heading', data: { heading: 'How we met', body: 'A rainy evening in Mumbai and a shared umbrella — the rest is history.', twocol: false } },
      { type: 'photo', data: {} },
      { type: 'heading', data: { heading: 'The proposal', body: 'Two years later, on the very same street, the question finally got asked.', twocol: false } }
    ] },
    schedule: { name: 'Schedule', tier: 'private', sections: [
      { type: 'schedule', data: { name: 'Mehendi', date: '13 Feb 2026', time: '4:00 PM', venue: 'Garden Lawn', dress: 'Yellow', note: 'Lunch served' } },
      { type: 'schedule', data: { name: 'Wedding Ceremony', date: '14 Feb 2026', time: '7:00 PM', venue: 'Grand Ballroom', dress: 'Traditional', note: '' } },
      { type: 'schedule', data: { name: 'Reception', date: '15 Feb 2026', time: '8:00 PM', venue: 'Sky Terrace', dress: 'Cocktail', note: '' } }
    ] },
    'wedding-party': { name: 'Wedding Party', tier: 'private', sections: [
      { type: 'heading', data: { heading: 'The Bride’s Side', body: '', twocol: false } },
      { type: 'person', data: { name: 'Ananya', relation: 'Sister of the Bride', side: 'Bride' } },
      { type: 'person', data: { name: 'Rohan', relation: 'Brother of the Bride', side: 'Bride' } },
      { type: 'heading', data: { heading: 'The Groom’s Side', body: '', twocol: false } },
      { type: 'person', data: { name: 'Karan', relation: 'Best Man', side: 'Groom' } }
    ] }
  };
  var DEFAULT_PAGE = 'story';
  /* Display names + tier for every library page (so "Edit Venue" titles
     correctly even though only 3 pages carry seed sections). */
  var PAGE_META = {
    home: { name: 'Home', tier: 'public' }, rsvp: { name: 'RSVP', tier: 'private' },
    schedule: { name: 'Schedule', tier: 'private' }, story: { name: 'Story', tier: 'private' },
    'wedding-party': { name: 'Wedding Party', tier: 'private' }, venue: { name: 'Venue', tier: 'private' },
    travel: { name: 'Travel & Stay', tier: 'private' }, qa: { name: 'Q & A', tier: 'private' },
    gallery: { name: 'Gallery', tier: 'private' }, video: { name: 'Video', tier: 'private' }
  };
  function titleCase(s) { return String(s).replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }

  var page = null, seq = 0, saveTimer = null;
  var listEl = document.getElementById('ep-sections');
  var emptyEl = document.getElementById('ep-empty');
  var previewEl = document.getElementById('ep-preview-content');

  function getPageId() {
    var id = null;
    try { id = new URLSearchParams(location.search).get('page'); } catch (_) {}
    if (!id) { try { id = sessionStorage.getItem('epPage'); } catch (_) {} }
    return id || DEFAULT_PAGE;
  }

  function loadPage(id) {
    var seed = SEED[id];
    var meta = PAGE_META[id] || { name: titleCase(id), tier: 'private' };
    /* Tier is now host-editable per page (except Home, always Public). Restore
       a previously-set tier from sessionStorage so it persists across the flow. */
    var savedTier = null; try { savedTier = sessionStorage.getItem('epTier:' + id); } catch (_) {}
    var tier = (id === 'home') ? 'public' : (savedTier || (seed ? seed.tier : meta.tier));
    page = {
      id: id, name: seed ? seed.name : meta.name, tier: tier, visible: true,
      sections: (seed ? seed.sections : []).map(function (s) { return { uid: 's' + (++seq), type: s.type, data: Object.assign({}, s.data), hidden: false, collapsed: false }; })
    };
    document.getElementById('ep-title').textContent = 'Edit: ' + page.name;
    document.getElementById('ep-bc-page').textContent = 'EDIT · ' + page.name.toUpperCase();
    var nm = document.querySelector('.ep-meta-name'); if (nm) nm.textContent = page.name;
    setTierBadge(page.tier);
    /* Home + RSVP are mandatory — not deletable from the editor (mirror the
       Overview MANDATORY guard; plan D6). */
    var delBtn = document.querySelector('[data-ep-delete-page]');
    if (delBtn) delBtn.hidden = (id === 'home' || id === 'rsvp');
    renderList(); renderPreview();
  }

  function setTierBadge(tier) {
    var b = document.getElementById('ep-meta-tier');
    if (!b) return;
    var isPublic = tier === 'public';
    b.className = 'dp-page-tier ' + (isPublic ? 'dp-tier-public' : 'dp-tier-private');
    b.textContent = '';
    if (!isPublic) b.appendChild(icon('lock'));
    b.appendChild(document.createTextNode(isPublic ? 'Public' : 'Private'));
    if (page && page.id === 'home') {
      /* Home is the public landing — always Public, not togglable. */
      b.classList.remove('ep-tier-toggle');
      b.removeAttribute('role'); b.removeAttribute('tabindex'); b.removeAttribute('data-ep-tier-toggle');
      b.title = 'Home is always public — it’s the page guests land on';
      b.setAttribute('aria-label', 'Access tier: Public (Home is always public)');
    } else {
      /* Every other page: clickable to switch Public ↔ Private. */
      b.classList.add('ep-tier-toggle');
      b.setAttribute('role', 'button'); b.setAttribute('tabindex', '0'); b.setAttribute('data-ep-tier-toggle', '');
      b.title = 'Tap to make this page ' + (isPublic ? 'Private' : 'Public');
      b.setAttribute('aria-label', 'Page access: ' + (isPublic ? 'Public' : 'Private') + '. Activate to make ' + (isPublic ? 'Private' : 'Public') + '.');
      b.appendChild(icon('swap_horiz'));   /* affordance: this badge toggles */
    }
  }

  function flipTier() {
    if (!page || page.id === 'home') return;
    page.tier = page.tier === 'public' ? 'private' : 'public';
    setTierBadge(page.tier);
    try { sessionStorage.setItem('epTier:' + page.id, page.tier); } catch (_) {}
    var b = document.getElementById('ep-meta-tier'); if (b) b.focus();
    toast(page.name.toUpperCase() + (page.tier === 'public' ? ' IS NOW PUBLIC' : ' IS NOW PRIVATE'));
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-ep-tier-toggle]')) flipTier();
  });
  document.addEventListener('keydown', function (e) {
    if (!e.target.closest('[data-ep-tier-toggle]')) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); flipTier(); }
  });

  /* ── Autosave (debounced) — live preview is the feedback; SYNCED clock
        in the breadcrumb is the always-synced signal (no toast). ── */
  function setSaved(state) {
    var s = document.getElementById('ep-saved'); if (!s) return;
    var ic = s.querySelector('.material-symbols-outlined');
    var tx = s.querySelector('.ep-saved-txt');
    if (state === 'saving') { s.classList.add('is-saving'); if (ic) ic.textContent = 'cloud_sync'; if (tx) tx.textContent = 'Saving…'; }
    else { s.classList.remove('is-saving'); if (ic) ic.textContent = 'cloud_done'; if (tx) tx.textContent = 'Saved'; }
  }
  function scheduleSave() {
    renderPreview();
    setSaved('saving');
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { setSaved('saved'); }, 600);
  }

  /* ════════════════════════════════════════════════════════════════
     RENDER — section list (editor)
     ════════════════════════════════════════════════════════════════ */
  function renderList() {
    listEl.textContent = '';
    page.sections.forEach(function (sec, i) { listEl.appendChild(buildBlock(sec, i)); });
    var n = page.sections.length;
    if (emptyEl) emptyEl.hidden = n > 0;
    listEl.hidden = n === 0;
    /* Section-control row: count + collapse-all (hidden when no sections). */
    var countEl = document.getElementById('ep-section-count');
    if (countEl) countEl.textContent = n + (n === 1 ? ' section' : ' sections');
    var bar = document.getElementById('ep-section-bar');
    if (bar) bar.hidden = n === 0;
  }

  function buildBlock(sec, idx) {
    var def = SECTION_TYPES[sec.type];
    var bodyId = 'ep-body-' + sec.uid;

    var drag = el('button', { cls: 'dp-section-drag', attrs: { type: 'button', 'aria-disabled': 'true', title: 'Drag to reorder (keyboard ▲▼ for now)', 'aria-label': 'Reorder — use the up/down buttons' }, kids: [icon('drag_indicator')] });
    var typeLabel = el('span', { cls: 'dp-section-type', kids: [icon(def.icon), document.createTextNode(def.name)] });

    var up = iconBtn('keyboard_arrow_up', { 'aria-label': 'Move up', 'data-sec-up': '' });
    var down = iconBtn('keyboard_arrow_down', { 'aria-label': 'Move down', 'data-sec-down': '' });
    if (idx === 0) up.setAttribute('aria-disabled', 'true');
    if (idx === page.sections.length - 1) down.setAttribute('aria-disabled', 'true');
    var vis = iconBtn(sec.hidden ? 'visibility_off' : 'visibility', { 'aria-label': sec.hidden ? 'Show section' : 'Hide section', 'data-sec-vis': '' });
    var del = iconBtn('delete_outline', { 'aria-label': 'Remove section', 'data-sec-remove': '' });
    var collapse = el('button', { cls: 'dp-icon-btn-sm dp-section-collapse', attrs: { type: 'button', 'aria-label': sec.collapsed ? 'Expand section' : 'Collapse section', 'aria-expanded': sec.collapsed ? 'false' : 'true', 'aria-controls': bodyId, 'data-sec-collapse': '' }, kids: [icon('expand_more')] });

    var head = el('div', { cls: 'dp-section-head', kids: [drag, typeLabel, el('div', { cls: 'dp-section-actions', kids: [up, down, vis, del, collapse] })] });

    var body = el('div', { cls: 'dp-section-body', attrs: { id: bodyId } });
    def.editor(sec.data, scheduleSave).forEach(function (n) { body.appendChild(n); });

    var block = el('li', { cls: 'dp-section-block' + (sec.hidden ? ' is-hidden' : '') + (sec.collapsed ? ' is-collapsed' : ''), attrs: { role: 'group', 'aria-label': def.name, 'data-uid': sec.uid }, kids: [head, body] });
    return block;
  }

  function indexOfUid(uid) { for (var i = 0; i < page.sections.length; i++) if (page.sections[i].uid === uid) return i; return -1; }

  /* ════════════════════════════════════════════════════════════════
     RENDER — live preview (visible sections only)
     ════════════════════════════════════════════════════════════════ */
  function renderPreview() {
    previewEl.textContent = '';
    var visible = page.sections.filter(function (s) { return !s.hidden; });
    if (!visible.length) { previewEl.appendChild(el('p', { cls: 'epv-empty', text: 'Nothing to preview yet — add a section.' })); return; }
    visible.forEach(function (s) { previewEl.appendChild(SECTION_TYPES[s.type].render(s.data)); });
  }

  /* ════════════════════════════════════════════════════════════════
     EVENTS — reorder / visibility / collapse / delete
     ════════════════════════════════════════════════════════════════ */
  function move(uid, dir) {
    var i = indexOfUid(uid);
    var j = i + dir;
    if (i < 0 || j < 0 || j >= page.sections.length) return;
    var tmp = page.sections[i]; page.sections[i] = page.sections[j]; page.sections[j] = tmp;
    renderList(); renderPreview();
    announce(SECTION_TYPES[tmp.type].name + ' moved to position ' + (j + 1) + ' of ' + page.sections.length);
    var block = listEl.querySelector('[data-uid="' + uid + '"]');
    if (block) { var btn = block.querySelector(dir < 0 ? '[data-sec-up]' : '[data-sec-down]'); if (btn) btn.focus(); }
  }

  listEl.addEventListener('click', function (e) {
    var block = e.target.closest('.dp-section-block'); if (!block) return;
    var uid = block.getAttribute('data-uid');
    if (e.target.closest('[data-sec-up]') && e.target.closest('[aria-disabled="true"]') === null) return move(uid, -1);
    if (e.target.closest('[data-sec-down]') && e.target.closest('[aria-disabled="true"]') === null) return move(uid, 1);
    if (e.target.closest('[data-sec-vis]')) {
      var s = page.sections[indexOfUid(uid)];
      s.hidden = !s.hidden;
      renderList(); renderPreview();
      var nb = listEl.querySelector('[data-uid="' + uid + '"] [data-sec-vis]'); if (nb) nb.focus();
      toast(SECTION_TYPES[s.type].name.toUpperCase() + (s.hidden ? ' HIDDEN' : ' SHOWN'));
      return;
    }
    if (e.target.closest('[data-sec-collapse]')) {
      var sc = page.sections[indexOfUid(uid)];
      sc.collapsed = !sc.collapsed;
      block.classList.toggle('is-collapsed', sc.collapsed);
      var cb = block.querySelector('[data-sec-collapse]');
      cb.setAttribute('aria-expanded', sc.collapsed ? 'false' : 'true');
      cb.setAttribute('aria-label', sc.collapsed ? 'Expand section' : 'Collapse section');
      return;
    }
    if (e.target.closest('[data-sec-remove]')) { openRemove(uid); return; }
  });

  /* ── Section delete (cautionary confirm — reuse the shell idiom) ── */
  var pendingRemoveUid = null;
  function ensureRemoveModal() {
    if (document.getElementById('ep-removesection-confirm')) return;
    var m = el('div', { cls: 'modal-scrim', attrs: { id: 'ep-removesection-confirm', 'data-modal': '', 'aria-hidden': 'true' } });
    var card = el('div', { cls: 'modal-card lg-glass-card modal-confirm-cautionary', attrs: { role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'ep-rs-h' } });
    var close = el('button', { cls: 'modal-close', attrs: { type: 'button', 'data-modal-close': '', 'aria-label': 'Close', style: 'position:absolute;top:1rem;right:1rem' }, kids: [icon('close')] });
    var ic = el('span', { cls: 'modal-confirm-icon is-cautionary', attrs: { 'aria-hidden': 'true' }, kids: [icon('delete')] });
    var h = el('h2', { cls: 'modal-confirm-title', text: 'Remove this section?', attrs: { id: 'ep-rs-h' } });
    var p = el('p', { cls: 'modal-confirm-text', kids: [document.createTextNode('This removes '), el('strong', { attrs: { id: 'ep-rs-name' }, text: 'the section' }), document.createTextNode(' from the page. You can add it again later.')] });
    var actions = el('div', { cls: 'modal-actions', kids: [
      el('button', { cls: 'btn-pill btn-pill-secondary', attrs: { type: 'button', 'data-modal-close': '' }, text: 'Cancel' }),
      el('button', { cls: 'btn-pill btn-pill-primary', attrs: { type: 'button', 'data-ep-remove-confirm': '' }, text: 'Remove section' })
    ] });
    card.appendChild(close); card.appendChild(ic); card.appendChild(h); card.appendChild(p); card.appendChild(actions);
    m.appendChild(card); document.body.appendChild(m);
  }
  function openRemove(uid) {
    ensureRemoveModal();
    pendingRemoveUid = uid;
    var s = page.sections[indexOfUid(uid)];
    var nameEl = document.getElementById('ep-rs-name'); if (nameEl && s) nameEl.textContent = 'this ' + SECTION_TYPES[s.type].name.toLowerCase();
    if (window.evenzi) window.evenzi.openModal('ep-removesection-confirm');
  }
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-ep-remove-confirm]')) return;
    if (window.evenzi) window.evenzi.closeModal('ep-removesection-confirm');
    if (!pendingRemoveUid) return;
    var i = indexOfUid(pendingRemoveUid);
    if (i < 0) return;
    var name = SECTION_TYPES[page.sections[i].type].name;
    page.sections.splice(i, 1);
    renderList(); renderPreview();
    toast(name.toUpperCase() + ' REMOVED');
    setTimeout(function () {
      var blocks = listEl.querySelectorAll('.dp-section-block');
      var target = blocks[Math.min(i, blocks.length - 1)];
      var btn = (target && target.querySelector('[data-sec-remove]')) || document.querySelector('[data-ep-add-section]');
      if (btn) btn.focus();
    }, 60);
    pendingRemoveUid = null;
  });

  /* ── Page-level visibility + collapse-all + delete page ── */
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-ep-page-vis]')) {
      var sw = e.target.closest('[data-ep-page-vis]');
      queueMicrotask(function () {
        page.visible = sw.getAttribute('aria-checked') === 'true';
        toast(page.visible ? 'PAGE SHOWN ON WEBSITE' : 'PAGE HIDDEN FROM WEBSITE');
      });
      return;
    }
    if (e.target.closest('[data-ep-collapse-all]')) {
      var btn = e.target.closest('[data-ep-collapse-all]');
      var collapse = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', collapse ? 'true' : 'false');
      page.sections.forEach(function (s) { s.collapsed = collapse; });
      renderList();
      var lbl = btn.querySelector('[data-ep-collapse-label]'); if (lbl) lbl.textContent = collapse ? 'Expand all' : 'Collapse all';
      var gl = btn.querySelector('.material-symbols-outlined'); if (gl) gl.textContent = collapse ? 'unfold_more' : 'unfold_less';
      return;
    }
    if (e.target.closest('[data-ep-delete-page]')) {
      e.preventDefault();
      // Reuse the cross-cutting page-remove confirm from website.js if present
      var nameEl = document.getElementById('wb-removepage-name'); if (nameEl) nameEl.textContent = page.name;
      if (document.getElementById('wb-removepage-confirm') && window.evenzi) {
        epDeletePageArmed = true;
        window.evenzi.openModal('wb-removepage-confirm');
      }
      return;
    }
  });
  /* When the page-delete confirm (owned by website.js) fires while armed
     from here, navigate back to Overview. */
  var epDeletePageArmed = false;
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-wb-removepage-confirm]')) return;
    if (!epDeletePageArmed) return;
    epDeletePageArmed = false;
    setTimeout(function () { window.location.href = 'overview.html'; }, 80);
  });

  /* ════════════════════════════════════════════════════════════════
     ADD-SECTION PICKER (single-select radiogroup, no filters)
     ════════════════════════════════════════════════════════════════ */
  var addSelected = null;
  function ensureAddModal() {
    if (document.getElementById('ep-addsection-modal')) return;
    var m = el('div', { cls: 'modal-scrim', attrs: { id: 'ep-addsection-modal', 'data-modal': '', 'aria-hidden': 'true' } });
    var card = el('div', { cls: 'modal-card lg-glass-card modal-picker-grid', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ep-as-h' } });
    var head = el('header', { cls: 'modal-head', kids: [
      el('div', { cls: 'modal-head-lead', kids: [el('h2', { attrs: { id: 'ep-as-h' }, text: 'Add a section' }), el('p', { cls: 'modal-sub', text: 'Pick a section type to add to this page.' })] }),
      el('button', { cls: 'modal-close', attrs: { type: 'button', 'data-modal-close': '', 'aria-label': 'Close' }, kids: [icon('close')] })
    ] });
    var grid = el('div', { cls: 'modal-picker-body', attrs: { id: 'ep-as-grid', role: 'radiogroup', 'aria-label': 'Section type' } });
    var actions = el('div', { cls: 'modal-actions', kids: [
      el('button', { cls: 'btn-pill btn-pill-secondary', attrs: { type: 'button', 'data-modal-close': '' }, text: 'Cancel' }),
      el('button', { cls: 'btn-pill btn-pill-primary', attrs: { type: 'button', 'data-ep-addsection-confirm': '', disabled: 'disabled' }, text: 'Add section' })
    ] });
    card.appendChild(head); card.appendChild(grid); card.appendChild(actions);
    m.appendChild(card); document.body.appendChild(m);
  }
  function renderAddGrid() {
    var grid = document.getElementById('ep-as-grid'); if (!grid) return;
    grid.textContent = '';
    TYPE_ORDER.forEach(function (id, i) {
      var def = SECTION_TYPES[id];
      var did = 'ep-as-' + id + '-d';
      grid.appendChild(el('button', { cls: 'modal-picker-tile', attrs: { role: 'radio', 'aria-checked': 'false', tabindex: i === 0 ? '0' : '-1', 'aria-describedby': did, 'data-ep-section-add': id }, kids: [
        el('span', { cls: 'modal-picker-tile-icon', attrs: { 'aria-hidden': 'true' }, kids: [icon(def.icon)] }),
        el('span', { cls: 'modal-picker-tile-name', text: def.name }),
        el('span', { cls: 'modal-picker-tile-desc', attrs: { id: did }, text: TYPE_DESC[id] }),
        el('span', { cls: 'modal-picker-tile-check', attrs: { 'aria-hidden': 'true' }, kids: [icon('check_circle')] })
      ] }));
    });
    // Coming-soon Gift Registry (parked D-5)
    grid.appendChild(el('button', { cls: 'modal-picker-tile', attrs: { role: 'radio', 'aria-checked': 'false', 'aria-disabled': 'true', tabindex: '-1', 'aria-describedby': 'ep-as-reg-d' }, kids: [
      el('span', { cls: 'modal-picker-tile-icon', attrs: { 'aria-hidden': 'true' }, kids: [icon('redeem')] }),
      el('span', { cls: 'modal-picker-tile-name', text: 'Gift Registry' }),
      el('span', { cls: 'modal-picker-tile-desc', attrs: { id: 'ep-as-reg-d' }, text: 'Coming soon.' }),
      el('span', { cls: 'modal-picker-tile-flag is-added', text: 'Soon' })
    ] }));
  }
  function openAddSection() {
    ensureAddModal();
    addSelected = null;
    renderAddGrid();
    var btn = document.querySelector('[data-ep-addsection-confirm]'); if (btn) btn.disabled = true;
    if (window.evenzi) window.evenzi.openModal('ep-addsection-modal');
    setTimeout(function () { var f = document.querySelector('#ep-as-grid .modal-picker-tile:not([aria-disabled="true"])'); if (f) f.focus(); }, 110);
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-ep-add-section]')) { e.preventDefault(); openAddSection(); return; }
    var tile = e.target.closest('[data-ep-section-add]');
    if (tile) {
      document.querySelectorAll('#ep-as-grid .modal-picker-tile').forEach(function (t) {
        var sel = t === tile; t.classList.toggle('is-selected', sel); t.setAttribute('aria-checked', sel ? 'true' : 'false'); t.setAttribute('tabindex', sel ? '0' : '-1');
      });
      addSelected = tile.getAttribute('data-ep-section-add');
      var cb = document.querySelector('[data-ep-addsection-confirm]'); if (cb) cb.disabled = false;
      return;
    }
    if (e.target.closest('[data-ep-addsection-confirm]')) {
      e.preventDefault();
      if (!addSelected) return;
      var def = SECTION_TYPES[addSelected];
      var sec = { uid: 's' + (++seq), type: addSelected, data: Object.assign({}, def.blank), hidden: false, collapsed: false };
      page.sections.push(sec);
      renderList(); renderPreview();
      if (window.evenzi) window.evenzi.closeModal('ep-addsection-modal');
      toast(def.name.toUpperCase() + ' ADDED');
      setTimeout(function () {
        var block = listEl.querySelector('[data-uid="' + sec.uid + '"]');
        if (!block) return;
        var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        block.scrollIntoView({ behavior: rm ? 'auto' : 'smooth', block: 'center' });
        /* Prefer a body field; fall back to the collapse button so focus always
           lands inside the new block (Divider has no field — P1-2). */
        var inp = block.querySelector('.dp-section-body input, .dp-section-body textarea, .dp-section-body select') || block.querySelector('[data-sec-collapse]');
        if (inp) inp.focus();
      }, 80);
      return;
    }
  });
  /* Add-section tile arrow roving */
  document.addEventListener('keydown', function (e) {
    var tile = e.target.closest && e.target.closest('#ep-as-grid .modal-picker-tile');
    if (!tile) return;
    var k = e.key;
    if (k !== 'ArrowRight' && k !== 'ArrowLeft' && k !== 'ArrowDown' && k !== 'ArrowUp') return;
    e.preventDefault();
    var tiles = Array.prototype.slice.call(document.querySelectorAll('#ep-as-grid .modal-picker-tile'))
      .filter(function (t) { return t.getAttribute('aria-disabled') !== 'true'; });   /* skip "Soon" */
    var idx = tiles.indexOf(tile);
    if (idx < 0) return;
    var nx = (k === 'ArrowRight' || k === 'ArrowDown') ? (idx + 1) % tiles.length : (idx - 1 + tiles.length) % tiles.length;
    var t = tiles[nx];
    tiles.forEach(function (x) { x.setAttribute('tabindex', x === t ? '0' : '-1'); });
    t.focus();
    if (t.hasAttribute('data-ep-section-add')) t.click();
  });

  /* ════════════════════════════════════════════════════════════════
     MOBILE Edit | Preview toggle
     ════════════════════════════════════════════════════════════════ */
  var shell = document.getElementById('wb-main');
  function setView(v) {
    shell.setAttribute('data-ep-view', v);
    document.querySelectorAll('[data-ep-view-btn]').forEach(function (b) {
      var on = b.getAttribute('data-ep-view-btn') === v;
      b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); b.setAttribute('tabindex', on ? '0' : '-1');
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ep-view-btn]'); if (!b) return;
    setView(b.getAttribute('data-ep-view-btn'));
  });
  document.addEventListener('keydown', function (e) {
    var b = e.target.closest && e.target.closest('[data-ep-view-btn]'); if (!b) return;
    var k = e.key; if (k !== 'ArrowRight' && k !== 'ArrowLeft') return;
    e.preventDefault();
    var btns = Array.prototype.slice.call(document.querySelectorAll('[data-ep-view-btn]'));
    var idx = btns.indexOf(b);
    var nx = k === 'ArrowRight' ? (idx + 1) % btns.length : (idx - 1 + btns.length) % btns.length;
    btns[nx].focus(); setView(btns[nx].getAttribute('data-ep-view-btn'));
  });

  /* ── Boot ─────────────────────────────────────────────────────── */
  loadPage(getPageId());
})();
