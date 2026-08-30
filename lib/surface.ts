export type Surface = 'marketing' | 'app' | 'admin'

const SURFACE_PREFIXES = ['/app', '/marketing', '/admin'] as const
const VALID_SURFACES = new Set<Surface>(['marketing', 'app', 'admin'])

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
  if (vercelEnv !== 'production' && process.env.NODE_ENV !== 'production') {
    const previewOverride = overrideSurface(surfaceParam) ?? overrideSurface(surfaceHeader)
    if (previewOverride) return previewOverride
  }

  switch (hostnameFromHeader(host)) {
    case 'app.evenzii.com':
    case 'app.localhost':
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
