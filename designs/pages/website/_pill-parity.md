# Cursor change-prompt — pill-tab parity (migrate website to the shell `.pill-tabs`)

**Goal:** the website module sub-tabs (Overview / Design / Photos / Card Templates) still show the **old red glow**, while planning's section tabs (now on the shared shell `.pill-tabs`) are **flat**. Make them match — flat, no glow — by completing the deferred migration of website onto the shell primitive.

## Root cause (already diagnosed)
`designs/shared/shell.css` provides the canonical pill-tab component as `.pill-tabs / .pill-tab` **with `.wb-tabs / .wb-tab` aliased to it** (flat, `box-shadow:none`). But `designs/pages/website/website.css` (≈lines 43–108) **still defines its own `.wb-tabs-wrap / .wb-tabs / .wb-tab*` block — including `box-shadow:var(--shadow-clay-pill)` (the glow)** — and `website.css` loads AFTER `shell.css`, so the local block overrides the shell alias. That local block is now redundant.

## The fix
1. In `designs/pages/website/website.css`, **delete the redundant pill-tab block** — the `.wb-tabs-wrap`, `.wb-tabs`, `.wb-tabs::-webkit-scrollbar`, `.wb-tab`, `.wb-tab .material-symbols-outlined`, `.wb-tab:hover`, `.wb-tab:focus-visible`, `.wb-tab.is-active`, `.wb-tab.is-active .material-symbols-outlined`, and `.wb-tabs-wrap::after` rules (the contiguous block ≈lines 43–108). The shell now supplies all of these via the `.wb-tabs/.wb-tab` aliases.
2. **Before deleting, diff the two definitions.** The shell's aliased block must cover everything the local block did EXCEPT the glow. If the local block has any rule the shell alias does NOT (e.g. a website-only padding/scroll tweak, or the `::after` right-edge fade), port that ONE difference into the shell's `.pill-tabs-wrap`/`.pill-tabs` rule (so it applies to both consumers) — do not re-add a website-local override. The `::after` fade exists in the shell block already; confirm it does and don't duplicate it.
3. Leave `website.html` markup unchanged (it already uses `class="wb-tabs"`/`class="wb-tab"`, which the shell aliases).

## Verify (self-test)
- `pages/website/overview.html` tabs render **flat (no red glow)**, identical treatment to `pages/planning/planning.html`'s Checklist/Budget tabs. Active tab still = `--brand-tint` fill + `--brand` text/icon. Hover/focus still work (guarded).
- The right-edge scroll fade still renders on the website tab strip (4 tabs overflow on narrow widths).
- No layout regression on the website pages (Overview/Design/Photos/Card Templates) — tabs still content-width, left-aligned, horizontally scrollable.
- `git status` shows only `designs/pages/website/website.css` (and `designs/shared/shell.css` ONLY if you ported a missing rule per step 2). No other files.

## Scope / guardrails
Tokens only; no inline CSS; this is a CSS-only migration (delete redundant + maybe port one rule to shell). Do not touch website markup, JS, or any other page. Run the design self-review + self-test from `.cursor/rules/evenzi-design.mdc` before reporting done. (Website is not in the spec-kit baton — just report done + self-tested; Claude verifies + commits.)
