# Spec — Planning (`planning`)  ·  SPEC_VERSION 2026-06-06.1

> Build source of truth. Cursor builds **only** from this file. Filled by `/spec-kit` from the
> feature overview + design system + council review. Overwritten on re-run (SPEC_VERSION bumps).

> **⚠️ REWORK (2026-06-06).** Expands the **Checklist tab into a light task manager** — due dates, a
> List⇄Timeline view with a date-filter bar, single sub-event link per task, Low/Med/High priority, and
> Guest-Management-style interactions (floating Add FAB, swipe row actions, bulk select). Adopts the
> **website module pill sub-tab look** for the page's section tabs. The **Budget tab is unchanged** from
> 2026-06-05.2. Product-owner decision (Abhijith) consciously **lifts the overview's "no due dates"
> deferral** and **adds sub-event linking**. Guiding principle: *"simple, all the features but simple."*
> Reviewed by design council (ui_ux_designer + frontend_engineer + tech_lead + product_manager, debate +
> arbiter) — all critical/important findings folded below; arbiter rulings inline.

## Goal & user
- **Primary user:** Host (event owner) only — no guest surface.
- **User goal:** Stay on top of every planning task — now also *when* it's due and *which sub-event* it belongs to — and know where the money goes (budget), in one place. The page must answer **"what do I do next?"** (see default List sort).
- **Overview source:** docs/features/overviews/planning-tools-overview.md — this rework **supersedes** its "no due dates" checklist guard.
- **a11y tier:** AA (host surface behind auth). **Share/OG:** n/a (behind auth).

## Starting point
`designs/pages/planning/planning.html` exists with the canonical `<head>` + chrome + a working two-tab body (Checklist | Budget) at 2026-06-05.2. **Keep all chrome and the entire Budget tab + its modals.** Rework **only the Checklist panel** (`#plan-panel-checklist`); restyle the in-page tab bar to the pill look; add the task modal, Add FAB, and bulk bar. Reuse-reference page for interaction patterns: `designs/pages/guests/guests.{html,js,css}`.

