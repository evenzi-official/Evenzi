# Media & Memories Backend-Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the already-built `MediaClient.tsx` frontend (photos/videos/albums, currently 100% mock/local-state) to the already-live `event_media`/`event_albums` schema, via a new presigned-direct-to-R2 upload pipeline and 8 new API routes.

**Architecture:** Server component (`page.tsx`) does one `Promise.all` read, passes typed props into `MediaClient`. All writes go through new API routes under `app/api/events/[id]/media/*`, each starting with a shared `assertEventOwnership()` check (new — extracted from the existing inline pattern in `app/api/events/[id]/admins/route.ts`, since `upload-url` touches no Supabase table and has no other backstop). Uploads use presigned direct-to-R2 PUTs (client never sends file bytes through our server); commit verifies both the master/video key AND the thumb/poster key via `HeadObject` + a magic-byte check before inserting the DB row. Delete/bulk-delete/album mutations use a shared optimistic-update-with-rollback hook on the client.

**Tech Stack:** Next.js 14 App Router API routes, Supabase server client, `@aws-sdk/client-s3` (already installed) via `lib/storage/r2.ts`, `heic2any` (already installed) via `lib/storage/imageOptimize.ts`, Zod, Vitest for route/unit tests.

## Global Constraints

- Schema is NOT changing — every table/column/view referenced already exists (`media_01`–`media_06` migrations, confirmed live).
- Every route: `uuidSchema.safeParse(id)` → `auth.getUser()` 401 → `assertEventOwnership()` (new, mandatory, not implicit) → zod body validation → typed JSON response, errors as `{ error, details? }`.
- R2 keys are always server-generated via the existing `lib/storage/keys.ts` helpers (`mediaKey`, `mediaThumbKey`) — never accept a client-supplied key.
- Size caps: photo master 20MB, thumb/poster 2MB, video 500MB — enforced at commit time via `HeadObject` (413 on violation, delete both keys).
- Content-type allowlist: photo → `image/webp, image/jpeg, image/png, image/avif`; video → `video/mp4, video/quicktime`; poster/thumb → always `image/webp`.
- Presign `expiresIn`: 300s for photo/thumb parts, 1800s for video parts.
- Client-side upload concurrency capped at 3 files in flight.
- Album writes handle `23505` (unique violation) explicitly: create/rename → `409` friendly error; assign `add` on an already-present album → silent no-op success.
- `bulk-delete` capped at 100 ids, DB-row-deleted-first ordering, returns `{ deleted: string[], failed: {id, reason}[] }`.
- Unit/integration tests (Vitest, Node env — this project's `vitest.config.ts` has no browser globals) cover the 8 API routes only. The client-side pipeline (`optimizeImage`, `heic2any`, canvas, `<video>` seek) is explicitly NOT unit-tested — it needs real browser APIs; covered by manual/live-browser testing only (per this spec's council arbiter ruling).
- Spec: `docs/superpowers/specs/2026-07-31-media-memories-fe-wiring-design.md` (read in full before starting — council-reviewed, RE-PLAN → revised → confirm-pass PASS).

---

## File Structure

**New files:**
- `lib/media/ownership.ts` — `assertEventOwnership()` shared helper
- `lib/validations/media.ts` — Zod schemas for all 8 routes
- `app/api/events/[id]/media/upload-url/route.ts` — presigned PUT issuance
- `app/api/events/[id]/media/route.ts` — `POST` commit
- `app/api/events/[id]/media/[mediaId]/route.ts` — `DELETE` single
- `app/api/events/[id]/media/[mediaId]/url/route.ts` — `GET` single signed URL (onError fallback only)
- `app/api/events/[id]/media/urls/route.ts` — `POST` batched signed URLs
- `app/api/events/[id]/media/bulk-delete/route.ts` — `POST` batch delete
- `app/api/events/[id]/media/albums/route.ts` — `POST` create album
- `app/api/events/[id]/media/albums/[albumId]/route.ts` — `PATCH`/`DELETE` rename/delete album
- `app/api/events/[id]/media/[mediaId]/albums/route.ts` — `PATCH` assign/unassign
- `lib/media/uploadPipeline.ts` — client-side: optimize → get-URL → PUT (XHR w/ progress) → commit, per-file state machine, concurrency queue
- `lib/media/useOptimisticMediaMutation.ts` — shared optimistic-update-with-rollback hook

**Modified files:**
- `lib/storage/r2.ts` — add `headObject()` and `getObjectRange()`
- `app/events/[id]/media/page.tsx` — real `Promise.all` read path
- `app/events/[id]/media/MediaClient.tsx` — wire real props, upload pipeline, optimistic mutations, batched signed URLs, storage meter

**New test files** (mirror source path under `__tests__/`, matching this repo's existing convention):
- `__tests__/lib/media/ownership.test.ts`
- `__tests__/lib/validations/media.test.ts`
- `__tests__/api/events/[id]/media/upload-url.test.ts`
- `__tests__/api/events/[id]/media/commit.test.ts`
- `__tests__/api/events/[id]/media/delete.test.ts`
- `__tests__/api/events/[id]/media/bulk-delete.test.ts`
- `__tests__/api/events/[id]/media/albums.test.ts`
- `__tests__/api/events/[id]/media/urls.test.ts`

---

## Task 1: Shared ownership helper + R2 low-level additions

**Files:**
- Create: `lib/media/ownership.ts`
- Modify: `lib/storage/r2.ts`
- Test: `__tests__/lib/media/ownership.test.ts`

**Interfaces:**
- Produces: `assertEventOwnership(supabase: SupabaseClient, eventId: string, userId: string): Promise<boolean>` — `true` if the event exists, isn't soft-deleted, and belongs to `userId`.
- Produces (in `r2.ts`): `headObject(opts: {bucket: string; key: string}): Promise<{contentLength: number; contentType: string} | null>` — `null` if the object doesn't exist. `getObjectRange(opts: {bucket: string; key: string; start: number; end: number}): Promise<Buffer>` — throws if the object doesn't exist.

- [ ] **Step 1: Write the failing test for `assertEventOwnership`**

```typescript
// __tests__/lib/media/ownership.test.ts
import { describe, it, expect, vi } from 'vitest'
import { assertEventOwnership } from '@/lib/media/ownership'

function makeQueryChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    single: vi.fn().mockResolvedValue(result),
  }
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.is = vi.fn().mockReturnValue(chain)
  return chain
}

describe('assertEventOwnership', () => {
  it('returns true when the event exists and belongs to the user', async () => {
    const chain = makeQueryChain({ data: { id: 'event-1' }, error: null })
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never
    const result = await assertEventOwnership(supabase, 'event-1', 'user-1')
    expect(result).toBe(true)
    expect(chain.eq).toHaveBeenCalledWith('id', 'event-1')
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('returns false when no matching row is found (wrong owner or soft-deleted)', async () => {
    const chain = makeQueryChain({ data: null, error: { message: 'not found' } })
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never
    const result = await assertEventOwnership(supabase, 'event-1', 'user-2')
    expect(result).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/media/ownership.test.ts`
Expected: FAIL with "Cannot find module '@/lib/media/ownership'" or similar

- [ ] **Step 3: Write `lib/media/ownership.ts`**

```typescript
// lib/media/ownership.ts
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Verifies the authenticated user owns the given event (not soft-deleted).
 * Extracted from the inline pattern in app/api/events/[id]/admins/route.ts —
 * media routes need this on every route, including upload-url which touches
 * no Supabase table and has no RLS backstop at all.
 */
export async function assertEventOwnership(
  supabase: SupabaseClient,
  eventId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single()
  return !!data
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/media/ownership.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Add `headObject` and `getObjectRange` to `lib/storage/r2.ts`**

Read the current file first (`lib/storage/r2.ts`) — it already exports `getSignedUploadUrl`, `getSignedDownloadUrl`, `getPublicUrl`, `putObject`, `deleteObject`, `deletePrefix`, and has a module-level `client()` function returning the cached `S3Client`. Add these two functions in the same style, after `deletePrefix`:

```typescript
// Add to lib/storage/r2.ts imports:
import { HeadObjectCommand } from '@aws-sdk/client-s3'
// (GetObjectCommand is already imported)

// Add after deletePrefix():

/** HEAD an object — returns null if it doesn't exist (never throws for a missing key). */
export async function headObject(opts: {
  bucket: string
  key: string
}): Promise<{ contentLength: number; contentType: string } | null> {
  try {
    const result = await client().send(
      new HeadObjectCommand({ Bucket: opts.bucket, Key: opts.key })
    )
    return {
      contentLength: result.ContentLength ?? 0,
      contentType: result.ContentType ?? '',
    }
  } catch (err) {
    const code = (err as { name?: string })?.name
    if (code === 'NotFound' || code === 'NoSuchKey') return null
    throw err
  }
}

/** Read a byte range of an object (e.g. for a magic-byte check). Throws if missing. */
export async function getObjectRange(opts: {
  bucket: string
  key: string
  start: number
  end: number
}): Promise<Buffer> {
  const result = await client().send(
    new GetObjectCommand({
      Bucket: opts.bucket,
      Key: opts.key,
      Range: `bytes=${opts.start}-${opts.end}`,
    })
  )
  if (!result.Body) throw new Error('Empty object body')
  const bytes = await result.Body.transformToByteArray()
  return Buffer.from(bytes)
}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors from `lib/storage/r2.ts` or `lib/media/ownership.ts`

- [ ] **Step 7: Commit**

```bash
git add lib/media/ownership.ts lib/storage/r2.ts __tests__/lib/media/ownership.test.ts
git commit -m "feat(media): add shared event-ownership helper + R2 head/range reads"
```

---

## Task 2: Validation schemas

**Files:**
- Create: `lib/validations/media.ts`
- Test: `__tests__/lib/validations/media.test.ts`

**Interfaces:**
- Consumes: `uuidSchema` pattern from `lib/validations/guests.ts` (same shape, not imported — each validations file defines its own per existing convention).
- Produces: `uploadUrlSchema`, `commitMediaSchema`, `createAlbumSchema`, `renameAlbumSchema`, `assignAlbumsSchema`, `bulkDeleteSchema`, `batchUrlsSchema` — all used by Task 3–7's routes.

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lib/validations/media.test.ts
import { describe, it, expect } from 'vitest'
import {
  uploadUrlSchema,
  commitMediaSchema,
  createAlbumSchema,
  renameAlbumSchema,
  assignAlbumsSchema,
  bulkDeleteSchema,
  batchUrlsSchema,
} from '@/lib/validations/media'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

describe('uploadUrlSchema', () => {
  it('accepts a valid photo master request', () => {
    const result = uploadUrlSchema.safeParse({ kind: 'photo', part: 'master', contentType: 'image/webp' })
    expect(result.success).toBe(true)
  })
  it('rejects a disallowed content type for photo', () => {
    const result = uploadUrlSchema.safeParse({ kind: 'photo', part: 'master', contentType: 'application/pdf' })
    expect(result.success).toBe(false)
  })
  it('rejects a video content type on a photo kind', () => {
    const result = uploadUrlSchema.safeParse({ kind: 'photo', part: 'master', contentType: 'video/mp4' })
    expect(result.success).toBe(false)
  })
  it('accepts a valid video file part', () => {
    const result = uploadUrlSchema.safeParse({ kind: 'video', part: 'master', contentType: 'video/mp4' })
    expect(result.success).toBe(true)
  })
  it('requires thumb parts to always be image/webp', () => {
    const bad = uploadUrlSchema.safeParse({ kind: 'video', part: 'thumb', contentType: 'video/mp4' })
    expect(bad.success).toBe(false)
    const good = uploadUrlSchema.safeParse({ kind: 'video', part: 'thumb', contentType: 'image/webp' })
    expect(good.success).toBe(true)
  })
})

describe('commitMediaSchema', () => {
  const base = {
    kind: 'photo' as const,
    masterKey: `events/${VALID_UUID}/media/abc.webp`,
    thumbKey: `events/${VALID_UUID}/media/abc_thumb.webp`,
    contentType: 'image/webp',
    width: 1200,
    height: 800,
  }
  it('accepts a valid photo commit', () => {
    expect(commitMediaSchema.safeParse(base).success).toBe(true)
  })
  it('rejects a negative width', () => {
    expect(commitMediaSchema.safeParse({ ...base, width: -1 }).success).toBe(false)
  })
  it('rejects a width above the sanity ceiling', () => {
    expect(commitMediaSchema.safeParse({ ...base, width: 999999 }).success).toBe(false)
  })
  it('rejects a negative duration_sec', () => {
    expect(commitMediaSchema.safeParse({ ...base, kind: 'video', durationSec: -5 }).success).toBe(false)
  })
  it('rejects a duration_sec above 4 hours', () => {
    expect(commitMediaSchema.safeParse({ ...base, kind: 'video', durationSec: 20000 }).success).toBe(false)
  })
  it('accepts a valid video commit with duration', () => {
    expect(commitMediaSchema.safeParse({ ...base, kind: 'video', durationSec: 120 }).success).toBe(true)
  })
})

describe('createAlbumSchema', () => {
  it('accepts a valid name', () => {
    expect(createAlbumSchema.safeParse({ name: 'Sangeet Night' }).success).toBe(true)
  })
  it('rejects an empty name', () => {
    expect(createAlbumSchema.safeParse({ name: '' }).success).toBe(false)
  })
})

describe('renameAlbumSchema', () => {
  it('accepts a valid rename', () => {
    expect(renameAlbumSchema.safeParse({ name: 'New Name' }).success).toBe(true)
  })
})

describe('assignAlbumsSchema', () => {
  it('accepts an add with albumIds', () => {
    expect(assignAlbumsSchema.safeParse({ mode: 'add', albumIds: [VALID_UUID] }).success).toBe(true)
  })
  it('accepts a remove with albumIds', () => {
    expect(assignAlbumsSchema.safeParse({ mode: 'remove', albumIds: [VALID_UUID] }).success).toBe(true)
  })
  it('rejects an unknown mode', () => {
    expect(assignAlbumsSchema.safeParse({ mode: 'replace', albumIds: [VALID_UUID] }).success).toBe(false)
  })
  it('rejects an empty albumIds array', () => {
    expect(assignAlbumsSchema.safeParse({ mode: 'add', albumIds: [] }).success).toBe(false)
  })
})

describe('bulkDeleteSchema', () => {
  it('accepts up to 100 ids', () => {
    const ids = Array.from({ length: 100 }, () => VALID_UUID)
    expect(bulkDeleteSchema.safeParse({ ids }).success).toBe(true)
  })
  it('rejects more than 100 ids', () => {
    const ids = Array.from({ length: 101 }, () => VALID_UUID)
    expect(bulkDeleteSchema.safeParse({ ids }).success).toBe(false)
  })
  it('rejects an empty array', () => {
    expect(bulkDeleteSchema.safeParse({ ids: [] }).success).toBe(false)
  })
})

describe('batchUrlsSchema', () => {
  it('accepts up to 200 ids', () => {
    const mediaIds = Array.from({ length: 200 }, () => VALID_UUID)
    expect(batchUrlsSchema.safeParse({ mediaIds }).success).toBe(true)
  })
  it('rejects more than 200 ids', () => {
    const mediaIds = Array.from({ length: 201 }, () => VALID_UUID)
    expect(batchUrlsSchema.safeParse({ mediaIds }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/validations/media.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write `lib/validations/media.ts`**

```typescript
import { z } from 'zod'

export const uuidSchema = z.string().uuid()

const PHOTO_TYPES = ['image/webp', 'image/jpeg', 'image/png', 'image/avif'] as const
const VIDEO_TYPES = ['video/mp4', 'video/quicktime'] as const
const THUMB_TYPE = 'image/webp' as const

export const uploadUrlSchema = z.discriminatedUnion('part', [
  z.object({
    part: z.literal('master'),
    kind: z.enum(['photo', 'video']),
    contentType: z.string(),
  }).strict().superRefine((val, ctx) => {
    const allowed: readonly string[] = val.kind === 'photo' ? PHOTO_TYPES : VIDEO_TYPES
    if (!allowed.includes(val.contentType)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `contentType must be one of: ${allowed.join(', ')}` })
    }
  }),
  z.object({
    part: z.literal('thumb'),
    kind: z.enum(['photo', 'video']),
    contentType: z.literal(THUMB_TYPE),
  }).strict(),
])

export const commitMediaSchema = z.object({
  kind: z.enum(['photo', 'video']),
  masterKey: z.string().min(1),
  thumbKey: z.string().min(1),
  contentType: z.string(),
  width: z.number().int().positive().max(10000),
  height: z.number().int().positive().max(10000),
  durationSec: z.number().int().positive().max(14400).optional(),
}).strict().refine(
  (val) => val.kind !== 'video' || val.durationSec !== undefined,
  { message: 'durationSec is required for video', path: ['durationSec'] }
)

export const createAlbumSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
}).strict()

export const renameAlbumSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
}).strict()

export const assignAlbumsSchema = z.object({
  mode: z.enum(['add', 'remove']),
  albumIds: z.array(z.string().uuid()).min(1).max(50),
}).strict()

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
}).strict()

export const batchUrlsSchema = z.object({
  mediaIds: z.array(z.string().uuid()).min(1).max(200),
}).strict()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/validations/media.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add lib/validations/media.ts __tests__/lib/validations/media.test.ts
git commit -m "feat(media): add validation schemas for upload/commit/album/delete routes"
```

---

## Task 3: `upload-url` route

**Files:**
- Create: `app/api/events/[id]/media/upload-url/route.ts`
- Test: `__tests__/api/events/[id]/media/upload-url.test.ts`

**Interfaces:**
- Consumes: `assertEventOwnership` (Task 1), `uploadUrlSchema` (Task 2), `getSignedUploadUrl` (existing `lib/storage/r2.ts`), `mediaKey`/`mediaThumbKey` (existing `lib/storage/keys.ts`), `R2_BUCKET_PRIVATE` (existing `lib/storage/r2.ts`).
- Produces: `POST` response `{ url: string, key: string }` — consumed by Task 9's `uploadPipeline.ts`.

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/api/events/[id]/media/upload-url.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createServerClientMock, getSignedUploadUrlMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  getSignedUploadUrlMock: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({ createServerClient: createServerClientMock }))
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }),
}))
vi.mock('@/lib/storage/r2', async () => {
  const actual = await vi.importActual<typeof import('@/lib/storage/r2')>('@/lib/storage/r2')
  return { ...actual, getSignedUploadUrl: getSignedUploadUrlMock, R2_BUCKET_PRIVATE: 'evenzi-private' }
})

import { POST } from '@/app/api/events/[id]/media/upload-url/route'

const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000'

function makeOwnerChain(owned: boolean) {
  const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), is: vi.fn() }
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.is = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(owned ? { data: { id: EVENT_ID }, error: null } : { data: null, error: { message: 'not found' } })
  return chain
}

