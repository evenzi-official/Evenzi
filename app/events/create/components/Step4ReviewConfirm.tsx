'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizard } from '@/lib/contexts/WizardContext'
import { useBusy } from '@/components/ui/BusyProvider'

const ICON_MAP: Record<string, string> = {
  sparkles: 'auto_awesome',
  palette: 'palette',
  music: 'music_note',
  heart: 'favorite',
  utensils: 'restaurant',
  wine: 'wine_bar',
  coffee: 'local_cafe',
  spa: 'spa',
}

export function Step4ReviewConfirm(): React.JSX.Element {
  const router = useRouter()
  const { state, dispatch } = useWizard()
  const { eventType, basicDetails, selectedSubEvents, totalSteps } = state

  const { setBusy } = useBusy()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!eventType) {
    return (
      <section className="clay-card cc-card">
        <p style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>
          No event type selected. Please start from step 1.
        </p>
      </section>
    )
  }

  function handleEditBasicDetails(): void {
    dispatch({ type: 'GO_TO_STEP', payload: 2 })
  }

  function handleEditSubEvents(): void {
    dispatch({ type: 'GO_TO_STEP', payload: 3 })
  }

  function handleBack(): void {
    const prevStep = eventType!.hasSubEvents ? totalSteps - 1 : 2
    dispatch({ type: 'GO_TO_STEP', payload: prevStep })
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—'
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  function formatTime(time24: string | null): string | null {
    if (!time24) return null
    const [hStr, mStr] = time24.split(':')
    const h = parseInt(hStr, 10)
    const m = parseInt(mStr, 10)
    if (isNaN(h) || isNaN(m)) return null
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
  }

  async function handleSubmit(): Promise<void> {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    setBusy(true, 'Creating your event…')
    try {
      const payload = {
        eventTypeId: eventType!.id,
        eventTitle: basicDetails.eventTitle ?? null,
        metadata: basicDetails.metadata,
        primaryDate: basicDetails.primaryDate,
        primaryVenue: basicDetails.primaryVenue,
        guestCapacity: basicDetails.guestCapacity,
        coverImageUrl: basicDetails.coverImageUrl ?? null,
        subEvents: selectedSubEvents.map((se) => ({
          subEventTypeId: se.subEventTypeId,
          customName: se.customName,
          eventDate: se.eventDate,
          startTime: se.startTime,
          endTime: se.endTime,
          venue: se.venue,
        })),
      }
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.status === 201) {
        const data = await res.json() as { event: { id: string } }
        router.push(`/events/${data.event.id}`)
        return
      }
      let message = `Something went wrong (${res.status})`
      try {
        const errData = await res.json() as { error?: string }
        if (errData.error) message = errData.error
      } catch { /* use status message */ }
      setError(message)
      setBusy(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.')
      setBusy(false)
    } finally {
      setSubmitting(false)
    }
  }

  const formSchema = eventType.formSchema

  return (
    <section className="clay-card cc-card" aria-labelledby="cc-step4-title">
      <header className="cc-card-head">
        <p className="cc-card-eyebrow">
          <span className="material-symbols-outlined icon-fill" aria-hidden="true">visibility</span>
          Almost there
        </p>
        <h1 className="cc-card-title" id="cc-step4-title">
          Review your <em>event plan</em>
        </h1>
        <p className="cc-card-lead">
          Take a final look at your curated celebration details before we launch your dashboard.
        </p>
      </header>

      {/* Basic details */}
      <section className="cc-review-section">
        <header className="cc-review-section-head">
          <h2 className="cc-review-section-title">Basic details</h2>
          <button type="button" className="cc-review-edit" onClick={handleEditBasicDetails}>
            <span aria-hidden="true" className="material-symbols-outlined">edit</span>
            Edit
          </button>
        </header>
        <div className="cc-review-grid">
          {basicDetails.eventTitle?.trim() && (
            <div className="cc-review-field">
              <span className="cc-review-field-label">Title</span>
              <span className="cc-review-field-value">{basicDetails.eventTitle.trim()}</span>
            </div>
          )}
          {formSchema.map((f) => (
            <div key={f.key} className="cc-review-field">
              <span className="cc-review-field-label">{f.label}</span>
              <span className="cc-review-field-value">{basicDetails.metadata[f.key]?.trim() || '—'}</span>
            </div>
          ))}
          <div className="cc-review-field">
            <span className="cc-review-field-label">Date</span>
            <span className="cc-review-field-value">{formatDate(basicDetails.primaryDate)}</span>
          </div>
          <div className="cc-review-field">
            <span className="cc-review-field-label">Venue</span>
            <span className="cc-review-field-value">{basicDetails.primaryVenue?.trim() || '—'}</span>
          </div>
          <div className="cc-review-field">
            <span className="cc-review-field-label">Guests</span>
            <span className="cc-review-field-value">{basicDetails.guestCapacity ?? '—'}</span>
          </div>
        </div>
      </section>

      {/* Event itinerary */}
      {eventType.hasSubEvents && (
        <section className="cc-review-section">
          <header className="cc-review-section-head">
            <h2 className="cc-review-section-title">Event itinerary</h2>
            <button type="button" className="cc-review-edit" onClick={handleEditSubEvents}>
              <span aria-hidden="true" className="material-symbols-outlined">tune</span>
              Modify
            </button>
          </header>
          <div className="cc-review-itinerary">
            {selectedSubEvents.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--muted)' }}>No ceremonies selected.</p>
            ) : (
              selectedSubEvents.map((se) => {
                const dateLabel = se.eventDate ? formatDate(se.eventDate) : null
                const timeLabel = formatTime(se.startTime)
                const metaParts = [dateLabel, timeLabel, se.venue?.trim() || null].filter(Boolean)
                return (
                  <div key={se.clientId} className="cc-review-event">
                    <span className="cc-review-event-icon" aria-hidden="true">
                      <span className="material-symbols-outlined icon-fill">
                        {se.iconName ? (ICON_MAP[se.iconName] ?? 'celebration') : 'celebration'}
                      </span>
                    </span>
                    <div className="cc-review-event-body">
                      <span className="cc-review-event-name">{se.name}</span>
                      <span className="cc-review-event-meta">
                        {metaParts.length > 0 ? metaParts.join(' · ') : 'Sub-ceremony'}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      )}

      {error && (
        <p className="form-error" role="alert" style={{ marginTop: '1rem' }}>{error}</p>
      )}

      <div className="cc-actions">
        <button
          type="button"
          className="cc-back-btn"
          disabled={submitting}
          onClick={handleBack}
        >
          <span aria-hidden="true" className="material-symbols-outlined">arrow_back</span>
          Back
        </button>
        <button
          type="button"
          className={`btn-pill btn-pill-primary btn-pill-lg${submitting ? ' is-loading' : ''}`}
          disabled={submitting}
          aria-disabled={submitting}
          onClick={() => { void handleSubmit() }}
        >
          <span>Confirm &amp; launch</span>
          <span aria-hidden="true" className="material-symbols-outlined icon-fill">check</span>
          <span aria-hidden="true" className="btn-pill-spinner" />
        </button>
      </div>
    </section>
  )
}
