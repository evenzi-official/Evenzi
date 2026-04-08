# Evenzi — ClickUp Task Management Guidelines

> Rules and conventions Claude Code follows when creating or updating tasks in ClickUp.
>
> **Related docs:** [TEMPLATES.md](./TEMPLATES.md) | [WORKSPACE.md](./WORKSPACE.md) | [INTAKE.md](./INTAKE.md)

---

## 1. Task Creation Rules

- Always use a template from [TEMPLATES.md](./TEMPLATES.md) — never create freeform tasks
- Populate every section with feature-specific content generated during the superpowers brainstorm/plan workflow — never leave generic placeholders
- Tag every task per the tags table in TEMPLATES.md
- Set dependencies per the hierarchy rules in TEMPLATES.md (Spec before components, Data Model before dev phases, etc.)
- Place feature parents in the **Backlog** list; move to Development lists when picked for sprint
- Use workspace IDs from [WORKSPACE.md](./WORKSPACE.md) — never hardcode or guess IDs

---

## 2. Naming Conventions

| Task Type | Format |
|-----------|--------|
| Feature parent | `Feature: [Feature Name]` |
| Spec | `Spec & Architecture: [Feature Name]` |
| Data model | `Data Modeling: [Feature Name]` |
| Component | `Component: [Component Name]` |
| UI/UX design | `UI/UX Design: [Component Name]` |
| Frontend dev | `Frontend Dev: [Component Name]` |
| Backend dev | `Backend Dev: [Component Name]` |
| Component QA | `Component QA: [Component Name]` |
| Integration | `Integration Testing: [Feature Name]` |
| Documentation | `Documentation: [Feature Name]` |
| Release | `Release: [Feature Name]` |

Names must be specific — `Feature: Guest Management & RSVP`, not `Feature: New Feature`.

---

## 3. Status Workflow

```
backlog → to do → in progress → in review → approved → done
```

| Status | Meaning |
|--------|---------|
| **backlog** | Defined but not yet scheduled |
| **to do** | Scheduled for current sprint |
| **in progress** | Actively being worked on |
| **in review** | Approval gate — user validates output |
| **approved** | User approved, ready for next phase |
| **done** | Fully complete, no further action |
| **blocked** | Waiting on a dependency |

**Revision flow:** `in review` → `in progress` (rework per feedback) → `in review`

---

## 4. Approval Gates

- Every phase task (Spec, Data Model, UI/UX, Frontend, Backend, QA, Integration, Docs, Release) has an approval gate
- Set status to **in review** when work is ready for user validation
- **Never proceed to the next phase without user approval**
- User marks **approved** to unblock downstream tasks, or sends back with feedback for revision
- Add a comment summarizing what was done and what needs review

---

## 5. Priority Rules

| Priority | When to Use |
|----------|-------------|
| **Urgent** | P0 blockers, core flow tasks that gate everything |
| **High** | Important for MVP but not currently blocking others |
| **Normal** | Standard work, most tasks default here |
| **Low** | Nice-to-have, polish, can be deferred |

Inherit priority from the feature parent unless the subtask has a specific reason to differ.

---

## 6. Intake Flow

For new features or bugs, follow the conversational intake pattern defined in `ai/agents/intake_agent.md`:

1. **Gather requirements** — Ask clarifying questions one at a time (3-6 typically enough)
2. **Create feature parent** — Using Template 1 from TEMPLATES.md
3. **Brainstorm components** — During superpowers brainstorm phase, identify components
4. **Create subtask hierarchy** — Components, then dev phase subtasks under each
5. **Fill templates during plan phase** — Populate with real content from the plan output

See [INTAKE.md](./INTAKE.md) for the full intake process and intake agent output format.

---

## 7. Parallel Work

- **Components within a feature** can be worked in parallel (separate sessions/subagents)
- **Different features** can be worked in parallel if no cross-feature dependencies
- Use subagents for parallel ClickUp operations (batch task creation, batch status updates)
- Always verify dependencies are met before starting parallel work
- See CLAUDE.md "Parallel Subagents" section for execution patterns

---

## 8. What NOT to Do

- Do not create tasks with empty or generic template content — every field must be feature-specific
- Do not skip approval gates — even if the work seems trivial
- Do not create standalone tasks outside the feature hierarchy (unless truly cross-cutting like infra or tooling)
- Do not forget tags — every task needs its phase tag, `mvp-phase-1`, and `claude-code` (if built by Claude)
- Do not set a task to **done** without going through **in review** first
- Do not create duplicate tasks — search ClickUp before creating
- Do not hardcode workspace/list/space IDs — always reference WORKSPACE.md
