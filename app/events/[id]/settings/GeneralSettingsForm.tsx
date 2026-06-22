'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormGroup } from '@/components/ui/FormGroup'
import { FormInput } from '@/components/ui/FormInput'
import { updateEventSchema } from '@/lib/validations/events'

// Variable fields (partner names) live in events.event_details (jsonb), keyed by the
// config.event_types.field_schema keys. The create wizard wrote partner_1_name /
// partner_2_name (see app/api/events/route.ts) — we read/write the same keys here.
const PARTNER_1_KEY = 'partner_1_name'
const PARTNER_2_KEY = 'partner_2_name'
const CITY_KEY = 'city'

export interface GeneralSettingsEvent {
  id: string
  name: string | null
  primaryDate: string | null
  primaryVenue: string | null
  city: string | null
  eventDetails: Record<string, string>
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

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

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
        // City/location has no dedicated column — it lives in the event_details bag.
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
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })

      if (!res.ok) {
        flashToast(res.status === 404 ? 'Event not found.' : 'Could not save changes.', 'error')
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
                placeholder="Name"
                value={partnerOne}
                onChange={(e) => setPartnerOne(e.target.value)}
              />
            </FormGroup>
            <FormGroup id="es-partner-two" label="Partner two">
              <FormInput
                id="es-partner-two"
                type="text"
                placeholder="Name"
                value={partnerTwo}
                onChange={(e) => setPartnerTwo(e.target.value)}
              />
            </FormGroup>
          </div>
        </section>

        {/* Date & venue */}
        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">calendar_today</span>
              Date &amp; venue
            </h2>
            <p className="es-section-sub">When and where the main celebration takes place.</p>
          </header>
          <div className="es-field-grid">
            <FormGroup id="es-date" label="Event date">
              <FormInput
                id="es-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
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
            <FormGroup id="es-location" label="City / location" full>
              <FormInput
                id="es-location"
                type="text"
                placeholder="e.g. Udaipur, Rajasthan"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </FormGroup>
          </div>
        </section>

        {/* Danger zone */}
        <section className="es-section es-section--danger">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">warning</span>
              Danger zone
            </h2>
            <p className="es-section-sub">Irreversible actions — proceed with caution.</p>
          </header>
          <div className="es-danger-row">
            <div>
              <p className="font-display font-semibold text-sm text-ink">Delete this event</p>
              <p className="text-xs text-muted mt-0.5">Permanently removes all data, guests, and media. Cannot be undone.</p>
            </div>
            <button
              type="button"
              className="btn-pill btn-pill-danger shrink-0"
              onClick={() => setConfirmOpen(true)}
            >
              <span aria-hidden="true" className="material-symbols-outlined">delete_forever</span>
              Delete event
            </button>
          </div>
        </section>
      </div>

      {/* Delete confirmation — reuses the shell .modal-confirm-cautionary primitive */}
      <div
        className={`modal-scrim${confirmOpen ? ' is-open' : ''}`}
        aria-hidden={!confirmOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget && !deleting) setConfirmOpen(false)
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
          <div className="modal-actions">
            <button
              type="button"
              className="btn-pill btn-pill-secondary"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`btn-pill btn-pill-danger${deleting ? ' is-loading' : ''}`}
              onClick={handleDelete}
              disabled={deleting}
              aria-busy={deleting}
            >
              Delete event
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
          </div>
        </div>
      </div>

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
