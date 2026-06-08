---
name: plan-review
description: Contextual multi-agent plan review — reads the implementation plan and reviews it from the perspective of relevant agents (Tech Lead, Frontend Engineer, Security Expert, Data Modeller). Presents consolidated findings for user approval before implementation begins.
---

# Plan Review — Multi-Agent Review Gate

Invoke this skill AFTER `superpowers:writing-plans` produces an implementation plan and BEFORE `superpowers:executing-plans` starts implementation.

This is an **approval gate** — the user must approve the review findings before implementation begins.

## When to Invoke

- After a plan has been written to `docs/superpowers/plans/`
- Before any implementation code is written
- Can also be invoked standalone to review an existing plan

## Process

### Step 1: Read the Plan

Read the implementation plan from `docs/superpowers/plans/`. Identify:
- What database/schema work is planned
- What UI/component work is planned
- What API/auth work is planned
- What the overall architecture looks like
- How many tasks and what complexity

### Step 2: Determine Which Agents Review

Based on what the plan contains, select relevant reviewers. **Tech Lead always reviews.** Others are contextual:

| Plan Contains | Agent | Review Focus |
|---------------|-------|-------------|
| Always | **Tech Lead** (`ai/agents/tech_lead.md`) | Architecture soundness, system fit, over-engineering, module impact |
| Schema changes, DB migrations, new tables | **Data Modeller** (`ai/agents/data_modeller.md`) | Normalization, RLS policies, indexes, migration quality, FK cascades |
| UI components, pages, client-side code | **Frontend Engineer** (`ai/agents/frontend_engineer.md`) | Component design, reusability, accessibility, responsive, design patterns |
| API routes, auth logic, user data handling | **Security Expert** (`ai/agents/security_expert.md`) | Auth gaps, RLS coverage, input validation, data leaks, vulnerability patterns |
| API endpoints, service layer | **Backend Engineer** (`ai/agents/backend_engineer.md`) | Route structure, error handling, validation, service extraction |
| Test strategy mentioned | **Test Engineer** (`ai/agents/test_engineer.md`) | Test plan completeness (AC → test cases mapping), sad-path catalogue coverage, tooling picks (Vitest/Playwright/axe), CI integration |

**Typical feature plan:** Tech Lead + Frontend + Security + Data Modeller (4 agents)
**Backend-only plan:** Tech Lead + Security + Backend + Data Modeller (4 agents)
**UI-only plan:** Tech Lead + Frontend (2 agents)
**Schema-only plan:** Tech Lead + Data Modeller (2 agents)

### Step 3: Read Agent Knowledge Files

For each selected agent, read their `.md` file from `ai/agents/`. These files contain:
- Role-specific checklists
- Review criteria
- Anti-patterns to watch for
- Quality standards

Also read `ai/system/agent_rules.md` for shared coding standards.

### Step 4: Review From Each Perspective

For each selected agent, review the plan through their lens. Look for:

**Tech Lead perspective:**
- Does the architecture make sense for this feature?
- Is it over-engineered or under-engineered?
- Does it fit with existing codebase patterns?
- Are there missing modules or unexpected impacts on existing code?
- Are the tech decisions pragmatic?

**Frontend Engineer perspective:**
- Are components designed for reusability (props, variants, not duplication)?
- Is the component tree well-structured (server vs client)?
- Are all UI states covered (default, empty, loading, error)?
- Is responsive design addressed?
- Does it follow atomic design (atoms → molecules → organisms)?
- Are existing components in `components/ui/` being reused?

**Security Expert perspective:**
- Does every API route have auth verification?
- Are RLS policies defined for all new tables?
- Is input validation present at API boundaries?
- Are there potential data leaks (server → client)?
- Does middleware cover new routes?
- Are the 9 vulnerability patterns checked?

