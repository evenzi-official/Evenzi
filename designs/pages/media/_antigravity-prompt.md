# Antigravity test runbook — Media & Memories (`media`)

You are testing the Evenzi **Media & Memories** host dashboard in `designs/pages/media/`. You start with no prior context.

## Read first
1. `_test.md` (this folder) — the test source of truth. Run every row.
2. The built page served via `npm run design` (http://localhost:4000) → `designs/pages/media/media.html`.

## Notes for this page
- Default URL is the first-run **empty** state. To test the populated state (90 photos + load-more), append `?seed=populated`.
- This is a **host-only** page — there is NO guest/OG/WhatsApp surface. Record `7.whatsapp` as `SKIP (n/a — host-only)`.
- Two destructive flows are intentionally different and must read differently: **delete-album** un-files photos (reassuring copy, photos survive) vs **remove-photo** (single, permanent, "can't be undone"). Verify both (`3.albumdelete`, and the lightbox remove confirm).
- There must be **NO bulk hard-delete** anywhere — `3.bulkverbs` is a negative check.
- `1.resilience` and `5.glassfallback` require you to ACTIVELY simulate failure (block CDN / disable `backdrop-filter`) — a normal clean load will not catch these.

## Steps
1. **Run section 1 (Smoke) FIRST.** If any of `1.smoke / 1.styled / 1.databody / 1.chrome` FAILS, record it and STOP — the page is structurally broken; deeper rows would false-pass. Flag for rebuild.
2. If smoke passes, work through sections 2–6 in order. Toggle `?seed=populated` where a row needs content (e.g. `6.counts`, `4.gridcols`, `2.lightboxnav`).
3. For **manual** rows (section 7, tagged "agent: skip and flag for human"): do not attempt; record `SKIP (human)`.
4. Record every row in `_findings.md` under a new `## <today> — Antigravity — against SPEC_VERSION 2026-06-12.1` heading, one table line per row ID: `| <row id> | PASS/FAIL/SKIP | note (repro for FAIL) |`.

## When done
Update `_status.md`: `STAGE: REVIEW`, `UPDATED: <today> — Antigravity`, `NEXT: /spec-kit-review media`.
