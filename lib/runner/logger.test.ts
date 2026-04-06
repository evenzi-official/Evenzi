import { describe, it, expect } from 'vitest'
import { formatStepLog, formatRunSummary } from './logger'
import type { StepResult } from './types'

describe('formatStepLog', () => {
  it('formats a completed step', () => {
    const step: StepResult = {
      stepName: 'spec',
      agentRole: 'product_manager',
      model: 'claude-opus-4-6',
      provider: 'anthropic',
      output: 'some output',
      inputTokens: 1500,
      outputTokens: 2347,
      estimatedCostUsd: 0.12,
      durationMs: 8400,
      status: 'completed',
    }
    const log = formatStepLog(step, 2, 9)
    expect(log).toContain('Step 2/9')
    expect(log).toContain('spec')
    expect(log).toContain('product_manager')
    expect(log).toContain('claude-opus-4-6')
    expect(log).toContain('3,847 tokens')
    expect(log).toContain('$0.12')
    expect(log).toContain('8.4s')
  })

  it('formats a failed step', () => {
    const step: StepResult = {
      stepName: 'backend',
      agentRole: 'backend_engineer',
      model: 'claude-sonnet-4-6',
      provider: 'anthropic',
      output: '',
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
      durationMs: 500,
      status: 'failed',
      error: 'API key invalid',
    }
    const log = formatStepLog(step, 6, 9)
    expect(log).toContain('FAIL')
    expect(log).toContain('API key invalid')
  })
})

describe('formatRunSummary', () => {
  it('formats the final summary line', () => {
    const summary = formatRunSummary(9, 25799, 0.53, 57600)
    expect(summary).toContain('9 steps')
    expect(summary).toContain('25,799 tokens')
    expect(summary).toContain('$0.53')
    expect(summary).toContain('57.6s')
  })
})
