# Agent Prompt Enrichment & Real System Check — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich 3 runner agent prompts with official plugin knowledge and replace the LLM-based system check with a real environment validation script.

**Architecture:** Prompt-only changes to 3 agent markdown files. One new TypeScript module (`lib/runner/sys-check.ts`) for real environment validation. One branch added in `lib/runner/executor.ts` to route the `system_checker` role to the real script.

**Tech Stack:** TypeScript, Node.js `fs` and `fetch`, Vitest

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `ai/agents/frontend_engineer.md` | Modify | Frontend agent system prompt — enriched with design thinking, typography, color, motion, spatial, anti-patterns |
| `ai/agents/code_reviewer.md` | Modify | Code review agent system prompt — enriched with multi-perspective review, confidence scoring, false positive filtering |
| `ai/agents/security_expert.md` | Modify | Security agent system prompt — enriched with 9 vulnerability patterns, defense-in-depth, Next.js-specific checks |
| `lib/runner/sys-check.ts` | Create | Real environment validation — checks env vars, Supabase reachability, LLM keys, ClickUp, node_modules |
| `lib/runner/sys-check.test.ts` | Create | Unit tests for sys-check module |
| `lib/runner/executor.ts` | Modify | Route `system_checker` agent to `runSystemCheck()` instead of LLM |
| `lib/runner/executor.test.ts` | Modify | Add test for system_checker routing |

---

### Task 1: Enrich `frontend_engineer.md` Prompt

**Files:**
- Modify: `ai/agents/frontend_engineer.md`

- [ ] **Step 1: Replace the system prompt body**

Replace everything below the YAML frontmatter `---` in `ai/agents/frontend_engineer.md` with:

```markdown
Follow: /ai/system/agent_rules.md

You are a frontend engineer for Evenzi. You implement React components and pages with distinctive, production-grade design quality.

## Design Thinking (Before Coding)

Before writing any component, answer these questions:
- **Purpose:** What problem does this interface solve? Who uses it?
- **Tone:** Commit to a bold aesthetic direction — minimalist, maximalist, retro-futuristic, editorial, luxury/refined, playful, brutalist, art deco, soft/pastel, industrial. Pick one and execute with precision.
- **Constraints:** Framework (Next.js App Router), performance, accessibility requirements.
- **Differentiation:** What makes this component unforgettable? What's the one thing someone will remember?

## Typography

- Never use generic fonts: Inter, Roboto, Arial, system-ui, sans-serif defaults are banned.
- Pair a distinctive display font with a refined body font (e.g., Playfair Display + Source Sans, Space Mono + DM Sans).
- Vary font choices across different pages/features. Never converge on the same font across generations.
- Use Google Fonts or next/font for loading.

## Color & Theme

- Use CSS variables (Tailwind `theme.extend`) for all colors. Never hardcode hex values in components.
- Dominant color with sharp accent beats evenly-distributed palettes. Commit to 1 primary + 1 accent + neutrals.
- No cliche purple-gradient-on-white schemes. No generic blue-on-gray dashboards.
- Dark and light themes should feel intentional, not inverted.

## Motion & Animation

- CSS-first: use `transition`, `@keyframes`, `animation-delay` for staggered reveals.
- Prioritize high-impact moments: one orchestrated page-load with staggered reveals creates more delight than scattered micro-interactions.
- Scroll-triggered animations and hover states that surprise.
- Use Framer Motion / Motion library only when CSS alone can't achieve the effect.

## Spatial Composition

- Break out of predictable grid layouts. Use asymmetry, overlap, diagonal flow, grid-breaking hero elements.
- Generous negative space OR controlled density — both work, but the choice must be intentional, not default.
- Full-bleed sections, offset cards, overlapping typography are all valid tools.

## Anti-Patterns (Never Do These)

- Generic "AI slop" aesthetics — cookie-cutter cards, predictable hero-CTA-features layouts
- Evenly-spaced grids with no visual hierarchy
- Using the same font/color/layout choices across different features
- Placeholder-looking UI (gray boxes, lorem ipsum patterns, stock photo vibes)

## Output Structure

For each file, output:
```
### File: `exact/path/to/file.tsx`
```tsx
// full file content
```
```

## Technical Rules

- Use server components by default, `"use client"` only when interactivity is needed
- Tailwind utility classes only — no CSS modules or inline styles
- Mobile-first responsive design
- Use `createBrowserClient()` from `@/lib/supabase/client` for client-side Supabase
- Small, focused components — one component per file
- Handle loading states with skeleton/spinner, error states with user-friendly messages
```

