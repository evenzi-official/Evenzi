'use client'

import { useEffect, useState } from 'react'
import type { EventType } from '@/lib/types/events'
import { useWizard } from '@/lib/contexts/WizardContext'
import { EventTypeCard } from './EventTypeCard'

const PAGE_SIZE = 3

export function Step1EventType(): React.JSX.Element {
  const { state, dispatch } = useWizard()
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  useEffect(() => {
    async function fetchEventTypes(): Promise<void> {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/event-types')
        if (!res.ok) throw new Error(`Failed to load event types (${res.status})`)
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

  // Jump to the page containing the already-selected event type on load
  useEffect(() => {
    if (state.eventType && eventTypes.length > 0) {
      const idx = eventTypes.findIndex((et) => et.id === state.eventType!.id)
      if (idx >= 0) setPage(Math.floor(idx / PAGE_SIZE))
    }
  }, [eventTypes, state.eventType])

  const totalPages = Math.ceil(eventTypes.length / PAGE_SIZE)
  const visibleCards = eventTypes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const canPrev = page > 0
  const canNext = page < totalPages - 1

  function handleSelect(eventType: EventType): void {
    dispatch({ type: 'SET_EVENT_TYPE', payload: eventType })
  }

  function handleContinue(): void {
    if (!state.eventType) return
    dispatch({ type: 'GO_TO_STEP', payload: 2 })
  }

  const navBtn = (active: boolean): React.CSSProperties => ({
    width: 36, height: 36, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    background: 'var(--card)',
    border: '1px solid var(--line)',
    color: 'var(--ink)',
    cursor: active ? 'pointer' : 'default',
    opacity: active ? 1 : 0.3,
    transition: 'opacity .2s, background-color .2s',
    appearance: 'none',
  })

  if (loading) {
    return (
      <section className="clay-card cc-card">
        <div className="flex items-center justify-center gap-3 py-16">
          <div
            className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--line)', borderTopColor: 'transparent' }}
            role="status"
            aria-label="Loading event types"
          />
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--muted)' }}>
            Loading event types…
          </p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="clay-card cc-card">
        <div className="flex flex-col items-center gap-4 py-12 text-center" role="alert">
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>{error}</p>
          <button
            type="button"
            className="btn-pill btn-pill-secondary"
            onClick={() => window.location.reload()}
          >
            <span>Try again</span>
            <span aria-hidden="true" className="btn-pill-spinner" />
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="clay-card cc-card" aria-labelledby="cc-step1-title">
      <header className="cc-card-head">
        <p className="cc-card-eyebrow">
          <span className="material-symbols-outlined icon-fill" aria-hidden="true">auto_awesome</span>
          Start of your story
        </p>
        <h1 className="cc-card-title" id="cc-step1-title">
          What type of event are <em>you planning</em>?
        </h1>
        <p className="cc-card-lead">
          Pick a type to unlock curated templates and expert planning tools tailored to your celebration.
        </p>
      </header>

      {/* Carousel */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Previous event types"
          disabled={!canPrev}
          style={navBtn(canPrev)}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_left</span>
        </button>

        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-[.85rem] sm:gap-4" role="radiogroup" aria-label="Event type">
            {visibleCards.map((eventType) => (
              <EventTypeCard
                key={eventType.id}
                eventType={eventType}
                isSelected={state.eventType?.id === eventType.id}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          aria-label="Next event types"
          disabled={!canNext}
          style={navBtn(canNext)}
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_right</span>
        </button>
      </div>

      {/* Page dots */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Page ${i + 1}`}
              onClick={() => setPage(i)}
              style={{
                height: 6,
                width: i === page ? 20 : 6,
                borderRadius: 9999,
                background: i === page ? 'var(--brand)' : 'var(--line)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'width .2s, background-color .2s',
              }}
            />
          ))}
        </div>
      )}

      <div className="cc-actions">
        <a className="cc-back-btn" href="/home">
          <span aria-hidden="true" className="material-symbols-outlined">arrow_back</span>
          Cancel
        </a>
        <button
          type="button"
          className="btn-pill btn-pill-primary btn-pill-lg"
          disabled={!state.eventType}
          aria-disabled={!state.eventType}
          onClick={handleContinue}
        >
          <span>Proceed to details</span>
          <span aria-hidden="true" className="material-symbols-outlined">arrow_forward</span>
          <span aria-hidden="true" className="btn-pill-spinner" />
        </button>
      </div>
    </section>
  )
}
