# W2 — API surface + Vitest + authz spot-check

> Stage 1 platform truth audit · **AUDIT ONLY** · 2026-08-07  
> Agents: `backend_engineer` + `security_expert`  
> Scope: enumerate `app/api/**/route.ts`, test coverage cross-check, IDOR/authz spot-check, collab invite matrix.

## Verdict

**70** API route files. App-layer write authz is largely standardized on `requireEventWrite` / `requireEventRead` (`lib/auth/eventAccess.ts`). `verifyOwnership` is **gone from live routes** (docs-only legacy). Residual risk concentrates on: (1) public / service-role paths, (2) one event-scoped route with **no app authz** and **RLS that is owner-only for writes**, (3) password-gate bypass on guest lookup, (4) Vitest suite heavily red (mock drift).

`npm run test:run` (2026-08-07): **139 passed / 52 failed** across **24** files (13 failed / 11 passed).

---

## 1. Route inventory (70)

### Public / anon guest website — `app/api/e/[slug]/**` (5)

| Route | Methods | Auth model |
|-------|---------|------------|
| `e/[slug]/route.ts` | GET | Anon RPC `get_public_website_payload` |
| `e/[slug]/verify-password/route.ts` | POST | Anon RPC `verify_website_password` → sets `evz_site_pw` cookie |
| `e/[slug]/lookup/route.ts` | POST | Anon RPC `resolve_guest_by_lookup` → sets guest session cookie |
| `e/[slug]/guest/route.ts` | GET | Guest cookie → `resolve_guest_session` + `get_guest_website_payload` |
| `e/[slug]/rsvp/route.ts` | POST | Guest cookie → `submit_rsvp` |

### Collab invites — `app/api/collaborators/invites/**` (4)

| Route | Methods | Auth |
|-------|---------|------|
| `[collaboratorId]/accept` | POST | Session + RPC `accept_event_invite(p_token)` |
| `[collaboratorId]/decline` | POST | Session + RPC `decline_event_invite` |
| `by-event/[eventId]/accept` | POST | Session + `list_my_pending_invites` → accept |
| `by-event/[eventId]/decline` | POST | Session + list → decline |

**No** dedicated HTTP “list pending invites” route — UI calls RPC `list_my_pending_invites` from server components (`app/home/page.tsx`).

### Event-scoped — `app/api/events/**` (52)

| Area | Routes (count) | Typical guard |
|------|----------------|---------------|
| Core CRUD | `events/route.ts`, `events/[id]/route.ts`, `events/cover` (3) | Session; `[id]` PUT/DELETE → `requireEventWrite`; GET → session + RLS |
| Admins / collab mgmt | `admins`, `admins/[collaboratorId]` (2) | `requireEventWrite(..., 'admins')` |
| Guests | `guests`, `[guestId]`, `bulk`, `import`, `guest-tags`, `[tagId]`, `guest-settings` (7) | `requireEventWrite(..., 'guests')` |
| Planning | `tasks`, `[taskId]`, `tasks/bulk`, `expenses`, `[expenseId]`, `expense-types`, `budget` (7) | `requireEventWrite(..., 'planning')` |
| Media | `media`, `upload-url`, `urls`, `[mediaId]`, `[mediaId]/url`, `[mediaId]/albums`, `albums`, `[albumId]`, `bulk-delete` (9) | Write: `requireEventWrite(..., 'media')`; single URL GET: `requireEventRead(..., 'media')` |
| Website content | `website-settings`, `website-design` (+upload/commit), `website-pages` (+`[pageId]`), `story-blocks` (+id), `qa-items` (+id), `stays` (+id), `travel-points` (+id), `wedding-party` (+id) (≈17) | Read: `requireEventRead(..., 'website')` where present; writes: `requireEventWrite(..., 'website')` |
| Settings sidecars | `general-settings`, `guest-settings` (counted above) | `requireEventWrite` (`general` / `guests`) |
| **Gaps / special** | `sub-events/[subId]`, `rsvp` (2) | See findings — **not** on `requireEventWrite` |

