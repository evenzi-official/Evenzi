/* ════════════════════════════════════════════════════════════════════
   Evenzi · Settings page script
   Page-specific behavior. Generic primitives (password-toggle,
   toggle-switch, avatar file-input) are handled by shell.js.
   ════════════════════════════════════════════════════════════════════ */

/* ── Notification-preference choice cards ──────────
   Each card is a toggleable "Active / Inactive" state.
   Clicking the card flips .is-active, aria-pressed, and the
   visible label inside [data-state-text].
*/
(function () {
  document.addEventListener('click', function (e) {
    var card = e.target.closest && e.target.closest('[data-toggle-card]');
    if (!card) return;
    var on = card.classList.toggle('is-active');
    card.setAttribute('aria-pressed', on ? 'true' : 'false');
    var label = card.querySelector('[data-state-text]');
    if (label) label.textContent = on ? 'Active' : 'Inactive';
  });
})();

/* ── Save / Discard action footer ─────────────────
   Save → loading state → success toast.
   No real backend; this is the static prototype's UX confirmation.
*/
(function () {
  function setLoading(btn, loading) {
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
  document.addEventListener('click', function (e) {
    var saveBtn = e.target.closest && e.target.closest('[data-save]');
    if (saveBtn) {
      setLoading(saveBtn, true);
      setTimeout(function () {
        setLoading(saveBtn, false);
        if (window.evenzi && window.evenzi.showToast) {
          window.evenzi.showToast('SETTINGS SAVED');
        }
      }, 1200);
      return;
    }
    var discardBtn = e.target.closest && e.target.closest('[data-discard]');
    if (discardBtn) {
      if (window.evenzi && window.evenzi.showToast) {
        window.evenzi.showToast('CHANGES DISCARDED');
      }
      return;
    }
    var logoutBtn = e.target.closest && e.target.closest('[data-logout]');
    if (logoutBtn) {
      setLoading(logoutBtn, true);
      setTimeout(function () {
        setLoading(logoutBtn, false);
        if (window.evenzi && window.evenzi.showToast) {
          window.evenzi.showToast('SIGNED OUT');
        }
        // Real flow: clear session, redirect to /auth.
        // Prototype navigates to the static auth.html.
        setTimeout(function () { window.location.href = '../auth/auth.html'; }, 500);
      }, 900);
    }
  });
})();