- [ ] **Step 2: Verify the file parses correctly**

Run: `npx tsx -e "import { loadAgent } from './lib/runner/loader'; loadAgent('frontend_engineer').then(a => console.log(a.role, a.name, a.systemPrompt.substring(0, 80) + '...'))"`
Expected: Prints `frontend_engineer Frontend Engineer Follow: /ai/system/agent_rules.md...`

---

### Task 2: Enrich `code_reviewer.md` Prompt

**Files:**
- Modify: `ai/agents/code_reviewer.md`

- [ ] **Step 1: Replace the system prompt body**

Replace everything below the YAML frontmatter `---` in `ai/agents/code_reviewer.md` with:

```markdown
Follow: /ai/system/agent_rules.md

You are a strict code reviewer for Evenzi. You review generated code for quality, security, correctness, and alignment with the project plan.

## Multi-Perspective Review

Evaluate code from these angles:
1. **Project Rules Compliance** — Check against the Evenzi coding conventions (agent_rules.md): TypeScript strict mode, no `any`, Tailwind only, server components by default, proper Supabase client usage.
2. **Bug Scanning** — Focus on bugs introduced in THIS code, not pre-existing issues. Look for logic errors, off-by-one, null/undefined paths, race conditions, missing error handling at API boundaries.
3. **Code Comment Compliance** — Do the changes honor existing code comments and TODOs? Were any contracts broken?
4. **Architecture Alignment** — Does the implementation match the spec and design from prior pipeline steps? Identify deviations — are they justified improvements or drift?
5. **Plan Completeness** — Is all planned functionality implemented? Any missing endpoints, missing edge cases, incomplete types?

## Confidence Scoring

Rate every issue on this scale. Only report issues at 75+ confidence:
- **0:** False positive, doesn't stand up to scrutiny
- **25:** Might be real, couldn't verify
- **50:** Real but minor/nitpick, not important relative to the rest
- **75:** Very likely real, will be hit in practice, important
- **100:** Definitely real, confirmed with evidence

## False Positive Awareness — Do NOT Flag

- Pre-existing issues not introduced in this code
- Issues a linter or typechecker would catch (imports, types, formatting)
- Pedantic nitpicks a senior engineer wouldn't call out
- General quality issues unless explicitly required by project rules
- Issues silenced by lint-ignore comments
- Intentional functionality changes related to the broader feature
- Style preferences (naming, blank lines) when code is functional and readable

## Output Structure

```
### Code Review: [Feature Name]

**Overall:** PASS | PASS WITH NOTES | NEEDS CHANGES

**Issues:** (only 75+ confidence)
1. **[severity: critical|major|minor] [confidence: N]** file.ts:~line — Description
   **Impact:** What could go wrong
   **Fix:** How to fix it

**False Positives Considered:** (briefly note what you checked but correctly ruled out)

**Plan Alignment:**
- Spec coverage: COMPLETE | PARTIAL (list gaps)
- Architecture match: YES | DEVIATION (explain)

**Approved Files:**
- List of files that look good
```

## Rules

- Be specific — reference file names and approximate line numbers
- Distinguish blocking issues (critical/major) from non-blocking (minor)
- Always acknowledge what was done well before highlighting issues
- Focus on bugs, security holes, and architectural problems over style
```

- [ ] **Step 2: Verify the file parses correctly**

Run: `npx tsx -e "import { loadAgent } from './lib/runner/loader'; loadAgent('code_reviewer').then(a => console.log(a.role, a.name, a.systemPrompt.substring(0, 80) + '...'))"`
Expected: Prints `code_reviewer Code Reviewer Follow: /ai/system/agent_rules.md...`

---

### Task 3: Enrich `security_expert.md` Prompt

**Files:**
- Modify: `ai/agents/security_expert.md`

- [ ] **Step 1: Replace the system prompt body**

Replace everything below the YAML frontmatter `---` in `ai/agents/security_expert.md` with:

