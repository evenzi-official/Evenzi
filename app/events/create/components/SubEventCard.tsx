'use client'

export const ICON_MAP: Record<string, string> = {
  sparkles: '✨',
  palette: '🎨',
  music: '🎵',
  heart: '💍',
  utensils: '🍽️',
  wine: '🍷',
  coffee: '☕',
  leaf: '🌿',
  paintbrush: '🖌️',
  toast: '🥂',
  camera: '📸',
  flower: '🌸',
  fire: '🔥',
  star: '⭐',
}

interface SubEventCardProps {
  id: string
  name: string
  description?: string
  iconName: string | null
  isSelected: boolean
  onToggle: () => void
}

export function SubEventCard({
  name,
  description,
  iconName,
  isSelected,
  onToggle,
}: SubEventCardProps): React.JSX.Element {
  const emoji = iconName ? (ICON_MAP[iconName] ?? '✨') : '✨'

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Deselect' : 'Select'} ${name}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px',
        width: '100%',
        textAlign: 'left',
        background: '#ffffff',
        borderRadius: '16px',
        border: `2px solid ${isSelected ? 'var(--color-text-primary)' : '#f0f0f0'}`,
        boxShadow: isSelected
          ? '0 4px 16px rgba(187,0,32,0.08)'
          : '0 1px 4px rgba(0,0,0,0.05)',
        cursor: 'pointer',
        outline: 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Selection indicator — top-right */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: isSelected ? 'var(--color-text-primary)' : '#ffffff',
          border: isSelected ? 'none' : '1.5px solid #d1d5db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isSelected && (
          <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
            <path d="M1 4l3 3 6-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Top row: icon + text */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', paddingRight: '28px' }}>
        {/* Icon container */}
        <div
          style={{
            width: '52px',
            height: '52px',
            minWidth: '52px',
            borderRadius: '12px',
            background: 'rgba(187, 0, 32, 0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}
          aria-hidden="true"
        >
          {emoji}
        </div>

        {/* Title + description */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontFamily: 'var(--font-manrope), sans-serif',
              fontSize: '18px',
              fontWeight: 700,
              color: '#1a1a1a',
              margin: '0 0 4px',
              lineHeight: '1.2',
            }}
          >
            {name}
          </h3>
          {description && (
            <p
              style={{
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                margin: 0,
                lineHeight: '1.5',
              }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Bottom row: SET TIME + SET VENUE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: 'rgba(187, 0, 32, 0.05)',
            borderRadius: '8px',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="#BB0020" strokeWidth="1.2" />
            <path d="M6.5 3.5v3l2 1.5" stroke="#BB0020" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', color: '#BB0020', textTransform: 'uppercase' }}>
            Set Time
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: 'rgba(187, 0, 32, 0.05)',
            borderRadius: '8px',
          }}
        >
          <svg width="11" height="14" viewBox="0 0 11 14" fill="none" aria-hidden="true">
            <path d="M5.5 1C3.015 1 1 3.015 1 5.5c0 3.5 4.5 7.5 4.5 7.5S10 9 10 5.5C10 3.015 7.985 1 5.5 1Zm0 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" stroke="#BB0020" strokeWidth="1.2" />
          </svg>
          <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', color: '#BB0020', textTransform: 'uppercase' }}>
            Set Venue
          </span>
        </div>
      </div>
    </button>
  )
}