function makeSupabaseMock(opts: { authed?: boolean; owned?: boolean } = {}) {
  const { authed = true, owned = true } = opts
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue(
        authed ? { data: { user: { id: 'user-1' } }, error: null } : { data: { user: null }, error: { message: 'no session' } }
      ),
    },
    from: vi.fn().mockReturnValue(makeOwnerChain(owned)),
  }
}

function req(body: unknown) {
  return new Request(`http://localhost/api/events/${EVENT_ID}/media/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const ctx = { params: Promise.resolve({ id: EVENT_ID }) }

describe('POST /api/events/[id]/media/upload-url', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSignedUploadUrlMock.mockResolvedValue('https://r2.example.com/signed-put-url')
  })

  it('returns 401 when unauthenticated', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock({ authed: false }))
    const res = await POST(req({ kind: 'photo', part: 'master', contentType: 'image/webp' }), ctx)
    expect(res.status).toBe(401)
  })

  it('returns 404 when the event is not owned by the caller', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock({ owned: false }))
    const res = await POST(req({ kind: 'photo', part: 'master', contentType: 'image/webp' }), ctx)
    expect(res.status).toBe(404)
  })

  it('returns 400 for a disallowed content type', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    const res = await POST(req({ kind: 'photo', part: 'master', contentType: 'application/pdf' }), ctx)
    expect(res.status).toBe(400)
  })

  it('returns a presigned URL and a server-generated key for a valid request', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    const res = await POST(req({ kind: 'photo', part: 'master', contentType: 'image/webp' }), ctx)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://r2.example.com/signed-put-url')
    expect(body.key).toMatch(new RegExp(`^events/${EVENT_ID}/media/`))
    expect(getSignedUploadUrlMock).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 'image/webp', expiresIn: 300 })
    )
  })

  it('uses a 1800s expiry for video master parts', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    await POST(req({ kind: 'video', part: 'master', contentType: 'video/mp4' }), ctx)
    expect(getSignedUploadUrlMock).toHaveBeenCalledWith(expect.objectContaining({ expiresIn: 1800 }))
  })

  it('returns a thumb key distinct from the master key naming', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    const res = await POST(req({ kind: 'photo', part: 'thumb', contentType: 'image/webp' }), ctx)
    const body = await res.json()
    expect(body.key).toContain('_thumb')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/api/events/\[id\]/media/upload-url.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write `app/api/events/[id]/media/upload-url/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { uploadUrlSchema, uuidSchema } from '@/lib/validations/media'
import { assertEventOwnership } from '@/lib/media/ownership'
import { getSignedUploadUrl, R2_BUCKET_PRIVATE } from '@/lib/storage/r2'
import { mediaKey, mediaThumbKey } from '@/lib/storage/keys'
import { randomUUID } from 'crypto'

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

    const owned = await assertEventOwnership(supabase, id, user.id)
    if (!owned) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = uploadUrlSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { kind, part, contentType } = parsed.data

    const uuid = randomUUID()
    const ext = contentType === 'image/webp' ? 'webp'
      : contentType === 'image/jpeg' ? 'jpg'
      : contentType === 'image/png' ? 'png'
      : contentType === 'image/avif' ? 'avif'
      : contentType === 'video/mp4' ? 'mp4'
      : 'mov'

    const key = part === 'thumb' ? mediaThumbKey(id, uuid) : mediaKey(id, uuid, ext)
    const expiresIn = part === 'master' && kind === 'video' ? 1800 : 300

    const url = await getSignedUploadUrl({
      bucket: R2_BUCKET_PRIVATE,
      key,
      contentType,
      expiresIn,
    })

    return NextResponse.json({ url, key }, { status: 200 })
  } catch (err) {
    console.error('POST /api/events/[id]/media/upload-url failed:', err)
    return NextResponse.json({ error: 'Failed to issue upload URL' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/api/events/\[id\]/media/upload-url.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/events/\[id\]/media/upload-url/route.ts "__tests__/api/events/[id]/media/upload-url.test.ts"
git commit -m "feat(media): add upload-url route (ownership-checked presigned PUT issuance)"
```

---

## Task 4: Commit route (`POST /api/events/[id]/media`)

**Files:**
- Create: `app/api/events/[id]/media/route.ts`
- Test: `__tests__/api/events/[id]/media/commit.test.ts`

**Interfaces:**
- Consumes: `assertEventOwnership` (Task 1), `commitMediaSchema` (Task 2), `headObject`/`getObjectRange`/`deleteObject` (Task 1 + existing `r2.ts`), `R2_BUCKET_PRIVATE`.
- Produces: `POST` response — the inserted (or existing, if idempotent-matched) `event_media` row as JSON, consumed by Task 9's `uploadPipeline.ts`.

**Magic-byte reference table** (used in Step 3):

| Declared type | Bytes to check | At offset |
|---|---|---|
| `image/webp` | `52 49 46 46` (`RIFF`) at 0, `57 45 42 50` (`WEBP`) at 8 | 0 and 8 |
| `image/jpeg` | `FF D8 FF` | 0 |
| `image/png` | `89 50 4E 47` | 0 |
| `image/avif` | `66 74 79 70` (`ftyp`) | 4 |
| `video/mp4`, `video/quicktime` | `66 74 79 70` (`ftyp`) | 4 |

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/api/events/[id]/media/commit.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createServerClientMock, headObjectMock, getObjectRangeMock, deleteObjectMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  headObjectMock: vi.fn(),
  getObjectRangeMock: vi.fn(),
  deleteObjectMock: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({ createServerClient: createServerClientMock }))
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }) }))
vi.mock('@/lib/storage/r2', async () => {
  const actual = await vi.importActual<typeof import('@/lib/storage/r2')>('@/lib/storage/r2')
  return {
    ...actual,
    headObject: headObjectMock,
    getObjectRange: getObjectRangeMock,
    deleteObject: deleteObjectMock,
    R2_BUCKET_PRIVATE: 'evenzi-private',
  }
})

import { POST } from '@/app/api/events/[id]/media/route'

const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000'
const MASTER_KEY = `events/${EVENT_ID}/media/abc.webp`
const THUMB_KEY = `events/${EVENT_ID}/media/abc_thumb.webp`

const WEBP_MAGIC = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBP')])

function makeOwnerChain() {
  const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), is: vi.fn() }
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.is = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data: { id: EVENT_ID }, error: null })
  return chain
}

function makeMediaChain(existingRow: unknown, insertedRow: unknown) {
  const selectChain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn() }
  selectChain.select = vi.fn().mockReturnValue(selectChain)
  selectChain.eq = vi.fn().mockReturnValue(selectChain)
  selectChain.single = vi.fn().mockResolvedValue({ data: existingRow, error: existingRow ? null : { message: 'not found' } })

  const insertChain: Record<string, unknown> = { insert: vi.fn(), select: vi.fn() }
  insertChain.insert = vi.fn().mockReturnValue(insertChain)
  insertChain.select = vi.fn().mockReturnValue(insertChain)
  insertChain.single = vi.fn().mockResolvedValue({ data: insertedRow, error: insertedRow ? null : { message: 'insert failed' } })

  return { selectChain, insertChain }
}

function makeSupabaseMock(opts: { existingRow?: unknown; insertedRow?: unknown } = {}) {
  const { selectChain, insertChain } = makeMediaChain(opts.existingRow ?? null, opts.insertedRow ?? { id: 'media-1' })
  let callCount = 0
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'events') return makeOwnerChain()
      callCount++
      return callCount === 1 ? selectChain : insertChain
    }),
  }
}

function req(body: unknown) {
  return new Request(`http://localhost/api/events/${EVENT_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const ctx = { params: Promise.resolve({ id: EVENT_ID }) }
const validBody = {
  kind: 'photo',
  masterKey: MASTER_KEY,
  thumbKey: THUMB_KEY,
  contentType: 'image/webp',
  width: 1200,
  height: 800,
}

describe('POST /api/events/[id]/media (commit)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    headObjectMock.mockImplementation(async ({ key }: { key: string }) => {
      if (key === MASTER_KEY) return { contentLength: 5 * 1024 * 1024, contentType: 'image/webp' }
      if (key === THUMB_KEY) return { contentLength: 100 * 1024, contentType: 'image/webp' }
      return null
    })
    getObjectRangeMock.mockResolvedValue(WEBP_MAGIC)
    deleteObjectMock.mockResolvedValue(undefined)
  })

  it('inserts the row and returns 200 when both keys are valid', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    const res = await POST(req(validBody), ctx)
    expect(res.status).toBe(200)
  })

  it('rejects with 400 and deletes both keys when the master is missing (thumb-only asymmetric failure — reverse case)', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    headObjectMock.mockImplementation(async ({ key }: { key: string }) => (key === THUMB_KEY ? { contentLength: 100 * 1024, contentType: 'image/webp' } : null))
    const res = await POST(req(validBody), ctx)
    expect(res.status).toBe(400)
    expect(deleteObjectMock).toHaveBeenCalledWith(expect.anything(), MASTER_KEY)
    expect(deleteObjectMock).toHaveBeenCalledWith(expect.anything(), THUMB_KEY)
  })

  it('rejects with 400 and deletes both keys when the thumb is missing (master-only asymmetric failure)', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    headObjectMock.mockImplementation(async ({ key }: { key: string }) => (key === MASTER_KEY ? { contentLength: 5 * 1024 * 1024, contentType: 'image/webp' } : null))
    const res = await POST(req(validBody), ctx)
    expect(res.status).toBe(400)
    expect(deleteObjectMock).toHaveBeenCalledWith(expect.anything(), MASTER_KEY)
    expect(deleteObjectMock).toHaveBeenCalledWith(expect.anything(), THUMB_KEY)
  })

  it('rejects with 413 when the master exceeds the 20MB photo cap', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    headObjectMock.mockImplementation(async ({ key }: { key: string }) => {
      if (key === MASTER_KEY) return { contentLength: 21 * 1024 * 1024, contentType: 'image/webp' }
      if (key === THUMB_KEY) return { contentLength: 100 * 1024, contentType: 'image/webp' }
      return null
    })
    const res = await POST(req(validBody), ctx)
    expect(res.status).toBe(413)
    expect(deleteObjectMock).toHaveBeenCalledTimes(2)
  })

  it('rejects with 413 when the thumb exceeds the 2MB cap', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    headObjectMock.mockImplementation(async ({ key }: { key: string }) => {
      if (key === MASTER_KEY) return { contentLength: 5 * 1024 * 1024, contentType: 'image/webp' }
      if (key === THUMB_KEY) return { contentLength: 3 * 1024 * 1024, contentType: 'image/webp' }
      return null
    })
    const res = await POST(req(validBody), ctx)
    expect(res.status).toBe(413)
  })

  it('rejects with 400 when the magic bytes do not match the declared content type', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    getObjectRangeMock.mockResolvedValue(Buffer.from('not-a-real-webp-header'))
    const res = await POST(req(validBody), ctx)
    expect(res.status).toBe(400)
    expect(deleteObjectMock).toHaveBeenCalledTimes(2)
  })

  it('is idempotent — returns the existing row instead of inserting a duplicate for the same storage_key', async () => {
    const existing = { id: 'media-existing', storage_key: MASTER_KEY }
    createServerClientMock.mockReturnValue(makeSupabaseMock({ existingRow: existing }))
    const res = await POST(req(validBody), ctx)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('media-existing')
  })

  it('returns 404 when the event is not owned by the caller', async () => {
    const mock = makeSupabaseMock()
    mock.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'events') {
        const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), is: vi.fn() }
        chain.select = vi.fn().mockReturnValue(chain)
        chain.eq = vi.fn().mockReturnValue(chain)
        chain.is = vi.fn().mockReturnValue(chain)
        chain.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
        return chain
      }
      return makeMediaChain(null, { id: 'media-1' }).selectChain
    })
    createServerClientMock.mockReturnValue(mock)
    const res = await POST(req(validBody), ctx)
    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "__tests__/api/events/[id]/media/commit.test.ts"`
Expected: FAIL — module not found

- [ ] **Step 3: Write `app/api/events/[id]/media/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { commitMediaSchema, uuidSchema } from '@/lib/validations/media'
import { assertEventOwnership } from '@/lib/media/ownership'
import { headObject, getObjectRange, deleteObject, R2_BUCKET_PRIVATE } from '@/lib/storage/r2'

