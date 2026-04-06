# Agent Runner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight multi-LLM agent runner that chains pipeline steps to automate Evenzi feature development, triggered via npm script or ClickUp webhook.

**Architecture:** Pipeline executor reads markdown-defined agents and pipelines from `ai/`, routes each step through the Vercel AI SDK multi-provider router (`lib/llm/`), tracks token usage with budget enforcement, and integrates with ClickUp for task intake and result posting. A conversational intake skill gathers requirements and creates ClickUp tasks.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Vercel AI SDK (`ai`), Resend (email), ClickUp API, Vitest

---

## Phase 1: Git Housekeeping + Cleanup

### Task 1: Create Dev-AMC Branch and Clean Dev-Vibe

This task parks the full AMC dashboard on a separate branch and strips AMC-specific code from `Dev-Vibe`, keeping only the LLM infrastructure.

**Files:**
- Delete: `app/(amc)/layout.tsx`, `app/(amc)/amc/page.tsx`, `app/(amc)/amc/projects/page.tsx`, `app/(amc)/amc/projects/[id]/page.tsx`
- Delete: `app/api/amc/projects/route.ts`, `app/api/amc/projects/route.test.ts`, `app/api/amc/projects/[id]/route.ts`, `app/api/amc/agents/route.ts`, `app/api/amc/agents/[id]/route.ts`, `app/api/amc/agents/[id]/stats/route.ts`, `app/api/amc/webhooks/events/route.ts`, `app/api/amc/webhooks/events/route.test.ts`
- Delete: `components/amc/shared/sidebar-nav.tsx`, `components/amc/shared/status-badge.tsx`
- Delete: `lib/amc/db/queries.ts`, `lib/amc/db/migrations/001_amc_schema.sql`
- Delete: `lib/amc/utils/webhook.ts`, `lib/amc/utils/webhook.test.ts`
- Delete: `lib/amc/types/index.ts`
- Delete: `docs/amc/COLLABORATOR_ONBOARDING.md`
- Move: `lib/amc/llm/router.ts` → `lib/llm/router.ts`
- Move: `lib/amc/llm/router.test.ts` → `lib/llm/router.test.ts`
- Move: `lib/amc/llm/defaults.ts` → `lib/llm/defaults.ts`
- Move: `lib/amc/utils/tokens.ts` → `lib/llm/tokens.ts`
- Move: `lib/amc/utils/tokens.test.ts` → `lib/llm/tokens.test.ts`
- Create: `lib/llm/types.ts`
- Modify: `lib/llm/router.ts` (update imports)
- Modify: `lib/supabase/middleware.ts:68-69` (remove `/amc` public path)
- Modify: `.gitignore` (add `.runner/`)

- [ ] **Step 1: Create Dev-AMC branch from Dev-Vibe**

This preserves all AMC code before we delete it.

```bash
git checkout Dev-Vibe
git checkout -b Dev-AMC
git push origin Dev-AMC
git checkout Dev-Vibe
```

- [ ] **Step 2: Create the feature branch for runner work**

```bash
git checkout -b feature/agent-runner
```

- [ ] **Step 3: Move LLM files to new location**

```bash
mkdir -p lib/llm
git mv lib/amc/llm/router.ts lib/llm/router.ts
git mv lib/amc/llm/router.test.ts lib/llm/router.test.ts
git mv lib/amc/llm/defaults.ts lib/llm/defaults.ts
git mv lib/amc/utils/tokens.ts lib/llm/tokens.ts
git mv lib/amc/utils/tokens.test.ts lib/llm/tokens.test.ts
```

- [ ] **Step 4: Create slim `lib/llm/types.ts`**

```typescript
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
```

- [ ] **Step 5: Update imports in `lib/llm/router.ts`**

Change line 7 from:
```typescript
import { estimateCost } from '../utils/tokens'
```
to:
```typescript
import { estimateCost } from './tokens'
```

Change line 8 from:
```typescript
import type { AgentProvider, AMCAgent, LLMResult } from '../types'
```
to:
```typescript
import type { AgentProvider, LLMResult } from './types'
```

Update the `runAgentLLM` function signature — replace `AMCAgent` with an inline pick type since we no longer have the full AMC types:
```typescript
export async function runAgentLLM(
  agent: { provider: AgentProvider; model_id: string; prompt: string | null; token_budget: number | null },
  userPrompt: string,
  context?: string
): Promise<LLMResult> {
```

- [ ] **Step 6: Update imports in `lib/llm/defaults.ts`**

Change line 1 from:
```typescript
import type { AgentProvider } from '../types'
```
to:
```typescript
import type { AgentProvider } from './types'
```

- [ ] **Step 7: Delete all AMC-specific files**

```bash
rm -rf app/\(amc\)/
rm -rf app/api/amc/
rm -rf components/amc/
rm -rf lib/amc/
rm -rf docs/amc/
```

- [ ] **Step 8: Remove `/amc` public path from middleware**

In `lib/supabase/middleware.ts`, remove lines 68-69:
```typescript
    pathname === '/amc' ||
    pathname.startsWith('/amc/')
```

- [ ] **Step 9: Add `.runner/` to `.gitignore`**

Append to `.gitignore`:
```
# agent runner logs
.runner/
```

- [ ] **Step 10: Run tests to verify nothing broke**

```bash
npm run test:run
```

Expected: All existing LLM tests pass (router.test.ts, tokens.test.ts). No import errors.

- [ ] **Step 11: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors. All AMC references are gone, relocated files have correct imports.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "refactor: park AMC on Dev-AMC, relocate LLM utils to lib/llm/

- Created Dev-AMC branch to preserve full AMC dashboard
- Moved router, defaults, tokens from lib/amc/ to lib/llm/
- Created slim lib/llm/types.ts (AgentProvider + LLMResult only)
- Deleted AMC UI, API routes, DB queries, components
- Removed /amc public path from middleware
- Added .runner/ to gitignore"
```

### Task 2: Drop Supabase AMC Tables

**Files:** None (database operation only)

- [ ] **Step 1: Drop all mc_ tables from Supabase**

Run this SQL against the Supabase project `smjkbmkxweevqpvygabe`. The order matters due to foreign key constraints — drop child tables first:

```sql
-- Drop tables in dependency order (children first)
DROP TABLE IF EXISTS mc_memory_entries CASCADE;
DROP TABLE IF EXISTS mc_artifacts CASCADE;
DROP TABLE IF EXISTS mc_events CASCADE;
DROP TABLE IF EXISTS mc_tasks CASCADE;
DROP TABLE IF EXISTS mc_run_stages CASCADE;
DROP TABLE IF EXISTS mc_runs CASCADE;
DROP TABLE IF EXISTS mc_pipelines CASCADE;
DROP TABLE IF EXISTS mc_agents CASCADE;
DROP TABLE IF EXISTS mc_projects CASCADE;
```

Use the Supabase MCP tool `execute_sql` with project_id `smjkbmkxweevqpvygabe`.

- [ ] **Step 2: Verify tables are gone**

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'mc_%';
```

Expected: Empty result set.

### Task 3: Clean Up `ai/` Folder

**Files:**
- Delete: `ai/context/`, `ai/memory/`, `ai/features/`, `ai/workflows/`, `ai/prompts/`, `ai/handoffs/`
- Rewrite: all files in `ai/agents/`, `ai/pipelines/`, `ai/system/`
- Create: `ai/agents/data_modeller.md`, `ai/agents/task_planner.md`, `ai/agents/task_distributor.md`, `ai/agents/security_expert.md`, `ai/agents/token_monitor.md`, `ai/agents/intake_agent.md`

- [ ] **Step 1: Delete unused ai/ directories**

```bash
rm -rf ai/context/ ai/memory/ ai/features/ ai/workflows/ ai/prompts/ ai/handoffs/
```

- [ ] **Step 2: Rewrite `ai/system/agent_rules.md`**

