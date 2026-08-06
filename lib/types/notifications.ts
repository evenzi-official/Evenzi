export type NotificationType =
  | 'rsvp_received'
  | 'collaborator_added'
  | 'expense_recorded'
  | 'invites_sent'

export interface AppNotification {
  id: string
  userId: string
  eventId: string
  type: NotificationType
  title: string
  body: string
  linkPath: string | null
  readAt: string | null
  createdAt: string
  updatedAt: string
}

export interface NotificationRow {
  id: string
  user_id: string
  event_id: string
  type: string
  title: string
  body: string
  link_path: string | null
  read_at: string | null
  created_at: string
  updated_at: string
}

export function toAppNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    eventId: row.event_id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    linkPath: row.link_path,
    readAt: row.read_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
