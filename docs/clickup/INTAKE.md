# Intake Process

How raw ideas and requests become structured, actionable ClickUp tasks in Evenzi's workspace.

---

## What is Intake?

Intake is the process of turning a raw idea or request into a structured, actionable ClickUp task. It serves three purposes:

1. **Context completeness** -- Every task has enough detail for a Claude Code session to work from without guessing.
2. **Quality gate** -- Vague or under-specified work never enters the sprint.
3. **Type classification** -- The right template and pipeline are applied from the start.

If a task cannot answer "what does the user do, on which page, with what data?" it has not passed intake.

---

## Intake Flow

```
Raw Request --> Clarify Requirements --> Determine Type --> Create Task --> Populate Template
```

### Step 1: Receive Request

The user describes what they want. Sources include:

- Direct conversation in a Claude Code session
- An item sitting in the **Ideas** list in ClickUp
- External feedback (user testing, stakeholder notes)

At this stage the request can be a one-liner. That is fine -- intake will expand it.

### Step 2: Clarify Requirements

Follow the conversational pattern from the intake agent (`ai/agents/intake_agent.md`):

- Ask **one question at a time**.
- Prefer **multiple-choice** answers when possible (faster for the user, less ambiguity).
- Gather: scope, target pages/routes, data entities involved, acceptance criteria.
- **3-6 questions** is typically enough. Stop when the picture is clear.
- After gathering, present a **summary for confirmation** before creating anything.

Example flow:

```
Q: Is this a new feature, a bug fix, or an improvement to something existing?
A: New feature.

Q: Which user role does this serve?
   a) Host   b) Guest   c) Both
A: Host.

Q: What pages or routes are involved?
A: The event dashboard and a new /events/[id]/budget page.

Q: What data entities are involved?
A: expenses table, budget_categories
   ...
```

### Step 3: Determine Type

| Type        | When to use                        | Pipeline    |
|-------------|-------------------------------------|-------------|
| Feature     | New functionality that does not exist yet | `feature`   |
| Bug         | Something that is broken or incorrect     | `bug`       |
| Enhancement | Improving existing functionality          | `enhancement` |

The type determines which template to use and which pipeline steps apply. See `ai/pipelines/` for the full step sequences.

### Step 4: Create ClickUp Task

Select the appropriate template from `docs/clickup/TEMPLATES.md`:

- **Feature** -- Use the Feature Parent template. Creates the full 3-level hierarchy (parent, phases, component subtasks).
- **Bug** -- Use a lighter format: title, steps to reproduce, expected vs actual behavior, severity (P0/P1/P2).
- **Enhancement** -- Use the Feature Parent template with a lighter scope section (no full brainstorm needed).

Set priority, tags (`mvp-phase-1`, `feature`/`bug`/`enhancement`, `claude-code`), and any known dependencies.

### Step 5: Populate Content

Content comes from the workflow, not from copy-pasting placeholders:

- **Features:** The brainstorm and plan phases generate the description, acceptance criteria, and subtask breakdown.
- **Bugs:** Investigation and reproduction generate the technical details.
- **Enhancements:** Impact analysis generates the scope and change description.

Never create a task with `[TODO]` or `[Fill in later]` content. If the content is not ready, the task stays in Ideas until it is.

---

## Intake Question Bank

### Feature Questions

| # | Question | Purpose |
|---|----------|---------|
| 1 | What user role does this serve? (Host / Guest / Both) | Scoping |
| 2 | What is the user flow, step by step? | UX clarity |
| 3 | What pages or routes are involved? | Technical scope |
| 4 | What data entities are involved? | Data modeling |
| 5 | What are the acceptance criteria? | Definition of done |
| 6 | Any design references? (Stitch/Figma links) | Visual context |

### Bug Questions

| # | Question | Purpose |
|---|----------|---------|
| 1 | What is the expected behavior? | Baseline |
| 2 | What is the actual behavior? | Deviation |
| 3 | Steps to reproduce? | Reproducibility |
| 4 | Which page or route? | Location |
| 5 | Severity? (P0 crash / P1 broken flow / P2 cosmetic) | Priority |

### Enhancement Questions

| # | Question | Purpose |
|---|----------|---------|
| 1 | What existing feature does this improve? | Scope |
| 2 | What is the current behavior? | Baseline |
| 3 | What should change? | Target state |
| 4 | Why? (user feedback, performance, UX) | Justification |

---

## Output Format

After intake completes, the ClickUp task payload follows this structure (adapted from `ai/agents/intake_agent.md`):

```json
{
  "title": "Feature: [Name]",
  "description": "## Requirements\n\n- ...\n\n## Pages\n\n- /events/[id]/...\n\n## Acceptance Criteria\n\n- [ ] ...",
  "pipeline": "feature",
  "priority": "normal",
  "tags": ["feature", "mvp-phase-1", "claude-code"],
  "list_id": "901614372136"
}
```

Field notes:

- **title** -- Prefixed with type (`Feature:`, `Bug:`, `Enhancement:`).
- **description** -- Markdown format. Populated from the template, never left blank.
- **pipeline** -- One of `feature`, `bug`, `enhancement`. Determines the workflow steps.
- **priority** -- Inferred from urgency cues. Default is `normal`. Use `urgent` only for P0 blockers.
- **tags** -- Always include the type tag and `claude-code`. Add `mvp-phase-1` for current sprint scope.
- **list_id** -- Target list in ClickUp. Features go to Backlog; bugs go to QA & Bugs.

---

## From Ideas to Backlog

The **Ideas** list is a low-friction dumping ground. One-liners are welcome there.

An idea gets promoted to **Backlog** when it passes intake:

- Has a clear scope (what it does, what it does not do)
- Has user stories or a step-by-step flow
- Has acceptance criteria
- Has been classified (feature / bug / enhancement)
- Has been assigned a priority

Intake can happen in two ways:

1. **In a Claude Code session** -- User describes the idea, Claude runs the conversational intake, creates the task.
2. **Manually** -- User fills out the template in ClickUp directly (less common, more error-prone).

Items that sit in Ideas without being refined for more than two sprints should be reviewed and either promoted or archived.

---

## References

- **Templates:** `docs/clickup/TEMPLATES.md` -- Task template structures for each type
- **Guidelines:** `docs/clickup/GUIDELINES.md` -- General ClickUp usage conventions
- **Workspace:** `docs/clickup/WORKSPACE.md` -- Space, folder, and list structure
- **Intake Agent:** `ai/agents/intake_agent.md` -- The agent definition this process is adapted from
- **Pipelines:** `ai/pipelines/` -- Step sequences for feature, bug, and enhancement workflows
