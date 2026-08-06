# In-app collaborator invite accept — Collaborations tab + Bell

**Date:** 2026-08-07  
**Branch:** new feature branch off `feature/event-settings-cleanup` (or `Dev-Vibe` after cleanup merges) — **not** mixed into Event Settings Cleanup tasks.  
**Status:** PLAN — awaiting founder sign-off before build.  
**Prerequisite gate:** Commit Event Settings Cleanup remaining WIP first (Task 18 Usage tab + Portal full-screen overlay), then start this feature.

---

## Locked product decisions (founder, 2026-08-07)

| # | Decision |
|---|---|
| 1C | Accept UX in **both** places: Collaborations tab (primary) **and** notification bell (shortcut) |
| 2B | **Accept + Decline** |
| 3 | **Both channels on invite send:** Resend email **and** in-app bell notification **and** pending card on Collaborations |
| 4 | Invitee must already be logged in with the **same email** as the invite to see Collaborations/bell pending. Brand-new users with no account still use the email link (`/auth/accept-invite?token=…`) |
| 5A | After Accept from Collaborations (or bell), **stay on Collaborations** — pending card becomes a normal active collab event card (no jump into `/events/[id]`) |
| 6 | Own feature **after** Usage commit — not part of Event Settings Cleanup |

---

## Problem today

1. Invite creates `event_collaborators` with `status='pending'`, `user_id=null`, and (when `RESEND_API_KEY` is set) emails `/auth/accept-invite?token=<row id>`.
2. Home → Collaborations only queries `status='active'` + `user_id = me` — pending invites never appear.
3. Pending rows are invisible to invitees under RLS (`user_id` is null; self-select policy never matches). Accept only works via DEFINER RPCs `get_pending_invite` / `accept_event_invite`.
4. Bell has no `collab_invite_received` type. `collaborator_added` fires to the **owner/team after accept**, not to the invitee on send.
5. Without Resend configured locally, invite still saves but no email goes out (dev already hit this).

---

## Goal

When an owner/co-host invites `someone@email.com`:

1. **Email** still goes out (best-effort; same as today).
2. If that email already belongs to an Evenzi user, they get a **bell notification** with Accept / Decline.
3. When that user is logged in, Home → **Collaborations** shows a **pending invite card** with Accept / Decline (event name, role, inviter).
4. Accept → row becomes `active` + `user_id` linked; card flips to a normal collaboration event; owner still gets existing `collaborator_added` notify.
5. Decline → pending invite removed (see § Decline semantics); notification marked handled / removed.
6. Email accept path remains for users who are not logged in yet / have no account.

---

## Out of scope

- Push (browser) for invite — in-app bell + Collaborations only this pass (push can reuse the same notification row later if desired).
- Re-invite UX polish beyond “decline deletes so unique email index allows re-invite”.
- Changing role matrix / RLS capabilities.
- Finishing Event Settings Usage / Portal (prerequisite commit only).
- “Bell invite” as the *only* surface (rejected — 1C).

---

## Architecture

```
Owner POST /api/events/[id]/admins
  ├─ insert event_collaborators (pending, invited_email, role)     [exists]
  ├─ send Resend email with accept-invite URL                      [exists]
  └─ if auth.users has matching email:
       insert notifications row type=collab_invite_received
       for that user_id (direct insert via DEFINER helper —
       NOT _notify_event_recipients, which fans out to owner/team)

Invitee (logged in, matching email)
  ├─ GET Collaborations: list_my_pending_invites() + active collabs
  │     pending cards → Accept / Decline
  ├─ Bell: collab_invite_received row → Accept / Decline actions
  └─ Accept → accept_event_invite(token)  [exists]
     Decline → decline_event_invite(token) [new]
```

### Why not reuse `_notify_event_recipients`?

That helper fans out to **event owner ∪ active collaborators minus actor**. The invitee is not in that set (pending, `user_id` null). Invite notify must target **one user looked up by email**.

### Decline semantics

`event_collaborators.status` CHECK is currently `('pending','active')` only.

**Choose DELETE on decline** (recommended):

