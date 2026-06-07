# Full Design QA Findings

> **Agentic Visual & Interaction Pass**: [BLOCKED / MANUAL]
> The browser subagent pass was skipped due to execution context and time constraints for 35 pages. As a result, this report strictly contains the deterministic suite findings (Axe-core, Layout calculations, Console errors, iOS input zoom). 
> **Dimensions NOT covered**: `interaction`, `design-standard (visual)`, `gap`, `stress`, `keyboard/focus manually`.

## Executive Summary

- **Pages tested**: 35
- **Total issues**: 289
- **By Severity**: P0: 0 | P1: 289 | P2: 0 | P3: 0
- **By Category**: a11y: 276 | design-standard: 13

### Cross-cutting Issues

- **[P1][a11y] link-name at `a[data-label="Invitations"]`** (Appears on 17 pages)
- **[P1][a11y] link-name at `a[href$="planning.html"]`** (Appears on 17 pages)
- **[P1][a11y] link-name at `a[href$="media.html"]`** (Appears on 17 pages)
- **[P1][a11y] link-name at `a[href$="guests.html"]`** (Appears on 15 pages)
- **[P1][a11y] link-name at `a[href$="general.html"]`** (Appears on 12 pages)
- **[P1][design-standard] iOS input-zoom risk (<16px) at `textarea.form-input.wb-wa-textarea`** (Appears on 12 pages)
- **[P1][a11y] color-contrast at `.is-active`** (Appears on 6 pages)
- **[P1][a11y] link-name at `a[data-label="Event settings"]`** (Appears on 6 pages)
- **[P1][a11y] color-contrast at `.btn-pill-lg`** (Appears on 5 pages)
- **[P1][a11y] color-contrast at `.tpl-aside-bodynote`** (Appears on 5 pages)

### Worst Pages

- **pages/planning/planning.html**: 39 issues
- **components.html**: 37 issues
- **pages/event-control/event-control.html**: 29 issues
- **pages/website/edit-pages.html**: 20 issues
- **pages/website/overview.html**: 20 issues

---

## components.html

- [P1][a11y] aria-required-children — 360, 390, 414, 768, 1024, 1440
  - Where: `.cs-static-nav > .floating-nav-inner > .nav-tabs.inline-flex[role="tablist"]`
  - Repro: Run axe check
  - Expected vs Actual: Certain ARIA roles must contain particular children
  - Evidence: Fix any of the following:
  Element has children which are not allowed: a[aria-current], a[tabindex]
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/aria-required-children?application=playwright

