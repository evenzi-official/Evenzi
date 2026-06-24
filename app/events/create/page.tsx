import { createClient } from '@/lib/supabase/server'
import {
  mapEventTypeRow,
  mapSubEventTypeRow,
  type EventType,
  type EventTypeRow,
  type SubEventType,
  type SubEventTypeRow,
} from '@/lib/types/events'
import { WizardShell } from './WizardShell'

// The event-types catalog is tiny + static — fetch it on the server so Step 1
// renders instantly with no client round-trip / loading spinner (M1).
//
// Sub-event types are also tiny + static. The chosen event type is picked
// client-side in Step 1, so we can't filter server-side — instead we fetch the
// full enabled catalog and group it by event_type_id, then Step 3 reads its own
// type's entries from the map with no client fetch / load delay (M14). If a
// type isn't in the map (catalog miss), Step 3 falls back to its client fetch.
export default async function CreateEventPage(): Promise<React.JSX.Element> {
  const supabase = await createClient()

  const [typesRes, subTypesRes] = await Promise.all([
    supabase
      .schema('config')
      .from('event_types')
      .select('*')
      .eq('enabled', true)
      .order('display_order', { ascending: true }),
    supabase
      .schema('config')
      .from('event_sub_types')
      .select('*')
      .eq('enabled', true)
      .order('display_order', { ascending: true }),
  ])

  if (typesRes.error) {
    console.error('CreateEventPage: failed to load event types:', typesRes.error)
  }
  if (subTypesRes.error) {
    console.error('CreateEventPage: failed to load sub-event types:', subTypesRes.error)
  }

  const eventTypes: EventType[] = ((typesRes.data as EventTypeRow[] | null) ?? []).map(mapEventTypeRow)

  // Group sub-types by their event_type_id for O(1) lookup in Step 3.
  const subEventTypesByType: Record<string, SubEventType[]> = {}
  for (const row of (subTypesRes.data as SubEventTypeRow[] | null) ?? []) {
    const list = subEventTypesByType[row.event_type_id] ?? []
    list.push(mapSubEventTypeRow(row))
    subEventTypesByType[row.event_type_id] = list
  }

  return <WizardShell eventTypes={eventTypes} subEventTypesByType={subEventTypesByType} />
}
