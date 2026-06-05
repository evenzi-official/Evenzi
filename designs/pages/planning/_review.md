# Review — planning

> Append-only. `/spec-kit-review` writes its council/codex assessment of _findings.md here, newest last.
> Each entry: `## <date> — /spec-kit-review` then verdict + actions folded back into _spec.md / _test.md.

## 2026-06-05 — /spec-kit-review — against SPEC_VERSION 2026-06-05.1 → patched to 2026-06-05.2

**Verdict: 🔁 LOOP → BUILD** (2 minor confirmed defects; everything else verified correct).

### Fix-list for Cursor (do exactly these, then bump _status.md → TEST)
1. **`planning.js` (~line 193)** — tab `ArrowLeft` is a no-op. `(i + 1 + 1) % 2` evaluates to `i` (re-selects the current tab). Change the roving-tabindex handler so both arrows toggle the 2-tab control, e.g. `var next = (i + 1) % 2;` for both ArrowLeft and ArrowRight.
2. **`planning.html` lines ~302 and ~332** — remove the inline `style="color:var(--brand)"` on the required-field `*` asterisks (violates no-inline-CSS). Replace with a utility class (`class="text-brand"`) or a small `.req-mark` rule in `planning.css`. (Leave line ~122's `style="font-size:15px"` — that's pre-existing shell breadcrumb chrome, not part of this build.)

### Per-finding rulings (vs Antigravity _findings.md)
- **Uphold** all PASS rows EXCEPT below — code independently confirms data shapes, derived totals + div-zero guards, en-IN currency + tabular-nums, reuse discipline, glass cap (1 surface + `@supports` fallback), modals, XSS-safe DOM, states.
- **Overrule `3.tablist` PASS → FAIL** — `ArrowLeft` does not move focus/selection (defect #1). ArrowRight works, so both tabs are still reachable, hence minor.
- **New defect not in the matrix:** 2 inline styles (defect #2) — Antigravity couldn't catch it because `_test.md` had no inline-style row (test gap, now patched).
- **`6.longcontent`** — PASS accepted, but the note "truncation handles wrapping" is imprecise: money is `white-space:nowrap` (correct — no `text-overflow:ellipsis` present, values are not truncated). Crore-scale ₹ fit at 360px flagged for the manual on-device pass.
- **`7.device`** SKIP (human), **`7.whatsapp`** N/A — correct.

### Kit patches made this review
- `_test.md`: added `2.noinline` (no inline `style=` attributes in page HTML) and clarified `3.tablist` to require BOTH arrow keys. SPEC_VERSION bumped 2026-06-05.1 → **2026-06-05.2**.
- `_spec.md`: SPEC_VERSION bumped to 2026-06-05.2 (no content change; the build already matches — only the two fixes above remain).

_Re-run note: findings above were recorded against SPEC_VERSION 2026-06-05.1; the spec/test are now at 2026-06-05.2. After Cursor applies the 2 fixes and Antigravity re-tests `3.tablist` + `2.noinline`, re-run /spec-kit-review planning to close to DONE._
