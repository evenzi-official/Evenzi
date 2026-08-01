'use client'

import { useState, useCallback } from 'react'

interface RunOptions<T> {
  apply: () => void
  revert: () => void
  request: () => Promise<T>
}

/**
 * Shared optimistic-update-with-rollback pattern for Media mutations.
 * Pulls forward the pattern PlanningClient.tsx needed to retrofit after
 * shipping without it — apply the change immediately, fire the request,
 * revert + surface an error on failure.
 */
export function useOptimisticMediaMutation() {
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async <T,>(opts: RunOptions<T>): Promise<T | null> => {
    opts.apply()
    try {
      const result = await opts.request()
      setError(null)
      return result
    } catch (err) {
      opts.revert()
      setError(err instanceof Error ? err.message : 'Something went wrong')
      return null
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { run, error, clearError }
}
