'use client'

import { useState } from 'react'
import type { GuestRow, GuestTagOption } from '@/lib/types/guests'
import { useBusy } from '@/components/ui/BusyProvider'

interface Props {
  eventId: string
  tags: GuestTagOption[]
  guests: GuestRow[]
  onClose: () => void
  onCreated: (tag: GuestTagOption) => void
  onDeleted: (tagId: string) => void
  flashToast: (message: string) => void
}

export function TagManagerModal({ eventId, tags, guests, onClose, onCreated, onDeleted, flashToast }: Props): React.ReactElement {
  const { runBusy } = useBusy()
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  function tagCount(tagId: string): number {
    return guests.filter((g) => g.tagIds.includes(tagId)).length
  }

  async function handleAdd(): Promise<void> {
    const trimmed = input.trim()
    if (!trimmed || adding) return
    setAdding(true)
    try {
      await runBusy(async () => {
        const res = await fetch(`/api/events/${eventId}/guest-tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed }),
        })
        const data: { tag?: GuestTagOption; error?: string } = await res.json()
        if (!res.ok || !data.tag) { flashToast("Couldn't create tag."); return }
        onCreated(data.tag)
        setInput('')
        flashToast('Tag created')
      }, 'Creating tag…')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(tagId: string): Promise<void> {
    setDeleting(true)
    try {
      await runBusy(async () => {
        const res = await fetch(`/api/events/${eventId}/guest-tags/${tagId}`, { method: 'DELETE' })
        if (!res.ok) { flashToast("Couldn't remove tag."); return }
        onDeleted(tagId)
        flashToast('Tag removed')
      }, 'Removing tag…')
    } finally {
      setDeleting(false)
      setConfirmingDelete(null)
    }
  }

  return (
    <div className="modal-scrim is-open" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card lg-glass-card" role="dialog" aria-modal="true" aria-labelledby="gm-tagman-h">
        <header className="modal-head">
          <div className="modal-head-lead">
            <h2 className="modal-title" id="gm-tagman-h">Manage tags</h2>
            <p className="modal-sub">Used across all your guests.</p>
          </div>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <span aria-hidden="true" className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="gm-tagman-add">
          <input
            className="form-input" type="text" placeholder="New tag name" autoComplete="off"
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleAdd() } }}
            aria-label="New tag name"
          />
          <button type="button" className="btn-pill btn-pill-secondary" disabled={adding} onClick={() => { void handleAdd() }}>Add</button>
        </div>

        <ul className="gm-tagman-list" aria-label="Tags">
          {tags.length === 0 && <li className="gm-tagman-empty">No tags yet.</li>}
          {tags.map((t) => (
            <li key={t.id} className="gm-tagman-row">
              {confirmingDelete === t.id ? (
                <div className="gm-tagman-confirm">
                  <span className="gm-tagman-c-msg">
                    Remove &ldquo;{t.name}&rdquo;{tagCount(t.id) > 0 ? ` from ${tagCount(t.id)} guest${tagCount(t.id) === 1 ? '' : 's'}` : ''}? They keep their other tags.
                  </span>
                  <button type="button" className="gm-tagman-c-cancel" onClick={() => setConfirmingDelete(null)}>Cancel</button>
                  <button type="button" className="gm-tagman-c-del" disabled={deleting} onClick={() => { void handleDelete(t.id) }}>Remove</button>
                </div>
              ) : (
                <>
                  <span className="gm-tagman-name">{t.name}</span>
                  <span className="gm-tagman-count">{tagCount(t.id)} guest{tagCount(t.id) === 1 ? '' : 's'}</span>
                  <button type="button" className="gm-tagman-del" aria-label={`Remove tag ${t.name}`} onClick={() => setConfirmingDelete(t.id)}>
                    <span aria-hidden="true" className="material-symbols-outlined">delete</span>
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>

        <div className="modal-actions">
          <button type="button" className="btn-pill btn-pill-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}
