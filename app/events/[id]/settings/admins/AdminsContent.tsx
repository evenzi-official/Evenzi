'use client'

import { useState } from 'react'
import { BusyOverlay } from '@/components/ui/BusyOverlay'
import { Portal } from '@/components/ui/Portal'
import { SUPPORT_MAILTO } from '@/lib/constants/support'

interface Collaborator {
  id:          string
  displayName: string
  email:       string
  role:        string
  status:      'active' | 'pending'
  initials:    string
}

interface Props {
  eventId:        string
  ownerName:      string
  ownerEmail:     string
  ownerInitials:  string
  collaborators:  Collaborator[]
}

export function AdminsContent({ eventId, ownerName, ownerEmail, ownerInitials, collaborators: initialCollabs }: Props) {
  const [collabs, setCollabs]   = useState(initialCollabs)
  const [modalOpen, setModalOpen] = useState(false)
  const [email, setEmail]       = useState('')
  const [role, setRole]         = useState('co-host')
  const [sending, setSending]   = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<Collaborator | null>(null)
  const [toast, setToast]       = useState<string | null>(null)

  function flashToast(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3000)
  }

  function closeModal() {
    if (sending) return
    setModalOpen(false)
    setEmail('')
    setRole('co-host')
  }

  function closeRemoveConfirm() {
    if (removingId !== null) return
    setPendingRemove(null)
  }

  async function handleRemoveConfirmed() {
    if (!pendingRemove) return
    const collabId = pendingRemove.id
    setRemovingId(collabId)
    try {
      const res = await fetch(`/api/events/${eventId}/admins/${collabId}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string }
        flashToast(json.error ?? 'Failed to remove — please try again')
      } else {
        setCollabs(prev => prev.filter(c => c.id !== collabId))
        setPendingRemove(null)
        flashToast('Collaborator removed')
      }
    } catch {
      flashToast('Network error — please try again')
    } finally {
      setRemovingId(null)
    }
  }

  async function handleSendInvite() {
    setSending(true)
    try {
      const res = await fetch(`/api/events/${eventId}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        flashToast((json as { error?: string }).error ?? 'Failed to invite — please try again')
      } else {
        const name = email.split('@')[0] ?? email
        setCollabs(prev => [...prev, {
          id:          (json as { id?: string }).id ?? crypto.randomUUID(),
          displayName: name,
          email:       email.trim(),
          role,
          status:      'pending',
          initials:    name.slice(0, 2).toUpperCase(),
        }])
        closeModal()
        flashToast('Invite sent')
      }
    } catch {
      flashToast('Network error — please try again')
    } finally {
      setSending(false)
    }
  }

  const activeCount = collabs.filter(c => c.status === 'active').length
  const removing = removingId !== null

  return (
    <>
      <BusyOverlay active={sending || removing} label={sending ? 'Sending invite…' : 'Removing…'} />
      <div className="es-content">
        <header className="es-content-head">
          <div>
            <h1 className="es-content-title">Manage admins</h1>
            <p className="es-content-lead">Add co-hosts to help you manage your event, guest list, and photos. Each admin can be assigned a role with specific permissions.</p>
          </div>
          <div className="es-content-actions">
            <button type="button" className="btn-pill btn-pill-primary" onClick={() => setModalOpen(true)}>
              <span aria-hidden="true" className="material-symbols-outlined">person_add</span>
              Add co-host
            </button>
          </div>
        </header>

        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">groups</span>
              Team admins
            </h2>
            <span className="es-section-tag">{activeCount + 1} active</span>
          </header>

          {/* Owner row */}
          <div className="es-admin-row">
            <span className="es-admin-avatar" aria-hidden="true">{ownerInitials}</span>
            <div className="es-admin-body">
              <span className="es-admin-name">{ownerName}</span>
              <span className="es-admin-email">{ownerEmail}</span>
            </div>
            <div className="es-admin-meta">
              <span className="es-admin-role is-owner">Owner</span>
              <span className="es-admin-status">Active</span>
            </div>
          </div>

          {/* Collaborator rows */}
          {collabs.map((collab) => (
            <div key={collab.id} className="es-admin-row">
              <span className="es-admin-avatar" aria-hidden="true">{collab.initials}</span>
              <div className="es-admin-body">
                <span className="es-admin-name">{collab.displayName}</span>
                <span className="es-admin-email">{collab.email}</span>
              </div>
              <div className="es-admin-meta">
                <span className="es-admin-role">{collab.role}</span>
                <span className={`es-admin-status${collab.status === 'pending' ? ' is-pending' : ''}`}>
                  {collab.status === 'pending' ? 'Pending invite' : 'Active'}
                </span>
              </div>
              <div className="es-admin-actions">
                <button
                  type="button"
                  className="fn-icon-btn"
                  onClick={() => setPendingRemove(collab)}
                  disabled={removing}
                  aria-label={`Remove ${collab.displayName.split(' ')[0]}`}
                >
                  <span aria-hidden="true" className="material-symbols-outlined">person_remove</span>
                </button>
              </div>
            </div>
          ))}

          {collabs.length === 0 && (
            <p className="es-section-sub" style={{ padding: '1rem 0' }}>No co-hosts yet. Add one above.</p>
          )}
        </section>

        <div className="es-help-card">
          <div className="es-help-body">
            <span className="es-help-title">Need help managing roles?</span>
            <span className="es-help-desc">Our guide explains permissions for Owner, Co-host, and Planner — and what each can edit on your behalf.</span>
          </div>
          <a href={SUPPORT_MAILTO()} className="btn-pill btn-pill-secondary">
            <span aria-hidden="true" className="material-symbols-outlined">menu_book</span>
            Read the guide
          </a>
        </div>

      </div>

      {/* Invite co-host modal — portaled so .reveal transform doesn't clip fixed scrim */}
      <Portal>
        <div
          className={`modal-scrim${modalOpen ? ' is-open' : ''}`}
          aria-hidden={!modalOpen}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="modal-card lg-glass-card" role="dialog" aria-modal="true" aria-labelledby="es-cohost-title">
            <header className="modal-head">
              <div className="modal-head-lead">
                <h2 className="modal-title" id="es-cohost-title">Invite a co-host</h2>
                <p className="modal-sub">They&apos;ll get an email invite to help manage this event.</p>
              </div>
              <button className="modal-close" type="button" onClick={closeModal} aria-label="Close">
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </header>
            <div className="form-group">
              <label className="form-label" htmlFor="es-cohost-email">Email address</label>
              <input
                id="es-cohost-email"
                type="email"
                className="form-input"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="es-cohost-role">Role</label>
              <select
                id="es-cohost-role"
                className="form-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="co-host">Co-host</option>
                <option value="photographer">Photographer</option>
                <option value="planner">Planner</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-pill btn-pill-secondary" onClick={closeModal} disabled={sending}>Cancel</button>
              <button
                type="button"
                className={`btn-pill btn-pill-primary${sending ? ' is-loading' : ''}`}
                onClick={handleSendInvite}
                disabled={sending || !email.trim()}
                aria-busy={sending}
              >
                Send invite
                <span aria-hidden="true" className="btn-pill-spinner" />
              </button>
            </div>
          </div>
        </div>
      </Portal>

      {/* Remove co-host confirm — cautionary, not type-DELETE */}
      <Portal>
        <div
          className={`modal-scrim${pendingRemove ? ' is-open' : ''}`}
          aria-hidden={!pendingRemove}
          onClick={(e) => { if (e.target === e.currentTarget) closeRemoveConfirm() }}
        >
          {pendingRemove ? (
            <div
              className="modal-card lg-glass-card modal-confirm-cautionary"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="es-remove-admin-title"
            >
              <button
                className="modal-close modal-close--corner"
                type="button"
                aria-label="Close"
                onClick={closeRemoveConfirm}
                disabled={removing}
              >
                <span aria-hidden="true" className="material-symbols-outlined">close</span>
              </button>
              <span className="modal-confirm-icon is-cautionary" aria-hidden="true">
                <span className="material-symbols-outlined">person_remove</span>
              </span>
              <h2 className="modal-confirm-title" id="es-remove-admin-title">Remove co-host?</h2>
              <p className="modal-confirm-text">
                Remove <strong>{pendingRemove.displayName}</strong>
                {pendingRemove.email ? (
                  <>
                    {' '}
                    (<span className="break-all">{pendingRemove.email}</span>)
                  </>
                ) : null}
                {' '}
                from this event. They will lose access immediately. You can invite them again later.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-pill btn-pill-secondary"
                  onClick={closeRemoveConfirm}
                  disabled={removing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-pill btn-pill-primary"
                  disabled={removing}
                  aria-busy={removing}
                  onClick={() => { void handleRemoveConfirmed() }}
                >
                  {removing ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </Portal>

      <div className={`bc-toast${toast ? ' is-show' : ''}`} role="status" aria-live="polite">
        <span className="bc-live" aria-hidden="true" />
        <span>{toast ?? ''}</span>
      </div>
    </>
  )
}
