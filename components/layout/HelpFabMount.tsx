'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { HelpFab } from './HelpFab'
import { HelpPanel } from '@/components/help/HelpPanel'
import { resetTicketOnRouteChange } from '@/components/help/helpPanelStorage'

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

export function HelpFabMount(): React.ReactElement | null {
  const pathname = usePathname()
  const fabRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [pathWhenOpen, setPathWhenOpen] = useState(pathname)

  // A10: close on route change without setState-in-effect (adjust during render).
  if (pathWhenOpen !== pathname) {
    setPathWhenOpen(pathname)
    if (open) setOpen(false)
  }

  useEffect(() => {
    resetTicketOnRouteChange()
  }, [pathname])

  const close = useCallback((): void => {
    setOpen(false)
  }, [])

  const toggle = useCallback((): void => {
    setOpen((v) => !v)
  }, [])

  if (isHidden(pathname)) return null

  return (
    <>
      <HelpFab
        ref={fabRef}
        stacked={isStacked(pathname)}
        expanded={open}
        onClick={toggle}
      />
      <HelpPanel open={open} onClose={close} triggerRef={fabRef} />
    </>
  )
}
