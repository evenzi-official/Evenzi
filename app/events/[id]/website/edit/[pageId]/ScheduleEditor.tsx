'use client'
import React, { useState } from 'react'
import Link from 'next/link'

type SubEvent = {
  id: string
  custom_name: string | null
  event_date: string | null
  start_time: string | null
  venue: string | null
  show_on_website: boolean
}

export default function ScheduleEditor({ eventId, subEvents }: { eventId: string; subEvents: SubEvent[] }) {
  const [items, setItems] = useState(subEvents)
  const [pending, setPending] = useState<string | null>(null)

  async function toggle(subId: string, current: boolean) {
    if (pending) return
    const newVal = !current
    setPending(subId)
    setItems(prev => prev.map(s => s.id === subId ? { ...s, show_on_website: newVal } : s))
    try {
      const res = await fetch(`/api/events/${eventId}/sub-events/${subId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_on_website: newVal }),
      })
      if (!res.ok) {
        setItems(prev => prev.map(s => s.id === subId ? { ...s, show_on_website: current } : s))
      }
    } catch {
      setItems(prev => prev.map(s => s.id === subId ? { ...s, show_on_website: current } : s))
    } finally {
      setPending(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="clay-card p-8 text-center space-y-3">
        <span className="material-symbols-outlined text-4xl text-muted" aria-hidden="true">calendar_today</span>
        <p className="font-display font-bold text-sm text-ink">No sub-events yet</p>
        <p className="text-xs text-muted">Add ceremonies, receptions and other events from the Event Hub.</p>
        <Link href={`/events/${eventId}`} className="btn-pill btn-pill-secondary inline-flex mt-1">
          Go to Event Hub
        </Link>
      </div>
    )
  }

  const visibleCount = items.filter(s => s.show_on_website).length

  return (
    <div className="clay-card divide-y divide-line">
      <div className="flex items-center justify-between p-5">
        <h2 className="font-display font-bold text-base text-ink">Sub-events</h2>
        <span className="text-xs text-muted">{visibleCount} of {items.length} showing on website</span>
      </div>
      <ul role="list" className="divide-y divide-line">
        {items.map((s) => (
          <li key={s.id} className="flex items-center gap-4 p-5">
            <div className="w-9 h-9 rounded-2xl bg-brand-tint text-brand flex items-center justify-center shrink-0" aria-hidden="true">
              <span className="material-symbols-outlined icon-fill">calendar_today</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-sm text-ink truncate">{s.custom_name ?? 'Unnamed event'}</p>
              <p className="text-xs text-muted">
                {s.event_date
                  ? new Date(s.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'No date'}
                {s.venue ? ` · ${s.venue}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted">{s.show_on_website ? 'Visible' : 'Hidden'}</span>
              <button
                type="button"
                role="switch"
                aria-checked={s.show_on_website}
                aria-label={`${s.show_on_website ? 'Hide' : 'Show'} ${s.custom_name ?? 'this event'} on website`}
                onClick={() => toggle(s.id, s.show_on_website)}
                disabled={pending === s.id}
                className="toggle-switch"
              >
                <span className="toggle-switch-thumb" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