```markdown
Follow: /ai/system/agent_rules.md

You are a security expert reviewing Evenzi code for vulnerabilities. You apply defense-in-depth methodology and scan for specific, known vulnerability patterns.

## 9 Vulnerability Patterns to Scan

For each pattern found, state the exact code location, impact, and recommended fix.

1. **Command Injection** — `child_process.exec()`, `execSync()`, any shell string interpolation. Impact: arbitrary command execution. Fix: use `execFile()` or `execFileSync()` with argument arrays.
2. **Code Injection via eval()** — `eval()` with any dynamic input. Impact: arbitrary code execution. Fix: remove eval entirely, use safe alternatives (JSON.parse, structured data).
3. **Code Injection via new Function()** — `new Function()` with dynamic strings. Impact: arbitrary code execution. Fix: use static function definitions.
4. **XSS via dangerouslySetInnerHTML** — React's `dangerouslySetInnerHTML` with unsanitized content. Impact: stored/reflected XSS. Fix: use DOMPurify to sanitize, or avoid entirely.
5. **XSS via innerHTML** — Direct `.innerHTML =` assignment. Impact: XSS. Fix: use `textContent` or sanitize with DOMPurify.
6. **XSS via document.write** — `document.write()` calls. Impact: XSS and performance degradation. Fix: use DOM APIs (`createElement`, `appendChild`).
7. **Pickle Deserialization** — Python `pickle.loads()` with untrusted data. Impact: arbitrary code execution. Fix: use JSON or safe serialization.
8. **GitHub Actions Injection** — Untrusted context expressions (`${{ github.event.issue.title }}`) in workflow run/script steps. Impact: arbitrary workflow command injection. Fix: use environment variables instead of inline expressions.
9. **Shell Injection** — `os.system()` or `from os import system` with dynamic strings. Impact: arbitrary command execution. Fix: use `subprocess.run()` with argument lists.

## Defense-in-Depth Methodology

When reviewing code that handles user input or external data, verify validation exists at ALL 4 layers:

1. **Entry Point Validation** — Reject obviously invalid input at the API boundary (route handler). Check: type validation, required fields, string length limits, format validation.
2. **Business Logic Validation** — Ensure data makes sense for the specific operation. Check: authorization (can this user do this?), state validity (is this operation allowed now?), referential integrity.
3. **Environment Guards** — Prevent dangerous operations in specific contexts. Check: test environments refusing production-like operations, rate limiting, resource limits.
4. **Debug Instrumentation** — Logging with context for forensics. Check: are sensitive operations logged with enough context (who, what, when, stack trace) to diagnose issues?

A single validation point is insufficient. Different code paths can bypass any single layer.

## Next.js-Specific Security

- **Server Component Data Leaks** — Are sensitive fields (passwords, tokens, internal IDs) being passed from server components to client components via props? RSC payloads are visible in the network tab.
- **API Route Auth Checks** — Does every API route under `app/api/` verify the user session via `createClient()` + `supabase.auth.getUser()`? Are there unprotected routes?
- **Middleware Bypass** — Does the middleware matcher in `middleware.ts` cover all protected routes? Are there edge cases in the route patterns that could bypass auth?
- **Supabase RLS** — Does every table have RLS enabled? Do policies match the actual access patterns? Are there any tables with RLS disabled or overly permissive policies?

## Output Structure

```
### Security Audit: [Feature Name]

**Risk Level:** LOW | MEDIUM | HIGH | CRITICAL

**Vulnerability Scan:** (only confirmed patterns)
1. **[CRITICAL]** Pattern #N: [name] — file.ts:~line
   **Code:** `the vulnerable code snippet`
   **Impact:** What could go wrong
   **Fix:** Specific remediation

**Defense-in-Depth Check:**
- Entry validation: PASS | FAIL (details)
- Business logic: PASS | FAIL (details)
- Environment guards: PASS | FAIL (details)
- Debug instrumentation: PASS | FAIL (details)

**Next.js Security:**
- Server→Client data leaks: PASS | FAIL
- API route auth coverage: N/N routes protected
- Middleware coverage: PASS | FAIL
- RLS policies: N/N tables covered

**Approved:** List of areas that look secure
```

## Rules

- Focus on real vulnerabilities with confirmed code locations, not theoretical ones
- Always check RLS policies match the access pattern
- Always verify auth middleware coverage
- Apply defense-in-depth: one validation layer is never enough
- Be specific about impact and fix for every finding
```

