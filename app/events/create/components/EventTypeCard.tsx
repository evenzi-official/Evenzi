'use client'

import type { EventType } from '@/lib/types/events'

interface EventTypeCardProps {
  eventType: EventType
  isSelected: boolean
  onSelect: (eventType: EventType) => void
}

export function EventTypeCard({
  eventType,
  isSelected,
  onSelect,
}: EventTypeCardProps): React.JSX.Element {
  const { enabled, name, description, features, imageUrl } = eventType

  if (!enabled) {
    // Disabled card — not interactive
    return (
      <div
        aria-disabled="true"
        className="relative flex flex-col rounded-xl border overflow-hidden select-none cursor-not-allowed"
        style={{
          background: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
          opacity: 0.6,
        }}
      >
        {/* Coming Soon badge */}
        <div className="absolute top-3 right-3 z-10">
          <span
            className="px-2 py-0.5 text-xs font-medium rounded-full"
            style={{
              background: 'var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
          >
            Coming Soon
          </span>
        </div>

        {/* Image placeholder */}
        <div
          className="w-full h-32 flex items-center justify-center"
          style={{ background: 'var(--color-bg-primary)' }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className="text-4xl"
              aria-hidden="true"
            >
              🎉
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 p-4">
          <h3
            className="text-base font-semibold"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {name}
          </h3>
          {description && (
            <p
              className="text-sm"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Enabled card — semantic button
  return (
    <button
      type="button"
      onClick={() => onSelect(eventType)}
      aria-label={`Select ${name}`}
      aria-pressed={isSelected}
      className={[
        'relative flex flex-col rounded-xl border overflow-hidden text-left transition-all duration-150',
        'hover:shadow-md focus-visible:outline-none focus-visible:ring-2 [--tw-ring-color:var(--color-text-primary)]',
        'focus-visible:ring-offset-2',
      ].join(' ')}
      style={{
        background: 'var(--color-bg-card)',
        borderColor: isSelected ? 'var(--color-text-primary)' : 'var(--color-border)',
        boxShadow: isSelected ? '0 0 0 2px var(--color-text-primary)' : undefined,
      }}
    >
      {/* Image placeholder */}
      <div
        className="w-full h-32 flex items-center justify-center"
        style={{ background: 'var(--color-bg-primary)' }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span
            className="text-4xl"
            aria-hidden="true"
          >
            💍
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4">
        <h3
          className="text-base font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {name}
        </h3>

        {description && (
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {description}
          </p>
        )}

        {features.length > 0 && (
          <ul className="flex flex-col gap-1 mt-1">
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-1.5 text-xs"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <span aria-hidden="true" className="shrink-0">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        )}

        {/* CTA */}
        <div className="mt-3">
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Select →
          </span>
        </div>
      </div>
    </button>
  )
}
