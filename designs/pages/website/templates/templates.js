/* ════════════════════════════════════════════════════════════════════
   Evenzi · Website · Templates — page-specific JS
   Owner: designs/pages/website/templates/

   Loaded on templates/index.html (gallery) AND templates/<id>.html
   (detail). Builds on shell.js (window.evenzi.openModal/closeModal/
   showToast, theme, breadcrumb) and website.js (cross-cutting modals).

   Responsibilities:
   - Gallery: mark the .is-current card by data-template-id match
     (NOT the dead `#dp-template-modal .dp-template-card` selector that
      still lingers in design.js — see plan P0-2).
   - Detail: "Apply this template" flow.
       • Fire the cautionary confirm ONLY when overrides exist
         (sessionStorage.dpHasOverrides === '1', set by design.js) — plan D1(c).
       • On commit: persist the pick + navigate to ../design.html, where
         design.js applyFromSession() reads it and commits.
       • Storage-blocked (private-mode WebView) → query-param fallback
         ../design.html?apply=<id> (plan P1-6).
   ════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var DEFAULT_TEMPLATE = 'bold-festive';

  /* ── Safe sessionStorage helpers (WhatsApp/private-mode resilient) ── */
  function ssGet(key) {
    try { return sessionStorage.getItem(key); } catch (_) { return null; }
  }
  function ssSet(key, val) {
    try { sessionStorage.setItem(key, val); return true; } catch (_) { return false; }
  }

  function toast(msg) {
    if (window.evenzi && typeof window.evenzi.showToast === 'function') {
      window.evenzi.showToast(msg);
    }
  }

  function currentTemplate() {
    return ssGet('dpCurrentTemplate') || DEFAULT_TEMPLATE;
  }

  /* ════════════════════════════════════════════════════════════════
     GALLERY — mark the current card
     ════════════════════════════════════════════════════════════════ */
  function syncGalleryCurrent() {
    var cards = document.querySelectorAll('.tpl-gallery-grid .dp-template-card');
    if (!cards.length) return;
    var current = currentTemplate();
    cards.forEach(function (card) {
      var isCurrent = card.getAttribute('data-template-id') === current;
      card.classList.toggle('is-current', isCurrent);
      /* Inject / remove the "Current" pill so it follows the live template
         even if it changed via an apply round-trip this session. */
      var preview = card.querySelector('.dp-template-preview');
      var pill = card.querySelector('.dp-template-current');
      if (isCurrent && preview && !pill) {
        pill = document.createElement('span');
        pill.className = 'dp-template-current';
        pill.textContent = 'Current';
        preview.insertBefore(pill, preview.firstChild);
      } else if (!isCurrent && pill) {
        pill.remove();
      }
    });
  }

  /* ════════════════════════════════════════════════════════════════
     DETAIL — Apply flow
     ════════════════════════════════════════════════════════════════ */

  /* Cautionary confirm modal, injected once on detail pages so the markup
     isn't duplicated across 5 files. Uses the .modal-confirm-cautionary
     shell (same idiom as website.js's wb-discard-confirm). */
  var CONFIRM_MODAL_HTML =
    '<div class="modal-scrim" id="tpl-apply-confirm" data-modal aria-hidden="true">' +
    '  <div class="modal-card lg-glass-card modal-confirm-cautionary" role="alertdialog" aria-modal="true" aria-labelledby="tpl-apply-confirm-h">' +
    '    <button class="modal-close" type="button" data-modal-close aria-label="Close" style="position:absolute;top:1rem;right:1rem">' +
    '      <span class="material-symbols-outlined" aria-hidden="true">close</span>' +
    '    </button>' +
    '    <div class="modal-confirm-icon is-cautionary">' +
    '      <span class="material-symbols-outlined" aria-hidden="true">restart_alt</span>' +
    '    </div>' +
    '    <h2 class="modal-confirm-title" id="tpl-apply-confirm-h">Apply this template?</h2>' +
    '    <p class="modal-confirm-text">Your custom palette and heading font will reset to this template’s defaults. You can change them again afterwards.</p>' +
    '    <div class="modal-actions">' +
    '      <button type="button" class="btn-pill btn-pill-secondary" data-modal-close>Cancel</button>' +
    '      <button type="button" class="btn-pill btn-pill-primary" data-tpl-apply-confirm>Apply anyway</button>' +
    '    </div>' +
    '  </div>' +
    '</div>';

  /* Persist the pick + leave for the Design tab, which commits it. */
  function commitAndNavigate(tplId) {
    var ok = ssSet('dpTemplateApplied', tplId);
    ssSet('dpCurrentTemplate', tplId);          // so the gallery reflects it
    ssSet('dpHasOverrides', '0');                // applying clears overrides
    if (ok) {
      window.location.href = '../design.html';
    } else {
      /* Storage blocked — fall back to a query param design.js also reads. */
      window.location.href = '../design.html?apply=' + encodeURIComponent(tplId);
    }
  }

  function initDetail() {
    var applyBtns = document.querySelectorAll('[data-tpl-apply]');
    if (!applyBtns.length) return;          // not a detail page

    document.body.insertAdjacentHTML('beforeend', CONFIRM_MODAL_HTML);

    var pendingId = null;

    applyBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var tplId = btn.getAttribute('data-tpl-apply');
        if (!tplId) return;
        pendingId = tplId;
        /* D1(c): only nag when there's something to lose. */
        if (ssGet('dpHasOverrides') === '1') {
          if (window.evenzi && window.evenzi.openModal) {
            window.evenzi.openModal('tpl-apply-confirm');
          } else {
            commitAndNavigate(tplId);   // no modal controller → just go
          }
        } else {
          commitAndNavigate(tplId);
        }
      });
    });

    /* Confirm button inside the cautionary modal. */
    document.addEventListener('click', function (e) {
      if (!e.target.closest('[data-tpl-apply-confirm]')) return;
      if (window.evenzi && window.evenzi.closeModal) {
        window.evenzi.closeModal('tpl-apply-confirm');
      }
      if (pendingId) commitAndNavigate(pendingId);
    });
  }

  /* ── Init ──────────────────────────────────────────────────────── */
  syncGalleryCurrent();
  initDetail();
})();
