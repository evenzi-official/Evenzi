# Website · Overview — Add-page picker + Remove-page confirm (Modals)

**Page:** `designs/pages/website/overview.html` (+ cross-cutting `website.js` / `website.css`)
**User goal:** Let a host add a page to their site from the library, and remove a page they don't want — both without leaving the Overview.
**Module:** Website / Digital Presence. Design-path prototype (no ClickUp, no superpowers).
**Owner:** Abhijith. **Date:** 2026-06-02.

---

## 0. Why this exists — current stub state

The Overview "Pages" card already has the triggers; they currently dead-end in toasts:

| Trigger | File:line | Today | This plan |
|---|---|---|---|
| `+` / "Add page" (`data-dp-add-page`) | website.js:474 | toast *"PAGE PICKER — COMING NEXT"* | **Build Add-page picker modal** |
| Per-row "Edit" chevron (`data-dp-row-edit`) | website.js:456 | toast *"OPENING … EDITOR"* | Out of scope — it's a **route** (Edit Pages), not a modal |
| Drag handle | website.js:466 | toast *"KEYBOARD REORDER COMING SOON"* | Out of scope — not a modal |
| Hide/show (`data-dp-row-toggle`) | website.js:440 | **real** (toggles `.is-hidden`) | unchanged |
| Edit URL slug (`data-dp-edit-slug`) | website.js:303 | **real** (reuses Share modal) | unchanged — already done |
| **Remove page** | — | **no trigger exists** | **Add a remove affordance + cautionary confirm** |

So two modals are genuinely missing from the Overview: **(A) Add-page picker** and **(B) Remove-page confirm**. Both are injected into `website.js` `SHARED_MODALS_HTML` (single source — the Add-page picker is also the one the future **Edit Pages** tab will reuse, per NEXT-SESSION top-of-queue).

---

## 1. Component reuse audit

Both modals are **almost pure composition** of existing shell primitives — minimal new CSS expected.

| Need | Decision | Source |
|---|---|---|
| Picker modal shell (chips + tile container + actions) | **Reuse as-is** | `.modal-picker-grid` / `.modal-picker-body` (shell.css 2767–2775) |
| **Tile GRID layout** | **NEW — completes the shell primitive** ⚠ `.modal-picker-body` has NO `display:grid` (orphan, never instantiated). Add a grid rule to the shell `.modal-picker-body` (this is its first consumer): 2-col ≥440px, 1-col below. | shell.css 2769 |
| Page-type tiles (icon + name + desc + flag + check) | **Reuse — first consumer**; markup contract pinned in §3 | `.modal-picker-tile` family incl. `[aria-disabled]`, `.is-selected`, `-icon/-name/-desc/-flag/-check` (shell.css 2776–2827) |
| "Added" flag (already-on-site tiles) | **Reuse as-is** | `.modal-picker-tile-flag.is-added` (success tint) |
| "Add multiple" flag (Custom) | **Reuse as-is** | `.modal-picker-tile-flag.is-multi` (brand tint) |
| Tier badge (Public/Private) inside tile | **Reuse as-is** | `.dp-page-tier` / `.dp-tier-public` / `.dp-tier-private` (shell.css 2363) |
| Filter chips (All / Public / Private) | **Reuse `.dp-filter-chips`** (visual) — but it's an orphan using `.is-active` (not aria-checked). Semantics + keyboard handler decided in §3 (P0-3). | `.dp-filter-chips` (shell.css 3027) |
| Remove confirm | **Reuse as-is** | `.modal-confirm-cautionary` (shell.css 2983) |
| Modal head / close / actions | **Reuse as-is** | `.modal-head` / `.modal-close` / `.modal-actions` |
| Custom-page name input | **Reuse as-is** | `.form-input` / `.form-label` / `.form-error` |
| Injected page row | **Reuse as-is** | `.page-list-row` markup (clone existing row shape) |
| Remove icon on a row | **Reuse** `.dp-icon-btn-sm` | website.css/shell |

