'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * Error boundary for the event dashboard route.
 * The hub page throws on a failed Supabase fetch (e.g. a transient
 * `TypeError: fetch failed`). Without this boundary the thrown error left the
 * content area BLANK until a manual refresh. Now it renders a recoverable
 * error state with a one-tap retry (reset() re-runs the server render).
 */
export default function EventError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}): React.JSX.Element {
  useEffect(() => {
    console.error('[event-dashboard] render error:', error)
  }, [error])

  return (
    <div className="page-band" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <div className="clay-card" style={{ maxWidth: '440px', textAlign: 'center', padding: '2.5rem 2rem' }}>
        <span
          className="material-symbols-outlined"
          aria-hidden="true"
          style={{ fontSize: '2.5rem', color: 'var(--brand)' }}
        >
          cloud_off
        </span>
        <h2 className="font-display" style={{ fontWeight: 700, fontSize: '1.35rem', marginTop: '0.75rem', color: 'var(--ink)' }}>
          Couldn&apos;t load this event
        </h2>
        <p style={{ color: 'var(--muted)', marginTop: '0.5rem', lineHeight: 1.5 }}>
          The connection was interrupted while loading. This is usually momentary — please try again.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn-pill btn-pill-primary" onClick={() => reset()}>
            <span className="material-symbols-outlined" aria-hidden="true">refresh</span>
            Try again
          </button>
          <Link href="/home" className="btn-pill btn-pill-secondary">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
