# Cursor FINAL runbook — Media & Memories (`media`) · SPEC_VERSION 2026-06-12.1

> **This is the single authoritative Cursor prompt. It supersedes `_cursor-prompt.md` (R1, from-scratch build)
> and `_cursor-followup.md` (R2, tab + alignment change).** Everything Cursor needs is here. Build/verify the
> static prototype at `designs/pages/media/media.{html,css,js}` (+ `media.fixtures.js`), served via
> `npm run design` → http://localhost:4000/pages/media/media.html.

## Read first
1. `_spec.md` (this folder) — build source of truth (composition, reuse map, data model, copy, council rulings).
2. `designs/components.html` — component catalog. Reuse before creating.
3. Siblings to copy patterns from:
   - `designs/pages/website/photos.html` + `photos.js` — gallery grid/select/cover/remove/bulk/lightbox (~70% of the photo surface). Match its `el(t,c)`/`mi()`/no-innerHTML/delegated-handler idiom.
   - `designs/pages/planning/planning.html` + `planning.js` — the **in-page `.seg` tab** idiom (role=tablist/tab/tabpanel + roving tabindex). Copy this for the Media tabs.

## Global constraints (do not violate)
- **Design tokens only**; **no inline CSS/JS**. Generic → `designs/shared/shell.{css,js}`; page-specific → `designs/pages/media/media.{css,js}`; seed data → `designs/pages/media/media.fixtures.js`.
- Link order (load-bearing): `../../shared/shell.css` → `media.css`; `../../shared/shell.js` → `media.fixtures.js` → `media.js`.
- **Reuse before create** (cite catalog + sibling). Hover-guard every `:hover`. `@supports` solid fallback for any `backdrop-filter` (drop blur on master-grid tiles entirely). Stretched-link for clickable cards. Mobile-first, touch targets **≥44px**. `.bc-wrap`/`.page-band` canonical wrappers. `class="reveal"` on top-level blocks. Dark mode + `prefers-reduced-motion` honored. Indian conventions (₹, DD/MM/YYYY, 12-hour).
- **State model = array-as-source-of-truth** (each photo `{id, src, name, albumIds[], uploadedAt, published}`); render from state, never re-query the DOM for data. `website/photos` consumes the `published:true` subset of this store.

## Page structure (FINAL — tab layout)
`<body data-page="media">` with the canonical chrome cloned from `website/photos.html` (scroll-progress, floating-nav, tool-rail with Media active, `.bc-wrap` breadcrumb DASHBOARD › ANYA & KABIR › MEDIA).

Inside `main.page-band`, top → bottom:
1. `.section-head` — h1 "Media & Memories" + sub. **Persistent.**
2. Storage meter strip `#md-meter` — usage meter + passive CTA (see §Storage). **Persistent** (sits above the tabs).
3. **Tabs** — reuse shell `.seg` in-page (planning idiom):
   - `<div class="seg-wrap reveal">` → `<nav class="seg" role="tablist" aria-label="Media sections">`.
   - **Use base `.seg-wrap`, NOT `.seg-wrap--page`** — the `--page` modifier's 2.5rem padding is for full-bleed placement; inside `main.page-band` it double-insets the tab track and breaks left-alignment with the title/Storage/dropzone. (This was a real bug — keep base `.seg-wrap` so every block shares left=40 desktop / 24 mobile.)
   - Three `<button role="tab" class="seg-item seg--page" aria-selected aria-controls tabindex>`: **Photos** · **Albums** · **Videos** (Videos has a `.role-tag-soon` "Soon" pill).
4. Three `<section role="tabpanel" aria-labelledby class="media-panel reveal" [hidden]>`:
   - `#md-panel-photos` (active): Upload dropzone (`.dp-dropzone--multi`) + upload-progress list + Recent uploads strip + All photos grid (`#md-all`, `data-photos-state`/`data-select-mode`, `#md-grid`, empty state, load sentinel).
   - `#md-panel-albums` (hidden): albums grid (`#md-albums-grid`) — 6 presets + Create-album card; preset chips when empty.
   - `#md-panel-videos` (hidden): `.empty-cta-card` "coming soon" teaser.
5. Floating `.bulk-bar` (`#md-bulk`) outside main; footer; help-FAB; toast.
6. Modals: create-album · album-options (rename/delete) · assign-to-album picker (built on `.modal-picker-grid`) · photo lightbox (`.modal-image-lightbox` + `.modal-lightbox-nav` prev/next) · remove-photo confirm (single hard-delete) · delete-album confirm (reassuring "photos stay in All Photos" copy).

Tabs JS (`media.js wireTabs()`): click + ArrowLeft/Right/Up/Down/Home/End; roving `tabindex`; toggles `aria-selected`/`is-active` + panel `[hidden]`. Do not use separate-page links; do not invent a new mechanism.