**New page-specific CSS expected:** essentially none beyond a possible small `.modal-picker-tile` selected-state nuance or the custom-name reveal block (`.wb-addpage-custom` disclosure). Confirm during build; promote nothing new to shell unless a 2nd consumer appears.

---

## 2. Page library (MVP — source: `digital-presence-plan.md` D-5)

**Library:** Home/Hero, RSVP, Schedule, Story, Wedding Party, Venue, Travel & Stay, Q&A, Gallery, Video, Custom ("Something"). **Out of MVP:** Registry.

**Already on the Overview list (9):** Home, RSVP, Schedule, Story, Wedding Party, Venue, Travel & Stay, Q&A, Gallery.
**Addable now (not yet on the list):** **Video**, **Custom**.

Default tier per page (Public tier = open; Private = unlock-gated, per D-1):
- **Public:** Home/Hero.
- **Private:** RSVP, Schedule, Story, Wedding Party, Venue, Travel & Stay, Q&A, Gallery, Video, Custom.

The picker shows the **whole library**; already-added single-instance pages render as `.modal-picker-tile[aria-disabled]` + `.modal-picker-tile-flag.is-added` ("Added"). **Custom** is `.is-multi` ("Add multiple") and never disables.

---

## 3. Modal A — Add-page picker (`#wb-addpage-modal`)

**Shell:** `.modal-scrim#wb-addpage-modal` > `.modal-card.lg-glass-card.modal-picker-grid`.

**Head:** "Add a page" + sub "Pick a page type to add to your site."

**Body:**
- **Filter chips** (`.dp-filter-chips`, `role="radiogroup"`): All · Public · Private. Filters the tile grid client-side.
- **Tile grid** (`.modal-picker-body`): one `.modal-picker-tile` per library page. Each: icon (Material), name, 1-line desc, `.dp-page-tier` badge, and a flag (`is-added` for already-on single pages → `aria-disabled`; `is-multi` for Custom). Available tiles are `<button>`s.
- **Custom-page disclosure:** selecting the **Custom** tile reveals an inline name field (`.form-label` + `.form-input` "Page title", `.form-error` for empty). Until a valid name is entered, the modal's primary **Add** is disabled.

**Actions:** Cancel (`data-modal-close`) · **Add** (`data-wb-addpage-confirm`, `btn-pill-primary`, disabled until a tile is selected / custom-name valid).

**On Add:**
1. Build a new `.page-list-row` (icon + name + tier badge + Hide + Edit + **Remove**) and append to `.dp-page-list`.
2. Increment `#dp-pages-count`.
3. For single-instance pages, flip that library tile to `is-added`/disabled (so re-opening reflects it).
4. Close modal, return focus to the `+` trigger, toast `"<PAGE> ADDED"`.

**Empty/edge:** if every single-instance page is added (only Custom remains addable), the non-custom tiles all show "Added" — that's the honest "nothing left but Custom" state; no separate empty screen needed.

**A11y:** filter chips are a radiogroup (arrow-key nav, like Design-tab palettes); tiles are buttons with `aria-disabled` on added ones; tile name is the accessible name, desc via `aria-describedby`; focus moves into the modal on open (first enabled tile), trap + return handled by the shell controller.

---

## 4. Modal B — Remove-page confirm (`#wb-removepage-confirm`)

**New affordance first:** add a **Remove** icon-button to each *removable* page row's `.dp-page-actions` (`.dp-icon-btn-sm`, `delete_outline` glyph, `data-dp-row-remove`, `aria-label="Remove <Page>"`). Row actions become **[Hide] [Remove] [Edit ›]**.

**Non-removable (mandatory) pages:** **Home** and **RSVP** — core to every event site. Their rows get **no** Remove button (and the picker keeps them flagged Added/disabled). All others are removable.