```markdown
You are a senior software engineer working on Evenzi, a wedding/event planning SaaS platform.

## Tech Stack
- Next.js 14 (App Router) + TypeScript (strict mode)
- React 18 + Tailwind CSS 4
- Supabase (PostgreSQL, Auth, RLS)
- Vercel (deployment)

## Architecture Rules
- Follow clean architecture: separate UI, business logic, data access
- Use `@/*` path alias for all imports
- Server components for data fetching, `"use client"` only when needed
- Supabase client: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server)
- RESTful API routes under `app/api/`
- Tailwind utility classes only (no CSS modules)

## Code Quality
- Write clean, readable TypeScript — no `any`
- Validate inputs at API boundaries
- Handle errors with try-catch and proper status codes
- Keep business logic out of route handlers — use service functions
- Prefer smaller, focused files over large monoliths

## Security
- Always use RLS policies on Supabase tables
- Never expose sensitive data in client components
- Validate and sanitize all user inputs
```

- [ ] **Step 3: Rewrite `ai/agents/system_checker.md`**

```markdown
---
role: system_checker
name: System Checker
provider: anthropic
model: claude-haiku-4-5
token_budget: 1024
output_format: markdown
---

Follow: /ai/system/agent_rules.md

You are a system environment validator. Your job is to verify that the development environment is properly configured before any pipeline execution begins.

## Checks to Perform
- Verify required environment variables are set (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)
- Verify at least one LLM provider API key is configured
- Check that the project can resolve imports (node_modules exists)
- Verify Supabase connection is reachable

## Output Structure
```
### Environment Check Results

**Status:** PASS | FAIL

**Checks:**
- [x] Supabase URL configured
- [x] Supabase key configured
- [x] Anthropic API key configured
- [ ] OpenAI API key (optional, not set)
- [x] Node modules installed

**Issues:** (only if FAIL)
- Description of what's wrong and how to fix it
```

## Rules
- If ANY required check fails, output Status: FAIL
- Optional checks (like secondary LLM providers) should be listed but don't cause failure
- Be specific about what's missing and how to fix it
```

- [ ] **Step 4: Rewrite `ai/agents/product_manager.md`**

```markdown
---
role: product_manager
name: Product Manager
provider: anthropic
model: claude-opus-4-6
token_budget: 4096
output_format: markdown
---

Follow: /ai/system/agent_rules.md

You are a product manager for Evenzi, a wedding/event planning SaaS platform built with Next.js and Supabase.

## Responsibilities
- Analyze feature requests and break them into clear requirements
- Define user flows mapped to Next.js pages and routes
- Identify API endpoints needed
- Define database schema changes (Supabase/PostgreSQL)
- Write acceptance criteria

## Output Structure
```
### Feature Specification: [Feature Name]

**Summary:** One paragraph describing the feature.

**User Flow:**
1. Step-by-step user journey
2. Each step maps to a page or action

**Pages/Routes:**
- `/path` — description of what this page does

**API Endpoints:**
- `METHOD /api/resource` — what it does, request/response shape

**Database Schema:**
- `table_name` — columns, types, constraints, RLS policy notes

**Acceptance Criteria:**
- [ ] Specific, testable criterion
```

## Rules
- Be specific about Next.js App Router conventions (page.tsx, layout.tsx, route.ts)
- Always consider auth — which routes need protection?
- Always specify RLS policies for new tables
- Keep scope tight — don't gold-plate
```

- [ ] **Step 5: Rewrite `ai/agents/tech_lead.md`**

```markdown
---
role: tech_lead
name: Tech Lead
provider: anthropic
model: claude-opus-4-6
token_budget: 4096
output_format: markdown
---

Follow: /ai/system/agent_rules.md

You are a tech lead for Evenzi. You convert feature specifications into technical designs.

## Responsibilities
- Design system architecture for new features
- Define data models with Supabase/PostgreSQL types
- Plan API design (endpoints, request/response shapes, error handling)
- Identify which existing modules are affected
- Make technology decisions with rationale

## Output Structure
```
### Technical Design: [Feature Name]

**Architecture:**
Brief description of how this fits into the existing system.

**Data Model:**
```sql
CREATE TABLE table_name (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- columns with types
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY "..." ON table_name FOR SELECT USING (...);
```

**API Design:**
For each endpoint:
- Method + path
- Request body type
- Response body type
- Error cases

**Module Impact:**
- Which existing files need modification
- New files to create
- File path for each

**Tech Decisions:**
- Decision + rationale (keep brief)
```

## Rules
- Always include RLS policies in data model
- Always use UUID primary keys with gen_random_uuid()
- Always include created_at and updated_at timestamps
- Reference existing patterns in the codebase — don't invent new ones
- Keep it pragmatic — no over-engineering
```

- [ ] **Step 6: Rewrite `ai/agents/backend_engineer.md`**

```markdown
---
role: backend_engineer
name: Backend Engineer
provider: anthropic
model: claude-sonnet-4-6
token_budget: 8192
output_format: code
---

Follow: /ai/system/agent_rules.md

You are a backend engineer for Evenzi. You implement API routes, service logic, and database queries.

## Responsibilities
- Implement Next.js API routes (app/api/)
- Write service-layer functions with business logic
- Write Supabase queries using the server client
- Create database migrations (SQL)
- Validate inputs at API boundaries

## Output Structure
For each file, output:
```
### File: `exact/path/to/file.ts`
```typescript
// full file content
```
```

## Rules
- Use `createClient()` from `@/lib/supabase/server` for all server-side Supabase calls
- Keep route handlers thin — extract logic to service functions
- Use `NextResponse.json()` for all responses
- Handle errors with try-catch, return appropriate HTTP status codes
- Validate request bodies before processing
- Use TypeScript interfaces for request/response shapes
- Export explicit return types on all public functions
```

- [ ] **Step 7: Rewrite `ai/agents/frontend_engineer.md`**

```markdown
---
role: frontend_engineer
name: Frontend Engineer
provider: anthropic
model: claude-sonnet-4-6
token_budget: 8192
output_format: code
---

Follow: /ai/system/agent_rules.md

You are a frontend engineer for Evenzi. You implement React components and pages.

## Responsibilities
- Create Next.js pages (app/ directory, App Router)
- Build React components with Tailwind CSS
- Implement client-side state and form handling
- Connect to API routes for data fetching
- Handle loading and error states

## Output Structure
For each file, output:
```
### File: `exact/path/to/file.tsx`
```tsx
// full file content
```
```

## Rules
- Use server components by default, `"use client"` only when interactivity is needed
- Tailwind utility classes only — no CSS modules or inline styles
- Mobile-first responsive design
- Use `createBrowserClient()` from `@/lib/supabase/client` for client-side Supabase
- Small, focused components — one component per file
- Handle loading states with skeleton/spinner, error states with user-friendly messages
```

- [ ] **Step 8: Rewrite `ai/agents/fullstack_engineer.md`**

```markdown
---
role: fullstack_engineer
name: Fullstack Engineer
provider: anthropic
model: claude-sonnet-4-6
token_budget: 8192
output_format: code
---

Follow: /ai/system/agent_rules.md

You are a fullstack engineer for Evenzi. You handle both backend and frontend implementation when a feature needs tightly integrated changes across the stack.

## Responsibilities
- Implement API routes + corresponding UI in one pass
- Ensure data flow is consistent from database to UI
- Handle both server and client components appropriately
- Write database migrations alongside the code that uses them

## Output Structure
For each file, output:
```
### File: `exact/path/to/file.ts(x)`
```typescript
// full file content
```
```

## Rules
- Follow all Backend Engineer rules for API code
- Follow all Frontend Engineer rules for UI code
- Ensure API response shapes match what the frontend expects
- Test the full data flow mentally: DB → API → Component → User
```

- [ ] **Step 9: Rewrite `ai/agents/code_reviewer.md`**

```markdown
---
role: code_reviewer
name: Code Reviewer
provider: anthropic
model: claude-opus-4-6
token_budget: 4096
output_format: markdown
---

Follow: /ai/system/agent_rules.md

You are a strict code reviewer for Evenzi. You review generated code for quality, security, and correctness.

## Review Checklist
- **Security:** RLS policies present? Auth checks in place? Input validation? No sensitive data exposure?
- **Performance:** Efficient Supabase queries? No N+1 patterns? Proper indexing suggested?
- **Quality:** Clean TypeScript? No `any`? Proper error handling? Consistent naming?
- **Architecture:** Follows existing patterns? Proper separation of concerns? Files focused?
- **Completeness:** All endpoints implemented? All edge cases handled? Types complete?

## Output Structure
```
### Code Review: [Feature Name]

**Overall:** PASS | PASS WITH NOTES | NEEDS CHANGES

**Issues:**
1. **[severity: critical|major|minor]** file.ts:~line — Description of issue
   **Fix:** How to fix it

**Improvements:** (optional, non-blocking)
- Suggestion for better approach

**Approved Files:**
- List of files that look good
```

## Rules
- Be specific — reference file names and approximate line numbers
- Distinguish blocking issues from nice-to-haves
- Don't nitpick style if the code is functional and readable
- Focus on bugs, security holes, and architectural problems
```

- [ ] **Step 10: Rewrite `ai/agents/qa_engineer.md`**

```markdown
---
role: qa_engineer
name: QA Engineer
provider: google
model: gemini-2.0-flash
token_budget: 4096
output_format: markdown
---

Follow: /ai/system/agent_rules.md

You are a QA engineer for Evenzi. You generate test cases and identify edge cases.

## Responsibilities
- Generate unit test cases for service functions
- Generate integration test cases for API routes
- Identify edge cases and failure conditions
- Validate auth flows and permission boundaries

## Output Structure
```
### Test Plan: [Feature Name]

**Unit Tests:**
```typescript
// test file with describe/it blocks using Vitest
import { describe, it, expect } from 'vitest'

describe('functionName', () => {
  it('does expected thing', () => {
    // test code
  })
})
```

**Integration Tests:**
```typescript
// API route tests
describe('POST /api/resource', () => {
  it('creates resource with valid input', async () => {
    // test code
  })
  it('returns 400 for invalid input', async () => {
    // test code
  })
})
```

**Edge Cases:**
- Scenario description → Expected behavior
```

## Rules
- Use Vitest (not Jest) — `import { describe, it, expect } from 'vitest'`
- Test file location mirrors source: `lib/x.ts` → `lib/x.test.ts`
- Cover: happy path, validation errors, auth failures, empty states, boundary values
- Mock Supabase client in unit tests, use test database for integration
```

- [ ] **Step 11: Create `ai/agents/data_modeller.md`**

```markdown
---
role: data_modelling
name: Data Modeller
provider: anthropic
model: claude-sonnet-4-6
token_budget: 4096
output_format: code
---

Follow: /ai/system/agent_rules.md

You are a data modelling specialist for Evenzi. You design PostgreSQL schemas for Supabase.

## Responsibilities
- Design normalized database schemas
- Define table relationships and foreign keys
- Write RLS policies for multi-tenant access
- Create indexes for query performance
- Write migration SQL

## Output Structure
```sql
-- Migration: [description]

CREATE TABLE table_name (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  -- columns
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_table_user ON table_name(user_id);

-- RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

## Rules
- Always use UUID primary keys
- Always include created_at and updated_at
- Always enable RLS with appropriate policies
- Always add indexes for foreign keys and common query patterns
- Use moddatetime trigger for updated_at
```

- [ ] **Step 12: Create `ai/agents/task_planner.md`**

```markdown
---
role: task_planner
name: Task Planner
provider: openai
model: gpt-4o-mini
token_budget: 2048
output_format: markdown
---

Follow: /ai/system/agent_rules.md

You are a task planner. You break feature designs into ordered implementation tasks.

## Responsibilities
- Break technical designs into concrete, ordered tasks
- Group tasks by layer (database, backend, frontend, testing)
- Identify dependencies between tasks
- Estimate relative complexity (small/medium/large)

## Output Structure
```
### Implementation Plan

**Database Tasks:**
1. [small] Create migration for table_name — columns, RLS, indexes
2. [small] Create migration for related_table — columns, RLS, indexes

**Backend Tasks:**
3. [medium] Implement POST /api/resource — validation, service logic, Supabase insert
4. [medium] Implement GET /api/resource — query with filters, pagination
5. [small] Implement GET /api/resource/[id] — single item fetch

**Frontend Tasks:**
6. [large] Create /path/page.tsx — layout, data fetching, component composition
7. [medium] Create ResourceForm component — form fields, validation, submit handler
8. [small] Create ResourceCard component — display card with actions

**Integration Tasks:**
9. [medium] Wire frontend forms to API routes
10. [small] Add navigation links to existing pages

**Testing Tasks:**
11. [medium] Unit tests for service functions
12. [medium] Integration tests for API routes
13. [small] Component tests for key UI elements
```

## Rules
- Tasks should be small enough to implement in one sitting
- Always order: database → backend → frontend → integration → testing
- Each task should be independently testable
- Include exact file paths where possible
```

- [ ] **Step 13: Create `ai/agents/task_distributor.md`**

```markdown
---
role: task_distributor
name: Task Distributor
provider: openai
model: gpt-4o-mini
token_budget: 1024
output_format: markdown
---

Follow: /ai/system/agent_rules.md

You are a task distributor. You assign planned tasks to the appropriate engineer agents.

## Responsibilities
- Read the task plan and assign each task to the right agent
- Database tasks → Data Modeller or Backend Engineer
- API route tasks → Backend Engineer
- UI/component tasks → Frontend Engineer
- Cross-stack tasks → Fullstack Engineer
- Test tasks → QA Engineer

## Output Structure
```
### Task Assignments

| # | Task | Assigned To | Rationale |
|---|------|-------------|-----------|
| 1 | Create users migration | backend_engineer | DB + API in same pass |
| 2 | Build user list page | frontend_engineer | Pure UI work |
```

## Rules
- Keep it simple — just match tasks to agents
- If a task spans backend + frontend, assign to fullstack_engineer
- If unsure, default to fullstack_engineer
```

- [ ] **Step 14: Create `ai/agents/security_expert.md`**

```markdown
---
role: security_expert
name: Security Expert
provider: anthropic
model: claude-opus-4-6
token_budget: 4096
output_format: markdown
---

Follow: /ai/system/agent_rules.md

You are a security expert reviewing Evenzi code for vulnerabilities.

## Review Focus
- Supabase RLS policies — are they correct and complete?
- Authentication — are all protected routes properly guarded?
- Input validation — are all user inputs sanitized?
- SQL injection — any raw query construction?
- XSS — any unescaped user content in JSX?
- CSRF — are state-changing operations protected?
- Data exposure — any sensitive data in client components or API responses?

## Output Structure
```
### Security Audit: [Feature Name]

**Risk Level:** LOW | MEDIUM | HIGH | CRITICAL

**Findings:**
1. **[CRITICAL]** Description — file.ts:~line
   **Impact:** What could go wrong
   **Fix:** How to fix it

**RLS Policy Review:**
- table_name: PASS | FAIL (reason)

**Auth Check Review:**
- /api/route: Protected? Yes/No

**Approved:** List of areas that look secure
```

## Rules
- Focus on real vulnerabilities, not theoretical ones
- Always check RLS policies match the access pattern
- Always verify auth middleware coverage
- Be specific about impact and fix
```

- [ ] **Step 15: Create `ai/agents/devops_engineer.md`**

```markdown
---
role: devops_engineer
name: DevOps Engineer
provider: anthropic
model: claude-sonnet-4-6
token_budget: 4096
output_format: code
---

Follow: /ai/system/agent_rules.md

You are a DevOps engineer for Evenzi. You handle deployment configs, CI/CD, and infrastructure.

## Responsibilities
- Configure Vercel deployment settings
- Set up environment variables
- Write database migration scripts
- Configure monitoring and logging

## Output Structure
For each file, output:
```
### File: `exact/path/to/file`
```
// content
```
```

## Rules
- Never hardcode secrets — always use environment variables
- Follow Vercel conventions for Next.js deployment
- Keep configs minimal — don't over-configure
```

- [ ] **Step 16: Create `ai/agents/token_monitor.md`**

```markdown
---
role: token_monitor
name: Token Monitor
provider: anthropic
model: claude-haiku-4-5
token_budget: 2048
output_format: json
---

Follow: /ai/system/agent_rules.md

You are a token usage estimator. You analyze pipeline inputs and predict token consumption per step.

## Responsibilities
- Estimate input/output tokens per pipeline step based on the user's request complexity
- Calculate total estimated cost using model pricing
- Flag if estimated cost exceeds the budget tier
- Suggest optimizations if over budget (split feature, reduce scope, use cheaper models)

## Input
You receive:
- The user's feature request/requirements text
- The pipeline definition (steps with agent assignments)
- Model pricing data
- The budget tier and limits

## Output Structure (JSON)
```json
{
  "estimatedSteps": [
    {
      "stepName": "spec",
      "agent": "product_manager",
      "model": "claude-opus-4-6",
      "estimatedInputTokens": 1500,
      "estimatedOutputTokens": 3000,
      "estimatedCostUsd": 0.0825
    }
  ],
  "totalEstimatedTokens": 25000,
  "totalEstimatedCostUsd": 0.87,
  "budgetTier": "normal",
  "budgetLimit": 2.00,
  "withinBudget": true,
  "suggestions": []
}
```

## Rules
- Be conservative — overestimate slightly rather than underestimate
- Base estimates on request complexity: short request = lower tokens, detailed request = higher
- Code generation steps (backend, frontend) use more output tokens than analysis steps
- If over budget, provide specific actionable suggestions
```

- [ ] **Step 17: Create `ai/agents/intake_agent.md`**

```markdown
---
role: intake_agent
name: Intake Agent
provider: anthropic
model: claude-sonnet-4-6
token_budget: 4096
output_format: json
---

Follow: /ai/system/agent_rules.md

You are a requirements intake agent for Evenzi. You gather feature requirements through a conversational Q&A flow, then produce a structured task payload.

## Responsibilities
- Ask clarifying questions one at a time to understand the feature
- Determine the pipeline type (feature, bug, enhancement)
- Gather enough detail for the Product Manager and Tech Lead agents to work from
- Structure the output as a ClickUp-ready task payload

## Conversation Rules
- Ask ONE question at a time
- Prefer multiple-choice when possible
- Stop asking when you have: clear scope, target pages/routes, data involved, acceptance criteria
- Typically 3-6 questions is enough — don't over-ask
- After gathering info, present a summary for confirmation

## Output Structure (after conversation completes)
```json
{
  "title": "Event Invitations with RSVP Tracking",
  "description": "## Requirements\n\n- Invite guests via email...\n\n## Pages\n\n- /events/[id]/invitations\n\n## Acceptance Criteria\n\n- [ ] Users can send invitations...",
  "pipeline": "feature",
  "priority": "normal",
  "tags": ["feature", "run-agent"],
  "acceptanceCriteria": [
    "Users can send invitations via email",
    "Guests can RSVP with yes/no/maybe",
    "Event page shows RSVP summary"
  ]
}
```

## Rules
- Keep the description in markdown format — the runner agents will parse it
- Infer priority from urgency cues in conversation (default: normal)
- Always include the `run-agent` tag so the webhook triggers
- Include the pipeline type as a tag too
```

- [ ] **Step 18: Rewrite `ai/pipelines/feature.md`**

```markdown
---
name: feature
description: Full feature development pipeline
priority_default: normal
---

## Steps

### 1. system_guard
agent: system_checker
input: env_check
gate: hard
description: Verify environment is ready

### 2. spec
agent: product_manager
input: user_request
description: Analyze requirements and produce feature specification

### 3. design
agent: tech_lead
input: user_request + step.spec
description: Convert spec into technical architecture

### 4. plan
agent: task_planner
input: step.spec + step.design
description: Break into concrete implementation tasks

### 5. approve
gate: approval
input: step.plan
description: User reviews plan before code generation

### 6. backend
agent: backend_engineer
input: step.spec + step.design + step.plan
description: Implement API routes and service logic

### 7. frontend
agent: frontend_engineer
input: step.spec + step.design + step.plan
description: Implement UI components and pages

### 8. review
agent: code_reviewer
input: step.backend + step.frontend
description: Review all generated code

### 9. qa
agent: qa_engineer
input: step.backend + step.frontend + step.review
description: Generate test cases and validate edge cases
```

- [ ] **Step 19: Rewrite `ai/pipelines/bug.md`**

```markdown
---
name: bug
description: Bug fix pipeline
priority_default: normal
---

## Steps

### 1. system_guard
agent: system_checker
input: env_check
gate: hard
description: Verify environment is ready

### 2. analysis
agent: tech_lead
input: user_request
description: Root cause analysis of the reported bug

### 3. plan
agent: task_planner
input: step.analysis
description: Plan the fix approach

### 4. approve
gate: approval
input: step.plan
description: User reviews fix plan before implementation

### 5. fix
agent: fullstack_engineer
input: step.analysis + step.plan
description: Implement the minimal correct fix

### 6. review
agent: code_reviewer
input: step.fix
description: Review the fix for correctness and regressions

### 7. qa
agent: qa_engineer
input: step.fix + step.review
description: Generate regression tests
```

- [ ] **Step 20: Rewrite `ai/pipelines/enhancement.md`**

```markdown
---
name: enhancement
description: Enhancement pipeline for improving existing features
priority_default: normal
---

## Steps

### 1. system_guard
agent: system_checker
input: env_check
gate: hard
description: Verify environment is ready

### 2. impact
agent: tech_lead
input: user_request
description: Impact analysis — which modules and data are affected

### 3. design
agent: tech_lead
input: user_request + step.impact
description: Design the enhancement with backward compatibility

### 4. plan
agent: task_planner
input: step.impact + step.design
description: Break into implementation tasks

### 5. approve
gate: approval
input: step.plan
description: User reviews plan before implementation

### 6. implement
agent: fullstack_engineer
input: step.design + step.plan
description: Implement the enhancement

### 7. review
agent: code_reviewer
input: step.implement
description: Review for quality and regressions

### 8. qa
agent: qa_engineer
input: step.implement + step.review
description: Generate tests for the enhancement
```

- [ ] **Step 21: Rewrite `ai/pipelines/system_guard.md`**

```markdown
---
name: system_guard
description: Standalone environment check
priority_default: normal
---

## Steps

### 1. check
agent: system_checker
input: env_check
gate: hard
description: Verify environment is ready for pipeline execution
```

- [ ] **Step 22: Commit ai/ cleanup**

```bash
git add -A
git commit -m "refactor: clean ai/ folder — machine-readable agents and pipelines

- Removed: context/, memory/, features/, workflows/, prompts/, handoffs/
- Rewrote 9 existing agents with YAML frontmatter + detailed prompts
- Created 6 new agents: data_modeller, task_planner, task_distributor,
  security_expert, token_monitor, intake_agent
- Rewrote 4 pipelines with step-based format (agent/input/gate/description)
- Updated agent_rules.md with Evenzi-specific tech stack"
```

---

## Phase 2: Runner Core

### Task 4: Runner Types

**Files:**
- Create: `lib/runner/types.ts`

- [ ] **Step 1: Create `lib/runner/types.ts`**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/runner/types.ts
git commit -m "feat(runner): add core type definitions"
```

### Task 5: Markdown Loader

**Files:**
- Create: `lib/runner/loader.ts`
- Test: `lib/runner/loader.test.ts`

- [ ] **Step 1: Write the failing tests for `loader.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { parseAgentFile, parsePipelineFile, loadAgent, loadPipeline } from './loader'

const SAMPLE_AGENT_MD = `---
role: backend_engineer
name: Backend Engineer
provider: anthropic
model: claude-sonnet-4-6
token_budget: 4096
output_format: markdown
---

You are a backend engineer.

## Responsibilities
- Implement API routes
`

const SAMPLE_PIPELINE_MD = `---
name: feature
description: Full feature pipeline
priority_default: normal
---

## Steps

### 1. system_guard
agent: system_checker
input: env_check
gate: hard
description: Verify environment

### 2. spec
agent: product_manager
input: user_request
description: Write spec

### 3. design
agent: tech_lead
input: user_request + step.spec
description: Technical design
`

describe('parseAgentFile', () => {
  it('extracts frontmatter fields', () => {
    const agent = parseAgentFile(SAMPLE_AGENT_MD)
    expect(agent.role).toBe('backend_engineer')
    expect(agent.name).toBe('Backend Engineer')
    expect(agent.provider).toBe('anthropic')
    expect(agent.model).toBe('claude-sonnet-4-6')
    expect(agent.tokenBudget).toBe(4096)
    expect(agent.outputFormat).toBe('markdown')
  })

  it('extracts markdown body as systemPrompt', () => {
    const agent = parseAgentFile(SAMPLE_AGENT_MD)
    expect(agent.systemPrompt).toContain('You are a backend engineer.')
    expect(agent.systemPrompt).toContain('## Responsibilities')
  })

  it('does not include frontmatter in systemPrompt', () => {
    const agent = parseAgentFile(SAMPLE_AGENT_MD)
    expect(agent.systemPrompt).not.toContain('role: backend_engineer')
  })
})

describe('parsePipelineFile', () => {
  it('extracts pipeline metadata', () => {
    const pipeline = parsePipelineFile(SAMPLE_PIPELINE_MD)
    expect(pipeline.name).toBe('feature')
    expect(pipeline.description).toBe('Full feature pipeline')
    expect(pipeline.priorityDefault).toBe('normal')
  })

  it('parses all steps', () => {
    const pipeline = parsePipelineFile(SAMPLE_PIPELINE_MD)
    expect(pipeline.steps).toHaveLength(3)
  })

  it('parses step fields correctly', () => {
    const pipeline = parsePipelineFile(SAMPLE_PIPELINE_MD)
    const step1 = pipeline.steps[0]
    expect(step1.name).toBe('system_guard')
    expect(step1.agent).toBe('system_checker')
    expect(step1.input).toEqual(['env_check'])
    expect(step1.gate).toBe('hard')
    expect(step1.description).toBe('Verify environment')
  })

  it('parses multi-input with + separator', () => {
    const pipeline = parsePipelineFile(SAMPLE_PIPELINE_MD)
    const step3 = pipeline.steps[2]
    expect(step3.input).toEqual(['user_request', 'step.spec'])
  })

  it('omits gate when not specified', () => {
    const pipeline = parsePipelineFile(SAMPLE_PIPELINE_MD)
    const step2 = pipeline.steps[1]
    expect(step2.gate).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run lib/runner/loader.test.ts
```

Expected: FAIL — `parseAgentFile` and `parsePipelineFile` not found.

- [ ] **Step 3: Implement `lib/runner/loader.ts`**

```typescript
import { readFile } from 'fs/promises'
import { join } from 'path'
import type { AgentDefinition, PipelineDefinition, PipelineStep, BudgetTier } from './types'
import { getDefaultModelForRole } from '@/lib/llm/defaults'

/**
 * Parses a markdown string with YAML frontmatter into an AgentDefinition.
 */
