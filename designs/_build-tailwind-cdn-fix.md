# Build/fix — Vendor Tailwind locally, kill the runtime CDN dependency (folder-wide)

> **One-off cross-cutting build-doc** (not a per-page `_status` loop). Created by Claude 2026-06-08. Delete when DONE and fold the outcome into a short note in `designs/_WORKFLOW.md` or a session report.
> **Executor:** Cursor. **Reviewer:** Claude (Playwright + verify-greps).
> **Read first:** `.cursor/rules/evenzi-design.mdc` (auto-applies on `designs/**`), `ai/agents/ui_ux_designer.md` (UI/UX role book — this fix was chosen by that agent), and `ai/agents/frontend_engineer.md` (build standards).

## STOP-check
Before acting, confirm you are in the Evenzi repo, on a worktree based on `Dev-Vibe`, and that `designs/index.html` currently contains `<script src="https://cdn.tailwindcss.com"></script>`. If not, stop — wrong worktree.

---

## Why we're doing this (root cause — confirmed by reproduction)

Every one of the **26 static prototype pages** under `designs/` pulls the **Tailwind v3 Play CDN** (`<script src="https://cdn.tailwindcss.com">`) plus an **inline `<script>tailwind.config = {…}</script>`** block at runtime. The CDN's in-browser JIT generates all Tailwind utility classes on page load.

When that third-party CDN fails to load — an ad-blocker / content-blocker / Grammarly browser extension, an offline moment, a corporate proxy, or a rate-limit — **every Tailwind utility class silently disappears**. Pages that lean on those utilities for layout collapse into an unstyled vertical text dump. The local `shared/shell.css` still loads, so component skins (pills, chips, buttons, nav) survive, which makes the breakage look partial and confusing. This was reproduced exactly by stripping Tailwind's injected stylesheet in a clean browser — a pixel match to the founder's broken dashboard screenshot.

**The fix:** stop depending on a runtime CDN. Compile the *exact same* Tailwind utilities into one **local, committed** stylesheet (`designs/shared/tailwind.css`) and link it on every page. Markup does not change at all → zero visual regression. This is also the most forward-compatible path: the compile config we create here is the same artifact the future React + Tailwind 4 port will reuse.

This approach (vendor compiled Tailwind locally) was chosen by the Evenzi UI/UX Designer agent over a hand-written utility layer (reimplements a spec'd tool by hand, rots) and a semantic rewrite (largest effort, highest regression risk, churns markup twice).

**Pre-verified facts (already checked — you can trust these):**
- The inline `tailwind.config` blocks differ only in whitespace/comments across the 26 pages; the **token sets are identical**, so a single canonical config covers all pages.
- **No `dark:` Tailwind variants are used anywhere** (`grep -rhoE 'dark:[…]'` → 0). Dark mode is handled entirely by `shell.css` `.dark` selectors over CSS variables. The compiled file needs no dark variants.
- The only Tailwind class toggled at runtime by JS is `hidden`; scanning `.js` files in the content glob catches it automatically (plus an explicit safelist as belt-and-suspenders).
- No custom color/radius/font token used in markup is missing from the config.

---

## Task 1 — Create the compile config (commit it)

Create **`designs/tailwind.config.js`** with exactly this content. (This is the inline config, ported verbatim to a real file, plus the content glob + safelist.)

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./**/*.html', './**/*.js'],
  safelist: ['hidden'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', card: 'var(--card)',
        cream: 'var(--bg)', 'cream-soft': 'var(--cream-soft)',
        peach: 'var(--peach)', 'peach-deep': 'var(--peach-deep)',
        'dark-card': 'var(--dark-card)', 'dark-card-soft': 'var(--dark-card-soft)',
        brand: 'var(--brand)', 'brand-hover': 'var(--brand-hover)',
        'brand-tint': 'var(--brand-tint)', 'brand-tint-2': 'var(--brand-tint-2)',
        ink: 'var(--ink)', 'ink-soft': 'var(--ink-soft)',
        muted: 'var(--muted)', 'muted-soft': 'var(--muted-soft)',
        line: 'var(--line)', 'line-soft': 'var(--line-soft)',
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        body: ['Poppins', 'sans-serif'],
      },
      borderRadius: { clay: '24px', 'clay-sm': '16px', 'clay-lg': '32px' },
    },
  },
}
```

Create **`designs/_tw-input.css`** with exactly this content (the leading comment becomes the header of the generated file so nobody hand-edits it):

```css
/*! GENERATED FILE — DO NOT EDIT BY HAND.
    Source: designs/_tw-input.css + designs/tailwind.config.js
    Regenerate after ANY change to utility-class usage in designs/**:
      cd designs && npx -y tailwindcss@3.4.17 -c tailwind.config.js -i _tw-input.css -o shared/tailwind.css
    Tailwind pinned to v3.4.17 on purpose — the configs are v3-style. Do NOT let it resolve to v4. */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

