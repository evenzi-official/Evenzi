// ============================================================
// Sys-check & Logger Types (kept after runner extraction)
// ============================================================

export type StepStatus = 'completed' | 'failed' | 'skipped'

export interface StepResult {
  stepName: string
  agentRole: string
  model: string
  provider: string
  output: string
  inputTokens: number
  outputTokens: number
  estimatedCostUsd: number
  durationMs: number
  status: StepStatus
  error?: string
}

export type BudgetTier = 'low' | 'normal' | 'high' | 'urgent' | 'override'

export type RunStatus = 'completed' | 'failed' | 'aborted' | 'budget_exceeded'

export interface RunLog {
  id: string
  pipeline: string
  input: string
  steps: StepResult[]
  totalInputTokens: number
  totalOutputTokens: number
  totalCostUsd: number
  totalDurationMs: number
  status: RunStatus
  startedAt: string
  completedAt: string
}
