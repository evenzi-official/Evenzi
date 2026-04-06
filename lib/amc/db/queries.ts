import { createClient } from '@/lib/supabase/server'
import type {
  AMCProject,
  AMCAgent,
  CreateProjectInput,
  UpdateProjectInput,
  CreateAgentInput,
  UpdateAgentInput,
} from '../types'
import { generateWebhookSecret } from '../utils/webhook'

// ============================================================
// Projects
// ============================================================

export async function listProjects(): Promise<AMCProject[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mc_projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`listProjects: ${error.message}`)
  return data ?? []
}

export async function getProject(id: string): Promise<AMCProject | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mc_projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(`getProject: ${error.message}`)
  return data ?? null
}

export async function createProject(input: CreateProjectInput): Promise<AMCProject> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mc_projects')
    .insert({
      name: input.name,
      repo_url: input.repo_url ?? null,
      description: input.description ?? null,
      webhook_secret: generateWebhookSecret(),
      settings: input.settings ?? {},
    })
    .select()
    .single()

  if (error) throw new Error(`createProject: ${error.message}`)
  return data
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<AMCProject> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mc_projects')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.repo_url !== undefined && { repo_url: input.repo_url }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.settings !== undefined && { settings: input.settings }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`updateProject: ${error.message}`)
  return data
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('mc_projects').delete().eq('id', id)
  if (error) throw new Error(`deleteProject: ${error.message}`)
}

// ============================================================
// Agents
// ============================================================

export async function listAgents(projectId?: string): Promise<AMCAgent[]> {
  const supabase = await createClient()
  let query = supabase
    .from('mc_agents')
    .select('*')
    .order('pipeline_order', { ascending: true, nullsFirst: false })

  if (projectId) {
    // Return global agents (project_id IS NULL) + project-specific agents
    query = query.or(`project_id.is.null,project_id.eq.${projectId}`)
  }

  const { data, error } = await query
  if (error) throw new Error(`listAgents: ${error.message}`)
  return data ?? []
}

export async function getAgent(id: string): Promise<AMCAgent | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mc_agents')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(`getAgent: ${error.message}`)
  return data ?? null
}

export async function createAgent(input: CreateAgentInput): Promise<AMCAgent> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mc_agents')
    .insert({
      name: input.name,
      role: input.role,
      prompt: input.prompt ?? null,
      capabilities: input.capabilities ?? [],
      pipeline_order: input.pipeline_order ?? null,
      token_budget: input.token_budget ?? null,
      provider: input.provider ?? 'anthropic',
      model_id: input.model_id ?? 'claude-sonnet-4-6',
      project_id: input.project_id ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(`createAgent: ${error.message}`)
  return data
}

export async function updateAgent(
  id: string,
  input: UpdateAgentInput
): Promise<AMCAgent> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mc_agents')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.role !== undefined && { role: input.role }),
      ...(input.prompt !== undefined && { prompt: input.prompt }),
      ...(input.capabilities !== undefined && { capabilities: input.capabilities }),
      ...(input.pipeline_order !== undefined && { pipeline_order: input.pipeline_order }),
      ...(input.token_budget !== undefined && { token_budget: input.token_budget }),
      ...(input.provider !== undefined && { provider: input.provider }),
      ...(input.model_id !== undefined && { model_id: input.model_id }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`updateAgent: ${error.message}`)
  return data
}

export async function deleteAgent(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('mc_agents').delete().eq('id', id)
  if (error) throw new Error(`deleteAgent: ${error.message}`)
}

export async function getAgentStats(id: string): Promise<{
  totalRuns: number
  successfulRuns: number
  totalTokens: number
  totalCostUsd: number
  avgDurationMs: number
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mc_run_stages')
    .select('tokens_used, estimated_cost_usd, duration_ms, status')
    .eq('agent_id', id)

  if (error) throw new Error(`getAgentStats: ${error.message}`)
  const stages = data ?? []

  const totalRuns = stages.length
  const successfulRuns = stages.filter(s => s.status === 'completed').length
  const totalTokens = stages.reduce((sum, s) => sum + (s.tokens_used ?? 0), 0)
  const totalCostUsd = stages.reduce((sum, s) => sum + (Number(s.estimated_cost_usd) ?? 0), 0)
  const avgDurationMs =
    totalRuns > 0
      ? stages.reduce((sum, s) => sum + (s.duration_ms ?? 0), 0) / totalRuns
      : 0

  return { totalRuns, successfulRuns, totalTokens, totalCostUsd, avgDurationMs }
}
