'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizard } from '@/lib/contexts/WizardContext'
import type { SelectedSubEvent } from '@/lib/types/events'

const ICON_MAP: Record<string, string> = {
  sparkles: '✨',
  palette: '🎨',
  music: '🎵',
  heart: '💍',
  utensils: '🍽️',
  wine: '🍷',
  coffee: '☕',
  leaf: '🌿',
  paintbrush: '🖌️',
  toast: '🥂',
  camera: '📸',
  flower: '🌸',
  fire: '🔥',
  star: '⭐',
}

function resolveIcon(iconName: string | null): string {
  if (!iconName) return '✨'
  return ICON_MAP[iconName] ?? '✨'
}

function getOrdinal(n: number): string {
  if (n === 1 || n === 21 || n === 31) return 'st'
  if (n === 2 || n === 22) return 'nd'
  if (n === 3 || n === 23) return 'rd'
  return 'th'
}

function formatDateLong(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDate()
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const year = d.getFullYear()
  return `${month} ${day}${getOrdinal(day)}, ${year}`
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDate()
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  return `${month} ${day}`
}

function getDisplayEventName(
  eventTitle: string | null,
  metadata: Record<string, string>,
  eventSlug: string,
  eventTypeName: string
): string {
  if (eventTitle?.trim()) return eventTitle.trim()
  const trim = (v: string | undefined) => (v ?? '').trim()
  if (eventSlug === 'wedding') {
    const p1 = trim(metadata['partner_1_name'])
    const p2 = trim(metadata['partner_2_name'])
    if (p1 && p2) return `${p1} & ${p2}'s Wedding`
    if (p1) return `${p1}'s Wedding`
    return 'Your Wedding'
  }
  if (eventSlug === 'birthday') {
    const name = trim(metadata['celebrant_name'])
    return name ? `${name}'s Birthday` : 'Your Birthday'
  }
  if (eventSlug === 'corporate') {
    const org = trim(metadata['organization_name'])
    return org ? `${org} Event` : 'Your Event'
  }
  return `Your ${eventTypeName}`
}

function getEventDescription(slug: string): string {
  switch (slug) {
    case 'wedding': return 'A multi-day traditional ceremony curated for a luxury experience.'
    case 'birthday': return 'A memorable celebration curated to perfection for your special day.'
    case 'anniversary': return 'A heartfelt celebration of your journey together.'
    case 'corporate': return 'A professional event curated to inspire and connect.'
    default: return 'A curated celebration tailored to your unique vision.'
  }
}

// --- Pencil edit icon ---

