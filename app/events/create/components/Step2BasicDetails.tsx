'use client'

import React, { useState } from 'react'
import { useWizard } from '@/lib/contexts/WizardContext'
import { validateDynamicFields } from '@/lib/validations/events'
import type { FormSchemaField } from '@/lib/types/events'

// --- Types ---

interface FieldErrors {
  [field: string]: string
}

// --- Sub-components ---

function FormField({
  fieldDef,
  value,
  error,
  onChange,
}: {
  fieldDef: FormSchemaField
  value: string
  error?: string
  onChange: (field: string, value: string) => void
}): React.JSX.Element {
  const inputId = `field-${fieldDef.field}`

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {fieldDef.label}
        {fieldDef.required && (
          <span className="ml-0.5" style={{ color: 'var(--color-error)' }}>
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        type={fieldDef.type === 'number' ? 'number' : fieldDef.type === 'date' ? 'date' : 'text'}
        value={value}
        placeholder={fieldDef.placeholder ?? ''}
        onChange={(e) => onChange(fieldDef.field, e.target.value)}
        className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:ring-2"
        style={{
          background: 'var(--color-bg-primary)',
          borderColor: error ? 'var(--color-error)' : 'var(--color-border)',
          color: 'var(--color-text-primary)',
        }}
        aria-describedby={error ? `${inputId}-error` : undefined}
        aria-invalid={!!error}
      />
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-xs"
          style={{ color: 'var(--color-error)' }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}

// --- Main Component ---

export default function Step2BasicDetails(): React.JSX.Element {
  const { state, dispatch } = useWizard()
  const eventType = state.eventType!

  // Determine if Wedding-style 2-column layout applies
  const formSchema = eventType.formSchema
  const isTwoColumn = formSchema.length === 2

  // Local state — initialize from wizard context
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
    state.basicDetails.guestCapacity != null
      ? String(state.basicDetails.guestCapacity)
      : ''
  )
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [guestCapacityError, setGuestCapacityError] = useState<string>('')

  // --- Helpers ---

  function handleMetadataChange(field: string, value: string): void {
    setMetadata((prev) => ({ ...prev, [field]: value }))
    // Clear field error on change
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
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

  function saveToContext(): void {
    dispatch({ type: 'SET_BASIC_DETAILS', payload: buildBasicDetails() })
  }

  // --- Validation ---

  function validate(): boolean {
    let valid = true

    // Validate required dynamic fields
    const dynamicErrors = validateDynamicFields(metadata, formSchema)
    if (dynamicErrors.length > 0) {
      const errorMap: FieldErrors = {}
      for (const err of dynamicErrors) {
        errorMap[err.field] = err.message
      }
      setFieldErrors(errorMap)
      valid = false
    } else {
      setFieldErrors({})
    }

    // Validate guest capacity — must be positive integer if provided
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

  // --- Navigation ---

  function handleContinue(): void {
    if (!validate()) return
    saveToContext()
    const nextStep = eventType.hasSubEvents ? 3 : state.totalSteps
    dispatch({ type: 'GO_TO_STEP', payload: nextStep })
  }

  function handleBack(): void {
    saveToContext()
    dispatch({ type: 'GO_TO_STEP', payload: 1 })
  }

  // --- Render ---

  return (
    <div
      className="w-full max-w-2xl mx-auto rounded-2xl p-8"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <span
          className="flex items-center justify-center w-10 h-10 rounded-full text-lg"
          style={{
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
          }}
          aria-hidden="true"
        >
          ⚙️
        </span>
        <div>
          <h2
            className="text-xl font-semibold leading-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Basic Details
          </h2>
          <p
            className="text-sm mt-0.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Tell us a bit about your {eventType.name.toLowerCase()}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Dynamic fields from form_schema */}
        {formSchema.length > 0 && (
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Event Information
            </p>
            <div
              className={
                isTwoColumn
                  ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
                  : 'flex flex-col gap-4'
              }
            >
              {formSchema.map((fieldDef) => (
                <FormField
                  key={fieldDef.field}
                  fieldDef={fieldDef}
                  value={metadata[fieldDef.field] ?? ''}
                  error={fieldErrors[fieldDef.field]}
                  onChange={handleMetadataChange}
                />
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div
          className="border-t"
          style={{ borderColor: 'var(--color-border)' }}
        />

        {/* Common optional fields */}
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Optional Details
          </p>
          <div className="flex flex-col gap-4">
            {/* Primary Event Date */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="primary-date"
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Primary Event Date
              </label>
              <input
                id="primary-date"
                type="date"
                value={primaryDate}
                onChange={(e) => setPrimaryDate(e.target.value)}
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:ring-2"
                style={{
                  background: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            {/* Primary Venue / City */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="primary-venue"
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Primary Venue / City
              </label>
              <input
                id="primary-venue"
                type="text"
                value={primaryVenue}
                placeholder="e.g. The Grand Ballroom, Mumbai"
                onChange={(e) => setPrimaryVenue(e.target.value)}
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:ring-2"
                style={{
                  background: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            {/* Guest Capacity */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="guest-capacity"
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Guest Capacity
              </label>
              <input
                id="guest-capacity"
                type="number"
                min={1}
                value={guestCapacity}
                placeholder="e.g. 150"
                onChange={(e) => {
                  setGuestCapacity(e.target.value)
                  if (guestCapacityError) setGuestCapacityError('')
                }}
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:ring-2"
                style={{
                  background: 'var(--color-bg-primary)',
                  borderColor: guestCapacityError
                    ? 'var(--color-error)'
                    : 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
                aria-describedby={
                  guestCapacityError ? 'guest-capacity-error' : undefined
                }
                aria-invalid={!!guestCapacityError}
              />
              {guestCapacityError && (
                <p
                  id="guest-capacity-error"
                  className="text-xs"
                  style={{ color: 'var(--color-error)' }}
                  role="alert"
                >
                  {guestCapacityError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-xl py-3.5 text-sm font-semibold transition-opacity hover:opacity-90 active:opacity-80"
            style={{
              background: 'var(--color-text-primary)',
              color: 'var(--color-bg-primary)',
            }}
          >
            Continue to Next Step
          </button>

          <button
            type="button"
            onClick={handleBack}
            className="w-full py-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  )
}
