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
    coverId: FX.photos.length ? FX.photos[0].id : null,
    selected: {},               /* photoId -> true */
    selectedCount: 0,
    selectMode: false,
    filterAlbumId: null,
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

  /* ── tiny DOM helpers (photos.js idiom — no innerHTML) ─────────────── */
  function $(id) { return document.getElementById(id); }
  function el(t, c) { var n = document.createElement(t); if (c) n.className = c; return n; }
  function mi(name) { var s = el('span', 'material-symbols-outlined'); s.setAttribute('aria-hidden', 'true'); s.textContent = name; return s; }
  function txt(s) { return document.createTextNode(s); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function toast(m) { if (window.evenzi && window.evenzi.showToast) window.evenzi.showToast(m); }
  function openModal(id) { if (window.evenzi && window.evenzi.openModal) window.evenzi.openModal(id); }
  function closeModal(id) { if (window.evenzi && window.evenzi.closeModal) window.evenzi.closeModal(id); }

  /* ── data selectors ─────────────────────────────────────────────────── */
  function byNewest(a, b) { return b.uploadedAt - a.uploadedAt; }
  function visiblePhotos() {
    var list = state.photos.slice().sort(byNewest);
    if (state.filterAlbumId) {
      list = list.filter(function (p) { return p.albumIds.indexOf(state.filterAlbumId) !== -1; });
    }
    return list;
  }
  function photoById(id) {
    for (var i = 0; i < state.photos.length; i++) if (state.photos[i].id === id) return state.photos[i];
    return null;
  }
  function albumById(id) {
    for (var i = 0; i < state.albums.length; i++) if (state.albums[i].id === id) return state.albums[i];
    return null;
  }
  function albumPhotos(albumId) {
    return state.photos.filter(function (p) { return p.albumIds.indexOf(albumId) !== -1; });
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

    var emptyAlbums = [], filledAlbums = [];
    state.albums.forEach(function (a) {
      (albumPhotos(a.id).length ? filledAlbums : emptyAlbums).push(a);
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
      var count = photos.length;
      var art = el('article', 'dp-tile album-card');
      art.setAttribute('data-album-id', a.id);

      var open = el('button', 'dp-tile-link album-card-open'); open.type = 'button';
      open.setAttribute('data-album-open', ''); open.setAttribute('data-album-id', a.id);
      open.setAttribute('aria-label', 'Open ' + a.name + ' album — ' + count + (count === 1 ? ' photo' : ' photos'));

      var body = el('div');
      var thumb = el('span', 'dp-tile-thumb');
      var img = document.createElement('img'); img.src = photos[0].src; img.alt = ''; img.loading = 'lazy';
      thumb.appendChild(img);
      var meta = el('div', 'dp-tile-meta');
      var name = el('span', 'dp-tile-name'); name.textContent = a.name; name.title = a.name;
      var sub = el('span', 'dp-tile-sub album-card-count');
      sub.textContent = count + (count === 1 ? ' photo' : ' photos');
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
    renderFilterChip();
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

  /* ── album filter ───────────────────────────────────────────────────── */
  function renderFilterChip() {
    var wrap = $('md-active-filter');
    var a = state.filterAlbumId ? albumById(state.filterAlbumId) : null;
    wrap.hidden = !a;
    if (a) {
      $('md-filter-name').textContent = a.name;
      $('md-filter-clear').setAttribute('aria-label', 'Clear ' + a.name + ' filter');
    }
  }
  function setFilter(albumId) {
    state.filterAlbumId = albumId;
    renderFilterChip();
    renderGrid();
    if (albumId) $('md-all').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

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

  /* ── assign-to-album picker ─────────────────────────────────────────
     Lands in promote step 3/3 — net-new behavior on the shell
     .modal-picker-grid primitive (do NOT promote guests.js openPicker). */
  function openAssign(mode, photoIds) { /* wired in step 3/3 */ }

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
    renderFilterChip();
  }
  function deleteAlbum(id) {
    state.albums = state.albums.filter(function (a) { return a.id !== id; });
    /* un-file only — photos stay safe in All Photos */
    state.photos.forEach(function (p) {
      var i = p.albumIds.indexOf(id);
      if (i !== -1) p.albumIds.splice(i, 1);
    });
    if (state.filterAlbumId === id) state.filterAlbumId = null;
    toast('ALBUM REMOVED');
    renderAll();
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
    if (albumOpen) { setFilter(albumOpen.getAttribute('data-album-id')); return; }
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
  $('md-filter-clear').addEventListener('click', function () { setFilter(null); });

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
    if (e.key === 'Escape' && state.selectMode && !document.querySelector('.modal-scrim.is-open')) {
      setSelectMode(false);
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

  /* ── boot ───────────────────────────────────────────────────────────── */
  wireSentinel();
  renderAll();
  updateBulk();
})();
