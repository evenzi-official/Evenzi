# Handoff: Media & Memories — Full Visual + Functional Sweep

## 1. Routing header

- **Tool:** Antigravity (browser-driven testing).
- **Model:** default (Gemini 3 or Sonnet) — pure verification, not a build.
- **Setup:** Repo at `/Users/xcalider/Documents/Projects/Evenzi`, branch `Dev-Vibe`. Start `npm run dev` (port 3000). If Supabase MCP is available (project `smjkbmkxweevqpvygabe`, region `ap-northeast-1`), use it to spot-check database rows and R2 object keys after key mutations — a tile that "looks uploaded" is not proof, a real DB row + a real R2 object is.

## 2. Objective & context

Media & Memories (photo/video gallery + albums, R2-backed) finished its backend-wiring pass on 2026-08-01: presigned upload pipeline, commit-route hardening (dual-key verification, magic-byte checks, idempotency), signed-URL read routes, delete/bulk-delete, full album CRUD, a real storage meter. It went through 13 subagent-built tasks, individually reviewed, plus a final whole-branch review that caught and fixed 2 Critical bugs (cross-event IDOR on the commit route, `thumbnail_key` never being served so video tiles rendered `<img src>` against raw `.mp4` files). All of that is code review — **this is the first time anyone has actually opened the feature in a real browser and used it.** Code review does not catch a stalled video-seek timeout, a HEIC file that silently fails to decode, or a signed URL that doesn't actually recover after expiry. Only clicking through it does.

Full design spec (read before starting, has the authoritative test list this prompt summarizes): [`docs/superpowers/specs/2026-07-31-media-memories-fe-wiring-design.md`](../superpowers/specs/2026-07-31-media-memories-fe-wiring-design.md) §8.

## 3. HARD RULE — this is a functional pass, not a visual review

**Do not just look at the page and describe what you see. Open Chrome, click things, upload real files, delete real rows, and report exactly where it breaks.** "The upload UI renders correctly" is not a finding — "I uploaded a 4MB JPEG, the progress bar reached 100%, the tile appeared in the grid, and the DB row's `byte_size` matched the real file size" is a finding. Every checkpoint below needs an action you actually performed and an observed result, not a visual impression. If something looks fine but you didn't click it, say so explicitly rather than reporting it as verified.

## 4. Prerequisite — environment check (do this FIRST, before any functional testing)

Do not start Stage 1 until every item below is confirmed. If any item fails, **stop and report exactly what's broken** — do not attempt functional testing against a broken environment, since every downstream finding would be noise.

1. **Dev server up:** `npm run dev` running, `http://localhost:3000` loads without a crash page.
2. **Auth works:** log in with the test account (phone OTP, `9999999999` / `123456`, India region). Confirm you land on the host dashboard, not an error page.
3. **An event with existing media exists, or you can create one:** either pick an existing event from the dashboard or create a throwaway one — you'll need it seeded before Stage 1.
4. **Media page loads clean:** navigate to that event's Media & Memories page (`app/events/[id]/media`). Open the browser console. Confirm:
   - No red console errors on initial load.
   - The storage meter renders a real number (not stuck on a loading skeleton, not visibly a hardcoded placeholder like a suspiciously round "0 MB of 5 GB" with nothing uploaded yet — that's expected on a fresh event, just confirm it's a live read, not frozen).