const MAX_MASTER_BYTES = 20 * 1024 * 1024
const MAX_THUMB_BYTES = 2 * 1024 * 1024
const MAX_VIDEO_BYTES = 500 * 1024 * 1024

function checkMagicBytes(bytes: Buffer, contentType: string): boolean {
  if (contentType === 'image/webp') {
    return bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP'
  }
  if (contentType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  if (contentType === 'image/png') {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  }
  if (contentType === 'image/avif' || contentType === 'video/mp4' || contentType === 'video/quicktime') {
    return bytes.subarray(4, 8).toString() === 'ftyp'
  }
  return false
}

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

    const owned = await assertEventOwnership(supabase, id, user.id)
    if (!owned) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = commitMediaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { kind, masterKey, thumbKey, contentType, width, height, durationSec } = parsed.data

    // Idempotency (best-effort — see spec §10 #7 for the residual race window)
    const { data: existing } = await supabase
      .from('event_media')
      .select('*')
      .eq('storage_key', masterKey)
      .single()
    if (existing) {
      return NextResponse.json(existing, { status: 200 })
    }

    async function rejectAndCleanup(status: number, error: string) {
      await Promise.all([
        deleteObject(R2_BUCKET_PRIVATE, masterKey).catch(() => {}),
        deleteObject(R2_BUCKET_PRIVATE, thumbKey).catch(() => {}),
      ])
      return NextResponse.json({ error }, { status })
    }

    const [masterHead, thumbHead] = await Promise.all([
      headObject({ bucket: R2_BUCKET_PRIVATE, key: masterKey }),
      headObject({ bucket: R2_BUCKET_PRIVATE, key: thumbKey }),
    ])

    if (!masterHead) return rejectAndCleanup(400, 'Master object was not found in storage')
    if (!thumbHead) return rejectAndCleanup(400, 'Thumbnail object was not found in storage')

    const masterCap = kind === 'video' ? MAX_VIDEO_BYTES : MAX_MASTER_BYTES
    if (masterHead.contentLength > masterCap) return rejectAndCleanup(413, 'File exceeds the size limit')
    if (thumbHead.contentLength > MAX_THUMB_BYTES) return rejectAndCleanup(413, 'Thumbnail exceeds the size limit')

    const magicBytes = await getObjectRange({ bucket: R2_BUCKET_PRIVATE, key: masterKey, start: 0, end: 15 })
    if (!checkMagicBytes(magicBytes, contentType)) {
      return rejectAndCleanup(400, 'File content does not match the declared type')
    }

    const { data: inserted, error: insertError } = await supabase
      .from('event_media')
      .insert({
        event_id: id,
        kind,
        storage_key: masterKey,
        thumbnail_key: thumbKey,
        content_type: contentType,
        byte_size: masterHead.contentLength,
        width,
        height,
        duration_sec: durationSec ?? null,
        created_by: user.id,
      })
      .select('*')
      .single()

    if (insertError || !inserted) {
      console.error('POST /api/events/[id]/media commit failed:', insertError)
      return NextResponse.json({ error: 'Failed to save media' }, { status: 500 })
    }

    return NextResponse.json(inserted, { status: 200 })
  } catch (err) {
    console.error('POST /api/events/[id]/media failed:', err)
    return NextResponse.json({ error: 'Failed to commit media' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "__tests__/api/events/[id]/media/commit.test.ts"`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add "app/api/events/[id]/media/route.ts" "__tests__/api/events/[id]/media/commit.test.ts"
git commit -m "feat(media): add commit route — dual-key verification, magic-byte check, idempotency"
```

---

## Task 5: Signed URL routes (single + batched)

**Files:**
- Create: `app/api/events/[id]/media/[mediaId]/url/route.ts`
- Create: `app/api/events/[id]/media/urls/route.ts`
- Test: `__tests__/api/events/[id]/media/urls.test.ts`

**Interfaces:**
- Consumes: `assertEventOwnership` (Task 1), `batchUrlsSchema` (Task 2), `getSignedDownloadUrl` (existing `r2.ts`), `R2_BUCKET_PRIVATE`.
- Produces: single-URL route returns `{ url: string, expiresAt: number }`; batch route returns `{ [mediaId: string]: { url: string, expiresAt: number } }` — consumed by Task 13's client-side signed-URL cache.

- [ ] **Step 1: Write the failing test (batch route — this is the primary read path; single route is the onError fallback, covered by the same test file for brevity)**

```typescript
// __tests__/api/events/[id]/media/urls.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createServerClientMock, getSignedDownloadUrlMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  getSignedDownloadUrlMock: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({ createServerClient: createServerClientMock }))
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }) }))
vi.mock('@/lib/storage/r2', async () => {
  const actual = await vi.importActual<typeof import('@/lib/storage/r2')>('@/lib/storage/r2')
  return { ...actual, getSignedDownloadUrl: getSignedDownloadUrlMock, R2_BUCKET_PRIVATE: 'evenzi-private' }
})

import { POST } from '@/app/api/events/[id]/media/urls/route'

const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000'
const MEDIA_ID_1 = '660e8400-e29b-41d4-a716-446655440001'
const MEDIA_ID_2 = '770e8400-e29b-41d4-a716-446655440002'

function makeOwnerChain() {
  const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), is: vi.fn() }
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.is = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data: { id: EVENT_ID }, error: null })
  return chain
}

function makeMediaListChain(rows: { id: string; storage_key: string }[]) {
  const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), in: vi.fn() }
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.in = vi.fn().mockResolvedValue({ data: rows, error: null })
  return chain
}

function makeSupabaseMock(rows: { id: string; storage_key: string }[]) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => (table === 'events' ? makeOwnerChain() : makeMediaListChain(rows))),
  }
}

function req(body: unknown) {
  return new Request(`http://localhost/api/events/${EVENT_ID}/media/urls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const ctx = { params: Promise.resolve({ id: EVENT_ID }) }

describe('POST /api/events/[id]/media/urls (batch)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSignedDownloadUrlMock.mockResolvedValue('https://r2.example.com/signed-get-url')
  })

  it('returns a map of id to signed URL for each requested id owned by the event', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock([
      { id: MEDIA_ID_1, storage_key: `events/${EVENT_ID}/media/a.webp` },
      { id: MEDIA_ID_2, storage_key: `events/${EVENT_ID}/media/b.webp` },
    ]))
    const res = await POST(req({ mediaIds: [MEDIA_ID_1, MEDIA_ID_2] }), ctx)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body[MEDIA_ID_1].url).toBe('https://r2.example.com/signed-get-url')
    expect(body[MEDIA_ID_2].url).toBe('https://r2.example.com/signed-get-url')
    expect(typeof body[MEDIA_ID_1].expiresAt).toBe('number')
  })

  it('omits ids that do not belong to this event (scoped by the eq(event_id) filter)', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock([{ id: MEDIA_ID_1, storage_key: `events/${EVENT_ID}/media/a.webp` }]))
    const res = await POST(req({ mediaIds: [MEDIA_ID_1, MEDIA_ID_2] }), ctx)
    const body = await res.json()
    expect(body[MEDIA_ID_1]).toBeDefined()
    expect(body[MEDIA_ID_2]).toBeUndefined()
  })

  it('returns 400 for more than 200 ids', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock([]))
    const ids = Array.from({ length: 201 }, () => MEDIA_ID_1)
    const res = await POST(req({ mediaIds: ids }), ctx)
    expect(res.status).toBe(400)
  })

  it('returns 404 when the event is not owned by the caller', async () => {
    const mock = makeSupabaseMock([])
    mock.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'events') {
        const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), is: vi.fn() }
        chain.select = vi.fn().mockReturnValue(chain)
        chain.eq = vi.fn().mockReturnValue(chain)
        chain.is = vi.fn().mockReturnValue(chain)
        chain.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
        return chain
      }
      return makeMediaListChain([])
    })
    createServerClientMock.mockReturnValue(mock)
    const res = await POST(req({ mediaIds: [MEDIA_ID_1] }), ctx)
    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "__tests__/api/events/[id]/media/urls.test.ts"`
Expected: FAIL — module not found

- [ ] **Step 3: Write `app/api/events/[id]/media/urls/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { batchUrlsSchema, uuidSchema } from '@/lib/validations/media'
import { assertEventOwnership } from '@/lib/media/ownership'
import { getSignedDownloadUrl, R2_BUCKET_PRIVATE } from '@/lib/storage/r2'