- Removes the pending row.
- Clears the unique `(event_id, lower(invited_email))` slot so the owner can re-invite.
- Mark related `collab_invite_received` notifications read (or delete them) for that user+event.

Alternative `status='declined'` would need a CHECK migration + unique-index exception — more moving parts for no UX win this pass.

### Matching rule (email)

Case-insensitive trim match between `auth.users.email` and `event_collaborators.invited_email`, same as `accept_event_invite` today. Phone-only invites stay email-link-only (no phone match this pass).

---

## Data / SQL changes

Apply on live project `smjkbmkxweevqpvygabe` via MCP `apply_migration`. Commit SQL under `docs/superpowers/plans/sql/`.

### Migration `collab_invite_01` — notification type + single-user notify helper

1. Widen `notifications.type` CHECK to include `'collab_invite_received'`.
2. Widen `_notify_event_recipients` / `notify_recipients` type allowlists the same way (keep them consistent even though invite send won’t use the fan-out path).
3. Add `public.notify_user_by_email(...)` SECURITY DEFINER (`search_path = ''`):
   - Inputs: `p_event_id`, `p_actor_id`, `p_email`, `p_type`, `p_title`, `p_body`, `p_link_path` (nullable).
   - Auth: caller must be `auth.uid() = p_actor_id` and owner/active-collab with `'admins'` write capability (or reuse existing “allowed to invite” check: event owner or `can_write_event(...,'admins')`).
   - Resolve invitee: `select id from auth.users where lower(email) = lower(trim(p_email))`.
   - If no user → no-op (return quietly; email path remains).
   - If user is the actor → no-op.
   - Insert one `notifications` row for that user.
   - `link_path`: allow `null`, or `/home` (extend the existing `^/events/...` regex **or** store `null` and let the bell key off `type` — prefer **`link_path = null`** for invite rows so Accept UI doesn’t navigate away; Collaborations is the destination after accept stays put).
4. `revoke`/`grant` matching other notify RPCs (`authenticated` execute on the public wrapper; internal helper revoked from public/anon/authenticated).

### Migration `collab_invite_02` — list pending + decline

1. `list_my_pending_invites()` → returns rows for `auth.uid()` where:
   - `status = 'pending'`
   - `lower(invited_email) = lower(auth.users.email for auth.uid())`
   - event not soft-deleted  
   Columns: `id` (token), `event_id`, `event_name`, `role`, `invited_at`, `owner_display_name` (join `events` → `user_profiles`).
2. `decline_event_invite(p_token uuid)` →:
   - Must be authenticated.
   - Email must match invited_email (same guard as accept).
   - Status must be `pending`.
   - `DELETE` the collaborator row.
   - Best-effort: mark/delete invitee’s unread `collab_invite_received` for that `event_id`.
3. Grants: `authenticated` only (not anon).

After migrations: `get_advisors` (security), regenerate `lib/supabase/database.types.ts`, update `DATA-MODEL.md` decision log + notifications / collaborators notes.

---

## App / API changes

| Area | Change |
|------|--------|
| `POST /api/events/[id]/admins` | After successful insert + email attempt: call `notify_user_by_email` with type `collab_invite_received`, title/body like “{Owner} invited you as {Role} on {Event}”. Never fail the invite if notify fails. |
| `POST /api/collaborators/invites/[id]/accept` | Thin wrapper around `accept_event_invite` for bell/Collaborations buttons (cookie session). Returns `{ success, eventId }`. |
| `POST /api/collaborators/invites/[id]/decline` | Wrapper around `decline_event_invite`. |
| `app/home/page.tsx` | Also fetch `list_my_pending_invites()`; pass `pendingInvites` into `EventsGrid`. |
| `app/home/EventsGrid.tsx` | Collaborations tab: render **pending invite cards** above active collab events (Accept / Decline). Empty state only when both pending and active are empty. On Accept success: drop from pending, add to active list (or `router.refresh()`). Stay on Collaborations (`5A`). |
| `NotificationBell.tsx` | For `collab_invite_received`: show Accept / Decline; stop treating click as “navigate via link_path”. On success: refresh list + mark read. Icon: `mail` / `person_add`. |
| `lib/types/notifications.ts` | Add `'collab_invite_received'` to the union. |
| `/auth/accept-invite` | Keep as-is for email / logged-out path. Optionally after accept still `redirect('/home')` and deep-link Collaborations if easy (`?view=collaborations`) — nice-to-have, not required. |

