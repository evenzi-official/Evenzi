import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runSystemCheck } from '@/lib/runner/sys-check'

const SURFACE_ENV_KEYS = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_MARKETING_URL',
  'NEXT_PUBLIC_ADMIN_URL',
  'ADMIN_USER_IDS',
]

describe('system check surface environment assertions', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
    process.env.ANTHROPIC_API_KEY = 'test-key'
    process.env.VERCEL_ENV = 'preview'
    SURFACE_ENV_KEYS.forEach((key) => delete process.env[key])
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    SURFACE_ENV_KEYS.forEach((key) => delete process.env[key])
  })

  it('fails non-local checks when any surface variable is missing', async () => {
    const result = await runSystemCheck()

    expect(result.status).toBe('failed')
    for (const key of SURFACE_ENV_KEYS) {
      expect(result.output).toContain(`${key} configured`)
    }
  })

  it('does not require deployment surface variables during local development', async () => {
    delete process.env.VERCEL_ENV
    vi.stubEnv('NODE_ENV', 'development')

    const result = await runSystemCheck()

    expect(result.status).toBe('completed')
    expect(result.output).not.toContain('NEXT_PUBLIC_APP_URL configured')
  })
})
