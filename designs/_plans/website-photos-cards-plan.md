# Plan — Website module: Card Templates + Photos tabs

**Date:** 2026-06-03 · **Scope:** the two remaining host-side Website tabs (currently `#cards`/`#photos` stubs). Plan-first per founder. Builds on `digital-presence-plan.md` (D-8, Q2, Q4, build-order steps 4 & 6). Two agents (UI/UX + frontend) produced the source specs; this is the synthesis.

## Outcome
Two new tab pages — `card-templates.html` and `photos.html` — each reusing `design.html`'s chrome (floating nav · tool-rail · `.bc-wrap` breadcrumb · `.section-head` · `.wb-tabs`). **No new shell primitives** — reuse `.dp-tile-grid`, `.modal-image-lightbox`, `.dp-filter-chips`, the `.dp-tile*` family, `.modal-scrim`/`.modal-card`, `window.evenzi.openModal/closeModal/showToast`. New code is page-CSS in `website.css` + two small page JS files.

## Cross-file wiring (5 edits)
- `overview.html`: tab `#photos`→`photos.html`, `#cards`→`card-templates.html`; **teaser CTA** `#cards`→`card-templates.html`; **"Upload first photos" gs-tile** `#photos`→`photos.html`.
- `design.html`: tab `#photos`→`photos.html`, `#cards`→`card-templates.html`.
- New pages set the active tab (`is-active` + `aria-current="page"`); `<body data-page="website">` (load-bearing — website.js guards on it + injects SHARED_MODALS) with `data-wb-page="cards"`/`"photos"`.

---

## A) `card-templates.html` — browse · preview · download designer cards
Host-only. Single-column content (no preview pane).

- **Intro** card: title + sub incl. the load-bearing line *"Cards keep their own design — they don't follow your website colours."* (Q2 palette-independence).
- **Style filter chips** — `.dp-filter-chips` as a **radiogroup** (`role="radiogroup"`/`radio`, roving tabindex; NOT tablist — no panels). Set: **All · Classic · Floral · Modern · Festive · Minimal · Royal** (fold Royal→Festive → 6 if the art library is thin). `data-style` per tile drives the filter. Result count `aria-live="polite"`.
- **Tile grid** — `.dp-tile-grid`, 3:4 (`.dp-tile-thumb-3-4`) card tiles: thumb + name + style tag + Preview/Download actions. Whole-thumb is a `<button data-ct-open>` (JS-populated lightbox; no stretched-link/z-index fight).
- **Placeholder art** (no real card files yet): generalize `.dp-thumb-fallback` (de-scope from `.dp-current-template-thumb`) + per-style background tints via `color-mix` so 18 tiles read as an intentional library, not broken images. Swaps to `<img loading=lazy width height>` when art lands.
- **Lightbox** — page-local single `.modal-image-lightbox` instance, repopulated per click (img/title/sub/download hrefs). Actions: **Download PDF** (primary) + **PNG** (secondary) via native `<a download>` → `CARD DOWNLOADED` toast on click. **"Use in WhatsApp invite"** kept but degrades to `INVITATIONS COMING SOON` toast (Digital Invitations is parked) — real target `../invitations/invitations.html?card=<id>`.
- **Data-driven:** `card-templates.js` renders chips + grid from a manifest (JS literal, with optional `fetch('…/manifest.json')`); ship `assets/card-templates/manifest.json` + dir scaffold + ~12–18 seeded tiles.
- **States:** populated (default) · no-results-in-style (reset-to-All message) · loading skeletons (port) · download error toast.

## B) `photos.html` — curate the public Gallery page's photos
Host-only. **Media & Memories dependency** (D-7): build as standalone gallery management *for the website*, with a persistent banner — *"These show on your website's Gallery page. They'll sync with Media & Memories when it launches."* Future-path UI present as a **disabled "Choose from Media albums — coming soon"** slot beside the live **"Add photos"**. ⚠️ Engineering flag: this is a bootstrap bucket destined to merge into M&M — not a permanent parallel store (→ `/council` before React build).

