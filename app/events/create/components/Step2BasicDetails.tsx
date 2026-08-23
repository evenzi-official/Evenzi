'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useWizard } from '@/lib/contexts/WizardContext'
import { validateDynamicFields, EVENT_DATE_MIN_ISO, eventDateMaxISO } from '@/lib/validations/events'
import type { FormSchemaField } from '@/lib/types/events'
import { DatePicker } from './DatePicker'

interface FieldErrors {
  [field: string]: string
}

interface NominatimResult {
  display_name: string
  address: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
    state?: string
    region?: string
    country?: string
  }
}

interface LocationSuggestion {
  label: string
  value: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
// Sane upper bound on guest count (M12) — mirrors createEventSchema.guestCapacity.
const GUEST_CAPACITY_MAX = 100000

export default function Step2BasicDetails(): React.JSX.Element | null {
  const { state, dispatch } = useWizard()
  const eventType = state.eventType
  const formSchema = eventType?.formSchema ?? []

  // No event type selected — bounce back to Step 1 (after hooks, to keep the
  // hook order stable per the Rules of Hooks).
  useEffect(() => {
    if (!eventType) dispatch({ type: 'GO_TO_STEP', payload: 1 })
  }, [eventType, dispatch])

  const [eventTitle, setEventTitle] = useState<string>(state.basicDetails.eventTitle ?? '')
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
  const [dateError, setDateError] = useState<string>('')

  // Location autocomplete state
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const venueContainerRef = useRef<HTMLDivElement>(null)

  // Cover image state
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    state.basicDetails.coverImageUrl ?? null
  )
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string>('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const dateMin = EVENT_DATE_MIN_ISO()
  const dateMax = eventDateMaxISO()

  const guestCapacityTrim = guestCapacity.trim()
  const guestCapacityOk =
    guestCapacityTrim === '' ||
    (() => {
      const parsed = parseInt(guestCapacityTrim, 10)
      return !isNaN(parsed) && parsed > 0 && Number.isInteger(parsed) && parsed <= GUEST_CAPACITY_MAX
    })()
  const dateTrim = primaryDate.trim()
  const dateOk = dateTrim === '' || (dateTrim >= dateMin && dateTrim <= dateMax)
  const canSubmit =
    validateDynamicFields(metadata, formSchema).length === 0 && guestCapacityOk && dateOk

  // Nominatim location autocomplete — debounced, 350ms
  useEffect(() => {
    const q = primaryVenue.trim()
    if (q.length < 2) {
      setLocationSuggestions([])
      setShowSuggestions(false)
      return
    }
    let cancelled = false
    const timer = setTimeout(() => {
      void (async () => {
        setLocationLoading(true)
        try {
          const params = new URLSearchParams({
            q,
            format: 'json',
            limit: '6',
            addressdetails: '1',
            'accept-language': 'en',
          })
          const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`)
          if (!res.ok || cancelled) return
          const data = await res.json() as NominatimResult[]
          if (cancelled) return
          const seen = new Set<string>()
          const suggestions: LocationSuggestion[] = []
          for (const r of data) {
            const a = r.address
            const parts = [
              a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? '',
              a.state ?? a.region ?? '',
              a.country ?? '',
            ].filter(Boolean)
            const label = parts.length > 0
              ? parts.join(', ')
              : r.display_name.split(',').slice(0, 3).map(s => s.trim()).join(', ')
            if (!seen.has(label)) { seen.add(label); suggestions.push({ label, value: label }) }
          }
          setLocationSuggestions(suggestions)
          setShowSuggestions(suggestions.length > 0)
          setActiveIdx(-1)
        } catch { /* silently fail — autocomplete is best-effort */ }
        finally { if (!cancelled) setLocationLoading(false) }
      })()
    }, 350)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [primaryVenue])

  // Close suggestions when clicking outside the venue wrapper
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (venueContainerRef.current && !venueContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
        setActiveIdx(-1)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // A witty, tasteful nudge that reacts to the typed guest count (M12). Returns
  // null below the playful threshold so the helper line stays quiet for normal
  // weddings.
  function guestVibe(raw: string): string | null {
    const n = parseInt(raw, 10)
    if (isNaN(n) || n <= 0) return null
    if (n > GUEST_CAPACITY_MAX) return `That’s a lot — we cap guest counts at ${GUEST_CAPACITY_MAX.toLocaleString('en-IN')}.`
    if (n > 20000) return 'Planning a stadium wedding? 😄'
    if (n > 2000) return 'Big celebration! 🎉'
    return null
  }
  const guestHelper = guestVibe(guestCapacity)

  function handleMetadataChange(field: string, value: string): void {
    setMetadata((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  async function uploadFile(file: File): Promise<void> {
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

    try {
      const res = await fetch('/api/events/cover', { method: 'POST', body: formData })
      if (!res.ok) {
        let msg = 'Upload failed — please try again'
        try {
          const body = await res.json() as { error?: string }
          if (body.error) msg = body.error
        } catch { /* use default */ }
        setUploadError(msg)
        return
      }
      const { url } = await res.json() as { url: string }
      setCoverImageUrl(url)
    } catch {
      setUploadError('Upload failed — please try again')
    } finally {
      setUploading(false)
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0]
    if (!file) return
    void uploadFile(file)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault()
    setDragOver(false)
    if (uploading) return
    const file = e.dataTransfer.files?.[0]
    if (file) void uploadFile(file)
  }

  function handleRemoveCover(): void {
    setCoverImageUrl(null)
    setUploadError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function buildBasicDetails(): typeof state.basicDetails {
    return {
      eventTitle: eventTitle.trim() || null,
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
      } else if (parsed > GUEST_CAPACITY_MAX) {
        setGuestCapacityError(`Guest count can’t exceed ${GUEST_CAPACITY_MAX.toLocaleString('en-IN')}`)
        valid = false
      } else {
        setGuestCapacityError('')
      }
    } else {
      setGuestCapacityError('')
    }
    if (primaryDate.trim() !== '') {
      if (primaryDate < dateMin) {
        setDateError('Event date can’t be in the past')
        valid = false
      } else if (primaryDate > dateMax) {
        setDateError('Event date must be within the next 5 years')
        valid = false
      } else {
        setDateError('')
      }
    } else {
      setDateError('')
    }
    return valid
  }

  function handleContinue(): void {
    if (!validate()) return
    dispatch({ type: 'SET_BASIC_DETAILS', payload: buildBasicDetails() })
    const nextStep = eventType?.hasSubEvents ? 3 : state.totalSteps
    dispatch({ type: 'GO_TO_STEP', payload: nextStep })
  }

  function handleBack(): void {
    dispatch({ type: 'SET_BASIC_DETAILS', payload: buildBasicDetails() })
    dispatch({ type: 'GO_TO_STEP', payload: 1 })
  }

  function selectSuggestion(s: LocationSuggestion): void {
    setPrimaryVenue(s.value)
    setLocationSuggestions([])
    setShowSuggestions(false)
    setActiveIdx(-1)
  }

  function handleVenueKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (!showSuggestions || locationSuggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, locationSuggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      selectSuggestion(locationSuggestions[activeIdx])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setActiveIdx(-1)
    }
  }

  if (!eventType) return null

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

      {/* Cover image upload — shell .dp-dropzone primitive (single image, M2) */}
      <div className="form-group is-full" style={{ marginBottom: '0.5rem' }}>
        <label className="form-label">Cover photo <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={handleImageSelect}
        />
        {coverImageUrl ? (
          <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', height: '180px', background: 'var(--line-soft)' }}>
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
          <div
            role="button"
            tabIndex={0}
            className={`dp-dropzone${dragOver ? ' is-dragover' : ''}`}
            aria-disabled={uploading}
            aria-label="Upload cover photo"
            onClick={() => { if (!uploading) fileInputRef.current?.click() }}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
                e.preventDefault()
                fileInputRef.current?.click()
              }
            }}
            onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <span className="dp-dropzone-icon" aria-hidden="true">
              <span className="material-symbols-outlined icon-fill">
                {uploading ? 'progress_activity' : 'add_photo_alternate'}
              </span>
            </span>
            <span className="dp-dropzone-title">
              {uploading ? 'Uploading…' : 'Upload cover photo'}
            </span>
            <span className="dp-dropzone-hint">JPEG · PNG · WebP · GIF · up to 5 MB</span>
          </div>
        )}
        {uploadError && (
          <p className="form-error" role="alert" style={{ marginTop: '6px' }}>{uploadError}</p>
        )}
      </div>

      <div className="cc-form-grid">
        {/* Event title (optional) — full width, derives name when blank (M3) */}
        <div className="form-group is-full">
          <label className="form-label" htmlFor="cc-title">
            Event title <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span>
          </label>
          <input
            id="cc-title"
            type="text"
            className="form-input"
            value={eventTitle}
            placeholder="e.g. Aaisha &amp; Taylan's Wedding"
            maxLength={80}
            autoComplete="off"
            onChange={(e) => setEventTitle(e.target.value)}
          />
        </div>

        {/* Dynamic schema fields (e.g. partner names) — design grouping, two-up */}
        <div className="cc-partners-group">
          {formSchema.map((fieldDef: FormSchemaField) => (
            <div key={fieldDef.key} className="form-group">
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
        </div>

        {/* Event date — dark branded calendar (M4) */}
        <div className="form-group">
          <span className="form-label" id="cc-eventDate-label">Event date</span>
          <DatePicker
            value={primaryDate || null}
            onChange={(iso) => { setPrimaryDate(iso); setDateError('') }}
            min={dateMin}
            max={dateMax}
            labelId="cc-eventDate-label"
          />
          {dateError && (
            <p className="form-error" role="alert" style={{ marginTop: '6px' }}>{dateError}</p>
          )}
        </div>

        {/* Guest count */}
        <div className="form-group">
          <label className="form-label" htmlFor="cc-guestCount">Guest count</label>
          <input
            id="cc-guestCount"
            type="number"
            min={1}
            max={GUEST_CAPACITY_MAX}
            inputMode="numeric"
            className="form-input"
            value={guestCapacity}
            placeholder="Estimated guests"
            autoComplete="off"
            aria-invalid={!!guestCapacityError}
            aria-describedby={
              guestCapacityError ? 'cc-guest-err' : guestHelper ? 'cc-guest-help' : undefined
            }
            onChange={(e) => {
              // Clamp absurd values so they can never be stored (M12).
              let next = e.target.value
              const parsed = parseInt(next, 10)
              if (!isNaN(parsed) && parsed > GUEST_CAPACITY_MAX) {
                next = String(GUEST_CAPACITY_MAX)
              }
              setGuestCapacity(next)
              if (guestCapacityError) setGuestCapacityError('')
            }}
          />
          {guestCapacityError ? (
            <p className="form-error" id="cc-guest-err" role="alert">{guestCapacityError}</p>
          ) : guestHelper ? (
            <p className="cc-form-helper" id="cc-guest-help" aria-live="polite">{guestHelper}</p>
          ) : null}
        </div>

        {/* Venue — full width with place icon prefix + location autocomplete */}
        <div className="form-group is-full">
          <label className="form-label" htmlFor="cc-venue">Venue location</label>
          <div className="cc-venue-wrap" ref={venueContainerRef}>
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
                role="combobox"
                aria-expanded={showSuggestions}
                aria-autocomplete="list"
                aria-controls="cc-venue-listbox"
                aria-activedescendant={activeIdx >= 0 ? `cc-venue-opt-${activeIdx}` : undefined}
                onChange={(e) => setPrimaryVenue(e.target.value)}
                onKeyDown={handleVenueKeyDown}
                onFocus={() => { if (locationSuggestions.length > 0) setShowSuggestions(true) }}
              />
              {locationLoading && (
                <span className="form-input-suffix" aria-hidden="true">
                  <span className="material-symbols-outlined cc-venue-loading-icon">progress_activity</span>
                </span>
              )}
            </div>
            {showSuggestions && locationSuggestions.length > 0 && (
              <ul
                id="cc-venue-listbox"
                className="cc-venue-listbox"
                role="listbox"
                aria-label="Location suggestions"
              >
                {locationSuggestions.map((s, i) => (
                  <li
                    key={s.label}
                    id={`cc-venue-opt-${i}`}
                    className={`cc-venue-option${i === activeIdx ? ' is-active' : ''}`}
                    role="option"
                    aria-selected={i === activeIdx}
                    onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s) }}
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">place</span>
                    {s.label}
                  </li>
                ))}
              </ul>
            )}
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
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
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
