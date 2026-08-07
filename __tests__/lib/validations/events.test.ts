import { describe, it, expect } from 'vitest'
import {
  step1Schema,
  step2Schema,
  step3Schema,
  createEventSchema,
  validateDynamicFields,
} from '@/lib/validations/events'

describe('step1Schema', () => {
  it('accepts valid event type ID', () => {
    const result = step1Schema.safeParse({ eventTypeId: '550e8400-e29b-41d4-a716-446655440000' })
    expect(result.success).toBe(true)
  })

  it('rejects missing event type', () => {
    const result = step1Schema.safeParse({ eventTypeId: '' })
    expect(result.success).toBe(false)
  })

  it('rejects non-UUID event type', () => {
    const result = step1Schema.safeParse({ eventTypeId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })
})

describe('step2Schema', () => {
  it('accepts valid data with all fields', () => {
    const result = step2Schema.safeParse({
      metadata: { partner_1_name: 'Aarav', partner_2_name: 'Ishani' },
      primaryDate: '2026-12-14',
      primaryVenue: 'The Grand Oberoi, Udaipur',
      guestCapacity: 350,
    })
    expect(result.success).toBe(true)
  })

  it('accepts minimal data (optional common fields omitted)', () => {
    const result = step2Schema.safeParse({
      metadata: { partner_1_name: 'Aarav', partner_2_name: 'Ishani' },
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty required metadata value', () => {
    const result = step2Schema.safeParse({
      metadata: { partner_1_name: '' },
    })
    expect(result.success).toBe(false)
  })
})

describe('step3Schema', () => {
  it('accepts at least one sub-event with name', () => {
    const result = step3Schema.safeParse({
      selectedSubEvents: [{ subEventTypeId: '550e8400-e29b-41d4-a716-446655440000', customName: null, name: 'Mehendi', iconName: 'palette' }],
    })
    expect(result.success).toBe(true)
  })

  it('accepts custom sub-event', () => {
    const result = step3Schema.safeParse({
      selectedSubEvents: [{ subEventTypeId: null, customName: 'After Party', name: 'After Party', iconName: null }],
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty sub-event list', () => {
    const result = step3Schema.safeParse({ selectedSubEvents: [] })
    expect(result.success).toBe(false)
  })
})

describe('createEventSchema', () => {
  it('accepts full valid payload', () => {
    const result = createEventSchema.safeParse({
      eventTypeId: '550e8400-e29b-41d4-a716-446655440000',
      metadata: { partner_1_name: 'Aarav', partner_2_name: 'Ishani' },
      primaryDate: '2026-12-14',
      primaryVenue: 'Udaipur',
      guestCapacity: 350,
      subEvents: [
        { subEventTypeId: '550e8400-e29b-41d4-a716-446655440001', customName: null },
        { subEventTypeId: null, customName: 'After Party' },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects sub-event with neither type ID nor custom name', () => {
    const result = createEventSchema.safeParse({
      eventTypeId: '550e8400-e29b-41d4-a716-446655440000',
      metadata: {},
      subEvents: [{ subEventTypeId: null, customName: null }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects more than 50 sub-events [I5]', () => {
    const subEvents = Array.from({ length: 51 }, (_, i) => ({
      subEventTypeId: `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`,
    }))
    const result = createEventSchema.safeParse({
      eventTypeId: '550e8400-e29b-41d4-a716-446655440000',
      metadata: {},
      subEvents,
    })
    expect(result.success).toBe(false)
  })

  it('rejects metadata value exceeding 500 chars [I6]', () => {
    const result = createEventSchema.safeParse({
      eventTypeId: '550e8400-e29b-41d4-a716-446655440000',
      metadata: { partner_1_name: 'A'.repeat(501) },
      subEvents: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects more than 20 metadata keys [I7]', () => {
    const metadata: Record<string, string> = {}
    for (let i = 0; i < 21; i++) metadata[`field_${i}`] = 'value'
    const result = createEventSchema.safeParse({
      eventTypeId: '550e8400-e29b-41d4-a716-446655440000',
      metadata,
      subEvents: [],
    })
    expect(result.success).toBe(false)
  })
})

describe('validateDynamicFields', () => {
  const weddingSchema = [
    { key: 'partner_1_name', label: 'Partner 1 Name', required: true },
    { key: 'partner_2_name', label: 'Partner 2 Name', required: true },
  ]

  it('returns no errors when all required fields are filled', () => {
    const errors = validateDynamicFields(
      { partner_1_name: 'Aarav', partner_2_name: 'Ishani' },
      weddingSchema
    )
    expect(errors).toEqual([])
  })

  it('returns errors for missing required fields', () => {
    const errors = validateDynamicFields({ partner_1_name: 'Aarav' }, weddingSchema)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('partner_2_name')
  })

  it('returns errors for empty string values', () => {
    const errors = validateDynamicFields(
      { partner_1_name: '', partner_2_name: '  ' },
      weddingSchema
    )
    expect(errors).toHaveLength(2)
  })
})
