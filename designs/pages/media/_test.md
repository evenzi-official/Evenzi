# Test plan — Media & Memories (`media`)  ·  against SPEC_VERSION 2026-06-12.1

> Test source of truth. Antigravity tests **only** from this file. Run every row; record PASS/FAIL in _findings.md by row ID.

## Acceptance criteria
- Host can drag-drop OR click-to-browse multiple photos (JPG/PNG/HEIC); upload progress is shown (faked); pre-flight rejects wrong type / over-size / over-count with a plain-language message.
- Recent Uploads strip shows latest additions, scroll-snaps, never traps vertical scroll, is keyboard-reachable, and has an empty state.
- Albums: 6 presets exist; host can create a custom album; **empty presets render as inert chips, not album cards**; an album card appears only once it has ≥1 photo.
- All Photos grid renders tiles with select + tap-to-open lightbox; NO always-on per-tile action overlay.
- Bulk mode: selecting ≥1 photo reveals a bulk-bar with exactly **{Add to album, Remove from album}** — and **no bulk hard-delete anywhere**.
- Lightbox opens any photo with prev/next (disabled at ends), ←/→/Esc, swipe; per-photo Set cover / Add to album / Remove (single hard-delete, confirm).
- Album delete un-files photos (they remain in All Photos) and shows reassuring copy — never "can't be undone".
- Storage meter renders 3 states (healthy/near/at-cap) with icon+text (not color alone); Upgrade CTA defaults to PASSIVE ("More storage coming soon" + Notify me).
- Videos section renders as a disabled "coming soon" teaser.
- `?seed=empty` (default) shows the dropzone-hero first-run state; `?seed=populated` shows 90 photos + load-more stub.

## Test matrix

### 1. Smoke (run FIRST — gates everything below)
- `1.smoke` — Page loads with no console errors/warnings on load.
- `1.styled` — Computed background is the themed surface, NOT the unstyled default (proves tokens/Tailwind config loaded).
- `1.databody` — `<body>` carries `data-page="media"`; the tool-rail Media item is highlighted.
- `1.chrome` — Floating-nav, tool-rail, and breadcrumb (DASHBOARD › ANYA & KABIR › MEDIA) render and match sibling pages.
- `1.resilience` — No runtime third-party CDN for layout-critical CSS/JS. **Actively simulate failure:** after first load, block the network / third-party requests and hard-reload — layout MUST hold (no collapse to unstyled flow). A loaded CDN is HTTP 200 + console-clean, so `1.smoke`/`1.styled` will NOT catch this — trigger the failure yourself. Layout-critical assets must be local/committed.

### 2. Component states
- `2.dropzone` — Dropzone shows default / drag-active (drag a file over) / drop-rejected (wrong type or over-size → plain-language error) / focus states.
- `2.uploadprogress` — On upload (faked), progress rows cycle uploading → processing → success; a forced-fail row shows a retry affordance (never silent).
- `2.tile` — Photo tile: default / selected (checkbox + ring) / focus. Confirm NO always-on action overlay on the master grid.
- `2.selectmode` — Touch select-mode has a clear entry affordance and Clear/Esc exit.
- `2.bulkbar` — Bulk-bar appears at ≥1 selected, shows `N selected`, and exposes ONLY {Add to album, Remove from album}.
- `2.album` — Album card: default / hover (guarded) / focus; overflow → rename / delete.
- `2.meter` — Storage meter renders healthy / near-cap / at-cap (toggle via fixture); passive CTA visible.
- `2.lightboxnav` — Lightbox prev/next render, are ≥44px, and disable at first/last photo.
- `2.console` — No new console errors/warnings after each interaction.

### 3. Interaction & keyboard
- `3.controls` — Every button/link/toggle/tab/modal trigger fires (dropzone, create-album, assign picker, lightbox, both confirms).
- `3.keyboard` — Logical tab order; Enter/Space activate focused control; Esc closes overlays; lightbox ←/→ navigate; dropzone is keyboard-operable.
- `3.deadlinks` — No dead links (every href → existing page or explicit `#` with comment).
- `3.lightboxtrap` — Lightbox is a focus-trapped dialog; focus returns to the trigger tile on close.
- `3.bulkverbs` — Confirm the bulk-bar carries NO "Delete selected" / bulk hard-delete (negative requirement).
- `3.albumdelete` — Deleting an album un-files its photos (they remain in All Photos) and the confirm copy reassures, never "can't be undone".

### 4. Responsiveness (widths × content)
- `4.<width>` for each of 360 / 390 / 414 / 768 / 1024 / 1440 — no horizontal scroll, no clipped content, touch targets ≥44px on mobile widths.
- `4.gridcols` — Photo grid: 2-col @360, 3-col @768, 4–5-col @1024+.
- `4.recentscroll` — Recent strip horizontal-scrolls with snap and an overflow affordance; does NOT trap vertical page scroll on touch widths.
- `4.bulkbar` — Bulk-bar is a floating bottom bar on mobile (clear of safe-area), inline on desktop.

### 5. Accessibility (fixed floor)
- `5.focusring` — Visible focus indicator on every keyboard-focusable control.
- `5.alt` — All content images have alt text; decorative SVG placeholders use `alt=""`.
- `5.labels` — Every input (file input, album-name field, notify field) has a programmatic label.
- `5.headings` — Single logical heading order.
- `5.coloronly` — Status never conveyed by color alone (storage states, selected, upload status all carry icon/text).
- `5.reducedmotion` — With `prefers-reduced-motion: reduce`, reveal/upload/lightbox transitions are suppressed/instant.
- `5.darkcontrast` — Dark mode: text/icon contrast meets WCAG AA (4.5:1 body, 3:1 large); AA tier honored.
- `5.glassfallback` — With `backdrop-filter` unsupported (simulate), photo-tile chips/select/actions stay legible via the `@supports not` solid fallback (test against a bright photo).

### 6. Edge / sad paths (fixed)
- `6.empty` — `?seed=empty` (default): dropzone is the hero, presets are inert chips (NOT empty album cards), meter 0%, Recent + All Photos show empty copy (not broken voids).
- `6.loading` — Upload/processing skeleton state renders.
- `6.error` — Drop-rejected + upload-failed states render with recovery affordance.
- `6.longcontent` — 90+ char album name, Devanagari (~1.4× width), multi-line button label — all hold without overflow/clipping.
- `6.counts` — Single photo vs 90 photos (`?seed=populated`) both render; load-more stub fires via IntersectionObserver.
- `6.preflight` — Dropping a huge file count / over-size file is rejected by client pre-flight before the upload stub (doesn't flood the grid).

### 7. Guest-surface & device (conditional + manual)
- `7.whatsapp` — n/a (host-only page, no guest/OG surface). Record `SKIP (n/a — host-only)`.
- `7.device` — Mobile real-device pass on a mid-tier Android with CPU throttle; TalkBack sanity on dropzone + lightbox + bulk-bar. (manual — agent: skip and flag for human)

## Definition of done
Every non-manual row PASS (deferrals documented in _findings.md), no console errors, manual rows flagged for human.