5. **R2 is actually configured server-side** (you can't check `.env.local` directly, but you can prove it indirectly): attempt one small test upload (see Stage 1 below) as your environment-check proof. If the presigned-URL request 500s or the R2 PUT fails outright (not a validation rejection — an actual network/auth failure), that's an environment problem, not a feature bug. Report it as an environment blocker, distinct from a functional bug, and stop.
6. **Confirm the untouched route:** `app/api/media/[...key]/route.ts` (the pre-existing GET-only public media proxy) still exists and its `ALLOWED_PREFIXES` look unmodified — a quick `curl` or file read is enough, not a click-through.

Once all 6 pass, proceed to Stage 1.

## 5. Test data

Use real files, not placeholders:
- At least one real photo (JPEG or PNG, a few MB).
- One HEIC file if you have one available (iPhone photo) — if you genuinely can't get one, note that explicitly as a gap in your report rather than skipping silently.
- One real short video (MP4, doesn't need to be long — 10-30 seconds is fine).
- A batch of 5 files for the bulk-upload stage, with one deliberately invalid (wrong file type, e.g. a `.txt` renamed or a genuinely unsupported format).

## 6. Stages — run in order, same event throughout

### Stage 1 — Single upload, photo + video
- Upload the real photo. Watch the progress indicator reach completion. Confirm the tile appears in the gallery grid with a real thumbnail (not a broken-image icon).
- Upload the real video. Confirm the poster frame renders (not a raw `<video>` src pointed at the `.mp4` directly, not a broken image — this is exactly the class of bug the last review caught, so look closely).
- For both: cross-check via Supabase MCP that `byte_size` in the DB row matches the actual file size, and that `thumbnail_key` is populated (not null) for both rows.
- **Verdict:** PASS/FAIL, with the exact filenames and DB row ids you checked.

### Stage 2 — HEIC upload (if you have a HEIC file)
- Upload it. Confirm it either decodes and displays correctly, or — if it's a HEIC variant the decoder rejects — confirm the failure surfaces as a clear, specific per-file error message, not a silent skip and not a crash of the whole upload batch.
- **Verdict:** PASS/FAIL/SKIPPED (no HEIC file available).

### Stage 3 — Storage meter live-updates
- Note the storage meter's value before an upload, upload a file of known size, confirm the meter updates to reflect it (without requiring a manual page refresh, if the UI claims to auto-refresh — check the actual behavior, don't assume).
- **Verdict:** PASS/FAIL.

### Stage 4 — Batch upload with a deliberate failure
- Upload your 5-file batch (4 valid + 1 invalid) in one action.
- Confirm the 4 valid files complete successfully and the 1 invalid file shows a distinct, specific error in the progress list — not a batch-wide failure, not a silent drop.
- **Verdict:** PASS/FAIL, note whether the concurrency behavior looked reasonable (files completing in a rolling fashion, not all-at-once or one-at-a-time-serial if the spec calls for a concurrency cap).

### Stage 5 — Album CRUD
- Create a new album. Rename it. Assign 2-3 of your uploaded photos/videos to it.
- Re-assign one of those same items to the same album again (should be a silent no-op success, not an error).
- Confirm assignment reflects immediately in the UI and persists on reload.
- Delete the album. Confirm the underlying media items are NOT deleted (only the album/association is removed).
- **Verdict:** PASS/FAIL per sub-step (create/rename/assign/re-assign-noop/delete).

### Stage 6 — Cover-photo interaction
- Set a photo as an album's cover (if that UI exists), then delete that exact photo from the gallery entirely.
- Confirm the album survives and its `cover_media_id` cleanly becomes null / falls back to another item — it should NOT error, and the album should NOT disappear or show a broken cover image.
- **Verdict:** PASS/FAIL.

### Stage 7 — Delete flows
- Delete a single photo. Confirm it's gone from the grid immediately (optimistic update) and confirm on reload it's actually gone from the DB, not just hidden client-side.
- Select a mixed batch (some photos, some videos) and bulk-delete, but include one id that will deliberately fail (if you can force this — e.g. an id you delete via Supabase MCP a second before the bulk-delete request lands, creating a real not-found case). Confirm the failed tile's optimistic removal rolls back (reappears) while the rest stay deleted, and the selection state clears correctly afterward.
- **Verdict:** PASS/FAIL, note if you couldn't force the deliberate-failure case and what you tried.

### Stage 8 — Signed URL expiry recovery
- In dev, if there's a way to force a short `expiresIn` (check the route code or ask whoever's available if there's a dev flag) — simulate an expired signed URL and confirm the per-tile `onError` handler actually re-requests a fresh URL and recovers the image, rather than leaving a permanently broken tile.
- If you cannot force this without code changes, note that clearly as a gap rather than guessing at a PASS.
- **Verdict:** PASS/FAIL/COULD NOT SIMULATE.

### Stage 9 — Mid-upload navigation-away
- Start uploading a reasonably large file (video works well for this — gives you a window), then navigate away from the Media page (or close the tab) before it completes.
- Navigate back. Confirm there's no orphaned "phantom" upload — no commit ever happened for the aborted file, and the UI doesn't show a stuck/ghost progress item.
- **Verdict:** PASS/FAIL.

### Stage 10 — Stalled video poster-frame timeout (best effort)
- If you can throttle network/CPU in Chrome DevTools enough to artificially stall a video's poster-frame seek, confirm the 8-second timeout fires and the file shows a retryable error state rather than an indefinite spinner.
- If you can't reliably trigger this, note it as attempted-but-inconclusive rather than a guessed PASS.
- **Verdict:** PASS/FAIL/INCONCLUSIVE.

## 7. Cross-cutting checks (apply throughout, not a separate stage)

- **Responsiveness:** check at 390px (phone) and 1440px (desktop) minimum — full 360/390/414/768/1024/1440 sweep if you have time. No horizontal scroll, no unreachable buttons, upload progress list and modals fully usable at phone width.
- **Console watch:** keep DevTools console open through every stage. Note which stage/action triggered any error that appears, even if the UI itself looked fine.
- **The public media proxy** (`app/api/media/[...key]/route.ts`) — confirm nothing in this pass required touching it, and it wasn't touched.

## 8. What to document

One markdown report (`qa/media-memories-test-report.md` or similar — save wherever your other reports live), organized by stage (Stage 1 through 10 + the prerequisite env check), each with:
- The exact action you performed (not "tested upload" — "uploaded `beach-photo.jpg`, 3.2MB, at 14:32").
- PASS/FAIL/SKIPPED/INCONCLUSIVE per stage, with the specific evidence (DB row id, screenshot, console error text).
- Screenshots for anything that failed or looked visually wrong.

At the end:
- A consolidated **Issues Found** section, severity-tagged (Critical/Important/Minor), each with exact repro steps, which stage it was found in, and a screenshot/console-error reference.
- If the prerequisite env check failed and you stopped early, say so clearly at the top of the report — don't bury it.

## 9. Definition of done

- The prerequisite env check (§4) passed, or its failure is clearly reported and testing was correctly halted.
- All 10 stages attempted in order, each with an explicit verdict (not silently skipped without a note).
- Every "verdict" claim is backed by an action actually performed in Chrome — no verdict based on reading code or looking at a static screenshot without interacting.
- One consolidated report with screenshots, per-stage verdicts, and a severity-tagged issues list, saved somewhere Claude Code can read it back next session.
