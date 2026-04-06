import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import { groq } from '@ai-sdk/groq'
import { createOllama } from 'ollama-ai-provider'
import { estimateCost } from './tokens'
import type { AgentProvider, LLMResult } from './types'

const ollamaInstance = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/api',
})

/**
 * Returns a Vercel AI SDK model instance for the given provider + modelId.
 * Falls back to claude-sonnet-4-6 for unknown/custom providers.
 */
export function getModel(provider: AgentProvider, modelId: string) {
  switch (provider) {
    case 'anthropic':
      return anthropic(modelId)
    case 'openai':
      return openai(modelId)
    case 'google':
      return google(modelId)
    case 'groq':
      return groq(modelId)
    case 'ollama':
      return ollamaInstance(modelId)
    default:
      // Custom or unknown provider: safe fallback
      return anthropic('claude-sonnet-4-6')
  }
}

/**
 * Returns a string key identifying a model configuration.
 * Useful for logging and caching.
 */
export function buildModelKey(provider: AgentProvider, modelId: string): string {
  return `${provider}:${modelId}`
}

/**
 * Runs an agent using its configured provider and model.
 * Returns the text output + token usage + estimated cost.
 */
export async function runAgentLLM(
  agent: { provider: AgentProvider; model_id: string; prompt: string | null; token_budget: number | null },
  userPrompt: string,
  context?: string
): Promise<LLMResult> {
  const model = getModel(agent.provider, agent.model_id)

  const systemPrompt = [agent.prompt, context]
    .filter(Boolean)
    .join('\n\n---\n\n') || undefined

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { text, usage } = await generateText({
    model: model as any,
    prompt: userPrompt,
    system: systemPrompt,
    maxOutputTokens: agent.token_budget ?? 4096,
  })

  const inputTokens = usage.inputTokens ?? 0
  const outputTokens = usage.outputTokens ?? 0
  const estimatedCostUsd = estimateCost(agent.model_id, inputTokens, outputTokens)

  return { text, inputTokens, outputTokens, estimatedCostUsd }
}