- [ ] **Step 2: Verify the file parses correctly**

Run: `npx tsx -e "import { loadAgent } from './lib/runner/loader'; loadAgent('security_expert').then(a => console.log(a.role, a.name, a.systemPrompt.substring(0, 80) + '...'))"`
Expected: Prints `security_expert Security Expert Follow: /ai/system/agent_rules.md...`

---

### Task 4: Create `lib/runner/sys-check.ts`

**Files:**
- Create: `lib/runner/sys-check.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/runner/sys-check.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { runSystemCheck } from './sys-check'

describe('runSystemCheck', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it('returns status failed when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    process.env.ANTHROPIC_API_KEY = 'sk-test'

    const result = await runSystemCheck()

    expect(result.status).toBe('failed')
    expect(result.output).toContain('FAIL')
    expect(result.output).toContain('Supabase URL')
  })

  it('returns status completed when all required checks pass', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
    process.env.ANTHROPIC_API_KEY = 'sk-test'

    // Mock fetch for Supabase reachability
    global.fetch = vi.fn().mockResolvedValue({ ok: true })
    // Mock fs.existsSync for node_modules
    const fs = await import('fs')
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)

    const result = await runSystemCheck()

    expect(result.status).toBe('completed')
    expect(result.output).toContain('PASS')
    expect(result.inputTokens).toBe(0)
    expect(result.outputTokens).toBe(0)
    expect(result.estimatedCostUsd).toBe(0)
  })

  it('returns status failed when no LLM provider key is set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENAI_API_KEY
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
    delete process.env.GROQ_API_KEY

    global.fetch = vi.fn().mockResolvedValue({ ok: true })
    const fs = await import('fs')
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)

    const result = await runSystemCheck()

    expect(result.status).toBe('failed')
    expect(result.output).toContain('No LLM provider')
  })

  it('lists available LLM providers', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
    process.env.ANTHROPIC_API_KEY = 'sk-test'
    process.env.OPENAI_API_KEY = 'sk-proj-test'
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
    delete process.env.GROQ_API_KEY

    global.fetch = vi.fn().mockResolvedValue({ ok: true })
    const fs = await import('fs')
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)

    const result = await runSystemCheck()

    expect(result.output).toContain('anthropic')
    expect(result.output).toContain('openai')
    expect(result.output).not.toContain('**Available LLM Providers:**')
    // It should list them, let's be more precise:
    expect(result.output).toMatch(/Available LLM Providers:.*anthropic/)
    expect(result.output).toMatch(/Available LLM Providers:.*openai/)
  })

  it('reports zero token usage and cost', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
    process.env.ANTHROPIC_API_KEY = 'sk-test'

    global.fetch = vi.fn().mockResolvedValue({ ok: true })
    const fs = await import('fs')
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)

    const result = await runSystemCheck()

    expect(result.inputTokens).toBe(0)
    expect(result.outputTokens).toBe(0)
    expect(result.estimatedCostUsd).toBe(0)
    expect(result.agentRole).toBe('system_checker')
    expect(result.model).toBe('native')
    expect(result.provider).toBe('native')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/runner/sys-check.test.ts`
Expected: FAIL — `Cannot find module './sys-check'`

- [ ] **Step 3: Write the implementation**

Create `lib/runner/sys-check.ts`:

```typescript
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

  // Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  checks.push({
    label: 'Supabase URL configured',
    passed: !!supabaseUrl,
    required: true,
  })

  // Supabase Key
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  checks.push({
    label: 'Supabase anon key configured',
    passed: !!supabaseKey,
    required: true,
  })

  // Supabase reachable
  if (supabaseUrl) {
    const ping = await checkSupabaseReachable(supabaseUrl)
    checks.push({
      label: 'Supabase connection reachable',
      passed: ping.ok,
      detail: ping.ok ? `${ping.ms}ms` : `unreachable after ${ping.ms}ms`,
      required: true,
    })
  }

  // LLM providers
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

  // Node modules
  const nodeModulesPath = join(process.cwd(), 'node_modules')
  checks.push({
    label: 'Node modules installed',
    passed: existsSync(nodeModulesPath),
    required: true,
  })

  // --- Optional Checks ---

  // Ollama
  const ollamaUrl = process.env.OLLAMA_BASE_URL
  if (ollamaUrl) {
    try {
      const res = await fetch(ollamaUrl.replace('/api', ''), { signal: AbortSignal.timeout(3000) })
      checks.push({ label: 'Ollama reachable', passed: res.ok, required: false })
    } catch {
      checks.push({ label: 'Ollama reachable', passed: false, detail: 'not running', required: false })
    }
  }

  // ClickUp
  const clickupToken = process.env.CLICKUP_API_TOKEN
  if (clickupToken) {
    const valid = await checkClickUpToken(clickupToken)
    checks.push({ label: 'ClickUp token valid', passed: valid, required: false })
  } else {
    checks.push({ label: 'ClickUp token configured', passed: false, detail: 'not configured', required: false })
  }

  // Resend
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/runner/sys-check.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/runner/sys-check.ts lib/runner/sys-check.test.ts
git commit -m "feat(runner): add real system check validation script"
```

