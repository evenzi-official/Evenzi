# Website · Edit Pages — Per-page Section Editor — Plan

**Page:** `designs/pages/website/edit-page.html` (+ `edit-page.css`, `edit-page.js`) — new route.
**User goal:** Let a host edit one website page by adding / arranging / editing **sections**, seeing the result in a live mobile preview, on desktop (split) and mobile (Edit | Preview toggle).
**Module:** Website / Digital Presence. Design-path prototype (no ClickUp, no superpowers).
**Owner:** Abhijith. **Date:** 2026-06-02.
**Build-order position:** Digital Presence build-order **step 5** (the most composite screen; composes everything below it). Foundation plan: `designs/_plans/digital-presence-plan.md`.

> **Status: PLAN ONLY — no build until Abhijith signs off (per standing directive).**

---

## 0. Locked decisions this editor must honor (from digital-presence-plan.md)

- **CC-8 / Q (mobile model):** Desktop **≥1024px = 55/45 split** (section list left, sticky preview right). Mobile **<1024px = Edit | Preview tab-toggle** under the page title; state persists across toggle. Field-blur autosave fires regardless.
- **Autosave (CC-2):** per field-blur, **600ms debounce**; save signal = the breadcrumb **`SYNCED HH:MM:SS` chip** (no autosave toasts). Page-level actions still toast (SECTION ADDED / SECTION REMOVED / etc.).
- **Q7 — section primitives:** Heading+paragraph (two-column toggle), Photo (single), Photo grid (2–4), Schedule item, Person card, Hotel/venue card, Q&A item, Divider, **Map embed**, **Countdown block**, **Video embed**. *(Source labels this "final 12" but enumerates 11 — see D1.)*
- **Add-section picker = `.modal-picker-grid`** (the shell primitive we just completed for Add-page). Sections are **repeatable** (unlike pages). Reserve a grayed **"Gift Registry — Coming soon"** slot (D-5 parked).
- **`.dp-preview-frame.is-page-scoped`** already exists (max-width 280 mobile / 520 desktop) — the editor's live preview reuses it.
- **`.dp-section-block` does NOT exist** — new shell primitive (build-order step 0 candidate): card with drag handle + section-type label + inline content editor + visibility/delete actions.
- **Top-section pattern** (floating nav, breadcrumb w/ SYNCED chip, section-head, wb-tabs) is canonical — reuse verbatim, like every other Website page.
- **Delete page confirm** exists conceptually; **per-section remove** is a lighter in-editor action (D6).

---

## 1. Entry / route

Currently unwired stubs:
- Overview Pages row **"Edit" chevron** (`data-dp-row-edit`) → toasts "OPENING … EDITOR".
- **wb-tabs "Edit Pages"** → `#pages` placeholder.

**This plan wires both to the editor:**
- Row Edit chevron → `edit-page.html?page=<id>` (e.g. `?page=story`). JS reads the param (sessionStorage fallback for storage-blocked, mirroring the templates `?apply=` pattern) and loads that page's seed sections + title.
- wb-tabs "Edit Pages" → for the prototype, points to the editor seeded with a sensible default page (e.g. Home) OR a thin list view. **D2 covers this.**
- Editor breadcrumb: `DASHBOARD › VIBRANT UNION › WEBSITE · EDIT › <PAGE>` ; back-chip → `overview.html` (label "PAGES"). wb-tabs "Edit Pages" marked active.

---

## 2. Layout

