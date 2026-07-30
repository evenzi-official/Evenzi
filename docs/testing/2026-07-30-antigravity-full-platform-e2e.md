# Handoff: Full-Platform End-to-End Testing — Evenzi V0 (Staged)

## 1. Routing header

- **Tool:** Antigravity (browser-driven testing)
- **Model:** default (Gemini 3 or Sonnet) — pure verification, not a build.
- **Setup:** Repo at `/Users/xcalider/Documents/Projects/Evenzi`, branch `Dev-Vibe`. Start `npm run dev` (port 3000), open a browser tab at `http://localhost:3000`. If Supabase MCP is available (project `smjkbmkxweevqpvygabe`, region `ap-northeast-1`), use it to spot-check database rows after key mutations — a page that "looks saved" is not proof, a correct database row is.

## 2. Objective & context

Evenzi is a wedding/event-planning SaaS. The V0 host-only flow is: **a host creates an event, builds a guest list, sends invitations, tracks RSVPs, and manages planning/budget/settings for it.** Every major feature in that flow has been built and individually tested during its own development pass. This prompt is different: it's a single continuous **end-to-end run through the whole platform as one real host would actually use it**, in order, to catch integration gaps that feature-by-feature testing misses — e.g. a guest count on the dashboard that doesn't match the actual guest list, an event edited in Settings that doesn't reflect on the Hub, a sub-event created in the wizard that doesn't show up correctly in Planning Tools' assignment picker.

**This is a big pass. It's deliberately broken into stages below.** Run them in order — later stages depend on data created in earlier ones (the same event, the same guest list, carried through). If you run out of context/session budget partway through, stop at the end of the current stage, write up what you have so far, and note exactly which stage to resume from — don't restart from Stage 1.

## 3. What's in scope vs. explicitly out

**In scope (all confirmed built + backend-wired as of 2026-07-30):**
- Auth & Role Selection
- Event CRUD (create wizard, edit, delete)
- Event Management Hub
- Guest Management & RSVP
- Planning Tools (checklist + budget) — if you already ran the dedicated Planning Tools prompt separately, you can do a lighter pass here focused only on cross-feature integration (does the Hub/Dashboard reflect Planning Tools data correctly), not the full CRUD matrix again
- Event Settings
- User Settings
- Host Dashboard

**Out of scope — do not test, these are known not-ready:**
- Media & Memories (`app/events/[id]/media`) — FE exists but has zero backend persistence, storage meter is a hardcoded mock, don't bother.
- Digital Invitations (`app/events/[id]/invitations`) — FE exists (7-template card designer) but nothing saves anywhere, don't bother.
- Digital Presence / guest-facing website (`app/e/[slug]`) — separate in-progress workstream, not in this worktree.
- Admin Module, Support Chatbot — not started.
- **"Send invites" in Guest Management is intentionally an inert/disabled stub** this pass (real WhatsApp send needs its own future planning session) — confirm it's visibly disabled/inert, don't report it as broken that it doesn't send anything.

## 4. Test account

- **Login:** phone OTP, test number `9999999999`, OTP code `123456`, India region.
- Use ONE continuous host identity and ONE continuous event through all stages below — don't create a fresh event per stage. This is the point: the same data flowing through every feature.

## 5. Real-data requirement (applies to every stage)

Use a believable, internally-consistent wedding scenario throughout — same couple names, same venue, same date range, same guest list, reused across every stage. Suggested seed (or invent your own, just stay consistent):
- Couple: pick two realistic Indian names.
- Venue: a realistic-sounding Kerala venue name.
- Wedding date: 3-4 months from today.
- Sub-events: Haldi, Mehendi, Sangeet, Wedding Ceremony, Reception — spread across 2-3 days around the main date.
- Guest list: at least 15-20 guests with realistic Indian names, a mix of RSVP statuses you'll set during Stage 4, a mix of "function" assignments across the sub-events.

---

## Stage 1 — Auth & Role Selection

- Log in fresh (log out first if already logged in) using the test phone/OTP above.
- Confirm the role-selection step (if this is a first-time login for this test account) works and lands you on the host dashboard.
- Log out, log back in — confirm session persists correctly and you land back on the dashboard, not forced through role selection again.

## Stage 2 — Event creation (4-step wizard)

- Create the event using the seed scenario from section 5: work through all 4 steps of the wizard (basic details, date/venue, sub-events, whatever the 4th step covers) with the realistic data.
- Confirm all sub-events you defined are created correctly.
- After creation, confirm you land somewhere sensible (likely the Event Hub) and the event's basic details (name, date, venue) display correctly there — this is your first cross-feature check: wizard input → Hub display.

## Stage 3 — Event Management Hub

