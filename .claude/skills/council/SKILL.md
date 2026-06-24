---
name: council
description: Multi-agent council with debate + arbiter — dispatches a contextual roster of expert agents in parallel, runs a cross-validation debate round, then a Tech Lead arbiter ruling on disagreements, then a consolidated verdict for user approval. Use at three checkpoints — after writing a plan (before implementation), after implementation (before commit), and when starting to debug a reported bug. Skips automatically for trivial changes.
---

# Council — Multi-Agent Review with Debate & Arbiter

A heavier alternative to single-round review skills like `plan-review`. Use when the artifact is non-trivial and you want cross-validation between domain experts.

## Modes

The skill auto-detects mode from input. Explicit syntax: `/council plan <path>`, `/council design <path-or-description>`, `/council code`, `/council bug <description-or-ticket>`.

| Mode | Target artifact | Default roster (from `ai/agents/`) |
|---|---|---|
| **plan** | A plan file in `docs/superpowers/plans/*` | `tech_lead` (always) + contextual: `frontend_engineer` (UI work), `ui_ux_designer` (UI work, design-system touches), `backend_engineer` (API/service work), `security_expert` (auth/user-data), `data_modeller` (schema), `test_engineer` (test strategy) |
| **design** | A design spec, wireframe description, Stitch/Figma screen export, or design-system change. May be a markdown spec under `docs/superpowers/specs/` or a description provided inline. | `ui_ux_designer` (always) + `frontend_engineer` + `tech_lead` + `product_manager` (always — design must serve product intent) + contextual: `security_expert` (only if the design surfaces sensitive flows: auth, payment, profile/PII) |
| **code** | Current branch diff vs `Dev-Vibe` (or staged diff if specified) | `code_reviewer` + `security_expert` + domain (`frontend_engineer` and/or `backend_engineer` by file paths touched) + `test_engineer` |
| **bug** | Bug description, ClickUp ticket excerpt, stack trace, or repro steps | `tech_lead` + `test_engineer` + domain (by component implicated) + `security_expert` (only if the bug touches auth, data exposure, or input handling) |

**Roster sizing:** keep to 3–5 agents. More than 5 dilutes the debate and burns budget without proportional value.

### Design mode — image limitation

Subagents cannot see Figma/Stitch images directly. For `design` mode to work, the target must be a **written description or spec** of the design — what's on screen, layout, states, interactions, design tokens used. If the user passes only a Figma URL or image, ask them for a brief description first (or read the linked spec markdown). The council reviews the spec text and the design intent, not the pixels. Flag this in the verdict if a written spec was missing.

## Triviality Skip (Phase 0)

**Before dispatching anything, check whether the change is trivial. If yes, log "council skipped — trivial change" and return without dispatching.**

Skip criteria (any one is sufficient):

- **Plan mode:** plan has fewer than 3 tasks total, no schema changes, no new API routes, no auth/RLS changes.
- **Design mode:** a single existing component cosmetic tweak (color, spacing, copy), no new screens, no new design-system tokens, no flow changes. New screens, new flows, new component patterns, or design-system changes ALWAYS get the council.
- **Code mode:** diff is fewer than 50 changed lines AND touches none of: `lib/supabase/**`, `middleware.ts`, `app/api/**`, `lib/runner/**`, any `*.sql` or migration file, any new file under `app/**` (new route/page).
- **Bug mode:** the bug is a one-line typo, a known-trivial revert, or already has a confirmed fix in hand.

Always run if the user explicitly requested council, even on a trivial change. Log: `Council ran by explicit request despite triviality criteria matching.`

## Phase 1 — Independent Critique (parallel)

Dispatch all roster agents in parallel using the Agent tool (subagent_type: `claude` unless a more specific type fits). Each agent gets:

1. **Their role file** — read `ai/agents/<role>.md` and `ai/system/agent_rules.md` and include them in the prompt.
2. **The target artifact** — full plan file, full diff (`git diff Dev-Vibe...HEAD`), or bug description with all available context.
3. **Stay-in-lane constraint** — explicit in the prompt: "Only flag concerns that fall within YOUR domain as described in your role file. Defer cross-domain issues — another agent will cover them."
4. **Output schema** — require structured output:

```
## <Agent Name> — Independent Critique

### Findings
1. **[severity: critical|important|suggestion] [confidence: high|med|low]** — <one-line finding>
   - Location: <file:line or plan section>
   - Reasoning: <2-3 sentences>
   - Suggested action: <concrete next step>

(repeat per finding; aim for 3-7 findings, no padding)

### Out of scope
- <Anything you noticed but is another agent's domain — name the role>
```

Collect all Phase 1 outputs into a "panel transcript."

## Phase 2 — Debate Round (parallel)

Dispatch each roster agent **again** in parallel with the full panel transcript. Each agent gets:

