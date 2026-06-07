# Cursor fix-doc — QA loop-4 (final a11y nits)

Small, mostly-shared-chrome. Verify-before-fix on #2/#3 (axe over-reports). Read `ai/agents/ui_ux_designer.md` + `.cursor/rules/evenzi-design.mdc`; self-review + self-test; complete + correct, no regressions.

## Fixes

1. **[a11y] Tool-rail icon links have no accessible name (REAL, ~17 pages).** Every `.tr-btn` is `<a class="tr-btn" data-label="…"><span aria-hidden="true" class="material-symbols-outlined">…</span></a>` — only an `aria-hidden` icon, no name → axe `link-name`. **Add `aria-label` to every `.tr-btn`, value = its `data-label`** (e.g. `aria-label="Guest management"`). The rail is per-page markup → fix on ALL pages that have it. **Verify:** `grep -rL 'tr-btn"[^>]*aria-label\|aria-label[^>]*tr-btn' <pages-with-tr-btn>` finds none missing; every `.tr-btn` has a name.

2. **[design-standard] `.wb-wa-textarea` iOS-zoom — VERIFY, likely already fixed.** The shell `@media(max-width:767px)` rule already lists `textarea`, `.form-input`, `.wb-wa-textarea` → at 360px this element should compute to 16px. **Check the computed font-size of `textarea.wb-wa-textarea` at 360px in a browser. Only if it's actually <16px** (a website.css override winning by source-order) add a `@media(max-width:767px){.wb-wa-textarea{font-size:16px}}` in `website.css`. If already 16px, do nothing.

3. **[a11y] color-contrast — VERIFY each, fix only the real ones.** Check computed contrast (dark mode) for: `.is-active` (active nav/chip text), `.btn-pill-lg` (large button label), `.tpl-aside-bodynote` (template aside note). For any genuinely <4.5:1 (normal) / <3:1 (large), bump the text color to a higher-contrast token. **Skip** any that already pass or are large/decorative — don't change passing colors.

## When done
Self-review + self-test. Report: grep proof all `.tr-btn` labelled; the `.wb-wa-textarea` computed font-size @360 (and whether you changed it); which contrast items were real + the new ratios. `git status` only intended files.
