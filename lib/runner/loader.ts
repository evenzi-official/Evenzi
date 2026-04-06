import { readFile } from 'fs/promises'
import { join } from 'path'
import type { AgentDefinition, PipelineDefinition, PipelineStep, BudgetTier } from './types'
import { getDefaultModelForRole } from '@/lib/llm/defaults'

/**
 * Parses a markdown string with YAML frontmatter into an AgentDefinition.
 */
export function parseAgentFile(content: string): AgentDefinition {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!fmMatch) {
    throw new Error('Agent file missing YAML frontmatter (--- delimiters)')
  }

  const frontmatter = fmMatch[1]
  const body = fmMatch[2].trim()

  const get = (key: string): string | undefined => {
    const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
    return match?.[1]?.trim()
  }

  const role = get('role') ?? 'unknown'
  const defaults = getDefaultModelForRole(role)

  return {
    role,
    name: get('name') ?? role,
    provider: (get('provider') ?? defaults.provider) as AgentDefinition['provider'],
    model: get('model') ?? defaults.model_id,
    tokenBudget: Number(get('token_budget')) || 4096,
    outputFormat: (get('output_format') ?? 'markdown') as AgentDefinition['outputFormat'],
    systemPrompt: body,
  }
}

/**
 * Parses a markdown string with YAML frontmatter into a PipelineDefinition.
 */
export function parsePipelineFile(content: string): PipelineDefinition {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!fmMatch) {
    throw new Error('Pipeline file missing YAML frontmatter (--- delimiters)')
  }

  const frontmatter = fmMatch[1]
  const body = fmMatch[2]

  const get = (key: string): string | undefined => {
    const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
    return match?.[1]?.trim()
  }

  const steps: PipelineStep[] = []
  // Split on ### N. headers, keeping only blocks that follow a step header
  const stepBlocks = body.split(/^### \d+\.\s+/m).slice(1)

  for (const block of stepBlocks) {
    const lines = block.trim().split('\n')
    const name = lines[0]?.trim()
    if (!name) continue

    const getField = (field: string): string | undefined => {
      const line = lines.find(l => l.startsWith(`${field}:`))
      return line?.slice(field.length + 1)?.trim()
    }

    const inputStr = getField('input') ?? 'user_request'
    const input = inputStr.split('+').map(s => s.trim())

    const gate = getField('gate') as PipelineStep['gate']

    steps.push({
      name,
      agent: getField('agent') ?? name,
      input,
      gate: gate || undefined,
      description: getField('description') ?? '',
    })
  }

  return {
    name: get('name') ?? 'unknown',
    description: get('description') ?? '',
    priorityDefault: (get('priority_default') ?? 'normal') as BudgetTier,
    steps,
  }
}

/**
 * Loads an agent definition from ai/agents/<role>.md
 */
export async function loadAgent(role: string, basePath?: string): Promise<AgentDefinition> {
  const dir = basePath ?? join(process.cwd(), 'ai', 'agents')
  const content = await readFile(join(dir, `${role}.md`), 'utf-8')
  return parseAgentFile(content)
}

/**
 * Loads a pipeline definition from ai/pipelines/<name>.md
 */
export async function loadPipeline(name: string, basePath?: string): Promise<PipelineDefinition> {
  const dir = basePath ?? join(process.cwd(), 'ai', 'pipelines')
  const content = await readFile(join(dir, `${name}.md`), 'utf-8')
  return parsePipelineFile(content)
}
