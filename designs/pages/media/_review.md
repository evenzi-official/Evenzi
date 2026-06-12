# Review — media

> Append-only. `/spec-kit-review` writes its council/codex assessment of _findings.md here, newest last.
> Each entry: `## <date> — /spec-kit-review` then verdict + actions folded back into _spec.md / _test.md.

## 2026-06-12 — /spec-kit-review media — against SPEC_VERSION 2026-06-12.1 (R-final)

**Inputs:** `_findings.md` (3 passes — Antigravity initial, Claude post-change, Antigravity R-final: all rows PASS except the 2 manual SKIPs). Scoped review = code_reviewer + frontend_engineer on `designs/pages/media/*` + the shell promote/font-vendoring.

**Verdict: 🟢 DONE** — 2 confirmed matrix-blind defects found, both fixed inline + re-verified. No remaining defects on the Media page.

### Confirmed defects (FIXED this pass)
1. **[major] `.dp-tile-trigger` left behind in the promote** — the button-reset rule (`width:100%;background:none;border:0;padding:0`) lived only in `website.css`, which `media.html` doesn't load, so Media's photo/album tile triggers fell back to UA-default button chrome. The PASS matrix (`2.tile` checks states, not the reset) couldn't catch it. **Fix:** promoted `.dp-tile-trigger` (+`:focus-visible`) into `shell.css` next to the `.dp-tile`/`.photo-tile` family; deleted the `website.css` copy. Verified: Media + photos.html both resolve it from shell (width fills cell, padding 0, no border); photos.html 12 tiles intact, console clean.
2. **[important] Tab switch didn't clear select-mode** — switching from Photos to Albums/Videos mid-selection left the floating `.bulk-bar` orphaned over another panel and `#md-all[data-select-mode]` latched. `planning.js` guards this (`exitSelect()`); the Media tab port dropped it. **Fix:** `media.js wireTabs.select()` now calls `setSelectMode(false)` when leaving the Photos tab while selecting. Verified: select 1 → switch → bulk-bar `hidden`, `data-select-mode="off"`.

### Suggestions (not blocking — logged)
- Tab-wiring helper: Media's generic n-tab `wireTabs` (Home/End, scales) is better than planning's 2-tab handler — candidate to promote ONE tab helper to `shell.js` so the next page doesn't add a 3rd style.
- Stale row hygiene: `_findings.md` row `1.resilience FAIL` is the pre-vendoring Antigravity result; superseded by `8.resilience2 PASS` in the R-final pass (annotated below).

### Cross-cutting follow-up (NOT a Media-page defect — separate task)
- Cursor's font-vendoring sweep was repo-wide but **missed 7 pages still linking `fonts.googleapis.com`**: `website/design.html` + the 6 `website/templates/*.html`. Media + all other pages are vendored. These 7 need the same `<link>`→local swap to fully close `1.resilience` repo-wide. Tracked as a follow-up; does not block Media DONE.

### Kit patches
- None to `_spec.md`/`_test.md` (defects were build bugs, not spec/test gaps) → no SPEC_VERSION bump.

