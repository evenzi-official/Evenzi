# Push Notifications (In-App + Browser Push) — Design

> Two-layer notification system: an in-app bell/dropdown (source of truth, backed by a new `notifications` table) plus real browser push (service worker + `web-push`) as an additive delivery channel on top of the same events. Covers 4 real triggers already live in the product — RSVP received, co-host joined, expense recorded, and invites-sent (schema-ready, wired when WhatsApp send ships). The bell + dropdown UI is already fully designed in `designs/components.html` (S8) and `designs/shared/shell.js`/`shell.css` — this spec wires it to real data for the first time; `FloatingNav.tsx`'s bell is currently dead decoration with a hardcoded `notificationCount={1}`.

| | |
|---|---|
| **Date** | 2026-08-06 |
| **Author** | Abhijith (+ Claude) |
| **Status** | Design — pending `/council design` + user review before plan |
| **Prerequisite reading** | `designs/components.html` §S8 (dropdown markup), `designs/shared/shell.js` lines 180–290 (existing static behavior — mark-all-read only, no per-item click, no real data), `components/layout/FloatingNav.tsx` (dead bell button in the real app) |

---

## 1. Why this now, and what's explicitly NOT in this pass

`user_preferences.push_notifications` has existed as a boolean since Sprint 1's User Settings build — it renders as a live-looking toggle in `NotificationsSection.tsx` but does nothing: no subscription table, no service worker, no delivery pipeline anywhere in the codebase. The bell icon in `FloatingNav.tsx` (used on every dashboard/event/settings page) has no `onClick`, no dropdown, and its unread badge is hardcoded to `1` in `app/events/[id]/layout.tsx:38`. This pass makes both real.

**Out of scope, explicitly:**
- A dedicated `/notifications` history page (dropdown caps at last 20, "View all" link removed from the S8 footer for now).
- Per-notification-type push toggles — stays a single `push_notifications` boolean, matching the existing schema. No new Settings UI.
- `email_alerts` / `sms_alerts` — separate dead toggles in the same section, not touched here.
- Vendor-related notifications ("Vendor confirmed" in the S8 sample data) — no vendor entity exists in the schema, and Vendor role is explicitly out of scope for MVP per `CLAUDE.md`. Dropped, not stubbed.
- **A2HS (Add to Home Screen) install prompt for iOS** — iOS Safari requires the site be added to the home screen before web push works at all. This needs its own UX pass (when to show the prompt, what it looks like, dismissal/snooze behavior) — tracked as a follow-up spec, not built here. Push simply won't be offerable to iOS Safari users until that ships; desktop and Android Chrome are unaffected.

## 2. Architecture — one source of truth, two delivery channels

Every notification is a database row first. The in-app bell reads that table directly. Browser push is an additive side-channel that fires when a row is inserted — if a user never granted push permission, or push delivery fails, the in-app bell still works correctly on its own.

```
Action happens (RSVP set · co-host accepts invite · expense recorded)
        │
        ▼
notify() helper — insert 1 row per recipient into `notifications`
 (recipients = event owner + active co-hosts, excluding whoever performed the action)
        │
        ├──▶ In-app: nothing else required. Next poll (≤60s) or next page load picks it up.
        │
        └──▶ For each recipient with push_notifications = true:
                   look up their push_subscriptions rows
                   → send via `web-push` npm package to each one
                   → a subscription that comes back 410 Gone gets deleted (expired/revoked)
```

`notify()` failures (insert error, push send error) are logged and swallowed — they never block or roll back the parent action. A failed notification insert must not fail an RSVP save.

## 3. Data model — two new tables

### `public.notifications`
One row **per recipient**, not per event — this is what makes read/unread state naturally per-user without a separate join table.

```sql
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,   -- recipient
  event_id uuid not null references public.events(id) on delete cascade,
  type text not null check (type in ('rsvp_received','collaborator_added','expense_recorded','invites_sent')),
  title text not null,
  body text not null,
  link_path text,                                                       -- e.g. /events/{id}/guests, null-safe if absent
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_user_recent on public.notifications(user_id, created_at desc);
create index idx_notifications_user_unread on public.notifications(user_id) where read_at is null;
```

RLS: `user_id = auth.uid()` on select and update. No insert policy for authenticated clients — all inserts happen server-side (API routes / the acceptance function), using the service role or a `SECURITY DEFINER` path consistent with how `create_event_with_details` and `generate_event_slug` already work in this codebase.

### `public.push_subscriptions`
Multiple rows per user — one per device/browser that has ever granted permission.

