'use client'
import React, { useState } from 'react'
import { useBusy } from '@/components/ui/BusyProvider'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

type QAItem = {
  id: string
  question: string
  answer: string
  is_visible: boolean
  display_order: number
}

export default function QAEditor({ eventId, initialItems }: { eventId: string; initialItems: QAItem[] }) {
  const { runBusy } = useBusy()
  const [items, setItems] = useState(initialItems)
  const [pending, setPending] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ question: '', answer: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState({ question: '', answer: '' })
  const [confirmDelete, setConfirmDelete] = useState<QAItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function addItem() {
    if (!form.question.trim() || !form.answer.trim()) return
    setPending('new')
    try {
      await runBusy(async () => {
        const res = await fetch(`/api/events/${eventId}/qa-items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: form.question.trim(), answer: form.answer.trim(), display_order: items.length }),
        })
        if (res.ok) {
          const { item } = await res.json() as { item: QAItem }
          setItems((prev) => [...prev, item])
          setForm({ question: '', answer: '' })
          setShowForm(false)
        }
      }, 'Adding…')
    } finally { setPending(null) }
  }

  async function saveEdit(id: string) {
    if (pending) return
    setPending(id)
    try {
      await runBusy(async () => {
        const res = await fetch(`/api/events/${eventId}/qa-items/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: editDraft.question, answer: editDraft.answer }),
        })
        if (res.ok) {
          const { item } = await res.json() as { item: QAItem }
          setItems((prev) => prev.map((i) => i.id === id ? item : i))
          setEditingId(null)
        }
      }, 'Saving…')
    } finally { setPending(null) }
  }

  async function deleteItem(item: QAItem) {
    setDeleting(true)
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    try {
      await runBusy(
        () => fetch(`/api/events/${eventId}/qa-items/${item.id}`, { method: 'DELETE' })
          .then((res) => { if (!res.ok) throw new Error('delete failed') })
          .catch(() => setItems((prev) => [...prev, item].sort((a, b) => a.display_order - b.display_order))),
        'Deleting…',
      )
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  async function toggleVisibility(item: QAItem) {
    if (pending) return
    const newVal = !item.is_visible
    setPending(item.id)
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_visible: newVal } : i))
    const res = await fetch(`/api/events/${eventId}/qa-items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_visible: newVal }),
    })
    if (!res.ok) setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_visible: item.is_visible } : i))
    setPending(null)
  }

  return (
    <div className="space-y-4 mt-6">
      {items.length === 0 && !showForm && (
        <div className="clay-card p-8 text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-muted" aria-hidden="true">quiz</span>
          <p className="font-display font-bold text-sm text-ink">No Q&amp;A items yet</p>
          <p className="text-xs text-muted">Add questions your guests might have — dress code, parking, gifts…</p>
        </div>
      )}

      {items.map((item) => (
        <div key={item.id} className={`clay-card ${!item.is_visible ? 'opacity-60' : ''}`}>
          {editingId === item.id ? (
            <div className="p-4 space-y-3">
              <div className="form-group">
                <label className="form-label">Question</label>
                <input className="form-input" value={editDraft.question} onChange={(e) => setEditDraft((d) => ({ ...d, question: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Answer</label>
                <textarea className="form-input" rows={3} value={editDraft.answer} onChange={(e) => setEditDraft((d) => ({ ...d, answer: e.target.value }))} />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditingId(null)} className="btn-pill btn-pill-secondary btn-pill-sm">Cancel</button>
                <button type="button" onClick={() => saveEdit(item.id)} disabled={pending === item.id} className="btn-pill btn-pill-primary btn-pill-sm">
                  {pending === item.id ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4">
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm text-ink">{item.question}</p>
                <p className="text-xs text-muted mt-1">{item.answer}</p>
              </div>
              <button type="button" onClick={() => { setEditingId(item.id); setEditDraft({ question: item.question, answer: item.answer }) }}
                className="dp-icon-btn shrink-0" aria-label="Edit">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
              </button>
              <button type="button" onClick={() => toggleVisibility(item)} disabled={!!pending} className="dp-icon-btn shrink-0" aria-label={item.is_visible ? 'Hide' : 'Show'}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{item.is_visible ? 'visibility' : 'visibility_off'}</span>
              </button>
              <button type="button" onClick={() => setConfirmDelete(item)} disabled={!!pending || deleting} className="dp-icon-btn shrink-0" aria-label="Delete">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
              </button>
            </div>
          )}
        </div>
      ))}

      {showForm ? (
        <div className="clay-card p-5 space-y-3">
          <h3 className="font-display font-bold text-sm text-ink">Add Q&amp;A</h3>
          <div className="form-group">
            <label className="form-label">Question</label>
            <input className="form-input" value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} placeholder="What's the dress code?" />
          </div>
          <div className="form-group">
            <label className="form-label">Answer</label>
            <textarea className="form-input" rows={3} value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} placeholder="Smart casual. No white please!" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-pill btn-pill-secondary btn-pill-sm">Cancel</button>
            <button type="button" onClick={addItem} disabled={!form.question.trim() || !form.answer.trim() || pending === 'new'} className="btn-pill btn-pill-primary btn-pill-sm">
              {pending === 'new' ? 'Adding…' : 'Add'}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowForm(true)} className="btn-pill btn-pill-secondary">
          <span className="material-symbols-outlined" aria-hidden="true">add</span>
          Add Q&amp;A item
        </button>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        tone="danger"
        title="Delete this Q&A item?"
        message="This removes the question and answer from your website. This can't be undone."
        confirmLabel="Delete"
        busy={deleting}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) void deleteItem(confirmDelete) }}
      />
    </div>
  )
}
