// ============================================================
// AMC Core Entity Types
// ============================================================

export interface AMCProject {
  id: string
  name: string
  repo_url: string | null
  description: string | null
  webhook_secret: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type AgentProvider =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'mistral'
  | 'groq'
  | 'ollama'
  | 'custom'

export interface AMCAgent {
  id: string
  name: string
  role: string
  prompt: string | null
  capabilities: string[]
  pipeline_order: number | null
  token_budget: number | null
  provider: AgentProvider
  model_id: string
  project_id: string | null
  created_at: string
  updated_at: string
}

export interface PipelineStage {
  agent_id: string
  config: Record<string, unknown>
}

export interface AMCPipeline {
  id: string
  name: string
  description: string | null
  stages: PipelineStage[]
  project_id: string | null
  created_at: string
}

export type RunStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'aborted'

export interface AMCRun {
  id: string
  pipeline_id: string | null
  project_id: string
  trigger_description: string | null
  status: RunStatus
  current_stage: number
  total_tokens: number
  checkpoint_data: Record<string, unknown> | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export type RunStageStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'

export interface AMCRunStage {
  id: string
  run_id: string
  agent_id: string
  stage_order: number
  status: RunStageStatus
  input: Record<string, unknown> | null
  output: Record<string, unknown> | null
  tokens_used: number
  provider: string | null
  model_id: string | null
  input_tokens: number
  output_tokens: number
  estimated_cost_usd: number
  duration_ms: number | null
  error: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low'

export interface AMCTask {
  id: string
  run_id: string | null
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  assigned_agent_id: string | null
  priority: TaskPriority
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type ArtifactType =
  | 'spec'
  | 'design'
  | 'plan'
  | 'data_model'
  | 'code'
  | 'review'
  | 'qa_report'
  | 'security_audit'
  | 'other'

export interface AMCArtifact {
  id: string
  run_stage_id: string | null
  project_id: string
  type: ArtifactType
  title: string
  content: string | null
  metadata: Record<string, unknown>
  version: number
  created_at: string
}

export interface AMCEvent {
  id: string
  project_id: string
  run_id: string | null
  agent_id: string | null
  type: string
  payload: Record<string, unknown>
  created_at: string
}

export type MemoryEntryType =
  | 'decision'
  | 'observation'
  | 'error'
  | 'milestone'
  | 'note'

export interface AMCMemoryEntry {
  id: string
  project_id: string
  run_id: string | null
  agent_id: string | null
  type: MemoryEntryType
  title: string
  content: string | null
  tags: string[]
  created_at: string
}

// ============================================================
// API Request/Response Types
// ============================================================

export interface CreateProjectInput {
  name: string
  repo_url?: string
  description?: string
  settings?: Record<string, unknown>
}

export interface UpdateProjectInput {
  name?: string
  repo_url?: string
  description?: string
  settings?: Record<string, unknown>
}

export interface CreateAgentInput {
  name: string
  role: string
  prompt?: string
  capabilities?: string[]
  pipeline_order?: number
  token_budget?: number
  provider?: AgentProvider
  model_id?: string
  project_id?: string
}

export interface UpdateAgentInput {
  name?: string
  role?: string
  prompt?: string
  capabilities?: string[]
  pipeline_order?: number
  token_budget?: number
  provider?: AgentProvider
  model_id?: string
}

// ============================================================
// Webhook Event Payload Types
// ============================================================

export interface WebhookEventBase {
  type: string
}

export interface AgentStartedPayload extends WebhookEventBase {
  type: 'agent.started'
  runId: string
  agentId: string
  stageOrder: number
  input: Record<string, unknown>
}

export interface AgentProgressPayload extends WebhookEventBase {
  type: 'agent.progress'
  runId: string
  agentId: string
  message: string
  tokensUsed: number
}

export interface AgentCompletedPayload extends WebhookEventBase {
  type: 'agent.completed'
  runId: string
  agentId: string
  output: Record<string, unknown>
  tokensUsed: number
  durationMs: number
}

export interface AgentFailedPayload extends WebhookEventBase {
  type: 'agent.failed'
  runId: string
  agentId: string
  error: string
  tokensUsed: number
}

export interface TokenUsagePayload extends WebhookEventBase {
  type: 'token.usage'
  runId: string
  agentId: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface RunCheckpointPayload extends WebhookEventBase {
  type: 'run.checkpoint'
  runId: string
  stageOrder: number
  checkpointData: Record<string, unknown>
}

export interface ArtifactCreatedPayload extends WebhookEventBase {
  type: 'artifact.created'
  runId: string
  agentId: string
  artifactType: ArtifactType
  title: string
  content: string
}

export interface MemoryCreatedPayload extends WebhookEventBase {
  type: 'memory.created'
  runId?: string
  agentId?: string
  entryType: MemoryEntryType
  title: string
  content: string
  tags: string[]
}

export type WebhookPayload =
  | AgentStartedPayload
  | AgentProgressPayload
  | AgentCompletedPayload
  | AgentFailedPayload
  | TokenUsagePayload
  | RunCheckpointPayload
  | ArtifactCreatedPayload
  | MemoryCreatedPayload

// ============================================================
// LLM Router Types
// ============================================================

export interface LLMResult {
  text: string
  inputTokens: number
  outputTokens: number
  estimatedCostUsd: number
}
