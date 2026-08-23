import { describe, it, expect } from 'vitest'
import { invitationBgKey, invitationUploadKey } from '../keys'

describe('invitation key helpers', () => {
  it('builds a bg key under the event invitations prefix', () => {
    expect(invitationBgKey('E1', 'U1', 'jpg')).toBe('events/E1/invitations/bg-U1.jpg')
  })
  it('builds an upload key under the event invitations prefix', () => {
    expect(invitationUploadKey('E1', 'U1', 'png')).toBe('events/E1/invitations/card-U1.png')
  })
})
