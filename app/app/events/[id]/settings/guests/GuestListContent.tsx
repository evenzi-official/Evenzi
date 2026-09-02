'use client'

import { useState } from 'react'
import { BusyOverlay } from '@/components/ui/BusyOverlay'
import { SUPPORT_MAILTO } from '@/lib/constants/support'

interface InitialGuestSettings {
  rsvpEnabled:          boolean
  allowPlusOnes:        boolean
  maxPlusOnesPerInvite: number
  collectDietaryNotes:  boolean
  defaultGuestMessage:  string
}

interface Props {
  eventId: string
  initial: InitialGuestSettings
}

export function GuestListContent({ eventId, initial }: Props) {
  const [rsvpEnabled, setRsvpEnabled]     = useState(initial.rsvpEnabled)
  const [allowPlusOne, setAllowPlusOne]   = useState(initial.allowPlusOnes)
  const [dietaryNotes, setDietaryNotes]   = useState(initial.collectDietaryNotes)
  const [plusOneCap, setPlusOneCap]       = useState(initial.maxPlusOnesPerInvite)
  const [defaultMsg, setDefaultMsg]       = useState(
    initial.defaultGuestMessage || "We can't wait to celebrate with you! Tap the link to RSVP and view the schedule."
  )
  const [saving, setSaving]               = useState(false)
  const [toast, setToast]                 = useState<string | null>(null)

  function flashToast(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3000)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/guest-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvp_enabled:              rsvpEnabled,
          allow_plus_ones:           allowPlusOne,
          max_plus_ones_per_invite:  plusOneCap,
          collect_dietary_notes:     dietaryNotes,
          default_guest_message:     defaultMsg || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        flashToast((err as { error?: string }).error ?? 'Failed to save — please try again')
      } else {
        flashToast('Guest list settings saved')
      }
    } catch {
      flashToast('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <BusyOverlay active={saving} label="Saving…" />
      <div className="es-content">
        <header className="es-content-head">
          <div>
            <h1 className="es-content-title">Guest list settings</h1>
            <p className="es-content-lead">Configure global guest list preferences, RSVP rules, and communication defaults.</p>
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

        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">settings_suggest</span>
              Global preferences
            </h2>
            <p className="es-section-sub">These rules apply to every guest you invite. Change them anytime — already-sent RSVPs aren&apos;t affected.</p>
          </header>

          <div className="es-toggle-row">
            <div className="es-toggle-body">
              <span className="es-toggle-title">Enable RSVP for all events</span>
              <span className="es-toggle-desc">Whether attending is required or optional for invitees to respond.</span>
            </div>
            <button type="button" className="toggle-switch" role="switch" aria-checked={rsvpEnabled} aria-label="Enable RSVP" onClick={() => setRsvpEnabled(v => !v)}>
              <span className="toggle-switch-thumb" aria-hidden="true" />
            </button>
          </div>

          <div className="es-toggle-row">
            <div className="es-toggle-body">
              <span className="es-toggle-title">Allow guests to add a plus-one</span>
              <span className="es-toggle-desc">Guests can bring a companion subject to availability. Adjust the quota below.</span>
            </div>
            <button type="button" className="toggle-switch" role="switch" aria-checked={allowPlusOne} aria-label="Allow plus-ones" onClick={() => setAllowPlusOne(v => !v)}>
              <span className="toggle-switch-thumb" aria-hidden="true" />
            </button>
          </div>

          <div className="es-toggle-row">
            <div className="es-toggle-body">
              <span className="es-toggle-title">Collect dietary-related notes</span>
              <span className="es-toggle-desc">Ask guests to share allergies or food preferences during RSVP.</span>
            </div>
            <button type="button" className="toggle-switch" role="switch" aria-checked={dietaryNotes} aria-label="Collect dietary notes" onClick={() => setDietaryNotes(v => !v)}>
              <span className="toggle-switch-thumb" aria-hidden="true" />
            </button>
          </div>

          <div className="es-toggle-row">
            <div className="es-toggle-body">
              <span className="es-toggle-title">Cap of plus-ones per invite</span>
              <span className="es-toggle-desc">Hard limit on extra guests per primary invitee.</span>
            </div>
            <div className="form-input form-input-group es-guest-cap">
              <input
                id="es-plus-one-cap"
                type="number"
                min={0}
                max={10}
                value={plusOneCap}
                inputMode="numeric"
                className="form-input-field"
                autoComplete="off"
                onChange={(e) => setPlusOneCap(Math.max(0, Math.min(10, Number(e.target.value))))}
              />
              <span className="form-input-suffix" aria-hidden="true">plus-ones</span>
            </div>
          </div>
        </section>

        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">mail</span>
              Default guest message
            </h2>
            <p className="es-section-sub">The greeting auto-attached to every new invite. Personalize per-guest from the invite editor.</p>
          </header>
          <div className="form-group">
            <label className="form-label" htmlFor="es-default-msg">Default invitation message</label>
            <textarea
              id="es-default-msg"
              className="form-textarea"
              maxLength={400}
              placeholder="Write a warm greeting for your guests…"
              value={defaultMsg}
              onChange={(e) => setDefaultMsg(e.target.value)}
            />
            <p className="form-helper">Keep it short and warm — the link to your event page does the heavy lifting.</p>
          </div>
        </section>

        <div className="es-help-card">
          <div className="es-help-body">
            <span className="es-help-title">Need help with your guest list?</span>
            <span className="es-help-desc">Our complete guide covers everything from CSV imports to managing multiple events RSVPs.</span>
          </div>
          <a href={SUPPORT_MAILTO()} className="btn-pill btn-pill-secondary">
            <span aria-hidden="true" className="material-symbols-outlined">menu_book</span>
            View the guide
          </a>
        </div>

      </div>

      <div className={`bc-toast${toast ? ' is-show' : ''}`} role="status" aria-live="polite">
        <span className="bc-live" aria-hidden="true" />
        <span>{toast ?? ''}</span>
      </div>
    </>
  )
}
