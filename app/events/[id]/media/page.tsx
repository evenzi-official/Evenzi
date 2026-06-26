import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import { MediaClient } from './MediaClient'

export default async function MediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('events').select('id, name').eq('id', id).single()
  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

  return (
    <div data-page="media">
      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: eventName.toUpperCase(), href: `/events/${id}` },
          { label: 'MEDIA' },
        ]}
        backHref={`/events/${id}`}
      />
      <main className="page-band pt-10 pb-24" id="md-main">
        <MediaClient eventName={eventName} />
      </main>
      <PageFooter />
    </div>
  )
}
