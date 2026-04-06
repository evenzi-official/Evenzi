import { describe, it, expect } from 'vitest'
import { parseAgentFile, parsePipelineFile } from './loader'

const SAMPLE_AGENT_MD = `---
role: backend_engineer
name: Backend Engineer
provider: anthropic
model: claude-sonnet-4-6
token_budget: 4096
output_format: markdown
---

You are a backend engineer.

## Responsibilities
- Implement API routes
`

const SAMPLE_PIPELINE_MD = `---
name: feature
description: Full feature pipeline
priority_default: normal
---

## Steps

### 1. system_guard
agent: system_checker
input: env_check
gate: hard
description: Verify environment

### 2. spec
agent: product_manager
input: user_request
description: Write spec

### 3. design
agent: tech_lead
input: user_request + step.spec
description: Technical design
`

describe('parseAgentFile', () => {
  it('extracts frontmatter fields', () => {
    const agent = parseAgentFile(SAMPLE_AGENT_MD)
    expect(agent.role).toBe('backend_engineer')
    expect(agent.name).toBe('Backend Engineer')
    expect(agent.provider).toBe('anthropic')
    expect(agent.model).toBe('claude-sonnet-4-6')
    expect(agent.tokenBudget).toBe(4096)
    expect(agent.outputFormat).toBe('markdown')
  })

  it('extracts markdown body as systemPrompt', () => {
    const agent = parseAgentFile(SAMPLE_AGENT_MD)
    expect(agent.systemPrompt).toContain('You are a backend engineer.')
    expect(agent.systemPrompt).toContain('## Responsibilities')
  })

  it('does not include frontmatter in systemPrompt', () => {
    const agent = parseAgentFile(SAMPLE_AGENT_MD)
    expect(agent.systemPrompt).not.toContain('role: backend_engineer')
  })
})

describe('parsePipelineFile', () => {
  it('extracts pipeline metadata', () => {
    const pipeline = parsePipelineFile(SAMPLE_PIPELINE_MD)
    expect(pipeline.name).toBe('feature')
    expect(pipeline.description).toBe('Full feature pipeline')
    expect(pipeline.priorityDefault).toBe('normal')
  })

  it('parses all steps', () => {
    const pipeline = parsePipelineFile(SAMPLE_PIPELINE_MD)
    expect(pipeline.steps).toHaveLength(3)
  })

  it('parses step fields correctly', () => {
    const pipeline = parsePipelineFile(SAMPLE_PIPELINE_MD)
    const step1 = pipeline.steps[0]
    expect(step1.name).toBe('system_guard')
    expect(step1.agent).toBe('system_checker')
    expect(step1.input).toEqual(['env_check'])
    expect(step1.gate).toBe('hard')
    expect(step1.description).toBe('Verify environment')
  })

  it('parses multi-input with + separator', () => {
    const pipeline = parsePipelineFile(SAMPLE_PIPELINE_MD)
    const step3 = pipeline.steps[2]
    expect(step3.input).toEqual(['user_request', 'step.spec'])
  })

  it('omits gate when not specified', () => {
    const pipeline = parsePipelineFile(SAMPLE_PIPELINE_MD)
    const step2 = pipeline.steps[1]
    expect(step2.gate).toBeUndefined()
  })
})
