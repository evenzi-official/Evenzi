import { createClient } from '@/lib/supabase/server'
import type { NotificationType } from '@/lib/types/notifications'

export type { NotificationType }

export interface NotifyRecipientsParams {
  eventId: string
  actorId: string
  type: NotificationType
  title: string
  body: string
  linkPath: string
}

export async function notifyRecipientsSafe(params: NotifyRecipientsParams): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc('notify_recipients', {
      p_event_id: params.eventId,
      p_actor_id: params.actorId,
      p_type: params.type,
      p_title: params.title,
      p_body: params.body,
      p_link_path: params.linkPath,
    })
    if (error) {
      console.error('[notifyRecipientsSafe] RPC failed:', error)
    }
  } catch (err) {
    console.error('[notifyRecipientsSafe] Unexpected error:', err)
  }
}
