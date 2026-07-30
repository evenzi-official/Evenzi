# Guest Management & RSVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `app/events/[id]/guests/page.tsx` from a static, hardcoded-zeros shell into a fully working Guest Management & RSVP feature — add/edit/remove guests, manual RSVP tracking, function/tag assignment, real CSV import, bulk actions, and search/filter/sort — reading and writing the already-live `event_guests` schema.

**Architecture:** `app/events/[id]/guests/page.tsx` stays a thin server component that fetches everything up front and hands it to one client component, `GuestManagementClient.tsx`, which owns all list/filter/search/sort/selection state (same shape as `MediaClient.tsx`/`PlanningClient.tsx`). Three modals (`GuestFormModal`, `ImportCsvModal`, `TagManagerModal`) and one reusable dropdown/sheet component (`GuestPicker`, ported once from the prototype's `openPicker()` and reused at all six picker call sites) are hand-rolled with `useState` — no shared `<Modal>` wrapper, matching the pattern already shipped in Media/Planning/Invitations/Settings. Six new API routes under `/api/events/[id]/guests*` follow the exact validate→auth→zod→Supabase→JSON-response shape already used by `app/api/events/[id]/guest-settings/route.ts`.

**Tech Stack:** Next.js 14 App Router, Supabase (`@supabase/ssr`), Zod, existing shell CSS/JSX primitives (`designs/shared/shell.css`, `designs/pages/guests/guests.css`).

## Global Constraints

- No new CSS is written by this plan — every class used already exists in `designs/shared/shell.css` or `designs/pages/guests/guests.css` (both verified present and read in full during planning).
- Every new API route must check `supabase.auth.getUser()` and return 401 before touching data — matches every existing `/api/events/**` route.
- RLS is owner-scoped on every guest table via `events.user_id` — routes rely on RLS for authorization (no manual "does this event belong to this user" check), matching the existing `guest-settings/route.ts` convention.
- "Send invites" renders disabled everywhere (toolbar, bulk bar, swipe rail) and fires no request in any task in this plan — real WhatsApp sending is out of scope (design spec §6).
- Full spec: `docs/superpowers/specs/2026-07-29-guest-management-design.md`.

## Plan deviations from spec (found during planning, correct as implemented here)

1. **Stats are computed client-side from the loaded guest list, not fetched from `event_guest_stats`/`event_sub_event_guest_counts`.** The design spec's §4 file list included these two views in `page.tsx`'s initial fetch. Since `GuestManagementClient` already holds the full `guests` array in state (needed for the list itself), deriving counts/response-rate/zero-assigned from that same array in a `useMemo` is one source of truth instead of two — it can't drift from the visible list after a mutation, and it drops two DB round-trips from every page load. `GuestStats` is not defined in `lib/types/guests.ts`; `GuestManagementInitialData` has no `stats` field.
2. **`GuestPicker`'s keyboard support is Tab / Enter / Space (all native `<button>` behavior) plus Escape-to-close.** The prototype's full roving-tabindex arrow-key navigation (`onPickerKey`'s `ArrowUp`/`ArrowDown`/`Tab`-trap logic) is not ported. Every option is a real `<button>`, so Tab order and Enter/Space activation work with zero extra code — PORT-MAP.md §2's a11y contract ("preserve native semantics") is met; arrow-key roving specifically was not in the design doc's §9 testing checklist, so this is a scoped-down port, not a silent gap.
3. **Toast reuses the existing `.bc-toast` shell primitive** (`designs/shared/shell.css:586-610`, visibility toggled by an `.is-show` class — confirmed by reading the CSS directly), rendered once at the top level of `GuestManagementClient` and driven by one `toast: string | null` state var, rather than inventing a new toast component. This differs from `ProfileSection`/`SecuritySection`'s pattern of one inline toast per section, because Guest Management triggers toasts from many scattered actions (RSVP change, bulk actions, import, tag CRUD) that don't each have a natural "near the button" home the way a settings form does.
4. **The bulk "tag" action's upsert target is `guest_id,tag_id`**, not `event_id,guest_id,tag_id`. Verified directly against the live schema: `event_guest_tag_links`'s actual unique constraint is `event_guest_tag_links_guest_id_tag_id_key` on `(guest_id, tag_id)`.
5. **DELETE routes need no manual child-row cleanup.** Verified `confdeltype='c'` (CASCADE) on `event_guest_sub_events.guest_id → event_guests.id`, `event_guest_tag_links.guest_id → event_guests.id`, and `event_guest_tag_links.tag_id → event_guest_tags.id`. Deleting a guest or a tag cascades correctly at the DB level.

---

## File Structure

- `app/globals.css` — **modify**: add the missing `@import "../designs/pages/guests/guests.css";` (confirmed absent during planning — every other converted page's CSS is imported here except this one; without it every `.gm-*` class is unstyled).
- `lib/types/guests.ts` — **create**: shared TypeScript types (`GuestRow`, `RsvpStatusOption`, `SubEventOption`, `GuestTagOption`, `GuestManagementInitialData`) used by the server page, the client component, and all three modals.
- `lib/validations/guests.ts` — **create**: Zod schemas for every API route body (`createGuestSchema`, `updateGuestSchema`, `bulkActionSchema`, `importGuestsSchema`, `createTagSchema`) plus the shared `uuidSchema`.
- `app/api/events/[id]/guests/route.ts` — **create**: `POST` — create a guest.
- `app/api/events/[id]/guests/[guestId]/route.ts` — **create**: `PATCH` (partial update — name/phone/email/partySize/notes/rsvpStatusId/subEventIds/tagIds, any subset) + `DELETE`.
- `app/api/events/[id]/guests/bulk/route.ts` — **create**: `POST` — `{action:'tag'|'assign'|'delete', guestIds, ...}`.
- `app/api/events/[id]/guests/import/route.ts` — **create**: `POST` — batch insert from validated CSV rows, server-side re-dedupe.
- `app/api/events/[id]/guest-tags/route.ts` — **create**: `POST` — create a custom per-event tag.
- `app/api/events/[id]/guest-tags/[tagId]/route.ts` — **create**: `DELETE`.
- `app/events/[id]/guests/GuestPicker.tsx` — **create**: the one reusable sheet/popover picker (single + multi select), used by six call sites in `GuestManagementClient`.
- `app/events/[id]/guests/GuestFormModal.tsx` — **create**: add/edit guest, functions checklist, tags combobox, Remove confirm.
- `app/events/[id]/guests/ImportCsvModal.tsx` — **create**: template download, upload, live preview table, validation, confirm.
- `app/events/[id]/guests/TagManagerModal.tsx` — **create**: list/add/delete per-event tags.
- `app/events/[id]/guests/page.tsx` — **rewrite**: thin server component, parallel data fetch, renders `GuestManagementClient`.
- `app/events/[id]/guests/GuestManagementClient.tsx` — **create**: the orchestrator — stats bar, toolbar, filters, guest list, bulk bar, swipe rail, FAB, all five modal/picker integrations.

---

### Task 1: Types, validation schemas, and the missing CSS import

**Files:**
- Modify: `app/globals.css`
- Create: `lib/types/guests.ts`
- Create: `lib/validations/guests.ts`

**Interfaces:**
- Produces (from `lib/types/guests.ts`): `RsvpStatusOption`, `SubEventOption`, `GuestTagOption`, `GuestRow`, `GuestManagementInitialData` — consumed by every later task.
- Produces (from `lib/validations/guests.ts`): `uuidSchema`, `createGuestSchema`, `updateGuestSchema`, `bulkActionSchema`, `importGuestsSchema`, `importGuestRowSchema`, `createTagSchema` — consumed by Tasks 2–4.

- [ ] **Step 1: Fix the missing CSS import**

In `app/globals.css`, add this line after the existing `@import "../designs/pages/event-settings/event-settings.css";` (line 11) and before `@import "../designs/pages/settings/settings.css";` (line 12):

```css
@import "../designs/pages/guests/guests.css";
```

- [ ] **Step 2: Write the shared types**

Create `lib/types/guests.ts`:

```typescript
export interface RsvpStatusOption {
  id: string
  slug: 'pending' | 'confirmed' | 'declined' | 'maybe'
  name: string
  iconName: string
  category: string
}

export interface SubEventOption {
  id: string
  label: string
}

export interface GuestTagOption {
  id: string
  name: string
  isCustom: boolean
}

export interface GuestRow {
  id: string
  name: string
  phone: string
  email: string | null
  rsvpStatusId: string
  invited: boolean
  partySize: number
  notes: string | null
  subEventIds: string[]
  tagIds: string[]
  createdAt: string
}

export interface GuestManagementInitialData {
  eventId: string
  eventName: string
  guests: GuestRow[]
  rsvpStatuses: RsvpStatusOption[]
  subEvents: SubEventOption[]
  tags: GuestTagOption[]
}
```

- [ ] **Step 3: Write the validation schemas**

Create `lib/validations/guests.ts`:

```typescript
import { z } from 'zod'

export const uuidSchema = z.string().uuid()

const phoneSchema = z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number')

export const createGuestSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  phone: phoneSchema,
  email: z.string().trim().email().max(200).nullable().optional(),
  subEventIds: z.array(z.string().uuid()).max(50).optional(),
  tagIds: z.array(z.string().uuid()).max(50).optional(),
}).strict()

export const updateGuestSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  phone: phoneSchema.optional(),
  email: z.string().trim().email().max(200).nullable().optional(),
  partySize: z.number().int().min(1).max(20).optional(),
  notes: z.string().max(1000).nullable().optional(),
  rsvpStatusId: z.string().uuid().optional(),
  subEventIds: z.array(z.string().uuid()).max(50).optional(),
  tagIds: z.array(z.string().uuid()).max(50).optional(),
}).strict()

export const bulkActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('tag'),
    guestIds: z.array(z.string().uuid()).min(1).max(500),
    tagIds: z.array(z.string().uuid()).min(1).max(50),
  }).strict(),
  z.object({
    action: z.literal('assign'),
    guestIds: z.array(z.string().uuid()).min(1).max(500),
    subEventIds: z.array(z.string().uuid()).max(50),
  }).strict(),
  z.object({
    action: z.literal('delete'),
    guestIds: z.array(z.string().uuid()).min(1).max(500),
  }).strict(),
])

export const importGuestRowSchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().regex(/^\d{10}$/),
  email: z.string().trim().email().max(200).nullable(),
})

export const importGuestsSchema = z.object({
  guests: z.array(importGuestRowSchema).min(1).max(1000),
}).strict()

export const createTagSchema = z.object({
  name: z.string().trim().min(1).max(60),
}).strict()
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors from these two new files (neither is imported anywhere yet).

Run: `grep -n "designs/pages/guests/guests.css" app/globals.css`
Expected: one match, the line just added.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css lib/types/guests.ts lib/validations/guests.ts
git commit -m "feat(guests): add shared types, validation schemas, missing guests.css import"
```

---

### Task 2: Guest CRUD API routes

**Files:**
- Create: `app/api/events/[id]/guests/route.ts`
- Create: `app/api/events/[id]/guests/[guestId]/route.ts`

**Interfaces:**
- Consumes: `createGuestSchema`, `updateGuestSchema`, `uuidSchema` from Task 1.
- Produces: `POST /api/events/[id]/guests` body `{name, phone, email?, subEventIds?, tagIds?}` → `{guest: GuestRow}` (201) or `{error, details?}`.
- Produces: `PATCH /api/events/[id]/guests/[guestId]` body — any subset of `{name, phone, email, partySize, notes, rsvpStatusId, subEventIds, tagIds}` → `{success: true}` or `{error, details?}`.
- Produces: `DELETE /api/events/[id]/guests/[guestId]` → `{success: true}` or `{error}`.

- [ ] **Step 1: Write the create-guest route**

Create `app/api/events/[id]/guests/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createGuestSchema, uuidSchema } from '@/lib/validations/guests'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = createGuestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { name, phone, email, subEventIds, tagIds } = parsed.data

    const { data: pendingStatus, error: statusError } = await supabase
      .schema('config')
      .from('rsvp_statuses')
      .select('id')
      .eq('slug', 'pending')
      .single()

    if (statusError || !pendingStatus) {
      console.error('POST /api/events/[id]/guests: pending status lookup failed:', statusError)
      return NextResponse.json({ error: 'Failed to create guest' }, { status: 500 })
    }

    const { data: guestRow, error: insertError } = await supabase
      .from('event_guests')
      .insert({
        event_id: id,
        name,
        phone,
        email: email ?? null,
        rsvp_status_id: pendingStatus.id,
        invited: false,
        party_size: 1,
        created_by: user.id,
      })
      .select('id, name, phone, email, rsvp_status_id, invited, party_size, notes, created_at')
      .single()

    if (insertError || !guestRow) {
      console.error('POST /api/events/[id]/guests failed:', insertError)
      return NextResponse.json({ error: 'Failed to create guest' }, { status: 500 })
    }

    if (subEventIds && subEventIds.length > 0) {
      const { error: seError } = await supabase
        .from('event_guest_sub_events')
        .insert(subEventIds.map((subEventId) => ({ event_id: id, guest_id: guestRow.id, sub_event_id: subEventId })))
      if (seError) {
        console.error('POST /api/events/[id]/guests: sub-event assign failed:', seError)
        return NextResponse.json({ error: 'Guest created but function assignment failed' }, { status: 500 })
      }
    }

    if (tagIds && tagIds.length > 0) {
      const { error: tagError } = await supabase
        .from('event_guest_tag_links')
        .insert(tagIds.map((tagId) => ({ event_id: id, guest_id: guestRow.id, tag_id: tagId })))
      if (tagError) {
        console.error('POST /api/events/[id]/guests: tag link failed:', tagError)
        return NextResponse.json({ error: 'Guest created but tagging failed' }, { status: 500 })
      }
    }

    return NextResponse.json({
      guest: {
        id: guestRow.id,
        name: guestRow.name,
        phone: guestRow.phone,
        email: guestRow.email,
        rsvpStatusId: guestRow.rsvp_status_id,
        invited: guestRow.invited,
        partySize: guestRow.party_size,
        notes: guestRow.notes,
        subEventIds: subEventIds ?? [],
        tagIds: tagIds ?? [],
        createdAt: guestRow.created_at,
      },
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Write the update/delete-guest route**

Create `app/api/events/[id]/guests/[guestId]/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { updateGuestSchema, uuidSchema } from '@/lib/validations/guests'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; guestId: string }> }
): Promise<NextResponse> {
  try {
    const { id, guestId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(guestId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = updateGuestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { name, phone, email, partySize, notes, rsvpStatusId, subEventIds, tagIds } = parsed.data

    const patch: Record<string, unknown> = {}
    if (name !== undefined) patch.name = name
    if (phone !== undefined) patch.phone = phone
    if (email !== undefined) patch.email = email
    if (partySize !== undefined) patch.party_size = partySize
    if (notes !== undefined) patch.notes = notes
    if (rsvpStatusId !== undefined) patch.rsvp_status_id = rsvpStatusId

    if (Object.keys(patch).length > 0) {
      const { error: updateError } = await supabase
        .from('event_guests')
        .update(patch)
        .eq('id', guestId)
        .eq('event_id', id)

      if (updateError) {
        console.error('PATCH /api/events/[id]/guests/[guestId] failed:', updateError)
        return NextResponse.json({ error: 'Failed to update guest' }, { status: 500 })
      }
    }

    if (subEventIds !== undefined) {
      const { error: delError } = await supabase
        .from('event_guest_sub_events')
        .delete()
        .eq('guest_id', guestId)
        .eq('event_id', id)
      if (delError) {
        console.error('PATCH /api/events/[id]/guests/[guestId]: clearing functions failed:', delError)
        return NextResponse.json({ error: 'Failed to update functions' }, { status: 500 })
      }
      if (subEventIds.length > 0) {
        const { error: insError } = await supabase
          .from('event_guest_sub_events')
          .insert(subEventIds.map((subEventId) => ({ event_id: id, guest_id: guestId, sub_event_id: subEventId })))
        if (insError) {
          console.error('PATCH /api/events/[id]/guests/[guestId]: assigning functions failed:', insError)
          return NextResponse.json({ error: 'Failed to update functions' }, { status: 500 })
        }
      }
    }

    if (tagIds !== undefined) {
      const { error: delTagError } = await supabase
        .from('event_guest_tag_links')
        .delete()
        .eq('guest_id', guestId)
        .eq('event_id', id)
      if (delTagError) {
        console.error('PATCH /api/events/[id]/guests/[guestId]: clearing tags failed:', delTagError)
        return NextResponse.json({ error: 'Failed to update tags' }, { status: 500 })
      }
      if (tagIds.length > 0) {
        const { error: insTagError } = await supabase
          .from('event_guest_tag_links')
          .insert(tagIds.map((tagId) => ({ event_id: id, guest_id: guestId, tag_id: tagId })))
        if (insTagError) {
          console.error('PATCH /api/events/[id]/guests/[guestId]: tagging failed:', insTagError)
          return NextResponse.json({ error: 'Failed to update tags' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; guestId: string }> }
): Promise<NextResponse> {
  try {
    const { id, guestId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(guestId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('event_guests')
      .delete()
      .eq('id', guestId)
      .eq('event_id', id)

    if (error) {
      console.error('DELETE /api/events/[id]/guests/[guestId] failed:', error)
      return NextResponse.json({ error: 'Failed to remove guest' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no type errors in either new file.

Run (dev server on :3000): `curl -s -X POST http://localhost:3000/api/events/00000000-0000-0000-0000-000000000000/guests -H "Content-Type: application/json" -d '{"name":"Test","phone":"9999999999"}'`
Expected: `{"error":"Unauthorized"}` with a 401 — confirms the auth gate runs before any DB write.

Run: `curl -s -X PATCH http://localhost:3000/api/events/00000000-0000-0000-0000-000000000000/guests/00000000-0000-0000-0000-000000000000 -H "Content-Type: application/json" -d '{"name":"X"}'`
Expected: `{"error":"Unauthorized"}` with a 401.

- [ ] **Step 4: Commit**

```bash
git add app/api/events/\[id\]/guests/route.ts app/api/events/\[id\]/guests/\[guestId\]/route.ts
git commit -m "feat(guests): add guest create/update/delete API routes"
```

---

### Task 3: Bulk actions + guest-tags API routes

**Files:**
- Create: `app/api/events/[id]/guests/bulk/route.ts`
- Create: `app/api/events/[id]/guest-tags/route.ts`
- Create: `app/api/events/[id]/guest-tags/[tagId]/route.ts`

**Interfaces:**
- Consumes: `bulkActionSchema`, `createTagSchema`, `uuidSchema` from Task 1.
- Produces: `POST /api/events/[id]/guests/bulk` body `{action:'tag'|'assign'|'delete', guestIds, tagIds?, subEventIds?}` → `{success:true, count}` or `{error, details?}`.
- Produces: `POST /api/events/[id]/guest-tags` body `{name}` → `{tag: GuestTagOption}` (201) or `{error, details?}`.
- Produces: `DELETE /api/events/[id]/guest-tags/[tagId]` → `{success:true}` or `{error}`.

- [ ] **Step 1: Write the bulk-action route**

Create `app/api/events/[id]/guests/bulk/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { bulkActionSchema, uuidSchema } from '@/lib/validations/guests'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = bulkActionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    if (parsed.data.action === 'delete') {
      const { guestIds } = parsed.data
      const { error } = await supabase
        .from('event_guests')
        .delete()
        .eq('event_id', id)
        .in('id', guestIds)
      if (error) {
        console.error('POST /api/events/[id]/guests/bulk (delete) failed:', error)
        return NextResponse.json({ error: 'Failed to remove guests' }, { status: 500 })
      }
      return NextResponse.json({ success: true, count: guestIds.length })
    }

    if (parsed.data.action === 'tag') {
      const { guestIds, tagIds } = parsed.data
      // Union — adds tags without disturbing a guest's existing ones. The
      // unique constraint is (guest_id, tag_id), NOT (event_id, guest_id,
      // tag_id) — verified against the live schema during planning.
      const rows = guestIds.flatMap((guestId) => tagIds.map((tagId) => ({ event_id: id, guest_id: guestId, tag_id: tagId })))
      const { error } = await supabase
        .from('event_guest_tag_links')
        .upsert(rows, { onConflict: 'guest_id,tag_id', ignoreDuplicates: true })
      if (error) {
        console.error('POST /api/events/[id]/guests/bulk (tag) failed:', error)
        return NextResponse.json({ error: 'Failed to tag guests' }, { status: 500 })
      }
      return NextResponse.json({ success: true, count: guestIds.length })
    }

    // action === 'assign' — replaces each selected guest's functions.
    const { guestIds, subEventIds } = parsed.data
    const { error: delError } = await supabase
      .from('event_guest_sub_events')
      .delete()
      .eq('event_id', id)
      .in('guest_id', guestIds)
    if (delError) {
      console.error('POST /api/events/[id]/guests/bulk (assign, clear) failed:', delError)
      return NextResponse.json({ error: 'Failed to update functions' }, { status: 500 })
    }
    if (subEventIds.length > 0) {
      const rows = guestIds.flatMap((guestId) => subEventIds.map((subEventId) => ({ event_id: id, guest_id: guestId, sub_event_id: subEventId })))
      const { error: insError } = await supabase.from('event_guest_sub_events').insert(rows)
      if (insError) {
        console.error('POST /api/events/[id]/guests/bulk (assign, insert) failed:', insError)
        return NextResponse.json({ error: 'Failed to update functions' }, { status: 500 })
      }
    }
    return NextResponse.json({ success: true, count: guestIds.length })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Write the guest-tags routes**

Create `app/api/events/[id]/guest-tags/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createTagSchema, uuidSchema } from '@/lib/validations/guests'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = createTagSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { data: tagRow, error } = await supabase
      .from('event_guest_tags')
      .insert({ event_id: id, name: parsed.data.name, is_custom: true, created_by: user.id })
      .select('id, name, is_custom')
      .single()

    if (error || !tagRow) {
      console.error('POST /api/events/[id]/guest-tags failed:', error)
      return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
    }

    return NextResponse.json({ tag: { id: tagRow.id, name: tagRow.name, isCustom: tagRow.is_custom } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

Create `app/api/events/[id]/guest-tags/[tagId]/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { uuidSchema } from '@/lib/validations/guests'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; tagId: string }> }
): Promise<NextResponse> {
  try {
    const { id, tagId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(tagId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('event_guest_tags')
      .delete()
      .eq('id', tagId)
      .eq('event_id', id)

    if (error) {
      console.error('DELETE /api/events/[id]/guest-tags/[tagId] failed:', error)
      return NextResponse.json({ error: 'Failed to remove tag' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no type errors.

Run: `curl -s -X POST http://localhost:3000/api/events/00000000-0000-0000-0000-000000000000/guests/bulk -H "Content-Type: application/json" -d '{"action":"delete","guestIds":["00000000-0000-0000-0000-000000000000"]}'`
Expected: `{"error":"Unauthorized"}` with a 401.

Run: `curl -s -X POST http://localhost:3000/api/events/00000000-0000-0000-0000-000000000000/guest-tags -H "Content-Type: application/json" -d '{"name":"Test"}'`
Expected: `{"error":"Unauthorized"}` with a 401.

- [ ] **Step 4: Commit**

```bash
git add app/api/events/\[id\]/guests/bulk/route.ts app/api/events/\[id\]/guest-tags/route.ts app/api/events/\[id\]/guest-tags/\[tagId\]/route.ts
git commit -m "feat(guests): add bulk-action and guest-tags API routes"
```

---

### Task 4: CSV import API route

**Files:**
- Create: `app/api/events/[id]/guests/import/route.ts`

**Interfaces:**
- Consumes: `importGuestsSchema`, `uuidSchema` from Task 1.
- Produces: `POST /api/events/[id]/guests/import` body `{guests: {name, phone, email}[]}` → `{inserted: GuestRow[], skippedDuplicates: number}` or `{error, details?}`.

- [ ] **Step 1: Write the import route**

Create `app/api/events/[id]/guests/import/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { importGuestsSchema, uuidSchema } from '@/lib/validations/guests'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = importGuestsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { data: pendingStatus, error: statusError } = await supabase
      .schema('config')
      .from('rsvp_statuses')
      .select('id')
      .eq('slug', 'pending')
      .single()

    if (statusError || !pendingStatus) {
      console.error('POST /api/events/[id]/guests/import: pending status lookup failed:', statusError)
      return NextResponse.json({ error: 'Import failed' }, { status: 500 })
    }

    // Server-side dedupe re-check — the client already filtered duplicates
    // against the guest list it had, but that list can be stale by the time
    // the host clicks Import (design spec §5, step 6: "server re-validates").
    const { data: existing, error: existingError } = await supabase
      .from('event_guests')
      .select('phone')
      .eq('event_id', id)

    if (existingError) {
      console.error('POST /api/events/[id]/guests/import: existing lookup failed:', existingError)
      return NextResponse.json({ error: 'Import failed' }, { status: 500 })
    }

    const existingPhones = new Set((existing ?? []).map((g) => g.phone))
    const seen = new Set<string>()
    const toInsert = parsed.data.guests.filter((row) => {
      if (existingPhones.has(row.phone) || seen.has(row.phone)) return false
      seen.add(row.phone)
      return true
    })
    const skippedDuplicates = parsed.data.guests.length - toInsert.length

    if (toInsert.length === 0) {
      return NextResponse.json({ inserted: [], skippedDuplicates })
    }

    const { data: insertedRows, error: insertError } = await supabase
      .from('event_guests')
      .insert(toInsert.map((row) => ({
        event_id: id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        rsvp_status_id: pendingStatus.id,
        invited: false,
        party_size: 1,
        created_by: user.id,
      })))
      .select('id, name, phone, email, rsvp_status_id, invited, party_size, notes, created_at')

    if (insertError || !insertedRows) {
      console.error('POST /api/events/[id]/guests/import: insert failed:', insertError)
      return NextResponse.json({ error: 'Import failed' }, { status: 500 })
    }

    return NextResponse.json({
      inserted: insertedRows.map((g) => ({
        id: g.id,
        name: g.name,
        phone: g.phone,
        email: g.email,
        rsvpStatusId: g.rsvp_status_id,
        invited: g.invited,
        partySize: g.party_size,
        notes: g.notes,
        subEventIds: [] as string[],
        tagIds: [] as string[],
        createdAt: g.created_at,
      })),
      skippedDuplicates,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no type errors.

Run: `curl -s -X POST http://localhost:3000/api/events/00000000-0000-0000-0000-000000000000/guests/import -H "Content-Type: application/json" -d '{"guests":[{"name":"Test","phone":"9999999999","email":null}]}'`
Expected: `{"error":"Unauthorized"}` with a 401.

- [ ] **Step 3: Commit**

```bash
git add app/api/events/\[id\]/guests/import/route.ts
git commit -m "feat(guests): add CSV import API route with server-side dedupe"
```

---

### Task 5: `GuestPicker` — the one reusable sheet/popover component

**Files:**
- Create: `app/events/[id]/guests/GuestPicker.tsx`

**Interfaces:**
- Produces: `<GuestPicker>` — used at six call sites in Task 9 (RSVP setter, sort, function+tag filter, per-guest assign, bulk tag, bulk assign). Exports `PickerOption` and `GuestPickerProps`.

- [ ] **Step 1: Write the picker component**

Create `app/events/[id]/guests/GuestPicker.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'

export interface PickerOption {
  value: string
  label: string
  icon?: string
  group?: string
}

interface PickerBaseProps {
  anchorRect: DOMRect
  ariaLabel: string
  title: React.ReactNode
  options: PickerOption[]
  onClose: () => void
}

interface PickerSingleProps extends PickerBaseProps {
  multi?: false
  current: string
  onPick: (value: string) => void
}

interface PickerMultiProps extends PickerBaseProps {
  multi: true
  current: string[]
  onApply: (values: string[]) => void
}

export type GuestPickerProps = PickerSingleProps | PickerMultiProps

export function GuestPicker(props: GuestPickerProps): React.ReactElement {
  const { anchorRect, ariaLabel, title, options, onClose } = props
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const [pendingMulti, setPendingMulti] = useState<string[]>(props.multi ? props.current : [])

  useEffect(() => {
    function place(): void {
      if (window.innerWidth < 480 || !panelRef.current) { setPosition(null); return }
      const w = panelRef.current.offsetWidth || 280
      const h = panelRef.current.offsetHeight || 240
      const left = Math.min(Math.max(8, anchorRect.right - w), window.innerWidth - w - 8)
      let top = anchorRect.bottom + 6
      if (top + h > window.innerHeight - 8) top = Math.max(8, anchorRect.top - h - 6)
      setPosition({ top, left })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [anchorRect])

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [onClose])

  useEffect(() => {
    const first = panelRef.current?.querySelector<HTMLElement>('[aria-checked="true"], .gm-setter-opt')
    first?.focus()
  }, [])

  function toggleMulti(value: string): void {
    setPendingMulti((cur) => (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]))
  }

  let lastGroup: string | undefined
  const items = options.map((o) => {
    const showGroup = Boolean(o.group) && o.group !== lastGroup
    lastGroup = o.group
    const on = props.multi ? pendingMulti.includes(o.value) : o.value === props.current
    return (
      <div key={o.value}>
        {showGroup && <p className="gm-setter-group">{o.group}</p>}
        <button
          type="button"
          className="gm-setter-opt"
          role={props.multi ? 'menuitemcheckbox' : 'menuitemradio'}
          aria-checked={on}
          onClick={() => { if (props.multi) toggleMulti(o.value); else props.onPick(o.value) }}
        >
          {o.icon && <span aria-hidden="true" className="material-symbols-outlined icon-fill">{o.icon}</span>}
          {o.label}
          <span aria-hidden="true" className="material-symbols-outlined gm-setter-check">check</span>
        </button>
      </div>
    )
  })

  return (
    <>
      <div className="gm-setter-scrim" onClick={onClose} />
      <div
        ref={panelRef}
        className={`gm-setter${props.multi ? ' gm-setter-multi' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        style={position ? { position: 'fixed', top: position.top, left: position.left } : undefined}
      >
        <p className="gm-setter-title">{title}</p>
        <div className="gm-setter-opts" role="menu" aria-label={ariaLabel}>{items}</div>
        {props.multi && (
          <div className="gm-setter-foot">
            <button type="button" className="gm-setter-clear" onClick={() => setPendingMulti([])}>Clear</button>
            <button type="button" className="btn-pill btn-pill-primary gm-setter-apply" onClick={() => props.onApply(pendingMulti)}>Apply</button>
          </div>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors from this file (not imported anywhere yet — Task 9 wires it in at six call sites).

- [ ] **Step 3: Commit**

```bash
git add app/events/\[id\]/guests/GuestPicker.tsx
git commit -m "feat(guests): add reusable GuestPicker sheet/popover component"
```

---

### Task 6: `GuestFormModal` — add/edit guest, functions, tags, remove

**Files:**
- Create: `app/events/[id]/guests/GuestFormModal.tsx`

**Interfaces:**
- Consumes: `GuestRow`, `GuestTagOption`, `RsvpStatusOption`, `SubEventOption` from Task 1; `POST /api/events/[id]/guests`, `PATCH`/`DELETE /api/events/[id]/guests/[guestId]` from Task 2.
- Produces: `<GuestFormModal eventId mode guest rsvpStatuses subEvents tags onClose onSaved onRemoved onCreateTag flashToast />` — used by Task 9.

- [ ] **Step 1: Write the form modal**

Create `app/events/[id]/guests/GuestFormModal.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { GuestRow, GuestTagOption, RsvpStatusOption, SubEventOption } from '@/lib/types/guests'

interface Props {
  eventId: string
  mode: 'add' | 'edit'
  guest: GuestRow | null
  rsvpStatuses: RsvpStatusOption[]
  subEvents: SubEventOption[]
  tags: GuestTagOption[]
  onClose: () => void
  onSaved: (guest: GuestRow) => void
  onRemoved: (guestId: string) => void
  onCreateTag: (name: string) => Promise<GuestTagOption>
  flashToast: (message: string) => void
}

export function GuestFormModal(props: Props): React.ReactElement {
  const { eventId, mode, guest, rsvpStatuses, subEvents, tags, onClose, onSaved, onRemoved, onCreateTag, flashToast } = props
  const editing = mode === 'edit' && guest !== null

  const [name, setName] = useState(guest?.name ?? '')
  const [phone, setPhone] = useState(guest?.phone ?? '')
  const [email, setEmail] = useState(guest?.email ?? '')
  const [subEventIds, setSubEventIds] = useState<string[]>(guest?.subEventIds ?? subEvents.map((s) => s.id))
  const [tagIds, setTagIds] = useState<string[]>(guest?.tagIds ?? [])
  const [rsvpStatusId, setRsvpStatusId] = useState<string>(guest?.rsvpStatusId ?? '')
  const [tagInput, setTagInput] = useState('')
  const [tagListOpen, setTagListOpen] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [confirmingRemove, setConfirmingRemove] = useState(false)

  const availableTagSuggestions = tags.filter(
    (t) => !tagIds.includes(t.id) && t.name.toLowerCase().includes(tagInput.trim().toLowerCase())
  )
  const exactMatch = tags.find((t) => t.name.toLowerCase() === tagInput.trim().toLowerCase())

  function toggleSubEvent(id: string): void {
    setSubEventIds((cur) => (cur.includes(id) ? cur.filter((v) => v !== id) : [...cur, id]))
  }

  async function addTagByName(rawName: string): Promise<void> {
    const trimmed = rawName.trim()
    if (!trimmed) return
    const existing = tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      if (!tagIds.includes(existing.id)) setTagIds((cur) => [...cur, existing.id])
    } else {
      const created = await onCreateTag(trimmed)
      setTagIds((cur) => [...cur, created.id])
    }
    setTagInput('')
    setTagListOpen(false)
  }

  function removeTag(tagId: string): void {
    setTagIds((cur) => cur.filter((v) => v !== tagId))
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setNameError(null)
    setPhoneError(null)
    const trimmedName = name.trim()
    const digitsPhone = phone.replace(/\D/g, '')
    let bad = false
    if (digitsPhone.length !== 10) { setPhoneError('Enter a valid 10-digit mobile number.'); bad = true }
    if (!trimmedName) { setNameError('Please enter a name.'); bad = true }
    if (bad) return

    setSaving(true)
    try {
      if (editing && guest) {
        const res = await fetch(`/api/events/${eventId}/guests/${guest.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            phone: digitsPhone,
            email: email.trim() || null,
            subEventIds,
            tagIds,
            ...(rsvpStatusId ? { rsvpStatusId } : {}),
          }),
        })
        if (!res.ok) { flashToast("Couldn't save changes."); return }
        onSaved({
          ...guest,
          name: trimmedName,
          phone: digitsPhone,
          email: email.trim() || null,
          subEventIds,
          tagIds,
          rsvpStatusId: rsvpStatusId || guest.rsvpStatusId,
        })
        flashToast('Guest updated')
      } else {
        const res = await fetch(`/api/events/${eventId}/guests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmedName, phone: digitsPhone, email: email.trim() || null, subEventIds, tagIds }),
        })
        const data: { guest?: GuestRow; error?: string } = await res.json()
        if (!res.ok || !data.guest) { flashToast("Couldn't add guest."); return }
        onSaved(data.guest)
        flashToast('Guest added')
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(): Promise<void> {
    if (!guest) return
    setRemoving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/guests/${guest.id}`, { method: 'DELETE' })
      if (!res.ok) { flashToast("Couldn't remove guest."); return }
      onRemoved(guest.id)
      flashToast('Guest removed')
      onClose()
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="modal-scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card lg-glass-card" role="dialog" aria-modal="true" aria-labelledby="gm-guest-h">
        <header className="modal-head">
          <div className="modal-head-lead">
            <h2 className="modal-title" id="gm-guest-h">{editing ? 'Edit guest' : 'Add guest'}</h2>
          </div>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <span aria-hidden="true" className="material-symbols-outlined">close</span>
          </button>
        </header>

        <form onSubmit={(e) => { void handleSubmit(e) }} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="gm-f-name">Full name <span aria-hidden="true" className="req-mark">*</span></label>
            <input id="gm-f-name" className="form-input" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            {nameError && (
              <p className="form-error" role="alert"><span aria-hidden="true" className="material-symbols-outlined">error</span> {nameError}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="gm-f-phone">Mobile number <span aria-hidden="true" className="req-mark">*</span></label>
            <div className="form-input form-input-group">
              <span className="form-input-prefix" aria-hidden="true">+91</span>
              <input
                id="gm-f-phone" className="form-input-field" type="tel" inputMode="numeric" autoComplete="tel" maxLength={10}
                placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              />
            </div>
            {phoneError && (
              <p className="form-error" role="alert"><span aria-hidden="true" className="material-symbols-outlined">error</span> {phoneError}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="gm-f-email">Email <span className="form-label-opt">(optional)</span></label>
            <input id="gm-f-email" className="form-input" type="email" autoComplete="email" placeholder="name@example.com" value={email ?? ''} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="form-group">
            <span className="form-label" id="gm-f-func-label">Invited to functions</span>
            <p className="gm-field-help">Controls which functions this guest sees and RSVPs to.</p>
            <div className="gm-func-list" role="group" aria-labelledby="gm-f-func-label">
              {subEvents.map((se) => (
                <label key={se.id} className="form-check">
                  <input type="checkbox" checked={subEventIds.includes(se.id)} onChange={() => toggleSubEvent(se.id)} />
                  <span>{se.label}</span>
                </label>
              ))}
            </div>
            {subEventIds.length === 0 && (
              <p className="form-error" role="status"><span aria-hidden="true" className="material-symbols-outlined">warning</span> This guest won&apos;t see any functions.</p>
            )}
            {subEventIds.length > 0 && (
              <p className="gm-func-preview" aria-live="polite">
                This guest will see: {subEvents.filter((s) => subEventIds.includes(s.id)).map((s) => s.label).join(', ')}
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label gm-tags-label" htmlFor="gm-f-tag-input">
              Tags <span className="form-label-opt">(optional)</span>
            </label>
            <div className="tag-input">
              <span className="tag-input-chips">
                {tagIds.map((tagId) => {
                  const t = tags.find((x) => x.id === tagId)
                  if (!t) return null
                  return (
                    <span key={tagId} className="tag-chip tag-chip-removable">
                      <span className="tag-chip-label">{t.name}</span>
                      <button type="button" className="tag-chip-x" aria-label={`Remove tag ${t.name}`} onClick={() => removeTag(tagId)}>
                        <span aria-hidden="true" className="material-symbols-outlined">close</span>
                      </button>
                    </span>
                  )
                })}
              </span>
              <input
                id="gm-f-tag-input" className="tag-input-field" type="text" role="combobox"
                aria-expanded={tagListOpen} aria-autocomplete="list" autoComplete="off"
                placeholder="Add a tag…" value={tagInput}
                onChange={(e) => { setTagInput(e.target.value); setTagListOpen(true) }}
                onFocus={() => setTagListOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); void addTagByName(tagInput) }
                  else if (e.key === 'Backspace' && !tagInput && tagIds.length) removeTag(tagIds[tagIds.length - 1])
                }}
              />
            </div>
            {tagListOpen && (availableTagSuggestions.length > 0 || (tagInput.trim() && !exactMatch)) && (
              <ul className="tag-input-listbox" role="listbox" aria-label="Tag suggestions">
                {availableTagSuggestions.map((t) => (
                  <li key={t.id} className="tag-input-option" role="option" aria-selected={false} onClick={() => { void addTagByName(t.name) }}>
                    <span aria-hidden="true" className="material-symbols-outlined">sell</span> {t.name}
                  </li>
                ))}
                {tagInput.trim() && !exactMatch && (
                  <li className="tag-input-option tag-input-option-new" role="option" aria-selected={false} onClick={() => { void addTagByName(tagInput) }}>
                    <span aria-hidden="true" className="material-symbols-outlined">add</span> Create &ldquo;{tagInput.trim()}&rdquo;
                  </li>
                )}
              </ul>
            )}
          </div>

          {editing && (
            <div className="form-group">
              <span className="form-label" id="gm-f-rsvp-label">RSVP status</span>
              <div className="radio-pill-group gm-rsvp-pills" role="radiogroup" aria-labelledby="gm-f-rsvp-label">
                {rsvpStatuses.map((s) => (
                  <button
                    key={s.id} type="button" role="radio" aria-checked={rsvpStatusId === s.id}
                    className={`radio-pill radio-pill--${s.slug}${rsvpStatusId === s.id ? ' is-checked' : ''}`}
                    onClick={() => setRsvpStatusId(s.id)}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined icon-fill">{s.iconName}</span> {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="modal-actions">
            {editing && !confirmingRemove && (
              <button type="button" className="btn-pill btn-pill-danger gm-remove-btn" onClick={() => setConfirmingRemove(true)}>
                <span aria-hidden="true" className="material-symbols-outlined">person_remove</span> Remove
              </button>
            )}
            <button type="button" className="btn-pill btn-pill-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-pill btn-pill-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Save guest'}
            </button>
          </div>
        </form>

        {confirmingRemove && guest && (
          <div className="modal-scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setConfirmingRemove(false) }}>
            <div className="modal-card lg-glass-card modal-confirm-cautionary" role="alertdialog" aria-modal="true" aria-labelledby="gm-remove-h">
              <button className="modal-close modal-close--corner" type="button" aria-label="Close" onClick={() => setConfirmingRemove(false)}>
                <span aria-hidden="true" className="material-symbols-outlined">close</span>
              </button>
              <span className="modal-confirm-icon is-cautionary" aria-hidden="true"><span className="material-symbols-outlined">person_remove</span></span>
              <h2 className="modal-confirm-title" id="gm-remove-h">Remove this guest?</h2>
              <p className="modal-confirm-text">Remove <strong>{guest.name}</strong> from your list. Their RSVP, if any, will be discarded. You can add them again later.</p>
              <div className="modal-actions">
                <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setConfirmingRemove(false)}>Cancel</button>
                <button type="button" className="btn-pill btn-pill-primary" disabled={removing} onClick={() => { void handleRemove() }}>
                  {removing ? 'Removing…' : 'Remove guest'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors from this file (not imported anywhere yet — Task 9 wires it in).

- [ ] **Step 3: Commit**

```bash
git add app/events/\[id\]/guests/GuestFormModal.tsx
git commit -m "feat(guests): add GuestFormModal (add/edit/remove, functions, tags)"
```

---

### Task 7: `ImportCsvModal` — template, upload, live preview, validate

**Files:**
- Create: `app/events/[id]/guests/ImportCsvModal.tsx`

**Interfaces:**
- Consumes: `GuestRow` from Task 1; `POST /api/events/[id]/guests/import` from Task 4.
- Produces: `<ImportCsvModal eventId existingPhones onClose onImported flashToast />` — used by Task 9.

- [ ] **Step 1: Write the import modal**

Create `app/events/[id]/guests/ImportCsvModal.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { GuestRow } from '@/lib/types/guests'

interface Props {
  eventId: string
  existingPhones: Set<string>
  onClose: () => void
  onImported: (guests: GuestRow[], skippedDuplicates: number) => void
  flashToast: (message: string) => void
}

interface ParsedRow {
  name: string
  phone: string
  email: string | null
  status: 'valid' | 'error' | 'duplicate'
  errorMessage?: string
}

/** Minimal RFC4180 parser — handles quoted fields with embedded commas/newlines. No library needed for a 3-column format. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some((f) => f.trim() !== '')) rows.push(row)
      row = []
    } else {
      field += c
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    if (row.some((f) => f.trim() !== '')) rows.push(row)
  }
  return rows
}

function validateRows(rows: string[][], existingPhones: Set<string>): ParsedRow[] {
  const [header, ...dataRows] = rows
  const nameIdx = header.findIndex((h) => h.trim().toLowerCase() === 'name')
  const phoneIdx = header.findIndex((h) => h.trim().toLowerCase() === 'phone')
  const emailIdx = header.findIndex((h) => h.trim().toLowerCase() === 'email')
  const seenPhones = new Set<string>()
  return dataRows.map((cells): ParsedRow => {
    const name = (cells[nameIdx] ?? '').trim()
    const phoneDigits = (cells[phoneIdx] ?? '').replace(/\D/g, '')
    const email = emailIdx > -1 ? (cells[emailIdx] ?? '').trim() || null : null
    if (!name) return { name, phone: phoneDigits, email, status: 'error', errorMessage: 'Missing name' }
    if (phoneDigits.length !== 10) return { name, phone: phoneDigits, email, status: 'error', errorMessage: 'Invalid phone number' }
    if (existingPhones.has(phoneDigits) || seenPhones.has(phoneDigits)) return { name, phone: phoneDigits, email, status: 'duplicate' }
    seenPhones.add(phoneDigits)
    return { name, phone: phoneDigits, email, status: 'valid' }
  })
}

function downloadTemplate(): void {
  const blob = new Blob(['Name,Phone,Email\n'], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'evenzi-guest-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function ImportCsvModal({ eventId, existingPhones, onClose, onImported, flashToast }: Props): React.ReactElement {
  const [fileName, setFileName] = useState<string | null>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const errorCount = rows.filter((r) => r.status === 'error').length
  const duplicateCount = rows.filter((r) => r.status === 'duplicate').length
  const validCount = rows.filter((r) => r.status === 'valid').length
  const canImport = rows.length > 0 && errorCount === 0 && consent && !importing

  async function handleFile(file: File): Promise<void> {
    setParseError(null)
    setRows([])
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
      setParseError("That doesn't look like a CSV. Export your sheet as .csv and try again.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setParseError('That file is over 5 MB. Trim it and try again.')
      return
    }
    const text = await file.text()
    const parsed = parseCsv(text)
    if (parsed.length < 2) {
      setParseError('No guest rows found in that file.')
      return
    }
    setFileName(file.name)
    setRows(validateRows(parsed, existingPhones))
  }

  async function handleImport(): Promise<void> {
    setImporting(true)
    try {
      const validRows = rows.filter((r) => r.status === 'valid').map((r) => ({ name: r.name, phone: r.phone, email: r.email }))
      const res = await fetch(`/api/events/${eventId}/guests/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guests: validRows }),
      })
      const data: { inserted?: GuestRow[]; skippedDuplicates?: number; error?: string } = await res.json()
      if (!res.ok || !data.inserted) { flashToast('Import failed. Try again.'); return }
      onImported(data.inserted, (data.skippedDuplicates ?? 0) + duplicateCount)
      onClose()
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="modal-scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card lg-glass-card" role="dialog" aria-modal="true" aria-labelledby="gm-import-h">
        <header className="modal-head">
          <div className="modal-head-lead">
            <h2 className="modal-title" id="gm-import-h">Import guests from a spreadsheet</h2>
            <p className="modal-sub">
              CSV with columns: <strong>Name, Phone, Email</strong>.{' '}
              <a href="#" className="gm-template-link" onClick={(e) => { e.preventDefault(); downloadTemplate() }}>Download template</a>
            </p>
          </div>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <span aria-hidden="true" className="material-symbols-outlined">close</span>
          </button>
        </header>

        <label
          className={`dp-dropzone${dragOver ? ' is-dragover' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const f = e.dataTransfer.files[0]
            if (f) void handleFile(f)
          }}
        >
          <span className="dp-dropzone-icon" aria-hidden="true"><span className="material-symbols-outlined">upload_file</span></span>
          <p className="dp-dropzone-title">{fileName ?? 'Tap to choose a CSV file'}</p>
          <p className="dp-dropzone-hint">{fileName ? 'Tap to choose a different file' : 'or drag it here · max 5 MB'}</p>
          <input
            type="file" accept=".csv,text/csv" className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f) }}
          />
        </label>

        {parseError && (
          <p className="form-error" role="alert"><span aria-hidden="true" className="material-symbols-outlined">error</span> {parseError}</p>
        )}

        {rows.length > 0 && (
          <>
            <p className="gm-import-result">
              <span aria-hidden="true" className="material-symbols-outlined">task_alt</span>
              {validCount} new guest{validCount === 1 ? '' : 's'}
              {duplicateCount > 0 && ` · ${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'} skipped`}
              {errorCount > 0 && ` · ${errorCount} row${errorCount === 1 ? '' : 's'} with errors`}
            </p>
            <div className="gm-import-preview">
              <table className="w-full text-sm">
                <thead>
                  <tr><th className="text-left">Name</th><th className="text-left">Phone</th><th className="text-left">Email</th><th className="text-left">Status</th></tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.name || '—'}</td>
                      <td>{r.phone || '—'}</td>
                      <td>{r.email || '—'}</td>
                      <td>
                        {r.status === 'valid' && <span className="text-success">Ready</span>}
                        {r.status === 'duplicate' && <span>Duplicate — skipped</span>}
                        {r.status === 'error' && <span className="text-error">{r.errorMessage}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <label className="form-check gm-consent">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>I confirm I have these guests&apos; consent to add their contact details to Evenzi.</span>
        </label>

        <div className="modal-actions">
          <button type="button" className="btn-pill btn-pill-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-pill btn-pill-primary" disabled={!canImport} onClick={() => { void handleImport() }}>
            {importing ? 'Importing…' : 'Import guests'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

Note: `.gm-import-preview` has no dedicated scroll-height rule in `guests.css` (the prototype never needed one — its import was simulated with no real row list). If the live table overflows on a large CSV, that's a real, testable issue — Task 10's breakpoint pass must check it specifically and add a `max-height`/`overflow-y` rule to `designs/pages/guests/guests.css` (`.gm-import-preview { max-height: 320px; overflow-y: auto; }`) if it does. Not pre-emptively added here since it may not be needed.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors from this file (not imported anywhere yet — Task 9 wires it in).

- [ ] **Step 3: Commit**

```bash
git add app/events/\[id\]/guests/ImportCsvModal.tsx
git commit -m "feat(guests): add ImportCsvModal (template, upload, live preview, validation)"
```

---

### Task 8: `TagManagerModal` — list/add/delete per-event tags

**Files:**
- Create: `app/events/[id]/guests/TagManagerModal.tsx`

**Interfaces:**
- Consumes: `GuestRow`, `GuestTagOption` from Task 1; `POST /api/events/[id]/guest-tags`, `DELETE /api/events/[id]/guest-tags/[tagId]` from Task 3.
- Produces: `<TagManagerModal eventId tags guests onClose onCreated onDeleted flashToast />` — used by Task 9.

- [ ] **Step 1: Write the tag manager modal**

Create `app/events/[id]/guests/TagManagerModal.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { GuestRow, GuestTagOption } from '@/lib/types/guests'

interface Props {
  eventId: string
  tags: GuestTagOption[]
  guests: GuestRow[]
  onClose: () => void
  onCreated: (tag: GuestTagOption) => void
  onDeleted: (tagId: string) => void
  flashToast: (message: string) => void
}

export function TagManagerModal({ eventId, tags, guests, onClose, onCreated, onDeleted, flashToast }: Props): React.ReactElement {
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  function tagCount(tagId: string): number {
    return guests.filter((g) => g.tagIds.includes(tagId)).length
  }

  async function handleAdd(): Promise<void> {
    const trimmed = input.trim()
    if (!trimmed || adding) return
    setAdding(true)
    try {
      const res = await fetch(`/api/events/${eventId}/guest-tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const data: { tag?: GuestTagOption; error?: string } = await res.json()
      if (!res.ok || !data.tag) { flashToast("Couldn't create tag."); return }
      onCreated(data.tag)
      setInput('')
      flashToast('Tag created')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(tagId: string): Promise<void> {
    setDeleting(true)
    try {
      const res = await fetch(`/api/events/${eventId}/guest-tags/${tagId}`, { method: 'DELETE' })
      if (!res.ok) { flashToast("Couldn't remove tag."); return }
      onDeleted(tagId)
      flashToast('Tag removed')
    } finally {
      setDeleting(false)
      setConfirmingDelete(null)
    }
  }

  return (
    <div className="modal-scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card lg-glass-card" role="dialog" aria-modal="true" aria-labelledby="gm-tagman-h">
        <header className="modal-head">
          <div className="modal-head-lead">
            <h2 className="modal-title" id="gm-tagman-h">Manage tags</h2>
            <p className="modal-sub">Used across all your guests.</p>
          </div>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <span aria-hidden="true" className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="gm-tagman-add">
          <input
            className="form-input" type="text" placeholder="New tag name" autoComplete="off"
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleAdd() } }}
            aria-label="New tag name"
          />
          <button type="button" className="btn-pill btn-pill-secondary" disabled={adding} onClick={() => { void handleAdd() }}>Add</button>
        </div>

        <ul className="gm-tagman-list" aria-label="Tags">
          {tags.length === 0 && <li className="gm-tagman-empty">No tags yet.</li>}
          {tags.map((t) => (
            <li key={t.id} className="gm-tagman-row">
              {confirmingDelete === t.id ? (
                <div className="gm-tagman-confirm">
                  <span className="gm-tagman-c-msg">
                    Remove &ldquo;{t.name}&rdquo;{tagCount(t.id) > 0 ? ` from ${tagCount(t.id)} guest${tagCount(t.id) === 1 ? '' : 's'}` : ''}? They keep their other tags.
                  </span>
                  <button type="button" className="gm-tagman-c-cancel" onClick={() => setConfirmingDelete(null)}>Cancel</button>
                  <button type="button" className="gm-tagman-c-del" disabled={deleting} onClick={() => { void handleDelete(t.id) }}>Remove</button>
                </div>
              ) : (
                <>
                  <span className="gm-tagman-name">{t.name}</span>
                  <span className="gm-tagman-count">{tagCount(t.id)} guest{tagCount(t.id) === 1 ? '' : 's'}</span>
                  <button type="button" className="gm-tagman-del" aria-label={`Remove tag ${t.name}`} onClick={() => setConfirmingDelete(t.id)}>
                    <span aria-hidden="true" className="material-symbols-outlined">delete</span>
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>

        <div className="modal-actions">
          <button type="button" className="btn-pill btn-pill-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors from this file (not imported anywhere yet — Task 9 wires it in).

- [ ] **Step 3: Commit**

```bash
git add app/events/\[id\]/guests/TagManagerModal.tsx
git commit -m "feat(guests): add TagManagerModal (list/add/delete per-event tags)"
```

---

### Task 9: Rewrite `page.tsx` + build `GuestManagementClient` (final integration)

**Files:**
- Rewrite: `app/events/[id]/guests/page.tsx`
- Create: `app/events/[id]/guests/GuestManagementClient.tsx`

This is the largest task — it's the one place all five preceding pieces (`GuestPicker`, `GuestFormModal`, `ImportCsvModal`, `TagManagerModal`, and the six API routes) come together, and `page.tsx`'s fetch shape only makes sense paired with the client component that consumes it. Splitting them into two tasks would leave neither independently testable (per Task Right-Sizing — this mirrors how the User Settings plan's Task 7 combined the page rewrite with its remaining section components).

**Interfaces:**
- Consumes: everything from Tasks 1–8.
- Produces: the live `/events/[id]/guests` page.

- [ ] **Step 1: Rewrite the server page**

Replace the full contents of `app/events/[id]/guests/page.tsx` with:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import { GuestManagementClient } from './GuestManagementClient'
import type {
  GuestManagementInitialData,
  GuestRow,
  GuestTagOption,
  RsvpStatusOption,
  SubEventOption,
} from '@/lib/types/guests'

export default async function GuestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: event } = await supabase.from('events').select('id, name').eq('id', id).single()
  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

  const [
    { data: guestRows },
    { data: subEventLinkRows },
    { data: tagLinkRows },
    { data: subEventRows },
    { data: tagRows },
    { data: statusRows },
  ] = await Promise.all([
    supabase.from('event_guests')
      .select('id, name, phone, email, rsvp_status_id, invited, party_size, notes, created_at')
      .eq('event_id', id)
      .order('name', { ascending: true }),
    supabase.from('event_guest_sub_events').select('guest_id, sub_event_id').eq('event_id', id),
    supabase.from('event_guest_tag_links').select('guest_id, tag_id').eq('event_id', id),
    supabase.from('event_sub_events').select('id, custom_name, event_sub_type_id').eq('event_id', id).order('display_order', { ascending: true }),
    supabase.from('event_guest_tags').select('id, name, is_custom').eq('event_id', id).order('display_order', { ascending: true }),
    supabase.schema('config').from('rsvp_statuses').select('id, slug, name, icon_name, category').order('display_order', { ascending: true }),
  ])

  // Resolve sub-event display names off the config catalog — same two-step
  // pattern as app/events/[id]/page.tsx (cross-schema embeds aren't available).
  const typeIds = Array.from(
    new Set((subEventRows ?? []).map((se) => se.event_sub_type_id).filter((t): t is string => t != null))
  )
  const typeNamesById: Record<string, string> = {}
  if (typeIds.length > 0) {
    const { data: typeRows } = await supabase.schema('config').from('event_sub_types').select('id, name').in('id', typeIds)
    for (const t of typeRows ?? []) typeNamesById[t.id] = t.name
  }
  const subEvents: SubEventOption[] = (subEventRows ?? []).map((se) => ({
    id: se.id,
    label: se.custom_name ?? (se.event_sub_type_id ? typeNamesById[se.event_sub_type_id] ?? 'Function' : 'Function'),
  }))

  const subEventsByGuest: Record<string, string[]> = {}
  for (const row of subEventLinkRows ?? []) {
    (subEventsByGuest[row.guest_id] ??= []).push(row.sub_event_id)
  }
  const tagsByGuest: Record<string, string[]> = {}
  for (const row of tagLinkRows ?? []) {
    (tagsByGuest[row.guest_id] ??= []).push(row.tag_id)
  }

  const guests: GuestRow[] = (guestRows ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    phone: g.phone,
    email: g.email,
    rsvpStatusId: g.rsvp_status_id,
    invited: g.invited,
    partySize: g.party_size,
    notes: g.notes,
    subEventIds: subEventsByGuest[g.id] ?? [],
    tagIds: tagsByGuest[g.id] ?? [],
    createdAt: g.created_at,
  }))

  const rsvpStatuses: RsvpStatusOption[] = (statusRows ?? []).map((s) => ({
    id: s.id,
    slug: s.slug as RsvpStatusOption['slug'],
    name: s.name,
    iconName: s.icon_name ?? 'help',
    category: s.category,
  }))

  const tags: GuestTagOption[] = (tagRows ?? []).map((t) => ({ id: t.id, name: t.name, isCustom: t.is_custom }))

  const initialData: GuestManagementInitialData = { eventId: id, eventName, guests, rsvpStatuses, subEvents, tags }

  return (
    <div data-page="guests">
      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: eventName.toUpperCase(), href: `/events/${id}` },
          { label: 'GUESTS' },
        ]}
        backHref={`/events/${id}`}
      />
      <GuestManagementClient initialData={initialData} />
      <PageFooter />
    </div>
  )
}
```

- [ ] **Step 2: Write the client orchestrator**

Create `app/events/[id]/guests/GuestManagementClient.tsx`:

```tsx
'use client'

import { useMemo, useState } from 'react'
import type { GuestManagementInitialData, GuestRow, GuestTagOption } from '@/lib/types/guests'
import { GuestPicker, type PickerOption } from './GuestPicker'
import { GuestFormModal } from './GuestFormModal'
import { ImportCsvModal } from './ImportCsvModal'
import { TagManagerModal } from './TagManagerModal'

type StatusFilter = 'all' | 'confirmed' | 'declined' | 'pending' | 'maybe'
type SortKey = 'name' | 'recent' | 'status'

const SORT_OPTIONS: PickerOption[] = [
  { value: 'name', label: 'Name A–Z' },
  { value: 'recent', label: 'Recently added' },
  { value: 'status', label: 'Status · needs attention' },
]
const STATUS_SORT_ORDER: Record<string, number> = { pending: 0, maybe: 1, confirmed: 2, declined: 3 }
const STATUS_CHIPS: readonly [StatusFilter, string][] = [
  ['all', 'All'], ['confirmed', 'Confirmed'], ['declined', 'Declined'], ['pending', 'Pending'], ['maybe', 'Maybe'],
]

type PickerState =
  | { kind: 'rsvp'; guestId: string; anchorRect: DOMRect }
  | { kind: 'sort'; anchorRect: DOMRect }
  | { kind: 'filter'; anchorRect: DOMRect }
  | { kind: 'assign'; guestId: string; anchorRect: DOMRect }
  | { kind: 'bulk-tag'; anchorRect: DOMRect }
  | { kind: 'bulk-assign'; anchorRect: DOMRect }
  | null

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return (a + b).toUpperCase()
}
function fmtPhone(p: string): string {
  return p ? `+91 ${p.replace(/(\d{5})(\d{5})/, '$1 $2')}` : 'No phone'
}

export function GuestManagementClient({ initialData }: { initialData: GuestManagementInitialData }): React.ReactElement {
  const { eventId, guests: initialGuests, rsvpStatuses, subEvents, tags: initialTags } = initialData

  const [guests, setGuests] = useState<GuestRow[]>(initialGuests)
  const [tags, setTags] = useState<GuestTagOption[]>(initialTags)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [subFilters, setSubFilters] = useState<string[]>([])
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [onlyUnassigned, setOnlyUnassigned] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [picker, setPicker] = useState<PickerState>(null)
  const [formModal, setFormModal] = useState<{ mode: 'add' | 'edit'; guest: GuestRow | null } | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [tagManagerOpen, setTagManagerOpen] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)

  const statusById = useMemo(() => new Map(rsvpStatuses.map((s) => [s.id, s])), [rsvpStatuses])
  const tagById = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags])

  function flashToast(message: string): void {
    setToast(message)
    window.setTimeout(() => setToast(null), 2500)
  }

  const counts = useMemo(() => {
    const c = { total: guests.length, confirmed: 0, declined: 0, pending: 0, maybe: 0 }
    for (const g of guests) {
      const slug = statusById.get(g.rsvpStatusId)?.slug
      if (slug && slug in c) (c as Record<string, number>)[slug] += 1
    }
    return c
  }, [guests, statusById])

  const zeroAssignedCount = useMemo(() => guests.filter((g) => g.subEventIds.length === 0).length, [guests])

  const visibleGuests = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = guests.filter((g) => {
      if (statusFilter !== 'all' && statusById.get(g.rsvpStatusId)?.slug !== statusFilter) return false
      if (onlyUnassigned && g.subEventIds.length !== 0) return false
      if (subFilters.length && !subFilters.some((s) => g.subEventIds.includes(s))) return false
      if (tagFilters.length && !tagFilters.some((t) => g.tagIds.includes(t))) return false
      if (!q) return true
      return g.name.toLowerCase().includes(q) || g.phone.includes(q) || (g.email ?? '').toLowerCase().includes(q)
    })
    return [...filtered].sort((a, b) => {
      if (sortKey === 'recent') return b.createdAt.localeCompare(a.createdAt)
      if (sortKey === 'status') {
        const da = STATUS_SORT_ORDER[statusById.get(a.rsvpStatusId)?.slug ?? 'pending'] ?? 0
        const db = STATUS_SORT_ORDER[statusById.get(b.rsvpStatusId)?.slug ?? 'pending'] ?? 0
        return da !== db ? da - db : a.name.localeCompare(b.name)
      }
      return a.name.localeCompare(b.name)
    })
  }, [guests, search, statusFilter, subFilters, tagFilters, onlyUnassigned, sortKey, statusById])

  const responded = counts.confirmed + counts.declined + counts.maybe
  const responseRate = counts.total ? Math.round((responded / counts.total) * 100) : 0

  async function patchGuest(guestId: string, patch: Partial<Pick<GuestRow, 'rsvpStatusId' | 'subEventIds'>>): Promise<void> {
    const prev = guests
    setGuests((gs) => gs.map((g) => (g.id === guestId ? { ...g, ...patch } : g)))
    try {
      const body: Record<string, unknown> = {}
      if (patch.rsvpStatusId !== undefined) body.rsvpStatusId = patch.rsvpStatusId
      if (patch.subEventIds !== undefined) body.subEventIds = patch.subEventIds
      const res = await fetch(`/api/events/${eventId}/guests/${guestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('failed')
      flashToast(patch.rsvpStatusId !== undefined ? 'RSVP updated' : 'Functions updated')
    } catch {
      setGuests(prev)
      flashToast("Couldn't update — try again")
    }
  }

  function upsertGuest(guest: GuestRow): void {
    setGuests((gs) => (gs.some((g) => g.id === guest.id) ? gs.map((g) => (g.id === guest.id ? guest : g)) : [...gs, guest]))
  }
  function removeGuestLocal(guestId: string): void {
    setGuests((gs) => gs.filter((g) => g.id !== guestId))
    setSelectedIds((s) => { const next = new Set(s); next.delete(guestId); return next })
  }

  async function createTag(name: string): Promise<GuestTagOption> {
    const res = await fetch(`/api/events/${eventId}/guest-tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const data: { tag?: GuestTagOption } = await res.json()
    if (!res.ok || !data.tag) throw new Error('failed to create tag')
    setTags((t) => [...t, data.tag as GuestTagOption])
    return data.tag
  }

  function enterSelect(): void { setSelecting(true); setSelectedIds(new Set()) }
  function exitSelect(): void { setSelecting(false); setSelectedIds(new Set()) }
  function toggleSelect(guestId: string): void {
    setSelectedIds((s) => {
      const next = new Set(s)
      if (next.has(guestId)) next.delete(guestId); else next.add(guestId)
      return next
    })
  }
  function selectAllVisible(): void {
    setSelectedIds((s) => (s.size >= visibleGuests.length ? new Set() : new Set(visibleGuests.map((g) => g.id))))
  }

  async function bulkAction(action: 'tag' | 'assign' | 'delete', payload?: { tagIds?: string[]; subEventIds?: string[] }): Promise<void> {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    const res = await fetch(`/api/events/${eventId}/guests/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, guestIds: ids, ...payload }),
    })
    if (!res.ok) { flashToast('Bulk update failed'); return }
    if (action === 'delete') {
      setGuests((gs) => gs.filter((g) => !selectedIds.has(g.id)))
      flashToast(`Removed ${ids.length} guests`)
      exitSelect()
    } else if (action === 'tag') {
      const addIds = payload?.tagIds ?? []
      setGuests((gs) => gs.map((g) => (selectedIds.has(g.id) ? { ...g, tagIds: Array.from(new Set([...g.tagIds, ...addIds])) } : g)))
      flashToast(`Tagged ${ids.length} guests`)
    } else {
      const newSubEventIds = payload?.subEventIds ?? []
      setGuests((gs) => gs.map((g) => (selectedIds.has(g.id) ? { ...g, subEventIds: newSubEventIds } : g)))
      flashToast(`Set functions for ${ids.length} guests`)
    }
  }

  async function handleBulkDelete(): Promise<void> {
    if (!window.confirm(`Remove ${selectedIds.size} guests? This can't be undone.`)) return
    await bulkAction('delete')
  }

  const zero = guests.length === 0
  const noMatches = !zero && visibleGuests.length === 0

  return (
    <main className="page-band pt-6 md:pt-8 pb-24">
      <header className="section-head reveal">
        <p className="section-head-eyebrow">Section</p>
        <div className="section-head-titlerow">
          <h1 className="section-head-title">Guest Management</h1>
        </div>
      </header>

      <section className="gm-stats reveal" aria-label="Guest list summary">
        <div className="clay-card gm-rate" role="group" aria-labelledby="gm-rate-label">
          <span className="stat-icon"><span className="material-symbols-outlined icon-fill">how_to_reg</span></span>
          <div className="min-w-0 w-full">
            <p id="gm-rate-label" className="gm-rate-cap">RSVP response rate</p>
            <p className="gm-rate-num">{responseRate}%</p>
            <div className="pf-bar gm-rate-bar"><span style={{ width: `${responseRate}%` }} /></div>
            <p className="gm-rate-sub">{responded} of {counts.total} responded</p>
          </div>
        </div>
        <div className="gm-counts" role="group" aria-label="Guest counts by status">
          {STATUS_CHIPS.map(([key, label]) => (
            <button
              key={key} type="button" className="clay-card gm-count" aria-pressed={statusFilter === key}
              onClick={() => {
                setStatusFilter(key)
                document.querySelector('.gm-list-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              <span className="gm-count-num">{key === 'all' ? counts.total : counts[key]}</span>
              <span className="gm-count-lbl">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="clay-card gm-list-card reveal" aria-label="Guest list">
        <div className="gm-toolbar">
          <div className={`form-input-search gm-search${search ? ' is-filled' : ''}`}>
            <span aria-hidden="true" className="material-symbols-outlined">search</span>
            <input
              className="form-input" type="search" placeholder="Search by name, phone, email…" aria-label="Search guests"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="form-input-search-clear" type="button" aria-label="Clear search" onClick={() => setSearch('')}>
                <span aria-hidden="true" className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
          <div className="gm-toolbar-actions">
            <button
              type="button" className="btn-pill btn-pill-secondary gm-icon-btn gm-send-btn" disabled
              title="WhatsApp sending — coming soon" aria-label="Send WhatsApp invitations (coming soon)"
            >
              <span aria-hidden="true" className="material-symbols-outlined">send</span>
              <span className="gm-btn-label">Send invites</span>
            </button>
            <button type="button" className="btn-pill btn-pill-secondary gm-icon-btn gm-import-btn" aria-label="Import guests from CSV" onClick={() => setImportOpen(true)}>
              <span aria-hidden="true" className="material-symbols-outlined">upload_file</span>
              <span className="gm-btn-label">Import</span>
            </button>
            <button
              type="button"
              className={`btn-pill btn-pill-secondary gm-icon-btn gm-filter-btn${subFilters.length + tagFilters.length > 0 ? ' is-active' : ''}`}
              aria-haspopup="true" aria-label="Filter by function or tag"
              onClick={(e) => setPicker({ kind: 'filter', anchorRect: e.currentTarget.getBoundingClientRect() })}
            >
              <span aria-hidden="true" className="material-symbols-outlined">filter_list</span>
              <span className="gm-btn-label">Filter</span>
              {subFilters.length + tagFilters.length > 0 && <span className="gm-filter-count">{subFilters.length + tagFilters.length}</span>}
            </button>
            <button
              type="button" className="btn-pill btn-pill-secondary gm-icon-btn gm-sort-btn" aria-haspopup="true" aria-label="Sort guests"
              onClick={(e) => setPicker({ kind: 'sort', anchorRect: e.currentTarget.getBoundingClientRect() })}
            >
              <span aria-hidden="true" className="material-symbols-outlined">swap_vert</span>
              <span className="gm-btn-label">{SORT_OPTIONS.find((o) => o.value === sortKey)?.label}</span>
            </button>
            <button type="button" className="btn-pill btn-pill-secondary gm-icon-btn gm-select-btn" aria-label="Select multiple guests" onClick={enterSelect}>
              <span aria-hidden="true" className="material-symbols-outlined">checklist</span>
              <span className="gm-btn-label">Select</span>
            </button>
          </div>
        </div>

        <div className="dp-filter-chips gm-filters" role="radiogroup" aria-label="Filter by RSVP status">
          {STATUS_CHIPS.map(([key, label]) => (
            <button
              key={key} type="button" className={`dp-filter-chip${statusFilter === key ? ' is-active' : ''}`}
              role="radio" aria-checked={statusFilter === key} onClick={() => setStatusFilter(key)}
            >
              {label} {key === 'all' ? counts.total : counts[key]}
            </button>
          ))}
        </div>

        {zeroAssignedCount > 0 && (
          <div className="gm-warn-banner" role="status">
            <span aria-hidden="true" className="material-symbols-outlined">warning</span>
            <span><strong>{zeroAssignedCount}</strong> guests aren&apos;t invited to any function — they&apos;ll see nothing.</span>
            <button type="button" className="gm-warn-review" onClick={() => setOnlyUnassigned((v) => !v)}>
              {onlyUnassigned ? 'Show all' : 'Review'}
            </button>
          </div>
        )}

        <div className="guest-row-head" aria-hidden="true"><span /><span>Guest</span><span className="grh-rsvp">RSVP</span></div>

        {zero && (
          <div className="empty-cta-card gm-empty">
            <span className="empty-cta-icon" aria-hidden="true"><span className="material-symbols-outlined">group_add</span></span>
            <p className="empty-cta-title">No guests yet</p>
            <p className="empty-cta-sub">Add your first guest, or import a spreadsheet to bring your whole list in at once.</p>
            <div className="gm-empty-actions">
              <button type="button" className="btn-pill btn-pill-primary" onClick={() => setFormModal({ mode: 'add', guest: null })}>
                <span aria-hidden="true" className="material-symbols-outlined">person_add</span> Add your first guest
              </button>
              <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setImportOpen(true)}>
                <span aria-hidden="true" className="material-symbols-outlined">upload_file</span> Import CSV
              </button>
            </div>
          </div>
        )}

        {noMatches && (
          <div className="gm-empty gm-empty-filtered">
            <span className="empty-cta-icon" aria-hidden="true"><span className="material-symbols-outlined">search_off</span></span>
            <p className="empty-cta-title">No guests match</p>
            <p className="empty-cta-sub">{search ? `Nothing matches "${search}".` : 'Try a different search or filter.'}</p>
            <button
              type="button" className="btn-pill btn-pill-secondary"
              onClick={() => { setSearch(''); setStatusFilter('all'); setSubFilters([]); setTagFilters([]); setOnlyUnassigned(false) }}
            >
              Clear filters
            </button>
          </div>
        )}

        {!zero && !noMatches && (
          <ul className="guest-list" role="list" aria-label="Guests">
            {visibleGuests.map((g) => {
              const status = statusById.get(g.rsvpStatusId)
              const assignedCount = g.subEventIds.length
              const isSelected = selectedIds.has(g.id)
              return (
                <li key={g.id} className={`guest-row${isSelected ? ' is-selected' : ''}`}>
                  <div className="guest-row-surface">
                    <span className="guest-row-avatar" aria-hidden="true">{initials(g.name)}</span>
                    <button
                      type="button" className="guest-row-id"
                      role={selecting ? 'checkbox' : undefined} aria-checked={selecting ? isSelected : undefined}
                      aria-label={selecting ? `Select ${g.name}` : `Edit ${g.name}`}
                      onClick={() => (selecting ? toggleSelect(g.id) : setFormModal({ mode: 'edit', guest: g }))}
                    >
                      <span className="guest-row-name" title={g.name}>{g.name}</span>
                      <span className="guest-row-contact">{fmtPhone(g.phone)} · {g.email || 'No email'}</span>
                    </button>
                    <div className="guest-row-meta">
                      {!g.invited && (
                        <span className="guest-invite-chip guest-invite-none">
                          <span aria-hidden="true" className="material-symbols-outlined">schedule_send</span> Not invited
                        </span>
                      )}
                      {assignedCount !== subEvents.length && (
                        <span
                          className={`guest-assign-chip${assignedCount === 0 ? ' is-none' : ''}`}
                          title={assignedCount === 0 ? 'Not invited to any function' : `${assignedCount} of ${subEvents.length} functions`}
                        >
                          <span aria-hidden="true" className="material-symbols-outlined">{assignedCount === 0 ? 'event_busy' : 'event'}</span>
                          {assignedCount}/{subEvents.length}
                        </span>
                      )}
                      {g.tagIds.slice(0, 2).map((tagId) => {
                        const t = tagById.get(tagId)
                        return t ? <span key={tagId} className="tag-chip"><span className="tag-chip-label">{t.name}</span></span> : null
                      })}
                      {g.tagIds.length > 2 && <span className="tag-chip tag-chip-more">+{g.tagIds.length - 2}</span>}
                    </div>
                  </div>
                  <button
                    type="button" className={`guest-row-rsvp status-badge status-${status?.slug ?? 'pending'}`}
                    aria-haspopup="true" aria-label={`RSVP for ${g.name}: ${status?.name ?? 'Pending'}. Tap to change.`}
                    onClick={(e) => setPicker({ kind: 'rsvp', guestId: g.id, anchorRect: e.currentTarget.getBoundingClientRect() })}
                  >
                    <span className="status-dot" aria-hidden="true" /> {status?.name ?? 'Pending'}
                    <span aria-hidden="true" className="material-symbols-outlined">expand_more</span>
                  </button>
                  {!selecting && (
                    <div className="guest-row-rail" aria-hidden="true">
                      <button
                        type="button" className="gr-swipe gr-swipe-rsvp" tabIndex={-1}
                        onClick={(e) => setPicker({ kind: 'rsvp', guestId: g.id, anchorRect: e.currentTarget.getBoundingClientRect() })}
                      >
                        <span aria-hidden="true" className="material-symbols-outlined">how_to_reg</span><span>RSVP</span>
                      </button>
                      <button
                        type="button" className="gr-swipe gr-swipe-assign" tabIndex={-1}
                        onClick={(e) => setPicker({ kind: 'assign', guestId: g.id, anchorRect: e.currentTarget.getBoundingClientRect() })}
                      >
                        <span aria-hidden="true" className="material-symbols-outlined">event</span><span>Assign</span>
                      </button>
                      <button type="button" className="gr-swipe gr-swipe-send" tabIndex={-1} disabled title="WhatsApp sending — coming soon">
                        <span aria-hidden="true" className="material-symbols-outlined">send</span><span>Send</span>
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {selecting && (
        <div className="gm-bulkbar" role="toolbar" aria-label="Bulk actions">
          <span className="gm-bulk-count">{selectedIds.size} selected</span>
          <button type="button" className="gm-bulk-selectall" onClick={selectAllVisible}>
            {selectedIds.size >= visibleGuests.length && visibleGuests.length > 0 ? 'Clear' : 'Select all'}
          </button>
          <span className="gm-bulk-div" aria-hidden="true" />
          <button
            type="button" className="gm-bulk-act" disabled={selectedIds.size === 0}
            onClick={(e) => setPicker({ kind: 'bulk-tag', anchorRect: e.currentTarget.getBoundingClientRect() })}
          >
            <span aria-hidden="true" className="material-symbols-outlined">sell</span><span>Tag</span>
          </button>
          <button
            type="button" className="gm-bulk-act" disabled={selectedIds.size === 0}
            onClick={(e) => setPicker({ kind: 'bulk-assign', anchorRect: e.currentTarget.getBoundingClientRect() })}
          >
            <span aria-hidden="true" className="material-symbols-outlined">event</span><span>Assign</span>
          </button>
          <button type="button" className="gm-bulk-act" disabled={selectedIds.size === 0} onClick={() => { void handleBulkDelete() }}>
            <span aria-hidden="true" className="material-symbols-outlined">delete</span><span>Delete</span>
          </button>
          <button type="button" className="gm-bulk-cancel" aria-label="Exit selection" onClick={exitSelect}>
            <span aria-hidden="true" className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {!selecting && (
        <button type="button" className="gm-add-fab" aria-label="Add guest" title="Add guest" onClick={() => setFormModal({ mode: 'add', guest: null })}>
          <span aria-hidden="true" className="material-symbols-outlined">person_add</span>
        </button>
      )}

      {picker?.kind === 'rsvp' && (() => {
        const g = guests.find((x) => x.id === picker.guestId)
        if (!g) return null
        return (
          <GuestPicker
            anchorRect={picker.anchorRect} ariaLabel={`Set RSVP for ${g.name}`} title={<>RSVP for <strong>{g.name}</strong></>}
            options={rsvpStatuses.map((s) => ({ value: s.id, label: s.name, icon: s.iconName }))}
            current={g.rsvpStatusId} onPick={(val) => { setPicker(null); void patchGuest(g.id, { rsvpStatusId: val }) }}
            onClose={() => setPicker(null)}
          />
        )
      })()}

      {picker?.kind === 'sort' && (
        <GuestPicker
          anchorRect={picker.anchorRect} ariaLabel="Sort guests" title="Sort by" options={SORT_OPTIONS}
          current={sortKey} onPick={(val) => { setSortKey(val as SortKey); setPicker(null) }} onClose={() => setPicker(null)}
        />
      )}

      {picker?.kind === 'filter' && (
        <GuestPicker
          anchorRect={picker.anchorRect} ariaLabel="Filter by function or tag" title="Filter" multi
          options={[
            ...subEvents.map((se) => ({ value: `se:${se.id}`, label: se.label, group: 'Functions' })),
            ...tags.map((t) => ({ value: `tag:${t.id}`, label: t.name, group: 'Tags' })),
          ]}
          current={[...subFilters.map((s) => `se:${s}`), ...tagFilters.map((t) => `tag:${t}`)]}
          onApply={(vals) => {
            setSubFilters(vals.filter((v) => v.startsWith('se:')).map((v) => v.slice(3)))
            setTagFilters(vals.filter((v) => v.startsWith('tag:')).map((v) => v.slice(4)))
            setPicker(null)
          }}
          onClose={() => setPicker(null)}
        />
      )}

      {picker?.kind === 'assign' && (() => {
        const g = guests.find((x) => x.id === picker.guestId)
        if (!g) return null
        return (
          <GuestPicker
            anchorRect={picker.anchorRect} ariaLabel={`Functions for ${g.name}`} title="Invited to functions" multi
            options={subEvents.map((se) => ({ value: se.id, label: se.label }))} current={g.subEventIds}
            onApply={(vals) => { setPicker(null); void patchGuest(g.id, { subEventIds: vals }) }} onClose={() => setPicker(null)}
          />
        )
      })()}

      {picker?.kind === 'bulk-tag' && (
        <GuestPicker
          anchorRect={picker.anchorRect} ariaLabel="Add tags to selected guests" title="Add tags" multi
          options={tags.map((t) => ({ value: t.id, label: t.name }))} current={[]}
          onApply={(vals) => { setPicker(null); void bulkAction('tag', { tagIds: vals }) }} onClose={() => setPicker(null)}
        />
      )}

      {picker?.kind === 'bulk-assign' && (
        <GuestPicker
          anchorRect={picker.anchorRect} ariaLabel="Set functions for selected guests" title="Set functions — replaces current" multi
          options={subEvents.map((se) => ({ value: se.id, label: se.label }))} current={[]}
          onApply={(vals) => { setPicker(null); void bulkAction('assign', { subEventIds: vals }) }} onClose={() => setPicker(null)}
        />
      )}

      {formModal && (
        <GuestFormModal
          eventId={eventId} mode={formModal.mode} guest={formModal.guest} rsvpStatuses={rsvpStatuses}
          subEvents={subEvents} tags={tags} onClose={() => setFormModal(null)} onSaved={upsertGuest}
          onRemoved={removeGuestLocal} onCreateTag={createTag} flashToast={flashToast}
        />
      )}

      {importOpen && (
        <ImportCsvModal
          eventId={eventId} existingPhones={new Set(guests.map((g) => g.phone))}
          onClose={() => setImportOpen(false)}
          onImported={(imported, skipped) => {
            setGuests((gs) => [...gs, ...imported])
            flashToast(`${imported.length} guests imported${skipped ? ` · ${skipped} duplicates skipped` : ''}`)
          }}
          flashToast={flashToast}
        />
      )}

      {tagManagerOpen && (
        <TagManagerModal
          eventId={eventId} tags={tags} guests={guests} onClose={() => setTagManagerOpen(false)}
          onCreated={(t) => setTags((ts) => [...ts, t])}
          onDeleted={(tagId) => {
            setTags((ts) => ts.filter((t) => t.id !== tagId))
            setGuests((gs) => gs.map((g) => ({ ...g, tagIds: g.tagIds.filter((id) => id !== tagId) })))
          }}
          flashToast={flashToast}
        />
      )}

      <div className={`bc-toast${toast ? ' is-show' : ''}`} role="status" aria-live="polite">
        <span className="bc-live" aria-hidden="true" />
        <span>{toast ?? ''}</span>
      </div>
    </main>
  )
}
```

Note: the toolbar's "Manage tags" entry point from the prototype (`data-gm-manage-tags`, opened both from the guest form's tags field and a standalone link) isn't wired to a visible trigger button in this pass — `tagManagerOpen`/`setTagManagerOpen` are fully implemented and the modal renders correctly, but no button calls `setTagManagerOpen(true)` yet. Add one in Task 10 if the live pass shows it's needed as a toolbar/menu entry (the prototype placed it as a small "Manage tags" link next to the Tags field label in the guest form modal) — flagging here rather than guessing its exact placement without seeing the live layout first.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: zero errors — all five imported components (Tasks 5–8, plus the types from Task 1) already exist and their prop types match exactly what this file passes.

Run (dev server on :3000, logged in as the test user): open `http://localhost:3000/events/<a real event id>/guests` in the browser preview and confirm the page renders without a console error (`read_console_messages`, `onlyErrors: true` → expect zero).

- [ ] **Step 4: Commit**

```bash
git add app/events/\[id\]/guests/page.tsx app/events/\[id\]/guests/GuestManagementClient.tsx
git commit -m "feat(guests): wire full Guest Management page — list, stats, toolbar, bulk, modals"
```

---

### Task 10: Full functional + breakpoint testing pass

**Files:** none (verification only — fix-forward into the files above if a bug is found; add the "Manage tags" trigger flagged in Task 9 if the live layout calls for it).

- [ ] **Step 1: Start the dev server and open the browser preview**

Start `npm run dev` (background), navigate to `http://localhost:3000/events/<a real event id>/guests`.

- [ ] **Step 2: Empty state**

With zero guests on the test event, confirm: stats bar shows 0%/0 of 0; "No guests yet" empty state renders with both CTAs; clicking "Add your first guest" opens `GuestFormModal` in add mode; clicking "Import CSV" opens `ImportCsvModal`.

- [ ] **Step 3: Add / edit / remove — real DB round-trips**

Add a guest (name, 10-digit phone, optional email, toggle a couple of functions, add a tag by creating a new one, add a second by picking an existing one). Reload the page. Confirm the guest persisted with the same name/phone/email/functions/tags (not just in-memory state). Edit the guest (change name + RSVP status via the radio pills), save, reload, confirm it persisted. Remove the guest via the modal's Remove → confirm flow, reload, confirm it's gone.

- [ ] **Step 4: RSVP setter — optimistic update + rollback**

Add a guest back. Click their RSVP badge — confirm `GuestPicker` opens positioned near the badge (popover on desktop width, check it doesn't run off-screen). Pick a different status — confirm the badge updates immediately and a toast fires. Reload and confirm the new status persisted. In `read_network_requests`, confirm the PATCH request body only contains `rsvpStatusId` (not the whole guest object).

- [ ] **Step 5: Functions / zero-assigned banner**

Uncheck all functions for one guest via the swipe-rail "Assign" action (or resize to a touch-width viewport to actually swipe, then tap Assign). Confirm the zero-assigned warning banner appears with the correct count, and that clicking "Review" filters the list down to just that guest. Reassign a function and confirm the banner's count decrements and the banner disappears once it hits zero.

- [ ] **Step 6: Search / filter / sort combined**

With at least 4 guests (mixed statuses/functions/tags), type a partial name into search — confirm the list narrows and the screen-reader-only live region text updates (`read_page` on the `aria-live="polite"` region, or inspect via `javascript_tool`). Combine search with a status filter chip — confirm both apply together (AND, not OR). Open the Filter picker, multi-select a function and a tag, Apply — confirm the filter badge count updates and the list narrows correctly. Change sort to "Status · needs attention" — confirm pending/maybe sort before confirmed/declined. Clear all filters via the "Clear filters" button in the no-matches empty state (trigger it by searching for nonsense text) and confirm every filter resets.

- [ ] **Step 7: CSV import — the exact founder-specified flow**

Click Import, click "Download template" — confirm a `evenzi-guest-template.csv` file downloads with a `Name,Phone,Email` header row. Edit it locally: add 2 valid rows, 1 row with a missing name, 1 row with an invalid (9-digit) phone, and 1 row whose phone matches a guest already in the list. Upload it. Confirm:
- The live preview table shows all 5 rows with correct per-row status (2 "Ready", 1 "Missing name", 1 "Invalid phone number", 1 "Duplicate — skipped").
- The Import button stays disabled until the consent checkbox is checked, and stays disabled the whole time because 2 rows have errors (error rows block, per design spec §5 step 5).
- Fix the source file (remove the 2 bad rows), re-upload — confirm the preview now shows 2 "Ready" + 1 "Duplicate — skipped", and Import becomes clickable once consent is checked.
- Click Import — confirm exactly 2 new guests appear in the list (not 3 — the duplicate must not be inserted), and reload to confirm they persisted in the DB.

- [ ] **Step 8: Bulk select**

Click "Select," confirm the bulk bar appears and the FAB hides. Select 2–3 guests, use "Select all" (confirm it toggles to "Clear" and back). Use the bulk Tag action — pick 2 tags, Apply — confirm both guests now show those tags (check via reload, not just UI state). Use the bulk Assign action — pick 1 function, Apply — confirm both guests' function count updates to exactly that one function (replaces, not adds — per design spec's "Set functions — replaces current" copy). Use bulk Delete — confirm the native confirm dialog fires, cancelling it does nothing, confirming it removes exactly the selected guests and reloads clean.

- [ ] **Step 9: Send invites — confirm it's genuinely inert**

Confirm the toolbar "Send invites" button, every row's swipe-rail "Send" button, and (if visible) any resend affordance are all rendered `disabled`. Attempt to click each — in `read_network_requests`, confirm zero requests fire to any endpoint. Confirm `event_guests.invited` never becomes `true` anywhere in this feature (query the table directly via the Supabase MCP after exercising every action in this test pass, or check that no guest in the list ever shows a state other than "Not invited").

- [ ] **Step 10: Tag manager**

Since Task 9 left no visible trigger for `TagManagerModal`, first decide and wire one: add a "Manage tags" link next to the Tags field label inside `GuestFormModal.tsx` (matching the prototype's placement — `designs/pages/guests/guests.html` has `<button class="gm-manage-tags-link" data-gm-manage-tags>Manage tags</button>` right next to the Tags `<label>`), wired to a new `onManageTags: () => void` prop that `GuestManagementClient` passes as `() => setTagManagerOpen(true)`. Re-run `npx tsc --noEmit` after this fix. Then: open it, add a new tag, confirm it appears in the list and immediately becomes selectable in the guest form's tag combobox without a page reload. Delete a tag that's currently applied to a guest — confirm the confirmation copy correctly states how many guests it'll be removed from, confirm it as, reload, and confirm that guest's other tags are untouched (only the deleted one is gone).

- [ ] **Step 11: Breakpoint sweep**

Using `resize_window`, check the guests page at each of: 360px, 390px, 414px, 768px, 1024px, 1440px. At each width, confirm:
- No horizontal scroll.
- Stats bar and toolbar reflow without clipping (per `guests.css`'s existing responsive rules).
- Swipe-to-reveal row actions work at a touch-simulated width (the rail is CSS scroll-snap driven — confirm the three rail buttons are reachable by scrolling the row horizontally at ≤480px; at ≥480px the rail should not be the primary interaction path since RSVP/Assign are directly clickable).
- `GuestPicker` renders as a bottom sheet below 480px (not an off-screen-positioned popover) and as an anchored popover at ≥480px, per its `window.innerWidth < 480` branch.
- The CSV import preview table (Step 7 — `.gm-import-preview`) doesn't overflow the modal at 360px; add the `max-height`/`overflow-y` CSS rule noted in Task 7 if it does.
- Bulk bar doesn't overlap the FAB (the FAB is hidden while `selecting` is true, so this shouldn't occur — confirm it doesn't).

- [ ] **Step 12: Write up findings**

If every check in Steps 2–11 passes with no bugs found (after applying the Step 10 tag-manager-trigger fix), append a `## Built` section to `docs/superpowers/specs/2026-07-29-guest-management-design.md`: what shipped, confirmation all six breakpoints were tested clean, and explicit confirmation that Send-invites stayed fully inert throughout testing. If any other check fails, fix it in the relevant file from Tasks 1–9, re-run the specific failed check, and only then proceed to the write-up.

- [ ] **Step 13: Final commit**

```bash
git add docs/superpowers/specs/2026-07-29-guest-management-design.md app/events/\[id\]/guests/GuestFormModal.tsx app/events/\[id\]/guests/GuestManagementClient.tsx
git commit -m "docs(guests): mark Guest Management build complete, all breakpoints tested; add Manage-tags trigger"
```
