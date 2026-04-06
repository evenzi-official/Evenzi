import { describe, it, expect, vi } from 'vitest'
import { getModel, buildModelKey } from './router'

// Mock all AI SDK providers so we don't make real API calls in tests
vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn((modelId: string) => ({ provider: 'anthropic', modelId })),
}))
vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn((modelId: string) => ({ provider: 'openai', modelId })),
}))
vi.mock('@ai-sdk/google', () => ({
  google: vi.fn((modelId: string) => ({ provider: 'google', modelId })),
}))
vi.mock('@ai-sdk/groq', () => ({
  groq: vi.fn((modelId: string) => ({ provider: 'groq', modelId })),
}))
vi.mock('ollama-ai-provider', () => ({
  createOllama: vi.fn(() => (modelId: string) => ({ provider: 'ollama', modelId })),
}))

describe('getModel', () => {
  it('returns an anthropic model for anthropic provider', () => {
    const model = getModel('anthropic', 'claude-opus-4-6')
    expect(model).toMatchObject({ provider: 'anthropic', modelId: 'claude-opus-4-6' })
  })

  it('returns an openai model for openai provider', () => {
    const model = getModel('openai', 'gpt-4o-mini')
    expect(model).toMatchObject({ provider: 'openai', modelId: 'gpt-4o-mini' })
  })

  it('returns a google model for google provider', () => {
    const model = getModel('google', 'gemini-2.0-flash')
    expect(model).toMatchObject({ provider: 'google', modelId: 'gemini-2.0-flash' })
  })

  it('returns a groq model for groq provider', () => {
    const model = getModel('groq', 'llama-3.3-70b-versatile')
    expect(model).toMatchObject({ provider: 'groq', modelId: 'llama-3.3-70b-versatile' })
  })

  it('returns an ollama model for ollama provider', () => {
    const model = getModel('ollama', 'llama3.2')
    expect(model).toMatchObject({ provider: 'ollama', modelId: 'llama3.2' })
  })

  it('falls back to claude-sonnet for unknown provider', () => {
    const model = getModel('custom' as never, 'some-model')
    expect(model).toMatchObject({ provider: 'anthropic', modelId: 'claude-sonnet-4-6' })
  })
})

describe('buildModelKey', () => {
  it('returns provider:modelId string', () => {
    expect(buildModelKey('anthropic', 'claude-opus-4-6')).toBe('anthropic:claude-opus-4-6')
  })
})
