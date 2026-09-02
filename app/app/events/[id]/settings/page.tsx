import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageFooter } from '@/components/layout/PageFooter'
import { GeneralSettingsForm, type GeneralSettingsEvent } from './GeneralSettingsForm'

export default async function GeneralSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: event }, { data: gs }] = await Promise.all([
    supabase
      .from('events')
      .select('id, name, primary_date, primary_venue, event_details')
      .eq('id', id)
      .is('deleted_at', null)
      .single(),
    supabase
      .from('event_general_settings')
      .select('tagline')
      .eq('event_id', id)
      .single(),
  ])
  if (!event) redirect('/home')

  const eventDetails = (event.event_details ?? {}) as Record<string, string>

  const initial: GeneralSettingsEvent = {
    id:               event.id,
    name:             event.name,
    primaryDate:      event.primary_date,
    primaryVenue:     event.primary_venue,
    city:             eventDetails['city'] ?? null,
    eventDetails,
    tagline:          gs?.tagline          ?? null,
  }

  return (
    <main className="page-band reveal pt-6 md:pt-8 pb-24">
      <GeneralSettingsForm event={initial} />
      <PageFooter />
    </main>
  )
}
