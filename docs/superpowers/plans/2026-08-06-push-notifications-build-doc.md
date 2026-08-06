# Push Notifications — Cursor Build Doc (Amended)

> **For:** Cursor (auto mode). **Author:** Claude (planning) + Abhijith. **Amended:** 2026-08-06 evening after repo audit + council (ADDRESS-THEN-PROCEED). **Founder signed off:** 2026-08-06.
> **Source spec:** `docs/superpowers/specs/2026-08-06-push-notifications-design.md` (historical; this amended build-doc is the executable source of truth where they conflict).
> **Phases:** Build and verify Phase A fully before Phase B. Branch: `feature/push-notifications` off `Dev-Vibe`. Claude reviews before merge. Do NOT commit to `main`.

This doc is self-contained. Follow it exactly.

---

## 0. Amendments vs original build-doc (2026-08-06)

| Superseded | Now |
|------------|-----|
| Collab hook in `link_pending_collaborators()` | Wire after `app/auth/accept-invite/page.tsx` UPDATE; same call when `link_pending_collaborators` ships later |
| Remove S8 “View all” footer | Keep footer; inert `<button>` (no `href="#"`) |
| `notify_recipients` without caller auth; `search_path = public` | Hardened DEFINER (below) |
| Dual push send (inline + webhook) | Webhook-only for all push |
| Local migration SQL files | Supabase MCP `apply_migration` + `get_advisors` + regen types + DATA-MODEL/ERD |
| Host PATCH RSVP only | Also guest RSVP inside `submit_rsvp` plpgsql |
| Pre-seed large type CHECK | Four types only; future types = one migration at wire time |

---

## 0b. Context

- Dead bell: `components/layout/FloatingNav.tsx` — no `onClick`; `notificationCount={1}` only in `app/events/[id]/layout.tsx:38`.
- Settings toggle: `app/settings/NotificationsSection.tsx` — persists `push_notifications` only.
- **UI source:** `designs/components.html` S8 = visual/layout/copy/icons canonical. `designs/shared/shell.js` ~176–286 = behavior (portal, position, outside/Esc/scroll-close). CSS already global via `app/globals.css` → `shell.css` — **do not fork**.
- Conventions: `docs/data-model/DATA-MODEL.md`. Owner = `events.user_id`; co-hosts = `event_collaborators` status `active`; owner is not a collab row.
- Notifications scoped by **recipient `user_id`**, not current event page.
- Ownership helper pattern: `lib/media/ownership.ts` `assertEventOwnership` — reuse/adapt where routes need event-scoped checks; notification list routes are user-scoped (404 if row not owned).

---

## PHASE A — In-app notifications

### A1. Migration — via Supabase MCP

**Name:** `notifications_01_table_and_rpc`  
**Method:** Supabase MCP `apply_migration` on project `smjkbmkxweevqpvygabe`. Then `get_advisors` (security). Regen `lib/supabase/database.types.ts`. Update `DATA-MODEL.md` + `ERD.md`.

```sql
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  type text not null check (type in ('rsvp_received','collaborator_added','expense_recorded','invites_sent')),
  title text not null,
  body text not null,
  link_path text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_notifications_user_recent on public.notifications(user_id, created_at desc);
create index idx_notifications_user_unread on public.notifications(user_id) where read_at is null;
alter table public.notifications enable row level security;

create policy notifications_select_own on public.notifications
  for select using (user_id = (select auth.uid()));
create policy notifications_update_own on public.notifications
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- No INSERT policy for clients — inserts only via DEFINER paths below.

create trigger trg_notifications_updated_at before update on public.notifications
  for each row execute function public.set_updated_at();
```

### A2. Insert paths — hardened

#### A2a. Internal helper (not client-callable)

Used by `submit_rsvp` (and any future DB-origin triggers). Inserts for owner + active collabs, optionally excluding an actor.

```sql
create or replace function public._notify_event_recipients(
  p_event_id uuid,
  p_actor_id uuid,          -- null = exclude nobody (guest / system)
  p_type text,
  p_title text,
  p_body text,
  p_link_path text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_type is distinct from all (array['rsvp_received','collaborator_added','expense_recorded','invites_sent']) then
    raise exception 'invalid notification type';
  end if;
  if p_link_path is not null and p_link_path !~ '^/events/[0-9a-f-]{36}(/[a-zA-Z0-9/_-]*)?$' then
    raise exception 'invalid link_path';
  end if;
  if char_length(p_title) > 200 or char_length(p_body) > 500 then
    raise exception 'title/body too long';
  end if;
  -- soft-deleted events: no notify
  if not exists (
    select 1 from public.events e
    where e.id = p_event_id and e.deleted_at is null
  ) then
    return;
  end if;

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

revoke all on function public._notify_event_recipients(uuid,uuid,text,text,text,text) from public, anon, authenticated;
-- executable only by postgres / other DEFINER functions
```

#### A2b. Authenticated RPC (host / co-host call sites)

