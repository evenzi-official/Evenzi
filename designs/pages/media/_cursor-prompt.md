# Cursor build runbook — Media & Memories (`media`)

You are building the Evenzi **Media & Memories** host dashboard as a static HTML/CSS/JS prototype in `designs/pages/media/`. You start with no prior context — everything you need is in this folder.

## Read first
1. `_spec.md` (this folder) — the build source of truth. Build exactly what it specifies.
2. `designs/components.html` — the component catalog (foundations, shell/chrome, surfaces, pills, buttons, forms, avatars, data, layout). Reuse before creating.
3. `designs/pages/website/photos.html` + `photos.js` — the known-good sibling. It already implements ~70% of this page (photo grid, select, set-cover, remove, bulk, lightbox, empty state). **Copy its structure as your starting point** — match its `el(t,c)` / `mi(name)` / delegated-handler / no-innerHTML idiom.

## Step 0 — clone the canonical head + chrome (do this before any body work)
Copy, VERBATIM, from `designs/pages/website/photos.html`:
- the entire `<head>` — both Google Fonts links (Poppins + Material Symbols **with the `FILL` axis**), the `../../shared/tailwind.css` + `../../shared/shell.css` links, `viewport-fit=cover` meta, the dark/light theme-color metas, and the `manifest.webmanifest` link.
- the shared chrome in `<body>`: scroll-progress bar, `floating-nav`, `tool-rail`, and the `.bc-wrap` breadcrumb shell.
Then set `<body data-page="media">` (the tool-rail Media button reads this for its active state — the placeholder `designs/pages/media/media.html` already has the correct chrome; you may start from it). Breadcrumb active = MEDIA. **Output file: `designs/pages/media/media.html`** (overwrite the placeholder).

## Hard constraints (do not violate)
- **Design tokens only.** Colors/spacing/radii from the Tailwind token map + `designs/shared/shell.css` variables. Never hardcode hex/px you could pull from a token.
- **No inline CSS or JS. Ever.** Generic → `designs/shared/shell.{css,js}`; page-specific → `designs/pages/media/media.{css,js}`. Plus a `designs/pages/media/media.fixtures.js` for seed data (see below).
- **Link order (load-bearing):** `../../shared/shell.css` then `media.css`; `../../shared/shell.js` then `media.fixtures.js` then `media.js`.
- **Reuse before create.** Honor the `_spec.md` reuse map literally. Only add new CSS for "new" rows.
- **State model = array-as-source-of-truth.** Render the grid/albums/lightbox FROM a JS photo array (each `{id, src, name, albumIds[], uploadedAt, published}`), NOT by re-querying the DOM. This is mandatory — the photos.js DOM-requery model does not scale and can't carry the `published` flag. Keep photos.js's `el()`/`mi()`/no-innerHTML *primitives*, but adopt the data-driven *architecture*.
- **Hover-guard:** wrap every `:hover` rule in `@media (hover:hover) and (pointer:fine)`.
- **Glass fallback:** any `backdrop-filter` needs an `@supports not (backdrop-filter: blur(1px))` solid fallback; max ~2 blurred surfaces per page. **Drop `backdrop-filter` from master-grid tile chrome entirely** (use solid) per the spec.
- **Stretched-link** for clickable album cards — never nest `<a>` in `<a>`.
- **Mobile-first.** 360px first, scale up. Touch targets ≥44px. `env(safe-area-inset-*)` on fixed chrome (bulk-bar). No hover-only interactions.
- **`.bc-wrap`** + `.page-band` are the canonical wrappers — do not override page width.
- Tag top-level sections with `class="reveal"` for scroll-in (shell.js auto-wires the IntersectionObserver).

