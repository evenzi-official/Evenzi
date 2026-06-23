import { z } from 'zod'

// --- Event date range (M4) ------------------------------------------------
// Event date must be today-or-later and at most 5 years out. Helpers are
// shared by the wizard picker (to disable out-of-range days) and the schema
// (to reject bypassed values server-side).

const MAX_YEARS_AHEAD = 5

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Inclusive minimum event date (today) as YYYY-MM-DD. */
export function EVENT_DATE_MIN_ISO(): string {
  return toISODate(new Date())
}

/** Inclusive maximum event date (today + 5 years) as YYYY-MM-DD. */
export function eventDateMaxISO(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + MAX_YEARS_AHEAD)
  return toISODate(d)
}

/** True when an ISO date string is within [today, today+5y]. */
export function isEventDateInRange(iso: string): boolean {
  return iso >= EVENT_DATE_MIN_ISO() && iso <= eventDateMaxISO()
}

// Step 1: event type must be selected
export const step1Schema = z.object({
  eventTypeId: z.string().uuid('Select an event type'),
})

// Step 2: dynamic metadata fields required, common fields optional
export const step2Schema = z.object({
  metadata: z.record(z.string(), z.string().min(1, 'This field is required')),
  primaryDate: z.string().nullable().optional(),
  primaryVenue: z.string().nullable().optional(),
  guestCapacity: z.coerce.number().int().positive().nullable().optional(),
})

// Step 3: at least one sub-event selected
export const step3Schema = z.object({
  selectedSubEvents: z
    .array(
      z.object({
        subEventTypeId: z.string().uuid().nullable(),
        customName: z.string().min(1).nullable(),
        name: z.string(),
        iconName: z.string().nullable(),
      })
    )
    .min(1, 'Select at least one sub-event'),
})

// Event date: ISO date, must be today-or-later and within 5 years (M4).
const eventDateField = z
  .string()
  .date()
  .refine((iso) => iso >= EVENT_DATE_MIN_ISO(), 'Event date can’t be in the past')
  .refine((iso) => iso <= eventDateMaxISO(), 'Event date must be within the next 5 years')
  .nullable()
  .optional()

// Full create event API payload — [I5] max 50 sub-events, [I6] max 500 char values, [I7] max 20 keys, [S4] min(1) aligned
export const createEventSchema = z.object({
  eventTypeId: z.string().uuid(),
  // Optional explicit event title (M3); server uses it as the event name when present.
  eventTitle: z.string().trim().min(1).max(120).nullable().optional(),
  metadata: z
    .record(z.string(), z.string().min(1).max(500))
    .refine((obj) => Object.keys(obj).length <= 20, 'Too many metadata fields (max 20)'),
  primaryDate: eventDateField,
  primaryVenue: z.string().max(500).nullable().optional(),
  guestCapacity: z.coerce.number().int().positive().max(100000).nullable().optional(),
  subEvents: z
    .array(
      z
        .object({
          subEventTypeId: z.string().uuid().nullable().optional(),
          customName: z.string().min(1).max(100).nullable().optional(),
          // Per-celebration scheduling captured in Step 3 modals (M5).
          eventDate: z
            .string()
            .date()
            .refine((iso) => iso <= eventDateMaxISO(), 'Sub-event date must be within the next 5 years')
            .nullable()
            .optional(),
          startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time').nullable().optional(),
          endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time').nullable().optional(),
          venue: z.string().max(500).nullable().optional(),
        })
        .refine(
          (data) => data.subEventTypeId != null || data.customName != null,
          'Sub-event must have either a type ID or custom name'
        )
    )
    .max(50, 'Too many sub-events (max 50)'),
  coverImageUrl: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  // M13 — a sub-event date can't cross the main Event Date. Only enforced when
  // the primary date is set; otherwise the per-field today/+5y bounds apply.
  if (!data.primaryDate) return
  data.subEvents.forEach((se, i) => {
    if (se.eventDate && se.eventDate > data.primaryDate!) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['subEvents', i, 'eventDate'],
        message: 'Sub-event date can’t be after the main event date',
      })
    }
  })
})

// Edit event API payload — partial edit of core details + a partial event_details merge.
// Mirrors the PUT /api/events/[id] contract: all fields optional, empty strings allowed
// (coerced to null server-side per the D44 empty-string rule). Used for client-side
// validation before the PUT request.
export const updateEventSchema = z
  .object({
    name: z.string().max(500).nullable().optional(),
    primary_date: z.string().nullable().optional(),
    primary_venue: z.string().max(500).nullable().optional(),
    guest_capacity: z.coerce.number().int().positive().max(100000).nullable().optional(),
    event_details: z.record(z.string(), z.string().nullable()).optional(),
  })
  .strict()

export type Step1Data = z.infer<typeof step1Schema>
export type Step2Data = z.infer<typeof step2Schema>
export type Step3Data = z.infer<typeof step3Schema>
export type CreateEventData = z.infer<typeof createEventSchema>
export type UpdateEventData = z.infer<typeof updateEventSchema>

/**
 * Validate Step 2 dynamic fields against the event type's form_schema.
 * Returns array of field-level errors, or empty array if valid.
 */
export function validateDynamicFields(
  metadata: Record<string, string>,
  formSchema: { key: string; label: string; required: boolean }[]
): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = []
  for (const fieldDef of formSchema) {
    if (fieldDef.required) {
      const value = metadata[fieldDef.key]
      if (!value || value.trim() === '') {
        errors.push({ field: fieldDef.key, message: `${fieldDef.label} is required` })
      }
    }
  }
  return errors
}
