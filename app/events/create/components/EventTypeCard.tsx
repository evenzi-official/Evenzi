'use client'

import type { EventType } from '@/lib/types/events'

const SLUG_ICON: Record<string, string> = {
  wedding: 'favorite',
  birthday: 'cake',
  anniversary: 'redeem',
  corporate: 'domain',
}

interface EventTypeCardProps {
  eventType: EventType
  isSelected: boolean
  onSelect: (eventType: EventType) => void
}

export function EventTypeCard({ eventType, isSelected, onSelect }: EventTypeCardProps): React.JSX.Element {
  const icon = SLUG_ICON[eventType.slug] ?? 'event'

  if (!eventType.enabled) {
    return (
      <button
        type="button"
        role="radio"
        aria-checked="false"
        aria-disabled="true"
        tabIndex={-1}
        className="cc-type-card"
      >
        <span className="cc-type-tag" aria-hidden="true">Soon</span>
        <span className="cc-type-icon" aria-hidden="true">
          <span className="material-symbols-outlined icon-fill">{icon}</span>
        </span>
        <p className="cc-type-name">{eventType.name}</p>
        <p className="cc-type-desc">{eventType.description}</p>
      </button>
    )
  }

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      className="cc-type-card"
      onClick={() => onSelect(eventType)}
    >
      <span className="cc-type-icon" aria-hidden="true">
        <span className="material-symbols-outlined icon-fill">{icon}</span>
      </span>
      <p className="cc-type-name">{eventType.name}</p>
      <p className="cc-type-desc">{eventType.description}</p>
    </button>
  )
}