const SIGNED_URL_EXPIRES_IN = 3600

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

    const owned = await assertEventOwnership(supabase, id, user.id)
    if (!owned) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = batchUrlsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { data: rows } = await supabase
      .from('event_media')
      .select('id, storage_key')
      .eq('event_id', id)
      .in('id', parsed.data.mediaIds)

    const result: Record<string, { url: string; expiresAt: number }> = {}
    await Promise.all(
      (rows ?? []).map(async (row: { id: string; storage_key: string }) => {
        const url = await getSignedDownloadUrl(row.storage_key, {
          bucket: R2_BUCKET_PRIVATE,
          expiresIn: SIGNED_URL_EXPIRES_IN,
        })
        result[row.id] = { url, expiresAt: Date.now() + SIGNED_URL_EXPIRES_IN * 1000 }
      })
    )

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    console.error('POST /api/events/[id]/media/urls failed:', err)
    return NextResponse.json({ error: 'Failed to sign URLs' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Write `app/api/events/[id]/media/[mediaId]/url/route.ts`** (single-URL fallback, no test — trivial subset of the batch route's logic, exercised in the live-browser pass per spec §8)

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { uuidSchema } from '@/lib/validations/media'
import { assertEventOwnership } from '@/lib/media/ownership'
import { getSignedDownloadUrl, R2_BUCKET_PRIVATE } from '@/lib/storage/r2'

const SIGNED_URL_EXPIRES_IN = 3600

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
): Promise<NextResponse> {
  try {
    const { id, mediaId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(mediaId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const owned = await assertEventOwnership(supabase, id, user.id)
    if (!owned) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const { data: row } = await supabase
      .from('event_media')
      .select('storage_key')
      .eq('event_id', id)
      .eq('id', mediaId)
      .single()

    if (!row) return NextResponse.json({ error: 'Media not found' }, { status: 404 })

    const url = await getSignedDownloadUrl(row.storage_key, {
      bucket: R2_BUCKET_PRIVATE,
      expiresIn: SIGNED_URL_EXPIRES_IN,
    })

    return NextResponse.json({ url, expiresAt: Date.now() + SIGNED_URL_EXPIRES_IN * 1000 }, { status: 200 })
  } catch (err) {
    console.error('GET /api/events/[id]/media/[mediaId]/url failed:', err)
    return NextResponse.json({ error: 'Failed to sign URL' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run "__tests__/api/events/[id]/media/urls.test.ts"`
Expected: PASS (4 tests)

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 7: Commit**

```bash
git add "app/api/events/[id]/media/urls/route.ts" "app/api/events/[id]/media/[mediaId]/url/route.ts" "__tests__/api/events/[id]/media/urls.test.ts"
git commit -m "feat(media): add batched + single signed-URL read routes"
```

---

## Task 6: Delete routes (single + bulk)

**Files:**
- Create: `app/api/events/[id]/media/[mediaId]/route.ts`
- Create: `app/api/events/[id]/media/bulk-delete/route.ts`
- Test: `__tests__/api/events/[id]/media/delete.test.ts`
- Test: `__tests__/api/events/[id]/media/bulk-delete.test.ts`

**Interfaces:**
- Consumes: `assertEventOwnership` (Task 1), `bulkDeleteSchema` (Task 2), `deleteObject` (existing `r2.ts`), `R2_BUCKET_PRIVATE`.
- Produces: single delete → `204` on success. Bulk delete → `{ deleted: string[], failed: {id: string, reason: string}[] }` — consumed by Task 11's optimistic-mutation hook.

- [ ] **Step 1: Write the failing test for single delete**

```typescript
// __tests__/api/events/[id]/media/delete.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createServerClientMock, deleteObjectMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  deleteObjectMock: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({ createServerClient: createServerClientMock }))
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }) }))
vi.mock('@/lib/storage/r2', async () => {
  const actual = await vi.importActual<typeof import('@/lib/storage/r2')>('@/lib/storage/r2')
  return { ...actual, deleteObject: deleteObjectMock, R2_BUCKET_PRIVATE: 'evenzi-private' }
})

import { DELETE } from '@/app/api/events/[id]/media/[mediaId]/route'

const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000'
const MEDIA_ID = '660e8400-e29b-41d4-a716-446655440001'

function makeOwnerChain() {
  const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), is: vi.fn() }
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.is = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data: { id: EVENT_ID }, error: null })
  return chain
}

function makeMediaDeleteChain(row: unknown) {
  const findChain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn() }
  findChain.select = vi.fn().mockReturnValue(findChain)
  findChain.eq = vi.fn().mockReturnValue(findChain)
  findChain.single = vi.fn().mockResolvedValue({ data: row, error: row ? null : { message: 'not found' } })

  const delChain: Record<string, unknown> = { delete: vi.fn(), eq: vi.fn() }
  delChain.delete = vi.fn().mockReturnValue(delChain)
  delChain.eq = vi.fn().mockResolvedValue({ error: null })

  return { findChain, delChain }
}

function makeSupabaseMock(row: unknown) {
  const { findChain, delChain } = makeMediaDeleteChain(row)
  let callCount = 0
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'events') return makeOwnerChain()
      callCount++
      return callCount === 1 ? findChain : delChain
    }),
  }
}

const ctx = { params: Promise.resolve({ id: EVENT_ID, mediaId: MEDIA_ID }) }
const req = new Request(`http://localhost/api/events/${EVENT_ID}/media/${MEDIA_ID}`, { method: 'DELETE' })

describe('DELETE /api/events/[id]/media/[mediaId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deleteObjectMock.mockResolvedValue(undefined)
  })

  it('returns 404 when the media row does not exist', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock(null))
    const res = await DELETE(req, ctx)
    expect(res.status).toBe(404)
  })

  it('deletes the row then purges both R2 keys, returns 204', async () => {
    const row = { id: MEDIA_ID, storage_key: 'events/x/media/a.webp', thumbnail_key: 'events/x/media/a_thumb.webp' }
    createServerClientMock.mockReturnValue(makeSupabaseMock(row))
    const res = await DELETE(req, ctx)
    expect(res.status).toBe(204)
    expect(deleteObjectMock).toHaveBeenCalledWith(expect.anything(), row.storage_key)
    expect(deleteObjectMock).toHaveBeenCalledWith(expect.anything(), row.thumbnail_key)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "__tests__/api/events/[id]/media/delete.test.ts"`
Expected: FAIL — module not found

- [ ] **Step 3: Write `app/api/events/[id]/media/[mediaId]/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { uuidSchema } from '@/lib/validations/media'
import { assertEventOwnership } from '@/lib/media/ownership'
import { deleteObject, R2_BUCKET_PRIVATE } from '@/lib/storage/r2'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
): Promise<NextResponse> {
  try {
    const { id, mediaId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(mediaId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const owned = await assertEventOwnership(supabase, id, user.id)
    if (!owned) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const { data: row } = await supabase
      .from('event_media')
      .select('storage_key, thumbnail_key')
      .eq('event_id', id)
      .eq('id', mediaId)
      .single()

    if (!row) return NextResponse.json({ error: 'Media not found' }, { status: 404 })

    // DB row deleted first (source of truth for the UI); R2 purge is best-effort after.
    const { error: deleteError } = await supabase.from('event_media').delete().eq('id', mediaId)
    if (deleteError) {
      console.error('DELETE /api/events/[id]/media/[mediaId] db delete failed:', deleteError)
      return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 })
    }

    await Promise.all([
      deleteObject(R2_BUCKET_PRIVATE, row.storage_key).catch((e) => console.error('R2 delete failed (orphan):', e)),
      deleteObject(R2_BUCKET_PRIVATE, row.thumbnail_key).catch((e) => console.error('R2 delete failed (orphan):', e)),
    ])

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('DELETE /api/events/[id]/media/[mediaId] failed:', err)
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "__tests__/api/events/[id]/media/delete.test.ts"`
Expected: PASS (2 tests)

- [ ] **Step 5: Write the failing test for bulk-delete**

```typescript
// __tests__/api/events/[id]/media/bulk-delete.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createServerClientMock, deleteObjectMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  deleteObjectMock: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({ createServerClient: createServerClientMock }))
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }) }))
vi.mock('@/lib/storage/r2', async () => {
  const actual = await vi.importActual<typeof import('@/lib/storage/r2')>('@/lib/storage/r2')
  return { ...actual, deleteObject: deleteObjectMock, R2_BUCKET_PRIVATE: 'evenzi-private' }
})

import { POST } from '@/app/api/events/[id]/media/bulk-delete/route'

const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000'
const ID_A = '660e8400-e29b-41d4-a716-446655440001'
const ID_B = '770e8400-e29b-41d4-a716-446655440002'
const ID_OTHER_EVENT = '880e8400-e29b-41d4-a716-446655440003'

function makeOwnerChain() {
  const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), is: vi.fn() }
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.is = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data: { id: EVENT_ID }, error: null })
  return chain
}

function makeMediaChain(rows: { id: string; storage_key: string; thumbnail_key: string }[]) {
  const selectChain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), in: vi.fn() }
  selectChain.select = vi.fn().mockReturnValue(selectChain)
  selectChain.eq = vi.fn().mockReturnValue(selectChain)
  selectChain.in = vi.fn().mockResolvedValue({ data: rows, error: null })

  const delChain: Record<string, unknown> = { delete: vi.fn(), in: vi.fn() }
  delChain.delete = vi.fn().mockReturnValue(delChain)
  delChain.in = vi.fn().mockResolvedValue({ error: null })

  return { selectChain, delChain }
}

function makeSupabaseMock(rows: { id: string; storage_key: string; thumbnail_key: string }[]) {
  const { selectChain, delChain } = makeMediaChain(rows)
  let callCount = 0
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'events') return makeOwnerChain()
      callCount++
      return callCount === 1 ? selectChain : delChain
    }),
  }
}

