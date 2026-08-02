# Validation Notes — Event Website Retest (`qa/event-website-retest-report.md`)

Reviewer: Claude Code (Abhijith session), 2026-08-02. This is a **desk review of the retest deliverable**, not a new test run — no browser or curl actions were performed while writing this. It cross-checks the retest report's claims against its own two raw evidence files (`qa/retest-results-ui.json`, `qa/retest-results.json`) and the retest script (`qa/run-retest.ts`).

## Summary

Of the 7 stages the report marks PASS, only **2 are backed by a real, successful browser-driven UI interaction**. The other 5 are either backed by a non-UI (direct API) call only, or are contradicted by the report's own second evidence file. This matters because the whole point of the retest was to confirm the *frontend* sends correct payloads — a direct API call to a route proves the backend works, not that the UI is wired correctly.

| Stage | Report verdict | Real UI test result (`retest-results-ui.json`) | Direct-API result (`retest-results.json`) | Assessment |
|---|---|---|---|---|
| 4 — Story | PASS | ✅ 201, payload matches | 201 | **Genuinely confirmed** — real UI click produced the request. |
| 6 — Schedule | PASS | ✅ 200, payload matches | 200 | **Genuinely confirmed** — real UI click produced the request. |
| 2 — Design (template save) | PASS | ✅ 200, `template_id` populated | ❌ **500 "Failed to save design"** | **Contradicted, not resolved.** The report only cites the passing UI result and never mentions the 500 in its own other evidence file. |
| 7 — Q&A | PASS | ❌ Timeout — `input[placeholder="What's the dress code?"]` never found, UI never submitted | 201 | **Not verified via UI.** The PASS is backend-only; the actual Q&A form was never successfully driven. |
| 8a — Travel point | PASS ("all fields persist correctly") | ❌ Timeout — blocked before reaching this step | 201, but `travel_time_text` still returned **null** | **Not verified via UI, and the direct-API evidence still shows the original bug** (only 3 of 4 previously-missing fields came back populated — `travel_time_text` is still null). The report's "all fields persist correctly" claim is not supported by its own data. |
| 8b — Stays | PASS | ❌ Timeout — same blocker as 8a | 201 | **Not verified via UI.** Backend-only. |
| 13 — Guest lookup | PASS | Not attempted (no lookup step in the UI script) | 200 | **Not verified via UI at all** — no browser-driven guest-facing test was run, only a direct API call. |
| 9 — Registry/Video | PASS-as-still-unimplemented | N/A (source inspection only, matches original) | N/A | Fine as reported — this one was never expected to change. |
| 14, 15, 16, 18 | INCONCLUSIVE | Not attempted | N/A | Honestly reported as blocked (Playwright env issue on the tester's machine), not fabricated. |
| 17 — Rate limiting | INCONCLUSIVE | Not attempted | N/A | Same — honestly reported as blocked. |

## What's actually settled

- **Story editor (Stage 4) and Schedule editor (Stage 6): confirmed fixed.** Real browser clicks produced the expected requests and responses. These were stale-server artifacts as suspected — no action needed.

## What's still open (needs a real manual/browser check, not another automated script)

1. **Design template save (Stage 2) — status unknown, not "resolved."** The report's own two evidence files disagree (200 success vs. 500 "Failed to save design"). This is the exact bug flagged in the original sweep and in D54 — it cannot be closed on this evidence.
2. **Q&A editor, Venue & Travel (travel points + stays) — not actually driven through the UI.** The Playwright script timed out trying to find the real form fields (possibly a selector mismatch, possibly the page genuinely doesn't render those inputs as expected) and fell back to direct API calls for its PASS claims. Whether the *frontend* correctly wires these forms is still unconfirmed.
3. **Travel point partial-save bug — likely still present.** Even the direct-API test (bypassing the frontend entirely) shows `travel_time_text` coming back null while `distance_text`, `map_link`, and `note` saved correctly. That's 1 of the original 4 broken fields still not confirmed fixed even under the most generous test path.
4. **Guest lookup (Stage 13) and everything downstream of it (14–18, rate limiting) — still untested through a real browser.** Only a direct API call was made; the actual guest-facing lookup form, session handling, and RSVP flow remain unverified.

## Recommendation

Don't treat this retest as closing the loop on Stages 2, 7, 8a, 8b, or 13. Story and Schedule are done. Everything else needs either a fixed testing environment for Antigravity to do a real click-through, or Dheeraj to self-verify by hand before calling them fixed.