```sql
create or replace function public.notify_recipients(
  p_event_id uuid,
  p_actor_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_link_path text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is distinct from p_actor_id then
    raise exception 'actor mismatch';
  end if;
  if not exists (
    select 1 from public.events e
    where e.id = p_event_id and e.deleted_at is null
      and (
        e.user_id = (select auth.uid())
        or exists (
          select 1 from public.event_collaborators c
          where c.event_id = p_event_id and c.user_id = (select auth.uid()) and c.status = 'active'
        )
      )
  ) then
    raise exception 'not allowed';
  end if;
  perform public._notify_event_recipients(p_event_id, p_actor_id, p_type, p_title, p_body, p_link_path);
end;
$$;

revoke all on function public.notify_recipients(uuid,uuid,text,text,text,text) from public, anon, authenticated;
grant execute on function public.notify_recipients(uuid,uuid,text,text,text,text) to authenticated;
```

App helper: `lib/notifications/notify.ts` — `notifyRecipientsSafe({...})` wraps `supabase.rpc('notify_recipients', …)` in try/catch, logs, never throws.

### A3. Wire live triggers

| Type | Where | Notes |
|------|-------|-------|
| `rsvp_received` | `app/api/events/[id]/guests/[guestId]/route.ts` PATCH | Pre-read `rsvp_status_id` + `name`; fire only when status **changes**. Actor = session user. `link_path` = `/events/{id}/guests`. Copy (S8 pattern): title = guest name; body = `confirmed for {event or Reception}` / status label. |
| `rsvp_received` | Inside `public.submit_rsvp` after successful UPDATE | Call `_notify_event_recipients(..., p_actor_id := null, ...)`. Title/body from guest name + sub-event. Migration `notifications_02_submit_rsvp_notify` amends the live function. |
| `expense_recorded` | `app/api/events/[id]/planning/expenses/route.ts` POST | After insert; join type label if needed. `link_path` = `/events/{id}/planning`. |
| `collaborator_added` | `app/auth/accept-invite/page.tsx` after successful UPDATE to `active` | Actor = joiner `user.id`. `link_path` = `/events/{id}/settings/admins`. Title/body: display_name from `user_profiles` + event name. Must not block redirect on notify failure. |
| `collaborator_added` | Future: `link_pending_collaborators` / settings collab | **Document only** — when that ships, call `_notify_event_recipients` or `notify_recipients` the same way. Do not extract accept into a new DB fn this pass. |
| `invites_sent` | — | Schema only. No fake fires. |

### A4. `NotificationBell` (S8 → React)

**File:** `components/layout/NotificationBell.tsx` — replace dead bell in `FloatingNav`. Remove `notificationCount` prop from `FloatingNavProps` and all call sites.

**Visual:** `components.html` S8 classes (`.fn-notif-*`). Icons: `rsvp_received`→`how_to_reg`, `collaborator_added`→`person_add`, `expense_recorded`→`payments`, `invites_sent`→`forward_to_inbox`, fallback→`notifications`.

**Copy render:** `<strong>{title}</strong>{body ? ` — ${body}` : ''}` (S8 subject-bold pattern).

**Behavior (shell.js):** `createPortal` to `document.body`; position from bell `getBoundingClientRect` (`bottom+8`, right clamp 12px); click-outside, Escape, scroll-close, resize reposition; SSR-safe (portal after mount).

**Footer:** Keep “View all” visually; `<button type="button" class="fn-notif-view-all" aria-disabled="true">` — no navigation.

**States:** empty (`notifications_off` + “No notifications yet”); loading (2–3 `.skeleton` rows); error + Retry. Annotate briefly in `designs/components.html` S8 (no full static prototype required).

**A11y:** panel `role="dialog"` + `aria-labelledby`; rows focusable (`<button>` or link); Enter/Space; restore focus to bell on close; unread `sr-only`.

**Poll:** fetch on mount; refetch on open; skip 60s tick while open; pause when `document.hidden`.

**CSS:** add `line-clamp: 2` to `.fn-notif-text` in `shell.css`. Relative time: small client util with `Intl.RelativeTimeFormat` on `created_at`.

**Types:** `lib/types/notifications.ts` → `AppNotification`.

### A5. API routes

- `GET /api/notifications?limit=20` — session required; rows for `auth.uid()`; `{ notifications, unreadCount }`.
- `PATCH /api/notifications/[id]` — set `read_at`; **404** if not caller’s row.
- `POST /api/notifications/mark-all-read` — bulk unread for caller; optimistic badge sync on client.

### A6. FloatingNav

Swap bell for `<NotificationBell />`. Drop hardcoded count.

### A7. Phase A verify (founder — hard stop before Phase B)

Two accounts; RSVP (host + guest if possible); expense; accept-invite; mark read / mark all; empty state; 6 breakpoints; `npm run test:run` + lint + `tsc` clean (or no worse than baseline).

---

## PHASE B — Browser push (only after Phase A verified)

### B1. Migration `notifications_03_push_subscriptions`

