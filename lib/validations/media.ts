import { z } from 'zod'

export const uuidSchema = z.string().uuid()

const PHOTO_TYPES = ['image/webp', 'image/jpeg', 'image/png', 'image/avif'] as const
const VIDEO_TYPES = ['video/mp4', 'video/quicktime'] as const
const THUMB_TYPE = 'image/webp' as const

export const uploadUrlSchema = z.discriminatedUnion('part', [
  z.object({
    part: z.literal('master'),
    kind: z.enum(['photo', 'video']),
    contentType: z.string(),
  }).strict().superRefine((val, ctx) => {
    const allowed: readonly string[] = val.kind === 'photo' ? PHOTO_TYPES : VIDEO_TYPES
    if (!allowed.includes(val.contentType)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `contentType must be one of: ${allowed.join(', ')}` })
    }
  }),
  z.object({
    part: z.literal('thumb'),
    kind: z.enum(['photo', 'video']),
    contentType: z.literal(THUMB_TYPE),
  }).strict(),
])

export const commitMediaSchema = z.object({
  kind: z.enum(['photo', 'video']),
  masterKey: z.string().min(1),
  thumbKey: z.string().min(1),
  contentType: z.string(),
  width: z.number().int().positive().max(10000),
  height: z.number().int().positive().max(10000),
  durationSec: z.number().int().positive().max(14400).optional(),
}).strict().refine(
  (val) => val.kind !== 'video' || val.durationSec !== undefined,
  { message: 'durationSec is required for video', path: ['durationSec'] }
)

export const createAlbumSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
}).strict()

export const renameAlbumSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
}).strict()

export const assignAlbumsSchema = z.object({
  mode: z.enum(['add', 'remove']),
  albumIds: z.array(z.string().uuid()).min(1).max(50),
}).strict()

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
}).strict()

export const batchUrlsSchema = z.object({
  mediaIds: z.array(z.string().uuid()).min(1).max(200),
}).strict()
