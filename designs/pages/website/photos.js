/* Photos tab — curate the public Gallery page's photos.
   Standalone gallery management (Media & Memories not built yet). Tiles use
   generated SVG placeholders. select / set-Gallery-cover / remove + bulk
   remove (confirm) + add (stub) + lightbox. Modals owned by shell.js. No innerHTML. */
(function () {
  var grid = document.getElementById('ph-grid');
  var card = document.querySelector('.dp-photos-card');
  var countEl = document.getElementById('ph-count');
  var bulk = document.getElementById('ph-bulk');
  var bulkCount = document.getElementById('ph-bulk-count');
  var lbImg = document.getElementById('ph-lb-img');
  var lbTitle = document.getElementById('ph-lb-title');
  var lbCover = document.getElementById('ph-lb-cover');
  var lbRemove = document.getElementById('ph-lb-remove');
  var delText = document.getElementById('ph-del-text');
  var delConfirm = document.getElementById('ph-del-confirm');
  if (!grid) return;

  var nextId = 13;
  var lbCurrentId = null;

  function toast(m) { if (window.evenzi && window.evenzi.showToast) window.evenzi.showToast(m); }
  function open(id) { if (window.evenzi && window.evenzi.openModal) window.evenzi.openModal(id); }
  function close(id) { if (window.evenzi && window.evenzi.closeModal) window.evenzi.closeModal(id); }
  function el(t, c) { var n = document.createElement(t); if (c) n.className = c; return n; }
  function mi(name) { var s = el('span', 'material-symbols-outlined'); s.setAttribute('aria-hidden', 'true'); s.textContent = name; return s; }

  function photoSVG(i) {
    var h = (i * 47) % 360;
    var c1 = 'hsl(' + h + ',55%,68%)', c2 = 'hsl(' + ((h + 35) % 360) + ',50%,46%)';
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">'
      + '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs>'
      + '<rect width="400" height="400" fill="url(#g)"/>'
      + '<circle cx="130" cy="135" r="30" fill="rgba(255,255,255,.85)"/>'
      + '<path d="M0 300 L120 205 L210 285 L300 195 L400 275 L400 400 L0 400 Z" fill="rgba(0,0,0,.16)"/>'
      + '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  }

  function iconBtn(glyph, attr, id, label) {
    var b = el('button', 'photo-tile-action'); b.type = 'button'; b.setAttribute(attr, ''); b.setAttribute('data-photo-id', id); b.setAttribute('aria-label', label); b.appendChild(mi(glyph)); return b;
  }

  function buildTile(p) {
    var art = el('article', 'dp-tile photo-tile'); art.setAttribute('data-photo-id', p.id);
    if (p.cover) art.setAttribute('data-cover', 'true');

    var sel = el('label', 'photo-tile-select');
    var cb = document.createElement('input'); cb.type = 'checkbox'; cb.setAttribute('data-photo-select', ''); cb.setAttribute('aria-label', 'Select ' + p.name);
    var check = el('span', 'photo-tile-check'); check.appendChild(mi('check'));
    sel.appendChild(cb); sel.appendChild(check);

    var btn = el('button', 'dp-tile-trigger'); btn.type = 'button'; btn.setAttribute('data-ph-open', ''); btn.setAttribute('data-photo-id', p.id); btn.setAttribute('aria-label', 'View ' + p.name + ' full size');
    var thumb = el('span', 'dp-tile-thumb');
    var img = document.createElement('img'); img.src = p.src; img.alt = ''; img.loading = 'lazy';
    thumb.appendChild(img); btn.appendChild(thumb);

    var badge = el('span', 'photo-tile-cover-badge'); badge.appendChild(mi('star')); badge.appendChild(document.createTextNode('Cover')); if (!p.cover) badge.hidden = true;

    var actions = el('div', 'photo-tile-actions');
    actions.appendChild(iconBtn('star', 'data-ph-cover', p.id, 'Set ' + p.name + ' as Gallery cover'));
    var rmBtn = iconBtn('delete', 'data-ph-remove', p.id, 'Remove ' + p.name);
    rmBtn.setAttribute('data-tile-danger', '');   /* shell danger-hover hook */
    actions.appendChild(rmBtn);

    art.appendChild(sel); art.appendChild(btn); art.appendChild(badge); art.appendChild(actions);
    return art;
  }

  function tiles() { return Array.prototype.slice.call(grid.querySelectorAll('.photo-tile')); }
  function updateCount() {
    var n = tiles().length;
    if (countEl) countEl.textContent = n;
    card.setAttribute('data-photos-state', n === 0 ? 'empty' : 'populated');
  }
  function selected() { return tiles().filter(function (t) { var c = t.querySelector('[data-photo-select]'); return c && c.checked; }); }
  function updateBulk() {
    var n = selected().length;
    if (n > 0) { bulk.hidden = false; bulkCount.textContent = n + ' selected'; }
    else { bulk.hidden = true; }
  }
  function setCover(id) {
    tiles().forEach(function (t) {
      var isIt = t.getAttribute('data-photo-id') === id;
      if (isIt) t.setAttribute('data-cover', 'true'); else t.removeAttribute('data-cover');
      var b = t.querySelector('.photo-tile-cover-badge'); if (b) b.hidden = !isIt;
    });
  }
  function nameOf(id) { var t = grid.querySelector('.photo-tile[data-photo-id="' + id + '"]'); return t ? (t.querySelector('.dp-tile-trigger') || {}).getAttribute('aria-label') : ''; }

  /* seed 12 photos, first is cover */
  for (var i = 1; i <= 12; i++) grid.appendChild(buildTile({ id: 'p-' + i, name: 'Photo ' + i, src: photoSVG(i), cover: i === 1 }));
  updateCount();

  /* delegated interactions */
  grid.addEventListener('change', function (e) {
    if (e.target.closest('[data-photo-select]')) {
      var li = e.target.closest('.photo-tile');
      if (li) li.classList.toggle('is-selected', e.target.checked);
      updateBulk();
    }
  });
  grid.addEventListener('click', function (e) {
    var openBtn = e.target.closest('[data-ph-open]');
    if (openBtn) {
      var id = openBtn.getAttribute('data-photo-id');
      var t = grid.querySelector('.photo-tile[data-photo-id="' + id + '"]');
      lbCurrentId = id;
      lbImg.src = t.querySelector('img').src; lbImg.alt = nameOf(id);
      lbTitle.textContent = (nameOf(id) || 'Photo').replace('View ', '').replace(' full size', '');
      open('ph-lightbox');
      return;
    }
    var cov = e.target.closest('[data-ph-cover]');
    if (cov) { setCover(cov.getAttribute('data-photo-id')); toast('GALLERY COVER UPDATED'); return; }
    var rm = e.target.closest('[data-ph-remove]');
    if (rm) { var t2 = rm.closest('.photo-tile'); if (t2) { t2.remove(); updateCount(); updateBulk(); toast('PHOTO REMOVED'); } return; }
  });

  /* lightbox actions */
  if (lbCover) lbCover.addEventListener('click', function () { if (lbCurrentId) { setCover(lbCurrentId); toast('GALLERY COVER UPDATED'); } });
  if (lbRemove) lbRemove.addEventListener('click', function () {
    if (lbCurrentId) { var t = grid.querySelector('.photo-tile[data-photo-id="' + lbCurrentId + '"]'); if (t) { t.remove(); updateCount(); updateBulk(); toast('PHOTO REMOVED'); } close('ph-lightbox'); }
  });

  /* add (stub) */
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-ph-add]')) {
      var id = 'p-' + nextId;
      grid.appendChild(buildTile({ id: id, name: 'Photo ' + nextId, src: photoSVG(nextId), cover: false }));
      nextId++; updateCount(); toast('PHOTO ADDED');
      grid.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (e.target.closest('[data-ph-clear]')) {
      tiles().forEach(function (t) { var c = t.querySelector('[data-photo-select]'); if (c) c.checked = false; t.classList.remove('is-selected'); });
      updateBulk(); return;
    }
    if (e.target.closest('[data-ph-bulk-remove]')) {
      var n = selected().length;
      delText.textContent = n + (n === 1 ? ' photo' : ' photos') + ' will be removed from your Gallery page. This can’t be undone.';
      open('ph-del-modal'); return;
    }
  });

  if (delConfirm) delConfirm.addEventListener('click', function () {
    selected().forEach(function (t) { t.remove(); });
    updateCount(); updateBulk(); close('ph-del-modal'); toast('PHOTOS REMOVED');
  });
})();