function PencilIcon(): React.JSX.Element {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path
        d="M9.5 1.5l2 2L4 11H2v-2L9.5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
      <div style={{ padding: '24px' }}>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          No event type selected. Please start from step 1.
        </p>
      </div>
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

  async function handleSubmit(): Promise<void> {
    if (submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const payload = {
        eventTypeId: eventType!.id,
        eventTitle: basicDetails.eventTitle ?? undefined,
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

      let message = `Something went wrong (${res.status})`
      try {
        const errData = await res.json() as { error?: string }
        if (errData.error) message = errData.error
      } catch {
        // fallback
      }
      setError(message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const displayName = getDisplayEventName(
    basicDetails.eventTitle,
    basicDetails.metadata,
    eventType.slug,
    eventType.name
  )

  const eventEmoji = resolveIcon(eventType.iconName)
  const eventDescription = getEventDescription(eventType.slug)
  const badgeText = `PREMIUM ${eventType.name.toUpperCase()} EXPERIENCE`

  return (
    <section style={{ width: '100%', maxWidth: '920px', margin: '0 auto', padding: '40px 24px 56px' }}>

      {/* Centered heading */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-manrope), sans-serif',
            fontSize: 'clamp(30px, 4.5vw, 52px)',
            fontWeight: 700,
            lineHeight: '1.1',
            color: '#374151',
            marginBottom: '14px',
          }}
        >
          Review your{' '}
          <span style={{ color: 'var(--color-text-primary)' }}>{displayName}</span>
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
          Almost there! Take a final look at your curated celebration details.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          style={{
            marginBottom: '24px',
            padding: '14px 18px',
            background: 'rgba(187,0,32,0.06)',
            border: '1px solid rgba(187,0,32,0.25)',
            borderRadius: '12px',
          }}
        >
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>
            {error}
          </p>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Basic Details */}
          <div>
            {/* Section label row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-manrope), sans-serif',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#374151',
                  margin: 0,
                }}
              >
                Basic Details
              </h2>
              <button
                type="button"
                onClick={handleEditBasicDetails}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  padding: 0,
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
              >
                <PencilIcon />
                Edit Details
              </button>
            </div>

            {/* Details card */}
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #ede8e8',
                borderRadius: '16px',
                padding: '24px 26px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: '22px', columnGap: '24px' }}>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 5px' }}>
                    Event Title
                  </p>
                  <p style={{ fontSize: '15px', fontWeight: 500, color: '#1a1a1a', margin: 0, lineHeight: '1.4' }}>
                    {displayName}
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 5px' }}>
                    Main Date
                  </p>
                  <p style={{ fontSize: '15px', fontWeight: 500, color: '#1a1a1a', margin: 0 }}>
                    {formatDateLong(basicDetails.primaryDate)}
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 5px' }}>
                    Venue
                  </p>
                  <p style={{ fontSize: '15px', fontWeight: 500, color: '#1a1a1a', margin: 0 }}>
                    {basicDetails.primaryVenue?.trim() || '—'}
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 5px' }}>
                    Estimated Guests
                  </p>
                  <p style={{ fontSize: '15px', fontWeight: 500, color: '#1a1a1a', margin: 0 }}>
                    {basicDetails.guestCapacity != null ? `${basicDetails.guestCapacity} Attendees` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Event Itinerary */}
          {eventType.hasSubEvents && (
            <div>
              {/* Section label row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-manrope), sans-serif',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#374151',
                    margin: 0,
                  }}
                >
                  Event Itinerary
                </h2>
                <button
                  type="button"
                  onClick={handleEditSubEvents}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    padding: 0,
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                  }}
                >
                  <PencilIcon />
                  Modify Schedule
                </button>
              </div>

              {selectedSubEvents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedSubEvents.map((se, idx) => {
                    const isLast = idx === selectedSubEvents.length - 1
                    const dateText = formatDateShort(basicDetails.primaryDate)
                    const venueText = basicDetails.primaryVenue?.trim()
                    const subText = [dateText, venueText].filter(Boolean).join(' • ')

                    return (
                      <div
                        key={`${se.subEventTypeId ?? 'custom'}-${idx}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          padding: '16px 20px',
                          borderRadius: '14px',
                          background: isLast ? 'var(--color-text-primary)' : '#ffffff',
                          border: `1.5px solid ${isLast ? 'transparent' : '#ede8e8'}`,
                        }}
                      >
                        {/* Icon circle */}
                        <div
                          aria-hidden="true"
                          style={{
                            width: '44px',
                            height: '44px',
                            minWidth: '44px',
                            borderRadius: '50%',
                            background: isLast ? 'rgba(255,255,255,0.22)' : 'rgba(187,0,32,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                          }}
                        >
                          {resolveIcon(se.iconName)}
                        </div>

                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontFamily: 'var(--font-manrope), sans-serif',
                              fontSize: '15px',
                              fontWeight: 700,
                              color: isLast ? '#ffffff' : '#1a1a1a',
                              margin: '0 0 3px',
                            }}
                          >
                            {se.customName || se.name}
                          </p>
                          {subText && (
                            <p style={{ fontSize: '13px', color: isLast ? 'rgba(255,255,255,0.72)' : '#9ca3af', margin: 0 }}>
                              {subText}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                  No sub-events selected.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Preview card */}
          <div
            style={{
              borderRadius: '20px',
              overflow: 'hidden',
              background: 'linear-gradient(160deg, #2a1010 0%, #4a1818 45%, #1e0808 100%)',
              minHeight: '420px',
              position: 'relative',
              boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
            }}
          >
            {/* Radial glow overlay */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse 90% 55% at 50% 10%, rgba(187,0,32,0.45) 0%, transparent 65%)',
              }}
            />

            {/* Subtle dot texture */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              }}
            />

            {/* Large emoji — upper center */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -75%)',
                fontSize: '96px',
                opacity: 0.4,
                lineHeight: 1,
              }}
            >
              {eventEmoji}
            </div>

            {/* Bottom info overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.35) 65%, transparent 100%)',
                padding: '32px 20px 22px',
              }}
            >
              {/* Badge pill */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.14)',
                  borderRadius: '20px',
                  padding: '5px 12px',
                  marginBottom: '12px',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                  }}
                >
                  {badgeText}
                </span>
              </div>

              <p
                style={{
                  fontFamily: 'var(--font-manrope), sans-serif',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#ffffff',
                  margin: '0 0 8px',
                  lineHeight: '1.25',
                }}
              >
                {displayName}
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.62)', margin: 0, lineHeight: '1.55' }}>
                {eventDescription}
              </p>
            </div>
          </div>

          {/* Terms / note box */}
          <div
            style={{
              background: '#fafafa',
              border: '1.5px solid #e5e7eb',
              borderRadius: '14px',
              padding: '16px 18px',
            }}
          >
            <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.7', margin: 0, textAlign: 'center' }}>
              Confirming your launch will initiate automated vendor outreach and guest invitations. By proceeding,{' '}
              <span
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                  cursor: 'pointer',
                }}
              >
                you agree to the Terms of Service
              </span>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Bottom action buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          marginTop: '52px',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          disabled={submitting}
          style={{
            padding: '18px 52px',
            background: 'transparent',
            color: '#1a1a1a',
            fontSize: '15px',
            fontWeight: 600,
            borderRadius: '9999px',
            border: '2px solid #d1d5db',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-manrope), sans-serif',
            opacity: submitting ? 0.5 : 1,
            transition: 'border-color 0.15s, opacity 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={() => { void handleSubmit() }}
          disabled={submitting}
          style={{
            padding: '18px 56px',
            background: 'var(--color-text-primary)',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: 600,
            borderRadius: '9999px',
            border: 'none',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-manrope), sans-serif',
            opacity: submitting ? 0.7 : 1,
            transition: 'opacity 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {submitting ? 'Creating…' : 'Confirm & Launch 🚀'}
        </button>
      </div>

    </section>
  )
}
