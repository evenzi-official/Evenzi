'use client'

import { useEffect, useRef } from 'react'
import { Portal } from '@/components/ui/Portal'

interface BusyOverlayProps {
  active: boolean
  label?: string
}

export function BusyOverlay({ active, label = 'Saving…' }: BusyOverlayProps): React.ReactElement {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    cardRef.current?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function keepFocusInside(e: FocusEvent): void {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        e.stopPropagation()
        cardRef.current.focus()
      }
    }

    function onKeyDown(e: KeyboardEvent): void {
      if (e.key !== 'Tab' || !cardRef.current) return
      e.preventDefault()
      cardRef.current.focus()
    }

    document.addEventListener('focusin', keepFocusInside, true)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('focusin', keepFocusInside, true)
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [active])

  return (
    <Portal>
      <div className={`busy-overlay${active ? ' is-active' : ''}`} aria-hidden={!active}>
        <div
          ref={cardRef}
          className="busy-overlay-card"
          role="status"
          aria-live="polite"
          aria-busy={active}
          tabIndex={-1}
        >
          <span className="busy-overlay-spinner" aria-hidden="true" />
          <span className="busy-overlay-label">{label}</span>
        </div>
      </div>
    </Portal>
  )
}
