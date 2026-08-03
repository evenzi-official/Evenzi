'use client'
import React, { useState } from 'react'

type Block = {
  id: string
  block_type: 'heading' | 'photo' | 'text'
  heading: string | null
  body: string | null
  photo_key: string | null
  twocol: boolean
  is_visible: boolean
  display_order: number
}

const BLOCK_TYPES: { type: Block['block_type']; label: string; icon: string }[] = [
  { type: 'heading', label: 'Heading',  icon: 'title' },
  { type: 'text',    label: 'Text',     icon: 'notes' },
  { type: 'photo',   label: 'Photo',    icon: 'image' },
]

export default function StoryEditor({ eventId, initialBlocks }: { eventId: string; initialBlocks: Block[] }) {
  const [blocks, setBlocks] = useState(initialBlocks)
  const [pending, setPending] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<Block>>({})

  async function addBlock(block_type: Block['block_type']) {
    setAdding(true)
    try {
      const res = await fetch(`/api/events/${eventId}/story-blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block_type, display_order: blocks.length }),
      })
      if (res.ok) {
        const { block } = await res.json() as { block: Block }
        setBlocks((prev) => [...prev, block])
        setEditingId(block.id)
        setDraft({ heading: block.heading, body: block.body })
      }
    } finally { setAdding(false) }
  }

  async function saveBlock(id: string) {
    if (pending) return
    setPending(id)
    try {
      const res = await fetch(`/api/events/${eventId}/story-blocks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heading: draft.heading ?? null, body: draft.body ?? null }),
      })
      if (res.ok) {
        const { block } = await res.json() as { block: Block }
        setBlocks((prev) => prev.map((b) => b.id === id ? block : b))
        setEditingId(null)
      }
    } finally { setPending(null) }
  }

  async function deleteBlock(block: Block) {
    if (pending) return
    setPending(block.id)
    setBlocks((prev) => prev.filter((b) => b.id !== block.id))
    await fetch(`/api/events/${eventId}/story-blocks/${block.id}`, { method: 'DELETE' })
      .catch(() => setBlocks((prev) => [...prev, block].sort((a, b) => a.display_order - b.display_order)))
    setPending(null)
  }

  async function toggleVisibility(block: Block) {
    if (pending) return
    const newVal = !block.is_visible
    setPending(block.id)
    setBlocks((prev) => prev.map((b) => b.id === block.id ? { ...b, is_visible: newVal } : b))
    const res = await fetch(`/api/events/${eventId}/story-blocks/${block.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_visible: newVal }),
    })
    if (!res.ok) setBlocks((prev) => prev.map((b) => b.id === block.id ? { ...b, is_visible: block.is_visible } : b))
    setPending(null)
  }

  return (
    <div className="space-y-4 mt-6">
      {blocks.length === 0 && (
        <div className="clay-card p-8 text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-muted" aria-hidden="true">auto_stories</span>
          <p className="font-display font-bold text-sm text-ink">No story blocks yet</p>
          <p className="text-xs text-muted">Add a heading or paragraph to start telling your story.</p>
        </div>
      )}

      {blocks.map((block) => (
        <div key={block.id} className={`clay-card ${!block.is_visible ? 'opacity-60' : ''}`}>
          <div className="flex items-center gap-3 p-4 border-b border-line">
            <span className="material-symbols-outlined text-brand" aria-hidden="true">
              {BLOCK_TYPES.find((t) => t.type === block.block_type)?.icon ?? 'notes'}
            </span>
            <span className="font-display font-semibold text-sm text-ink flex-1 capitalize">{block.block_type}</span>
            <button type="button" onClick={() => toggleVisibility(block)} disabled={!!pending}
              className="dp-icon-btn" aria-label={block.is_visible ? 'Hide block' : 'Show block'}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {block.is_visible ? 'visibility' : 'visibility_off'}
              </span>
            </button>
            <button type="button" onClick={() => { setEditingId(block.id); setDraft({ heading: block.heading, body: block.body }) }}
              className="dp-icon-btn" aria-label="Edit block">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
            </button>
            <button type="button" onClick={() => deleteBlock(block)} disabled={!!pending}
              className="dp-icon-btn" aria-label="Delete block">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
            </button>
          </div>

          {editingId === block.id ? (
            <div className="p-4 space-y-3">
              {(block.block_type === 'heading' || block.block_type === 'text') && (
                <>
                  {block.block_type === 'heading' && (
                    <div className="form-group">
                      <label className="form-label">Heading</label>
                      <input className="form-input" value={draft.heading ?? ''} onChange={(e) => setDraft((d) => ({ ...d, heading: e.target.value }))} placeholder="Enter heading…" />
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Body text</label>
                    <textarea className="form-textarea" rows={6} value={draft.body ?? ''} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} placeholder="Write your story…" />
                  </div>
                </>
              )}
              {block.block_type === 'photo' && (
                <p className="text-xs text-muted py-2">Photo upload — coming soon. You can upload photos from the Media section.</p>
              )}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditingId(null)} className="btn-pill btn-pill-secondary btn-pill-sm">Cancel</button>
                <button type="button" onClick={() => saveBlock(block.id)} disabled={pending === block.id} className="btn-pill btn-pill-primary btn-pill-sm">
                  {pending === block.id ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              {block.heading && <p className="font-display font-bold text-base text-ink">{block.heading}</p>}
              {block.body && <p className="text-sm text-muted mt-1 whitespace-pre-wrap">{block.body}</p>}
              {!block.heading && !block.body && <p className="text-xs text-muted italic">Empty block — click edit to add content</p>}
            </div>
          )}
        </div>
      ))}

      {/* Add block buttons */}
      <div className="flex flex-wrap gap-2 pt-2">
        {BLOCK_TYPES.map((t) => (
          <button key={t.type} type="button" onClick={() => addBlock(t.type)} disabled={adding}
            className="btn-pill btn-pill-secondary btn-pill-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{t.icon}</span>
            Add {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
