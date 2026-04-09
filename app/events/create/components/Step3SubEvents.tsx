'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useWizard } from '@/lib/contexts/WizardContext'
import type { SubEventType } from '@/lib/types/events'
import { SubEventCard } from './SubEventCard'

export function Step3SubEvents(): React.JSX.Element {
  const { state, dispatch } = useWizard()
  const { eventType, selectedSubEvents, totalSteps } = state

  const [subEventTypes, setSubEventTypes] = useState<SubEventType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Custom event input state
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customName, setCustomName] = useState('')
  const customInputRef = useRef<HTMLInputElement>(null)

  // Fetch sub-event types and batch-set defaults once
  useEffect(() => {
    if (!eventType) return

    let cancelled = false

    async function fetchSubEvents(): Promise<void> {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/event-types/${eventType!.id}/sub-events`)
        if (!res.ok) throw new Error(`Failed to load sub-events (${res.status})`)
        const data: SubEventType[] = await res.json()
        if (cancelled) return

        setSubEventTypes(data)

        // Batch default selection — dispatched once, only if nothing selected yet
        const defaults = data
          .filter((s) => s.isDefault)
          .map((s) => ({
            subEventTypeId: s.id,
            customName: null,
            name: s.name,
            iconName: s.iconName,
          }))

        if (defaults.length > 0) {
          dispatch({ type: 'SET_DEFAULT_SUB_EVENTS', payload: defaults })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Something went wrong')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchSubEvents()
    return () => { cancelled = true }
  }, [eventType, dispatch])

  // Focus custom input when it appears
  useEffect(() => {
    if (showCustomInput) {
      customInputRef.current?.focus()
    }
  }, [showCustomInput])

  function handleToggle(sub: SubEventType): void {
    dispatch({
      type: 'TOGGLE_SUB_EVENT',
      payload: {
        subEventTypeId: sub.id,
        name: sub.name,
        iconName: sub.iconName,
      },
    })
  }

  function handleAddCustom(): void {
    const trimmed = customName.trim()
    if (!trimmed) return
    dispatch({ type: 'ADD_CUSTOM_SUB_EVENT', payload: { name: trimmed } })
    setCustomName('')
    setShowCustomInput(false)
  }

  function handleRemoveCustom(index: number): void {
    dispatch({ type: 'REMOVE_CUSTOM_SUB_EVENT', payload: { index } })
  }

  function handleCancelCustom(): void {
    setCustomName('')
    setShowCustomInput(false)
  }

  const isSelectedType = (id: string): boolean =>
    selectedSubEvents.some((se) => se.subEventTypeId === id)

  // Custom sub-events: those with no subEventTypeId
  const customSubEvents = selectedSubEvents.filter((se) => se.subEventTypeId === null)

  const canContinue = selectedSubEvents.length > 0

  function handleContinue(): void {
    if (!canContinue) return
    dispatch({ type: 'GO_TO_STEP', payload: totalSteps }) // Go to Review step
  }

  function handleBack(): void {
    dispatch({ type: 'GO_TO_STEP', payload: 2 })
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div className="flex flex-col gap-6 px-4 sm:px-6 lg:px-8 py-6">
        <div>
          <h2
            className="text-xl font-semibold mb-1"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Choose Your Events
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Loading event options…
          </p>
        </div>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          aria-busy="true"
          aria-label="Loading sub-events"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl animate-pulse"
              style={{
                background: 'var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="flex flex-col gap-6 px-4 sm:px-6 lg:px-8 py-6">
        <div
          className="p-4 rounded-xl"
          role="alert"
          style={{
            background: 'var(--color-error-bg)',
            border: '1px solid var(--color-error-border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--color-error)' }}>
            {error}
          </p>
        </div>
        <button
          type="button"
          onClick={handleBack}
          className="self-start text-sm underline"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          ← Back
        </button>
      </div>
    )
  }

  // --- Main render ---
  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div>
        <h2
          className="text-xl font-semibold mb-1"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Choose Your Events
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Select the events that are part of your celebration. You can add custom ones too.
        </p>
      </div>

      {/* Sub-event type grid */}
      {subEventTypes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {subEventTypes.map((sub) => (
            <SubEventCard
              key={sub.id}
              id={sub.id}
              name={sub.name}
              iconName={sub.iconName}
              isSelected={isSelectedType(sub.id)}
              onToggle={() => handleToggle(sub)}
            />
          ))}
        </div>
      )}

      {/* Custom sub-events (already added) */}
      {customSubEvents.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            Custom Events
          </p>
          <div className="flex flex-col gap-2">
            {customSubEvents.map((ce, idx) => {
              // Find absolute index in selectedSubEvents
              const absoluteIndex = selectedSubEvents.indexOf(ce)
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{
                    background: 'var(--color-bg-card)',
                    border: '2px solid var(--color-primary)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {ce.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustom(absoluteIndex)}
                    aria-label={`Remove custom event: ${ce.name}`}
                    className="ml-3 flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold transition-opacity hover:opacity-70"
                    style={{
                      background: 'var(--color-error-bg)',
                      color: 'var(--color-error)',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Custom Event */}
      <div>
        {!showCustomInput ? (
          <button
            type="button"
            onClick={() => setShowCustomInput(true)}
            className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <span
              className="flex items-center justify-center w-6 h-6 rounded-full text-base"
              style={{
                background: 'var(--color-border)',
                borderRadius: 'var(--radius-full)',
              }}
              aria-hidden="true"
            >
              +
            </span>
            Add Custom Event
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <label
              htmlFor="custom-sub-event-input"
              className="text-sm font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Custom Event Name
            </label>
            <input
              id="custom-sub-event-input"
              ref={customInputRef}
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCustom()
                if (e.key === 'Escape') handleCancelCustom()
              }}
              placeholder="e.g. Mehndi Night"
              maxLength={80}
              className="w-full px-4 py-2.5 text-sm rounded-xl border outline-none transition-shadow focus:ring-2"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
              }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddCustom}
                disabled={!customName.trim()}
                className="px-4 py-2 text-sm font-medium rounded-xl transition-opacity disabled:opacity-40"
                style={{
                  background: 'var(--color-primary)',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                Add
              </button>
              <button
                type="button"
                onClick={handleCancelCustom}
                className="px-4 py-2 text-sm font-medium rounded-xl transition-opacity hover:opacity-70"
                style={{
                  background: 'var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Validation hint */}
      {!canContinue && (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Select at least one event to continue.
        </p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleBack}
          className="px-5 py-2.5 text-sm font-medium rounded-xl transition-opacity hover:opacity-70"
          style={{
            background: 'var(--color-border)',
            color: 'var(--color-text-secondary)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          className="px-6 py-2.5 text-sm font-medium rounded-xl transition-opacity disabled:opacity-40"
          style={{
            background: 'var(--color-primary)',
            color: '#ffffff',
            borderRadius: 'var(--radius-md)',
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
