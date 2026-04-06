import { describe, it, expect } from 'vitest'
import { createRunMonitor } from './monitor'
import type { StepResult } from './types'

describe('createRunMonitor', () => {
  it('initializes with zero cost', () => {
    const monitor = createRunMonitor('normal')
    expect(monitor.getTotalCost()).toBe(0)
    expect(monitor.getTotalTokens()).toBe(0)
  })

  it('tracks step results', () => {
    const monitor = createRunMonitor('normal')
    const step: StepResult = {
      stepName: 'spec',
      agentRole: 'product_manager',
      model: 'claude-opus-4-6',
      provider: 'anthropic',
      output: 'output',
      inputTokens: 1500,
      outputTokens: 2000,
      estimatedCostUsd: 0.12,
      durationMs: 5000,
      status: 'completed',
    }
    monitor.recordStep(step)
    expect(monitor.getTotalCost()).toBe(0.12)
    expect(monitor.getTotalTokens()).toBe(3500)
  })

  it('detects step budget exceeded', () => {
    const monitor = createRunMonitor('normal') // step limit: $0.50
    const step: StepResult = {
      stepName: 'backend',
      agentRole: 'backend_engineer',
      model: 'claude-sonnet-4-6',
      provider: 'anthropic',
      output: 'output',
      inputTokens: 10000,
      outputTokens: 20000,
      estimatedCostUsd: 0.60,
      durationMs: 15000,
      status: 'completed',
    }
    monitor.recordStep(step)
    expect(monitor.isStepOverBudget(step)).toBe(true)
  })

  it('detects run budget exceeded', () => {
    const monitor = createRunMonitor('low') // run limit: $1.00
    for (let i = 0; i < 5; i++) {
      monitor.recordStep({
        stepName: `step${i}`,
        agentRole: 'agent',
        model: 'model',
        provider: 'anthropic',
        output: '',
        inputTokens: 1000,
        outputTokens: 1000,
        estimatedCostUsd: 0.25,
        durationMs: 1000,
        status: 'completed',
      })
    }
    expect(monitor.isRunOverBudget()).toBe(true)
  })

  it('never exceeds budget in override mode', () => {
    const monitor = createRunMonitor('override')
    monitor.recordStep({
      stepName: 'expensive',
      agentRole: 'agent',
      model: 'model',
      provider: 'anthropic',
      output: '',
      inputTokens: 100000,
      outputTokens: 100000,
      estimatedCostUsd: 50.0,
      durationMs: 30000,
      status: 'completed',
    })
    expect(monitor.isRunOverBudget()).toBe(false)
    expect(monitor.isStepOverBudget({
      stepName: 'x', agentRole: 'x', model: 'x', provider: 'x',
      output: '', inputTokens: 0, outputTokens: 0,
      estimatedCostUsd: 50.0, durationMs: 0, status: 'completed',
    })).toBe(false)
  })

  it('returns tier crossing alerts', () => {
    const monitor = createRunMonitor('override')
    monitor.recordStep({
      stepName: 's1', agentRole: 'a', model: 'm', provider: 'p',
      output: '', inputTokens: 0, outputTokens: 0,
      estimatedCostUsd: 3.0, durationMs: 0, status: 'completed',
    })
    const crossings = monitor.getTierCrossings()
    expect(crossings).toContain(2)
    expect(crossings).not.toContain(5)
  })
})
