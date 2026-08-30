import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import { JourneyClient, type CatalogType, type JourneySubEvent } from './JourneyClient'

export default async function JourneyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('events').select('id, name').eq('id', id).single()
  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

  const { data: rawSub } = await supabase
    .from('event_sub_events')
    .select(
      'id, custom_name, event_date, start_time, venue, display_order, event_sub_type_id, show_on_website, status',
    )
    .eq('event_id', id)
    .order('display_order', { ascending: true })

  const { data: catalogRows } = await supabase
    .schema('config')
    .from('event_sub_types')
    .select('id, name, icon_name')
    .order('name', { ascending: true })

  const catalog: CatalogType[] = (catalogRows ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    icon_name: t.icon_name,
  }))
  const typeById = new Map(catalog.map((t) => [t.id, t]))

  const initialRows: JourneySubEvent[] = (rawSub ?? []).map((r) => {
    const t = r.event_sub_type_id ? typeById.get(r.event_sub_type_id) : undefined
    return {
      id: r.id,
      custom_name: r.custom_name,
      event_sub_type_id: r.event_sub_type_id,
      event_date: r.event_date,
      start_time: r.start_time,
      venue: r.venue,
      show_on_website: r.show_on_website,
      display_order: r.display_order,
      status: r.status,
      type_name: t?.name ?? null,
      icon_name: t?.icon_name ?? null,
    }
  })

  return (
    <div data-page="our-journey">
      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: eventName.toUpperCase(), href: `/events/${id}` },
          { label: 'OUR JOURNEY' },
        ]}
        backHref={`/events/${id}`}
        backLabel="EVENT CONTROL"
      />

      <main className="page-band oj-main reveal">
        <header className="section-head reveal">
          <p className="section-head-eyebrow">Our Journey</p>
          <h1 className="section-head-title">Sub-events &amp; functions</h1>
          <p className="section-head-sub">
            Add the ceremonies and functions that make up your celebration. These build the roadmap on Event Control and the schedule shown on your public event website.
          </p>
        </header>

        <JourneyClient eventId={id} initialRows={initialRows} catalog={catalog} />
      </main>

      <PageFooter />
    </div>
  )
}
