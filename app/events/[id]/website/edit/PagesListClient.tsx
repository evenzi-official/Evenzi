'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'

type Page = {
  id: string
  slug: string
  label: string
  icon: string
  tier: string
  is_visible: boolean
  custom_title: string | null
  display_order: number
}

export default function PagesListClient({ eventId, initialPages }: { eventId: string; initialPages: Page[] }) {
  const [pages, setPages] = useState(initialPages)
  const [toggling, setToggling] = useState<string | null>(null)

  async function toggleVisibility(page: Page) {
    if (toggling) return
    const newVal = !page.is_visible
    setToggling(page.id)
    setPages((prev) => prev.map((p) => p.id === page.id ? { ...p, is_visible: newVal } : p))

    try {
      const res = await fetch(`/api/events/${eventId}/website-pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible: newVal }),
      })
      if (!res.ok) {
        setPages((prev) => prev.map((p) => p.id === page.id ? { ...p, is_visible: page.is_visible } : p))
      }
    } catch {
      setPages((prev) => prev.map((p) => p.id === page.id ? { ...p, is_visible: page.is_visible } : p))
    } finally {
      setToggling(null)
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const next = index + direction
    if (next < 0 || next >= pages.length) return

    const newPages = [...pages]
    ;[newPages[index], newPages[next]] = [newPages[next], newPages[index]]
    const reordered = newPages.map((p, i) => ({ ...p, display_order: i }))
    setPages(reordered)

    await fetch(`/api/events/${eventId}/website-pages`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: reordered.map((p) => ({ id: p.id, display_order: p.display_order })) }),
    }).catch(() => setPages(pages))
  }

  return (
    <section className="clay-card reveal mt-6">
      <div className="flex items-center justify-between p-6 border-b border-line">
        <h2 className="font-display font-bold text-base text-ink">All pages</h2>
        <span className="text-xs text-muted">{pages.filter((p) => p.is_visible).length} of {pages.length} visible</span>
      </div>

      <ul role="list" className="divide-y divide-line">
        {pages.map((pg, i) => (
          <li key={pg.id} className="flex items-center gap-3 p-4">
            {/* Reorder buttons */}
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="dp-icon-btn w-6 h-6 disabled:opacity-30"
                aria-label="Move up"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>keyboard_arrow_up</span>
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === pages.length - 1}
                className="dp-icon-btn w-6 h-6 disabled:opacity-30"
                aria-label="Move down"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>keyboard_arrow_down</span>
              </button>
            </div>

            {/* Icon */}
            <span aria-hidden="true" className="w-10 h-10 rounded-2xl bg-brand-tint text-brand flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined icon-fill">{pg.icon}</span>
            </span>

            {/* Label + tier */}
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-sm text-ink">{pg.label}</p>
              <p className="text-xs text-muted">{pg.tier === 'private' ? 'Private — guests must identify themselves' : 'Public — visible to all visitors'}</p>
            </div>

            <StatusBadge variant={pg.is_visible ? 'live' : 'draft'}>
              {pg.is_visible ? 'Visible' : 'Hidden'}
            </StatusBadge>

            {/* Visibility toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={pg.is_visible}
              aria-label={`${pg.is_visible ? 'Hide' : 'Show'} ${pg.label}`}
              onClick={() => toggleVisibility(pg)}
              disabled={toggling === pg.id}
              className="toggle-switch shrink-0"
            >
              <span className="toggle-switch-thumb" aria-hidden="true" />
            </button>

            {/* Edit arrow */}
            <Link
              href={`/events/${eventId}/website/edit/${pg.slug}`}
              className="shrink-0 dp-icon-btn"
              aria-label={`Edit ${pg.label} page`}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
