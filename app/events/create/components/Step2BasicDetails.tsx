'use client'

import React, { useRef, useState } from 'react'
import { useWizard } from '@/lib/contexts/WizardContext'
import { validateDynamicFields } from '@/lib/validations/events'
import type { FormSchemaField } from '@/lib/types/events'

interface FieldErrors {
  [field: string]: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

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

  // Cover image state
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    state.basicDetails.coverImageUrl ?? null
  )
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleMetadataChange(field: string, value: string): void {
    setMetadata((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Only JPEG, PNG, WebP, or GIF images are allowed')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('Image must be under 5 MB')
      return
    }

    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/events/cover', { method: 'POST', body: formData })
    if (!res.ok) {
      let msg = 'Upload failed — please try again'
      try {
        const body = await res.json() as { error?: string }
        if (body.error) msg = body.error
      } catch { /* use default */ }
      setUploadError(msg)
      setUploading(false)
      return
    }

    const { url } = await res.json() as { url: string }
    setCoverImageUrl(url)
    setUploading(false)
  }

  function handleRemoveCover(): void {
    setCoverImageUrl(null)
    setUploadError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function buildBasicDetails() {
    return {
      primaryDate: primaryDate.trim() || null,
      primaryVenue: primaryVenue.trim() || null,
      guestCapacity: guestCapacity.trim() !== '' ? parseInt(guestCapacity, 10) : null,
      metadata,
      coverImageUrl,
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

      {/* Cover image upload */}
      <div className="form-group is-full" style={{ marginBottom: '0.5rem' }}>
        <label className="form-label">Cover photo <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={(e) => { void handleImageSelect(e) }}
        />
        {coverImageUrl ? (
          <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', height: '180px', background: 'var(--surface-2, #f3f4f6)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImageUrl}
              alt="Event cover"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <button
              type="button"
              onClick={handleRemoveCover}
              aria-label="Remove cover photo"
              style={{
                position: 'absolute', top: '8px', right: '8px',
                background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
                width: '32px', height: '32px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', color: '#fff',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              width: '100%', height: '140px', border: '2px dashed var(--border, #d1d5db)',
              borderRadius: '12px', background: 'var(--surface-2, #f9fafb)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: '8px', cursor: uploading ? 'not-allowed' : 'pointer',
              color: 'var(--muted)', transition: 'border-color 0.15s',
            }}
          >
            {uploading ? (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', animation: 'spin 1s linear infinite' }}>progress_activity</span>
                <span style={{ fontSize: '13px' }}>Uploading…</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined icon-fill" style={{ fontSize: '32px' }}>add_photo_alternate</span>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Upload cover photo</span>
                <span style={{ fontSize: '11px' }}>JPEG · PNG · WebP · GIF · up to 5 MB</span>
              </>
            )}
          </button>
        )}
        {uploadError && (
          <p className="form-error" role="alert" style={{ marginTop: '6px' }}>{uploadError}</p>
        )}
      </div>

      <div className="cc-form-grid">
        {/* Dynamic schema fields — first one gets full-width treatment */}
        {formSchema.map((fieldDef: FormSchemaField, i: number) => (
          <div key={fieldDef.key} className={`form-group${i === 0 ? ' is-full' : ''}`}>
            <label className="form-label" htmlFor={`field-${fieldDef.key}`}>
              {fieldDef.label}{fieldDef.required ? ' *' : ''}
            </label>
            <input
              id={`field-${fieldDef.key}`}
              type={fieldDef.type === 'number' ? 'number' : 'text'}
              className="form-input"
              value={metadata[fieldDef.key] ?? ''}
              placeholder={fieldDef.placeholder ?? ''}
              maxLength={fieldDef.type !== 'number' ? 80 : undefined}
              autoComplete="off"
              aria-invalid={!!fieldErrors[fieldDef.key]}
              aria-describedby={fieldErrors[fieldDef.key] ? `err-${fieldDef.key}` : undefined}
              onChange={(e) => handleMetadataChange(fieldDef.key, e.target.value)}
            />
            {fieldErrors[fieldDef.key] && (
              <p className="form-error" id={`err-${fieldDef.key}`} role="alert">
                {fieldErrors[fieldDef.key]}
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