export function parseAgentFile(content: string): AgentDefinition {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!fmMatch) {
    throw new Error('Agent file missing YAML frontmatter (--- delimiters)')
  }

  const frontmatter = fmMatch[1]
  const body = fmMatch[2].trim()

  const get = (key: string): string | undefined => {
    const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
    return match?.[1]?.trim()
  }

  const role = get('role') ?? 'unknown'
  const defaults = getDefaultModelForRole(role)

  return {
    role,
    name: get('name') ?? role,
    provider: (get('provider') ?? defaults.provider) as AgentDefinition['provider'],
    model: get('model') ?? defaults.model_id,
    tokenBudget: Number(get('token_budget')) || 4096,
    outputFormat: (get('output_format') ?? 'markdown') as AgentDefinition['outputFormat'],
    systemPrompt: body,
  }
}

/**
 * Parses a markdown string with YAML frontmatter into a PipelineDefinition.
 */
export function parsePipelineFile(content: string): PipelineDefinition {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!fmMatch) {
    throw new Error('Pipeline file missing YAML frontmatter (--- delimiters)')
  }

  const frontmatter = fmMatch[1]
  const body = fmMatch[2]

  const get = (key: string): string | undefined => {
    const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
    return match?.[1]?.trim()
  }

  const steps: PipelineStep[] = []
  const stepBlocks = body.split(/^### \d+\.\s+/m).filter(Boolean)

  for (const block of stepBlocks) {
    const lines = block.trim().split('\n')
    const name = lines[0]?.trim()
    if (!name) continue

    const getField = (field: string): string | undefined => {
      const line = lines.find(l => l.startsWith(`${field}:`))
      return line?.slice(field.length + 1)?.trim()
    }

    const inputStr = getField('input') ?? 'user_request'
    const input = inputStr.split('+').map(s => s.trim())

    const gate = getField('gate') as PipelineStep['gate']

    steps.push({
      name,
      agent: getField('agent') ?? name,
      input,
      gate: gate || undefined,
      description: getField('description') ?? '',
    })
  }

  return {
    name: get('name') ?? 'unknown',
    description: get('description') ?? '',
    priorityDefault: (get('priority_default') ?? 'normal') as BudgetTier,
    steps,
  }
}

