# Cursor build runbook — Planning (`planning`)  ·  SPEC_VERSION 2026-06-06.1 (REWORK)

You are reworking the Evenzi **Planning** page in `designs/pages/planning/`. The page already exists and shipped (Checklist + Budget). This pass **expands the Checklist tab into a light task manager** and restyles the section tabs. **The Budget tab and all page chrome stay untouched.** Everything you need is in this folder.

## 0 · STOP-check before you build (wrong-worktree guard)
This repo has **many git worktrees**, and this kit lives in exactly ONE of them. If you were opened in the wrong folder you will silently build against a stale kit. Before doing anything else:
1. Open `_status.md` (this folder). It MUST read **`STAGE: BUILD (Cursor)`** and **`SPEC_VERSION: 2026-06-06.1`**.
2. If it says `STAGE: DONE` (or any non-BUILD stage, or an older `SPEC_VERSION`) → **STOP. Do not build.** You are almost certainly in the wrong worktree/branch. Tell the human verbatim: *"This folder's `_status.md` is at `<stage>` / `<version>`, not `BUILD` / `2026-06-06.1` — I'm likely in the wrong worktree. Please open the folder that holds the BUILD kit and re-run me. I can't switch worktrees myself."*
3. Proceed only when STAGE is BUILD.

## 1 · TOP RULE (the one that breaks shipped pages)
**Do NOT edit ANY file under `designs/pages/guests/` or `designs/pages/website/`.** The FAB, bulk-bar, and pill-tabs are **alias-first** promotions into `designs/shared/shell.css` — you add the generic classes + aliases in shell.css; the guests/website source stays byte-identical. After building, your `git status` must show changes only under `designs/pages/planning/` and `designs/shared/shell.css`.

## Read first
1. `_spec.md` (this folder) — the build source of truth. The reuse map + "Design-system note" + "Council notes folded in" are authoritative. Build exactly what it specifies.
2. `designs/components.html` — component catalog. Reuse before creating.
3. `designs/pages/guests/guests.{html,js,css}` — known-good sibling; copy its IIFE conventions (`'use strict'`, `$`/`$$`/`el`/`icon`, `createElement`/`textContent`, **no `innerHTML`**), its **CSS scroll-snap swipe rail**, its `openPicker`, and its FAB/bulk-bar chrome.
4. `designs/pages/website/website.css` (`.wb-tab*`) — the pill sub-tab you are promoting to shell.

## Step 0 — what already exists (DO NOT alter)
`planning.html` has the canonical `<head>`, chrome (scroll-progress, floating-nav, tool-rail, `.bc-wrap` breadcrumb, footer, help-FAB, toast), `<body data-page="planning">`, the **section tab bar**, the **Budget panel + its 3 modals**, and the **Checklist panel**. **Keep the head, chrome, and the entire Budget tab.** You are: (a) restyling the section tab bar to the pill look, (b) rebuilding the Checklist panel into the Tasks experience, (c) adding the task modal + Add FAB + bulk bar, (d) promoting 3 shell primitives alias-first.

## 🚧 Hard guardrails (violating any = rebuild)
- **Design tokens only.** No hardcoded hex/px. No inline CSS or JS, ever. Generic → `designs/shared/shell.css`; page-specific → `designs/pages/planning/planning.{css,js}`. Load order: shell.* before planning.*.
- **Alias-first promotions — DO NOT EDIT other pages' source.**
  - Promote website `.wb-tab`/`.wb-tabs` → generic **`.pill-tabs`/`.pill-tab` (+`.pill-tabs--sm`)** in `shell.css`, carrying the exact website tokens. Alias `.wb-tabs`→`.pill-tabs`, `.wb-tab`→`.pill-tab`. **Touch zero files under `pages/website/`.**
  - Promote guests `.gm-add-fab` → **`.add-fab`** and `#gm-bulkbar`/`.gm-bulk-act` → **`.bulk-bar`** (chrome only) in `shell.css`, carrying `var(--dark-card)`. Alias the guests selectors. **Touch zero files under `pages/guests/`.**
  - Each alias gets a comment: `/* alias — migrate <page> source to <new class> in follow-up ticket */`.
  - **Do NOT promote guests' row-selection rendering** (avatar corner-checkbox, `is-selecting`). Planning builds its own `.task-row` selected state.
