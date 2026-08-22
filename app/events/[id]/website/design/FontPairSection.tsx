'use client'
import { useState } from 'react'
import { FontPicker } from './FontPicker'
import { useBusy } from '@/components/ui/BusyProvider'

type FontOption = { id: string; name: string }

type Props = {
  eventId: string
  headingOptions: FontOption[]
  initialHeadingFontId: string | null
}

export default function FontPairSection({ eventId, headingOptions, initialHeadingFontId }: Props) {
  const findName = (options: FontOption[], id: string | null) =>
    options.find((o) => o.id === id)?.name ?? options[0]?.name ?? ''

  const { runBusy } = useBusy()
  const [headingFontId, setHeadingFontId] = useState(initialHeadingFontId ?? headingOptions[0]?.id ?? null)
  const [saving, setSaving] = useState(false)

  async function save(value: string | null) {
    setSaving(true)
    try {
      await runBusy(() => fetch(`/api/events/${eventId}/website-design`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heading_font_id: value }),
      }), 'Saving font…')
    } finally {
      setSaving(false)
    }
  }

  function handleHeadingChange(name: string) {
    const option = headingOptions.find((o) => o.name === name)
    if (!option) return
    setHeadingFontId(option.id)
    void save(option.id)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FontPicker
        label={`Heading font${saving ? ' (saving…)' : ''}`}
        value={findName(headingOptions, headingFontId)}
        options={headingOptions.map((o) => o.name)}
        onChange={handleHeadingChange}
      />
      <div className="form-group">
        <label className="form-label">Body text</label>
        <p className="text-sm text-muted font-display" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Body text stays Poppins for clarity — your headings define your style.
        </p>
      </div>
    </div>
  )
}