/**
 * Loads an agent definition from ai/agents/<role>.md
 */
export async function loadAgent(role: string, basePath?: string): Promise<AgentDefinition> {
  const dir = basePath ?? join(process.cwd(), 'ai', 'agents')
  const content = await readFile(join(dir, `${role}.md`), 'utf-8')
  return parseAgentFile(content)
}

/**
 * Loads a pipeline definition from ai/pipelines/<name>.md
 */
export async function loadPipeline(name: string, basePath?: string): Promise<PipelineDefinition> {
  const dir = basePath ?? join(process.cwd(), 'ai', 'pipelines')
  const content = await readFile(join(dir, `${name}.md`), 'utf-8')
  return parsePipelineFile(content)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run lib/runner/loader.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/runner/loader.ts lib/runner/loader.test.ts
git commit -m "feat(runner): add markdown loader for agents and pipelines"
```

### Task 6: Logger

**Files:**
- Create: `lib/runner/logger.ts`
- Test: `lib/runner/logger.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatStepLog, formatRunSummary, writeRunLog } from './logger'
import type { StepResult, RunLog, RunConfig } from './types'

describe('formatStepLog', () => {
  it('formats a completed step', () => {
    const step: StepResult = {
      stepName: 'spec',
      agentRole: 'product_manager',
      model: 'claude-opus-4-6',
      provider: 'anthropic',
      output: 'some output',
      inputTokens: 1500,
      outputTokens: 2347,
      estimatedCostUsd: 0.12,
      durationMs: 8400,
      status: 'completed',
    }
    const log = formatStepLog(step, 2, 9)
    expect(log).toContain('Step 2/9')
    expect(log).toContain('spec')
    expect(log).toContain('product_manager')
    expect(log).toContain('claude-opus-4-6')
    expect(log).toContain('3,847 tokens')
    expect(log).toContain('$0.12')
    expect(log).toContain('8.4s')
  })

  it('formats a failed step', () => {
    const step: StepResult = {
      stepName: 'backend',
      agentRole: 'backend_engineer',
      model: 'claude-sonnet-4-6',
      provider: 'anthropic',
      output: '',
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
      durationMs: 500,
      status: 'failed',
      error: 'API key invalid',
    }
    const log = formatStepLog(step, 6, 9)
    expect(log).toContain('FAIL')
    expect(log).toContain('API key invalid')
  })
})

