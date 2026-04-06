import { describe, it, expect } from 'vitest'
import { estimateCost, formatCost, COST_PER_MILLION } from './tokens'

describe('estimateCost', () => {
  it('calculates cost for claude-opus-4-6', () => {
    // 1M input tokens at $5.00, 1M output at $25.00
    const cost = estimateCost('claude-opus-4-6', 1_000_000, 1_000_000)
    expect(cost).toBeCloseTo(30.0, 2)
  })

  it('calculates cost for gpt-4o-mini', () => {
    // 100k input at $0.15/M = $0.015, 100k output at $0.60/M = $0.060
    const cost = estimateCost('gpt-4o-mini', 100_000, 100_000)
    expect(cost).toBeCloseTo(0.075, 4)
  })

  it('returns 0 for unknown model', () => {
    const cost = estimateCost('unknown-model-xyz', 1000, 1000)
    expect(cost).toBe(0)
  })

  it('returns 0 for zero tokens', () => {
    const cost = estimateCost('claude-sonnet-4-6', 0, 0)
    expect(cost).toBe(0)
  })
})

describe('formatCost', () => {
  it('formats large cost with dollar sign', () => {
    expect(formatCost(1.5)).toBe('$1.5000')
  })

  it('formats tiny cost in milli-dollars', () => {
    expect(formatCost(0.0000001)).toBe('$0.0001m')
  })

  it('formats zero', () => {
    expect(formatCost(0)).toBe('$0.0000')
  })
})

describe('COST_PER_MILLION', () => {
  it('has entries for Claude models', () => {
    expect(COST_PER_MILLION['claude-opus-4-6']).toBeDefined()
    expect(COST_PER_MILLION['claude-sonnet-4-6']).toBeDefined()
    expect(COST_PER_MILLION['claude-haiku-4-5']).toBeDefined()
  })
})
