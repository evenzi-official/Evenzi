'use client'
import React, { useState } from 'react'
import Link from 'next/link'

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
    <section className="clay-card dp-card reveal mt-6">
      <header className="dp-card-head">
        <div>
          <h2 className="dp-card-title">All pages</h2>
          <p className="dp-card-sub">{pages.filter((p) => p.is_visible).length} of {pages.length} visible</p>
        </div>
      </header>

      <ul role="list" className="dp-page-list">
        {pages.map((pg, i) => {
          const isPrivate = pg.tier === 'private'
          return (
            <li key={pg.id} className={`page-list-row${pg.is_visible ? '' : ' is-hidden'}`}>
              <button
                className="dp-drag"
                type="button"
                aria-disabled="true"
                title="keyboard reorder coming soon"
                aria-label={`Reorder ${pg.label} — drag coming soon`}
              >
                <span className="material-symbols-outlined" aria-hidden="true">drag_indicator</span>
              </button>

              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="dp-icon-btn-sm disabled:opacity-30"
                  aria-label="Move up"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>keyboard_arrow_up</span>
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === pages.length - 1}
                  className="dp-icon-btn-sm disabled:opacity-30"
                  aria-label="Move down"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>keyboard_arrow_down</span>
                </button>
              </div>

              <div className="dp-page-meta">
                <span className="material-symbols-outlined dp-page-icon" aria-hidden="true">{pg.icon}</span>
                <span className="dp-page-name">{pg.label}</span>
                {isPrivate ? (
                  <span className="dp-page-tier dp-tier-private" title="Private — guest must unlock">
                    <span className="material-symbols-outlined" aria-hidden="true">lock</span>
                    Private
                  </span>
                ) : (
                  <span className="dp-page-tier dp-tier-public">Public</span>
                )}
              </div>

              <div className="dp-page-actions">
                <button
                  type="button"
                  className="dp-icon-btn-sm"
                  aria-label={pg.is_visible ? `Hide ${pg.label}` : `Show ${pg.label}`}
                  onClick={() => toggleVisibility(pg)}
                  disabled={toggling === pg.id}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {pg.is_visible ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
                <Link
                  href={`/events/${eventId}/website/edit/${pg.slug}`}
                  className="dp-icon-btn-sm"
                  aria-label={`Edit ${pg.label}`}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
                </Link>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
