# Agent Prompt Enrichment & Real System Check

**Date:** 2026-04-07
**Status:** Design
**Scope:** Enrich 3 runner agent prompts with official plugin knowledge + replace LLM-based system check with a real validation script

---

## 1. Problem

### Agent Prompts Are Too Generic
The runner's `frontend_engineer.md`, `code_reviewer.md`, and `security_expert.md` agents have short, generic system prompts. They lack the domain-specific patterns, checklists, and anti-patterns that would make their output production-grade.

Three official Claude plugins contain exactly the knowledge these agents need:
- **frontend-design** — design thinking framework, typography/color/motion/layout guidelines, anti-patterns
- **code-review** — multi-perspective review methodology, confidence scoring, false positive filtering
- **security-guidance** — 9 specific vulnerability patterns, defense-in-depth methodology

### System Check Is Fake
The `system_checker` agent is an LLM that generates a markdown checklist — it cannot actually read environment variables, ping Supabase, or verify API keys. The system guard step provides false confidence.

---

## 2. Solution

### 2.1 Direct Prompt Enrichment (3 agents)

Extract knowledge from the three plugins and weave it into the agent system prompts. No code changes — prompt-only modifications.

#### `frontend_engineer.md`

Source: `frontend-design` plugin skill

Add the following knowledge areas to the system prompt:

**Design Thinking Framework** (before coding):
- Purpose: What problem does this interface solve? Who uses it?
- Tone: Commit to a bold aesthetic direction (minimalist, maximalist, retro-futuristic, editorial, etc.)
- Constraints: Technical requirements (framework, performance, accessibility)
- Differentiation: What makes this unforgettable?

**Typography Rules:**
- No generic fonts (Inter, Roboto, Arial, system fonts)
- Pair distinctive display font with refined body font
- Vary choices across different components/pages

**Color & Theme:**
- Use CSS variables for consistency
- Dominant colors with sharp accents (not evenly-distributed palettes)
- No cliche purple-gradient-on-white schemes
- Commit to a cohesive aesthetic

**Motion Guidelines:**
- CSS-first animations; use Motion library for React when available
- Prioritize high-impact moments: staggered page-load reveals over scattered micro-interactions
- Scroll-triggering and surprising hover states

**Spatial Composition:**
- Asymmetry, overlap, diagonal flow, grid-breaking elements
- Generous negative space OR controlled density (intentional, not default)

**Anti-Patterns (explicit ban list):**
- Generic AI aesthetics ("AI slop")
- Cookie-cutter component patterns
- Predictable layouts lacking context-specific character
- Converging on the same font/color choices across generations

#### `code_reviewer.md`

Source: `code-review` plugin command + superpowers `code-reviewer` agent

Add the following knowledge areas:

**Multi-Perspective Review:**
- Project rules compliance (check against CLAUDE.md / agent_rules.md)
- Bug scanning focused on changes, not pre-existing issues
- Code comment compliance (do changes honor existing code comments/TODOs?)
- Architecture alignment (does implementation match the spec/design from prior steps?)

**Confidence Scoring Rubric:**
- 0: False positive, doesn't stand up to scrutiny
- 25: Might be real, couldn't verify
- 50: Real but minor/nitpick, not important relative to the rest
- 75: Very likely real, will be hit in practice, important
- 100: Definitely real, confirmed with evidence

Only report issues at 75+ confidence. State the confidence level with each issue.

**False Positive Awareness (do NOT flag):**
- Pre-existing issues not introduced in this code
- Issues a linter/typechecker would catch (imports, types, formatting)
- Pedantic nitpicks a senior engineer wouldn't call out
- General quality issues unless explicitly required by project rules
- Issues silenced by lint-ignore comments
- Intentional functionality changes related to the broader feature

**Plan Alignment:**
- Compare implementation against spec/design from prior pipeline steps
- Identify deviations — are they justified improvements or problems?
- Verify all planned functionality is implemented

#### `security_expert.md`

Source: `security-guidance` plugin hooks + superpowers `defense-in-depth`

Add the following knowledge areas:

**9 Specific Vulnerability Patterns:**
1. Command injection — `child_process.exec`, `execSync`, `os.system`
2. Code injection via `eval()`
3. Code injection via `new Function()`
4. XSS via `dangerouslySetInnerHTML` (React)
5. XSS via `.innerHTML` assignment
6. XSS via `document.write`
7. Pickle deserialization (Python — flag if seen in any polyglot context)
8. GitHub Actions injection via untrusted context expressions
9. Shell injection via `os.system` / `from os import system`

