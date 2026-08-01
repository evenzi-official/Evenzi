import { describe, it, expect, vi } from 'vitest'
import { assertEventOwnership } from '@/lib/media/ownership'

function makeQueryChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    single: vi.fn().mockResolvedValue(result),
  }
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.is = vi.fn().mockReturnValue(chain)
  return chain
}

describe('assertEventOwnership', () => {
  it('returns true when the event exists and belongs to the user', async () => {
    const chain = makeQueryChain({ data: { id: 'event-1' }, error: null })
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never
    const result = await assertEventOwnership(supabase, 'event-1', 'user-1')
    expect(result).toBe(true)
    expect(chain.eq).toHaveBeenCalledWith('id', 'event-1')
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('returns false when no matching row is found (wrong owner or soft-deleted)', async () => {
    const chain = makeQueryChain({ data: null, error: { message: 'not found' } })
    const supabase = { from: vi.fn().mockReturnValue(chain) } as never
    const result = await assertEventOwnership(supabase, 'event-1', 'user-2')
    expect(result).toBe(false)
  })
})
