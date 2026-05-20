---
name: agent-evolve
description: Self-evolution mechanism for agents — captures non-obvious learnings from sessions and appends them to the relevant agent's `ai/agents/<role>.md` file under a `## Learnings` section. Quality-gated (only validated, non-obvious, role-specific, actionable insights). Hard cap of 8 entries per agent. Invokable anytime during a session or as a batch at end-session.
---

# Agent Evolve — Selective Self-Learning

Lets agents evolve their own role files (`ai/agents/<role>.md`) with high-signal learnings observed during real sessions. The principle: **fewer, sharper learnings beat many shallow ones**. Hard cap of 8 entries per agent, strict quality bar, user approval before any write.

## Modes

| Mode | Invocation | When |
|---|---|---|
| `capture` | `Skill agent-evolve` mid-session or `/agent-evolve capture` | Anytime a non-obvious insight surfaces during work, council, or debugging |
| `batch` | Called by `/end-session` | End-of-session sweep — propose any candidate learnings I noticed across the session |
| `prune` | `/agent-evolve prune <role>` | When a role's section is at the cap and needs cleanup |
| `view` | `/agent-evolve view <role>` | Print the current Learnings section for a role |

Auto-detect: if I notice the user say "remember that…", "we learned…", "save that as a learning", or similar, trigger `capture` mode unprompted.

## Quality bar (all four must pass)

Before drafting a candidate learning, gate it through these criteria. If any fail, **don't propose it**.

1. **Non-obvious** — would NOT already be in the agent's role file, CLAUDE.md, or in the prompt that any competent engineer brings to the role. "Use TypeScript strict mode" fails this bar; "When wiring Supabase RLS in this app, the `auth.uid()` policy fails silently if the session client is used server-side — always use the SSR helper" passes.
2. **Validated** — came from a real outcome in this session (a council finding the user approved, a bug root-cause confirmed, a design choice that worked or didn't). Not speculation, not "this might be useful."
3. **Role-specific** — improves THIS agent's future critiques/work in THEIR lane. A learning about React rendering belongs to `frontend_engineer`, not `tech_lead`. If it's broadly cross-cutting, it belongs in `CLAUDE.md` or `MEMORY.md`, not here.
4. **Actionable** — concrete enough that it would change a future critique. "Be careful with X" fails; "When reviewing API routes, check that input validation runs BEFORE auth verification — reverse order leaks 401-vs-422 timing" passes.

## Anti-duplication checks

Before proposing, scan the candidate against:
- The agent's own existing Learnings entries (no near-duplicates)
- `CLAUDE.md` — if it belongs there, route it there instead
- `~/.claude/projects/.../memory/` — if it's a user-preference or workflow rule, route to memory instead
- `ai/system/agent_rules.md` — if it's a shared coding standard, route there

If a candidate belongs elsewhere, **don't add it to the agent file** — suggest the right home to the user.

## Capture flow (mid-session)

When a candidate insight surfaces:

1. **Recognize** — the trigger is either user intent ("remember X") or my own judgment ("this council finding crossed the quality bar").
2. **Identify the agent** — which role does this learning belong to? If multiple, pick the most specific (or escalate to user).
3. **Draft the entry** — use the format below.
4. **Present to user** — single `AskUserQuestion` with options: Approve / Edit / Reject / Wrong-home (route elsewhere).
5. **Append on approval** — write to the agent's `## Learnings` section, just below the section header. Most recent at top.
6. **Cap check** — if the section now has >8 entries, trigger `prune` immediately for that role.

## Batch flow (end of session)

When `/end-session` runs, after the session report but before commit:

1. **Review the session** — go back through council critiques, debates, arbiter rulings, user corrections, and validated outcomes.
2. **Collect candidates** — apply the quality bar to each potential learning.
3. **Per-session ceiling** — propose AT MOST 10 candidates total across all agents, regardless of session length. Force a quality sort.
4. **Present as a consolidated review** — group by agent, mark recommended vs optional.
5. **User picks** — approve subset, reject rest. Approved entries append.
6. **Cap check + prune** — same as capture flow.

## Entry format

Each learning is a single block in the agent file's `## Learnings` section:

```markdown
### <Short title — 5–9 words>

- **Insight:** <One sentence — the actual learning, written as a rule or pattern>
- **Why it matters:** <Why this changes future critiques — 1 sentence>
- **Source:** <Council date YYYY-MM-DD, artifact ref, or session ID>
- **Confidence:** high | medium
- **Added:** YYYY-MM-DD
```

No "low confidence" entries — if it's only a hunch, it shouldn't be in the file yet.

## Prune flow

When a role's section reaches 9 entries (one over cap):

1. Identify candidates for demotion: lowest confidence, oldest, and least-referenced (i.e., learnings that haven't been cited in any council review since being added).
2. Present 2–3 demotion candidates to the user.
3. User picks one (or chooses to keep the new one out instead).
4. Demoted entry is **archived**, not lost — move to `ai/agents/_archived_learnings.md` under the role's heading, with a one-line summary and date demoted.
5. Section back to 8.

## Conflict detection

If a new candidate **contradicts** an existing entry (e.g., new says "always do X," existing says "never do X"):

1. Don't append silently.
2. Surface both to the user side-by-side.
3. Ask: which is right now, or is this context-dependent?
4. Either: replace the old, update the old with a context qualifier, or reject the new.

Contradictions get logged in the entry: `Supersedes: <old title>` or `Refines: <old title>`.

## Where this skill writes

- **Adds to:** `ai/agents/<role>.md` (inside the `## Learnings` section, just below the section header)
- **Archives to:** `ai/agents/_archived_learnings.md` (created lazily on first archive)
- **Never writes to:** CLAUDE.md, MEMORY.md, or other agent files

## Rules

1. **Never write without user approval.** Every entry, every demotion, every edit — user confirms.
2. **Never propose more than 2 learnings per agent per session** (in batch mode). Force quality.
3. **Never propose more than 10 candidates total in a single batch.** Crowding kills the signal.
4. **Never duplicate, never near-duplicate.** Run the anti-duplication check.
5. **Never route a wrong-home learning silently** — say "this belongs in CLAUDE.md, want me to add it there?" instead of appending it to an agent.
6. **Never lose data on prune** — always archive, never delete.
7. **Source citations are mandatory** — every entry traces back to a real moment in the session.

## Integration with other skills

- `/council` — after a council reaches its verdict, if a finding crossed the quality bar (validated by user approval), the orchestrator marks it as a learning candidate. `agent-evolve capture` runs immediately or queues for batch.
- `/end-session` — invokes `agent-evolve batch` automatically as part of its sequence (after `/session-report`, before commit).
- `/start-session` — does NOT invoke this skill; learnings are written at end, not load-tested at start. But each session's dispatched agents pick up the accumulated learnings via their role file as usual.

## When NOT to invoke

- The session was pure exploration / Q&A with no validated outcomes.
- The user explicitly says "no learnings this session" or similar.
- The candidate insight is really a project decision, user preference, or coding standard — those go elsewhere.
- The agent file already has 8 entries and no candidate strong enough to displace one.
