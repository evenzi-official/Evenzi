# In-app collaborator invite accept — Collaborations tab + Bell

**Date:** 2026-08-07  
**Branch:** new feature branch off `feature/event-settings-cleanup` (or `Dev-Vibe` after cleanup merges) — **not** mixed into Event Settings Cleanup tasks.  
**Status:** PLAN — council reviewed; awaiting founder sign-off before build.  
**Prerequisite gate:** Commit Event Settings Cleanup remaining WIP first (Task 18 Usage tab + Portal full-screen overlay), then start this feature.

---

## Locked product decisions (founder, 2026-08-07)

| # | Decision |
|---|---|
| 1C | Accept UX in **both** places: Collaborations tab (primary) **and** notification bell (shortcut) |
| 2B | **Accept + Decline** |
| 3 | **Both channels on invite send:** Resend email **and** in-app bell notification **and** pending card on Collaborations |
| 4 | Invitee must already be logged in with the **same email** as the invite to see Collaborations/bell pending. Brand-new users with no account still use the email link (`/auth/accept-invite?token=…`) |
| 5A | After Accept from Collaborations (or bell), **stay on Collaborations** — pending card disappears and the event appears under active after refresh (no jump into `/events/[id]`) |
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
4. Accept → row becomes `active` + `user_id` linked; card disappears from pending and the event appears under active after refresh; owner still gets existing `collaborator_added` notify.
5. Decline → pending invite row deleted; related `collab_invite_received` notification marked read (not deleted).
6. Email accept path remains for users who are not logged in yet / have no account.

---

## Out of scope

- Push (browser) for invite — in-app bell + Collaborations only this pass (push can reuse the same notification row later if desired).
- Re-invite UX polish beyond “decline deletes so unique email index allows re-invite” plus superseding stale invite notifications on re-send.
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
       notify_user_by_email (DEFINER) — ONLY after verifying pending row
       type=collab_invite_received (hard-coded), link_path=null
       NOT _notify_event_recipients (fan-out helper — do not extend)

Invitee (logged in, matching email, email_confirmed_at set)
  ├─ GET Collaborations: list_my_pending_invites() + active collabs
  │     pending cards pinned above Active/Past filter → Accept / Decline
  ├─ Bell: collab_invite_received row → non-navigating shell + inline Accept / Decline
  └─ Accept / Decline entry points (server resolves token):
       A) POST /api/collaborators/invites/[collaboratorId]/accept|decline  (Collaborations card)
       B) POST /api/collaborators/invites/by-event/[eventId]/accept|decline (Bell — no token in UI)
     Both resolve pending row by (event_id, caller email, status=pending) server-side
     Accept → accept_event_invite(token) + mark collab_invite_received read
     Decline → decline_event_invite(token) + mark collab_invite_received read
