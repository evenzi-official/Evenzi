# Digital Invitations Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the host's personalized invitation card persist with full fidelity (template, text, per-line sizes, background photo, uploaded card) by wiring the existing `event_invitation_cards` table to the existing editor UI.

**Architecture:** Add one column (`slot_sizes`) to the already-built card table; add three owner-scoped API routes cloned from the `website-design` and `media/upload-url` patterns; make `InvitationsClient.tsx` hydrate the saved card on load, lift per-line sizes into React state, and debounce-autosave every change. Images reuse the existing R2 private-bucket upload + `media/[...key]` signed-read proxy. No new UI primitives, no CSS changes.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, `@supabase/ssr`, Zod, Cloudflare R2 (via `lib/storage/r2`), Vitest (node env).

## Global Constraints

- Reuse before create — no forked components/primitives; zero changes to `designs/shell.css` or `designs/components.html` (behavior/persistence only). Copied verbatim from spec §6.
- Owner-only write; collaborators explicitly excluded (D57). RLS on `event_invitation_cards` is the backstop; app layer returns a clean 403.
- One card per event = the seeded default main-event card (`is_default = true AND sub_event_id IS NULL`). Sub-event cards out of scope.
- Dual-mode invariant (DB check constraint): exactly one of `template_id` / `card_upload_key` is non-null at all times.
- R2 keys are always generated server-side — never accept a client-supplied key (per `lib/storage/keys` contract).
- Slot text cap: 280 chars. Size values: `'s' | 'm' | 'l'`. Slot keys: `eyebrow, couple, invite, date, time, venue, message`.
- TypeScript strict — no `any`; explicit return types on exported functions.
- Supabase is teaching-mode: present the migration SQL to the founder and explain it before applying (founder has SQL background, new to Supabase).

---

### Task 1: Schema — `slot_sizes` column

**Files:**
- Migration (Supabase MCP `apply_migration`, name `inv_07_slot_sizes`)
- Modify: `lib/database.types.ts` (regenerated) — or wherever generated types live (`grep -rl "event_invitation_cards" --include=*.ts lib` to locate)

**Interfaces:**
- Produces: `event_invitation_cards.slot_sizes jsonb NOT NULL DEFAULT '{}'` — a `Record<slotKey,'s'|'m'|'l'>` map; absent slot ⇒ default size `'m'`.

- [ ] **Step 1: Present the SQL to the founder and explain it**

```sql
alter table public.event_invitation_cards
  add column slot_sizes jsonb not null default '{}'::jsonb;

comment on column public.event_invitation_cards.slot_sizes is
  'Per-slot text size overrides, {slotKey: s|m|l}. Absent slot = default (m).';
```
Explain: additive nullable-safe column (default `{}`), no backfill needed (existing rows get `{}`), inherits the table''s owner-only RLS, no new index (only read via the owner-filtered single-card fetch).

- [ ] **Step 2: Apply the migration** via Supabase MCP `apply_migration` (project `smjkbmkxweevqpvygabe`), name `inv_07_slot_sizes`.

- [ ] **Step 3: Verify** — run `get_advisors` (security + performance); expect no new findings attributable to this column. Confirm the column exists:
```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema='public' and table_name='event_invitation_cards' and column_name='slot_sizes';
```
Expected: one row, `jsonb`, `NO`, `'{}'::jsonb`.

- [ ] **Step 4: Regenerate types** — Supabase MCP `generate_typescript_types`, write into the existing generated types file. Confirm `slot_sizes` appears on the `event_invitation_cards` Row/Insert/Update types and `tsc --noEmit` is clean.

- [ ] **Step 5: Commit**

```bash
git add lib/database.types.ts docs/data-model/DATA-MODEL.md
git commit -m "feat(invitations): add slot_sizes column for per-line size persistence"
```
(Also add the `inv_07` row to the DATA-MODEL migration log in the same commit.)

---

### Task 2: `eventAccess` — add `invitations` capability + storage key helpers + upload validation