```sql
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now()
);
create index idx_push_subscriptions_user on public.push_subscriptions(user_id);
```

RLS: `user_id = auth.uid()` on select, insert, delete. A user only ever manages their own subscriptions.

## 4. Trigger wiring — 4 types

| Type | Fires from | `link_path` target | Status this pass |
|---|---|---|---|
| `rsvp_received` | `app/api/events/[id]/guests/[guestId]/route.ts` PATCH — host sets a guest's RSVP status | `/events/{id}/guests` | Real, wired now |
| `collaborator_added` | Fires on **acceptance** (copy: "Riya joined…"), not on invite-send. Acceptance happens inside `link_pending_collaborators()`, called at a new co-host's first login — the insert into `notifications` happens inside that same function/flow, atomic with the collaborator row flipping to `status='active'` | `/events/{id}/settings` (Admins tab) | Real, wired now |
| `expense_recorded` | `app/api/events/[id]/planning/expenses/route.ts` POST | `/events/{id}/planning` (Budget tab) | Real, wired now |
| `invites_sent` | Guest Management's WhatsApp send button is a disabled stub — no backend route exists to hook into yet (per `CLAUDE.md`: "intentionally inert") | `/events/{id}/guests` | **Type added to the schema's CHECK constraint now, so no migration is needed later.** The actual `notify()` call is added when the WhatsApp send route itself is built, in that feature's own pass — nothing fires, no fake data, this pass just avoids a second migration down the line |

Recipient resolution for all four: event owner (`events.user_id`) + every `event_collaborators` row with `status = 'active'` on that event, **excluding** whichever user performed the triggering action. For `collaborator_added` specifically, the "actor" is the newly-joined co-host themselves (their login is what triggers `link_pending_collaborators()`) — they don't get a notification about their own joining; the owner and any other already-active co-hosts do.

## 5. In-app bell + dropdown — wiring the existing design

The dropdown markup, CSS, and static JS behavior already exist (`designs/components.html` S8, `designs/shared/shell.css` `.fn-notif-*` classes, `designs/shared/shell.js` lines 180–290). This pass ports that pattern into the real React app and makes it live:

- `FloatingNav.tsx`'s bell gets a real `onClick` → opens a dropdown panel (same visual spec as S8: header with "Mark all read", scrollable item list, no footer/"View all" link — removed per scope).
- `notificationCount` stops being a hardcoded prop and becomes a real unread count, fetched client-side.
- **Fetch cadence:** on mount + poll every 60 seconds (`GET /api/notifications?limit=20`). No realtime/websocket — this would be the first use of Supabase Realtime anywhere in the codebase, and isn't justified for a feature where a ≤60s badge delay is acceptable.
- **Item click** (new behavior, not in the static design): marks that one notification read (`PATCH /api/notifications/[id]`) and navigates to `link_path` via `router.push()`. Badge count decrements by one.
- **Mark all read**: `POST /api/notifications/mark-all-read` — bulk-sets `read_at = now()` for all of that user's unread rows.

New API routes:
- `GET /api/notifications` — last N (default 20) for the current user, most recent first, includes unread count.
- `PATCH /api/notifications/[id]` — mark one read. 404s if the notification doesn't belong to the caller.
- `POST /api/notifications/mark-all-read` — bulk mark read for the current user.

## 6. Browser push — service worker + VAPID

- Self-generated VAPID keypair (`web-push generate-vapid-keys` — free, no third-party service). Public key exposed to the client; private key server-only.
- `public/sw.js` — a service worker registered once on first app load (standard `navigator.serviceWorker.register()`), listens for `push` events and shows a `Notification`.
- **Opt-in flow:** reuses the existing `push_notifications` toggle in `app/settings/NotificationsSection.tsx`. Turning it **on** triggers `Notification.requestPermission()` right there (never on page load — explicit user action only). On grant, the client subscribes via `PushManager.subscribe()` and `POST`s the subscription (`endpoint`, `p256dh`, `auth`) to a new `/api/notifications/push-subscription` route, which upserts into `push_subscriptions`. Turning it **off** unsubscribes client-side and deletes the row server-side.
- **Send path:** the same `notify()` helper that inserts the `notifications` row also looks up the recipient's `push_subscriptions` rows (only if their `push_notifications` preference is `true`) and sends via the `web-push` npm package. A `410 Gone` response from the push service means that subscription is dead — delete the row, no user-facing error.
- **iOS limitation:** Safari on iOS only supports web push for sites added to the home screen. Until the A2HS follow-up ships (§1), iOS Safari users simply won't get push — the toggle can still exist, `requestPermission()` will just fail/no-op gracefully there. Not blocking for this pass.

