# Spec — Media & Memories (`media`)  ·  SPEC_VERSION 2026-06-12.1

> Build source of truth. Cursor builds **only** from this file. Filled by `/spec-kit` from the
> feature overview + design system + council review. Overwritten on re-run (SPEC_VERSION bumps).

## Goal & user
- **Primary user:** Host (event owner) — **host-only**. Founder-confirmed. The guest-facing public gallery is OUT OF SCOPE — it lives in the Website / Digital-Presence module, built separately.
- **User goal of this page:** One place for the host to upload event photos, organize them into albums, and manage the whole gallery.
- **Overview source:** docs/features/overviews/media-memories-overview.md
- **a11y tier:** AA (host surface). Note: hosts use the same aging Android fleet as guests, so glass fallbacks + WhatsApp-WebView legibility still apply.
- **Share / Open Graph:** n/a (host-only dashboard, behind auth — no link-preview requirement).

## Page composition (top → bottom)
> **Layout (post-build founder change, 2026-06-12):** the content is organized into an **in-page `.seg` tab structure** — the same segmented sub-nav the **Event Website** page uses (Overview/Design/Photos/Card-Templates) — NOT a long line-by-line stack. Tabs: **Photos** (Upload dropzone + Recent uploads + All photos grid) · **Albums** (albums grid) · **Videos** (post-MVP "Soon" teaser). **section-head + Storage meter stay persistent above the tabs.** Reuses `.seg` / `.seg-wrap--page` / `.seg-item` from shell.css with `role="tablist"`/`role="tab"`/`role="tabpanel"` and roving tabindex — the in-page switching idiom proven on `planning.html`. Tab handler lives in `media.js` (click + Arrow/Home/End). (Earlier accordion attempt reverted — this supersedes it.)

1. **Section head** (`.section-head`) — eyebrow "Section" · h1 "Media & Memories" · sub "Upload, organize, and relive every moment from your celebration."
2. **Storage meter strip** — usage meter (`X GB of Y used`) with 3 states (healthy / near-cap / at-cap) signalled by icon + text + color (never color alone). **Upgrade CTA defaults to PASSIVE** (`UPGRADE_CTA_MODE = 'passive'`): renders "More storage coming soon" + an optional "Notify me" intent-capture chip. `'active'` mode (locked behind the flag) renders the "Upgrade for more storage" button. **Presentational only** — see Data model.
3. **Upload dropzone** (`.dp-dropzone--multi`, modifier-extend) — drag-and-drop OR click/keyboard → hidden `<input type="file" multiple accept="image/jpeg,image/png,image/heic">`. Multi-file. Drag-active + drop-rejected states. Background-upload progress list below it (faked stub). This is the **first-run hero** when the gallery is empty.
4. **Recent Uploads** — horizontal scroll strip of the latest additions (page-specific). Scroll-snap + overflow fade affordance + keyboard reachable. Empty state: "Your latest uploads will appear here." Always-on per-tile actions are acceptable HERE (low volume) — unlike the main grid.
5. **Albums** — grid of album cards (cover thumb + name + photo count) + a "Create album" card. **Empty presets render as inert filter chips, not empty album cards** (arbiter A). An album *card* appears only once that album has ≥1 photo.
6. **All Photos** — the master grid (`.dp-tile-grid` + promoted `.photo-tile`). Per-tile: select checkbox + tap-to-open lightbox. **No always-on per-tile action overlay** (drop blur; demote actions). Selection enters bulk mode → bulk-bar. Lightbox has prev/next.
7. **Videos** — disabled "coming soon" teaser card (`.empty-cta-card` variant). Video upload is post-MVP.
8. **Footer** + help FAB + toast (copy sibling).
9. **Modals:** create-album · assign-to-album picker (net-new on `.modal-picker-grid`) · photo lightbox (with `.modal-lightbox-nav` prev/next) · remove-photo confirm (cautionary, single-photo) · delete-album confirm (reassuring copy).

## Element reuse map
> Every UI element → one of three rungs. Cursor consumes this literally.

