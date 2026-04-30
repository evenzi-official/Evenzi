'use client'

import { useEffect, useState } from 'react'
import type { EventType } from '@/lib/types/events'
import { useWizard } from '@/lib/contexts/WizardContext'
import { EventTypeCard } from './EventTypeCard'

export function Step1EventType(): React.JSX.Element {
  const { state, dispatch } = useWizard()
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEventTypes(): Promise<void> {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/event-types')
        if (!res.ok) {
          throw new Error(`Failed to load event types (${res.status})`)
        }
        const data = (await res.json()) as { eventTypes: EventType[] }
        setEventTypes(data.eventTypes)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event types')
      } finally {
        setLoading(false)
      }
    }

    void fetchEventTypes()
  }, [])

  function handleSelect(eventType: EventType): void {
    dispatch({ type: 'SET_EVENT_TYPE', payload: eventType })
    dispatch({ type: 'GO_TO_STEP', payload: 2 })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--color-border)', borderTopColor: 'transparent' }}
          role="status"
          aria-label="Loading event types"
        />
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Loading event types…
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="mx-auto max-w-md mt-16 p-6 rounded-xl border text-center"
        style={{
          background: 'var(--color-error-bg)',
          borderColor: 'var(--color-error-border)',
        }}
        role="alert"
      >
        <p className="text-sm font-medium" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 text-sm font-medium rounded-lg transition-opacity hover:opacity-80"
          style={{
            background: 'var(--color-text-primary)',
            color: '#ffffff',
          }}
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Heading */}
      <div className="mb-8 text-center">
        <h1
          className="text-2xl sm:text-3xl font-bold mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          What are you celebrating?
        </h1>
        <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
          Choose the type of event you want to create.
        </p>
      </div>

      {/* Grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        role="list"
        aria-label="Event types"
      >
        {eventTypes.map((eventType) => (
          <div key={eventType.id} role="listitem">
            <EventTypeCard
              eventType={eventType}
              isSelected={state.eventType?.id === eventType.id}
              onSelect={handleSelect}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