> **Pin note:** the version `3.4.17` is pinned deliberately. The inline configs are v3-style JS configs; Tailwind v4 changes the config format and utility output and would cause drift.

---

## Task 2 — Compile the local stylesheet (commit the output)

Run **from inside `designs/`**:

```bash
cd designs
npx -y tailwindcss@3.4.17 -c tailwind.config.js -i _tw-input.css -o shared/tailwind.css
```

This produces **`designs/shared/tailwind.css`** (~25KB, ~1700 lines, unminified for debuggability). This file **is committed**. Do not minify — readable is fine for a local prototype.

**Sanity-check the output before proceeding** (these must all pass — proven values):
```bash
grep -c 'box-sizing: border-box' shared/tailwind.css     # >=1  (preflight present, matches current CDN)
grep -A1 '^\.bg-brand ' shared/tailwind.css              # background-color: var(--brand)  (token wiring)
grep -c 'md\\:grid-cols-3' shared/tailwind.css           # >=1  (responsive variants compiled)
grep -c 'grid-cols-\\\[auto' shared/tailwind.css         # >=1  (arbitrary values compiled)
grep -c '\.hidden ' shared/tailwind.css                  # >=1  (JS-toggled class present)
```

---

## Task 3 — Swap the CDN for the local link on all 26 pages

For **each** of the 26 pages listed below, make exactly three edits in `<head>`:

1. **Delete** the line: `<script src="https://cdn.tailwindcss.com"></script>`
2. **Delete** the entire inline config block: `<script>` … `tailwind.config = { … }` … `</script>`
3. **Insert** a new stylesheet link on the line **immediately above** that page's existing `shared/shell.css` link, **copying that link's exact relative prefix**:
   ```html
   <link rel="stylesheet" href="<same-prefix-as-shell.css>shared/tailwind.css" />
   ```

**KEEP** the two Google Fonts `<link>` lines (Poppins + Material Symbols) — they sit between the deleted scripts; do not remove them.