**Files:**
- Modify: `lib/auth/eventAccess.ts:10-25` (module union + capability sets)
- Modify: `lib/storage/keys.ts` (add two helpers)
- Create: `lib/validations/invitations.ts`
- Test: `test/lib/invitations-keys.test.ts`, `test/lib/invitations-validations.test.ts`

**Interfaces:**
- Produces: `EventModule` gains `'invitations'` (owner-only).
- Produces: `invitationBgKey(eventId: string, uuid: string, ext: string): string` → `events/{eventId}/invitations/bg-{uuid}.{ext}`
- Produces: `invitationUploadKey(eventId: string, uuid: string, ext: string): string` → `events/{eventId}/invitations/card-{uuid}.{ext}`
- Produces: `invitationUploadUrlSchema` (Zod) — `{ part: 'photo_bg' | 'card_upload', contentType: 'image/jpeg' | 'image/png' }`.

- [ ] **Step 1: Write failing tests for key helpers**

```ts
// test/lib/invitations-keys.test.ts
import { describe, it, expect } from 'vitest'
import { invitationBgKey, invitationUploadKey } from '@/lib/storage/keys'

describe('invitation key helpers', () => {
  it('builds a bg key under the event invitations prefix', () => {
    expect(invitationBgKey('E1', 'U1', 'jpg')).toBe('events/E1/invitations/bg-U1.jpg')
  })
  it('builds an upload key under the event invitations prefix', () => {
    expect(invitationUploadKey('E1', 'U1', 'png')).toBe('events/E1/invitations/card-U1.png')
  })
})
```

- [ ] **Step 2: Run → fail** — `npm run test:run -- invitations-keys` → FAIL (helpers undefined).

- [ ] **Step 3: Implement key helpers** in `lib/storage/keys.ts` (next to `invitationKey`):

```ts
export function invitationBgKey(eventId: string, uuid: string, ext: string): string {
  return `events/${eventId}/invitations/bg-${uuid}.${ext}`
}

export function invitationUploadKey(eventId: string, uuid: string, ext: string): string {
  return `events/${eventId}/invitations/card-${uuid}.${ext}`
}
```

- [ ] **Step 4: Write failing test for the upload schema**

```ts
// test/lib/invitations-validations.test.ts
import { describe, it, expect } from 'vitest'
import { invitationUploadUrlSchema } from '@/lib/validations/invitations'

describe('invitationUploadUrlSchema', () => {
  it('accepts a valid photo_bg jpeg', () => {
    expect(invitationUploadUrlSchema.safeParse({ part: 'photo_bg', contentType: 'image/jpeg' }).success).toBe(true)
  })
  it('accepts card_upload png', () => {
    expect(invitationUploadUrlSchema.safeParse({ part: 'card_upload', contentType: 'image/png' }).success).toBe(true)
  })
  it('rejects an unknown part', () => {
    expect(invitationUploadUrlSchema.safeParse({ part: 'banner', contentType: 'image/png' }).success).toBe(false)
  })
  it('rejects a disallowed content type', () => {
    expect(invitationUploadUrlSchema.safeParse({ part: 'photo_bg', contentType: 'image/gif' }).success).toBe(false)
  })
})
```

- [ ] **Step 5: Run → fail** — `npm run test:run -- invitations-validations` → FAIL (module missing).

- [ ] **Step 6: Implement `lib/validations/invitations.ts`**

```ts
import { z } from 'zod'

export const uuidSchema = z.string().uuid()

const INV_IMAGE_TYPES = ['image/jpeg', 'image/png'] as const

export const invitationUploadUrlSchema = z.object({
  part: z.enum(['photo_bg', 'card_upload']),
  contentType: z.enum(INV_IMAGE_TYPES),
}).strict()

const SLOT_KEYS = ['eyebrow', 'couple', 'invite', 'date', 'time', 'venue', 'message'] as const
const slotSize = z.enum(['s', 'm', 'l'])

export const invitationPatchSchema = z.object({
  template_id: z.string().uuid().nullable().optional(),
  card_upload_key: z.string().max(512).nullable().optional(),
  photo_bg_key: z.string().max(512).nullable().optional(),
  slots: z.object(Object.fromEntries(
    SLOT_KEYS.map((k) => [k, z.string().max(280)]),
  ) as Record<(typeof SLOT_KEYS)[number], z.ZodString>).partial().optional(),
  slot_sizes: z.record(z.enum(SLOT_KEYS), slotSize).optional(),
  is_custom: z.boolean().optional(),
}).strict().refine(
  (v) => !(v.template_id != null && v.card_upload_key != null),
  { message: 'template_id and card_upload_key are mutually exclusive', path: ['template_id'] },
)

export const SLOT_KEYS_LIST = SLOT_KEYS
```

