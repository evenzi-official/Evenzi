# Handoff: Event Website (Digital Presence) — Full Visual + Functional E2E Sweep

## 1. Routing header

- **Tool:** Antigravity (browser-driven testing).
- **Model:** default (Gemini 3 or Sonnet) — pure verification, not a build.
- **Setup:** Repo at `/Users/xcalider/Documents/Projects/Evenzi`, branch `Dev-Vibe` (confirm you're on the commit that actually has Dheeraj's Wave 1 + Wave 2 app-layer wiring merged in — see prerequisite §4.0 below, this is not guaranteed yet as of 2026-08-02). Start `npm run dev` (port 3000). If Supabase MCP is available (project `smjkbmkxweevqpvygabe`, region `ap-northeast-1`), use it to spot-check `event_website_design`, `event_website_pages`, `event_story_blocks`, `event_wedding_party_members`, `event_qa_items`, `event_travel_points`, `event_stays`, `guest_tokens`, and `guest_lookup_attempts` rows after key mutations — the UI "looking saved" is not proof, a real DB row is.

## 2. Objective & context

Digital Presence is Evenzi's event-website feature, split into two halves that need to work together:

- **Wave 1 — host editor** (`app/events/[id]/website/*`, private, logged-in): a host designs their site — picks a template, edits Story/Wedding Party/Q&A/Venue & Travel/Registry/Video pages, toggles page visibility, sets the site's public URL (slug).
- **Wave 2 — public guest site** (`app/e/[slug]/*` + `app/api/e/[slug]/*`): a guest with no account visits the published URL, sees public pages immediately, identifies themselves with phone+name (no password) to unlock private pages, and RSVPs per sub-event.

The entire DB layer (Wave 1 + 2a + 2b) has been live and council-reviewed since 2026-07-31 (`DATA-MODEL.md` D49–D51), the `events.slug` generator shipped 2026-08-02 (D52), and the Story=public/Q&A=private tier call was confirmed the same day (D53). The React/API wiring on top of that schema is Dheeraj's build, from two handoff docs: [`docs/sprint/sprint-1/handoff-website-wave1.md`](../sprint/sprint-1/handoff-website-wave1.md) (host editor) and [`handoff-website-wave2.md`](../sprint/sprint-1/handoff-website-wave2.md) (public API routes) — **read both in full before starting**, they contain the exact route contracts, error-status mappings, and non-negotiables (e.g. the public routes must never call `getUser()`, the guest session token must never be sent by the client directly, `get_public_website_payload` returning `null` must map to `404`). This prompt summarizes the test surface; the handoff docs are the source of truth for what "correct" looks like.

## 3. HARD RULE — this is a functional pass, not a visual review

**Do not just look at the pages and describe what you see. Open Chrome, click through the host editor as a real host would, then open a second (unauthenticated/incognito) context and go through the public site as a real guest would.** "The Design page renders a template picker" is not a finding — "I picked the Cinematic Scroll template, saved, reloaded, and the selection persisted" is a finding. Every checkpoint below needs an action you actually performed and an observed result. If the public-site half requires a genuinely logged-out browser context (it does — the whole point is no-account access), use an incognito window or a separate browser profile, not just a tab where you happen to be logged in as the host.

## 4. Prerequisites — do these IN ORDER before any functional testing

### 4.0 — Confirm the code actually exists (do this literally first)

As of 2026-08-02, `app/e/[slug]` did not exist in this checkout and `app/events/[id]/website/*` had not been touched since before this feature's data model was even designed. **Before doing anything else:**
- `git log -1 --format="%h %ad %s" -- app/events/[id]/website` — if the most recent commit predates the Wave 1 handoff doc (2026-07-31) or just says something generic like "revamp" with no website-specific content, the host-editor wiring is NOT present yet.
- `ls app/e/` — if this directory doesn't exist, the public site wiring is NOT present yet.
- If either check fails: **stop, do not proceed, report back exactly which half is missing** ("Wave 1 host editor: not found, last touch predates the feature" / "Wave 2 public site: `app/e/` directory doesn't exist"). Do not test against static mocks and report them as if they were the real feature.

### 4.1 — Environment check (once 4.0 passes)

1. **Dev server up:** `npm run dev`, `http://localhost:3000` loads clean.
2. **Auth works:** log in with the test account (phone OTP, `9999999999` / `123456`, India region).
3. **A test event exists with a real slug:** pick an existing event or create one, then confirm via Supabase MCP that `events.slug` is non-null for it (`select slug from events where id = '<event-id>'`). If it's null, the slug generator either isn't wired into the create flow you used, or you're testing an event created before the generator shipped (2026-08-02) — note which, and use/create an event that does have one.
4. **`config.website_templates` has at least one row:** `select slug from config.website_templates` — should show at least `cinematic-scroll`. If empty, the Design page's template picker has nothing to pick and every downstream save will fail on the FK — same class of bug already found and fixed once (D54), report it again clearly if it recurs.
5. **Host editor loads clean:** navigate to `app/events/[id]/website` for your test event, console open, confirm no red errors on load.

