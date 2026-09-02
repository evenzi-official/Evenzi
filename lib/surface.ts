export type Surface = 'marketing' | 'app' | 'admin'

const SURFACE_PREFIXES = ['/app', '/marketing', '/admin'] as const
const VALID_SURFACES = new Set<Surface>(['marketing', 'app', 'admin'])
// Vercel-assigned staging alias (not a real evenzii.com host) — lets the
// preview override work here even on the production-target deploy, so the
// split is testable before app.evenzii.com/admin.evenzii.com are attached.
// Does NOT bypass the admin auth gate (ADMIN_USER_IDS), which runs downstream.
const SURFACE_OVERRIDE_ALLOWED_PROD_HOSTS = new Set(['evenzi.vercel.app'])

function hostnameFromHeader(host: string | null): string {
  if (!host) return ''

  const value = host.trim().toLowerCase()
  if (value.startsWith('[')) {
    const closingBracket = value.indexOf(']')
    return closingBracket === -1 ? value : value.slice(0, closingBracket + 1)
  }

  return value.split(':')[0].replace(/\.$/, '')
}

function overrideSurface(value: string | null | undefined): Surface | null {
  return value && VALID_SURFACES.has(value as Surface) ? value as Surface : null
}

export function resolveSurface({
  host,
  surfaceParam,
  surfaceHeader,
  forwardedHost: _forwardedHost,
  vercelEnv = process.env.VERCEL_ENV,
}: {
  host: string | null
  surfaceParam?: string | null
  surfaceHeader?: string | null
  forwardedHost?: string | null
  vercelEnv?: string
}): Surface {
  const hostname = hostnameFromHeader(host)

  // Trust VERCEL_ENV when Vercel sets it (accurate for every real deployment,
  // preview or production). Only fall back to NODE_ENV when VERCEL_ENV is
  // absent — e.g. a self-hosted `next build && next start` with no Vercel
  // context. NODE_ENV alone is NOT a valid signal on Vercel: `next build`
  // always bakes in NODE_ENV=production, for preview deploys too, so using
  // it as a second required condition (the old `&&`) silently disabled the
  // override on every real deployment, not just production.
  const isProductionRuntime = vercelEnv
    ? vercelEnv === 'production'
    : process.env.NODE_ENV === 'production'

  if (!isProductionRuntime || SURFACE_OVERRIDE_ALLOWED_PROD_HOSTS.has(hostname)) {
    const previewOverride = overrideSurface(surfaceParam) ?? overrideSurface(surfaceHeader)
    if (previewOverride) return previewOverride
  }

  switch (hostname) {
    case 'app.evenzii.com':
    case 'app.localhost':
    // Staging alias defaults to 'app' (not the unrecognized-host default of
    // 'marketing'): most in-app navigation (redirects, router.push) does not
    // carry the ?surface= override forward, so without an explicit case here
    // any client-side navigation on this host — e.g. straight after OTP
    // verify — would silently fall through to marketing and 404. ?surface=
    // still overrides this for testing the other two surfaces (see
    // SURFACE_OVERRIDE_ALLOWED_PROD_HOSTS above). Real unrecognized hosts are
    // unaffected and still default to 'marketing'.
    case 'evenzi.vercel.app':
      return 'app'
    case 'admin.evenzii.com':
    case 'admin.localhost':
      return 'admin'
    case 'evenzii.com':
    case 'www.evenzii.com':
    case 'localhost':
    case 'marketing.localhost':
      return 'marketing'
    default:
      return 'marketing'
  }
}

export function normalizePathname(pathname: string): string | null {
  let decodedPathname: string
  try {
    decodedPathname = decodeURIComponent(pathname)
  } catch {
    return null
  }

  if (!decodedPathname.startsWith('/') || decodedPathname.includes('\u0000')) {
    return null
  }

  const segments: string[] = []
  for (const segment of decodedPathname.split('/')) {
    if (!segment || segment === '.') continue
    if (segment === '..') {
      segments.pop()
      continue
    }
    segments.push(segment)
  }

  return `/${segments.join('/')}`
}

export function isSurfacePrefixed(pathname: string): boolean {
  return SURFACE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}