- **Header:** title + count + *"guests see these after they unlock your site."* + Add photos.
- **Cover note:** *"Your **Gallery cover** is separate from the site cover (set in Design)."* — naming discipline to avoid the two-covers collision (P1).
- **Tile grid** — `.dp-tile-grid`, 1:1 photo tiles: thumb is a `<button data-ph-open>` (lightbox); multi-**select** checkbox; **Set Gallery cover** (single-select, `aria-pressed`); **Remove**. Cover badge on the cover tile.
- **Bulk bar** when ≥1 selected (count + Remove + Clear); iOS safe-area inset.
- **Lightbox** — same instance pattern; actions = Set Gallery cover / Remove (no download).
- **Empty state (primary, host arrives here):** `photo_library` icon + "Add photos to your Gallery page" + help + Add CTA. Toggled via `[data-photos-state="empty"]` (same mechanism as Overview's `[data-pages-state]`).
- **Destructive UX:** single remove → undo-toast (5s); bulk remove → `.modal-confirm-cautionary`. Never silent hard delete.
- `photos.js`: seed array → render → select/cover/remove/add-stub → count + empty toggle → lightbox.

---

## New page-CSS (website.css only)
Un-scope `.dp-thumb-fallback` (+ per-style tints); `.dp-tile-trigger` (button-resets to fill tile); `.dp-card-style-tag`; `.dp-tile-badge` (cover); `.dp-photo-select`/`-check`; `.dp-bulk-bar`; `.dp-photos-empty*` + `[data-photos-state]`; `.dp-tile-grid-empty`. No shell changes.

## Files
New: `card-templates.html`, `card-templates.js`, `photos.html`, `photos.js`, `assets/card-templates/manifest.json` (+ dir). Edit: `overview.html`, `design.html`, `website.css`.

## Open decisions (founder)
1. **Royal chip** — keep 7 styles or fold Royal→Festive (6)? *Default: include; fold later if art is thin.*
2. **"Use in WhatsApp invite"** in the card lightbox — keep + degrade to toast (recommended) or hide until Invitations ships?
3. **Photos bucket lifecycle** — confirm it's a bootstrap that migrates into Media & Memories (not a permanent second store). *Prototype proceeds either way; this is a React-port/data note.*

## Build order
manifest/seed → website.css additions → card-templates.html + .js → photos.html + .js → cross-file href edits → verify (filter, lightbox open/Esc/scrim, download toast, empty/cover/remove, mobile). Card Templates first (proves the lightbox + chips), Photos second.

---

## Built (2026-06-03)

Both pages shipped, all decisions resolved.

**`card-templates.html` + `.js`** — Style filter radiogroup (All + 6: Classic/Floral/Modern/Festive/Minimal/Royal — kept 7 chips, decision #1 = include). 18 data-driven tiles from a `CARDS` array; card art rendered as per-style tinted SVG placeholders (`svg(card)`, TINT/BG maps) since real PDF/PNG assets aren't wired yet. Page-local lightbox (`#ct-lightbox`, `.modal-image-lightbox`) with PDF/PNG download + "Use in invite" — download/WhatsApp degrade to toast stubs (decision #2 = keep + degrade). DOM-constructed (no innerHTML — security hook). Filter→count→empty-state wired; roving arrow-key nav on chips.

**`photos.html` + `.js`** — Standalone Gallery-photos manager with the Media & Memories dependency banner (decision #3 = bootstrap bucket, flagged for `/council` before React port). Header + count + "Add photos" + disabled "From Media albums [Soon]" slot. Gallery-cover note (separate from site cover). 12 gradient-SVG photo tiles; select / set-cover (single) / remove + bulk-remove (cautionary confirm) + add-stub + lightbox. Empty-state via `[data-photos-state]`. DOM-constructed.

**CSS (website.css):** un-scoped `.dp-thumb-fallback` + per-style tints; `.dp-tile-trigger`, `.dp-card-style-tag`, `.dp-result-count`, `.dp-grid-empty*`, `.dp-tip-banner`, photo primitives (`.dp-photo-select/-check/-cover-badge/-actions`), `.dp-photos-empty*`, `.dp-bulk-bar`, `.dp-card-head-aux`. No shell changes.

**Cross-file:** removed the redundant **Edit Pages** tab from the Website module (overview/design/edit-page); `edit-pages.html` → redirect to overview. Tab strip on all Website pages now: Overview · Design · Photos · Card Templates.

**Spacing fix:** new pages use `.page-band` (width only, no vertical margin), which left content jammed flush against the wb-tabs strip. Added `#wb-main.page-band{margin-top:1.25rem}` to restore the canonical `.dp-shell` 20px top rhythm. Verified at 1900/1440/390 in light mode, 0 console errors.

**Deferred:** real card assets (`assets/card-templates/<style>/*.pdf|png` + `manifest.json`) — tiles use SVG placeholders until art exists. Photos bucket → Media & Memories migration is a React-port concern, `/council` flagged. "Use in invite" stays a toast until Invitations ships.
