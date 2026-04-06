import type { RunConfig, RunLog, BudgetTier } from './types'

const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2'

function getApiToken(): string {
  const token = process.env.CLICKUP_API_TOKEN
  if (!token) throw new Error('CLICKUP_API_TOKEN environment variable is not set')
  return token
}

async function clickupFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${CLICKUP_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: getApiToken(),
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
}

/**
 * Maps ClickUp priority ID to BudgetTier.
 * ClickUp: 1=urgent, 2=high, 3=normal, 4=low
 */
export function mapClickUpPriority(priorityId: number): BudgetTier {
  switch (priorityId) {
    case 1: return 'urgent'
    case 2: return 'high'
    case 3: return 'normal'
    case 4: return 'low'
    default: return 'normal'
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapClickUpToRunConfig(task: any): RunConfig {
  const tags: string[] = (task.tags ?? []).map((t: { name: string }) => t.name)
  const pipelineTypes = ['feature', 'bug', 'enhancement']
  const pipeline = tags.find(t => pipelineTypes.includes(t)) ?? 'feature'
  const noBudgetLimit = tags.includes('budget-override')
  const priorityId = Number(task.priority?.id ?? 3)

  return {
    pipeline,
    input: `# ${task.name}\n\n${task.description ?? ''}`,
    priority: mapClickUpPriority(priorityId),
    source: 'clickup',
    clickupTaskId: task.id,
    noBudgetLimit,
  }
}

/**
 * Fetches a ClickUp task by ID and maps it to a RunConfig.
 */
export async function fetchTaskAsRunConfig(taskId: string): Promise<RunConfig> {
  const res = await clickupFetch(`/task/${taskId}`)
  if (!res.ok) {
    throw new Error(`ClickUp API error: ${res.status} ${res.statusText}`)
  }
  const task = await res.json()
  return mapClickUpToRunConfig(task)
}

/**
 * Builds a markdown comment from a RunLog for posting to ClickUp.
 */
export function buildResultComment(log: RunLog): string {
  const stepLines = log.steps.map(s => {
    const tokens = s.inputTokens + s.outputTokens
    const status = s.status === 'completed' ? '✓' : s.status === 'failed' ? '✗' : '⊘'
    return `| ${status} ${s.stepName} | ${s.agentRole} | ${s.model} | ${tokens.toLocaleString()} | $${s.estimatedCostUsd.toFixed(4)} |`
  })

  return `## Pipeline Run: ${log.config.pipeline}

**Status:** ${log.status}
**Total:** ${(log.totalInputTokens + log.totalOutputTokens).toLocaleString()} tokens | $${log.totalCostUsd.toFixed(2)} | ${(log.totalDurationMs / 1000).toFixed(1)}s

| Step | Agent | Model | Tokens | Cost |
|------|-------|-------|--------|------|
${stepLines.join('\n')}

**Run ID:** ${log.id}`
}

/**
 * Posts a comment on a ClickUp task.
 */
export async function postTaskComment(taskId: string, commentText: string): Promise<void> {
  const res = await clickupFetch(`/task/${taskId}/comment`, {
    method: 'POST',
    body: JSON.stringify({ comment_text: commentText }),
  })
  if (!res.ok) {
    throw new Error(`ClickUp comment error: ${res.status} ${res.statusText}`)
  }
}

/**
 * Updates a ClickUp task's status.
 */
export async function updateTaskStatus(taskId: string, status: string): Promise<void> {
  const res = await clickupFetch(`/task/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
  if (!res.ok) {
    throw new Error(`ClickUp status update error: ${res.status} ${res.statusText}`)
  }
}

/**
 * Assigns a ClickUp task to a user.
 */
export async function assignTask(taskId: string, userId: string): Promise<void> {
  const res = await clickupFetch(`/task/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify({ assignees: { add: [Number(userId)] } }),
  })
  if (!res.ok) {
    throw new Error(`ClickUp assign error: ${res.status} ${res.statusText}`)
  }
}

/**
 * Creates a ClickUp task from intake results.
 */
export async function createTask(
  listId: string,
  title: string,
  description: string,
  tags: string[],
  priority: number
): Promise<string> {
  const res = await clickupFetch(`/list/${listId}/task`, {
    method: 'POST',
    body: JSON.stringify({
      name: title,
      description,
      tags,
      priority,
      status: 'Ready for Agent',
    }),
  })
  if (!res.ok) {
    throw new Error(`ClickUp task create error: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  return data.id
}
