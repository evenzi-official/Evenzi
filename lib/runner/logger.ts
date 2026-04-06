import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import type { StepResult, RunLog, BudgetTier } from './types'

const PREFIX = '[runner]'

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

/**
 * Formats a single step result for stdout.
 */
export function formatStepLog(step: StepResult, stepNum: number, totalSteps: number): string {
  const header = `${PREFIX} Step ${stepNum}/${totalSteps}: ${step.stepName} (${step.agentRole} \u2192 ${step.model})`
  if (step.status === 'failed') {
    return `${header}\n${PREFIX}   \u2717 FAIL: ${step.error ?? 'Unknown error'}`
  }
  if (step.status === 'skipped') {
    return `${header}\n${PREFIX}   \u2298 Skipped`
  }
  const totalTokens = step.inputTokens + step.outputTokens
  const seconds = (step.durationMs / 1000).toFixed(1)
  return `${header}\n${PREFIX}   \u2713 ${formatNumber(totalTokens)} tokens | $${step.estimatedCostUsd.toFixed(2)} | ${seconds}s`
}

/**
 * Formats the running total line.
 */
export function formatRunningTotal(currentCost: number, budgetLimit: number): string {
  if (budgetLimit === Infinity) {
    return `${PREFIX} Running total: $${currentCost.toFixed(2)} (no limit)`
  }
  return `${PREFIX} Running total: $${currentCost.toFixed(2)} / $${budgetLimit.toFixed(2)}`
}

/**
 * Formats the pipeline header line.
 */
export function formatPipelineHeader(pipelineName: string, priority: BudgetTier, budgetLimit: number): string {
  const budgetStr = budgetLimit === Infinity ? 'unlimited' : `$${budgetLimit.toFixed(2)}`
  return `${PREFIX} Pipeline: ${pipelineName} | Priority: ${priority} | Budget: ${budgetStr}`
}

/**
 * Formats the final run summary.
 */
export function formatRunSummary(
  totalSteps: number,
  totalTokens: number,
  totalCost: number,
  totalDurationMs: number
): string {
  const seconds = (totalDurationMs / 1000).toFixed(1)
  return `${PREFIX} Complete: ${totalSteps} steps | ${formatNumber(totalTokens)} tokens | $${totalCost.toFixed(2)} | ${seconds}s`
}

/**
 * Writes a RunLog as JSON to .runner/runs/<id>.json
 */
export async function writeRunLog(log: RunLog): Promise<string> {
  const dir = join(process.cwd(), '.runner', 'runs')
  await mkdir(dir, { recursive: true })
  const filePath = join(dir, `${log.id}.json`)
  await writeFile(filePath, JSON.stringify(log, null, 2), 'utf-8')
  return filePath
}
