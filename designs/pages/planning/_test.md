# Test plan — Planning (`planning`)  ·  against SPEC_VERSION 2026-06-06.1

> Test source of truth. Antigravity tests **only** from this file. Run every row; record PASS/FAIL in _findings.md by row ID.
> REWORK pass: Checklist tab → task manager + pill section tabs. Budget tab unchanged (rows retained as regression checks).

## Acceptance criteria
- Section tabs use the pill style (`.pill-tabs`/`.pill-tab`) yet remain a true tablist; Checklist|Budget switch panels; default Checklist.
- Tasks tab: List⇄Timeline toggle (default List); whole-event progress bar persists across toggles; **the FAB opens the add modal (no inline quick-add), and tapping a row opens edit**; rows are guest-style cards showing due chip + sub-event chip ("Whole event" for null) + high-priority dot + a To-do/Done/Overdue **status badge**; default List sort = overdue→today→upcoming→undated, priority tiebreak.
- Timeline: date bar (month pager + day chips + "All") filters the agenda; Today auto-scrolls into view; agenda groups incl. "No date"; "N shown" caption appears when filtered.
- Task modal: Task(req) · Due date · Sub-event · Priority · Notes; add/edit; blank title errors; sub-event field hidden if no event sub-events.
- Add FAB context-aware (task vs expense); swipe rail works AND every swipe action has a focusable equivalent; bulk bar (Complete/Set date/Assign/Delete) with FAB hidden while shown.
- Expense modal reworked: Expense type (renamed, customizable via "+ Add type") · event tag preselected + optional sub-event · receipt upload stub (no network) · date-only date defaulting TODAY; breakdown grouped/labelled "by type"; rest of Budget tab unchanged.
- **No regression:** guests page + website page render byte-identical (alias-first promotion); no edits under `pages/guests/` or `pages/website/`.
- All money en-IN; INR only; no console errors; chrome matches siblings.

## Test matrix

### 1. Smoke (run FIRST — gates everything below)
- `1.smoke` — Page loads, no console errors/warnings.
- `1.styled` — Themed surface background (tokens/Tailwind config loaded).
- `1.databody` — `<body data-page="planning">`; tool-rail "Planning" active.
- `1.chrome` — Floating-nav, tool-rail, breadcrumb, footer, help-FAB render, match siblings.
- `1.noregress` — **Open `pages/guests/guests.html` and `pages/website/website.html`** (or overview.html): FAB / bulk-bar / sub-nav render visually unchanged; no console errors. Confirms alias-first promotion didn't break shipped pages. `git status` shows NO modified files under `pages/guests/` or `pages/website/`.

