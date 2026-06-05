# Spec — Planning (`planning`)  ·  SPEC_VERSION 2026-06-05.1

> Build source of truth. Cursor builds **only** from this file. Filled by `/spec-kit` from the
> feature overview + design system + council review. Overwritten on re-run (SPEC_VERSION bumps).

## Goal & user
- **Primary user:** Host (event owner) only — no guest surface.
- **User goal of this page:** Stay on top of every planning task (checklist) and know exactly where the money is going (budget tracker), in one place.
- **Overview source:** docs/features/overviews/planning-tools-overview.md
- **a11y tier:** AA (host surface behind auth).
- **Share / Open Graph:** n/a (host-only, behind auth — no link-preview surface).

## Starting point
`designs/pages/planning/planning.html` already exists with the **canonical `<head>` + chrome** (Tailwind config token map, fonts, PWA meta, `manifest`, scroll-progress, floating-nav, tool-rail, `.bc-wrap` breadcrumb, `<body data-page="planning" data-section="dashboard">`, footer, help-FAB, toast). **Keep all of it.** Build the two-tab body INTO the `<main>` content area (currently a placeholder "Content area" section). Reuse-reference page for component patterns: `designs/pages/guests/guests.html` (+ `guests.js` IIFE conventions).

## Page composition (top → bottom)
1. **Page header** (existing) — eyebrow "SECTION", `<h1>` Planning, sub line.
2. **In-page tab bar** — segmented control: **Checklist | Budget**. Page-local, visually distinct from the floating-nav tabs (subordinate). True tablist (see a11y). Default tab: Checklist.
3. **Checklist panel** (`role="tabpanel"`) — progress summary + checklist list + add-item.
4. **Budget panel** (`role="tabpanel"`, hidden until selected) — budget header (Total/Spent/Remaining stat strip) + category breakdown + expense list + add-expense.

## Element reuse map
> Three rungs: reuse-as-is / modifier-extend / new. Catalog = `designs/components.html` + `designs/shared/shell.css`.

| Element | Rung | Primitive or new-file | Notes |
|---|---|---|---|
| Section headers (Checklist / Budget) | reuse-as-is | `.section-head` family | eyebrow + title + sub |
| Checklist item row | **modifier-extend** | `.checklist-row` → **new `.checklist-row--simple`** (shell.css) | drop `.checklist-sub`/`.checklist-due` markup; collapse to check + title + trailing 44px delete icon-btn. Checked = `:has()` strike-through (existing). |
| Checklist % progress bar | **modifier-extend** | `.pf-bar[data-fill]` (shell.css + shell.js IntersectionObserver) | wrap in a small label row ("X of N done — NN%"); reuse the existing fill engine, do NOT author a new bar. |
| Add checklist item | reuse-as-is | `.btn-pill` + `.form-input` (inline add row) | inline text input + Add; Enter submits. |
| Delete confirm (item / expense) | reuse-as-is | `.modal-confirm-cautionary` + `window.evenzi.openModal/closeModal` | |
| Budget stat cards (Total/Spent/Remaining) | reuse-as-is | `.stats-strip-card` ×3 | money figures use `tabular-nums`; see currency note. |
| Over-budget badge | **modifier-extend** | `.status-badge` → **new `.status-badge--over`** (shell.css, `--danger` tint) | text "Over budget by ₹X" + icon; never color-only. |
| Set / update budget | reuse-as-is | `.modal-card` + `.form-input-group`/`.form-input-prefix` (₹) | first-run empty → `.empty-cta-card` "Set total budget"; when set → editable via an edit affordance on the Total card. |
| Add / edit expense | reuse-as-is | `.modal-card` (centered ≥768px) / `.modal-static-sheet` (bottom-sheet <768px) + `.form-input-group` (₹ amount), category `.form-select`/picker, vendor + notes `.form-input` | edit = same modal prefilled. Wire via `data-modal-target`/`data-modal-close`. |
| Expense list row | **new (page-local)** | `planning.css` `.exp-row` | category icon + vendor/category + ₹amount + edit/delete (44px icon-btns, stretched-link NOT used — row has multiple actions). |
| Category breakdown bars | **modifier-extend → page-local wrapper** | `.pf-bar[data-fill]` + new page-local `.budget-bar-row` (planning.css) | label + monochrome brand fill + ₹amount + %; sorted descending by spend; promote to shell only on 2nd consumer. |
| Empty states (budget unset / no expenses / all-done) | reuse-as-is | `.empty-cta-card` (+ `--dot-color` pattern bg) | |

## New primitives needed
> generic → designs/shared/shell.*; page-specific → designs/pages/planning/planning.*
- **`.checklist-row--simple`** (shell.css) — modifier on `.checklist-row`: collapse grid to `check | title | delete`, title takes freed space, trailing 44px delete icon-btn. States: default / hover / focus-visible / checked (strike) / deleting.
- **`.status-badge--over`** (shell.css) — danger-tinted `.status-badge` for over-budget. Uses `--danger` token; icon + text (never color-only).
- **`.budget-bar-row`** (planning.css, page-local) — wrapper composing `.pf-bar[data-fill]`: `category label | track | ₹amount + %`. Page-scoped until a 2nd consumer appears.
- **In-page tablist** styling (planning.css) — reuse `.nav-tab` visual treatment but as a true page-local tablist (not the chrome radiogroup); visually subordinate to floating-nav.

