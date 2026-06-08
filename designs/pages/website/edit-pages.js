/* ════════════════════════════════════════════════════════════════════
   Evenzi · Website · Edit Pages — list view (page JS)
   Owner: designs/pages/website/edit-pages.html

   Loaded only on edit-pages.html (guarded by [data-wb-page="edit-pages"]).
   The pages list, add/remove/visibility, and the row-edit chevron
   navigation are ALL handled by website.js (delegated). The only thing
   this file adds is a mouse-convenience: clicking anywhere on a row
   (except its action buttons) opens that page's editor. The Edit chevron
   remains the keyboard/SR affordance (handled by website.js).
   ════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';
  if (document.body.dataset.wbPage !== 'edit-pages') return;

  document.addEventListener('click', function (e) {
    var row = e.target.closest('.page-list-row');
    if (!row) return;
    /* Let buttons (hide / remove / edit chevron / drag) run their own
       website.js handlers — only the non-interactive name/meta region
       triggers this convenience navigation. */
    if (e.target.closest('button, a')) return;
    var id = row.getAttribute('data-page') || '';
    var base = id.indexOf('custom') === 0 ? 'custom' : id;
    window.location.href = 'edit-page.html?page=' + encodeURIComponent(base || 'home');
  });
})();
