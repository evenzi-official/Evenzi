/* ════════════════════════════════════════════════════════════════════
   Evenzi · Website (Digital Presence) — shared module JS
   Owner: designs/pages/website/

   Loaded by every Website-module page (overview.html, design.html, …).
   Self-guards via [data-page="website"].

   Cross-cutting modals (Share, Publish settings, Publish-confirm,
   Discard) used to live as duplicate HTML in every tab. Now injected
   from SHARED_MODALS_HTML below — single source. Re-injection is
   idempotent (guarded by getElementById).

   Toast: routes through window.evenzi.showToast() (defined in shell.js,
   writes to #bc-toast). Falls back to a no-op if shell.js isn't loaded.

   Modals: open/close fully delegated to shell.js via window.evenzi.openModal
   / closeModal (stacking-safe — focus-trap, focus-return stack, Esc,
   scrim-click, scroll-lock, dynamic z-index all owned by the shell).
   Page scripts only do content prep before opening (pre-fill inputs,
   reset errors, populate dynamic content).

   Page-specific handlers (Get-started counter, Pages-list state) are
   null-safe — they look for elements that only exist on Overview and
   return early elsewhere. No data-wb-page gating needed.

   Reuses shell.js for theme, breadcrumb, scroll-progress, reveal,
   toggle-switch keyboard a11y.
   ════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  if (document.body.dataset.page !== 'website') return;

  /* ── Cross-cutting modals — injected on first load of any wb-page ────
     Idempotent: re-injection is a no-op if the modals already exist
     (e.g. if a page kept duplicates for some reason).
     The shell modal controller (window.evenzi.openModal) discovers
     these as standard .modal-scrim nodes — no extra wiring needed. */
  var SHARED_MODALS_HTML = [
    /* ── Share modal — URL editor · RSVP toggle · WhatsApp share ── */
    '<div class="modal-scrim" id="wb-share-modal" data-modal aria-hidden="true">',
    '  <div class="modal-card lg-glass-card" role="dialog" aria-modal="true" aria-labelledby="wb-share-h">',
    '    <header class="modal-head">',
    '      <div class="modal-head-lead">',
    '        <h2 id="wb-share-h">Share your website</h2>',
    '        <p class="modal-sub">Send guests the link — they\'ll RSVP from there.</p>',
    '      </div>',
    '      <button class="modal-close" type="button" data-modal-close aria-label="Close">',
    '        <span class="material-symbols-outlined" aria-hidden="true">close</span>',
    '      </button>',
    '    </header>',
    '    <section class="modal-section">',
    '      <p class="modal-section-label">Site URL</p>',
    '      <label class="form-label" for="dp-slug-input">Your link</label>',
    '      <div class="form-input-group">',
    '        <span class="form-input-prefix">evenzi.com/e/</span>',
    '        <input id="dp-slug-input" class="form-input-field" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="url" pattern="[a-z0-9-]+" />',
    '      </div>',
    '      <p class="form-helper" id="dp-slug-helper" aria-live="polite">Letters, numbers and hyphens only.</p>',
    '      <p class="form-error" id="dp-slug-error" hidden></p>',
    '      <div class="wb-share-url-actions">',
    '        <button type="button" class="btn-pill btn-pill-secondary btn-pill-sm" data-dp-slug-save>Update URL</button>',
    '        <button type="button" class="btn-pill btn-pill-secondary btn-pill-sm" data-dp-copy="https://evenzi.com/e/vibrant-union">',
    '          <span class="material-symbols-outlined" aria-hidden="true">content_copy</span>',
    '          Copy link',
    '        </button>',
    '      </div>',
    '    </section>',
    '    <section class="modal-section">',
    '      <div class="dp-status-row">',
    '        <div class="dp-status-meta">',
    '          <span class="dp-status-label" id="wb-share-rsvp-label">RSVP collection</span>',
    '          <span class="dp-status-help" id="wb-share-rsvp-help" aria-live="polite">Guests can submit responses</span>',
    '        </div>',
    '        <button type="button" class="toggle-switch" role="switch" aria-checked="true" data-dp-toggle="rsvp" aria-labelledby="wb-share-rsvp-label" aria-describedby="wb-share-rsvp-help">',
    '          <span class="toggle-switch-thumb" aria-hidden="true"></span>',
    '        </button>',
    '      </div>',
    '    </section>',
    '    <section class="modal-section">',
    '      <p class="modal-section-label">WhatsApp message</p>',
    '      <label class="form-label" for="wb-wa-message">What your guests receive</label>',
    '      <textarea id="wb-wa-message" class="form-input wb-wa-textarea" rows="6">You\'re invited! 💛\n\nVidya &amp; Anshuman — Sat, 14 Feb 2026\n\nView details &amp; RSVP:\nhttps://evenzi.com/e/vibrant-union</textarea>',
    '      <p class="form-helper">Edit freely — your link is added automatically.</p>',
    '      <div class="wb-share-send-row">',
    '        <button type="button" class="btn-pill btn-pill-primary" data-dp-wa-send>',
    '          <span class="material-symbols-outlined" aria-hidden="true">chat</span>',
    '          Send via WhatsApp',
    '        </button>',
    '        <button type="button" class="btn-pill btn-pill-secondary" data-dp-show-qr aria-expanded="false" aria-controls="wb-qr-panel">',
    '          <span class="material-symbols-outlined" aria-hidden="true">qr_code_2</span>',
    '          Show QR',
    '        </button>',
    '      </div>',
    '      <div class="wb-qr-panel" id="wb-qr-panel" hidden>',
    '        <div class="wb-qr-code" aria-hidden="true">',
    '          <span class="material-symbols-outlined">qr_code_2</span>',
    '        </div>',
    '        <p class="wb-qr-hint">Guests can scan this to open your site. Download to print on cards.</p>',
    '        <button type="button" class="btn-pill btn-pill-secondary btn-pill-sm" data-dp-download-qr>',
    '          <span class="material-symbols-outlined" aria-hidden="true">download</span>',
    '          Download QR',
    '        </button>',
    '      </div>',
    '    </section>',
    '    <footer class="modal-actions">',
    '      <button type="button" class="btn-pill btn-pill-primary" data-modal-close>Done</button>',
    '    </footer>',
    '  </div>',
    '</div>',

    /* ── Publish settings modal — Visibility · Private lock ── */
    '<div class="modal-scrim" id="wb-publish-modal" data-modal aria-hidden="true">',
    '  <div class="modal-card lg-glass-card" role="dialog" aria-modal="true" aria-labelledby="wb-publish-h">',
    '    <header class="modal-head">',
    '      <div class="modal-head-lead">',
    '        <h2 id="wb-publish-h">Publish settings</h2>',
    '        <p class="modal-sub">Control who can see your website.</p>',
    '      </div>',
    '      <button class="modal-close" type="button" data-modal-close aria-label="Close">',
    '        <span class="material-symbols-outlined" aria-hidden="true">close</span>',
    '      </button>',
    '    </header>',
    '    <section class="modal-section">',
    '      <p class="modal-section-label">Visibility</p>',
    '      <div role="radiogroup" aria-label="Site visibility">',
    '        <label class="modal-radio-row is-active">',
    '          <input type="radio" name="wb-visibility" value="draft" checked />',
    '          <span class="modal-radio-meta">',
    '            <span class="modal-radio-title">Draft</span>',
    '            <span class="modal-radio-desc">Only you can see it. Nothing is live yet.</span>',
    '          </span>',
    '        </label>',
    '        <label class="modal-radio-row">',
    '          <input type="radio" name="wb-visibility" value="published" />',
    '          <span class="modal-radio-meta">',
    '            <span class="modal-radio-title">Published</span>',
    '            <span class="modal-radio-desc">Anyone with the link can view your site.</span>',
    '          </span>',
    '        </label>',
    '        <label class="modal-radio-row">',
    '          <input type="radio" name="wb-visibility" value="offline" />',
    '          <span class="modal-radio-meta">',
    '            <span class="modal-radio-title">Offline</span>',
    '            <span class="modal-radio-desc">Link shows a "temporarily unavailable" message.</span>',
    '          </span>',
    '        </label>',
    '      </div>',
    '    </section>',
    '    <section class="modal-section">',
    '      <div class="dp-status-row">',
    '        <div class="dp-status-meta">',
    '          <span class="dp-status-label" id="wb-pub-lock-label">Private content lock</span>',
    '          <span class="dp-status-help" id="wb-pub-lock-help">Guests need a phone match or password to unlock details</span>',
    '        </div>',
    '        <button type="button" class="toggle-switch" role="switch" aria-checked="true" data-dp-toggle="password" data-wb-pub-lock aria-labelledby="wb-pub-lock-label" aria-describedby="wb-pub-lock-help">',
    '          <span class="toggle-switch-thumb" aria-hidden="true"></span>',
    '        </button>',
    '      </div>',
    '      <div class="wb-password-field" id="wb-password-field">',
    '        <label class="form-label" for="wb-password-input">Site password</label>',
    '        <input id="wb-password-input" class="form-input" type="text" autocomplete="off" value="3pzh6z" />',
    '        <p class="form-helper">Share this with guests in your WhatsApp message.</p>',
    '      </div>',
    '    </section>',
    '    <footer class="modal-actions">',
    '      <button type="button" class="btn-pill btn-pill-secondary" data-modal-close>Cancel</button>',
    '      <button type="button" class="btn-pill btn-pill-primary" data-dp-publish-save>Save changes</button>',
    '    </footer>',
    '  </div>',
    '</div>',

    /* ── Publish confirm modal — celebratory affirmative ── */
    '<div class="modal-scrim" id="wb-publish-confirm" data-modal aria-hidden="true">',
    '  <div class="modal-card lg-glass-card modal-confirm-affirmative" role="dialog" aria-modal="true" aria-labelledby="wb-pubconf-h" aria-describedby="wb-pubconf-list">',
    '    <button class="modal-close modal-close--abs" type="button" data-modal-close aria-label="Close">',
    '      <span class="material-symbols-outlined" aria-hidden="true">close</span>',
    '    </button>',
    '    <span class="modal-confirm-icon" aria-hidden="true">',
    '      <span class="material-symbols-outlined">rocket_launch</span>',
    '    </span>',
    '    <h2 class="modal-confirm-title" id="wb-pubconf-h">Make your site live?</h2>',
    '    <p class="modal-confirm-text">Your invitation website will be reachable at this link:</p>',
    '    <span class="modal-confirm-url" id="wb-pubconf-url">evenzi.com/e/vibrant-union</span>',
    '    <ul class="modal-confirm-list" id="wb-pubconf-list" aria-label="What guests will see">',
    '      <li><span class="material-symbols-outlined" aria-hidden="true">check_circle</span>The hero with your names &amp; date</li>',
    '      <li><span class="material-symbols-outlined" aria-hidden="true">check_circle</span>3 sub-events on the schedule</li>',
    '      <li><span class="material-symbols-outlined" aria-hidden="true">check_circle</span>The RSVP form</li>',
    '    </ul>',
    '    <p class="modal-confirm-text">You can switch back to Draft anytime from Publish settings.</p>',
    '    <footer class="modal-actions">',
    '      <button type="button" class="btn-pill btn-pill-secondary" data-modal-close>Cancel</button>',
    '      <button type="button" class="btn-pill btn-pill-primary" data-dp-publish-confirm>',
    '        <span class="material-symbols-outlined" aria-hidden="true">rocket_launch</span>',
    '        Make it live',
    '      </button>',
    '    </footer>',
    '  </div>',
    '</div>',

    /* ── Discard / template-reset confirm — now uses .modal-confirm-cautionary ── */
    '<div class="modal-scrim" id="wb-discard-confirm" data-modal aria-hidden="true">',
    '  <div class="modal-card lg-glass-card modal-confirm-cautionary" role="alertdialog" aria-modal="true" aria-labelledby="wb-discard-h">',
    '    <button class="modal-close modal-close--abs" type="button" data-modal-close aria-label="Close">',
    '      <span class="material-symbols-outlined" aria-hidden="true">close</span>',
    '    </button>',
    '    <span class="modal-confirm-icon is-cautionary" aria-hidden="true">',
    '      <span class="material-symbols-outlined">restart_alt</span>',
    '    </span>',
    '    <h2 class="modal-confirm-title" id="wb-discard-h">Change template?</h2>',
    '    <p class="modal-confirm-text">Your custom palette, heading font, and any reordered sections will reset to the new template\'s defaults.</p>',
    '    <footer class="modal-actions">',
    '      <button type="button" class="btn-pill btn-pill-secondary" data-modal-close>Cancel</button>',
    '      <button type="button" class="btn-pill btn-pill-primary" data-dp-discard-confirm>Change template anyway</button>',
    '    </footer>',
    '  </div>',
    '</div>',

    /* ── Add-page picker — filter chips + tile grid (tiles injected on open
          so "Added" reflects the live page list). Shell .modal-picker-grid. ── */
    '<div class="modal-scrim" id="wb-addpage-modal" data-modal aria-hidden="true">',
    '  <div class="modal-card lg-glass-card modal-picker-grid" role="dialog" aria-modal="true" aria-labelledby="wb-addpage-h">',
    '    <header class="modal-head">',
    '      <div class="modal-head-lead">',
    '        <h2 id="wb-addpage-h">Add a page</h2>',
    '        <p class="modal-sub">Pick a page type to add to your site.</p>',
    '      </div>',
    '      <button class="modal-close" type="button" data-modal-close aria-label="Close">',
    '        <span class="material-symbols-outlined" aria-hidden="true">close</span>',
    '      </button>',
    '    </header>',
    '    <div class="dp-filter-chips" role="radiogroup" aria-label="Filter pages by visibility" data-wb-addpage-filter>',
    '      <button type="button" class="dp-filter-chip is-active" role="radio" aria-checked="true" tabindex="0" data-wb-filter="all">All</button>',
    '      <button type="button" class="dp-filter-chip" role="radio" aria-checked="false" tabindex="-1" data-wb-filter="public">Public</button>',
    '      <button type="button" class="dp-filter-chip" role="radio" aria-checked="false" tabindex="-1" data-wb-filter="private">Private</button>',
    '    </div>',
    '    <div class="modal-picker-body" id="wb-addpage-grid" role="radiogroup" aria-label="Page type"></div>',
    '    <p class="wb-addpage-hint" id="wb-addpage-hint" hidden>Only custom pages can be added more than once.</p>',
    '    <div class="wb-addpage-custom" id="wb-addpage-custom" hidden>',
    '      <label class="form-label" for="wb-addpage-custom-input">Page title</label>',
    '      <input id="wb-addpage-custom-input" class="form-input" type="text" maxlength="40" autocomplete="off" placeholder="e.g. Sangeet Night" aria-describedby="wb-addpage-custom-err" />',
    '      <p class="form-error" id="wb-addpage-custom-err" role="alert" hidden>Give your page a title.</p>',
    '    </div>',
    '    <footer class="modal-actions">',
    '      <button type="button" class="btn-pill btn-pill-secondary" data-modal-close>Cancel</button>',
    '      <button type="button" class="btn-pill btn-pill-primary" data-wb-addpage-confirm disabled>Add page</button>',
    '    </footer>',
    '  </div>',
    '</div>',

    /* ── Remove-page confirm — cautionary ── */
    '<div class="modal-scrim" id="wb-removepage-confirm" data-modal aria-hidden="true">',
    '  <div class="modal-card lg-glass-card modal-confirm-cautionary" role="alertdialog" aria-modal="true" aria-labelledby="wb-removepage-h">',
    '    <button class="modal-close modal-close--abs" type="button" data-modal-close aria-label="Close">',
    '      <span class="material-symbols-outlined" aria-hidden="true">close</span>',
    '    </button>',
    '    <span class="modal-confirm-icon is-cautionary" aria-hidden="true">',
    '      <span class="material-symbols-outlined">delete</span>',
    '    </span>',
    '    <h2 class="modal-confirm-title" id="wb-removepage-h">Remove this page?</h2>',
    '    <p class="modal-confirm-text">Guests will no longer see <strong id="wb-removepage-name">this page</strong>. You can add it back anytime from the library.</p>',
    '    <footer class="modal-actions">',
    '      <button type="button" class="btn-pill btn-pill-secondary" data-modal-close>Cancel</button>',
    '      <button type="button" class="btn-pill btn-pill-primary" data-wb-removepage-confirm>Remove page</button>',
    '    </footer>',
    '  </div>',
    '</div>'
  ].join('\n');

  if (!document.getElementById('wb-share-modal')) {
    document.body.insertAdjacentHTML('beforeend', SHARED_MODALS_HTML);
  }

  /* ── Toast (delegated to shell) ─────────────────────────────────── */
  function toast(msg) {
    if (window.evenzi && typeof window.evenzi.showToast === 'function') {
      window.evenzi.showToast(msg);
      return;
    }
    // Shell.js may load after this script — retry on next tick once
    setTimeout(() => {
      if (window.evenzi && typeof window.evenzi.showToast === 'function') {
        window.evenzi.showToast(msg);
      }
    }, 0);
  }

  /* ── Modal helpers — delegate open/close to shell (window.evenzi) ─
     Shell owns stacking, focus-trap, focus-return, Esc, scrim-click,
     scroll-lock. Page scripts only do content prep. */
  function wbOpenModal(id) {
    if (window.evenzi && window.evenzi.openModal) window.evenzi.openModal(id);
  }
  function wbCloseModal(id) {
    if (window.evenzi && window.evenzi.closeModal) window.evenzi.closeModal(id);
  }

  /* ── Copy URL ───────────────────────────────────────────────────── */
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-dp-copy]');
    if (!trigger) return;
    const url = trigger.getAttribute('data-dp-copy') || '';
    if (!url) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        () => toast('LINK COPIED'),
        () => toast("COULDN'T COPY — TRY AGAIN")
      );
    } else {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); toast('LINK COPIED'); }
      catch (_) { toast("COULDN'T COPY"); }
      document.body.removeChild(ta);
    }
  });

  /* ── Share modal — opened by [data-dp-share] and [data-dp-edit-slug].
     Content prep: sync the slug input to the current slug, reset errors. ── */
  function prepShareModal(focusSlug) {
    const slugEl = document.getElementById('dp-slug');
    const input = document.getElementById('dp-slug-input');
    if (slugEl && input) input.value = slugEl.textContent.trim();
    const err = document.getElementById('dp-slug-error');
    if (err) { err.hidden = true; err.textContent = ''; }
    const helper = document.getElementById('dp-slug-helper');
    if (helper) helper.textContent = 'Letters, numbers and hyphens only.';
    if (input) input.removeAttribute('aria-invalid');
    // Collapse the QR panel each time the modal opens
    const qr = document.getElementById('wb-qr-panel');
    const qrBtn = document.querySelector('[data-dp-show-qr]');
    if (qr) qr.hidden = true;
    if (qrBtn) qrBtn.setAttribute('aria-expanded', 'false');
    wbOpenModal('wb-share-modal');
    /* Always land focus on the slug input (more meaningful than the
       close button — agent build-phase finding). focusSlug additionally
       selects the text for quick edit. */
    setTimeout(() => {
      if (!input) return;
      input.focus();
      if (focusSlug) input.select();
    }, 110);
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-dp-share]')) { e.preventDefault(); prepShareModal(false); return; }
    if (e.target.closest('[data-dp-edit-slug]')) { e.preventDefault(); prepShareModal(true); return; }
  });

  // Live validation in the slug modal
  const slugInput = document.getElementById('dp-slug-input');
  const slugHelper = document.getElementById('dp-slug-helper');
  const slugError = document.getElementById('dp-slug-error');
  const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;
  // Demo reserved list — in real impl this hits the API
  const TAKEN = new Set(['admin', 'evenzi', 'login', 'home', 'rsvp']);

  function validateSlug(raw) {
    const clean = String(raw || '').toLowerCase().trim();
    if (!clean) return { ok: false, msg: 'URL cannot be empty.' };
    if (!SLUG_RE.test(clean)) {
      return { ok: false, msg: 'Use 2–40 lowercase letters, numbers, or hyphens. Cannot start or end with a hyphen.' };
    }
    if (TAKEN.has(clean)) return { ok: false, msg: 'That URL is already taken — try another.' };
    return { ok: true, msg: 'Looks good — this URL is available.', clean };
  }

  if (slugInput) {
    slugInput.addEventListener('input', () => {
      const result = validateSlug(slugInput.value);
      if (result.ok) {
        if (slugError) { slugError.hidden = true; slugError.textContent = ''; }
        if (slugHelper) slugHelper.textContent = result.msg;
        slugInput.removeAttribute('aria-invalid');
      } else {
        if (slugError) { slugError.hidden = false; slugError.textContent = result.msg; }
        if (slugHelper) slugHelper.textContent = '';
        slugInput.setAttribute('aria-invalid', 'true');
      }
    });
    slugInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.querySelector('[data-dp-slug-save]')?.click();
      }
    });
  }

  document.addEventListener('click', (e) => {
    const save = e.target.closest('[data-dp-slug-save]');
    if (!save) return;
    if (!slugInput) return;
    const result = validateSlug(slugInput.value);
    if (!result.ok) {
      if (slugError) { slugError.hidden = false; slugError.textContent = result.msg; }
      slugInput.setAttribute('aria-invalid', 'true');
      slugInput.focus();
      return;
    }
    // Commit — stays inside the Share modal (host may still set RSVP / WhatsApp)
    const slugEl = document.getElementById('dp-slug');
    if (slugEl) slugEl.textContent = result.clean;
    const fullUrl = 'https://evenzi.com/e/' + result.clean;
    document.querySelectorAll('[data-dp-copy]').forEach((el) => {
      el.setAttribute('data-dp-copy', fullUrl);
    });
    document.querySelectorAll('[data-bc-copy-path]').forEach((el) => {
      el.setAttribute('data-bc-copy-path', fullUrl);
    });
    // Sync the Publish-confirm URL pill + the WhatsApp message body
    const pubUrl = document.getElementById('wb-pubconf-url');
    if (pubUrl) pubUrl.textContent = 'evenzi.com/e/' + result.clean;
    const wa = document.getElementById('wb-wa-message');
    if (wa) wa.value = wa.value.replace(/https:\/\/evenzi\.com\/e\/[a-z0-9-]+/i, fullUrl);
    if (slugHelper) slugHelper.textContent = 'Saved — ' + fullUrl;
    toast('URL UPDATED');
  });

  /* ── Toggle-switch state announcements ──────────────────────────── */
  /* Shell pattern: <button class="toggle-switch" role="switch" aria-checked>.
     shell.js owns the aria-checked flip on click + Space — we only react. */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button.toggle-switch[data-dp-toggle]');
    if (!btn) return;
    queueMicrotask(() => {
      const kind = btn.getAttribute('data-dp-toggle');
      const on = btn.getAttribute('aria-checked') === 'true';
      /* Sync every toggle of the same kind (card ↔ modal duplicates) */
      document.querySelectorAll('button.toggle-switch[data-dp-toggle="' + kind + '"]').forEach((t) => {
        if (t !== btn) t.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      if (kind === 'visibility') {
        const badge = document.getElementById('wb-status-badge') || document.querySelector('.status-badge');
        if (badge) {
          badge.classList.remove('status-draft', 'status-published', 'status-offline');
          badge.classList.add(on ? 'status-published' : 'status-draft');
          const dot = badge.querySelector('.status-dot');
          if (dot && dot.nextSibling) dot.nextSibling.nodeValue = on ? ' Published' : ' Draft';
          badge.setAttribute('aria-label', on ? 'Site status: Published' : 'Site status: Draft');
        }
        const help = document.getElementById('dp-vis-help');
        if (help) {
          help.textContent = on
            ? 'Live at evenzi.com/e/' + (document.getElementById('dp-slug')?.textContent || '')
            : 'Currently in Draft — only you can see it';
        }
        toast(on ? 'PUBLISHED' : 'SAVED TO DRAFT');
      } else if (kind === 'rsvp') {
        const help = document.getElementById('dp-rsvp-help');
        if (help) help.textContent = on ? 'Accepting responses' : 'RSVP form is closed';
        toast(on ? 'RSVP COLLECTION ON' : 'RSVP COLLECTION OFF');
      } else if (kind === 'password') {
        const help = document.getElementById('dp-pwd-help');
        if (help) help.textContent = on
          ? 'Guests need a phone match or password to unlock details'
          : 'Site is fully public — anyone with the link sees all pages';
        /* Sync the conditional password line into the WhatsApp message.
           When lock is ON, append a "Password: …" line above the cheerful
           outro. When OFF, strip it. The line uses a sentinel-prefix so
           we can find + replace it cleanly. */
        syncWhatsAppPasswordLine(on);
        /* Disclose / hide the password input in the Publish modal too */
        const field = document.getElementById('wb-password-field');
        if (field) field.classList.toggle('is-hidden', !on);
        toast(on ? 'PRIVATE LOCK ON' : 'SITE FULLY PUBLIC');
      }
    });
  });

  /* ── Device toggle (preview frame) ──────────────────────────────── */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.device-toggle-btn');
    if (!btn) return;
    const stage = btn.closest('.dp-card')?.querySelector('.dp-preview-stage');
    const device = btn.getAttribute('data-device');
    if (!stage || !device) return;
    btn.parentElement.querySelectorAll('.device-toggle-btn').forEach((b) => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-checked', b === btn ? 'true' : 'false');
    });
    stage.setAttribute('data-device-stage', device);
  });

  /* ── Page row visibility toggle ─────────────────────────────────── */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-dp-row-toggle]');
    if (!btn) return;
    e.preventDefault();
    const row = btn.closest('.page-list-row');
    if (!row) return;
    const willHide = !row.classList.contains('is-hidden');
    row.classList.toggle('is-hidden', willHide);
    const icon = btn.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = willHide ? 'visibility_off' : 'visibility';
    btn.setAttribute('aria-label', willHide ? 'Show page' : 'Hide page');
    const name = row.querySelector('.dp-page-name')?.textContent.trim() || 'Page';
    toast(willHide ? name.toUpperCase() + ' HIDDEN' : name.toUpperCase() + ' SHOWN');
  });

  /* ── Per-row edit chevron → per-page section editor ──── */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-dp-row-edit]');
    if (!btn) return;
    e.preventDefault();
    const row = btn.closest('.page-list-row');
    const id = row ? (row.getAttribute('data-page') || '') : '';
    const base = id.indexOf('custom') === 0 ? 'custom' : id;
    window.location.href = 'edit-page.html?page=' + encodeURIComponent(base || 'home');
  });

  /* ── Drag handle (aria-disabled stub) ───────────────────────────── */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.dp-drag[aria-disabled="true"]');
    if (!btn) return;
    e.preventDefault();
    toast('KEYBOARD REORDER COMING SOON');
  });

  /* ════════════════════════════════════════════════════════════════
     ADD-PAGE PICKER + REMOVE-PAGE  (Overview "Pages" card)
     Tiles rendered on open so "Added" reflects the live list. Remove
     buttons ensured on every removable row (existing + injected). All
     DOM built with createElement/textContent (no innerHTML — XSS-safe
     for custom page titles). Modals injected above into SHARED_MODALS_HTML.
     ════════════════════════════════════════════════════════════════ */

  var PAGE_LIBRARY = [
    { id:'home',          name:'Home',          icon:'home',           tier:'public',  desc:'Names, date, countdown, cover.' },
    { id:'rsvp',          name:'RSVP',          icon:'how_to_reg',     tier:'private', desc:'Collect guest responses per event.' },
    { id:'schedule',      name:'Schedule',      icon:'calendar_month', tier:'private', desc:'Sub-event timings and venues.' },
    { id:'story',         name:'Story',         icon:'favorite',       tier:'private', desc:'Your journey, told your way.' },
    { id:'wedding-party', name:'Wedding Party', icon:'groups',         tier:'private', desc:'Family and close people.' },
    { id:'venue',         name:'Venue',         icon:'place',          tier:'private', desc:'Maps and directions.' },
    { id:'travel',        name:'Travel & Stay', icon:'hotel',          tier:'private', desc:'Hotels and travel tips.' },
    { id:'qa',            name:'Q & A',         icon:'question_answer',tier:'private', desc:'Answer guest FAQs upfront.' },
    { id:'gallery',       name:'Gallery',       icon:'collections',    tier:'private', desc:'Photos for guests to browse.' },
    { id:'video',         name:'Video',         icon:'movie',          tier:'private', desc:'Embed a highlight reel or teaser.' },
    { id:'custom',        name:'Custom',        icon:'auto_awesome',   tier:'private', multi:true, desc:'Any page you like — you name it.' }
  ];
  var MANDATORY = { home:true, rsvp:true };   // never removable

  var pageList   = document.querySelector('.dp-page-list');
  var pagesCount = document.getElementById('dp-pages-count');
  var addState   = { selected:null };
  var pendingRemove = null;
  var customSeq  = 0;

  function libById(id){ for (var i=0;i<PAGE_LIBRARY.length;i++){ if (PAGE_LIBRARY[i].id===id) return PAGE_LIBRARY[i]; } return null; }

  /* Tiny DOM builder — text via textContent (safe), attrs via setAttribute. */
  function el(tag, opts){
    var e = document.createElement(tag);
    opts = opts || {};
    if (opts.cls) e.className = opts.cls;
    if (opts.text != null) e.textContent = opts.text;
    if (opts.attrs) Object.keys(opts.attrs).forEach(function(k){ e.setAttribute(k, opts.attrs[k]); });
    if (opts.kids) opts.kids.forEach(function(k){ if (k) e.appendChild(k); });
    return e;
  }
  function icon(name){ return el('span', { cls:'material-symbols-outlined', text:name, attrs:{'aria-hidden':'true'} }); }
  function tierBadgeEl(tier){
    if (tier==='public') return el('span', { cls:'dp-page-tier dp-tier-public', text:'Public' });
    var sp = el('span', { cls:'dp-page-tier dp-tier-private', kids:[ icon('lock') ] });
    sp.appendChild(document.createTextNode('Private'));
    return sp;
  }
  function iconBtn(glyph, attrs){
    return el('button', { cls:'dp-icon-btn-sm', attrs:Object.assign({ type:'button' }, attrs), kids:[ icon(glyph) ] });
  }

  function currentBaseIds(){
    var set = {};
    if (!pageList) return set;
    pageList.querySelectorAll('.page-list-row').forEach(function(row){
      var p = row.getAttribute('data-page') || '';
      set[p.indexOf('custom')===0 ? 'custom' : p] = true;
    });
    return set;
  }
  function syncCount(){
    if (pagesCount && pageList) pagesCount.textContent = String(pageList.querySelectorAll('.page-list-row').length);
  }

  function ensureRemoveButtons(){
    if (!pageList) return;
    pageList.querySelectorAll('.page-list-row').forEach(function(row){
      var base = (row.getAttribute('data-page')||'');
      base = base.indexOf('custom')===0 ? 'custom' : base;
      if (MANDATORY[base]) return;
      var actions = row.querySelector('.dp-page-actions');
      if (!actions || actions.querySelector('[data-dp-row-remove]')) return;
      var nm = row.querySelector('.dp-page-name');
      var name = nm ? nm.textContent.trim() : 'page';
      var rm = iconBtn('delete_outline', { 'aria-label':'Remove '+name, 'data-dp-row-remove':'' });
      var editBtn = actions.querySelector('[data-dp-row-edit]');
      actions.insertBefore(rm, editBtn || null);
    });
  }

  function buildRow(page, displayName, uid){
    var drag = el('button', { cls:'dp-drag', attrs:{ type:'button', 'aria-disabled':'true', title:'Drag to reorder (keyboard reorder coming soon)', 'aria-label':'Reorder '+displayName+' — drag only for now' }, kids:[ icon('drag_indicator') ] });
    var pic = icon(page.icon); pic.classList.add('dp-page-icon');
    var meta = el('div', { cls:'dp-page-meta', kids:[ pic, el('span', { cls:'dp-page-name', text:displayName }), tierBadgeEl(page.tier) ] });
    var actions = el('div', { cls:'dp-page-actions', kids:[
      iconBtn('visibility', { 'aria-label':'Hide page', 'data-dp-row-toggle':'' }),
      iconBtn('delete_outline', { 'aria-label':'Remove '+displayName, 'data-dp-row-remove':'' }),
      iconBtn('chevron_right', { 'aria-label':'Edit '+displayName, 'data-dp-row-edit':'' })
    ] });
    return el('li', { cls:'page-list-row', attrs:{ 'data-page':uid }, kids:[ drag, meta, actions ] });
  }

  function makeTile(p, added){
    var did = 'wb-tile-' + p.id + '-d';
    var nameEl = el('span', { cls:'modal-picker-tile-name' });
    nameEl.appendChild(document.createTextNode(p.name + ' '));
    nameEl.appendChild(tierBadgeEl(p.tier));
    var kids = [
      el('span', { cls:'modal-picker-tile-icon', attrs:{'aria-hidden':'true'}, kids:[ icon(p.icon) ] }),
      nameEl,
      el('span', { cls:'modal-picker-tile-desc', text:p.desc, attrs:{ id:did } })
    ];
    if (added) kids.push(el('span', { cls:'modal-picker-tile-flag is-added', text:'Added' }));
    else if (p.multi) kids.push(el('span', { cls:'modal-picker-tile-flag is-multi', text:'Add multiple' }));
    kids.push(el('span', { cls:'modal-picker-tile-check', attrs:{'aria-hidden':'true'}, kids:[ icon('check_circle') ] }));
    var attrs = { role:'radio', 'aria-checked':'false', 'aria-describedby':did, tabindex:'-1' };
    if (added) attrs['aria-disabled'] = 'true'; else attrs['data-wb-page-add'] = p.id;
    return el('button', { cls:'modal-picker-tile', attrs:attrs, kids:kids });
  }

  /* Roving tabindex — exactly one tile is tabbable; arrows move among them. */
  function rovingTiles(){ return Array.prototype.slice.call(document.querySelectorAll('#wb-addpage-grid .modal-picker-tile')); }
  function setRovingTo(tile){
    rovingTiles().forEach(function(t){ t.setAttribute('tabindex', t===tile ? '0' : '-1'); });
  }

  function renderAddGrid(filter){
    var grid = document.getElementById('wb-addpage-grid'); if (!grid) return;
    var existing = currentBaseIds();
    grid.textContent = '';
    PAGE_LIBRARY.forEach(function(p){
      if (filter && filter!=='all' && p.tier!==filter) return;
      grid.appendChild(makeTile(p, !p.multi && !!existing[p.id]));
    });
    /* First enabled tile (or first tile) is the radiogroup's tab stop. */
    var firstEnabled = grid.querySelector('.modal-picker-tile:not([aria-disabled="true"])') || grid.querySelector('.modal-picker-tile');
    if (firstEnabled) firstEnabled.setAttribute('tabindex', '0');
    var hint = document.getElementById('wb-addpage-hint');
    if (hint){
      var allSingleAdded = PAGE_LIBRARY.every(function(p){ return p.multi || existing[p.id]; });
      hint.hidden = !((!filter || filter==='all') && allSingleAdded);
    }
  }

  function setAddEnabled(on){ var b = document.querySelector('[data-wb-addpage-confirm]'); if (b) b.disabled = !on; }
  function showCustom(on){ var box = document.getElementById('wb-addpage-custom'); if (box) box.hidden = !on; }

  function resetAddPicker(){
    addState.selected = null;
    setAddEnabled(false);
    showCustom(false);
    var inp = document.getElementById('wb-addpage-custom-input'); if (inp){ inp.value = ''; inp.removeAttribute('aria-invalid'); }
    var err = document.getElementById('wb-addpage-custom-err');   if (err) err.hidden = true;
    document.querySelectorAll('[data-wb-addpage-filter] .dp-filter-chip').forEach(function(c){
      var on = c.getAttribute('data-wb-filter')==='all';
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-checked', on?'true':'false');
      c.setAttribute('tabindex', on?'0':'-1');
    });
    renderAddGrid('all');
  }

  function openAddPicker(){
    resetAddPicker();
    wbOpenModal('wb-addpage-modal');
    setTimeout(function(){
      var first = document.querySelector('#wb-addpage-grid .modal-picker-tile:not([aria-disabled="true"])');
      if (first) first.focus();
    }, 110);
  }

  document.addEventListener('click', function(e){
    if (!e.target.closest('[data-dp-add-page]')) return;
    e.preventDefault();
    openAddPicker();
  });

  document.addEventListener('click', function(e){
    var tile = e.target.closest('[data-wb-page-add]');
    if (!tile) return;
    var id = tile.getAttribute('data-wb-page-add');
    document.querySelectorAll('#wb-addpage-grid .modal-picker-tile').forEach(function(t){
      var sel = t===tile;
      t.classList.toggle('is-selected', sel);
      t.setAttribute('aria-checked', sel?'true':'false');
    });
    setRovingTo(tile);
    addState.selected = id;
    if (id==='custom'){
      showCustom(true);
      var inp = document.getElementById('wb-addpage-custom-input');
      setAddEnabled(!!(inp && inp.value.trim().length>0));
      if (inp) inp.focus();
    } else {
      showCustom(false);
      setAddEnabled(true);
    }
  });

  /* Tile arrow-key roving (radiogroup): move focus among tiles + select the
     landed tile if it's selectable (Added tiles get focus but stay unselected). */
  document.addEventListener('keydown', function(e){
    var tile = e.target.closest && e.target.closest('#wb-addpage-grid .modal-picker-tile');
    if (!tile) return;
    var k = e.key;
    if (k!=='ArrowRight'&&k!=='ArrowLeft'&&k!=='ArrowDown'&&k!=='ArrowUp') return;
    e.preventDefault();
    var tiles = rovingTiles();
    var idx = tiles.indexOf(tile);
    var nx = (k==='ArrowRight'||k==='ArrowDown') ? (idx+1)%tiles.length : (idx-1+tiles.length)%tiles.length;
    var target = tiles[nx];
    setRovingTo(target);
    target.focus();
    if (target.hasAttribute('data-wb-page-add')) target.click();
  });

  document.addEventListener('input', function(e){
    if (e.target.id!=='wb-addpage-custom-input') return;
    var err = document.getElementById('wb-addpage-custom-err'); if (err) err.hidden = true;
    e.target.removeAttribute('aria-invalid');
    setAddEnabled(e.target.value.trim().length>0 && addState.selected==='custom');
  });

  function setFilter(chip){
    var group = chip.closest('[data-wb-addpage-filter]'); if (!group) return;
    group.querySelectorAll('.dp-filter-chip').forEach(function(c){
      var on = c===chip;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-checked', on?'true':'false');
      c.setAttribute('tabindex', on?'0':'-1');
    });
    renderAddGrid(chip.getAttribute('data-wb-filter'));
    addState.selected = null; setAddEnabled(false); showCustom(false);
  }
  document.addEventListener('click', function(e){
    var chip = e.target.closest('[data-wb-addpage-filter] .dp-filter-chip');
    if (chip) setFilter(chip);
  });
  document.addEventListener('keydown', function(e){
    var chip = e.target.closest && e.target.closest('[data-wb-addpage-filter] .dp-filter-chip');
    if (!chip) return;
    var k = e.key;
    if (k!=='ArrowRight'&&k!=='ArrowLeft'&&k!=='ArrowDown'&&k!=='ArrowUp') return;
    e.preventDefault();
    var chips = Array.prototype.slice.call(chip.closest('[data-wb-addpage-filter]').querySelectorAll('.dp-filter-chip'));
    var idx = chips.indexOf(chip);
    var nx = (k==='ArrowRight'||k==='ArrowDown') ? (idx+1)%chips.length : (idx-1+chips.length)%chips.length;
    chips[nx].focus(); setFilter(chips[nx]);
  });

  document.addEventListener('click', function(e){
    if (!e.target.closest('[data-wb-addpage-confirm]')) return;
    e.preventDefault();
    var id = addState.selected; if (!id) return;
    var page = libById(id); if (!page) return;
    var displayName = page.name, uid = id;
    if (id==='custom'){
      var inp = document.getElementById('wb-addpage-custom-input');
      var val = inp ? inp.value.trim() : '';
      if (!val){
        var err = document.getElementById('wb-addpage-custom-err'); if (err) err.hidden = false;
        if (inp) inp.setAttribute('aria-invalid', 'true');
        setAddEnabled(false); if (inp) inp.focus(); return;
      }
      displayName = val; uid = 'custom-' + (++customSeq);
    }
    var row = buildRow(page, displayName, uid);
    if (pageList) pageList.appendChild(row);
    syncCount();
    wbCloseModal('wb-addpage-modal');
    toast(displayName.toUpperCase() + ' ADDED');
    setTimeout(function(){ var ed = row.querySelector('[data-dp-row-edit]'); if (ed) ed.focus(); }, 120);
  });

  document.addEventListener('click', function(e){
    var btn = e.target.closest('[data-dp-row-remove]');
    if (!btn) return;
    e.preventDefault();
    var row = btn.closest('.page-list-row'); if (!row) return;
    var nm = row.querySelector('.dp-page-name');
    var name = nm ? nm.textContent.trim() : 'this page';
    pendingRemove = { row: row, name: name };
    var lbl = document.getElementById('wb-removepage-name'); if (lbl) lbl.textContent = name;
    wbOpenModal('wb-removepage-confirm');
  });

  document.addEventListener('click', function(e){
    if (!e.target.closest('[data-wb-removepage-confirm]')) return;
    e.preventDefault();
    wbCloseModal('wb-removepage-confirm');
    if (!pendingRemove) return;
    var row = pendingRemove.row, name = pendingRemove.name;
    var next = row.nextElementSibling, prev = row.previousElementSibling;
    row.remove();
    syncCount();
    toast(name.toUpperCase() + ' REMOVED');
    setTimeout(function(){
      var target = (next && next.querySelector('[data-dp-row-remove], [data-dp-row-edit]')) ||
                   (prev && prev.querySelector('[data-dp-row-remove], [data-dp-row-edit]')) ||
                   document.querySelector('[data-dp-add-page]');
      if (target) target.focus();
    }, 60);
    pendingRemove = null;
  });

  ensureRemoveButtons();

  /* ── Reflect per-page tier set in the editor (sessionStorage epTier:<id>)
        onto the Pages-list rows, so a Public/Private change made in the
        editor shows here too. No-ops on pages without a page list. ── */
  function syncPageTiers() {
    document.querySelectorAll('.page-list-row[data-page]').forEach(function (row) {
      var rid = row.getAttribute('data-page') || '';
      var base = rid.indexOf('custom') === 0 ? 'custom' : rid;
      var t = null; try { t = sessionStorage.getItem('epTier:' + base); } catch (_) {}
      if (!t) return;
      var badge = row.querySelector('.dp-page-tier'); if (!badge) return;
      var isPublic = t === 'public';
      badge.className = 'dp-page-tier ' + (isPublic ? 'dp-tier-public' : 'dp-tier-private');
      badge.textContent = '';
      if (!isPublic) badge.appendChild(icon('lock'));
      badge.appendChild(document.createTextNode(isPublic ? 'Public' : 'Private'));
    });
  }
  syncPageTiers();

  /* ── Publish settings modal ─────────────────────────────────────── */
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-dp-publish]')) return;
    e.preventDefault();
    wbOpenModal('wb-publish-modal');
    /* Move focus from the close button to the currently-checked
       Visibility radio — the meaningful entry point. */
    setTimeout(() => {
      const checked = document.querySelector('#wb-publish-modal input[name="wb-visibility"]:checked');
      if (checked) checked.focus();
    }, 110);
  });

  /* Visibility radio rows — keep .is-active in sync */
  document.addEventListener('change', (e) => {
    const radio = e.target.closest('input[name="wb-visibility"]');
    if (!radio) return;
    document.querySelectorAll('#wb-publish-modal .modal-radio-row').forEach((row) => {
      row.classList.toggle('is-active', row.contains(radio) && radio.checked);
    });
  });

  /* Private-lock toggle inside Publish modal — disclose/hide password field */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-wb-pub-lock]');
    if (!btn) return;
    queueMicrotask(() => {
      const on = btn.getAttribute('aria-checked') === 'true';
      const field = document.getElementById('wb-password-field');
      if (field) field.classList.toggle('is-hidden', !on);
    });
  });

  /* Save publish settings — route Draft→Published through Publish-confirm */
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-dp-publish-save]')) return;
    e.preventDefault();
    const choice = document.querySelector('input[name="wb-visibility"]:checked')?.value || 'draft';
    if (choice === 'published') {
      // Stacked confirm on top of the publish modal
      wbOpenModal('wb-publish-confirm');
    } else {
      applyVisibility(choice);
      wbCloseModal('wb-publish-modal');
      toast(choice === 'offline' ? 'SITE TAKEN OFFLINE' : 'SAVED TO DRAFT');
    }
  });

  /* Publish-confirm "Make it live" — apply, close both modals */
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-dp-publish-confirm]')) return;
    e.preventDefault();
    applyVisibility('published');
    wbCloseModal('wb-publish-confirm');
    wbCloseModal('wb-publish-modal');
    toast('PUBLISHED');
  });

  /* Apply a visibility state to the page badge + status help */
  function applyVisibility(state) {
    const badge = document.getElementById('wb-status-badge');
    if (badge) {
      badge.classList.remove('status-draft', 'status-published', 'status-offline');
      badge.classList.add('status-' + state);
      const dot = badge.querySelector('.status-dot');
      const label = state.charAt(0).toUpperCase() + state.slice(1);
      if (dot && dot.nextSibling) dot.nextSibling.nodeValue = ' ' + label;
      badge.setAttribute('aria-label', 'Site status: ' + label);
    }
    const vis = document.querySelector('[data-dp-toggle="visibility"]');
    if (vis) vis.setAttribute('aria-checked', state === 'published' ? 'true' : 'false');
    const help = document.getElementById('dp-vis-help');
    if (help) {
      help.textContent = state === 'published'
        ? 'Live at evenzi.com/e/' + (document.getElementById('dp-slug')?.textContent || '')
        : state === 'offline'
          ? 'Offline — visitors see a temporary message'
          : 'Currently in Draft — only you can see it';
    }
  }

  /* Keep the conditional `Password: xxxx` line in the WhatsApp message
     synced with the private-lock toggle. The line is inserted just before
     the existing closing line (heuristic: above an empty line near the end).
     Marked with a sentinel so we can find + replace cleanly. */
  function syncWhatsAppPasswordLine(on) {
    const wa = document.getElementById('wb-wa-message');
    const pwd = document.getElementById('wb-password-input')?.value?.trim();
    if (!wa) return;
    const SENTINEL_RE = /\n?\nPassword: [^\n]+/g;   /* find existing line */
    let v = wa.value.replace(SENTINEL_RE, '');
    if (on && pwd) {
      /* Insert after the URL line (matches https://evenzi.com/e/...) */
      v = v.replace(/(https:\/\/evenzi\.com\/e\/[a-z0-9-]+)/i,
                    '$1\n\nPassword: ' + pwd);
    }
    wa.value = v;
  }
  /* If the password input value changes, re-sync (when lock is on) */
  document.addEventListener('input', (e) => {
    if (!e.target.closest('#wb-password-input')) return;
    const lockOn = document.querySelector('[data-dp-toggle="password"]')?.getAttribute('aria-checked') === 'true';
    if (lockOn) syncWhatsAppPasswordLine(true);
  });
  /* Initial sync on load — lock starts ON in the markup, so the password
     line should be present from the start. */
  setTimeout(() => {
    const lockOn = document.querySelector('[data-dp-toggle="password"]')?.getAttribute('aria-checked') === 'true';
    syncWhatsAppPasswordLine(lockOn);
  }, 0);

  /* ── WhatsApp share ─────────────────────────────────────────────── */
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-dp-wa-send]')) return;
    e.preventDefault();
    const msg = document.getElementById('wb-wa-message')?.value || '';
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    toast('WHATSAPP OPENED');
  });

  /* QR panel disclosure */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-dp-show-qr]');
    if (!btn) return;
    e.preventDefault();
    const panel = document.getElementById('wb-qr-panel');
    if (!panel) return;
    const show = panel.hidden;
    panel.hidden = !show;
    btn.setAttribute('aria-expanded', show ? 'true' : 'false');
    btn.lastChild.textContent = show ? ' Hide QR' : ' Show QR';
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-dp-download-qr]')) return;
    e.preventDefault();
    toast('QR DOWNLOADED');
  });

  /* ── Discard / template-reset confirm ───────────────────────────── */
  /* Just closes the modal. The TEMPLATE APPLIED toast is emitted by the
     page-specific commit handler (e.g. design.js commitTemplate()) so
     this shared handler stays generic. Prevents double-toast on the
     Design tab template-change flow. (P1-A · 2026-05-23 agent post-build) */
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-dp-discard-confirm]')) return;
    e.preventDefault();
    wbCloseModal('wb-discard-confirm');
  });

  /* ── Recompute Get-started counter + state on load ──────────────── */
  function syncGsState() {
    const card = document.getElementById('getstarted');
    if (!card) return;
    const tiles = card.querySelectorAll('.dp-gs-grid .gs-tile');
    const done = card.querySelectorAll('.dp-gs-grid .gs-tile.is-done');
    const total = tiles.length;
    const doneCount = done.length;
    const doneEl = document.getElementById('dp-gs-done');
    const totalEl = document.getElementById('dp-gs-total');
    const bar = card.querySelector('.dp-gs-bar');
    if (doneEl) doneEl.textContent = String(doneCount);
    if (totalEl) totalEl.textContent = String(total);
    if (bar) bar.dataset.p = String(total ? (doneCount / total * 100) : 0);
    const allDone = total > 0 && doneCount === total;
    card.setAttribute('data-gs-state', allDone ? 'all-done' : 'in-progress');
    const banner = card.querySelector('.dp-gs-done-banner');
    if (banner) banner.setAttribute('aria-hidden', allDone ? 'false' : 'true');
  }
  syncGsState();

  /* ── Recompute Pages-list state ─────────────────────────────────── */
  function syncPagesState() {
    const card = document.querySelector('.dp-pages-card');
    if (!card) return;
    const rows = card.querySelectorAll('.dp-page-list .page-list-row');
    const empty = rows.length === 0;
    card.setAttribute('data-pages-state', empty ? 'empty' : 'populated');
    const emptyEl = card.querySelector('.dp-pages-empty');
    if (emptyEl) emptyEl.setAttribute('aria-hidden', empty ? 'false' : 'true');
    const countEl = document.getElementById('dp-pages-count');
    if (countEl) countEl.textContent = String(rows.length);
  }
  syncPagesState();
})();
