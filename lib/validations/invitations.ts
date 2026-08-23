import { z } from 'zod'

export const uuidSchema = z.string().uuid()

const INV_IMAGE_TYPES = ['image/jpeg', 'image/png'] as const

export const invitationUploadUrlSchema = z.object({
  part: z.enum(['photo_bg', 'card_upload']),
  contentType: z.enum(INV_IMAGE_TYPES),
}).strict()

const SLOT_KEYS = ['eyebrow', 'couple', 'invite', 'date', 'time', 'venue', 'message'] as const
const slotSize = z.enum(['s', 'm', 'l'])

export const invitationPatchSchema = z.object({
  template_id: z.string().uuid().nullable().optional(),
  card_upload_key: z.string().max(512).nullable().optional(),
  photo_bg_key: z.string().max(512).nullable().optional(),
  slots: z.object(Object.fromEntries(
    SLOT_KEYS.map((k) => [k, z.string().max(280)]),
  ) as Record<(typeof SLOT_KEYS)[number], z.ZodString>).partial().optional(),
  slot_sizes: z.partialRecord(z.enum(SLOT_KEYS), slotSize).optional(),
  is_custom: z.boolean().optional(),
}).strict().refine(
  (v) => !(v.template_id != null && v.card_upload_key != null),
  { message: 'template_id and card_upload_key are mutually exclusive', path: ['template_id'] },
)

export const SLOT_KEYS_LIST = SLOT_KEYS
