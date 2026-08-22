'use client'
import React, { useState } from 'react'
import { useBusy } from '@/components/ui/BusyProvider'

type FakeTheme = { id: string; label: string; preview: string }

type Props = {
  eventId: string
  initialDesign: { template_id: string | null; palette_id: string | null; heading_font_id: string | null; body_font_id: string | null } | null
  cinematicTemplateId: string | null
  fakeThemes: readonly FakeTheme[]
  cinematicCard: React.ReactNode
}

export default function WebsiteDesignClient({ eventId, initialDesign, cinematicTemplateId, fakeThemes, cinematicCard }: Props) {
  // Track selection as slugs internally; map to/from DB UUID via cinematicTemplateId
  const initialSlug = initialDesign?.template_id && cinematicTemplateId && initialDesign.template_id === cinematicTemplateId
    ? 'cinematic-scroll'
    : null

  const { runBusy } = useBusy()
  const [selected, setSelected] = useState<string | null>(initialSlug)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function resolveUuid(slug: string | null): string | null {
    if (slug === 'cinematic-scroll') return cinematicTemplateId
    return null
  }

  async function handleApply() {
    setSaving(true)
    setSaved(false)
    try {
      await runBusy(async () => {
        const res = await fetch(`/api/events/${eventId}/website-design`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template_id: resolveUuid(selected) }),
        })
        if (res.ok) setSaved(true)
      }, 'Applying…')
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
          disabled={saving || !cinematicTemplateId}
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

        {/* Fake/placeholder theme cards — disabled until catalog is built */}
        {fakeThemes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            disabled
            className="group relative rounded-3xl overflow-hidden aspect-video cursor-not-allowed border-2 border-transparent opacity-60"
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
