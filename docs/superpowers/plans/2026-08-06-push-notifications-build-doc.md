# Push Notifications — Cursor Build Doc

> **For:** Cursor (auto mode). **Author:** Claude (planning) + Abhijith. **Date:** 2026-08-06.
> **Source spec:** `docs/superpowers/specs/2026-08-06-push-notifications-design.md` (read it first — this doc is the buildable plan derived from it, with all council fixes folded in).
> **Council verdict on the spec:** RE-PLAN with a scope split. This build-doc implements BOTH passes (in-app bell + browser push) but as **two clearly separated phases** — build and verify Phase A fully before starting Phase B. Every council critical is addressed inline below; do not skip the fixes.

This doc is self-contained. You do not have access to the planning conversation. Everything you need is here or in the files it points to.

---

## 0. Context you need before touching code

Evenzi is a Next.js 14 (App Router) + TypeScript (strict) + Supabase (Postgres, no ORM, raw client) + Tailwind app. Wedding/event platform: a **host** owns events, adds **co-hosts** (collaborators), manages guests/RSVPs, planning/budget, etc.

**What exists today (the starting point):**
- `components/layout/FloatingNav.tsx` — the app-wide top nav, rendered on every dashboard/event/settings page. It has a bell button (`.fn-icon-btn` with a `notifications` material icon + `.fn-dot` unread dot) that is **pure decoration** — no `onClick`, no dropdown. Its `notificationCount` prop is hardcoded to `1` at the one call site, `app/events/[id]/layout.tsx:38`.
- `app/settings/NotificationsSection.tsx` — User Settings > Notifications. Has a `push_notifications` toggle (a `.choice-card`) that persists a boolean to `user_preferences.push_notifications` via `PATCH /api/settings/notifications` but otherwise **does nothing** — no service worker, no subscription.
- `designs/components.html` (search `fn-notif-panel`, section "S8") + `designs/shared/shell.css` (`.fn-notif-*` classes) + `designs/shared/shell.js` (lines ~180–290) — a **complete static design** of the notification dropdown panel: header with "Mark all read", scrollable item list (icon + text + time + unread dot), footer "View all" link. This is the visual + behavioral reference to port into React. **Note the existing JS appends ONE panel to `document.body` and positions it with `getBoundingClientRect()`, and manually wires click-outside / Escape / resize / scroll-close.** Your React port must preserve click-outside + Escape + scroll-close parity (see A4).

**Data-model conventions (match these — read `docs/data-model/DATA-MODEL.md`):**
- Tables live in `public`, snake_case columns. Every table has `created_at` AND `updated_at` (`timestamptz not null default now()`).
- RLS is ON for all user-data tables. Privileged server-side writes use narrow `SECURITY DEFINER` plpgsql functions (see `create_event_with_details`, `generate_event_slug`, `link_pending_collaborators`) — **not** ad-hoc service-role clients. Follow the `SECURITY DEFINER` RPC convention.
- `events.user_id` = current owner. `event_collaborators` (status `pending`|`active`) = co-hosts; the owner is NOT a row there.
- API routes must call an ownership/auth check — this codebase had 3 IDOR bugs this week from missing checks (`website-settings`, `guest-settings`, `general-settings`, fixed in commit `68e2f18`). Every new route validates the session user owns/can-access the resource, returning **404 (not 403)** on mismatch.

**Notification scoping (important):** a notification is scoped to the **recipient user**, not to an event. `notifications.user_id` is the primary axis; `event_id` is context/link metadata only. The bell shows a user's notifications across **all** their events — `GET /api/notifications` filters by `user_id` only, never by the event page currently open.

---

## PHASE A — In-app notifications (build + verify this fully first)

Delivers: real `notifications` table, the bell dropdown wired to real data, 3 live triggers, click-to-navigate, polling badge. **No browser push in this phase.**

### A1. Migration — `notifications` table

