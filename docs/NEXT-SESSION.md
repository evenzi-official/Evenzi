# Next Session — Pick Up Here

> Use `/start-evenzi-session` to begin (asks Abhijith / Dheeraj, then branches). It reads this file, pulls ClickUp status, and asks what to work on.

---

## ▶ START HERE NEXT — V0 readiness corrected via repo audit; backend-wiring pass is next (2026-07-30)

Session report: [`docs/session-reports/2026-07-30-session-report.md`](session-reports/2026-07-30-session-report.md)

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

**Planning Tools backend-wiring — shipped 2026-07-30.** Spec: `docs/superpowers/specs/2026-07-30-planning-tools-fe-wiring-design.md`. Plan + build log: `docs/superpowers/plans/2026-07-30-planning-tools-fe-wiring.md` (9 tasks, subagent-driven, every task reviewed — 2 needed a fix-and-re-review cycle for real bugs: Task 2's item route conflated 404s/500s and had no empty-patch guard; Task 6's task mutations were optimistic-with-no-rollback). Typecheck + lint clean. **Not yet done:** the live 6-breakpoint browser verification pass (Task 9, Step 3) — handed to Antigravity this session for pixel-level + interaction testing rather than burning further Claude tokens on it; see the handoff prompt in this session's transcript or re-derive one from the plan file's Task 9 section. Review the Antigravity output (screenshots + findings) before marking this fully closed.

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
