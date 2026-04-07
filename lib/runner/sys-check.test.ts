import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return { ...actual, existsSync: vi.fn(() => true) }
})

import { existsSync } from 'fs'
import { runSystemCheck } from './sys-check'

describe('runSystemCheck', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    global.fetch = vi.fn().mockResolvedValue({ ok: true })
    vi.mocked(existsSync).mockReturnValue(true)
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it('returns status failed when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    process.env.ANTHROPIC_API_KEY = 'sk-test'

    const result = await runSystemCheck()

    expect(result.status).toBe('failed')
    expect(result.output).toContain('FAIL')
    expect(result.output).toContain('Supabase URL')
  })

  it('returns status completed when all required checks pass', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
    process.env.ANTHROPIC_API_KEY = 'sk-test'

    const result = await runSystemCheck()

    expect(result.status).toBe('completed')
    expect(result.output).toContain('PASS')
    expect(result.inputTokens).toBe(0)
    expect(result.outputTokens).toBe(0)
    expect(result.estimatedCostUsd).toBe(0)
  })

  it('returns status failed when no LLM provider key is set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENAI_API_KEY
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
    delete process.env.GROQ_API_KEY

    const result = await runSystemCheck()

    expect(result.status).toBe('failed')
    expect(result.output).toContain('No LLM provider')
  })

  it('lists available LLM providers', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
    process.env.ANTHROPIC_API_KEY = 'sk-test'
    process.env.OPENAI_API_KEY = 'sk-proj-test'
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
    delete process.env.GROQ_API_KEY

    const result = await runSystemCheck()

    expect(result.output).toMatch(/Available LLM Providers:.*anthropic/)
    expect(result.output).toMatch(/Available LLM Providers:.*openai/)
  })

  it('reports zero token usage and cost', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
    process.env.ANTHROPIC_API_KEY = 'sk-test'

    const result = await runSystemCheck()

    expect(result.inputTokens).toBe(0)
    expect(result.outputTokens).toBe(0)
    expect(result.estimatedCostUsd).toBe(0)
    expect(result.agentRole).toBe('system_checker')
    expect(result.model).toBe('native')
    expect(result.provider).toBe('native')
  })
})
