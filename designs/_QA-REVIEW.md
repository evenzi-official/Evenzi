# Evenzi design-prototype QA review (verified)

**Method:** 7 parallel review agents (ui_ux_designer + test_engineer + design-rule + brand lens), code-level audit of every page under `designs/`. This **replaces** the earlier `_QA-FINDINGS.md` (an Antigravity axe-scan that mis-navigated → 908 false/duplicated entries; discarded). Findings here are verified against the source. Items needing a live render are tagged **NEEDS-RENDER** (founder phone-pass / Track-1).

**Verdict:** the *built* pages are structurally solid (no `innerHTML`/XSS, modal focus-trap, token theming, reuse discipline mostly good). The real issues cluster into **8 cross-cutting fixes** (fix once → many pages) plus per-page defects. **invitations + media are unbuilt scaffolds (P0 gaps).**

---

## 🔴 Cross-cutting (highest leverage — fix once, hits many pages)

1. **[P1] iOS input-zoom gap — the shell 16px rule is too narrow.** It targets only `.form-input/.form-input-field/select.form-input/textarea.form-input`, so it **misses** bare `<select>` (event-settings `general.html`), `.form-textarea` (event-settings website/guest-list/registry), `.wb-wa-textarea` (website Share), and page search inputs (`.cc-search-row input` create-event step-3). → focus-zoom still happens on those. **Fix in `shell.css`:** broaden to `input:not([type=checkbox]):not([type=radio]), select, textarea { @media (max-width:767px){font-size:16px} }` (or add the missing selectors). One shell fix clears all pages.
2. **[P0/P1] Inline CSS/JS violations** (rule: "no inline CSS or JS, ever"). Worst: **event-control.html ships an inline `<script>`** (parallax/toasts/ring) + 33 inline `style=` — **P0**. Also: `index.html` inline `<script>` + ~16 inline styles (P1); event-settings 24 inline styles (P1); website palette swatches `style="background:#…"` (P1 — inline *and* hardcoded hex); guests 5 inline styles (P2). **Fix:** extract to page `.js`/`.css` + token/data-attr-driven values.
3. **[P1] Hand-rolled `max-w-[1440px] mx-auto px-6 md:px-10` instead of `.page-band`** — event-control (5×), settings (2×), index, planning `<main>`. Brand rule bans hand-rolling page width (it's the recurring drift). **Fix:** swap to `.page-band` (our-journey already does it right).
4. **[P2][a11y] `role="tablist"/"tab"/aria-selected` on cross-page NAV links** (Dashboard/Website primary-view nav) — system-wide (guests, planning, invitations, media, event-control). These navigate to URLs, they're not a tab widget → a11y anti-pattern. **Fix once in the shared nav:** drop the tab roles; it's link navigation. (Related: `data-section="dashboard"` makes shell mark "Dashboard" `aria-current` on sub-tool pages — imprecise; use `is-active` without `aria-current`.)
5. **[P2] Raw hex / non-token colors** — event-control mandala `#dc1f2e` + `oj-del:hover #e5484d`; event-settings status `#ef4444/#10b981/#f59e0b`; website photo-overlay rgba. Shell ships `--danger/--success/--warning(-ink)`. **Fix:** swap to tokens.
6. **[P1] `.gm-setter` picker duplicated, not promoted to shell** — planning copied the whole `.gm-setter*` block from guests (0 refs in shell). Two divergent copies of one popover. **Fix:** promote `.gm-setter*` to `shell.css` (alias-first), delete the local copies.
7. **[P3] Missing favicon + apple-touch-icon** → `/favicon.ico` + `/apple-touch-icon.png` 404 on every page (the only real thing in the Antigravity scan). **Fix:** add a favicon (or drop the apple-touch ref).
8. **[P3][shell] Non-interactive `.clay-card`s inherit the hover-lift** (false affordance on static cards, e.g. guests rate hero). Shell-level. **Fix:** scope the lift to interactive cards.

---

## Per-page findings

### planning (just reworked)
- **[P1][interaction] Loading buttons render blank** — `#plan-budget-save`/`#plan-exp-save` toggle `.is-loading` but have **no `.btn-pill-spinner` child** + never set `aria-busy`; shell hides the label → blank button during the 400ms save. Fix: add the spinner span + `aria-busy`.
- **[P1][a11y] Sub-event chip** uses the same `icon('event')` as the due chip (two identical glyphs), no distinguishing `aria-label`, and double-styles (`.task-sub-chip` local + `guest-assign-chip` shell). Fix: distinct icon + `aria-label="Sub-event: …"`, dedupe styling.
- **[P1][interaction] Bulk Set-date/Assign** have no Undo (Complete does) and can silently hide just-edited rows when a filter is active. Fix: undo snapshot + announce count.
- **[P2]** picker (`openPicker`) `aria-modal` dialog with no Tab focus-trap; color-only priority on mobile (`.task-prio-label` hidden <768, Medium shows nothing); **filtered-to-empty list has no empty state** (search/sub-event no-match → blank card); search has no debounce (aria-live spam).
- **[P1][reuse]** `.gm-setter` duplicated (cross-cutting #6).

### guests
- **[P1][design-standard] Toolbar action row not even-distributed on mobile** — 5 icon-buttons `flex-wrap` auto-width, no `space-between`/`flex:1` → left-clumped with dead space (this is the exact thing you flagged on the screenshot). Fix: `<768px` `justify-content:space-between` or `.gm-icon-btn{flex:1}`.
- **[P2]** dead `.gm-add-btn` CSS + stale comment (Add is a FAB now); `aria-haspopup="true"` should be `"dialog"`/`"menu"` per the surface; 5 inline `style=` (close-buttons, asterisks, bc-copy icon).

### website module
- **[P1]** palette swatches use inline `style="background:#hex"` (inline + hardcoded, ~24 in design.html + templates); `<hr class="section-rule">` misuses the eyebrow-heading primitive as a divider (design.html:404).
- **[P2]** cross-page modals built via `insertAdjacentHTML` (contradicts the file's "no innerHTML" claim — static, so no XSS, but inconsistent); gallery thumbnails get `alt=''` while the lightbox sets a real alt; website-local `backdrop-filter` surfaces lack an `@supports not` fallback.
- **[P3]** `edit-page.html` missing the `<link rel="manifest">` siblings have; `edit-pages.js` is dead code. **Verified good:** the pill-parity migration is correct (local `.wb-tab*` removed, flat shell alias).

### event-control + settings
- **[P0]** event-control inline `<script>` + 33 inline `style=` (cross-cutting #2).
- **[P1]** both hand-roll `max-w` instead of `.page-band` (#3); `oj-del:hover` raw `#e5484d` (#5).
- **[P2]** mandala `#dc1f2e` raw hex; website-visibility toggles announce nothing to SR; settings `aria-current="page"` on a non-link `<button>`.
- **[P3]** delete-confirm should be `role="alertdialog"`; quick-action tiles only toast (the sibling bento cards are real links — inconsistent).

### event-settings (6 pages)
- **[P1]** `website.html` "Modify all" link uses undefined class `.cc-review-edit` (defined only in create-event's CSS) → unstyled; iOS-zoom on bare `<select>`/`.form-textarea` (#1); 24 inline `style=` across the module (#2).
- **[P2]** sidebar is a bare `<aside>` of links — should be `<nav><ul>`; **delete-event "type-to-confirm" modal + add-co-host modal are absent** (copy promises them, only a toast fires); admin `more_horiz` buttons are dead (no handler/menu); breadcrumb `data-bc-*` only on general.html (inconsistent feedback); active crumb hardcoded "EVENT SETTINGS" on all 6.
- **[P3]** "Allow **#** to add a plus-one" copy bug (templating leftover); raw-hex status colors; ₹ amounts not `tabular-nums`.

### create-event wizard + auth
- **[P0]** step-3 ceremony search input 14px → iOS zoom (#1).
- **[P1]** that **search box is decorative — no filter logic** (dead control); step-3 disabled "Continue" reason not announced; **entire non-wedding branch is unreachable** (birthday/anniversary/corporate disabled) so the skip-step-3 path is untested — confirm if parked.
- **[P2]** celebration cards are `role="checkbox"` containing real `<button>`s (nested-interactive a11y smell); "Change number" doesn't pre-fill the phone from sessionStorage; lone end-time renders "… – 9:00 PM". **Verified good:** wizard routing, autosave/refresh-resilience, XSS-safe DOM, pin-input, modal trap.

### dashboard (index) + invitations + media
- **[P0][gap] invitations + media are empty scaffolds** — just a "Content area" box, no functionality, no css/js. Either build them (`/spec-kit invitations`, `/spec-kit media`) or replace the stub with a real "coming soon" empty-state.
- **[P1]** index: many dead `href="#"` (Manage/Report/Gallery/Up-next/etc.); inline `<script>` (no `index.js`); ~16 inline `style=`; progress bars have no `role="progressbar"`/`aria-hidden`.
- **[P2]** `.dash-nav-inner` overrides the shell nav with `!important` instead of reusing `.floating-nav-inner.is-minimal`; invitations/media hand-roll the eyebrow/title (+ placeholder "Section" text) instead of the shared heading classes. **Verified good:** index radiogroup filters, stretched-link pattern, empty state, hover-guards.

---

## Track-1 (live browser, 360px) — RAN

Spot-checked the key pages in a real browser (Playwright @360px). Confirms the Antigravity scan's "horizontal scroll" + "console error" findings were mostly false (it tested wrong pages), AND surfaces 2 **real** overflow bugs:

| Page | @360 overflow | Console |
|---|---|---|
| event-control | ✅ none (345px) | only favicon 404 |
| planning | ✅ none (345px) | clean |
| guests | ✅ none (345px) | clean |
| index (dashboard) | ✅ none (345px) | clean |
| **website/overview** | 🔴 **OVERFLOW 398px** | clean |
| **website/photos** | 🔴 **OVERFLOW 531px** | clean |

- **[P1][responsive] website/overview + website/photos overflow at 360px** — the `.dp-card-head-actions` / `.dp-card-head-aux` row (354px / 411px) + the `.btn-pill-secondary` ("FROM MEDIA ALBUMS · SOON" 261px) **don't wrap or scroll on mobile**, forcing the page to 398/531px wide. This is the squished "Gallery photos" you saw earlier. **Fix:** make `.dp-card-head` rows wrap (`flex-wrap`) / stack the head actions below the title <768px so they don't set page width. (website/design + card-templates likely share the `.dp-card-head` pattern — check them too.)
- Console: the **only** error anywhere is the favicon 404 (cross-cutting #7). Every page also logs the benign Tailwind-CDN production warning.

Still NEEDS-RENDER (founder phone-pass): glass-blur budget; dark-mode contrast on raw-hex statuses; planning blank-loading flash; pill-tab parity (visual).

---

## Suggested fix order
1. **Cross-cutting #1 (iOS zoom selector)**, **#2 (event-control inline script = P0)**, **#7 (favicon)** — small, global, high-value.
2. **invitations + media** decision (build vs labeled stub).
3. Cross-cutting #3 (.page-band), #4 (nav tab-roles), #5 (tokens), #6 (.gm-setter promote).
4. Per-page P1s (planning loading buttons / sub-event chip / bulk-undo; guests toolbar even-spacing; website swatches; event-settings missing modals).
5. P2/P3 polish.
