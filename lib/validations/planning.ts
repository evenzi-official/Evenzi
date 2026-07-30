import { z } from 'zod'

export const uuidSchema = z.string().uuid()

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task name is required').max(200),
  description: z.string().trim().max(1000).nullable().optional(),
  dueDate: isoDateSchema.nullable().optional(),
  subEventId: z.string().uuid().nullable().optional(),
  priorityId: z.string().uuid().optional(),
}).strict()

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  dueDate: isoDateSchema.nullable().optional(),
  subEventId: z.string().uuid().nullable().optional(),
  priorityId: z.string().uuid().optional(),
  statusId: z.string().uuid().optional(),
}).strict()

export const bulkTaskActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('complete'),
    taskIds: z.array(z.string().uuid()).min(1).max(500),
  }).strict(),
  z.object({
    action: z.literal('delete'),
    taskIds: z.array(z.string().uuid()).min(1).max(500),
  }).strict(),
  z.object({
    action: z.literal('setDate'),
    taskIds: z.array(z.string().uuid()).min(1).max(500),
    dueDate: isoDateSchema.nullable(),
  }).strict(),
  z.object({
    action: z.literal('assign'),
    taskIds: z.array(z.string().uuid()).min(1).max(500),
    subEventId: z.string().uuid().nullable(),
  }).strict(),
])

export const upsertBudgetSchema = z.object({
  totalAmount: z.number().positive('Enter a valid amount greater than zero'),
}).strict()

export const createExpenseSchema = z.object({
  amount: z.number().positive('Enter a valid amount greater than zero'),
  expenseTypeId: z.string().uuid(),
  vendorName: z.string().trim().max(200).nullable().optional(),
  subEventId: z.string().uuid().nullable().optional(),
  expenseDate: isoDateSchema.nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
}).strict()

export const updateExpenseSchema = z.object({
  amount: z.number().positive().optional(),
  expenseTypeId: z.string().uuid().optional(),
  vendorName: z.string().trim().max(200).nullable().optional(),
  subEventId: z.string().uuid().nullable().optional(),
  expenseDate: isoDateSchema.nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
}).strict()

export const createExpenseTypeSchema = z.object({
  name: z.string().trim().min(1, 'Enter a type name').max(60),
}).strict()
