import { describe, it, expect } from 'vitest'
import { buildRunSummaryEmail, buildBudgetAlertEmail, buildApprovalEmail } from './notify'
import type { RunLog } from './types'

describe('buildRunSummaryEmail', () => {
  it('builds email with correct subject', () => {
    const log: RunLog = {
      id: '2026-04-06T14-30-00',
      config: { pipeline: 'feature', input: 'test', priority: 'normal', source: 'cli' },
      steps: [],
      totalInputTokens: 10000,
      totalOutputTokens: 15000,
      totalCostUsd: 0.53,
      totalDurationMs: 57600,
      status: 'completed',
      startedAt: '2026-04-06T14:30:00Z',
      completedAt: '2026-04-06T14:31:00Z',
    }
    const email = buildRunSummaryEmail(log)
    expect(email.subject).toContain('feature')
    expect(email.subject).toContain('$0.53')
  })

  it('includes step breakdown in body', () => {
    const log: RunLog = {
      id: 'test',
      config: { pipeline: 'feature', input: 'test', priority: 'normal', source: 'cli' },
      steps: [{
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
      }],
      totalInputTokens: 1500,
      totalOutputTokens: 2000,
      totalCostUsd: 0.12,
      totalDurationMs: 5000,
      status: 'completed',
      startedAt: '2026-04-06T14:30:00Z',
      completedAt: '2026-04-06T14:30:05Z',
    }
    const email = buildRunSummaryEmail(log)
    expect(email.html).toContain('spec')
    expect(email.html).toContain('product_manager')
  })
})

describe('buildBudgetAlertEmail', () => {
  it('builds alert with step details', () => {
    const step = {
      stepName: 'backend',
      agentRole: 'backend_engineer',
      model: 'claude-sonnet-4-6',
      provider: 'anthropic',
      output: '',
      inputTokens: 5000,
      outputTokens: 15000,
      estimatedCostUsd: 0.60,
      durationMs: 12000,
      status: 'completed' as const,
    }
    const email = buildBudgetAlertEmail(step, 0.60, 0.50, 1.20, 2.00)
    expect(email.subject).toContain('Budget Alert')
    expect(email.html).toContain('backend')
    expect(email.html).toContain('$0.60')
  })
})

describe('buildApprovalEmail', () => {
  it('builds approval email with feature name and costs', () => {
    const email = buildApprovalEmail(
      'Event Invitations + RSVP',
      'feature',
      '## Plan\n- Build API\n- Build UI',
      0.27,
      0.60,
      'abc123'
    )
    expect(email.subject).toContain('Approval Needed')
    expect(email.subject).toContain('Event Invitations')
    expect(email.html).toContain('$0.27')
    expect(email.html).toContain('$0.60')
    expect(email.html).toContain('abc123')
  })
})
