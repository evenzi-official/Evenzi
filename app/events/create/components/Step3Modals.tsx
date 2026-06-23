'use client'

import React, { useEffect, useRef, useState } from 'react'
import { EVENT_DATE_MIN_ISO, eventDateMaxISO } from '@/lib/validations/events'
import { DatePicker } from './DatePicker'
import { TimePicker } from './TimePicker'

// Esc-to-close + simple focus return, shared by all three Step-3 modals (M5).
function useModalDismiss(open: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
}

// ── Set date & time ────────────────────────────────────────────────────────
interface TimeModalValue {
  eventDate: string | null
  startTime: string | null
  endTime: string | null
}

interface TimeModalProps {
  open: boolean
  forLabel: string
  initial: TimeModalValue
  onSave: (value: TimeModalValue) => void
  onClose: () => void
}

export function SetTimeModal({ open, forLabel, initial, onSave, onClose }: TimeModalProps): React.JSX.Element | null {
  useModalDismiss(open, onClose)
  if (!open) return null
  // Remounted via `key` by the parent when (re)opened, so state inits from props.
  return (
    <SetTimeModalBody forLabel={forLabel} initial={initial} onSave={onSave} onClose={onClose} />
  )
}

function SetTimeModalBody({ forLabel, initial, onSave, onClose }: Omit<TimeModalProps, 'open'>): React.JSX.Element {
  const [eventDate, setEventDate] = useState<string | null>(initial.eventDate)
  const [startTime, setStartTime] = useState<string | null>(initial.startTime)
  const [endTime, setEndTime] = useState<string | null>(initial.endTime)
  const [err, setErr] = useState<string>('')

  function handleSave(): void {
    if (endTime && startTime && endTime <= startTime) {
      setErr('End time must be after the start time')
      return
    }
    onSave({ eventDate, startTime, endTime })
    onClose()
  }

  return (
    <div className="modal-scrim is-open" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card lg-glass-card" role="dialog" aria-modal="true" aria-labelledby="cc-modal-time-title">
        <h2 className="modal-title" id="cc-modal-time-title">Set date &amp; time</h2>
        <div className="modal-body">
          <p className="cc-modal-sub">{forLabel}</p>
          <div className="cc-modal-field">
            <span className="form-label" id="cc-time-date-label">Date</span>
            <DatePicker
              value={eventDate}
              onChange={(iso) => { setEventDate(iso); setErr('') }}
              min={EVENT_DATE_MIN_ISO()}
              max={eventDateMaxISO()}
              labelId="cc-time-date-label"
            />
          </div>
          <div className="cc-modal-field">
            <span className="form-label" id="cc-time-start-label">Start time</span>
            <TimePicker value={startTime} onChange={(v) => { setStartTime(v); setErr('') }} labelId="cc-time-start-label" />
          </div>
          <div className="cc-modal-field">
            <span className="form-label" id="cc-time-end-label">End time <span className="cc-modal-optional">(optional)</span></span>
            <TimePicker value={endTime} onChange={(v) => { setEndTime(v); setErr('') }} labelId="cc-time-end-label" />
          </div>
          {err && (
            <p className="form-error" role="alert">
              <span className="material-symbols-outlined" aria-hidden="true">error</span>
              <span>{err}</span>
            </p>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-pill btn-pill-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-pill btn-pill-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ── Set venue ──────────────────────────────────────────────────────────────
interface VenueModalValue {
  venue: string | null
  venueAddress: string | null
}

interface VenueModalProps {
  open: boolean
  forLabel: string
  initial: VenueModalValue
  onSave: (value: VenueModalValue) => void
  onClose: () => void
}

export function SetVenueModal({ open, forLabel, initial, onSave, onClose }: VenueModalProps): React.JSX.Element | null {
  useModalDismiss(open, onClose)
  if (!open) return null
  return (
    <SetVenueModalBody forLabel={forLabel} initial={initial} onSave={onSave} onClose={onClose} />
  )
}

function SetVenueModalBody({ forLabel, initial, onSave, onClose }: Omit<VenueModalProps, 'open'>): React.JSX.Element {
  const [venue, setVenue] = useState<string>(initial.venue ?? '')
  const [address, setAddress] = useState<string>(initial.venueAddress ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSave(): void {
    onSave({ venue: venue.trim() || null, venueAddress: address.trim() || null })
    onClose()
  }

  return (
    <div className="modal-scrim is-open" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card lg-glass-card" role="dialog" aria-modal="true" aria-labelledby="cc-modal-venue-title">
        <h2 className="modal-title" id="cc-modal-venue-title">Set venue</h2>
        <div className="modal-body">
          <p className="cc-modal-sub">{forLabel}</p>
          <div className="cc-modal-field">
            <label className="form-label" htmlFor="cc-venue-name">Venue name</label>
            <input
              id="cc-venue-name"
              ref={inputRef}
              className="form-input"
              type="text"
              value={venue}
              placeholder="e.g. The Grand Pavilion"
              maxLength={120}
              autoComplete="off"
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>
          <div className="cc-modal-field">
            <label className="form-label" htmlFor="cc-venue-address">Address <span className="cc-modal-optional">(optional)</span></label>
            <textarea
              id="cc-venue-address"
              className="form-textarea"
              rows={3}
              value={address}
              placeholder="Street, area, city"
              maxLength={300}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-pill btn-pill-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-pill btn-pill-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ── Add a custom ceremony ──────────────────────────────────────────────────
interface CustomModalProps {
  open: boolean
  onSave: (value: { name: string; desc: string | null }) => void
  onClose: () => void
}

export function AddCustomModal({ open, onSave, onClose }: CustomModalProps): React.JSX.Element | null {
  useModalDismiss(open, onClose)
  if (!open) return null
  return <AddCustomModalBody onSave={onSave} onClose={onClose} />
}

function AddCustomModalBody({ onSave, onClose }: Omit<CustomModalProps, 'open'>): React.JSX.Element {
  const [name, setName] = useState<string>('')
  const [desc, setDesc] = useState<string>('')
  const [err, setErr] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSave(): void {
    const trimmed = name.trim()
    if (!trimmed) {
      setErr('Please enter a ceremony name')
      return
    }
    onSave({ name: trimmed, desc: desc.trim() || null })
    onClose()
  }

  return (
    <div className="modal-scrim is-open" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card lg-glass-card" role="dialog" aria-modal="true" aria-labelledby="cc-modal-custom-title">
        <h2 className="modal-title" id="cc-modal-custom-title">Add a custom ceremony</h2>
        <div className="modal-body">
          <div className="cc-modal-field">
            <label className="form-label" htmlFor="cc-custom-name">Ceremony name</label>
            <input
              id="cc-custom-name"
              ref={inputRef}
              className="form-input"
              type="text"
              value={name}
              placeholder="e.g. Tilak, Roka, Vidaai"
              maxLength={80}
              autoComplete="off"
              aria-invalid={!!err}
              onChange={(e) => { setName(e.target.value); if (err) setErr('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
            />
            {err && <p className="form-error" role="alert">{err}</p>}
          </div>
          <div className="cc-modal-field">
            <label className="form-label" htmlFor="cc-custom-desc">Short description <span className="cc-modal-optional">(optional)</span></label>
            <input
              id="cc-custom-desc"
              className="form-input"
              type="text"
              value={desc}
              placeholder="One line about this moment"
              maxLength={120}
              autoComplete="off"
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-pill btn-pill-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-pill btn-pill-primary" onClick={handleSave}>Add ceremony</button>
        </div>
      </div>
    </div>
  )
}
