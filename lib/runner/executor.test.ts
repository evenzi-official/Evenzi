import { describe, it, expect } from 'vitest'
import { resolveInputs, buildContext } from './executor'

describe('resolveInputs', () => {
  const stepOutputs = new Map<string, string>()
  stepOutputs.set('spec', 'Spec output here')
  stepOutputs.set('design', 'Design output here')

  it('resolves user_request', () => {
    const result = resolveInputs(['user_request'], 'My feature', stepOutputs)
    expect(result).toBe('My feature')
  })

  it('resolves step references', () => {
    const result = resolveInputs(['step.spec'], 'request', stepOutputs)
    expect(result).toBe('Spec output here')
  })

  it('resolves multiple inputs with concatenation', () => {
    const result = resolveInputs(['user_request', 'step.spec'], 'My feature', stepOutputs)
    expect(result).toContain('My feature')
    expect(result).toContain('Spec output here')
  })

  it('throws on missing step reference', () => {
    expect(() => resolveInputs(['step.nonexistent'], 'req', stepOutputs)).toThrow()
  })
})

describe('buildContext', () => {
  it('builds context from step outputs', () => {
    const outputs = new Map<string, string>()
    outputs.set('spec', 'Spec content')
    outputs.set('design', 'Design content')

    const context = buildContext('My request', outputs)
    expect(context).toContain('## Original Request')
    expect(context).toContain('My request')
    expect(context).toContain('## Step: spec')
    expect(context).toContain('Spec content')
    expect(context).toContain('## Step: design')
    expect(context).toContain('Design content')
  })
})
