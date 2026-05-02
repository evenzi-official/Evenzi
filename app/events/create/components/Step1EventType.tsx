'use client'

import { useEffect, useRef, useState } from 'react'
import type { EventType } from '@/lib/types/events'
import { useWizard } from '@/lib/contexts/WizardContext'
import { EventTypeCard } from './EventTypeCard'

export function Step1EventType(): React.JSX.Element {
  const { state, dispatch } = useWizard()
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [somethingElseSelected, setSomethingElseSelected] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)

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

  function handleSelectCard(eventType: EventType): void {
    setSomethingElseSelected(false)
    dispatch({ type: 'SET_EVENT_TYPE', payload: eventType })
  }

  function handleSelectSomethingElse(): void {
    setSomethingElseSelected(true)
    setTimeout(() => titleInputRef.current?.focus(), 50)
  }

  function handleProceed(): void {
    if (somethingElseSelected) {
      const customType: EventType = {
        id: 'custom',
        name: customTitle.trim() || 'Custom Event',
        slug: 'custom',
        description: null,
        iconName: null,
        imageUrl: null,
        enabled: true,
        hasSubEvents: false,
        formSchema: [],
        features: [],
        displayOrder: 999,
      }
      dispatch({ type: 'SET_EVENT_TYPE', payload: customType })
    }
    dispatch({ type: 'GO_TO_STEP', payload: 2 })
  }

  const canProceed =
    (!!state.eventType && !somethingElseSelected) ||
    (somethingElseSelected && customTitle.trim().length > 0)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
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
        style={{ background: 'var(--color-error-bg)', borderColor: 'var(--color-error-border)' }}
        role="alert"
      >
        <p className="text-sm font-medium" style={{ color: 'var(--color-error)' }}>{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 text-sm font-medium rounded-lg transition-opacity hover:opacity-80"
          style={{ background: 'var(--color-text-primary)', color: '#ffffff' }}
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Heading */}
      <div className="mb-10 text-center">
        <h1
          className="font-normal text-center mb-4"
          style={{
            fontFamily: 'var(--font-manrope), sans-serif',
            fontSize: '48px',
            lineHeight: '48px',
            letterSpacing: '-1.2px',
            color: '#1a1a1a',
          }}
        >
          What type of event<br />
          are you{' '}
          <span style={{ color: 'var(--color-text-primary)' }}>planning?</span>
        </h1>
        <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
          Choose an event type to unlock curated templates and expert<br />
          planning tools tailored for your celebration.
        </p>
      </div>

      {/* Event type cards — 4 columns */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5"
        role="list"
        aria-label="Event types"
      >
        {eventTypes.map((eventType) => (
          <div key={eventType.id} role="listitem">
            <EventTypeCard
              eventType={eventType}
              isSelected={!somethingElseSelected && state.eventType?.id === eventType.id}
              onSelect={handleSelectCard}
            />
          </div>
        ))}
      </div>

      {/* Something Else card */}
      <button
        type="button"
        onClick={handleSelectSomethingElse}
        aria-pressed={somethingElseSelected}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '24px',
          padding: '28px 32px',
          background: '#ffffff',
          borderRadius: '16px',
          border: `1.5px dashed ${somethingElseSelected ? 'var(--color-text-primary)' : '#d1d5db'}`,
          cursor: 'pointer',
          textAlign: 'left',
          position: 'relative',
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
      >
        {/* Selection dot */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: somethingElseSelected ? 'var(--color-text-primary)' : 'transparent',
            border: somethingElseSelected ? 'none' : '2px solid #d1d5db',
          }}
        />

        {/* Left: title + description */}
        <div style={{ flex: '0 0 auto', maxWidth: '50%' }}>
          <h3
            style={{
              fontFamily: 'var(--font-manrope), sans-serif',
              fontSize: '20px',
              fontWeight: 700,
              color: '#1a1a1a',
              marginBottom: '8px',
            }}
          >
            Something Else?
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.55', margin: 0 }}>
            A custom framework for your unique vision. Build your event from the ground up with our modular toolkit.
          </p>
        </div>

        {/* Right: event title input */}
        <div style={{ flex: 1, minWidth: 0 }} onClick={(e) => e.stopPropagation()}>
          <label
            htmlFor="custom-event-title"
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              color: 'var(--color-text-secondary)',
              marginBottom: '8px',
              textTransform: 'uppercase',
            }}
          >
            Event Title
          </label>
          <input
            ref={titleInputRef}
            id="custom-event-title"
            type="text"
            value={customTitle}
            onChange={(e) => {
              setCustomTitle(e.target.value)
              if (!somethingElseSelected) setSomethingElseSelected(true)
            }}
            onFocus={() => {
              if (!somethingElseSelected) handleSelectSomethingElse()
            }}
            placeholder="e.g. Art Exhibition"
            style={{
              width: '100%',
              padding: '10px 0',
              fontSize: '14px',
              color: '#1a1a1a',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid #e5e7eb',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </button>

      {/* Proceed button */}
      <div className="flex justify-center mt-10">
        <button
          type="button"
          onClick={handleProceed}
          disabled={!canProceed}
          style={{
            padding: '18px 56px',
            background: canProceed ? 'var(--color-text-primary)' : '#e5e7eb',
            color: canProceed ? '#ffffff' : '#9ca3af',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            borderRadius: '9999px',
            border: 'none',
            cursor: canProceed ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'background 0.15s, opacity 0.15s',
            fontFamily: 'var(--font-manrope), sans-serif',
          }}
        >
          PROCEED TO DETAILS
          <span aria-hidden="true">→</span>
        </button>
      </div>

    </section>
  )
}
