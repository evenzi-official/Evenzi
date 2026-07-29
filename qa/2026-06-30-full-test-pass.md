# Full Test Pass — 2026-06-30 (Abhijith)

Heavy Playwright QA of Dheeraj's landed work. Scope set by 6-agent static build-status classification (only **wired** pages get functional tests; prototype ports get render/a11y only and are never failed for missing backends).

**Env:** dev `:3000`, Supabase `smjkbmkxweevqpvygabe`. **Login:** `9999999999` / OTP `123456` (user `475f9ebb`). **Test events:** `d63f20d0` ("test & test's Wedding", 4 subs/12 tasks, date 2026-06-28), `462dadb4` ("a & b's", null date, empty-state).
**Mobile widths:** 360 / 390 / 414 primary; 768 / 1440 spot-checks.

---

## SCOPE

### A. IN-SCOPE — functional (wired to DB/API)
| Page / route | Build | Functional test focus |
|---|---|---|
| `/auth` (phone OTP) + role-selection + callback | WIRED | login flow, OTP cells, redirect |
| `/home` dashboard + EventsGrid | WIRED (collab/notif/account dead) | events render, seg toggles, create, sign-out |
| `/events/create` wizard (Steps 1–4) | WIRED | full create → POST /api/events → /events/[id] |
| `/events/[id]` hub | PARTIAL | wired reads (name/venue/date/guests/roadmap); stubs noted, not failed |
| `/events/[id]/settings` (General) | WIRED | edit PUT+PATCH round-trip, delete soft-delete |
| `/events/[id]/settings/guests` | WIRED | toggles + caps + msg persist |
| `/events/[id]/settings/website` | PARTIAL | toggles/banner/offline persist (password field dead — known) |
| `/events/[id]/settings/admins` | PARTIAL | invite inserts row (no email — known) |
| `/events/[id]/settings/billing` | PARTIAL | plan display reads live (upgrade inert — known) |
| `/api/events/[id]` GET/PUT/DELETE | WIRED | exercised via above flows |

### B. RENDER-ONLY — visual/a11y at mobile widths; NOT functionally tested (unwired prototypes — excluded per scoping rule)
| Page | Build | Why excluded |
|---|---|---|
| `/events/[id]/journey` | STATIC-STUB | never queries sub-events; dead add buttons |
| `/events/[id]/guests` (Guest Mgmt) | STATIC-STUB | hardcoded zeros, all buttons no-op |
| `/events/[id]/invitations` | STATIC-STUB | client-local only, no persistence, dead Download |
| `/events/[id]/planning` | STATIC-STUB | in-memory only, zero DB |
| `/events/[id]/media` | STATIC-STUB | upload onChange = no-op; no /api/storage/* |
| `/events/[id]/website` + design + edit + photos | STATIC-STUB | prototype ports, cosmetic controls |
| `/events/[id]/settings/registry` | STATIC-STUB | fake setTimeout "saved" toasts, no API |
| `/events/[id]/success` | PARTIAL | real countdown/type; static stat tiles |

---

## KNOWN GAPS (from static review + DB — pre-confirmed, not "test failures")
- **Hub stats:** `event_hub_summary` supplies `budget_percent` + `task_percent`, but hub hardcodes Budget-used & RSVP-rate as `—`; RSVP rate has **no** view column (needs view extension). Timeline + activity panels are static stubs.
- **Soft-delete:** DELETE only stamps `events.deleted_at`; children (sub-events/tasks/guests) left live. Child RLS gates on parent `user_id` but not `deleted_at`.
- **Edit FE:** done via settings form, not "wizard re-entry pre-filled" (ticket divergence — pending decision).
- **/home:** event-type label hardcoded "Event"; Collaborations tab + notifications + account-menu are dead.
- **Settings:** General "Allow ticket sales" toggle cosmetic; Website password field dead; Admins invite sends no email; Registry fully fake; Billing upgrade inert + perks hardcoded; Guests reads raw table not `effective_max_plus_ones` view.

---

## RESULTS

### Auth / `/auth` (390px)
- ✅ `/home` → `/auth` middleware redirect works (unauth protection live).
- ✅ Auth page renders clean at 390px (`01-auth-390.png`); "Send OTP" correctly disabled until a number is entered.
- 🔴 **Send OTP fails — 422 / Twilio error 20003 ("Authenticate")**. No test-OTP override for `9999999999`; Supabase attempts a real Twilio SMS and the Twilio credentials fail auth. Phone-OTP login is **non-functional in this environment**, and the automated test login is blocked until test-OTP is enabled or a session is provided.

