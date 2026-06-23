import { createClient } from '@/lib/supabase/server'
import { mapEventTypeRow, type EventType, type EventTypeRow } from '@/lib/types/events'
import { WizardShell } from './WizardShell'

// The event-types catalog is tiny + static — fetch it on the server so Step 1
// renders instantly with no client round-trip / loading spinner (M1).
export default async function CreateEventPage(): Promise<React.JSX.Element> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .schema('config')
    .from('event_types')
    .select('*')
    .eq('enabled', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('CreateEventPage: failed to load event types:', error)
  }

  const eventTypes: EventType[] = ((data as EventTypeRow[] | null) ?? []).map(mapEventTypeRow)

  return <WizardShell eventTypes={eventTypes} />
}
