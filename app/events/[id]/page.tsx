import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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
    .select('id, name, event_types ( name )')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!event) {
    redirect('/home')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <nav
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Evenzi
          </div>
          <Link
            href="/home"
            className="text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="max-w-4xl mx-auto">
          <h1
            className="text-4xl sm:text-5xl font-bold mb-4 leading-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {event.name}
          </h1>
          <p
            className="text-xl mb-12"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Event Management Dashboard coming soon.
          </p>
        </div>
      </main>
    </div>
  )
}