## Build steps (follow the order)
1. Step 0 (head + chrome clone) → `media.html`.
2. **`media.fixtures.js`** — ONE module exposing two seed states behind a `?seed=` query param (document the contract at the top):
   - `empty` (**default**): 0 photos. Dropzone is the hero. Presets render as inert filter chips, NOT album cards. Meter 0%. Recent + All Photos show empty copy.
   - `populated`: 90 photos across the 6 preset albums (Ceremony/Reception/Mehendi/Sangeet/Candids/Pre-Wedding). Use the `photoSVG(i)` generated-placeholder approach from photos.js. Wire an IntersectionObserver "load more" sentinel to render in batches (demonstrates the 5k–20k lazy-load claim — do NOT mount all 90 at once if you can window it; at minimum batch via the sentinel).
3. Build the body top-to-bottom per `_spec.md` composition: section-head → storage meter strip → upload dropzone (`.dp-dropzone--multi`) → Recent strip → Albums → All Photos grid → Videos teaser → footer. Then the 5 modals.
4. **Promote work — encode as THREE ordered, separately-committed steps** (do NOT do these in one commit):
   - **Commit 1 — rename + catalog:** move `.dp-photo-*`/`.dp-bulk-*` from `designs/pages/website/website.css` into `designs/shared/shell.css`, renamed to neutral `.photo-tile` / `.bulk-bar` (+ select/check/cover-badge/actions/count subparts). Add an `@supports not (backdrop-filter…)` solid fallback for the select-check + action chips. Add the new primitives to `designs/components.html`. **Keep the `website.css` copy in place as a fallback this commit.** Verify `photos.html` still renders.
   - **Commit 2 — dedup:** delete the now-duplicate block from `website.css`, re-point `photos.html`/`photos.js` to the renamed shell classes, and generalize the `[data-photos-state]` hook off `.dp-photos-card` to a shared attribute both pages set — all in this ONE commit (no orphan window). Re-verify `photos.html` (load + select + set-cover + remove + empty toggle).
   - **Commit 3 — net-new picker:** build the assign-to-album picker on the existing `.modal-picker-grid` shell primitive in `media.js` (multi-select). **Do NOT promote `guests.js openPicker`.**
   - Each commit ends with a `photos.html` regression check.
5. **Lightbox prev/next:** add `.modal-lightbox-nav` (prev/next buttons, ≥44px, disabled at ends) to `.modal-image-lightbox` in shell.css; promote + catalog it. Drive prev/next from the photo array **index** (not DOM query). Wire ←/→/Esc + touch swipe. Preload index±1 via `new Image()` only.
6. **Dropzone JS (net-new, media.js):** drag/drop sets `.is-dragover`; click/keyboard triggers a hidden `<input type="file" multiple accept="image/jpeg,image/png,image/heic">`; client pre-flight (accept-list + max count + per-file ≤10 MB → plain-language toast, reuse the avatar handler's cap+toast pattern); faked background-upload progress rows (uploading → processing → success, plus one forced-fail-with-retry demo). HEIC preview is faked — add a code comment that real HEIC needs transcode.
7. **Bulk-bar:** actions = **{Add to album, Remove from album}** ONLY. NO bulk hard-delete anywhere. Per-photo hard-delete lives in the lightbox (single, with the cautionary confirm).
8. **Storage meter (media.js):** 3 states (healthy/near/at-cap) signalled by icon+text+color. `UPGRADE_CTA_MODE = 'passive'` constant: passive renders "More storage coming soon" + a "Notify me" chip (stub — captures intent, routes nowhere); `'active'` renders the "Upgrade for more storage" button. **Default = passive.**
9. **Copy:** use the exact strings in `_spec.md` Copy section — especially the reassuring **delete-album** copy ("Your photos stay safe in All Photos…") vs the true-delete **remove-photo** copy ("permanently removed… can't be undone").
10. Self-check: every section present, every reuse-map row honored, no inline styles, `data-page="media"` set, tokens-only, array-as-source, no bulk-delete, default `?seed=empty` shows the hero.

## When done
Update `_status.md`: `STAGE: TEST`, `UPDATED: <today> — Cursor`, `NEXT: open Antigravity → read _antigravity-prompt.md → execute`.
