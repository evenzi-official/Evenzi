import { describe, it, expect } from 'vitest'
import { invitationUploadUrlSchema, invitationPatchSchema } from '../invitations'

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

describe('invitationPatchSchema slot_sizes', () => {
  // Regression: z.record(enum, ...) is EXHAUSTIVE in Zod v4 (requires every
  // enum key). slot_sizes must accept a PARTIAL map — a single size-bump sends
  // one key, and an empty {} is sent on template reset. Guards the fix that
  // switched to z.partialRecord.
  it('accepts a single-slot size map', () => {
    expect(invitationPatchSchema.safeParse({ slot_sizes: { couple: 'l' } }).success).toBe(true)
  })
  it('accepts an empty size map', () => {
    expect(invitationPatchSchema.safeParse({ slot_sizes: {} }).success).toBe(true)
  })
  it('rejects an invalid size value', () => {
    expect(invitationPatchSchema.safeParse({ slot_sizes: { couple: 'xl' } }).success).toBe(false)
  })
  it('accepts a text-only patch with no slot_sizes', () => {
    expect(invitationPatchSchema.safeParse({ slots: { couple: 'A & B' }, is_custom: true }).success).toBe(true)
  })
})
