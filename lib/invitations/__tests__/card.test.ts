import { describe, it, expect } from 'vitest'
import { slotsToColumns } from '@/lib/invitations/card'

describe('slotsToColumns', () => {
  it('prefixes each slot key with slot_', () => {
    expect(slotsToColumns({ couple: 'A & B', message: 'See you' }))
      .toEqual({ slot_couple: 'A & B', slot_message: 'See you' })
  })
  it('ignores undefined slots', () => {
    expect(slotsToColumns({ couple: 'A', invite: undefined })).toEqual({ slot_couple: 'A' })
  })
})