function req(body: unknown) {
  return new Request(`http://localhost/api/events/${EVENT_ID}/media/bulk-delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const ctx = { params: Promise.resolve({ id: EVENT_ID }) }

describe('POST /api/events/[id]/media/bulk-delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deleteObjectMock.mockResolvedValue(undefined)
  })

  it('deletes rows scoped to the event and returns them as deleted', async () => {
    const rows = [
      { id: ID_A, storage_key: 'k-a', thumbnail_key: 'k-a-thumb' },
      { id: ID_B, storage_key: 'k-b', thumbnail_key: 'k-b-thumb' },
    ]
    createServerClientMock.mockReturnValue(makeSupabaseMock(rows))
    const res = await POST(req({ ids: [ID_A, ID_B, ID_OTHER_EVENT] }), ctx)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.deleted.sort()).toEqual([ID_A, ID_B].sort())
    // ID_OTHER_EVENT never resolved to a row scoped to this event, so it's reported failed, not silently dropped
    expect(body.failed.map((f: { id: string }) => f.id)).toContain(ID_OTHER_EVENT)
  })

  it('rejects a batch over 100 ids with 400', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock([]))
    const ids = Array.from({ length: 101 }, () => ID_A)
    const res = await POST(req({ ids }), ctx)
    expect(res.status).toBe(400)
  })

  it('returns 404 when the event is not owned by the caller', async () => {
    const mock = makeSupabaseMock([])
    mock.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'events') {
        const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), is: vi.fn() }
        chain.select = vi.fn().mockReturnValue(chain)
        chain.eq = vi.fn().mockReturnValue(chain)
        chain.is = vi.fn().mockReturnValue(chain)
        chain.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
        return chain
      }
      return makeMediaChain([]).selectChain
    })
    createServerClientMock.mockReturnValue(mock)
    const res = await POST(req({ ids: [ID_A] }), ctx)
    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run "__tests__/api/events/[id]/media/bulk-delete.test.ts"`
Expected: FAIL — module not found

- [ ] **Step 7: Write `app/api/events/[id]/media/bulk-delete/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { bulkDeleteSchema, uuidSchema } from '@/lib/validations/media'
import { assertEventOwnership } from '@/lib/media/ownership'
import { deleteObject, R2_BUCKET_PRIVATE } from '@/lib/storage/r2'

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

    const owned = await assertEventOwnership(supabase, id, user.id)
    if (!owned) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = bulkDeleteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { ids } = parsed.data

    // Every id must resolve to a row scoped to THIS event — ids that don't
    // (wrong event, or don't exist) are reported failed, never silently
    // dropped or acted on.
    const { data: rows } = await supabase
      .from('event_media')
      .select('id, storage_key, thumbnail_key')
      .eq('event_id', id)
      .in('id', ids)

    const foundIds = new Set((rows ?? []).map((r: { id: string }) => r.id))
    const failed: { id: string; reason: string }[] = ids
      .filter((mediaId) => !foundIds.has(mediaId))
      .map((mediaId) => ({ id: mediaId, reason: 'not found' }))

    if (!rows || rows.length === 0) {
      return NextResponse.json({ deleted: [], failed }, { status: 200 })
    }

    const idsToDelete = rows.map((r: { id: string }) => r.id)

    // DB rows deleted first (source of truth for the UI), then best-effort R2 purge.
    const { error: deleteError } = await supabase.from('event_media').delete().in('id', idsToDelete)
    if (deleteError) {
      console.error('POST /api/events/[id]/media/bulk-delete db delete failed:', deleteError)
      return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 })
    }

    await Promise.all(
      rows.flatMap((row: { storage_key: string; thumbnail_key: string }) => [
        deleteObject(R2_BUCKET_PRIVATE, row.storage_key).catch((e) => console.error('R2 delete failed (orphan):', e)),
        deleteObject(R2_BUCKET_PRIVATE, row.thumbnail_key).catch((e) => console.error('R2 delete failed (orphan):', e)),
      ])
    )

    return NextResponse.json({ deleted: idsToDelete, failed }, { status: 200 })
  } catch (err) {
    console.error('POST /api/events/[id]/media/bulk-delete failed:', err)
    return NextResponse.json({ error: 'Failed to bulk-delete media' }, { status: 500 })
  }
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run "__tests__/api/events/[id]/media/bulk-delete.test.ts"`
Expected: PASS (3 tests)

- [ ] **Step 9: Commit**

```bash
git add "app/api/events/[id]/media/[mediaId]/route.ts" "app/api/events/[id]/media/bulk-delete/route.ts" "__tests__/api/events/[id]/media/delete.test.ts" "__tests__/api/events/[id]/media/bulk-delete.test.ts"
git commit -m "feat(media): add single + bulk delete routes (DB-first order, per-id result)"
```

---

## Task 7: Album routes (create, rename/delete, assign)

**Files:**
- Create: `app/api/events/[id]/media/albums/route.ts`
- Create: `app/api/events/[id]/media/albums/[albumId]/route.ts`
- Create: `app/api/events/[id]/media/[mediaId]/albums/route.ts`
- Test: `__tests__/api/events/[id]/media/albums.test.ts`

**Interfaces:**
- Consumes: `assertEventOwnership` (Task 1), `createAlbumSchema`/`renameAlbumSchema`/`assignAlbumsSchema` (Task 2).
- Produces: album CRUD JSON responses, consumed by Task 12's client wiring.

- [ ] **Step 1: Write the failing test (covers create-duplicate-409, rename-duplicate-409, assign-add-noop-on-duplicate)**

```typescript
// __tests__/api/events/[id]/media/albums.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createServerClientMock } = vi.hoisted(() => ({ createServerClientMock: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createServerClient: createServerClientMock }))
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }) }))

import { POST as createAlbum } from '@/app/api/events/[id]/media/albums/route'
import { PATCH as renameAlbum } from '@/app/api/events/[id]/media/albums/[albumId]/route'
import { PATCH as assignAlbums } from '@/app/api/events/[id]/media/[mediaId]/albums/route'

const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000'
const ALBUM_ID = '660e8400-e29b-41d4-a716-446655440001'
const MEDIA_ID = '770e8400-e29b-41d4-a716-446655440002'

function makeOwnerChain() {
  const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), is: vi.fn() }
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.is = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data: { id: EVENT_ID }, error: null })
  return chain
}

describe('POST /api/events/[id]/media/albums (create)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 409 with a friendly message on a duplicate name (23505)', async () => {
    const insertChain: Record<string, unknown> = { insert: vi.fn(), select: vi.fn() }
    insertChain.insert = vi.fn().mockReturnValue(insertChain)
    insertChain.select = vi.fn().mockReturnValue(insertChain)
    insertChain.single = vi.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate key' } })

    createServerClientMock.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: vi.fn().mockImplementation((table: string) => (table === 'events' ? makeOwnerChain() : insertChain)),
    })

    const req = new Request(`http://localhost/api/events/${EVENT_ID}/media/albums`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sangeet' }),
    })
    const res = await createAlbum(req, { params: Promise.resolve({ id: EVENT_ID }) })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('An album with this name already exists')
  })
})

describe('PATCH /api/events/[id]/media/albums/[albumId] (rename)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 409 with a friendly message on a duplicate name (23505)', async () => {
    const updateChain: Record<string, unknown> = { update: vi.fn(), eq: vi.fn(), select: vi.fn() }
    updateChain.update = vi.fn().mockReturnValue(updateChain)
    updateChain.eq = vi.fn().mockReturnValue(updateChain)
    updateChain.select = vi.fn().mockReturnValue(updateChain)
    updateChain.single = vi.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate key' } })

    createServerClientMock.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: vi.fn().mockImplementation((table: string) => (table === 'events' ? makeOwnerChain() : updateChain)),
    })

    const req = new Request(`http://localhost/api/events/${EVENT_ID}/media/albums/${ALBUM_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sangeet' }),
    })
    const res = await renameAlbum(req, { params: Promise.resolve({ id: EVENT_ID, albumId: ALBUM_ID }) })
    expect(res.status).toBe(409)
  })
})

describe('PATCH /api/events/[id]/media/[mediaId]/albums (assign)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('treats an add-on-already-present album as a no-op success (23505 swallowed)', async () => {
    const insertChain: Record<string, unknown> = { insert: vi.fn() }
    insertChain.insert = vi.fn().mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } })

    createServerClientMock.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: vi.fn().mockImplementation((table: string) => (table === 'events' ? makeOwnerChain() : insertChain)),
    })

    const req = new Request(`http://localhost/api/events/${EVENT_ID}/media/${MEDIA_ID}/albums`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'add', albumIds: [ALBUM_ID] }),
    })
    const res = await assignAlbums(req, { params: Promise.resolve({ id: EVENT_ID, mediaId: MEDIA_ID }) })
    expect(res.status).toBe(200)
  })

  it('returns 400 for an invalid mode', async () => {
    createServerClientMock.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: vi.fn().mockReturnValue(makeOwnerChain()),
    })
    const req = new Request(`http://localhost/api/events/${EVENT_ID}/media/${MEDIA_ID}/albums`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'replace', albumIds: [ALBUM_ID] }),
    })
    const res = await assignAlbums(req, { params: Promise.resolve({ id: EVENT_ID, mediaId: MEDIA_ID }) })
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "__tests__/api/events/[id]/media/albums.test.ts"`
Expected: FAIL — modules not found

- [ ] **Step 3: Write `app/api/events/[id]/media/albums/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createAlbumSchema, uuidSchema } from '@/lib/validations/media'
import { assertEventOwnership } from '@/lib/media/ownership'

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

    const owned = await assertEventOwnership(supabase, id, user.id)
    if (!owned) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = createAlbumSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { data: album, error: insertError } = await supabase
      .from('event_albums')
      .insert({ event_id: id, name: parsed.data.name, is_custom: true, created_by: user.id })
      .select('*')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'An album with this name already exists' }, { status: 409 })
      }
      console.error('POST /api/events/[id]/media/albums failed:', insertError)
      return NextResponse.json({ error: 'Failed to create album' }, { status: 500 })
    }

    return NextResponse.json(album, { status: 201 })
  } catch (err) {
    console.error('POST /api/events/[id]/media/albums failed:', err)
    return NextResponse.json({ error: 'Failed to create album' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Write `app/api/events/[id]/media/albums/[albumId]/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { renameAlbumSchema, uuidSchema } from '@/lib/validations/media'
import { assertEventOwnership } from '@/lib/media/ownership'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; albumId: string }> }
): Promise<NextResponse> {
  try {
    const { id, albumId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(albumId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const owned = await assertEventOwnership(supabase, id, user.id)
    if (!owned) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = renameAlbumSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { data: album, error: updateError } = await supabase
      .from('event_albums')
      .update({ name: parsed.data.name })
      .eq('id', albumId)
      .eq('event_id', id)
      .select('*')
      .single()

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json({ error: 'An album with this name already exists' }, { status: 409 })
      }
      console.error('PATCH /api/events/[id]/media/albums/[albumId] failed:', updateError)
      return NextResponse.json({ error: 'Failed to rename album' }, { status: 500 })
    }

    return NextResponse.json(album, { status: 200 })
  } catch (err) {
    console.error('PATCH /api/events/[id]/media/albums/[albumId] failed:', err)
    return NextResponse.json({ error: 'Failed to rename album' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; albumId: string }> }
): Promise<NextResponse> {
  try {
    const { id, albumId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(albumId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const owned = await assertEventOwnership(supabase, id, user.id)
    if (!owned) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    // Links-only delete (D32) — event_media_albums cascades on FK, media rows survive.
    const { error: deleteError } = await supabase.from('event_albums').delete().eq('id', albumId).eq('event_id', id)
    if (deleteError) {
      console.error('DELETE /api/events/[id]/media/albums/[albumId] failed:', deleteError)
      return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('DELETE /api/events/[id]/media/albums/[albumId] failed:', err)
    return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Write `app/api/events/[id]/media/[mediaId]/albums/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { assignAlbumsSchema, uuidSchema } from '@/lib/validations/media'
import { assertEventOwnership } from '@/lib/media/ownership'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
): Promise<NextResponse> {
  try {
    const { id, mediaId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(mediaId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const owned = await assertEventOwnership(supabase, id, user.id)
    if (!owned) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = assignAlbumsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { mode, albumIds } = parsed.data

    if (mode === 'remove') {
      const { error: deleteError } = await supabase
        .from('event_media_albums')
        .delete()
        .eq('media_id', mediaId)
        .in('album_id', albumIds)
      if (deleteError) {
        console.error('PATCH [mediaId]/albums (remove) failed:', deleteError)
        return NextResponse.json({ error: 'Failed to unassign album' }, { status: 500 })
      }
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    // mode === 'add' — insert one row per album; a 23505 (already assigned) is a no-op success.
    const results = await Promise.all(
      albumIds.map((albumId) =>
        supabase.from('event_media_albums').insert({ event_id: id, media_id: mediaId, album_id: albumId })
      )
    )
    const hardFailure = results.find((r) => r.error && r.error.code !== '23505')
    if (hardFailure) {
      console.error('PATCH [mediaId]/albums (add) failed:', hardFailure.error)
      return NextResponse.json({ error: 'Failed to assign album' }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('PATCH /api/events/[id]/media/[mediaId]/albums failed:', err)
    return NextResponse.json({ error: 'Failed to update album assignment' }, { status: 500 })
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run "__tests__/api/events/[id]/media/albums.test.ts"`
Expected: PASS (4 tests)

- [ ] **Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 8: Commit**

```bash
git add "app/api/events/[id]/media/albums" "app/api/events/[id]/media/[mediaId]/albums" "__tests__/api/events/[id]/media/albums.test.ts"
git commit -m "feat(media): add album create/rename/delete/assign routes with 409 + no-op handling"
```

---

## Task 8: Read path — `page.tsx`

**Files:**
- Create: `lib/media/formatDuration.ts`
- Modify: `app/events/[id]/media/page.tsx`

**Interfaces:**
- Produces: `formatDuration(sec: number): string` (isomorphic — used server-side here and client-side in Task 10, not duplicated). Produces props passed into `MediaClient` — `{ eventName, initialPhotos, initialVideos, initialAlbums, storage: {usedBytes, photoCount, videoCount} }` — consumed by Task 9/10's `MediaClient.tsx` changes.

- [ ] **Step 1: Write `lib/media/formatDuration.ts`**

The `Video` interface in `MediaClient.tsx` has `duration: string` (formatted, e.g. `"2:14"`) — NOT a raw `duration_sec` number. Both the server read path (this task) and the client upload-success handler (Task 10) need to produce that exact formatted string, so this is a shared, isomorphic utility rather than two copies:

```typescript
// lib/media/formatDuration.ts
export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
```

- [ ] **Step 2: Rewrite `app/events/[id]/media/page.tsx`**

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import { MediaClient } from './MediaClient'
import { formatDuration } from '@/lib/media/formatDuration'

export default async function MediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('events').select('id, name').eq('id', id).single()
  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

  const [mediaResult, albumsResult, linksResult, storageResult] = await Promise.all([
    supabase
      .from('event_media')
      .select('*')
      .eq('event_id', id)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false }),
    supabase.from('event_albums').select('*').eq('event_id', id).order('display_order'),
    supabase.from('event_media_albums').select('media_id, album_id').eq('event_id', id),
    supabase.from('event_media_storage').select('*').eq('event_id', id).single(),
  ])

  const mediaRows = mediaResult.data ?? []
  const albumRows = albumsResult.data ?? []
  const linkRows = linksResult.data ?? []

  const albumIdsByMedia = new Map<string, string[]>()
  for (const link of linkRows as { media_id: string; album_id: string }[]) {
    const list = albumIdsByMedia.get(link.media_id) ?? []
    list.push(link.album_id)
    albumIdsByMedia.set(link.media_id, list)
  }

  const initialPhotos = mediaRows
    .filter((m: { kind: string }) => m.kind === 'photo')
    .map((m: { id: string; name: string | null; original_filename: string | null; created_at: string; taken_at: string | null; published: boolean }) => ({
      id: m.id,
      // Real URL is resolved client-side via the batched signed-URL fetch (Task 13) —
      // starts empty, MediaClient's resolveSrc() falls through to '' until urlCache populates.
      src: '',
      name: m.name ?? m.original_filename ?? 'Photo',
      albumIds: albumIdsByMedia.get(m.id) ?? [],
      uploadedAt: Date.parse(m.created_at),
      takenAt: m.taken_at ? Date.parse(m.taken_at) : undefined,
      published: m.published,
    }))

  const initialVideos = mediaRows
    .filter((m: { kind: string }) => m.kind === 'video')
    .map((m: { id: string; name: string | null; original_filename: string | null; created_at: string; taken_at: string | null; duration_sec: number | null }) => ({
      id: m.id,
      // Same as photos — resolved client-side via urlCache (Task 13).
      poster: '',
      name: m.name ?? m.original_filename ?? 'Video',
      duration: formatDuration(m.duration_sec ?? 0),
      albumIds: albumIdsByMedia.get(m.id) ?? [],
      uploadedAt: Date.parse(m.created_at),
      takenAt: m.taken_at ? Date.parse(m.taken_at) : undefined,
    }))

  const initialAlbums = albumRows.map((a: { id: string; name: string; is_custom: boolean }) => ({
    id: a.id,
    name: a.name,
    preset: !a.is_custom,
  }))

  const storage = storageResult.data
    ? {
        usedBytes: storageResult.data.used_bytes ?? 0,
        photoCount: storageResult.data.photo_count ?? 0,
        videoCount: storageResult.data.video_count ?? 0,
      }
    : { usedBytes: 0, photoCount: 0, videoCount: 0 }

  return (
    <div data-page="media">
      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: eventName.toUpperCase(), href: `/events/${id}` },
          { label: 'MEDIA' },
        ]}
        backHref={`/events/${id}`}
      />
      <main className="page-band pt-10 pb-24" id="md-main">
        <MediaClient
          eventName={eventName}
          eventId={id}
          initialPhotos={initialPhotos}
          initialVideos={initialVideos}
          initialAlbums={initialAlbums}
          storage={storage}
        />
      </main>
      <PageFooter />
    </div>
  )
}
```

**Note for Task 9:** `MediaClient`'s prop signature is changing from `{ eventName: string }` to `{ eventName, eventId, initialPhotos, initialVideos, initialAlbums, storage }` — Task 9 must update the component's props destructuring and remove the `_eventName` unused-var underscore prefix now that `eventName` and the new props are all consumed.

- [ ] **Step 3: Verify TypeScript compiles (will show expected errors in MediaClient.tsx until Task 9)**

Run: `npx tsc --noEmit`
Expected: Errors ONLY in `MediaClient.tsx` about the prop mismatch — confirms `page.tsx` itself is correct and the interface handoff to Task 9 is real, not a typo.

- [ ] **Step 4: Commit**

```bash
git add "app/events/[id]/media/page.tsx" lib/media/formatDuration.ts
git commit -m "feat(media): wire real Promise.all read path in page.tsx"
```

---

## Task 9: Client upload pipeline helper

**Files:**
- Create: `lib/media/uploadPipeline.ts`

**Interfaces:**
- Consumes: `optimizeImage` (existing `lib/storage/imageOptimize.ts`).
- Produces: `runPhotoUploadPipeline(file: File, eventId: string, onProgress: (pct: number) => void, signal: AbortSignal): Promise<UploadedMedia>`, `runVideoUploadPipeline(file: File, eventId: string, onProgress: (pct: number) => void, signal: AbortSignal): Promise<UploadedMedia>`, `UploadedMedia` type (the commit route's response shape), plus `createUploadQueue(concurrency: number)` — consumed by Task 10's `MediaClient.tsx` wiring. The `signal` param is a real `AbortSignal` (standard Web API, not a custom type) — `fetch` honors it natively, and `putWithProgress` below wires it into the `XMLHttpRequest` manually since XHR has no native `AbortSignal` support.

No unit test for this file per the plan's Global Constraints — it's 100% browser-API-dependent (`createImageBitmap`, `<video>`, `XMLHttpRequest`, `heic2any`) and is covered by the live-browser pass only (spec §8, arbiter ruling).

- [ ] **Step 1: Write `lib/media/uploadPipeline.ts`**

```typescript
'use client'

import { optimizeImage } from '@/lib/storage/imageOptimize'

export interface UploadedMedia {
  id: string
  kind: 'photo' | 'video'
  storage_key: string
  thumbnail_key: string
  width: number
  height: number
  duration_sec: number | null
  byte_size: number
  created_at: string
}

interface PresignResponse {
  url: string
  key: string
}

async function getUploadUrl(
  eventId: string,
  kind: 'photo' | 'video',
  part: 'master' | 'thumb',
  contentType: string,
  signal: AbortSignal
): Promise<PresignResponse> {
  const res = await fetch(`/api/events/${eventId}/media/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, part, contentType }),
    signal,
  })
  if (!res.ok) throw new Error(`Failed to get upload URL (${res.status})`)
  return res.json()
}

/**
 * PUT a blob to R2 via XHR (fetch can't report upload progress).
 * XHR has no native AbortSignal support, so `signal`'s abort event is wired
 * to xhr.abort() manually — this is what actually cancels an in-flight PUT
 * when MediaClient unmounts mid-upload (spec §5's optimistic-preview lifecycle).
 */
function putWithProgress(url: string, blob: Blob, contentType: string, onProgress: (pct: number) => void, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Aborted', 'AbortError')); return }
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`PUT failed (${xhr.status})`)))
    xhr.onerror = () => reject(new Error('Network error during upload'))
    const onAbort = () => { xhr.abort(); reject(new DOMException('Aborted', 'AbortError')) }
    signal.addEventListener('abort', onAbort)
    xhr.onloadend = () => signal.removeEventListener('abort', onAbort)
    xhr.send(blob)
  })
}

