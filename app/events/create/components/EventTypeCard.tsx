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
  const { enabled, name, description, imageUrl } = eventType

  const selectionDot = (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        background: isSelected ? 'var(--color-text-primary)' : 'rgba(255,255,255,0.9)',
        border: isSelected ? 'none' : '2px solid #d1d5db',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }}
    />
  )

  const imageBlock = (
    <div style={{ position: 'relative', padding: '10px 10px 0' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
          aspectRatio: '1 / 1',
        }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: '#111827',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '48px' }} aria-hidden="true">🎉</span>
          </div>
        )}
      </div>
      {selectionDot}
    </div>
  )

  const textBlock = (
    <div style={{ padding: '16px 16px 20px', textAlign: 'center' }}>
      <h3
        style={{
          fontFamily: 'var(--font-manrope), sans-serif',
          fontSize: '18px',
          fontWeight: 700,
          color: '#1a1a1a',
          lineHeight: '1.3',
          marginBottom: '8px',
        }}
      >
        {name}
      </h3>
      {description && (
        <p
          style={{
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            lineHeight: '1.55',
            margin: 0,
          }}
        >
          {description}
        </p>
      )}
    </div>
  )

  if (!enabled) {
    return (
      <div
        aria-disabled="true"
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          background: '#ffffff',
          borderRadius: '16px',
          border: '2px solid transparent',
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          opacity: 0.5,
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        {imageBlock}
        {textBlock}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(eventType)}
      aria-label={`Select ${name}`}
      aria-pressed={isSelected}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        textAlign: 'left',
        background: '#ffffff',
        borderRadius: '16px',
        border: `2px solid ${isSelected ? 'var(--color-text-primary)' : 'transparent'}`,
        boxShadow: isSelected
          ? '0 4px 16px rgba(187,0,32,0.12)'
          : '0 1px 6px rgba(0,0,0,0.07)',
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        outline: 'none',
      }}
    >
      {imageBlock}
      {textBlock}
    </button>
  )
}
