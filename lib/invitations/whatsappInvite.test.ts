import { describe, it, expect } from 'vitest'
import {
  normalizeWhatsAppPhone,
  buildInviteText,
  buildWhatsAppUrl,
  buildGuestInviteUrl,
} from './whatsappInvite'

describe('normalizeWhatsAppPhone', () => {
  it('applies the +91 default to a bare 10-digit number', () => {
    expect(normalizeWhatsAppPhone('9876543210')).toBe('919876543210')
  })

  it('leaves an already-country-coded number as-is (no double +91)', () => {
    expect(normalizeWhatsAppPhone('919876543210')).toBe('919876543210')
    expect(normalizeWhatsAppPhone('+91 98765 43210')).toBe('919876543210')
  })

  it('drops a 00 international prefix', () => {
    expect(normalizeWhatsAppPhone('00919876543210')).toBe('919876543210')
  })

  it('strips spaces, dashes, parens, and a leading +', () => {
    expect(normalizeWhatsAppPhone('+91 (98765)-43210')).toBe('919876543210')
  })

  it('rejects a URL-injection attempt by stripping non-digits then failing the gate', () => {
    // The dangerous chars are stripped; what remains ("911234") is too short → null.
    expect(normalizeWhatsAppPhone('911234?text=EVIL&x=')).toBeNull()
  })

  it('rejects too-short and empty input', () => {
    expect(normalizeWhatsAppPhone('12345')).toBeNull()
    expect(normalizeWhatsAppPhone('')).toBeNull()
    expect(normalizeWhatsAppPhone(null)).toBeNull()
    expect(normalizeWhatsAppPhone(undefined)).toBeNull()
  })

  it('rejects an absurdly long number', () => {
    expect(normalizeWhatsAppPhone('1'.repeat(16))).toBeNull()
  })
})

describe('buildInviteText', () => {
  it('composes greeting + message + link', () => {
    expect(
      buildInviteText({ guestName: 'Anya', defaultMessage: 'Join us!', siteUrl: 'https://x/e/s' })
    ).toBe('Hi Anya,\n\nJoin us!\n\nhttps://x/e/s')
  })

  it('falls back to a generic line when the default message is empty', () => {
    const out = buildInviteText({ guestName: 'Anya', defaultMessage: '  ', siteUrl: 'https://x/e/s' })
    expect(out).toContain("You're invited")
    expect(out).toContain('https://x/e/s')
  })

  it('drops the greeting line gracefully when the name is empty', () => {
    expect(
      buildInviteText({ guestName: '', defaultMessage: 'Join us!', siteUrl: 'https://x/e/s' })
    ).toBe('Join us!\n\nhttps://x/e/s')
  })
})

describe('buildWhatsAppUrl', () => {
  it('encodes the text and puts the validated phone in the path', () => {
    const url = buildWhatsAppUrl({ phone: '9876543210', text: 'Hi Anya,\n\nJoin us! & more' })
    expect(url).toBe('https://wa.me/919876543210?text=Hi%20Anya%2C%0A%0AJoin%20us!%20%26%20more')
  })

  it('encodes emoji in the body', () => {
    const url = buildWhatsAppUrl({ phone: '9876543210', text: '🎉' })
    expect(url).toBe(`https://wa.me/919876543210?text=${encodeURIComponent('🎉')}`)
  })

  it('returns null when the phone is unusable', () => {
    expect(buildWhatsAppUrl({ phone: 'nope', text: 'Hi' })).toBeNull()
  })
})

describe('buildGuestInviteUrl', () => {
  it('returns null for a guest with no usable phone (skip signal)', () => {
    expect(
      buildGuestInviteUrl({ guestName: 'Anya', phone: null, defaultMessage: 'Hi', siteUrl: 'https://x/e/s' })
    ).toBeNull()
  })

  it('builds a full url for a valid guest', () => {
    const url = buildGuestInviteUrl({
      guestName: 'Anya', phone: '9876543210', defaultMessage: 'Join us!', siteUrl: 'https://x/e/s',
    })
    expect(url).toContain('https://wa.me/919876543210?text=')
    expect(decodeURIComponent(url!.split('text=')[1])).toBe('Hi Anya,\n\nJoin us!\n\nhttps://x/e/s')
  })
})
