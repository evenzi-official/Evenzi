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
  const selectionCount = selectedSubEvents.length

  const filteredSubEventTypes = searchQuery.trim()
    ? subEventTypes.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : subEventTypes

  function handleContinue(): void {
    if (!canContinue) return
    dispatch({ type: 'GO_TO_STEP', payload: totalSteps })
  }

  function handleBack(): void {
    dispatch({ type: 'GO_TO_STEP', payload: 2 })
  }

  if (loading) {
    return (
      <section className="clay-card cc-card">
        <div className="flex items-center justify-center gap-3 py-16">
          <div
            className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--line)', borderTopColor: 'transparent' }}
            role="status"
            aria-label="Loading celebrations"
          />
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--muted)' }}>
            Loading celebrations…
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
          <button type="button" className="cc-back-btn" onClick={handleBack}>
            <span aria-hidden="true" className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="clay-card cc-card" aria-labelledby="cc-step3-title">
      <header className="cc-card-head">
        <p className="cc-card-eyebrow">
          <span className="material-symbols-outlined icon-fill" aria-hidden="true">auto_awesome</span>
          Shape the rhythm
        </p>
        <h1 className="cc-card-title" id="cc-step3-title">
          Curate your <em>celebrations</em>
        </h1>
        <p className="cc-card-lead">
          Pick the ceremonies you&apos;d like to include. Each selection unlocks specific vendor &amp; aesthetic curators on your dashboard.
        </p>
      </header>

      {/* Search */}
      <div className="cc-search-row">
        <span className="material-symbols-outlined" aria-hidden="true">search</span>
        <input
          type="search"
          value={searchQuery}
          placeholder="Search ceremonies, rituals, moments…"
          aria-label="Search celebrations"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Celebration cards grid */}
      {filteredSubEventTypes.length > 0 && (
        <div className="cc-celebration-grid" role="group" aria-label="Wedding celebrations">
          {filteredSubEventTypes.map((sub) => (
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

      {/* Custom sub-events already added */}
      {customSubEvents.length > 0 && (
        <div className="cc-celebration-grid">
          {customSubEvents.map((ce, idx) => {
            const absoluteIndex = selectedSubEvents.indexOf(ce)
            return (
              <div
                key={idx}
                role="checkbox"
                aria-checked="true"
                className="cc-celebration-card"
                style={{ cursor: 'default' }}
              >
                <button
                  type="button"
                  className="cc-celebration-check"
                  aria-label={`Remove ${ce.name}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleRemoveCustom(absoluteIndex)}
                >
                  <span className="material-symbols-outlined icon-fill">close</span>
                </button>
                <div className="cc-celebration-head">
                  <span className="cc-celebration-icon" aria-hidden="true">
                    <span className="material-symbols-outlined icon-fill">add_circle</span>
                  </span>
                  <div className="cc-celebration-body">
                    <span className="cc-celebration-name">{ce.name}</span>
                    <p className="cc-celebration-desc">Custom ceremony</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add custom button / inline form */}
      {!showCustomInput ? (
        <button type="button" className="cc-add-custom" onClick={() => setShowCustomInput(true)}>
          <span aria-hidden="true" className="material-symbols-outlined">add</span>
          Add a custom ceremony
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="form-group">
            <label className="form-label" htmlFor="cc-custom-name">Ceremony name</label>
            <input
              id="cc-custom-name"
              ref={customInputRef}
              type="text"
              className="form-input"
              value={customName}
              placeholder="e.g. Mehndi Night"
              maxLength={80}
              autoComplete="off"
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCustom()
                if (e.key === 'Escape') handleCancelCustom()
              }}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-pill btn-pill-primary"
              disabled={!customName.trim()}
              onClick={handleAddCustom}
            >
              <span>Add</span>
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
            <button type="button" className="btn-pill btn-pill-secondary" onClick={handleCancelCustom}>
              <span>Cancel</span>
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
          </div>
        </div>
      )}

      {/* Selection count chip */}
      <div className={`cc-selection-chip${selectionCount === 0 ? ' is-empty' : ''}`} role="status" aria-live="polite">
        <span aria-hidden="true" className="cc-selection-dot" />
        <span>{selectionCount === 0 ? '0 celebrations selected' : `${selectionCount} celebration${selectionCount === 1 ? '' : 's'} selected`}</span>
      </div>

      <div className="cc-actions">
        <button type="button" className="cc-back-btn" onClick={handleBack}>
          <span aria-hidden="true" className="material-symbols-outlined">arrow_back</span>
          Back
        </button>
        <button
          type="button"
          className="btn-pill btn-pill-primary btn-pill-lg"
          disabled={!canContinue}
          aria-disabled={!canContinue}
          onClick={handleContinue}
        >
          <span>Proceed to review</span>
          <span aria-hidden="true" className="material-symbols-outlined">arrow_forward</span>
          <span aria-hidden="true" className="btn-pill-spinner" />
        </button>
      </div>
    </section>
  )
}
