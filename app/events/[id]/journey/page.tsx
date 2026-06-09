import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'

export default async function JourneyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('events').select('id, name').eq('id', id).single()
  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

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

        {/* Sub-events list — empty state */}
        <section className="reveal mt-8">
          <div className="clay-card p-8 md:p-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-display font-bold tracking-[0.35em] text-brand mb-1">SUB-EVENTS</p>
                <h2 className="font-display font-bold text-2xl text-ink">Functions &amp; ceremonies</h2>
              </div>
              <button type="button" className="btn-pill btn-pill-primary">
                <span aria-hidden="true" className="material-symbols-outlined">add</span>
                Add sub-event
                <span aria-hidden="true" className="btn-pill-spinner" />
              </button>
            </div>

            <div className="empty-cta-card">
              <span className="empty-cta-icon" aria-hidden="true">
                <span className="material-symbols-outlined">event</span>
              </span>
              <p className="empty-cta-title">No sub-events yet</p>
              <p className="empty-cta-sub">Add ceremonies, functions, and celebrations to build your full wedding roadmap.</p>
              <button type="button" className="btn-pill btn-pill-primary">
                <span className="material-symbols-outlined" aria-hidden="true">add</span>
                Add your first sub-event
                <span aria-hidden="true" className="btn-pill-spinner" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <PageFooter />
    </div>
  )
}