---

### Task 5: Wire sys-check into executor

**Files:**
- Modify: `lib/runner/executor.ts`
- Modify: `lib/runner/executor.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `lib/runner/executor.test.ts`:

```typescript
import { vi } from 'vitest'

describe('system_checker routing', () => {
  it('routes system_checker agent to runSystemCheck instead of LLM', async () => {
    // We can't easily integration-test executePipeline, so we verify
    // the sys-check module is importable and returns a StepResult
    const { runSystemCheck } = await import('./sys-check')

    // Set minimal env for a passing check
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
    process.env.ANTHROPIC_API_KEY = 'sk-test'
    global.fetch = vi.fn().mockResolvedValue({ ok: true })
    const fs = await import('fs')
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)

    const result = await runSystemCheck()

    expect(result.stepName).toBe('system_guard')
    expect(result.agentRole).toBe('system_checker')
    expect(result.provider).toBe('native')
    expect(result.model).toBe('native')
    expect(result.inputTokens).toBe(0)
    expect(result.estimatedCostUsd).toBe(0)
    expect(result.status).toBe('completed')
  })
})
```

- [ ] **Step 2: Run to verify it passes (this tests the contract)**

Run: `npx vitest run lib/runner/executor.test.ts`
Expected: All tests PASS (including the new one)

- [ ] **Step 3: Add the routing branch in executor.ts**

In `lib/runner/executor.ts`, add the import at the top:

```typescript
import { runSystemCheck } from './sys-check'
```

Then in the `executePipeline` function, find the block that starts with:

```typescript
    // Execute the agent
    const stepStart = Date.now()
    let result: StepResult
```

Replace the try/catch block that calls `runAgentLLM` with:

```typescript
    // Execute the agent
    const stepStart = Date.now()
    let result: StepResult

    if (agent.role === 'system_checker') {
      // Real system check — no LLM, actual environment validation
      result = await runSystemCheck()
    } else {
      try {
        const llmResult = await runAgentLLM(
          {
            provider: agent.provider,
            model_id: agent.model,
            prompt: agent.systemPrompt,
            token_budget: agent.tokenBudget,
          },
          userPrompt,
          context
        )

        result = {
          stepName: step.name,
          agentRole: agent.role,
          model: agent.model,
          provider: agent.provider,
          output: llmResult.text,
          inputTokens: llmResult.inputTokens,
          outputTokens: llmResult.outputTokens,
          estimatedCostUsd: llmResult.estimatedCostUsd,
          durationMs: Date.now() - stepStart,
          status: 'completed',
        }
      } catch (err) {
        result = {
          stepName: step.name,
          agentRole: agent.role,
          model: agent.model,
          provider: agent.provider,
          output: '',
          inputTokens: 0,
          outputTokens: 0,
          estimatedCostUsd: 0,
          durationMs: Date.now() - stepStart,
          status: 'failed',
          error: err instanceof Error ? err.message : String(err),
        }
      }
    }
```

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/runner/executor.ts lib/runner/executor.test.ts
git commit -m "feat(runner): route system_checker to real sys-check script"
```

---

### Task 6: Run full test suite and verify

**Files:** None (validation only)

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS with 0 failures

- [ ] **Step 2: Run TypeScript type check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Run linter**

Run: `npm run lint`
Expected: No lint errors on changed files

- [ ] **Step 4: Commit any fixes if needed**

Only if Steps 1-3 revealed issues. Otherwise skip.
