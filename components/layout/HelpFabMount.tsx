'use client'
import { usePathname } from 'next/navigation'
import { HelpFab } from './HelpFab'

/** Pages that render their own primary .add-fab, so help stacks above it. */
const STACKED_PREFIXES = ['/events/'] as const
const STACKED_SUFFIXES = ['/guests', '/planning'] as const

function isStacked(pathname: string): boolean {
  return (
    STACKED_PREFIXES.some((p) => pathname.startsWith(p)) &&
    STACKED_SUFFIXES.some((s) => pathname.endsWith(s))
  )
}

function isHidden(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/e/') ||
    pathname.startsWith('/help') ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/wedding-invitation-temp-')
  )
}

export function HelpFabMount() {
  const pathname = usePathname()
  if (isHidden(pathname)) return null
  return <HelpFab stacked={isStacked(pathname)} />
}
