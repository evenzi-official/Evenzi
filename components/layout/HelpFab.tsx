'use client'

import { forwardRef } from 'react'

export const HelpFab = forwardRef<
  HTMLButtonElement,
  {
    stacked?: boolean
    expanded?: boolean
    onClick?: () => void
  }
>(function HelpFab({ stacked = false, expanded = false, onClick }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={`help-fab${stacked ? ' help-fab--stacked' : ''}`}
      aria-label={expanded ? 'Close Help Centre' : 'Open Help Centre'}
      aria-expanded={expanded}
      aria-controls="help-panel"
      onClick={onClick}
    >
      <span aria-hidden="true" className="material-symbols-outlined">
        help
      </span>
    </button>
  )
})