## Interaction states (per interactive element)
- **Tabs:** default / hover / selected (`aria-selected`) / focus-visible / roving-tabindex.
- **Checklist item:** unchecked / checked (strike) / hover / focus / delete-hover; add-input: empty / typing / submit (loading none — instant) / error (blank submit ignored).
- **Set/edit budget + add/edit expense (forms):** default / focus / disabled / loading (save spinner via `.btn-pill.is-loading`) / error (invalid/blank amount → `.form-error` + `aria-invalid`).
- **Budget figures:** normal / over-budget (Remaining negative + `.status-badge--over`).
- **Empty:** budget-unset, no-expenses, checklist all-done.

## Data & content model (encode now for clean React/Supabase port)
- `var CATEGORIES = [{key,label,icon}]` — **8 stable enum keys** (never store the human label as identity): `venue`, `catering`, `decoration`, `photography`, `attire`, `music`, `invitations`, `misc` (labels: Venue, Catering, Decoration, Photography, Attire, Music / DJ, Invitations, Miscellaneous).
- `var checklist = [{ id, label, done }]` — seeded by event type (see templates).
- `var expenses = [{ id, amount, category, vendor?, notes? }]`.
- `var budget = <number|null>` (null = unset).
- **Derived on every render (never stored):** `spent = sum(amount)`; `remaining = budget - spent`; `pct(cat) = catTotal / spent` (guard spent===0 → 0%); `done% = doneCount / checklist.length` (guard 0). Over-budget when `spent > budget`.
- Render both lists from arrays via `createElement` / `textContent` (no `innerHTML`) — mirror `guests.js` IIFE conventions (`'use strict'`, `$`/`$$`/`el`/`icon` helpers).
- **Content-length resilience:** money figures `font-variant-numeric: tabular-nums`, en-IN grouping (₹12,50,000); long checklist/vendor names wrap (no truncation of money); over-budget badge wraps to its own line below the Remaining card at 360px (never truncate a value); crore-scale value (₹1,20,00,000) must fit the stat strip.

## Event-type-aware checklist templates (seed verbatim from overview)
- **Wedding (~30 items, default for this build):** Book venue, Send invitations, Book photographer, Book caterer, Finalize menu, Book DJ/band, Arrange florist, Book makeup artist, Plan honeymoon, Confirm guest count … (expand to the full wedding arc from the overview).
- **Birthday (~6):** Book venue, Order cake, Send invitations, Arrange entertainment, Plan catering, Buy decorations.
- **Corporate (~6):** Book venue, Confirm speakers, Send invitations, Arrange AV equipment, Organize catering, Print materials.
- Build the **Wedding-loaded** state as primary; structure the seed as a `TEMPLATES[eventType]` map so Birthday/Corporate are a data swap (different item count → progress math + list density must hold).

## Responsive behavior
- Mobile-first; design at 360px, scale up. Widths: 360 / 390 / 414 / 768 / 1024 / 1440.
- Stat strip: 3-up ≥768px, stacks to 1-col on mobile. Category bars + expense rows full-width. Tab bar full-width on mobile. Modal → bottom-sheet <768px.

## Accessibility (AA)
- Floor: visible focus ring (`:focus-visible`); all icons `aria-hidden` with labelled controls; every input a programmatic `<label>` (not placeholder-only); single logical heading order; status never color-only (over-budget = icon+text; bars = label+₹+%); touch targets ≥44px.
- **Tabs = true tablist:** `role="tablist"` on the control, each `role="tab"` + `aria-selected` + `aria-controls`→ a `role="tabpanel"`; arrow-key roving tabindex; Esc not applicable. TalkBack must announce "tab, 1 of 2".
- Modals: reuse shell focus-trap + Esc + scrim + focus-return (already in shell.js).
- `prefers-reduced-motion`: bar-fill + reveal suppressed.

## Copy (Indian conventions: ₹ + lakh/crore, DD/MM/YYYY, 12-hour time)
- Checklist progress: "14 of 30 done · 47%". All-done: "All done — every task complete 🎉" (calm, no aggressive motion).
- Budget unset CTA: "Set your total budget to start tracking." Over-budget: "Over budget by ₹45,000".
- Expense modal title: "Add expense" / "Edit expense". Delete confirms: "Delete this item?" / "Delete this expense?".

## NOT in this design (MVP scope guard — overview deferral table)
No due dates / assignees / subtasks on checklist; no receipt attachments; no vendor-contacts; no multi-currency (INR only); no payment status (paid/pending); no budget export; no co-planner sharing; no budget alerts. Flag any of these if they creep in.

## Council notes folded in
**Design council 2026-06-05 (ui_ux_designer, frontend_engineer, tech_lead, product_manager) — 🟡 address-then-proceed; all folded above:** reuse `.pf-bar` not a new bar engine (UX2/FE2/TL4); true tablist + page-local `planning.js` (UX4/FE1/TL2); `.checklist-row--simple` (UX1); `.status-badge--over` new modifier (UX3/FE3); en-IN currency + tabular-nums + count-up caveat (UX5/FE5); event-type-aware templates (PM2); explicit budget-unset/update/edit + checklist states (PM3/PM4); port-clean data shapes + derived totals (TL1/TL3/TL5); glass cap incl. tab blur + `@supports` (FE6); monochrome bars sorted desc (UX3); scope guard (PM6). PM "stub/no-spec" overruled — council ran on the draft pre-write by design.
