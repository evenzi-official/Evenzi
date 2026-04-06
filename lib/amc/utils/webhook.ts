import { createHmac, randomBytes } from 'crypto'

/**
 * Generates a cryptographically secure 32-byte hex webhook secret.
 */
export function generateWebhookSecret(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Signs a webhook payload body with HMAC-SHA256.
 * Returns the hex digest.
 */
export function signWebhookPayload(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex')
}

/**
 * Verifies an incoming webhook signature using constant-time comparison
 * to prevent timing attacks.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expected = signWebhookPayload(body, secret)
  if (expected.length !== signature.length) return false

  // Constant-time comparison
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return diff === 0
}
