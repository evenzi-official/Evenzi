import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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

  const { data: event } = await supabase
    .from('events')
    .select('id, name, primary_date, primary_venue, event_types ( name, slug )')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!event) {
    redirect('/home')
  }

  const eventTypeName = Array.isArray(event.event_types)
    ? event.event_types[0]?.name ?? 'event'
    : (event.event_types as { name: string; slug: string } | null)?.name ?? 'event'

  const daysUntil = event.primary_date
    ? Math.ceil((new Date(event.primary_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const showCountdown = daysUntil !== null && daysUntil > 0

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header
        className="w-full border-b"
        style={{
          background: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
          <span
            className="text-xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Evenzi
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="w-full max-w-2xl mx-auto text-center">
          {/* Hero */}
          <div className="mb-10">
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              You&apos;re All Set! 🎉
            </h1>
            <p
              className="text-xl sm:text-2xl"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Your {eventTypeName} dashboard is ready for you.
            </p>
          </div>

          {/* Quick action cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            {/* Days countdown — only if date is set and in the future */}
            {showCountdown && (
              <div
                className="flex flex-col items-center justify-center gap-2 rounded-2xl p-6"
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <span className="text-4xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {daysUntil}
                </span>
                <span
                  className="text-sm font-medium uppercase tracking-wide"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Days to go
                </span>
              </div>
            )}

            {/* Checklist */}
            <div
              className="flex flex-col items-center justify-center gap-2 rounded-2xl p-6"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <span className="text-3xl">📋</span>
              <span
                className="text-base font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Empty Checklist
              </span>
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Start adding tasks
              </span>
            </div>

            {/* Add Guests */}
            <div
              className="flex flex-col items-center justify-center gap-2 rounded-2xl p-6"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <span className="text-3xl">👥</span>
              <span
                className="text-base font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Add Guests
              </span>
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Invite your people
              </span>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/home"
            className="inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-full shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-200 text-lg text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            Go to Dashboard →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="w-full border-t py-6"
        style={{
          background: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            © 2026 Evenzi. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