**Relative-prefix rule (mirror the page's shell.css href):**
| Page location | shell.css href today | tailwind.css href to add |
|---|---|---|
| `designs/index.html`, `designs/components.html` | `shared/shell.css` | `shared/tailwind.css` |
| `designs/pages/<area>/<page>.html` | `../../shared/shell.css` | `../../shared/tailwind.css` |
| `designs/pages/website/templates/<page>.html` | `../../../shared/shell.css` | `../../../shared/tailwind.css` |

**Cascade order matters:** `tailwind.css` must load **before** `shell.css` (and before any `<page>.css`), so shell/page rules win over generated utilities — this matches the current CDN-then-shell order and preserves today's specificity behavior. Inserting it on the line above shell.css achieves this.

### The 26 pages (full checklist)
```
index.html
components.html
pages/event-control/event-control.html
pages/event-control/our-journey.html
pages/event-settings/admins.html
pages/event-settings/general.html
pages/event-settings/guest-list.html
pages/event-settings/plan-billing.html
pages/event-settings/registry.html
pages/event-settings/website.html
pages/guests/guests.html
pages/invitations/invitations.html
pages/media/media.html
pages/planning/planning.html
pages/settings/settings.html
pages/website/card-templates.html
pages/website/design.html
pages/website/edit-page.html
pages/website/overview.html
pages/website/photos.html
pages/website/templates/bold-festive.html
pages/website/templates/classic-romance.html
pages/website/templates/garden-soft.html
pages/website/templates/index.html
pages/website/templates/midnight-elegant.html
pages/website/templates/minimal-modern.html
```

---

## Out of scope (do NOT do in this pass)
- **Do not rewrite any markup / utility classes.** Markup stays byte-identical. This pass only changes how Tailwind is *delivered*.
- **Do not touch** `shell.css`, `*.js`, or any `<page>.css`.
- **Do not** touch `auth/` or `create-event/` pages — they are already CDN-free (Tailwind was stripped earlier) and out of scope. The verify-grep below will confirm none are left behind regardless.
- No minification, no PostCSS pipeline, no `package.json` script changes. Keep the folder buildless except for the one documented regenerate command.

---

## Task 4 — Mandatory test passes (per `.cursor/rules/evenzi-design.mdc`)

This is a **delivery-mechanism change with zero markup edits**, so scope the standing passes accordingly — do NOT re-review unchanged markup, but you MUST run the functional/no-regress checks:

**Self-test pass (the meaningful one here — run it):**
1. **Serve + smoke** — run `npm run design` (:4000) and load `index.html` + `pages/event-control/event-control.html` (the worst offenders) + one `event-settings/*` page. Each must load with **no console errors/warnings**, themed surface rendered (tokens loaded), correct `<body data-page>`, full chrome (nav / tool-rail / breadcrumb / footer).
2. **Layout holds without the CDN** — this is the entire point. After first load, **block the network / enable offline (or ad-block)** and hard-reload `index.html`: the layout must NOT collapse. (Before this fix it collapses to a vertical dump.)
3. **Dark mode** — toggle theme; colors must still switch (CSS-var-driven via `shell.css`).
4. **No `node --check` needed** — no `.js` files are touched.

**Design self-review pass (scoped — only these rows apply, markup is untouched):**
- **No-regress (row 7):** `git status` shows changes ONLY in: the 26 HTML files, `designs/shared/tailwind.css` (new), `designs/tailwind.config.js` (new), `designs/_tw-input.css` (new). No `shell.css`, no `*.js`, no `<page>.css`, no other page's markup.
- **Load order (load-bearing):** `tailwind.css` → `shell.css` → `<page>.css` on every page.
- Reuse-fidelity / a11y / states / content-length / responsive rows are **N/A** — markup is byte-identical, so those are unchanged by construction.

## Done criteria — acceptance gate (all must pass)

Run from repo root (or `designs/`, adjusting paths):
```bash
cd designs
# 1. CDN script gone everywhere
grep -rl 'cdn.tailwindcss.com' . --include='*.html' | wc -l        # → 0
# 2. inline tailwind.config gone everywhere
grep -rl 'tailwind.config' . --include='*.html' | wc -l            # → 0
# 3. every page that had the CDN now links the local file (expect 26)
grep -rl 'shared/tailwind.css' . --include='*.html' | wc -l        # → 26
# 4. compiled file is up-to-date with current usage (must be a no-op diff)
npx -y tailwindcss@3.4.17 -c tailwind.config.js -i _tw-input.css -o shared/tailwind.css
git diff --exit-code shared/tailwind.css                           # → clean (exit 0)
```

**Visual proof (the actual point of the fix):** with the design server running (`npm run design`, :4000), load `index.html` and `pages/event-control/event-control.html` **with network throttled to offline / ad-block on** after first load — the layout must hold (no collapse). Then toggle dark mode — colors must still switch (CSS-var-driven). Capture before/after.

**On completion:** report the grep proofs + `git status`, delete this file (`designs/_build-tailwind-cdn-fix.md`), and note the outcome in the session record. Hand back to Claude for the Playwright review (offline-load + dark-mode + console-clean on a sample of P0 pages).
