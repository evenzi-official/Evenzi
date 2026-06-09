'use client'

import React, { useState } from 'react'
import { useWizard } from '@/lib/contexts/WizardContext'
import { validateDynamicFields } from '@/lib/validations/events'
import type { FormSchemaField } from '@/lib/types/events'

interface FieldErrors {
  [field: string]: string
}

export default function Step2BasicDetails(): React.JSX.Element | null {
  const { state, dispatch } = useWizard()
  if (!state.eventType) {
    dispatch({ type: 'GO_TO_STEP', payload: 1 })
    return null
  }
  const eventType = state.eventType
  const formSchema = eventType.formSchema

  const [metadata, setMetadata] = useState<Record<string, string>>(
    () => state.basicDetails.metadata ?? {}
  )
  const [primaryDate, setPrimaryDate] = useState<string>(
    state.basicDetails.primaryDate ?? ''
  )
  const [primaryVenue, setPrimaryVenue] = useState<string>(
    state.basicDetails.primaryVenue ?? ''
  )
  const [guestCapacity, setGuestCapacity] = useState<string>(
    state.basicDetails.guestCapacity != null ? String(state.basicDetails.guestCapacity) : ''
  )
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [guestCapacityError, setGuestCapacityError] = useState<string>('')

  function handleMetadataChange(field: string, value: string): void {
    setMetadata((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  function buildBasicDetails() {
    return {
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
        setGuestCapacityError('Guest capacity must be a positive whole number')
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

  return (
    <section className="clay-card cc-card" aria-labelledby="cc-step2-title">
      <header className="cc-card-head">
        <p className="cc-card-eyebrow">
          <span className="material-symbols-outlined icon-fill" aria-hidden="true">edit_note</span>
          The essentials
        </p>
        <h1 className="cc-card-title" id="cc-step2-title">
          Tell us about <em>your event</em>
        </h1>
        <p className="cc-card-lead">
          Start with the basics — we&apos;ll adapt the planning surface to match.
        </p>
      </header>

      <div className="cc-form-grid">
        {/* Dynamic schema fields — first one gets full-width treatment */}
        {formSchema.map((fieldDef: FormSchemaField, i: number) => (
          <div key={fieldDef.field} className={`form-group${i === 0 ? ' is-full' : ''}`}>
            <label className="form-label" htmlFor={`field-${fieldDef.field}`}>
              {fieldDef.label}{fieldDef.required ? ' *' : ''}
            </label>
            <input
              id={`field-${fieldDef.field}`}
              type={fieldDef.type === 'number' ? 'number' : 'text'}
              className="form-input"
              value={metadata[fieldDef.field] ?? ''}
              placeholder={fieldDef.placeholder ?? ''}
              maxLength={fieldDef.type !== 'number' ? 80 : undefined}
              autoComplete="off"
              aria-invalid={!!fieldErrors[fieldDef.field]}
              aria-describedby={fieldErrors[fieldDef.field] ? `err-${fieldDef.field}` : undefined}
              onChange={(e) => handleMetadataChange(fieldDef.field, e.target.value)}
            />
            {fieldErrors[fieldDef.field] && (
              <p className="form-error" id={`err-${fieldDef.field}`} role="alert">
                {fieldErrors[fieldDef.field]}
              </p>
            )}
          </div>
        ))}

        {/* Event date */}
        <div className="form-group">
          <label className="form-label" htmlFor="cc-eventDate">Event date</label>
          <input
            id="cc-eventDate"
            type="date"
            className="form-input"
            value={primaryDate}
            onChange={(e) => setPrimaryDate(e.target.value)}
          />
        </div>

        {/* Guest count */}
        <div className="form-group">
          <label className="form-label" htmlFor="cc-guestCount">Guest count</label>
          <input
            id="cc-guestCount"
            type="number"
            min={1}
            max={10000}
            inputMode="numeric"
            className="form-input"
            value={guestCapacity}
            placeholder="Estimated guests"
            autoComplete="off"
            aria-invalid={!!guestCapacityError}
            aria-describedby={guestCapacityError ? 'cc-guest-err' : undefined}
            onChange={(e) => {
              setGuestCapacity(e.target.value)
              if (guestCapacityError) setGuestCapacityError('')
            }}
          />
          {guestCapacityError && (
            <p className="form-error" id="cc-guest-err" role="alert">{guestCapacityError}</p>
          )}
        </div>

        {/* Venue — full width with place icon prefix */}
        <div className="form-group is-full">
          <label className="form-label" htmlFor="cc-venue">Venue location</label>
          <div className="form-input form-input-group">
            <span className="form-input-prefix cc-venue-prefix" aria-hidden="true">
              <span className="material-symbols-outlined">place</span>
            </span>
            <input
              id="cc-venue"
              type="text"
              className="form-input-field"
              value={primaryVenue}
              placeholder="Search for a city or venue"
              autoComplete="off"
              onChange={(e) => setPrimaryVenue(e.target.value)}
            />
          </div>
          <p className="cc-form-helper">
            Tip — city names work too; pick a specific venue later from your dashboard.
          </p>
        </div>
      </div>

      <div className="cc-actions">
        <button type="button" className="cc-back-btn" onClick={handleBack}>
          <span aria-hidden="true" className="material-symbols-outlined">arrow_back</span>
          Back
        </button>
        <button
          type="button"
          className="btn-pill btn-pill-primary btn-pill-lg"
          onClick={handleContinue}
        >
          <span>Continue</span>
          <span aria-hidden="true" className="material-symbols-outlined">arrow_forward</span>
          <span aria-hidden="true" className="btn-pill-spinner" />
        </button>
      </div>
    </section>
  )
}
