---
name: session-report
description: End-of-session report — summarizes work done, token usage estimation, issues discovered, optimization suggestions. Called by /end-evenzi-session (Abhijith path) before committing.
---

# Session Report — End-of-Session Summary

Generates a comprehensive session report covering work accomplished, token usage, and optimization insights. Called by `/end-evenzi-session` before the final commit.

## When to Invoke

- At the end of every session, before committing
- Called by `/end-evenzi-session` as step 3
- Can also be invoked mid-session for a progress check

## Process

### Step 1: Gather Session Data

Collect information about what happened this session:

1. **Git changes:** Run `git diff --stat` and `git log --oneline` to see all changes
2. **Files touched:** Count files created, modified, deleted
3. **Lines changed:** Total additions and deletions
4. **ClickUp tasks:** Which tasks were worked on (from /clickup-pm context)
5. **Phases completed:** Which workflow phases ran (brainstorm, plan, review, implement, etc.)

### Step 2: Token Usage Estimation

Read `ai/agents/token_monitor.md` for the estimation methodology, then estimate:

**Per-phase estimation heuristics:**

| Phase | Estimated Input Tokens | Estimated Output Tokens | Notes |
|-------|----------------------|------------------------|-------|
| Start session (context read) | 5,000-10,000 | 1,000-2,000 | Reading docs, ClickUp fetch |
| Brainstorming | 8,000-15,000 | 3,000-6,000 | Conversational, multi-turn |
| Plan writing | 10,000-20,000 | 5,000-10,000 | Detailed plan generation |
| Plan review (per agent) | 5,000-10,000 | 2,000-4,000 | Read agent + plan + review |
| Implementation (per task) | 10,000-20,000 | 5,000-15,000 | Code generation, heaviest |
| Code review | 8,000-15,000 | 3,000-5,000 | Read code + review |
| Testing | 5,000-10,000 | 3,000-8,000 | Test generation |
| End session (docs + report) | 5,000-8,000 | 2,000-4,000 | Doc updates, summary |

**Cost estimation** (approximate, based on Claude Sonnet pricing):
- Input: ~$3 per 1M tokens
- Output: ~$15 per 1M tokens

Count the actual conversation turns and tool calls to refine the estimate.

### Step 3: Work Summary

Structure the report:

```markdown
## Session Report — [Date]

### Work Accomplished
- **Feature/Task:** [What was worked on]
- **Phases completed:** [brainstorm / plan / review / implement / etc.]
- **ClickUp tasks updated:** [task names + status changes]

### Deliverables
| Type | Count | Details |
|------|-------|---------|
| Files created | [n] | [key files] |
| Files modified | [n] | [key files] |
| Tests added | [n] | [test files] |
| ClickUp tasks created | [n] | [task names] |
| ClickUp comments added | [n] | [on which tasks] |

### Token Usage Estimate
| Phase | Input Tokens | Output Tokens | Est. Cost |
|-------|-------------|---------------|-----------|
| [phase] | [estimate] | [estimate] | $[est] |
| **Total** | **[sum]** | **[sum]** | **$[sum]** |

### Issues Discovered
| Issue | Type | Task Created | Priority |
|-------|------|-------------|----------|
| [description] | Bug/Enhancement | [task ID or "no"] | [priority] |

### Optimization Suggestions
- [Suggestions for reducing token usage in future sessions]
- [Patterns that consumed more tokens than necessary]
- [Workflow improvements]

### Next Session
- [What to pick up next]
- [Any blockers or prerequisites]
- [Estimated scope/complexity]
```

### Step 4: Optimization Analysis

Based on the session's work, identify token optimization opportunities:

**Common optimizations:**
- **Reduce context reads:** If the same file was read multiple times, note it
- **Parallel vs sequential:** Were there tasks that could have been parallelized?
- **Agent selection:** Were the right agents used, or could lighter models have worked?
- **Plan granularity:** Was the plan too detailed (over-specified) or too vague (caused rework)?
- **Scope control:** Did the session stay focused or drift into unplanned work?
- **Tool call efficiency:** Were there redundant tool calls or searches?

**Report these as actionable suggestions**, not just observations. Example:
- "3 files were read multiple times — consider caching approach for next session"
- "Brainstorming took 4 turns for a simple feature — could skip to plan for small changes"
- "Plan review engaged 4 agents for a backend-only change — 2 would have sufficed"

### Step 5: Save Report

Save the report to `docs/session-reports/[date]-session-report.md`.

Create the `docs/session-reports/` directory if it doesn't exist.

This creates a running history of session reports that can be analyzed over time for trends in token usage, productivity patterns, and optimization opportunities.

## Integration with /end-evenzi-session

```
/end-evenzi-session
  1. Review git changes
  2. /clickup-pm (session-end)
  3. >>> /session-report → generate report <<<
  4. Update project docs
  5. Commit (include session report in commit)
  6. Push → merge → cleanup
```

## Rules

1. **Always estimate, never fabricate** — token counts are estimates, label them clearly
2. **Be honest about scope drift** — if the session went off-track, note it
3. **Actionable suggestions only** — no vague "could be better" without specifics
4. **Save every report** — build the history for trend analysis
5. **Keep it scannable** — tables and bullets, not paragraphs
6. **Include ClickUp context** — which tasks, what status changes, comments added