For each: state the pattern, impact, and recommended fix.

**Defense-in-Depth Methodology:**
When reviewing code that handles user input or external data, verify validation at 4 layers:
1. Entry point validation — reject invalid input at API boundary
2. Business logic validation — ensure data makes sense for the operation
3. Environment guards — prevent dangerous operations in specific contexts (e.g., test env)
4. Debug instrumentation — logging with stack traces for forensics

**Next.js-Specific Security:**
- Server component data leaks (sensitive data in RSC payloads)
- API route auth checks (middleware coverage verification)
- Middleware bypass vectors (edge cases in route matching)
- Supabase RLS policy completeness (every table, every access pattern)

---

### 2.2 Real System Check Script

Replace the LLM-based `system_checker` with a real TypeScript validation script.

#### New File: `lib/runner/sys-check.ts`

Exports: `runSystemCheck(): Promise<StepResult>`

**Required Checks (pipeline aborts on failure):**

| Check | Method |
|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` set | `process.env` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` set | `process.env` |
| Supabase URL reachable | HTTP GET with timeout |
| At least one LLM provider API key set | Check ANTHROPIC/OPENAI/GOOGLE/GROQ env vars |
| `node_modules` exists | `fs.existsSync` |

**Optional Checks (reported but don't cause failure):**

| Check | Method |
|-------|--------|
| Each LLM provider key (list which are configured) | `process.env` |
| `CLICKUP_API_TOKEN` valid | API call to ClickUp `/user` endpoint |
| `RESEND_API_KEY` set | `process.env` |
| `RUNNER_ALERT_EMAIL` set (if Resend configured) | `process.env` |
| Ollama reachable (if URL configured) | HTTP GET with timeout |

**Output Format:**
```markdown
### Environment Check Results

**Status:** PASS | FAIL

**Checks:**
- [x] Supabase URL configured
- [x] Supabase connection reachable (238ms)
- [x] Anthropic API key configured
- [x] OpenAI API key configured
- [ ] Ollama (not running)
- [x] Node modules installed
- [x] ClickUp token valid
- [ ] Resend API key (not configured)

**Available LLM Providers:** anthropic, openai, google, groq
**Missing Optional:** ollama, resend

**Issues:** (only if FAIL)
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is not set. Add it to .env.local
```

**Returns:** `StepResult` with `status: 'completed'` (PASS) or `status: 'failed'` (FAIL), output as the markdown above, zero token usage, actual duration in ms.

#### Executor Change: `lib/runner/executor.ts`

Single branch in the step execution loop:

```typescript
if (agent.role === 'system_checker') {
  result = await runSystemCheck()
} else {
  // existing LLM path
  const llmResult = await runAgentLLM(...)
  result = { ... }
}
```

Everything else (hard gate logic, budget tracking, logging, run log) remains unchanged.

#### `system_checker.md` Agent File

Kept as documentation of what gets checked, but no longer used by the LLM router. The frontmatter remains valid so the loader doesn't break.

---

## 3. Files Changed

| File | Action | Description |
|------|--------|-------------|
| `ai/agents/frontend_engineer.md` | Modified | Enriched with frontend-design plugin knowledge |
| `ai/agents/code_reviewer.md` | Modified | Enriched with code-review plugin knowledge |
| `ai/agents/security_expert.md` | Modified | Enriched with security-guidance plugin knowledge |
| `lib/runner/sys-check.ts` | Created | Real environment validation script |
| `lib/runner/executor.ts` | Modified | Single branch to route system_checker to real script |

---

## 4. What Does NOT Change

- Pipeline definitions (no changes to `ai/pipelines/*.md`)
- LLM router (`lib/llm/router.ts`)
- Loader (`lib/runner/loader.ts`)
- Budget monitor, logger, notify modules
- ClickUp integration
- CLI entry points
- Test suite structure

---

## 5. Cost Impact

- **Prompt enrichment:** ~500-1000 extra input tokens per enriched agent call. At current pricing, this adds ~$0.005-0.01 per pipeline run. Negligible.
- **System check:** Goes from ~$0.01 (Haiku call) to $0.00 (no LLM). Saves tokens on every run.
- **Net:** Roughly cost-neutral.

---

## 6. Testing

- **Agent prompts:** Run `system_guard` pipeline to verify sys-check, then a short feature pipeline to verify enriched agents produce richer output
- **Sys-check script:** Unit tests for each check (mock env vars, mock HTTP responses)
- **Executor integration:** Verify system_checker role routes to `runSystemCheck()` instead of LLM
