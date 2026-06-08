# Antigravity test runbook — {{PAGE_TITLE}} (`{{PAGE_SLUG}}`)

You are testing the Evenzi **{{PAGE_TITLE}}** page in `designs/pages/{{PAGE_SLUG}}/`. You start with no prior context.

## Read first
1. `_test.md` (this folder) — the test source of truth. Run every row.
2. The built page served via `npm run design` (http://localhost:4000) → `designs/pages/{{PAGE_SLUG}}/{{PAGE_SLUG}}.html`.

## Steps
1. **Run section 1 (Smoke) FIRST.** If any of `1.smoke / 1.styled / 1.databody / 1.chrome` FAILS, record it and STOP — the page is structurally broken; deeper rows would false-pass. Flag for rebuild.
2. If smoke passes, work through sections 2–6 in order.
3. For **manual** rows (section 7, tagged "agent: skip and flag for human"): do not attempt; record `SKIP (human)` so they're visible.
4. Record every row in `_findings.md` under a new `## <today> — Antigravity — against SPEC_VERSION <v>` heading, one table line per row ID: `| <row id> | PASS/FAIL/SKIP | note (repro for FAIL) |`.

## When done
Update `_status.md`: `STAGE: REVIEW`, `UPDATED: <today> — Antigravity`, `NEXT: /spec-kit-review {{PAGE_SLUG}}`.