### 2. Component states
- `2.pilltabs` — Section tab bar uses `.pill-tabs`/`.pill-tab`; active tab = brand-tint fill + brand text/icon; default/hover(guarded)/selected(`aria-selected="true"`)/focus-visible; overflow scrolls with right-edge fade.
- `2.viewtoggle` — List⇄Timeline `.pill-tabs--sm` radiogroup: default/hover/selected(`aria-checked`)/focus-visible; toggling swaps body but the progress bar persists (not rebuilt).
- `2.taskrow` — Task row is a guest-style surface card (two-line: title + meta strip): done checkbox toggles strike; hover + focus-within; due chip + sub-event chip + (high) priority dot render; meta wraps below title in order due→sub-event→priority at 360px.
- `2.taskstatus` — Trailing `.task-status-badge` shows To-do / Done / Overdue (icon+text, not color-only), derived correctly: a done task = Done; an undone task with `due<TODAY` = Overdue (+ red due-chip); else To-do.
- `2.taskmodal` — Add/edit task modal: centered ≥768 / bottom-sheet <768; Task/Due/Sub-event/Priority/Notes focusable; save loading; **blank Task → `.form-error` + `aria-invalid`**; edit prefills.
- `2.priority` — Priority dot renders ONLY for high (and low if built); med = no dot; each non-default has `aria-label` ("Priority: High") + text ≥768 (never color-only).
- `2.datebar` — Date bar: month/year header + ‹ › pager + scroll-snap day chips + leading "All" pill; today + selected(`aria-pressed`) states; chips ≥44px.
- `2.expform` — Add/edit expense modal (REWORKED): centered/sheet; fields in order Amount(req) · Expense type · Vendor · Event tag + Sub-event · Receipt · Date · Notes; blank amount → `.form-error` + `aria-invalid`; edit prefills all.
- `2.exptype` — "Expense type" select (renamed from Category) lists `EXPENSE_TYPES` with icons; breakdown heading reads "Spending by type". A new custom type added via "+ Add type" appears in the select, is selected, AND shows in the breakdown once it has spend (breakdown iterates customs, not just the seed). An expense with an unresolved/missing `type` falls back to "Miscellaneous" (no blank/error).
- `2.exptypeadd` — "+ Add type": Add is disabled until the input is non-blank; a label matching an existing type (case/trim-insensitive, e.g. "venue"/"Venue ") does NOT mint a duplicate (selects the existing); Esc/Cancel reverts and returns focus to the "+ Add type" trigger; the new type's id is a `custom-*` id, not a label slug.
- `2.expevent` — Event tag chip is preselected, read-only, NOT focusable (no chevron/border, has lock icon + "This event"); the optional Sub-event select reuses `EVENT_SUBEVENTS` + "Whole event" (`null`↔`""`) and the field hides when the event has no sub-events.
- `2.receipt` — Receipt (labeled stub): empty shows the styled upload label + a "won't save yet" hint; choosing an image shows a fixed-ratio thumbnail + middle-ellipsis filename + a focusable Remove; Remove restores empty and returns focus to the trigger. **No network request fired.** Re-opening the saved expense shows receipt empty (preview not persisted).
- `2.expgroup` — The expense modal is grouped into two labelled blocks ("Expense" / "Details") with a divider; on <768 it's a bottom-sheet with an internally-scrolling body and a **sticky Cancel/Save footer** (Save reachable with the keyboard open).
- `2.expdate` — Expense date is a date-only picker defaulting to TODAY; saved expense carries the date; edit prefills it.
- `2.console` — No new console errors/warnings after each interaction.
- `2.noinline` — No inline `style="..."` added by the build in `planning.html` (pre-existing chrome `style="font-size:15px"` exempt).

### 3. Interaction & keyboard
- `3.fabadd` — The FAB is the only add path (no inline quick-add bar exists): on the Checklist tab it opens the task **add** modal with all fields; saving appends a `.task-row`.
- `3.tapedit` — Tapping a task row's surface (not the checkbox, status badge, or swipe rail) opens the **edit** modal prefilled; checkbox/badge/rail clicks do NOT open it.
- `3.sort` — List default order = overdue → today → upcoming(asc) → undated; priority breaks ties within a bucket (a high task precedes a med task on the same date).
- `3.chipfilter` — Tapping a row's sub-event chip filters the List to that sub-event (`aria-pressed`), live region announces "Showing <sub-event> — N tasks"; tapping again clears.
- `3.datefilter` — Timeline: tapping a day chip filters the agenda to that day; "All" restores; live region announces the count; only the agenda body re-renders (date bar scroll position + selected chip persist).
- `3.todayscroll` — On opening Timeline, the date bar auto-scrolls so Today is visible.
- `3.todayjump` — A "Today" chip after "All" selects today's date (filters the agenda to today) and scrolls it into view; `aria-pressed` reflects when today is the active filter; keyboard-focusable with a focus ring.
- `2.pillglow` — Pill-tab containers (section tabs + List/Timeline toggle) have NO red glow/halo — flat, border-only (`box-shadow:none`), matching the guest filter chips; the active pill still reads via brand-tint fill + brand text. Same holds on the Website page's tabs (shared `.pill-tabs`).
- `3.fabcontext` — Add FAB opens the task modal on Checklist tab and the expense modal on Budget tab; `aria-label` reflects the active tab.
- `3.bulk` — Selection mode shows the bulk bar (FAB hidden); Complete / Set date / Assign sub-event / Delete act on selected tasks; actions disabled at 0 selected; Cancel exits. Switching to Budget tab mid-selection exits selection first.
- `3.swipe` — Swipe rail reveals Complete/Edit/Delete via horizontal scroll-snap and they fire on click.
- `3.swipea11y` — Every swipe action has a non-swipe focusable equivalent (Complete = row checkbox reachable by keyboard; Edit/Delete via modal/bulk). Rail is `aria-hidden`/`tabindex=-1` — SR/keyboard never depends on it.
- `3.tablist` — Section tabs are a true tablist: BOTH ArrowLeft AND ArrowRight move selection (roving tabindex); `aria-controls` → visible `role="tabpanel"`; SR announces "tab, 1 of 2".
- `3.togglekeys` — View-toggle radiogroup arrow keys move within the toggle only and do NOT bubble to the tab handler (focus stays in the toggle).
- `3.keyboard` — Logical tab order; Enter/Space activate; Esc closes modals.
- `3.modalfocus` — Modal traps focus, returns focus to trigger on close.
- `3.deadlinks` — No dead links (href → existing page or explicit `#` with comment).

