import { z } from 'zod'

// Step 1: event type must be selected
export const step1Schema = z.object({
  eventTypeId: z.string().uuid('Select an event type'),
})

// Step 2: dynamic metadata fields required, common fields optional
export const step2Schema = z.object({
  metadata: z.record(z.string().min(1, 'This field is required')),
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

// Full create event API payload — [I5] max 50 sub-events, [I6] max 500 char values, [I7] max 20 keys, [S4] min(1) aligned
export const createEventSchema = z.object({
  eventTypeId: z.string().uuid(),
  metadata: z
    .record(z.string().min(1).max(500))
    .refine((obj) => Object.keys(obj).length <= 20, 'Too many metadata fields (max 20)'),
  primaryDate: z.string().date().nullable().optional(),
  primaryVenue: z.string().max(500).nullable().optional(),
  guestCapacity: z.coerce.number().int().positive().max(100000).nullable().optional(),
  subEvents: z
    .array(
      z
        .object({
          subEventTypeId: z.string().uuid().nullable().optional(),
          customName: z.string().min(1).max(100).nullable().optional(),
        })
        .refine(
          (data) => data.subEventTypeId != null || data.customName != null,
          'Sub-event must have either a type ID or custom name'
        )
    )
    .max(50, 'Too many sub-events (max 50)'),
})

export type Step1Data = z.infer<typeof step1Schema>
export type Step2Data = z.infer<typeof step2Schema>
export type Step3Data = z.infer<typeof step3Schema>
export type CreateEventData = z.infer<typeof createEventSchema>

/**
 * Validate Step 2 dynamic fields against the event type's form_schema.
 * Returns array of field-level errors, or empty array if valid.
 */
export function validateDynamicFields(
  metadata: Record<string, string>,
  formSchema: { field: string; label: string; required: boolean }[]
): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = []
  for (const fieldDef of formSchema) {
    if (fieldDef.required) {
      const value = metadata[fieldDef.field]
      if (!value || value.trim() === '') {
        errors.push({ field: fieldDef.field, message: `${fieldDef.label} is required` })
      }
    }
  }
  return errors
}
