# Handoff: Event Website — Targeted Retest of Failed Stages

## 1. Routing header

- **Tool:** Antigravity (browser-driven testing).
- **Model:** default (Gemini 3 or Sonnet) — pure verification, not a build.
- **Setup:** Repo at `/Users/xcalider/Documents/Projects/Evenzi`, branch `Dev-Vibe`. **Kill any currently running dev server and start a fresh `npm run dev`** before touching anything — this is the whole point of the retest, see §2. Supabase MCP available (project `smjkbmkxweevqpvygabe`, region `ap-northeast-1`) for DB spot-checks.

## 2. Why this retest exists

Your last full sweep (`qa/event-website-test-report.md`, 2026-08-02) reported 7 stages as FAIL and 5 more as INCONCLUSIVE/COULD-NOT-TRIGGER (cascading from Stage 13's failure). We are not accepting that report at face value — we suspect **some, not all, of it is a false report** caused by testing against a stale dev server process that started before Dheeraj's latest routes were pulled into the branch.

Do not assume that's the explanation going in. Retest each item fresh and report exactly what you observe — if a route still doesn't exist, say so plainly; don't soften a real failure because we mentioned the stale-server theory.

If any stage still fails after this retest, treat it as **confirmed** — we'll move straight to filing it as a real bug for a fix, no further retest needed on that item.

## 3. HARD RULE — this is a functional pass, not a visual review

**Do not just look at the pages and describe what you see. Open Chrome, click through each item below as a real host/guest would.** "The route exists in the file tree" is not a finding — "I clicked Add Heading, the POST returned 201, and the row appeared in `event_story_blocks`" is a finding. Every item needs an action you actually performed and an observed result.

## 4. Prerequisites — do these IN ORDER before any retesting

### 4.0 — Confirm the fresh code is actually loaded (do this literally first)

This retest exists because the last run may have hit a dev server process that started before Dheeraj's latest routes were pulled in. Don't repeat that mistake blind:
- **Kill any currently running `npm run dev` process**, then start a new one.
- `git log -1 --format="%h %ad %s"` — confirm `HEAD` is on `Dev-Vibe` and includes commit `b5a8389` ("feat(website): Wave 3 guest website") or later. If it doesn't, `git pull` first.
- `find app/api -ipath "*story-blocks*" -o -ipath "*sub-events*" -o -ipath "*qa-items*" -o -ipath "*stays*"` and `find app/api/e -ipath "*lookup*"` — confirm these route files actually exist on disk before you start clicking. If any is missing at this step, stop and report it as a genuine missing route rather than retesting a route that was never going to exist.

### 4.1 — Environment check
- Dev server up: `http://localhost:3000` loads without a crash page.
- Auth: log in with the test host account (phone OTP `9999999999` / `123456`).
- Test event confirmed reachable: `db6a6dc2-3e3b-4f58-a830-434f1f7cd7d4` (slug `dheeraj-1-dheeraj-2-s-wedding-20261203`) loads its Website tab without errors.
- Supabase MCP reachable for DB spot-checks (project `smjkbmkxweevqpvygabe`).

Once 4.0 and 4.1 both pass, proceed to the retest items below.

## 5. Test data (same as last time)

- Event: `db6a6dc2-3e3b-4f58-a830-434f1f7cd7d4` (slug `dheeraj-1-dheeraj-2-s-wedding-20261203`)
- Host account: same test login used in the original sweep (phone OTP `9999999999` / `123456`)
- For Stage 13: the guest row you inserted manually last time (name "Test Guest", phone `+919876543210`) should still exist in `event_guests` — confirm via Supabase MCP before retesting; re-insert if it's gone.

## 6. Stages to retest, in order, with reason

### Stage 4 — Story page editor
- **Original result:** FAIL — `POST /api/events/[id]/story-blocks` returned 404.
- **Reason for retest:** route file may exist on disk but wasn't loaded by the dev server process at test time.
- **Action:** click "Add Heading" in the Story editor, same as before. Confirm the request either succeeds (201/200) or genuinely 404s. If it 404s again, run `ls app/api/events/[id]/story-blocks/` (or find the actual route path via `find app/api -iname "*story-blocks*"`) and report whether the file exists on disk at all — that distinguishes "route file missing" from "route file exists but server didn't pick it up."

### Stage 6 — Schedule editor
- **Original result:** FAIL — `PATCH /api/events/[id]/sub-events/[subId]` returned 404.
- **Reason for retest:** same stale-server suspicion.
- **Action:** repeat the edit + visibility toggle on a schedule item. If it 404s again, run `find app/api -ipath "*sub-events*"` and report what's actually on disk.

### Stage 7 — Q&A editor
- **Original result:** FAIL — `POST /api/events/[id]/qa-items` returned 404.
- **Reason for retest:** same stale-server suspicion.
- **Action:** repeat adding a Q&A item. If it 404s again, run `find app/api -ipath "*qa-items*"` and report what's on disk.

### Stage 8a — Venue & Travel: travel point partial save
- **Original result:** FAIL (partial) — travel point saved, but only `name`/`kind` persisted; `distance_text`, `travel_time_text`, `map_link`, `note` stayed null in `event_travel_points`.
- **Reason for retest:** this was NOT a 404 — the request succeeded, so it's less likely to be a stale-server artifact and more likely a real payload-mapping bug. Retesting anyway to rule out a one-off (e.g. a field left blank by accident in the first pass rather than a code bug).
- **Action:** add a travel point and **explicitly fill in every field** (name, kind, distance_text, travel_time_text, map_link, note) before saving. Cross-check the DB row via Supabase MCP — report exactly which fields did and didn't persist.

### Stage 8b — Venue & Travel: stays
- **Original result:** FAIL — `POST /api/events/[id]/stays` returned 404.
- **Reason for retest:** stale-server suspicion.
- **Action:** repeat adding a place to stay. If it 404s again, run `find app/api -ipath "*stays*"` and report what's on disk.

### Stage 2 — Design page (template save)
- **Original result:** FAIL — UI showed "Saved ✓" but `template_id` stayed `null` in `event_website_design`; network payload showed `{"template_id":null}` being sent.
- **Reason for retest:** not a 404 (route exists and responds), so unlikely to be stale-server related, but retest to confirm it's reproducible and not a one-off UI state issue (e.g. clicking Apply before the template selection state registered).
- **Action:** navigate to Design page, click the Cinematic Scroll template tile, **wait a beat to confirm it visually shows as selected**, then click Apply. Check the network payload's `template_id` value before it's sent, and check the DB row after. Report both.

### Stage 9 — Registry / Video (generic sections)
- **Original result:** FAIL — UI explicitly shows "Content saved in your browser — server sync planned," confirmed no backend route is wired.
- **Reason for retest:** this one is different from the others — it's not an error, it's an explicit "not implemented yet" message in the UI itself, so a stale server wouldn't explain it either way. Retest only to confirm the message still appears identically (i.e. nothing changed) — we're not expecting this to flip to PASS.
- **Action:** repeat adding a section, confirm the same "saved in browser" message appears, confirm `event_website_sections` is still empty. Report PASS-as-still-unimplemented or note if anything changed.

### Stage 13 — Guest lookup (phone + name)
- **Original result:** FAIL — `POST /api/e/[slug]/lookup` returned 404.
- **Reason for retest:** stale-server suspicion — this is the one blocking Stages 14–18 below.
- **Action:** repeat the lookup form submission with the same test guest. If it 404s again, run `find app/api/e -ipath "*lookup*"` and report what's on disk.

### Stages 14, 15, 16, 18 — re-run only if Stage 13 passes
- **Original result:** INCONCLUSIVE (blocked by Stage 13's 404).
- **Reason for retest:** these were never actually tested, just blocked. If Stage 13 now works, run through them for the first time using the original test plan (`docs/testing/2026-08-02-antigravity-event-website-testing.md`, stages 14–16 and 18) and give them real verdicts. If Stage 13 still fails, leave these as INCONCLUSIVE — don't guess.

### Stage 17 — Rate limiting on lookup
- **Original result:** COULD NOT TRIGGER (blocked by Stage 13).
- **Reason for retest:** same as above — only attempt if Stage 13 now returns real responses (fire the lookup request repeatedly past whatever limit the handoff doc specifies).

## 7. What to document

One markdown report, `qa/event-website-retest-report.md`, structured the same way as the original: per-stage verdict (PASS/FAIL/STILL-FAIL/UNCHANGED), the exact evidence (DB row, network response, `find`/`ls` output for anything still 404ing), and a short summary at the top:
- How many of the 7 original FAILs are now confirmed real vs. resolved by the fresh server.
- Explicit callout for Stage 8a and Stage 2 (the non-404 ones) since those were never expected to be stale-server artifacts — flag clearly if they're still broken, since those go straight to a fix.

## 8. Definition of done

- Fresh dev server confirmed running before any test in this file.
- All 9 items in §4 retested with an explicit verdict, not silently skipped.
- Any route that still 404s has `find`/`ls` evidence of whether the file exists on disk, not just a network-tab screenshot.
- Report saved to `qa/event-website-retest-report.md`.