```
[ chrome: floating nav · tool rail · breadcrumb(SYNCED) · section-head("Edit: Story") · wb-tabs(Edit Pages active) ]

DESKTOP ≥1024  (.ep-shell, 55/45 grid)          MOBILE <1024 (.ep-shell stacks; Edit|Preview toggle)
┌──────────────────────────┬───────────────┐    ┌───────────────────────────────┐
│ EDIT (55%)               │ PREVIEW (45%) │    │ [ Edit | Preview ] segmented  │
│  page meta bar           │  sticky       │    │ (under the page title)        │
│   · tier badge           │  .dp-preview- │    │                               │
│   · visibility toggle    │   frame       │    │ Edit view  → section list     │
│  ┌ .dp-section-block ─┐  │   .is-page-   │    │ Preview view → page-scoped    │
│  │ drag·type·▲▼·👁·🗑 │  │   scoped      │    │   preview                     │
│  │ inline editor       │  │  device-      │    │ (toggle persists; autosave    │
│  └─────────────────────┘  │   toggle      │    │  fires either way)            │
│  …more blocks…           │  (📱/🖥)       │    └───────────────────────────────┘
│  [ + Add section ]       │               │
└──────────────────────────┴───────────────┘
```

- **`.ep-shell`** — new page layout primitive (page-scoped in `edit-page.css`; promote to shell only if a 2nd consumer appears). Grid `minmax(0,55fr) 45fr` ≥1024; single column + segmented toggle <1024.
- **Page meta bar** — page name, `.dp-page-tier` badge (Public/Private), a page-level visibility toggle ("Show on website"), and a "Delete page" entry (reuses the Overview `#wb-removepage-confirm` cautionary, or a page-level variant — D6).
- **Preview** — `.dp-preview-frame.is-page-scoped` with the existing `.device-toggle` (mobile/desktop). Renders the page's sections (D4). Sticky on desktop (`top` clears the floating nav, like the templates aside).
- **Mobile Edit|Preview toggle** — reuse `.radio-pill-group` (segmented control) `role="radiogroup"`; toggles `.ep-shell[data-view="edit|preview"]`.

---

## 3. `.dp-section-block` (new shell primitive)

