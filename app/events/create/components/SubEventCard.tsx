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

function formatTimeLabel(time24: string | null): string | null {
  if (!time24) return null
  const [hStr, mStr] = time24.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (isNaN(h) || isNaN(m)) return null
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function formatDateLabel(iso: string | null): string | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map((v) => parseInt(v, 10))
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

interface SubEventCardProps {
  id: string
  name: string
  iconName: string | null
  isSelected: boolean
  eventDate: string | null
  startTime: string | null
  venue: string | null
  onToggle: () => void
  onSetTime: () => void
  onSetVenue: () => void
}

export function SubEventCard({
  name,
  iconName,
  isSelected,
  eventDate,
  startTime,
  venue,
  onToggle,
  onSetTime,
  onSetVenue,
}: SubEventCardProps): React.JSX.Element {
  const icon = iconName ? (ICON_MAP[iconName] ?? 'celebration') : 'celebration'

  const dateLabel = formatDateLabel(eventDate)
  const timeLabel = formatTimeLabel(startTime)
  const timeChipLabel = dateLabel && timeLabel
    ? `${dateLabel} · ${timeLabel}`
    : (timeLabel ?? dateLabel ?? 'Set time')
  const venueChipLabel = venue && venue.trim() ? venue.trim() : 'Set venue'

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
          aria-label={`Set date and time for ${name}`}
          onClick={(e) => { e.stopPropagation(); onSetTime() }}
        >
          <span aria-hidden="true" className="material-symbols-outlined">schedule</span>
          <span className="cc-meta-label">{timeChipLabel}</span>
        </button>
        <button
          type="button"
          className="cc-meta-btn"
          aria-label={`Set venue for ${name}`}
          onClick={(e) => { e.stopPropagation(); onSetVenue() }}
        >
          <span aria-hidden="true" className="material-symbols-outlined">place</span>
          <span className="cc-meta-label">{venueChipLabel}</span>
        </button>
      </div>
    </div>
  )
}