**Shell:** `.modal-scrim#wb-removepage-confirm` > `.modal-card.lg-glass-card.modal-confirm-cautionary` (`role="alertdialog"`). Icon `delete` (cautionary tint), title "Remove this page?", text "Guests will no longer see **<Page>**. You can add it back anytime from the library." Actions: Cancel · **Remove page** (`btn-pill-primary`, `data-wb-removepage-confirm`).

**On confirm:** remove the `.page-list-row`, decrement `#dp-pages-count`, re-enable that page's library tile (flip off `is-added`), close, toast `"<PAGE> REMOVED"`. The confirm reads the pending page from the clicked row (store name + id in JS state when the Remove icon is clicked).

---

## 5. JS plan (`website.js`)

- Add `#wb-addpage-modal` + `#wb-removepage-confirm` to `SHARED_MODALS_HTML` (injected once, idempotent — they appear on every Website-module page, ready for Edit Pages reuse).
- **Replace** the `data-dp-add-page` stub (line 474) → `wbOpenModal('wb-addpage-modal')` + reset picker state (clear selection, hide custom field, focus first enabled tile).
- New handlers: filter-chip click → filter tiles; tile select → mark `.is-selected` + enable Add (+ reveal custom field if Custom); `data-wb-addpage-confirm` → inject row + sync count + flag tile + toast.
- New handlers: `data-dp-row-remove` → stash pending row, open `#wb-removepage-confirm`; `data-wb-removepage-confirm` → remove row + sync count + un-flag tile + toast.
- Keep a tiny in-file registry of library pages (id, name, icon, tier, multi) so Add and tile-flag-sync share one source. (In the React port this is a DB-backed page set; here a JS array mirrored to the DOM.)
- All open/close via `window.evenzi.openModal/closeModal` (focus-trap, return, Esc, stacking already handled).

---

## 6. Decisions for sign-off

- **D1 — Picker shows full library w/ "Added" disabled tiles** (recommended) vs only-addable tiles. Full library gives the host a complete mental model of what their site can include. ✅ recommend full.
- **D2 — Custom page naming:** selecting Custom reveals an **inline name field** in the modal (Add stays disabled until valid). ✅ recommend inline (vs a separate second step).
- **D3 — Remove affordance = a Remove icon in the row actions** ([Hide][Remove][Edit ›]) (recommended) vs an overflow "⋯" menu. At 3 icons the row is still fine at 360px (icons are `dp-icon-btn-sm`); overflow adds a click. ✅ recommend inline icon. *If row crowding shows in test at 360px, fall back to overflow.*
- **D4 — Mandatory (non-removable) pages = Home + RSVP.** Confirm, or also lock Schedule? ✅ recommend Home + RSVP only.
- **D5 — Custom is multi-add** (`is-multi`), everything else single-instance. ✅ recommend.

---

## 7. States to cover (test phase)

- Picker tile: default / hover / focus-visible / selected / disabled (Added) / multi (Custom).
- Filter chips: All / Public / Private switching; keyboard arrow nav.
- Custom flow: select Custom → name field reveals → empty error → valid → Add enabled → row appears titled.
- Add: row injected with correct icon/tier/actions; count increments; tile flips to Added; focus returns to `+`.
- Remove: icon only on removable rows; confirm copy names the right page; Cancel vs Remove; count decrements; tile re-enabled; focus returns.
- Modal mechanics: Esc, scrim-click close, focus-trap, focus-return, body `no-scroll`, no stacking conflicts with Share/Publish.
- Responsive: 360 / 390 / 768 / 1024 / 1440 — picker grid reflow, row actions fit at 360, modal as bottom-sheet < 768 vs centered ≥ 768.
- Light + dark; reduced-motion; no console errors; no dead triggers left.

---

## 8. Build order

1. Inject `#wb-addpage-modal` markup into `SHARED_MODALS_HTML`.
2. Add library registry + replace add-page stub + picker handlers (filter, select, custom, confirm-add).
3. Add Remove icon to removable rows in `overview.html` + inject `#wb-removepage-confirm` + remove handlers.
4. Any minor CSS (custom-name disclosure) in `website.css`.
5. Test matrix + UI/UX agent post-build pass.

