# Aug-End V0 Launch Plan

> **Owner:** Abhijith · **Date compiled:** 2026-07-29 · **Target:** end of August 2026
> **Status:** Draft — assembled from this session's readiness verification, templates scope decision, infra forecast, and market study. Supersedes nothing in `CLAUDE.md` (still source of truth for live dev status); this doc is the launch-specific synthesis.

---

## 1. What "V0 launch" means

Per `CLAUDE.md`: **host-only, one complete end-to-end event flow** — a host creates an event, builds a guest list, sends invitations, tracks RSVPs, and (where already live) manages settings/planning/budget. Vendor role, AI Photo Finder, real-time features, event discovery, and analytics are explicitly out of scope for this milestone.

**Launch scale assumption (confirmed 2026-07-29):** small pilot — 5–10 events/month, ~500–1,500 guests/month total. This is a soft pilot, not a marketing-driven mass launch.

---

## 2. Readiness snapshot

Full live table: `CLAUDE.md` → "MVP Phase 1 — In Progress" (corrected and verified against Supabase directly on 2026-07-29 — **ClickUp statuses are known stale and were not used as the source of truth**).

> V0 readiness — from repo state (migrations + commits + `app/` dirs), not ClickUp.

| Feature | Data | Backend | Frontend | Note |
|---|---|---|---|---|
| Auth & Role Selection | ✅ | ✅ | ✅ | Done |
| Event CRUD (create wizard) | ✅ | ✅ | ✅ | Core flow live |
| Event CRUD (Edit & Delete) | ✅ | ✅ | ⚠️ in progress | Latest commits still touching this |
| Host Dashboard | ✅ | ✅ | ⚠️ in review | `app/home` live |
| Reusable Component Library | — | — | — | **DONE** — achieved via React composition as components are built (Dheeraj), not a standalone library artifact |
| **Guest Mgmt & RSVP** | ✅ live (`guests_01-05`) | ✅ RLS+seed live | ❌ **not started** | No `app/guests` — **critical-path gap** |
| Event Settings | ✅ live | ✅ 4 API routes live | ✅ live — 5 tabs w/ real DB round-trips | Corrected in CLAUDE.md 2026-07-29: was marked "not started," actually built (`app/settings`, commit `a8df148`) |
| Planning Tools | ✅ live (`planning_01-07`) | ⚠️ unconfirmed | ❌ not started | No `app/planning` |
| Media & Memories | ✅ live (`media_01-06`) | ⚠️ partial (`app/api/media`, R2 setup in progress) | ❌ not started | No `app/media` |
| Digital Invitations | ✅ live (`inv_01-06`) | ⚠️ unconfirmed | ⚠️ 1 prototype page only | `app/wedding-invitation-temp-1` is a design test, not the real card designer |
| Digital Presence (Event Website / guest-site templates) | — | — | ❌ not started in `app/` | 6 templates locked design-side (see §3); `app/e/[slug]` not started |
| Landing/Marketing Site | — | — | ⚠️ in progress, heavy design churn | Bee mascot, hero video, guest-site templates |
| User Settings | — n/a | ✅ 3 API routes live | ✅ live — 4 sections, real DB round-trips | **Built 2026-07-29.** Profile (avatar → R2), Security (connected SSO/phone methods — password UI dropped, Evenzi has no password auth), Notification prefs, Account sign-out. Tested at 6 breakpoints. See [`specs/2026-07-29-user-settings-design.md`](superpowers/specs/2026-07-29-user-settings-design.md) |
| Event Management Hub | — n/a | — | ❌ not started | Design prototype DONE (`designs/pages/event-control/event-control.html`, live on GH Pages); corrected in CLAUDE.md 2026-07-29 |
| Admin Module | ❌ | ❌ | ❌ | Not started |
| Support Chatbot | ❌ | ❌ | ❌ | Not started (Planned P1, unblocked) |

**Read on critical path:** Auth, Event Settings and User Settings are done. Event CRUD + Host Dashboard are close (in progress/in review). **Guest Mgmt & RSVP has a live data model and live backend (RLS+seed) but zero frontend** — this is the single biggest gap between "current state" and "one complete host flow," since RSVP tracking is explicitly part of the V0 definition. This should be the next engineering priority ahead of Planning Tools / Media, which aren't required for the core loop.

**Pattern worth reusing:** the User Settings build (2026-07-29) went design prototype → spec → plan → task-by-task build with a review gate after each → live browser testing at every breakpoint. Live testing caught two bugs that type-checks and eight passing code reviews had all missed, both in the same class: server-rendered data not actually reaching the UI. Worth running the remaining `designs/` → React conversions the same way rather than treating a clean type-check as done.

---

## 3. Guest-website templates — scope decision (locked 2026-07-29)

Full detail: [`designs/_plans/guest-website-templates-build-plan.md`](../designs/_plans/guest-website-templates-build-plan.md).

