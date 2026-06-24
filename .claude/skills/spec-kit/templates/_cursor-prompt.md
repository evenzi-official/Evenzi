# Cursor build runbook — {{PAGE_TITLE}} (`{{PAGE_SLUG}}`)

You are building the Evenzi **{{PAGE_TITLE}}** page as a static HTML/CSS/JS prototype in `designs/pages/{{PAGE_SLUG}}/`. You start with no prior context — everything you need is in this folder.

## Read first
1. `_spec.md` (this folder) — the build source of truth. Build exactly what it specifies.
2. `designs/components.html` — the component catalog (named sections: foundations, shell/chrome, surfaces, pills, buttons, forms, avatars, data, layout). Reuse before creating.
3. `{{REFERENCE_PAGE}}` (a known-good built sibling, e.g. `designs/pages/guests/guests.html`) — copy its structure as your starting point.

## Step 0 — clone the canonical head + chrome (do this before any body work)
Copy, VERBATIM, from `{{REFERENCE_PAGE}}`:
- the entire `<head>` — Tailwind CDN script + the `tailwind.config` token map, both Google Fonts links (Poppins + Material Symbols **with the `FILL` axis**), `viewport-fit=cover` meta, the (dark/light) theme-color metas, and the `manifest.webmanifest` link.
- the shared chrome in `<body>`: scroll-progress bar, `floating-nav`, `tool-rail`, and the `.bc-wrap` breadcrumb shell.
Then set `<body data-page="{{PAGE_SLUG}}"` (+ `data-section="{{DATA_SECTION}}"` if this page sits under a nav tab) — shell.js reads these to drive active nav/tool-rail state.

## Hard constraints (do not violate)
- **Design tokens only.** Colors/spacing/radii from the `tailwind.config` map + `designs/shared/shell.css` variables. Never hardcode hex/px you could pull from a token.
- **No inline CSS or JS. Ever.** Generic → `designs/shared/shell.{css,js}`; page-specific → `designs/pages/{{PAGE_SLUG}}/{{PAGE_SLUG}}.{css,js}`.
- **Link the page stylesheet + script:** `../../shared/shell.css` then `{{PAGE_SLUG}}.css`; `../../shared/shell.js` then `{{PAGE_SLUG}}.js`. **Load order is load-bearing** — shell.css before page.css (cascade), shell.js before page.js.
- **Reuse before create.** If a `_spec.md` reuse-map row says reuse-as-is or modifier-extend, do that — only add new CSS for "new" rows.
- **Hover-guard:** wrap every `:hover` rule in `@media (hover:hover) and (pointer:fine)`.
- **Glass fallback:** any `backdrop-filter` needs an `@supports not (backdrop-filter: blur(1px))` solid fallback; max ~2 blurred surfaces per page.
- **Stretched-link** for clickable cards containing buttons — never nest `<a>` in `<a>`.
- **Mobile-first.** Design at 360px first, scale up. Touch targets ≥44px. `env(safe-area-inset-*)` on fixed chrome. No hover-only interactions.
- **`.bc-wrap`** is the canonical page wrapper — do not override page width at module level.
- Tag top-level sections with `class="reveal"` for scroll-in (shell.js auto-wires the IntersectionObserver — no per-page JS).

## Build steps
1. Do Step 0 (head + chrome clone) → `designs/pages/{{PAGE_SLUG}}/{{PAGE_SLUG}}.html`.
2. Build the page body top-to-bottom per `_spec.md` composition + reuse map.
3. Add new primitives to the correct file per the constraints.
4. Wire interactions/states from `_spec.md`'s states section.
5. Self-check: every section present, every reuse-map row honored, no inline styles, `data-page` set, tokens-only.

## When done
Update `_status.md`: `STAGE: TEST`, `UPDATED: <today> — Cursor`, `NEXT: open Antigravity → read _antigravity-prompt.md → execute`.