## Reuse map (rungs — from `_spec.md`)
- **Reuse-as-is (shell):** `.dp-tile-grid`, `.modal-image-lightbox`, `.modal-confirm-cautionary`, `.modal-picker-grid`, `.empty-cta-card`, `.seg`/`.seg-wrap`/`.seg-item`, `.role-tag-soon`.
- **Modifier-extend:** `.dp-dropzone` → `.dp-dropzone--multi` (multi-file, no crop coupling); `.modal-image-lightbox` + new `.modal-lightbox-nav` (prev/next) → promote nav to shell.
- **Promote (move, don't fork) — 3 ORDERED commits**, each ending with a `photos.html` regression check:
  1. Rename `.dp-photo-*`/`.dp-bulk-*` (page-local in `website.css`) → neutral `.photo-tile`/`.bulk-bar` in `shell.css`; add `@supports` solid glass fallback; add to `components.html`. (website.css copy stays this commit.)
  2. Delete the `website.css` copy + re-point/re-verify `photos.html`; generalize the `[data-photos-state]` hook off `.dp-photos-card`.
  3. Build the assign-to-album picker net-new on `.modal-picker-grid` (do NOT promote `guests.js openPicker`).
- **New page-specific (`media.css/js`):** `.album-card` (flag for promotion), recent-uploads strip, upload-progress list, storage meter, `wireTabs()`.

## Storage (passive CTA, default)
`UPGRADE_CTA_MODE = 'passive'` (founder-locked default): renders "More storage coming soon" + a "Notify me" intent chip (stub, routes nowhere). `'active'` mode (flag only) renders "Upgrade for more storage". 3 meter states (healthy/near/at-cap) signalled by icon+text+color (never color alone). Presentational only — data contract `{usedBytes, limitBytes, tier}`, NOT Supabase bucket stats (no backing table yet).

## First-run fixture (`media.fixtures.js`, `?seed=`)
- `empty` (**default**): 0 photos; dropzone is the hero ("Add your first photos"); presets as inert chips (not album cards); meter 0%.
- `populated`: 90 photos across the 6 presets; IntersectionObserver "load more" sentinel renders in batches (demonstrates 5k–20k lazy-load). Album cards appear only once an album has ≥1 photo.

## Bulk + delete rules (founder/arbiter-locked)
- Bulk-bar = **{Add to album, Remove from album}** ONLY. "Remove from album" un-files (reversible). **No bulk hard-delete anywhere** (explicit negative requirement).
- Hard-delete = lightbox-only, single photo, cautionary confirm.
- Delete-album un-files its photos (they remain in All Photos), never deletes photos — reassuring confirm copy.

## Cross-cutting fixes — IN SCOPE for this pass (flag to founder before the shell-wide ones land broadly)
1. **Font vendoring (P1, shell-wide — fixes `1.resilience`).** Poppins + Material Symbols currently load from `fonts.googleapis.com` (layout-critical → page collapses if the CDN is blocked, same failure class Tailwind already had before it was vendored). Vendor both locally and replace the Google Fonts `<link>`s **across every page + the shell head** (download the WOFF2s into `designs/shared/fonts/`, add `@font-face` to `shell.css`). This is a sweep, not a media-only patch — do it consistently everywhere so no page is left CDN-dependent. After: re-run `_test.md` `1.resilience` (block network + hard-reload → layout holds).
2. **Seg tap target (P2, shell-wide).** `.seg-item` renders 40px tall (<44px). Raise the min-height in `shell.css .seg-item` to ≥44px and re-verify planning + website + event-settings segs don't regress. Do NOT fork a media-only override.
3. **(P3, optional) Tab-set review.** Current tabs = Photos / Albums / Videos. Only change if founder asks (e.g. split Recent or Upload into its own tab).

## Full verification checklist (run after edits — mirrors `_test.md` + the new rows)
- Smoke: `media.html` (empty default) + `?seed=populated` load with 0 console errors at 1440/768/360.
- Tabs: click each + keyboard arrows; only the active panel visible; `aria-selected`/`is-active`/roving tabindex update.
- Alignment: at 1440/768/360 the section title + Storage card + seg track + dropzone share the same left edge; no horizontal scroll at any width; seg tap targets ≥44px (after fix 2).
- Resilience: block network/third-party + hard-reload → layout holds (after fix 1); no runtime CDN for layout-critical CSS/JS/fonts.
- States: empty (dropzone hero, empty Recent copy, presets-as-chips, 0% meter); populated (90 tiles lazy-load, Albums = 6 presets + Create).
- Flows: dropzone opens picker (hidden multi-file input; drop doesn't fire on touch → keep the click/keyboard path); upload-progress stub (uploading→processing→success + one fail-retry); lightbox prev/next index-driven + ←/→/Esc + swipe + focus trap; bulk-bar = {Add to album, Remove from album} only; album create/rename/delete (delete un-files, reassuring copy); passive storage CTA.
- a11y: visible focus rings; inputs labelled; single heading order; status not color-only; dark mode AA; reduced-motion suppresses reveal/lightbox/upload animation.
- Manual (flag for human): WhatsApp WebView = n/a (host-only); mid-tier Android + TalkBack on dropzone/lightbox/bulk-bar.

## When done
Update `_status.md`: `STAGE: TEST` (so Antigravity re-runs the full `_test.md` matrix against this final build), `UPDATED: <today> — Cursor (R-final: tabs + alignment + font vendoring + 44px)`, `NEXT: open Antigravity → _antigravity-prompt.md`.