```

### Why not reuse `_notify_event_recipients`?

That helper fans out to **event owner ∪ active collaborators minus actor**. The invitee is not in that set (pending, `user_id` null). Invite notify must target **one user looked up by email** via `notify_user_by_email`. **`collab_invite_received` must NOT be added to `_notify_event_recipients` or `notify_recipients` allowlists** — only the table-level CHECK is widened. Keeping fan-out allowlists unchanged prevents accidental misuse of the wrong notify path.

### Decline semantics (binding)

`event_collaborators.status` CHECK is currently `('pending','active')` only.

**DELETE on decline** (locked):

- `DELETE` the pending `event_collaborators` row (guards: `status='pending'`, email match, event not soft-deleted).
- **Do not DELETE notification rows** — authenticated users lack DELETE RLS on `notifications`. Instead, **UPDATE `notifications` SET `read_at = now()`** for unread `collab_invite_received` rows matching `(user_id, event_id)`.
- Clears the unique `(event_id, lower(invited_email))` slot so the owner can re-invite.

Alternative `status='declined'` is out of scope this pass.

### Accept cleanup (binding)

`accept_event_invite` must **best-effort mark `collab_invite_received` read** for `(auth.uid(), event_id)` — same cleanup helper used by decline. Do not DELETE notifications.

### Owner cancels pending invite (binding)

When an owner/co-host **DELETE**s a pending invite from the admins UI, the same shared SQL helper (or trigger) must **mark the invitee’s unread `collab_invite_received` read** for that `(user_id, event_id)`. Reuse the helper introduced for accept/decline — do not duplicate logic in the route only.

### Re-invite after decline (binding)

On a new invite send for the same `(event_id, email)` after a prior decline/delete, **supersede stale invite notifications**: mark any existing unread `collab_invite_received` for that `(user_id, event_id)` read before inserting the fresh row (or as part of `notify_user_by_email` pre-insert cleanup).

### Matching rule (email)

Case-insensitive trim match between `auth.users.email` and `event_collaborators.invited_email`, same as `accept_event_invite` today. **All list/accept/decline RPCs require `auth.users.email_confirmed_at IS NOT NULL`** — unconfirmed-email accounts cannot list, accept, or decline in-app invites. Phone-only invites stay email-link-only (no phone match this pass).

### Soft-deleted events (binding)

**Reject accept and decline** when the parent event has `deleted_at IS NOT NULL` (404 or 409 per mapping below). `list_my_pending_invites` already excludes soft-deleted events.

---

## Data / SQL changes

Apply on live project `smjkbmkxweevqpvygabe` via MCP `apply_migration`. Commit SQL under `docs/superpowers/plans/sql/`.

### Migration `collab_invite_01` — notification type + single-user notify helper

1. Widen `notifications.type` CHECK to include `'collab_invite_received'`.
2. **Do NOT** widen `_notify_event_recipients` / `notify_recipients` type allowlists. Table CHECK only.
3. Add `public.notify_user_by_email(...)` SECURITY DEFINER (`search_path = ''`):
   - Inputs: `p_event_id`, `p_actor_id`, `p_email`, `p_title`, `p_body` — **no `p_type` parameter**; type is **hard-coded** to `'collab_invite_received'`.
   - **Auth gate (only):** caller must be `auth.uid() = p_actor_id` **and** `can_write_event(p_event_id, p_actor_id, 'admins')`. No alternate “event owner OR …” shortcut — admins capability is the sole gate.
   - **Pre-insert guard (injection block):** require an existing `event_collaborators` row where `event_id = p_event_id`, `lower(trim(invited_email)) = lower(trim(p_email))`, and `status = 'pending'`. If no matching pending row → raise/return error; **do not insert a notification**.
   - Resolve invitee: `select id from auth.users where lower(email) = lower(trim(p_email))`.
   - If no user → no-op (return quietly; email path remains).
   - If user is the actor → no-op.
   - **Before insert:** supersede stale unread `collab_invite_received` for `(user_id, event_id)` (set `read_at`).
   - **Enforce lengths:** `p_title` and `p_body` must respect existing column limits (match current notify helpers — reject overlong strings).
   - **`link_path` must be `null`** — not configurable by caller; reject if a link_path argument were ever added.
   - Insert one `notifications` row for that user.
4. Add shared helper `mark_collab_invite_notifications_read(p_user_id uuid, p_event_id uuid)` — sets `read_at = now()` on unread `collab_invite_received` for that pair. Used by accept, decline, owner-delete, and re-invite supersede.
5. `revoke`/`grant` matching other notify RPCs (`authenticated` execute on the public wrapper; internal helper revoked from public/anon/authenticated).

### Migration `collab_invite_02` — list pending + decline + accept cleanup

1. `list_my_pending_invites()` → returns rows for `auth.uid()` where:
   - Caller has `email_confirmed_at IS NOT NULL`.
   - `status = 'pending'`
   - `lower(invited_email) = lower(auth.users.email for auth.uid())`
   - event `deleted_at IS NULL`  
   Columns: `id` (token / collaborator row id), `event_id`, `event_name`, `role`, `invited_at`, `owner_display_name` (join `events` → `user_profiles`).
2. `decline_event_invite(p_token uuid)` →:
   - Must be authenticated; `email_confirmed_at IS NOT NULL`.
   - Email must match `invited_email` (same guard as accept).
   - Status must be `pending`.
   - Parent event `deleted_at IS NULL` — else reject.
   - `DELETE` the collaborator row.
   - Best-effort: call `mark_collab_invite_notifications_read(auth.uid(), event_id)`.
3. **`accept_event_invite` (extend existing):** after successful accept, best-effort call `mark_collab_invite_notifications_read(auth.uid(), event_id)` — same helper as decline.
4. **Owner pending DELETE hook:** when a pending collaborator row is deleted by an authorized admin (existing admins DELETE path), invoke `mark_collab_invite_notifications_read` for the invitee user resolved by email (if user exists). Implement via shared helper called from the DELETE RPC/route or a `BEFORE/AFTER DELETE` trigger on `event_collaborators` where `status = 'pending'`.
5. Grants: `authenticated` only (not anon).

After migrations: `get_advisors` (security), regenerate `lib/supabase/database.types.ts`, update `DATA-MODEL.md` decision log + notifications / collaborators notes.

---

## App / API changes

| Area | Change |
|------|--------|
| `POST /api/events/[id]/admins` | After successful insert + email attempt: call `notify_user_by_email` (type implicit). Never fail the invite if notify fails. **Task note:** consider extracting an `inviteCollaborator` service from this route to keep notify + email + insert orchestration testable. |
| `POST /api/collaborators/invites/[collaboratorId]/accept` | Session-auth wrapper: load pending row by `collaboratorId`; verify caller email + pending + event not deleted; call `accept_event_invite(token)`. Returns `{ success, eventId }`. |
| `POST /api/collaborators/invites/[collaboratorId]/decline` | Same guards; call `decline_event_invite(token)`. |
| `POST /api/collaborators/invites/by-event/[eventId]/accept` | **Bell entry point.** Server resolves pending row: `(event_id from path, caller email, status=pending)` → token → `accept_event_invite`. No collaborator id required in the bell UI. |
| `POST /api/collaborators/invites/by-event/[eventId]/decline` | **Bell entry point.** Same server-side token resolution → `decline_event_invite`. |
| `app/home/page.tsx` | Also fetch `list_my_pending_invites()`; pass `pendingInvites` into `EventsGrid`. |
| `app/home/EventsGrid.tsx` | Collaborations tab: render **pending invite cards pinned above the Active/Past filter** — always visible at the top of the Collaborations tab whenever `pendingInvites.length > 0`, regardless of Active/Past selection. Accept / Decline on each card. Empty state only when both pending and active are empty. **After Accept/Decline: `router.refresh()` only; stay on Collaborations tab. Do not optimistically promote a pending card into an active `EventListItem` in client state.** |
| `NotificationBell.tsx` | For `collab_invite_received`: use a **non-navigating row shell** (no `link_path` navigation). Inline Accept / Decline buttons call the **by-event** API routes with `eventId` from the notification row. On success: refresh list + mark read. Icon: `mail` / `person_add`. |
| `lib/types/notifications.ts` | Add `'collab_invite_received'` to the union. |
| `/auth/accept-invite` | Keep as-is for email / logged-out path. Optionally after accept still `redirect('/home')` and deep-link Collaborations if easy (`?view=collaborations`) — nice-to-have, not required. |

### API error → HTTP status mapping (binding)

Map RPC / guard failures explicitly in Accept/Decline route handlers:

| Condition | HTTP |
|-----------|------|
| No session / unauthenticated | **401** |
| Authenticated but email does not match invite | **403** |
| `email_confirmed_at` is null | **403** |
| Pending row or event not found | **404** |
| Event soft-deleted (`deleted_at` set) | **404** |
| Row not pending (already active / gone) | **409** |
| Success | **200** `{ success, eventId? }` |

### UI notes (Collaborations pending card)

- One card per pending invite: event name, role pill, “Invited by {name}”, relative time optional.
- Primary: Accept. Secondary: Decline with **soft confirm** (`window.confirm` or small cautionary modal — Task note, default soft confirm).
- Do not use the same click-through as active event cards until accepted.
- Reuse existing clay-card / btn-pill primitives; no new parallel “invite card” design system fork if an event card + action row modifier works.

### Bell copy

- Title: owner display name (or “You’ve been invited”).
- Body: `Invited as {role} on {event name}`.
- Actions inline on a non-navigating row; declining/accepting must not navigate away. Collaborations stays the durable list.

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
Migrations per binding rules above: table CHECK only (no fan-out allowlist change), `notify_user_by_email` with pending-row guard + hard-coded type + `link_path=null`, shared `mark_collab_invite_notifications_read`, list/decline/accept cleanup, owner-delete hook, email_confirmed + deleted_at guards. Advisors, types, DATA-MODEL.

### Task 2 — Invite send wires notify
`POST .../admins` calls `notify_user_by_email` after insert. **Note:** optional refactor — extract `inviteCollaborator` service from the admins route.

### Task 3 — Accept / Decline API routes
Both entry points (`[collaboratorId]` and `by-event/[eventId]`); explicit 401/403/404/409 mapping; tests for wrong-email, unconfirmed email, soft-deleted event, already-active, not-found.

### Task 4 — Collaborations pending UI
`page.tsx` + `EventsGrid`: pending cards pinned above Active/Past filter; Accept/Decline with soft confirm on Decline; **`router.refresh()` after action — no optimistic promote**; stay on tab.

### Task 5 — Bell Accept / Decline
`NotificationBell`: non-navigating row shell; inline actions → by-event routes; refresh on success.

### Task 6 — Live two-account verify + commit
Account A invites Account B (existing email). B sees bell + Collaborations pending without opening email. Accept stays on Collaborations; event appears under active after refresh. Decline path with re-invite clears stale notifs. Email still arrives when Resend is configured. Email link still works for logged-out B. Owner delete of pending invite clears B’s bell row (read).

---

## Test plan

| Case | Expected |
|------|----------|
| Invite existing user B | Email (if Resend) + B bell unread + B Collaborations pending card |
| Invite email with no Evenzi account | Pending row + email only; no notification insert |
| Notify without pending row (API abuse) | `notify_user_by_email` rejects; no notification inserted |
| B Accept from Collaborations (`[collaboratorId]`) | Active collab after refresh; pending gone; invite notif read; A gets `collaborator_added`; stay on Collaborations |
| B Accept from bell (`by-event/[eventId]`) | Same data outcome; server resolved token; panel refreshes |
| B Decline | Pending row deleted; notif `read_at` set (not deleted); can be re-invited |
| Re-invite after decline | New pending row + new notif; old unread invite notif superseded (read) |
| B wrong account email | **403**; no status change |
| B unconfirmed email | **403** on list/accept/decline |
| Soft-deleted event | **404** on accept/decline; excluded from list |
| Already active / missing pending | **409** |
| Owner deletes pending invite | Invitee’s `collab_invite_received` marked read |
| Logged-out B opens email link | Existing accept-invite flow unchanged |
| Collaborations empty | Copy only when pending=[] and active=[] |
| Active/Past filter on Collaborations | Pending cards remain visible above filter |

---

## Risks / notes

- **Invitee must exist as a user** for bell + Collaborations pending — by design (decision 4). Copy in owner toast can stay “Invite sent”; do not claim “they’ll see it in-app” if we didn’t find a user (optional later: toast “Email sent — they’ll see it in Evenzi if they already have an account”).
- **RLS**: never open pending rows to broad SELECT; keep DEFINER list/decline RPCs. Never DELETE notifications from client-facing paths — UPDATE `read_at` only.
- **Idempotency**: double-click Accept — `accept_event_invite` already returns event id when already `active`.
- **Security**: decline/accept must re-check email match server-side; never trust client “I’m the invitee” alone. Bell routes must not accept a client-supplied token — resolve server-side from `(event_id, email, pending)`.
- **`notify_user_by_email` is invite-only**: hard-coded type + pending-row prerequisite blocks notification injection for arbitrary events.
- Part of the parked push-notifications enhancement backlog item 1 — this plan supersedes that backlog entry for product scope (adds Collaborations surface + Decline).

---

## Sign-off

Approve this plan to proceed **after** the Usage + Portal commit, on a dedicated feature branch.

Locked defaults (unchanged):

1. Decline = **DELETE** pending row (not `declined` status); notifications **read**, not deleted.
2. Soft confirm before Decline (Task note — implement unless founder overrides at build).
3. Invite notification `link_path = null` (actions in-bell / Collaborations only).

---

## Council Review

**Date:** 2026-08-07  
**Verdict:** **ADDRESS-THEN-PROCEED**  
**Mode:** Plan checkpoint (pre-implementation)

Council reviewed auth boundaries, notification injection surface, RLS constraints, and dual entry-point UX. All CRITICAL and IMPORTANT findings are **folded into the plan sections above as binding requirements** — not advisory notes. Implementation must conform to those sections.

### CRITICAL rulings (incorporated)

| # | Finding | Resolution in plan |
|---|---------|-------------------|
| C1 | `notify_user_by_email` could insert notifications without a real pending invite | Pending-row prerequisite before insert; type hard-coded `collab_invite_received`; auth **only** via `can_write_event(..., 'admins')`; title/body length enforced; `link_path` forced null |
| C2 | Widening fan-out allowlists invites misuse | Table CHECK widened **only** — `_notify_event_recipients` / `notify_recipients` allowlists **unchanged** |
| C3 | Bell UI should not handle raw tokens | Documented dual entry points: `[collaboratorId]` (Collaborations) and `by-event/[eventId]` (Bell); server resolves token from `(event_id, caller email, pending)` |
| C4 | Accept left invite notifications unread | `accept_event_invite` extended to call shared read helper — same as decline |
| C5 | Decline must not DELETE notifications (no DELETE RLS) | Decline DELETEs pending collab row only; notifications updated via `read_at` |

### IMPORTANT rulings (incorporated)

| # | Finding | Resolution in plan |
|---|---------|-------------------|
| I6 | Owner cancel leaves stale bell row | Owner pending DELETE clears invitee notification via shared helper/trigger |
| I7 | Unconfirmed emails could accept in-app | `email_confirmed_at IS NOT NULL` required in list/accept/decline |
| I8 | Soft-deleted events | Reject accept/decline; exclude from list |
| I9 | Pending cards hidden by Active/Past filter | Pending section pinned above filter on Collaborations tab |
| I10 | Optimistic promote caused stale UI | `router.refresh()` only after Accept/Decline on Collaborations |
| I11 | Bell row navigated away on click | Non-navigating row shell with inline actions |
| I12 | Ambiguous API errors | Explicit 401/403/404/409 mapping table |
| I13 | Re-invite duplicated stale notifs | Supersede on re-send before insert |
| I14 | Route bloat / mis-tap decline | Task notes: soft confirm on Decline; optional `inviteCollaborator` service extraction |

### Founder locked decisions

All founder decisions (1C, 2B, 3, 4, 5A, 6) remain intact. Gate 0 and task order unchanged.

**Proceed to build** once founder signs off, implementing the binding rules above.
