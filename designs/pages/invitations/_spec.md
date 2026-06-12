# Spec — Invitations · Card Personalizer (`invitations`)  ·  SPEC_VERSION 2026-06-12.2

> Design record for the AS-BUILT page (built inline by Claude; Cursor skipped). Antigravity tests
> from `_test.md`. **Supersedes SPEC_VERSION 2026-06-12.1** — that version spec'd a palette/font
> *designer*; a stress test (red-team + reference analysis of withjoy.com) reframed it to a
> **personalizer**. See "Stress-test reframe" below.

## ⚠️ Scope notes
- **Founder override of the overview:** the Invitations page is an invitation **card designer**, not the overview's WhatsApp send-hub. The **send + status tracking** (Not Invited → Invited → RSVP) **stays in Guest Management**; the two connect via a **hosted card URL**. (Overview patched.)
- **Stress-test reframe (2026-06-12):** the page is a **PERSONALIZER**, not a free designer. Designer-LOCKED templates; the host edits **text (+ photo) inline on the card**; NO palette/font panel (free font/colour choice is what produces ugly DIY cards — the opposite of "free-tier-feels-paid"). **"Upload your own card" is the first tile** (highest-value path for Indian hosts who already have a designer-made card). **Front-only.** Output = card image + WhatsApp caption carrying the RSVP/site link.

## Goal & user
- **Primary user:** Host. Host-only editor; guests receive the card image + link via WhatsApp (off-platform).
- **Goal:** Pick (or upload) a card, personalize the text, and share it with guests.
- **a11y tier:** AA. **Share/OG:** n/a (host editor; the card is shared off-platform).

## Page composition (`body[data-view="gallery|editor"]`, single page)
**Persistent chrome** (floating-nav, tool-rail Invitations active, `.bc-wrap` breadcrumb) + section-head.

**GALLERY (default):**
- `.dp-filter-chips` style radiogroup: All · Minimal · Royal · Floral · Modern · Photo.
- `.dp-tile-grid` grid. **First tile = "Upload your card"** (brand-tinted dashed; JPG/PNG → editor in upload mode). Then 7 template tiles, each a real mini-card render (locked palette/font/layout).

**EDITOR (after pick/upload):**
- Head: "Change template" (discard-guarded) + autosave indicator. Hint: "Tap any text on the card to edit it."
- `.inv-card-frame` (A5 portrait, soft shadow) → `.inv-card` (the render). **Light-surfaced, dark-mode-immune** — colours resolve only from per-template `--c-*` tokens (set via `[data-tpl]`), never global `--bg/--ink/--card`.
- **Inline editing:** text slots are `contenteditable="plaintext-only"` (eyebrow · couple · invite · date · time · venue · message). Photo templates add a tap-to-add `.inv-card-photo` slot.
- **Floating size toolbar** (`.inv-toolbar`): appears on slot focus; A− / Medium / A+ sets that slot's size (S/M/L) — the only "design" control. No palette/font.
- **Sticky action bar:** Preview · Download (faked PNG, "Preparing…" state) · Share on WhatsApp.

**Upload mode:** the host's image fills the card frame as-is (no text editing) → straight to Preview/Download/Share.

**Modals:** full-preview lightbox (`.modal-image-lightbox`, inert card clone) · WhatsApp-share confirm (card thumb + EXACT caption + "the card attaches from your downloads · the link opens your RSVP page" note) · change-template discard confirm (`.modal-confirm-cautionary`, fires only when edited).

## Templates (7, designer-locked)
Eternal (Minimal) · Saffron (Royal) · Eucalyptus (Floral) · Noir (Modern) · Rosewater (Floral) · Bloom (Photo) · Moments (Photo). Each = a locked `[data-tpl]` token set (`--c-bg/--c-ink/--c-accent/--c-soft/--c-heading`) + a layout (`classic` | `photo`). Card display fonts = Cormorant Garamond / Playfair Display.

## Element reuse map
- reuse-as-is: chrome + `.bc-wrap`/`.page-band`/`.section-head`, `.dp-filter-chips`, `.dp-tile-grid`, `.modal-image-lightbox`, `.modal-confirm-cautionary`, `.btn-pill`, `showToast`/`openModal`/`closeModal`, `.dark` token system.
- **NEW (page-specific, `invitations.{css,js}`):** `.inv-card` render + per-`[data-tpl]` token sets, `.inv-card-frame`, `.inv-slot` (contenteditable), `.inv-card-photo`, `.inv-toolbar`, `.inv-tile`/`.inv-upload-tile`, the gallery↔editor view switch + CardState. (`.inv-card` is a candidate for `components.html` once stable.)

## Data & content model
- Card field values live in `state.data` (single source). `state.sizes` = per-slot size. Cardinality: **N cards per event** in the eventual schema (Indian multi-function), **v1 ships ONE** (UI limit, not schema).
- Factual fields **editable, seeded with Event-CRUD defaults** (stubbed). `// V2: read-only-bind once CRUD canonical`.
- **Export faked** (toast stub). Real build: server Satori/Puppeteer (or html2canvas + `document.fonts.ready`) → Supabase Storage → hosted card URL. Self-host the card display fonts for export fidelity. `// EXPORT & STORAGE: backend-phase`.
- **WhatsApp = TEXT + link, never an image attach** (`wa.me` is text-only). Share confirm is honest: card downloads, host attaches; the caption carries the RSVP/site link.
- Content-length: long + Devanagari couple names + long venue/message wrap/clamp within the card (`overflow-wrap:anywhere`, `%`-padding card). Card display fonts include a serif fallback; Devanagari needs a Noto fallback in the real build.

## Accessibility
- Filter chips = `role="radiogroup"`/`aria-checked`. Editable slots = `role="textbox"` + `aria-label`. Photo slot keyboard-operable (Enter/Space). Toolbar = `role="toolbar"`. Card is the live artifact the host reads directly (slots carry text). Visible focus rings; ≥44px controls; reduced-motion suppresses transitions.

## Founder decisions folded
- **PRO seam:** all free in v1; leave a hook for a future gate (no lock). · **Send/track:** design-only here; send stays in Guest Management. · **v1 scope:** ~7 templates, **photo IN**, PNG-only (PDF→v2), upload-first, front-only.

## Council + stress-test trail
- **Council reviewed:** 2026-06-12 (ui_ux · frontend · tech_lead · product) — verdict ADDRESS-THEN-PROCEED. Key folded: reflowable HTML/CSS card (not SVG); light/dark-immune; WhatsApp text+link not attach; export faked + font-ready note; reuse token contract, render net-new.
- **Stress test (2026-06-12):** red-team + reference-analyst → REFRAME designer → personalizer + upload-first + front-only (this spec). Cut: palette tiles, font rows, side controls panel, PDF.