| Element | Rung | Primitive or new-file | Notes |
|---|---|---|---|
| Page chrome (floating-nav, tool-rail, breadcrumb, scroll-progress) | reuse-as-is | copy verbatim from `designs/pages/website/photos.html` | Set `data-page="media"` (tool-rail Media highlights). Breadcrumb: DASHBOARD › ANYA & KABIR › MEDIA. |
| Page band / wrapper | reuse-as-is | `.page-band`, `.bc-wrap` | Canonical width; never hand-roll. |
| Section head | reuse-as-is | `.section-head` family | |
| Photo grid container | reuse-as-is | `.dp-tile-grid` (shell.css) | |
| Photo tile + select + cover-badge + bulk-bar | **promote** | `.dp-photo-*` / `.dp-bulk-*` (currently page-local in `website.css`) → **rename to neutral `.photo-tile` / `.bulk-bar`** in shell.css | Media is 2nd consumer. See "Promote sequencing" below — **3 ordered commits**, not one. Add `@supports` glass fallback during promote. |
| Upload zone | **modifier-extend** | `.dp-dropzone` → `.dp-dropzone--multi` | Existing `.dp-dropzone` is modal-scoped (single-image crop, A2). Multi-file variant drops the crop coupling. All JS is net-new (drag/drop, multi-file, progress). |
| Lightbox | **modifier-extend** | `.modal-image-lightbox` (DLG8) + **new `.modal-lightbox-nav`** (prev/next) → promote nav to shell | JS is data/index-driven (see States). |
| Assign-to-album picker | **new (reuse primitive)** | net-new media.js behavior on **`.modal-picker-grid`** (shell) | Do NOT promote `guests.js openPicker` (drags `gm-` coupling). |
| Remove-photo confirm | reuse-as-is | `.modal-confirm-cautionary` | Single-photo hard-delete only. |
| Delete-album confirm | reuse-as-is (new copy) | `.modal-confirm-cautionary` | Reassuring copy — see Copy. NOT the default "can't be undone". |
| Videos teaser | reuse-as-is | `.empty-cta-card` | Disabled "coming soon". |
| Album card, Recent strip, upload-progress list, storage meter | **new, page-specific** | `media.css` / `media.js` | `.album-card` flagged for later shell promotion (2nd consumer → promote). |

> Reuse discipline: `designs/components.html` + `designs/shared/shell.css` are the catalog — check first.
> Dark mode (`.dark`) and semantic status tokens (`--success/--warning/--danger/--info`) are mandatory.

## New primitives needed
> generic → designs/shared/shell.*; page-specific → designs/pages/media/media.*

