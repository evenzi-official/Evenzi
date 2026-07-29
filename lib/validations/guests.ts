import { z } from 'zod'

export const uuidSchema = z.string().uuid()

const phoneSchema = z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number')

export const createGuestSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  phone: phoneSchema,
  email: z.string().trim().email().max(200).nullable().optional(),
  subEventIds: z.array(z.string().uuid()).max(50).optional(),
  tagIds: z.array(z.string().uuid()).max(50).optional(),
}).strict()

export const updateGuestSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  phone: phoneSchema.optional(),
  email: z.string().trim().email().max(200).nullable().optional(),
  partySize: z.number().int().min(1).max(20).optional(),
  notes: z.string().max(1000).nullable().optional(),
  rsvpStatusId: z.string().uuid().optional(),
  subEventIds: z.array(z.string().uuid()).max(50).optional(),
  tagIds: z.array(z.string().uuid()).max(50).optional(),
}).strict()

export const bulkActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('tag'),
    guestIds: z.array(z.string().uuid()).min(1).max(500),
    tagIds: z.array(z.string().uuid()).min(1).max(50),
  }).strict(),
  z.object({
    action: z.literal('assign'),
    guestIds: z.array(z.string().uuid()).min(1).max(500),
    subEventIds: z.array(z.string().uuid()).max(50),
  }).strict(),
  z.object({
    action: z.literal('delete'),
    guestIds: z.array(z.string().uuid()).min(1).max(500),
  }).strict(),
])

export const importGuestRowSchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().regex(/^\d{10}$/),
  email: z.string().trim().email().max(200).nullable(),
})

export const importGuestsSchema = z.object({
  guests: z.array(importGuestRowSchema).min(1).max(1000),
}).strict()

export const createTagSchema = z.object({
  name: z.string().trim().min(1).max(60),
}).strict()
