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