### Environment limits (not code defects)
- `.env.local` has only `NEXT_PUBLIC_SUPABASE_URL` + anon key. No `service_role` (can't mint sessions), no R2 keys (cover upload + R2 images will fail), no Twilio (phone OTP fails).

- 🔴 **Google OAuth login fails — `?error=auth_failed`.** Google authenticated fine (real `code` returned twice → localhost redirect IS configured), but the callback exchange fails: server log = **"OAuth callback error: PKCE code verifier not found in storage."** Code setup looks correct (`lib/supabase/client.ts` uses `@supabase/ssr` `createBrowserClient`; `app/auth/callback/route.ts` uses `createServerClient` with `getAll/setAll`). Likely a **Playwright automated-context cookie artifact** (verifier cookie not surviving the cross-origin redirect headlessly). ⚠️ **NEEDS REAL-BROWSER CONFIRM** — if it also fails in a normal browser, Google login is broken for real users (would be a P1 bug).

### Auth deep root-cause (after test-OTP enabled)
- Test-OTP `9999999999`/`123456` now **sends + verifies (200)**; OTP UI flow works (send → 6-cell verify → token).
- 🔴 **But the session is unusable server-side.** The verify JWT (`session_id 5cc51665`, user `475f9ebb`, ES256, `sb_publishable_` key) returns **`403 session_not_found`** from `/auth/v1/user`. `auth.sessions` has **0 rows for this user** (9 exist for others — table is readable), so **the OTP verify never persisted a session row**. Middleware `getUser()` therefore 403s → every protected route redirects to `/auth`. Cookie itself is fine (2471 B, single, unchunked, correct format). Audit logging is **off** (0 rows) so no logout trace.
- **Net:** all three login paths are unusable for local automated testing — Twilio OTP (creds), Google (PKCE in headless), test-OTP (no persisted session). Likely Supabase auth-config / test-OTP behavior, possibly aggravated by http://localhost (Secure-cookie / session-rotation interplay) — real users on the HTTPS deploy are unaffected (events exist for this user).

### 🚨 TRUE ROOT CAUSE (supersedes the three auth findings above)
**`@supabase/ssr` is installed at `0.1.0` but the app requires `^0.10.0` (lockfile correctly pins `0.10.0`).** The parent repo's `node_modules` is **stale** — never reinstalled after the dep bump — and the worktree (no local `node_modules`) falls back to it.
- v0.1.0 only supports the legacy `get/set/remove` cookie adapter. **All** the app's auth code (`lib/supabase/client.ts`, `lib/supabase/middleware.ts`, `app/auth/callback/route.ts`) uses the **`getAll/setAll` API** (≥0.7). So v0.1.0 **cannot read or write the session cookie at all**.
- This is why: OTP verify creates a session but `getUser()` never sees it (cookie not written) → redirect; Google OAuth "PKCE verifier not found" (verifier cookie never written); a hand-injected, server-validated (`curl /auth/v1/user`=200) cookie still yields `getUser`→401.
- **None of the earlier "auth bugs" (Google PKCE, OTP session_not_found) are app-code defects** — they are all symptoms of the stale dependency. (Twilio OTP creds being invalid is a separate, real env issue.)
- **Severity:** P0 for local dev (no one can authenticate locally from this worktree / a stale-install checkout). Prod/Vercel is unaffected (clean install resolves `0.10.0` from the lockfile).
- **Fix:** `npm install` (lockfile already correct). Done in-worktree this session to unblock the live pass.

> ▶ After `npm install` + dev restart, the live mobile/visual/click pass resumes (session injected via password-grant for test user `475f9ebb`). Temp password set on that account for grant — **revert at session end**.

---

## LIVE PASS RESULTS (Playwright, authenticated as phone user 475f9ebb, display_name=NULL)

### `/home` dashboard — 390px (`10-home-390.png`)
- ✅ Renders clean at 390px; nav, seg filters, event card, create tile all laid out correctly, no horizontal scroll.
- 🔴 P2 confirmed LIVE — greeting renders "**WELCOME BACK,**" with **empty name** (user has NULL display_name + empty email; `user.email ?? user.phone` → `""`). Account avatar falls back to "U". (This is exactly what the onboarding-gate feature fixes.)
- 🟡 P2 confirmed — event card eyebrow shows hardcoded "EVENT" (real type not resolved).
- (Pending interaction tests: seg toggles, dead notif/account buttons — known from static.)

### `/events/[id]` Event Hub — 390px (`11-hub-390.png`, event d63f20d0)
- ✅ Renders clean at 390px; hero, meta chips, quick-action card, tool-rail all laid out, no horizontal scroll.
- ✅ **Wired reads work LIVE:** Venue "Kannur" + Date "Sunday, 28 June 2026" pulled from `event_hub_summary`. Event name correct.
- 🟡 P3 (known) — console warning: `Invalid DOM property 'transform-origin'` on the hero mandala SVG ([page.tsx:183](app/events/[id]/page.tsx:183)) — should be `transformOrigin`/CSS. Matches the NEXT-SESSION "hub-hero SVG transform-origin" debt.
- 🟡 P2 NEW — **hydration mismatch**: Breadcrumb `className` Server `"bc-wrap reveal in"` vs Client `"bc-wrap reveal"` — the `in` reveal class is server-rendered but not on client → React hydration warning + possible flash. Worth fixing (reveal class should be applied client-side only).
- ✅ Stats dock live (`11-hub-390-full.png`): **Guests "0 expected" wired**; RSVP-rate + Budget-used render "—" (confirmed stubs). Journey shows "4 functions" + roadmap (Wedding Ceremony / Reception / Engagement) from real sub-events.
- 🟡 P3 — `reveal`-on-scroll sections (feature bento + timeline/activity) sit at `opacity:0` in a static capture; depend on IntersectionObserver firing. Tied to the `reveal in` hydration mismatch above. On real scroll they reveal; flag the SSR/reveal class handling.

---

### `/events/[id]/settings` General — EDIT round-trip (event d63f20d0)
- ✅ Form **loads real DB data**: name, partner_1/2 (from `event_details` jsonb), date, venue all pre-filled.
- ✅ **Edit persists end-to-end (verified live + DB):** changed venue + tagline → `PUT /api/events/[id]` 200 + `PATCH …/general-settings` 200 → DB now `primary_venue="Kannur, Kerala"`, `event_general_settings.tagline="QA edit 2026-06-30"`. Dual-fetch + two-table write both work. **(Dheeraj's Edit BE + settings wiring = PASS.)**
- ⚠️ Note: left QA edits in place on d63f20d0; restore at cleanup if desired.

### `/events/[id]/settings` Delete flow (event 462dadb4, restored after)
- ✅ Delete-confirm modal renders correctly: `role=alertdialog`, "Delete this event?" + warning copy + Cancel/Delete buttons.
- 🔴 **P2 NEW (mobile UI bug) — confirm button not clickable via pointer.** At 390px the **bottom `tool-rail` intercepts pointer events** over the modal's "Delete event" button. Measured: scrim `z-index:80` vs tool-rail `z-index:40` — the scrim *should* win, but a **stacking-context trap** (the tool-rail's ancestor outranks the scrim's ancestor, so the numeric z-index is moot) lets the rail capture the tap. A real mobile user can't reliably confirm delete (may hit a tool-rail icon instead). Fix: render the modal scrim in a top-level stacking context (portal/`body`) or raise the scrim's ancestor above the tool-rail.
- ✅ **Delete BE verified** (forced the click via JS to bypass the overlay): `DELETE /api/events/[id]` → redirect to `/home` → DB `deleted_at` stamped (`2026-06-30 03:41:40`). Soft-delete works. **(Dheeraj's Delete BE = PASS; Delete FE modal = PASS render / FAIL mobile tap.)** Event restored (`deleted_at=null`) — no data lost.
- ⚠️ Re-confirms the cascade gap: children of the (briefly) deleted event were untouched.

### `/events/create` Create Wizard — FULL E2E (PASS)
- ✅ Step 1: only "Wedding" type available (MVP-expected); select → Proceed. URL syncs `?step=N`.
- ✅ Step 2: **validation works** — empty Partner 1/2 → `[invalid]` + a11y alerts "Partner X Name is required". Date picker: **past dates disabled** (June 1–29 greyed, today June 30 + future enabled; prev-month disabled at current month). Filled title/partners/guests(150)/venue.
- ✅ Step 3: 9 ceremony types from `config.event_sub_types`; Wedding Ceremony + Reception pre-checked; added Engagement; "2/3 celebrations selected" counter live; Set time/Set venue/custom-ceremony controls present.
- ✅ Step 4: review shows all entered data correctly.
- ✅ **Submit → `POST /api/events` → new event `af52af62` → redirect to its hub.** DB verified: name/date/venue/guests/`event_details` partners all correct; **3 sub-events + 12 tasks + 1 budget seeded** via `create_event_with_details`. Cleaned up (soft-deleted). **Create wizard = PASS end-to-end.**
- (Cover upload not exercised — R2 env absent; ENV-limited.)

### Responsive + render sweep (390px / 360px)
- ✅ **No horizontal scroll** at 360 + 390 on: `/home`, hub, settings/website, guests, invitations, planning, media, website, journey (all `scrollW == clientW`).
- ✅ **Dark mode** toggles cleanly (`html.dark`), renders correctly at 360px (`12-home-dark-360.png`).
- ✅ All prototype pages **render without crashing** at mobile (render-only, as scoped — not functionally failed).
- 🟡 P3 — every authenticated page logs **1 console error** (the recurring `transform-origin` SVG warning + breadcrumb hydration mismatch from the shared event layout/hero). One root fix clears it app-wide.

### `/events/[id]/journey` — P1 flow break CONFIRMED LIVE
- 🔴 **P1** — event `d63f20d0` HAS 4 sub-events (shown on the hub roadmap), but the journey page renders the **empty "Add sub-event" state** (`showsNoSubEvents: true`, no ceremonies listed). It never queries `event_sub_events`. Hub + quick-actions link here to "manage sub-events" → dead end. User-facing.

### Settings/website (390) — ✅ no overflow, 3 toggles + Save present (backend persistence covered by API agent).

### Desktop 1440 — ✅ hub no horizontal scroll (1425=1425), layout intact (`14-hub-1440.png`).

---

## API / BACKEND E2E (parallel agent — exhaustive, all endpoints, DB-verified)

**Overwhelmingly PASS** — auth gates (401), RLS scoping (404 on not-owned), UUID validation (400), strict-schema rejection (400), bounds (guest_capacity ≤100000, max_plus_ones 0–10), `''`→null on nullable cols, event_details shallow-merge, soft-delete idempotency (2nd → 404), admins invite (201 + `pending` row, dup → 409). **`website_password_hash` confirmed never writable AND never returned.** Cover upload fails **gracefully** (500 caught, ENV-limited — no R2). All agent mutations restored.

**🔴 2 NEW backend bugs (both P2, shared root cause):**
- **B1 — `PUT /api/events/[id]` `name:""` → 500** (should be 400). `emptyToNull()` coerces `name` → null, but `events.name` is `NOT NULL` → DB rejects → generic 500. The route comment claims D44 `''→null` but that's impossible for `name`. Fix: reject empty name with 400 (or map PG 23502).
- **B2 — `PATCH …/website-settings` `website_password_enabled:true` → 500** (should be 400). CHECK `ck_website_password_required` fires (no hash write path). Same for banner-enabled-without-text (`ck_announcement_text_required`).
- **Root cause:** POST/PATCH routes don't map Postgres constraint violations (23502 NOT NULL / 23514 CHECK) to 400 → they fall through to generic 500. One error-mapping helper fixes the class.

---

## ✅ E2E COVERAGE COMPLETE — SUMMARY

| Dimension | Verdict |
|---|---|
| Auth / session / middleware | PASS (after the P0 dep fix) |
| Create wizard (4 steps → DB + child seeding) | PASS |
| Edit (settings form → 2 tables) | PASS |
| Delete (soft-delete + DB) | PASS logic; **P2 mobile modal-tap bug** |
| Hub Overview (wired reads) | PASS; budget/RSVP/activity = known stubs |
| Settings backends (general/guest/website/admins) | PASS + **B1/B2 500-mapping bugs** |
| Responsive 360–1440, dark mode | PASS (no overflow anywhere) |
| Prototype pages render | PASS (render-only, unwired by design) |
| Journey page | **P1 flow break** (never lists sub-events) |

**Cleanup done:** test event `af52af62` soft-deleted; `d63f20d0` venue/tagline restored; temp password on `475f9ebb` reverted. Agent restored all its mutations.

---

## STATIC + DB FINDINGS (complete — 6-agent classification + DB verification)

### ✅ Verified good (DB layer)
- **RLS enforced** on `events` (`events_owner_all`: `auth.uid()=user_id`) + all children (`event_sub_events`/`event_tasks`/`event_guests` via parent join) + settings sidecars (`user_id`). The API routes' "no explicit user_id filter, relies on RLS" is **safe** — not a leak.
- `event_hub_summary` returns real `guest_total / task_percent(0/12) / budget_percent(null when no budget) / sub_event_count` for live events.

### 🔴 / 🟡 Findings by page (P-rated)

**Event Hub `/events/[id]` (PARTIAL)**
- 🟡 P2 — Budget-used & RSVP-rate dock stats hardcoded `—` though `event_hub_summary.budget_percent` exists; **RSVP rate has no view column** (needs view extension). `task_percent` also fetched-but-unused (timeline panel static).
- 🟡 P2 — Recent-activity panel = static stub (no activity source).
- 🟡 P3 — roadmap renders `repeat(${subCount})` columns w/ no cap → overflow risk at many sub-events; journey ring offset is binary not proportional; `default_card_share_token` dead select.

**Journey `/events/[id]/journey` (STATIC-STUB)**
- 🔴 P1 (flow break) — never queries `event_sub_events`; **always shows "No sub-events yet"** even when the hub shows 4. All three "Add sub-event" buttons are dead no-ops. Yet hub + quick-actions link here to "manage sub-events." Uses `.single()` (throws on 0 rows) vs hub's `maybeSingle`.

**Edit & Delete (`/api/events/[id]` + settings General)**
- 🟢 PUT/DELETE solid (partial update, `''`→null, soft-delete idempotent, RLS-safe).
- 🟡 P2 — DELETE doesn't cascade: soft-deleted event keeps live children (verified: `b1645952` → 2 sub-events + 12 tasks still live). Child RLS gates on parent `user_id` but not `deleted_at` → latent direct-read exposure.
- 🟡 P2 — Edit implemented as **settings-form PUT**, not the ticket's "wizard re-entry pre-filled" (divergence — your decision pending).

**Dashboard `/home` (PARTIAL)**
- 🟡 P2 — event-type label hardcoded `"Event"` on every card (API route resolves real names; page doesn't).
- 🟡 P3 — Collaborations tab permanent empty stub; Notifications + Account-menu buttons dead (no handler).

**Auth (`/auth` + callback) (WIRED)**
- 🟡 P2 — Sign Up vs Log In tabs drive identical behavior (copy only). Terms/Privacy `href="#"`.
- 🔴 P1? — Google OAuth callback PKCE failure (needs real-browser confirm; if reproduces in prod = P0).

**Settings**
- 🟢 General, Guest-list, Website-settings/Admins/Guest-settings APIs persist correctly; `website_password_hash` correctly never read into client; `''`→null coercion correct on general/website/guest.
- 🔴 P1 — **Registry tab fully fake**: `setTimeout` "Registry link saved"/"Cash fund created" toasts with **no API/DB**. Misleading.
- 🟡 P2 — Website "New website password" input is **dead** (captured, never sent — no hash write path).
- 🟡 P2 — Admins invite inserts a `pending` row but **sends no email** despite "Invite sent" copy.
- 🟡 P2 — General "Allow ticket sales" toggle cosmetic (no column, silently dropped).
- 🟡 P3 — Billing: upgrade button inert; perks hardcoded in JS (selected `custom_domain/priority_support/ai_features` flags unused); reads `config.plans` not `config.plans_public`. Guests reads raw `max_plus_ones_per_invite` not the view's `effective_max_plus_ones`.

**Create Wizard `/events/create` (WIRED)** — Steps 1–4 fully wired to state + `POST /api/events`; cover upload → R2 (will fail here, no R2 env). Step3 catalog-miss fallback hits `/api/event-types/[id]/sub-events` (verify route exists). Could not exercise live (auth blocked).

**Unwired prototypes (render-only, correctly excluded):** Guest Mgmt, Invitations (dead Download CTA + `evenzi.com/e/${id}` dead RSVP link), Planning (in-memory only), Media (upload `onChange = no-op`; no `/api/storage/*`), Website module (4 cosmetic pages). Per CLAUDE.md these are "FE not started" — **not failures**.

### Suggested ticket triage
- **P1:** Journey page sub-events (flow break) · Registry fake-save · Google PKCE (pending real-browser confirm).
- **P2:** Hub budget/RSVP/activity wiring · soft-delete cascade decision · /home type label · Website password field · Admins email · ticket-sales toggle.
- **P3:** roadmap column cap · collab/notif/account dead buttons · billing perks · guests effective-cap.