- **Swipe = CSS scroll-snap, NOT JS.** Row = `overflow-x:auto; scroll-snap-type:x mandatory`; surface = `flex:0 0 100%; scroll-snap-align:start`; rail = `scroll-snap-align:end`, buttons `tabindex="-1"` + `aria-hidden`. `planning.js` adds ONLY a delegated **click** router for `[data-swipe]` (mirror `guests.js:506`). No `translateX`/open-close state.
- **Swipe a11y parity** — every swipe action has a focusable equivalent (Complete = the row checkbox; Edit/Delete via modal/bulk). The rail is never the only path.
- **One `TODAY` constant** — `var TODAY = '2026-06-04'` drives ALL date logic (relative labels, today chip, overdue, grouping, default sort). **No `new Date()` in the render path.** Compare ISO strings lexically.
- **Pill tabs stay a tablist** — restyle only; section bar keeps `role="tablist"` + `role="tab"` + `aria-selected` + roving tabindex. View toggle = `role="radiogroup"` with **keydown scoped to its own element** (arrows must not bubble to the tab handler).
- **Render from data**, derive on every render (guard ÷0). Indian currency unchanged (en-IN, `tabular-nums`). Mobile-first 360px, ≥44px, hover-guard every `:hover`, `@supports` glass fallback, `prefers-reduced-motion`, dark mode + semantic status tokens.

