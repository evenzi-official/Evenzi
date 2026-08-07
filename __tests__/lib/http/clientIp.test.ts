import { afterEach, describe, expect, it } from 'vitest'
import { getClientIp, isValidIp, rightmostHop } from '@/lib/http/clientIp'

function req(headers: Record<string, string>): Request {
  return new Request('http://localhost/api/test', { headers })
}

describe('isValidIp', () => {
  it('accepts IPv4', () => {
    expect(isValidIp('203.0.113.9')).toBe(true)
  })
  it('rejects garbage', () => {
    expect(isValidIp('not-an-ip')).toBe(false)
    expect(isValidIp('999.1.1.1')).toBe(false)
    expect(isValidIp('')).toBe(false)
  })
})

describe('rightmostHop', () => {
  it('returns the last hop', () => {
    expect(rightmostHop('1.1.1.1, 2.2.2.2, 203.0.113.9')).toBe('203.0.113.9')
  })
  it('handles single hop', () => {
    expect(rightmostHop('203.0.113.9')).toBe('203.0.113.9')
  })
})

describe('getClientIp', () => {
  const prevVercel = process.env.VERCEL
  const prevTrust = process.env.TRUST_PROXY

  afterEach(() => {
    if (prevVercel === undefined) delete process.env.VERCEL
    else process.env.VERCEL = prevVercel
    if (prevTrust === undefined) delete process.env.TRUST_PROXY
    else process.env.TRUST_PROXY = prevTrust
  })

  it('ignores spoofed XFF when not behind a trusted proxy', () => {
    delete process.env.VERCEL
    delete process.env.TRUST_PROXY
    expect(getClientIp(req({ 'x-forwarded-for': '8.8.8.8, 1.2.3.4' }))).toBe('unknown')
  })

  it('uses rightmost XFF hop behind TRUST_PROXY (not leftmost spoof)', () => {
    delete process.env.VERCEL
    process.env.TRUST_PROXY = '1'
    expect(getClientIp(req({ 'x-forwarded-for': '8.8.8.8, 203.0.113.9' }))).toBe('203.0.113.9')
  })

  it('prefers x-real-ip when valid', () => {
    process.env.VERCEL = '1'
    expect(
      getClientIp(
        req({
          'x-real-ip': '198.51.100.10',
          'x-forwarded-for': '8.8.8.8, 203.0.113.9',
        }),
      ),
    ).toBe('198.51.100.10')
  })

  it('uses rightmost x-vercel-forwarded-for', () => {
    process.env.VERCEL = '1'
    expect(
      getClientIp(req({ 'x-vercel-forwarded-for': '8.8.8.8, 203.0.113.50' })),
    ).toBe('203.0.113.50')
  })
})