Once all 5 pass, proceed to Stage 1.

## 5. Stages — Wave 1 (host editor), same event throughout

### Stage 1 — Overview page
- Confirm it shows the real page list (not hardcoded), the site's public URL built from the real `slug`, and whether a template has been picked.
- **Verdict:** PASS/FAIL, note the slug/URL you saw.

### Stage 2 — Design page (template/palette/font)
- Pick a template from the picker (should show at least Cinematic Scroll, not an empty/broken state — see prerequisite 4.1.4). Save. Reload the page. Confirm the selection persisted.
- Cross-check via Supabase MCP: `select template_id, palette_id from event_website_design where event_id = '<event-id>'` — `template_id` should now be a real uuid matching `config.website_templates.id`, not null.
- If a palette/font picker exists and those catalogs are still empty (expected, per D49 — left empty until the lineup locks), confirm the UI shows a reasonable empty/coming-soon state rather than crashing.
- Try a cover image upload if that UI exists — confirm it actually uploads (check R2/DB, same pattern as the Media & Memories prereq check) rather than just showing a local preview.
- **Verdict:** PASS/FAIL per sub-step.

### Stage 3 — Edit/Pages: visibility + reorder
- Toggle a page's visibility off, confirm it updates immediately (optimistic), reload, confirm it persisted.
- Reorder two pages (drag or up/down controls), reload, confirm the new `display_order` persisted.
- **Verdict:** PASS/FAIL.

### Stage 4 — Story page editor
- Add 2-3 story blocks (heading + photo), reorder them, delete one. Reload after each, confirm persistence against `event_story_blocks`.
- **Verdict:** PASS/FAIL.

### Stage 5 — Wedding Party editor
- Add members to both bride's side and groom's side (name, relation, photo). Reload, confirm against `event_wedding_party_members`.
- **Verdict:** PASS/FAIL.

### Stage 6 — Q&A editor
- Add 2-3 question/answer pairs, edit one, delete one. Reload, confirm against `event_qa_items`.
- **Verdict:** PASS/FAIL.

### Stage 7 — Venue & Travel editor
- Add an airport/railway/bus travel point and a suggested stay (hotel). Reload, confirm against `event_travel_points`/`event_stays`.
- **Verdict:** PASS/FAIL.

### Stage 8 — Schedule page (read-only here)
- Confirm it reflects real `event_sub_events`/`show_on_website` data from this event — no new CRUD expected here, just a correct read.
- **Verdict:** PASS/FAIL.

### Stage 9 — Registry / Video pages (generic jsonb sections)
- Add content to each, save, reload, confirm persistence against `event_website_sections`.
- Try submitting something the Zod schema should reject (e.g. a malformed/missing required field via DevTools if you can intercept the request, or an obviously-wrong input in the form) — confirm it's rejected client- or server-side, not silently written as garbage jsonb.
- **Verdict:** PASS/FAIL.

### Stage 10 — Photos page
- Per the handoff doc, this is explicitly **out of scope** and should show a "coming soon" state or be left as the static mock — confirm it does NOT crash, and don't report the lack of real wiring here as a bug.
- **Verdict:** PASS/EXPECTED-INCOMPLETE.

## 6. Stages — Wave 2 (public guest site), use a genuinely logged-out browser context

### Stage 11 — Public page load (no identity)
- In an incognito/logged-out context, visit `http://localhost:3000/e/<the-real-slug-from-4.1.3>`.
- Confirm public-tier pages (Home, and Story if the tier confirm landed as public per D53) are visible without any login/lookup step.
- Confirm private-tier pages (Schedule, RSVP, Wedding Party, Q&A per D53, Venue & Travel) are NOT visible/accessible without identifying first — check what happens when you try to reach one directly.
- **Verdict:** PASS/FAIL, note exactly which pages were visible pre-lookup.

### Stage 12 — Non-existent / offline slug → 404
- Visit `/e/some-slug-that-does-not-exist` — confirm a clean 404, not a crash or a leak of "this slug doesn't exist" vs "this slug is offline" (the API deliberately returns the same `null`→404 for both per the handoff doc's non-negotiable #3 — don't expect or want a more specific message here).
- **Verdict:** PASS/FAIL.