- **Locked lineup on the design side:** 6 immersive templates (2 Lovable-sourced — Bold Festive, Sapphire; 4 hand-built HTML-first — Midnight Elegant [shipped, pending sign-off], Classic Editorial, Minimal Modern, Blush Romantic). No "basic tier" distinction exists in the design plan — all 6 are full immersive-mandate builds.
- **Aug-end launch scope is rolling, not a hard cut:** ship whichever templates are complete by end of August. Confirmed floor = both Lovable templates + Midnight Elegant (already shipped). Dheeraj is hand-building 1–2 more from the remaining three; exact final count TBD closer to launch.
- **Cataloging split:** Lovable-sourced template output (React components, `themes.ts` tokens) **bypasses** `designs/components.html` — separate React port-and-refine pipeline, not the HTML/CSS/JS prototype flow. Hand-built HTML-first templates keep following the normal catalog rule.
- **Still open:** ThemeForest licensing resolution for theme-derived source material (flagged in the build plan, §Licensing) — needs resolving before any theme-derived CSS/markup ships, independent of which templates make the Aug cut.
- **Dependency:** none of this reaches guests until the `app/e/[slug]/` React port + Digital Presence feature (currently Not Started in the app) lands — the design-side work is running ahead of the app-side integration.

---

## 4. Infra readiness

Full detail: [`docs/ops/infra-cost-forecast-2026-08.md`](ops/infra-cost-forecast-2026-08.md).

- **Not a launch blocker.** Total new variable infra spend at pilot scale (5–10 events/mo) is roughly **$10–100/month (₹960–9,550/mo)**, dominated by whether Vercel needs to move off the Hobby tier.
- **Cloudflare's $10k/12mo credit (₹9.55L; Startups Tier 3, submitted 2026-06-13, awaiting approval) is not a near-term constraint** — pilot-scale media usage burns under 4% of the monthly allowance. It's runway for the growth phase after the pilot proves out, not a pilot-scale concern.
- **Two concrete pre-launch action items:**
  1. **Vercel:** move to Pro (~$20–40/mo, ₹1,910–3,820 for 2 seats) before launch — Hobby's ToS restricts commercial use, and this removes ambiguity before any traffic spike.
  2. **Twilio:** confirm the actual India SMS rate and DLT template registration status — this is the one line in the forecast that's a genuine unknown (not just an estimate) and the one with a real launch-blocking failure mode (a stalled DLT template blocks OTP entirely, separate from the dollar cost).
- Everything else (Supabase, Resend, LLM providers, ClickUp, domain/email) stays inside free tiers or negligible cost at this scale — no action needed pre-launch.

---

## 5. Market context (competitor study, compiled 2026-07-28/29)

Full detail: [`docs/competitor-study/kerala-summary.md`](competitor-study/kerala-summary.md) · [`docs/competitor-study/india-summary.md`](competitor-study/india-summary.md) (53 companies total, both with backing spreadsheets).

**What this means for the V0 pitch, not just background reading:**

1. **The full-suite gap is real and narrow.** Only one direct full-suite competitor exists per tier — **itsmy.wedding** (Kerala, Trivandrum) and **iWed.ai** (pan-India) — each the single closest match to Evenzi's feature set. Both deserve ongoing monitoring, but the category is genuinely thin, not crowded. Evenzi's bundled (website + guest list/RSVP + invites + checklist/budget) positioning is a real differentiator, not a me-too claim.
2. **"Guest list + RSVP + WhatsApp" is the identified open wedge** — Bliss and Wedd.ai (Kerala/pan-India) are both narrowly built around exactly this, validating that it's a real pain point worth solving well — which directly reinforces why the Guest Management & RSVP gap (§2) is the right thing to prioritize before launch, not just a data-model checkbox.
3. **Pricing is opaque market-wide** (~80% quote-on-request across both tiers) — Evenzi doesn't need to win on a published price war; a clear free-tier-feels-paid product story is more differentiated than most of this list can offer.
4. **AI guest-photo sorting (face-matching) is table stakes nationally, not a differentiator** (Kwikpic, Samaro.ai) — useful to know before over-investing there; Media & Memories should ship a solid gallery first, AI sorting later.
5. **Kerala specifically is planner-heavy, tech-light** — 15–16 of 18 Kerala-based companies are pure offline services businesses with no digital tool of their own. A pilot launch concentrated in Kerala (where the founder has local reach) faces very little direct product competition, even though the broader category (WedMeGood, WeddingWire) is well-known to the audience as "where you find a planner," not "where you run RSVPs."

---

## 6. Pre-launch checklist

- [x] ~~Build User Settings FE~~ — **done 2026-07-29**, `/settings` live with 4 working sections
- [ ] Close Event CRUD Edit & Delete (FE+BE) — currently in progress
- [ ] Sign off Host Dashboard revamp — currently in review
- [ ] **Build Guest Management & RSVP FE/app** — critical-path gap, data model + design already done
- [ ] Decide final guest-website template count for the Aug cut (rolling — revisit closer to date per §3)
- [ ] Resolve ThemeForest licensing for any theme-derived template source material before shipping
- [ ] Move Vercel to Pro
- [ ] Confirm Twilio India SMS rate + DLT registration status
- [ ] Confirm Cloudflare Startups Tier 3 approval status (submitted 2026-06-13)

## 7. Explicitly deferred (not this doc's job)

- Growth-phase infra forecasting (10x–50x pilot volume) — revisit with real pilot usage data.
- Full go-to-market / sales sequencing off the competitor study — the study is market context for this plan, not a GTM plan itself.
- Digital Presence (`app/e/[slug]/`) build sequencing — depends on the templates scope settling per §3 first.
