const ALLOWED_HOST_SUFFIXES = [
  '.fcm.googleapis.com',
  '.push.services.mozilla.com',
  '.push.apple.com',
  '.notify.windows.com',
] as const

const IPV4_LITERAL = /^(?:\d{1,3}\.){3}\d{1,3}$/
const IPV6_LITERAL = /:/

function isIpLiteralHostname(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === 'localhost') return true
  if (IPV4_LITERAL.test(host)) return true
  if (IPV6_LITERAL.test(host)) return true
  return false
}

function isAllowedPushHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix.slice(1) || host.endsWith(suffix)
  )
}

/** SSRF allowlist for Web Push subscription endpoints. */
export function isAllowedPushEndpoint(endpoint: string): boolean {
  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    return false
  }

  if (url.protocol !== 'https:') return false
  if (isIpLiteralHostname(url.hostname)) return false
  return isAllowedPushHost(url.hostname)
}

/** Non-empty base64url (p256dh / auth keys). */
export function isValidBase64Url(s: string): boolean {
  if (typeof s !== 'string' || s.length === 0) return false
  return /^[A-Za-z0-9_-]+$/.test(s)
}