### Other (9)

| Route | Notes |
|-------|--------|
| `auth/verify` | Session check |
| `event-types`, `event-types/[typeId]/sub-events` | Catalog read (`config` schema); no user authz |
| `settings/profile`, `settings/avatar`, `settings/notifications` | Self-scoped via `auth.uid()` |
| `notifications`, `[id]`, `mark-all-read`, `push-subscription` | Self-scoped (`user_id = auth.uid()`) |
| `notifications/dispatch-push` | HMAC webhook (`NOTIFICATIONS_WEBHOOK_SECRET`) + service role |
| `media/[...key]` | Unauthenticated R2 **public** proxy; prefix allowlist `events/`, `event-covers/`, `website/` |
| `dev/r2/sign`, `dev/r2/upload-url` | **No auth**; 404 when `NODE_ENV === 'production'` |

---

## 2. Test coverage cross-check

### Vitest API-adjacent (`__tests__/api/**` + related)

| Coverage | Routes / modules |
|----------|------------------|
| **Has route tests (mock)** | `event-types` (+ sub-events), `events` list/create, media suite (upload-url, commit, urls, url, albums, delete, bulk-delete), `admins/[collaboratorId]`, collaborators accept/decline (by id + by-event), `e/[slug]/rsvp` |
| **Lib / helper tests (not full route)** | `lib/auth/eventAccess`, `lib/media/ownership`, `lib/validations/*`, notifications push endpoint helper |
| **Playwright (`tests/`)** | Planning API/UI, event-settings part, notifications/push — **not** a per-route matrix |

### Untested or weakly tested (high interest)

