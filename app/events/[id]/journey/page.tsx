import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'

interface SubEventRow {
  id: string
  custom_name: string | null
  event_date: string | null
  venue: string | null
  display_order: number | null
  event_sub_types: { name: string } | { name: string }[] | null
}

function subEventLabel(row: SubEventRow): string {
  const custom = row.custom_name?.trim()
  if (custom) return custom
  const t = row.event_sub_types
  if (Array.isArray(t)) return t[0]?.name ?? 'Celebration'
  return t?.name ?? 'Celebration'
}

export default async function JourneyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('events').select('id, name').eq('id', id).single()
  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

  const { data: subRows } = await supabase
    .from('event_sub_events')
    .select('id, custom_name, event_date, venue, display_order, event_sub_types(name)')
    .eq('event_id', id)
    .order('display_order', { ascending: true })

  const subEvents = (subRows ?? []) as SubEventRow[]

  return (
    <div data-page="our-journey">
      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: eventName.toUpperCase(), href: `/events/${id}` },
          { label: 'OUR JOURNEY' },
        ]}
        backHref={`/events/${id}`}
      />

      <main className="page-band pt-6 md:pt-8 pb-24">
        <header className="section-head reveal">
          <p className="section-head-eyebrow">Timeline</p>
          <div className="section-head-titlerow">
            <h1 className="section-head-title">Our Journey</h1>
          </div>
          <p className="section-head-sub">All sub-events and milestones for {eventName}.</p>
        </header>

        <section className="reveal mt-8">
          <div className="clay-card p-8 md:p-10">
            <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
              <div>
                <p className="text-xs font-display font-bold tracking-[0.35em] text-brand mb-1">SUB-EVENTS</p>
                <h2 className="font-display font-bold text-2xl text-ink">Functions &amp; ceremonies</h2>
              </div>
              <Link href={`/events/${id}`} className="btn-pill btn-pill-primary">
                <span aria-hidden="true" className="material-symbols-outlined">edit_calendar</span>
                Manage on event hub
              </Link>
            </div>

            {subEvents.length === 0 ? (
              <div className="empty-cta-card">
                <span className="empty-cta-icon" aria-hidden="true">
                  <span className="material-symbols-outlined">event</span>
                </span>
                <p className="empty-cta-title">No sub-events yet</p>
                <p className="empty-cta-sub">
                  Add ceremonies and celebrations when you create or edit your event. They’ll show up here as your roadmap.
                </p>
                <Link href={`/events/${id}`} className="btn-pill btn-pill-primary">
                  <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
                  Back to event hub
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col gap-3" role="list" aria-label="Sub-events">
                {subEvents.map((se) => (
                  <li key={se.id} className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3">
                    <div>
                      <p className="font-display font-bold text-ink">{subEventLabel(se)}</p>
                      <p className="text-sm text-[var(--muted)] mt-0.5">
                        {[se.event_date, se.venue].filter(Boolean).join(' · ') || 'Date & venue TBD'}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-[var(--muted)]" aria-hidden="true">celebration</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      <PageFooter />
    </div>
  )
}
