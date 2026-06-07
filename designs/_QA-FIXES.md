# Cursor fix-doc — QA review remediation (do it COMPLETELY)

Fix the verified issues in **`designs/_QA-REVIEW.md`**. The standard is **complete and correct** — every instance on every page, no partial migrations, no mismatches, no new regressions. A half-done cross-cutting fix is worse than none.

## Read first (and use throughout)
- **`designs/_QA-REVIEW.md`** — the findings (source of truth for what to fix).
- **`ai/agents/ui_ux_designer.md`** — apply this UI/UX lens to every change (restraint, consistency, hierarchy, mobile ergonomics). Output should read like this agent built it.
- **`.cursor/rules/evenzi-design.mdc`** — obey it; run the **design self-review + self-test** before finishing.

## How to work (non-negotiable)
1. Fix **all instances** of each cross-cutting issue across **all pages**, not a sample.
2. After each fix, **prove it's complete with a grep** (commands below) — zero remaining matches, or only the documented exemptions.
3. **No regressions** — `git status` should show only intended files; pages still serve 200; JS still `node --check`s; CSS braces balanced.
4. Generic/shared fixes go in `designs/shared/shell.*` (one fix, all pages); page-specific in that page's files. Alias-first if promoting (don't break other pages).

## Fix list — cross-cutting (highest priority, do these completely)
1. **iOS input-zoom (broaden the shell rule).** In `shell.css`, ensure mobile font-size:16px covers **all** focusable text controls: `input` (except checkbox/radio), `select`, `textarea` (incl. `.form-textarea`, `.wb-wa-textarea`, search inputs, `.cc-search-row input`). Verify: `grep -rE 'font-size:1[0-5]px' designs/shared/shell.css` shows no input/select/textarea base under 16 that isn't overridden <768.
2. **Inline CSS/JS — extract everywhere.** Move every inline `<script>` to a page `.js`, every `style="…"` to a class/CSS-var-in-CSS (data-driven values set via JS `setProperty`, not authored in markup). Worst: `event-control.html` inline `<script>` + 33 styles; `index.html` inline script + ~16 styles; event-settings 24; website palette swatches; guests 5. Verify per page: `grep -c 'style="' <page>` → 0 (except the one exempt shell breadcrumb `style="font-size:15px"`), and `grep -c '<script>[^<]' <page>` → 0 (external `<script src>` is fine).
3. **`.page-band` not hand-rolled width.** Replace `max-w-[1440px] mx-auto px-6 md:px-10` with `.page-band` (or `.bc-wrap` where appropriate) on event-control, settings, index, planning `<main>`. Verify: `grep -rl 'max-w-\[1440px\] mx-auto' designs/pages designs/index.html` → empty.
4. **Drop `role="tab"/"tablist"/aria-selected` from cross-page nav links** (the Dashboard/Website primary-view nav in the shared chrome). It's link navigation, not a tab widget. Fix once in the shared markup pattern across all pages that have it. Verify: those `<a>` nav links no longer carry `role="tab"`.
5. **Tokens not raw hex** — event-control (`#dc1f2e`, `#e5484d`), event-settings status hex, website rgba overlays → `--danger/--success/--warning(-ink)` / shell tokens.
6. **Promote `.gm-setter*` picker to `shell.css`** (alias-first), delete the duplicated copy in planning. Verify: one definition in shell, none page-local.
7. **Add `favicon.ico` + `apple-touch-icon.png`** (or drop the apple-touch `<link>`). Verify: no 404 for them.
8. **Scope `.clay-card` hover-lift to interactive cards only** (no false affordance on static cards).

## Fix list — Track-1 responsive (real, confirmed in-browser)
- **website/overview + website/photos overflow at 360px** — the `.dp-card-head` action rows (`.dp-card-head-actions` / `.dp-card-head-aux`) + the `.btn-pill-secondary` don't wrap on mobile (page blows to 398/531px). Make `.dp-card-head` `flex-wrap` / stack the head actions below the title <768px. **Check `design.html` + `card-templates.html` for the same `.dp-card-head` pattern and fix all.** Verify in your self-test: `scrollWidth <= innerWidth` at 360 on every website page.

## Fix list — per-page P1 (see `_QA-REVIEW.md` for exact lines)
- **planning:** loading buttons render blank (add `.btn-pill-spinner` child + `aria-busy`); sub-event chip dup glyph/no aria-label; bulk Set-date/Assign add Undo + announce; picker focus-trap; filtered-empty state; priority color-only on mobile.
- **guests:** toolbar action row even-distribution on mobile (you already fixed this on planning — apply the same to guests).
- **event-settings:** `website.html` undefined `.cc-review-edit` class; add the missing delete-event + add-co-host confirm modals (or remove the copy that promises them); admin `more_horiz` dead buttons; sidebar `<aside>`→`<nav>`.
- **create-event:** step-3 search bar is dead (wire the filter or remove the input); disabled-Continue reason announced.

## OUT of scope this pass (do NOT attempt here)
- **Building invitations + media** (they're empty scaffolds) — that's a separate `/spec-kit` build, not a fix. Leave them as-is (or only swap the bare "Content area" for a simple labeled "Coming soon" empty-state using shell classes — nothing more).

## When done
Run the **design self-review + self-test** (`.cursor/rules/evenzi-design.mdc`) with the **ui_ux_designer lens**. Report: per cross-cutting item, the grep proof it's complete; the website-overflow self-test result; `git status` (only intended files). List anything you intentionally left for the next round.
