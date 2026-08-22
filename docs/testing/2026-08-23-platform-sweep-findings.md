# Platform Testing Sweep — 2026-08-23

**Environment:** localhost:3000, branch `Dev-Vibe` (fast-forwarded to `origin/Dev-Vibe`, incl. Dheeraj's `f6f4c5e6` frontend-QA push).
**Method:** Live authenticated click-through as Host (test phone `9999999999`), driven against the V0-Readiness artifact's 17-feature matrix. No subagents.
**Account:** populated event "Dheeraj 1 & Dheeraj 2's Wedding" (id `477dcaa8-3893-41fa-8381-a08808cfd8bb`), 1 guest, 13 checklist tasks, 3 photos, 4 sub-events, live public site.

## Legend
✅ works · ⚠️ works with issue · ❌ broken/dead · ⏳ not built (expected) · n/a not code-auditable

## Feature matrix — live results (vs artifact claim)

| # | Feature | Result | Notes |
|---|---|---|---|
| 1 | Vercel deployment | n/a | infra, not swept |
| 2 | Auth & Role Selection | ✅ | phone OTP test creds work; Terms/Privacy links now live (`/legal/*`, Dheeraj fix confirmed on-screen) |
| 3 | Event CRUD | ✅ | event present; edit via Settings works; create wizard not re-run this pass |
| 4 | Host Dashboard | ⚠️ | renders; **guest count "10 expected" wrong — actual is 1** (hub shows 1 correctly) |
| 5 | Landing (marketing) | ✅ | public, mascot + nav render |
| 6 | Reusable components | n/a | composition, no artifact |
| 7 | Event Management Hub | ✅ | **Budget used 29% live** (Dheeraj stat works); journey/roadmap 4 sub-events in canonical order; quick actions render |
| 8 | Guest Management & RSVP | ⚠️ | renders, RSVP filters, warning banner; **phone shows double prefix "+91 +91987 6543210"** |
| 9 | Event Settings | ✅ | General tab, identity fields, danger zone, footer legal links |
| 10 | User Settings | ⚠️ | 4 sections render; **2FA copy says "in addition to your password" — app has no password auth** |
| 11 | Planning (checklist + budget) | ✅ | 13 tasks seeded; **edit-task sheet opens with all fields** (title/due/sub-event/priority) — previously never UI-clicked |
| 12 | Media & Memories | ✅ | real storage meter 0/5 GB; "Notify me" disabled + "Set cover" removed (Dheeraj dead-control fixes confirmed) |
| 13 | Digital Presence (website) | ✅ | public guest site renders anon (hero, nav Home/Our Story, "Content coming soon") |
| 14 | Push Notifications | ✅ | in-app bell panel shows real notifications, Mark all read, View all |
| 15 | Admin Module | ⏳ | nonexistent (expected — not started) |
| 16 | Digital Invitations | ⚠️ | 7 templates render, previews auto-filled with event data; **persistence still absent** (documented gap) |
| 17 | Support Chatbot | ⏳ | nonexistent (expected) |

## New bugs found this pass (not in the artifact)
1. **Dashboard guest count wrong** — "/home" event card shows "10 expected", actual guest count = 1 (hub correct). Dashboard aggregate stat bug.
2. **Guest phone double `+91` prefix** — Guest row renders "+91 +91987 6543210"; stored value already includes the country code and the UI prepends `+91` again.
3. **Setup-progress stale hint** — dashboard bar reads "80% - Upload a cover photo" while a cover image IS displayed.
4. **2FA copy inaccurate** — User Settings 2FA text references a "password"; Evenzi auth is phone-OTP / Google only, no password.
5. **/help topic count mismatch** — page renders 6 curated topic cards; DB has **10 enabled** `config.faq_categories`. Curated list vs data drift.
6. **Console (dev-only)** — `/sw.js` service-worker registration fails on localhost (prod reports 200); `<html>` hydration "Extra attributes: class" warning.

## Code-review flag (from Dheeraj's f6f4c5e6, verified against DB)
- **Up-next filter excludes only `completed`, not `cancelled`** — `app/events/[id]/page.tsx:184`. A cancelled task would still surface in the hub "Your timeline" panel. `config.task_statuses` slugs confirmed: `cancelled, completed, in_progress, pending`. `event_hub_summary.budget_percent` confirmed to exist.

## Open launch gates confirmed still open (match artifact)
- **Help Centre content empty** — `config.faq_articles` = **0 rows** against 10 enabled categories. Launch blocker.
- **Digital Invitations** — nothing persists (card designer is draft-only).
- **Admin Module & Support Chatbot** — not built (out of V0 scope).

## Dheeraj 08-22 push — live confirmation
All confirmed working live: Budget % stat, legal pages + links, Media dead-control removals, favicon manifest entry. Verdict: **ships** (one minor `cancelled` filter nit above, non-blocking).
