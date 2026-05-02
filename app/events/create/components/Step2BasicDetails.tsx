'use client'

import React, { useState } from 'react'
import { useWizard } from '@/lib/contexts/WizardContext'
import { validateDynamicFields } from '@/lib/validations/events'

interface FieldErrors {
  [field: string]: string
}

function getHeadingSecondLine(slug: string | undefined, name: string): string {
  switch (slug) {
    case 'wedding': return 'your union.'
    case 'birthday': return 'your birthday.'
    case 'anniversary': return 'your anniversary.'
    case 'corporate': return 'your event.'
    default: return `your ${name.toLowerCase()}.`
  }
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '14px 20px',
  fontSize: '14px',
  color: '#1a1a1a',
  background: '#ffffff',
  border: '1.5px solid #e5e7eb',
  borderRadius: '12px',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s',
}

const INPUT_ERROR_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  borderColor: 'var(--color-error)',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#374151',
  marginBottom: '8px',
}

function FieldLabel({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} style={LABEL_STYLE}>
      {children}
      {required && <span style={{ color: 'var(--color-error)', marginLeft: '3px' }}>*</span>}
    </label>
  )
}

export default function Step2BasicDetails(): React.JSX.Element | null {
  const { state, dispatch } = useWizard()
  if (!state.eventType) {
    dispatch({ type: 'GO_TO_STEP', payload: 1 })
    return null
  }
  const eventType = state.eventType
  const formSchema = eventType.formSchema

  const [eventTitle, setEventTitle] = useState<string>(state.basicDetails.eventTitle ?? '')
  const [metadata, setMetadata] = useState<Record<string, string>>(
    () => state.basicDetails.metadata ?? {}
  )
  const [primaryDate, setPrimaryDate] = useState<string>(state.basicDetails.primaryDate ?? '')
  const [primaryVenue, setPrimaryVenue] = useState<string>(state.basicDetails.primaryVenue ?? '')
  const [guestCapacity, setGuestCapacity] = useState<string>(
    state.basicDetails.guestCapacity != null ? String(state.basicDetails.guestCapacity) : ''
  )
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [guestCapacityError, setGuestCapacityError] = useState<string>('')

  function handleMetadataChange(field: string, value: string): void {
    setMetadata((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
    }
  }

  function buildBasicDetails() {
    return {
      eventTitle: eventTitle.trim() || null,
      primaryDate: primaryDate.trim() || null,
      primaryVenue: primaryVenue.trim() || null,
      guestCapacity: guestCapacity.trim() !== '' ? parseInt(guestCapacity, 10) : null,
      metadata,
    }
  }

  function validate(): boolean {
    let valid = true
    const dynamicErrors = validateDynamicFields(metadata, formSchema)
    if (dynamicErrors.length > 0) {
      const errorMap: FieldErrors = {}
      for (const err of dynamicErrors) errorMap[err.field] = err.message
      setFieldErrors(errorMap)
      valid = false
    } else {
      setFieldErrors({})
    }
    if (guestCapacity.trim() !== '') {
      const parsed = parseInt(guestCapacity, 10)
      if (isNaN(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
        setGuestCapacityError('Must be a positive whole number')
        valid = false
      } else {
        setGuestCapacityError('')
      }
    } else {
      setGuestCapacityError('')
    }
    return valid
  }

  function handleContinue(): void {
    if (!validate()) return
    dispatch({ type: 'SET_BASIC_DETAILS', payload: buildBasicDetails() })
    const nextStep = eventType.hasSubEvents ? 3 : state.totalSteps
    dispatch({ type: 'GO_TO_STEP', payload: nextStep })
  }

  function handleBack(): void {
    dispatch({ type: 'SET_BASIC_DETAILS', payload: buildBasicDetails() })
    dispatch({ type: 'GO_TO_STEP', payload: 1 })
  }

  const headingLine2 = getHeadingSecondLine(eventType.slug, eventType.name)

  return (
    <section className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-10">

      {/* Heading */}
      <div className="text-center mb-10">
        <h1
          style={{
            fontFamily: 'var(--font-manrope), sans-serif',
            fontSize: '56px',
            fontWeight: 700,
            lineHeight: '1.1',
            color: '#1a1a1a',
            marginBottom: '0',
          }}
        >
          Tell us about
        </h1>
        <h1
          style={{
            fontFamily: 'var(--font-manrope), sans-serif',
            fontSize: '56px',
            fontWeight: 700,
            lineHeight: '1.1',
            color: 'var(--color-text-primary)',
            marginBottom: '24px',
          }}
        >
          {headingLine2}
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: 'var(--color-text-secondary)',
            lineHeight: '1.65',
            maxWidth: '480px',
            margin: '0 auto',
          }}
        >
          We&apos;re curating a bespoke experience tailored to your unique journey. Let&apos;s start with the foundational details of your big day.
        </p>
      </div>

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Event Title */}
        <div>
          <FieldLabel htmlFor="event-title">Event Title</FieldLabel>
          <input
            id="event-title"
            type="text"
            value={eventTitle}
            placeholder="e.g. Smith-Jones Wedding Gala"
            onChange={(e) => setEventTitle(e.target.value)}
            style={INPUT_STYLE}
          />
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
            Note: If an event title is not provided, one will be automatically generated for you.
          </p>
        </div>

        {/* Dynamic formSchema fields (partner names etc.) */}
        {formSchema.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: formSchema.length >= 2 ? '1fr 1fr' : '1fr',
              gap: '16px',
            }}
          >
            {formSchema.map((fieldDef) => (
              <div key={fieldDef.field}>
                <FieldLabel htmlFor={`field-${fieldDef.field}`} required={fieldDef.required}>
                  {fieldDef.label}
                </FieldLabel>
                <input
                  id={`field-${fieldDef.field}`}
                  type={fieldDef.type === 'number' ? 'number' : 'text'}
                  value={metadata[fieldDef.field] ?? ''}
                  placeholder={fieldDef.placeholder ?? ''}
                  onChange={(e) => handleMetadataChange(fieldDef.field, e.target.value)}
                  style={fieldErrors[fieldDef.field] ? INPUT_ERROR_STYLE : INPUT_STYLE}
                  aria-invalid={!!fieldErrors[fieldDef.field]}
                />
                {fieldErrors[fieldDef.field] && (
                  <p style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: '4px' }} role="alert">
                    {fieldErrors[fieldDef.field]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Event Date + Guest Count */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <FieldLabel htmlFor="primary-date">Event Date</FieldLabel>
            <input
              id="primary-date"
              type="date"
              value={primaryDate}
              onChange={(e) => setPrimaryDate(e.target.value)}
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <FieldLabel htmlFor="guest-capacity">Guest Count</FieldLabel>
            <input
              id="guest-capacity"
              type="number"
              min={1}
              value={guestCapacity}
              placeholder="Estimated guests"
              onChange={(e) => { setGuestCapacity(e.target.value); if (guestCapacityError) setGuestCapacityError('') }}
              style={guestCapacityError ? INPUT_ERROR_STYLE : INPUT_STYLE}
              aria-invalid={!!guestCapacityError}
            />
            {guestCapacityError && (
              <p style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: '4px' }} role="alert">
                {guestCapacityError}
              </p>
            )}
          </div>
        </div>

        {/* Venue Location */}
        <div>
          <FieldLabel htmlFor="primary-venue">Venue Location</FieldLabel>
          <div style={{ position: 'relative' }}>
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
                pointerEvents: 'none',
                lineHeight: 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5C5.51 1.5 3.5 3.51 3.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6c0-2.49-2.01-4.5-4.5-4.5Zm0 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" fill="currentColor"/>
              </svg>
            </span>
            <input
              id="primary-venue"
              type="text"
              value={primaryVenue}
              placeholder="Search for a city or venue"
              onChange={(e) => setPrimaryVenue(e.target.value)}
              style={{ ...INPUT_STYLE, paddingLeft: '40px' }}
            />
          </div>
        </div>

        {/* Bottom note */}
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: '1.6' }}>
          Note: Only partner names are required to proceed. All other details can be configured later from your dashboard.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', paddingTop: '8px' }}>
          <button
            type="button"
            onClick={handleContinue}
            style={{
              padding: '18px 56px',
              background: 'var(--color-text-primary)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 600,
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontFamily: 'var(--font-manrope), sans-serif',
              transition: 'opacity 0.15s',
            }}
          >
            Continue to Details
            <span aria-hidden="true">→</span>
          </button>
          <button
            type="button"
            onClick={handleBack}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              padding: '4px 8px',
            }}
          >
            ← Back
          </button>
        </div>

      </div>
    </section>
  )
}