### UI notes (Collaborations pending card)

- One card per pending invite: event name, role pill, “Invited by {name}”, relative time optional.
- Primary: Accept. Secondary: Decline (confirm? — soft confirm via `window.confirm` or small cautionary modal; prefer small confirm to avoid mis-taps).
- Do not use the same click-through as active event cards until accepted.
- Reuse existing clay-card / btn-pill primitives; no new parallel “invite card” design system fork if an event card + action row modifier works.

### Bell copy

- Title: owner display name (or “You’ve been invited”).
- Body: `Invited as {role} on {event name}`.
- Actions inline; declining/accepting should not require opening Collaborations, but Collaborations stays the durable list.

---

## Resend / local email

This feature does **not** replace email. For local verification of “both channels”:

1. Set `RESEND_API_KEY` (+ optional `RESEND_FROM_EMAIL`) in `.env.local` and restart, **or**
2. Accept that local may only exercise bell + Collaborations when inviting an existing second account; use the logged Accept URL from server logs when Resend is unset.

Prod/preview already need Resend for real email (pre-existing).

---

## Task breakdown (build order)

### Gate 0 — before this feature
1. Commit Usage tab + Portal overlay on `feature/event-settings-cleanup`.
2. Optionally merge/push cleanup as usual; cut `feature/collab-invite-in-app` from the tip that includes notifications + cleanup.

### Task 1 — SQL `collab_invite_01` + `02`
Migrations, advisors, types, DATA-MODEL.

### Task 2 — Invite send wires notify
`POST .../admins` calls `notify_user_by_email` after insert.

### Task 3 — Accept / Decline API routes
Session-auth wrappers around RPCs; tests for wrong-email / already-active / not-found.

### Task 4 — Collaborations pending UI
`page.tsx` + `EventsGrid` pending cards; Accept/Decline; stay on tab.

### Task 5 — Bell Accept / Decline
`NotificationBell` special-case `collab_invite_received`.

### Task 6 — Live two-account verify + commit
Account A invites Account B (existing email). B sees bell + Collaborations pending without opening email. Accept stays on Collaborations; event appears under active. Decline path with a second invite. Email still arrives when Resend is configured. Email link still works for logged-out B.

---

## Test plan

| Case | Expected |
|------|----------|
| Invite existing user B | Email (if Resend) + B bell unread + B Collaborations pending card |
| Invite email with no Evenzi account | Pending row + email only; no notification insert |
| B Accept from Collaborations | Active collab card; pending gone; A gets `collaborator_added`; stay on Collaborations |
| B Accept from bell | Same data outcome; panel refreshes |
| B Decline | Pending gone; can be re-invited; notif cleared/read |
| B wrong account email | Accept/Decline APIs 403/400; no status change |
| Logged-out B opens email link | Existing accept-invite flow unchanged |
| Collaborations empty | Copy only when pending=[] and active=[] |

---

## Risks / notes

- **Invitee must exist as a user** for bell + Collaborations pending — by design (decision 4). Copy in owner toast can stay “Invite sent”; do not claim “they’ll see it in-app” if we didn’t find a user (optional later: toast “Email sent — they’ll see it in Evenzi if they already have an account”).
- **RLS**: never open pending rows to broad SELECT; keep DEFINER list/decline RPCs.
- **Idempotency**: double-click Accept — `accept_event_invite` already returns event id when already `active`.
- **Security**: decline/accept must re-check email match server-side; never trust client “I’m the invitee” alone.
- Part of the parked push-notifications enhancement backlog item 1 — this plan supersedes that backlog entry for product scope (adds Collaborations surface + Decline).

---

## Sign-off

Approve this plan to proceed **after** the Usage + Portal commit, on a dedicated feature branch.

Open nits (defaults assumed if you say “ship it”):

1. Decline = **DELETE** pending row (not `declined` status).
2. Soft confirm before Decline.
3. Invite notification `link_path = null` (actions in-bell / Collaborations only).
