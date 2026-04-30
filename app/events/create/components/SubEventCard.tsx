'use client'

export const ICON_MAP: Record<string, string> = {
  sparkles: '✨',
  palette: '🎨',
  music: '🎵',
  heart: '💍',
  utensils: '🍽️',
  wine: '🍷',
  coffee: '☕',
}

interface SubEventCardProps {
  id: string
  name: string
  iconName: string | null
  isSelected: boolean
  onToggle: () => void
}

export function SubEventCard({
  id,
  name,
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
      className="relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2"
      style={{
        background: isSelected ? 'var(--color-bg-card)' : 'var(--color-bg-card)',
        border: isSelected
          ? '2px solid var(--color-primary)'
          : '2px solid var(--color-border)',
        boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        minWidth: '0',
        width: '100%',
      }}
    >
      {/* Checkmark badge */}
      {isSelected && (
        <span
          className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
          style={{
            background: 'var(--color-primary)',
            color: '#ffffff',
            borderRadius: 'var(--radius-full)',
          }}
          aria-hidden="true"
        >
          ✓
        </span>
      )}

      {/* Icon */}
      <span className="text-3xl leading-none" aria-hidden="true">
        {emoji}
      </span>

      {/* Name */}
      <span
        className="text-sm font-medium text-center leading-snug"
        style={{
          color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        }}
      >
        {name}
      </span>
    </button>
  )
}
