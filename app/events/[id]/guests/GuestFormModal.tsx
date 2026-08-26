'use client'

import { useState } from 'react'
import type { GuestRow, GuestTagOption, RsvpStatusOption, SubEventOption } from '@/lib/types/guests'
import { useBusy } from '@/components/ui/BusyProvider'

interface Props {
  eventId: string
  mode: 'add' | 'edit'
  guest: GuestRow | null
  rsvpStatuses: RsvpStatusOption[]
  subEvents: SubEventOption[]
  tags: GuestTagOption[]
  onClose: () => void
  onSaved: (guest: GuestRow) => void
  onRemoved: (guestId: string) => void
  onCreateTag: (name: string) => Promise<GuestTagOption>
  onManageTags: () => void
  flashToast: (message: string) => void
}

export function GuestFormModal(props: Props): React.ReactElement {
  const { eventId, mode, guest, rsvpStatuses, subEvents, tags, onClose, onSaved, onRemoved, onCreateTag, onManageTags, flashToast } = props
  const { runBusy } = useBusy()
  const editing = mode === 'edit' && guest !== null

  const [name, setName] = useState(guest?.name ?? '')
  const [phone, setPhone] = useState(guest?.phone ?? '')
  const [email, setEmail] = useState(guest?.email ?? '')
  const [subEventIds, setSubEventIds] = useState<string[]>(guest?.subEventIds ?? subEvents.map((s) => s.id))
  const [tagIds, setTagIds] = useState<string[]>(guest?.tagIds ?? [])
  const [rsvpStatusId, setRsvpStatusId] = useState<string>(guest?.rsvpStatusId ?? '')
  const [tagInput, setTagInput] = useState('')
  const [tagListOpen, setTagListOpen] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [confirmingRemove, setConfirmingRemove] = useState(false)

  const availableTagSuggestions = tags.filter(
    (t) => !tagIds.includes(t.id) && t.name.toLowerCase().includes(tagInput.trim().toLowerCase())
  )
  const exactMatch = tags.find((t) => t.name.toLowerCase() === tagInput.trim().toLowerCase())
  const trimmedEmail = email.trim()
  const canSubmit =
    name.trim().length > 0 &&
    phone.replace(/\D/g, '').length === 10 &&
    (trimmedEmail.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))

  function toggleSubEvent(id: string): void {
    setSubEventIds((cur) => (cur.includes(id) ? cur.filter((v) => v !== id) : [...cur, id]))
  }

  async function addTagByName(rawName: string): Promise<void> {
    const trimmed = rawName.trim()
    if (!trimmed) return
    const existing = tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      if (!tagIds.includes(existing.id)) setTagIds((cur) => [...cur, existing.id])
    } else {
      try {
        const created = await onCreateTag(trimmed)
        setTagIds((cur) => [...cur, created.id])
      } catch {
        flashToast("Couldn't create tag.")
        return
      }
    }
    setTagInput('')
    setTagListOpen(false)
  }

  function removeTag(tagId: string): void {
    setTagIds((cur) => cur.filter((v) => v !== tagId))
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setNameError(null)
    setPhoneError(null)
    setEmailError(null)
    const trimmedName = name.trim()
    const digitsPhone = phone.replace(/\D/g, '')
    const trimmedEmail = email.trim()
    let bad = false
    if (digitsPhone.length !== 10) { setPhoneError('Enter a valid 10-digit mobile number.'); bad = true }
    if (!trimmedName) { setNameError('Please enter a name.'); bad = true }
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) { setEmailError('Enter a valid email address.'); bad = true }
    if (bad) return

    setSaving(true)
    try {
      await runBusy(async () => {
      if (editing && guest) {
        const res = await fetch(`/api/events/${eventId}/guests/${guest.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            phone: digitsPhone,
            email: email.trim() || null,
            subEventIds,
            tagIds,
            ...(rsvpStatusId ? { rsvpStatusId } : {}),
          }),
        })
        if (!res.ok) { flashToast("Couldn't save changes."); return }
        onSaved({
          ...guest,
          name: trimmedName,
          phone: digitsPhone,
          email: email.trim() || null,
          subEventIds,
          tagIds,
          rsvpStatusId: rsvpStatusId || guest.rsvpStatusId,
        })
        flashToast('Guest updated')
      } else {
        const res = await fetch(`/api/events/${eventId}/guests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmedName, phone: digitsPhone, email: email.trim() || null, subEventIds, tagIds }),
        })
        const data: { guest?: GuestRow; error?: string } = await res.json()
        if (!res.ok || !data.guest) {
          // 409 carries a specific "duplicate phone" message worth showing verbatim.
          flashToast(res.status === 409 && data.error ? data.error : "Couldn't add guest.")
          return
        }
        onSaved(data.guest)
        flashToast('Guest added')
      }
      onClose()
      }, editing ? 'Saving…' : 'Adding guest…')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(): Promise<void> {
    if (!guest) return
    setRemoving(true)
    try {
      await runBusy(async () => {
        const res = await fetch(`/api/events/${eventId}/guests/${guest.id}`, { method: 'DELETE' })
        if (!res.ok) { flashToast("Couldn't remove guest."); return }
        onRemoved(guest.id)
        flashToast('Guest removed')
        onClose()
      }, 'Removing guest…')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="modal-scrim is-open" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card lg-glass-card" role="dialog" aria-modal="true" aria-labelledby="gm-guest-h">
        <header className="modal-head">
          <div className="modal-head-lead">
            <h2 className="modal-title" id="gm-guest-h">{editing ? 'Edit guest' : 'Add guest'}</h2>
          </div>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <span aria-hidden="true" className="material-symbols-outlined">close</span>
          </button>
        </header>

        <form onSubmit={(e) => { void handleSubmit(e) }} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="gm-f-name">Full name <span aria-hidden="true" className="req-mark">*</span></label>
            <input id="gm-f-name" className="form-input" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            {nameError && (
              <p className="form-error" role="alert"><span aria-hidden="true" className="material-symbols-outlined">error</span> {nameError}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="gm-f-phone">Mobile number <span aria-hidden="true" className="req-mark">*</span></label>
            <div className="form-input form-input-group">
              <span className="form-input-prefix" aria-hidden="true">+91</span>
              <input
                id="gm-f-phone" className="form-input-field" type="tel" inputMode="numeric" autoComplete="tel" maxLength={10}
                placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              />
            </div>
            {phoneError && (
              <p className="form-error" role="alert"><span aria-hidden="true" className="material-symbols-outlined">error</span> {phoneError}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="gm-f-email">Email <span className="form-label-opt">(optional)</span></label>
            <input id="gm-f-email" className="form-input" type="email" autoComplete="email" placeholder="name@example.com" value={email ?? ''} onChange={(e) => setEmail(e.target.value)} />
            {emailError && (
              <p className="form-error" role="alert"><span aria-hidden="true" className="material-symbols-outlined">error</span> {emailError}</p>
            )}
          </div>

          <div className="form-group">
            <span className="form-label" id="gm-f-func-label">Invited to functions</span>
            <p className="gm-field-help">Controls which functions this guest sees and RSVPs to.</p>
            <div className="gm-func-list" role="group" aria-labelledby="gm-f-func-label">
              {subEvents.map((se) => (
                <label key={se.id} className="form-check">
                  <input type="checkbox" checked={subEventIds.includes(se.id)} onChange={() => toggleSubEvent(se.id)} />
                  <span>{se.label}</span>
                </label>
              ))}
            </div>
            {subEventIds.length === 0 && (
              <p className="form-error" role="status"><span aria-hidden="true" className="material-symbols-outlined">warning</span> This guest won&apos;t see any functions.</p>
            )}
            {subEventIds.length > 0 && (
              <p className="gm-func-preview" aria-live="polite">
                This guest will see: {subEvents.filter((s) => subEventIds.includes(s.id)).map((s) => s.label).join(', ')}
              </p>
            )}
          </div>

          <div className="form-group">
            <div className="form-label gm-tags-label">
              <label htmlFor="gm-f-tag-input">Tags <span className="form-label-opt">(optional)</span></label>
              <button type="button" className="gm-manage-tags-link" onClick={onManageTags}>Manage tags</button>
            </div>
            <div className="tag-input">
              <span className="tag-input-chips">
                {tagIds.map((tagId) => {
                  const t = tags.find((x) => x.id === tagId)
                  if (!t) return null
                  return (
                    <span key={tagId} className="tag-chip tag-chip-removable">
                      <span className="tag-chip-label">{t.name}</span>
                      <button type="button" className="tag-chip-x" aria-label={`Remove tag ${t.name}`} onClick={() => removeTag(tagId)}>
                        <span aria-hidden="true" className="material-symbols-outlined">close</span>
                      </button>
                    </span>
                  )
                })}
              </span>
              <input
                id="gm-f-tag-input" className="tag-input-field" type="text" role="combobox"
                aria-expanded={tagListOpen} aria-autocomplete="list" autoComplete="off"
                placeholder="Add a tag…" value={tagInput}
                onChange={(e) => { setTagInput(e.target.value); setTagListOpen(true) }}
                onFocus={() => setTagListOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); void addTagByName(tagInput) }
                  else if (e.key === 'Backspace' && !tagInput && tagIds.length) removeTag(tagIds[tagIds.length - 1])
                }}
              />
            </div>
            {tagListOpen && (availableTagSuggestions.length > 0 || (tagInput.trim() && !exactMatch)) && (
              <ul className="tag-input-listbox" role="listbox" aria-label="Tag suggestions">
                {availableTagSuggestions.map((t) => (
                  <li key={t.id} className="tag-input-option" role="option" aria-selected={false} onClick={() => { void addTagByName(t.name) }}>
                    <span aria-hidden="true" className="material-symbols-outlined">sell</span> {t.name}
                  </li>
                ))}
                {tagInput.trim() && !exactMatch && (
                  <li className="tag-input-option tag-input-option-new" role="option" aria-selected={false} onClick={() => { void addTagByName(tagInput) }}>
                    <span aria-hidden="true" className="material-symbols-outlined">add</span> Create &ldquo;{tagInput.trim()}&rdquo;
                  </li>
                )}
              </ul>
            )}
          </div>

          {editing && (
            <div className="form-group">
              <span className="form-label" id="gm-f-rsvp-label">RSVP status</span>
              <div className="radio-pill-group gm-rsvp-pills" role="radiogroup" aria-labelledby="gm-f-rsvp-label">
                {rsvpStatuses.map((s) => (
                  <button
                    key={s.id} type="button" role="radio" aria-checked={rsvpStatusId === s.id}
                    className={`radio-pill radio-pill--${s.slug}${rsvpStatusId === s.id ? ' is-checked' : ''}`}
                    onClick={() => setRsvpStatusId(s.id)}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined icon-fill">{s.iconName}</span> {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="modal-actions">
            {editing && !confirmingRemove && (
              <button type="button" className="btn-pill btn-pill-danger gm-remove-btn" onClick={() => setConfirmingRemove(true)}>
                <span aria-hidden="true" className="material-symbols-outlined">person_remove</span> Remove
              </button>
            )}
            <button type="button" className="btn-pill btn-pill-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-pill btn-pill-primary" disabled={!canSubmit || saving} aria-busy={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Save guest'}
            </button>
          </div>
        </form>

        {confirmingRemove && guest && (
          <div className="modal-scrim is-open" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setConfirmingRemove(false) }}>
            <div className="modal-card lg-glass-card modal-confirm-cautionary" role="alertdialog" aria-modal="true" aria-labelledby="gm-remove-h">
              <button className="modal-close modal-close--corner" type="button" aria-label="Close" onClick={() => setConfirmingRemove(false)}>
                <span aria-hidden="true" className="material-symbols-outlined">close</span>
              </button>
              <span className="modal-confirm-icon is-cautionary" aria-hidden="true"><span className="material-symbols-outlined">person_remove</span></span>
              <h2 className="modal-confirm-title" id="gm-remove-h">Remove this guest?</h2>
              <p className="modal-confirm-text">Remove <strong>{guest.name}</strong> from your list. Their RSVP, if any, will be discarded. You can add them again later.</p>
              <div className="modal-actions">
                <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setConfirmingRemove(false)}>Cancel</button>
                <button type="button" className="btn-pill btn-pill-primary" disabled={removing} onClick={() => { void handleRemove() }}>
                  {removing ? 'Removing…' : 'Remove guest'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
