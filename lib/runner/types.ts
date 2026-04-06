import type { AgentProvider } from '@/lib/llm/types'

// ============================================================
// Agent & Pipeline Definitions (loaded from ai/ markdown)
// ============================================================

export interface AgentDefinition {
  role: string
  name: string
  provider: AgentProvider
  model: string
  tokenBudget: number
  outputFormat: 'markdown' | 'json' | 'code'
  systemPrompt: string
}

export interface PipelineStep {
  name: string
  agent: string
  input: string[]
  gate?: 'hard' | 'approval'
  description: string
}

export interface PipelineDefinition {
  name: string
  description: string
  priorityDefault: BudgetTier
  steps: PipelineStep[]
}

// ============================================================
// Run Configuration & Results
// ============================================================

export type BudgetTier = 'low' | 'normal' | 'high' | 'urgent' | 'override'

export const BUDGET_LIMITS: Record<BudgetTier, { perRun: number; perStep: number }> = {
  low:      { perRun: 1.00,           perStep: 0.25 },
  normal:   { perRun: 2.00,           perStep: 0.50 },
  high:     { perRun: 5.00,           perStep: 1.50 },
  urgent:   { perRun: 10.00,          perStep: 3.00 },
  override: { perRun: Infinity,       perStep: Infinity },
}

export interface RunConfig {
  pipeline: string
  input: string
  priority: BudgetTier
  source: 'cli' | 'clickup'
  clickupTaskId?: string
  noBudgetLimit?: boolean
}

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

export type RunStatus = 'completed' | 'failed' | 'aborted' | 'budget_exceeded'

export interface RunLog {
  id: string
  config: RunConfig
  steps: StepResult[]
  totalInputTokens: number
  totalOutputTokens: number
  totalCostUsd: number
  totalDurationMs: number
  status: RunStatus
  startedAt: string
  completedAt: string
}

// ============================================================
// Intake Types
// ============================================================

export interface IntakeResult {
  title: string
  description: string
  pipeline: string
  priority: BudgetTier
  tags: string[]
  acceptanceCriteria: string[]
}

// ============================================================
// Token Estimation Types
// ============================================================

export interface StepEstimate {
  stepName: string
  agent: string
  model: string
  estimatedInputTokens: number
  estimatedOutputTokens: number
  estimatedCostUsd: number
}

export interface BudgetEstimate {
  estimatedSteps: StepEstimate[]
  totalEstimatedTokens: number
  totalEstimatedCostUsd: number
  budgetTier: BudgetTier
  budgetLimit: number
  withinBudget: boolean
  suggestions: string[]
}
