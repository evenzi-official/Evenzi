# Antigravity test runbook — Planning (`planning`)

You are testing the Evenzi **Planning** page (Checklist + Budget) in `designs/pages/planning/`. You start with no prior context.

## Read first
1. `_test.md` (this folder) — the test source of truth. Run every row.
2. The built page served via `npm run design` (http://localhost:4000) → `designs/pages/planning/planning.html`.

## Steps
1. **Run section 1 (Smoke) FIRST.** If any of `1.smoke / 1.styled / 1.databody / 1.chrome` FAILS, record it and STOP — the page is structurally broken; deeper rows would false-pass. Flag for rebuild.
2. If smoke passes, work through sections 2–6 in order. Exercise both tabs, both empty states (budget-unset, checklist all-done), the over-budget state (add expenses exceeding the budget), and the long-content / crore-scale / div-zero edge rows.
3. For **manual** rows (section 7, tagged "agent: skip and flag for human") record `SKIP (human)`. `7.whatsapp` is n/a (host-only) — record `N/A`.
4. Record every row in `_findings.md` under a new `## <today> — Antigravity — against SPEC_VERSION 2026-06-05.1` heading, one table line per row ID: `| <row id> | PASS/FAIL/SKIP/N/A | note (repro for FAIL) |`.

## When done
Update `_status.md`: `STAGE: REVIEW`, `UPDATED: <today> — Antigravity`, `NEXT: /spec-kit-review planning`.
