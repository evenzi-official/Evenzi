'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useWizard } from '@/lib/contexts/WizardContext'
import type { SubEventType } from '@/lib/types/events'
import { SubEventCard } from './SubEventCard'

// Fallback descriptions by lowercased name/slug
const DESCRIPTIONS: Record<string, string> = {
  haldi: 'The vibrant morning of turmeric and togetherness.',
  mehendi: 'Intricate artistry and melodic celebrations.',
  mehndi: 'Intricate artistry and melodic celebrations.',
  sangeet: 'A high-velocity night of dance and music.',
  reception: 'Black-tie elegance and celebratory toasts.',
  ceremony: 'The sacred union and eternal vows.',
  'wedding ceremony': 'The sacred union and eternal vows.',
  engagement: 'The promise of forever begins here.',
  cocktail: 'An evening of curated spirits and conversations.',
  brunch: 'A leisurely morning celebration with loved ones.',
}

function getDescription(name: string): string | undefined {
  return DESCRIPTIONS[name.toLowerCase()]
}

export function Step3SubEvents(): React.JSX.Element {
  const { state, dispatch } = useWizard()
  const { eventType, selectedSubEvents, totalSteps } = state

  const [subEventTypes, setSubEventTypes] = useState<SubEventType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customName, setCustomName] = useState('')
  const customInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!eventType) return
    let cancelled = false

    async function fetchSubEvents(): Promise<void> {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/event-types/${eventType!.id}/sub-events`)
        if (!res.ok) throw new Error(`Failed to load sub-events (${res.status})`)
        const json = await res.json()
        const data: SubEventType[] = json.subEventTypes ?? json
        if (cancelled) return
        setSubEventTypes(data)

        const defaults = data
          .filter((s) => s.isDefault)
          .map((s) => ({ subEventTypeId: s.id, customName: null, name: s.name, iconName: s.iconName }))

        if (defaults.length > 0) {
          dispatch({ type: 'SET_DEFAULT_SUB_EVENTS', payload: defaults })
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchSubEvents()
    return () => { cancelled = true }
  }, [eventType, dispatch])

  useEffect(() => {
    if (showCustomInput) customInputRef.current?.focus()
  }, [showCustomInput])

  function handleToggle(sub: SubEventType): void {
    dispatch({ type: 'TOGGLE_SUB_EVENT', payload: { subEventTypeId: sub.id, name: sub.name, iconName: sub.iconName } })
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

  const customSubEvents = selectedSubEvents.filter((se) => se.subEventTypeId === null)
  const canContinue = selectedSubEvents.length > 0

  const filteredSubEvents = subEventTypes.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function handleContinue(): void {
    if (!canContinue) return
    dispatch({ type: 'GO_TO_STEP', payload: totalSteps })
  }

  function handleBack(): void {
    dispatch({ type: 'GO_TO_STEP', payload: 2 })
  }

  // --- Loading skeleton ---
  if (loading) {
    return (
      <section style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '40px 24px 120px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ height: '64px', background: '#f3f4f6', borderRadius: '8px', width: '60%', margin: '0 auto 16px' }} />
          <div style={{ height: '40px', background: '#f3f4f6', borderRadius: '6px', width: '80%', margin: '0 auto' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: '140px', background: '#f3f4f6', borderRadius: '16px' }} />
          ))}
        </div>
      </section>
    )
  }

  // --- Error ---
  if (error) {
    return (
      <section style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)', marginBottom: '16px' }} role="alert">
          <p style={{ fontSize: '14px', color: 'var(--color-error)' }}>{error}</p>
        </div>
        <button type="button" onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          ← Back to Step 2
        </button>
      </section>
    )
  }

  return (
    <>
      <section style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '40px 24px 40px' }}>

        {/* Heading — single line: dark + red */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-manrope), sans-serif',
              fontSize: '60px',
              fontWeight: 700,
              lineHeight: '1.1',
              color: '#1a1a1a',
              margin: '0 0 20px',
            }}
          >
            Curate Your{' '}
            <span style={{ color: 'var(--color-text-primary)' }}>Celebrations</span>
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: 'var(--color-text-secondary)',
              lineHeight: '1.65',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            Step 3: Select the ceremonies you&apos;d like to include in your grand itinerary. Each selection unlocks specific vendor and aesthetic curators.
          </p>
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative', maxWidth: '580px', margin: '0 auto 36px' }}>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '18px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
              pointerEvents: 'none',
              display: 'flex',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ceremonies, rituals, or events..."
            style={{
              width: '100%',
              padding: '14px 20px 14px 44px',
              fontSize: '14px',
              color: '#1a1a1a',
              background: 'rgba(187, 0, 32, 0.04)',
              border: '1.5px solid rgba(187, 0, 32, 0.1)',
              borderRadius: '9999px',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* 2-column card grid */}
        {filteredSubEvents.length > 0 && (
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}
            role="list"
            aria-label="Sub-event types"
          >
            {filteredSubEvents.map((sub) => (
              <div key={sub.id} role="listitem">
                <SubEventCard
                  id={sub.id}
                  name={sub.name}
                  description={getDescription(sub.name)}
                  iconName={sub.iconName}
                  isSelected={isSelectedType(sub.id)}
                  onToggle={() => handleToggle(sub)}
                />
              </div>
            ))}
          </div>
        )}

        {filteredSubEvents.length === 0 && searchQuery && (
          <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--color-text-muted)', padding: '32px 0' }}>
            No ceremonies found matching &ldquo;{searchQuery}&rdquo;
          </p>
        )}

        {/* Custom sub-events already added */}
        {customSubEvents.length > 0 && (
          <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {customSubEvents.map((ce, idx) => {
              const absoluteIndex = selectedSubEvents.indexOf(ce)
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    background: 'rgba(187, 0, 32, 0.06)',
                    border: '1.5px solid rgba(187, 0, 32, 0.15)',
                    borderRadius: '9999px',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{ce.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustom(absoluteIndex)}
                    aria-label={`Remove ${ce.name}`}
                    style={{
                      width: '18px', height: '18px', borderRadius: '50%', border: 'none',
                      background: 'rgba(187,0,32,0.15)', color: 'var(--color-text-primary)',
                      cursor: 'pointer', fontSize: '12px', lineHeight: 1, padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Add Custom Event card */}
        {!showCustomInput ? (
          <button
            type="button"
            onClick={() => setShowCustomInput(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '24px 28px',
              background: '#ffffff',
              border: '1.5px solid #f0f0f0',
              borderRadius: '16px',
              cursor: 'pointer',
              outline: 'none',
              textAlign: 'left',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              transition: 'border-color 0.15s',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                minWidth: '44px',
                borderRadius: '50%',
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                color: '#6b7280',
              }}
              aria-hidden="true"
            >
              +
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-manrope), sans-serif', fontSize: '16px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' }}>
                Add Custom Event
              </p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Create your own unique celebration segment
              </p>
            </div>
          </button>
        ) : (
          <div
            style={{
              width: '100%',
              padding: '24px 28px',
              background: '#ffffff',
              border: '1.5px dashed var(--color-text-primary)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <label htmlFor="custom-sub-event-input" style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
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
              style={{
                width: '100%', padding: '12px 16px', fontSize: '14px', color: '#1a1a1a',
                background: 'var(--color-bg-primary)', border: '1.5px solid #e5e7eb',
                borderRadius: '10px', outline: 'none', fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleAddCustom}
                disabled={!customName.trim()}
                style={{
                  padding: '10px 24px',
                  background: customName.trim() ? 'var(--color-text-primary)' : '#e5e7eb',
                  color: customName.trim() ? '#ffffff' : '#9ca3af',
                  fontSize: '13px', fontWeight: 600, borderRadius: '9999px', border: 'none',
                  cursor: customName.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-manrope), sans-serif',
                }}
              >
                Add
              </button>
              <button
                type="button"
                onClick={handleCancelCustom}
                style={{
                  padding: '10px 20px', background: 'none', color: 'var(--color-text-secondary)',
                  fontSize: '13px', fontWeight: 500, borderRadius: '9999px',
                  border: '1.5px solid #e5e7eb', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Bottom action bar */}
        <div
          style={{
            marginTop: '40px',
            background: '#ffffff',
            borderTop: '1px solid #f0f0f0',
            borderRadius: '16px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
            padding: '20px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
        {/* Back */}
        <button
          type="button"
          onClick={handleBack}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 500, color: '#374151',
            padding: '8px 0', whiteSpace: 'nowrap',
          }}
        >
          <span aria-hidden="true">←</span> Back to Step 2
        </button>

        {/* Center: count + dots */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#374151', textTransform: 'uppercase' }}>
            {selectedSubEvents.length} Sub-Event{selectedSubEvents.length !== 1 ? 's' : ''} Selected
          </span>
          {selectedSubEvents.length > 0 && (
            <div style={{ display: 'flex', gap: '5px' }}>
              {Array.from({ length: Math.min(selectedSubEvents.length, 5) }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: 'var(--color-text-primary)',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Proceed */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          style={{
            padding: '14px 32px',
            background: canContinue ? 'var(--color-text-primary)' : '#e5e7eb',
            color: canContinue ? '#ffffff' : '#9ca3af',
            fontSize: '14px', fontWeight: 600, borderRadius: '9999px', border: 'none',
            cursor: canContinue ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: '8px',
            fontFamily: 'var(--font-manrope), sans-serif',
            whiteSpace: 'nowrap',
            transition: 'background 0.15s',
          }}
        >
          Proceed to Final Review <span aria-hidden="true">→</span>
        </button>
        </div>

      </section>
    </>
  )
}