- From the Hub, confirm: sub-event summary is accurate (matches what you created in Stage 2), and every navigation link (Guests, Planning, Settings, Website/Digital Presence if a link exists even if the page isn't ready, Media, Invitations) actually navigates somewhere without erroring — even if the destination page is a known not-ready feature per section 3, the LINK itself shouldn't 404 or crash.

## Stage 4 — Guest Management & RSVP

- Add the 15-20 guest seed list from section 5, using a mix of methods: some added individually through the add-guest form, and — if a CSV import UI exists — at least a few added via a real CSV upload (build a small realistic CSV with name/phone/function columns matching the app's expected template).
- Assign guests across the sub-events you created (functions), leaving a few intentionally unassigned to test the zero-assigned banner/indicator if one exists.
- Set a realistic mix of RSVP statuses across the guest list (some confirmed, some pending, some declined, if the RSVP setter supports that granularity).
- Test search, filter, and sort on the guest list — confirm results are correct.
- Create at least 2 tags via the tag manager, apply them to a subset of guests individually and via bulk-tag on a multi-selection.
- Test bulk actions: bulk-assign a function to several unassigned guests, bulk-delete 1-2 guests you don't need (confirm they're actually gone on reload), confirm the "Send invites" control is visibly disabled/inert (expected, not a bug).
- Reload the page after each major mutation and confirm persistence — this is a feature with an existing live data model, so anything that doesn't persist here is a real regression, not a known gap.

## Stage 5 — Planning Tools (light integration pass — full CRUD already covered by the dedicated Planning Tools prompt)

- Navigate to Planning for this event. Add 2-3 tasks referencing the real sub-events from Stage 2 (not generic filler). Set a realistic budget and add 2-3 realistic expenses.
- The point of THIS pass is integration, not re-testing every CRUD path: confirm the sub-event picker in the task/expense forms shows the actual sub-events from Stage 2 (not a stale or hardcoded list), and confirm whatever summary/progress indicators exist (task completion %, budget remaining) compute correctly against the real data you just entered.
- If you have NOT already run the dedicated, more thorough Planning Tools testing prompt in a separate pass, do the fuller CRUD + bulk-action + database-verification matrix from that prompt here instead of the light version above.

## Stage 6 — Event Settings

- Open Event Settings for this event. Go through all 5 tabs. In each tab that allows edits, make a real, meaningful change (not a no-op save) — e.g. update the event description, adjust a visibility/privacy toggle, change whatever's editable in each tab.
- Save each change, reload, confirm it persisted.
- After changing the event name or date in Settings (if editable there), go back to the Event Hub and Host Dashboard — confirm the updated value shows up there too, not just in Settings. This is the cross-feature check this stage exists for.

## Stage 7 — User Settings

- Navigate to `/settings` (user-level, not event-level). Go through all 4 sections: Profile (try uploading a real avatar image), Security (confirm it shows your connected phone/SSO method correctly, don't attempt to change auth method), Notification preferences (toggle a couple and confirm they save), Account (confirm sign-out works and actually ends the session — after signing out, confirm a protected page redirects to `/auth` rather than showing stale content).
- Log back in with the test account afterward to continue if more stages remain.

## Stage 8 — Host Dashboard

- Return to the main host dashboard. This is the final integration check: confirm the event you built through Stages 2-7 is represented accurately — correct name/date, correct guest count (should match the real count from Stage 4 after your adds/deletes), any task/budget summary widgets (if the dashboard surfaces Planning Tools data) should reflect Stage 5's real numbers, not stale/mock data.

## Stage 9 — Event edit & delete

- From Event Settings or the Hub, edit a core event field (e.g. the event name or date) and confirm it saves and reflects everywhere it should (Hub, Dashboard).
- Create one throwaway test event solely to delete it (do NOT delete your main seeded event — you may need it if this pass is resumed later). Confirm the delete-confirmation flow works, and confirm the deleted event is actually gone from the dashboard/event list on reload, not just hidden.

## 6. Cross-cutting checks (apply loosely across all stages, not a full 6-breakpoint sweep per feature)

- Check at 2 sizes only for this full pass — 390px (phone) and 1440px (desktop) — since a full 6-breakpoint sweep per feature is what the feature-specific testing prompts are for. Just confirm nothing is unusably broken at either size as you move through the stages (no horizontal scroll, no unreachable buttons, modals fully visible).
- Watch the browser console throughout for errors — note which stage/action triggered any that appear.
- Note load-time/responsiveness issues if anything feels sluggish, but this isn't a performance-testing pass — just flag anything that seems clearly wrong (multi-second hangs, obvious N+1-feeling repeated requests).

## 7. What to document

One markdown report, organized by stage (Stage 1 through Stage 9), each with:
- What you did (brief), PASS/FAIL/NOTE per major checkpoint listed under that stage.
- Screenshots for anything that failed or looked visually wrong.
- The specific cross-feature checks called out in Stages 2, 3, 6, and 8 get their own explicit PASS/FAIL line — these are the checks this whole pass exists to catch, don't let them get lost in the general noise.

At the end:
- A single consolidated "Issues Found" section across all stages, severity-tagged (Critical/Important/Minor), each with exact repro steps, which stage it was found in, and a screenshot reference.
- A short "Resume point" note if you had to stop partway — which stage is next, and what state the seed event/guest list/data is currently in, so the next run (or Claude Code reviewing this) doesn't have to guess.

## 8. Definition of done

- All 9 stages run in order using one continuous, realistic seed dataset.
- Every cross-feature check explicitly called out (Stages 2, 3, 6, 8) has a clear verdict.
- One consolidated report with screenshots, per-stage verdicts, and a severity-tagged issues list, saved somewhere this session can read it back.
