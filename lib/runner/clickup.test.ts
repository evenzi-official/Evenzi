import { describe, it, expect } from 'vitest'
import { mapClickUpPriority, mapClickUpToRunConfig, buildResultComment } from './clickup'
import type { RunLog } from './types'

describe('mapClickUpPriority', () => {
  it('maps ClickUp priority 1 (urgent) to urgent', () => {
    expect(mapClickUpPriority(1)).toBe('urgent')
  })
  it('maps ClickUp priority 2 (high) to high', () => {
    expect(mapClickUpPriority(2)).toBe('high')
  })
  it('maps ClickUp priority 3 (normal) to normal', () => {
    expect(mapClickUpPriority(3)).toBe('normal')
  })
  it('maps ClickUp priority 4 (low) to low', () => {
    expect(mapClickUpPriority(4)).toBe('low')
  })
  it('defaults to normal for unknown', () => {
    expect(mapClickUpPriority(99)).toBe('normal')
  })
})

describe('mapClickUpToRunConfig', () => {
  it('maps a ClickUp task to RunConfig', () => {
    const task = {
      id: 'abc123',
      name: 'Build invitations',
      description: 'Create invitation system with RSVP',
      priority: { id: '3' },
      tags: [{ name: 'feature' }, { name: 'run-agent' }],
    }
    const config = mapClickUpToRunConfig(task)
    expect(config.pipeline).toBe('feature')
    expect(config.priority).toBe('normal')
    expect(config.source).toBe('clickup')
    expect(config.clickupTaskId).toBe('abc123')
    expect(config.input).toContain('Build invitations')
    expect(config.input).toContain('Create invitation system with RSVP')
  })

  it('detects budget-override tag', () => {
    const task = {
      id: 'abc',
      name: 'Name',
      description: 'Desc',
      priority: { id: '3' },
      tags: [{ name: 'feature' }, { name: 'budget-override' }],
    }
    const config = mapClickUpToRunConfig(task)
    expect(config.noBudgetLimit).toBe(true)
  })

  it('defaults pipeline to feature if no matching tag', () => {
    const task = {
      id: 'abc',
      name: 'Name',
      description: 'Desc',
      priority: { id: '3' },
      tags: [{ name: 'run-agent' }],
    }
    const config = mapClickUpToRunConfig(task)
    expect(config.pipeline).toBe('feature')
  })
})

describe('buildResultComment', () => {
  it('builds a markdown comment from RunLog', () => {
    const log: RunLog = {
      id: 'test',
      config: { pipeline: 'feature', input: 'test', priority: 'normal', source: 'clickup', clickupTaskId: 'abc' },
      steps: [{
        stepName: 'spec', agentRole: 'product_manager', model: 'claude-opus-4-6',
        provider: 'anthropic', output: 'Feature spec output', inputTokens: 1000,
        outputTokens: 2000, estimatedCostUsd: 0.10, durationMs: 5000, status: 'completed',
      }],
      totalInputTokens: 1000,
      totalOutputTokens: 2000,
      totalCostUsd: 0.10,
      totalDurationMs: 5000,
      status: 'completed',
      startedAt: '2026-04-06T14:30:00Z',
      completedAt: '2026-04-06T14:30:05Z',
    }
    const comment = buildResultComment(log)
    expect(comment).toContain('Pipeline Run: feature')
    expect(comment).toContain('$0.10')
    expect(comment).toContain('spec')
  })
})