**Data Modeller perspective:**
- Is the schema properly normalized?
- Do all tables have UUID PKs, created_at, updated_at?
- Are RLS policies airtight (no cross-user data leaks)?
- Are indexes on FK columns and common query patterns?
- Are FK cascades correct (ON DELETE behavior)?
- Is the migration SQL reversible?

**Backend Engineer perspective:**
- Are route handlers thin with logic in services?
- Are request/response types explicitly defined?
- Is error handling consistent (try-catch, proper status codes)?
- Is validation done before any DB operations?

**Test Engineer perspective:**
- Does every acceptance criterion map to at least one test case (with type + priority + target file)?
- Is the sad-path catalogue applied (auth failures, RLS denials, validation, network errors, empty/over-limit states, third-party degradation)?
- Are tooling picks correct for each layer (Vitest unit/integration, RTL component, Playwright E2E, axe a11y) — and are missing tools called out?
- Are coverage targets per layer stated and justified?
- Is CI integration defined (push / pre-merge / nightly)?
- Will the plan produce a `docs/test-plans/<slug>.md` artifact?

### Step 5: Consolidate Findings

Group findings into a structured report:

```markdown
## Plan Review — [Feature Name]

**Reviewers:** [list of agents that reviewed]
**Plan file:** [path to plan]

### Findings

#### [Agent Name] — [X findings]

**Gaps:**
- [What's missing from the plan]

**Concerns:**
- [What could go wrong or needs more thought]

**Suggestions:**
- [Improvements or alternatives]

[Repeat per agent]

### Summary

**Total findings:** [count]
- Critical (must fix before implementing): [count]
- Important (should address): [count]
- Suggestions (nice to have): [count]

**Recommendation:** [Approve / Revise / Needs Discussion]
```

### Step 6: User Approval Gate

Present the consolidated report to the user and ask:

```
Plan review complete. [X] findings from [Y] agents.

[Critical count] critical issues that should be fixed before implementing.
[Important count] important suggestions to improve the plan.
[Nice-to-have count] optional improvements.

How do you want to proceed?
```

Use `AskUserQuestion` with options:
- **Approve as-is** — Proceed to implementation, address findings during dev
- **Revise plan** — Update the plan to address critical/important findings, then re-review
- **Discuss findings** — Walk through specific findings before deciding
- **Skip non-critical** — Fix only critical items, proceed with the rest

### Step 7: Revise if Needed

If the user chooses to revise:
1. Update the plan file with fixes for the identified gaps
2. Add a "Review History" section to the plan noting what was changed
3. Optionally re-run the review (only if changes are substantial)
4. Return to the approval gate

### Step 8: Proceed to Implementation

Once approved:
1. Note in the plan file: `**Review Status:** Approved — [date]`
2. Note which agents reviewed: `**Reviewed by:** Tech Lead, Security Expert, ...`
3. Invoke `superpowers:executing-plans` or `superpowers:subagent-driven-development`

## Integration with Superpowers

This skill plugs into the superpowers workflow at a specific point:

```
superpowers:brainstorming → spec doc
superpowers:writing-plans → implementation plan
>>> /plan-review → multi-agent review + approval gate <<<
superpowers:executing-plans → implementation
superpowers:requesting-code-review → code review
```

The brainstorming skill's terminal state is invoking writing-plans.
The writing-plans skill produces a plan file.
THIS skill reviews that plan file before implementation begins.
After approval, invoke the appropriate execution skill.

## Rules

1. **Never skip the review** — every plan goes through at least Tech Lead review
2. **Read the actual agent files** — don't rely on memory, read `ai/agents/*.md` fresh each time
3. **Be specific** — cite exact plan sections, task numbers, or missing items
4. **Don't invent problems** — only flag genuine gaps, not style preferences
5. **Critical findings block implementation** — user must acknowledge them before proceeding
6. **Keep the report scannable** — bullet points, clear severity labels, no walls of text
7. **Track which agents reviewed** — record in the plan file for future reference