### 4. Responsiveness (widths × content)
- `4.360` / `4.390` / `4.414` / `4.768` / `4.1024` / `4.1440` — no horizontal scroll, no clipped content, ≥44px targets on mobile.
- `4.metawrap` — Row meta trio (due + sub-event + priority) wraps deterministically under the title with a long task name at 360px; no overlap/clipping.
- `4.fabclear` — FAB does not obscure the last task row (scroll area bottom-padded ≥ FAB + safe-area); FAB and bulk bar never co-occupy the bottom slot.
- `4.statstack` — (regression) Budget stat strip 3-up ≥768, 1-col mobile.
- `4.tabmobile` — Pill tab bar usable full-width at 360px (scrolls if needed); task modal → bottom-sheet <768.

### 5. Accessibility (fixed floor)
- `5.focusring` — Visible focus on every keyboard-focusable control (tabs, toggle, day chips, chip filter, rows, modal fields, FAB).
- `5.alt` — Meaningful icons labelled; decorative `aria-hidden`.
- `5.labels` — Every input (task title, due, sub-event, priority, notes, budget, amount, vendor, expense date, "+ Add type") has a programmatic label.
- `5.headings` — Single logical heading order.
- `5.coloronly` — Overdue conveyed by icon/text not just red; priority by dot+label not color; over-budget badge icon+text.
- `5.reducedmotion` — `prefers-reduced-motion: reduce` suppresses bar-fill, reveal, swipe affordance, FAB micro-motion.
- `5.darkcontrast` — Dark mode contrast WCAG AA (4.5:1 body, 3:1 large); pill active state legible.

### 6. Edge / sad paths
- `6.empty` — (regression) Budget-unset shows "Set total budget"; no-expenses renders. Tasks: no-tasks state renders.
- `6.alldone` — Checklist at 100% shows the all-done state; the FAB add path still available.
- `6.nodate` — Tasks with `due:null` collect in the Timeline "No date" group; a day with no tasks shows "Nothing due on <date>".
- `6.nosubevents` — When `EVENT_SUBEVENTS` is empty, the task modal's Sub-event field AND the row chip are hidden everywhere (degrades to a plain checklist) — no empty dropdown.
- `6.overdue` — A task with `due < TODAY` and not done shows the overdue (red) due-chip.
- `6.whole` — A task with `subEvent:null` renders the chip as "Whole event" (not "No sub-event") in both row and modal.
- `6.error` — (regression) Blank/invalid amount in expense/budget modal shows inline error.
- `6.overbudget` — (regression) Spent > budget shows "Over budget by ₹X" + negative Remaining honestly.
- `6.longcontent` — 90+ char task & vendor names wrap; Devanagari (~1.4×) holds; crore-scale ₹1,20,00,000 fits the budget stat strip.
- `6.divzero` — Spent = 0 → category % shows 0 (no NaN); tasks length 0 → progress 0% cleanly.
- `6.nodatemath` — No `new Date()` in the render path: the seeded "Today/Tomorrow" labels + today chip are anchored to `TODAY=2026-06-04` and render deterministically (not the real current date).

### 7. Guest-surface & device (conditional + manual)
- `7.whatsapp` — n/a (host-only page, no guest/OG surface).
- `7.device` — Mobile real-device pass on a mid-tier Android with CPU throttle; TalkBack sanity on the pill tablist, view toggle, date bar, task modal; crore-scale ₹ fit at 360px. (manual — agent: skip and flag for human)

## Definition of done
Every non-manual row PASS (deferrals documented in _findings.md), no console errors, no source edits under `pages/guests/` or `pages/website/`, manual rows flagged for human.
