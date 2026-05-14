/* ════════════════════════════════════════════════════════════════════
   Evenzi · Event Settings shared script
   Sidebar active-state sync (via body[data-es-page]) + Save toast.
   ════════════════════════════════════════════════════════════════════ */

(function () {
  /* Sidebar active state */
  var page = document.body.dataset.esPage || '';
  document.querySelectorAll('.es-side-link[data-es-page]').forEach(function (a) {
    var match = a.getAttribute('data-es-page') === page;
    a.classList.toggle('is-active', match);
    if (match) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  function toast(msg) {
    if (window.evenzi && window.evenzi.showToast) window.evenzi.showToast(msg);
  }
  function setLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.classList.add('is-loading');
      btn.setAttribute('aria-busy', 'true');
      btn.disabled = true;
    } else {
      btn.classList.remove('is-loading');
      btn.removeAttribute('aria-busy');
      btn.disabled = false;
    }
  }

  /* Save-button handler (delegated; works for any [data-es-save] on any page) */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-es-save]');
    if (!btn) return;
    setLoading(btn, true);
    setTimeout(function () {
      setLoading(btn, false);
      toast(btn.getAttribute('data-es-save-toast') || 'CHANGES SAVED');
    }, 900);
  });

  /* Generic upgrade-plan click handler (Plan & Billing) */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-es-upgrade]');
    if (!btn) return;
    var plan = btn.getAttribute('data-es-upgrade') || 'PLAN';
    setLoading(btn, true);
    setTimeout(function () {
      setLoading(btn, false);
      toast('UPGRADING TO ' + plan.toUpperCase());
    }, 900);
  });

  /* Danger-zone delete-event guard (cosmetic confirm) */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-es-delete]');
    if (!btn) return;
    toast('CONFIRM DELETE — TYPE THE EVENT NAME');
  });

  /* "Take Website Offline" / "View Live Site" stubs */
  document.addEventListener('click', function (e) {
    var off = e.target.closest && e.target.closest('[data-es-offline]');
    if (off) {
      setLoading(off, true);
      setTimeout(function () {
        setLoading(off, false);
        toast('WEBSITE TAKEN OFFLINE');
      }, 900);
      return;
    }
    var live = e.target.closest && e.target.closest('[data-es-live-site]');
    if (live) toast('OPENING LIVE SITE');
  });

  /* "Add Co-Host" stub */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-es-add-admin]');
    if (!btn) return;
    toast('INVITE CO-HOST DIALOG');
  });
})();
