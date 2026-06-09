'use client'

export const ICON_MAP: Record<string, string> = {
  sparkles: 'auto_awesome',
  palette: 'palette',
  music: 'music_note',
  heart: 'favorite',
  utensils: 'restaurant',
  wine: 'wine_bar',
  coffee: 'local_cafe',
  spa: 'spa',
}

interface SubEventCardProps {
  id: string
  name: string
  iconName: string | null
  isSelected: boolean
  onToggle: () => void
}

export function SubEventCard({ name, iconName, isSelected, onToggle }: SubEventCardProps): React.JSX.Element {
  const icon = iconName ? (ICON_MAP[iconName] ?? 'celebration') : 'celebration'

  return (
    <div
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      className="cc-celebration-card"
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onToggle()
        }
      }}
    >
      <span className="cc-celebration-check" aria-hidden="true">
        <span className="material-symbols-outlined icon-fill">check</span>
      </span>
      <div className="cc-celebration-head">
        <span className="cc-celebration-icon" aria-hidden="true">
          <span className="material-symbols-outlined icon-fill">{icon}</span>
        </span>
        <div className="cc-celebration-body">
          <span className="cc-celebration-name">{name}</span>
        </div>
      </div>
      <div className="cc-celebration-meta">
        <button
          type="button"
          className="cc-meta-btn"
          aria-label={`Set time for ${name}`}
          onClick={(e) => e.stopPropagation()}
        >
          <span aria-hidden="true" className="material-symbols-outlined">schedule</span>
          <span className="cc-meta-label">Set time</span>
        </button>
        <button
          type="button"
          className="cc-meta-btn"
          aria-label={`Set venue for ${name}`}
          onClick={(e) => e.stopPropagation()}
        >
          <span aria-hidden="true" className="material-symbols-outlined">place</span>
          <span className="cc-meta-label">Set venue</span>
        </button>
      </div>
    </div>
  )
}
