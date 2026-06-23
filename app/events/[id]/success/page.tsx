import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

interface SuccessPageProps {
  params: Promise<{ id: string }>
}

export default async function EventSuccessPage({ params }: SuccessPageProps): Promise<React.JSX.Element> {
  const { id } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // 1) Existence + ownership guard. Plain public select (no cross-schema embed) —
  //    embedding config.event_types from public.events triggers PGRST200 and used
  //    to silently bounce the user to /home. Distinguish a genuine miss from a
  //    query failure: notFound() only when the row is truly absent.
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, name, primary_date, primary_venue, event_type_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (eventError) {
    console.error('[event-success] events query failed:', eventError)
    throw new Error('Failed to load event')
  }
  if (!event) {
    notFound()
  }

  // 2) Resolve the event type from the config catalog separately (direct schema
  //    access works; embedding it across schemas does NOT → PGRST200), then join
  //    in JS — the pattern used in app/events/[id]/page.tsx and the events API.
  let eventTypeName = 'event'
  if (event.event_type_id) {
    const { data: eventType, error: eventTypeError } = await supabase
      .schema('config')
      .from('event_types')
      .select('id, name, slug')
      .eq('id', event.event_type_id)
      .maybeSingle()

    if (eventTypeError) {
      console.error('[event-success] config.event_types query failed:', eventTypeError)
      throw new Error('Failed to load event type')
    }

    if (eventType?.name) {
      eventTypeName = eventType.name
    }
  }

  const daysUntil = event.primary_date
    ? Math.ceil(
        (new Date(event.primary_date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24),
      )
    : null

  const showCountdown = daysUntil !== null && daysUntil > 0

  return (
    <div className="page-bg page-shell" data-page="event-success">
      {/* Header — shell page-shell primitives */}
      <header className="page-shell-header">
        <Link href="/home" className="page-logo" aria-label="Evenzi home">
          Evenzi
        </Link>
        <span className="page-eyebrow" aria-hidden="true">
          Celebratory Curator
        </span>
        <div className="page-shell-actions">
          <ThemeToggle className="page-theme-toggle" />
        </div>
      </header>

      <main className="page-main page-main-center">
        <section
          className="clay-card"
          aria-labelledby="success-title"
          style={{ maxWidth: '560px', width: '100%', textAlign: 'center', padding: '2.5rem 2rem' }}
        >
          <h1
            id="success-title"
            className="font-display font-bold text-ink"
            style={{ fontSize: '2rem', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}
          >
            You&apos;re all set!
          </h1>
          <p className="text-muted" style={{ fontSize: '1.05rem', marginBottom: '2rem' }}>
            Your {eventTypeName} dashboard is ready for you.
          </p>

          {/* Countdown — hero-meta-chip shell primitive */}
          {showCountdown && (
            <div className="flex items-center justify-center" style={{ marginBottom: '2rem' }}>
              <span className="hero-meta-chip">
                <span aria-hidden="true" className="hero-meta-icon">
                  <span className="material-symbols-outlined icon-fill icon-sm-18">celebration</span>
                </span>
                <span className="hero-meta-text">
                  <span className="hero-meta-label">The celebration</span>
                  <span className="hero-meta-value">
                    {daysUntil} {daysUntil === 1 ? 'day' : 'days'} to go
                  </span>
                </span>
              </span>
            </div>
          )}

          {/* Quick-glance stats — stats-strip-card shell primitive */}
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginBottom: '2rem', textAlign: 'left' }}
          >
            <div className="stats-strip-card flex items-center gap-3" style={{ padding: '1rem' }}>
              <span aria-hidden="true" className="stat-icon">
                <span className="material-symbols-outlined icon-fill">checklist_rtl</span>
              </span>
              <div className="min-w-0">
                <p className="font-display font-bold text-ink leading-none" style={{ fontSize: '0.95rem' }}>
                  Checklist
                </p>
                <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                  Start adding tasks
                </p>
              </div>
            </div>
            <div className="stats-strip-card flex items-center gap-3" style={{ padding: '1rem' }}>
              <span aria-hidden="true" className="stat-icon">
                <span className="material-symbols-outlined icon-fill">groups</span>
              </span>
              <div className="min-w-0">
                <p className="font-display font-bold text-ink leading-none" style={{ fontSize: '0.95rem' }}>
                  Guests
                </p>
                <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                  Invite your people
                </p>
              </div>
            </div>
          </div>

          {/* CTA — btn-pill primitive */}
          <Link href={`/events/${event.id}`} className="btn-pill btn-pill-primary btn-pill-lg">
            <span>Go to dashboard</span>
            <span aria-hidden="true" className="material-symbols-outlined">
              arrow_forward
            </span>
          </Link>
        </section>
      </main>

      <footer className="page-shell-footer">© 2026 Evenzi · Crafted with care</footer>
    </div>
  )
}
