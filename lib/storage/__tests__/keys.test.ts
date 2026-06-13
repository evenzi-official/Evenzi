import { describe, it, expect } from 'vitest'
import {
  mediaKey,
  mediaThumbKey,
  invitationKey,
  websitePublicKey,
  avatarKey,
  eventPrefix,
  userPrefix,
  parseKey,
} from '../keys'

describe('storage key builders', () => {
  it('builds media + thumb keys under the event scope', () => {
    expect(mediaKey('ev1', 'u1')).toBe('events/ev1/media/u1.webp')
    expect(mediaKey('ev1', 'u1', 'jpeg')).toBe('events/ev1/media/u1.jpeg')
    expect(mediaThumbKey('ev1', 'u1')).toBe('events/ev1/media/u1_thumb.webp')
  })

  it('builds invitation, website, and avatar keys', () => {
    expect(invitationKey('ev1', 'c1')).toBe('events/ev1/invitations/c1.png')
    expect(websitePublicKey('ev1', 'hero', 'w1')).toBe('website/ev1/hero-w1.webp')
    expect(avatarKey('user1', 'a1')).toBe('users/user1/avatar-a1.webp')
  })

  it('builds deletion prefixes', () => {
    expect(eventPrefix('ev1')).toBe('events/ev1/')
    expect(userPrefix('user1')).toBe('users/user1/')
  })

  describe('parseKey', () => {
    it('parses a 4-segment feature key', () => {
      expect(parseKey('events/ev1/media/u1.webp')).toEqual({
        scope: 'events',
        scopeId: 'ev1',
        feature: 'media',
      })
    })

    it('parses a 3-segment key with empty feature', () => {
      expect(parseKey('users/user1/avatar-a1.webp')).toEqual({
        scope: 'users',
        scopeId: 'user1',
        feature: '',
      })
    })

    it('returns null for malformed keys', () => {
      expect(parseKey('justonepart')).toBeNull()
      expect(parseKey('')).toBeNull()
    })
  })
})
