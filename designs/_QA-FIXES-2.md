# Cursor fix-doc — QA loop-2 (3 verified fixes, do COMPLETELY)

Small, verified set from the post-fix QA review. Standard: complete + correct, every instance, no regressions. Read `ai/agents/ui_ux_designer.md` (apply its lens) + `.cursor/rules/evenzi-design.mdc` (run design self-review + self-test before done).

## Fixes

1. **[P1][responsive] `pages/event-settings/plan-billing.html` overflows at <1440px.** A real app page exceeds the viewport horizontally (360/390/768/1024). Load it on `:4000`, find the element(s) where `getBoundingClientRect().right > innerWidth` (likely a wide button row, table, plan-comparison grid, or a `min-width`/no-wrap row), and fix so it wraps/stacks/scrolls within its container. **Verify:** at 360/768/1024, `document.documentElement.scrollWidth <= window.innerWidth`. (Other event-settings pages share layout — eyeball them too.)

2. **[P2][a11y] OTP cells need per-cell labels.** `pages/auth/verify-otp.html` `.pin-input-cell` inputs (×6) sit in a labelled `role="group"` but each cell has no own name. Add `aria-label="Digit 1"` … `"Digit 6"` (or `"OTP digit N of 6"`) to each cell. If `pages/auth/auth.js` builds any pin cells dynamically, label them there too. **Verify:** every `.pin-input-cell` has an `aria-label`.

3. **[P2][a11y] Modal action footers create duplicate `contentinfo` landmarks.** Modals use `<footer class="modal-actions">` inside a `<div class="modal-card">` — a `<footer>` not inside a sectioning element becomes a page-level `contentinfo`, so pages with modals report multiple contentinfo (guests 5, planning 5, etc.). **Change every `<footer class="modal-actions">…</footer>` to `<div class="modal-actions">…</div>`** across ALL pages (it's an action-button row, not a page footer). Leave the real page `<footer>` (the `© Evenzi` one) alone. **Verify (whole repo):** `grep -rc '<footer class="modal-actions"' designs/pages` → 0; the one real page footer per page remains.

## NOT a fix (leave)
- `components.html` horizontal width — it's the dev component **catalog** (intentionally wide showcase), not a user page. Do not "fix" its width.

## When done
Design self-review + self-test (ui_ux_designer lens). Report: plan-billing scrollWidth at 360/768/1024; the two grep proofs (`.pin-input-cell` all labelled; 0 `<footer class="modal-actions"`); `git status` only intended files.
