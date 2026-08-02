import { createClient } from '@/lib/supabase/server'
import WeddingTemplate1Client from './WeddingTemplate1Client'

interface PageProps {
  searchParams: Promise<{ eventId?: string }>
}

export default async function WeddingInvitationTemp1({ searchParams }: PageProps) {
  const { eventId } = await searchParams

  let event = null
  if (eventId) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('events')
      .select('name, primary_date, primary_venue, event_details')
      .eq('id', eventId)
      .is('deleted_at', null)
      .single()
    event = data as {
      name: string | null
      primary_date: string | null
      primary_venue: string | null
      event_details: Record<string, string> | null
    } | null
  }

  return <WeddingTemplate1Client event={event} eventId={eventId ?? null} />
}
