import { loadAgent, loadPipeline } from './loader'
import { createRunMonitor, type RunMonitor } from './monitor'
import {
  formatStepLog,
  formatRunningTotal,
  formatPipelineHeader,
  formatRunSummary,
  writeRunLog,
} from './logger'
import { notifyRunComplete, notifyBudgetAlert } from './notify'
import { runAgentLLM } from '@/lib/llm/router'
import { runSystemCheck } from './sys-check'
import { BUDGET_LIMITS } from './types'
import type {
  RunConfig,
  RunLog,
  StepResult,
  AgentDefinition,
  BudgetTier,
} from './types'
import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import * as readline from 'readline'

// ============================================================
// Pending Run State (for ClickUp approval gates)
// ============================================================

interface PendingRunState {
  id: string
  config: RunConfig
  stepResults: StepResult[]
  stepOutputs: Record<string, string>
  resumeFromStep: number
  startedAt: string
}

function pendingPath(taskId: string): string {
  return join(process.cwd(), '.runner', 'pending', `${taskId}.json`)
}

async function savePendingRun(taskId: string, state: PendingRunState): Promise<void> {
  const dir = join(process.cwd(), '.runner', 'pending')
  await mkdir(dir, { recursive: true })
  await writeFile(pendingPath(taskId), JSON.stringify(state, null, 2), 'utf-8')
}

async function loadPendingRun(taskId: string): Promise<PendingRunState | null> {
  try {
    const content = await readFile(pendingPath(taskId), 'utf-8')
    return JSON.parse(content) as PendingRunState
  } catch {
    return null
  }
}

async function clearPendingRun(taskId: string): Promise<void> {
  try { await unlink(pendingPath(taskId)) } catch { /* ignore if not exists */ }
}

/**
 * Resolves input references for a pipeline step.
 * Supports: 'user_request', 'env_check', 'step.<name>'
 */
export function resolveInputs(
  inputs: string[],
  userRequest: string,
  stepOutputs: Map<string, string>
): string {
  const parts: string[] = []
  for (const ref of inputs) {
    if (ref === 'user_request') {
      parts.push(userRequest)
    } else if (ref === 'env_check') {
      parts.push('Run environment validation checks.')
    } else if (ref.startsWith('step.')) {
      const stepName = ref.slice(5)
      const output = stepOutputs.get(stepName)
      if (output === undefined) {
        throw new Error(`Step reference "${ref}" not found — step "${stepName}" has not run yet`)
      }
      parts.push(output)
    } else {
      parts.push(ref)
    }
  }
  return parts.join('\n\n---\n\n')
}

/**
 * Builds the accumulated context string from all previous step outputs.
 */
export function buildContext(userRequest: string, stepOutputs: Map<string, string>): string {
  const sections: string[] = [`## Original Request\n${userRequest}`]
  for (const [name, output] of stepOutputs) {
    sections.push(`## Step: ${name}\n${output}`)
  }
  return sections.join('\n\n')
}

/**
 * Prompts user for approval in CLI mode. Returns true if approved.
 */
async function promptApproval(): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question('\n[runner] Approve and continue? (y/n): ', answer => {
      rl.close()
      resolve(answer.trim().toLowerCase() === 'y')
    })
  })
}

/**
 * Executes a full pipeline run. If a pending run exists for a ClickUp task
 * (paused at approval gate), resumes from where it left off.
 */
