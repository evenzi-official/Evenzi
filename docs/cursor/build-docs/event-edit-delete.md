# Build-Doc — Implement Event Edit & Delete (API + FE wiring)

**Author:** Claude (review gate, 2026-06-22) · **Executor:** Cursor · **Reviewer:** Claude (Playwright re-test before done)
**Blocks ClickUp:** `86d2k1nxe` (Backend Dev: Event - Edit & Delete), `86d2k1nx7` (Frontend Dev: Event - Edit & Delete)
**Bug:** see QA & Bugs — "Event Edit & Delete not implemented (no PUT/DELETE API; Delete button is a no-op)"

---

## Current state (verified live on `77f0385`, :3001)

- `app/api/events/[id]/route.ts` exposes **only `GET`** — there is **no `PUT`/`PATCH`/`DELETE`**. Nothing can edit or delete an event via API.
- `app/events/[id]/settings/page.tsx` is a **server component with no client interactivity**. The **"Delete event"** button (Danger zone) and **"Save changes"** button have no `onClick`/`fetch`/`confirm` — clicking does nothing (confirmed: no network request, no modal).
- The General-settings form **does not bind Partner one / Partner two** — both fields render empty even though the wizard stored partner names in `events.event_details` (jsonb).

So both `86d2k1nxe` and `86d2k1nx7` are mis-statused as `review`; the feature is not built.

## Schema facts (live DB)
- Soft delete: `public.events.deleted_at timestamptz` exists; all reads already filter `.is('deleted_at', null)`. **Delete = set `deleted_at = now()`**, not a hard delete.
- RLS: single policy `events_owner_all` — `cmd=ALL`, `USING (auth.uid() = user_id)` + same `WITH CHECK`. So an owner-scoped `update`/`delete` is automatically row-protected; still add an explicit auth check + 404-on-null for clean error codes.
- Variable fields (partner names etc.) live in `events.event_details` (jsonb), keyed by the `field_schema` keys (e.g. `partner_1_name`, `partner_2_name` — confirm exact keys from `config.event_types.field_schema` for the wedding type).

## Part A — Backend: `PUT` + `DELETE` on `app/api/events/[id]/route.ts`

### `DELETE`
- Auth: `supabase.auth.getUser()`; 401 if no user.
- `update({ deleted_at: new Date().toISOString() }).eq('id', id).is('deleted_at', null).select('id').single()`.
- If no row returned → 404 (already deleted or not owned — RLS hides non-owned rows). Destructure and surface `error`.
- Return `{ success: true }` 200.

### `PUT` (edit core details)
- Auth as above.
- Accept a Zod-validated body: `name?`, `primary_date?`, `primary_venue?`, `guest_capacity?`, and `event_details?` (partial merge of the jsonb — read current, shallow-merge, write back; or accept specific keys).
- `update({...}).eq('id', id).is('deleted_at', null).select(...).single()`; 404 on null; surface `error`.
- Coerce empty strings to `null` before writing (consistent with the D44 empty-string rule).
- Return the updated event 200.

Mirror the existing GET file's import style + `createClient` from `@/lib/supabase/server`.

## Part B — Frontend: wire `app/events/[id]/settings/page.tsx`

The page is currently a server component. Either (a) keep the server component for the initial data fetch and extract the interactive form + danger zone into a `"use client"` child component, or (b) convert appropriately. Recommended: a `GeneralSettingsForm` client component that receives the loaded event as props.

### Bind initial values
- Read partner names from `event_details` (the loaded event) into Partner one / Partner two inputs. Event name, date, venue, city as already shown.

### Save changes
- On click → `PUT /api/events/[id]` with the changed fields. Optimistic or pending state on the button (`data-state="saving"`), success toast, error toast. Use the existing toast primitive if present.

### Delete event (Danger zone)
- On click → **confirmation modal** (use the shell `.modal-confirm-cautionary` pattern from the design system — irreversible action). Require an explicit confirm (ideally type-to-confirm the event name, matching the prototype if it specifies one).
- On confirm → `DELETE /api/events/[id]` → on success `router.push('/home')` + success toast. On error → error toast, stay.

## Acceptance criteria (Claude re-tests with Playwright)
1. `DELETE /api/events/[id]` soft-deletes (sets `deleted_at`); the event disappears from `/home` and its pages 404/redirect appropriately. A second delete → 404.
2. Delete button opens a confirm modal; cancel = no-op; confirm = event gone + redirected to /home.
3. `PUT /api/events/[id]` edits name/date/venue/guests + partner names; reload shows persisted values.
4. Partner one/two inputs are **pre-filled** from `event_details` on load.
5. Owner-scoping holds: a different user's event id returns 404 on PUT/DELETE (RLS).
6. Empty-string inputs persist as `null`, not `""`.
7. Zero console errors.

## Files
- `app/api/events/[id]/route.ts` (add PUT + DELETE)
- `app/events/[id]/settings/page.tsx` (+ new client form component)
- `lib/validations/events.ts` (add an edit schema)
- Reference: `events_owner_all` RLS, `events.deleted_at`, `config.event_types.field_schema`, `lib/supabase/database.types.ts`
