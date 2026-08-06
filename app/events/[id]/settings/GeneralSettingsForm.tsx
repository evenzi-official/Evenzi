'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormGroup } from '@/components/ui/FormGroup'
import { FormInput } from '@/components/ui/FormInput'
import { BusyOverlay } from '@/components/ui/BusyOverlay'
import { Portal } from '@/components/ui/Portal'
import { updateEventSchema } from '@/lib/validations/events'

// Variable fields (partner names) live in events.event_details (jsonb), keyed by the
// config.event_types.field_schema keys. The create wizard wrote partner_1_name /
// partner_2_name (see app/api/events/route.ts) — we read/write the same keys here.
const PARTNER_1_KEY = 'partner_1_name'
const PARTNER_2_KEY = 'partner_2_name'
const CITY_KEY = 'city'

export interface GeneralSettingsEvent {
  id:              string
  name:            string | null
  primaryDate:     string | null
  primaryVenue:    string | null
  city:            string | null
  eventDetails:    Record<string, string>
  tagline:         string | null
}

type ToastTone = 'success' | 'error'

interface ToastState {
  message: string
  tone: ToastTone
}

export function GeneralSettingsForm({ event }: { event: GeneralSettingsEvent }): React.ReactElement {
  const router = useRouter()

  const [name, setName] = useState(event.name ?? '')
  const [partnerOne, setPartnerOne] = useState(event.eventDetails[PARTNER_1_KEY] ?? '')
  const [partnerTwo, setPartnerTwo] = useState(event.eventDetails[PARTNER_2_KEY] ?? '')
  const [eventDate, setEventDate] = useState(event.primaryDate ?? '')
  const [venue, setVenue] = useState(event.primaryVenue ?? '')
  const [city, setCity] = useState(event.city ?? '')
  const [tagline, setTagline] = useState(event.tagline ?? '')

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)

  // Trigger that opened the delete modal — focus returns here on close (a11y).
  const deleteTriggerRef = useRef<HTMLButtonElement>(null)

  function openConfirm(): void {
    setDeleteConfirmText('')
    setConfirmOpen(true)
  }

  // Closes the confirm modal and returns focus to the trigger button.
  function closeConfirm(): void {
    setConfirmOpen(false)
    setDeleteConfirmText('')
    deleteTriggerRef.current?.focus()
  }

  // A reload that races an in-flight save would read stale server data —
  // warn before the browser/tab actually unloads rather than let it happen silently.
  useEffect(() => {
    if (!saving) return
    function onBeforeUnload(e: BeforeUnloadEvent): void {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [saving])

  // Escape closes the delete confirm modal (don't dismiss mid-delete).
  useEffect(() => {
    if (!confirmOpen) return

    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape' && !deleting) {
        e.preventDefault()
        closeConfirm()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [confirmOpen, deleting])

  // Reuses the shell .bc-toast primitive (designs/shared/shell.css). The visible
  // state class is .is-show.
  function flashToast(message: string, tone: ToastTone): void {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 3000)
  }

  // '' → null so empty inputs clear the column (matches the API's emptyToNull).
  function nullify(value: string): string | null {
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
  }

  async function handleSave(): Promise<void> {
    if (saving) return

    const payload = {
      name: nullify(name),
      primary_date: nullify(eventDate),
      primary_venue: nullify(venue),
      event_details: {
        [PARTNER_1_KEY]: nullify(partnerOne),
        [PARTNER_2_KEY]: nullify(partnerTwo),
        [CITY_KEY]: nullify(city),
      },
    }

    const parsed = updateEventSchema.safeParse(payload)
    if (!parsed.success) {
      flashToast('Please check the form and try again.', 'error')
      return
    }

    setSaving(true)
    try {
      const evRes = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      if (!evRes.ok) {
        flashToast(evRes.status === 404 ? 'Event not found.' : 'Could not save event details.', 'error')
        return
      }

      const gsRes = await fetch(`/api/events/${event.id}/general-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagline: nullify(tagline) }),
      })
      if (!gsRes.ok) {
        flashToast('Event details saved, but the tagline failed to save — please retry.', 'error')
        return
      }

      flashToast('Changes saved', 'success')
      router.refresh()
    } catch {
      flashToast('Could not save changes.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(): Promise<void> {
    if (deleting) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' })

      if (!res.ok) {
        flashToast(res.status === 404 ? 'Event already deleted.' : 'Could not delete event.', 'error')
        setDeleting(false)
        return
      }

      setConfirmOpen(false)
      flashToast('Event deleted', 'success')
      router.push('/home')
    } catch {
      flashToast('Could not delete event.', 'error')
      setDeleting(false)
    }
  }

  return (
    <>
      <BusyOverlay active={saving || deleting} label={deleting ? 'Deleting event…' : 'Saving changes…'} />
      <div className="es-content">
        <header className="es-content-head">
          <div>
            <h1 className="es-content-title">General settings</h1>
            <p className="es-content-lead">Manage your event&apos;s core details and registration information.</p>
          </div>
          <div className="es-content-actions">
            <button
              type="button"
              className={`btn-pill btn-pill-primary${saving ? ' is-loading' : ''}`}
              onClick={handleSave}
              disabled={saving}
              aria-busy={saving}
            >
              <span aria-hidden="true" className="material-symbols-outlined">save</span>
              Save changes
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
          </div>
        </header>

        {/* Event identity */}
        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">badge</span>
              Event identity
            </h2>
            <p className="es-section-sub">The basics — visible to your guests across invites, the website, and the dashboard.</p>
          </header>
          <div className="es-field-grid">
            <FormGroup id="es-event-name" label="Event name" full>
              <FormInput
                id="es-event-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
              />
            </FormGroup>
            <FormGroup id="es-partner-one" label="Partner one">
              <FormInput
                id="es-partner-one"
                type="text"
                placeholder="e.g. Anya Singh"
                value={partnerOne}
                onChange={(e) => setPartnerOne(e.target.value)}
              />
            </FormGroup>
            <FormGroup id="es-partner-two" label="Partner two">
              <FormInput
                id="es-partner-two"
                type="text"
                placeholder="e.g. Kabir Mehta"
                value={partnerTwo}
                onChange={(e) => setPartnerTwo(e.target.value)}
              />
            </FormGroup>
            <FormGroup id="es-date" label="Event date">
              <FormInput
                id="es-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </FormGroup>
            <FormGroup id="es-event-type" label="Event type">
              <div className="form-select">
                <select id="es-event-type" defaultValue="Wedding" disabled>
                  <option>Wedding</option>
                </select>
                <span aria-hidden="true" className="material-symbols-outlined form-select-chevron">expand_more</span>
              </div>
            </FormGroup>
            <FormGroup id="es-venue" label="Venue name">
              <FormInput
                id="es-venue"
                type="text"
                placeholder="e.g. Rajasthan Heritage Palace"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </FormGroup>
            <FormGroup id="es-location" label="City / location">
              <FormInput
                id="es-location"
                type="text"
                placeholder="e.g. Udaipur, Rajasthan"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </FormGroup>
            <FormGroup id="es-tagline" label="Tagline (optional)" helper="Shown under the event title on the public website and invites." full>
              <FormInput
                id="es-tagline"
                type="text"
                placeholder="A few words about the celebration"
                maxLength={80}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </FormGroup>
          </div>
        </section>

        {/* Help card */}
        <div className="es-help-card">
          <div className="es-help-body">
            <span className="es-help-title">Need help with these settings?</span>
            <span className="es-help-desc">Our support team can walk you through anything that&apos;s not making sense.</span>
          </div>
          <a href="mailto:evenzi.official@gmail.com" className="btn-pill btn-pill-secondary">
            <span aria-hidden="true" className="material-symbols-outlined">support_agent</span>
            Contact support
          </a>
        </div>

        {/* Danger zone */}
        <section className="es-section is-danger">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">warning</span>
              Danger zone
            </h2>
            <p className="es-section-sub">Irreversible actions — proceed with caution.</p>
          </header>
          <div className="es-toggle-row is-danger">
            <div className="es-toggle-body">
              <span className="es-toggle-title">Delete this event</span>
              <span className="es-toggle-desc">This action is permanent and cannot be undone. All RSVPs, photos, and registry data go with it.</span>
            </div>
            <button
              ref={deleteTriggerRef}
              type="button"
              className="btn-pill btn-pill-danger"
              onClick={openConfirm}
            >
              <span aria-hidden="true" className="material-symbols-outlined">delete</span>
              Delete event
            </button>
          </div>
        </section>

      </div>

      {/* Delete confirmation — portaled so .reveal transform doesn't clip fixed scrim */}
      <Portal>
        <div
          className={`modal-scrim${confirmOpen ? ' is-open' : ''}`}
          aria-hidden={!confirmOpen}
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) closeConfirm()
          }}
        >
          <div className="modal-confirm-cautionary modal-card" role="alertdialog" aria-modal="true" aria-labelledby="es-delete-title">
            <div className="modal-confirm-icon is-cautionary">
              <span aria-hidden="true" className="material-symbols-outlined">delete_forever</span>
            </div>
            <h3 className="modal-confirm-title" id="es-delete-title">Delete this event?</h3>
            <p className="modal-confirm-text">
              This permanently removes the event and all its data, guests, and media. This cannot be undone.
            </p>
            <div className="form-group">
              <label className="form-label" htmlFor="es-delete-confirm-text">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                id="es-delete-confirm-text"
                type="text"
                className="form-input"
                autoComplete="off"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                disabled={deleting}
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-pill btn-pill-secondary"
                onClick={closeConfirm}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn-pill btn-pill-danger${deleting ? ' is-loading' : ''}`}
                onClick={handleDelete}
                disabled={deleting || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                aria-busy={deleting}
              >
                Delete event
                <span aria-hidden="true" className="btn-pill-spinner" />
              </button>
            </div>
          </div>
        </div>
      </Portal>

      {/* Toast — reuses the shell .bc-toast primitive */}
      <div
        className={`bc-toast${toast ? ' is-show' : ''}`}
        role="status"
        aria-live="polite"
      >
        <span
          className="bc-live"
          aria-hidden="true"
          style={toast?.tone === 'error' ? { background: 'var(--danger, #ef4444)' } : undefined}
        />
        <span>{toast?.message ?? ''}</span>
      </div>
    </>
  )
}