- [ ] **Step 7: Add the `invitations` capability** in `lib/auth/eventAccess.ts` — add `| 'invitations'` to the `EventModule` union and add `'invitations'` to the `owner` set ONLY (not co-host/planner/photographer):

```ts
// union (around line 10-13): add
  | 'invitations'
// capability map (around line 23): owner set gains 'invitations'
  owner: new Set(['billing', 'delete', 'admins', 'website', 'guests', 'planning', 'media', 'general', 'invitations']),
```

- [ ] **Step 8: Run all new tests → pass** — `npm run test:run -- invitations-keys invitations-validations` → PASS. Run `tsc --noEmit` → clean.

- [ ] **Step 9: Commit**

```bash
git add lib/storage/keys.ts lib/validations/invitations.ts lib/auth/eventAccess.ts test/lib/invitations-keys.test.ts test/lib/invitations-validations.test.ts
git commit -m "feat(invitations): add invitations capability, R2 key helpers, upload+patch schemas"
```

---

### Task 3: Template slug↔uuid resolver

**Files:**
- Create: `lib/invitations/templates.ts`
- Test: `test/lib/invitations-templates.test.ts`

**Interfaces:**
- Consumes: rows of `{ id: string; slug: string }` from `config.invitation_templates`.
- Produces: `buildTemplateMaps(rows): { bySlug: Record<string,string>; bySlugReverse: Record<string,string> }` where `bySlug[slug] = id` and `bySlugReverse[id] = slug`.
- Produces: `slugForTemplateId(id, reverseMap): string | null`, `idForTemplateSlug(slug, map): string | null`.

- [ ] **Step 1: Write failing test**

```ts
// test/lib/invitations-templates.test.ts
import { describe, it, expect } from 'vitest'
import { buildTemplateMaps, slugForTemplateId, idForTemplateSlug } from '@/lib/invitations/templates'

const rows = [{ id: 'uuid-eternal', slug: 'eternal' }, { id: 'uuid-noir', slug: 'noir' }]

describe('template maps', () => {
  it('resolves slug to id', () => {
    const { bySlug } = buildTemplateMaps(rows)
    expect(idForTemplateSlug('noir', bySlug)).toBe('uuid-noir')
  })
  it('resolves id to slug', () => {
    const { bySlugReverse } = buildTemplateMaps(rows)
    expect(slugForTemplateId('uuid-eternal', bySlugReverse)).toBe('eternal')
  })
  it('returns null for unknown slug', () => {
    const { bySlug } = buildTemplateMaps(rows)
    expect(idForTemplateSlug('ghost', bySlug)).toBeNull()
  })
  it('returns null for unknown id', () => {
    const { bySlugReverse } = buildTemplateMaps(rows)
    expect(slugForTemplateId('uuid-ghost', bySlugReverse)).toBeNull()
  })
})
```

- [ ] **Step 2: Run → fail** — `npm run test:run -- invitations-templates` → FAIL.

- [ ] **Step 3: Implement `lib/invitations/templates.ts`**

```ts
export interface TemplateRow { id: string; slug: string }

export function buildTemplateMaps(rows: TemplateRow[]): {
  bySlug: Record<string, string>
  bySlugReverse: Record<string, string>
} {
  const bySlug: Record<string, string> = {}
  const bySlugReverse: Record<string, string> = {}
  for (const r of rows) { bySlug[r.slug] = r.id; bySlugReverse[r.id] = r.slug }
  return { bySlug, bySlugReverse }
}

export function idForTemplateSlug(slug: string, bySlug: Record<string, string>): string | null {
  return bySlug[slug] ?? null
}

export function slugForTemplateId(id: string, bySlugReverse: Record<string, string>): string | null {
  return bySlugReverse[id] ?? null
}
```

