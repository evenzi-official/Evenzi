import { z } from 'zod'

export const updateProfileSchema = z.object({
  display_name: z.string().trim().min(1, 'Name is required').max(100),
}).strict()

export const updateNotificationsSchema = z.object({
  email_alerts:       z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  sms_alerts:         z.boolean().optional(),
}).strict()
