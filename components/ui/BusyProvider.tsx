'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { BusyOverlay } from '@/components/ui/BusyOverlay'

interface BusyContextValue {
  /**
   * Freeze the whole screen while `fn` runs, then release. Nested/overlapping
   * calls are reference-counted, so the overlay stays up until the last one
   * settles. The optional label is shown on the overlay card.
   */
  runBusy: <T>(fn: () => Promise<T>, label?: string) => Promise<T>
  /** Manually raise/lower the freeze — for flows that can't be wrapped in a single promise. */
  setBusy: (active: boolean, label?: string) => void
}

const BusyContext = createContext<BusyContextValue | null>(null)

const DEFAULT_LABEL = 'Working…'

export function BusyProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [count, setCount] = useState(0)
  const [label, setLabel] = useState(DEFAULT_LABEL)
  // Tracks manual setBusy(true) calls so setBusy(false) can't drive the count negative.
  const manualActive = useRef(false)

  const runBusy = useCallback(async <T,>(fn: () => Promise<T>, lbl?: string): Promise<T> => {
    if (lbl) setLabel(lbl)
    setCount((c) => c + 1)
    try {
      return await fn()
    } finally {
      setCount((c) => Math.max(0, c - 1))
    }
  }, [])

  const setBusy = useCallback((active: boolean, lbl?: string): void => {
    if (active) {
      if (lbl) setLabel(lbl)
      if (!manualActive.current) {
        manualActive.current = true
        setCount((c) => c + 1)
      }
    } else if (manualActive.current) {
      manualActive.current = false
      setCount((c) => Math.max(0, c - 1))
    }
  }, [])

  const value = useMemo<BusyContextValue>(() => ({ runBusy, setBusy }), [runBusy, setBusy])

  return (
    <BusyContext.Provider value={value}>
      {children}
      <BusyOverlay active={count > 0} label={label} />
    </BusyContext.Provider>
  )
}

export function useBusy(): BusyContextValue {
  const ctx = useContext(BusyContext)
  if (!ctx) throw new Error('useBusy must be used within <BusyProvider>')
  return ctx
}