### Stage 13 — Guest lookup (phone + name)
- Use a real guest's phone+name from this event's guest list (check Guest Management for one, or add one first) to identify yourself on the public site.
- Confirm a matching phone+name succeeds and unlocks private pages.
- Confirm a non-matching pair fails with a generic message (not "wrong phone" vs "wrong name" — that specificity would be an enumeration-safety regression, flag it if you see it).
- **Verdict:** PASS/FAIL per sub-case.

### Stage 14 — Guest session persistence
- After a successful lookup, reload the page / navigate around the site. Confirm you stay identified (session cookie) without re-entering phone+name.
- Check via Supabase MCP that a real row exists in `guest_tokens` for this session.
- **Verdict:** PASS/FAIL.

### Stage 15 — Guest-specific view (only their tagged sub-events)
- Confirm the guest only sees the sub-events they're actually tagged to in Guest Management for this event, not every sub-event on the event.
- **Verdict:** PASS/FAIL.

### Stage 16 — RSVP submission
- Submit an RSVP (attending/declined/tentative, plus-one count, dietary notes if the form has it) for a sub-event the guest IS tagged to. Confirm it persists — check `event_guest_sub_events.response_status` etc. via Supabase MCP.
- Note: submitting for a sub-event the guest is NOT tagged to should be unreachable from the UI (the form should only ever render their real sub-events) — you don't need to force this case unless you can do it easily via devtools, but if you do trigger it, confirm it's rejected (403), not silently accepted.
- **Verdict:** PASS/FAIL.

### Stage 17 — Rate limiting on lookup
- Deliberately fail the lookup form repeatedly (wrong phone/name) beyond a reasonable attempt count (the handoff doc's limits are 5 per IP+event within 15 min, or 30 per event — you don't need to hit the exact number, just enough to trigger it) and confirm you eventually get a calm, non-alarming cooldown message (429), not a raw error or an indefinite silent failure.
- Check via Supabase MCP that `guest_lookup_attempts` actually recorded your attempts.
- **Verdict:** PASS/FAIL/COULD NOT TRIGGER (note how many attempts you made).

### Stage 18 — Session expiry handling
- If you can force/simulate an expired or invalid session token (check with whoever's available for a dev flag, or wait out a short TTL if one exists in dev), confirm the guest is dropped back to the lookup form cleanly — cookie cleared, no crash, no half-populated page — rather than "start over" losing all context confusingly.
- If you cannot force this, note it as attempted-but-inconclusive.
- **Verdict:** PASS/FAIL/INCONCLUSIVE.

## 7. Cross-cutting checks (apply throughout, not a separate stage)

- **Responsiveness:** 390px (phone) and 1440px (desktop) minimum for both the host editor and the public site — the public site especially, since most real guests will be on mobile. Full 360/390/414/768/1024/1440 sweep if you have time.
- **Console watch:** keep DevTools open throughout. Note which stage/action triggered any error.
- **No `getUser()` on the 4 public routes:** if you can inspect the route source or network behavior, confirm the public routes genuinely work with zero auth cookie present (a fresh incognito context proves this implicitly — if Stage 11 works from a truly logged-out browser, this is satisfied).
- **The session token is never visible client-side as a raw value** the client could tamper with — check Application → Cookies in DevTools, confirm it's httpOnly (not readable/settable via `document.cookie` in the console).

## 8. What to document

One markdown report (`qa/event-website-test-report.md` or similar), organized by stage (Prerequisite 4.0/4.1, then Stage 1–18), each with:
- The exact action performed and the specific evidence (DB row, screenshot, console error text) — not an impression.
- PASS/FAIL/EXPECTED-INCOMPLETE/COULD NOT TRIGGER/INCONCLUSIVE per stage.
- Screenshots for anything that failed or looked visually wrong, and for at least one full pass through the public guest site (it's new surface, worth a visual record even where everything passes).

At the end:
- A consolidated **Issues Found** section, severity-tagged (Critical/Important/Minor), each with exact repro steps, stage, and evidence reference. Pay special attention to anything touching the non-negotiables in the Wave 2 handoff doc (auth bypass risk, session token handling, the 404 vs "which slug exists" leak) — these are Security-relevant, not just functional.
- If prerequisite 4.0 failed and you couldn't test at all, say so clearly at the very top — that's the single most important line in the report.

## 9. Definition of done

- Prerequisite 4.0 (code actually present) and 4.1 (environment) both passed, or their failure is clearly reported and testing correctly halted.
- All 18 stages attempted in order, each with an explicit verdict.
- Every verdict is backed by an action actually performed in Chrome (two separate browser contexts — authenticated host, incognito guest) — no verdict from reading code or a static screenshot.
- One consolidated report with screenshots, per-stage verdicts, and a severity-tagged issues list, saved somewhere Claude Code can read it back next session.