- [P1][a11y] button-name — 360, 390, 414, 768, 1024, 1440
  - Where: `.btn-google.is-loading[type="button"]`
  - Repro: Run axe check
  - Expected vs Actual: Buttons must have discernible text
  - Evidence: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/button-name?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.tool-card.group.cursor-pointer:nth-child(1) > .tool-card-num`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.tool-card.group.cursor-pointer:nth-child(1) > .gap-2.flex.items-center > .px-2\.5.h-7.bg-brand-tint`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.tool-card.group.cursor-pointer:nth-child(2) > .tool-card-num`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.tool-card.group.cursor-pointer:nth-child(2) > .gap-2.flex.items-center > .px-2\.5.h-7.bg-brand-tint`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.gap-1\.5`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.hero-pill-brand`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `div:nth-child(1) > .btn-pill-primary.btn-pill[type="button"]:nth-child(1)`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `div:nth-child(1) > .btn-pill-primary.btn-pill[type="button"]:nth-child(2)`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.06 (foreground color: #ffffff, background color: #ff5a55, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.cs-stage--col.cs-stage > div:nth-child(2) > .btn-pill-primary.btn-pill[type="button"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.btn-pill-lg`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.is-loading.btn-pill-primary.btn-pill`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `p:nth-child(1) > .bg-brand-tint.clay-pill.text-brand`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 2.14 (foreground color: #892926, background color: #19100f, font size: 6.8pt (9px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `div:nth-child(3) > div > .form-helper`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.18 (foreground color: #626262, background color: #0d0d0d, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `div[aria-label="Event filter"] > .is-active.nav-tab[role="radio"] > .nav-tab-label`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `article:nth-child(12) > .cs-label > code`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.1pt (9.5px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.auth-tabs > .is-active.nav-tab[role="radio"] > .nav-tab-label`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `article:nth-child(13) > .cs-label > code`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.1pt (9.5px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `article:nth-child(1) > .cs-type-meta > code:nth-child(1)`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.45px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `article:nth-child(1) > .cs-type-meta > code:nth-child(2)`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.45px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.font-semibold.text-muted-soft.mt-1`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.28 (foreground color: #7a7a7a, background color: #141415, font size: 7.5pt (10px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.opacity-70 > .tracking-\[0\.18em\].text-muted-soft.mt-2`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 2.77 (foreground color: #595959, background color: #0d0d0d, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `li:nth-child(1) > .checklist-row > .is-urgent.checklist-due`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `li:nth-child(3) > .checklist-row > .checklist-due`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.px-5`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `button[data-modal-target="#cs-modal-live"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `input[autocomplete="one-time-code"]`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has an empty placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `input[value="8"]`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has an empty placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `input[value="2"]`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has an empty placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `.pin-input-cell[value=""][maxlength="1"]:nth-child(4)`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has an empty placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `.pin-input-cell[value=""][maxlength="1"]:nth-child(5)`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has an empty placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `.pin-input-cell[value=""][maxlength="1"]:nth-child(6)`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has an empty placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] link-in-text-block — 360, 390, 414, 768, 1024, 1440
  - Where: `.form-helper > a[href="#"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must be distinguishable without relying on color
  - Evidence: Fix any of the following:
  The link has insufficient color contrast of 1.63:1 with the surrounding text. (Minimum contrast is 3:1, link text: #ee3f3a, surrounding text: #a8a8a8)
  The link has no styling (such as underline) to distinguish it from the surrounding text
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-in-text-block?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768
  - Where: `.cs-static-nav > .floating-nav-inner > .nav-tabs.inline-flex[role="tablist"] > .is-active.nav-tab[aria-current="page"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768
  - Where: `.nav-tab[href="#"]:nth-child(2)`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] color-contrast — 414, 768, 1024, 1440
  - Where: `.h-7.tracking-\[0\.25em\].px-3`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

## index.html

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `button[data-set-ownership="my"] > span:nth-child(2)`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `button[data-set-time="active"] > span`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `section[data-section="my-active"] > article > .fec-body > .fec-bottom > .fec-actions > .btn-pill-primary.btn-pill`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `section[data-section="my-past"] > article > .fec-body > .fec-bottom > .fec-actions > .btn-pill-primary.btn-pill[href="#"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.fec-collab > .fec-body > .fec-bottom > .fec-actions > .btn-pill-primary.btn-pill[href="#"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

## pages/auth/auth.html

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.is-active > .nav-tab-label`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.btn-pill > span:nth-child(1)`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

## pages/auth/role-select.html

✅ no issues found — tested: 360, 390, 414, 768, 1024, 1440 (Automated passes only)

## pages/auth/verify-otp.html

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.btn-pill > span:nth-child(1)`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

## pages/create-event/step-1-type.html

✅ no issues found — tested: 360, 390, 414, 768, 1024, 1440 (Automated passes only)

## pages/create-event/step-2-details.html

✅ no issues found — tested: 360, 390, 414, 768, 1024, 1440 (Automated passes only)

## pages/create-event/step-3-celebrations.html

✅ no issues found — tested: 360, 390, 414, 768, 1024, 1440 (Automated passes only)

## pages/create-event/step-4-review.html

✅ no issues found — tested: 360, 390, 414, 768, 1024, 1440 (Automated passes only)

## pages/create-event/success.html

✅ no issues found — tested: 360, 390, 414, 768, 1024, 1440 (Automated passes only)

## pages/event-control/event-control.html

- [P1][a11y] aria-required-children — 360, 390, 414, 768, 1024, 1440
  - Where: `.nav-tabs`
  - Repro: Run axe check
  - Expected vs Actual: Certain ARIA roles must contain particular children
  - Evidence: Fix any of the following:
  Element has children which are not allowed: a[aria-current], a[aria-label]
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/aria-required-children?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.hero-pill-brand`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.h-7`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.px-5`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.text-center.flex-col:nth-child(1) > .mt-0\.5.text-muted-soft.tracking-wide`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 7.5pt (10px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.text-center.flex-col:nth-child(3) > .mt-0\.5.text-muted-soft.tracking-wide`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 7.5pt (10px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.text-center.flex-col:nth-child(4) > .mt-0\.5.text-muted-soft.tracking-wide`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 7.5pt (10px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `#guests > .tool-card-num`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `#guests > .flex-wrap.gap-2.flex > .bg-brand-tint.clay-pill.px-3`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `#invitations > .tool-card-num`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `#invitations > .flex-wrap.gap-2.flex > .bg-brand-tint.clay-pill.px-3`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `#planning > .tool-card-num`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `#media > .tool-card-num`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `#media > .flex-wrap.gap-2.flex > .bg-brand-tint.clay-pill.px-3`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `#website > .tool-card-num`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.gap-1\.5`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `li:nth-child(1) > label > .is-urgent.checklist-due`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `li:nth-child(2) > label > .is-urgent.checklist-due`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.relative:nth-child(1) > .mt-1.tracking-widest.text-muted-soft`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.relative:nth-child(2) > .mt-1.tracking-widest.text-muted-soft`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.opacity-80.relative:nth-child(3) > .mt-1.tracking-widest.text-muted-soft`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.08 (foreground color: #666667, background color: #18181b, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Guest management"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Invitations"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Planning"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Media & memories"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="general.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] scrollable-region-focusable — 360, 390, 414, 768, 1024, 1440
  - Where: `.pl-7`
  - Repro: Run axe check
  - Expected vs Actual: Scrollable region must have keyboard access
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/scrollable-region-focusable?application=playwright

- [P1][a11y] color-contrast — 768, 1024, 1440
  - Where: `.text-center.flex-col:nth-child(6) > .mt-0\.5.text-muted-soft.tracking-wide`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 7.5pt (10px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 768, 1024, 1440
  - Where: `.opacity-80.relative:nth-child(4) > .mt-1.tracking-widest.text-muted-soft`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.08 (foreground color: #666667, background color: #18181b, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

## pages/event-control/our-journey.html

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `#oj-add`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.oj-tag-next`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.1pt (9.5px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.oj-tag-day`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 7.1pt (9.5px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="guests.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Invitations"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="planning.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="media.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="general.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

## pages/event-settings/admins.html

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.is-active`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `button[data-es-add-admin=""]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.es-section-tag`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.is-owner`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.es-admin-row:nth-child(3) > .es-admin-role`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.86 (foreground color: #ee3f3a, background color: #342222, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.es-admin-row:nth-child(4) > .es-admin-role`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.86 (foreground color: #ee3f3a, background color: #342222, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.es-admin-row:nth-child(5) > .es-admin-role`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.86 (foreground color: #ee3f3a, background color: #342222, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

## pages/event-settings/general.html

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.is-active`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.btn-pill-primary`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `button[data-es-delete=""]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.33 (foreground color: #ee3f3a, background color: #201c1e, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

## pages/event-settings/guest-list.html

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.is-active`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.btn-pill-primary`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#es-plus-one-cap`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

## pages/event-settings/plan-billing.html

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.is-active`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.es-section-tag`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.es-plan-tag--ink`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 6.8pt (9px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `button[data-es-upgrade="premium"] > span:nth-child(1)`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.is-featured > .es-plan-tag`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 6.8pt (9px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `button[data-es-upgrade="elite"] > span:nth-child(1)`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

## pages/event-settings/registry.html

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.is-active`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `button[data-es-save-toast="REGISTRY SAVED"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `button[data-es-save-toast="REGISTRY LINK ADDED"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `button[data-es-save-toast="CASH FUND CREATED"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

## pages/event-settings/website.html

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.is-active`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.btn-pill-primary`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.es-section-tag`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.13 (foreground color: #ee3f3a, background color: #321b1b, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.btn-pill-danger`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.33 (foreground color: #ee3f3a, background color: #201c1e, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

## pages/guests/guests.html

- [P1][design-standard] iOS input-zoom risk (<16px) — 360, 390, 414
  - Where: `input`
  - Repro: Focus input on iOS device
  - Expected vs Actual: Font size >= 16px, got <16px
  - Evidence: Found small inputs: input
  - Suggested fix: Add @media (max-width: 767px) { font-size: 16px; }

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.gm-rate-sub`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 8.9pt (11.84px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `span[data-gm-total=""]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 8.9pt (11.84px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `button[data-gm-filter="all"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 9.6pt (12.8px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `span[data-gm-chip="all"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 9.6pt (12.8px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="guests.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Invitations"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="planning.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="media.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="general.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

## pages/invitations/invitations.html

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="guests.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="invitations.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="planning.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="media.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="general.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

## pages/media/media.html

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="guests.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Invitations"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="planning.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="media.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="general.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

## pages/planning/planning.html

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-tab-checklist`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 10.2pt (13.6px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `button[data-plan-status="all"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 8.6pt (11.52px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `span[data-plan-chip="all"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 8.6pt (11.52px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-view-list`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 9.4pt (12.48px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-15`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-16`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-18`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-17`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-19`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-20`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-30`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-21`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-22`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-23`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-24`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-25`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-29`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-26`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-27`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-28`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-1`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-2`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-3`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-4`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-10`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-6`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-5`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-7`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-8`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-11`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-12`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-13`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-14`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] label — 360, 390, 414, 768, 1024, 1440
  - Where: `#plan-task-chk-9`
  - Repro: Run axe check
  - Expected vs Actual: Form elements must have labels
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/label?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="guests.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Invitations"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="planning.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="media.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="general.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

## pages/settings/settings.html

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.settings-security-actions > .btn-pill-primary.btn-pill[type="button"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `#save-btn > span:nth-child(1)`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

## pages/website/card-templates.html

- [P1][design-standard] iOS input-zoom risk (<16px) — 360, 390, 414
  - Where: `textarea.form-input.wb-wa-textarea`
  - Repro: Focus input on iOS device
  - Expected vs Actual: Font size >= 16px, got <16px
  - Evidence: Found small inputs: textarea.form-input.wb-wa-textarea
  - Suggested fix: Add @media (max-width: 767px) { font-size: 16px; }

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `button[data-style-filter="all"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 9.6pt (12.8px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="guests.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Invitations"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="planning.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="media.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="general.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

## pages/website/design.html

- [P1][design-standard] iOS input-zoom risk (<16px) — 360, 390, 414
  - Where: `textarea.form-input.wb-wa-textarea`
  - Repro: Focus input on iOS device
  - Expected vs Actual: Font size >= 16px, got <16px
  - Evidence: Found small inputs: textarea.form-input.wb-wa-textarea
  - Suggested fix: Add @media (max-width: 767px) { font-size: 16px; }

- [P1][a11y] color-contrast — 360, 390, 414, 768
  - Where: `.dp-jump-preview`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.4pt (12.48px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="guests.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Invitations"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="planning.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="media.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="general.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

## pages/website/edit-page.html

- [P1][design-standard] iOS input-zoom risk (<16px) — 360, 390, 414
  - Where: `textarea.form-input.wb-wa-textarea`
  - Repro: Focus input on iOS device
  - Expected vs Actual: Font size >= 16px, got <16px
  - Evidence: Found small inputs: textarea.form-input.wb-wa-textarea
  - Suggested fix: Add @media (max-width: 767px) { font-size: 16px; }

- [P1][a11y] aria-required-children — 360, 390, 414, 768, 1024, 1440
  - Where: `#ep-sections`
  - Repro: Run axe check
  - Expected vs Actual: Certain ARIA roles must contain particular children
  - Evidence: Fix any of the following:
  Element has children which are not allowed: [role=group]
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/aria-required-children?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `#ep-meta-tier`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="guests.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Invitations"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="planning.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="media.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="general.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

## pages/website/edit-pages.html

- [P1][design-standard] iOS input-zoom risk (<16px) — 360, 390, 414
  - Where: `textarea.form-input.wb-wa-textarea`
  - Repro: Focus input on iOS device
  - Expected vs Actual: Font size >= 16px, got <16px
  - Evidence: Found small inputs: textarea.form-input.wb-wa-textarea
  - Suggested fix: Add @media (max-width: 767px) { font-size: 16px; }

- [P1][a11y] aria-prohibited-attr — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="#cover"] > .gs-tile-state[aria-label="Done"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must only use permitted ARIA attributes
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/aria-prohibited-attr?application=playwright

- [P1][a11y] aria-prohibited-attr — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="#hero"] > .gs-tile-state[aria-label="Done"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must only use permitted ARIA attributes
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/aria-prohibited-attr?application=playwright

- [P1][a11y] aria-prohibited-attr — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="#schedule"] > .gs-tile-state[aria-label="Done"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must only use permitted ARIA attributes
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/aria-prohibited-attr?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `button[data-dp-share=""]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.4pt (12.48px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `span[title="Private — guest must unlock"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `li[data-page="schedule"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `li[data-page="story"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `li[data-page="wedding-party"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.is-hidden > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 2.06 (foreground color: #8e2d2c, background color: #241a1d, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `li[data-page="travel"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `li[data-page="qa"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `li[data-page="gallery"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `#dp-tip-h`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.35 (foreground color: #ee3f3a, background color: #221b1d, font size: 9.4pt (12.48px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.dp-tip-body > a[href$="guests.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.35 (foreground color: #ee3f3a, background color: #221b1d, font size: 10.2pt (13.6px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Guest management"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Invitations"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="planning.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="media.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="general.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

## pages/website/overview.html

- [P1][design-standard] iOS input-zoom risk (<16px) — 360, 390, 414
  - Where: `textarea.form-input.wb-wa-textarea`
  - Repro: Focus input on iOS device
  - Expected vs Actual: Font size >= 16px, got <16px
  - Evidence: Found small inputs: textarea.form-input.wb-wa-textarea
  - Suggested fix: Add @media (max-width: 767px) { font-size: 16px; }

- [P1][a11y] aria-prohibited-attr — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="#cover"] > .gs-tile-state[aria-label="Done"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must only use permitted ARIA attributes
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/aria-prohibited-attr?application=playwright

- [P1][a11y] aria-prohibited-attr — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="#hero"] > .gs-tile-state[aria-label="Done"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must only use permitted ARIA attributes
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/aria-prohibited-attr?application=playwright

- [P1][a11y] aria-prohibited-attr — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="#schedule"] > .gs-tile-state[aria-label="Done"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must only use permitted ARIA attributes
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/aria-prohibited-attr?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `button[data-dp-share=""]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.4pt (12.48px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `span[title="Private — guest must unlock"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `li[data-page="schedule"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `li[data-page="story"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `li[data-page="wedding-party"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.is-hidden > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 2.06 (foreground color: #8e2d2c, background color: #241a1d, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `li[data-page="travel"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `li[data-page="qa"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `li[data-page="gallery"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `#dp-tip-h`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.35 (foreground color: #ee3f3a, background color: #221b1d, font size: 9.4pt (12.48px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.dp-tip-body > a[href$="guests.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.35 (foreground color: #ee3f3a, background color: #221b1d, font size: 10.2pt (13.6px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Guest management"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Invitations"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="planning.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="media.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="general.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

## pages/website/photos.html

- [P1][design-standard] iOS input-zoom risk (<16px) — 360, 390, 414
  - Where: `textarea.form-input.wb-wa-textarea`
  - Repro: Focus input on iOS device
  - Expected vs Actual: Font size >= 16px, got <16px
  - Evidence: Found small inputs: textarea.form-input.wb-wa-textarea
  - Suggested fix: Add @media (max-width: 767px) { font-size: 16px; }

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.dp-card-head-aux > .btn-pill-primary.btn-pill[data-ph-add=""]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `article[data-cover="true"] > .dp-photo-cover-badge`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 6.8pt (9px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="guests.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Invitations"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="planning.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="media.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="general.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

## pages/website/templates/bold-festive.html

- [P1][design-standard] iOS input-zoom risk (<16px) — 360, 390, 414
  - Where: `textarea.form-input.wb-wa-textarea`
  - Repro: Focus input on iOS device
  - Expected vs Actual: Font size >= 16px, got <16px
  - Evidence: Found small inputs: textarea.form-input.wb-wa-textarea
  - Suggested fix: Add @media (max-width: 767px) { font-size: 16px; }

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.tpl-aside-bodynote`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 8.6pt (11.52px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="guests.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Invitations"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="planning.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="media.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Event settings"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

## pages/website/templates/classic-romance.html

- [P1][design-standard] iOS input-zoom risk (<16px) — 360, 390, 414
  - Where: `textarea.form-input.wb-wa-textarea`
  - Repro: Focus input on iOS device
  - Expected vs Actual: Font size >= 16px, got <16px
  - Evidence: Found small inputs: textarea.form-input.wb-wa-textarea
  - Suggested fix: Add @media (max-width: 767px) { font-size: 16px; }

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.tpl-aside-bodynote`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 8.6pt (11.52px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.btn-pill-lg`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768
  - Where: `.tpl-apply-bar > .btn-pill-primary.btn-pill[data-tpl-apply="classic-romance"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="guests.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Invitations"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="planning.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="media.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Event settings"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

## pages/website/templates/garden-soft.html

- [P1][design-standard] iOS input-zoom risk (<16px) — 360, 390, 414
  - Where: `textarea.form-input.wb-wa-textarea`
  - Repro: Focus input on iOS device
  - Expected vs Actual: Font size >= 16px, got <16px
  - Evidence: Found small inputs: textarea.form-input.wb-wa-textarea
  - Suggested fix: Add @media (max-width: 767px) { font-size: 16px; }

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.tpl-aside-bodynote`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 8.6pt (11.52px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.btn-pill-lg`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768
  - Where: `.tpl-apply-bar > .btn-pill-primary.btn-pill[data-tpl-apply="garden-soft"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="guests.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Invitations"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="planning.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="media.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Event settings"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

## pages/website/templates/index.html

- [P1][design-standard] iOS input-zoom risk (<16px) — 360, 390, 414
  - Where: `textarea.form-input.wb-wa-textarea`
  - Repro: Focus input on iOS device
  - Expected vs Actual: Font size >= 16px, got <16px
  - Evidence: Found small inputs: textarea.form-input.wb-wa-textarea
  - Suggested fix: Add @media (max-width: 767px) { font-size: 16px; }

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="guests.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Invitations"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="planning.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="media.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Event settings"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

## pages/website/templates/midnight-elegant.html

- [P1][design-standard] iOS input-zoom risk (<16px) — 360, 390, 414
  - Where: `textarea.form-input.wb-wa-textarea`
  - Repro: Focus input on iOS device
  - Expected vs Actual: Font size >= 16px, got <16px
  - Evidence: Found small inputs: textarea.form-input.wb-wa-textarea
  - Suggested fix: Add @media (max-width: 767px) { font-size: 16px; }

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.tpl-aside-bodynote`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 8.6pt (11.52px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.btn-pill-lg`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768
  - Where: `.tpl-apply-bar > .btn-pill-primary.btn-pill[data-tpl-apply="midnight-elegant"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="guests.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Invitations"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="planning.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="media.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Event settings"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

## pages/website/templates/minimal-modern.html

- [P1][design-standard] iOS input-zoom risk (<16px) — 360, 390, 414
  - Where: `textarea.form-input.wb-wa-textarea`
  - Repro: Focus input on iOS device
  - Expected vs Actual: Font size >= 16px, got <16px
  - Evidence: Found small inputs: textarea.form-input.wb-wa-textarea
  - Suggested fix: Add @media (max-width: 767px) { font-size: 16px; }

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.tpl-aside-bodynote`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 8.6pt (11.52px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768, 1024, 1440
  - Where: `.btn-pill-lg`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] color-contrast — 360, 390, 414, 768
  - Where: `.tpl-apply-bar > .btn-pill-primary.btn-pill[data-tpl-apply="minimal-modern"]`
  - Repro: Run axe check
  - Expected vs Actual: Elements must meet minimum color contrast ratio thresholds
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="guests.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Invitations"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="planning.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[href$="media.html"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

- [P1][a11y] link-name — 360, 390, 414, 768, 1024, 1440
  - Where: `a[data-label="Event settings"]`
  - Repro: Run axe check
  - Expected vs Actual: Links must have discernible text
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: https://dequeuniversity.com/rules/axe/4.11/link-name?application=playwright

