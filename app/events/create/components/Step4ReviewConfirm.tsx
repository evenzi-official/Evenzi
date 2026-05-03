'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizard } from '@/lib/contexts/WizardContext'
import type { SelectedSubEvent } from '@/lib/types/events'

// --- Icon map for sub-event icons ---

const ICON_MAP: Record<string, string> = {
  sparkles: '✨',
  palette: '🎨',
  music: '🎵',
  heart: '💍',
  utensils: '🍽️',
  wine: '🍷',
  coffee: '☕',
}

function resolveIcon(iconName: string | null): string {
  if (!iconName) return '✨'
  return ICON_MAP[iconName] ?? '✨'
}

// --- Sub-event chip ---

function SubEventChip({ se }: { se: SelectedSubEvent }): React.JSX.Element {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-xl text-center"
      style={{
        background: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        minHeight: '72px',
      }}
    >
      <span className="text-xl" aria-hidden="true">
        {resolveIcon(se.iconName)}
      </span>
      <span
        className="text-xs font-medium leading-tight"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {se.name}
      </span>
    </div>
  )
}

// --- Section header with edit link ---

function SectionHeader({
  title,
  onEdit,
}: {
  title: string
  onEdit: () => void
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {title}
      </h3>
      <button
        type="button"
        onClick={onEdit}
        className="text-xs font-semibold uppercase tracking-widest underline transition-opacity hover:opacity-70"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Edit
      </button>
    </div>
  )
}

// --- Detail row ---

function DetailRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {label}
      </span>
      <span
        className="text-sm font-medium"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {value}
      </span>
    </div>
  )
}

// --- Main component ---

export function Step4ReviewConfirm(): React.JSX.Element {
  const router = useRouter()
  const { state, dispatch } = useWizard()
  const { eventType, basicDetails, selectedSubEvents, totalSteps } = state

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!eventType) {
    return (
      <div className="px-4 py-6">
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No event type selected. Please start from step 1.
        </p>
      </div>
    )
  }

  // --- Navigation helpers ---

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

  // --- Date formatting ---

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Not set'
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // --- Form submission ---

  async function handleSubmit(): Promise<void> {
    if (submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const payload = {
        eventTypeId: eventType!.id,
        metadata: basicDetails.metadata,
        primaryDate: basicDetails.primaryDate,
        primaryVenue: basicDetails.primaryVenue,
        guestCapacity: basicDetails.guestCapacity,
        subEvents: selectedSubEvents.map((se) => ({
          subEventTypeId: se.subEventTypeId,
          customName: se.customName,
        })),
      }

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.status === 201) {
        const data = await res.json() as { event: { id: string } }
        router.push(`/events/${data.event.id}/success`)
        return
      }

      // Handle errors
      let message = `Something went wrong (${res.status})`
      try {
        const errData = await res.json() as { error?: string }
        if (errData.error) message = errData.error
      } catch {
        // fallback to status message
      }
      setError(message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // --- Derived values ---

  const formSchema = eventType.formSchema
  const hasSubEvents = selectedSubEvents.length > 0
  const totalGuestCapacity = basicDetails.guestCapacity ?? 0
  const backLabel = eventType.hasSubEvents ? '← Back to Sub-Events' : '← Back to Details'

  return (
    <div className="flex flex-col gap-8 px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
      {/* Heading */}
      <div>
        <h2
          className="text-xl font-semibold mb-1"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Review Your Event Details
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Everything look right? Confirm to launch your event dashboard.
        </p>
      </div>

      {/* Error banner */}
      {error && (
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
      )}

      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Basic Details */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          <SectionHeader title="Basic Details" onEdit={handleEditBasicDetails} />

          <div className="flex flex-col gap-4">
            {/* Dynamic metadata fields from formSchema */}
            {formSchema.length > 0 && formSchema.map((fieldDef) => {
              const val = basicDetails.metadata[fieldDef.field]
              return (
                <DetailRow
                  key={fieldDef.field}
                  label={fieldDef.label}
                  value={val && val.trim() ? val.trim() : 'Not set'}
                />
              )
            })}

            {/* Date */}
            <DetailRow
              label="Primary Date"
              value={formatDate(basicDetails.primaryDate)}
            />

            {/* Venue */}
            <DetailRow
              label="Primary Venue"
              value={basicDetails.primaryVenue && basicDetails.primaryVenue.trim()
                ? basicDetails.primaryVenue.trim()
                : 'Not set'}
            />
          </div>
        </div>

        {/* Right: Selected Sub-Events (only shown if applicable) */}
        {eventType.hasSubEvents && (
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <SectionHeader title="Selected Sub-Events" onEdit={handleEditSubEvents} />

            {hasSubEvents ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedSubEvents.map((se, idx) => (
                  <SubEventChip key={`${se.subEventTypeId ?? 'custom'}-${idx}`} se={se} />
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                No sub-events selected.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div
        className="grid grid-cols-2 gap-4"
        aria-label="Event summary stats"
      >
        <div
          className="rounded-xl px-5 py-4 text-center"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <p
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {selectedSubEvents.length}
          </p>
          <p
            className="text-xs font-medium uppercase tracking-wide mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Total Sub-Events
          </p>
        </div>

        <div
          className="rounded-xl px-5 py-4 text-center"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <p
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {totalGuestCapacity > 0 ? totalGuestCapacity : '—'}
          </p>
          <p
            className="text-xs font-medium uppercase tracking-wide mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Guest Capacity
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div
        className="rounded-xl px-5 py-4"
        role="note"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          You can add more sub-events or change details anytime from your dashboard after launching.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4 pt-2">
        {/* CTA */}
        <button
          type="button"
          onClick={() => { void handleSubmit() }}
          disabled={submitting}
          className="w-full rounded-xl py-4 text-sm font-semibold tracking-wide transition-opacity disabled:opacity-50 hover:opacity-90 active:opacity-80"
          style={{
            background: 'var(--color-text-primary)',
            color: 'var(--color-bg-primary)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {submitting ? 'Creating your event…' : 'CONFIRM & LAUNCH DASHBOARD'}
        </button>

        {/* Back link */}
        <button
          type="button"
          onClick={handleBack}
          disabled={submitting}
          className="self-center text-sm transition-opacity hover:opacity-70 disabled:opacity-40"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {backLabel}
        </button>
      </div>
    </div>
  )
}
