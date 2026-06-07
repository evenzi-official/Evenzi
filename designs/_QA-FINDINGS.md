# Full Design QA Findings

## Executive Summary

- **Pages tested**: 35 out of 35
- **Total issues**: 515
- **Agentic Visual & Interaction Pass**: [MANUAL/BLOCKED] The browser subagent encountered a persistent infrastructure error (`Browser context management is not supported` via CDP) and could not execute the subjective interaction passes. The findings below are generated via the automated deterministic suite (Axe-core, Layout computations, Console).

### Cross-cutting Issues (Highest Leverage)
- **[P1][responsive] Horizontal overflow on components catalog.** The components page exceeds viewport width at all breakpoints below 1440px.
- **[P1][a11y] Missing valid roles for aria-label.** Notification unread dots (`.fn-notif-unread`) use `aria-label` on `<span>` elements without a valid role.
- **[P0][a11y] Form inputs missing labels.** Specifically the OTP inputs in auth and custom pickers lack explicit labels or discernible text.
- **[P2][a11y] Multiple `contentinfo` and unlabelled landmarks.** The `.mt-20` footer sections across multiple pages cause landmark collision.

---

## components.html

- [P1][responsive] Horizontal scroll detected — 360px
  - Where: `document.documentElement`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass responsive standard, but failed.
  - Evidence: scrollWidth=1804 vs innerWidth=360
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][responsive] Horizontal scroll detected — 390px
  - Where: `document.documentElement`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass responsive standard, but failed.
  - Evidence: scrollWidth=1804 vs innerWidth=390
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][responsive] Horizontal scroll detected — 414px
  - Where: `document.documentElement`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass responsive standard, but failed.
  - Evidence: scrollWidth=1804 vs innerWidth=414
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][responsive] Horizontal scroll detected — 768px
  - Where: `document.documentElement`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass responsive standard, but failed.
  - Evidence: scrollWidth=1820 vs innerWidth=768
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][responsive] Horizontal scroll detected — 1024px
  - Where: `document.documentElement`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass responsive standard, but failed.
  - Evidence: scrollWidth=2300 vs innerWidth=1024
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][responsive] Horizontal scroll detected — 1440px
  - Where: `document.documentElement`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass responsive standard, but failed.
  - Evidence: scrollWidth=2738 vs innerWidth=1440
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Certain ARIA roles must contain particular children — all
  - Where: `.cs-static-nav > .floating-nav-inner > .nav-tabs.inline-flex[role="tablist"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has children which are not allowed: a[aria-current], a[tabindex]
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Buttons must have discernible text — all
  - Where: `.btn-google.is-loading[type="button"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `input[autocomplete="one-time-code"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has an empty placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `input[value="8"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has an empty placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `input[value="2"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has an empty placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `.pin-input-cell[value=""][maxlength="1"]:nth-child(4)`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has an empty placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `.pin-input-cell[value=""][maxlength="1"]:nth-child(5)`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has an empty placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `.pin-input-cell[value=""][maxlength="1"]:nth-child(6)`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has an empty placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.mt-20`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.mt-20`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-panel[role="dialog"][aria-label="Notifications"] > .fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## index.html

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `button[data-set-ownership="my"] > span:nth-child(2)`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `button[data-set-time="active"] > span`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `section[data-section="my-active"] > article > .fec-body > .fec-bottom > .fec-actions > .btn-pill-primary.btn-pill`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.mt-20`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.mt-20`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `ul`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/auth/auth.html

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.is-active > .nav-tab-label`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.btn-pill > span:nth-child(1)`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/auth/role-select.html

✅ no automated deterministic issues found — tested: 360px, 390px, 414px, 768px, 1024px, 1440px

*Note: Interaction, visual, and gap testing requires manual execution due to blocked browser automation.* 

## pages/auth/verify-otp.html

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.btn-pill > span:nth-child(1)`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `input[autofocus=""]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has an empty placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `input:nth-child(2)`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has an empty placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `input:nth-child(3)`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has an empty placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `input:nth-child(4)`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has an empty placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `input:nth-child(5)`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has an empty placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `input:nth-child(6)`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has an empty placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/create-event/step-1-type.html

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.cc-stepper-row`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/create-event/step-2-details.html

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.cc-stepper-row`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/create-event/step-3-celebrations.html

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.cc-stepper-row`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/create-event/step-4-review.html

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.cc-stepper-row`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/create-event/success.html

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.cc-stepper-row`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/event-control/event-control.html

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Certain ARIA roles must contain particular children — all
  - Where: `.nav-tabs`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has children which are not allowed: a[aria-current], a[aria-label]
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.hero-pill-brand`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.mt-20`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should have one main landmark — all
  - Where: `html`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Document does not have a main landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.mt-20`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Guest management"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Invitations"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Planning"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Media & memories"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="general.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `h1`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.hero-meta-chip:nth-child(1) > .hero-meta-text`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.hero-meta-chip:nth-child(2) > .hero-meta-text`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.gap-3.flex-wrap.flex:nth-child(3)`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.stats-strip-card.gap-4.tool-card:nth-child(1) > .min-w-0`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.stats-strip-card.gap-4.tool-card:nth-child(2) > .w-full.min-w-0`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.stats-strip-card.gap-4.tool-card:nth-child(3) > .w-full.min-w-0`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.tracking-\[0\.3em\].uppercase.text-\[10px\]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.block`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.inset-0.justify-center.absolute`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.gap-5.flex.items-center > div:nth-child(2)`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.md\:grid-cols-\[auto_1fr_auto\] > .min-w-0`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.px-5`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.mb-5`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.text-center.flex-col:nth-child(1) > .mt-3.text-\[11px\].leading-tight`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.text-center.flex-col:nth-child(1) > .mt-0\.5.text-muted-soft.tracking-wide`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.text-center.flex-col:nth-child(2) > .mt-3.text-\[11px\].leading-tight`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.text-center.flex-col:nth-child(2) > .mt-0\.5.text-brand.tracking-wide`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.text-center.flex-col:nth-child(3) > .mt-3.text-\[11px\].leading-tight`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.text-center.flex-col:nth-child(3) > .mt-0\.5.text-muted-soft.tracking-wide`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.text-center.flex-col:nth-child(4) > .mt-3.text-\[11px\].leading-tight`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.text-center.flex-col:nth-child(4) > .mt-0\.5.text-muted-soft.tracking-wide`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.text-center.flex-col:nth-child(5) > .mt-3.text-\[11px\].leading-tight`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.text-center.flex-col:nth-child(5) > .mt-0\.5.text-brand.tracking-wide`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.text-center.flex-col:nth-child(6) > .mt-3.text-\[11px\].leading-tight`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.text-center.flex-col:nth-child(6) > .mt-0\.5.text-muted-soft.tracking-wide`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.items-end`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `#guests > .tool-card-num`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `#guests > .tracking-\[-0\.01em\]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.max-w-xs`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `#guests > .flex-wrap.gap-2.flex`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `#invitations > .tool-card-num`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `#invitations > .tracking-\[-0\.01em\]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `#invitations > .leading-relaxed.mb-6.text-sm`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `#invitations > .flex-wrap.gap-2.flex`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `#planning > .tool-card-num`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `#planning > .tracking-\[-0\.01em\]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `#planning > .leading-relaxed.mb-6.text-sm`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `#planning > .gap-2.flex.items-center`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `#media > .tool-card-num`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `#media > .tracking-\[-0\.01em\]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.max-w-sm`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `#media > .flex-wrap.gap-2.flex`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `#website > .tool-card-num`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `#website > .tracking-\[-0\.01em\]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `#website > .leading-relaxed.mb-6.text-sm`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `#website > .flex-wrap.gap-2.flex`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.lg\:col-span-7.lg-glass-card.col-span-12 > .justify-between.gap-4.mb-6`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `li:nth-child(1) > label > input`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `li:nth-child(1) > label > .checklist-body`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `li:nth-child(1) > label > .is-urgent.checklist-due`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `li:nth-child(2) > label > input`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `li:nth-child(2) > label > .checklist-body`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `li:nth-child(2) > label > .is-urgent.checklist-due`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `input[aria-label="Mark complete: RSVP reminders"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `li:nth-child(3) > label > .checklist-body`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `li:nth-child(3) > label > .checklist-due`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `input[aria-label="Mark complete: outfit fittings"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `li:nth-child(4) > label > .checklist-body`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `li:nth-child(4) > label > .checklist-due`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `input[aria-label="Mark complete: mehendi artist"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `li:nth-child(5) > label > .checklist-body`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `li:nth-child(5) > label > .checklist-due`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `li:nth-child(6) > label > input`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `li:nth-child(6) > label > .checklist-body`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `li:nth-child(6) > label > .checklist-due`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `input[aria-label="Mark complete: hotel block"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `li:nth-child(7) > label > .checklist-body`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `li:nth-child(7) > label > .checklist-due`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `input[aria-label="Mark complete: pandit"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `li:nth-child(8) > label > .checklist-body`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `li:nth-child(8) > label > .checklist-due`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.lg\:col-span-5.lg-glass-card.col-span-12 > .justify-between.gap-4.mb-6`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.pl-7 > .relative:nth-child(1) > .text-ink.font-display.font-bold`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.pl-7 > .relative:nth-child(1) > .text-sm.text-muted`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.relative:nth-child(1) > .mt-1.tracking-widest.text-muted-soft`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.pl-7 > .relative:nth-child(2) > .text-ink.font-display.font-bold`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.pl-7 > .relative:nth-child(2) > .text-sm.text-muted`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.relative:nth-child(2) > .mt-1.tracking-widest.text-muted-soft`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.opacity-80.relative:nth-child(3) > .text-ink.font-display.font-bold`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.opacity-80.relative:nth-child(3) > .text-sm.text-muted`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.opacity-80.relative:nth-child(3) > .mt-1.tracking-widest.text-muted-soft`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.opacity-80.relative:nth-child(4) > .text-ink.font-display.font-bold`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.opacity-80.relative:nth-child(4) > .text-sm.text-muted`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.opacity-80.relative:nth-child(4) > .mt-1.tracking-widest.text-muted-soft`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.opacity-80.relative:nth-child(5) > .text-ink.font-display.font-bold`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.opacity-80.relative:nth-child(5) > .text-sm.text-muted`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.opacity-80.relative:nth-child(5) > .mt-1.tracking-widest.text-muted-soft`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.opacity-80.relative:nth-child(6) > .text-ink.font-display.font-bold`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.opacity-80.relative:nth-child(6) > .text-sm.text-muted`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.opacity-80.relative:nth-child(6) > .mt-1.tracking-widest.text-muted-soft`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.opacity-80.relative:nth-child(7) > .text-ink.font-display.font-bold`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.opacity-80.relative:nth-child(7) > .text-sm.text-muted`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] All page content should be contained by landmarks — all
  - Where: `.opacity-80.relative:nth-child(7) > .mt-1.tracking-widest.text-muted-soft`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Some page content is not contained by landmarks
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.pl-7`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/event-control/our-journey.html

- [P0][a11y] Elements must only use supported ARIA attributes — all
  - Where: `.is-active`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  ARIA attribute is not allowed: aria-selected="true"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Elements must only use supported ARIA attributes — all
  - Where: `a[href$="overview.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  ARIA attribute is not allowed: aria-selected="false"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `#oj-add`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.oj-tag-next`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.1pt (9.5px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.oj-tag-day`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 7.1pt (9.5px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.mt-20`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.mt-20`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="guests.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Invitations"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="planning.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="media.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="general.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/event-settings/admins.html

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.is-active`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `button[data-es-add-admin=""]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.es-section-tag`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.is-owner`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.es-admin-avatar--sj`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.86 (foreground color: #ee3f3a, background color: #342222, font size: 10.5pt (14px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.es-admin-row:nth-child(3) > .es-admin-role`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.86 (foreground color: #ee3f3a, background color: #342222, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.es-admin-avatar--mr`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.86 (foreground color: #ee3f3a, background color: #342222, font size: 10.5pt (14px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.es-admin-row:nth-child(4) > .es-admin-role`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.86 (foreground color: #ee3f3a, background color: #342222, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.es-admin-avatar--ek`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.86 (foreground color: #ee3f3a, background color: #342222, font size: 10.5pt (14px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.es-admin-row:nth-child(5) > .es-admin-role`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.86 (foreground color: #ee3f3a, background color: #342222, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/event-settings/general.html

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.is-active`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.btn-pill-primary`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `button[data-es-delete=""]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.33 (foreground color: #ee3f3a, background color: #201c1e, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/event-settings/guest-list.html

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.is-active`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.btn-pill-primary`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#es-plus-one-cap`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/event-settings/plan-billing.html

- [P1][responsive] Horizontal scroll detected — 768px
  - Where: `document.documentElement`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass responsive standard, but failed.
  - Evidence: scrollWidth=921 vs innerWidth=768
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.is-active`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.es-section-tag`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.es-plan-tag--ink`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 6.8pt (9px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `button[data-es-upgrade="premium"] > span:nth-child(1)`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.is-featured > .es-plan-tag`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 6.8pt (9px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `button[data-es-upgrade="elite"] > span:nth-child(1)`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/event-settings/registry.html

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.is-active`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `button[data-es-save-toast="REGISTRY SAVED"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `button[data-es-save-toast="REGISTRY LINK ADDED"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `button[data-es-save-toast="CASH FUND CREATED"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/event-settings/website.html

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.is-active`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.btn-pill-primary`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.es-section-tag`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.13 (foreground color: #ee3f3a, background color: #321b1b, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.btn-pill-danger`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.33 (foreground color: #ee3f3a, background color: #201c1e, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/guests/guests.html

- [P0][a11y] Elements must only use supported ARIA attributes — all
  - Where: `a[aria-label="Dashboard"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  ARIA attribute is not allowed: aria-selected="true"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Elements must only use supported ARIA attributes — all
  - Where: `a[href$="overview.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  ARIA attribute is not allowed: aria-selected="false"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.gm-rate-sub`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 8.9pt (11.84px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `span[data-gm-total=""]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 8.9pt (11.84px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `button[data-gm-filter="all"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 9.6pt (12.8px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `span[data-gm-chip="all"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 9.6pt (12.8px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.guest-row-head > span:nth-child(2)`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 7.4pt (9.92px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.grh-rsvp`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 7.4pt (9.92px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.mt-20`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.mt-20`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="guests.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Invitations"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="planning.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="media.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="general.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/invitations/invitations.html

- [P0][a11y] Elements must only use supported ARIA attributes — all
  - Where: `a[aria-label="Dashboard"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  ARIA attribute is not allowed: aria-selected="true"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Elements must only use supported ARIA attributes — all
  - Where: `a[href$="overview.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  ARIA attribute is not allowed: aria-selected="false"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.mt-20`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.mt-20`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="guests.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="invitations.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="planning.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="media.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="general.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `ul`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/media/media.html

- [P0][a11y] Elements must only use supported ARIA attributes — all
  - Where: `a[aria-label="Dashboard"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  ARIA attribute is not allowed: aria-selected="true"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Elements must only use supported ARIA attributes — all
  - Where: `a[href$="overview.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  ARIA attribute is not allowed: aria-selected="false"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.mt-20`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.mt-20`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="guests.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Invitations"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="planning.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="media.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="general.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `ul`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/planning/planning.html

- [P0][a11y] Elements must only use supported ARIA attributes — all
  - Where: `a[aria-label="Dashboard"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  ARIA attribute is not allowed: aria-selected="true"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Elements must only use supported ARIA attributes — all
  - Where: `a[href$="overview.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  ARIA attribute is not allowed: aria-selected="false"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `#plan-tab-checklist`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 10.2pt (13.6px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `button[data-plan-status="all"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 9.6pt (12.8px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `span[data-plan-chip="all"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 9.6pt (12.8px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `#plan-view-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 9.4pt (12.48px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-15`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-16`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-18`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-17`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-19`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-20`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-30`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-21`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-22`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-23`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-24`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-25`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-29`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-26`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-27`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-28`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-1`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-2`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-3`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-4`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-10`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-6`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-5`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-7`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-8`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-11`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-12`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-13`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-14`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Form elements must have labels — all
  - Where: `#plan-task-chk-9`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element has no placeholder attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.mt-20`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.mt-20`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="guests.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Invitations"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="planning.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="media.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="general.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/settings/settings.html

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `section:nth-child(3) > .settings-section-head > h2`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.37 (foreground color: #dc3b36, background color: #0d0d0d, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.settings-security-actions > .btn-pill-primary.btn-pill[type="button"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.73 (foreground color: #ebebeb, background color: #dc3b36, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.mt-20`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.mt-20`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `ul`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/website/card-templates.html

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `button[data-style-filter="all"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 9.6pt (12.8px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one banner landmark — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one banner landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="guests.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Invitations"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="planning.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="media.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="general.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/website/design.html

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one banner landmark — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one banner landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="guests.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Invitations"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="planning.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="media.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="general.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/website/edit-page.html

- [P2][a11y] ARIA role should be appropriate for the element — all
  - Where: `li[data-uid="s1"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  ARIA role group is not allowed for given element
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] ARIA role should be appropriate for the element — all
  - Where: `li[aria-label="Photo"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  ARIA role group is not allowed for given element
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] ARIA role should be appropriate for the element — all
  - Where: `li[data-uid="s3"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  ARIA role group is not allowed for given element
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P0][a11y] Certain ARIA roles must contain particular children — all
  - Where: `#ep-sections`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has children which are not allowed: [role=group]
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `#ep-meta-tier`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.epv-section:nth-child(1) > .epv-paragraph`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 1.35 (foreground color: #4f161d, background color: #0d0d0d, font size: 9.8pt (13.12px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.epv-section:nth-child(3) > .epv-paragraph`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 1.35 (foreground color: #4f161d, background color: #0d0d0d, font size: 9.8pt (13.12px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one banner landmark — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one banner landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="guests.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Invitations"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="planning.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="media.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="general.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/website/edit-pages.html

- [P2][a11y] ARIA role should be appropriate for the element — all
  - Where: `a[href$="#cover"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  ARIA role listitem is not allowed for given element
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] ARIA role should be appropriate for the element — all
  - Where: `a[href$="#hero"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  ARIA role listitem is not allowed for given element
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] ARIA role should be appropriate for the element — all
  - Where: `a[href$="#schedule"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  ARIA role listitem is not allowed for given element
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] ARIA role should be appropriate for the element — all
  - Where: `a[href$="#wedding-party"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  ARIA role listitem is not allowed for given element
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] ARIA role should be appropriate for the element — all
  - Where: `a[href$="#password"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  ARIA role listitem is not allowed for given element
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] ARIA role should be appropriate for the element — all
  - Where: `a[href$="#qa"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  ARIA role listitem is not allowed for given element
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] ARIA role should be appropriate for the element — all
  - Where: `.gs-tile[href$="photos.html"][role="listitem"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  ARIA role listitem is not allowed for given element
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] ARIA role should be appropriate for the element — all
  - Where: `a[href$="#publish"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  ARIA role listitem is not allowed for given element
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `a[href$="#cover"] > .gs-tile-state[aria-label="Done"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `a[href$="#hero"] > .gs-tile-state[aria-label="Done"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `a[href$="#schedule"] > .gs-tile-state[aria-label="Done"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `button[data-dp-share=""]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.4pt (12.48px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `span[title="Private — guest must unlock"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `li[data-page="schedule"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `li[data-page="story"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `li[data-page="wedding-party"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.is-hidden > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 2.23 (foreground color: #8e2a27, background color: #19100f, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `li[data-page="travel"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `li[data-page="qa"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `li[data-page="gallery"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `#dp-tip-h`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.35 (foreground color: #ee3f3a, background color: #221b1d, font size: 9.4pt (12.48px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.dp-tip-body > a[href$="guests.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.35 (foreground color: #ee3f3a, background color: #221b1d, font size: 10.2pt (13.6px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one banner landmark — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one banner landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Guest management"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Invitations"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="planning.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="media.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="general.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/website/overview.html

- [P2][a11y] ARIA role should be appropriate for the element — all
  - Where: `a[href$="#cover"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  ARIA role listitem is not allowed for given element
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] ARIA role should be appropriate for the element — all
  - Where: `a[href$="#hero"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  ARIA role listitem is not allowed for given element
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] ARIA role should be appropriate for the element — all
  - Where: `a[href$="#schedule"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  ARIA role listitem is not allowed for given element
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] ARIA role should be appropriate for the element — all
  - Where: `a[href$="#wedding-party"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  ARIA role listitem is not allowed for given element
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] ARIA role should be appropriate for the element — all
  - Where: `a[href$="#password"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  ARIA role listitem is not allowed for given element
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] ARIA role should be appropriate for the element — all
  - Where: `a[href$="#qa"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  ARIA role listitem is not allowed for given element
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] ARIA role should be appropriate for the element — all
  - Where: `.gs-tile[href$="photos.html"][role="listitem"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  ARIA role listitem is not allowed for given element
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] ARIA role should be appropriate for the element — all
  - Where: `a[href$="#publish"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  ARIA role listitem is not allowed for given element
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `a[href$="#cover"] > .gs-tile-state[aria-label="Done"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `a[href$="#hero"] > .gs-tile-state[aria-label="Done"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `a[href$="#schedule"] > .gs-tile-state[aria-label="Done"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `button[data-dp-share=""]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.4pt (12.48px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `span[title="Private — guest must unlock"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `li[data-page="schedule"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `li[data-page="story"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `li[data-page="wedding-party"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.is-hidden > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 2.23 (foreground color: #8e2a27, background color: #19100f, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `li[data-page="travel"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `li[data-page="qa"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `li[data-page="gallery"] > .dp-page-meta > .dp-tier-private.dp-page-tier`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.17 (foreground color: #ee3f3a, background color: #2d1c1e, font size: 7.8pt (10.4px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `#dp-tip-h`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.35 (foreground color: #ee3f3a, background color: #221b1d, font size: 9.4pt (12.48px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.dp-tip-body > a[href$="guests.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.35 (foreground color: #ee3f3a, background color: #221b1d, font size: 10.2pt (13.6px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one banner landmark — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one banner landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Guest management"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Invitations"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="planning.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="media.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="general.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/website/photos.html

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.dp-card-head-aux > .btn-pill-primary.btn-pill[data-ph-add=""]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 8.3pt (11px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `article[data-cover="true"] > .dp-photo-cover-badge`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 6.8pt (9px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one banner landmark — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one banner landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="guests.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Invitations"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="planning.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="media.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="general.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/website/templates/bold-festive.html

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.tpl-aside-bodynote`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 8.6pt (11.52px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one banner landmark — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one banner landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="guests.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Invitations"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="planning.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="media.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Event settings"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/website/templates/classic-romance.html

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.tpl-aside-bodynote`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 8.6pt (11.52px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.btn-pill-lg`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one banner landmark — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one banner landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="guests.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Invitations"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="planning.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="media.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Event settings"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/website/templates/garden-soft.html

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.tpl-aside-bodynote`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 8.6pt (11.52px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.btn-pill-lg`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one banner landmark — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one banner landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="guests.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Invitations"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="planning.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="media.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Event settings"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/website/templates/index.html

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one banner landmark — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one banner landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="guests.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Invitations"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="planning.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="media.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Event settings"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/website/templates/midnight-elegant.html

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.tpl-aside-bodynote`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 8.6pt (11.52px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.btn-pill-lg`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one banner landmark — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one banner landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="guests.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Invitations"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="planning.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="media.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Event settings"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

## pages/website/templates/minimal-modern.html

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(1) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must only use permitted ARIA attributes — all
  - Where: `.is-unread.fn-notif-item:nth-child(2) > .fn-notif-unread[aria-label="Unread"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  aria-label attribute cannot be used on a span with no valid role attribute.
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.tpl-aside-bodynote`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 4.12 (foreground color: #7a7a7a, background color: #18181b, font size: 8.6pt (11.52px), font weight: normal). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Elements must meet minimum color contrast ratio thresholds — all
  - Where: `.btn-pill-lg`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element has insufficient color contrast of 3.88 (foreground color: #ffffff, background color: #ee3f3a, font size: 9.8pt (13px), font weight: bold). Expected contrast ratio of 4.5:1
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one banner landmark — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one banner landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Document should not have more than one contentinfo landmark — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Document has more than one contentinfo landmark
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.section-head`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P2][a11y] Landmarks should have a unique role or role/label/title (i.e. accessible name) combination — all
  - Where: `.dp-foot`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="guests.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Invitations"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="planning.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[href$="media.html"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Links must have discernible text — all
  - Where: `a[data-label="Event settings"]`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix all of the following:
  Element is in tab order and does not have accessible text

Fix any of the following:
  Element does not have text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

- [P1][a11y] Scrollable region must have keyboard access — all
  - Where: `.fn-notif-list`
  - Repro: Load page at specified viewport / run automated check.
  - Expected vs Actual: Element should pass a11y standard, but failed.
  - Evidence: Fix any of the following:
  Element should have focusable content
  Element should be focusable
  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).

