/**
 * Shared public-path predicate for middleware and tests.
 * Exact-plus-prefix for `/help` so `/helpdesk` stays protected.
 * `/auth/role-selection` stays protected (auth required, no role yet).
 */
export function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/auth' ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/auth/accept-invite') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/sw.js' ||
    pathname === '/manifest.webmanifest' ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/e/') ||
    pathname.startsWith('/wedding-invitation-temp-') ||
    pathname === '/help' ||
    pathname.startsWith('/help/')
  )
}

/** Paths allowed when Supabase env is missing (bootstrap / misconfig). */
export function isEnvMissingPublicPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/sw.js' ||
    pathname === '/manifest.webmanifest' ||
    pathname.startsWith('/e/') ||
    pathname.startsWith('/wedding-invitation-temp-') ||
    pathname === '/help' ||
    pathname.startsWith('/help/')
  )
}
