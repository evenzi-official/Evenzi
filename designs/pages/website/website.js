/* ════════════════════════════════════════════════════════════════════
   Evenzi · Website (Digital Presence) — page-specific JS
   Owner: designs/pages/website/

   Toast: routes through window.evenzi.showToast() (defined in shell.js,
   writes to #bc-toast). Falls back to a no-op if shell.js isn't loaded.

   Modals: open/close fully delegated to shell.js via window.evenzi.openModal
   / closeModal (stacking-safe — focus-trap, focus-return stack, Esc,
   scrim-click, scroll-lock, dynamic z-index all owned by the shell).
   Page scripts only do content prep before opening (pre-fill inputs,
   reset errors, populate dynamic content).

   Reuses shell.js for theme, breadcrumb, scroll-progress, reveal,
   toggle-switch keyboard a11y.
   ════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  if (document.body.dataset.page !== 'website') return;

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

  /* ── Per-row edit chevron (stub until Edit Pages route exists) ──── */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-dp-row-edit]');
    if (!btn) return;
    e.preventDefault();
    const row = btn.closest('.page-list-row');
    const name = row?.querySelector('.dp-page-name')?.textContent.trim() || 'page';
    toast('OPENING ' + name.toUpperCase() + ' EDITOR…');
  });

  /* ── Drag handle (aria-disabled stub) ───────────────────────────── */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.dp-drag[aria-disabled="true"]');
    if (!btn) return;
    e.preventDefault();
    toast('KEYBOARD REORDER COMING SOON');
  });

  /* ── Add page button (stub — picker modal lands with Edit Pages tab) ─ */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-dp-add-page]');
    if (!btn) return;
    e.preventDefault();
    toast('PAGE PICKER — COMING NEXT');
  });

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
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-dp-discard-confirm]')) return;
    e.preventDefault();
    wbCloseModal('wb-discard-confirm');
    toast('TEMPLATE CHANGED');
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
    if (bar) bar.style.setProperty('--p', total ? (doneCount / total * 100) + '%' : '0%');
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