## 7. Production / deployment requirements

| Item | Action needed |
|---|---|
| VAPID keypair | Generate once, add `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` to Vercel env — **both Production and Preview** |
| HTTPS | Already satisfied — Vercel is HTTPS by default, required for service worker registration |
| `public/sw.js` | Served automatically by Next.js's static file handling — no config change |
| `web-push` package | `npm install web-push` — runs fine in Vercel serverless functions, no special runtime needed |
| Domain migration heads-up | Per the domain strategy (`evenzi.vercel.app` → `app.evenzii.com` at launch), push subscriptions are tied to origin — every existing subscription silently breaks on that migration since the endpoint is origin-scoped. Not a blocker now; flag it on that migration's own checklist so users are told to re-enable push after the move. |

## 8. Error handling

- `notify()` insert failure: logged server-side, swallowed. The triggering action (RSVP save, expense insert, collaborator acceptance) always succeeds or fails on its own merits, never because a notification side-effect failed.
- Push send failure (network error, invalid subscription): logged, swallowed, never surfaced to the actor performing the triggering action.
- `410 Gone` from a push endpoint: the dead subscription row is deleted as part of the same send attempt — self-healing, no manual cleanup needed.
- Notification `GET`/`PATCH` routes: standard auth check (401 if no session) + ownership check (404, not 403, if the notification isn't the caller's — same IDOR-safe pattern already established in `website-settings/route.ts` and this session's `guest-settings`/`general-settings` fixes).

## 9. Testing (to run once implemented)

- Two-account test: Account A performs the 3 real trigger actions on an event where Account B is a co-host — confirm B receives all 3 in-app, A does not receive a self-notification.
- Mark-one-read and mark-all-read both persist correctly per-user (a second co-host's unread state is unaffected by the first's mark-all-read).
- Push: grant permission on Chrome desktop, confirm a real OS-level notification appears for each of the 3 real trigger types; deny permission, confirm in-app still works with no errors.
- Push subscription cleanup: manually revoke browser notification permission, trigger a notification, confirm the dead subscription row gets deleted rather than erroring repeatedly.
- Toggle off `push_notifications` in Settings mid-session, confirm the subscription row is deleted and no further push arrives (in-app still does).
- Breakpoints: dropdown panel at 360/390/414/768/1024/1440px — matches the existing `.fn-notif-panel` responsive rule in `shell.css` (`calc(100vw - 1.5rem)` under a breakpoint), confirm it still holds in the real app's header context.

## 10. Adding more trigger types later — deliberately cheap, not scoped now

The 4 types in §4 are what's real and live in the product today. This is not meant to be the final list — the architecture is built so a new trigger type is a small, additive change, not a redesign: add one value to the `notifications.type` CHECK constraint (one small migration) + one `notify()` call at the point in the relevant route where the thing already happens. The table, RLS, bell UI, polling, and push pipeline don't change per trigger.

Given that, this pass deliberately does **not** do a platform-wide scan for every notification-worthy event — that would inflate scope for no structural benefit, since adding one later costs almost nothing. Obvious future candidates, for reference, not built now: planning task overdue/due-soon reminder, event website published (offline → live), RSVP deadline approaching, guest CSV import batch complete, R2 storage quota nearing limit, sub-event added, media upload batch complete. Each becomes its own small addition once that feature's owner decides it's worth notifying on.

## 12. Council review — 2026-08-06

**Council reviewed:** 2026-08-06 by ui_ux_designer, frontend_engineer, tech_lead, product_manager, security_expert (design mode, Critique + Debate + Arbiter).

### 🔴 Critical — must resolve before this spec is buildable
1. **`collaborator_added`'s push leg can't fire as designed.** The notification insert happens inside `link_pending_collaborators()`, a plpgsql `SECURITY DEFINER` trigger fired by `handle_new_user()` on `auth.users` insert — pure Postgres, no Node runtime, cannot call the `web-push` package. Needs an explicit out-of-band dispatch (DB webhook / outbox consumer) for this one trigger type, or push is dropped for it. Flagged by Tech Lead, endorsed by Frontend + Security.
2. **SSRF via client-supplied `endpoint`.** Server POSTs to whatever `endpoint` URL the browser submits, with no allowlist against known push-service hosts (`fcm.googleapis.com`, Mozilla, Apple). Flagged by Security, endorsed by Tech Lead.
3. **Push-subscription hijack.** Upsert-by-`endpoint` (globally unique) with no `user_id` ownership check on conflict — `PushManager.subscribe()` can return an existing subscription on a shared device, silently reassigning User A's row to User B, and §8's "errors are swallowed" means A loses push with zero signal. Flagged by Security, endorsed by Tech Lead (same IDOR class as this week's `guest-settings`/`general-settings` fixes, commit `68e2f18`).
4. **VAPID public key not exposed to client as written.** §7 lists `VAPID_PUBLIC_KEY` with no `NEXT_PUBLIC_` prefix — Next.js strips it from the client bundle, so `PushManager.subscribe()` has nothing to read. Flagged by Frontend, confirmed independently by Tech Lead.
5. **No empty state for the dropdown.** A new host with zero notifications opens the bell to an unstyled blank list. Flagged by UI/UX.
6. **Feature isn't on the MVP roadmap.** Justified entirely by engineering debt (dead toggle, hardcoded badge), not validated host demand — jumps ahead of P1 Support Chatbot and undeployed Digital Presence. Flagged by Product Manager, corroborated by Tech Lead directly against `CLAUDE.md`'s tables.

### 🟡 Important
- Porting the S8 vanilla-DOM dropdown to React isn't specified (portal vs. positioning; click-outside/Escape/scroll-close must be re-implemented, not assumed) — Frontend.
- `NotificationsSection.tsx`'s `toggle()` needs a new async path (permission request + subscribe/unsubscribe + persist) with no stated ordering or partial-failure UX — Frontend.
- Insert-privilege mechanism for `notifications` left undecided between service-role (bypasses all RLS) and a narrow `SECURITY DEFINER` RPC — materially different blast radius; existing route handlers have neither capability built in — Tech Lead.
- Push permission-denial has no recovery UX (toggle looks "on" while OS delivery silently never happens) — UI/UX.
- No loading/fetch-error state for the dropdown — UI/UX.
- Building full push infra now, immediately before the known `evenzi.vercel.app` → `app.evenzii.com` migration that breaks every subscription — Tech Lead, independently reinforced by PM.
- Scope bundles a cheap feature (in-app bell, ~a day) with an expensive one (push: SW, VAPID, permission UX, subscription lifecycle) in one pass for a 2-person team — PM, endorsed by Frontend + Security + UI/UX.

### 💡 Suggestions
- Neither new table has `updated_at` (codebase convention) — Tech Lead.
- Content-length truncation rule for generated `title`/`body` unstated — UI/UX.
- Trigger selection reads as engineering-convenience-driven rather than ranked host value (`expense_recorded` is low-urgency) — PM.
- §9 is QA test steps, not PM-level acceptance criteria — PM.
- No format validation or per-user cap on push-subscription payloads — Security.
- No rate limit on the push-send path itself — a won IDOR (#3 above) becomes a harassment/DoS vector against the real device owner — Security (debate blind spot).
- No stated source/tone for generated notification copy — UI/UX (debate blind spot).

### ⚖️ Arbiter-resolved
- **Security's "notify() must re-validate recipients per event_id"** — UPHELD-WITH-MODIFICATION: folded into the insert-privilege-mechanism finding above, not tracked separately. The eventual RPC must derive owner/collaborators from `event_id` itself (never trust a caller-supplied list), and the test plan must include a tampered-`event_id` case.
- **Poll reflow-while-open / pause-on-hidden** (UI/UX vs. Frontend) — UPHELD-WITH-MODIFICATION: merged into one Frontend finding — skip/hold refetch while the dropdown is open (misclick-under-cursor risk) + `document.hidden` gate for background tabs. Single item, suggestion/med.

### Verdict
🔴 **RE-PLAN, scope split required.** Strong panel consensus (PM raised, Tech Lead + Security + UI/UX + Frontend all independently endorsed): split into two passes.
- **Pass 1 (buildable now, once criticals #4–#5 and the important findings are folded in):** in-app `notifications` table + bell/dropdown + 3 real triggers (`rsvp_received`, `collaborator_added` minus its push leg, `expense_recorded`) + `invites_sent` schema-only.
- **Pass 2 (own spec, after Pass 1 ships and the domain migration lands):** browser push — VAPID, service worker, `push_subscriptions`, with SSRF allowlist + ownership-safe upsert designed in from the start, and the `collaborator_added` out-of-band dispatch problem solved explicitly.



- Dedicated `/notifications` page.
- Per-type push toggles (single boolean stays).
- `email_alerts` / `sms_alerts` wiring.
- Vendor-related notifications.
- A2HS install prompt (iOS) — own follow-up spec.
- `invites_sent` actually firing — schema-ready only, wired when WhatsApp send ships.
