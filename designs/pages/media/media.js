/* Media & Memories — page behavior.
   Architecture: ARRAY-AS-SOURCE-OF-TRUTH (TL1/FE6). Every render reads from
   state.photos / state.albums; the DOM is never re-queried for data. This is
   what lets the photo object carry { id, src, name, albumIds[], uploadedAt,
   published } across re-renders — website/photos consumes the published:true
   subset of THIS store. Keeps photos.js's el()/mi()/no-innerHTML primitives.

   Faked in this prototype (porting notes):
   - Background upload + progress lifecycle are simulated with timers.
   - HEIC previews are faked with generated SVGs — real HEIC can't render in
     <img> on most browsers; the real build needs a transcode step (client
     lib or Storage-side) before the grid/lightbox can show it.
   - Storage meter is presentational; data contract { usedBytes, limitBytes,
     tier } will come from a subscription/event_storage lookup. */
(function () {
  'use strict';
  var FX = window.MEDIA_FIXTURES;
  if (!FX) return;

  /* Founder decision: upgrade CTA defaults to PASSIVE. Flip to 'active'
     to render the "Upgrade for more storage" button instead. */
  var UPGRADE_CTA_MODE = 'passive';

  var GRID_BATCH = 30;            /* lazy-load window (stands in for 5k–20k virtualization) */
  var RECENT_MAX = 12;
  var MAX_FILES_PER_DROP = 30;
  var MAX_BYTES = 10 * 1024 * 1024;
  var ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/heic'];
  var ACCEPT_EXT = /\.(jpe?g|png|heic)$/i;

  var state = {
    photos: FX.photos.slice(),
    albums: FX.albums.slice(),
    subEvents: (FX.subEvents || []).slice(),
    coverId: FX.photos.length ? FX.photos[0].id : null,
    selected: {},               /* photoId -> true */
    selectedCount: 0,
    selectMode: false,
    sort: 'newest',             /* newest | oldest | name */
    filterAlbumId: null,
    filterSubEventId: null,
    dateFrom: null,             /* ms (start of day) | null */
    dateTo: null,               /* ms (end of day) | null */
    renderedCount: 0,           /* grid windowing */
    lbIds: [],                  /* lightbox list snapshot (ids) */
    lbIndex: -1,
    renameAlbumId: null,        /* album modal: null = create mode */
    menuAlbumId: null,
    deleteAlbumId: null,
    removePhotoId: null,
    uploading: false,
    photoSeq: FX.photos.length + 1,
    albumSeq: 0,
    storage: { usedBytes: FX.storage.usedBytes, limitBytes: FX.storage.limitBytes, tier: FX.storage.tier }
  };

  /* Videos — parallel state slice (mirrors Photos; shares the album list). */
  var vstate = {
    videos: (FX.videos || []).slice(),
    selected: {}, selectedCount: 0, selectMode: false,
    sort: 'newest', filterAlbumId: null, filterSubEventId: null, dateFrom: null, dateTo: null,
    renderedCount: 0, lbIds: [], lbIndex: -1,
    uploading: false, seq: (FX.videos || []).length + 1
  };

  /* ── tiny DOM helpers (photos.js idiom — no innerHTML) ─────────────── */
  function $(id) { return document.getElementById(id); }
  function el(t, c) { var n = document.createElement(t); if (c) n.className = c; return n; }
  function mi(name) { var s = el('span', 'material-symbols-outlined'); s.setAttribute('aria-hidden', 'true'); s.textContent = name; return s; }
  function txt(s) { return document.createTextNode(s); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function toast(m, opts) { if (window.evenzi && window.evenzi.showToast) window.evenzi.showToast(m, opts); }
  function openModal(id) { if (window.evenzi && window.evenzi.openModal) window.evenzi.openModal(id); }
  function closeModal(id) { if (window.evenzi && window.evenzi.closeModal) window.evenzi.closeModal(id); }

  /* ── data selectors ─────────────────────────────────────────────────── */
  function byNewest(a, b) { return b.uploadedAt - a.uploadedAt; }
  function sortComparator() {
    if (state.sort === 'oldest') return function (a, b) { return a.uploadedAt - b.uploadedAt; };
    if (state.sort === 'name') return function (a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true }); };
    return byNewest; /* newest (default) */
  }
  function hasFilters() {
    return !!(state.filterAlbumId || state.filterSubEventId || state.dateFrom || state.dateTo);
  }
  function visiblePhotos() {
    var list = state.photos.slice();
    if (state.filterAlbumId) list = list.filter(function (p) { return p.albumIds.indexOf(state.filterAlbumId) !== -1; });
    if (state.filterSubEventId) list = list.filter(function (p) { return p.subEventId === state.filterSubEventId; });
    if (state.dateFrom) list = list.filter(function (p) { return (p.takenAt || p.uploadedAt) >= state.dateFrom; });
    if (state.dateTo) list = list.filter(function (p) { return (p.takenAt || p.uploadedAt) <= state.dateTo; });
    return list.sort(sortComparator());
  }
  function subEventById(id) {
    for (var i = 0; i < state.subEvents.length; i++) if (state.subEvents[i].id === id) return state.subEvents[i];
    return null;
  }
  function photoById(id) {
    for (var i = 0; i < state.photos.length; i++) if (state.photos[i].id === id) return state.photos[i];
    return null;
  }
  function vById(id) {
    for (var i = 0; i < vstate.videos.length; i++) if (vstate.videos[i].id === id) return vstate.videos[i];
    return null;
  }
  function itemById(kind, id) { return kind === 'video' ? vById(id) : photoById(id); }
  function albumById(id) {
    for (var i = 0; i < state.albums.length; i++) if (state.albums[i].id === id) return state.albums[i];
    return null;
  }
  function albumPhotos(albumId) {
    return state.photos.filter(function (p) { return p.albumIds.indexOf(albumId) !== -1; });
  }
  function albumVideos(albumId) {
    return vstate.videos.filter(function (v) { return v.albumIds.indexOf(albumId) !== -1; });
  }
  function albumCountLabel(np, nv) {
    var parts = [];
    if (np) parts.push(np + (np === 1 ? ' photo' : ' photos'));
    if (nv) parts.push(nv + (nv === 1 ? ' video' : ' videos'));
    return parts.length ? parts.join(' · ') : '0 photos';
  }
  function selectedIds() { return Object.keys(state.selected); }

  function fmtGB(bytes) {
    var gb = bytes / (1024 * 1024 * 1024);
    return (gb >= 10 ? Math.round(gb) : Math.round(gb * 10) / 10) + ' GB';
  }
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function fmtDate(ms) {
    var d = new Date(ms); /* formatting stored timestamps, not "now" */
    return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear();
  }
  function isoDay(ms) { var d = new Date(ms); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }

  /* ── storage meter ──────────────────────────────────────────────────── */
  function meterState() {
    if (state.storage.usedBytes >= state.storage.limitBytes) return 'atcap';
    if (state.storage.usedBytes / state.storage.limitBytes >= 0.8) return 'near';
    return 'healthy';
  }
  function renderMeter() {
    var ms = meterState();
    var pct = Math.min(100, Math.round((state.storage.usedBytes / state.storage.limitBytes) * 100));
    $('md-meter').setAttribute('data-meter-state', ms);
    $('md-meter-icon').textContent = ms === 'atcap' ? 'error' : ms === 'near' ? 'warning' : 'cloud_done';
    $('md-meter-text').textContent = fmtGB(state.storage.usedBytes) + ' of ' + fmtGB(state.storage.limitBytes) + ' used';
    var note = $('md-meter-note');
    if (ms === 'near') { note.hidden = false; note.textContent = "You're close to your storage limit."; }
    else if (ms === 'atcap') { note.hidden = false; note.textContent = 'Storage full — remove photos or upgrade soon.'; }
    else { note.hidden = true; note.textContent = ''; }
    $('md-meter-bar').setAttribute('aria-valuenow', String(pct));
    $('md-meter-fill').style.width = pct + '%';
    renderMeterCta();
  }
  function renderMeterCta() {
    var cta = $('md-meter-cta');
    clear(cta);
    if (UPGRADE_CTA_MODE === 'active') {
      var up = el('button', 'btn-pill btn-pill-primary'); up.type = 'button';
      up.appendChild(mi('workspace_premium')); up.appendChild(txt('Upgrade for more storage'));
      up.addEventListener('click', function () { toast('UPGRADES COMING SOON'); });
      cta.appendChild(up);
      return;
    }
    /* passive (default): roadmap copy + notify-intent capture (stub —
       captures intent, routes nowhere yet) */
    var copy = el('span', 'media-meter-cta-copy'); copy.textContent = 'More storage coming soon';
    var notify = el('button', 'btn-pill btn-pill-secondary'); notify.type = 'button';
    notify.id = 'md-notify'; notify.setAttribute('aria-pressed', 'false');
    notify.appendChild(mi('notifications')); notify.appendChild(txt('Notify me'));
    notify.addEventListener('click', function () {
      if (notify.getAttribute('aria-pressed') === 'true') return;
      notify.setAttribute('aria-pressed', 'true');
      clear(notify); notify.appendChild(mi('check')); notify.appendChild(txt("We'll notify you"));
      toast('WE\u2019LL LET YOU KNOW');
    });
    cta.appendChild(copy); cta.appendChild(notify);
  }

  /* ── photo tiles ────────────────────────────────────────────────────── */
  function buildPhotoTile(p, opts) {
    opts = opts || {};
    var art = el('article', 'dp-tile photo-tile');
    art.setAttribute('data-photo-id', p.id);
    if (p.id === state.coverId) art.setAttribute('data-cover', 'true');
    if (state.selected[p.id]) art.classList.add('is-selected');

    var sel = el('label', 'photo-tile-select');
    var cb = document.createElement('input'); cb.type = 'checkbox';
    cb.setAttribute('data-photo-select', ''); cb.setAttribute('aria-label', 'Select ' + p.name);
    cb.checked = !!state.selected[p.id];
    var check = el('span', 'photo-tile-check'); check.appendChild(mi('check'));
    sel.appendChild(cb); sel.appendChild(check);

    var btn = el('button', 'dp-tile-trigger'); btn.type = 'button';
    btn.setAttribute('data-md-open', ''); btn.setAttribute('data-photo-id', p.id);
    btn.setAttribute('aria-label', 'View ' + p.name + ' full size');
    var thumb = el('span', 'dp-tile-thumb');
    var img = document.createElement('img'); img.src = p.src; img.alt = ''; img.loading = 'lazy';
    thumb.appendChild(img); btn.appendChild(thumb);

    var badge = el('span', 'photo-tile-cover-badge');
    badge.appendChild(mi('star')); badge.appendChild(txt('Cover'));
    if (p.id !== state.coverId) badge.hidden = true;

    art.appendChild(sel); art.appendChild(btn); art.appendChild(badge);

    /* Always-on per-tile actions are allowed on the LOW-VOLUME recent strip
       only — the master grid stays chrome-free (UX3). */
    if (opts.withActions) {
      var actions = el('div', 'photo-tile-actions');
      var add = el('button', 'photo-tile-action'); add.type = 'button';
      add.setAttribute('data-md-assign-one', ''); add.setAttribute('data-photo-id', p.id);
      add.setAttribute('aria-label', 'Add ' + p.name + ' to album');
      add.appendChild(mi('library_add'));
      actions.appendChild(add);
      art.appendChild(actions);
    }
    return art;
  }

  /* ── recent strip ───────────────────────────────────────────────────── */
  function renderRecent() {
    var listEl = $('md-recent');
    clear(listEl);
    var latest = state.photos.slice().sort(byNewest).slice(0, RECENT_MAX);
    $('md-recent-scroller').hidden = latest.length === 0;
    $('md-recent-empty').hidden = latest.length !== 0;
    latest.forEach(function (p) {
      var li = el('li');
      li.appendChild(buildPhotoTile(p, { withActions: true }));
      listEl.appendChild(li);
    });
  }

  /* ── albums ─────────────────────────────────────────────────────────── */
  function renderAlbums() {
    var chips = $('md-preset-chips');
    var grid = $('md-albums-grid');
    clear(chips); clear(grid);

    /* An album holds BOTH photos and videos — filled if it has either. */
    var emptyAlbums = [], filledAlbums = [];
    state.albums.forEach(function (a) {
      (albumPhotos(a.id).length || albumVideos(a.id).length) ? filledAlbums.push(a) : emptyAlbums.push(a);
    });

    /* Arbiter A: empty albums render as INERT chips, not empty cards */
    emptyAlbums.forEach(function (a) {
      var chip = el('span', 'dp-filter-chip');
      chip.textContent = a.name;
      chips.appendChild(chip);
    });
    chips.hidden = emptyAlbums.length === 0;
    $('md-preset-note').hidden = emptyAlbums.length === 0;

    filledAlbums.forEach(function (a) {
      var photos = albumPhotos(a.id).sort(byNewest);
      var videos = albumVideos(a.id).sort(byNewest);
      var np = photos.length, nv = videos.length;
      var coverSrc = np ? photos[0].src : videos[0].poster;
      var label = albumCountLabel(np, nv);
      var art = el('article', 'dp-tile album-card');
      art.setAttribute('data-album-id', a.id);

      var open = el('button', 'dp-tile-link album-card-open'); open.type = 'button';
      open.setAttribute('data-album-open', ''); open.setAttribute('data-album-id', a.id);
      open.setAttribute('aria-label', 'Open ' + a.name + ' album — ' + label);

      var body = el('div');
      var thumb = el('span', 'dp-tile-thumb');
      var img = document.createElement('img'); img.src = coverSrc; img.alt = ''; img.loading = 'lazy';
      thumb.appendChild(img);
      if (!np && nv) { var pb = el('span', 'media-vplay-badge'); pb.appendChild(mi('play_arrow')); thumb.appendChild(pb); }
      var meta = el('div', 'dp-tile-meta');
      var name = el('span', 'dp-tile-name'); name.textContent = a.name; name.title = a.name;
      var sub = el('span', 'dp-tile-sub album-card-count');
      sub.textContent = label;
      meta.appendChild(name); meta.appendChild(sub);
      body.appendChild(thumb); body.appendChild(meta);

      var menu = el('button', 'photo-tile-action'); menu.type = 'button';
      menu.setAttribute('data-album-menu', ''); menu.setAttribute('data-album-id', a.id);
      menu.setAttribute('aria-label', a.name + ' album options');
      menu.appendChild(mi('more_horiz'));

      art.appendChild(open); art.appendChild(body); art.appendChild(menu);
      grid.appendChild(art);
    });

    /* Create-album card — reuses the .empty-cta-card invitation surface */
    var create = el('button', 'empty-cta-card'); create.type = 'button';
    create.id = 'md-create-album';
    var icon = el('span', 'empty-cta-icon'); icon.setAttribute('aria-hidden', 'true'); icon.appendChild(mi('add'));
    var title = el('p', 'empty-cta-title'); title.textContent = 'Create album';
    var sub2 = el('p', 'empty-cta-sub'); sub2.textContent = 'Name a moment worth grouping.';
    create.appendChild(icon); create.appendChild(title); create.appendChild(sub2);
    grid.appendChild(create);
  }

  /* ── all-photos grid (windowed via IntersectionObserver sentinel) ────── */
  function renderGrid() {
    var grid = $('md-grid');
    clear(grid);
    state.renderedCount = 0;
    appendBatch();
    updateAllState();
  }
  function appendBatch() {
    var grid = $('md-grid');
    var list = visiblePhotos();
    var next = list.slice(state.renderedCount, state.renderedCount + GRID_BATCH);
    next.forEach(function (p) { grid.appendChild(buildPhotoTile(p)); });
    state.renderedCount += next.length;
    $('md-sentinel').hidden = state.renderedCount >= list.length;
  }
  var sentinelIO = null;
  function wireSentinel() {
    if (!('IntersectionObserver' in window)) { $('md-sentinel').hidden = true; return; }
    sentinelIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting && !$('md-sentinel').hidden) appendBatch(); });
    }, { rootMargin: '400px 0px' });
    sentinelIO.observe($('md-sentinel'));
  }

  function updateAllState() {
    var all = $('md-all');
    var totalVisible = visiblePhotos().length;
    all.setAttribute('data-photos-state', state.photos.length === 0 ? 'empty' : 'populated');
    $('md-count').textContent = String(totalVisible);
  }

  /* ── first-run hero + page-level empty toggles ──────────────────────── */
  function renderEmptyHero() {
    var dz = $('md-dropzone');
    var isEmpty = state.photos.length === 0;
    dz.classList.toggle('is-hero', isEmpty);
    $('md-dropzone-title').textContent = isEmpty ? 'Add your first photos' : 'Drag photos here, or tap to browse';
    $('md-dropzone-sub').hidden = !isEmpty;
  }

  function renderAll() {
    renderMeter();
    renderEmptyHero();
    renderRecent();
    renderAlbums();
    renderGrid();
    renderActiveChips();
    updateToolbarLabels();
  }

  /* ── selection + bulk bar ───────────────────────────────────────────── */
  function setSelected(id, on) {
    if (on) { if (!state.selected[id]) { state.selected[id] = true; state.selectedCount++; } }
    else if (state.selected[id]) { delete state.selected[id]; state.selectedCount--; }
  }
  function updateBulk() {
    var n = state.selectedCount;
    var bulk = $('md-bulk');
    bulk.hidden = n === 0;
    $('md-bulk-count').textContent = n + ' selected';
  }
  function clearSelection() {
    state.selected = {}; state.selectedCount = 0;
    var checks = document.querySelectorAll('#md-main [data-photo-select]');
    Array.prototype.forEach.call(checks, function (c) {
      c.checked = false;
      var t = c.closest('.photo-tile'); if (t) t.classList.remove('is-selected');
    });
    updateBulk();
  }
  function setSelectMode(on) {
    state.selectMode = on;
    $('md-all').setAttribute('data-select-mode', on ? 'on' : 'off');
    var btn = $('md-select-toggle');
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    $('md-select-label').textContent = on ? 'Done' : 'Select';
    if (!on) clearSelection();
  }

  /* ── sort + filters (album · sub-event/function · date range) ───────── */
  function applyFilters(scrollToGrid) {
    renderActiveChips();
    updateToolbarLabels();
    renderGrid();
    if (scrollToGrid) $('md-all').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function setAlbumFilter(id) { state.filterAlbumId = id; applyFilters(true); }

  function dateLabel() {
    if (state.dateFrom && state.dateTo) return fmtDate(state.dateFrom) + ' – ' + fmtDate(state.dateTo);
    if (state.dateFrom) return 'From ' + fmtDate(state.dateFrom);
    if (state.dateTo) return 'Until ' + fmtDate(state.dateTo);
    return null;
  }
  function setToolActive(id, on) { var b = $(id); if (b) b.classList.toggle('is-active', on); }
  function updateToolbarLabels() {
    $('md-sort-label').textContent = state.sort === 'oldest' ? 'Oldest' : state.sort === 'name' ? 'Name A–Z' : 'Newest';
    setToolActive('md-filter-album', !!state.filterAlbumId);
    setToolActive('md-filter-subevent', !!state.filterSubEventId);
    setToolActive('md-filter-date', !!(state.dateFrom || state.dateTo));
  }
  function chip(label, clearFn) {
    var c = el('button', 'dp-filter-chip is-active'); c.type = 'button';
    c.appendChild(txt(label)); c.appendChild(mi('close'));
    c.setAttribute('aria-label', 'Clear filter: ' + label);
    c.addEventListener('click', clearFn);
    return c;
  }
  function renderActiveChips() {
    var wrap = $('md-active-filter');
    clear(wrap);
    var any = false;
    if (state.filterAlbumId) { var a = albumById(state.filterAlbumId); if (a) { wrap.appendChild(chip(a.name, function () { state.filterAlbumId = null; applyFilters(); })); any = true; } }
    if (state.filterSubEventId) { var s = subEventById(state.filterSubEventId); if (s) { wrap.appendChild(chip(s.name, function () { state.filterSubEventId = null; applyFilters(); })); any = true; } }
    var dl = dateLabel();
    if (dl) { wrap.appendChild(chip(dl, function () { state.dateFrom = state.dateTo = null; applyFilters(); })); any = true; }
    if (any) {
      var all = el('button', 'media-clear-all'); all.type = 'button'; all.textContent = 'Clear all';
      all.addEventListener('click', clearAllFilters); wrap.appendChild(all);
    }
    wrap.hidden = !any;
  }
  function clearAllFilters() {
    state.filterAlbumId = state.filterSubEventId = state.dateFrom = state.dateTo = null;
    applyFilters();
  }

  /* single-select sheet — reused for Sort / Album / Function (.modal-picker-grid) */
  var filterSheet = { onPick: null };
  function openFilterSheet(cfg) {
    $('md-filter-title').textContent = cfg.title;
    $('md-filter-modal-sub').textContent = cfg.sub || 'Pick one.';
    var body = $('md-filter-body'); clear(body);
    cfg.options.forEach(function (o) {
      var tile = el('button', 'modal-picker-tile'); tile.type = 'button'; tile.setAttribute('role', 'radio');
      tile.setAttribute('data-filter-pick', o.id == null ? '' : o.id);
      tile.setAttribute('aria-checked', o.active ? 'true' : 'false');
      if (o.active) tile.classList.add('is-selected');
      var icon = el('span', 'modal-picker-tile-icon'); icon.setAttribute('aria-hidden', 'true'); icon.appendChild(mi(o.icon || 'check'));
      var name = el('span', 'modal-picker-tile-name'); name.textContent = o.label;
      tile.appendChild(icon); tile.appendChild(name);
      if (o.desc) { var d = el('span', 'modal-picker-tile-desc'); d.textContent = o.desc; tile.appendChild(d); }
      var ck = el('span', 'modal-picker-tile-check'); ck.setAttribute('aria-hidden', 'true'); ck.appendChild(mi('check_circle')); tile.appendChild(ck);
      body.appendChild(tile);
    });
    filterSheet.onPick = cfg.onPick;
    openModal('md-filter-modal');
  }
  $('md-filter-body').addEventListener('click', function (e) {
    var tile = e.target.closest && e.target.closest('[data-filter-pick]');
    if (!tile) return;
    var raw = tile.getAttribute('data-filter-pick');
    closeModal('md-filter-modal');
    if (filterSheet.onPick) filterSheet.onPick(raw === '' ? null : raw);
  });

  /* ── lightbox (data/index-driven — survives lazy-load) ──────────────── */
  function openLightbox(photoId) {
    state.lbIds = visiblePhotos().map(function (p) { return p.id; });
    state.lbIndex = state.lbIds.indexOf(photoId);
    if (state.lbIndex === -1) { state.lbIds = [photoId]; state.lbIndex = 0; }
    renderLightbox();
    openModal('md-lightbox');
  }
  function renderLightbox() {
    var p = photoById(state.lbIds[state.lbIndex]);
    if (!p) return;
    var img = $('md-lb-img');
    img.src = p.src; img.alt = p.name;
    $('md-lb-title').textContent = p.name;
    $('md-lb-sub').textContent = 'Uploaded ' + fmtDate(p.uploadedAt);
    $('md-lb-prev').disabled = state.lbIndex <= 0;
    $('md-lb-next').disabled = state.lbIndex >= state.lbIds.length - 1;
    /* preload neighbours — new Image() only, no extra DOM nodes (FE5) */
    [state.lbIndex - 1, state.lbIndex + 1].forEach(function (i) {
      if (i >= 0 && i < state.lbIds.length) {
        var n = photoById(state.lbIds[i]);
        if (n) { var pre = new Image(); pre.src = n.src; }
      }
    });
  }
  function lbNav(dir) {
    var next = state.lbIndex + dir;
    if (next < 0 || next >= state.lbIds.length) return;
    state.lbIndex = next;
    renderLightbox();
  }
  function lightboxOpen() {
    var lb = $('md-lightbox');
    return lb && lb.classList.contains('is-open');
  }

  /* ── assign-to-album picker (promote step 3/3) ──────────────────────
     Net-new multi-select behavior on the shell .modal-picker-grid
     primitive — deliberately NOT a promotion of guests.js openPicker
     (that would drag its gm- coupling along, FE2).
     mode 'add'    → every album is offered; apply ADDS the chosen
                     album ids to each photo's albumIds.
     mode 'remove' → only albums the selection is filed in are offered;
                     apply REMOVES the chosen album ids (un-file only —
                     photos stay in All Photos). */
  var assign = { mode: 'add', kind: 'photo', ids: [], chosen: {} };

  function assignableAlbums(mode, ids, kind) {
    if (mode === 'add') return state.albums.slice();
    var present = {};
    ids.forEach(function (id) {
      var it = itemById(kind, id);
      if (it) it.albumIds.forEach(function (a) { present[a] = true; });
    });
    return state.albums.filter(function (a) { return present[a.id]; });
  }

  function openAssign(mode, ids, kind) {
    if (!ids || !ids.length) return;
    kind = kind || 'photo';
    assign.mode = mode; assign.kind = kind;
    assign.ids = ids.slice();
    assign.chosen = {};
    var n = ids.length;
    var one = itemById(kind, ids[0]);
    var noun = n === 1 ? (one ? one.name : (kind === 'video' ? 'this video' : 'this photo')) : n + ' ' + (kind === 'video' ? 'videos' : 'photos');
    $('md-assign-title').textContent = mode === 'add' ? 'Add to album' : 'Remove from album';
    $('md-assign-sub').textContent = mode === 'add'
      ? 'Choose albums for ' + noun + '. Pick as many as you like.'
      : 'Choose which albums to take ' + noun + ' out of — they stay in All Photos.';
    $('md-assign-apply').textContent = mode === 'add' ? 'Add' : 'Remove';
    var albums = assignableAlbums(mode, ids, kind);
    var body = $('md-assign-body');
    clear(body);
    if (!albums.length) {
      var none = el('p', 'modal-picker-tile-desc');
      none.textContent = mode === 'remove'
        ? "These photos aren't filed in any album yet."
        : 'No albums yet — create one first.';
      body.appendChild(none);
    }
    albums.forEach(function (a) {
      var count = albumPhotos(a.id).length;
      var tile = el('button', 'modal-picker-tile'); tile.type = 'button';
      tile.setAttribute('data-assign-album', a.id);
      tile.setAttribute('aria-pressed', 'false');
      var icon = el('span', 'modal-picker-tile-icon'); icon.setAttribute('aria-hidden', 'true');
      icon.appendChild(mi('photo_album'));
      var name = el('span', 'modal-picker-tile-name'); name.textContent = a.name;
      var desc = el('span', 'modal-picker-tile-desc');
      desc.textContent = count + (count === 1 ? ' photo' : ' photos');
      var check = el('span', 'modal-picker-tile-check'); check.setAttribute('aria-hidden', 'true');
      check.appendChild(mi('check_circle'));
      tile.appendChild(icon); tile.appendChild(name); tile.appendChild(desc); tile.appendChild(check);
      body.appendChild(tile);
    });
    syncAssignApply();
    openModal('md-assign-modal');
  }
  function syncAssignApply() {
    $('md-assign-apply').disabled = Object.keys(assign.chosen).length === 0;
  }
  $('md-assign-body').addEventListener('click', function (e) {
    var tile = e.target.closest && e.target.closest('[data-assign-album]');
    if (!tile) return;
    var id = tile.getAttribute('data-assign-album');
    var on = !assign.chosen[id];
    if (on) assign.chosen[id] = true; else delete assign.chosen[id];
    tile.classList.toggle('is-selected', on);
    tile.setAttribute('aria-pressed', on ? 'true' : 'false');
    syncAssignApply();
  });
  $('md-assign-apply').addEventListener('click', function () {
    var albumIds = Object.keys(assign.chosen);
    if (!albumIds.length) return;
    assign.ids.forEach(function (pid) {
      var it = itemById(assign.kind, pid);
      if (!it) return;
      albumIds.forEach(function (aid) {
        var i = it.albumIds.indexOf(aid);
        if (assign.mode === 'add' && i === -1) it.albumIds.push(aid);
        if (assign.mode === 'remove' && i !== -1) it.albumIds.splice(i, 1);
      });
    });
    closeModal('md-assign-modal');
    toast(assign.mode === 'add' ? 'ADDED TO ALBUM' : 'REMOVED FROM ALBUM');
    if (assign.kind === 'video') { applyVFilters(); }
    else { renderAlbums(); if (state.filterAlbumId) renderGrid(); updateAllState(); }
  });

  /* ── uploads (faked background upload + pre-flight guard) ───────────── */
  function preflight(files) {
    var list = Array.prototype.slice.call(files);
    if (list.length > MAX_FILES_PER_DROP) {
      rejectDrop("That's " + list.length + ' files — add up to ' + MAX_FILES_PER_DROP + ' at a time.');
      return null;
    }
    var accepted = [];
    for (var i = 0; i < list.length; i++) {
      var f = list[i];
      var typeOk = ACCEPT_TYPES.indexOf(f.type) !== -1 || ACCEPT_EXT.test(f.name || '');
      if (!typeOk) {
        rejectDrop('"' + f.name + "\" isn't a photo we can use — try JPG, PNG, or HEIC.");
        return null;
      }
      if (f.size > MAX_BYTES) {
        /* avatar handler's cap + plain-language toast pattern */
        rejectDrop('"' + f.name + '" is ' + (f.size / (1024 * 1024)).toFixed(1) + ' MB — photos can be up to 10 MB each.');
        return null;
      }
      accepted.push(f);
    }
    return accepted;
  }
  var rejectTimer = null;
  function rejectDrop(message) {
    var dz = $('md-dropzone');
    dz.classList.add('is-rejected');
    toast(message);
    if (rejectTimer) clearTimeout(rejectTimer);
    rejectTimer = setTimeout(function () { dz.classList.remove('is-rejected'); }, 1600);
  }

  function buildUploadRow(file) {
    var li = el('li', 'media-upload-row');
    li.setAttribute('data-state', 'uploading');
    var icon = mi('progress_activity'); icon.classList.add('media-upload-state-icon');
    var main = el('div', 'media-upload-main');
    var name = el('span', 'media-upload-name'); name.textContent = file.name; name.title = file.name;
    var track = el('span', 'media-upload-track');
    var fill = el('span', 'media-upload-fill');
    track.appendChild(fill);
    main.appendChild(name); main.appendChild(track);
    var status = el('span', 'media-upload-status'); status.textContent = 'Uploading\u2026';
    li.appendChild(icon); li.appendChild(main); li.appendChild(status);
    return { li: li, icon: icon, fill: fill, status: status };
  }

  function setUploadBusy(busy) {
    state.uploading = busy;
    var dz = $('md-dropzone');
    if (busy) dz.setAttribute('aria-disabled', 'true');
    else dz.removeAttribute('aria-disabled');
  }

  function addUploadedPhoto(file) {
    var id = 'u-' + state.photoSeq;
    state.photos.unshift({
      id: id,
      src: FX.photoSVG(90 + state.photoSeq), /* fake preview (HEIC needs transcode in real build) */
      name: (file.name || 'Photo').replace(/\.[^.]+$/, ''),
      albumIds: [],
      uploadedAt: Date.now(),
      published: false
    });
    state.photoSeq++;
    state.storage.usedBytes = Math.min(state.storage.limitBytes, state.storage.usedBytes + file.size);
  }

  function runUploadRow(file, row, willFail, done) {
    var pct = 0;
    row.li.setAttribute('data-state', 'uploading');
    row.icon.textContent = 'progress_activity';
    row.status.textContent = 'Uploading\u2026';
    var timer = setInterval(function () {
      pct += 12 + Math.random() * 10;
      if (willFail && pct >= 55) {
        clearInterval(timer);
        row.li.setAttribute('data-state', 'failed');
        row.icon.textContent = 'error';
        row.status.textContent = "Upload failed — that one didn't make it.";
        var retry = el('button', 'media-upload-retry'); retry.type = 'button';
        retry.textContent = 'Retry';
        retry.setAttribute('aria-label', 'Retry uploading ' + file.name);
        retry.addEventListener('click', function () {
          retry.remove();
          runUploadRow(file, row, false, done);
        });
        row.li.appendChild(retry);
        done(false);
        return;
      }
      if (pct >= 100) {
        clearInterval(timer);
        row.fill.style.width = '100%';
        /* processing stub — stands in for the HEIC transcode step */
        row.li.setAttribute('data-state', 'processing');
        row.icon.textContent = 'sync';
        row.status.textContent = 'Processing\u2026';
        setTimeout(function () {
          row.li.setAttribute('data-state', 'success');
          row.icon.textContent = 'check_circle';
          row.status.textContent = 'Done';
          addUploadedPhoto(file);
          renderAll();
          setTimeout(function () { row.li.remove(); }, 3500);
          done(true);
        }, 650);
        return;
      }
      row.fill.style.width = Math.min(99, pct) + '%';
    }, 180);
  }

  function handleFiles(files) {
    if (state.uploading) return;
    var accepted = preflight(files);
    if (!accepted || !accepted.length) return;
    var listEl = $('md-upload-list');
    setUploadBusy(true);
    var pending = accepted.length;
    var anySuccess = false;
    accepted.forEach(function (file, i) {
      var row = buildUploadRow(file);
      listEl.appendChild(row.li);
      /* one forced-fail-with-retry demo when 2+ files arrive together */
      var willFail = accepted.length > 1 && i === 1 && !file._retried;
      runUploadRow(file, row, willFail, function settle(ok) {
        if (ok) anySuccess = true;
        pending--;
        if (pending <= 0) {
          setUploadBusy(false);
          if (anySuccess) toast('PHOTOS UPLOADED');
        }
      });
    });
  }

  /* ── album create / rename / delete ─────────────────────────────────── */
  function openAlbumModal(renameId) {
    state.renameAlbumId = renameId || null;
    var isRename = !!renameId;
    $('md-album-title').textContent = isRename ? 'Rename album' : 'Create album';
    $('md-album-sub').textContent = isRename
      ? 'Give this album a clearer name.'
      : 'Group photos so the day is easy to relive.';
    $('md-album-save').textContent = isRename ? 'Save name' : 'Create album';
    var input = $('md-album-name');
    input.value = isRename ? albumById(renameId).name : '';
    hideAlbumError();
    openModal('md-album-modal');
  }
  function hideAlbumError() {
    $('md-album-error').hidden = true;
    $('md-album-name').removeAttribute('aria-invalid');
  }
  function submitAlbumForm() {
    var input = $('md-album-name');
    var name = input.value.trim();
    if (!name) {
      $('md-album-error').hidden = false;
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    if (state.renameAlbumId) {
      albumById(state.renameAlbumId).name = name;
      toast('ALBUM RENAMED');
    } else {
      state.albumSeq++;
      state.albums.push({ id: 'al-' + state.albumSeq, name: name, preset: false });
      toast('ALBUM CREATED');
    }
    state.renameAlbumId = null;
    closeModal('md-album-modal');
    renderAlbums();
    renderActiveChips();
  }
  function deleteAlbum(id) {
    state.albums = state.albums.filter(function (a) { return a.id !== id; });
    /* un-file only — photos AND videos stay safe in their All views */
    state.photos.forEach(function (p) { var i = p.albumIds.indexOf(id); if (i !== -1) p.albumIds.splice(i, 1); });
    vstate.videos.forEach(function (v) { var i = v.albumIds.indexOf(id); if (i !== -1) v.albumIds.splice(i, 1); });
    if (state.filterAlbumId === id) state.filterAlbumId = null;
    if (vstate.filterAlbumId === id) vstate.filterAlbumId = null;
    toast('ALBUM REMOVED');
    renderAll();
    renderVAll();
  }

  /* ── photo hard-delete (single, lightbox-only) ──────────────────────── */
  function removePhoto(id) {
    state.photos = state.photos.filter(function (p) { return p.id !== id; });
    setSelected(id, false);
    if (state.coverId === id) state.coverId = state.photos.length ? state.photos.slice().sort(byNewest)[0].id : null;
    toast('PHOTO REMOVED');
    renderAll();
    updateBulk();
  }

  /* ── bulk hard-delete (founder override of the locked "no bulk delete").
        Safety: cautionary confirm (below) + Undo toast that restores the exact
        photos at their original positions from an in-memory snapshot. */
  function bulkDelete() {
    var ids = selectedIds();
    if (!ids.length) return;
    var removed = [];                       /* { photo, idx } snapshot for undo */
    ids.forEach(function (id) {
      for (var i = 0; i < state.photos.length; i++) {
        if (state.photos[i].id === id) { removed.push({ photo: state.photos[i], idx: i }); break; }
      }
    });
    if (!removed.length) return;
    var prevCover = state.coverId;
    removed.slice().sort(function (a, b) { return b.idx - a.idx; })   /* splice high→low */
      .forEach(function (r) { state.photos.splice(r.idx, 1); });
    if (ids.indexOf(state.coverId) !== -1) {
      state.coverId = state.photos.length ? state.photos.slice().sort(byNewest)[0].id : null;
    }
    setSelectMode(false);                   /* also clears selection */
    renderAll();
    updateBulk();
    var n = removed.length;
    toast(n + (n === 1 ? ' PHOTO REMOVED' : ' PHOTOS REMOVED'), {
      actionLabel: 'Undo',
      onAction: function () {
        removed.slice().sort(function (a, b) { return a.idx - b.idx; })   /* re-insert low→high */
          .forEach(function (r) { state.photos.splice(Math.min(r.idx, state.photos.length), 0, r.photo); });
        state.coverId = prevCover;
        renderAll();
        toast('PHOTOS RESTORED');
      }
    });
  }

  /* ── delegated events ───────────────────────────────────────────────── */
  document.addEventListener('change', function (e) {
    var cb = e.target.closest && e.target.closest('[data-photo-select]');
    if (cb) {
      var tile = cb.closest('.photo-tile');
      var id = tile && tile.getAttribute('data-photo-id');
      if (!id) return;
      setSelected(id, cb.checked);
      /* keep every rendering of this photo (grid + recent) in sync */
      var twins = document.querySelectorAll('#md-main .photo-tile[data-photo-id="' + id + '"]');
      Array.prototype.forEach.call(twins, function (t) {
        t.classList.toggle('is-selected', cb.checked);
        var c = t.querySelector('[data-photo-select]'); if (c) c.checked = cb.checked;
      });
      updateBulk();
      return;
    }
    if (e.target === $('md-file-input')) {
      handleFiles(e.target.files || []);
      e.target.value = '';
    }
  });

  document.addEventListener('click', function (e) {
    var t = e.target;
    var openBtn = t.closest && t.closest('[data-md-open]');
    if (openBtn) {
      var pid = openBtn.getAttribute('data-photo-id');
      if (state.selectMode) {
        /* in select mode taps toggle selection instead of opening */
        var tile = openBtn.closest('.photo-tile');
        var c = tile && tile.querySelector('[data-photo-select]');
        if (c) { c.checked = !c.checked; c.dispatchEvent(new Event('change', { bubbles: true })); }
        return;
      }
      openLightbox(pid);
      return;
    }
    var assignOne = t.closest && t.closest('[data-md-assign-one]');
    if (assignOne) { openAssign('add', [assignOne.getAttribute('data-photo-id')]); return; }
    var albumOpen = t.closest && t.closest('[data-album-open]');
    if (albumOpen) {
      var aid = albumOpen.getAttribute('data-album-id');
      vstate.filterAlbumId = aid; applyVFilters();   /* album filters BOTH collections */
      setAlbumFilter(aid);                            /* photo filter + scroll to grid */
      var photosTab = $('md-tab-photos');
      if (photosTab && photosTab.getAttribute('aria-selected') !== 'true') photosTab.click();
      return;
    }
    var albumMenu = t.closest && t.closest('[data-album-menu]');
    if (albumMenu) {
      state.menuAlbumId = albumMenu.getAttribute('data-album-id');
      $('md-album-menu-sub').textContent = albumById(state.menuAlbumId).name;
      openModal('md-album-menu');
      return;
    }
    if (t.closest && t.closest('#md-create-album')) { openAlbumModal(null); return; }
  });

  /* dropzone — click / keyboard / drag-drop (drop never fires on touch,
     so the hidden file input stays the real trigger) */
  (function wireDropzone() {
    var dz = $('md-dropzone');
    var input = $('md-file-input');
    dz.addEventListener('click', function () {
      if (state.uploading) return;
      input.click();
    });
    ['dragenter', 'dragover'].forEach(function (ev) {
      dz.addEventListener(ev, function (e) {
        e.preventDefault();
        if (!state.uploading) dz.classList.add('is-dragover');
      });
    });
    ['dragleave', 'dragend'].forEach(function (ev) {
      dz.addEventListener(ev, function () { dz.classList.remove('is-dragover'); });
    });
    dz.addEventListener('drop', function (e) {
      e.preventDefault();
      dz.classList.remove('is-dragover');
      if (state.uploading) return;
      if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    });
  })();

  /* select mode + bulk bar */
  $('md-select-toggle').addEventListener('click', function () { setSelectMode(!state.selectMode); });
  $('md-bulk-clear').addEventListener('click', function () { clearSelection(); });
  $('md-bulk-add').addEventListener('click', function () { openAssign('add', selectedIds()); });
  $('md-bulk-unfile').addEventListener('click', function () { openAssign('remove', selectedIds()); });
  $('md-bulk-delete').addEventListener('click', function () {
    var n = state.selectedCount; if (!n) return;
    pendingDeleteKind = 'photo';
    $('md-bulk-del-title').textContent = 'Remove these photos?';
    $('md-bulk-del-text').textContent = n + (n === 1 ? ' photo' : ' photos') + ' will be removed from your gallery. You can undo right after.';
    openModal('md-bulk-delete-modal');
  });
  $('md-bulk-del-confirm').addEventListener('click', function () {
    closeModal('md-bulk-delete-modal');
    if (pendingDeleteKind === 'video') bulkDeleteVideos(); else bulkDelete();
  });

  /* sort + filter toolbar */
  $('md-sort').addEventListener('click', function () {
    openFilterSheet({
      title: 'Sort photos', sub: 'Choose an order.',
      options: [
        { id: 'newest', label: 'Newest first', icon: 'arrow_downward', active: state.sort === 'newest' },
        { id: 'oldest', label: 'Oldest first', icon: 'arrow_upward', active: state.sort === 'oldest' },
        { id: 'name', label: 'Name A–Z', icon: 'sort_by_alpha', active: state.sort === 'name' }
      ],
      onPick: function (id) { if (id) { state.sort = id; applyFilters(); } }
    });
  });
  $('md-filter-album').addEventListener('click', function () {
    var opts = [{ id: null, label: 'All albums', icon: 'apps', active: !state.filterAlbumId }];
    state.albums.forEach(function (a) {
      opts.push({ id: a.id, label: a.name, icon: 'photo_album', desc: albumPhotos(a.id).length + ' photos', active: state.filterAlbumId === a.id });
    });
    openFilterSheet({ title: 'Filter by album', options: opts, onPick: function (id) { state.filterAlbumId = id; applyFilters(); } });
  });
  $('md-filter-subevent').addEventListener('click', function () {
    var opts = [{ id: null, label: 'All functions', icon: 'apps', active: !state.filterSubEventId }];
    state.subEvents.forEach(function (s) {
      var c = state.photos.filter(function (p) { return p.subEventId === s.id; }).length;
      opts.push({ id: s.id, label: s.name, icon: 'celebration', desc: c + ' photos', active: state.filterSubEventId === s.id });
    });
    openFilterSheet({ title: 'Filter by function', sub: 'Pick a celebration.', options: opts, onPick: function (id) { state.filterSubEventId = id; applyFilters(); } });
  });
  $('md-filter-date').addEventListener('click', function () {
    dateKind = 'photo';
    $('md-date-from').value = state.dateFrom ? isoDay(state.dateFrom) : '';
    $('md-date-to').value = state.dateTo ? isoDay(state.dateTo) : '';
    openModal('md-date-modal');
  });
  $('md-date-apply').addEventListener('click', function () {
    var f = $('md-date-from').value, t = $('md-date-to').value;
    if (f && t && f > t) { var s = f; f = t; t = s; }   /* ISO YYYY-MM-DD compares chronologically */
    var from = f ? new Date(f + 'T00:00:00').getTime() : null;
    var to = t ? new Date(t + 'T23:59:59').getTime() : null;
    closeModal('md-date-modal');
    if (dateKind === 'video') { vstate.dateFrom = from; vstate.dateTo = to; applyVFilters(); }
    else { state.dateFrom = from; state.dateTo = to; applyFilters(); }
  });
  $('md-date-clear').addEventListener('click', function () {
    $('md-date-from').value = ''; $('md-date-to').value = '';
    closeModal('md-date-modal');
    if (dateKind === 'video') { vstate.dateFrom = vstate.dateTo = null; applyVFilters(); }
    else { state.dateFrom = state.dateTo = null; applyFilters(); }
  });

  /* lightbox controls */
  $('md-lb-prev').addEventListener('click', function () { lbNav(-1); });
  $('md-lb-next').addEventListener('click', function () { lbNav(1); });
  $('md-lb-cover').addEventListener('click', function () {
    state.coverId = state.lbIds[state.lbIndex];
    toast('GALLERY COVER UPDATED');
    renderRecent(); renderGrid();
  });
  $('md-lb-assign').addEventListener('click', function () { openAssign('add', [state.lbIds[state.lbIndex]]); });
  $('md-lb-remove').addEventListener('click', function () {
    state.removePhotoId = state.lbIds[state.lbIndex];
    openModal('md-remove-modal');
  });
  $('md-remove-confirm').addEventListener('click', function () {
    var id = state.removePhotoId;
    state.removePhotoId = null;
    closeModal('md-remove-modal');
    closeModal('md-lightbox');
    if (id) removePhoto(id);
  });

  /* keyboard: ←/→ drive the lightbox; Esc exits select mode when no modal
     is open (shell.js owns Esc for modals) */
  document.addEventListener('keydown', function (e) {
    if (lightboxOpen()) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); lbNav(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); lbNav(1); }
      return;
    }
    if (vLightboxOpen()) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); vlbNav(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); vlbNav(1); }
      return;
    }
    if (e.key === 'Escape' && !document.querySelector('.modal-scrim.is-open')) {
      if (state.selectMode) setSelectMode(false);
      if (vstate.selectMode) setVSelectMode(false);
    }
  });

  /* touch swipe on the lightbox image */
  (function wireSwipe() {
    var startX = null, startY = null;
    var card = document.querySelector('#md-lightbox .modal-image-lightbox');
    if (!card) return;
    card.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    }, { passive: true });
    card.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      startX = startY = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) lbNav(dx < 0 ? 1 : -1);
    }, { passive: true });
  })();

  /* album modal + menu + delete confirm */
  $('md-album-form').addEventListener('submit', function (e) { e.preventDefault(); submitAlbumForm(); });
  $('md-album-name').addEventListener('input', hideAlbumError);
  $('md-album-rename').addEventListener('click', function () {
    var id = state.menuAlbumId;
    closeModal('md-album-menu');
    if (id) openAlbumModal(id);
  });
  $('md-album-delete').addEventListener('click', function () {
    state.deleteAlbumId = state.menuAlbumId;
    closeModal('md-album-menu');
    openModal('md-delete-album-modal');
  });
  $('md-del-album-confirm').addEventListener('click', function () {
    var id = state.deleteAlbumId;
    state.deleteAlbumId = null;
    closeModal('md-delete-album-modal');
    if (id) deleteAlbum(id);
  });

  /* ════════════════════════════════════════════════════════════════════
     VIDEOS — mirrors the Photos pipeline (own state slice; shares the album
     list + filter sheet + assign picker + confirm/date modals + toast).
     Playback is a stub (no real files in the prototype: poster + play button).
     ════════════════════════════════════════════════════════════════════ */
  var V_BATCH = 18;
  var pendingDeleteKind = 'photo';   /* routes the shared bulk-delete confirm */
  var dateKind = 'photo';            /* routes the shared date-range modal */

  function vSortComparator() {
    if (vstate.sort === 'oldest') return function (a, b) { return a.uploadedAt - b.uploadedAt; };
    if (vstate.sort === 'name') return function (a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true }); };
    return byNewest;
  }
  function visibleVideos() {
    var list = vstate.videos.slice();
    if (vstate.filterAlbumId) list = list.filter(function (v) { return v.albumIds.indexOf(vstate.filterAlbumId) !== -1; });
    if (vstate.filterSubEventId) list = list.filter(function (v) { return v.subEventId === vstate.filterSubEventId; });
    if (vstate.dateFrom) list = list.filter(function (v) { return (v.takenAt || v.uploadedAt) >= vstate.dateFrom; });
    if (vstate.dateTo) list = list.filter(function (v) { return (v.takenAt || v.uploadedAt) <= vstate.dateTo; });
    return list.sort(vSortComparator());
  }
  function buildVideoTile(v, opts) {
    opts = opts || {};
    var art = el('article', 'dp-tile photo-tile video-tile');
    art.setAttribute('data-video-id', v.id);
    if (vstate.selected[v.id]) art.classList.add('is-selected');
    var sel = el('label', 'photo-tile-select');
    var cb = document.createElement('input'); cb.type = 'checkbox';
    cb.setAttribute('data-video-select', ''); cb.setAttribute('aria-label', 'Select ' + v.name);
    cb.checked = !!vstate.selected[v.id];
    var check = el('span', 'photo-tile-check'); check.appendChild(mi('check'));
    sel.appendChild(cb); sel.appendChild(check);
    var btn = el('button', 'dp-tile-trigger'); btn.type = 'button';
    btn.setAttribute('data-vopen', ''); btn.setAttribute('data-video-id', v.id);
    btn.setAttribute('aria-label', 'Play ' + v.name + ' (' + v.duration + ')');
    var thumb = el('span', 'dp-tile-thumb');
    var img = document.createElement('img'); img.src = v.poster; img.alt = ''; img.loading = 'lazy';
    var play = el('span', 'media-vplay-badge'); play.appendChild(mi('play_arrow'));
    var dur = el('span', 'media-vduration'); dur.textContent = v.duration;
    thumb.appendChild(img); thumb.appendChild(play); thumb.appendChild(dur);
    btn.appendChild(thumb);
    art.appendChild(sel); art.appendChild(btn);
    if (opts.withActions) {
      var actions = el('div', 'photo-tile-actions');
      var add = el('button', 'photo-tile-action'); add.type = 'button';
      add.setAttribute('data-vassign-one', ''); add.setAttribute('data-video-id', v.id);
      add.setAttribute('aria-label', 'Add ' + v.name + ' to album');
      add.appendChild(mi('library_add'));
      actions.appendChild(add); art.appendChild(actions);
    }
    return art;
  }
  function renderVRecent() {
    var listEl = $('md-vrecent'); clear(listEl);
    var latest = vstate.videos.slice().sort(byNewest).slice(0, RECENT_MAX);
    $('md-vrecent-scroller').hidden = latest.length === 0;
    $('md-vrecent-empty').hidden = latest.length !== 0;
    latest.forEach(function (v) { var li = el('li'); li.appendChild(buildVideoTile(v, { withActions: true })); listEl.appendChild(li); });
  }
  function renderVGrid() { var grid = $('md-vgrid'); clear(grid); vstate.renderedCount = 0; appendVBatch(); updateVAllState(); }
  function appendVBatch() {
    var grid = $('md-vgrid'); var list = visibleVideos();
    var next = list.slice(vstate.renderedCount, vstate.renderedCount + V_BATCH);
    next.forEach(function (v) { grid.appendChild(buildVideoTile(v)); });
    vstate.renderedCount += next.length;
    $('md-vsentinel').hidden = vstate.renderedCount >= list.length;
  }
  function wireVSentinel() {
    if (!('IntersectionObserver' in window)) { $('md-vsentinel').hidden = true; return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting && !$('md-vsentinel').hidden) appendVBatch(); });
    }, { rootMargin: '400px 0px' }).observe($('md-vsentinel'));
  }
  function updateVAllState() {
    $('md-vall').setAttribute('data-photos-state', vstate.videos.length === 0 ? 'empty' : 'populated');
    $('md-vcount').textContent = String(visibleVideos().length);
  }
  function renderVEmptyHero() {
    var dz = $('md-vdropzone'); var isEmpty = vstate.videos.length === 0;
    dz.classList.toggle('is-hero', isEmpty);
    $('md-vdropzone-title').textContent = isEmpty ? 'Add your first videos' : 'Drag videos here, or tap to browse';
    $('md-vdropzone-sub').hidden = !isEmpty;
  }
  function renderVAll() { renderVEmptyHero(); renderVRecent(); renderVGrid(); renderVActiveChips(); updateVToolbarLabels(); }

  function vSetSelected(id, on) {
    if (on) { if (!vstate.selected[id]) { vstate.selected[id] = true; vstate.selectedCount++; } }
    else if (vstate.selected[id]) { delete vstate.selected[id]; vstate.selectedCount--; }
  }
  function updateVBulk() { $('md-vbulk').hidden = vstate.selectedCount === 0; $('md-vbulk-count').textContent = vstate.selectedCount + ' selected'; }
  function vSelectedIds() { return Object.keys(vstate.selected); }
  function clearVSelection() {
    vstate.selected = {}; vstate.selectedCount = 0;
    var checks = document.querySelectorAll('#md-panel-videos [data-video-select]');
    Array.prototype.forEach.call(checks, function (c) { c.checked = false; var t = c.closest('.video-tile'); if (t) t.classList.remove('is-selected'); });
    updateVBulk();
  }
  function setVSelectMode(on) {
    vstate.selectMode = on;
    $('md-vall').setAttribute('data-select-mode', on ? 'on' : 'off');
    $('md-vselect-toggle').setAttribute('aria-pressed', on ? 'true' : 'false');
    $('md-vselect-label').textContent = on ? 'Done' : 'Select';
    if (!on) clearVSelection();
  }

  function vDateLabel() {
    if (vstate.dateFrom && vstate.dateTo) return fmtDate(vstate.dateFrom) + ' – ' + fmtDate(vstate.dateTo);
    if (vstate.dateFrom) return 'From ' + fmtDate(vstate.dateFrom);
    if (vstate.dateTo) return 'Until ' + fmtDate(vstate.dateTo);
    return null;
  }
  function updateVToolbarLabels() {
    $('md-vsort-label').textContent = vstate.sort === 'oldest' ? 'Oldest' : vstate.sort === 'name' ? 'Name A–Z' : 'Newest';
    setToolActive('md-vfilter-album', !!vstate.filterAlbumId);
    setToolActive('md-vfilter-subevent', !!vstate.filterSubEventId);
    setToolActive('md-vfilter-date', !!(vstate.dateFrom || vstate.dateTo));
  }
  function renderVActiveChips() {
    var wrap = $('md-vactive-filter'); clear(wrap); var any = false;
    if (vstate.filterAlbumId) { var a = albumById(vstate.filterAlbumId); if (a) { wrap.appendChild(chip(a.name, function () { vstate.filterAlbumId = null; applyVFilters(); })); any = true; } }
    if (vstate.filterSubEventId) { var s = subEventById(vstate.filterSubEventId); if (s) { wrap.appendChild(chip(s.name, function () { vstate.filterSubEventId = null; applyVFilters(); })); any = true; } }
    var dl = vDateLabel();
    if (dl) { wrap.appendChild(chip(dl, function () { vstate.dateFrom = vstate.dateTo = null; applyVFilters(); })); any = true; }
    if (any) { var all = el('button', 'media-clear-all'); all.type = 'button'; all.textContent = 'Clear all'; all.addEventListener('click', function () { vstate.filterAlbumId = vstate.filterSubEventId = vstate.dateFrom = vstate.dateTo = null; applyVFilters(); }); wrap.appendChild(all); }
    wrap.hidden = !any;
  }
  function applyVFilters() { renderVActiveChips(); updateVToolbarLabels(); renderVGrid(); }

  function openVLightbox(id) {
    vstate.lbIds = visibleVideos().map(function (v) { return v.id; });
    vstate.lbIndex = vstate.lbIds.indexOf(id);
    if (vstate.lbIndex === -1) { vstate.lbIds = [id]; vstate.lbIndex = 0; }
    renderVLightbox(); openModal('md-vlightbox');
  }
  function renderVLightbox() {
    var v = vById(vstate.lbIds[vstate.lbIndex]); if (!v) return;
    $('md-vlb-img').src = v.poster; $('md-vlb-img').alt = v.name;
    $('md-vlb-title').textContent = v.name;
    $('md-vlb-sub').textContent = v.duration + ' · uploaded ' + fmtDate(v.uploadedAt);
    $('md-vlb-duration').textContent = v.duration;
    $('md-vlb-prev').disabled = vstate.lbIndex <= 0;
    $('md-vlb-next').disabled = vstate.lbIndex >= vstate.lbIds.length - 1;
    [vstate.lbIndex - 1, vstate.lbIndex + 1].forEach(function (i) {
      if (i >= 0 && i < vstate.lbIds.length) { var n = vById(vstate.lbIds[i]); if (n) { var pre = new Image(); pre.src = n.poster; } }
    });
  }
  function vlbNav(dir) { var next = vstate.lbIndex + dir; if (next < 0 || next >= vstate.lbIds.length) return; vstate.lbIndex = next; renderVLightbox(); }
  function vLightboxOpen() { var lb = $('md-vlightbox'); return lb && lb.classList.contains('is-open'); }

  function removeVideo(id) {
    vstate.videos = vstate.videos.filter(function (v) { return v.id !== id; });
    vSetSelected(id, false); toast('VIDEO REMOVED'); renderVAll(); updateVBulk();
  }
  function bulkDeleteVideos() {
    var ids = vSelectedIds(); if (!ids.length) return;
    var removed = [];
    ids.forEach(function (id) { for (var i = 0; i < vstate.videos.length; i++) if (vstate.videos[i].id === id) { removed.push({ v: vstate.videos[i], idx: i }); break; } });
    if (!removed.length) return;
    removed.slice().sort(function (a, b) { return b.idx - a.idx; }).forEach(function (r) { vstate.videos.splice(r.idx, 1); });
    setVSelectMode(false); renderVAll(); updateVBulk();
    var n = removed.length;
    toast(n + (n === 1 ? ' VIDEO REMOVED' : ' VIDEOS REMOVED'), {
      actionLabel: 'Undo',
      onAction: function () { removed.slice().sort(function (a, b) { return a.idx - b.idx; }).forEach(function (r) { vstate.videos.splice(Math.min(r.idx, vstate.videos.length), 0, r.v); }); renderVAll(); toast('VIDEOS RESTORED'); }
    });
  }

  /* uploads (videos) — faked, mirrors the photo upload */
  var V_MAX_BYTES = 200 * 1024 * 1024;
  var V_ACCEPT = /\.(mp4|mov|m4v|webm)$/i;
  function addUploadedVideo(file) {
    var durSec = 30 + (vstate.seq * 11) % 180;
    vstate.videos.unshift({ id: 'uv-' + vstate.seq, poster: FX.photoSVG(200 + vstate.seq * 7), name: (file.name || 'Clip').replace(/\.[^.]+$/, ''), durationSec: durSec, duration: FX.durationLabel(durSec), albumIds: [], subEventId: null, takenAt: Date.now(), uploadedAt: Date.now() });
    vstate.seq++;
  }
  function vRejectDrop(message) { var dz = $('md-vdropzone'); dz.classList.add('is-rejected'); toast(message); setTimeout(function () { dz.classList.remove('is-rejected'); }, 1600); }
  function vPreflight(files) {
    var list = Array.prototype.slice.call(files);
    if (list.length > MAX_FILES_PER_DROP) { vRejectDrop("That's " + list.length + ' files — add up to ' + MAX_FILES_PER_DROP + ' at a time.'); return null; }
    var accepted = [];
    for (var i = 0; i < list.length; i++) {
      var f = list[i];
      var ok = (f.type && f.type.indexOf('video/') === 0) || V_ACCEPT.test(f.name || '');
      if (!ok) { vRejectDrop('"' + f.name + "\" isn't a video we can use — try MP4 or MOV."); return null; }
      if (f.size > V_MAX_BYTES) { vRejectDrop('"' + f.name + '" is too large — videos can be up to 200 MB each.'); return null; }
      accepted.push(f);
    }
    return accepted;
  }
  function vBuildUploadRow(file) {
    var li = el('li', 'media-upload-row'); li.setAttribute('data-state', 'uploading');
    var icon = mi('progress_activity'); icon.classList.add('media-upload-state-icon');
    var main = el('div', 'media-upload-main');
    var name = el('span', 'media-upload-name'); name.textContent = file.name; name.title = file.name;
    var track = el('span', 'media-upload-track'); var fill = el('span', 'media-upload-fill'); track.appendChild(fill);
    main.appendChild(name); main.appendChild(track);
    var status = el('span', 'media-upload-status'); status.textContent = 'Uploading…';
    li.appendChild(icon); li.appendChild(main); li.appendChild(status);
    return { li: li, icon: icon, fill: fill, status: status };
  }
  function vRunUploadRow(file, row, done) {
    var pct = 0;
    var timer = setInterval(function () {
      pct += 10 + Math.random() * 9;
      if (pct >= 100) {
        clearInterval(timer); row.fill.style.width = '100%';
        row.li.setAttribute('data-state', 'processing'); row.icon.textContent = 'sync'; row.status.textContent = 'Processing…';
        setTimeout(function () { row.li.setAttribute('data-state', 'success'); row.icon.textContent = 'check_circle'; row.status.textContent = 'Done'; addUploadedVideo(file); renderVAll(); setTimeout(function () { row.li.remove(); }, 3500); done(true); }, 700);
        return;
      }
      row.fill.style.width = Math.min(99, pct) + '%';
    }, 200);
  }
  function vHandleFiles(files) {
    if (vstate.uploading) return;
    var accepted = vPreflight(files); if (!accepted || !accepted.length) return;
    var listEl = $('md-vupload-list'); vstate.uploading = true; $('md-vdropzone').setAttribute('aria-disabled', 'true');
    var pending = accepted.length, anySuccess = false;
    accepted.forEach(function (file) { var row = vBuildUploadRow(file); listEl.appendChild(row.li); vRunUploadRow(file, row, function (ok) { if (ok) anySuccess = true; pending--; if (pending <= 0) { vstate.uploading = false; $('md-vdropzone').removeAttribute('aria-disabled'); if (anySuccess) toast('VIDEOS UPLOADED'); } }); });
  }

  (function wireVideos() {
    var dz = $('md-vdropzone'), input = $('md-vfile-input');
    dz.addEventListener('click', function () { if (!vstate.uploading) input.click(); });
    ['dragenter', 'dragover'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); if (!vstate.uploading) dz.classList.add('is-dragover'); }); });
    ['dragleave', 'dragend'].forEach(function (ev) { dz.addEventListener(ev, function () { dz.classList.remove('is-dragover'); }); });
    dz.addEventListener('drop', function (e) { e.preventDefault(); dz.classList.remove('is-dragover'); if (!vstate.uploading && e.dataTransfer && e.dataTransfer.files) vHandleFiles(e.dataTransfer.files); });
    input.addEventListener('change', function () { vHandleFiles(input.files || []); input.value = ''; });

    $('md-panel-videos').addEventListener('click', function (e) {
      var openBtn = e.target.closest && e.target.closest('[data-vopen]');
      if (openBtn) {
        var id = openBtn.getAttribute('data-video-id');
        if (vstate.selectMode) { var tile = openBtn.closest('.video-tile'); var c = tile && tile.querySelector('[data-video-select]'); if (c) { c.checked = !c.checked; c.dispatchEvent(new Event('change', { bubbles: true })); } return; }
        openVLightbox(id); return;
      }
      var assignOne = e.target.closest && e.target.closest('[data-vassign-one]');
      if (assignOne) { openAssign('add', [assignOne.getAttribute('data-video-id')], 'video'); return; }
    });
    $('md-panel-videos').addEventListener('change', function (e) {
      var cb = e.target.closest && e.target.closest('[data-video-select]');
      if (!cb) return;
      var tile = cb.closest('.video-tile'); var id = tile && tile.getAttribute('data-video-id'); if (!id) return;
      vSetSelected(id, cb.checked);
      var twins = document.querySelectorAll('#md-panel-videos .video-tile[data-video-id="' + id + '"]');
      Array.prototype.forEach.call(twins, function (t) { t.classList.toggle('is-selected', cb.checked); var c = t.querySelector('[data-video-select]'); if (c) c.checked = cb.checked; });
      updateVBulk();
    });

    $('md-vselect-toggle').addEventListener('click', function () { setVSelectMode(!vstate.selectMode); });
    $('md-vbulk-clear').addEventListener('click', function () { clearVSelection(); });
    $('md-vbulk-add').addEventListener('click', function () { openAssign('add', vSelectedIds(), 'video'); });
    $('md-vbulk-unfile').addEventListener('click', function () { openAssign('remove', vSelectedIds(), 'video'); });
    $('md-vbulk-delete').addEventListener('click', function () {
      var n = vstate.selectedCount; if (!n) return;
      pendingDeleteKind = 'video';
      $('md-bulk-del-title').textContent = 'Remove these videos?';
      $('md-bulk-del-text').textContent = n + (n === 1 ? ' video' : ' videos') + ' will be removed from your gallery. You can undo right after.';
      openModal('md-bulk-delete-modal');
    });

    $('md-vsort').addEventListener('click', function () {
      openFilterSheet({ title: 'Sort videos', sub: 'Choose an order.', options: [
        { id: 'newest', label: 'Newest first', icon: 'arrow_downward', active: vstate.sort === 'newest' },
        { id: 'oldest', label: 'Oldest first', icon: 'arrow_upward', active: vstate.sort === 'oldest' },
        { id: 'name', label: 'Name A–Z', icon: 'sort_by_alpha', active: vstate.sort === 'name' }
      ], onPick: function (id) { if (id) { vstate.sort = id; applyVFilters(); } } });
    });
    $('md-vfilter-album').addEventListener('click', function () {
      var opts = [{ id: null, label: 'All albums', icon: 'apps', active: !vstate.filterAlbumId }];
      state.albums.forEach(function (a) { var c = vstate.videos.filter(function (v) { return v.albumIds.indexOf(a.id) !== -1; }).length; opts.push({ id: a.id, label: a.name, icon: 'photo_album', desc: c + ' videos', active: vstate.filterAlbumId === a.id }); });
      openFilterSheet({ title: 'Filter by album', options: opts, onPick: function (id) { vstate.filterAlbumId = id; applyVFilters(); } });
    });
    $('md-vfilter-subevent').addEventListener('click', function () {
      var opts = [{ id: null, label: 'All functions', icon: 'apps', active: !vstate.filterSubEventId }];
      state.subEvents.forEach(function (s) { var c = vstate.videos.filter(function (v) { return v.subEventId === s.id; }).length; opts.push({ id: s.id, label: s.name, icon: 'celebration', desc: c + ' videos', active: vstate.filterSubEventId === s.id }); });
      openFilterSheet({ title: 'Filter by function', sub: 'Pick a celebration.', options: opts, onPick: function (id) { vstate.filterSubEventId = id; applyVFilters(); } });
    });
    $('md-vfilter-date').addEventListener('click', function () {
      dateKind = 'video';
      $('md-date-from').value = vstate.dateFrom ? isoDay(vstate.dateFrom) : '';
      $('md-date-to').value = vstate.dateTo ? isoDay(vstate.dateTo) : '';
      openModal('md-date-modal');
    });

    $('md-vlb-prev').addEventListener('click', function () { vlbNav(-1); });
    $('md-vlb-next').addEventListener('click', function () { vlbNav(1); });
    $('md-vlb-play').addEventListener('click', function () { toast('PLAYBACK — PROTOTYPE'); });
    $('md-vlb-assign').addEventListener('click', function () { openAssign('add', [vstate.lbIds[vstate.lbIndex]], 'video'); });
    $('md-vlb-remove').addEventListener('click', function () { var id = vstate.lbIds[vstate.lbIndex]; closeModal('md-vlightbox'); removeVideo(id); });
  })();

  /* ── sub-nav tabs (.seg role=tablist, in-page — same idiom as planning views +
        website sub-nav). Roving tabindex; click + Arrow/Home/End. Panels toggle via
        aria-controls + [hidden]. */
  (function wireTabs() {
    var tablist = document.querySelector('.seg[role="tablist"][aria-label="Media sections"]');
    if (!tablist) return;
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      // Leaving a tab while selecting → exit that tab's select-mode so the floating
      // bulk-bar doesn't orphan over another panel (matches planning.js's exitSelect guard).
      if (tab.id !== 'md-tab-photos' && state.selectMode) setSelectMode(false);
      if (tab.id !== 'md-tab-videos' && vstate.selectMode) setVSelectMode(false);
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.classList.toggle('is-active', on);
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }
    tablist.addEventListener('click', function (e) {
      var tab = e.target.closest('[role="tab"]');
      if (tab) select(tab, false);
    });
    tablist.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var n = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      if (n !== null) { e.preventDefault(); select(tabs[n], true); }
    });
  })();

  /* ── boot ───────────────────────────────────────────────────────────── */
  wireSentinel();
  renderAll();
  updateBulk();
  wireVSentinel();
  renderVAll();
  updateVBulk();
})();
