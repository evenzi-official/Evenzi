/* Invitations — card PERSONALIZER (not a designer).
   Model (stress-tested against withjoy.com): a curated gallery of designer-LOCKED
   templates; the host edits TEXT (+ photo) INLINE on the card with a floating
   size toolbar — NO palette/font panel. "Upload your own card" is the first tile.
   Front-only. Output = card image + WhatsApp caption carrying the RSVP/site link.

   Faked in the prototype (porting notes):
   - PNG export is stubbed (real build: server Satori/Puppeteer or html2canvas+
     fonts.ready → Supabase Storage → public hosted card URL).
   - WhatsApp "share" is honest: wa.me is TEXT-ONLY, so the card downloads and the
     host attaches it; the message carries the hosted-card + RSVP link.
   - Card display fonts (Cormorant/Playfair) load from the Google CDN (aesthetic,
     not layout-critical) — vendor for export fidelity in the real build. */
(function () {
  'use strict';
  if (document.body.dataset.page !== 'invitations') return;

  /* ── event defaults (stub — real build seeds from Event CRUD; fields stay editable) ── */
  var EVENT = {
    eyebrow: 'Together with their families',
    couple: 'Anya & Kabir',
    invite: 'request the pleasure of your company at the celebration of their wedding',
    date: 'Friday, 12 June 2026',
    time: '10:30 in the morning',
    venue: 'The Leela Palace · Bengaluru',
    message: 'Reception to follow',
    rsvpUrl: 'https://evenzi.com/e/anya-kabir',
    name1: 'Anya'
  };

  /* ── curated templates (palette/font/layout LOCKED per template) ── */
  var TEMPLATES = [
    { id: 'eternal',    name: 'Eternal',    style: 'Minimal', layout: 'classic' },
    { id: 'saffron',    name: 'Saffron',    style: 'Royal',   layout: 'classic' },
    { id: 'eucalyptus', name: 'Eucalyptus', style: 'Floral',  layout: 'classic' },
    { id: 'noir',       name: 'Noir',       style: 'Modern',  layout: 'classic' },
    { id: 'rosewater',  name: 'Rosewater',  style: 'Floral',  layout: 'classic' },
    { id: 'bloom',      name: 'Bloom',      style: 'Photo',   layout: 'photo'   },
    { id: 'moments',    name: 'Moments',    style: 'Photo',   layout: 'photo'   }
  ];
  var STYLES = ['All', 'Minimal', 'Royal', 'Floral', 'Modern', 'Photo'];

  /* slot definitions in render order */
  var SLOTS = [
    { key: 'eyebrow', cls: 'inv-eyebrow', ph: 'A line above' },
    { key: 'couple',  cls: 'inv-couple',  ph: 'Couple names' },
    { key: 'invite',  cls: 'inv-invite',  ph: 'Invitation line' },
    { key: 'date',    cls: 'inv-date',    ph: 'Date' },
    { key: 'time',    cls: 'inv-time',    ph: 'Time' },
    { key: 'venue',   cls: 'inv-venue',   ph: 'Venue' },
    { key: 'message', cls: 'inv-message', ph: 'A closing line' }
  ];

  var state = {
    filter: 'All',
    tplId: null,
    data: null,        /* current card field values */
    sizes: {},         /* slot key -> 's'|'m'|'l' */
    mode: 'template',  /* 'template' | 'upload' */
    uploadSrc: null,
    photoSrc: null,
    edited: false,
    activeSlot: null
  };

  /* ── DOM helpers (no innerHTML) ── */
  function $(id) { return document.getElementById(id); }
  function el(t, c) { var n = document.createElement(t); if (c) n.className = c; return n; }
  function mi(name) { var s = el('span', 'material-symbols-outlined'); s.setAttribute('aria-hidden', 'true'); s.textContent = name; return s; }
  function toast(m, opts) { if (window.evenzi && window.evenzi.showToast) window.evenzi.showToast(m, opts); }
  function openModal(id) { if (window.evenzi && window.evenzi.openModal) window.evenzi.openModal(id); }
  function closeModal(id) { if (window.evenzi && window.evenzi.closeModal) window.evenzi.closeModal(id); }
  function tplById(id) { for (var i = 0; i < TEMPLATES.length; i++) if (TEMPLATES[i].id === id) return TEMPLATES[i]; return null; }

  /* ── build a card element (mini = gallery thumb, editable = editor) ── */
  function buildCard(tpl, data, opts) {
    opts = opts || {};
    var card = el('article', 'inv-card');
    card.setAttribute('data-tpl', tpl.id);
    card.setAttribute('data-layout', tpl.layout);

    var host = card;
    if (tpl.layout === 'photo') {
      var photo = el('div', 'inv-card-photo');
      if (opts.editable) { photo.setAttribute('data-photo-slot', ''); photo.setAttribute('role', 'button'); photo.setAttribute('tabindex', '0'); photo.setAttribute('aria-label', 'Add a photo to the card'); }
      if (opts.photoSrc) { var im = document.createElement('img'); im.src = opts.photoSrc; im.alt = ''; photo.appendChild(im); }
      else {
        var ph = el('div', 'inv-card-photo-empty'); ph.appendChild(mi('add_a_photo'));
        var pl = el('span'); pl.textContent = opts.editable ? 'Add photo' : 'Photo'; ph.appendChild(pl);
        photo.appendChild(ph);
      }
      card.appendChild(photo);
      host = el('div', 'inv-card-body');
      card.appendChild(host);
    }

    SLOTS.forEach(function (s) {
      var node = el('p', 'inv-slot ' + s.cls);
      node.setAttribute('data-slot', s.key);
      node.setAttribute('data-ph', s.ph);
      node.textContent = (data && data[s.key] != null) ? data[s.key] : '';
      if (opts.sizes && opts.sizes[s.key] === 's') node.classList.add('is-sz-s');
      if (opts.sizes && opts.sizes[s.key] === 'l') node.classList.add('is-sz-l');
      if (opts.editable) {
        node.setAttribute('contenteditable', 'plaintext-only');
        node.setAttribute('role', 'textbox');
        node.setAttribute('aria-label', 'Edit ' + s.ph);
        node.spellcheck = false;
      }
      host.appendChild(node);
      /* a hairline rule between time and venue, like a real invite */
      if (s.key === 'time') host.appendChild(el('span', 'inv-rule'));
    });
    return card;
  }

  /* ── gallery ── */
  function renderFilters() {
    var wrap = $('inv-filters'); wrap.textContent = '';
    STYLES.forEach(function (st) {
      var b = el('button', 'dp-filter-chip' + (state.filter === st ? ' is-active' : ''));
      b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', state.filter === st ? 'true' : 'false');
      b.setAttribute('data-style', st); b.textContent = st;
      wrap.appendChild(b);
    });
  }
  function renderGallery() {
    var grid = $('inv-grid'); grid.textContent = '';

    /* upload-your-own — first tile, peer to templates */
    var up = el('button', 'inv-tile inv-upload-tile'); up.type = 'button'; up.id = 'inv-upload-tile';
    up.setAttribute('aria-label', 'Upload your own card');
    var upc = el('div', 'inv-tile-card'); upc.appendChild(mi('upload'));
    var upt = el('span', 'inv-up-title'); upt.textContent = 'Upload your card';
    var ups = el('span', 'inv-up-sub'); ups.textContent = 'Already have a design? Use it as-is.';
    upc.appendChild(upt); upc.appendChild(ups); up.appendChild(upc);
    if (state.filter === 'All') grid.appendChild(up);

    TEMPLATES.filter(function (t) { return state.filter === 'All' || t.style === state.filter; })
      .forEach(function (t) {
        var tile = el('button', 'inv-tile'); tile.type = 'button';
        tile.setAttribute('data-open-tpl', t.id);
        tile.setAttribute('aria-label', 'Use the ' + t.name + ' card (' + t.style + ')');
        var holder = el('div', 'inv-tile-card');
        holder.appendChild(buildCard(t, EVENT, { editable: false }));
        var name = el('span', 'inv-tile-name'); name.textContent = t.name;
        var style = el('span', 'inv-tile-style'); style.textContent = t.style;
        name.appendChild(style);
        tile.appendChild(holder); tile.appendChild(name);
        grid.appendChild(tile);
      });
  }

  /* ── editor ── */
  function showView(view) {
    document.body.setAttribute('data-view', view);
    $('inv-gallery').hidden = view !== 'gallery';
    $('inv-editor').hidden = view !== 'editor';
    if (view === 'gallery') hideToolbar();
  }
  function openEditorTemplate(tplId) {
    var tpl = tplById(tplId); if (!tpl) return;
    state.mode = 'template'; state.tplId = tplId; state.edited = false;
    state.data = JSON.parse(JSON.stringify(EVENT)); state.sizes = {}; state.photoSrc = null;
    var card = buildCard(tpl, state.data, { editable: true, sizes: state.sizes, photoSrc: null });
    card.id = 'inv-card';
    $('inv-card').replaceWith(card);
    $('inv-edit-hint').hidden = false;
    setAutosave('Saved');
    showView('editor');
    window.scrollTo(0, 0);
  }
  function openEditorUpload(src) {
    state.mode = 'upload'; state.tplId = null; state.uploadSrc = src; state.edited = true;
    var card = el('article', 'inv-card'); card.id = 'inv-card';
    card.setAttribute('data-mode', 'upload');
    var img = document.createElement('img'); img.src = src; img.alt = 'Your uploaded invitation card';
    card.appendChild(img);
    $('inv-card').replaceWith(card);
    $('inv-edit-hint').hidden = true;
    setAutosave('Ready');
    showView('editor');
    window.scrollTo(0, 0);
  }
  function setAutosave(txt) {
    var a = $('inv-autosave'); a.textContent = ''; a.appendChild(mi('cloud_done')); a.appendChild(document.createTextNode(' ' + txt));
  }

  /* ── inline editing (delegated on the editor) ── */
  function markEdited() { if (!state.edited) { state.edited = true; } setAutosave('Saved'); }

  $('inv-editor').addEventListener('input', function (e) {
    var slot = e.target.closest('.inv-slot[contenteditable]');
    if (!slot) return;
    var key = slot.getAttribute('data-slot');
    if (state.data) state.data[key] = slot.textContent;
    markEdited();
  });
  $('inv-editor').addEventListener('focusin', function (e) {
    var slot = e.target.closest('.inv-slot[contenteditable]');
    if (slot) { state.activeSlot = slot; showToolbar(slot); }
  });
  $('inv-editor').addEventListener('focusout', function (e) {
    /* hide the toolbar only when focus leaves both the slot and the toolbar */
    setTimeout(function () {
      var a = document.activeElement;
      if (a && (a.closest('.inv-slot[contenteditable]') || a.closest('.inv-toolbar'))) return;
      hideToolbar();
    }, 80);
  });
  /* photo slot */
  $('inv-editor').addEventListener('click', function (e) {
    var ps = e.target.closest('[data-photo-slot]');
    if (ps) { $('inv-photo-input').click(); }
  });
  $('inv-editor').addEventListener('keydown', function (e) {
    var ps = e.target.closest('[data-photo-slot]');
    if (ps && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); $('inv-photo-input').click(); }
  });

  /* ── floating size toolbar ── */
  var SIZES = ['s', 'm', 'l'], SIZE_LABEL = { s: 'Small', m: 'Medium', l: 'Large' };
  function slotSize(slot) { return slot.classList.contains('is-sz-s') ? 's' : slot.classList.contains('is-sz-l') ? 'l' : 'm'; }
  function showToolbar(slot) {
    var tb = $('inv-toolbar'); tb.hidden = false;
    $('inv-size-label').textContent = SIZE_LABEL[slotSize(slot)];
  }
  function hideToolbar() { $('inv-toolbar').hidden = true; state.activeSlot = null; }
  function bumpSize(dir) {
    var slot = state.activeSlot; if (!slot) return;
    var cur = SIZES.indexOf(slotSize(slot));
    var next = Math.max(0, Math.min(2, cur + dir));
    slot.classList.remove('is-sz-s', 'is-sz-l');
    if (SIZES[next] === 's') slot.classList.add('is-sz-s');
    if (SIZES[next] === 'l') slot.classList.add('is-sz-l');
    if (state.tplId) state.sizes[slot.getAttribute('data-slot')] = SIZES[next];
    $('inv-size-label').textContent = SIZE_LABEL[SIZES[next]];
    markEdited();
    slot.focus();
  }
  $('inv-size-down').addEventListener('click', function () { bumpSize(-1); });
  $('inv-size-up').addEventListener('click', function () { bumpSize(1); });

  /* ── uploads ── */
  function readImage(input, cb) {
    var f = input.files && input.files[0]; if (!f) return;
    if (['image/jpeg', 'image/png'].indexOf(f.type) === -1) { toast('Please use a JPG or PNG image.'); input.value = ''; return; }
    var url = URL.createObjectURL(f); cb(url); input.value = '';
  }
  $('inv-upload-input').addEventListener('change', function () { readImage(this, function (url) { openEditorUpload(url); }); });
  $('inv-photo-input').addEventListener('change', function () {
    readImage(this, function (url) {
      state.photoSrc = url;
      var slot = document.querySelector('#inv-card [data-photo-slot]');
      if (slot) { slot.textContent = ''; var im = document.createElement('img'); im.src = url; im.alt = ''; slot.appendChild(im); markEdited(); }
    });
  });

  /* ── gallery interactions ── */
  $('inv-filters').addEventListener('click', function (e) {
    var chip = e.target.closest('[data-style]'); if (!chip) return;
    state.filter = chip.getAttribute('data-style');
    renderFilters(); renderGallery();
  });
  $('inv-grid').addEventListener('click', function (e) {
    if (e.target.closest('#inv-upload-tile')) { $('inv-upload-input').click(); return; }
    var t = e.target.closest('[data-open-tpl]');
    if (t) openEditorTemplate(t.getAttribute('data-open-tpl'));
  });

  /* ── change template (discard guard) ── */
  $('inv-back').addEventListener('click', function () {
    if (state.edited) openModal('inv-discard-modal'); else showView('gallery');
  });
  $('inv-discard-confirm').addEventListener('click', function () { closeModal('inv-discard-modal'); showView('gallery'); });

  /* ── preview ── */
  $('inv-preview').addEventListener('click', function () {
    var stage = $('inv-preview-stage'); stage.textContent = '';
    stage.appendChild(currentCardClone());
    openModal('inv-preview-modal');
  });
  function currentCardClone() {
    var live = $('inv-card');
    var clone = live.cloneNode(true);
    clone.removeAttribute('id');
    /* freeze: drop editability so the preview/thumb is inert */
    Array.prototype.forEach.call(clone.querySelectorAll('[contenteditable]'), function (n) { n.removeAttribute('contenteditable'); n.removeAttribute('role'); });
    Array.prototype.forEach.call(clone.querySelectorAll('[data-photo-slot]'), function (n) { n.removeAttribute('role'); n.removeAttribute('tabindex'); });
    return clone;
  }

  /* ── download (faked PNG export) ── */
  $('inv-download').addEventListener('click', function () {
    var btn = this; if (btn.classList.contains('is-busy')) return;
    var label = btn.querySelector('span:not(.material-symbols-outlined)');
    var orig = label.textContent; btn.classList.add('is-busy'); label.textContent = 'Preparing…';
    setTimeout(function () {
      btn.classList.remove('is-busy'); label.textContent = orig;
      toast('CARD DOWNLOADED');
    }, 900);
  });

  /* ── share on WhatsApp (honest: text + link; card attaches via download) ── */
  function shareCaption() {
    var d = state.data || EVENT;
    var who = state.mode === 'upload' ? (EVENT.name1 + ' & family') : (d.couple || EVENT.couple);
    return who + ' invite you to their wedding on ' + (d.date || EVENT.date) + '.\n'
      + 'See the invite & RSVP: ' + EVENT.rsvpUrl;
  }
  $('inv-share').addEventListener('click', function () {
    $('inv-share-text').textContent = shareCaption();
    var thumb = $('inv-share-thumb'); thumb.textContent = ''; thumb.appendChild(currentCardClone());
    openModal('inv-share-modal');
  });
  $('inv-share-confirm').addEventListener('click', function () {
    closeModal('inv-share-modal');
    /* faked: real build downloads the PNG, then opens wa.me with the caption (text-only). */
    toast('CARD DOWNLOADED · OPENING WHATSAPP');
    var url = 'https://wa.me/?text=' + encodeURIComponent(shareCaption());
    var note = document.createElement('a'); note.href = url; /* proto: not auto-navigated */
  });

  /* ── boot ── */
  renderFilters();
  renderGallery();
  showView('gallery');
})();