Almost all guest, planning, website-content, settings, public `e/[slug]` (except RSVP error mapping), `events/[id]` GET/PUT/DELETE, `events/[id]/rsvp`, `sub-events/[subId]`, `media/[...key]`, `dev/r2/*`, `dispatch-push`, settings/* — **no dedicated Vitest route file**.

Invite **create** (`POST .../admins`) has no Vitest; remove/role-change covered for `[collaboratorId]` only.

### Vitest run result (finding seed)

| Metric | Value |
|--------|-------|
| Passed | 139 |
| Failed | 52 |
| Failed files | `event-types`, `events/route`, media (albums, bulk-delete, commit, delete, upload-url, url, urls), `auth/callback`, `WizardContext`, `profile`, `validations/events` |

**Root cause class (media + several API mocks):** tests mock `@supabase/ssr` while routes call `@/lib/supabase/server` `createClient()`, which **throws if env vars unset** before the SSR mock applies. Collaborator invite tests correctly mock `@/lib/supabase/server` and pass. Media suite also predates / incompletely models `requireEventWrite`’s two-query access pattern.

**Passing security-relevant suites:** `__tests__/api/collaborators/invites/route.test.ts`, `__tests__/api/events/[id]/admins/[collaboratorId]/route.test.ts`, `__tests__/lib/auth/eventAccess.test.ts`, `__tests__/api/e/[slug]/rsvp.test.ts`.

---

## 3. Authz / IDOR spot-check

### Capability matrix (app + SQL — must stay paired)

From `lib/auth/eventAccess.ts` / `can_write_event`:

| Role | Write caps | Read |
|------|------------|------|
| **owner** | billing, delete, admins, website, guests, planning, media, general | all |
| **co-host** | admins, website, guests, planning, media, general (not billing/delete) | those + viewer-style |
| **planner** | guests, planning | guests, planning (+ viewer any-cap read quirk — see below) |
| **photographer** | media | media (+ viewer quirk) |
| **viewer** | none | `canRead` returns true for **any** capability if role is viewer |

App write denial → **404 `{ error: 'Not found' }`** (no 403 enumeration).

`verifyOwnership`: **not used** in any `app/api/**` file (replaced by `requireEventWrite`).

### Findings — security / authz

#### P0

| ID | Finding | Evidence |
|----|---------|----------|
| **W2-P0-1** | Guest lookup **bypasses website password gate** | `POST /api/e/[slug]/lookup` calls `resolve_guest_by_lookup` with no `evz_site_pw` check. Documented known gap (`docs/superpowers/plans/2026-08-05-digital-presence-audit-plan.md`). Attacker with guest phone+name obtains private-tier session on password-protected sites. |

#### P1

| ID | Finding | Evidence |
|----|---------|----------|
| **W2-P1-1** | `PATCH /api/events/[id]/sub-events/[subId]` — **no `getUser` / no `requireEventWrite`** | Relies only on RLS. Live policies: `owner_all_sub_events` (ALL) + `collab_select_sub_events` (**SELECT only** via `can_read_event`). Strangers blocked by RLS, but: (a) unauthorized → **500** not 401/404; (b) **co-host cannot toggle `show_on_website`** despite `website` write capability — app/SQL capability drift. |
| **W2-P1-2** | `POST /api/events/[id]/rsvp` uses **service role**, **no session**, inserts into any live event UUID | Spam / guest-list pollution IDOR. Only product caller found: `app/wedding-invitation-temp-1` (design-test). Canonical guest RSVP is `e/[slug]/rsvp`. |
| **W2-P1-3** | Media signed-URL authz inconsistency | `GET .../media/[mediaId]/url` → `requireEventRead('media')` (viewer OK). `POST .../media/urls` → `requireEventWrite('media')` (viewer **blocked**; planner blocked). Same resource, different bars. |
| **W2-P1-4** | Vitest API suite largely red | 52 failures; media/events mocks don’t match `createClient` + `requireEventWrite`. CI cannot gate authz regressions. |
| **W2-P1-5** | `x-forwarded-for` trust on lookup / verify-password | Client-controlled header forwarded into RPC rate-limit IP hashing (prior audit noted spoof risk). Still present in `lookup` + `verify-password` routes. |

#### P2

| ID | Finding | Evidence |
|----|---------|----------|
| **W2-P2-1** | `app/api/dev/r2/*` unauthenticated when `NODE_ENV !== 'production'` | Preview/misconfig could expose signed GET of arbitrary keys (`sign`) or uploads under `dev/`. |
| **W2-P2-2** | Public R2 proxy `GET /api/media/[...key]` | Intentional for public bucket; guessing keys under allowlisted prefixes yields bytes. Acceptable if keys are unguessable UUIDs — confirm no sensitive private objects land in public bucket. |
| **W2-P2-3** | `GET /api/events/[id]` uses session + RLS only (no `requireEventRead`) | Correct if RLS `can_read_event` is complete; no app-layer capability for “billing-sensitive” fields if any leak onto this payload. Spot-check payload vs viewer/photographer needs. |
| **W2-P2-4** | Guest `e/[slug]/rsvp` does not pass `slug` into `submit_rsvp` | Binding is token→event inside RPC (assumed). Route-level slug is unused beyond 404 length check — confirm RPC rejects cross-event `sub_event_id`. |
| **W2-P2-5** | Co-host can invite any role including another co-host | By design (`admins` cap); ensure product intent (no “owner transfer” — `owner` excluded from role enum — OK). |

### Positive controls (no finding)

- Most mutating event routes call `requireEventWrite` with the right capability.
- Admins DELETE/PATCH: event-scoped collaborator id + self-removal lockout + no `owner` role in PATCH enum.
- Notifications PATCH: `.eq('user_id', user.id)`.
- `dispatch-push`: HMAC + rate limit + idempotent log.
- Collab accept/decline: auth required; wrong account → 403 via RPC mapping.

---

## 4. Collab invite API — expected behavior by role

### Surfaces

| Action | Who | Endpoint / path |
|--------|-----|-----------------|
| **Invite (create pending)** | Owner or **co-host** (`admins` write) | `POST /api/events/[id]/admins` body `{ email, role }` · roles: `co-host` \| `planner` \| `photographer` \| `viewer` |
| **List pending (for invitee)** | Authenticated + **email confirmed** | RPC `list_my_pending_invites` (home UI) — **not** an `/api/collaborators/...` route |
| **Accept by invite id** | Invitee matching invited email | `POST /api/collaborators/invites/[collaboratorId]/accept` |
| **Decline by invite id** | Invitee | `POST /api/collaborators/invites/[collaboratorId]/decline` |
| **Accept by event** | Invitee with pending row for that event | `POST /api/collaborators/invites/by-event/[eventId]/accept` |
| **Decline by event** | Invitee | `.../by-event/[eventId]/decline` |
| **Change role / remove** | Owner or co-host | `PATCH` / `DELETE /api/events/[id]/admins/[collaboratorId]` |

Invite token = `event_collaborators.id` (passed as `p_token` to accept/decline RPCs).

### Role expectations after accept (active)

| Role | Invite others | Website write | Guests | Planning | Media | Delete event / billing |
|------|---------------|---------------|--------|----------|-------|------------------------|
| co-host | yes | yes | yes | yes | yes | no |
| planner | no | no | yes | yes | no | no |
| photographer | no | no | no | no | yes | no |
| viewer | no | no | no | no | read via `requireEventRead` paths only; **not** batch `media/urls` write gate | no |

### Test status for collab API

| Path | Vitest |
|------|--------|
| Accept/decline by collaboratorId | Covered (401/403/404/409/200) |
| Accept/decline by-event | Covered |
| Invite create + role matrix live | **Not** in Vitest — deferred to W3 Playwright matrix |
| Capability denial per role on product routes | Unit matrix in `eventAccess.test.ts` only — **not** live HTTP |

---

## 5. Routes that look untested or dangerous (watchlist)

| Priority | Route | Why |
|----------|-------|-----|
| P0 | `e/[slug]/lookup` | Password-gate bypass |
| P1 | `events/[id]/sub-events/[subId]` | No app authz; RLS write = owner-only |
| P1 | `events/[id]/rsvp` | Service-role public insert |
| P1 | Media write suite + most guests/planning/website APIs | Untested or broken Vitest |
| P2 | `dev/r2/sign`, `dev/r2/upload-url` | Unauth outside production |
| P2 | `media/[...key]` | Public proxy |
| P2 | `notifications/dispatch-push` | High impact if secret leaks (HMAC present — OK if secret strong) |

---

## 6. Recommended Stage-2 follow-ups (not in Stage 1)

1. Close lookup ↔ password-session coupling in RPC.  
2. Add `requireEventWrite(..., 'website')` + collab UPDATE RLS on `event_sub_events` (or document owner-only).  
3. Retire or hard-gate `events/[id]/rsvp` (auth + feature flag / remove service role).  
4. Align batch media URLs with `requireEventRead`.  
5. Retarget Vitest mocks to `@/lib/supabase/server` + set test env; restore green suite.  
6. W3: live A/B matrix for all four roles on invite → accept → capability probes.

---

## Appendix A — Full route path list (70)

```
app/api/auth/verify/route.ts
app/api/collaborators/invites/[collaboratorId]/accept/route.ts
app/api/collaborators/invites/[collaboratorId]/decline/route.ts
app/api/collaborators/invites/by-event/[eventId]/accept/route.ts
app/api/collaborators/invites/by-event/[eventId]/decline/route.ts
app/api/dev/r2/sign/route.ts
app/api/dev/r2/upload-url/route.ts
app/api/e/[slug]/guest/route.ts
app/api/e/[slug]/lookup/route.ts
app/api/e/[slug]/route.ts
app/api/e/[slug]/rsvp/route.ts
app/api/e/[slug]/verify-password/route.ts
app/api/event-types/[typeId]/sub-events/route.ts
app/api/event-types/route.ts
app/api/events/[id]/admins/[collaboratorId]/route.ts
app/api/events/[id]/admins/route.ts
app/api/events/[id]/general-settings/route.ts
app/api/events/[id]/guest-settings/route.ts
app/api/events/[id]/guest-tags/[tagId]/route.ts
app/api/events/[id]/guest-tags/route.ts
app/api/events/[id]/guests/[guestId]/route.ts
app/api/events/[id]/guests/bulk/route.ts
app/api/events/[id]/guests/import/route.ts
app/api/events/[id]/guests/route.ts
app/api/events/[id]/media/[mediaId]/albums/route.ts
app/api/events/[id]/media/[mediaId]/route.ts
app/api/events/[id]/media/[mediaId]/url/route.ts
app/api/events/[id]/media/albums/[albumId]/route.ts
app/api/events/[id]/media/albums/route.ts
app/api/events/[id]/media/bulk-delete/route.ts
app/api/events/[id]/media/route.ts
app/api/events/[id]/media/upload-url/route.ts
app/api/events/[id]/media/urls/route.ts
app/api/events/[id]/planning/budget/route.ts
app/api/events/[id]/planning/expense-types/route.ts
app/api/events/[id]/planning/expenses/[expenseId]/route.ts
app/api/events/[id]/planning/expenses/route.ts
app/api/events/[id]/planning/tasks/[taskId]/route.ts
app/api/events/[id]/planning/tasks/bulk/route.ts
app/api/events/[id]/planning/tasks/route.ts
app/api/events/[id]/qa-items/[itemId]/route.ts
app/api/events/[id]/qa-items/route.ts
app/api/events/[id]/route.ts
app/api/events/[id]/rsvp/route.ts
app/api/events/[id]/stays/[stayId]/route.ts
app/api/events/[id]/stays/route.ts
app/api/events/[id]/story-blocks/[blockId]/route.ts
app/api/events/[id]/story-blocks/route.ts
app/api/events/[id]/sub-events/[subId]/route.ts
app/api/events/[id]/travel-points/[pointId]/route.ts
app/api/events/[id]/travel-points/route.ts
app/api/events/[id]/website-design/commit/route.ts
app/api/events/[id]/website-design/route.ts
app/api/events/[id]/website-design/upload-url/route.ts
app/api/events/[id]/website-pages/[pageId]/route.ts
app/api/events/[id]/website-pages/route.ts
app/api/events/[id]/website-settings/route.ts
app/api/events/[id]/wedding-party/[memberId]/route.ts
app/api/events/[id]/wedding-party/route.ts
app/api/events/cover/route.ts
app/api/events/route.ts
app/api/media/[...key]/route.ts
app/api/notifications/[id]/route.ts
app/api/notifications/dispatch-push/route.ts
app/api/notifications/mark-all-read/route.ts
app/api/notifications/push-subscription/route.ts
app/api/notifications/route.ts
app/api/settings/avatar/route.ts
app/api/settings/notifications/route.ts
app/api/settings/profile/route.ts
```

## Appendix B — Vitest ↔ route mapping (API files only)

| Test file | Target route(s) | Status 2026-08-07 |
|-----------|-----------------|-------------------|
| `__tests__/api/collaborators/invites/route.test.ts` | 4 invite accept/decline | PASS |
| `__tests__/api/events/[id]/admins/[collaboratorId]/route.test.ts` | admins PATCH/DELETE | PASS |
| `__tests__/api/e/[slug]/rsvp.test.ts` | guest RSVP error map | PASS |
| `__tests__/api/event-types/route.test.ts` | event-types | FAIL |
| `__tests__/api/events/route.test.ts` | events GET/POST | FAIL |
| `__tests__/api/events/[id]/media/*.test.ts` (7 files) | media routes | FAIL (mock/env drift) |
| *(none)* | remaining ~55 routes | uncovered |
