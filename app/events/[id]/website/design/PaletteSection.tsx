'use client'

import { useState } from 'react'
import { useBusy } from '@/components/ui/BusyProvider'

export type PaletteOption = {
  id: string
  name: string
  swatch_hex: string[]
}

export default function PaletteSection({
  eventId,
  palettes,
  initialPaletteId,
}: {
  eventId: string
  palettes: PaletteOption[]
  initialPaletteId: string | null
}) {
  const { runBusy } = useBusy()
  const [selected, setSelected] = useState<string | null>(initialPaletteId)
  const [saving, setSaving] = useState(false)

  async function select(id: string) {
    if (saving || id === selected) return
    const prev = selected
    setSelected(id)
    setSaving(true)
    try {
      await runBusy(async () => {
        const res = await fetch(`/api/events/${eventId}/website-design`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ palette_id: id }),
        })
        if (!res.ok) setSelected(prev)
      }, 'Saving palette…')
    } catch {
      setSelected(prev)
    } finally {
      setSaving(false)
    }
  }

  if (palettes.length === 0) {
    return <p className="text-sm text-muted">No palettes available yet.</p>
  }

  return (
    <div className="dp-tile-grid-sm" role="radiogroup" aria-label="Colour palette">
      {palettes.map((p) => {
        const stops = (p.swatch_hex ?? []).slice(0, 3)
        const isSelected = selected === p.id
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`dp-palette-tile${isSelected ? ' is-selected' : ''}`}
            onClick={() => select(p.id)}
            disabled={saving}
          >
            <span className="dp-palette-swatches" aria-hidden="true">
              {stops.map((hex, i) => (
                <span key={`${p.id}-${i}`} style={{ background: hex }} />
              ))}
            </span>
            <span className="dp-palette-name">{p.name}</span>
            <span className="dp-palette-check" aria-hidden="true">
              <span className="material-symbols-outlined">check</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
