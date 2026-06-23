'use client'

import React, { useEffect, useState } from 'react'
import { useWizard } from '@/lib/contexts/WizardContext'
import type { SubEventType } from '@/lib/types/events'
import { EVENT_DATE_MIN_ISO, eventDateMaxISO } from '@/lib/validations/events'
import { SubEventCard } from './SubEventCard'
import { SetTimeModal, SetVenueModal, AddCustomModal } from './Step3Modals'

type ModalKind = 'time' | 'venue' | 'custom' | null

interface Step3SubEventsProps {
  /** Server-rendered sub-event types for the chosen type (M14). Undefined on a
   * catalog miss → fall back to a client fetch. */
  initialSubEventTypes?: SubEventType[]
}

export function Step3SubEvents({ initialSubEventTypes }: Step3SubEventsProps): React.JSX.Element {
  const { state, dispatch } = useWizard()
  const { eventType, selectedSubEvents, totalSteps } = state

  // Sub-event date bounds (M13): min = today, max = the main Event Date from
  // Step 2. When no event date is set yet, fall back to today / today+5y.
  const subEventDateMin = EVENT_DATE_MIN_ISO()
  const subEventDateMax = state.basicDetails.primaryDate ?? eventDateMaxISO()

  // Seed from server-rendered props when available (M14) — no loading state.
  const hasInitial = initialSubEventTypes != null
  const [subEventTypes, setSubEventTypes] = useState<SubEventType[]>(initialSubEventTypes ?? [])
  const [loading, setLoading] = useState(!hasInitial)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal state — one shared set, targeting the active card (matches design).
  const [modal, setModal] = useState<ModalKind>(null)
  const [activeClientId, setActiveClientId] = useState<string | null>(null)

  useEffect(() => {
    if (!eventType) return
    let cancelled = false

    function seedDefaults(data: SubEventType[]): void {
      const defaults = data
        .filter((s) => s.isDefault)
        .map((s) => ({ subEventTypeId: s.id, customName: null, name: s.name, iconName: s.iconName }))
      if (defaults.length > 0) {
        dispatch({ type: 'SET_DEFAULT_SUB_EVENTS', payload: defaults })
      }
    }

    // Server-rendered path (M14): no fetch, just seed the default selections.
    if (initialSubEventTypes != null) {
      seedDefaults(initialSubEventTypes)
      return () => { cancelled = true }
    }

    // Fallback path — catalog miss at the server level. Fetch client-side.
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
        seedDefaults(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchSubEvents()
    return () => { cancelled = true }
  }, [eventType, dispatch, initialSubEventTypes])

  function handleToggle(sub: SubEventType): void {
    dispatch({ type: 'TOGGLE_SUB_EVENT', payload: { subEventTypeId: sub.id, name: sub.name, iconName: sub.iconName } })
  }

  function handleRemoveCustom(clientId: string): void {
    dispatch({ type: 'REMOVE_CUSTOM_SUB_EVENT', payload: { clientId } })
  }

  const isSelectedType = (id: string): boolean =>
    selectedSubEvents.some((se) => se.subEventTypeId === id)

  const customSubEvents = selectedSubEvents.filter((se) => se.subEventTypeId === null)
  const canContinue = selectedSubEvents.length > 0
  const selectionCount = selectedSubEvents.length

  const trimmedQuery = searchQuery.trim()
  const filteredSubEventTypes = trimmedQuery
    ? subEventTypes.filter((s) => s.name.toLowerCase().includes(trimmedQuery.toLowerCase()))
    : subEventTypes
  const noTypeMatches = trimmedQuery !== '' && filteredSubEventTypes.length === 0

  const activeSubEvent = activeClientId
    ? selectedSubEvents.find((se) => se.clientId === activeClientId) ?? null
    : null

  // Opening a meta modal needs a selected card. If the card isn't selected yet,
  // select it first so it has a clientId, then target it.
  function openMeta(kind: 'time' | 'venue', sub: SubEventType): void {
    const target = selectedSubEvents.find((se) => se.subEventTypeId === sub.id)
    if (!target) {
      dispatch({ type: 'TOGGLE_SUB_EVENT', payload: { subEventTypeId: sub.id, name: sub.name, iconName: sub.iconName } })
      // The new entry isn't in this render's state; resolve it on next tick.
      setModal(kind)
      setActiveClientId(null)
      setPendingSelect({ subEventTypeId: sub.id, kind })
      return
    }
    setActiveClientId(target.clientId)
    setModal(kind)
  }

  // After a select-then-open, bind the active card once the dispatch lands.
  const [pendingSelect, setPendingSelect] = useState<{ subEventTypeId: string; kind: 'time' | 'venue' } | null>(null)
  useEffect(() => {
    if (!pendingSelect) return
    const match = selectedSubEvents.find((se) => se.subEventTypeId === pendingSelect.subEventTypeId)
    if (match) {
      setActiveClientId(match.clientId)
      setModal(pendingSelect.kind)
      setPendingSelect(null)
    }
  }, [pendingSelect, selectedSubEvents])

  function closeModal(): void {
    setModal(null)
    setActiveClientId(null)
  }

  function handleContinue(): void {
    if (!canContinue) return
    dispatch({ type: 'GO_TO_STEP', payload: totalSteps })
  }

  function handleBack(): void {
    dispatch({ type: 'GO_TO_STEP', payload: 2 })
  }

  if (loading) {
    return (
      <section className="clay-card cc-card" aria-busy="true" aria-label="Loading celebrations">
        <div className="cc-celebration-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-block" style={{ height: 96, borderRadius: 16 }} />
          ))}
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
          {filteredSubEventTypes.map((sub) => {
            const selected = selectedSubEvents.find((se) => se.subEventTypeId === sub.id)
            return (
              <SubEventCard
                key={sub.id}
                id={sub.id}
                name={sub.name}
                iconName={sub.iconName}
                isSelected={isSelectedType(sub.id)}
                eventDate={selected?.eventDate ?? null}
                startTime={selected?.startTime ?? null}
                venue={selected?.venue ?? null}
                onToggle={() => handleToggle(sub)}
                onSetTime={() => openMeta('time', sub)}
                onSetVenue={() => openMeta('venue', sub)}
              />
            )
          })}
        </div>
      )}

      {/* Empty-state when a search matches no built-in celebrations (M6) */}
      {noTypeMatches && (
        <div className="cc-search-empty" role="status" style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--muted)' }}>
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 32, opacity: 0.7 }}>search_off</span>
          <p style={{ fontSize: 14, marginTop: '0.5rem' }}>
            No celebrations match “{trimmedQuery}”.
          </p>
          <p style={{ fontSize: 13, marginTop: '0.25rem' }}>
            You can still add it as a custom ceremony below.
          </p>
        </div>
      )}

      {/* Custom sub-events already added — keyed on stable clientId (D6) */}
      {customSubEvents.length > 0 && (
        <div className="cc-celebration-grid">
          {customSubEvents.map((ce) => (
            <div
              key={ce.clientId}
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
                onClick={() => handleRemoveCustom(ce.clientId)}
              >
                <span className="material-symbols-outlined icon-fill">close</span>
              </button>
              <div className="cc-celebration-head">
                <span className="cc-celebration-icon" aria-hidden="true">
                  <span className="material-symbols-outlined icon-fill">add_circle</span>
                </span>
                <div className="cc-celebration-body">
                  <span className="cc-celebration-name">{ce.name}</span>
                  <p className="cc-celebration-desc">{ce.customDesc ?? 'Custom ceremony'}</p>
                </div>
              </div>
              <div className="cc-celebration-meta">
                <button
                  type="button"
                  className="cc-meta-btn"
                  aria-label={`Set date and time for ${ce.name}`}
                  onClick={() => { setActiveClientId(ce.clientId); setModal('time') }}
                >
                  <span aria-hidden="true" className="material-symbols-outlined">schedule</span>
                  <span className="cc-meta-label">{ce.startTime || ce.eventDate ? 'Edit time' : 'Set time'}</span>
                </button>
                <button
                  type="button"
                  className="cc-meta-btn"
                  aria-label={`Set venue for ${ce.name}`}
                  onClick={() => { setActiveClientId(ce.clientId); setModal('venue') }}
                >
                  <span aria-hidden="true" className="material-symbols-outlined">place</span>
                  <span className="cc-meta-label">{ce.venue?.trim() || 'Set venue'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add custom ceremony — opens modal (M5) */}
      <button type="button" className="cc-add-custom" onClick={() => setModal('custom')}>
        <span aria-hidden="true" className="material-symbols-outlined">add</span>
        Add a custom ceremony
      </button>

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

      {/* Modals — keyed so they remount fresh (state inits from props) on open */}
      <SetTimeModal
        key={`time-${activeClientId ?? 'none'}`}
        open={modal === 'time' && activeSubEvent != null}
        forLabel={activeSubEvent ? `For ${activeSubEvent.name}` : 'For this celebration'}
        dateMin={subEventDateMin}
        dateMax={subEventDateMax}
        initial={{
          eventDate: activeSubEvent?.eventDate ?? null,
          startTime: activeSubEvent?.startTime ?? null,
          endTime: activeSubEvent?.endTime ?? null,
        }}
        onSave={(v) => {
          if (activeClientId) {
            dispatch({ type: 'SET_SUB_EVENT_META', payload: { clientId: activeClientId, eventDate: v.eventDate, startTime: v.startTime, endTime: v.endTime } })
          }
        }}
        onClose={closeModal}
      />
      <SetVenueModal
        key={`venue-${activeClientId ?? 'none'}`}
        open={modal === 'venue' && activeSubEvent != null}
        forLabel={activeSubEvent ? `For ${activeSubEvent.name}` : 'For this celebration'}
        initial={{
          venue: activeSubEvent?.venue ?? null,
          venueAddress: activeSubEvent?.venueAddress ?? null,
        }}
        onSave={(v) => {
          if (activeClientId) {
            dispatch({ type: 'SET_SUB_EVENT_META', payload: { clientId: activeClientId, venue: v.venue, venueAddress: v.venueAddress } })
          }
        }}
        onClose={closeModal}
      />
      <AddCustomModal
        open={modal === 'custom'}
        onSave={(v) => {
          dispatch({ type: 'ADD_CUSTOM_SUB_EVENT', payload: { name: v.name, customDesc: v.desc } })
        }}
        onClose={closeModal}
      />
    </section>
  )
}
