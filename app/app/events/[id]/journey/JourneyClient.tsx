'use client'

import { useMemo, useState } from 'react'
import { DatePicker } from '@/app/app/events/create/components/DatePicker'
import { TimePicker } from '@/app/app/events/create/components/TimePicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { Portal } from '@/components/ui/Portal'
import { useBusy } from '@/components/ui/BusyProvider'
import { eventDateMaxISO } from '@/lib/validations/events'
import {
  countHeldAndUpcoming,
  findNextUpId,
  formatSubEventMeta,
  journeyBadgeFor,
  resolveSubEventIcon,
  sortByDisplayOrder,
  subEventTitle,
  type JourneyBadge,
  type RoadmapSortable,
} from '@/lib/events/subEventRoadmap'

export interface CatalogType {
  id: string
  name: string
  icon_name: string | null
}

export interface JourneySubEvent {
  id: string
  custom_name: string | null
  event_sub_type_id: string | null
  event_date: string | null
  start_time: string | null
  venue: string | null
  show_on_website: boolean
  display_order: number | null
  status: string | null
  type_name: string | null
  icon_name: string | null
}

interface FormState {
  custom_name: string
  event_sub_type_id: string
  event_date: string | null
  start_time: string | null
  venue: string
  show_on_website: boolean
}

const EMPTY_FORM: FormState = {
  custom_name: '',
  event_sub_type_id: '',
  event_date: null,
  start_time: null,
  venue: '',
  show_on_website: true,
}

function toSortable(row: JourneySubEvent): RoadmapSortable {
  return {
    id: row.id,
    custom_name: row.custom_name,
    type_name: row.type_name,
    event_date: row.event_date,
    display_order: row.display_order,
    start_time: row.start_time,
  }
}

function emptyToNull(v: string): string | null {
  const t = v.trim()
  return t === '' ? null : t
}