## 9. Out of scope (noted, not built)
- Per-page **Edit** route (Edit Pages tab — separate queued work).
- Drag reorder (keyboard reorder stub stays).
- Registry page (out of MVP).

## Agent Review

**UI/UX agent verdict (2026-06-02): APPROVE WITH NOTES.** User assignment confirmed **Host** (authoring surface, AA floor). Architecture endorsed (inject into `SHARED_MODALS_HTML`, reuse picker/cautionary primitives, delegate modal mechanics to shell controller). The catch: the picker/filter primitives are **untested orphans** — this build is their first consumer, so "reuse as-is" was optimistic. All corrections below are folded into the build spec.

**P0 — corrected in plan (verified against shell.css):**
- **P0-1 · `.modal-picker-body` has no grid.** Confirmed (shell.css:2769 sets only max-height/overflow/padding) → tiles would stack in one column. **Resolution:** complete the shell primitive — add to `.modal-picker-grid .modal-picker-body`: `display:grid; grid-template-columns:1fr; gap:.6rem;` and `@media(min-width:440px){ grid-template-columns:repeat(2,minmax(0,1fr)); }`. (Lives in shell.css since it's the primitive's own rule and the future Edit Pages tab reuses it.)
- **P0-2 · Tile contract unverified — pin exact markup.** Sub-elements all exist (verified shell.css:2776–2827). **Canonical tile (decided):**
  ```html
  <button class="modal-picker-tile" role="radio" aria-checked="false"
          data-wb-page-add="video" aria-describedby="wb-tile-video-d">
    <span class="modal-picker-tile-icon" aria-hidden="true"><span class="material-symbols-outlined">movie</span></span>
    <span class="modal-picker-tile-name">Video
      <span class="dp-page-tier dp-tier-private"><span class="material-symbols-outlined" aria-hidden="true">lock</span>Private</span>
    </span>
    <span class="modal-picker-tile-desc" id="wb-tile-video-d">Embed a highlight reel or teaser.</span>
    <span class="modal-picker-tile-check" aria-hidden="true"><span class="material-symbols-outlined">check_circle</span></span>
  </button>
  ```
  Already-added single page → add `aria-disabled="true"` + `<span class="modal-picker-tile-flag is-added">Added</span>` (NOT `<button disabled>` — keep discoverable, P2-3). Custom → `<span class="modal-picker-tile-flag is-multi">Add multiple</span>`, never disabled.
- **P0-3 · Filter-chip semantics.** `.dp-filter-chip` uses `.is-active` (shell.css:3051); shell.js's only radiogroup keyboard handler is `.radio-pill-group`-specific (not generic). **Resolution:** chips use `.dp-filter-chips`+`.dp-filter-chip`, wrapped `role="radiogroup"`, each chip `role="radio"` `aria-checked`; selected toggles BOTH `aria-checked` and `.is-active`. A small **delegated handler in `website.js`** does click + Arrow-key roving (scoped, ~12 lines — not a primitive fork; `design.js`'s page-local `radioGroupKey` is intentionally NOT cross-imported to avoid coupling). Group `aria-label="Filter pages by visibility"`.

