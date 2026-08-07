/**
 * Trusted client IP for rate-limiting.
 *
 * Never trust the leftmost `x-forwarded-for` hop alone — clients can prepend
 * spoofed addresses. On Vercel the platform overwrites XFF; we still prefer
 * platform headers and the rightmost hop. Without a trusted proxy (local
 * Node), forged headers are ignored so buckets cannot be rotated.
 */

const IPV4 =
  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/
// Simplified IPv6 (full + compressed) — good enough to reject garbage / injection
const IPV6 =
  /^(?:[0-9a-fA-F]{1,4}:){1,7}[0-9a-fA-F]{0,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{0,4}$|^(?:[0-9a-fA-F]{1,4}:){1,6}:$|^::$/

export function isValidIp(value: string): boolean {
  const v = value.trim()
  if (!v || v.length > 45) return false
  if (IPV4.test(v)) return true
  if (IPV6.test(v)) return true
  return false
}

/** Rightmost non-empty hop in a comma-separated forwarding chain. */
export function rightmostHop(headerValue: string): string | null {
  const parts = headerValue
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length === 0) return null
  return parts[parts.length - 1] ?? null
}

function behindTrustedProxy(): boolean {
  return process.env.VERCEL === '1' || process.env.TRUST_PROXY === '1'
}

/**
 * Resolve a rate-limit identity for the caller.
 * Returns a validated IP string, or `'unknown'` when no trustworthy signal exists.
 */
export function getClientIp(request: Request): string {
  if (!behindTrustedProxy()) {
    // Local / unproxied: any XFF is client-controlled — do not rotate buckets on it.
    return 'unknown'
  }

  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp && isValidIp(realIp)) return realIp

  const vercelFf = request.headers.get('x-vercel-forwarded-for')
  if (vercelFf) {
    const hop = rightmostHop(vercelFf)
    if (hop && isValidIp(hop)) return hop
  }

  const xff = request.headers.get('x-forwarded-for')
  if (xff) {
    const hop = rightmostHop(xff)
    if (hop && isValidIp(hop)) return hop
  }

  return 'unknown'
}
