/* Card Templates tab — data-driven grid + style filter + lightbox preview.
   Real card art (PDF/PNG) doesn't exist yet, so tiles + lightbox render a
   tasteful SVG placeholder per style. Download/WhatsApp are prototype stubs
   (toast). Modal open/close/focus-trap is owned by shell.js. No innerHTML. */
(function () {
  var grid = document.getElementById('ct-grid');
  var filtersEl = document.getElementById('ct-filters');
  var countEl = document.getElementById('ct-count');
  var emptyEl = document.getElementById('ct-empty');
  var showAll = document.getElementById('ct-show-all');
  var lbImg = document.getElementById('ct-lb-img');
  var lbTitle = document.getElementById('ct-lb-title');
  var lbSub = document.getElementById('ct-lb-sub');
  var lbPdf = document.getElementById('ct-lb-pdf');
  var lbPng = document.getElementById('ct-lb-png');
  if (!grid) return;

  var STYLES = ['classic', 'floral', 'modern', 'festive', 'minimal', 'royal'];
  var TINT = { classic: '#8a6d3b', floral: '#d6336c', modern: '#3b5bdb', festive: '#f08c00', minimal: '#495057', royal: '#7048e8' };
  var BG = { classic: '#f7f1e8', floral: '#fdf0f4', modern: '#eef1fc', festive: '#fff3e0', minimal: '#f1f3f5', royal: '#f3effe' };
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* Manifest (mirrors assets/card-templates/manifest.json — data-driven) */
  var CARDS = [
    { id: 'classic-01', name: 'Royal Border', style: 'classic' },
    { id: 'classic-02', name: 'Heritage Crest', style: 'classic' },
    { id: 'classic-03', name: 'Golden Frame', style: 'classic' },
    { id: 'floral-01', name: 'Marigold Arch', style: 'floral' },
    { id: 'floral-02', name: 'Rose Garden', style: 'floral' },
    { id: 'floral-03', name: 'Lotus Bloom', style: 'floral' },
    { id: 'modern-01', name: 'Clean Lines', style: 'modern' },
    { id: 'modern-02', name: 'Bold Type', style: 'modern' },
    { id: 'modern-03', name: 'Mono Grid', style: 'modern' },
    { id: 'festive-01', name: 'Marigold Fest', style: 'festive' },
    { id: 'festive-02', name: 'Dhol Nights', style: 'festive' },
    { id: 'festive-03', name: 'Diya Glow', style: 'festive' },
    { id: 'minimal-01', name: 'Quiet Serif', style: 'minimal' },
    { id: 'minimal-02', name: 'Just Names', style: 'minimal' },
    { id: 'minimal-03', name: 'Soft Ivory', style: 'minimal' },
    { id: 'royal-01', name: 'Maharaja', style: 'royal' },
    { id: 'royal-02', name: 'Palace Gold', style: 'royal' },
    { id: 'royal-03', name: 'Peacock Throne', style: 'royal' }
  ];

  function svg(card) {
    var t = TINT[card.style], bg = BG[card.style];
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">'
      + '<rect width="600" height="800" fill="' + bg + '"/>'
      + '<rect x="34" y="34" width="532" height="732" fill="none" stroke="' + t + '" stroke-width="2.5" rx="16"/>'
      + '<text x="300" y="150" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-size="20" letter-spacing="7" fill="' + t + '">THE WEDDING OF</text>'
      + '<text x="300" y="408" text-anchor="middle" font-family="Georgia,serif" font-size="58" fill="' + t + '">' + card.name + '</text>'
      + '<line x1="225" y1="452" x2="375" y2="452" stroke="' + t + '" stroke-width="2"/>'
      + '<text x="300" y="505" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-size="19" letter-spacing="5" fill="' + t + '" opacity="0.72">' + cap(card.style).toUpperCase() + ' · SAMPLE</text>'
      + '<text x="300" y="700" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-size="22" letter-spacing="3" fill="' + t + '">Sat · 22 Dec 2025</text>'
      + '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  }

  function el(t, c) { var n = document.createElement(t); if (c) n.className = c; return n; }

  function buildTile(card) {
    var art = el('article', 'dp-tile'); art.setAttribute('data-style', card.style);
    var btn = el('button', 'dp-tile-trigger'); btn.type = 'button';
    btn.setAttribute('data-ct-open', ''); btn.setAttribute('data-card-id', card.id);
    btn.setAttribute('aria-label', 'Preview ' + card.name + ' card');
    var thumb = el('span', 'dp-tile-thumb dp-tile-thumb-3-4');
    var img = document.createElement('img'); img.src = svg(card); img.alt = ''; img.loading = 'lazy';
    thumb.appendChild(img);
    var meta = el('span', 'dp-tile-meta');
    var nm = el('span', 'dp-tile-name'); nm.textContent = card.name;
    var sub = el('span', 'dp-tile-sub'); var tag = el('span', 'dp-card-style-tag'); tag.textContent = cap(card.style); sub.appendChild(tag);
    meta.appendChild(nm); meta.appendChild(sub);
    btn.appendChild(thumb); btn.appendChild(meta); art.appendChild(btn);
    return art;
  }

  function buildChip(label, value, active) {
    var b = el('button', 'dp-filter-chip' + (active ? ' is-active' : '')); b.type = 'button';
    b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', active ? 'true' : 'false');
    b.setAttribute('data-style-filter', value); b.tabIndex = active ? 0 : -1; b.textContent = label;
    return b;
  }

  function applyFilter(value) {
    filtersEl.querySelectorAll('.dp-filter-chip').forEach(function (c) {
      var on = c.getAttribute('data-style-filter') === value;
      c.classList.toggle('is-active', on); c.setAttribute('aria-checked', on ? 'true' : 'false'); c.tabIndex = on ? 0 : -1;
    });
    var shown = 0;
    grid.querySelectorAll('.dp-tile').forEach(function (t) {
      var match = value === 'all' || t.getAttribute('data-style') === value;
      t.hidden = !match; if (match) shown++;
    });
    countEl.textContent = 'Showing ' + shown + ' ' + (value === 'all' ? 'cards' : cap(value) + ' cards');
    emptyEl.hidden = shown > 0;
    grid.hidden = shown === 0;
  }

  /* render */
  filtersEl.appendChild(buildChip('All', 'all', true));
  STYLES.forEach(function (s) { filtersEl.appendChild(buildChip(cap(s), s, false)); });
  CARDS.forEach(function (c) { grid.appendChild(buildTile(c)); });
  applyFilter('all');

  /* filter chip click + roving arrow keys (radiogroup) */
  filtersEl.addEventListener('click', function (e) {
    var c = e.target.closest('[data-style-filter]'); if (c) applyFilter(c.getAttribute('data-style-filter'));
  });
  filtersEl.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var chips = Array.prototype.slice.call(filtersEl.querySelectorAll('.dp-filter-chip'));
    var i = 0; chips.forEach(function (c, idx) { if (c.getAttribute('aria-checked') === 'true') i = idx; });
    var ni = e.key === 'ArrowRight' ? (i + 1) % chips.length : (i - 1 + chips.length) % chips.length;
    applyFilter(chips[ni].getAttribute('data-style-filter')); chips[ni].focus(); e.preventDefault();
  });
  if (showAll) showAll.addEventListener('click', function () { applyFilter('all'); });

  /* tile → lightbox */
  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-ct-open]'); if (!btn) return;
    var id = btn.getAttribute('data-card-id'), card = null;
    CARDS.forEach(function (c) { if (c.id === id) card = c; });
    if (!card) return;
    lbImg.src = svg(card); lbImg.alt = card.name + ' invitation card';
    lbTitle.textContent = card.name;
    lbSub.textContent = cap(card.style) + ' · A5 portrait · PDF + PNG';
    var base = '../../assets/card-templates/' + card.style + '/' + card.id;
    lbPdf.setAttribute('href', base + '.pdf');
    lbPng.setAttribute('href', base + '.png');
    if (window.evenzi && window.evenzi.openModal) window.evenzi.openModal('ct-lightbox');
  });

  /* download + WhatsApp stubs (assets/Invitations not wired yet) */
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-ct-download]')) { e.preventDefault(); if (window.evenzi && window.evenzi.showToast) window.evenzi.showToast('CARD DOWNLOADED'); return; }
    if (e.target.closest('[data-ct-whatsapp]')) { e.preventDefault(); if (window.evenzi && window.evenzi.showToast) window.evenzi.showToast('INVITATIONS COMING SOON'); }
  });
})();