**P1 — folded into build spec:**
- **P1-1 · 360px row crowding.** Row gains a 3rd action ([Hide][Remove][Edit ›]) + tier badge + name + drag handle. **Resolution:** **hide the `.dp-drag` handle < 768px** (it's an `aria-disabled` non-functional stub anyway) to reclaim space for Remove; **gate "360px + long name + Private badge + 3 actions" as a P0 test row**; pre-authored fallback = overflow "⋯" menu if it still doesn't fit cleanly.
- **P1-2 · Focus on mutate.** **After Add:** focus the new row's Edit chevron. **After Remove:** the row is deleted (its trigger detaches) → focus the **next** row's Remove button, else the **previous** row's, else the header `+` if the list empties. Explicit in `website.js`, not left to `lastFocused`.
- **P1-3 · Count announce.** Add `aria-live="polite"` to the pages-count line (`#dp-pages-count`'s container, overview.html:403) so "9 total → 10 total" is announced; the `<PAGE> ADDED/REMOVED` toast is supplementary.
- **P1-4 · Add-disabled + custom error.** Add button uses `disabled` until a tile is selected / valid custom name. Custom `.form-error` wired via `aria-describedby`, announced on blur / Add-attempt — mirroring the slug validator (website.js:324–343).

**P2 — adopted:** clamp `.modal-picker-tile-name` long custom titles (add `overflow-wrap`); helper line under the grid for the "only Custom left" end state ("Only custom pages can be added more than once"); Remove icon stays neutral `var(--muted)` (NOT red — reversible action, P2-2); each injected Custom row gets a unique `data-page="custom-N"` id so Remove + tile-sync don't collide (D5).

**Decisions D1–D5 — all agent-agreed, adopted:** D1 full library w/ Added-disabled tiles; D2 inline custom-name reveal (Add disabled until valid); D3 inline Remove icon (with the P1-1 drag-hide + overflow fallback); D4 Home + RSVP mandatory (Schedule stays removable); D5 Custom multi-add (`is-multi`), rest single-instance with unique ids.

## Built (2026-06-02)

**Shipped — Add-page picker + Remove-page confirm on the Overview Pages card.**

- **`website.js`** — injected `#wb-addpage-modal` (filter chips + tile grid) + `#wb-removepage-confirm` (cautionary) into `SHARED_MODALS_HTML` (single source; Edit Pages reuses them). Replaced the add-page stub with a full module: `PAGE_LIBRARY` registry, `ensureRemoveButtons()` (Remove icon on the 7 removable rows; Home/RSVP excluded via `MANDATORY`), `renderAddGrid()` (tiles reflect the live list — Added/disabled, Custom multi), Custom inline-name flow, filter chips, add/remove handlers with focus-on-mutate. **All DOM built via a small `el()` helper — no `innerHTML` (XSS-safe for custom titles; the security hook caught the first innerHTML draft).**
- **`shell.css`** — completed the orphan `.modal-picker-body` primitive (first consumer): `display:grid` 1-col → 2-col @440px; gated `.modal-picker-tile-check` to the selected tile only (was always-on); `overflow-wrap` on tile name; reduced-motion guard on tile.
- **`website.css`** — drag handle hidden <768px (reclaims room for Remove), neutral Remove-icon tint (brand on hover), custom-field disclosure + end-state hint.
- **`overview.html`** — `aria-live="polite"` on the pages count.

**Verified in-browser:** add-Video (count 9→10, row w/ Remove), Custom flow (field reveal, Add gated on name, `custom-1`), Remove (confirm names page, count↓, focus moves next→prev→`+`), filters (Public→Home only), tile-check only on selected, Remove on 7 removable rows only, 2-col desktop / 1-col mobile bottom-sheet, no console errors, no regressions.

**UI/UX agent — plan APPROVE WITH NOTES (3 P0 reuse traps caught + corrected), post-build APPROVE WITH NOTES.** All plan resolutions confirmed in code. Post-build P1s **fixed in-session:** P1-A grid is now `role="radiogroup"` + roving tabindex + arrow-key nav on tiles; P1-C filter chips roving tabindex (single tab stop); P1-B custom error `role="alert"` + `aria-invalid` (defensive — primary gate is disabled-Add-until-valid). P2-A reduced-motion added.

**Pre-existing / out of scope (flagged, not fixed):**
- **overview.html has a ~38px horizontal overflow at 360px** from the URL&Status card's 3-button action row (`.dp-card-head-actions`) — confirmed pre-existing (removing ALL modals left scrollWidth unchanged). This work nets neutral on row width (drag-hide offsets the Remove button).
- Dead `#dp-template-modal` selector in `design.js` (from the templates session; confirmed no-op).
- P2-B: injected Private rows omit the non-essential `title` tooltip the static RSVP row has (cosmetic).