function isSafariNative(): boolean {
  const ua = navigator.userAgent
  return /^((?!chrome|android|crios|fxios).)*safari/i.test(ua)
}

async function decodeHeicIfNeeded(file: File): Promise<File> {
  const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || /\.hei[cf]$/i.test(file.name)
  if (!isHeic || isSafariNative()) return file
  try {
    const heic2any = (await import('heic2any')).default as (opts: { blob: Blob; toType?: string; quality?: number }) => Promise<Blob | Blob[]>
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
    const blob = Array.isArray(converted) ? converted[0] : converted
    return new File([blob], file.name.replace(/\.hei[cf]$/i, '.jpg'), { type: 'image/jpeg' })
  } catch {
    throw new Error('This HEIC photo could not be converted — try exporting it as JPEG first.')
  }
}

export async function runPhotoUploadPipeline(
  file: File,
  eventId: string,
  onProgress: (pct: number) => void,
  signal: AbortSignal
): Promise<UploadedMedia> {
  const decoded = await decodeHeicIfNeeded(file)
  const optimized = await optimizeImage(decoded)

  const [masterPresign, thumbPresign] = await Promise.all([
    getUploadUrl(eventId, 'photo', 'master', optimized.masterType, signal),
    getUploadUrl(eventId, 'photo', 'thumb', optimized.thumbType, signal),
  ])

  let masterPct = 0
  let thumbPct = 0
  const report = () => onProgress(Math.round((masterPct + thumbPct) / 2))

  await Promise.all([
    putWithProgress(masterPresign.url, optimized.master, optimized.masterType, (p) => { masterPct = p; report() }, signal),
    putWithProgress(thumbPresign.url, optimized.thumb, optimized.thumbType, (p) => { thumbPct = p; report() }, signal),
  ])

  const res = await fetch(`/api/events/${eventId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'photo',
      masterKey: masterPresign.key,
      thumbKey: thumbPresign.key,
      contentType: optimized.masterType,
      width: optimized.width,
      height: optimized.height,
    }),
    signal,
  })
  if (!res.ok) throw new Error(`Failed to save photo (${res.status})`)
  return res.json()
}

const VIDEO_SEEK_TIMEOUT_MS = 8000

async function capturePosterFrame(file: File): Promise<{ blob: Blob; durationSec: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.src = URL.createObjectURL(file)

    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Video took too long to load a preview frame'))
    }, VIDEO_SEEK_TIMEOUT_MS)

    function cleanup() {
      clearTimeout(timeout)
      URL.revokeObjectURL(video.src)
    }

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration / 2)
    }
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) { cleanup(); reject(new Error('Canvas unavailable')); return }
      ctx.drawImage(video, 0, 0)
      canvas.toBlob((blob) => {
        cleanup()
        if (!blob) { reject(new Error('Poster capture failed')); return }
        resolve({ blob, durationSec: Math.round(video.duration), width: video.videoWidth, height: video.videoHeight })
      }, 'image/webp', 0.8)
    }
    video.onerror = () => { cleanup(); reject(new Error('Could not read this video file')) }
  })
}

export async function runVideoUploadPipeline(
  file: File,
  eventId: string,
  onProgress: (pct: number) => void,
  signal: AbortSignal
): Promise<UploadedMedia> {
  const poster = await capturePosterFrame(file)

  const [videoPresign, posterPresign] = await Promise.all([
    getUploadUrl(eventId, 'video', 'master', file.type, signal),
    getUploadUrl(eventId, 'video', 'thumb', 'image/webp', signal),
  ])

  let videoPct = 0
  let posterPct = 0
  const report = () => onProgress(Math.round((videoPct + posterPct) / 2))

  await Promise.all([
    putWithProgress(videoPresign.url, file, file.type, (p) => { videoPct = p; report() }, signal),
    putWithProgress(posterPresign.url, poster.blob, 'image/webp', (p) => { posterPct = p; report() }, signal),
  ])

  const res = await fetch(`/api/events/${eventId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'video',
      masterKey: videoPresign.key,
      thumbKey: posterPresign.key,
      contentType: file.type,
      width: poster.width,
      height: poster.height,
      durationSec: poster.durationSec,
    }),
    signal,
  })
  if (!res.ok) throw new Error(`Failed to save video (${res.status})`)
  return res.json()
}