- `.modal-lightbox-nav` (**shell**, promoted) — prev/next buttons inside `.modal-image-lightbox`. ≥44px hit targets, disabled at first/last, icon+aria-label. Add to `components.html`.
- `.photo-tile` / `.bulk-bar` family (**shell**, renamed-on-promote from `website.css`'s `.dp-photo-*`/`.dp-bulk-*`) — with `@supports not (backdrop-filter)` solid fallback. Add to `components.html`.
- `.dp-dropzone--multi` (**shell** modifier) — multi-file, no crop coupling, drag-active/drop-rejected states.
- `.album-card` family (**media.css**, page-specific; flag for promotion) — cover + name + count, stretched-link.
- `.media-recent-strip` (**media.css**) — horizontal scroll-snap strip + overflow fade.
- `.media-upload-progress` (**media.css**) — per-file upload lifecycle rows.
- `.media-storage-meter` (**media.css**) — 3-state usage bar + passive/active CTA.

## Interaction states (per interactive element)
- **Dropzone:** default / drag-active (highlight) / drop-rejected (wrong type or over-limit, plain-language error) / focus / disabled-while-uploading. Click + Enter/Space open the file picker. Hidden `<input type=file multiple>` is the real trigger (drop doesn't fire on touch).
- **Upload progress row (faked):** uploading (spinner/skeleton) → processing (HEIC transcode stub) → success (settle) / failed (retry affordance). Never silent.
- **Photo tile:** default / selected (checkbox + ring) / focus. Tap opens lightbox. NO always-on action overlay on the master grid.
- **Selection mode (touch):** explicit "Select" toggle to enter; clear affordance you're in it; "Clear"/Esc to exit. Gate to the bulk-bar.
- **Bulk-bar:** appears when ≥1 selected. Actions = **{Add to album, Remove from album}** ONLY. No bulk hard-delete. Count read-out (`N selected`).
- **Lightbox:** open / prev / next (disabled at ends) / close. Data/index-driven (NOT DOM-query) so it survives lazy-load. Keyboard ←/→/Esc. Swipe on touch. Preload index±1 via `new Image()` only (no extra DOM nodes). Per-photo actions live here: Set cover · Add to album · **Remove (hard-delete, single, confirm)**.
- **Album card:** default / hover (guarded) / focus. Stretched-link opens album filter. Overflow action → rename / delete-album.
- **Storage meter:** healthy / near-cap (warning icon+text) / at-cap (danger icon+text). Passive CTA default.
- **Videos teaser:** disabled, non-interactive, "coming soon".

## Data & content model
- **Single-entity model (locked, TL1/FE6):** Media owns the canonical `photos` and `albums`. A photo object carries `{ id, src, name, albumIds[], uploadedAt, published }`. `website/photos` is a **published subset** view over this store — NOT a second upload pool, NOT duplicate rows. The prototype's data shape must mirror what `website/photos` consumes. **State model = array-as-source-of-truth** (render from data; do NOT use photos.js's DOM-requery model — it can't carry the `published` flag across re-renders).
- **First-run fixture (arbiter A):** ONE `media.fixtures.js` exposing two states behind `?seed=`:
  - `empty` (**default**): 0 photos · dropzone is the hero · presets shown as inert filter chips (not album cards) · meter at 0%.
  - `populated`: **90 photos** across the 6 preset albums · IntersectionObserver "load more" stub to demonstrate the 5k–20k lazy-load claim.
  - Album *cards* render only once an album has ≥1 photo; empty presets stay chips. Document this contract at the top of the fixtures file.
- **Storage meter:** presentational only. Documented data contract `{ usedBytes, limitBytes, tier }` — sourced LATER from a `subscription`/`event_storage` lookup, **NOT** Supabase Storage bucket stats. No backing table exists yet (flag for data-model phase).
- **HEIC + background upload:** explicitly **faked** in the prototype. Porting note: HEIC can't render in `<img>` on most browsers — needs a transcode step (client lib or Storage-side) before grid/lightbox can show it.
- **Content-length resilience:** 5k–20k photos → bounded seed (90) + load-more stub in the prototype; true virtualization is a React-build concern. Long album names (truncate + title). Devanagari ~1.4× width — type system ready.
- **Client pre-flight:** before the upload stub, guard accept-list + max count + per-file size (reuse the avatar handler's 5 MB-cap + toast pattern as the template) so a multi-thousand-file drop can't flood the seed/load-more path.

## Responsive behavior
- Mobile-first; design at 360px, scale up. Widths: 360 / 390 / 414 / 768 / 1024 / 1440.
- Photo grid: 2-col @360 → 3-col @768 → 4–5-col @1024+. Touch targets ≥44px. Recent strip horizontal-scrolls with snap; never traps vertical scroll.
- Bulk-bar: floating bottom bar on mobile, inline on desktop. Safe-area insets on fixed chrome.

## Accessibility
- Floor (always): visible focus ring on keyboard nav; alt text on content images (`alt=""` on decorative SVG placeholders); every input has a programmatic label (not placeholder-only); single logical heading order; color is never the sole status signal (meter + upload + selected all carry icon/text); touch targets ≥44px.
- Page-specific: lightbox is a focus-trapped dialog; ←/→/Esc + swipe; prev/next have aria-labels and disabled state at ends. Selection mode is announced. Dropzone is keyboard-operable. Storage states use icon+text not color alone.

## Copy (Indian conventions: ₹ + lakh/crore, DD/MM/YYYY, 12-hour time)
- H1: "Media & Memories" · sub: "Upload, organize, and relive every moment from your celebration."
- Dropzone: "Drag photos here, or tap to browse" · hint "JPG, PNG, HEIC · up to 10 MB each".
- Empty hero: "Add your first photos" · "Upload your favourite moments — organize them into albums and relive the day."
- Recent empty: "Your latest uploads will appear here."
- Albums: presets Ceremony · Reception · Mehendi · Sangeet · Candids · Pre-Wedding · "Create album".
- Storage passive: "More storage coming soon" + "Notify me". (Active variant, flag-gated: "Upgrade for more storage".)
- Storage near-cap: "You're close to your storage limit." at-cap: "Storage full — remove photos or upgrade soon."
- Videos teaser: "Videos — coming soon" · "Upload and share videos from your celebration. On the roadmap."
- **Delete-album confirm (reassuring, NOT 'can't be undone'):** "Remove this album? Your photos stay safe in All Photos — only the album is removed."
- **Remove-photo confirm (single, true delete):** "Remove this photo? It'll be permanently removed from your gallery. This can't be undone."
- Toasts: "PHOTOS UPLOADED" · "ADDED TO ALBUM" · "REMOVED FROM ALBUM" · "ALBUM CREATED" · "ALBUM REMOVED" · "PHOTO REMOVED" · "GALLERY COVER UPDATED".
- **Forbidden (negative requirement):** no "Delete selected" / bulk hard-delete action anywhere.

## Council notes folded in
**Council reviewed:** 2026-06-12 by ui_ux_designer · frontend_engineer · tech_lead · product_manager (Critique + Debate + Arbiter). Verdict: 🟡 ADDRESS-THEN-PROCEED. All findings folded above.

- 🔴 Dropzone reuse mismatch → `.dp-dropzone--multi` + net-new JS (UX1/FE1). · Glass fallback gap on promoted photo-chips (UX2/FE). · Per-tile actions don't scale to 20k → drop blur, route via bulk/lightbox (UX3). · Master/subset single-entity model + array-as-source (TL1/FE6). · Album-picker net-new on `.modal-picker-grid`, not promoted openPicker (FE2).
- 🟡 Lightbox prev/next data/index-driven + swipe + ←/→/Esc + preload (UX4/FE5). · Album-delete reassuring copy (UX5/PM5). · First-run empty hero (PM3). · Explicit Add-to-album flow + host-selectable cover (PM2). · Storage meter presentational + data contract (TL3). · HEIC/bg-upload faked stubs + porting note (TL4).
- ⚖️ Arbiter: A) one `media.fixtures.js`, two `?seed=` states, presets-as-chips-when-empty. B) bulk-bar = {Add to album, Remove from album} only; hard-delete lightbox-only single-photo. C) promote = 3 ordered commits (rename+catalog → dedup website.css + verify photos.html → net-new picker).
- 🔵 Blind spots: drag-active/drop-rejected states; per-tile upload lifecycle; touch select-mode entry/exit; client pre-flight file guard; "publish to website" as a future first-class assignment (post-Digital-Presence — note, don't build now); notify-intent capture on passive storage state.
- 🔶 Founder decision: Upgrade CTA → **PASSIVE default** (flag-gated `UPGRADE_CTA_MODE`).

### Promote sequencing (arbiter C — Cursor encodes as ordered, separately-committed steps)
1. **Rename + catalog:** `.dp-photo-*`/`.dp-bulk-*` → neutral `.photo-tile`/`.bulk-bar` in shell.css; add to `components.html`. Duplicate `website.css` copy stays as fallback. Verify `photos.html` renders.
2. **Dedup:** delete the `website.css` copy AND re-point + re-verify `photos.html` in the SAME commit (no orphan window). Generalize the `[data-photos-state]` hook off `.dp-photos-card` to a shared attribute both pages set.
3. **Net-new picker:** build the assign-to-album picker on `.modal-picker-grid` (do NOT promote `guests.js openPicker`). Harden for multi-select.
Each step ends with its own `photos.html` regression check (load + select + set-cover + remove + empty toggle).
