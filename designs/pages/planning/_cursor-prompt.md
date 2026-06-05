# Cursor build runbook — Planning (`planning`)

You are building the Evenzi **Planning** page (Checklist + Budget Tracker) as a static HTML/CSS/JS prototype in `designs/pages/planning/`. You start with no prior context — everything you need is in this folder.

## Read first
1. `_spec.md` (this folder) — the build source of truth. Build exactly what it specifies (reuse map is authoritative).
2. `designs/components.html` — component catalog (sections: foundations, shell/chrome, surfaces, pills, buttons, forms, avatars, data, layout). Reuse before creating.
3. `designs/pages/guests/guests.html` + `designs/pages/guests/guests.js` — known-good built sibling; copy its structure + IIFE conventions (`'use strict'`, `$`/`$$`/`el`/`icon` helpers, `createElement`/`textContent`, no `innerHTML`).

## Step 0 — the head + chrome already exist
`designs/pages/planning/planning.html` already has the canonical `<head>` (Tailwind config token map, Poppins + Material Symbols incl. FILL axis, PWA/theme-color meta, `manifest`), the shared chrome (scroll-progress, floating-nav, tool-rail, `.bc-wrap` breadcrumb, footer, help-FAB, toast), and `<body data-page="planning" data-section="dashboard">`. **Keep all of it.** Build the two-tab body INTO the `<main>` (replace the placeholder "Content area" section). Do NOT re-create or alter the head/chrome.

## Hard constraints (do not violate)
- **Design tokens only** — from the `tailwind.config` map + `designs/shared/shell.css` variables. Never hardcode hex/px.
- **No inline CSS or JS. Ever.** New generic primitives → `designs/shared/shell.css`; page-specific → `designs/pages/planning/planning.css` + `designs/pages/planning/planning.js`. Link them after the shared files (load order: shell.css before planning.css, shell.js before planning.js).
- **Reuse before create** — follow `_spec.md`'s reuse map. The ONLY new things: `.checklist-row--simple` + `.status-badge--over` (shell.css modifiers), `.budget-bar-row` + the in-page tablist styling (planning.css). Everything else reuses existing primitives.
- **Bars use the existing engine** — checklist % bar AND category bars sit on `.pf-bar[data-fill]` (shell.js animates the fill via IntersectionObserver). Do NOT write a new bar animation.
- **Modals reuse the shell controller** — `window.evenzi.openModal/closeModal` + `data-modal-target`/`data-modal-close`; `.modal-card` centered ≥768px, `.modal-static-sheet` bottom-sheet <768px; delete-confirm = `.modal-confirm-cautionary`; ₹ amount = `.form-input-group` + `.form-input-prefix`.
- **Tabs = true tablist** — `role="tablist"` + each `role="tab"` (`aria-selected`, `aria-controls`) + two `role="tabpanel"` (both rendered, hidden toggled); roving tabindex + arrow keys + `:focus-visible`. Reuse `.nav-tab` look but keep it visually subordinate to the floating-nav tabs. Switch in `planning.js`.
- **Render from data** — define `CATEGORIES` (8 stable keys), `checklist[]`, `expenses[]`, `budget` in `planning.js`; render lists via `createElement`; derive Spent/Remaining/cat%/done% on every render (guard ÷0). Seed the Wedding template; structure as `TEMPLATES[eventType]`.
- **Indian currency** — en-IN grouping (₹12,50,000), `font-variant-numeric: tabular-nums` on all money. The shell count-up `fmt()` is NOT en-IN — feed pre-formatted strings and skip count-up on currency figures.
- **Mobile-first** — 360px first, ≥44px targets, `env(safe-area-inset-*)` (already on chrome), no hover-only interactions.
- **Hover-guard** every `:hover` in `@media (hover:hover) and (pointer:fine)`; **glass fallback** — the tab control + glass cards count toward ≤2 blurred surfaces, each needs an `@supports not (backdrop-filter: blur(1px))` solid fallback.
- **`.bc-wrap`** wrapper unchanged; dark mode + semantic status tokens mandatory; tag top-level sections `class="reveal"`.

## Build steps
1. Build the in-page tablist + two `role="tabpanel"` sections inside `<main>`; default Checklist visible.
2. **Checklist panel:** `.section-head`; the `.pf-bar` progress row; the list rendered from `checklist[]` using `.checklist-row--simple`; inline "Add item" (`.btn-pill` + `.form-input`); per-row delete → `.modal-confirm-cautionary`.
3. **Budget panel:** 3 `.stats-strip-card` (Total/Spent/Remaining + over-budget `.status-badge--over`); set/update-budget modal; category breakdown via `.budget-bar-row` (sorted desc, `.pf-bar` fills); expense list (`.exp-row`) rendered from `expenses[]` with edit/delete; "Add expense" modal/bottom-sheet.
4. Add the new primitives to the correct files (see constraints).
5. Wire all interactions/states from `_spec.md`; cover empty/over-budget/all-done states.
6. Self-check: every reuse-map row honored, no inline styles, `data-page` intact, tokens-only, both lists render from arrays, money en-IN.

## NOT in scope (do not add)
Due dates / assignees / subtasks, receipt attachments, vendor contacts, multi-currency, payment status, export, co-planner, budget alerts.

## When done
Update `_status.md`: `STAGE: TEST`, `UPDATED: <today> — Cursor`, `NEXT: open Antigravity → read _antigravity-prompt.md → execute`.
