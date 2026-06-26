import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageFooter } from '@/components/layout/PageFooter'
import { GuestListContent } from './GuestListContent'

export default async function GuestListSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: ev } = await supabase.from('events').select('id').eq('id', id).is('deleted_at', null).single()
  if (!ev) redirect('/home')

  const { data: gs } = await supabase
    .from('event_guest_settings')
    .select('rsvp_enabled, allow_plus_ones, max_plus_ones_per_invite, collect_dietary_notes, default_guest_message')
    .eq('event_id', id)
    .single()

  return (
    <main className="page-band reveal pt-6 md:pt-8 pb-24">
      <GuestListContent
        eventId={id}
        initial={{
          rsvpEnabled:          gs?.rsvp_enabled             ?? true,
          allowPlusOnes:        gs?.allow_plus_ones          ?? true,
          maxPlusOnesPerInvite: gs?.max_plus_ones_per_invite ?? 2,
          collectDietaryNotes:  gs?.collect_dietary_notes    ?? true,
          defaultGuestMessage:  gs?.default_guest_message    ?? '',
        }}
      />
      <PageFooter />
    </main>
  )
}
