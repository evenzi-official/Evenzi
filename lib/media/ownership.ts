import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Verifies the authenticated user owns the given event (not soft-deleted).
 * Extracted from the inline pattern in app/api/events/[id]/admins/route.ts —
 * media routes need this on every route, including upload-url which touches
 * no Supabase table and has no RLS backstop at all.
 */
export async function assertEventOwnership(
  supabase: SupabaseClient,
  eventId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single()
  return !!data
}