- [ ] **Step 4: Run → pass** — `npm run test:run -- invitations-templates` → PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/invitations/templates.ts test/lib/invitations-templates.test.ts
git commit -m "feat(invitations): template slug<->uuid resolver"
```

---

### Task 4: Upload-URL route

**Files:**
- Create: `app/api/events/[id]/invitation-card/upload-url/route.ts`

**Interfaces:**
- Consumes: `invitationUploadUrlSchema`, `uuidSchema` (Task 2); `invitationBgKey`/`invitationUploadKey` (Task 2); `requireEventWrite(..., 'invitations')` (Task 2); `getSignedUploadUrl`, `R2_BUCKET_PRIVATE` (`lib/storage/r2`).
- Produces: `POST` → `{ url: string, key: string }`.

- [ ] **Step 1: Implement the route** (clone `app/api/events/[id]/media/upload-url/route.ts`, swap schema/keys):

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireEventWrite } from '@/lib/auth/eventAccess'
import { invitationUploadUrlSchema, uuidSchema } from '@/lib/validations/invitations'
import { getSignedUploadUrl, R2_BUCKET_PRIVATE } from '@/lib/storage/r2'
import { invitationBgKey, invitationUploadKey } from '@/lib/storage/keys'
import { randomUUID } from 'crypto'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireEventWrite(supabase, id, user.id, 'invitations')
    if (!access.ok) return access.response

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const parsed = invitationUploadUrlSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { part, contentType } = parsed.data
    const ext = contentType === 'image/png' ? 'png' : 'jpg'
    const uuid = randomUUID()
    const key = part === 'photo_bg' ? invitationBgKey(id, uuid, ext) : invitationUploadKey(id, uuid, ext)

    const url = await getSignedUploadUrl({ bucket: R2_BUCKET_PRIVATE, key, contentType, expiresIn: 300 })
    return NextResponse.json({ url, key }, { status: 200 })
  } catch (err) {
    console.error('POST /api/events/[id]/invitation-card/upload-url failed:', err)
    return NextResponse.json({ error: 'Failed to issue upload URL' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify** — `tsc --noEmit` clean; `npm run lint` clean for the new file.

- [ ] **Step 3: Commit**

```bash
git add app/api/events/[id]/invitation-card/upload-url/route.ts
git commit -m "feat(invitations): presigned R2 upload-url route"
```

---

### Task 5: GET + PATCH card route (with lazy default-card ensure)

**Files:**
- Create: `app/api/events/[id]/invitation-card/route.ts`
- Create: `lib/invitations/card.ts` (shared select columns + default-card fetch/ensure helper)
- Test: `test/lib/invitations-patch-mapping.test.ts`

**Interfaces:**
- Consumes: `invitationPatchSchema`, `uuidSchema` (Task 2); `requireEventRead`/`requireEventWrite(..., 'invitations')`.
- Produces: `GET` → `{ card: SavedCard | null, templates: { id, slug }[] }`.
- Produces: `PATCH` → `{ success: true }`.
- Produces: `slotsToColumns(slots): Record<string,string>` — maps `{couple}` → `{slot_couple}`.
- Produces: `CARD_SELECT` (column list string) and `fetchDefaultCard(supabase, eventId)`.

- [ ] **Step 1: Write failing test for slot→column mapping**

```ts
// test/lib/invitations-patch-mapping.test.ts
import { describe, it, expect } from 'vitest'
import { slotsToColumns } from '@/lib/invitations/card'

describe('slotsToColumns', () => {
  it('prefixes each slot key with slot_', () => {
    expect(slotsToColumns({ couple: 'A & B', message: 'See you' }))
      .toEqual({ slot_couple: 'A & B', slot_message: 'See you' })
  })
  it('ignores undefined slots', () => {
    expect(slotsToColumns({ couple: 'A', invite: undefined })).toEqual({ slot_couple: 'A' })
  })
})
```

- [ ] **Step 2: Run → fail** — `npm run test:run -- invitations-patch-mapping` → FAIL.

- [ ] **Step 3: Implement `lib/invitations/card.ts`**

```ts
import type { SupabaseClient } from '@supabase/supabase-js'

