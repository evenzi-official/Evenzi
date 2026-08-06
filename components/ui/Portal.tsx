'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

function subscribe(): () => void {
  return () => {}
}

function getClientSnapshot(): boolean {
  return true
}

function getServerSnapshot(): boolean {
  return false
}

/** Renders children into document.body so fixed overlays escape stacking contexts (e.g. .reveal transform). */
export function Portal({ children }: { children: ReactNode }): React.ReactElement | null {
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
  if (!mounted) return null
  return createPortal(children, document.body)
}
