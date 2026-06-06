# Cursor build doc — Planning Tasks rework v2 (toolbar + compact header + polish)  ·  SPEC_VERSION 2026-06-06.2

One pass, 13 changes on the Planning page. **Iterate the existing build in place — do NOT rebuild.** Touch only `designs/pages/planning/*` and `designs/shared/shell.{css,js}`. **Do NOT edit `pages/guests/` or `pages/website/`.** Reuse the guests components throughout (the whole point — match that page's patterns).

## 0 · STOP-check (wrong-worktree guard)
Open `_status.md`: it MUST read `STAGE: BUILD (Cursor)` and `SPEC_VERSION: 2026-06-06.2`. If it says `DONE`/other or an older version → STOP, you're in the wrong worktree; tell the human to open the worktree with this kit. Proceed only at BUILD/2026-06-06.2.

## Read first
- `.cursor/rules/evenzi-design.mdc` — esp. the new **even-distribution**, **no-iOS-input-zoom** rules + the mandatory **design self-review** and **self-test** passes (run both before TEST).
- `_spec.md` (this folder) — updated to 2026-06-06.2; its reuse map is authoritative.
- `designs/pages/guests/guests.{html,css,js}` — the source of the toolbar, filter chips, search, swipe rail, `openPicker`, toast. Reuse, don't reinvent.

---

## A · Layout & spacing

**1. Modal field rhythm (fields are cramped).** The task + expense modal fields butt together (`.form-group` only has `.5rem` *internal* label→input gap, nothing between groups; `.plan-modal-block` uses `gap:.15rem`). Fix:
- Add a generic scoped rule in `shell.css`: `.modal-card form .form-group + .form-group{ margin-top: 1rem }` (consistent rhythm for ALL modal forms).
- Bump `.plan-modal-block{ gap: .15rem }` → `gap: .9rem` (planning.css), and ensure the two blocks (Expense/Details) have clear separation around `.plan-modal-divider`.

**2 + 3. Compact header (adopt the website-clean pattern) — BOTH tabs.** Today the `.section-head` is tall (big title + 2-line description) with a huge gap to the tab bar and dead space on the right. Replace with a compact header + an **(i) info-disclosure** that holds the description — apply to the **Checklist panel ("Tasks")** AND the **Budget panel ("Spending tracker")**.
- **Shared shell primitive** (create in `shell.css` if not already present from the guests header work — it's the SAME primitive; reuse it): `.section-head--compact` (smaller top margin, title one size down), `.section-head-titlerow` (flex row: title + info button), `.section-head-info` (small `info` icon-button, ≥44px hit area, `:focus-visible`), `.section-head-tip` (popover below the button, `max-width:min(320px,calc(100vw-2rem))`, hidden by default). Shell.js: delegated `[data-info-tip]` handler — reveal on **hover (pointer-fine) + focus + tap**, Esc/outside-click close, `aria-expanded`. (Identical to `designs/pages/guests/_header-compact.md` — if that ran first, just reuse; if not, create it here.)
- In `planning.html`, convert BOTH section-heads: keep the eyebrow ("CHECKLIST"/"BUDGET") + title; move the existing `.section-head-sub` text **verbatim** into a `.section-head-tip`, add the `.section-head-info` button (`aria-describedby` → the tip). Mobile: title + (i) stack below the breadcrumb; tip opens below; no 360px overflow.
- **Collapse the tab→head gap:** `.plan-tabs-wrap{margin-bottom:1.5rem}` + `.section-head{margin-top:1.25rem}` stack to 2.75rem. Set `.plan-panel .section-head{margin-top:0}` and reduce `.plan-tabs-wrap` margin-bottom to ~`1rem` → ~1rem total. Tighten head→card to ~1rem.

**4. List/Timeline toggle → full width.** Drop the cap: `.plan-view-toggle{ width:100%; max-width:220px }` → remove `max-width` so it spans the row (List/Timeline each ~50% via the existing `flex:1`), matching the Checklist|Budget bar.

---

## B · Tasks toolbar (mirror the guests toolbar — reuse its components)

Add a toolbar to the **Checklist panel**, structured like `pages/guests/guests.html`'s `.gm-toolbar`. Build a page-local `.plan-toolbar` modeled on `.gm-toolbar` (column on mobile, row ≥768). Order, top→bottom of the Tasks panel: progress row → **toolbar** → **status chips** → List/Timeline toggle → (Timeline: date bar) → list.

**5. Search** — reuse `.form-input-search` (shell): `<input type="search">` "Search tasks…" + clear button. Filters the list/agenda by task label (case-insensitive). Both views.

**6. Status filter chips** — reuse `.dp-filter-chips` + `.dp-filter-chip` (the guests RSVP-chip component), `role="radiogroup"`: **All · To-do · Done · Overdue**, each with a live count (`taskStatus`: done→Done; `!done && due<TODAY`→Overdue; else To-do). Default All. Applies in both views.

**7. Sort** — reuse the guests `.gm-sort` button pattern + `openPicker` menu: **Due date** (default) / **Priority** / **A–Z**. **List view only** (Timeline is date-grouped — hide/disable Sort in Timeline). Re-sorts the List.

**8. Sub-event Filter** — reuse the guests `.gm-filter-btn` + `openPicker`: a Filter button opening a single-select of `EVENT_SUBEVENTS` (+ "All"/"Whole event"). Filters tasks by sub-event. This **supersedes** the row sub-event chip's tap-to-filter — keep the row chip as a label, route filtering through this control (avoid two filter mechanisms; update the chip's behavior accordingly). Show a count badge when active (like `.gm-filter-count`).

**9. Select (relocate)** — move the existing `#plan-select-mode` "Select" button OUT of its current spot INTO the toolbar action row (with Filter/Sort), matching guests where Select sits in the action row.

**Filter composition:** search ∧ status ∧ sub-event are ANDed; Sort orders the result; the date bar filters in Timeline. The whole-event progress stays global; the existing "· N shown" caption reflects the filtered count. One polite live-region announces the result count on any filter change (reuse `#plan-task-live`).

**12. Even spacing on mobile** — the toolbar action row (Filter · Sort · Select) and the status-chip row must **distribute evenly across the width on mobile** (`justify-content:space-between` or equal `flex:1`), never clumped left with dead space (per the design rule). Desktop may auto-size.

---

## C · Interaction & visual polish

**10. Swipe-rail redesign.** The current rail is garish (vivid green/red/pink slabs). Redesign `.task-row-rail` + its buttons (`planning.css`) to be on-brand:
- Icons + short label: **Complete** `check_circle` (success token), **Edit** `edit` (neutral/`--ink`), **Delete** `delete` (`--danger`). ~22px icon over an uppercase label.
- Use **semantic tokens at refined saturation** (tinted/muted backgrounds with the colored icon/label) — NOT full-saturated blocks. Equal-width buttons, rounded to match the card's corner radius so the rail reads as part of the surface.
- Keep the CSS scroll-snap mechanism + the `aria-hidden`/`tabindex=-1` rail (keyboard/SR use the checkbox + modal/bulk). This is a visual-only refinement of the existing rail.

**11. Complete → toast + Undo.** When a task is marked done (checkbox, swipe-Complete, or bulk-Complete), show a toast: **"Task completed · Undo"** (bulk: "N tasks completed · Undo"). Undo reverts the task(s) to not-done within the dismiss window (~5s).
- **Extend the shell toast** (the `#bc-toast` / `window.evenzi` toast mechanism in `shell.js`) to support an optional **action button** — build it generic (`window.evenzi.toast(message, {actionLabel, onAction})`) so Delete-with-undo etc. can reuse it. If the shell toast can't carry an action yet, add that capability in `shell.js`/`shell.css` (generic).
- A11y: toast is a polite live region; the Undo is a real focusable `<button>`; `prefers-reduced-motion` suppresses the slide.

---

## D · Shell-wide fixes (apply in `shell.css` — fixes planning AND every page)

**13. No iOS input-zoom.** Add: `@media (max-width:767px){ .form-input, .form-input-field, select.form-input, textarea.form-input { font-size:16px } }` so focusing an input on iOS doesn't auto-zoom + shift the layout. (Inputs are 14px today — under the 16px threshold.) Do NOT add `maximum-scale`/`user-scalable=no`. Confirm the modal sticky footer (Save/Cancel) stays put when the keyboard opens.

*(Item 12's even-distribution is already in the design rule; apply it to the planning toolbar per section B.)*

---

## Data / state (planning.js)
- New filter state: `searchQuery`, `statusFilter` ('all'|'todo'|'done'|'overdue'), `sortKey` ('due'|'priority'|'label'), `subEventFilter` (id|null). `visibleTasks()` ANDs search ∧ status ∧ sub-event; List applies `sortKey`; counts feed the chips + the "· N shown" caption + the live region.
- Existing `taskStatus`, `EVENT_SUBEVENTS`, `TODAY`, `sortTasks` are reused/extended. No `new Date()` in render. createElement/textContent only (no innerHTML).

## Self-review + self-test (MANDATORY before STAGE: TEST)
Run both passes from `.cursor/rules/evenzi-design.mdc`. Specifically verify: modal fields have breathing room; both headers compact with working (i) tip (hover+focus+tap, Esc, no 360px overflow); toggle full-width; toolbar + chips filter/sort correctly and are evenly spaced at 360px; swipe rail on-brand; complete→toast+Undo works (checkbox/swipe/bulk) and Undo reverts; **no input-zoom on a real iOS check** (or simulate); `git status` shows only `designs/pages/planning/*` + `designs/shared/shell.*`. Then bump `_status.md` → `STAGE: TEST`.

## When done
`_status.md` → `STAGE: TEST`, `NEXT: open Antigravity → _antigravity-prompt.md`. Antigravity tests, then `/spec-kit-review planning` closes it.
