'use client'
import React, { useState } from 'react'

type FakeTheme = { id: string; label: string; preview: string }

type Props = {
  eventId: string
  initialDesign: { template_id: string | null; palette_id: string | null; heading_font_id: string | null; body_font_id: string | null } | null
  fakeThemes: readonly FakeTheme[]
  cinematicCard: React.ReactNode
}

export default function WebsiteDesignClient({ eventId, initialDesign, fakeThemes, cinematicCard }: Props) {
  const [selected, setSelected] = useState<string | null>(initialDesign?.template_id ?? null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleApply() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/events/${eventId}/website-design`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: selected }),
      })
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={handleApply}
          disabled={saving}
          className="btn-pill btn-pill-primary"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Apply'}
          <span aria-hidden="true" className="btn-pill-spinner" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Live template card */}
        <div
          onClick={() => setSelected('cinematic-scroll')}
          className={`relative cursor-pointer rounded-3xl overflow-hidden border-2 transition-all ${selected === 'cinematic-scroll' ? 'border-brand ring-2 ring-brand/30' : 'border-transparent'}`}
        >
          {cinematicCard}
          {selected === 'cinematic-scroll' && (
            <div className="absolute inset-0 ring-2 ring-brand rounded-3xl pointer-events-none" />
          )}
        </div>

        {/* Fake/placeholder theme cards */}
        {fakeThemes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => setSelected(theme.id)}
            className={`group relative rounded-3xl overflow-hidden aspect-video cursor-pointer border-2 transition-all ${selected === theme.id ? 'border-brand ring-2 ring-brand/30' : 'border-transparent hover:border-brand/30'}`}
          >
            <div className={`w-full h-full ${theme.preview}`} />
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/40 to-transparent">
              <p className="font-display font-bold text-xs text-white">{theme.label}</p>
            </div>
            <div className="absolute top-2 right-2">
              <span className="bg-black/40 text-white/70 text-[10px] font-display font-bold px-2 py-0.5 rounded-full">Soon</span>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}