1. Their own Phase 1 findings (for reference)
2. The other agents' Phase 1 findings
3. Required output:

```
## <Agent Name> — Debate

### Endorse
- <Other agent's finding ID> — agree, because <reason from your domain>

### Refute
- <Other agent's finding ID> — disagree, because <reason>. Confidence: <high|med|low>

### Blind spot
- <Something the panel missed that's in YOUR domain> [severity] [confidence]
```

An agent may produce zero items in any section — that's valid.

## Phase 3 — Arbiter Round (single dispatch, Tech Lead)

Dispatch ONE more agent — Tech Lead from `ai/agents/tech_lead.md`. Pass:

1. The full Phase 1 transcript
2. The full Phase 2 debate transcript
3. The list of **contested findings** — anything where one agent flagged it and another refuted it in Phase 2.

Tech Lead's job is to rule on each contested finding only. Required output:

```
## Tech Lead — Arbiter Rulings

For each contested finding:

### Contested: <finding summary>
- **Ruling:** UPHELD | OVERRULED | UPHELD-WITH-MODIFICATION
- **Reasoning:** <2-4 sentences>
- **If upheld-with-modification:** <revised finding>
```

If there are no contested findings, skip Phase 3 entirely.

## Phase 4 — Consolidation (orchestrator)

Synthesize the three phases into a single report. **You do this — don't dispatch another agent.**

```markdown
## Council Verdict — <target>

**Mode:** plan | code | bug
**Roster:** <agent list>
**Artifact:** <path or description>
**Phases run:** Critique + Debate + Arbiter (or noted skip)

### 🔴 Critical (must address before proceeding)
- <finding> — flagged by <agent>, endorsed by <agents>, arbiter ruling if contested

### 🟡 Important (should address)
- <finding> — same format

### 💡 Suggestions (optional)
- <finding>

### 🔵 Blind-spot additions (surfaced in debate)
- <finding> — surfaced by <agent>

### ⚖️ Contested → arbiter resolved
- <finding> — UPHELD/OVERRULED — <tech lead's reasoning>

### Verdict
🟢 PROCEED — no critical findings
🟡 ADDRESS-THEN-PROCEED — <N> critical to fix first
🔴 RE-PLAN | RE-IMPLEMENT | NOT-A-BUG — <reason>
```

## Phase 5 — User Gate

Use `AskUserQuestion` to present the verdict with options:

- **Approve as-is** — proceed; track findings as follow-ups
- **Address critical, then proceed** — I fix the criticals first, you re-verify
- **Revise the artifact** — I update the plan/code/bug-hypothesis to address findings, then optionally re-run council
- **Override and proceed** — user accepts risk on flagged items (log this decision)
- **Discuss specific findings** — walk through one or more findings before deciding

## After Approval

- **Plan mode:** append to the plan file — `**Council reviewed:** YYYY-MM-DD by <roster>. Verdict: <verdict>.` Then invoke `superpowers:executing-plans` or `superpowers:subagent-driven-development`.
- **Design mode:** append to the design spec — `**Council reviewed:** YYYY-MM-DD by <roster>. Verdict: <verdict>.` If the design is approved, frontend dev can start; if revised, update the spec and optionally re-run.
- **Code mode:** if 🟢 and no addressed-then-proceed pending, you can commit. If 🟡, fix and re-run code mode (or single-finding spot check).
- **Bug mode:** the consolidated findings become the debugging hypotheses. Pick the most-supported root cause and proceed to fix, OR if 🔴 NOT-A-BUG, close it with the council's reasoning attached.

## Rules

1. **Always read role files fresh** — don't summarize from memory. `ai/agents/<role>.md` may have been updated.
2. **Parallel dispatch is mandatory** — Phase 1 and Phase 2 agents go in a single message with multiple Agent calls. Sequential dispatch defeats the speed advantage and is twice as expensive in wall time.
3. **Stay-in-lane is enforced in the prompt** — if an agent produces cross-domain findings, ignore them or mark them as "out of scope" in consolidation.
4. **Triviality skip is logged, not silent** — say "Council skipped — trivial change (<criteria matched>)" so the user can override.
5. **Arbiter only on contested findings** — don't ask Tech Lead to re-litigate things every agent already agreed on.
6. **No invented findings** — every consolidation entry traces to at least one named agent in Phase 1 or Phase 2.
7. **Confidence labels are required** — surface low-confidence findings as 💡 suggestions, not 🔴 critical.
8. **Keep the verdict scannable** — bullet points, severity emojis, no walls of text. The user should grok it in under 30 seconds.

## When NOT to use this skill

- Trivial changes (the Phase 0 skip handles this automatically).
- Quick exploratory questions where you just need one agent's opinion — dispatch directly.
- When `plan-review` is enough (single-round, no debate, no arbiter) — use it for fast passes on small plans.
- When the user has already approved an artifact and just wants implementation — don't re-litigate.
