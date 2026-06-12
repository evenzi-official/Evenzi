/* Media & Memories — seed fixtures (window.MEDIA_FIXTURES).
   ──────────────────────────────────────────────────────────────────────
   Seed contract (?seed= query param):
     ?seed=empty (DEFAULT)
       0 photos. The dropzone renders as the first-run hero, the 6 preset
       albums render as INERT filter chips (NOT empty album cards), the
       storage meter sits at 0%, and Recent + All Photos show empty copy.
     ?seed=populated
       90 photos spread across the 6 preset albums. The All Photos grid
       mounts in batches via an IntersectionObserver "load more" sentinel —
       this stands in for the 5k–20k lazy-load behaviour of the real build
       (true virtualization is a React-build concern).
   Album-card rule (arbiter A): an album CARD renders only once that album
   holds ≥1 photo; presets with 0 photos stay chips.

   QA override: ?meter=healthy|near|atcap forces a storage-meter state.

   Storage data contract (presentational only — TL3): { usedBytes,
   limitBytes, tier }. Real source LATER is a subscription / event_storage
   lookup, NOT Supabase Storage bucket stats. No backing table exists yet —
   flagged for the data-model phase.
   ────────────────────────────────────────────────────────────────────── */
window.MEDIA_FIXTURES = (function () {
  'use strict';

  /* Generated SVG placeholder (same approach as website/photos.js).
     Real HEIC files can't render in <img> on most browsers — the real
     build needs a transcode step before previews exist; these stand in. */
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

  var params = new URLSearchParams(window.location.search);
  var seed = params.get('seed') === 'populated' ? 'populated' : 'empty';
  var meterOverride = params.get('meter'); /* healthy | near | atcap | null */

  /* The 6 preset albums (spec Copy section). Custom albums are appended
     by media.js at runtime with preset:false. */
  var albums = [
    { id: 'ceremony',   name: 'Ceremony',    preset: true },
    { id: 'reception',  name: 'Reception',   preset: true },
    { id: 'mehendi',    name: 'Mehendi',     preset: true },
    { id: 'sangeet',    name: 'Sangeet',     preset: true },
    { id: 'candids',    name: 'Candids',     preset: true },
    { id: 'prewedding', name: 'Pre-Wedding', preset: true }
  ];

  /* Photo shape mirrors what website/photos consumes (single-entity model,
     TL1/FE6): website "Gallery photos" is the published:true subset of THIS
     store — not a second upload pool. */
  var photos = [];
  if (seed === 'populated') {
    var BASE_MS = 1781240400000; /* fixed: 2026-06-12T10:30 IST — no new Date() */
    for (var i = 1; i <= 90; i++) {
      photos.push({
        id: 'm-' + i,
        src: photoSVG(i),
        name: 'Photo ' + i,
        albumIds: [albums[(i - 1) % 6].id],
        uploadedAt: BASE_MS - i * 5400000, /* every 90 min, newest = m-1 */
        published: i % 3 !== 0
      });
    }
  }

  var GB = 1024 * 1024 * 1024;
  var storageByState = {
    healthy: { usedBytes: (seed === 'populated' ? 1.2 : 0) * GB, limitBytes: 5 * GB, tier: 'free' },
    near:    { usedBytes: 4.2 * GB, limitBytes: 5 * GB, tier: 'free' },
    atcap:   { usedBytes: 5 * GB,   limitBytes: 5 * GB, tier: 'free' }
  };
  var storage = storageByState[meterOverride] || storageByState.healthy;

  return {
    seed: seed,
    photos: photos,
    albums: albums,
    storage: storage,
    photoSVG: photoSVG
  };
})();
