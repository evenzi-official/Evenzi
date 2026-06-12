# Test plan — Invitations · Card Personalizer (`invitations`)  ·  against SPEC_VERSION 2026-06-12.2

> Test source of truth (AS-BUILT personalizer). Antigravity tests **only** from this file.
> Run every row; record PASS/FAIL in _findings.md by row ID. Page: http://localhost:4000/pages/invitations/invitations.html

## Acceptance criteria
- Gallery shows a style filter + an "Upload your card" first tile + 7 designer-locked template mini-cards.
- Tapping a template opens the editor seeded with event defaults; tapping text edits it inline on the card.
- The card stays **light** even in dark app mode.
- Floating size toolbar changes the focused slot's size (S/M/L); no palette/font controls exist.
- Upload-your-own: JPG/PNG image fills the card as-is; non-JPG/PNG rejected.
- Share = honest WhatsApp text + RSVP link (card downloads to attach); NO implied auto-attach.
- Long / Devanagari names + long venue/message wrap within the card without clipping.

## Test matrix

### 1. Smoke
- `1.smoke` — loads, 0 console errors/warnings.
- `1.styled` — themed surface (not unstyled).
- `1.databody` — `<body data-page="invitations" data-view="gallery">`; tool-rail Invitations highlighted.
- `1.chrome` — floating-nav / tool-rail / breadcrumb render + match siblings.
- `1.resilience` — block network/third-party + hard-reload: app layout holds (Poppins + icons are local). NB: the **card display fonts** (Cormorant/Playfair) load from the Google CDN by design — on block they fall back to serif (acceptable for the proto; flagged for vendoring). The page chrome must NOT collapse.

### 2. Gallery
- `2.uploadtile` — first tile = "Upload your card" (dashed, brand-tinted).
- `2.templates` — 7 template mini-cards render with their own palette/font (Eternal/Saffron/Eucalyptus/Noir/Rosewater/Bloom/Moments), each light-surfaced.
- `2.filter` — style chips (radiogroup, `aria-checked`) filter the grid (e.g. Photo → Bloom+Moments; Royal → Saffron). "Upload" tile shows on "All".
- `2.opentpl` — tapping a template → editor view seeded with that template.

### 3. Editor — inline edit
- `3.slots` — card has editable text slots (eyebrow/couple/invite/date/time/venue/message); typing updates the card live.
- `3.toolbar` — focusing a slot reveals the floating size toolbar; A+/A− changes THAT slot's size; label reflects Small/Medium/Large.
- `3.nopalette` — there is NO palette picker and NO free font picker anywhere (personalizer, not designer).
- `3.darkcard` — toggle app to dark mode: the **card stays light** (does not invert); chrome goes dark.
- `3.photo` — on a Photo template (Bloom/Moments) tap the photo area → file picker; a JPG/PNG fills the slot; non-image rejected with "Please use a JPG or PNG image."
- `3.changetemplate` — "Change template" with edits → discard-cautionary confirm; pristine → no confirm (returns to gallery).
- `3.console` — no new console errors after interactions.

### 4. Output (faked, honest)
- `4.preview` — "Preview" opens a lightbox with an **inert** card clone (no contenteditable).
- `4.download` — "Download" shows a "Preparing…" busy state → success toast (faked; no real file required).
- `4.share` — "Share on WhatsApp" opens a confirm with the card thumb + the EXACT caption (couple + date + RSVP link) + a visible "card attaches from downloads / link opens RSVP" note. **No implied auto-attach of the image.**
- `4.honesty` — copy never claims the card auto-attaches to WhatsApp.

### 5. Upload-your-own path
- `5.upload` — "Upload your card" tile → JPG/PNG → editor in upload mode: the image fills the card frame as-is; no text slots.
- `5.uploadreject` — a non-JPG/PNG (or `.heic`) is rejected with the inline message; no broken card.
- `5.uploadshare` — from an uploaded card, Download + Share work (caption uses a family fallback name).

### 6. Responsiveness + a11y
- `6.<width>` for 360/390/414/768/1024/1440 — no horizontal scroll, no clipping, touch ≥44px.
- `6.mobilebars` — on 360/390 the size toolbar + sticky action bar are reachable and don't obscure the card permanently.
- `6.focusring` / `6.labels` / `6.headings` / `6.coloronly` — floor checks.
- `6.radiogroup` — filter chips are radiogroup/`aria-checked`; editable slots are `role="textbox"`+label; keyboard-operable.
- `6.reducedmotion` — transitions suppressed under `prefers-reduced-motion`.
- `6.darkcontrast` — dark chrome + light card both meet WCAG AA.

### 7. Edge / content-length / device
- `7.longnames` — set a 60+ char couple name + a Devanagari name on the card: wraps/clamps inside the card, no border clip.
- `7.longvenue` — long venue + multi-line message stay within the card.
- `7.empty` — a slot cleared to empty shows its placeholder (`data-ph`), not a collapsed card.
- `7.device` — mid-tier Android + TalkBack on the editor. (manual — agent: skip + flag.)

## Definition of done
Every non-manual row PASS (deferrals documented), no console errors, manual flagged. Export/share are faked but behave honestly (text + link, never an auto-attach).