Same MCP flow. Table + RLS `FOR ALL` own rows + `updated_at` trigger (as original B1). Also:

```sql
create table public.push_dispatch_log (
  notification_id uuid primary key references public.notifications(id) on delete cascade,
  dispatched_at timestamptz not null default now()
);
-- RLS: no client policies (service/DEFINER only)
```

### B2. Env

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (must be `NEXT_PUBLIC_`)
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT=mailto:hello@evenzii.com` (or founder mailbox)
- `NOTIFICATIONS_WEBHOOK_SECRET` (random; fail-closed if missing on dispatch)
- Add to `.env.local` + Vercel Production + Preview
- `npm install web-push` (+ types)

### B3. Service worker

`public/sw.js` — push → Notification; click → open `link_path` only if same-origin relative path matching A2 allowlist. Register once from client component in `app/layout.tsx` (not FloatingNav).

### B4. Settings toggle

ON: permission → subscribe → POST subscription → only then PATCH `push_notifications=true`. OFF: unsubscribe + DELETE + PATCH false. If `Notification.permission === 'denied'`: blocked UI state.

### B5. `POST`/`DELETE /api/notifications/push-subscription`

- SSRF: parse `URL`; require `https:`; reject IP literals; hostname equals or ends with `.fcm.googleapis.com` / `.push.services.mozilla.com` / `.push.apple.com` / `.notify.windows.com`.
- Upsert: on `endpoint` conflict, update only if `user_id = auth.uid()`; else **409**.
- DELETE: filter `endpoint` AND `user_id = auth.uid()`.
- Validate base64url `p256dh`/`auth`; cap 10 subs per user.
- Unit tests for allowlist + hijack cases.

### B6. Single push path

**Only:** `notifications` INSERT → Supabase Database Webhook → `POST /api/notifications/dispatch-push`.

- Verify `x-evenzi-webhook-signature` = HMAC-SHA256(rawBody, `NOTIFICATIONS_WEBHOOK_SECRET`) hex via `timingSafeEqual`. **401/503 if secret unset.**
- Idempotent: insert into `push_dispatch_log`; if conflict, return 200 no-op.
- Resolve targets via `get_push_delivery_targets(p_user_id)` SECURITY DEFINER (subscriptions where `user_preferences.push_notifications = true`). Revoke from `public, anon, authenticated`; grant to `service_role` only; dispatch route uses service role **only** to call this RPC.
- Send via `web-push`; **410** → delete subscription row; swallow other errors.
- Rate-limit dispatch (simple in-memory or edge: e.g. 60/min/IP).
- **No** inline `web-push` from RSVP/expense routes.

**Founder ops:** Dashboard → Database Webhooks → table `notifications` INSERT → prod URL `https://evenzi.vercel.app/api/notifications/dispatch-push` (+ preview/local via tunnel / `host.docker.internal` as needed). Document in CLAUDE.md env block.

### B7. Phase B verify

Chrome grant/deny; OS notification; collab via webhook; 410 cleanup; toggle off; shared-device 409; SSRF reject localhost endpoint.

---

## Future types appendix (not in initial CHECK)

When each feature ships: one migration adding the CHECK value + one notify call. Candidates (from platform scan): `website_status_changed`, `guests_imported`, `media_uploaded`, `task_completed`, `event_deleted`, `event_details_updated`, … Vendor types: later (no vendor entity).

### Enhancement backlog (founder, 2026-08-06 — plan later, not this branch)

1. **In-bell collab invite** — On Add co-host, notify the invitee (`collab_invite_received` or similar) with Accept/Decline in the S8 dropdown (today: email/link only; `collaborator_added` fires to owner *after* accept).
2. **Collaborator event access** — Active co-hosts still 404 on `/events/[id]` because events + child RLS are owner-only (`can_access_event` still [PLANNED]). Also wire Home → Collaborations (today hardcoded empty). Accept-invite temporarily redirects to `/home` until this lands.

---

## Definition of done

- [ ] Phase A migration + hardened RPC + `_notify_event_recipients` + `submit_rsvp` notify amend applied; advisors clean; types + DATA-MODEL updated
- [ ] 3 live triggers + `invites_sent` schema-only; collab via accept-invite; hook note for future `link_pending`
- [ ] S8 bell with empty/loading/error, inert View all button, poll guards, click-to-navigate
- [ ] Notification API routes 404-on-mismatch
- [ ] Phase A founder two-account verify
- [ ] Phase B: VAPID `NEXT_PUBLIC_`, SW once, SSRF + hijack, webhook HMAC + idempotency, 410 self-delete, blocked toggle state
- [ ] `npm run test:run` + lint + `tsc` clean (or no worse than baseline)
- [ ] Branch off `Dev-Vibe`; Claude review before merge; never `main`

## Out of scope

Dedicated `/notifications` page, per-type toggles, email/SMS, A2HS, vendor notifs, firing `invites_sent`, rebuilding collaboration UI.
