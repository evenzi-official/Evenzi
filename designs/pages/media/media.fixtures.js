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

  /* Sub-events = the wedding's functions/celebrations (distinct dimension from
     albums, which are user groupings). Drawn from the event's Step-3 functions.
     Each has a takenAt day so the date-range + sub-event filters have real data. */
  var DAY = 86400000;
  var EVENT_DAY0 = 1781067600000; /* 2026-06-10 (event week start) */
  var subEvents = [
    { id: 'haldi',     name: 'Haldi',     day: 0 },
    { id: 'mehendi',   name: 'Mehendi',   day: 1 },
    { id: 'sangeet',   name: 'Sangeet',   day: 2 },
    { id: 'wedding',   name: 'Wedding',   day: 3 },
    { id: 'reception', name: 'Reception', day: 4 }
  ];

  /* Photo shape mirrors what website/photos consumes (single-entity model,
     TL1/FE6): website "Gallery photos" is the published:true subset of THIS
     store — not a second upload pool. takenAt = when shot (drives date filter);
     uploadedAt = when added (drives Newest sort + Recent strip). */
  var photos = [];
  if (seed === 'populated') {
    var BASE_MS = 1781240400000; /* fixed: 2026-06-12T10:30 IST — no new Date() */
    for (var i = 1; i <= 90; i++) {
      var se = subEvents[(i - 1) % subEvents.length];
      photos.push({
        id: 'm-' + i,
        src: photoSVG(i),
        name: 'Photo ' + i,
        albumIds: [albums[(i - 1) % 6].id],
        subEventId: se.id,
        takenAt: EVENT_DAY0 + se.day * DAY + (i % 12) * 3600000, /* spread within the function's day */
        uploadedAt: BASE_MS - i * 5400000, /* every 90 min, newest = m-1 */
        published: i % 3 !== 0
      });
    }
  }

  /* Videos — mirror the photo shape + posterSVG + durationSec. Video upload is
     "post-MVP" per the overview but founder pulled it into MVP; transcoding/
     playback are still backend concerns (faked here with poster + a stub player). */
  function durationLabel(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' + s : '' + s);
  }
  var videos = [];
  if (seed === 'populated') {
    var VBASE = 1781236800000; /* 2026-06-12T09:30 IST */
    for (var v = 1; v <= 12; v++) {
      var vse = subEvents[(v - 1) % subEvents.length];
      var dur = 18 + (v * 13) % 220;
      videos.push({
        id: 'v-' + v,
        poster: photoSVG(v * 7),
        name: 'Clip ' + v,
        durationSec: dur,
        duration: durationLabel(dur),
        albumIds: [albums[(v - 1) % 6].id],
        subEventId: vse.id,
        takenAt: EVENT_DAY0 + vse.day * DAY + (v % 10) * 3600000,
        uploadedAt: VBASE - v * 7200000
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
    videos: videos,
    albums: albums,
    subEvents: subEvents,
    storage: storage,
    photoSVG: photoSVG,
    durationLabel: durationLabel
  };
})();
