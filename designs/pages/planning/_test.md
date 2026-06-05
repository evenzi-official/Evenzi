# Test plan — Planning (`planning`)  ·  against SPEC_VERSION 2026-06-05.2

> Test source of truth. Antigravity tests **only** from this file. Run every row; record PASS/FAIL in _findings.md by row ID.

## Acceptance criteria
- Two tabs (Checklist | Budget) switch panels; only one panel visible at a time; default = Checklist.
- Checklist shows the Wedding template (~30 items), a working "X of N done · NN%" progress bar, check/uncheck (strike-through), add custom item, delete item (with confirm).
- Budget: set a total → Total/Spent/Remaining compute live; add an expense → Spent rises, Remaining falls, category bar appears; edit + delete expense work; over-budget shows "Over budget by ₹X" honestly.
- All money rendered in en-IN grouping (₹12,50,000) with tabular figures; INR only.
- No console errors; matches sibling pages' chrome.

## Test matrix

### 1. Smoke (run FIRST — gates everything below)
- `1.smoke` — Page loads with no console errors/warnings.
- `1.styled` — Computed background is the themed surface, not unstyled default (tokens/Tailwind config loaded).
- `1.databody` — `<body data-page="planning">` present; tool-rail "Planning" item active; nav state correct.
- `1.chrome` — Floating-nav, tool-rail, breadcrumb, footer, help-FAB render and match sibling pages.

### 2. Component states
- `2.tabs` — Tab control: default / hover / selected (`aria-selected="true"`) / focus-visible; switching shows the right panel and hides the other.
- `2.checkitem` — Checklist item: unchecked → checked toggles strike-through; hover + focus-visible visible; delete icon is ≥44px, not hover-only.
- `2.expform` — Add/edit expense modal: opens centered ≥768px / bottom-sheet <768px; fields focusable; save shows loading; invalid/blank amount → `.form-error` + `aria-invalid`.
- `2.console` — No new console errors/warnings after each interaction.
- `2.noinline` — No inline `style="..."` attributes added by the build in `planning.html` (the pre-existing shell breadcrumb `style="font-size:15px"` at the chrome is exempt). Token colors/spacing come from classes, not inline styles.

### 3. Interaction & keyboard
- `3.controls` — Every control fires: tab switch, check toggle, add item, delete item, set/edit budget, add/edit/delete expense.
- `3.tablist` — Tabs are a true tablist: **both** ArrowLeft AND ArrowRight move selection/focus between the two tabs (roving tabindex), `aria-controls` points at the visible `role="tabpanel"`; TalkBack/SR announces "tab, 1 of 2".
- `3.keyboard` — Logical tab order; Enter/Space activate; Esc closes modals; add-item input submits on Enter.
- `3.modalfocus` — Modal traps focus, returns focus to trigger on close.
- `3.deadlinks` — No dead links (href → existing page or explicit `#` with comment).

### 4. Responsiveness (widths × content)
- `4.360` / `4.390` / `4.414` / `4.768` / `4.1024` / `4.1440` — no horizontal scroll, no clipped content, touch targets ≥44px on mobile.
- `4.statstack` — Stat strip is 3-up ≥768px, stacks to 1-col on mobile.
- `4.tabmobile` — Tab bar usable full-width at 360px; modal becomes bottom-sheet <768px.

### 5. Accessibility (fixed floor)
- `5.focusring` — Visible focus indicator on every keyboard-focusable control.
- `5.alt` — All meaningful icons labelled / decorative ones `aria-hidden`.
- `5.labels` — Every input (budget, amount, vendor, notes, add-item) has a programmatic label.
- `5.headings` — Single logical heading order.
- `5.coloronly` — Over-budget conveyed by icon+text not just red; category bars carry label+₹+% (not color).
- `5.reducedmotion` — With `prefers-reduced-motion: reduce`, bar-fill + reveal suppressed.
- `5.darkcontrast` — Dark mode: text/icon contrast WCAG AA (4.5:1 body, 3:1 large); AA tier honored.

### 6. Edge / sad paths (fixed)
- `6.empty` — Budget-unset first-run shows the "Set total budget" empty-cta; no-expenses state renders.
- `6.alldone` — Checklist at 100% shows the all-done state (calm cue, "Add item" still available).
- `6.error` — Blank/invalid amount in expense or budget modal shows an inline error with recovery.
- `6.overbudget` — Spent > budget shows "Over budget by ₹X" + negative Remaining honestly (not blocked).
- `6.longcontent` — 90+ char checklist item & vendor name wrap; Devanagari (~1.4× width) holds; crore-scale ₹1,20,00,000 fits the stat strip + bar amount column without breaking layout.
- `6.counts` — 1 expense vs many expenses both render; 1-category vs 8-category breakdown both render (bars sorted descending by spend).
- `6.divzero` — Spent = 0 → category % shows 0 (no NaN/Infinity); checklist length 0 (if all deleted) → progress shows 0% cleanly.

### 7. Guest-surface & device (conditional + manual)
- `7.whatsapp` — n/a (host-only page, no guest/OG surface).
- `7.device` — Mobile real-device pass on a mid-tier Android with CPU throttle; TalkBack sanity on the tablist + modals. (manual — agent: skip and flag for human)

## Definition of done
Every non-manual row PASS (deferrals documented in _findings.md), no console errors, manual rows flagged for human.