export async function executePipeline(config: RunConfig): Promise<RunLog> {
  // Check for pending run (ClickUp approval resume)
  let startedAt = new Date().toISOString()
  let id = startedAt.replace(/[:.]/g, '-')
  let startStep = 0
  const stepOutputs = new Map<string, string>()
  const stepResults: StepResult[] = []

  if (config.clickupTaskId) {
    const pending = await loadPendingRun(config.clickupTaskId)
    if (pending) {
      console.log(`[runner] Resuming from pending approval gate (step ${pending.resumeFromStep})`)
      id = pending.id
      startedAt = pending.startedAt
      startStep = pending.resumeFromStep
      stepResults.push(...pending.stepResults)
      for (const [k, v] of Object.entries(pending.stepOutputs)) {
        stepOutputs.set(k, v)
      }
      await clearPendingRun(config.clickupTaskId)
    }
  }

  // Load pipeline and agent definitions
  const pipeline = await loadPipeline(config.pipeline)
  const agentCache = new Map<string, AgentDefinition>()

  for (const step of pipeline.steps) {
    if (step.agent && !agentCache.has(step.agent)) {
      agentCache.set(step.agent, await loadAgent(step.agent))
    }
  }

  const effectivePriority: BudgetTier = config.noBudgetLimit ? 'override' : config.priority
  const limits = BUDGET_LIMITS[effectivePriority]
  const monitor = createRunMonitor(effectivePriority)

  // Replay costs from resumed steps into monitor
  for (const prevStep of stepResults) {
    monitor.recordStep(prevStep)
  }

  console.log(formatPipelineHeader(config.pipeline, effectivePriority, limits.perRun))
  if (startStep > 0) {
    console.log(formatRunningTotal(monitor.getTotalCost(), limits.perRun))
  }

  for (let i = startStep; i < pipeline.steps.length; i++) {
    const step = pipeline.steps[i]

    // Handle approval gate
    if (step.gate === 'approval') {
      console.log(`\n[runner] === APPROVAL GATE ===`)
      console.log(`[runner] Review the plan above before continuing.`)

      if (config.source === 'cli') {
        const approved = await promptApproval()
        if (!approved) {
          return finalizeRun(id, config, stepResults, monitor, 'aborted', startedAt)
        }
      } else if (config.source === 'clickup' && config.clickupTaskId) {
        // Save pending state so we can resume after approval
        await savePendingRun(config.clickupTaskId, {
          id, config, stepResults, stepOutputs: Object.fromEntries(stepOutputs),
          resumeFromStep: i + 1, startedAt,
        })

        // Get the plan output (last completed step's output)
        const planOutput = stepOutputs.get('plan') ?? stepOutputs.get(pipeline.steps[i - 1]?.name) ?? ''

        // Update ClickUp task: status + assignment + comment
        const { postTaskComment, updateTaskStatus, assignTask } = await import('./clickup')
        const planComment = `## Approval Needed\n\n**Cost so far:** $${monitor.getTotalCost().toFixed(2)}\n**Estimated remaining:** ~$${(limits.perRun - monitor.getTotalCost()).toFixed(2)}\n\n${planOutput}`
        await postTaskComment(config.clickupTaskId, planComment)
        await updateTaskStatus(config.clickupTaskId, 'Awaiting Approval')
        const assigneeId = process.env.RUNNER_CLICKUP_ASSIGNEE_ID
        if (assigneeId) {
          await assignTask(config.clickupTaskId, assigneeId)
        }

        // Send email notification
        const { notifyApprovalNeeded } = await import('./notify')
        const featureName = config.input.split('\n')[0].replace(/^#\s*/, '')
        await notifyApprovalNeeded(
          featureName, config.pipeline, planOutput,
          monitor.getTotalCost(), limits.perRun - monitor.getTotalCost(),
          config.clickupTaskId
        )

        console.log(`[runner] Paused at approval gate. ClickUp task updated, email sent.`)
        return finalizeRun(id, config, stepResults, monitor, 'aborted', startedAt)
      }
      continue
    }

    const agent = agentCache.get(step.agent)
    if (!agent) {
      const failResult: StepResult = {
        stepName: step.name, agentRole: step.agent, model: 'unknown', provider: 'unknown',
        output: '', inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0, durationMs: 0,
        status: 'failed', error: `Agent "${step.agent}" not found`,
      }
      stepResults.push(failResult)
      console.log(formatStepLog(failResult, i + 1, pipeline.steps.length))
      if (step.gate === 'hard') {
        return finalizeRun(id, config, stepResults, monitor, 'failed', startedAt)
      }
      continue
    }

    // Resolve inputs and build context
    const userPrompt = resolveInputs(step.input, config.input, stepOutputs)
    const context = buildContext(config.input, stepOutputs)

    // Execute the agent
    const stepStart = Date.now()
    let result: StepResult

    if (agent.role === 'system_checker') {
      // Real system check — no LLM, actual environment validation
      result = await runSystemCheck()
    } else {
      try {
        const llmResult = await runAgentLLM(
          {
            provider: agent.provider,
            model_id: agent.model,
            prompt: agent.systemPrompt,
            token_budget: agent.tokenBudget,
          },
          userPrompt,
          context
        )

        result = {
          stepName: step.name,
          agentRole: agent.role,
          model: agent.model,
          provider: agent.provider,
          output: llmResult.text,
          inputTokens: llmResult.inputTokens,
          outputTokens: llmResult.outputTokens,
          estimatedCostUsd: llmResult.estimatedCostUsd,
          durationMs: Date.now() - stepStart,
          status: 'completed',
        }
      } catch (err) {
        result = {
          stepName: step.name,
          agentRole: agent.role,
          model: agent.model,
          provider: agent.provider,
          output: '',
          inputTokens: 0,
          outputTokens: 0,
          estimatedCostUsd: 0,
          durationMs: Date.now() - stepStart,
          status: 'failed',
          error: err instanceof Error ? err.message : String(err),
        }
      }
    }

    stepResults.push(result)
    monitor.recordStep(result)

    console.log(formatStepLog(result, i + 1, pipeline.steps.length))
    console.log(formatRunningTotal(monitor.getTotalCost(), limits.perRun))

    // Store output for downstream steps
    if (result.status === 'completed') {
      stepOutputs.set(step.name, result.output)
    }

    // Handle hard gate failure
    if (result.status === 'failed' && step.gate === 'hard') {
      return finalizeRun(id, config, stepResults, monitor, 'failed', startedAt)
    }

    // Budget checks
    if (monitor.isStepOverBudget(result)) {
      console.log(`[runner] ⚠ Step budget exceeded: $${result.estimatedCostUsd.toFixed(2)} > $${limits.perStep.toFixed(2)}`)
      await notifyBudgetAlert(result, result.estimatedCostUsd, limits.perStep, monitor.getTotalCost(), limits.perRun)
    }

    if (monitor.isRunOverBudget()) {
      console.log(`[runner] ✗ Run budget exceeded: $${monitor.getTotalCost().toFixed(2)} > $${limits.perRun.toFixed(2)}`)
      return finalizeRun(id, config, stepResults, monitor, 'budget_exceeded', startedAt)
    }
  }

  return finalizeRun(id, config, stepResults, monitor, 'completed', startedAt)
}

async function finalizeRun(
  id: string,
  config: RunConfig,
  steps: StepResult[],
  monitor: RunMonitor,
  status: RunLog['status'],
  startedAt: string
): Promise<RunLog> {
  const log: RunLog = {
    id,
    config,
    steps,
    totalInputTokens: steps.reduce((sum, s) => sum + s.inputTokens, 0),
    totalOutputTokens: steps.reduce((sum, s) => sum + s.outputTokens, 0),
    totalCostUsd: monitor.getTotalCost(),
    totalDurationMs: monitor.getTotalDurationMs(),
    status,
    startedAt,
    completedAt: new Date().toISOString(),
  }

  const totalTokens = log.totalInputTokens + log.totalOutputTokens
  console.log(formatRunSummary(steps.length, totalTokens, log.totalCostUsd, log.totalDurationMs))

  const logPath = await writeRunLog(log)
  console.log(`[runner] Log saved: ${logPath}`)

  await notifyRunComplete(log)

  return log
}