export const CARD_SELECT =
  'id, template_id, is_custom, slot_eyebrow, slot_couple, slot_invite, slot_date, ' +
  'slot_time, slot_venue, slot_message, slot_sizes, card_upload_key, photo_bg_key, ' +
  'share_token, share_enabled'

export function slotsToColumns(slots: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(slots)) {
    if (v !== undefined) out[`slot_${k}`] = v
  }
  return out
}

// Fetch the default main-event card; returns null if unseeded.
export async function fetchDefaultCard(supabase: SupabaseClient, eventId: string) {
  const { data, error } = await supabase
    .from('event_invitation_cards')
    .select(CARD_SELECT)
    .eq('event_id', eventId).eq('is_default', true).is('sub_event_id', null)
    .maybeSingle()
  if (error) throw error
  return data
}
```

- [ ] **Step 4: Run → pass** — `npm run test:run -- invitations-patch-mapping` → PASS.

- [ ] **Step 5: Implement the route** `app/api/events/[id]/invitation-card/route.ts`:

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireEventRead, requireEventWrite } from '@/lib/auth/eventAccess'
import { invitationPatchSchema, uuidSchema } from '@/lib/validations/invitations'
import { CARD_SELECT, fetchDefaultCard, slotsToColumns } from '@/lib/invitations/card'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireEventRead(supabase, id, user.id, 'invitations')
    if (!access.ok) return access.response

    const card = await fetchDefaultCard(supabase, id)
    const { data: templates, error: tErr } = await supabase
      .schema('config').from('invitation_templates')
      .select('id, slug').eq('enabled', true).order('display_order')
    if (tErr) throw tErr

    return NextResponse.json({ card: card ?? null, templates: templates ?? [] })
  } catch (err) {
    console.error('GET /api/events/[id]/invitation-card failed:', err)
    return NextResponse.json({ error: 'Failed to fetch card' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireEventWrite(supabase, id, user.id, 'invitations')
    if (!access.ok) return access.response

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const parsed = invitationPatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const d = parsed.data

    // Build the column patch, enforcing the dual-mode invariant.
    const patch: Record<string, unknown> = { updated_by: user.id, updated_at: new Date().toISOString() }
    if (d.template_id !== undefined) {
      patch.template_id = d.template_id
      if (d.template_id !== null) patch.card_upload_key = null   // template mode nulls upload
    }
    if (d.card_upload_key !== undefined) {
      patch.card_upload_key = d.card_upload_key
      if (d.card_upload_key !== null) patch.template_id = null   // upload mode nulls template
    }
    if (d.photo_bg_key !== undefined) patch.photo_bg_key = d.photo_bg_key
    if (d.slot_sizes !== undefined) patch.slot_sizes = d.slot_sizes
    if (d.is_custom !== undefined) patch.is_custom = d.is_custom
    if (d.slots) Object.assign(patch, slotsToColumns(d.slots))

    // Ensure the default card exists (lazy seed for legacy events), then update it.
    const existing = await fetchDefaultCard(supabase, id)
    if (!existing) {
      return NextResponse.json({ error: 'No invitation card for this event' }, { status: 404 })
    }
    const { error } = await supabase
      .from('event_invitation_cards')
      .update(patch)
      .eq('id', (existing as { id: string }).id)
    if (error) {
      console.error('PATCH /api/events/[id]/invitation-card update failed:', error)
      return NextResponse.json({ error: 'Failed to save card' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/events/[id]/invitation-card failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

Note: the seed already guarantees a default card for every event created via `create_event_with_details`, so the 404 branch is a defensive backstop, not the normal path. (If a legacy unseeded event is found in testing, add an `ensureDefaultCard` INSERT here — deferred unless observed.)

- [ ] **Step 6: Verify** — `tsc --noEmit` clean; `npm run lint` clean; `npm run test:run` all green.

- [ ] **Step 7: Commit**

```bash
git add "app/api/events/[id]/invitation-card/route.ts" lib/invitations/card.ts test/lib/invitations-patch-mapping.test.ts
git commit -m "feat(invitations): GET/PATCH card route with slot mapping + dual-mode enforcement"
```

---

### Task 6: Server page — fetch saved card + pass to client

**Files:**
- Modify: `app/events/[id]/invitations/page.tsx`

**Interfaces:**
- Consumes: `fetchDefaultCard` + `CARD_SELECT` (Task 5), `buildTemplateMaps`/`slugForTemplateId` (Task 3).
- Produces: new `InvitationsClient` props — `savedCard: SavedCardProp | null`, `templateSlugToId: Record<string,string>`.

- [ ] **Step 1: Load card + templates server-side.** In `page.tsx`, after the existing event fetch, fetch the default card and the enabled template rows (reuse `fetchDefaultCard` and a `config.invitation_templates` select). Build the slug↔id maps. Resolve the saved card''s `template_id` → slug. Shape a `savedCard` prop:

```ts
const savedCardRaw = await fetchDefaultCard(supabase, id)
const { data: templateRows } = await supabase
  .schema('config').from('invitation_templates').select('id, slug').eq('enabled', true)
