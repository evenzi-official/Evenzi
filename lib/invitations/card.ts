import type { SupabaseClient } from '@supabase/supabase-js'

export const CARD_SELECT =
  'id, template_id, is_custom, slot_eyebrow, slot_couple, slot_invite, slot_date, ' +
  'slot_time, slot_venue, slot_message, slot_sizes, card_upload_key, photo_bg_key, ' +
  'share_token, share_enabled'

export function slotsToColumns(slots: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(slots)) {
    if (v !== undefined) out[`slot_${k}`] = v
  }
  return out
}

// Fetch the default main-event card; returns null if unseeded.
export async function fetchDefaultCard(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  eventId: string
) {
  const { data, error } = await supabase
    .from('event_invitation_cards')
    .select(CARD_SELECT)
    .eq('event_id', eventId).eq('is_default', true).is('sub_event_id', null)
    .maybeSingle()
  if (error) throw error
  return data
}
