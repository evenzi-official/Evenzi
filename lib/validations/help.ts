import { z } from 'zod'
import { HELP_QUERY_MAX_LENGTH, HELP_QUERY_MIN_LENGTH } from '@/lib/help/search'

/**
 * Every schema below uses a strict object shape so unknown keys are stripped.
 * Identity fields are never present here by design — user_id and audience are
 * derived server-side. See spec section 8.6.
 */

export const helpSearchSchema = z.object({
  q: z.string().trim().min(HELP_QUERY_MIN_LENGTH).max(HELP_QUERY_MAX_LENGTH),
})

export const createTicketSchema = z.object({
  email: z.string().trim().email().max(320),
  message: z.string().trim().min(20).max(2000),
  topicSlug: z.string().trim().toLowerCase().max(64).optional(),
  articleSlug: z.string().trim().max(128).optional(),
  pageUrl: z.string().trim().max(2048).optional(),
})

export const feedbackSchema = z.object({
  articleSlug: z.string().trim().min(1).max(128),
  helpful: z.boolean(),
})

export const queryOutcomeSchema = z.object({
  resolved: z.boolean().optional(),
  escalated: z.boolean().optional(),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>
export type FeedbackInput = z.infer<typeof feedbackSchema>