## Page composition (top → bottom)
1. **Page header** (existing) — keep.
2. **Section tab bar → pill style** — segmented **Checklist | Budget**, restyled to the promoted **`.pill-tabs`/`.pill-tab`** look (see Design-system note). Stays a **true tablist** (buttons, `role="tab"`, `aria-selected`, roving tabindex, default Checklist). Visual change only.
3. **Checklist panel → "Tasks"** (`role="tabpanel"`) — REWORKED:
   - **Whole-event progress summary** (X of N done · NN%, existing `.pf-bar`) — a **static sibling** above the swappable view body (NOT destroyed on view toggle); reflects ALL tasks. In Timeline/filtered states, render a small **"· N shown"** caption next to it so the global count never reads as a bug.
   - **View toggle: List ⇄ Timeline** — `.pill-tabs.pill-tabs--sm` **radiogroup** (subordinate to the section tabs). Default **List**.
   - **List view** (default): flat task list, **default-sorted** (see Data model), each row = `.task-row` (rich guest-style card — see reuse map). **Adding is via the FAB only** (no inline quick-add bar); **tap a row (outside the checkbox/swipe) → edit modal, prefilled**. *(founder override of council UIUX#2: FAB→modal chosen over inline quick-add)*
   - **Timeline view**: a horizontal **date-filter bar** (`.task-datebar`: month/year header + ‹ › month pager + scrollable day chips + leading **"All"** pill) above an **agenda** of `.task-row`s grouped under date headings ("Today"/"Tomorrow"/"Sat 14 Jun"/… + trailing **"No date"**). Tap a day → filter to that day; "All" → full grouped agenda. **Auto-scroll Today into view on open.**
   - **Floating Add FAB** (`.add-fab`, bottom-right, icon-only) — the **primary add affordance**, context-aware: Checklist tab → **task add modal** (all fields up front), Budget tab → **expense** modal. List/agenda scroll area gets bottom padding ≥ FAB height + safe-area so the last row isn't obscured.
   - **Bulk-select bar** (`.bulk-bar`, floating bottom) — selection mode: **Complete · Set date · Assign sub-event · Delete**. Checklist-only.
4. **Budget panel → add/edit-expense modal REWORKED** (rest of the tab unchanged). Total/Spent/Remaining strip, the breakdown (now **grouped & labelled by Expense type**), expense list, and the set-budget modal stay. The **add/edit-expense modal** gains, in order: Amount · **Expense type** (renamed from Category — customizable list whose canonical source is **Event Settings**; an inline **"+ Add type"** affordance reveals an input to add one on the fly) · Vendor (optional) · **Event tag** (preselected, read-only chip) + optional **Sub-event** (single-select, `EVENT_SUBEVENTS`) · **Receipt** (upload **stub** — file picker + thumbnail preview + remove; no real storage in the prototype) · **Date** (date-only, defaults `TODAY`) · Notes (optional). The Add FAB drives "Add expense" when this tab is active.

## Design-system note — pill sub-tabs (promote, alias-first)
The website module sub-nav (`.wb-tabs`/`.wb-tab` in `pages/website/website.css`) is now a **2nd consumer** → promote its visual treatment to shell:
- Add generic **`.pill-tabs`** (rounded `--card` container, `--line` border, `--shadow-clay-pill`, `overflow-x:auto` scroll-snap, right-edge fade) and **`.pill-tab`** (pill, `--muted` default; hover `--brand-tint`/`--ink` behind `@media (hover:hover)`; `:focus-visible` ring; **`.is-active`/`[aria-selected="true"]` = `--brand-tint` bg + `--brand` text/icon, weight 600**) to `shared/shell.css`, carrying the **exact website tokens**.
- **Alias-first:** alias `.wb-tabs`→`.pill-tabs`, `.wb-tab`→`.pill-tab` in shell so website renders pixel-identical. **Do NOT edit any file under `pages/website/`** this pass. Leave a comment: `/* alias — migrate website source to .pill-tabs in [follow-up ticket] */`.
- **`.pill-tabs--sm`** modifier (smaller padding/font) for the subordinate List⇄Timeline toggle.
- **Visual-only:** each consumer applies its own semantics — website keeps `<a>` cross-page nav; planning's section bar is a `role="tablist"` of buttons; the view toggle is a `role="radiogroup"`.

## Element reuse map
> Rungs: reuse-as-is / modifier-extend / new. Catalog = `designs/components.html` + `designs/shared/shell.css` + `designs/pages/guests/*` + `designs/pages/website/*`.

| Element | Rung | Primitive or new-file | Notes |
|---|---|---|---|
| Section heads, progress bar, Budget strip/list/breakdown/set-budget modal | reuse-as-is | existing planning markup | `.pf-bar` reused for whole-event %; breakdown relabelled "by Expense type". Only the add/edit-expense modal changes (rows below). |
| **Pill section tabs + view toggle** | **modifier-extend → promote** | website `.wb-tab` → **new shell `.pill-tabs`/`.pill-tab` (+`--sm`)** | Alias-first promotion (see Design-system note). Section bar = tablist; view toggle = `--sm` radiogroup. |
| **Floating Add FAB** | **modifier-extend → promote (alias-first)** | guests `.gm-add-fab` → **new shell `.add-fab`** | Promote chrome to shell carrying `var(--dark-card)`; **alias `.gm-add-fab`→`.add-fab`; do NOT edit `pages/guests/`**. `env(safe-area-inset-*)`; ≥44px; **hidden while bulk bar open** (mutually-exclusive single bottom slot — matches shipped guests; never stacked). Context target set by active tab. |
| **Bulk-select bar** | **modifier-extend → promote (alias-first)** | guests `#gm-bulkbar`/`.gm-bulk-act` → **new shell `.bulk-bar`** | Promote **chrome only** to shell (carry `--dark-card`); alias guests selectors; **do NOT edit `pages/guests/`**. **Row-selection rendering stays page-local** — planning builds its own `.task-row` selected state (do NOT promote guests' avatar corner-checkbox / `is-selecting`). *(arbiter C3)* |
| **Task row** | **new (page-local), modeled on guests** | `planning.css` `.task-row` family — mirror the **`.guest-row-surface`** card treatment (surface, radius, two-line head + meta strip, swipe rail) | Layout: `[done checkbox] · { title (line 1) + meta strip (line 2: due chip · sub-event chip · priority dot) } · [status badge] · swipe rail`. Done = `:has()` strike. **Tap the row surface (not the checkbox/badge/swipe) opens the edit modal** (prefilled) — like a guest row opening detail. Multiple actions ⇒ NOT stretched-link (wire an explicit row-click → edit, ignoring clicks on the checkbox/badge/rail). **Selected (bulk) = page-local visual** (grid checkbox), not guests'. |
| **Task status badge** | **modifier-extend** | `.status-badge` family (as guests' RSVP badge sits in `.guest-row-rsvp`) → `.task-status-badge` (planning.css, 3 variants) | Trailing badge in the guest-row badge slot: **To-do / Done / Overdue**. Derived (never stored): `done` → Done; `!done && due && due<TODAY` → Overdue; else To-do. **Never color-only** — icon + text. Complements (doesn't replace) the checkbox-strike and the red overdue due-chip; it's the at-a-glance status, matching guest-row parity. |
| Swipe row actions (Complete/Edit/Delete) | **modifier-extend** | guests **CSS scroll-snap** mechanism → `.task-row` surface + rail | **CORRECTED (council FE#1):** guests swipe is **pure CSS scroll-snap**, NOT a JS transform. Build: row = `overflow-x:auto; scroll-snap-type:x mandatory`; surface = `flex:0 0 100%; scroll-snap-align:start`; rail = `scroll-snap-align:end`, buttons `tabindex="-1"` + `aria-hidden`. `planning.js` adds ONLY a delegated **click** router for `[data-swipe]` (mirror `guests.js:506`). **No transform/open-close JS.** |
| Swipe a11y parity | **constraint** | — | Rail is `aria-hidden`/`tabindex=-1`, so EVERY swipe action MUST have a focusable equivalent: Complete = the row's done checkbox; Edit/Delete = reachable via the task modal / bulk. Keyboard + SR users never depend on the rail. *(council FE blind-spot)* |
| Sub-event chip (on row) | **reuse-as-is + interactive** | `.guest-assign-chip` | Shows linked sub-event label (or **"Whole event"** when `null` — one label everywhere). **Tappable on List view → filters List to that sub-event** (tap again clears); announces via the same live region ("Showing Sangeet — 4 tasks"). No new filter control. *(arbiter C1)* |
| Priority indicator (on row) | **new (page-local)** | `planning.css` `.task-prio` | **Render a dot ONLY for `high`** (and `low` if desired); **`med` = unmarked** (kills dot-noise — most tasks are med). Never color-only: dot + `aria-label` ("Priority: High") + text label ≥768. Tokens `--danger` (high) / `--muted` (low). |
| Date-filter bar | **new (page-local)** | `planning.css` `.task-datebar` + `.task-day` | Month/year header + ‹ › pager + horizontal scroll-snap day chips + leading "All" pill + a **"Today" quick-jump chip** (after "All"; selects today's date + `scrollTodayIntoView`). Today + selected states; ≥44px chips. **Stable container** — on filter, flip `aria-pressed`/`is-selected` only; do NOT rebuild the bar. Auto-scroll Today into view on open. **Pill-tab containers carry no glow** (`.pill-tabs` box-shadow removed globally — flat, border-only, matching the guest filter chips). |
| Agenda date-group heading | **new (page-local)** | `planning.css` `.task-date-group` | "Today"/"Tomorrow"/"Sat 14 Jun"/"No date". |
| Add/edit **task** modal | **reuse-as-is (pattern)** | `.modal-card` (≥768) / `.modal-static-sheet` (<768) + `.form-*` | New instance; fields below. Mirrors expense modal add/edit pattern + `data-modal-*`. |
| Priority picker (modal) | **modifier-extend** | radio-pill pattern → `.task-prio-pills` | Low/Med/High segmented radios; one selected; keyboard-nav. |
| Sub-event select (modal) | **reuse-as-is** | `.form-select` (single) | Options from `EVENT_SUBEVENTS` + **"Whole event"** (= `null`). If the event has **no** defined sub-events → **hide this field entirely**. *(council PM#5)* |
| Due-date input (modal) | **reuse-as-is** | native `<input type="date">` styled `.form-input` | Date-only. Optional. OS-locale display (out of design scope); agenda/chip labels come from a shared formatter. |
| Delete confirm (task) | reuse-as-is | existing `#plan-delete-modal` | parameterized "Delete this task?". |
| **Expense type select + inline add** | **modifier-extend** | `.form-select` + new **"+ Add type"** `.expense-type-add` (`<button>` → inline `.form-input` + Add/Cancel) | Renamed from Category. Options from `EXPENSE_TYPES`. "+ Add type" expands an input → **Add disabled until non-blank + label de-duped (case/trim-insensitive)**; appends a custom (`id:'custom-'+nextId`, `icon:'sell'`), appends ONE `<option>` (don't rebuild the select — preserve selection), selects it, re-renders breakdown. Esc/Cancel reverts + **returns focus to the "+ Add type" trigger**. |
| Expense **event tag** (preselected) | **new (page-local)** | `planning.css` `.expense-event-chip` (read-only) | Static `--brand-tint` pill + lock/`event` icon + "This event" microcopy; **no border-box, no chevron, NOT focusable** — visually not a field. Under one "Event" group header with the sub-event select. |
| Expense **sub-event** select | reuse-as-is | `.form-select` (single) | Same `EVENT_SUBEVENTS` + "Whole event" as tasks; optional. `null`↔`value=""` sentinel. Hide the field if no event sub-events. |
| **Receipt upload (labeled stub)** | **new (page-local)** | `planning.css` `.receipt-upload` + `<input type="file" accept="image/*">` | **Founder choice: labeled prototype stub** — works (picker + preview) but carries a "Prototype — won't save yet" hint so it never reads as persisted. Mechanism: `FileReader.readAsDataURL` for the thumbnail (no `revokeObjectURL` burden). 3 states — **empty** (styled `<label for>` "Upload receipt or image" + hint) / **chosen** (fixed-ratio e.g. 4:3 `object-fit:cover` thumbnail + middle-ellipsis filename + focusable Remove) / **remove** (clears input `.value`, restores empty, returns focus to trigger). `receipt` stays `null` in the record; preview is transient (cleared on save/close). ≥44px; `loading="lazy"`. |
| Expense **date** | reuse-as-is | native `<input type="date">` styled `.form-input` | Date-only; `.value = exp?.date || TODAY` (ISO; never `new Date()`). |

## New primitives needed
> generic → designs/shared/shell.*; page-specific → designs/pages/planning/planning.*
- **`.pill-tabs` / `.pill-tab` (+ `.pill-tabs--sm`)** (shell.css, **promoted alias-first** from website `.wb-tab`) — see Design-system note.
- **`.add-fab`** (shell.css, **promoted alias-first** from guests `.gm-add-fab`) — icon-only bottom-right FAB; carry `var(--dark-card)`; states default/hover(guarded)/active/focus/hidden(bulk); safe-area; ≥44px.
- **`.bulk-bar`** (shell.css, **promoted alias-first, chrome only** from guests `#gm-bulkbar`) — floating bottom bar: count + actions + cancel; states hidden/shown/actions-disabled(0). Row-selection visual stays page-local.
- **`.task-row`** family (planning.css) — scroll-snap surface + rail; grid `check | title+meta | (bulk checkbox)`. States: default/hover/focus-within/checked(strike)/swipe-open/selected(bulk)/deleting/overdue.
- **`.task-prio`** (planning.css) — high-only dot + label (med unmarked).
- **`.task-status-badge`** (planning.css, modifier on `.status-badge`) — 3 variants To-do / Done / Overdue (icon + text, semantic tokens: Done `--success`-ish/brand, Overdue `--danger`, To-do `--muted`). Trailing, in the guest-row badge slot.
- **`.task-datebar` + `.task-day`** (planning.css) — date-filter strip (stable container).
- **`.task-date-group`** (planning.css) — agenda heading.
- **`.task-prio-pills`** (planning.css) — Low/Med/High radios in modal.
- **`.expense-type-add`** (planning.css) — the inline "+ Add type" affordance: collapsed link → expanded `.form-input` + confirm/cancel; appends to `EXPENSE_TYPES`.
- **`.expense-event-chip`** (planning.css) — read-only preselected event tag in the expense modal.
- **`.receipt-upload`** (planning.css) — **labeled** file picker + fixed-ratio thumbnail preview + focusable Remove + "Prototype — won't save yet" hint; `FileReader.readAsDataURL`, transient. States: empty / file-chosen (preview) / remove.

## Interaction states (per interactive element)
- **Section tabs (pill tablist):** default/hover/selected(`aria-selected`)/focus-visible/roving-tabindex. Switching to Budget while in selection mode calls `exitSelect()` first. *(council FE#3)*
- **View toggle (pill `--sm` radiogroup):** default/hover/selected(`aria-checked`)/focus-visible. Keydown scoped to its own element (arrows must NOT bubble to the tab handler). *(council FE#7)* Progress bar persists across toggles (static sibling).
- **Date bar:** day chip default/today/selected(`aria-pressed`)/hover/focus-visible; month pager ‹ › disabled at data bounds. "All" default-pressed. Filtering updates a polite live region ("Showing 14 Jun — 3 tasks"). Re-render agenda body only; reserve min-height (bound CLS). *(council FE#4)*
- **Task row:** unchecked/checked(strike)/hover/focus-within/delete-hover/swipe-open/selected(bulk)/**overdue** (`due && due < TODAY && !done` → red due-chip + Overdue badge). *(council PM#3)* **Status badge** reflects To-do/Done/Overdue. **Row surface click → edit modal** (prefilled); clicks on the checkbox, status badge, or swipe rail do NOT trigger edit. Sub-event chip pressed = active List filter.
- **Add FAB:** default/hover/active/focus/hidden(bulk); `aria-label` switches by active tab (task vs expense). *(council FE#3)*
- **Task modal:** default/focus/disabled/loading(`.btn-pill.is-loading`)/error(blank title → `.form-error`+`aria-invalid`). Edit = prefilled.
- **Expense modal (reworked):** **grouped into 2 labelled blocks** with a thin `--line` divider — **"Expense"** (Amount, Type, Vendor) and **"Details"** (Event/Sub-event, Receipt, Date, Notes) — no accordion (all fields visible; the divider halves perceived length). All task-modal states, plus — **"+ Add type"**: collapsed link → expanded input (focus moves in) → Add (disabled until non-blank + de-duped) appends + selects, or Esc/Cancel reverts + returns focus to the trigger; **receipt**: empty / chosen (thumbnail + Remove) / remove (returns focus to trigger); **event chip** read-only (not a focusable control); **sub-event** hidden if no event sub-events, `null`↔`""`; **edit-prefill** populates all 7 fields (guard the sub-event line when the field is absent; receipt always opens empty); date defaults `TODAY`.
- **Expense modal on mobile (<768):** `.modal-static-sheet` with an **internally-scrolling body + sticky footer** (Cancel/Save pinned), `env(safe-area-inset-bottom)` padding, and `scroll-margin` so a focused field isn't hidden behind the sticky footer/keyboard (this is now the tallest sheet on the page). *(council UIUX#6)*
- **Bulk bar:** hidden/shown/actions-disabled(0 selected).
- **Empty:** no-tasks; all-done (existing `.plan-alldone`); Timeline day with none ("Nothing due on 14 Jun"); event with no sub-events (sub-event field/chip hidden everywhere).

## Data & content model (encode now for clean React/Supabase port)
- `var tasks = [{ id, label, done, due, subEvent, priority, notes }]` — **replaces** old `checklist`.
  - `due`: ISO `YYYY-MM-DD` or `null`. **Date-only.**
  - `subEvent`: an `EVENT_SUBEVENTS` **`id`** or `null`. **`null` means exactly ONE thing — "Whole event"** (no separate "unassigned" state; the row chip reads "Whole event" for `null`). *(arbiter/TL#4)*
  - `priority`: stable enum `'low'|'med'|'high'` (default `'med'`).
  - `notes`: `trimmed string || null` (empty ⇒ `null`, never `''` — mirror expense `notes`). *(council TL#6)*
  - `id`: throwaway client integer from the existing `nextId++` (shared with expenses for the prototype ONLY — **no shared-namespace meaning**; the React port uses a per-table `uuid` PK). *(council TL#2)*
- **`var EVENT_SUBEVENTS = [{ id, label }]`** — adopt the **guests shape verbatim** (NOT `{key,label}`). Reuse guests' seed + spelling exactly: `haldi` Haldi, `mehendi` Mehendi, `sangeet` Sangeet, `wedding` Wedding, `reception` Reception. Reuse a `subEventLabel(id)` helper (copy from guests). *(council TL#1 — critical)*
- **`var TODAY = '2026-06-04'`** — a single module constant consumed by ALL date derivations (relative labels, day-chip "today", overdue, grouping, default sort). **Forbid `new Date()` in the render path.** Compare ISO strings lexically (no Date math for grouping/sort). *(council TL#3)*
- **Budget model (REWORKED):** `budget` unchanged. `var EXPENSE_TYPES = [{ id, label, icon, custom }]` **replaces** `CATEGORIES` — **keep the `icon` field** (the expense-row + breakdown render it; do NOT drop it). Prototype seeds the original 8 (`venue/catering/decoration/photography/attire/music/invitations/misc`, each with its existing icon). *(council FE#1/TL#3)*
  - **`EXPENSE_TYPES` is a single read-model whose canonical owner will be Event Settings** — the 8 seeds are Event-Settings *default rows*, NOT app constants; the React port replaces the local array with an Event-Settings fetch (a straight swap, not a merge). `expenses.type` is an FK to that same table. Same drift-resolution shape as `EVENT_SUBEVENTS`. *(council TL#2)*
  - **Custom types** (inline "+ Add type"): id is a **throwaway client id** (`'custom-' + nextId++`), NOT `slug(label)` — the label must never be the identity (a rename would orphan FKs; the port keys on uuid). On add, **dedupe by case/trim-insensitive label** against existing types → if it matches, select the existing type instead of minting a colliding id; customs default `icon:'sell'`. *(council FE#3/TL#1 — critical)*
  - **`typeById(id)` helper** (mirror the old `catByKey`) with a **defined fallback** for an unresolved/deleted type → bucket under "Miscellaneous" (the lookup must be total). *(council FE#1/TL#3)*
- `var expenses = [{ id, amount, type, vendor, subEvent, receipt, date, notes }]` — `type`=`EXPENSE_TYPES` id; `subEvent`=`EVENT_SUBEVENTS` id|`null`(=Whole event), event implicit/preselected (import the **identical** `EVENT_SUBEVENTS`/`subEventLabel` as tasks — not a copy); `receipt`=**always `null` in the saved record** (the thumbnail preview is **transient modal-only state that does NOT survive save/reopen** — real model later = a `receipt_url` Supabase Storage path on the expense, `expense_attachments` table if multi-file); `date`=ISO `YYYY-MM-DD`, **default from the `TODAY` constant (never `new Date()`)**; `vendor`/`notes`=`trimmed||null`. **Breakdown iterates `EXPENSE_TYPES` (incl. customs) keyed by `type`** — NOT the static seed, or custom-type spend vanishes from the chart. The `category`→`type` rename must flip **all sites atomically** (totals keying, breakdown source, save/edit/delete, delete-copy); the `.pf-bar` %/fill math is field-agnostic and survives. *(council FE#4)*
- **Derived on every render (never stored):**
  - **Default List sort:** `overdue → due today → upcoming (ascending date) → undated`, with **priority (high→med→low) as tiebreak** within each bucket. *(arbiter C5 — UPHELD)* Timeline groups by date so it's unaffected.
  - `done%`/`doneCount` (guard len 0); agenda buckets (tasks by `due`, undated → "No date"); "Today"/"Tomorrow" relative labels from `TODAY`; `isOverdue`. Budget derivations unchanged.
- Render all lists via `createElement`/`textContent` (no `innerHTML`) — mirror `guests.js` IIFE conventions (`'use strict'`, `$`/`$$`/`el`/`icon`). Add one shared `fmtDate(iso)`/`relDay(iso, TODAY)` helper (sibling of the existing `fmtINR`) producing "14 Jun"/"Today"/"Tomorrow"/"No date". *(council FE#6)*

## Event-type-aware task templates (seed verbatim from overview, now with due/priority/subEvent)
- **Wedding (~30, default):** same item set as 2026-06-05.2. Seed each with `priority` (venue/caterer/photographer `high`; most `med`; honeymoon `low`), a **deliberate `due` spread authored around `TODAY=2026-06-04`** (compute as `TODAY + offsetDays` at boot so it never desyncs), and `subEvent` where natural (validate every key against `EVENT_SUBEVENTS` — `console.warn` on miss). **Seed table (exercise every agenda group + states):** ≥2 overdue, ≥2 Today, ≥2 Tomorrow, several this-week/future, ≥3 `null` (No-date), a mix of priorities incl. ≥2 `high`. *(council UIUX#7/TL#5)*
- **Birthday (~6) / Corporate (~6):** same item sets; defaults `priority:'med'`, `due:null`, `subEvent:null` (data swap only).
- Structure as `TEMPLATES[eventType]`, Wedding-loaded as built primary.

## Responsive behavior
- Mobile-first; 360 → up. Widths: 360/390/414/768/1024/1440. Task rows full-width; **meta strip wraps in fixed order — due chip → sub-event chip → priority — in one `flex-wrap` row below the title** (priority gains text label ≥768). *(council FE#5)* Date bar horizontally scrolls (snap) all widths; chips ≥44px. Pill tabs scroll-snap with right-edge fade. View toggle full-width `--sm`. FAB bottom-right + safe-area; bulk bar spans bottom in the SAME slot (FAB hidden). Task modal → bottom-sheet <768. Budget responsive unchanged.

## Accessibility (AA)
- Floor: `:focus-visible`; icons `aria-hidden` + labelled controls; programmatic `<label>` per input; single heading order; status never color-only; ≥44px targets.
- **Section tabs = tablist** (unchanged semantics under new pill skin). **View toggle = radiogroup** (`role="radiogroup"`, `role="radio"`+`aria-checked`, roving, **scoped keydown**).
- **Date bar:** chips `<button aria-pressed>`; keyboard-scrollable; filter updates a polite live region with the result count. "All" default-pressed.
- **Priority:** dot + `aria-label` + text ≥768 (high only). **Sub-event chip:** text label, "Whole event" for `null`; as an interactive filter it's a `<button aria-pressed>`.
- **Swipe rail:** `aria-hidden`/`tabindex=-1` + guaranteed focusable equivalents (see a11y-parity row).
- **Due date:** native input (accessible). Modals: shell focus-trap + Esc + scrim + focus-return.
- `prefers-reduced-motion`: bar-fill, row reveal, swipe snap-affordance, FAB micro-motion suppressed.

## Copy (Indian conventions: ₹ + lakh/crore, DD/MM/YYYY)
- Progress: "14 of 30 done · 47%" (+ "· 3 shown" caption when filtered). All-done: "All done — every task complete 🎉".
- Tabs: "Checklist"/"Budget". Toggle: "List"/"Timeline". Date "All" pill: "All". Groups: "Today"/"Tomorrow"/"Sat 14 Jun"/"No date".
- Task modal title: "Add task"/"Edit task". Fields: "Task" (required), "Due date (optional)", "Sub-event", "Priority", "Notes (optional)". Priority pills: "Low"/"Medium"/"High". Sub-event options: labels + "Whole event".
- Status badge: "To-do" / "Done" / "Overdue". Filtered empty: "Nothing due on 14 Jun." Delete: "Delete this task?". Bulk bar: "{n} selected" + "Complete"/"Set date"/"Assign"/"Delete"/"Cancel". Filter live region: "Showing Sangeet — 4 tasks". (No inline quick-add — the FAB opens the add modal; tapping a row opens edit.)
- **Expense modal (reworked):** title "Add expense"/"Edit expense". Labels: "Amount" (req), "Expense type", "Vendor name (optional)", "Event", "Sub-event (optional)", "Receipt (optional)", "Date", "Notes (optional)". Inline add: **"+ Add type"** → input placeholder "New expense type" + "Add" / "Cancel". Receipt empty state: "Upload receipt or image". Event chip = the event name (e.g. "Anya & Kabir"). Breakdown heading: "Spending by type".

## NOT in this design (scope guard — restraint matters)
Still OUT (flag if they creep in): assignees / co-planner sharing; subtasks; time-of-day on dates; reminders/notifications/alerts; recurring tasks; multi-line descriptions beyond one Notes field; drag-to-reschedule; a **full month-grid calendar** (the date bar is a strip); task comments/activity log (the ClickUp reference is inspiration for *fields*, not a feed); a **dedicated sub-event filter axis / grouping** (the tappable chip is the lite version — full axis is the logged fast-follow); multi-currency; budget export.
**Now IN (this rework, founder direction):** task due dates + sub-event link + priority; expense **Expense type** (custom, from Event Settings) + sub-event/event tag + **receipt** (UI stub) + date.
**Stubs / external deps (UI now, wiring later):** receipt upload is a **stub** (no storage — real file upload deferred to backend); custom Expense types are **prototype-local** (canonical list = **Event Settings**, not yet built — wire when it ships).
**Watch-items (founder-decided, keep but monitor):** Timeline view (first cut if PM-tool creep observed — enforce this NOT-list rigorously), bulk Set-date/Assign (instrument usage), the expense-modal field count (now Amount+Type+Vendor+Event/Sub-event+Receipt+Date+Notes — the 2-block grouping keeps it mobile-light; receipt = labeled stub).
**Fast-follow (logged, not this pass):** group the budget breakdown **by sub-event** ("how much did Sangeet cost?") — the data is captured via `expenses.subEvent` but only surfaced by type today *(council PM#3)*; full sub-event filter axis for tasks; guests/website source migration to the promoted shell classes.
**Build sequencing (record, don't pull forward):** Reusable Component Library (P0) → Event Settings (canonical Expense-type source + a type edit/delete home) → this expense modal's React implementation. The "+ Add type" affordance must NOT be enabled in production until Event Settings + a manage path exist *(council PM#2/PM#6)*. The brief is explicit: **simple, all the features but simple.**

## Council notes folded in
**Design council 2026-06-06 (ui_ux_designer, frontend_engineer, tech_lead, product_manager; critique + debate + arbiter) — 🟡 ADDRESS-THEN-PROCEED, all folded above.**
- **Critical:** swipe = CSS scroll-snap not JS transform (FE#1); `EVENT_SUBEVENTS={id,label}` matching guests incl. `mehendi` spelling (TL#1).
- **Arbiter rulings:** C1 sub-event chip tappable-to-filter on List, full axis = fast-follow (UPHELD-w-mod); C2 keep all 4 bulk actions (OVERRULED trim); C3 shell promotion **alias-first, chrome-only, zero edits to guests/website source** (UPHELD-w-mod); C4 keep Timeline (OVERRULED cut, watch-item); C5 pin default List sort overdue→today→upcoming→undated + priority tiebreak (UPHELD).
- **Important:** ~~keep inline quick-add (UIUX#2)~~ **→ OVERRIDDEN by founder 2026-06-06: no inline quick-add; the FAB opens the add modal and tapping a row opens edit** (cleaner bottom real-estate; FAB↔bulk-bar mutually exclusive). Task row upgraded to a guest-style card + a To-do/Done/Overdue status badge (founder direction). FAB↔bulk-bar mutually-exclusive slot (UIUX#1/FE); FAB context-sync + exitSelect on tab switch (FE#3); `subEvent null`="Whole event" everywhere, fix row/modal label (TL#4); overdue red due-chip now, reminders deferred (PM#3); empty-sub-events hides field/chip (PM#5); single `TODAY` constant, no `new Date()` in render (TL#3); Timeline stable date-bar + agenda-only re-render + min-height (FE#4); swipe a11y parity (FE blind-spot); progress-vs-filtered "N shown" caption + auto-scroll Today + pinned meta wrap order/≥768 priority label (UIUX/FE blind-spots).
- **Suggestions:** canonical `.page-band`; priority dot high-only/med-unmarked (UIUX#6); `fmtDate/relDay` helper (FE#6); scoped radiogroup keydown (FE#7); seed `due=TODAY+offset` + validate keys (TL#5); `notes=trimmed||null` (TL#6); FAB bottom-padding so last row isn't obscured; explicit seed table.
- **Process:** guests + website source migrations to the promoted shell classes = separate regression-gated follow-up tickets (PM#7) — NOT done in this pass.

**Council reviewed:** 2026-06-06 by ui_ux_designer + frontend_engineer + tech_lead + product_manager. Verdict: 🟡 ADDRESS-THEN-PROCEED — all findings folded.

**Expense-modal delta (founder direction, 2026-06-06) — reviewed by a focused design council** (ui_ux_designer + frontend_engineer + tech_lead + product_manager; complementary critiques, no inter-agent disputes → no arbiter). Verdict 🟡 ADDRESS-THEN-PROCEED; all folded above:
- **Critical:** custom-type id = throwaway `'custom-'+nextId` (NOT `slug(label)`) + label-dedupe (FE#3/TL#1); keep `icon` + `typeById` fallback→"Miscellaneous" (FE#1/TL#3).
- **Important:** atomic `category`→`type` rename across all sites + breakdown iterates `EXPENSE_TYPES` incl. customs (FE#4); receipt via `FileReader.readAsDataURL`, `receipt:null` saved, preview transient, 3 states + file-input a11y (FE#2/UIUX#4); 2-block modal grouping (UIUX#1); event-chip static-pill visual contract (UIUX#2); "+ Add type" focus/Esc/dedupe a11y (UIUX#3); sticky-footer scrolling bottom-sheet (UIUX#6); edit-prefill sentinel + guards (FE#6); `EXPENSE_TYPES` single read-model owned by Event Settings (TL#2).
- **Founder ruling:** receipt = **labeled stub (preview only)** — works + a "won't save yet" hint (over PM's "cut it"); real storage deferred.
- **Fast-follow / sequencing:** group breakdown by sub-event; gate "+ Add type" in prod behind Event Settings (PM#1–6).

**Council reviewed (expense delta):** 2026-06-06 by ui_ux_designer + frontend_engineer + tech_lead + product_manager. Verdict: 🟡 ADDRESS-THEN-PROCEED — all findings folded.
