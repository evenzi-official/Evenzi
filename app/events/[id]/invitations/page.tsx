import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import { InvitationsClient } from './InvitationsClient'

export default async function InvitationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

  const defaultData = {
    eyebrow: 'Together with their families',
    couple: eventName,
    invite: 'request the pleasure of your company at the celebration of their wedding',
    date: 'Add a date',
    time: 'Add a time',
    venue: 'Add a venue',
    message: 'Reception to follow',
  }

  const rsvpUrl = `https://evenzi.com/e/${id}`

  return (
    <div data-page="invitations">
      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: eventName.toUpperCase(), href: `/events/${id}` },
          { label: 'INVITATIONS' },
        ]}
        backHref={`/events/${id}`}
      />
      <main className="page-band pt-10 pb-24" id="inv-main">
        <InvitationsClient
          eventName={eventName}
          defaultData={defaultData}
          rsvpUrl={rsvpUrl}
        />
      </main>
      <PageFooter />
    </div>
  )
}
