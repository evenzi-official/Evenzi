import { vi } from 'vitest'

type ThenResult = { data: unknown; error: unknown }

/**
 * Fluent thenable query chain for Supabase client mocks.
 * Terminal methods (single/maybeSingle/or order/in when terminal) resolve a result.
 */
export function makeQueryChain(result: ThenResult = { data: null, error: null }) {
  const chain: Record<string, unknown> = {}
  const self = () => chain
  const resolve = vi.fn().mockResolvedValue(result)

  for (const method of [
    'select',
    'insert',
    'update',
    'upsert',
    'delete',
    'eq',
    'neq',
    'is',
    'in',
    'order',
    'limit',
    'range',
    'match',
    'filter',
    'not',
    'gt',
    'gte',
    'lt',
    'lte',
    'like',
    'ilike',
    'contains',
    'containedBy',
    'overlaps',
  ]) {
    chain[method] = vi.fn().mockImplementation(self)
  }

  chain.single = resolve
  chain.maybeSingle = resolve
  // Allow awaiting the chain itself (some calls end at .order() / .in())
  chain.then = (onFulfilled: (v: ThenResult) => unknown, onRejected?: (e: unknown) => unknown) =>
    resolve().then(onFulfilled, onRejected)

  return chain
}

/** Owner row so requireEventRead/Write succeeds via getEventAccess. */
export function makeOwnerEventsChain(eventId: string) {
  return makeQueryChain({ data: { id: eventId }, error: null })
}

/** No ownership + no collab → requireEvent* returns 404. */
export function makeDeniedAccessFrom(eventId: string) {
  const events = makeQueryChain({ data: null, error: { code: 'PGRST116', message: 'not found' } })
  const collab = makeQueryChain({ data: null, error: { code: 'PGRST116', message: 'not found' } })
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'events') return events
      if (table === 'event_collaborators') return collab
      return makeQueryChain({ data: null, error: null })
    }),
  }
}

export function makeAuthedClient(opts: {
  userId?: string | null
  from?: (table: string) => unknown
  rpc?: ReturnType<typeof vi.fn>
  schema?: (name: string) => { from: (table: string) => unknown }
}) {
  const user =
    opts.userId === null
      ? null
      : { id: opts.userId ?? 'user-1' }

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: user ? null : { message: 'no session' },
      }),
    },
    from: opts.from ?? vi.fn().mockReturnValue(makeQueryChain({ data: null, error: null })),
    rpc: opts.rpc ?? vi.fn().mockResolvedValue({ data: null, error: null }),
    schema:
      opts.schema ??
      vi.fn().mockReturnValue({
        from: opts.from ?? vi.fn().mockReturnValue(makeQueryChain({ data: null, error: null })),
      }),
  }
}
