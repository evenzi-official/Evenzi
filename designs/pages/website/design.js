/* ════════════════════════════════════════════════════════════════════
   Evenzi · Website · Design tab — page-specific JS
   Owner: designs/pages/website/

   Loaded only on design.html (guarded by [data-wb-page="design"]).
   Builds on website.js (which handles cross-cutting modals, theme,
   breadcrumb clock, copy URL, device toggle, etc.).

   Responsibilities:
   - DesignState store (template / palette / font / cover / og)
   - Palette radio handler → updates preview frame data-palette
   - Heading-font radio handler → updates preview frame data-font
   - Reset-chip visibility per axis (diff vs template default)
   - Reset-chip click → revert one axis to template default
   - Template picker → selection + apply with cautionary discard confirm
     when overrides exist
   - OG toggle → reveal/hide custom OG preview (no CLS, height reserved
     in CSS)
   - Crop modal Apply (stub)
   - Mobile "Jump to preview" anchor (IntersectionObserver)

   No autosave toasts — only TEMPLATE APPLIED / RESET / COVER UPDATED /
   SOCIAL-SHARE UPDATED on commit-level events, per parent plan §11.
   ════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  if (document.body.dataset.wbPage !== 'design') return;

  /* ── Template definitions (palette + font defaults per template).
        The full template "bundle" decision lives here because the
        Design tab needs to know what to apply on template change.
        Keys are the canonical template IDs used by the apply
        round-trip (sessionStorage.dpTemplateApplied) and templates.js. */
  var TEMPLATES = {
    'classic-romance': { palette: 'blush',    font: 'cormorant', name: 'Classic Romance',  blurb: 'Editorial layout, serif headings, blush palette.' },
    'minimal-modern':  { palette: 'ivory',    font: 'inter',     name: 'Minimal Modern',   blurb: 'Single column, sans headings, ivory palette.' },
    'bold-festive':    { palette: 'brand-red',font: 'poppins',   name: 'Bold Festive',     blurb: 'Magazine layout, full-bleed cover, brand-red palette, Poppins headings.' },
    'garden-soft':     { palette: 'sage',     font: 'lora',      name: 'Garden Soft',      blurb: 'Two-column layout, soft serif, sage palette.' },
    'midnight-elegant':{ palette: 'midnight', font: 'playfair',  name: 'Midnight Elegant', blurb: 'Dark hero, display serif, midnight palette.' }
  };

  /* DesignState — page-scoped store. In the React port this becomes a
     hook + DB-backed event_website_design row. Here it's just an object
     mirrored to the DOM. */
  var DesignState = {
    template: 'bold-festive',
    palette: 'brand-red',
    font: 'poppins',
    coverState: 'loaded',           // empty | pending | failed | loaded
    ogMode: 'auto'                  // auto | custom
  };

  var previewFrame  = document.getElementById('dp-preview-frame');
  var coverPreview  = document.querySelector('.dp-cover-preview');
  var ogAuto        = document.getElementById('dp-og-auto');
  var ogAutoCaption = document.getElementById('dp-og-auto-caption');
  var ogCustomPrev  = document.getElementById('dp-og-custom-preview');
  var ogToggle      = document.querySelector('[data-dp-toggle="og-custom"]');
  var tplCurrentName  = document.getElementById('dp-tpl-current-name');
  var tplCurrentBlurb = document.getElementById('dp-tpl-current-blurb');

  /* ── Shell-toast passthrough (falls back to no-op) ──────────────── */
  function toast(msg) {
    if (window.evenzi && typeof window.evenzi.showToast === 'function') {
      window.evenzi.showToast(msg);
    }
  }

  /* ── Diff vs template defaults; reveal/hide each axis reset chip ─ */
  function syncResetChips() {
    var tpl = TEMPLATES[DesignState.template] || TEMPLATES['bold-festive'];
    var diffs = {
      palette: DesignState.palette !== tpl.palette,
      font:    DesignState.font    !== tpl.font,
      cover:   false /* MVP: no template-default cover comparison — host
                       always brings their own. Chip stays hidden. */
    };
    document.querySelectorAll('.dp-reset-chip').forEach(function (chip) {
      var axis = chip.getAttribute('data-dp-reset');
      chip.classList.toggle('is-visible', !!diffs[axis]);
    });
    /* Persist override state so the Templates detail page can decide whether
       to fire the cautionary confirm on apply (plan D1c). '1' = host has
       diverged palette/font from the template default. */
    try {
      sessionStorage.setItem('dpHasOverrides', (diffs.palette || diffs.font) ? '1' : '0');
    } catch (_) {}
  }

  /* ── Apply a palette pick to state + preview frame ──────────────── */
  function applyPalette(paletteId, opts) {
    opts = opts || {};
    DesignState.palette = paletteId;
    if (previewFrame) previewFrame.setAttribute('data-palette', paletteId);
    /* Sync radio aria-checked + .is-selected on all palette tiles */
    document.querySelectorAll('.dp-palette-tile').forEach(function (tile) {
      var match = tile.getAttribute('data-palette') === paletteId;
      tile.classList.toggle('is-selected', match);
      tile.setAttribute('aria-checked', match ? 'true' : 'false');
    });
    syncResetChips();
    if (opts.silent !== true && opts.fromTemplate !== true) {
      /* Plan §P2-5: no PALETTE CHANGED toast (rely on preview + SYNCED
         chip). Kept hook for future analytics. */
    }
  }

  function applyFont(fontId, opts) {
    opts = opts || {};
    DesignState.font = fontId;
    if (previewFrame) previewFrame.setAttribute('data-font', fontId);
    document.querySelectorAll('.dp-font-row').forEach(function (row) {
      var match = row.getAttribute('data-font') === fontId;
      row.classList.toggle('is-selected', match);
      row.setAttribute('aria-checked', match ? 'true' : 'false');
    });
    syncResetChips();
  }

  /* ── Palette radio click ────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var tile = e.target.closest('.dp-palette-tile');
    if (!tile) return;
    var pid = tile.getAttribute('data-palette');
    if (!pid || pid === DesignState.palette) return;
    applyPalette(pid);
  });

  /* ── Font radio click ───────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var row = e.target.closest('.dp-font-row');
    if (!row) return;
    var fid = row.getAttribute('data-font');
    if (!fid || fid === DesignState.font) return;
    applyFont(fid);
  });

  /* ── Keyboard nav for radio groups (arrow keys move focus + select) */
  function radioGroupKey(e, selector) {
    var key = e.key;
    if (key !== 'ArrowRight' && key !== 'ArrowLeft' &&
        key !== 'ArrowDown'  && key !== 'ArrowUp') return;
    var group = e.target.closest('[role="radiogroup"]');
    if (!group) return;
    var items = Array.from(group.querySelectorAll(selector));
    var idx = items.indexOf(e.target);
    if (idx < 0) return;
    e.preventDefault();
    var next = (key === 'ArrowRight' || key === 'ArrowDown')
      ? (idx + 1) % items.length
      : (idx - 1 + items.length) % items.length;
    items[next].focus();
    items[next].click();
  }
  document.addEventListener('keydown', function (e) {
    if (e.target.matches('.dp-palette-tile')) radioGroupKey(e, '.dp-palette-tile');
    if (e.target.matches('.dp-font-row'))     radioGroupKey(e, '.dp-font-row');
  });

  /* ── Reset chip click → revert single axis to template default ─── */
  document.addEventListener('click', function (e) {
    var chip = e.target.closest('.dp-reset-chip');
    if (!chip) return;
    var axis = chip.getAttribute('data-dp-reset');
    var tpl = TEMPLATES[DesignState.template] || TEMPLATES['bold-festive'];
    if (axis === 'palette') {
      applyPalette(tpl.palette, { silent: true });
      toast('PALETTE RESET');
    } else if (axis === 'font') {
      applyFont(tpl.font, { silent: true });
      toast('FONT RESET');
    } else if (axis === 'cover') {
      /* MVP: cover reset is a stub — would re-fetch the template
         default cover from the data model. */
      toast('COVER RESET');
    }
  });

  /* ── Template apply — round-tripped from /templates/<id>.html ────────
     When the host clicks "Apply this template" on a template detail
     page, that page sets sessionStorage.dpTemplateApplied = '<id>' and
     navigates back here. We read it on load, run the cautionary discard
     (if overrides exist), commit, and clear the flag.
     Template picker UI lives at templates/index.html now — removed
     from this page 2026-05-26. commitTemplate() stays callable for
     the round-trip flow + tests. */
  (function applyFromSession() {
    var pending = null;
    try { pending = sessionStorage.getItem('dpTemplateApplied'); } catch (_) {}
    /* Clear immediately so a refresh doesn't re-apply */
    if (pending) { try { sessionStorage.removeItem('dpTemplateApplied'); } catch (_) {} }
    /* Fallback for storage-blocked browsers (WhatsApp/private-mode WebView):
       the detail page navigates with ?apply=<id> instead. Read + strip it so
       a refresh doesn't re-apply. (templates.js plan P1-6) */
    if (!pending) {
      try {
        var params = new URLSearchParams(window.location.search);
        var q = params.get('apply');
        if (q) {
          pending = q;
          params.delete('apply');
          var qs = params.toString();
          history.replaceState(null, '',
            window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
        }
      } catch (_) {}
    }
    if (!pending || !TEMPLATES[pending]) return;
    /* No need for discard confirm here — the host already confirmed on
       the detail page before navigating back. Just commit. */
    commitTemplate(pending);
  })();

  function commitTemplate(tplId) {
    var tpl = TEMPLATES[tplId];
    if (!tpl) return;
    DesignState.template = tplId;
    /* Keep the Templates gallery's "Current" pill in sync next visit. */
    try { sessionStorage.setItem('dpCurrentTemplate', tplId); } catch (_) {}
    applyPalette(tpl.palette, { fromTemplate: true });
    applyFont(tpl.font,       { fromTemplate: true });
    if (tplCurrentName)  tplCurrentName.textContent = tpl.name;
    if (tplCurrentBlurb) tplCurrentBlurb.textContent = tpl.blurb;
    /* Update fallback label in the thumb (until designer screenshots land) */
    var fallback = document.querySelector('.dp-thumb-fallback-label');
    if (fallback) fallback.textContent = tpl.name;
    /* The gallery's "Current" pill is synced separately by
       templates.js syncGalleryCurrent() — nothing to update here. */
    syncResetChips();
    toast('TEMPLATE APPLIED');
  }

  /* ── OG toggle — show/hide custom preview block, no CLS ────────── */
  if (ogToggle) {
    ogToggle.addEventListener('click', function () {
      /* Shell handler flips aria-checked; we read it on next tick. */
      queueMicrotask(function () {
        var on = ogToggle.getAttribute('aria-checked') === 'true';
        DesignState.ogMode = on ? 'custom' : 'auto';
        if (ogAuto)        ogAuto.hidden       = on;
        if (ogAutoCaption) ogAutoCaption.hidden = on;
        if (ogCustomPrev)  ogCustomPrev.hidden  = !on;
        /* No toast — switch is reversible + has visible preview swap. */
      });
    });
  }

  /* ── Crop modal Apply (stub) ───────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-dp-crop-apply]');
    if (!btn) return;
    e.preventDefault();
    var kind = btn.getAttribute('data-dp-crop-apply');
    if (kind === 'cover') {
      DesignState.coverState = 'loaded';
      if (coverPreview) coverPreview.setAttribute('data-cover-state', 'loaded');
      toast('COVER UPDATED');
      if (window.evenzi) window.evenzi.closeModal('dp-cover-crop-modal');
    } else if (kind === 'og') {
      toast('SOCIAL-SHARE IMAGE UPDATED');
      if (window.evenzi) window.evenzi.closeModal('dp-og-crop-modal');
    }
  });

  /* ── Cover retry — stub (would re-fetch the source) ────────────── */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-dp-cover-retry]')) return;
    e.preventDefault();
    if (!coverPreview) return;
    coverPreview.setAttribute('data-cover-state', 'pending');
    setTimeout(function () {
      coverPreview.setAttribute('data-cover-state', 'loaded');
      toast('COVER RELOADED');
    }, 900);
  });

  /* ── Mobile "Jump to preview" anchor — IntersectionObserver based ─
     Only shows when #preview is OUT of viewport. Hidden on ≥1024px by
     CSS (preview is sticky-visible there). */
  var jumpBtn = document.querySelector('[data-dp-jump-preview]');
  var previewSection = document.getElementById('preview');
  if (jumpBtn && previewSection && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        /* Show anchor only when preview is BELOW the viewport (i.e.
           host hasn't scrolled to it yet). If preview is above the
           viewport (host already passed it), the "arrow_downward"
           glyph would be misleading — hide instead.
           (P1-B · 2026-05-23 agent post-build) */
        var previewBelow = entry.boundingClientRect.top > 0;
        var notInView = !entry.isIntersecting;
        jumpBtn.classList.toggle('is-visible', notInView && previewBelow);
      });
    }, {
      threshold: 0
    });
    io.observe(previewSection);

    jumpBtn.addEventListener('click', function (e) {
      e.preventDefault();
      previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ── Initial state sync ─────────────────────────────────────────── */
  syncResetChips();
})();