const { bySlug, bySlugReverse } = buildTemplateMaps(templateRows ?? [])

const savedCard = savedCardRaw ? {
  isCustom: savedCardRaw.is_custom,
  templateSlug: savedCardRaw.template_id ? slugForTemplateId(savedCardRaw.template_id, bySlugReverse) : null,
  cardUploadKey: savedCardRaw.card_upload_key,
  photoBgKey: savedCardRaw.photo_bg_key,
  slots: {
    eyebrow: savedCardRaw.slot_eyebrow ?? defaultData.eyebrow,
    couple:  savedCardRaw.slot_couple  ?? defaultData.couple,
    invite:  savedCardRaw.slot_invite  ?? defaultData.invite,
    date:    savedCardRaw.slot_date    ?? defaultData.date,
    time:    savedCardRaw.slot_time    ?? defaultData.time,
    venue:   savedCardRaw.slot_venue   ?? defaultData.venue,
    message: savedCardRaw.slot_message ?? defaultData.message,
  },
  slotSizes: (savedCardRaw.slot_sizes ?? {}) as Record<string, 's'|'m'|'l'>,
} : null
```
Pass `savedCard={savedCard}` and `templateSlugToId={bySlug}` to `<InvitationsClient>`.

- [ ] **Step 2: Verify** — `tsc --noEmit` clean; page still renders on `npm run dev` (server component compiles). No client change yet — the new props are unused until Task 7 (TypeScript will accept optional props; declare them optional in the client interface first or land Task 7 together). To keep the build green, add the two props to `InvitationsClientProps` as optional in this task.

- [ ] **Step 3: Commit**

```bash
git add "app/events/[id]/invitations/page.tsx"
git commit -m "feat(invitations): load saved card + template maps server-side"
```

---

### Task 7: Client — hydrate saved card, lift sizes into state, resume-if-personalized

**Files:**
- Modify: `app/events/[id]/invitations/InvitationsClient.tsx`

**Interfaces:**
- Consumes: `savedCard`, `templateSlugToId` props (Task 6).
- Produces: `slotSizes` state (`Record<SlotKey, SlotSize>`), applied on mount and used by `bumpSize`. Editor resumes when `savedCard.isCustom`.

- [ ] **Step 1: Extend props + hydrate initial state.** Add `savedCard?` and `templateSlugToId?` to `InvitationsClientProps`. Initialize:
  - `cardData` ← `savedCard?.slots ?? defaultData`
  - `slotSizes` state ← `savedCard?.slotSizes ?? {}`
  - initial `tpl` ← `savedCard?.templateSlug` resolved against `TEMPLATES`
  - initial `mode` ← `savedCard?.cardUploadKey ? 'upload' : 'template'`
  - initial `view` ← `savedCard?.isCustom ? 'editor' : 'gallery'`
  - `photoSrc`/`uploadSrc` ← signed read URLs derived from `photoBgKey`/`cardUploadKey` (via `/api/media/<key>` proxy path — confirm the proxy accepts these keys; they live under `events/{id}/...` like media).

- [ ] **Step 2: Lift sizes into React state.** Replace the DOM-classList-only model:
  - `EditableSlot` gains an `initialSize: SlotSize` prop; on mount it applies `is-sz-s`/`is-sz-l` from that size (in addition to setting text).
  - `bumpSize` updates `slotSizes` state via `setSlotSizes(prev => ({ ...prev, [activeKey]: next }))` in addition to toggling the class. Track the active slot key (already have `activeSlotRef`; add an `activeKey` ref/state so `bumpSize` knows which slot).
  - `CardSlots`/`InvCard` thread `slotSizes` down so re-mounts (template change, resume) render the right sizes.

- [ ] **Step 3: Verify size + text hydrate.** `tsc --noEmit` clean. Manual dev check (founder session): reopen a card that has `is_custom=true` in DB → lands in editor (this becomes fully testable after Task 8 autosave writes such a row; until then, temporarily seed a row via SQL to verify, or defer the live check to Task 9).

- [ ] **Step 4: Commit**

```bash
git add "app/events/[id]/invitations/InvitationsClient.tsx"
git commit -m "feat(invitations): hydrate saved card, lift per-line sizes into state, resume editor when personalized"
```

---

### Task 8: Client — debounced autosave + image upload wiring

**Files:**
- Create: `lib/invitations/useAutosaveCard.ts` (React hook)
- Modify: `app/events/[id]/invitations/InvitationsClient.tsx`
- Test: `test/lib/useAutosaveCard.test.ts` (debounce logic as a pure timer test)

**Interfaces:**
- Consumes: the PATCH route (Task 5), the upload-url route (Task 4), `templateSlugToId` (Task 6).
- Produces: autosave indicator states driving the existing header element.

- [ ] **Step 1: Check for an existing debounce util first.** `grep -rn "debounce" lib hooks components | head`. If a suitable debounce/`useDebouncedCallback` already exists, reuse it and skip creating a new one — wire it into the hook. Otherwise proceed.

- [ ] **Step 2: Write failing test for the debounce coalescing**

```ts
// test/lib/useAutosaveCard.test.ts
import { describe, it, expect, vi } from 'vitest'
import { coalesce } from '@/lib/invitations/useAutosaveCard'

