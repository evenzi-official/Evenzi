/**
 * Pricing per 1M tokens (input / output) in USD.
 * Updated: 2026-04-06
 */
export const COST_PER_MILLION: Record<string, { input: number; output: number }> = {
  // Anthropic
  'claude-opus-4-6':   { input: 5.00,   output: 25.00  },
  'claude-sonnet-4-6': { input: 3.00,   output: 15.00  },
  'claude-haiku-4-5':  { input: 1.00,   output: 5.00   },
  // OpenAI
  'gpt-4o':            { input: 2.50,   output: 10.00  },
  'gpt-4o-mini':       { input: 0.15,   output: 0.60   },
  'gpt-4-turbo':       { input: 10.00,  output: 30.00  },
  // Google
  'gemini-2.0-flash':  { input: 0.075,  output: 0.30   },
  'gemini-1.5-pro':    { input: 1.25,   output: 5.00   },
  'gemini-1.5-flash':  { input: 0.075,  output: 0.30   },
  // Groq (open models via Groq cloud)
  'llama-3.3-70b-versatile': { input: 0.059, output: 0.079 },
  'llama-3.1-8b-instant':    { input: 0.005, output: 0.008 },
  'mixtral-8x7b-32768':      { input: 0.024, output: 0.024 },
  // Mistral
  'mistral-large-latest':    { input: 2.00,  output: 6.00  },
  'mistral-small-latest':    { input: 0.20,  output: 0.60  },
  // Ollama (local — free)
  'llama3.2':   { input: 0, output: 0 },
  'mistral':    { input: 0, output: 0 },
  'phi4-mini':  { input: 0, output: 0 },
}

/**
 * Estimates the USD cost for a given model + token counts.
 * Returns 0 for unknown models (safe default — local/custom models).
 */
export function estimateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = COST_PER_MILLION[modelId]
  if (!pricing) return 0
  return (
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output
  )
}

/**
 * Formats a USD cost for display.
 * Tiny amounts (< $0.001) are shown in milli-dollars to avoid showing $0.0000.
 */
export function formatCost(usd: number): string {
  if (usd > 0 && usd < 0.001) {
    return `$${(usd * 1000).toFixed(4)}m`
  }
  return `$${usd.toFixed(4)}`
}