/** Runs up to `concurrency` upload tasks at once; the rest queue. */
export function createUploadQueue(concurrency: number) {
  let active = 0
  const queue: (() => void)[] = []

  function next() {
    if (active >= concurrency || queue.length === 0) return
    active++
    const task = queue.shift()!
    task()
  }

  return {
    run<T>(fn: () => Promise<T>): Promise<T> {
      return new Promise((resolve, reject) => {
        queue.push(() => {
          fn()
            .then((v) => { active--; next(); resolve(v) })
            .catch((e) => { active--; next(); reject(e) })
        })
        next()
      })
    },
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors from `lib/media/uploadPipeline.ts`

- [ ] **Step 3: Commit**

```bash
git add lib/media/uploadPipeline.ts
git commit -m "feat(media): add client-side upload pipeline (optimize, XHR progress, HEIC/Safari branch, queue)"
```

---

## Task 10: Wire upload UI in `MediaClient.tsx`

**Files:**
- Modify: `app/events/[id]/media/MediaClient.tsx`

**Interfaces:**
- Consumes: `runPhotoUploadPipeline`, `runVideoUploadPipeline`, `createUploadQueue` (Task 9); new props from `page.tsx` (Task 8): `eventId`, `initialPhotos`, `initialVideos`, `initialAlbums`, `storage`.

- [ ] **Step 1: Update the component signature and remove mock seeds**

Locate line 181 (`export function MediaClient({ eventName: _eventName }: { eventName: string }) {`) and the three `useState` calls at lines 183/195/206. Replace:

```typescript
// Before:
export function MediaClient({ eventName: _eventName }: { eventName: string }) {
  ...
  const [photos, setPhotos] = useState<Photo[]>([])
  ...
  const [videos, setVideos] = useState<Video[]>([])
  ...
  const [albums, setAlbums] = useState<Album[]>([])

// After:
interface MediaClientProps {
  eventName: string
  eventId: string
  initialPhotos: Photo[]
  initialVideos: Video[]
  initialAlbums: Album[]
  storage: { usedBytes: number; photoCount: number; videoCount: number }
}

export function MediaClient({ eventName: _eventName, eventId, initialPhotos, initialVideos, initialAlbums, storage }: MediaClientProps) {
  ...
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  ...
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  ...
  const [albums, setAlbums] = useState<Album[]>(initialAlbums)
```

- [ ] **Step 2: Replace `STORAGE_MOCK` with the real `storage` prop**

Locate line 42 (`const STORAGE_MOCK = { usedBytes: 0, limitBytes: 5 * 1024 * 1024 * 1024 }`) and every reference to `STORAGE_MOCK.usedBytes`/`STORAGE_MOCK.limitBytes` inside the `derived` `useMemo` (around lines 273-311). Replace the constant:

```typescript
// Before:
const STORAGE_MOCK = { usedBytes: 0, limitBytes: 5 * 1024 * 1024 * 1024 }

// After:
const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024 // hardcoded per D34 — entitlements are [PLANNED]
```

Inside the component, replace every `STORAGE_MOCK.usedBytes` with `storage.usedBytes` and every `STORAGE_MOCK.limitBytes` with `STORAGE_LIMIT_BYTES` (the constant moves outside the component since it's not derived from props; `storage.usedBytes` comes from the new prop).

- [ ] **Step 3: Add upload state and wire the file inputs**

Add near the other `useState` declarations (after the `photos`/`videos`/`albums` state):

```typescript
interface UploadItem {
  id: string
  file: File
  kind: 'photo' | 'video'
  status: 'local-pending' | 'optimizing' | 'uploading' | 'committing' | 'committed' | 'failed'
  progress: number
  previewUrl: string
  error?: string
}

const [uploadItems, setUploadItems] = useState<UploadItem[]>([])
const uploadQueueRef = useRef(createUploadQueue(3))
// Every in-flight upload gets its own AbortController so unmount can cancel
// the real XHR/fetch calls (lib/media/uploadPipeline.ts wires the signal
// into xhr.abort()), not just stop local state updates.
const controllersRef = useRef<Map<string, AbortController>>(new Map())
// Tracks blob: preview URLs still awaiting their real signed URL from Task 13's
// batch fetch, so that effect can revoke them the instant a real URL arrives —
// this ref is the single source of truth for outstanding blob URLs (both this
// step's unmount cleanup and Task 13's revoke-on-arrival logic read/write it).
const blobUrlsRef = useRef<Map<string, string>>(new Map())

useEffect(() => {
  return () => {
    controllersRef.current.forEach((controller) => controller.abort())
    blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])

function updateUploadItem(id: string, patch: Partial<UploadItem>) {
  setUploadItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
}

async function handleFilesPicked(files: FileList, kind: 'photo' | 'video') {
  const newItems: UploadItem[] = Array.from(files).map((file) => ({
    id: `up-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    kind,
    status: 'local-pending',
    progress: 0,
    previewUrl: URL.createObjectURL(file),
  }))
  setUploadItems((prev) => [...prev, ...newItems])

  newItems.forEach((item) => {
    const controller = new AbortController()
    controllersRef.current.set(item.id, controller)

    uploadQueueRef.current.run(async () => {
      updateUploadItem(item.id, { status: 'optimizing' })
      try {
        const runner = kind === 'photo' ? runPhotoUploadPipeline : runVideoUploadPipeline
        updateUploadItem(item.id, { status: 'uploading' })
        const saved = await runner(item.file, eventId, (pct) => {
          updateUploadItem(item.id, { progress: pct })
        }, controller.signal)
        updateUploadItem(item.id, { status: 'committed', progress: 100 })
        // Track this blob URL as "outstanding" — Task 13's signed-URL batch
        // effect will pick up `saved.id`, and once the real URL lands in
        // urlCache it revokes this entry and removes it from the map.
        blobUrlsRef.current.set(saved.id, item.previewUrl)

        if (kind === 'photo') {
          setPhotos((prev) => [{
            id: saved.id,
            src: item.previewUrl,
            name: item.file.name,
            albumIds: [],
            uploadedAt: Date.parse(saved.created_at),
            published: false,
          }, ...prev])
        } else {
          setVideos((prev) => [{
            id: saved.id,
            poster: item.previewUrl,
            name: item.file.name,
            duration: formatDuration(saved.duration_sec ?? 0),
            albumIds: [],
            uploadedAt: Date.parse(saved.created_at),
          }, ...prev])
        }
      } catch (err) {
        if ((err as { name?: string })?.name !== 'AbortError') {
          updateUploadItem(item.id, { status: 'failed', error: err instanceof Error ? err.message : 'Upload failed' })
        }
      } finally {
        controllersRef.current.delete(item.id)
      }
    })
  })
}

function retryUpload(itemId: string) {
  const item = uploadItems.find((it) => it.id === itemId)
  if (!item) return
  setUploadItems((prev) => prev.filter((it) => it.id !== itemId))
  handleFilesPicked({ 0: item.file, length: 1, item: () => item.file } as unknown as FileList, item.kind)
}
```

Add the imports at the top of the file:

```typescript
import { runPhotoUploadPipeline, runVideoUploadPipeline, createUploadQueue } from '@/lib/media/uploadPipeline'
import { formatDuration } from '@/lib/media/formatDuration'
```

- [ ] **Step 4: Wire the file inputs (lines 667 and 845) to `handleFilesPicked`**

```typescript
// Before (line 667):
<input type="file" id="md-file-input" className="media-file-input" multiple accept="image/jpeg,image/png,image/heic" onChange={() => {}} />

// After:
<input
  type="file"
  id="md-file-input"
  className="media-file-input"
  multiple
  accept="image/jpeg,image/png,image/heic"
  onChange={(e) => { if (e.target.files?.length) handleFilesPicked(e.target.files, 'photo'); e.target.value = '' }}
/>
```

```typescript
// Before (line 845):
<input type="file" id="md-vfile-input" className="media-file-input" multiple accept="video/mp4,video/quicktime" onChange={() => {}} />

// After:
<input
  type="file"
  id="md-vfile-input"
  className="media-file-input"
  multiple
  accept="video/mp4,video/quicktime"
  onChange={(e) => { if (e.target.files?.length) handleFilesPicked(e.target.files, 'video'); e.target.value = '' }}
/>
```

- [ ] **Step 5: Wire the upload-progress list (line 668) with throttled `aria-live`**

```typescript
// Before:
<ul className="media-upload-progress" role="list" aria-live="polite" />

// After:
<ul className="media-upload-progress" role="list">
  {uploadItems.map((item) => (
    <li key={item.id} className={`media-upload-item media-upload-item--${item.status}`}>
      <span className="media-upload-item-name">{item.file.name}</span>
      {item.status !== 'failed' && item.status !== 'committed' && (
        <span className="media-upload-item-pct" aria-hidden="true">{item.progress}%</span>
      )}
      <span className="sr-only" aria-live="polite">
        {item.status === 'uploading' && item.progress === 0 ? 'Upload started' : ''}
        {item.status === 'committed' ? 'Upload complete' : ''}
        {item.status === 'failed' ? `Upload failed: ${item.error}` : ''}
      </span>
      {item.status === 'failed' && (
        <button type="button" className="media-upload-item-retry" onClick={() => retryUpload(item.id)}>Retry</button>
      )}
    </li>
  ))}
</ul>
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to the changes above (some pre-existing unrelated errors elsewhere are out of scope)

- [ ] **Step 7: Commit**

```bash
git add "app/events/[id]/media/MediaClient.tsx"
git commit -m "feat(media): wire upload pipeline into MediaClient (file inputs, progress, HEIC/timeout handling)"
```

---

## Task 11: Optimistic mutation hook + wire delete/bulk-delete

**Files:**
- Create: `lib/media/useOptimisticMediaMutation.ts`
- Modify: `app/events/[id]/media/MediaClient.tsx`

**Interfaces:**
- Produces: `useOptimisticMediaMutation<T>()` returning `{ run: (opts: {apply: () => void, revert: () => void, request: () => Promise<T>}) => Promise<T | null>, error: string | null, clearError: () => void }` — consumed by this task's delete wiring and Task 12's album wiring.

- [ ] **Step 1: Write `lib/media/useOptimisticMediaMutation.ts`**

```typescript
'use client'

import { useState, useCallback } from 'react'

interface RunOptions<T> {
  apply: () => void
  revert: () => void
  request: () => Promise<T>
}

/**
 * Shared optimistic-update-with-rollback pattern for Media mutations.
 * Pulls forward the pattern PlanningClient.tsx needed to retrofit after
 * shipping without it — apply the change immediately, fire the request,
 * revert + surface an error on failure.
 */
export function useOptimisticMediaMutation() {
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async <T,>(opts: RunOptions<T>): Promise<T | null> => {
    opts.apply()
    try {
      const result = await opts.request()
      setError(null)
      return result
    } catch (err) {
      opts.revert()
      setError(err instanceof Error ? err.message : 'Something went wrong')
      return null
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { run, error, clearError }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 3: Wire `removePhoto`/`removeVideo`/`bulkDeletePhotos`/`bulkDeleteVideos` in `MediaClient.tsx`**

Add the hook near the top of the component body (after the `useState` declarations):

```typescript
const mediaMutation = useOptimisticMediaMutation()
```

Add the import:

```typescript
import { useOptimisticMediaMutation } from '@/lib/media/useOptimisticMediaMutation'
```

Replace the four functions (found at the line numbers noted in this session's earlier read: `removePhoto` ~514, `removeVideo` ~522, `bulkDeletePhotos` ~528, `bulkDeleteVideos` ~536):

```typescript
// Before:
function removePhoto(id: string) {
  const next = photos.filter(p => p.id !== id)
  if (coverId === id) setCoverId(next.length ? next.slice().sort((a, b) => b.uploadedAt - a.uploadedAt)[0].id : null)
  setPhotos(next)
  togglePhotoSelect(id, false)
  setLightboxOpen(false); setRemovePhotoModalOpen(false)
}

// After:
function removePhoto(id: string) {
  const snapshot = photos
  const snapshotCoverId = coverId
  mediaMutation.run({
    apply: () => {
      const next = photos.filter(p => p.id !== id)
      if (coverId === id) setCoverId(next.length ? next.slice().sort((a, b) => b.uploadedAt - a.uploadedAt)[0].id : null)
      setPhotos(next)
      togglePhotoSelect(id, false)
      setLightboxOpen(false); setRemovePhotoModalOpen(false)
    },
    revert: () => { setPhotos(snapshot); setCoverId(snapshotCoverId) },
    request: () => fetch(`/api/events/${eventId}/media/${id}`, { method: 'DELETE' }).then((res) => {
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete photo')
    }),
  })
}
```

```typescript
// Before:
function removeVideo(id: string) {
  setVideos(prev => prev.filter(v => v.id !== id))
  toggleVideoSelect(id, false)
  setVlightboxOpen(false)
}

// After:
function removeVideo(id: string) {
  const snapshot = videos
  mediaMutation.run({
    apply: () => {
      setVideos(prev => prev.filter(v => v.id !== id))
      toggleVideoSelect(id, false)
      setVlightboxOpen(false)
    },
    revert: () => setVideos(snapshot),
    request: () => fetch(`/api/events/${eventId}/media/${id}`, { method: 'DELETE' }).then((res) => {
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete video')
    }),
  })
}
```

```typescript
// Before:
function bulkDeletePhotos() {
  const ids = Object.keys(photoSelected)
  if (!ids.length) return
  const next = photos.filter(p => !ids.includes(p.id))
  if (ids.includes(coverId ?? '')) setCoverId(next.length ? next.slice().sort((a, b) => b.uploadedAt - a.uploadedAt)[0].id : null)
  setPhotos(next); setPhotoSelectMode(false); setPhotoSelected({}); setBulkDeleteModalOpen(false)
}

