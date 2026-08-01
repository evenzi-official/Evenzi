# Next Session — Pick Up Here

> Use `/start-evenzi-session` to begin (asks Abhijith / Dheeraj, then branches). It reads this file, pulls ClickUp status, and asks what to work on.

---

## ▶ START HERE NEXT — Media & Memories backend-wiring complete; live-browser QA pass is next (2026-08-01)

Session report: [`docs/session-reports/2026-08-01-session-report.md`](session-reports/2026-08-01-session-report.md)

**What happened:** Finished the Media & Memories backend-wiring pass (13 tasks total across this and a prior session) via subagent-driven-development — presigned R2 upload pipeline, commit-route hardening (dual-key verification, magic-byte checks, idempotency), signed-URL read routes, delete/bulk-delete, full album CRUD, and a real storage-usage meter replacing the hardcoded mock. A final whole-branch review (Opus) then caught 7 issues before merge, most notably two Critical bugs: a cross-event IDOR in the commit route (client-supplied R2 keys weren't verified against the calling event), and `thumbnail_key` being written/capped/purged but never served — meaning photo grids downloaded full-res masters and every video tile rendered `<img src>` pointed at a raw `.mp4` (guaranteed failure, feeding an unbounded retry loop). All 7 fixed, re-reviewed and confirmed, merged to `Dev-Vibe` + `Dev-Vibe-Testing` (commit range `7717ffd..f9ceb96`, 20 commits, 114/131 tests passing — 17 pre-existing-baseline failures unrelated to this work).

**What's NOT done:** the live-browser verification pass (spec §8) — real photo/video upload, a HEIC file specifically, storage meter, delete flows, album CRUD, a bulk operation with a deliberate failure, signed-URL expiry recovery, mid-upload navigation-away, at standard breakpoints (360/390/414/768/1024/1440). Code is complete and twice-reviewed but not yet human/browser-QA'd.

### Paste this to start — Media & Memories live-browser QA pass

```
Run the live-browser verification pass for Media & Memories (spec §8,
docs/superpowers/specs/2026-07-31-media-memories-fe-wiring-design.md).
Backend + frontend wiring is complete and merged to Dev-Vibe +
Dev-Vibe-Testing (see docs/session-reports/2026-08-01-session-report.md).
Test: real photo + video upload, a HEIC file specifically, the storage
meter updating live, delete flows (single + bulk with a deliberate
failure), album CRUD, signed-URL expiry recovery (trigger the onError
path), and mid-upload navigation-away — at 360/390/414/768/1024/1440px.
Confirm app/api/media/[...key]/route.ts (pre-existing GET-only serving
route) was left untouched.
```

**Known non-blocking follow-ups from the final review** (fix if convenient during QA, not required): retry-counter never resets on success (an id can't recover from hourly signed-URL expiry after 2 lifetime retries), `designs/components.html` doesn't link `media.css` so the new upload-item/error-banner catalog entries render unstyled, `router.refresh()` fires once per file in a batch upload (perf only), bulk-assign partial failure is silent to the user.

---

## ▶ PAST — Digital Presence DB layer complete (Wave 1 + 2a + 2b all live); app-layer wiring still queued (2026-07-31, session b)

Session report: [`docs/session-reports/2026-07-31b-session-report.md`](session-reports/2026-07-31b-session-report.md)

**What happened:** Wave 2's original council verdict (🔴 RE-PLAN, spec §12) was revised, then re-reviewed twice more (a confirm-the-fixes pass caught 3 *new* criticals in the revision itself — spoofable rate-limit IP-hash, a TOCTOU race, a Postgres grant gap — fixed; a second confirm pass confirmed both closed, found one more, fixed). Wave 2a (`website_12`–`website_16`, public payload) and Wave 2b (`website_17`–`website_20`, guest lookup/session/RSVP) both migrated live to `smjkbmkxweevqpvygabe`. Two more real bugs — this time invisible to all 4 rounds of council review, only catchable by applying/testing against the live DB — were found and fixed: an `anon`-exec grant gap on an internal helper, and a `pgcrypto` schema-resolution gap that would have made the guest-lookup RPC error on every call. **The entire Digital Presence DB layer is now done.** Full trail: `docs/superpowers/specs/2026-07-30-event-website-data-model-spec.md` §12–§17, `DATA-MODEL.md` D49–D51.

**What's NOT done:** any app code. `app/events/[id]/website/*` (host editor) is still static mocks. `app/e/[slug]/*` (public guest site) doesn't exist at all. Two handoff docs are ready for Dheeraj — `docs/sprint/sprint-1/handoff-website-wave1.md` (host editor) and `handoff-website-wave2.md` (public API route family) — but neither has been picked up yet.

### Paste this to start — Digital Presence app-layer wiring (Dheeraj path, primary)

```
Pull latest Dev-Vibe, then open docs/sprint/sprint-1/handoff-website-wave1.md
and docs/sprint/sprint-1/handoff-website-wave2.md — together they're your
full task brief for the Event Website (Digital Presence) module: Wave 1 is
the host-editor wiring (private, logged-in), Wave 2 is the public site's
API layer (no login, guest lookup + RSVP). Read both start to finish before
touching code, then pick up from there.
```

**Blocking prerequisite, flagged in the Wave 2 handoff doc:** `events.slug` has no generator anywhere in the codebase. Whoever picks this up needs a slug-generation strategy before the Wave 2 routes have anything real to test against.

### Two founder decisions still open (Abhijith, quick — not a build task)

1. **Story/Q&A page tier** — spec §1 proposes Story=public, Q&A=private as defaults. Needs a yes/no before `config.website_pages` gets its final tier seed.
2. **`x-forwarded-for` gateway-trust verification** — spec §6b.3's rate-limit design depends on Supabase's Kong gateway not letting a client spoof this header. Dheeraj is positioned to help verify this while testing `/lookup` (flagged in his handoff doc) — but someone needs to actually look at the results and decide if the fallback plan (pass IP from Vercel's edge instead) is needed.

### Also queued (independent, unblocked) — Digital Invitations backend-wiring

### V0 Readiness — 2026-07-31 (session b), verified against repo

| Feature | Data | Backend | Frontend | Note |
|---|---|---|---|---|
| Auth & Role Selection | ✅ | ✅ | ✅ | DONE |
| Event CRUD (create/edit/delete) | ✅ | ✅ | ✅ | DONE |
| Host Dashboard | ✅ | ✅ | ⚠️ | In review (revamp landed) |
| Event Management Hub | ✅ | ✅ | ✅ | DONE |
| Guest Management & RSVP | ✅ | ✅ | ✅ | DONE — Send-invites intentionally inert (needs its own WhatsApp session) |
| Event Settings | ✅ | ✅ | ✅ | DONE |
| User Settings | ✅ | ✅ | ✅ | DONE |
| Planning Tools (Checklist + Budget) | ✅ | ✅ | ✅ | DONE 2026-07-30 |
| Media & Memories | ✅ | ✅ | ✅ | Backend-wiring DONE 2026-08-01 (merged, twice-reviewed) — live-browser QA pass still pending |
| Digital Invitations | ✅ | ❌ | ✅ | FE built (7-template designer), nothing persists yet — queued, see below |
| **Digital Presence — Wave 1 (host editor)** | ✅ | ⚠️ | ❌ | **Schema LIVE.** React pages still static mocks — Dheeraj brief at `handoff-website-wave1.md` |
| **Digital Presence — Wave 2 (public site)** | ✅ | ⚠️ | ❌ | **Schema LIVE 2026-07-31** (`website_12`–`website_20`) — DB layer done, `anon` RLS live, council-cleared. API routes + guest site pages not built — Dheeraj brief at `handoff-website-wave2.md`, blocked on `events.slug` generator |
| Admin Module | ❌ | ❌ | ❌ | Not started |
| Support Chatbot | ❌ | ❌ | ❌ | Planned, unblocked |

**Critical-path status:** every step of the host flow (create → guest list → RSVP → planning/budget → settings) is DONE. Remaining gaps (Media, Invitations, Digital Presence app-layer, Admin, Chatbot) are all outside the core V0 loop.

### Paste this to start — Digital Invitations backend-wiring

```
Backend-wiring pass for Digital Invitations. FE is fully built
(app/events/[id]/invitations/InvitationsClient.tsx, 576 lines, 7-template
card designer with editable slots) but nothing persists — no fetch, no
localStorage, the "Saved" autosave indicator is cosmetic only. Data model
is live (inv_01-06 migrations). Scope = the invitation CARD designer
(personalizer) only — WhatsApp send + status tracking stays in Guest
Management, already done there, out of scope here.

Same workflow as Planning Tools (docs/superpowers/plans/2026-07-30-planning-tools-fe-wiring.md)
and Guest Management: brainstorm → spec → plan → subagent-driven task-by-task
build with a review gate per task → live browser testing at every breakpoint
→ whole-branch review. Cross-check the design prototype
(designs/pages/invitations/invitations.html + .js) against
InvitationsClient.tsx for any FE gaps before planning, the same way Planning
Tools found 4 missing components that way.
```

---

## ▶ PAST — Digital Presence Wave 1 shipped live; Wave 2 revision queued (2026-07-31, session a)

Full data-model gap analysis + spec for Event Website (Digital Presence), two `/council plan` passes (Wave 1 spec RE-PLAN → revised → **migrated live**, 11 migrations `website_01`–`website_11`; Wave 2 design RE-PLAN, findings persisted to spec §12). Two real bugs caught by the review process itself (anon-exec privilege gap on a guard trigger, duplicate `UNIQUE` constraint) and fixed same session. Superseded same-day by session b above — Wave 2's revision, re-review, and live migration all happened in the very next session.

---

## ▶ PAST — V0 readiness corrected via repo audit; backend-wiring pass is next (2026-07-30)

**Guest Management & RSVP shipped this session** — full CRUD, RSVP setter, search/filter/sort, real CSV import, tags, bulk actions, swipe rail, all live at `app/events/[id]/guests/`. Tested at 6 breakpoints, whole-branch reviewed, deployed to Dev-Vibe-Testing. Deferred out of this pass: public guest-facing RSVP page (no-auth), real WhatsApp invite send (needs its own planning session), CSV parser unit tests, pre-existing ToolRail overlap bug at ≥1024px (cross-cutting, reproduces on Event Hub too).

**Later the same session, a direct repo audit (file contents + write-paths, not just file existence) found the "remaining conversion set" below was wrong for 3 of 5 rows** — full correction in `CLAUDE.md` → "MVP Phase 1". Summary:

| Feature | Was documented as | Actually is |
|---|---|---|
| Event Management Hub | "in review, gap audit next" | **DONE** — real hub, real Supabase queries (sub-events, `event_hub_summary` view), real nav to every sub-feature |
| Planning Tools | "`app/planning` missing" | **FE UI built, not backend-wired** — 833-line `PlanningClient.tsx`, zero `fetch`/Supabase calls, in-memory state only |
| Media & Memories | "`app/media` missing" | **FE UI built, not backend-wired** — 1341-line `MediaClient.tsx`, storage meter mocked, upload API route doesn't exist (`GET`-only) |
| Digital Invitations | "only an unrelated test page exists" | **FE UI built, not persisted** — 576-line `InvitationsClient.tsx`, real 7-template card designer, but nothing saves anywhere (no `fetch`, no `localStorage`) |
| Digital Presence | "not started" | **In progress with Dheeraj** per founder call 2026-07-30 — not yet visible in this worktree |

**Real next priority:** wire Planning Tools, Media, and Digital Invitations to their already-live data models. This is a backend + integration pass per feature (API routes + persistence + re-fetch on load), not a from-scratch UI build — the UI work is done. Suggested order: Planning → Invitations → Media (Media also needs the R2 upload endpoint, which is a bigger lift than the other two). Same workflow as Guest Mgmt: brainstorm → spec → plan → task-by-task build with review gate → live browser testing at every breakpoint → whole-branch review.

### Paste this to start

```
Backend-wiring pass for Planning Tools, Digital Invitations, and Media &
Memories. All three have complete FE UI already built but zero persistence
(verified 2026-07-30 by reading write-paths, not just checking file
existence — see NEXT-SESSION.md top entry / CLAUDE.md MVP Phase 1 table).

Start with Planning Tools (app/events/[id]/planning/PlanningClient.tsx,
833 lines, checklist+budget tabs) — data model is live (planning_01-07).
Add the API routes + wire the client's task/expense CRUD to real Supabase
writes, replacing the in-memory state. Same workflow as Guest Management:
brainstorm → spec → plan → task-by-task build with review gate → live
browser testing at every breakpoint → whole-branch review.
```

### Remaining work (backend-wiring pass, 2 features + 1 external + 1 verification)

| # | Feature | Design | React FE | Backend wiring |
|---|---------|--------|----------|-----------------|
| 1 | ~~Planning Tools~~ | ✅ design v2 | ✅ built | ✅ **DONE 2026-07-30** — see below, only live-browser verification (Task 9) still owed |
| 2 | **Digital Invitations** | ✅ prototype | ✅ built (7-template card designer) | ❌ needs save endpoint |
| 3 | **Media & Memories** | ✅ prototype | ✅ built | ❌ needs upload endpoint (R2), storage-meter wiring |
| 4 | Digital Presence (guest-site templates) | ✅ 6 locked | In progress — Dheeraj, per founder 2026-07-30 | n/a (external to this list) |

**Planning Tools backend-wiring — shipped + live-verified 2026-07-30.** Spec: `docs/superpowers/specs/2026-07-30-planning-tools-fe-wiring-design.md`. Plan + build log: `docs/superpowers/plans/2026-07-30-planning-tools-fe-wiring.md` (9 tasks, subagent-driven, every task reviewed — 2 needed a fix-and-re-review cycle for real bugs: Task 2's item route conflated 404s/500s and had no empty-patch guard; Task 6's task mutations were optimistic-with-no-rollback). Typecheck + lint clean.

Antigravity ran both handoffs (`docs/testing/2026-07-30-antigravity-planning-tools-testing.md`, `docs/testing/2026-07-30-antigravity-full-platform-e2e.md`); raw output at `qa/planning-test-report.md` + `qa/e2e_test_report.md` + screenshots in `qa/`. Full-platform E2E: all 9 stages passed, including cross-feature checks (wizard→Hub, Settings→Hub). Planning Tools: task create/budget/expense/duplicate-type-rejection verified against the real DB; bulk actions + validation + receipt stub verified visually at mobile+desktop. **Known gap, accepted as low-risk:** task edit/delete/toggle-done was never separately clicked through the UI (Antigravity's own report flags this) — the same code path already passed 2 code reviews including the rollback-pattern fix, so this was accepted rather than re-verified live given time already spent.

**4 findings from the E2E pass, all resolved same session:**
1. Event-delete modal had no type-to-confirm safety gate — **fixed**, commit `cf2ab84` (`GeneralSettingsForm.tsx`, type "DELETE" to enable the button).
2. Settings form occasionally showed stale values after a fast reload — root cause was a genuine race (reload before an in-flight save resolves, not a caching bug) — **fixed**, same commit, `beforeunload` warns while a save is in flight.
3. Some Planning modals needed forced/programmatic clicks in Playwright — investigated via the shared `.modal-scrim` CSS (`shell.css:2108-2130`, always-mounted + `visibility:hidden` until `.is-open`) — confirmed a Playwright actionability-timing artifact, not a real off-screen bug; same primitive already proven live on Guest Mgmt/User Settings. No fix needed.
4. Planning task edit/delete/toggle-done UI-click gap — see above, accepted as low-risk.

Admin Module + Support Chatbot parked until the end, per founder call.

### Carried-over non-code items

- Verify the Twilio India SMS rate **and** DLT registration status — a stalled DLT template blocks OTP entirely, which is a bigger risk than the cost (infra forecast §2.5).
- Move Vercel to Pro before launch — Hobby's ToS restricts commercial use.
- Confirm Cloudflare Startups Tier 3 approval (submitted 2026-06-13).
- Danger Zone / Delete Account on `/settings` — approved in concept, deferred; needs its own design pass covering the confirmation flow and what deletion cascades to (events, guests, R2 media).

---

## ▶ DONE 2026-07-30 — Guest Management & RSVP shipped

Full detail: [`docs/session-reports/2026-07-30-session-report.md`](session-reports/2026-07-30-session-report.md), spec `docs/superpowers/specs/2026-07-29-guest-management-design.md`, plan `docs/superpowers/plans/2026-07-29-guest-management.md`.

The V0 critical-path feature ("host creates event → builds guest list → sends invites → tracks RSVPs") is live: guest CRUD, RSVP setter, search/filter/sort, real CSV import (template → live preview → validation gate → insert), per-guest function/sub-event assignment, tags + tag manager, bulk select (tag/assign/delete), swipe-to-reveal row actions, zero-assigned banner, stats bar. 11-task subagent build, 6-breakpoint live testing, whole-branch review + fix pass, deployed to Dev-Vibe-Testing (Vercel READY).

**Not built this pass, needs follow-up:** public guest-facing RSVP page (no-auth — was in the original ClickUp ticket scope, deferred by founder priority call); real WhatsApp invite send (button wired as a disabled stub only — needs a dedicated planning session covering personalized message + site template URL + invitation card); CSV parser unit tests; pre-existing ToolRail/page-band overlap at ≥1024px (reproduces on Event Hub too, not introduced here).

---

## ▶ DONE 2026-07-29 — User Settings shipped + Aug-end launch plan assembled

Launch plan assembled: [`docs/aug-end-v0-launch-plan.md`](../aug-end-v0-launch-plan.md) — pulls together the corrected readiness table, the templates scope decision, the infra cost forecast, and the competitor study into one doc.

**The one finding that should drive next session's priority:** Guest Management & RSVP has a live data model and a finished design prototype but **zero app code** — it's the single biggest gap against the V0 definition ("host creates event → builds guest list → sends invites → tracks RSVPs"), and the competitor study independently confirms "guest list + RSVP + WhatsApp" is the validated open wedge (Bliss, Wedd.ai). Recommend this becomes the next engineering priority ahead of Planning Tools / Media, neither of which blocks the core flow.

**Also settled this session:**
- Templates scope: rolling cut for Aug — ship whatever's done (Lovable 2 + Midnight Elegant confirmed floor, Dheeraj hand-building 1-2 more). Lovable output bypasses `components.html`. See build plan's new "Aug-end V0 launch scope" note.
- Infra: not a launch blocker (~$10–100/mo at pilot scale). Two real action items — move Vercel to Pro, and verify the actual Twilio India SMS rate + DLT registration status (the one true unknown, not an estimate).
- Pre-launch checklist lives in the launch plan doc §6 — work through it alongside the Guest Mgmt build.

Design-thread work (Sapphire/Mivon guest site) continues separately below — unrelated to this planning thread, not blocked by it.

---

## ▶ PREVIOUSLY QUEUED — Plan runway takeoff + glass boarding pass (2026-07-22 evening)

Session report: [`docs/session-reports/2026-07-22b-session-report.md`](session-reports/2026-07-22b-session-report.md)

**Mode:** clarify → **plan** → implement (do not jump straight to build).

### 1. Runway takeoff — plan where it lives

Sandbox bake already exists: `sapphire-lab/sapphire-sandbox.html#demo-a` (“A Runway” — taxi → climb + tangent nose). Floaters kit notes it as Demo A.

**Next session job:** plan (not build yet) where/how to **incorporate runway takeoff into the live guest spine** (`sapphire-mivon/`). Candidate beats to discuss:

| Candidate | Why it might fit |
|-----------|------------------|
| Hero unlock → “Proceed to gate” | First motion after check-in |
| After boarding-pass card / before Story | Continuity with flight metaphor |
| Manifest → Party handoff | After paper-plane dodge parks |
| Party / gallery transition | Secondary soar |

Lock: trigger (scroll vs click), one-shot vs scrub, reduced-motion fallback, whether it replaces or coexists with `#sp-mf-flight`.

### 2. Front boarding-pass card — glass + looping video

Target: hero ticket in `sapphire-mivon/` (`.sp-ticket`).

| Change | Intent |
|--------|--------|
| Background **video** behind the card (or inside card plane) | Atmosphere; **loop** forever |
| **Glassmorphic** card | Frosted / translucent over video |
| Keep countdown + names + progress | Content stays; material changes |

Open questions for planning: video asset source + size, poster fallback, `prefers-reduced-motion` (static poster?), dark/light, performance on mobile.

### Already shipped this evening (context)

- Manifest paper-plane dodge → mivon (`#sp-mf-track` / `#schedule`+`#party`); path locked; guide UI stripped; scroll stutter tuned
- Boarding-pass name wrap fix (`SREELEKSHMY` nowrap + smaller clamp)
- Plans: [`guest-site-manifest-paper-plane-dodge.md`](../designs/_plans/guest-site-manifest-paper-plane-dodge.md) · [`guest-site-boarding-pass-countdown-card.md`](../designs/_plans/guest-site-boarding-pass-countdown-card.md)

### Quick commands

```bash
npm run design
# Live:  http://localhost:4000/pages/website/guest-site/sapphire-mivon/index.html
# Bake:  http://localhost:4000/pages/website/guest-site/sapphire-lab/sapphire-sandbox.html#demo-a
# Pass:  http://localhost:4000/pages/website/guest-site/sapphire-lab/sapphire-sandbox.html#demo-pass-stitch
```

---

## ▶ PREVIOUSLY QUEUED — Sapphire × Mivon corrections + playground merge (2026-07-22)

Session report: [`docs/session-reports/2026-07-22-session-report.md`](session-reports/2026-07-22-session-report.md)

- Manifest floaters merge largely **done** (see evening report). Remaining: founder visual polish; venue / sticky RSVP / party grid still on hold until designed.
- Stable sapphire + lab still available for section upgrades.

---

## ▶ PREVIOUSLY QUEUED — Finish Sapphire lab → Classic Editorial (2026-07-21)

Session report: [`docs/session-reports/2026-07-21-session-report.md`](session-reports/2026-07-21-session-report.md)

- Classic Editorial / 4.zip plan still in [`guest-site-classic-editorial-mivon.md`](../designs/_plans/guest-site-classic-editorial-mivon.md) — paused while mivon lab is active

---

## ▶ PREVIOUSLY QUEUED — Guest website templates review (2026-07-20)

**Midnight Elegant** live but not signed off. Creative mandate: maximally immersive guest site.

Full context: [`designs/_plans/guest-website-templates-build-plan.md`](../designs/_plans/guest-website-templates-build-plan.md)
