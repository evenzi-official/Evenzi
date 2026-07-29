# Next Session — Pick Up Here

> Use `/start-evenzi-session` to begin (asks Abhijith / Dheeraj, then branches). It reads this file, pulls ClickUp status, and asks what to work on.

---

## ▶ START HERE NEXT — Guest Mgmt & RSVP, then Event Management Hub (2026-07-29 evening)

Session report: [`docs/session-reports/2026-07-29-session-report.md`](session-reports/2026-07-29-session-report.md)

**Mode:** same workflow that just shipped User Settings — design spec → plan → task-by-task build with a review gate after each → **live browser testing at every breakpoint** → whole-branch review. Do not treat a clean `tsc` as done; that pass caught three defects eight code reviews had missed.

### Paste this to start

```
Continue the designs/ → React conversion set. Build Guest Management & RSVP
first, then Event Management Hub.

Context you need:
- Working table + full V0 readiness: docs/aug-end-v0-launch-plan.md §2
- The workflow to follow, and why live testing is mandatory:
  docs/superpowers/specs/2026-07-29-user-settings-design.md (## Built section)
- Reference implementation — same shape, just shipped:
  app/settings/ (page shell + 4 section components), app/api/settings/*,
  lib/validations/settings.ts

Guest Mgmt & RSVP:
- Design prototype: designs/pages/guests/guests.html
- Data model is LIVE on dev (migrations guests_01-05) with RLS + seed data
- app/guests/ does not exist yet — this is the whole gap
- This is the V0 critical path: "host creates event → builds guest list →
  sends invites → tracks RSVPs" is the definition of the milestone, and the
  competitor study independently flags guest+RSVP+WhatsApp as the market wedge

Event Management Hub:
- Design prototype: designs/pages/event-control/event-control.html
- No data model of its own — it is the hub other features plug into
- Build after Guest Mgmt so the guest surface exists to link to

Start by verifying the guests data model against Supabase directly
(project smjkbmkxweevqpvygabe) rather than trusting docs — DATA-MODEL.md has
stale [PLANNED] tags, and ClickUp statuses are unreliable.
```

### Remaining conversion set (6)

| # | Feature | Design | React |
|---|---------|--------|-------|
| 1 | **Guest Mgmt & RSVP** | ✅ prototype | ❌ `app/guests` missing — **critical path** |
| 2 | **Event Management Hub** | ✅ `event-control.html` | ❌ not started |
| 3 | Digital Invitations (card designer) | ✅ prototype | ⚠️ only an unrelated test page exists |
| 4 | Planning Tools (Checklist + Budget) | ✅ design v2 | ❌ `app/planning` missing |
| 5 | Media & Memories | ✅ prototype | ❌ `app/media` missing (backend partial, R2 in progress) |
| 6 | Digital Presence (guest-site templates) | ✅ 6 locked | ❌ `app/e/[slug]` not started |

Admin Module + Support Chatbot parked until the end, per founder call.

### Carried-over non-code items

- Verify the Twilio India SMS rate **and** DLT registration status — a stalled DLT template blocks OTP entirely, which is a bigger risk than the cost (infra forecast §2.5).
- Move Vercel to Pro before launch — Hobby's ToS restricts commercial use.
- Confirm Cloudflare Startups Tier 3 approval (submitted 2026-06-13).
- Danger Zone / Delete Account on `/settings` — approved in concept, deferred; needs its own design pass covering the confirmation flow and what deletion cascades to (events, guests, R2 media).

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
