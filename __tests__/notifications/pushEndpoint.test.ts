import { describe, it, expect } from 'vitest'
import { isAllowedPushEndpoint, isValidBase64Url } from '@/lib/notifications/pushEndpoint'

describe('isAllowedPushEndpoint', () => {
  it('allows FCM endpoints', () => {
    expect(
      isAllowedPushEndpoint('https://fcm.googleapis.com/fcm/send/abc123')
    ).toBe(true)
    expect(
      isAllowedPushEndpoint('https://wp-01.fcm.googleapis.com/wp/abc')
    ).toBe(true)
  })

  it('allows Mozilla push endpoints', () => {
    expect(
      isAllowedPushEndpoint(
        'https://updates.push.services.mozilla.com/wpush/v2/gAAAAA'
      )
    ).toBe(true)
  })

  it('allows Apple push endpoints', () => {
    expect(
      isAllowedPushEndpoint('https://web.push.apple.com/Qabcd')
    ).toBe(true)
  })

  it('allows Windows notify endpoints', () => {
    expect(
      isAllowedPushEndpoint(
        'https://wns2-pn1p.notify.windows.com/w/?token=abc'
      )
    ).toBe(true)
  })

  it('rejects http endpoints', () => {
    expect(
      isAllowedPushEndpoint('http://fcm.googleapis.com/fcm/send/abc')
    ).toBe(false)
  })

  it('rejects IP literals', () => {
    expect(isAllowedPushEndpoint('https://127.0.0.1/push')).toBe(false)
    expect(isAllowedPushEndpoint('https://[::1]/push')).toBe(false)
  })

  it('rejects localhost', () => {
    expect(isAllowedPushEndpoint('https://localhost/push')).toBe(false)
  })

  it('rejects unrelated hosts', () => {
    expect(isAllowedPushEndpoint('https://evil.com/push')).toBe(false)
    expect(
      isAllowedPushEndpoint('https://fcm.googleapis.com.evil.com/push')
    ).toBe(false)
  })
})

describe('isValidBase64Url', () => {
  it('accepts non-empty base64url', () => {
    expect(isValidBase64Url('abcXYZ012_-')).toBe(true)
  })

  it('rejects empty, padded, or invalid chars', () => {
    expect(isValidBase64Url('')).toBe(false)
    expect(isValidBase64Url('abc=')).toBe(false)
    expect(isValidBase64Url('abc+/=')).toBe(false)
  })
})