A card per section in the Edit list:
```
.dp-section-block
  .dp-section-head      drag handle (aria-disabled stub) · section-type label · reorder ▲▼ · visibility 👁 · delete 🗑
  .dp-section-body      the inline content editor for that section type
```
- Reorder via **▲▼ chevrons** (keyboard-accessible — drag is the aria-disabled stub, consistent with the Pages list). Up disabled on first, Down on last.
- Visibility 👁 toggles `.is-hidden` (section greyed in editor, omitted from preview).
- Delete 🗑 → lightweight confirm (D6).
- Collapsed/expanded? **Default expanded**; a chevron collapses the body to just the head (helps long pages). (D7)
- Built with DOM construction (no innerHTML — XSS-safe, per the security hook + last session's pattern).

---

## 4. Section primitive editors (the ~11)

Each section type = a small inline form in `.dp-section-body`, reusing shell form primitives (`.form-input`, `.form-textarea`, `.form-label`, `.toggle-switch`, `.dp-tile-grid`, image-drop from the crop modal, etc.). Mapping:

| # | Section | Inline editor | Preview render |
|---|---|---|---|
| 1 | Heading + paragraph | heading input + textarea + "two-column" toggle | styled heading + body (1 or 2 col) |
| 2 | Photo (single) | image drop/replace (reuse `.dp-dropzone`/crop) | single image |
| 3 | Photo grid (2–4) | N image slots + count control | grid |
| 4 | Schedule item | name + date(custom picker) + time(custom picker) + venue + dress code + note | sub-event card |
| 5 | Person card | photo + name + relation + side | person card |
| 6 | Hotel/venue card | photo + name + distance + booking link/map link | hotel card |
| 7 | Q&A item | question input + answer textarea | Q/A pair |
| 8 | Divider | (no fields — style select optional) | hr |
| 9 | Map embed | address/place input | static map mock + address |
| 10 | Countdown block | target date(custom picker) + label | countdown mock |
| 11 | Video embed | YouTube/Vimeo URL paste | 16:9 thumb mock |

Reuses the **custom date/time pickers** (`[data-date-trigger]`/`[data-time-trigger]`) already in shell.js for Schedule + Countdown.

**Scope reality:** 11 full editors + faithful per-section preview is large. **D3 proposes a phased build.**

---

## 5. Add-section picker (`#wb-addsection-modal`)

Reuse the completed `.modal-picker-grid` + `.modal-picker-tile` (+ filter chips). Differences vs Add-page:
- **No "Added" disabling** — sections are repeatable; every tile is always selectable (no `is-added`/`is-multi` flags, or all flagged "Add anytime").
- Tiles = the 11 section types (icon + name + 1-line desc). Plus a grayed **"Gift Registry — Coming soon"** `[aria-disabled]` slot.
- Filter chips: optional — group by Content / Media / Schedule / Embed (or drop filters; D8).
- On Add → append a new `.dp-section-block` of that type (with empty fields) to the list, scroll to it, focus its first input, toast "SECTION ADDED".
- Injected into `website.js` `SHARED_MODALS_HTML` (single source; same controller). Carries the same a11y we just hardened (radiogroup + roving tabindex + arrow nav).

---

## 6. Live preview (D4)

`.dp-preview-frame.is-page-scoped` shows the page as guests see it, updating on edit (debounced). Two fidelity options:
- **(a) Faithful render** — each section type renders a real mini-version (heading, grid, schedule card, countdown…) in the page palette/font. Most convincing; most work.
- **(b) Structural render** — section blocks render as labeled skeleton bands (like the templates mini-mocks) that update text but not full fidelity. Faster; less convincing.
**Recommend (a) for 3–4 hero section types, (b) for the rest** — pragmatic for a prototype. (Tied to D3.)

Autosave: on any field blur, debounce 600ms → bump the breadcrumb SYNCED chip timestamp (reuse the existing clock primitive). No toast.

---

## 7. Decisions for sign-off

- **D1 — Section set: confirm 11 (as enumerated in Q7) vs a 12th.** The source says "final 12" but lists 11. Recommend: **ship the 11 enumerated**; if a 12th is intended (likely a Custom-page free-form "Rich text + image" block), name it now. ✅ recommend 11 + flag.
- **D2 — Prototype editor coverage.** Build **ONE editor page** (`edit-page.html`) that reads `?page=<id>` and ships seed content for each page type, OR build it for a single representative page only. Recommend: **one `edit-page.html`, param-driven, seeded for ~3 representative pages** (e.g. Story = text+photo, Schedule = sub-events, Wedding Party = person cards) so reviewers see variety; the rest resolve to a sensible default. wb-tabs "Edit Pages" → `edit-page.html?page=home`.
- **D3 — Build phasing (the big one).** Recommend **Phase A this session:** editor shell + `.dp-section-block` + reorder/visibility/delete + Add-section picker + mobile Edit|Preview toggle + autosave + **4 fully-built section editors with faithful preview** (Heading+paragraph, Photo grid, Schedule item, Q&A). **Phase B (next session):** the remaining 7 section editors (Photo single, Person card, Hotel/venue, Divider, Map, Countdown, Video). Alternative: build all 11 now (longer single session). **Your call.**
- **D4 — Preview fidelity:** (a) faithful for the Phase-A 4, (b) structural skeleton for not-yet-built types. ✅ recommend.
- **D5 — Per-section delete:** lightweight **inline confirm** (a 2-button "Remove this section?" inside the block, or a small confirm popover) vs the full `.modal-confirm-cautionary`. Recommend: **reuse `.modal-confirm-cautionary`** for consistency with page-remove (one modal idiom). ✅
- **D6 — Page-level "Delete page"** in the meta bar: reuse the Overview `#wb-removepage-confirm` flow (and on confirm, navigate back to `overview.html`). Confirm Home/RSVP can't be deleted here either. ✅
- **D7 — Section block collapse:** default expanded, chevron to collapse body. ✅ recommend (helps long pages).
- **D8 — Add-section filter chips:** keep (Content / Media / Schedule / Embed) or drop. Recommend: **keep, mirrors Add-page**, reuses the hardened radiogroup. ✅

---

## 8. Component reuse audit

| Need | Decision | Source |
|---|---|---|
| Chrome (nav, tool rail, breadcrumb+SYNCED, section-head, wb-tabs) | Reuse as-is | shell + overview.html pattern |
| Split layout (55/45) | **Reuse `.dp-shell` + `.dp-col-left`/`.dp-col-right`** (Design tab's proven 1-col→split, `minmax(0,1.55fr) minmax(320px,1fr)` @1024 ≈ 60/40; accept or add a 55/45 modifier) — NOT a new `.ep-shell` (P2-3 corrected) | website.css 112 |
| Mobile Edit\|Preview toggle | **Reuse `.device-toggle` idiom** (2-button segmented `role="radiogroup"`, stays horizontal at 360) — **NOT `.radio-pill-group`** (it's `column` <480px) (P1-1 corrected) | shell.css 2555 |
| Live preview frame | ⚠ **NEEDS NEW `.is-scrollable` modifier** — `.dp-preview-frame` is a fixed-aspect hero mock (notch ::before; `.dp-preview-screen{overflow:hidden}` 2519) → multi-section content CLIPS. Add a Step-0 shell modifier: relax the aspect lock + `overflow-y:auto` on the screen + a `.dp-preview-content` rail (P0-1) | shell.css 2461 |
| Add-section picker shell | Reuse `.modal-picker-grid` family (now hardened) — **single-select-then-confirm, no filter chips** (D8/P1-2) | shell.css / website.js |
| Cautionary confirm (section/page delete) | Reuse `.modal-confirm-cautionary` (+ Overview next/prev focus-return pattern, website.js) | shell.css |
| Form fields (inputs, textarea, toggle, date/time pickers, dropzone) | Reuse | shell.css/shell.js |
| Tier badge, status, btn-pill | Reuse | shell |
| **`.dp-section-block` family** | **NEW shell primitive** — `<ul role="list">` of blocks; each block `role="group"` + `aria-label`=section type; collapse chevron `<button aria-expanded aria-controls>`; head (drag-stub + ▲▼ + 👁 + 🗑) + body (P1-4) | new |
| Per-section editor forms + faithful/skeleton preview renders | NEW, page-specific | `edit-page.css/js` |

---

## 9. States / test matrix (for the build phase)

- Section block: default / collapsed / hidden(visibility off) / first(▲ disabled) / last(▼ disabled) / dragging-stub / delete-confirm.
- Add-section: open / filter / select / add → block appears + focus moves; repeatable adds; "Coming soon" disabled tile.
- Reorder ▲▼ updates both list and preview; keyboard operable.
- Edit↔Preview toggle (mobile) persists state; autosave fires in both.
- Autosave: blur → SYNCED chip updates ~600ms; no toast.
- Empty page state ("No sections yet — add one").
- Responsive 360/390/768/1024/1440; sticky preview offset clears nav; no h-scroll; touch targets ≥44px.
- Light + dark; reduced-motion; focus-trap/return on modals; no console errors.

## 10. Build order (after sign-off)
1. `.dp-section-block` shell primitive (+ reduced-motion, states).
2. `edit-page.html` chrome + `.ep-shell` layout + page meta bar.
3. Seed sections + 4 Phase-A section editors + faithful preview.
4. `#wb-addsection-modal` into `SHARED_MODALS_HTML` + handlers (DOM-built, hardened a11y).
5. Reorder / visibility / delete + autosave SYNCED wiring.
6. Wire Overview row-edit chevron + wb-tabs to the route.
7. Test matrix + UI/UX agent post-build pass.

## 11. Out of scope
- Real drag reorder (keyboard ▲▼ only; drag is the aria-disabled stub).
- Phase-B section editors (if D3 = phased).
- Photos tab (deferred until Media ships).
- Real map/video embeds (mocks).

## Agent Review

**UI/UX agent verdict (2026-06-02): APPROVE WITH NOTES.** Structure honors the locked foundation; reuse instinct mostly right, but **two reuse claims were wrong** (verified against shell.css) and the section-list a11y mechanics were underspecified. All corrections folded into §8 (reuse audit) + the decisions below.

**P0 — must resolve before building the affected parts:**
- **P0-1 · Preview frame can't render multi-section as-is.** Confirmed: `.dp-preview-frame` is a fixed-aspect hero mock (notch ::before; desktop `aspect-ratio:16/10`; `.dp-preview-screen{overflow:hidden}` shell.css:2519). A tall page (Story + grid + 6 schedule cards) **clips**. **Resolution:** Step-0 shell change — add `.dp-preview-frame.is-scrollable` (relax the aspect lock) + `.dp-preview-screen` internal `overflow-y:auto` + a `.dp-preview-content` rail that stacks rendered sections. Treat as a primitive extension, not reuse. **Biggest hidden-scope item — do it first.**
- **P0-2 · Preview is decorative, keep it that way.** The Overview frame is `role="img"` + screen `aria-hidden` (deliberately inert). **Resolution:** the editor preview stays **decorative/`aria-hidden`** — the **form fields are the SR source of truth**; the preview adds nothing a SR user is missing. Documented so we don't silently inherit hero markup and call it "live."

**P1 — fixed in plan:**
- **P1-1 · Wrong toggle primitive.** `.radio-pill-group` is `column` <480px → use the **`.device-toggle`** segmented idiom for mobile Edit|Preview (corrected in §8).
- **P1-2 · Picker model = single-select-then-confirm.** Sections are added **one per modal-open** (matches Add-page exactly; keeps the hardened radiogroup valid). Drop "multi-add in one open." Combined with **D8 (drop filter chips)** this removes the roving-within-roving complexity.
- **P1-3 · Reorder ▲▼ is net-new (Overview drag is only a toast stub).** Define: after a move, focus **stays on the moved block's ▲▼ button**; `aria-live="polite"` announces "Moved to position N of M"; ▲ disabled on first / ▼ on last with focus handoff (don't evaporate focus).
- **P1-4 · `.dp-section-block` semantics** (corrected in §8): `<ul role="list">`; each block `role="group"` + `aria-label`=type; collapse chevron `aria-expanded`/`aria-controls`; section-type labels are the group name, **no competing `<h2>`s** under the page `<h1>`.
- **P1-5 · Content-length + long lists:** add **collapse-all / expand-all** in the page-meta bar; section-type label `overflow-wrap:anywhere`; design the **empty Custom page** state + a **20+ section** scroll (sticky page-meta bar). Added to the test matrix as gates.

**P2 — adopted:** per-section delete focus-return copies the Overview next/prev pattern (website.js); the **SYNCED chip must stay visible in both mobile views** (the one autosave trust-cue); sticky preview `top` clears nav **and** breadcrumb, and the 45% column keeps ≥520px at the 1024 boundary; "Gift Registry — Coming soon" tile skipped by the roving handler.

**Decisions D1–D8 — agent-recommended, adopted (overrides the earlier recommendations where noted):**
- **D1 → 11 sections.** The phantom "12th" is the **Custom-page archetype** (composed from Heading+paragraph + Photo), not a new primitive. Locked — won't resurface.
- **D2 → one param-driven `edit-page.html?page=<id>`, seeded for 3 pages** (Story, Schedule, Wedding Party). **wb-tabs "Edit Pages" → `?page=story`** (NOT home — Home/Hero is the special public-tier fixed hero; Story shows the repeatable-section machinery immediately).
- **D3 → Phase A set SWAPPED:** Heading+paragraph, Schedule item, Q&A, **Person card** (Person card proves photo + multi-field + grouped layout, and Wedding Party is a seed page). **Photo grid → Phase B** (Photo-single shares its editor, so B gets it nearly free). **Countdown is NOT Phase-A** (near-static, low representativeness).
- **D4 → (a) faithful for the Phase-A 4, (b) skeleton for the rest** — contingent on P0-1. Skeletons must visibly read as "not-yet-styled," not broken.
- **D5 → `.modal-confirm-cautionary`** for section delete (mind focus-return, P2).
- **D6 → reuse `#wb-removepage-confirm`**, navigate to `overview.html` on confirm; Home/RSVP non-deletable (mirror the Overview guard).
- **D7 → default expanded + chevron collapse + collapse-all/expand-all** (P1-5).
- **D8 → DROP filter chips** on the section picker (flat 11-tile grid — 11 tiles don't need a tier filter; removes P1-2 nesting cost). *Overrides the plan's earlier "keep, mirrors Add-page."*

## Built (2026-06-02)

**Shipped — full per-page section editor with all 11 section types (Abhijith chose "build all now", not phased).**

- **`shell.css`** — `.dp-preview-frame.is-scrollable` (relax aspect lock + screen `overflow-y:auto` + top padding clearing the phone notch); `.dp-section-block` family (`<ul role=list>` → `<li role=group>`; head with drag-stub + ▲▼ + visibility + delete + collapse; body; states; reduced-motion); `.modal-picker-tile-check` gating (from the modals session) reused.
- **`edit-page.html`** — chrome + `.dp-shell` split (reused) + page-meta bar (name · tier · visibility · collapse-all · delete · **autosave indicator**) + mobile Edit\|Preview toggle + `.is-scrollable` preview + empty state.
- **`edit-page.css`** — mobile toggle, meta bar, add-section CTA, empty state, field helpers, **11 `.epv-*` faithful preview renders**, autosave indicator.
- **`edit-page.js`** — section engine: `SECTION_TYPES` registry (all 11: editor form + faithful render each), seed pages (Story/Schedule/Wedding Party) + graceful empty page for any other id, `.dp-section-block` builder, reorder ▲▼ (+ `aria-live` announce + focus), visibility, collapse + collapse-all, section delete (cautionary), Add-section picker (single-select radiogroup + roving, "Gift Registry — Soon" tile, no filters), live preview, autosave indicator. All DOM-built via `el()` — no `innerHTML`.
- **Wiring** — Overview row "Edit" chevron + "Edit Pages" wb-tab (overview + design) → `edit-page.html?page=<id>`; page-delete reuses `#wb-removepage-confirm` (armed-navigation back to Overview).

**Verified in-browser:** 3 seed pages + empty page; all 11 types add/edit/render; live edit→preview; reorder; visibility; collapse/collapse-all; delete (cautionary); Add-section (12 tiles incl. Soon, roving, single-select); mobile Edit\|Preview toggle (no h-scroll @390); `.is-scrollable` preview scrolls + notch cleared; entry wiring; light/dark; no console errors.

**UI/UX agent — plan APPROVE WITH NOTES (2 P0 reuse traps caught), post-build REVISE → all addressed.** Post-build P0s **fixed + re-verified:** P0-1/P0-2 in-section toggle double-handler (shell.js also flips `aria-checked`) → switched to a **MutationObserver** on `aria-checked` so click AND keyboard sync the data (`twocol` etc.); P0-3 Home/RSVP delete guard added (delete button hidden for those ids). P1s fixed: reduced-motion `scrollIntoView`, focus-fallback to collapse button for field-less sections (Divider), countdown label desync. P2s: autosave indicator (Saving→Saved, visible on mobile where the breadcrumb SYNCED chip is hidden), `.ep-field-help` class split, roving skips the disabled "Soon" tile.

**Confirmed clean (agent):** `.dp-section-block` heading/role semantics (single `<h1>`, blocks are labelled groups), reorder announce, collapse `aria-expanded`/`aria-controls`, preview decorative/`aria-hidden`, page-delete reuse doesn't double-fire on Overview, no dead code.

**Deferred / out of scope:** real drag reorder (keyboard ▲▼ only); `components.html` backfill (now also owes `.dp-section-block`, `.is-scrollable`, `.epv-*`, the editor); real image upload / map / video embeds (mocks); the React port (Puck — see foundation plan §14).
