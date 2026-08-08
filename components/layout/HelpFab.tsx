'use client'

export function HelpFab({
  stacked = false,
  expanded = false,
  onClick,
}: {
  stacked?: boolean
  expanded?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      className={`help-fab${stacked ? ' help-fab--stacked' : ''}`}
      aria-label={expanded ? 'Close Help Centre' : 'Open Help Centre'}
      aria-expanded={expanded}
      aria-controls="help-panel"
      onClick={onClick}
    >
      <span aria-hidden="true" className="material-symbols-outlined">help</span>
    </button>
  )
}