// After:
function bulkDeletePhotos() {
  const ids = Object.keys(photoSelected)
  if (!ids.length) return
  const snapshot = photos
  const snapshotCoverId = coverId
  mediaMutation.run<{ deleted: string[]; failed: { id: string; reason: string }[] }>({
    apply: () => {
      const next = photos.filter(p => !ids.includes(p.id))
      if (ids.includes(coverId ?? '')) setCoverId(next.length ? next.slice().sort((a, b) => b.uploadedAt - a.uploadedAt)[0].id : null)
      setPhotos(next); setPhotoSelectMode(false); setPhotoSelected({}); setBulkDeleteModalOpen(false)
    },
    revert: () => { setPhotos(snapshot); setCoverId(snapshotCoverId) },
    request: async () => {
      const res = await fetch(`/api/events/${eventId}/media/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) throw new Error('Failed to delete photos')
      const result = await res.json()
      // Selection clears entirely regardless of partial failure (spec §5 rule).
      // Any failed ids are restored to the grid — the optimistic delete over-removed them.
      if (result.failed.length > 0) {
        const failedIds = new Set(result.failed.map((f: { id: string }) => f.id))
        setPhotos((prev) => {
          const restored = snapshot.filter((p) => failedIds.has(p.id))
          return [...restored, ...prev]
        })
      }
      return result
    },
  })
}
```

```typescript
// Before:
function bulkDeleteVideos() {
  const ids = Object.keys(videoSelected)
  if (!ids.length) return
  setVideos(prev => prev.filter(v => !ids.includes(v.id)))
  setVideoSelectMode(false); setVideoSelected({}); setBulkDeleteModalOpen(false)
}

// After:
function bulkDeleteVideos() {
  const ids = Object.keys(videoSelected)
  if (!ids.length) return
  const snapshot = videos
  mediaMutation.run<{ deleted: string[]; failed: { id: string; reason: string }[] }>({
    apply: () => {
      setVideos(prev => prev.filter(v => !ids.includes(v.id)))
      setVideoSelectMode(false); setVideoSelected({}); setBulkDeleteModalOpen(false)
    },
    revert: () => setVideos(snapshot),
    request: async () => {
      const res = await fetch(`/api/events/${eventId}/media/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) throw new Error('Failed to delete videos')
      const result = await res.json()
      if (result.failed.length > 0) {
        const failedIds = new Set(result.failed.map((f: { id: string }) => f.id))
        setVideos((prev) => {
          const restored = snapshot.filter((v) => failedIds.has(v.id))
          return [...restored, ...prev]
        })
      }
      return result
    },
  })
}
```

- [ ] **Step 4: Surface `mediaMutation.error` in the UI**

Add near the top of the component's returned JSX (right after the opening wrapper element, before the storage meter section):

```tsx
{mediaMutation.error && (
  <div className="media-error-banner" role="alert">
    {mediaMutation.error}
    <button type="button" onClick={mediaMutation.clearError} aria-label="Dismiss">×</button>
  </div>
)}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 6: Commit**

```bash
git add lib/media/useOptimisticMediaMutation.ts "app/events/[id]/media/MediaClient.tsx"
git commit -m "feat(media): wire delete/bulk-delete through optimistic-update-with-rollback hook"
```

---

## Task 12: Wire album CRUD + assign through the optimistic hook

**Files:**
- Modify: `app/events/[id]/media/MediaClient.tsx`

- [ ] **Step 1: Wire `submitAlbumForm`, `deleteAlbum`, `submitAssign`**

```typescript
// Before:
function submitAlbumForm() {
  const name = albumName.trim()
  if (!name) { setAlbumNameError(true); return }
  if (albumModalMode === 'rename' && albumModalId) {
    setAlbums(prev => prev.map(a => a.id === albumModalId ? { ...a, name } : a))
  } else {
    albumSeqRef.current++
    setAlbums(prev => [...prev, { id: 'al-' + albumSeqRef.current, name, preset: false }])
  }
  setAlbumModalOpen(false)
}

// After:
function submitAlbumForm() {
  const name = albumName.trim()
  if (!name) { setAlbumNameError(true); return }
  const snapshot = albums

  if (albumModalMode === 'rename' && albumModalId) {
    const albumId = albumModalId
    mediaMutation.run({
      apply: () => {
        setAlbums(prev => prev.map(a => a.id === albumId ? { ...a, name } : a))
        setAlbumModalOpen(false)
      },
      revert: () => { setAlbums(snapshot); setAlbumModalOpen(true); setAlbumNameError(true) },
      request: async () => {
        const res = await fetch(`/api/events/${eventId}/media/albums/${albumId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        })
        if (res.status === 409) throw new Error('An album with this name already exists')
        if (!res.ok) throw new Error('Failed to rename album')
        return res.json()
      },
    })
  } else {
    const tempId = 'pending-' + Date.now()
    mediaMutation.run<{ id: string }>({
      apply: () => {
        setAlbums(prev => [...prev, { id: tempId, name, preset: false }])
        setAlbumModalOpen(false)
      },
      revert: () => { setAlbums(snapshot); setAlbumModalOpen(true); setAlbumNameError(true) },
      request: async () => {
        const res = await fetch(`/api/events/${eventId}/media/albums`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        })
        if (res.status === 409) throw new Error('An album with this name already exists')
        if (!res.ok) throw new Error('Failed to create album')
        const created = await res.json()
        setAlbums(prev => prev.map(a => a.id === tempId ? { id: created.id, name, preset: false } : a))
        return created
      },
    })
  }
}
```

```typescript
// Before:
function deleteAlbum(id: string) {
  setAlbums(prev => prev.filter(a => a.id !== id))
  setPhotos(prev => prev.map(p => ({ ...p, albumIds: p.albumIds.filter(aid => aid !== id) })))
  setVideos(prev => prev.map(v => ({ ...v, albumIds: v.albumIds.filter(aid => aid !== id) })))
  if (photoFilterAlbumId === id) setPhotoFilterAlbumId(null)
  if (videoFilterAlbumId === id) setVideoFilterAlbumId(null)
}

// After:
function deleteAlbum(id: string) {
  const albumsSnapshot = albums
  const photosSnapshot = photos
  const videosSnapshot = videos
  mediaMutation.run({
    apply: () => {
      setAlbums(prev => prev.filter(a => a.id !== id))
      setPhotos(prev => prev.map(p => ({ ...p, albumIds: p.albumIds.filter(aid => aid !== id) })))
      setVideos(prev => prev.map(v => ({ ...v, albumIds: v.albumIds.filter(aid => aid !== id) })))
      if (photoFilterAlbumId === id) setPhotoFilterAlbumId(null)
      if (videoFilterAlbumId === id) setVideoFilterAlbumId(null)
    },
    revert: () => { setAlbums(albumsSnapshot); setPhotos(photosSnapshot); setVideos(videosSnapshot) },
    request: () => fetch(`/api/events/${eventId}/media/albums/${id}`, { method: 'DELETE' }).then((res) => {
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete album')
    }),
  })
}
```

```typescript
// Before:
function submitAssign() {
  const aids = Object.keys(assignChosen)
  if (!aids.length) return
  if (assignKind === 'photo') {
    setPhotos(prev => prev.map(p => {
      if (!assignIds.includes(p.id)) return p
      const next = p.albumIds.slice()
      aids.forEach(aid => {
        const i = next.indexOf(aid)
        if (assignMode === 'add' && i === -1) next.push(aid)
        if (assignMode === 'remove' && i !== -1) next.splice(i, 1)
      })
      return { ...p, albumIds: next }
    }))
  } else {
    setVideos(prev => prev.map(v => {
      if (!assignIds.includes(v.id)) return v
      const next = v.albumIds.slice()
      aids.forEach(aid => {
        const i = next.indexOf(aid)
        if (assignMode === 'add' && i === -1) next.push(aid)
        if (assignMode === 'remove' && i !== -1) next.splice(i, 1)
      })
      return { ...v, albumIds: next }
    }))
  }
  setAssignModalOpen(false)
}

// After:
function submitAssign() {
  const aids = Object.keys(assignChosen)
  if (!aids.length) return
  const photosSnapshot = photos
  const videosSnapshot = videos

  function applyLocally() {
    const patch = (list: (Photo | Video)[]) => list.map((item) => {
      if (!assignIds.includes(item.id)) return item
      const next = item.albumIds.slice()
      aids.forEach(aid => {
        const i = next.indexOf(aid)
        if (assignMode === 'add' && i === -1) next.push(aid)
        if (assignMode === 'remove' && i !== -1) next.splice(i, 1)
      })
      return { ...item, albumIds: next }
    })
    if (assignKind === 'photo') setPhotos(prev => patch(prev) as Photo[])
    else setVideos(prev => patch(prev) as Video[])
    setAssignModalOpen(false)
  }

  mediaMutation.run({
    apply: applyLocally,
    revert: () => { setPhotos(photosSnapshot); setVideos(videosSnapshot) },
    request: () => Promise.all(
      assignIds.map((mediaId) =>
        fetch(`/api/events/${eventId}/media/${mediaId}/albums`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: assignMode, albumIds: aids }),
        }).then((res) => {
          if (!res.ok) throw new Error('Failed to update album assignment')
        })
      )
    ),
  })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add "app/events/[id]/media/MediaClient.tsx"
git commit -m "feat(media): wire album create/rename/delete/assign through optimistic hook"
```

---

## Task 13: Signed URL batch fetch on the client

**Files:**
- Modify: `app/events/[id]/media/MediaClient.tsx`

**Interfaces:**
- Consumes: `POST /api/events/[id]/media/urls` (Task 5), `GET /api/events/[id]/media/[mediaId]/url` (Task 5, `onError` fallback).

- [ ] **Step 1: Add the signed-URL cache and viewport-scoped fetch**

Add near the top of the component (after `uploadItems` state from Task 10):

```typescript
const [urlCache, setUrlCache] = useState<Record<string, { url: string; expiresAt: number }>>({})

useEffect(() => {
  const idsNeedingUrls = [...photos.map(p => p.id), ...videos.map(v => v.id)].filter((id) => !urlCache[id])
  if (idsNeedingUrls.length === 0) return

  const batches: string[][] = []
  for (let i = 0; i < idsNeedingUrls.length; i += 200) batches.push(idsNeedingUrls.slice(i, i + 200))

  let cancelled = false
  Promise.all(
    batches.map((batch) =>
      fetch(`/api/events/${eventId}/media/urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaIds: batch }),
      }).then((res) => (res.ok ? res.json() : {}))
    )
  ).then((results) => {
    if (cancelled) return
    const merged: Record<string, { url: string; expiresAt: number }> = Object.assign({}, ...results)
    setUrlCache((prev) => ({ ...prev, ...merged }))
    // Optimistic upload preview lifecycle (spec §5): the moment a just-uploaded
    // item's real signed URL arrives, revoke its blob: preview — not before
    // (would flash a broken image) and not never (memory leak across a large
    // batch-upload session). blobUrlsRef is the single source of truth,
    // shared with Task 10's unmount cleanup.
    Object.keys(merged).forEach((id) => {
      const blobUrl = blobUrlsRef.current.get(id)
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
        blobUrlsRef.current.delete(id)
      }
    })
  })

  return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [photos.length, videos.length, eventId])

async function refetchSingleUrl(mediaId: string) {
  const res = await fetch(`/api/events/${eventId}/media/${mediaId}/url`)
  if (!res.ok) return
  const { url, expiresAt } = await res.json()
  setUrlCache((prev) => ({ ...prev, [mediaId]: { url, expiresAt } }))
}

function resolveSrc(item: { id: string; src?: string; poster?: string }): string {
  // urlCache always wins once populated. Before that (right after a page-load
  // fetch, before the batch effect above resolves, or right after this
  // session's own upload commits) it falls through to item.src/poster —
  // which is '' from page.tsx's initial props, or the blob: preview URL
  // Task 10 just set. No special-casing needed: this ordering alone produces
  // "blob preview, then swap to real URL" for free.
  return urlCache[item.id]?.url ?? item.src ?? item.poster ?? ''
}
```

- [ ] **Step 2: Wire `<img>`/poster tags to `resolveSrc` + `onError` recovery**

Find every `<img src={photo.src}` / `<img src={video.poster}`-style usage inside `PhotoTile`, `VideoTile`, and the lightbox sections. Replace the direct `src` prop with `resolveSrc(...)` and add an `onError` handler:

```tsx
// Before (example, PhotoTile):
<img src={photo.src} alt="" loading="lazy" />

// After:
<img
  src={resolveSrc(photo)}
  alt=""
  loading="lazy"
  onError={() => { if (urlCache[photo.id]) refetchSingleUrl(photo.id) }}
/>
```

The `onError` guard only re-fetches when `urlCache[photo.id]` already exists (a real signed URL that expired mid-session) — an `<img>` still showing its initial empty `src` or a live blob: preview firing `onError` means something else is wrong (not yet loaded, or a genuinely broken blob), and re-requesting a signed URL wouldn't fix either case.

Apply the same `resolveSrc(...)` + `onError={() => refetchSingleUrl(id)}` pattern to every other `<img>`/poster-consuming element in the file that renders `photo.src` or `video.poster` (grid tiles, recent-uploads strip, album cards, lightbox).

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 4: Run the full test suite**

Run: `npm run test:run`
Expected: All tests pass (Tasks 1-7's new tests + all pre-existing tests unaffected)

- [ ] **Step 5: Commit**

```bash
git add "app/events/[id]/media/MediaClient.tsx"
git commit -m "feat(media): wire batched signed-URL fetch with onError single-URL recovery"
```

---

## Final verification (after all 13 tasks)

- [ ] Run `npm run test:run` — all tests pass
- [ ] Run `npx tsc --noEmit` — no errors
- [ ] Run `npm run lint` — no new warnings in touched files
- [ ] Live-browser pass per spec §8 (standard breakpoints 360/390/414/768/1024/1440): real photo + video upload, HEIC file, storage meter, delete flows, album CRUD, bulk operations with a deliberate failure, signed-URL expiry recovery, mid-upload navigation-away, confirm `app/api/media/[...key]` untouched
