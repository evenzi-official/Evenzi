'use client'

import React, { useEffect, useRef, useState } from 'react'

// Dark wheel time picker (M5) reusing the shell `.tp-*` primitives
// (designs/shared/shell.css). Value is a 24h "HH:MM" string; the readout shows
// 12h with AM/PM.

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1) // 1..12
const MINUTES = Array.from({ length: 60 }, (_, i) => i) // 0..59

interface Parts {
  hour12: number
  minute: number
  ampm: 'AM' | 'PM'
}

function parse24(value: string | null): Parts {
  if (value) {
    const [hStr, mStr] = value.split(':')
    const h = parseInt(hStr, 10)
    const m = parseInt(mStr, 10)
    if (!isNaN(h) && !isNaN(m)) {
      const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM'
      const hour12 = h % 12 === 0 ? 12 : h % 12
      return { hour12, minute: m, ampm }
    }
  }
  return { hour12: 10, minute: 0, ampm: 'AM' }
}

function to24(p: Parts): string {
  let h = p.hour12 % 12
  if (p.ampm === 'PM') h += 12
  return `${String(h).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`
}

function readout(p: Parts): string {
  return `${p.hour12}:${String(p.minute).padStart(2, '0')} ${p.ampm}`
}

interface TimePickerProps {
  value: string | null
  onChange: (value24: string) => void
  placeholder?: string
  labelId?: string
  triggerClassName?: string
  /** 24h "HH:MM" lower bound (exclusive) — only times strictly after this are offered (M15). */
  minTime?: string | null
}

export function TimePicker({
  value,
  onChange,
  placeholder = 'Pick a time',
  labelId,
  triggerClassName,
  minTime,
}: TimePickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const triggerLabel = value ? readout(parse24(value)) : placeholder

  return (
    <>
      <button
        type="button"
        className={triggerClassName ?? 'form-input form-input-trigger'}
        aria-labelledby={labelId}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className="form-input-trigger-value">{triggerLabel}</span>
        <span className="material-symbols-outlined" aria-hidden="true">schedule</span>
      </button>

      <div
        className={`tp-scrim${open ? ' is-open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
      >
        {/* Remounted fresh each open → draft inits from props, no reset effect. */}
        {open && (
          <TimeWheel value={value} onChange={onChange} minTime={minTime ?? null} onClose={() => setOpen(false)} />
        )}
      </div>
    </>
  )
}

interface TimeWheelProps {
  value: string | null
  onChange: (value24: string) => void
  minTime: string | null
  onClose: () => void
}

// Build a 24h "HH:MM" string from explicit parts (mirrors to24, but lets us
// probe hypothetical combinations for the min-time guard, M15).
function partsTo24(hour12: number, minute: number, ampm: 'AM' | 'PM'): string {
  let h = hour12 % 12
  if (ampm === 'PM') h += 12
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

// First valid (> minTime) time, or null if minTime is the last minute of the day.
function firstAfter(minTime: string): string | null {
  const [hStr, mStr] = minTime.split(':')
  const total = parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + 1
  if (total > 23 * 60 + 59) return null
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function TimeWheel({ value, onChange, minTime, onClose }: TimeWheelProps): React.JSX.Element {
  const [draft, setDraft] = useState<Parts>(() => {
    const initial = parse24(value)
    // If the initial draft isn't strictly after minTime, snap to the first valid time.
    if (minTime && partsTo24(initial.hour12, initial.minute, initial.ampm) <= minTime) {
      const snapped = firstAfter(minTime)
      if (snapped) return parse24(snapped)
    }
    return initial
  })
  const hourRef = useRef<HTMLButtonElement>(null)
  const minRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Scroll selected options into view on mount.
    hourRef.current?.scrollIntoView({ block: 'center' })
    minRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSave(): void {
    onChange(to24(draft))
    onClose()
  }

  // M15 — guard each column against minTime. An option is disabled only when no
  // combination of the *other* two parts can clear minTime (so the wheel never
  // dead-ends). Picking a still-valid-elsewhere option snaps the rest forward.
  function isAfterMin(p: Parts): boolean {
    return !minTime || partsTo24(p.hour12, p.minute, p.ampm) > minTime
  }
  function hourEnabled(h: number): boolean {
    if (!minTime) return true
    return MINUTES.some((m) => isAfterMin({ hour12: h, minute: m, ampm: draft.ampm }))
  }
  function minuteEnabled(m: number): boolean {
    if (!minTime) return true
    return isAfterMin({ hour12: draft.hour12, minute: m, ampm: draft.ampm })
  }
  function ampmEnabled(ap: 'AM' | 'PM'): boolean {
    if (!minTime) return true
    return HOURS_12.some((h) => MINUTES.some((m) => isAfterMin({ hour12: h, minute: m, ampm: ap })))
  }
  // After changing one part, nudge the others forward until the time clears minTime.
  function settle(p: Parts): Parts {
    if (isAfterMin(p)) return p
    const snapped = firstAfter(minTime!)
    return snapped ? parse24(snapped) : p
  }

  return (
          <div className="tp-pop" role="dialog" aria-modal="true" aria-label="Choose a time" style={{ position: 'static' }}>
            <p className="tp-title">
              <span>Set time</span>
              <span className="tp-readout" aria-live="polite">{readout(draft)}</span>
            </p>
            <div className="tp-cols">
              <div className="tp-col">
                <span className="tp-col-cap">Hour</span>
                <div className="tp-scroll" role="listbox" aria-label="Hour">
                  {HOURS_12.map((h) => {
                    const sel = h === draft.hour12
                    const disabled = !hourEnabled(h)
                    return (
                      <button
                        key={h}
                        ref={sel ? hourRef : undefined}
                        type="button"
                        role="option"
                        aria-selected={sel}
                        disabled={disabled}
                        className={`tp-opt${sel ? ' is-sel' : ''}`}
                        onClick={() => setDraft((d) => settle({ ...d, hour12: h }))}
                      >
                        {h}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="tp-col">
                <span className="tp-col-cap">Min</span>
                <div className="tp-scroll" role="listbox" aria-label="Minute">
                  {MINUTES.map((m) => {
                    const sel = m === draft.minute
                    const disabled = !minuteEnabled(m)
                    return (
                      <button
                        key={m}
                        ref={sel ? minRef : undefined}
                        type="button"
                        role="option"
                        aria-selected={sel}
                        disabled={disabled}
                        className={`tp-opt${sel ? ' is-sel' : ''}`}
                        onClick={() => setDraft((d) => settle({ ...d, minute: m }))}
                      >
                        {String(m).padStart(2, '0')}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="tp-ampm">
                <span className="tp-ampm-cap">AM·PM</span>
                {(['AM', 'PM'] as const).map((ap) => (
                  <button
                    key={ap}
                    type="button"
                    disabled={!ampmEnabled(ap)}
                    className={`tp-ampm-btn${draft.ampm === ap ? ' is-sel' : ''}`}
                    aria-pressed={draft.ampm === ap}
                    onClick={() => setDraft((d) => settle({ ...d, ampm: ap }))}
                  >
                    {ap}
                  </button>
                ))}
              </div>
            </div>
            <div className="tp-actions">
              <button type="button" className="btn-pill btn-pill-secondary" onClick={onClose}>
                <span>Cancel</span>
              </button>
              <button type="button" className="btn-pill btn-pill-primary" onClick={handleSave}>
                <span>Set</span>
              </button>
            </div>
          </div>
  )
}
