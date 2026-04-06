import { describe, it, expect } from 'vitest'
import {
  generateWebhookSecret,
  signWebhookPayload,
  verifyWebhookSignature,
} from './webhook'

describe('generateWebhookSecret', () => {
  it('returns a 64-character hex string', () => {
    const secret = generateWebhookSecret()
    expect(secret).toHaveLength(64)
    expect(secret).toMatch(/^[0-9a-f]+$/)
  })

  it('generates unique secrets each call', () => {
    const a = generateWebhookSecret()
    const b = generateWebhookSecret()
    expect(a).not.toBe(b)
  })
})

describe('signWebhookPayload', () => {
  it('produces a 64-character hex signature', () => {
    const sig = signWebhookPayload('{"type":"test"}', 'mysecret')
    expect(sig).toHaveLength(64)
    expect(sig).toMatch(/^[0-9a-f]+$/)
  })

  it('same inputs produce same signature', () => {
    const sig1 = signWebhookPayload('body', 'secret')
    const sig2 = signWebhookPayload('body', 'secret')
    expect(sig1).toBe(sig2)
  })

  it('different body produces different signature', () => {
    const sig1 = signWebhookPayload('body1', 'secret')
    const sig2 = signWebhookPayload('body2', 'secret')
    expect(sig1).not.toBe(sig2)
  })
})

describe('verifyWebhookSignature', () => {
  it('returns true for valid signature', () => {
    const body = '{"type":"agent.started"}'
    const secret = 'test-secret-123'
    const signature = signWebhookPayload(body, secret)
    expect(verifyWebhookSignature(body, signature, secret)).toBe(true)
  })

  it('returns false for wrong secret', () => {
    const body = '{"type":"agent.started"}'
    const signature = signWebhookPayload(body, 'correct-secret')
    expect(verifyWebhookSignature(body, signature, 'wrong-secret')).toBe(false)
  })

  it('returns false for tampered body', () => {
    const secret = 'test-secret'
    const signature = signWebhookPayload('original body', secret)
    expect(verifyWebhookSignature('tampered body', signature, secret)).toBe(false)
  })

  it('returns false for mismatched length signature', () => {
    const body = 'body'
    const secret = 'secret'
    expect(verifyWebhookSignature(body, 'short', secret)).toBe(false)
  })
})
