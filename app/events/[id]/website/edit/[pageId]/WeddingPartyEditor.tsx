'use client'
import React, { useState } from 'react'
import { useBusy } from '@/components/ui/BusyProvider'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

type Member = {
  id: string
  name: string
  side: 'bride' | 'groom' | 'neutral'
  relation: string | null
  photo_key: string | null
  is_visible: boolean
  display_order: number
}

const SIDES = [
  { value: 'bride',   label: "Bride's side" },
  { value: 'groom',   label: "Groom's side" },
  { value: 'neutral', label: 'Both / Neutral' },
] as const

export default function WeddingPartyEditor({ eventId, initialMembers }: { eventId: string; initialMembers: Member[] }) {
  const { runBusy } = useBusy()
  const [members, setMembers] = useState(initialMembers)
  const [pending, setPending] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<{ name: string; side: Member['side']; relation: string }>({ name: '', side: 'bride', relation: '' })
  const [confirmDelete, setConfirmDelete] = useState<Member | null>(null)
  const [deleting, setDeleting] = useState(false)
  async function addMember() {
    if (!form.name.trim()) return
    setPending('new')
    try {
      await runBusy(async () => {
        const res = await fetch(`/api/events/${eventId}/wedding-party`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            side: form.side,
            relation: form.relation.trim() || null,
            display_order: members.length,
          }),
        })
        if (res.ok) {
          const { member } = await res.json() as { member: Member }
          setMembers((prev) => [...prev, member])
          setForm({ name: '', side: 'bride', relation: '' })
          setShowForm(false)
        }
      }, 'Adding…')
    } finally { setPending(null) }
  }

  async function deleteMember(member: Member) {
    setDeleting(true)
    setMembers((prev) => prev.filter((m) => m.id !== member.id))
    try {
      await runBusy(
        () => fetch(`/api/events/${eventId}/wedding-party/${member.id}`, { method: 'DELETE' })
          .then((res) => { if (!res.ok) throw new Error('delete failed') })
          .catch(() => setMembers((prev) => [...prev, member].sort((a, b) => a.display_order - b.display_order))),
        'Removing…',
      )
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  async function toggleVisibility(member: Member) {
    if (pending) return
    const newVal = !member.is_visible
    setPending(member.id)
    setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, is_visible: newVal } : m))
    const res = await fetch(`/api/events/${eventId}/wedding-party/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_visible: newVal }),
    })
    if (!res.ok) setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, is_visible: member.is_visible } : m))
    setPending(null)
  }

  const bySide = (side: Member['side']) => members.filter((m) => m.side === side)

  return (
    <div className="space-y-6 mt-6">
      {(['bride', 'groom', 'neutral'] as const).map((side) => {
        const group = bySide(side)
        if (group.length === 0) return null
        return (
          <div key={side}>
            <h3 className="font-display font-bold text-sm text-muted mb-3 uppercase tracking-wider">
              {SIDES.find((s) => s.value === side)?.label}
            </h3>
            <div className="space-y-2">
              {group.map((member) => (
                <div key={member.id} className={`clay-card flex items-center gap-3 p-4 ${!member.is_visible ? 'opacity-60' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-brand-tint text-brand flex items-center justify-center shrink-0 font-display font-bold text-sm">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-sm text-ink">{member.name}</p>
                    {member.relation && <p className="text-xs text-muted">{member.relation}</p>}
                  </div>
                  <button type="button" onClick={() => toggleVisibility(member)} disabled={!!pending} className="dp-icon-btn" aria-label={member.is_visible ? 'Hide' : 'Show'}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{member.is_visible ? 'visibility' : 'visibility_off'}</span>
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(member)} disabled={!!pending || deleting} className="dp-icon-btn" aria-label="Remove member">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {members.length === 0 && !showForm && (
        <div className="clay-card p-8 text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-muted" aria-hidden="true">people</span>
          <p className="font-display font-bold text-sm text-ink">No wedding party members yet</p>
          <p className="text-xs text-muted">Add bridesmaids, groomsmen, and more.</p>
        </div>
      )}

      {showForm ? (
        <div className="clay-card p-5 space-y-4">
          <h3 className="font-display font-bold text-sm text-ink">Add member</h3>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" />
          </div>
          <div className="form-group">
            <label className="form-label">Side</label>
            <select className="form-select" value={form.side} onChange={(e) => setForm((f) => ({ ...f, side: e.target.value as Member['side'] }))}>
              {SIDES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Role / relation</label>
            <input className="form-input" value={form.relation} onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))} placeholder="e.g. Maid of honour, Best man…" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-pill btn-pill-secondary btn-pill-sm">Cancel</button>
            <button type="button" onClick={addMember} disabled={!form.name.trim() || pending === 'new'} className="btn-pill btn-pill-primary btn-pill-sm">
              {pending === 'new' ? 'Adding…' : 'Add'}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowForm(true)} className="btn-pill btn-pill-secondary">
          <span className="material-symbols-outlined" aria-hidden="true">person_add</span>
          Add member
        </button>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        tone="danger"
        title="Remove this member?"
        message={confirmDelete ? <>Remove <strong>{confirmDelete.name}</strong> from the wedding party. This can&apos;t be undone.</> : ''}
        confirmLabel="Remove"
        busy={deleting}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) void deleteMember(confirmDelete) }}
      />
    </div>
  )
}