describe('formatRunSummary', () => {
  it('formats the final summary line', () => {
    const summary = formatRunSummary(9, 25799, 0.53, 57600)
    expect(summary).toContain('9 steps')
    expect(summary).toContain('25,799 tokens')
    expect(summary).toContain('$0.53')
    expect(summary).toContain('57.6s')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run lib/runner/logger.test.ts
```

Expected: FAIL — functions not found.

- [ ] **Step 3: Implement `lib/runner/logger.ts`**

```typescript
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import type { StepResult, RunLog, BudgetTier } from './types'

const PREFIX = '[runner]'

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

/**
 * Formats a single step result for stdout.
 */
export function formatStepLog(step: StepResult, stepNum: number, totalSteps: number): string {
  const header = `${PREFIX} Step ${stepNum}/${totalSteps}: ${step.stepName} (${step.agentRole} → ${step.model})`
  if (step.status === 'failed') {
    return `${header}\n${PREFIX}   ✗ FAIL: ${step.error ?? 'Unknown error'}`
  }
  if (step.status === 'skipped') {
    return `${header}\n${PREFIX}   ⊘ Skipped`
  }
  const totalTokens = step.inputTokens + step.outputTokens
  const seconds = (step.durationMs / 1000).toFixed(1)
  return `${header}\n${PREFIX}   ✓ ${formatNumber(totalTokens)} tokens | $${step.estimatedCostUsd.toFixed(2)} | ${seconds}s`
}

/**
 * Formats the running total line.
 */
export function formatRunningTotal(currentCost: number, budgetLimit: number): string {
  if (budgetLimit === Infinity) {
    return `${PREFIX} Running total: $${currentCost.toFixed(2)} (no limit)`
  }
  return `${PREFIX} Running total: $${currentCost.toFixed(2)} / $${budgetLimit.toFixed(2)}`
}

/**
 * Formats the pipeline header line.
 */
export function formatPipelineHeader(pipelineName: string, priority: BudgetTier, budgetLimit: number): string {
  const budgetStr = budgetLimit === Infinity ? 'unlimited' : `$${budgetLimit.toFixed(2)}`
  return `${PREFIX} Pipeline: ${pipelineName} | Priority: ${priority} | Budget: ${budgetStr}`
}

/**
 * Formats the final run summary.
 */
export function formatRunSummary(
  totalSteps: number,
  totalTokens: number,
  totalCost: number,
  totalDurationMs: number
): string {
  const seconds = (totalDurationMs / 1000).toFixed(1)
  return `${PREFIX} Complete: ${totalSteps} steps | ${formatNumber(totalTokens)} tokens | $${totalCost.toFixed(2)} | ${seconds}s`
}

/**
 * Writes a RunLog as JSON to .runner/runs/<id>.json
 */
export async function writeRunLog(log: RunLog): Promise<string> {
  const dir = join(process.cwd(), '.runner', 'runs')
  await mkdir(dir, { recursive: true })
  const filePath = join(dir, `${log.id}.json`)
  await writeFile(filePath, JSON.stringify(log, null, 2), 'utf-8')
  return filePath
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run lib/runner/logger.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/runner/logger.ts lib/runner/logger.test.ts
git commit -m "feat(runner): add logger for stdout progress and JSON run logs"
```

### Task 7: Token Monitor

**Files:**
- Create: `lib/runner/monitor.ts`
- Test: `lib/runner/monitor.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from 'vitest'
import { createRunMonitor } from './monitor'
import type { StepResult, BudgetTier } from './types'

describe('createRunMonitor', () => {
  it('initializes with zero cost', () => {
    const monitor = createRunMonitor('normal')
    expect(monitor.getTotalCost()).toBe(0)
    expect(monitor.getTotalTokens()).toBe(0)
  })

  it('tracks step results', () => {
    const monitor = createRunMonitor('normal')
    const step: StepResult = {
      stepName: 'spec',
      agentRole: 'product_manager',
      model: 'claude-opus-4-6',
      provider: 'anthropic',
      output: 'output',
      inputTokens: 1500,
      outputTokens: 2000,
      estimatedCostUsd: 0.12,
      durationMs: 5000,
      status: 'completed',
    }
    monitor.recordStep(step)
    expect(monitor.getTotalCost()).toBe(0.12)
    expect(monitor.getTotalTokens()).toBe(3500)
  })

  it('detects step budget exceeded', () => {
    const monitor = createRunMonitor('normal') // step limit: $0.50
    const step: StepResult = {
      stepName: 'backend',
      agentRole: 'backend_engineer',
      model: 'claude-sonnet-4-6',
      provider: 'anthropic',
      output: 'output',
      inputTokens: 10000,
      outputTokens: 20000,
      estimatedCostUsd: 0.60,
      durationMs: 15000,
      status: 'completed',
    }
    monitor.recordStep(step)
    expect(monitor.isStepOverBudget(step)).toBe(true)
  })

  it('detects run budget exceeded', () => {
    const monitor = createRunMonitor('low') // run limit: $1.00
    for (let i = 0; i < 5; i++) {
      monitor.recordStep({
        stepName: `step${i}`,
        agentRole: 'agent',
        model: 'model',
        provider: 'anthropic',
        output: '',
        inputTokens: 1000,
        outputTokens: 1000,
        estimatedCostUsd: 0.25,
        durationMs: 1000,
        status: 'completed',
      })
    }
    expect(monitor.isRunOverBudget()).toBe(true)
  })

  it('never exceeds budget in override mode', () => {
    const monitor = createRunMonitor('override')
    monitor.recordStep({
      stepName: 'expensive',
      agentRole: 'agent',
      model: 'model',
      provider: 'anthropic',
      output: '',
      inputTokens: 100000,
      outputTokens: 100000,
      estimatedCostUsd: 50.0,
      durationMs: 30000,
      status: 'completed',
    })
    expect(monitor.isRunOverBudget()).toBe(false)
    expect(monitor.isStepOverBudget({
      stepName: 'x', agentRole: 'x', model: 'x', provider: 'x',
      output: '', inputTokens: 0, outputTokens: 0,
      estimatedCostUsd: 50.0, durationMs: 0, status: 'completed',
    })).toBe(false)
  })

  it('returns tier crossing alerts', () => {
    const monitor = createRunMonitor('override')
    monitor.recordStep({
      stepName: 's1', agentRole: 'a', model: 'm', provider: 'p',
      output: '', inputTokens: 0, outputTokens: 0,
      estimatedCostUsd: 3.0, durationMs: 0, status: 'completed',
    })
    const crossings = monitor.getTierCrossings()
    expect(crossings).toContain(2)
    expect(crossings).not.toContain(5)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run lib/runner/monitor.test.ts
```

Expected: FAIL — `createRunMonitor` not found.

- [ ] **Step 3: Implement `lib/runner/monitor.ts`**

```typescript
import type { StepResult, BudgetTier } from './types'
import { BUDGET_LIMITS } from './types'

const TIER_CROSSINGS = [2, 5, 10, 20]

export interface RunMonitor {
  recordStep(step: StepResult): void
  getTotalCost(): number
  getTotalTokens(): number
  getTotalDurationMs(): number
  isStepOverBudget(step: StepResult): boolean
  isRunOverBudget(): boolean
  getTierCrossings(): number[]
  getSteps(): StepResult[]
}

/**
 * Creates a monitor that tracks token usage and budget for a pipeline run.
 */
export function createRunMonitor(priority: BudgetTier, noBudgetLimit?: boolean): RunMonitor {
  const effectiveTier: BudgetTier = noBudgetLimit ? 'override' : priority
  const limits = BUDGET_LIMITS[effectiveTier]
  const steps: StepResult[] = []
  let totalCost = 0
  let totalTokens = 0
  let totalDurationMs = 0
  const crossedTiers: number[] = []

  return {
    recordStep(step: StepResult): void {
      steps.push(step)
      const prevCost = totalCost
      totalCost += step.estimatedCostUsd
      totalTokens += step.inputTokens + step.outputTokens
      totalDurationMs += step.durationMs

      // Check tier crossings for override mode alerts
      for (const tier of TIER_CROSSINGS) {
        if (prevCost < tier && totalCost >= tier && !crossedTiers.includes(tier)) {
          crossedTiers.push(tier)
        }
      }
    },

    getTotalCost(): number {
      return totalCost
    },

    getTotalTokens(): number {
      return totalTokens
    },

    getTotalDurationMs(): number {
      return totalDurationMs
    },

    isStepOverBudget(step: StepResult): boolean {
      if (limits.perStep === Infinity) return false
      return step.estimatedCostUsd > limits.perStep
    },

    isRunOverBudget(): boolean {
      if (limits.perRun === Infinity) return false
      return totalCost > limits.perRun
    },

    getTierCrossings(): number[] {
      return [...crossedTiers]
    },

    getSteps(): StepResult[] {
      return [...steps]
    },
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run lib/runner/monitor.test.ts
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/runner/monitor.ts lib/runner/monitor.test.ts
git commit -m "feat(runner): add token monitor with budget enforcement"
```

### Task 8: Email Notifications

**Files:**
- Create: `lib/runner/notify.ts`
- Test: `lib/runner/notify.test.ts`

- [ ] **Step 1: Install Resend**

```bash
npm install resend
```

- [ ] **Step 2: Write the failing tests**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { buildRunSummaryEmail, buildBudgetAlertEmail, buildApprovalEmail } from './notify'
import type { RunLog, StepResult } from './types'

describe('buildRunSummaryEmail', () => {
  it('builds email with correct subject', () => {
    const log: RunLog = {
      id: '2026-04-06T14-30-00',
      config: { pipeline: 'feature', input: 'test', priority: 'normal', source: 'cli' },
      steps: [],
      totalInputTokens: 10000,
      totalOutputTokens: 15000,
      totalCostUsd: 0.53,
      totalDurationMs: 57600,
      status: 'completed',
      startedAt: '2026-04-06T14:30:00Z',
      completedAt: '2026-04-06T14:31:00Z',
    }
    const email = buildRunSummaryEmail(log)
    expect(email.subject).toContain('feature')
    expect(email.subject).toContain('$0.53')
  })

  it('includes step breakdown in body', () => {
    const log: RunLog = {
      id: 'test',
      config: { pipeline: 'feature', input: 'test', priority: 'normal', source: 'cli' },
      steps: [{
        stepName: 'spec',
        agentRole: 'product_manager',
        model: 'claude-opus-4-6',
        provider: 'anthropic',
        output: 'output',
        inputTokens: 1500,
        outputTokens: 2000,
        estimatedCostUsd: 0.12,
        durationMs: 5000,
        status: 'completed',
      }],
      totalInputTokens: 1500,
      totalOutputTokens: 2000,
      totalCostUsd: 0.12,
      totalDurationMs: 5000,
      status: 'completed',
      startedAt: '2026-04-06T14:30:00Z',
      completedAt: '2026-04-06T14:30:05Z',
    }
    const email = buildRunSummaryEmail(log)
    expect(email.html).toContain('spec')
    expect(email.html).toContain('product_manager')
  })
})

describe('buildBudgetAlertEmail', () => {
  it('builds alert with step details', () => {
    const step: StepResult = {
      stepName: 'backend',
      agentRole: 'backend_engineer',
      model: 'claude-sonnet-4-6',
      provider: 'anthropic',
      output: '',
      inputTokens: 5000,
      outputTokens: 15000,
      estimatedCostUsd: 0.60,
      durationMs: 12000,
      status: 'completed',
    }
    const email = buildBudgetAlertEmail(step, 0.60, 0.50, 1.20, 2.00)
    expect(email.subject).toContain('Budget Alert')
    expect(email.html).toContain('backend')
    expect(email.html).toContain('$0.60')
  })
})

describe('buildApprovalEmail', () => {
  it('builds approval email with feature name and costs', () => {
    const email = buildApprovalEmail(
      'Event Invitations + RSVP',
      'feature',
      '## Plan\n- Build API\n- Build UI',
      0.27,
      0.60,
      'abc123'
    )
    expect(email.subject).toContain('Approval Needed')
    expect(email.subject).toContain('Event Invitations')
    expect(email.html).toContain('$0.27')
    expect(email.html).toContain('$0.60')
    expect(email.html).toContain('abc123')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run lib/runner/notify.test.ts
```

Expected: FAIL — functions not found.

- [ ] **Step 4: Implement `lib/runner/notify.ts`**

```typescript
import type { RunLog, StepResult } from './types'

interface EmailPayload {
  subject: string
  html: string
}

/**
 * Builds an email payload for a completed run summary.
 */
export function buildRunSummaryEmail(log: RunLog): EmailPayload {
  const stepRows = log.steps
    .map(s => {
      const tokens = s.inputTokens + s.outputTokens
      return `<tr>
        <td>${s.stepName}</td>
        <td>${s.agentRole}</td>
        <td>${s.model}</td>
        <td>${tokens.toLocaleString()}</td>
        <td>$${s.estimatedCostUsd.toFixed(4)}</td>
        <td>${(s.durationMs / 1000).toFixed(1)}s</td>
        <td>${s.status}</td>
      </tr>`
    })
    .join('\n')

  return {
    subject: `[Runner] ${log.config.pipeline} — ${log.status} — $${log.totalCostUsd.toFixed(2)}`,
    html: `
      <h2>Pipeline Run: ${log.config.pipeline}</h2>
      <p><strong>Status:</strong> ${log.status}</p>
      <p><strong>Total:</strong> ${(log.totalInputTokens + log.totalOutputTokens).toLocaleString()} tokens | $${log.totalCostUsd.toFixed(2)} | ${(log.totalDurationMs / 1000).toFixed(1)}s</p>
      <p><strong>Priority:</strong> ${log.config.priority} | <strong>Source:</strong> ${log.config.source}</p>
      <table border="1" cellpadding="4" cellspacing="0">
        <tr><th>Step</th><th>Agent</th><th>Model</th><th>Tokens</th><th>Cost</th><th>Duration</th><th>Status</th></tr>
        ${stepRows}
      </table>
      <p><strong>Run ID:</strong> ${log.id}</p>
    `.trim(),
  }
}

/**
 * Builds an email payload for a budget alert.
 */
export function buildBudgetAlertEmail(
  step: StepResult,
  stepCost: number,
  stepLimit: number,
  runTotal: number,
  runLimit: number
): EmailPayload {
  return {
    subject: `[Runner] Budget Alert — ${step.stepName} ($${stepCost.toFixed(2)} > $${stepLimit.toFixed(2)})`,
    html: `
      <h2>Budget Alert</h2>
      <p><strong>Step:</strong> ${step.stepName} (${step.agentRole} → ${step.model})</p>
      <p><strong>Step cost:</strong> $${stepCost.toFixed(2)} (limit: $${stepLimit.toFixed(2)})</p>
      <p><strong>Run total:</strong> $${runTotal.toFixed(2)} (limit: $${runLimit === Infinity ? 'unlimited' : runLimit.toFixed(2)})</p>
      <p><strong>Tokens:</strong> ${(step.inputTokens + step.outputTokens).toLocaleString()}</p>
    `.trim(),
  }
}

/**
 * Sends an email using Resend. No-ops if RESEND_API_KEY or RUNNER_ALERT_EMAIL is not set.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.RUNNER_ALERT_EMAIL

  if (!apiKey || !to) return false

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: 'Runner <noreply@resend.dev>',
      to,
      subject: payload.subject,
      html: payload.html,
    })
    return true
  } catch {
    console.error(`${'\x1b[31m'}[runner] Failed to send email${'\x1b[0m'}`)
    return false
  }
}

/**
 * Sends a run summary email if configured.
 */
export async function notifyRunComplete(log: RunLog): Promise<void> {
  if (process.env.RUNNER_EMAIL_ON_COMPLETE !== 'true') return
  const payload = buildRunSummaryEmail(log)
  await sendEmail(payload)
}

/**
 * Sends a budget alert email if configured.
 */
export async function notifyBudgetAlert(
  step: StepResult,
  stepCost: number,
  stepLimit: number,
  runTotal: number,
  runLimit: number
): Promise<void> {
  if (process.env.RUNNER_EMAIL_ON_ALERT !== 'true') return
  const payload = buildBudgetAlertEmail(step, stepCost, stepLimit, runTotal, runLimit)
  await sendEmail(payload)
}

/**
 * Builds an email payload for an approval gate notification.
 */
export function buildApprovalEmail(
  featureName: string,
  pipeline: string,
  planSummary: string,
  costSoFar: number,
  estimatedRemaining: number,
  clickupTaskId?: string
): EmailPayload {
  const taskLink = clickupTaskId
    ? `<p><a href="https://app.clickup.com/t/${clickupTaskId}">View in ClickUp</a></p>`
    : ''

  return {
    subject: `[Runner] Approval Needed — ${featureName} — $${costSoFar.toFixed(2)} spent, ~$${estimatedRemaining.toFixed(2)} remaining`,
    html: `
      <h2>Approval Needed: ${featureName}</h2>
      <p><strong>Pipeline:</strong> ${pipeline}</p>
      <p><strong>Cost so far:</strong> $${costSoFar.toFixed(2)}</p>
      <p><strong>Estimated remaining:</strong> ~$${estimatedRemaining.toFixed(2)}</p>
      ${taskLink}
      <h3>Plan Summary</h3>
      <pre>${planSummary}</pre>
    `.trim(),
  }
}

/**
 * Sends an approval needed email if configured.
 */
export async function notifyApprovalNeeded(
  featureName: string,
  pipeline: string,
  planSummary: string,
  costSoFar: number,
  estimatedRemaining: number,
  clickupTaskId?: string
): Promise<void> {
  if (process.env.RUNNER_EMAIL_ON_ALERT !== 'true') return
  const payload = buildApprovalEmail(featureName, pipeline, planSummary, costSoFar, estimatedRemaining, clickupTaskId)
  await sendEmail(payload)
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run lib/runner/notify.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/runner/notify.ts lib/runner/notify.test.ts package.json package-lock.json
git commit -m "feat(runner): add email notifications with Resend"
```

### Task 9: ClickUp Integration

**Files:**
- Create: `lib/runner/clickup.ts`
- Test: `lib/runner/clickup.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from 'vitest'
import { mapClickUpPriority, mapClickUpToRunConfig, buildResultComment } from './clickup'
import type { RunLog } from './types'

describe('mapClickUpPriority', () => {
  it('maps ClickUp priority 1 (urgent) to urgent', () => {
    expect(mapClickUpPriority(1)).toBe('urgent')
  })
  it('maps ClickUp priority 2 (high) to high', () => {
    expect(mapClickUpPriority(2)).toBe('high')
  })
  it('maps ClickUp priority 3 (normal) to normal', () => {
    expect(mapClickUpPriority(3)).toBe('normal')
  })
  it('maps ClickUp priority 4 (low) to low', () => {
    expect(mapClickUpPriority(4)).toBe('low')
  })
  it('defaults to normal for unknown', () => {
    expect(mapClickUpPriority(99)).toBe('normal')
  })
})

describe('mapClickUpToRunConfig', () => {
  it('maps a ClickUp task to RunConfig', () => {
    const task = {
      id: 'abc123',
      name: 'Build invitations',
      description: 'Create invitation system with RSVP',
      priority: { id: '3' },
      tags: [{ name: 'feature' }, { name: 'run-agent' }],
    }
    const config = mapClickUpToRunConfig(task)
    expect(config.pipeline).toBe('feature')
    expect(config.priority).toBe('normal')
    expect(config.source).toBe('clickup')
    expect(config.clickupTaskId).toBe('abc123')
    expect(config.input).toContain('Build invitations')
    expect(config.input).toContain('Create invitation system with RSVP')
  })

  it('detects budget-override tag', () => {
    const task = {
      id: 'abc',
      name: 'Name',
      description: 'Desc',
      priority: { id: '3' },
      tags: [{ name: 'feature' }, { name: 'budget-override' }],
    }
    const config = mapClickUpToRunConfig(task)
    expect(config.noBudgetLimit).toBe(true)
  })

  it('defaults pipeline to feature if no matching tag', () => {
    const task = {
      id: 'abc',
      name: 'Name',
      description: 'Desc',
      priority: { id: '3' },
      tags: [{ name: 'run-agent' }],
    }
    const config = mapClickUpToRunConfig(task)
    expect(config.pipeline).toBe('feature')
  })
})

describe('buildResultComment', () => {
  it('builds a markdown comment from RunLog', () => {
    const log: RunLog = {
      id: 'test',
      config: { pipeline: 'feature', input: 'test', priority: 'normal', source: 'clickup', clickupTaskId: 'abc' },
      steps: [{
        stepName: 'spec', agentRole: 'product_manager', model: 'claude-opus-4-6',
        provider: 'anthropic', output: 'Feature spec output', inputTokens: 1000,
        outputTokens: 2000, estimatedCostUsd: 0.10, durationMs: 5000, status: 'completed',
      }],
      totalInputTokens: 1000,
      totalOutputTokens: 2000,
      totalCostUsd: 0.10,
      totalDurationMs: 5000,
      status: 'completed',
      startedAt: '2026-04-06T14:30:00Z',
      completedAt: '2026-04-06T14:30:05Z',
    }
    const comment = buildResultComment(log)
    expect(comment).toContain('Pipeline Run: feature')
    expect(comment).toContain('$0.10')
    expect(comment).toContain('spec')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run lib/runner/clickup.test.ts
```

Expected: FAIL — functions not found.

- [ ] **Step 3: Implement `lib/runner/clickup.ts`**

```typescript
import type { RunConfig, RunLog, BudgetTier } from './types'

const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2'

function getApiToken(): string {
  const token = process.env.CLICKUP_API_TOKEN
  if (!token) throw new Error('CLICKUP_API_TOKEN environment variable is not set')
  return token
}

async function clickupFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${CLICKUP_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: getApiToken(),
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
}

/**
 * Maps ClickUp priority ID to BudgetTier.
 * ClickUp: 1=urgent, 2=high, 3=normal, 4=low
 */
export function mapClickUpPriority(priorityId: number): BudgetTier {
  switch (priorityId) {
    case 1: return 'urgent'
    case 2: return 'high'
    case 3: return 'normal'
    case 4: return 'low'
    default: return 'normal'
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapClickUpToRunConfig(task: any): RunConfig {
  const tags: string[] = (task.tags ?? []).map((t: { name: string }) => t.name)
  const pipelineTypes = ['feature', 'bug', 'enhancement']
  const pipeline = tags.find(t => pipelineTypes.includes(t)) ?? 'feature'
  const noBudgetLimit = tags.includes('budget-override')
  const priorityId = Number(task.priority?.id ?? 3)

  return {
    pipeline,
    input: `# ${task.name}\n\n${task.description ?? ''}`,
    priority: mapClickUpPriority(priorityId),
    source: 'clickup',
    clickupTaskId: task.id,
    noBudgetLimit,
  }
}

/**
 * Fetches a ClickUp task by ID and maps it to a RunConfig.
 */
export async function fetchTaskAsRunConfig(taskId: string): Promise<RunConfig> {
  const res = await clickupFetch(`/task/${taskId}`)
  if (!res.ok) {
    throw new Error(`ClickUp API error: ${res.status} ${res.statusText}`)
  }
  const task = await res.json()
  return mapClickUpToRunConfig(task)
}

/**
 * Builds a markdown comment from a RunLog for posting to ClickUp.
 */
export function buildResultComment(log: RunLog): string {
  const stepLines = log.steps.map(s => {
    const tokens = s.inputTokens + s.outputTokens
    const status = s.status === 'completed' ? '✓' : s.status === 'failed' ? '✗' : '⊘'
    return `| ${status} ${s.stepName} | ${s.agentRole} | ${s.model} | ${tokens.toLocaleString()} | $${s.estimatedCostUsd.toFixed(4)} |`
  })

  return `## Pipeline Run: ${log.config.pipeline}

**Status:** ${log.status}
**Total:** ${(log.totalInputTokens + log.totalOutputTokens).toLocaleString()} tokens | $${log.totalCostUsd.toFixed(2)} | ${(log.totalDurationMs / 1000).toFixed(1)}s

| Step | Agent | Model | Tokens | Cost |
|------|-------|-------|--------|------|
${stepLines.join('\n')}

**Run ID:** ${log.id}`
}

/**
 * Posts a comment on a ClickUp task.
 */
export async function postTaskComment(taskId: string, commentText: string): Promise<void> {
  const res = await clickupFetch(`/task/${taskId}/comment`, {
    method: 'POST',
    body: JSON.stringify({ comment_text: commentText }),
  })
  if (!res.ok) {
    throw new Error(`ClickUp comment error: ${res.status} ${res.statusText}`)
  }
}

/**
 * Updates a ClickUp task's status.
 */
export async function updateTaskStatus(taskId: string, status: string): Promise<void> {
  const res = await clickupFetch(`/task/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
  if (!res.ok) {
    throw new Error(`ClickUp status update error: ${res.status} ${res.statusText}`)
  }
}

/**
 * Assigns a ClickUp task to a user.
 */
export async function assignTask(taskId: string, userId: string): Promise<void> {
  const res = await clickupFetch(`/task/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify({ assignees: { add: [Number(userId)] } }),
  })
  if (!res.ok) {
    throw new Error(`ClickUp assign error: ${res.status} ${res.statusText}`)
  }
}

/**
 * Creates a ClickUp task from intake results.
 */
export async function createTask(
  listId: string,
  title: string,
  description: string,
  tags: string[],
  priority: number
): Promise<string> {
  const res = await clickupFetch(`/list/${listId}/task`, {
    method: 'POST',
    body: JSON.stringify({
      name: title,
      description,
      tags,
      priority,
      status: 'Ready for Agent',
    }),
  })
  if (!res.ok) {
    throw new Error(`ClickUp task create error: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  return data.id
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run lib/runner/clickup.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/runner/clickup.ts lib/runner/clickup.test.ts
git commit -m "feat(runner): add ClickUp integration — task fetch, mapping, comments"
```

### Task 10: Pipeline Executor

**Files:**
- Create: `lib/runner/executor.ts`
- Test: `lib/runner/executor.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { resolveInputs, buildContext } from './executor'

describe('resolveInputs', () => {
  const stepOutputs = new Map<string, string>()
  stepOutputs.set('spec', 'Spec output here')
  stepOutputs.set('design', 'Design output here')

  it('resolves user_request', () => {
    const result = resolveInputs(['user_request'], 'My feature', stepOutputs)
    expect(result).toBe('My feature')
  })

  it('resolves step references', () => {
    const result = resolveInputs(['step.spec'], 'request', stepOutputs)
    expect(result).toBe('Spec output here')
  })

  it('resolves multiple inputs with concatenation', () => {
    const result = resolveInputs(['user_request', 'step.spec'], 'My feature', stepOutputs)
    expect(result).toContain('My feature')
    expect(result).toContain('Spec output here')
  })

  it('throws on missing step reference', () => {
    expect(() => resolveInputs(['step.nonexistent'], 'req', stepOutputs)).toThrow()
  })
})

describe('buildContext', () => {
  it('builds context from step outputs', () => {
    const outputs = new Map<string, string>()
    outputs.set('spec', 'Spec content')
    outputs.set('design', 'Design content')

    const context = buildContext('My request', outputs)
    expect(context).toContain('## Original Request')
    expect(context).toContain('My request')
    expect(context).toContain('## Step: spec')
    expect(context).toContain('Spec content')
    expect(context).toContain('## Step: design')
    expect(context).toContain('Design content')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run lib/runner/executor.test.ts
```

Expected: FAIL — `resolveInputs` and `buildContext` not found.

- [ ] **Step 3: Implement `lib/runner/executor.ts`**

```typescript
import { loadAgent, loadPipeline } from './loader'
import { createRunMonitor, type RunMonitor } from './monitor'
import {
  formatStepLog,
  formatRunningTotal,
  formatPipelineHeader,
  formatRunSummary,
  writeRunLog,
} from './logger'
import { notifyRunComplete, notifyBudgetAlert } from './notify'
import { runAgentLLM } from '@/lib/llm/router'
import { BUDGET_LIMITS } from './types'
import type {
  RunConfig,
  RunLog,
  StepResult,
  PipelineDefinition,
  AgentDefinition,
  BudgetTier,
} from './types'
import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import * as readline from 'readline'

// ============================================================
// Pending Run State (for ClickUp approval gates)
// ============================================================

interface PendingRunState {
  id: string
  config: RunConfig
  stepResults: StepResult[]
  stepOutputs: Record<string, string>
  resumeFromStep: number
  startedAt: string
}

function pendingPath(taskId: string): string {
  return join(process.cwd(), '.runner', 'pending', `${taskId}.json`)
}

async function savePendingRun(taskId: string, state: PendingRunState): Promise<void> {
  const dir = join(process.cwd(), '.runner', 'pending')
  await mkdir(dir, { recursive: true })
  await writeFile(pendingPath(taskId), JSON.stringify(state, null, 2), 'utf-8')
}

async function loadPendingRun(taskId: string): Promise<PendingRunState | null> {
  try {
    const content = await readFile(pendingPath(taskId), 'utf-8')
    return JSON.parse(content) as PendingRunState
  } catch {
    return null
  }
}

async function clearPendingRun(taskId: string): Promise<void> {
  try { await unlink(pendingPath(taskId)) } catch { /* ignore if not exists */ }
}

/**
 * Resolves input references for a pipeline step.
 * Supports: 'user_request', 'env_check', 'step.<name>'
 */
export function resolveInputs(
  inputs: string[],
  userRequest: string,
  stepOutputs: Map<string, string>
): string {
  const parts: string[] = []
  for (const ref of inputs) {
    if (ref === 'user_request') {
      parts.push(userRequest)
    } else if (ref === 'env_check') {
      parts.push('Run environment validation checks.')
    } else if (ref.startsWith('step.')) {
      const stepName = ref.slice(5)
      const output = stepOutputs.get(stepName)
      if (output === undefined) {
        throw new Error(`Step reference "${ref}" not found — step "${stepName}" has not run yet`)
      }
      parts.push(output)
    } else {
      parts.push(ref)
    }
  }
  return parts.join('\n\n---\n\n')
}

/**
 * Builds the accumulated context string from all previous step outputs.
 */
export function buildContext(userRequest: string, stepOutputs: Map<string, string>): string {
  const sections: string[] = [`## Original Request\n${userRequest}`]
  for (const [name, output] of stepOutputs) {
    sections.push(`## Step: ${name}\n${output}`)
  }
  return sections.join('\n\n')
}

/**
 * Prompts user for approval in CLI mode. Returns true if approved.
 */
async function promptApproval(): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question('\n[runner] Approve and continue? (y/n): ', answer => {
      rl.close()
      resolve(answer.trim().toLowerCase() === 'y')
    })
  })
}

/**
 * Executes a full pipeline run. If a pending run exists for a ClickUp task
 * (paused at approval gate), resumes from where it left off.
 */
export async function executePipeline(config: RunConfig): Promise<RunLog> {
  // Check for pending run (ClickUp approval resume)
  let startedAt = new Date().toISOString()
  let id = startedAt.replace(/[:.]/g, '-')
  let startStep = 0
  const stepOutputs = new Map<string, string>()
  const stepResults: StepResult[] = []

  if (config.clickupTaskId) {
    const pending = await loadPendingRun(config.clickupTaskId)
    if (pending) {
      console.log(`[runner] Resuming from pending approval gate (step ${pending.resumeFromStep})`)
      id = pending.id
      startedAt = pending.startedAt
      startStep = pending.resumeFromStep
      stepResults.push(...pending.stepResults)
      for (const [k, v] of Object.entries(pending.stepOutputs)) {
        stepOutputs.set(k, v)
      }
      await clearPendingRun(config.clickupTaskId)
    }
  }

  // Load pipeline and agent definitions
  const pipeline = await loadPipeline(config.pipeline)
  const agentCache = new Map<string, AgentDefinition>()

  for (const step of pipeline.steps) {
    if (step.agent && !agentCache.has(step.agent)) {
      agentCache.set(step.agent, await loadAgent(step.agent))
    }
  }

  const effectivePriority: BudgetTier = config.noBudgetLimit ? 'override' : config.priority
  const limits = BUDGET_LIMITS[effectivePriority]
  const monitor = createRunMonitor(effectivePriority)

  // Replay costs from resumed steps into monitor
  for (const prevStep of stepResults) {
    monitor.recordStep(prevStep)
  }

  console.log(formatPipelineHeader(config.pipeline, effectivePriority, limits.perRun))
  if (startStep > 0) {
    console.log(formatRunningTotal(monitor.getTotalCost(), limits.perRun))
  }

  for (let i = startStep; i < pipeline.steps.length; i++) {
    const step = pipeline.steps[i]

    // Handle approval gate
    if (step.gate === 'approval') {
      console.log(`\n[runner] === APPROVAL GATE ===`)
      console.log(`[runner] Review the plan above before continuing.`)

      if (config.source === 'cli') {
        const approved = await promptApproval()
        if (!approved) {
          return finalizeRun(id, config, stepResults, monitor, 'aborted', startedAt)
        }
      } else if (config.source === 'clickup' && config.clickupTaskId) {
        // Save pending state so we can resume after approval
        await savePendingRun(config.clickupTaskId, {
          id, config, stepResults, stepOutputs: Object.fromEntries(stepOutputs),
          resumeFromStep: i + 1, startedAt,
        })

        // Get the plan output (last completed step's output)
        const planOutput = stepOutputs.get('plan') ?? stepOutputs.get(pipeline.steps[i - 1]?.name) ?? ''

        // Update ClickUp task: status + assignment + comment
        const { postTaskComment, updateTaskStatus, assignTask } = await import('./clickup')
        const planComment = `## Approval Needed\n\n**Cost so far:** $${monitor.getTotalCost().toFixed(2)}\n**Estimated remaining:** ~$${(limits.perRun - monitor.getTotalCost()).toFixed(2)}\n\n${planOutput}`
        await postTaskComment(config.clickupTaskId, planComment)
        await updateTaskStatus(config.clickupTaskId, 'Awaiting Approval')
        const assigneeId = process.env.RUNNER_CLICKUP_ASSIGNEE_ID
        if (assigneeId) {
          await assignTask(config.clickupTaskId, assigneeId)
        }

        // Send email notification
        const { notifyApprovalNeeded } = await import('./notify')
        const featureName = config.input.split('\n')[0].replace(/^#\s*/, '')
        await notifyApprovalNeeded(
          featureName, config.pipeline, planOutput,
          monitor.getTotalCost(), limits.perRun - monitor.getTotalCost(),
          config.clickupTaskId
        )

        console.log(`[runner] Paused at approval gate. ClickUp task updated, email sent.`)
        return finalizeRun(id, config, stepResults, monitor, 'aborted', startedAt)
      }
      continue
    }

    const agent = agentCache.get(step.agent)
    if (!agent) {
      const failResult: StepResult = {
        stepName: step.name, agentRole: step.agent, model: 'unknown', provider: 'unknown',
        output: '', inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0, durationMs: 0,
        status: 'failed', error: `Agent "${step.agent}" not found`,
      }
      stepResults.push(failResult)
      console.log(formatStepLog(failResult, i + 1, pipeline.steps.length))
      if (step.gate === 'hard') {
        return finalizeRun(id, config, stepResults, monitor, 'failed', startedAt)
      }
      continue
    }

    // Resolve inputs and build context
    const userPrompt = resolveInputs(step.input, config.input, stepOutputs)
    const context = buildContext(config.input, stepOutputs)

    // Execute the agent
    const stepStart = Date.now()
    let result: StepResult

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

    stepResults.push(result)
    monitor.recordStep(result)

    console.log(formatStepLog(result, i + 1, pipeline.steps.length))
    console.log(formatRunningTotal(monitor.getTotalCost(), limits.perRun))

    // Store output for downstream steps
    if (result.status === 'completed') {
      stepOutputs.set(step.name, result.output)
    }

    // Handle hard gate failure
    if (result.status === 'failed' && step.gate === 'hard') {
      return finalizeRun(id, config, stepResults, monitor, 'failed', startedAt)
    }

    // Budget checks
    if (monitor.isStepOverBudget(result)) {
      console.log(`[runner] ⚠ Step budget exceeded: $${result.estimatedCostUsd.toFixed(2)} > $${limits.perStep.toFixed(2)}`)
      await notifyBudgetAlert(result, result.estimatedCostUsd, limits.perStep, monitor.getTotalCost(), limits.perRun)
    }

    if (monitor.isRunOverBudget()) {
      console.log(`[runner] ✗ Run budget exceeded: $${monitor.getTotalCost().toFixed(2)} > $${limits.perRun.toFixed(2)}`)
      return finalizeRun(id, config, stepResults, monitor, 'budget_exceeded', startedAt)
    }
  }

  return finalizeRun(id, config, stepResults, monitor, 'completed', startedAt)
}

async function finalizeRun(
  id: string,
  config: RunConfig,
  steps: StepResult[],
  monitor: RunMonitor,
  status: RunLog['status'],
  startedAt: string
): Promise<RunLog> {
  const log: RunLog = {
    id,
    config,
    steps,
    totalInputTokens: steps.reduce((sum, s) => sum + s.inputTokens, 0),
    totalOutputTokens: steps.reduce((sum, s) => sum + s.outputTokens, 0),
    totalCostUsd: monitor.getTotalCost(),
    totalDurationMs: monitor.getTotalDurationMs(),
    status,
    startedAt,
    completedAt: new Date().toISOString(),
  }

  const totalTokens = log.totalInputTokens + log.totalOutputTokens
  console.log(formatRunSummary(steps.length, totalTokens, log.totalCostUsd, log.totalDurationMs))

  const logPath = await writeRunLog(log)
  console.log(`[runner] Log saved: ${logPath}`)

  await notifyRunComplete(log)

  return log
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run lib/runner/executor.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/runner/executor.ts lib/runner/executor.test.ts
git commit -m "feat(runner): add pipeline executor with step chaining and budget enforcement"
```

### Task 11: Intake Conversation Module

**Files:**
- Create: `lib/runner/intake.ts`

- [ ] **Step 1: Implement `lib/runner/intake.ts`**

```typescript
import * as readline from 'readline'
import { loadAgent } from './loader'
import { runAgentLLM } from '@/lib/llm/router'
import { createTask } from './clickup'
import type { IntakeResult, BudgetTier } from './types'

const MAX_TURNS = 10

/**
 * Runs the intake conversation loop.
 * The intake agent asks clarifying questions, user responds,
 * until the agent signals it has enough info.
 */
export async function runIntake(initialIdea?: string): Promise<IntakeResult> {
  const agent = await loadAgent('intake_agent')

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const ask = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve))

  const conversationHistory: string[] = []

  if (initialIdea) {
    conversationHistory.push(`User: ${initialIdea}`)
    console.log(`\n[intake] Starting with: "${initialIdea}"\n`)
  } else {
    const idea = await ask('[intake] What would you like to build? ')
    conversationHistory.push(`User: ${idea}`)
  }

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const context = conversationHistory.join('\n')
    const prompt = turn === 0 && !initialIdea
      ? 'Start gathering requirements for this feature request. Ask your first clarifying question.'
      : 'Continue the conversation. Ask the next question, or if you have enough info, respond with a JSON block wrapped in ```json``` containing the IntakeResult.'

    const result = await runAgentLLM(
      {
        provider: agent.provider,
        model_id: agent.model,
        prompt: agent.systemPrompt,
        token_budget: agent.tokenBudget,
      },
      prompt,
      context
    )

    const response = result.text

    // Check if agent returned structured JSON (conversation complete)
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/)
    if (jsonMatch) {
      rl.close()
      const intake = JSON.parse(jsonMatch[1]) as IntakeResult
      console.log(`\n[intake] Requirements gathered. Summary:`)
      console.log(`  Title: ${intake.title}`)
      console.log(`  Pipeline: ${intake.pipeline}`)
      console.log(`  Priority: ${intake.priority}`)
      console.log(`  Criteria: ${intake.acceptanceCriteria.length} items`)
      return intake
    }

    // Agent is still asking questions
    console.log(`\n[intake] ${response}\n`)
    conversationHistory.push(`Agent: ${response}`)

    const answer = await ask('[you] ')
    conversationHistory.push(`User: ${answer}`)
  }

  rl.close()
  throw new Error('Intake conversation exceeded maximum turns without producing a result')
}

/**
 * Runs intake and optionally creates a ClickUp task.
 */
export async function runIntakeAndCreateTask(
  initialIdea?: string,
  clickupListId?: string
): Promise<{ intake: IntakeResult; taskId?: string }> {
  const intake = await runIntake(initialIdea)

  if (clickupListId) {
    const priorityMap: Record<BudgetTier, number> = {
      urgent: 1, high: 2, normal: 3, low: 4, override: 3,
    }
    const taskId = await createTask(
      clickupListId,
      intake.title,
      intake.description,
      intake.tags,
      priorityMap[intake.priority]
    )
    console.log(`[intake] ClickUp task created: ${taskId}`)
    return { intake, taskId }
  }

  return { intake }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/runner/intake.ts
git commit -m "feat(runner): add conversational intake module"
```

---

## Phase 3: Entry Points

### Task 12: npm Scripts

**Files:**
- Create: `scripts/run-agent.ts`
- Create: `scripts/run-intake.ts`
- Modify: `package.json` (add scripts)

- [ ] **Step 1: Create `scripts/run-agent.ts`**

```typescript
import { executePipeline } from '../lib/runner/executor'
import { fetchTaskAsRunConfig } from '../lib/runner/clickup'
import { readFile } from 'fs/promises'
import type { RunConfig, BudgetTier } from '../lib/runner/types'

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  const getArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag)
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined
  }

  const hasFlag = (flag: string): boolean => args.includes(flag)

  // ClickUp mode
  const clickupTaskId = getArg('--clickup')
  if (clickupTaskId) {
    console.log(`[runner] Fetching ClickUp task: ${clickupTaskId}`)
    const config = await fetchTaskAsRunConfig(clickupTaskId)
    await executePipeline(config)
    return
  }

  // File mode
  const filePath = getArg('--file')
  let input: string
  if (filePath) {
    input = await readFile(filePath, 'utf-8')
  } else {
    input = getArg('--input') ?? ''
  }

  if (!input) {
    console.error('Usage:')
    console.error('  npm run agent -- --input "feature description"')
    console.error('  npm run agent -- --file ./features/my-feature.md')
    console.error('  npm run agent -- --clickup TASK_ID')
    console.error('')
    console.error('Options:')
    console.error('  --pipeline <name>    Pipeline type (default: feature)')
    console.error('  --priority <tier>    Budget tier (default: normal)')
    console.error('  --no-budget-limit    Disable budget enforcement')
    process.exit(1)
  }

  const config: RunConfig = {
    pipeline: getArg('--pipeline') ?? 'feature',
    input,
    priority: (getArg('--priority') as BudgetTier) ?? 'normal',
    source: 'cli',
    noBudgetLimit: hasFlag('--no-budget-limit'),
  }

  await executePipeline(config)
}

main().catch(err => {
  console.error('[runner] Fatal error:', err.message)
  process.exit(1)
})
```

- [ ] **Step 2: Create `scripts/run-intake.ts`**

```typescript
import { runIntakeAndCreateTask } from '../lib/runner/intake'

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  // First non-flag argument is the initial idea
  const initialIdea = args.find(a => !a.startsWith('--')) || undefined

  const getArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag)
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined
  }

  const clickupListId = getArg('--list') ?? process.env.CLICKUP_DEFAULT_LIST_ID

  const { intake, taskId } = await runIntakeAndCreateTask(initialIdea, clickupListId)

  console.log('\n[intake] Done.')
  console.log(`  Title: ${intake.title}`)
  console.log(`  Pipeline: ${intake.pipeline}`)
  console.log(`  Priority: ${intake.priority}`)
  if (taskId) {
    console.log(`  ClickUp Task: ${taskId}`)
  }
}

