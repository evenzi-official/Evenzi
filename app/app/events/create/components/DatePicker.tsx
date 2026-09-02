'use client'

import React, { useEffect, useMemo, useState } from 'react'

// Dark, branded calendar replacing the native date popover (M4). Reuses the
// shell `.cal-*` primitives (designs/shared/shell.css). The hidden value is an
// ISO date string (YYYY-MM-DD). Out-of-range days are disabled.

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fromISO(iso: string | null): Date | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map((v) => parseInt(v, 10))
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

interface DatePickerProps {
  value: string | null
  onChange: (iso: string) => void
  /** ISO min (inclusive). Defaults to today. */
  min?: string
  /** ISO max (inclusive). */
  max?: string
  placeholder?: string
  /** Accessible label id for the trigger. */
  labelId?: string
  triggerClassName?: string
}

export function DatePicker(props: DatePickerProps): React.JSX.Element {
  const {
    value,
    placeholder = 'Pick a date',
    labelId,
    triggerClassName,
  } = props
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const selected = useMemo(() => fromISO(value), [value])
  const triggerLabel = selected
    ? selected.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : placeholder

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
        <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
      </button>

      <div
        className={`cal-scrim${open ? ' is-open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
      >
        {/* Remounted fresh each open → internal state inits from props, no reset effect. */}
        {open && <CalendarPopover {...props} onClose={() => setOpen(false)} />}
      </div>
    </>
  )
}

interface CalendarPopoverProps extends DatePickerProps {
  onClose: () => void
}

function CalendarPopover({ value, onChange, min, max, onClose }: CalendarPopoverProps): React.JSX.Element {
  const [monthView, setMonthView] = useState(false)

  const selected = useMemo(() => fromISO(value), [value])
  const minDate = useMemo(() => fromISO(min ?? toISO(new Date())), [min])
  const maxDate = useMemo(() => (max ? fromISO(max) : null), [max])

  const [cursor, setCursor] = useState<Date>(() => selected ?? minDate ?? startOfDay(new Date()))

  // Esc to close
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function isDisabled(d: Date): boolean {
    const day = startOfDay(d)
    if (minDate && day < startOfDay(minDate)) return true
    if (maxDate && day > startOfDay(maxDate)) return true
    return false
  }

  function selectDay(d: Date): void {
    if (isDisabled(d)) return
    onChange(toISO(d))
    setMonthView(false)
    onClose()
  }

  // Build calendar grid (6 weeks) for the cursor month
  const grid: Date[] = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const startOffset = first.getDay()
    const gridStart = new Date(first)
    gridStart.setDate(first.getDate() - startOffset)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + i)
      return d
    })
  }, [cursor])

  const today = startOfDay(new Date())
  const monthMinAllowed = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), 1) : null
  const monthMaxAllowed = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), 1) : null
  const prevMonth = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)
  const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)

  // Year bounds for the month-selection view (M11). Clamp to the allowed range.
  const minYear = minDate ? minDate.getFullYear() : null
  const maxYear = maxDate ? maxDate.getFullYear() : null
  const prevYear = new Date(cursor.getFullYear() - 1, cursor.getMonth(), 1)
  const nextYear = new Date(cursor.getFullYear() + 1, cursor.getMonth(), 1)

  // In month view the arrows step the year; in day view they step the month.
  const canPrev = monthView
    ? (minYear == null || cursor.getFullYear() - 1 >= minYear)
    : (!monthMinAllowed || prevMonth >= monthMinAllowed)
  const canNext = monthView
    ? (maxYear == null || cursor.getFullYear() + 1 <= maxYear)
    : (!monthMaxAllowed || nextMonth <= monthMaxAllowed)

  function goPrev(): void {
    setCursor(monthView ? prevYear : prevMonth)
  }
  function goNext(): void {
    setCursor(monthView ? nextYear : nextMonth)
  }

  return (
          <div className="cal-pop" role="dialog" aria-modal="true" aria-label="Choose a date" style={{ position: 'static' }}>
            <div className="cal-head">
              <button type="button" className="cal-nav" aria-label={monthView ? 'Previous year' : 'Previous month'} disabled={!canPrev}
                onClick={goPrev}>
                <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
              </button>
              <button
                type="button"
                className="cal-title-btn"
                aria-expanded={monthView}
                onClick={() => setMonthView((v) => !v)}
              >
                <span className="cal-title">{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</span>
                <span className="material-symbols-outlined cal-title-caret" aria-hidden="true">expand_more</span>
              </button>
              <button type="button" className="cal-nav" aria-label={monthView ? 'Next year' : 'Next month'} disabled={!canNext}
                onClick={goNext}>
                <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
              </button>
            </div>

            {monthView ? (
              <div className="cal-grid cal-grid--months">
                {MONTHS_SHORT.map((m, i) => {
                  const monthStart = new Date(cursor.getFullYear(), i, 1)
                  const monthEnd = new Date(cursor.getFullYear(), i + 1, 0)
                  const disabled =
                    (monthMaxAllowed && monthStart > monthMaxAllowed) ||
                    (monthMinAllowed && monthEnd < minDate!)
                  const isCurrent = i === today.getMonth() && cursor.getFullYear() === today.getFullYear()
                  const isSel = selected != null && i === selected.getMonth() && cursor.getFullYear() === selected.getFullYear()
                  return (
                    <button
                      key={m}
                      type="button"
                      className={`cal-month${isCurrent ? ' is-current' : ''}${isSel ? ' is-sel' : ''}`}
                      disabled={!!disabled}
                      onClick={() => { setCursor(new Date(cursor.getFullYear(), i, 1)); setMonthView(false) }}
                    >
                      {m}
                    </button>
                  )
                })}
              </div>
            ) : (
              <>
                <div className="cal-dow-row" aria-hidden="true">
                  {DOW.map((d, i) => <div key={i} className="cal-dow">{d}</div>)}
                </div>
                <div className="cal-grid" role="grid">
                  {grid.map((d, i) => {
                    const outside = d.getMonth() !== cursor.getMonth()
                    const disabled = isDisabled(d)
                    const isToday = startOfDay(d).getTime() === today.getTime()
                    const isSelected = selected != null && startOfDay(d).getTime() === startOfDay(selected).getTime()
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`cal-day${outside ? ' is-outside' : ''}${isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''}`}
                        disabled={disabled}
                        aria-label={d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        aria-pressed={isSelected}
                        onClick={() => selectDay(d)}
                      >
                        {d.getDate()}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
  )
}
