import { describe, it, expect } from 'vitest'
import { createTicketSchema, helpSearchSchema, feedbackSchema } from '@/lib/validations/help'

describe('createTicketSchema', () => {
  const valid = {
    email: 'host@example.com',
    message: 'I cannot find where to add a guest to my event at all.',
    topicSlug: 'managing-guests',
  }

  it('accepts a valid ticket', () => {
    expect(createTicketSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a message under 20 characters, matching the DB CHECK', () => {
    expect(createTicketSchema.safeParse({ ...valid, message: 'too short' }).success).toBe(false)
  })

  it('rejects a message over 2000 characters, matching the DB CHECK', () => {
    expect(
      createTicketSchema.safeParse({ ...valid, message: 'x'.repeat(2001) }).success
    ).toBe(false)
  })

  it('rejects a malformed email', () => {
    expect(createTicketSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false)
  })

  it('allows topicSlug to be omitted', () => {
    const { topicSlug: _omitted, ...rest } = valid
    expect(createTicketSchema.safeParse(rest).success).toBe(true)
  })

  it('strips a client-supplied user_id rather than trusting it', () => {
    const parsed = createTicketSchema.parse({ ...valid, user_id: 'attacker-supplied' })
    expect('user_id' in parsed).toBe(false)
  })
})

describe('helpSearchSchema', () => {
  it('rejects a query under 3 characters', () => {
    expect(helpSearchSchema.safeParse({ q: 'ab' }).success).toBe(false)
  })

  it('rejects a query over 300 characters, matching the DB CHECK', () => {
    expect(helpSearchSchema.safeParse({ q: 'x'.repeat(301) }).success).toBe(false)
  })

  it('accepts a normal query', () => {
    expect(helpSearchSchema.safeParse({ q: 'my guest didnt get the invite' }).success).toBe(true)
  })
})

describe('feedbackSchema', () => {
  it('requires helpful to be a boolean', () => {
    expect(feedbackSchema.safeParse({ articleSlug: 'a-slug', helpful: 'yes' }).success).toBe(false)
    expect(feedbackSchema.safeParse({ articleSlug: 'a-slug', helpful: true }).success).toBe(true)
  })
})
