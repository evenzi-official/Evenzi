# Cursor fix-doc — QA loop-3 (a11y nits, verified real)

Small a11y set, verified against the code (axe over-reports — only the real ones below). Most live in the **shared notification-panel chrome** (`.fn-notif-*`) — **find where it's defined (shell.js inject or per-page markup) and fix at the SOURCE so all ~27 pages get it once.** Read `ai/agents/ui_ux_designer.md` + `.cursor/rules/evenzi-design.mdc`; run self-review + self-test. Complete + correct, no regressions.

## Fixes

1. **[a11y] `aria-prohibited-attr` — `.fn-notif-unread` span.** A roleless `<span class="fn-notif-unread" aria-label="Unread">` can't carry `aria-label`. Fix: make the dot `aria-hidden="true"` and convey "Unread" with a visually-hidden text node (`<span class="sr-only">Unread</span>`) in the notif item, OR give the dot `role="img" aria-label="Unread"`. **Verify:** no `aria-label` on a roleless span remains in the notif chrome.

2. **[a11y] `scrollable-region-focusable` — `.fn-notif-list`.** The scrollable notifications list isn't keyboard-reachable. Add `tabindex="0"` (+ an `aria-label` if it's not already labelled by the dialog) so keyboard users can scroll it. Apply the same to any other genuinely-scrollable container axe flagged that has no focusable children. **Verify:** `.fn-notif-list` has `tabindex="0"`.

3. **[a11y] `color-contrast` — `.fn-notif-time`.** The muted timestamp text is below WCAG AA (4.5:1). Bump its color token (e.g. `--muted-soft` → `--muted`, or a token that hits ≥4.5:1 on the panel background) in **both** light and dark. **Verify:** computed contrast ≥4.5:1 in dark mode.

4. **[a11y] `aria-allowed-attr` — nav-tab links (5 pages).** When `role="tab"` was removed from the cross-page nav links, a disallowed aria attr was left behind (likely `aria-selected`) on `<a class="nav-tab">`. Find + remove it across all affected pages (a link may keep `aria-current="page"` — that IS allowed; remove only `aria-selected` / other tab-only attrs). **Verify:** `grep -rn 'nav-tab' designs/pages designs/components.html | grep aria-selected` → 0.

5. **[a11y] `link-name` — verify before fixing.** Most are in `components.html` (the dev catalog `.cs-static-nav` demo) — **leave those**. But check the real `[href="#"]` nav-tab flagged: if it's an icon-only link on a real page with no accessible name, add an `aria-label`; if it's catalog demo, skip. Don't add labels to the catalog showcase.

## When done
Self-review + self-test. Report: where the notif chrome lives (shell vs per-page) and that the fix is at the source; the grep proofs (#1, #4); the #3 dark-mode contrast ratio; which `link-name` you fixed vs left as catalog. `git status` only intended files.
