import type { StepResult, BudgetTier } from './types'
import { BUDGET_LIMITS } from './types'

const TIER_CROSSINGS = [2, 5, 10, 20]

export interface RunMonitor {
  recordStep(step: StepResult): void
  getTotalCost(): number
  getTotalTokens(): number
  getTotalDurationMs(): number
  isStepOverBudget(step: StepResult): boolean
  isRunOverBudget(): boolean
  getTierCrossings(): number[]
  getSteps(): StepResult[]
}

/**
 * Creates a monitor that tracks token usage and budget for a pipeline run.
 */
export function createRunMonitor(priority: BudgetTier, noBudgetLimit?: boolean): RunMonitor {
  const effectiveTier: BudgetTier = noBudgetLimit ? 'override' : priority
  const limits = BUDGET_LIMITS[effectiveTier]
  const steps: StepResult[] = []
  let totalCost = 0
  let totalTokens = 0
  let totalDurationMs = 0
  const crossedTiers: number[] = []

  return {
    recordStep(step: StepResult): void {
      steps.push(step)
      const prevCost = totalCost
      totalCost += step.estimatedCostUsd
      totalTokens += step.inputTokens + step.outputTokens
      totalDurationMs += step.durationMs

      // Check tier crossings for override mode alerts
      for (const tier of TIER_CROSSINGS) {
        if (prevCost < tier && totalCost >= tier && !crossedTiers.includes(tier)) {
          crossedTiers.push(tier)
        }
      }
    },

    getTotalCost(): number {
      return totalCost
    },

    getTotalTokens(): number {
      return totalTokens
    },

    getTotalDurationMs(): number {
      return totalDurationMs
    },

    isStepOverBudget(step: StepResult): boolean {
      if (limits.perStep === Infinity) return false
      return step.estimatedCostUsd > limits.perStep
    },

    isRunOverBudget(): boolean {
      if (limits.perRun === Infinity) return false
      return totalCost > limits.perRun
    },

    getTierCrossings(): number[] {
      return [...crossedTiers]
    },

    getSteps(): StepResult[] {
      return [...steps]
    },
  }
}
