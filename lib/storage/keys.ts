/**
 * R2 object-key builders. Canonical scheme: {scope}/{scopeId}/{feature}/{uuid}.{ext}
 * Keys are always generated server-side — never accept a client-supplied key.
 * Pure + isomorphic (safe to import anywhere).
 */

export function mediaKey(eventId: string, uuid: string, ext = 'webp'): string {
  return `events/${eventId}/media/${uuid}.${ext}`
}

export function mediaThumbKey(eventId: string, uuid: string): string {
  return `events/${eventId}/media/${uuid}_thumb.webp`
}

export function invitationKey(eventId: string, uuid: string): string {
  return `events/${eventId}/invitations/${uuid}.png`
}

export function websitePublicKey(eventId: string, purpose: string, uuid: string, ext = 'webp'): string {
  return `website/${eventId}/${purpose}-${uuid}.${ext}`
}

export function websiteDesignKey(
  eventId: string,
  purpose: 'cover' | 'og',
  uuid: string,
  ext = 'webp',
): string {
  return `events/${eventId}/website/${purpose}/${uuid}.${ext}`
}

export function avatarKey(userId: string, uuid: string, ext = 'webp'): string {
  return `users/${userId}/avatar-${uuid}.${ext}`
}

export function eventPrefix(eventId: string): string {
  return `events/${eventId}/`
}

export function userPrefix(userId: string): string {
  return `users/${userId}/`
}

export interface ParsedKey {
  scope: string
  scopeId: string
  feature: string
}

/**
 * Parse a key back into its scope components for authorization checks.
 * Returns null for malformed keys (fewer than 2 segments).
 */
export function parseKey(key: string): ParsedKey | null {
  const parts = key.split('/').filter(Boolean)
  if (parts.length < 2) return null
  return {
    scope: parts[0],
    scopeId: parts[1],
    feature: parts.length >= 4 ? parts[2] : '',
  }
}