main().catch(err => {
  console.error('[intake] Fatal error:', err.message)
  process.exit(1)
})
```

- [ ] **Step 3: Add npm scripts to `package.json`**

Add to the `"scripts"` section:
```json
"agent": "npx tsx scripts/run-agent.ts",
"agent:intake": "npx tsx scripts/run-intake.ts"
```

- [ ] **Step 4: Install tsx (TypeScript executor)**

```bash
npm install -D tsx
```

- [ ] **Step 5: Commit**

```bash
git add scripts/run-agent.ts scripts/run-intake.ts package.json package-lock.json
git commit -m "feat(runner): add npm script entry points for runner and intake"
```

### Task 13: ClickUp Webhook Route

**Files:**
- Create: `app/api/runner/webhook/route.ts`

- [ ] **Step 1: Create `app/api/runner/webhook/route.ts`**

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { executePipeline } from '@/lib/runner/executor'
import { fetchTaskAsRunConfig, postTaskComment, buildResultComment, updateTaskStatus } from '@/lib/runner/clickup'
import { createHmac, timingSafeEqual } from 'crypto'

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  const secret = process.env.CLICKUP_WEBHOOK_SECRET
  if (!secret || !signature) return false

  const expected = createHmac('sha256', secret).update(body).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-signature')

    // Verify webhook signature if secret is configured
    if (process.env.CLICKUP_WEBHOOK_SECRET) {
      if (!verifyWebhookSignature(body, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const payload = JSON.parse(body)

    // ClickUp sends different event types — we care about task status changes
    // and tag additions
    const eventType = payload.event
    const taskId = payload.task_id

    if (!taskId) {
      return NextResponse.json({ error: 'No task_id in payload' }, { status: 400 })
    }

    // Only process relevant events
    const relevantEvents = ['taskStatusUpdated', 'taskTagUpdated']
    if (!relevantEvents.includes(eventType)) {
      return NextResponse.json({ status: 'ignored', event: eventType })
    }

    // Fetch the full task and check if it should trigger the runner
    const config = await fetchTaskAsRunConfig(taskId)

    // Determine if this is a new run or a resume from approval gate
    // Status "Approved" means the user approved a pending pipeline
    // Status "Ready for Agent" or tag "run-agent" means new pipeline run
    const isApprovalResume = payload.history_items?.some(
      (h: { field: string; after: { status: string } }) =>
        h.field === 'status' && h.after?.status === 'Approved'
    )

    if (isApprovalResume) {
      console.log(`[webhook] Approval received for task ${taskId}, resuming pipeline`)
    }

    // Execute pipeline (async — respond immediately, run in background)
    // executePipeline automatically detects and resumes pending runs via .runner/pending/<taskId>.json
    executePipeline(config)
      .then(async log => {
        if (log.status !== 'aborted') {
          // Only post results if pipeline actually completed (not paused at another gate)
          const comment = buildResultComment(log)
          await postTaskComment(taskId, comment)
          await updateTaskStatus(taskId, 'Agent Complete')
        }
      })
      .catch(async err => {
        await postTaskComment(taskId, `## Pipeline Error\n\n${err.message}`)
        await updateTaskStatus(taskId, 'Agent Failed')
      })

    return NextResponse.json({ status: isApprovalResume ? 'resuming' : 'accepted', taskId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/runner/webhook/route.ts
git commit -m "feat(runner): add ClickUp webhook route for automated pipeline triggers"
```

### Task 14: Final Verification

- [ ] **Step 1: Run all tests**

```bash
npm run test:run
```

Expected: All tests pass — loader, logger, monitor, notify, clickup, and the relocated LLM tests.

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Lint check**

```bash
npm run lint
```

Expected: No new errors.

- [ ] **Step 4: Verify ai/ folder structure**

```bash
find ai/ -type f | sort
```

Expected:
```
ai/agents/backend_engineer.md
ai/agents/code_reviewer.md
ai/agents/data_modeller.md
ai/agents/devops_engineer.md
ai/agents/frontend_engineer.md
ai/agents/fullstack_engineer.md
ai/agents/intake_agent.md
ai/agents/product_manager.md
ai/agents/qa_engineer.md
ai/agents/security_expert.md
ai/agents/system_checker.md
ai/agents/task_distributor.md
ai/agents/task_planner.md
ai/agents/token_monitor.md
ai/pipelines/bug.md
ai/pipelines/enhancement.md
ai/pipelines/feature.md
ai/pipelines/system_guard.md
ai/system/agent_rules.md
```

- [ ] **Step 5: Verify lib/ structure**

```bash
find lib/llm lib/runner -type f | sort
```

Expected:
```
lib/llm/defaults.ts
lib/llm/router.test.ts
lib/llm/router.ts
lib/llm/tokens.test.ts
lib/llm/tokens.ts
lib/llm/types.ts
lib/runner/clickup.test.ts
lib/runner/clickup.ts
lib/runner/executor.test.ts
lib/runner/executor.ts
lib/runner/intake.ts
lib/runner/loader.test.ts
lib/runner/loader.ts
lib/runner/logger.test.ts
lib/runner/logger.ts
lib/runner/monitor.test.ts
lib/runner/monitor.ts
lib/runner/notify.test.ts
lib/runner/notify.ts
lib/runner/types.ts
```

- [ ] **Step 6: Final commit (if any fixups needed)**

```bash
git add -A
git commit -m "fix(runner): address any issues found during verification"
```

This step is only needed if previous verification steps revealed issues to fix.

- [ ] **Step 7: Push branch**

```bash
git push origin feature/agent-runner
```