export function JourneyClient({
  eventId,
  initialRows,
  catalog,
}: {
  eventId: string
  initialRows: JourneySubEvent[]
  catalog: CatalogType[]
}): React.JSX.Element {
  const { runBusy } = useBusy()
  const [rows, setRows] = useState<JourneySubEvent[]>(initialRows)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [nameError, setNameError] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<JourneySubEvent | null>(null)

  const ordered = useMemo(() => sortByDisplayOrder(rows), [rows])

  const nextUpId = useMemo(() => findNextUpId(ordered.map(toSortable)), [ordered])
  const { held, upcoming } = useMemo(
    () => countHeldAndUpcoming(ordered.map(toSortable)),
    [ordered],
  )

  const nameFilled = form.custom_name.trim().length > 0
  const isEdit = editingId !== null

  function openAdd(): void {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, event_sub_type_id: catalog[0]?.id ?? '' })
    setNameError(false)
    setFormOpen(true)
  }

  function openEdit(row: JourneySubEvent): void {
    setEditingId(row.id)
    setForm({
      custom_name: subEventTitle(row.custom_name, row.type_name),
      event_sub_type_id: row.event_sub_type_id ?? '',
      event_date: row.event_date,
      start_time: row.start_time ? row.start_time.slice(0, 5) : null,
      venue: row.venue ?? '',
      show_on_website: row.show_on_website,
    })
    setNameError(false)
    setFormOpen(true)
  }

  function typeMeta(typeId: string): { type_name: string | null; icon_name: string | null } {
    const t = catalog.find((c) => c.id === typeId)
    return { type_name: t?.name ?? null, icon_name: t?.icon_name ?? null }
  }

  async function toggleWebsite(row: JourneySubEvent, next: boolean): Promise<void> {
    const prev = row.show_on_website
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, show_on_website: next } : r)))
    try {
      const res = await fetch(`/api/events/${eventId}/sub-events/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_on_website: next }),
      })
      if (!res.ok) throw new Error('toggle failed')
    } catch {
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, show_on_website: prev } : r)))
    }
  }

  async function saveForm(): Promise<void> {
    const name = form.custom_name.trim()
    if (!name) {
      setNameError(true)
      return
    }
    const body = {
      custom_name: name,
      event_sub_type_id: emptyToNull(form.event_sub_type_id),
      event_date: form.event_date,
      start_time: form.start_time,
      venue: emptyToNull(form.venue),
      show_on_website: form.show_on_website,
    }
    const meta = typeMeta(form.event_sub_type_id)

    await runBusy(async () => {
      if (isEdit && editingId) {
        const snapshot = rows
        setRows((rs) =>
          rs.map((r) =>
            r.id === editingId
              ? { ...r, ...body, ...meta }
              : r,
          ),
        )
        const res = await fetch(`/api/events/${eventId}/sub-events/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          setRows(snapshot)
          return
        }
        const saved = (await res.json()) as Partial<JourneySubEvent>
        setRows((rs) =>
          rs.map((r) => (r.id === editingId ? { ...r, ...saved, ...meta } : r)),
        )
      } else {
        const res = await fetch(`/api/events/${eventId}/sub-events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) return
        const created = (await res.json()) as JourneySubEvent
        setRows((rs) => [...rs, { ...created, ...meta }])
      }
      setFormOpen(false)
    }, isEdit ? 'Saving…' : 'Adding…')
  }

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget) return
    const id = deleteTarget.id
    const snapshot = rows
    setRows((rs) => rs.filter((r) => r.id !== id))
    setDeleteTarget(null)
    await runBusy(async () => {
      const res = await fetch(`/api/events/${eventId}/sub-events/${id}`, { method: 'DELETE' })
      if (!res.ok) setRows(snapshot)
    }, 'Removing…')
  }

  return (
    <>
      <div className="oj-bar">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="clay-pill bg-brand-tint text-brand px-3 h-8 inline-flex items-center font-display font-bold text-xs tracking-wide">
            {ordered.length} {ordered.length === 1 ? 'FUNCTION' : 'FUNCTIONS'}
          </span>
          {ordered.length > 0 && (
            <span className="clay-pill bg-cream-soft text-ink-soft px-3 h-8 inline-flex items-center font-display font-bold text-xs tracking-wide">
              {held} HELD · {upcoming} TO COME
            </span>
          )}
        </div>
        <button type="button" className="btn-pill btn-pill-primary" onClick={openAdd}>
          <span aria-hidden="true" className="material-symbols-outlined">add</span>
          Add sub-event
        </button>
      </div>

      {ordered.length === 0 ? (
        <div className="oj-empty">
          <span className="oj-empty-icon" aria-hidden="true">
            <span className="material-symbols-outlined">event</span>
          </span>
          <p className="oj-empty-title">No functions yet</p>
          <p className="oj-empty-sub">
            Add the ceremonies and functions for your celebration — they&apos;ll appear here, on Event Control, and on your event website.
          </p>
          <button type="button" className="btn-pill btn-pill-primary" onClick={openAdd}>
            <span aria-hidden="true" className="material-symbols-outlined">add</span>
            Add your first sub-event
          </button>
        </div>
      ) : (
        <ul className="oj-list">
          {ordered.map((row) => {
            const title = subEventTitle(row.custom_name, row.type_name)
            const badge = journeyBadgeFor(toSortable(row), nextUpId)
            const icon = resolveSubEventIcon(row.icon_name)
            const meta = formatSubEventMeta(row.event_date, row.start_time, row.venue)
            const marquee = badge === 'big-day'
            const next = badge === 'next'
            return (
              <li
                key={row.id}
                className={`oj-row clay-card${next ? ' is-next' : ''}${marquee ? ' is-marquee' : ''}`}
              >
                <span
                  className={`oj-row-icon${marquee ? ' oj-row-icon-brand' : ''}`}
                  aria-hidden="true"
                >
                  <span className="material-symbols-outlined icon-fill">{icon}</span>
                </span>
                <div className="oj-row-main">
                  <div className="oj-row-head">
                    <h2 className="oj-row-title">{title}</h2>
                    <StatusBadge badge={badge} />
                  </div>
                  <p className={`oj-row-meta${meta ? '' : ' is-empty'}`}>
                    {meta || 'Add date, time & venue'}
                  </p>
                </div>
                <div className="oj-row-actions">
                  <label className="oj-vis">
                    <span className="oj-vis-label">Website</span>
                    <ToggleSwitch
                      id={`oj-web-${row.id}`}
                      checked={row.show_on_website}
                      onChange={(v) => { void toggleWebsite(row, v) }}
                      ariaLabel={`Show ${title} on website`}
                    />
                  </label>
                  <button
                    type="button"
                    className="fn-icon-btn"
                    aria-label={`Edit ${title}`}
                    onClick={() => openEdit(row)}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined">edit</span>
                  </button>
                  <button
                    type="button"
                    className="fn-icon-btn oj-del"
                    aria-label={`Remove ${title}`}
                    onClick={() => setDeleteTarget(row)}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p className="oj-foot-note">
        Tip: toggle <strong>Website</strong> off to keep a function private — it stays on your Event Control roadmap but won&apos;t show on the public schedule.
      </p>

      {formOpen ? (
        <Portal>
          <div
            className="modal-scrim is-open"
            onClick={(e) => { if (e.target === e.currentTarget) setFormOpen(false) }}
          >
            <div
              className="modal-card lg-glass-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="oj-form-title"
            >
              <div className="modal-head">
                <div className="modal-head-lead">
                  <h2 className="modal-title" id="oj-form-title">
                    {isEdit ? 'Edit sub-event' : 'Add sub-event'}
                  </h2>
                  <p className="modal-sub">Functions appear on Event Control and your website schedule.</p>
                </div>
                <button
                  type="button"
                  className="modal-close"
                  aria-label="Close"
                  onClick={() => setFormOpen(false)}
                >
                  <span aria-hidden="true" className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="modal-body oj-form-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="oj-f-name">Function name</label>
                  <input
                    id="oj-f-name"
                    className="form-input"
                    type="text"
                    placeholder="e.g. Mehendi, Sangeet, Reception"
                    autoComplete="off"
                    value={form.custom_name}
                    aria-invalid={nameError}
                    aria-describedby="oj-f-name-err"
                    onChange={(e) => {
                      setForm((f) => ({ ...f, custom_name: e.target.value }))
                      if (nameError) setNameError(false)
                    }}
                  />
                  <p className="form-error" id="oj-f-name-err" role="alert" hidden={!nameError}>
                    Give this function a name.
                  </p>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="oj-f-type">Type</label>
                  <div className="form-select">
                    <select
                      id="oj-f-type"
                      value={form.event_sub_type_id}
                      onChange={(e) => setForm((f) => ({ ...f, event_sub_type_id: e.target.value }))}
                    >
                      <option value="">Other / custom</option>
                      {catalog.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <span className="form-select-chevron" aria-hidden="true">
                      <span className="material-symbols-outlined">expand_more</span>
                    </span>
                  </div>
                </div>
                <div className="oj-form-row">
                  <div className="form-group">
                    <span className="form-label" id="oj-f-date-label">Date</span>
                    <DatePicker
                      value={form.event_date}
                      onChange={(iso) => setForm((f) => ({ ...f, event_date: iso }))}
                      min="1970-01-01"
                      max={eventDateMaxISO()}
                      placeholder="e.g. Sat, Dec 20"
                      labelId="oj-f-date-label"
                    />
                  </div>
                  <div className="form-group">
                    <span className="form-label" id="oj-f-time-label">Time</span>
                    <TimePicker
                      value={form.start_time}
                      onChange={(t) => setForm((f) => ({ ...f, start_time: t }))}
                      placeholder="e.g. 4:00 PM"
                      labelId="oj-f-time-label"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="oj-f-venue">Venue</label>
                  <input
                    id="oj-f-venue"
                    className="form-input"
                    type="text"
                    placeholder="e.g. Heritage Palace, Courtyard Lawn"
                    autoComplete="off"
                    value={form.venue}
                    onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                  />
                </div>
                <label className="oj-form-toggle">
                  <span className="oj-form-toggle-text">
                    <span className="oj-form-toggle-title">Show on event website</span>
                    <span className="oj-form-toggle-sub">Off = stays on your roadmap but hidden from guests.</span>
                  </span>
                  <ToggleSwitch
                    id="oj-f-web"
                    checked={form.show_on_website}
                    onChange={(v) => setForm((f) => ({ ...f, show_on_website: v }))}
                    ariaLabel="Show on event website"
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setFormOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-pill btn-pill-primary"
                  disabled={!nameFilled}
                  onClick={() => { void saveForm() }}
                >
                  {isEdit ? 'Save changes' : 'Add sub-event'}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove this function?"
        message={
          <>
            “{deleteTarget ? subEventTitle(deleteTarget.custom_name, deleteTarget.type_name) : ''}” will be
            removed from your journey, the Event Control roadmap and your website schedule. This can&apos;t
            be undone.
          </>
        }
        onConfirm={() => { void confirmDelete() }}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Remove"
        cancelLabel="Keep it"
        tone="danger"
        icon="delete"
      />
    </>
  )
}

function StatusBadge({ badge }: { badge: JourneyBadge | null }): React.JSX.Element | null {
  if (badge === 'held') return <span className="oj-tag oj-tag-held">Held</span>
  if (badge === 'next') {
    return (
      <span className="oj-tag oj-tag-next">
        <span className="oj-dot" aria-hidden="true" />
        Next up
      </span>
    )
  }
  if (badge === 'big-day') return <span className="oj-tag oj-tag-day">The big day</span>
  return null
}