## Data model (define in `planning.js`)
- `var tasks = [{ id, label, done, due, subEvent, priority, notes }]` — replaces old `checklist`. `due`=ISO|null; `subEvent`=`EVENT_SUBEVENTS` id|`null`(=**"Whole event"**, one meaning only); `priority`=`'low'|'med'|'high'` (default med); `notes`=`trimmed||null`.
- `var EVENT_SUBEVENTS = [{ id, label }]` — **copy the guests shape + seed + spelling verbatim** (`haldi`/`mehendi`/`sangeet`/`wedding`/`reception`) + a `subEventLabel(id)` helper.
- `var TODAY = '2026-06-04'`. Seed Wedding `TEMPLATES['wedding']` (~30) with `priority`, a deliberate `due` spread computed as `TODAY + offsetDays` (seed table in `_spec.md`: ≥2 overdue, ≥2 today, ≥2 tomorrow, several future, ≥3 null; ≥2 high), and `subEvent` where natural (validate each key against `EVENT_SUBEVENTS`, `console.warn` on miss). Birthday/Corporate = data swap (med/null/null).
- **Budget model (reworked):** `budget` unchanged. Rename `CATEGORIES` → `var EXPENSE_TYPES = [{ id, label, icon, custom }]` — **KEEP `icon`** (rows + breakdown render it); seed the original 8 with their icons. Add a `typeById(id)` helper (mirror the old `catByKey`) with a fallback → "Miscellaneous" for unresolved ids. Custom types: id = **`'custom-' + nextId++`** (NOT `slug(label)` — never make the label the identity), `icon:'sell'`; on "+ Add type" **dedupe by case/trim-insensitive label** (match → select existing, don't mint a colliding id). `var expenses = [{ id, amount, type, vendor, subEvent, receipt, date, notes }]` — `type`=`EXPENSE_TYPES` id; `subEvent`=`EVENT_SUBEVENTS` id|`null`(=Whole event, event implicit/preselected; import the SAME `EVENT_SUBEVENTS`/`subEventLabel` as tasks); `receipt`=**always `null` in the saved record** (preview is transient modal state, not persisted); `date`=ISO, default `TODAY` (`exp?.date || TODAY`, never `new Date()`); `vendor`/`notes`=`trimmed||null`. **Breakdown iterates `EXPENSE_TYPES` incl. customs** keyed by `type` (NOT the static seed). Flip `category`→`type` in ALL sites atomically (totals keying, breakdown source, save/edit/delete, delete-copy); `.pf-bar` math is field-agnostic.
- Helpers: add `fmtDate(iso)` / `relDay(iso, TODAY)` ("14 Jun"/"Today"/"Tomorrow"/"No date"), sibling of the existing `fmtINR`.
- **Default List sort** (derived): overdue → today → upcoming(asc date) → undated; priority (high→med→low) tiebreak within each bucket.

## Build steps
1. **Section tabs → pill.** Add `.pill-tabs`/`.pill-tab`(+`--sm`) to shell (alias website). Restyle the existing Checklist|Budget tablist to `.pill-tabs` (keep all tab a11y).
2. **Tasks panel — structure.** Above the swappable body (static siblings): the whole-event `.pf-bar` progress row + a "· N shown" caption slot; the **List⇄Timeline** `.pill-tabs--sm` radiogroup (default List).
3. **List view.** The default-sorted `.task-row` list — **no inline quick-add bar** (adding is via the FAB; see step 5). Build `.task-row` as a **guest-style surface card** mirroring `.guest-row-surface` (surface, radius, two-line head + meta strip, swipe rail): `[done checkbox] · { title (line 1) + meta strip (line 2: due chip → sub-event chip → priority dot, `flex-wrap`, priority text ≥768) } · [status badge] · CSS scroll-snap swipe rail (Complete/Edit/Delete)`. Done = `:has()` strike. **`.task-status-badge`** (modifier on `.status-badge`) in the guest-row badge slot: **To-do / Done / Overdue** (derived: `done`→Done; `!done && due<TODAY`→Overdue; else To-do; icon+text, never color-only). Overdue → red due-chip + Overdue badge. **Row surface click opens the edit modal prefilled** (ignore clicks on the checkbox, status badge, and swipe rail — NOT a stretched-link). Sub-event chip is a `<button aria-pressed>` that filters the List (live-region count).
4. **Timeline view.** `.task-datebar` (stable container: month/year + ‹ › pager + scroll-snap day chips + "All" pill; auto-scroll Today into view). Agenda of `.task-row`s grouped under `.task-date-group` headings incl. "No date". Tapping a day filters; re-render the **agenda body only** (reserve min-height); update the live region.
5. **Add FAB** (`.add-fab`) — the **only add affordance** (no inline quick-add), context-aware (Checklist→**task add modal**, Budget→expense modal); `selectTab` updates its `aria-label`; hidden while bulk bar open; list/agenda scroll area padded so the last row isn't covered. Switching to Budget mid-selection calls `exitSelect()`.
6. **Task modal** (`.modal-card`/`.modal-static-sheet`) — Task (required) · Due date (native `<input type="date">`, optional) · Sub-event (`.form-select`: labels + "Whole event"; **hide the field if `EVENT_SUBEVENTS` is empty**) · Priority (`.task-prio-pills` radios) · Notes (optional). Add/edit same modal. Blank title → `.form-error` + `aria-invalid`.
7. **Bulk bar** (`.bulk-bar`) — selection mode (Checklist-only): Complete · Set date · Assign sub-event · Delete; count + cancel; FAB hidden while shown.
8. **Budget — expense modal rework** (rest of Budget tab unchanged). Restyle the breakdown heading to "Spending by type". **Group the modal into 2 labelled blocks** with a `--line` divider: **"Expense"** (Amount · **Expense type** · Vendor) and **"Details"** (Event/Sub-event · Receipt · Date · Notes). Fields:
   - **Expense type** — `.form-select` from `EXPENSE_TYPES` + inline **"+ Add type"** `.expense-type-add`: reveals an input, **Add disabled until non-blank + label de-duped (case/trim-insensitive)**; appends a custom (`id:'custom-'+nextId`, `icon:'sell'`), appends ONE `<option>` (don't rebuild the select), selects it, re-renders the breakdown; Esc/Cancel reverts + returns focus to the trigger.
   - **Event tag** — `.expense-event-chip`: static `--brand-tint` pill + lock icon + "This event", **no border/chevron, not focusable**. Optional **Sub-event** `.form-select` (`EVENT_SUBEVENTS` + "Whole event", `null`↔`value=""`; hide the field if no sub-events).
   - **Receipt** — `.receipt-upload` (LABELED STUB): styled `<label for>` "Upload receipt or image" + a "Prototype — won't save yet" hint; `<input type="file" accept="image/*">` → `FileReader.readAsDataURL` thumbnail (fixed 4:3 `object-fit:cover`) + middle-ellipsis filename + focusable **Remove** (clears input `.value`, restores empty, returns focus to trigger). **No network.** `receipt` stays `null`; preview cleared on save/close.
   - **Date** — native `<input type="date">`, `.value = exp?.date || TODAY`.
   - Keep **Vendor** + **Notes**. **Edit prefills all 7** (guard the sub-event line when the field is absent; receipt always opens empty).
   - **Mobile (<768):** `.modal-static-sheet` with internally-scrolling body + **sticky Cancel/Save footer** + safe-area + `scroll-margin` (tallest sheet on the page).
   - Group expenses + the breakdown by `type` (iterate `EXPENSE_TYPES` incl. customs).
9. **States** — cover all in `_spec.md` Interaction states + empties (no-tasks, all-done, day-with-none, no-sub-events, receipt empty/chosen, +Add-type expanded).
10. **Self-check** — every reuse-map row honored; no inline styles; no edits under `pages/guests/` or `pages/website/`; `data-page` intact; no `new Date()` in render; both views render from `tasks`; expenses render from `expenses` with `type`/`subEvent`/`date`; receipt is a stub (no network).

## NOT in scope (do not add)
Assignees/co-planners; subtasks; time-of-day; reminders/notifications; recurring tasks; multi-line descriptions; drag-reschedule; full month-grid calendar; activity feed; a dedicated sub-event filter axis (the tappable chip is the lite version); multi-currency; budget export. **Receipt upload = UI stub only (no real storage/network).** **Custom Expense types = prototype-local** (do NOT build an Event Settings screen — just allow inline add + a code comment that the canonical source is Event Settings).

## When done
Update `_status.md`: `STAGE: TEST`, `UPDATED: <today> — Cursor`, `NEXT: open Antigravity → read _antigravity-prompt.md → execute`.
