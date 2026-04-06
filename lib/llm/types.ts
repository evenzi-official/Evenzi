// ============================================================
// LLM Infrastructure Types (extracted from AMC)
// ============================================================

export type AgentProvider =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'mistral'
  | 'groq'
  | 'ollama'
  | 'custom'

export interface LLMResult {
  text: string
  inputTokens: number
  outputTokens: number
  estimatedCostUsd: number
}