describe('coalesce', () => {
  it('fires once after rapid calls settle', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const run = coalesce(fn, 800)
    run(); run(); run()
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(800)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
```

- [ ] **Step 3: Run → fail**, then implement `lib/invitations/useAutosaveCard.ts` exporting a pure `coalesce(fn, ms)` helper plus a `useAutosaveCard(eventId, templateSlugToId)` hook that:
  - exposes `save(partial)` (merges into a pending payload, then `coalesce`-flushes a PATCH after 800ms idle),
  - exposes `status: 'idle' | 'saving' | 'saved' | 'error'` and `savedAt`,
  - on template save, translates `templateSlug` → `template_id` via `templateSlugToId`,
  - on error, keeps the last payload for retry on the next `save`.

- [ ] **Step 4: Run → pass** — `npm run test:run -- useAutosaveCard` → PASS.

- [ ] **Step 5: Wire autosave into the editor.** Call `save(...)` from: `handleSlotInput` (slots + `is_custom:true`), `bumpSize` (`slot_sizes`), `openTemplate`/template-swap confirm (`template_id` + reset slots + `is_custom:true`), and after each image upload (`photo_bg_key`/`card_upload_key`). Replace the cosmetic `autosave` string state with the hook''s `status`/`savedAt` → render `Saving…` / `Saved · HH:MM` / `Not saved — retry` on the existing `.inv-autosave` element (keep `cloud_done` icon; swap to a spinner glyph while saving is optional).

- [ ] **Step 6: Wire image uploads.** New helper `uploadInvitationImage(eventId, part, file): Promise<string>`:
  1. `POST /api/events/[id]/invitation-card/upload-url` `{ part, contentType }` → `{ url, key }`
  2. `fetch(url, { method:'PUT', body:file, headers:{'Content-Type':file.type} })`
  3. return `key`.
  In `handlePhotoFile`: optimistic `URL.createObjectURL` preview → upload → on success `save({ photo_bg_key: key })` and swap `photoSrc` to the signed read URL. In `handleUploadFile`/`openUpload`: same with `card_upload_key`, and this sets upload mode (PATCH nulls `template_id` server-side; client sets `mode='upload'`, `tpl=null`). On upload failure → toast + revert.

- [ ] **Step 7: Verify** — `tsc --noEmit` + `npm run lint` clean; all Vitest green.

- [ ] **Step 8: Commit**

```bash
git add lib/invitations/useAutosaveCard.ts "app/events/[id]/invitations/InvitationsClient.tsx" test/lib/useAutosaveCard.test.ts
git commit -m "feat(invitations): debounced autosave + R2 image persistence wiring"
```

---

### Task 9: Founder-assisted click-through + docs

**Files:**
- Modify: `CLAUDE.md` (MVP table — Digital Invitations row ⚠️ → ✅)
- Modify: `docs/ops/v0-readiness.html`
- Modify: `docs/NEXT-SESSION.md`
- Create: `docs/session-reports/2026-08-23d-invitations-persistence-session-report.md`

- [ ] **Step 1: Run the 5 click-through scenarios** (spec §8) on a real founder session against `npm run dev`:
  1. Edit couple text + bump a line to Large → wait `Saved` → reload → **editor reopens, identical text + size** (the exact §1 failure, now passing).
  2. Swap template → text resets → reload → new template persists.
  3. Photo-layout: add BG photo → reload → persists (signed URL).
  4. Upload-your-own-card → reload → persists.
  5. Pristine event → still lands on gallery.
  Capture a screenshot for scenario 1 as before/after evidence.

- [ ] **Step 2: Fix any scenario failures** using systematic-debugging, then re-run that scenario.

- [ ] **Step 3: Update docs** — flip the CLAUDE.md Digital Invitations row to ✅ (persist live), update the v0-readiness artifact row + fix-log, add a NEXT-SESSION entry, write the session report.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md docs/ops/v0-readiness.html docs/NEXT-SESSION.md docs/session-reports/2026-08-23d-invitations-persistence-session-report.md
git commit -m "docs(invitations): mark card persistence live; click-through verified"
```

---

## Self-Review

**Spec coverage:**
- §4 schema → Task 1. §5.1 GET → Task 5. §5.2 PATCH → Task 5. §5.3 upload-url → Task 4. §6.1 hydrate → Tasks 6–7. §6.2 lift sizes → Task 7. §6.3 autosave → Task 8. §6.4 images → Task 8. §6.5 template-swap → Task 8 (reuses existing confirm modal). §7 error handling → Tasks 5/8. §8 tests → Tasks 2–8 unit + Task 9 click-through. §3 owner-only → Task 2 capability. All covered.

**Placeholder scan:** No TBD/TODO. The one deferred branch (lazy insert for a legacy unseeded event) is explicitly conditional-on-observation with the seed guarantee stated — not a silent gap.

**Type consistency:** `fetchDefaultCard`/`CARD_SELECT`/`slotsToColumns` defined in Task 5, consumed in Tasks 5/6. `buildTemplateMaps`/`slugForTemplateId`/`idForTemplateSlug` defined Task 3, consumed Task 6/8. `invitationPatchSchema`/`invitationUploadUrlSchema`/`invitationBgKey`/`invitationUploadKey` defined Task 2, consumed Tasks 4/5. `savedCard`/`templateSlugToId` props defined Task 6, consumed Task 7/8. `coalesce`/`useAutosaveCard` defined Task 8. Names consistent across tasks.

**Reuse check:** website-design route (GET/PATCH shape), media/upload-url route (presign), media/[...key] proxy (image read), eventAccess (capability mechanism extended, not forked), lib/storage/keys + r2 (helpers added alongside), existing `.inv-*`/`.btn-pill`/`.modal-*` CSS (unchanged). Only genuinely-new files: 3 lib modules, 1 hook, 2 route files, 5 test files, 1 column.