Create a new migration (follow the repo's existing migration file convention). One row **per recipient**:

```sql
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,   -- recipient
  event_id uuid not null references public.events(id) on delete cascade,
  type text not null check (type in ('rsvp_received','collaborator_added','expense_recorded','invites_sent')),
  title text not null,
  body text not null,
  link_path text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()   -- COUNCIL FIX: convention requires updated_at
);
create index idx_notifications_user_recent on public.notifications(user_id, created_at desc);
create index idx_notifications_user_unread on public.notifications(user_id) where read_at is null;
alter table public.notifications enable row level security;

-- RLS: a user sees and updates only their own notifications. No client INSERT policy — inserts happen via the SECURITY DEFINER RPC in A2.
create policy notifications_select_own on public.notifications
  for select using (user_id = auth.uid());
create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- standard updated_at trigger (reuse the repo's existing set_updated_at() trigger fn if one exists; otherwise create it)
create trigger trg_notifications_updated_at before update on public.notifications
  for each row execute function public.set_updated_at();
```

### A2. The `notify_recipients()` SECURITY DEFINER RPC — the ONLY insert path

**COUNCIL FIX (criticals: insert-privilege undecided + recipient re-validation).** All notification inserts go through one narrow `SECURITY DEFINER` function that **re-derives the recipient set itself from `event_id`** — it never trusts a caller-supplied recipient list. This is the sole authorization boundary for the privileged insert, so it must do the lookup internally.

```sql
create or replace function public.notify_recipients(
  p_event_id uuid,
  p_actor_id uuid,          -- who performed the action; excluded from recipients
  p_type text,
  p_title text,
  p_body text,
  p_link_path text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- recipients = event owner + active collaborators, minus the actor. Derived here, never passed in.
  insert into public.notifications (user_id, event_id, type, title, body, link_path)
  select r.uid, p_event_id, p_type, p_title, p_body, p_link_path
  from (
    select e.user_id as uid from public.events e where e.id = p_event_id
    union
    select c.user_id from public.event_collaborators c
      where c.event_id = p_event_id and c.status = 'active' and c.user_id is not null
  ) r
  where r.uid is distinct from p_actor_id;
end;
$$;

revoke all on function public.notify_recipients(uuid,uuid,text,text,text,text) from public;
grant execute on function public.notify_recipients(uuid,uuid,text,text,text,text) to authenticated;
```

Call it from API routes via the session-scoped server client: `supabase.rpc('notify_recipients', {...})`. `SECURITY DEFINER` gives it the privilege to insert rows for other users without a service-role client.

### A3. Wire the 3 real triggers

Add a `notify_recipients` RPC call at each of these existing write points. **The notification insert must never block or fail the parent action** — wrap the RPC call so its failure is caught and logged, not thrown (the RSVP/expense save still succeeds even if the notify fails).

| Type | File | When | title / body | link_path |
|---|---|---|---|---|
| `rsvp_received` | `app/api/events/[id]/guests/[guestId]/route.ts` (PATCH, when rsvp_status changes) | after the guest update succeeds | title `"New RSVP"`, body `"{guest_name} {responded/confirmed} for {event or sub-event}"` | `/events/{eventId}/guests` |
| `expense_recorded` | `app/api/events/[id]/planning/expenses/route.ts` (POST) | after the expense insert succeeds | title `"Payment recorded"`, body `"{amount} — {vendor_name or expense type}"` | `/events/{eventId}/planning` |
| `collaborator_added` | inside `link_pending_collaborators()` (the plpgsql fn that flips a collaborator to `active` at first login) | in that same function, right after the row flips to `active` | title `"Co-planner added"`, body `"{new co-host name} joined {event name}"` | `/events/{eventId}/settings` |

**COUNCIL FIX (critical: collaborator_added actor):** the actor to EXCLUDE for `collaborator_added` is the newly-joined co-host themselves (their login triggers the function). Owner + other active co-hosts receive it; the joiner does not. Since this fires inside a plpgsql function, insert the rows there directly (same pattern as `notify_recipients`, or call it) — do NOT try to route this one through an API route.

`invites_sent` — the type value exists in the CHECK constraint but **nothing fires it** this pass (the WhatsApp send route doesn't exist yet). Leave it wired-for-later. Do not fabricate it.

### A4. Port the dropdown to React

**COUNCIL FIX (important: React port unspecified).** Build a `NotificationBell` client component (`components/layout/NotificationBell.tsx`) that replaces the dead bell button in `FloatingNav.tsx`. Requirements:
- Visual parity with S8 (`designs/components.html` / `.fn-notif-*` in `shell.css`) — reuse those class names; the CSS already exists, port it into the app's stylesheet if it's not already global.
- Use a React portal (`createPortal` to `document.body`) + a `useRef`-based position calc off the bell's `getBoundingClientRect()`, mirroring the existing shell.js positioning.
- **Re-implement, as React effects:** click-outside-to-close, Escape-to-close, close-on-scroll, reposition-on-resize. These exist in shell.js today; they will silently regress if you don't port them.
- **Remove the footer "View all" link** — no dedicated `/notifications` page this pass.
- **COUNCIL FIX (critical: empty state):** render an explicit empty state ("No notifications yet" + an icon) when the list is empty — a new host has zero notifications and must not see a blank `<ul>`.
- **COUNCIL FIX (important: loading + error states):** show a lightweight loading state on first fetch (reuse an existing shell skeleton primitive, don't invent one) and an inline error row with a retry affordance if the fetch fails.
- **COUNCIL FIX (suggestion: content-length):** apply a truncation rule to `.fn-notif-text` (e.g. `line-clamp: 2`) so a long guest/event name can't blow out the row.
- **COUNCIL FIX (suggestion, arbiter-merged: poll guard):** the 60s poll must (1) skip/hold the refetch while the dropdown is open (prevent items reflowing under the user's cursor mid-click), and (2) pause when `document.hidden` is true (backgrounded tab).

Define a shared `AppNotification` TypeScript interface in `lib/types/` (or the repo's types location) used by the component and all three routes.

### A5. API routes

- `GET /api/notifications?limit=20` — current user's notifications (`user_id = auth.uid()`), most-recent-first, plus an `unreadCount`. 401 if no session.
- `PATCH /api/notifications/[id]` — set `read_at = now()` for one notification. **Ownership check: 404 if the row's `user_id` isn't the caller.**
- `POST /api/notifications/mark-all-read` — bulk set `read_at = now()` for all of the caller's unread rows.

### A6. Wire into FloatingNav

Replace the dead bell button with `<NotificationBell />`. Remove the hardcoded `notificationCount={1}` from `app/events/[id]/layout.tsx:38` — the count now comes from the component's own fetch. The badge (`.fn-dot`) shows when `unreadCount > 0`.

### A7. Phase A verification (do before Phase B)

Run `npm run dev`, then in a browser:
- Two accounts, A owns an event, B is an active co-host. A changes a guest's RSVP → B sees a `rsvp_received` notification within 60s (or on reload), A does not (A is the actor).
- A records an expense → B gets `expense_recorded`, A doesn't.
- Click a notification → it marks read (badge decrements) and navigates to `link_path`.
- "Mark all read" clears all of that user's unread; the other co-host's unread state is unaffected.
- Empty state renders for a brand-new event/user with no notifications.
- Dropdown at 360 / 390 / 414 / 768 / 1024 / 1440px — no horizontal scroll, panel uses the existing `calc(100vw - 1.5rem)` rule under the breakpoint.
- `npm run test:run` + `npm run lint` clean (or no worse than the known baseline).

---

## PHASE B — Browser push (only after Phase A is verified)

Adds real OS-level push on top of the same `notifications` events. **Every council security critical for this phase is mandatory, not optional.**

### B1. Migration — `push_subscriptions` table

```sql
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()   -- COUNCIL FIX
);
create index idx_push_subscriptions_user on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
create policy push_sub_all_own on public.push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger trg_push_sub_updated_at before update on public.push_subscriptions
  for each row execute function public.set_updated_at();
```

### B2. VAPID + env

- Generate a keypair: `npx web-push generate-vapid-keys`.
- Add to `.env.local` AND Vercel (Production + Preview): `VAPID_PRIVATE_KEY`, and **`NEXT_PUBLIC_VAPID_PUBLIC_KEY`** — **COUNCIL FIX (critical): the public key MUST have the `NEXT_PUBLIC_` prefix** or the client bundle can't read it and `PushManager.subscribe()` has no `applicationServerKey`. Also add `VAPID_SUBJECT` (a `mailto:` used by web-push).
- `npm install web-push` (+ `@types/web-push` if needed).

### B3. Service worker

- `public/sw.js` — listens for `push`, shows a `Notification` with the payload's title/body, and on `notificationclick` focuses/opens the app at the payload's `link_path`.
- Register it **once**, idempotently, from a small client component mounted in the root layout (`app/layout.tsx`) — **COUNCIL FIX (suggestion): FloatingNav renders from multiple layout files, so do NOT register from there** or it'll double-register or be missing depending on the route.

### B4. Opt-in via the existing Settings toggle

In `app/settings/NotificationsSection.tsx`, extend the `push_notifications` toggle's `toggle()` handler. **COUNCIL FIX (important: ordering + partial-failure):**
- **Turning ON:** call `Notification.requestPermission()` (explicit user action — never prompt on page load). Only on `granted`: `PushManager.subscribe({ applicationServerKey: NEXT_PUBLIC_VAPID_PUBLIC_KEY })`, then `POST /api/notifications/push-subscription`. **Only after the subscription persists successfully** do you PATCH `push_notifications = true`. If permission is denied or subscribe fails, do NOT flip the boolean on, and show the denied-state (below).
- **Turning OFF:** unsubscribe client-side + `DELETE /api/notifications/push-subscription` (by endpoint), then PATCH the boolean off.
- **COUNCIL FIX (important: permission-denial recovery UX):** if `Notification.permission === 'denied'`, render the toggle in a distinct disabled/blocked state with copy like "Blocked in browser settings" — do not let it look identical to the working ON state.

### B5. `push-subscription` route — the security-critical one

`POST /api/notifications/push-subscription` and `DELETE /api/notifications/push-subscription`. On POST:
- **COUNCIL FIX (critical: SSRF):** validate the `endpoint` hostname against an allowlist of known push services before storing — reject anything not matching (at minimum) `*.fcm.googleapis.com`, `*.push.services.mozilla.com`, `*.push.apple.com`, `*.notify.windows.com`. No arbitrary URLs.
- **COUNCIL FIX (critical: subscription hijack):** on conflict on the unique `endpoint`, only update the row if its existing `user_id` matches the caller (`auth.uid()`). If the endpoint already belongs to a different user, reject explicitly — do NOT silently reassign it. (A naive upsert lets User B's subscribe steal User A's row on a shared device.)
- **COUNCIL FIX (suggestion):** validate `p256dh`/`auth` are base64url-shaped; cap subscriptions per user (e.g. 10).

### B6. Send path — extend `notify_recipients` delivery

The `notify_recipients` RPC inserts rows (Phase A). Push send is a **separate Node-side step** (plpgsql can't call `web-push`). For the two **API-route-originated** triggers (`rsvp_received`, `expense_recorded`), after the RPC call, in the same route, look up each recipient's `push_subscriptions` (only where their `user_preferences.push_notifications = true`) and send via `web-push`.
- **COUNCIL FIX (critical: collaborator_added has no Node context):** this trigger fires inside a DB function with no Node runtime, so its push leg needs an out-of-band dispatcher. **Simplest safe option: a Supabase Database Webhook on `notifications` INSERT → a new `POST /api/notifications/dispatch-push` route** that (a) verifies a shared secret/HMAC on the webhook payload before trusting it, (b) reads the inserted row, (c) sends push to that `user_id`'s subscriptions. If you build this webhook dispatcher, route ALL push sends through it (not just collaborator_added) so there's one send path instead of two — cleaner and it means the API routes just do the RPC insert. Document the webhook secret handling.
- **COUNCIL FIX (self-healing):** a `410 Gone` from the push service means the subscription is dead — delete that row. Swallow/log other send errors; never surface them to the actor.
- **COUNCIL FIX (suggestion): rate-limit the send path** so a compromised/stolen endpoint can't be spammed.

### B7. Phase B verification

- Chrome desktop: toggle push ON in Settings → permission prompt → grant → trigger each of the 2 API-route notifications from another account → real OS notification appears, clicking it opens the right page.
- `collaborator_added` push arrives via the webhook dispatcher when a co-host accepts an invite (first login).
- Deny permission → in-app still works, no errors, toggle shows the blocked state.
- Revoke permission in browser settings, trigger a notification → the dead subscription row gets deleted (check the table).
- Toggle OFF → subscription row deleted, no further push, in-app unaffected.
- Two accounts on the SAME browser/device: B subscribing does not steal A's row (the ownership-scoped upsert rejects it).
- Try POSTing a non-push-service `endpoint` (e.g. `http://localhost` or an internal IP) → rejected by the allowlist.

---

## Definition of done

- [ ] Phase A migration + `notify_recipients` RPC applied; both tables have `updated_at`.
- [ ] 3 real triggers fire; `invites_sent` type exists but is unwired.
- [ ] Bell dropdown ported to React with empty / loading / error states, click-to-navigate, poll guard (pause-on-hidden + hold-while-open).
- [ ] All 3 notification API routes have 404-on-mismatch ownership checks.
- [ ] Notifications scoped by `user_id` (cross-event), not by current event page.
- [ ] Phase A verified in-browser at 6 breakpoints, two-account test passes.
- [ ] Phase B: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (prefixed), service worker registered once from root layout.
- [ ] `push-subscription` route enforces the endpoint allowlist (SSRF) AND ownership-scoped upsert (hijack).
- [ ] `collaborator_added` push delivered via the secret-verified webhook dispatcher; 410 rows self-delete.
- [ ] Permission-denied shows a distinct blocked toggle state.
- [ ] `npm run test:run` + `npm run lint` clean (or no worse than baseline). `npx tsc` no new errors.
- [ ] Do NOT commit to `main`. Work on a branch off `Dev-Vibe`. Claude reviews before merge (the repo's review gate).

## Explicitly OUT of scope (do not build)
- Dedicated `/notifications` history page.
- Per-notification-type push toggles (single boolean stays).
- `email_alerts` / `sms_alerts` wiring.
- Vendor notifications.
- A2HS (Add to Home Screen) iOS install prompt — its own future spec. iOS Safari push simply won't work until then; that's expected, not a bug to fix here.
- Actually firing `invites_sent` — schema-ready only.
