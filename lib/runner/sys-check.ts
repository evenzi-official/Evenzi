import { existsSync } from 'fs'
import { join } from 'path'
import type { StepResult } from './types'

interface CheckResult {
  label: string
  passed: boolean
  detail?: string
  required: boolean
}

async function checkSupabaseReachable(url: string): Promise<{ ok: boolean; ms: number }> {
  const start = Date.now()
  try {
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(5000) })
    return { ok: res.ok || res.status === 404, ms: Date.now() - start }
  } catch {
    return { ok: false, ms: Date.now() - start }
  }
}

async function checkClickUpToken(token: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.clickup.com/api/v2/user', {
      headers: { Authorization: token },
      signal: AbortSignal.timeout(5000),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function runSystemCheck(): Promise<StepResult> {
  const stepStart = Date.now()
  const checks: CheckResult[] = []

  // --- Required Checks ---

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  checks.push({
    label: 'Supabase URL configured',
    passed: !!supabaseUrl,
    required: true,
  })

  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  checks.push({
    label: 'Supabase anon key configured',
    passed: !!supabaseKey,
    required: true,
  })

  const isNonLocalEnvironment =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'preview' ||
    process.env.VERCEL_ENV === 'production'
  if (isNonLocalEnvironment) {
    const surfaceEnv: Record<string, string | undefined> = {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_MARKETING_URL: process.env.NEXT_PUBLIC_MARKETING_URL,
      NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL,
      ADMIN_USER_IDS: process.env.ADMIN_USER_IDS,
    }
    for (const [name, value] of Object.entries(surfaceEnv)) {
      checks.push({
        label: `${name} configured`,
        passed: !!value,
        required: true,
      })
    }
  }

  if (supabaseUrl) {
    const ping = await checkSupabaseReachable(supabaseUrl)
    checks.push({
      label: 'Supabase connection reachable',
      passed: ping.ok,
      detail: ping.ok ? `${ping.ms}ms` : `unreachable after ${ping.ms}ms`,
      required: true,
    })
  }

  const providers: Record<string, string | undefined> = {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    groq: process.env.GROQ_API_KEY,
  }
  const availableProviders = Object.entries(providers)
    .filter(([, key]) => !!key)
    .map(([name]) => name)

  for (const [name, key] of Object.entries(providers)) {
    checks.push({
      label: `${name.charAt(0).toUpperCase() + name.slice(1)} API key configured`,
      passed: !!key,
      required: false,
    })
  }

  checks.push({
    label: 'At least one LLM provider configured',
    passed: availableProviders.length > 0,
    detail: availableProviders.length === 0 ? 'No LLM provider API key is set. Add at least one to .env.local' : undefined,
    required: true,
  })

  const nodeModulesPath = join(process.cwd(), 'node_modules')
  checks.push({
    label: 'Node modules installed',
    passed: existsSync(nodeModulesPath),
    required: true,
  })

  // --- Optional Checks ---

  const ollamaUrl = process.env.OLLAMA_BASE_URL
  if (ollamaUrl) {
    try {
      const res = await fetch(ollamaUrl.replace('/api', ''), { signal: AbortSignal.timeout(3000) })
      checks.push({ label: 'Ollama reachable', passed: res.ok, required: false })
    } catch {
      checks.push({ label: 'Ollama reachable', passed: false, detail: 'not running', required: false })
    }
  }

  const clickupToken = process.env.CLICKUP_API_TOKEN
  if (clickupToken) {
    const valid = await checkClickUpToken(clickupToken)
    checks.push({ label: 'ClickUp token valid', passed: valid, required: false })
  } else {
    checks.push({ label: 'ClickUp token configured', passed: false, detail: 'not configured', required: false })
  }

  const resendKey = process.env.RESEND_API_KEY
  checks.push({
    label: 'Resend API key configured',
    passed: !!resendKey,
    detail: !resendKey ? 'not configured — email notifications disabled' : undefined,
    required: false,
  })

  if (resendKey && !process.env.RUNNER_ALERT_EMAIL) {
    checks.push({
      label: 'RUNNER_ALERT_EMAIL set',
      passed: false,
      detail: 'Resend key is set but no alert email configured',
      required: false,
    })
  }

  // --- Build Output ---

  const requiredFailed = checks.filter(c => c.required && !c.passed)
  const overallPass = requiredFailed.length === 0
  const missingOptional = checks.filter(c => !c.required && !c.passed).map(c => c.label)

  const lines: string[] = [
    '### Environment Check Results',
    '',
    `**Status:** ${overallPass ? 'PASS' : 'FAIL'}`,
    '',
    '**Checks:**',
  ]

  for (const check of checks) {
    const icon = check.passed ? '[x]' : '[ ]'
    const detail = check.detail ? ` (${check.detail})` : ''
    lines.push(`- ${icon} ${check.label}${detail}`)
  }

  if (availableProviders.length > 0) {
    lines.push('', `**Available LLM Providers:** ${availableProviders.join(', ')}`)
  }
  if (missingOptional.length > 0) {
    lines.push(`**Missing Optional:** ${missingOptional.join(', ')}`)
  }

  if (!overallPass) {
    lines.push('', '**Issues:**')
    for (const fail of requiredFailed) {
      const detail = fail.detail ? ` ${fail.detail}` : ` ${fail.label} is not configured. Add it to .env.local`
      lines.push(`- ${detail}`)
    }
  }

  const output = lines.join('\n')

  return {
    stepName: 'system_guard',
    agentRole: 'system_checker',
    model: 'native',
    provider: 'native',
    output,
    inputTokens: 0,
    outputTokens: 0,
    estimatedCostUsd: 0,
    durationMs: Date.now() - stepStart,
    status: overallPass ? 'completed' : 'failed',
  }
}
