import type { AgentProvider } from '../types'

export interface AgentModelDefault {
  provider: AgentProvider
  model_id: string
  rationale: string
}

/**
 * Default model assignment per pipeline stage role name.
 * Role names must match the `role` field in mc_agents.
 * All defaults are overridable per-project in the AMC dashboard.
 */
export const AGENT_MODEL_DEFAULTS: Record<string, AgentModelDefault> = {
  'system_checker': {
    provider: 'anthropic',
    model_id: 'claude-haiku-4-5',
    rationale: 'Fast env checks, no deep reasoning needed',
  },
  'product_manager': {
    provider: 'anthropic',
    model_id: 'claude-opus-4-6',
    rationale: 'Deep spec writing, requirement analysis',
  },
  'tech_lead': {
    provider: 'anthropic',
    model_id: 'claude-opus-4-6',
    rationale: 'Architecture decisions, critical thinking',
  },
  'data_modelling': {
    provider: 'anthropic',
    model_id: 'claude-sonnet-4-6',
    rationale: 'Structured schema generation',
  },
  'task_planner': {
    provider: 'openai',
    model_id: 'gpt-4o-mini',
    rationale: 'Simple list/task generation, very cheap',
  },
  'task_distributor': {
    provider: 'openai',
    model_id: 'gpt-4o-mini',
    rationale: 'Routing logic, no creativity needed',
  },
  'backend_engineer': {
    provider: 'anthropic',
    model_id: 'claude-sonnet-4-6',
    rationale: 'Code generation with context',
  },
  'frontend_engineer': {
    provider: 'anthropic',
    model_id: 'claude-sonnet-4-6',
    rationale: 'Code generation with context',
  },
  'fullstack_engineer': {
    provider: 'anthropic',
    model_id: 'claude-sonnet-4-6',
    rationale: 'Code generation with context',
  },
  'code_reviewer': {
    provider: 'anthropic',
    model_id: 'claude-opus-4-6',
    rationale: 'Deep multi-file analysis',
  },
  'security_expert': {
    provider: 'anthropic',
    model_id: 'claude-opus-4-6',
    rationale: 'Critical vulnerability analysis',
  },
  'qa_engineer': {
    provider: 'google',
    model_id: 'gemini-2.0-flash',
    rationale: 'Fast test case generation',
  },
  'devops_engineer': {
    provider: 'anthropic',
    model_id: 'claude-sonnet-4-6',
    rationale: 'Config and script generation',
  },
  'token_monitor': {
    provider: 'anthropic',
    model_id: 'claude-haiku-4-5',
    rationale: 'Lightweight, runs constantly',
  },
}

export function getDefaultModelForRole(role: string): AgentModelDefault {
  return (
    AGENT_MODEL_DEFAULTS[role] ?? {
      provider: 'anthropic' as AgentProvider,
      model_id: 'claude-sonnet-4-6',
      rationale: 'Default fallback',
    }
  )
}
