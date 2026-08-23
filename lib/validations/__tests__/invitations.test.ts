import { describe, it, expect } from 'vitest'
import { invitationUploadUrlSchema } from '../invitations'

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
