# Cursor build runbook — Invitations · Card Designer (`invitations`)

You are building the Evenzi **Invitations** page — a host-side **invitation card designer** — as a static HTML/CSS/JS prototype in `designs/pages/invitations/`. You start with no prior context; everything is in this folder + the cited siblings.

## Read first
1. `_spec.md` (this folder) — build source of truth. Build exactly what it specifies. **Read the scope note** — this page is a card DESIGNER, not the WhatsApp send hub the overview describes (send/track stays in Guest Management).
2. `designs/components.html` — component catalog. Reuse before creating.
3. Siblings to copy from:
   - `designs/pages/website/design.html` + `design.js` — the **palette/font/live-preview** machinery (`[data-palette]`/`[data-font]` → `--dpp-*`, applyPalette/applyFont/reset/radio-key, `.dp-jump-preview`). LIFT these handlers locally (see Hard constraints).
   - `designs/pages/website/card-templates.html` + `card-templates.js` — the **gallery + style filter + lazy SVG tiles + lightbox** pattern.
   - A standard event-tool page (e.g. `designs/pages/media/media.html`) for the canonical `<head>` + chrome.

## Step 0 — clone head + chrome
Copy the `<head>` (local fonts via shell.css `@font-face` — NO Google Fonts CDN link) + chrome (scroll-progress, floating-nav, tool-rail with Invitations active, `.bc-wrap` breadcrumb DASHBOARD › ANYA & KABIR › INVITATIONS) into `designs/pages/invitations/invitations.html`. Set `<body data-page="invitations" data-view="gallery">`.

## Hard constraints
- **Tokens only; NO inline CSS/JS.** Generic → `designs/shared/shell.*`; page-specific → `designs/pages/invitations/invitations.{css,js}`. **No inline `style=` on the card** — it breaks both the no-inline rule and the `--dpp-*` token cascade.
- **Link order:** `../../shared/shell.css` → `invitations.css`; `../../shared/shell.js` → `invitations.js`. Guard `invitations.js` on `data-page="invitations"`; use `window.evenzi.showToast/openModal/closeModal`; build nodes with `createElement` (NO innerHTML for merge text).
- **Reuse the token contract verbatim** — the card consumes the existing `[data-palette]`/`[data-font]` → `--dpp-*` tokens. Do NOT invent parallel token names.
- **Lift, don't fork (arbiter A):** adapt `design.js` applyPalette/applyFont/reset/radio-key into `invitations.js`. Add at the top: `// PROMOTE-TO-SHARED: extract CardState + palette/font handlers to designs/shared/ on the 2nd real consumer`. If lifting forces a *behavior* change (not just DOM targets), flag it.
- **One page, two views:** toggle `body[data-view="gallery|editor"]`; ONE `CardState = { templateId, coupleNames, date, venue, time, message, palette, font, photo }` drives the live preview AND the (faked) export node — same node, no divergence.
- Hover-guard `:hover`; `@supports` glass fallback; stretched-link cards; mobile-first ≥44px; `.bc-wrap`/`.page-band`; `class="reveal"` on top-level blocks; dark mode + reduced-motion.

## Build steps
1. Step 0 → `invitations.html`.
2. **Gallery view:** `.dp-filter-chips` (radiogroup, 2–3 styles) + `.dp-tile` grid with lazy SVG-data-URI thumbs rendering each card design; "Use this card" → editor; tap → `.modal-image-lightbox`. Empty state.
3. **`.dp-card` render (NEW, page-specific → catalog it):** reflowable **HTML/CSS** card (NOT baked SVG) with merge slots `.dp-card-couple/-date/-venue/-time/-message`. Resolve color ONLY from `[data-palette]` `--dpp-*` + `--dpp-heading-font` — **never** global `--card`/`--ink`/`--bg`, so it stays **light under `.dark`**. Couple names: balanced 2-line wrap + `clamp()` shrink; venue/message `line-clamp`+ellipsis. Card font stack includes **Noto Devanagari** fallback. Backgrounds: **solid / linear-gradient only** (html2canvas drops radial/filter/shadow/clip-path).
4. **`.inv-card-frame` (NEW):** A5 portrait (~1:1.41), soft mat + dropshadow, dark-mode-immune, NO phone chrome. Reuse the `.is-controls-driven` cross-fade for palette/font swaps. (Do NOT reuse the phone-shaped `.dp-preview-frame`.)
5. **Editor view:** two-pane ≥1024 / stacked card-first below; reuse `.dp-jump-preview`; sticky output bar. Controls: name/venue/time `.form-input`, date `.cal-*` picker, message `.form-textarea`, palette `.dp-palette-tile` (radiogroup), font `.dp-font-row` (radiogroup), optional photo `.dp-dropzone` → real `.dp-card-photo` (object-fit:cover, position; monogram fallback), "Change template" link.
6. **Fields editable-with-defaults:** seed names/date/venue/time from stubbed Event-CRUD defaults, editable. Add `// V2: read-only-bind to Event CRUD once canonical`.
7. **Photo guard:** accept JPG/PNG only — validate `file.type` in JS (iOS HEIC won't rasterize); reject with inline "Please use a JPG or PNG photo". Feed via `URL.createObjectURL` (same-origin). Card renders fine with the slot empty.
8. **Output (faked, honest):** "Download card" → "Preparing your card…" busy state → success toast (no real file). "Share link on WhatsApp" → share-confirm modal (card thumb + EXACT accompanying text + "attaches via download" note) → faked `wa.me?text=<details + card-link placeholder>`. **Never imply an auto-attach.** Leave a `data-tier` hook on premium-candidate affordances (all free in v1; PRO stubbed).
9. Modals: full-preview lightbox, share-confirm, discard-template-change (`.modal-confirm-cautionary`, fires only when fields edited).
10. **States:** editor empty/first-run skeleton (no unstyled flash); palette/font selected+focus+disabled; export processing; photo drag-active/rejected.
11. a11y: palette/font = `role=radiogroup`/`aria-checked`; card preview `aria-hidden` + visually-hidden text summary updated on edit; reduced-motion suppresses animation.
12. Self-check: no inline styles, tokens-only, card light under dark mode, no fake attach, `data-page` set.

## When done
Update `_status.md`: `STAGE: TEST`, `UPDATED: <today> — Cursor`, `NEXT: open Antigravity → _antigravity-prompt.md`.
