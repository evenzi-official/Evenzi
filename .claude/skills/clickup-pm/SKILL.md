---
name: clickup-pm
description: ClickUp Product Manager — orchestrates all task CRUD, status transitions, list movement, comments, dependencies, assignments, sprint digests, and Dheeraj→Abhijith progress sync. Called by /start-evenzi-session, /end-evenzi-session, and mid-session. Abhijith path only — never invoked from the Dheeraj path.
---

# ClickUp PM — Task Orchestration Skill

Central hub for ALL ClickUp operations in Evenzi. No other skill or workflow should directly call ClickUp tools — they call this skill instead. **This skill is invoked only on the Abhijith path** (Dheeraj has no ClickUp seat — see `project_dheeraj_no_clickup.md`).

## When to Invoke

- `/start-evenzi-session` (Abhijith path) calls this with modes `sync-dheeraj-progress`, `session-start`, then `regenerate-digests`
- `/end-evenzi-session` (Abhijith path) calls this with modes `session-end`, then `regenerate-digests`
- Mid-session when any ClickUp operation is needed (create tasks, move tasks, update statuses, etc.)
- When user says anything about ClickUp tasks, sprints, or task management

## Reference Docs (Read Before Operating)

Always read these before performing ClickUp operations:

| Doc | Purpose |
|-----|---------|
| `docs/clickup/WORKSPACE.md` | All IDs — spaces, lists, folders, feature tasks |
| `docs/clickup/GUIDELINES.md` | Status workflow, naming, tags, approval gates |
| `docs/clickup/TEMPLATES.md` | 11 task templates, hierarchy rules, dependency order |
| `docs/clickup/DEPENDENCIES.md` | Feature dependency graph, build order, parallel opportunities |

## Modes

### Mode: `session-start`

Called by `/start-evenzi-session` (Abhijith path). Fetches current state and briefs the user.

**Steps:**
1. Fetch in-progress tasks: `clickup_filter_tasks` with tags `["mvp-phase-1"]`, statuses `["in progress"]`
2. Fetch ready tasks: `clickup_filter_tasks` with tags `["mvp-phase-1"]`, statuses `["to do"]`
3. Check for approval gates: `clickup_filter_tasks` with tags `["approval-gate"]`, statuses `["review"]`
4. Return structured summary to the calling skill:
   - **In progress** tasks (name, ID, priority, list)
   - **Ready** tasks (name, ID, priority)
   - **Awaiting approval** tasks (name, ID)

### Mode: `session-end`

Called by `/end-evenzi-session` (Abhijith path). Updates all tasks worked on this session.

**Steps:**
1. Receive list of task IDs worked on during the session
2. For each task, determine appropriate status:
   - Work complete and ready for review → `review`
   - Work partially done, will continue → keep `in progress`
   - Work is blocked → `blocked`
   - Phase approved during session → `done`
3. Add session summary comment to each task:
   ```
   Session Update — [date]

   **What was done:**
   - [Bullet points]

   **Current state:**
   - [Where this stands]

   **Next steps:**
   - [What remains]

   **Blockers (if any):**
   - [What's preventing progress]
   ```
4. Update subtask statuses if individual phases were completed
5. If a feature parent has all subtasks done → set parent to `done`

### Mode: `sync-dheeraj-progress`

Called by `/start-evenzi-session` (Abhijith path) before fetching state. Pulls Dheeraj's last-session work into ClickUp via an approval gate.

**Inputs:** active sprint folder path (e.g. `docs/sprint/sprint-1/`).

**Steps:**
1. Read `<sprint>/dheeraj-progress.md`. Identify entries that are NOT under the `## Synced` section (i.e. anything in the file body before `## Synced` if it exists, or all entries if it doesn't).
2. If no un-synced entries → return `{"synced": 0, "skipped": 0, "modified": 0}` and exit.
3. **Show the un-synced entries to Abhijith verbatim**, per task — no summarization that drops detail.
4. For each entry (or batched per H2 if many), `AskUserQuestion`:
   - **Approve** — sync as written
   - **Modify** — Abhijith dictates corrected status / comment, then sync
   - **Skip** — leave un-synced (will re-appear next session)
5. For each Approved/Modified entry:
   - Update task status via `clickup_update_task` (validate transition per the status workflow rules below).
   - Add a comment via `clickup_create_task_comment` with prefix `From Dheeraj — [date] —` followed by the verbatim Worked on / Decisions / Issues / Notes from the entry.
   - If the entry mentions a bug Dheeraj found, file it via `create-bug` mode (see below).
6. Move synced entries into a `## Synced` section in `dheeraj-progress.md` with a `### Synced YYYY-MM-DD HH:MM (by Abhijith)` heading. The body of synced entries can be the original block verbatim, just relocated.
7. Return counts to the caller.

**Comment template:**
```
From Dheeraj — YYYY-MM-DD

**Worked on:**
- <verbatim>

**Decisions:**
- <verbatim>

**Issues found:**
- <verbatim>

**Files changed:**
- <verbatim>

**Tests:**
- <verbatim>

**Notes:**
- <verbatim>

**Push:** <commit/branch from Dheeraj's entry>

(Synced from docs/sprint/sprint-N/dheeraj-progress.md by Abhijith on YYYY-MM-DD HH:MM)
```

### Mode: `regenerate-digests`

Called by `/start-evenzi-session` (Abhijith path, after `session-start`) and `/end-evenzi-session` (Abhijith path, after `session-end`). Overwrites the per-user sprint digests from current ClickUp state.

**Inputs:** active sprint folder path.

**Steps:**
1. Determine sprint identifier (e.g. `sprint-1`) and active sprint tag (e.g. `sprint:1`) from the folder name.
2. Fetch all sprint tasks: `clickup_filter_tasks` filtered by the sprint tag (or list `901614390914` for current Active Sprint, depending on convention in WORKSPACE.md).
3. Bucket each task into one of: `In progress`, `To do`, `In review`, `Blocked`.
4. For Abhijith: include tasks assigned to `278583396` OR unassigned spec/data/backend/design tasks.
5. For Dheeraj: include tasks assigned to `100996803` OR unassigned frontend/QA/integration tasks.
6. Overwrite `<sprint>/abhijith.md` and `<sprint>/dheeraj.md` using the digest format below.

**Digest format (one file per user):**
```
# Sprint N — <user> digest (generated YYYY-MM-DD HH:MM)

## In progress
- <task name> (<clickup-id>) — <priority> — <short context, 1 line>

## To do
- <task name> (<clickup-id>) — <priority>

## In review (waiting on Abhijith approval)
- <task name> (<clickup-id>) — <what to review>

## Blocked
- <task name> (<clickup-id>) — <blocker>
```

Empty sections may be omitted to keep the file scannable.

### Mode: `task-activate`

Move a task into active work. Called when user picks a task to work on.

**Steps:**
1. Fetch full task details with `clickup_get_task` (subtasks: true)
2. Set task status to `in progress`
3. If task is in Backlog list, move to Active Sprint list (`901614390914`)
4. Add comment: "Session started — working on this task"
5. Identify the next uncompleted subtask/phase and return it

### Mode: `create-feature`

Create a full feature task hierarchy from a brainstorm/plan output.

**Steps:**
1. Read `docs/clickup/TEMPLATES.md` for template structure
2. Read `docs/clickup/WORKSPACE.md` for IDs
3. Create feature parent in Backlog (`901614372136`) using Template 1
4. Create phase subtasks under parent:
   - Spec & Architecture (Template 2)
   - Data Modeling (Template 3)
5. Create component subtasks (Template 4) — one per component identified in brainstorm
6. Under each component, create dev phase sub-subtasks:
   - UI/UX Design (Template 5)
   - Frontend Dev (Template 6)
   - Backend Dev (Template 7)
   - Component QA (Template 8)
7. Create cross-cutting subtasks:
   - Integration Testing (Template 9)
   - Documentation (Template 10)
   - Release (Template 11)
8. Set dependencies per TEMPLATES.md hierarchy rules
9. Apply tags per the tags table in TEMPLATES.md
10. Set priority inherited from feature parent
11. Assign members per WORKSPACE.md team table:
    - Spec & Architecture, Data Modeling → Abhijith (278583396)
    - Frontend, Backend, QA, Integration → Dheeraj (100996803)

### Mode: `create-bug`

Create a bug task in QA & Bugs list, linked to the affected feature.

**Steps:**
1. Ask user to describe the bug (or receive description from caller)
2. Create task in QA & Bugs list (`901614372142`) with name format: `Bug: [description]`
3. Tags: `mvp-phase-1`, `claude-code` (if found by Claude)
4. Priority based on severity:
   - **Urgent** — Blocker, breaks core flow
   - **High** — Broken functionality, bad UX
   - **Normal** — Cosmetic, minor issue
   - **Low** — Edge case, rare scenario
5. Description includes: steps to reproduce, expected vs actual, affected feature
6. Link to the affected feature parent task using `clickup_add_task_link`
7. Add comment on the feature parent: "Bug filed: [bug task name] ([bug task URL])"

### Mode: `create-enhancement`

Create an enhancement subtask under the current feature parent.

**Steps:**
1. Create as subtask under the current feature parent with name: `Enhancement: [description]`
2. Tags: `mvp-phase-1` + relevant phase tag
3. Priority based on impact (usually Normal or High)
4. Description: what was discovered, why it matters, what it depends on
5. Add comment on parent task: "Enhancement created: [task name]"

### Mode: `create-subtasks`

Create subtasks under an existing parent task.

**Steps:**
1. Read the parent task to understand context
2. Use appropriate template from TEMPLATES.md
3. Apply correct tags, priority, and assignments
4. Set dependencies within the subtask group

### Mode: `update-status`

Update one or more task statuses.

**Steps:**
1. Validate the transition is legal per the status workflow:
   ```
   backlog → to do → in progress → review → approved → done
   Revision: review → in progress → review
   Special: any → blocked (with blocker note)
   ```
   ⚠️ The status is named `review` (not `in review`). Passing `"in review"` returns `Status does not exist`.
2. If task is in **Backlog** list and you're transitioning to `done` or `review`, move it to **Active Sprint** (`901614390914`) first — those statuses don't exist in the Backlog list.
3. Update task status
4. If transitioning to `review`, add comment describing what needs review
5. If transitioning to `done`, verify all child tasks are also done
6. If transitioning from `blocked`, add comment about what was unblocked

### Mode: `move-task`

Move a task between lists.

**Steps:**
1. Read `docs/clickup/WORKSPACE.md` for list IDs
2. Common moves:
   - Backlog → Active Sprint: `901614372136` → `901614390914`
   - Active Sprint → Done (stays in Active Sprint, status changes)
   - Ideas → Backlog: `901614379769` → `901614372136`
3. Use `clickup_move_task` with the task ID and target list ID
4. Update task status if the move implies a status change

### Mode: `set-dependencies`

Set task dependencies.

**Steps:**
1. Read `docs/clickup/TEMPLATES.md` for dependency rules
2. Standard dependency chain:
   - Spec → blocks all component work
   - Data Model → blocks Backend and Frontend dev
   - Within component: UI/UX → Frontend → Backend → QA (sequential)
   - All component QAs → block Integration Testing
   - Integration + Documentation → block Release
3. Use `clickup_add_task_dependency` with type `waiting_on`

### Mode: `assign-members`

Assign team members to tasks.

**Steps:**
1. Read `docs/clickup/WORKSPACE.md` for member IDs
2. Standard assignments:
   - Spec & Architecture, Data Modeling → Abhijith (278583396)
   - Frontend Dev, Backend Dev, QA, Integration → Dheeraj (100996803)
   - Documentation, Release → unassigned (assigned at sprint planning)
3. Use `clickup_update_task` with assignees array

### Mode: `sprint-manage`

Manage sprint tasks — move to sprint, prioritize, reorder.

**Steps:**
1. Fetch Active Sprint list tasks: `clickup_filter_tasks` with list_ids `["901614390914"]`
2. Show current sprint state
3. Ask user what to do:
   - Add tasks from Backlog to Sprint
   - Remove/deprioritize tasks
   - Reorder by priority
4. Execute changes

### Mode: `batch-update`

Batch update multiple tasks at once. Use parallel subagents for independent operations.

**Steps:**
1. Group operations by independence
2. Dispatch independent operations in parallel using multiple tool calls
3. Sequential operations run in order
4. Report results

## Status Workflow Reference

```
backlog → to do → in progress → review → approved → done
                                    ↓                    
                              in progress (revision)     
                                                         
Any status → blocked (with blocker note)                 
blocked → previous status (when unblocked)               
```

> ⚠️ Canonical name in ClickUp is `review` (not `in review`). The Backlog list does not expose `done` or `review` statuses — move the task to Active Sprint first.

## Naming Conventions

| Task Type | Format |
|-----------|--------|
| Feature parent | `Feature: [Feature Name]` |
| Spec | `Spec & Architecture: [Feature Name]` |
| Data model | `Data Modeling: [Feature Name]` |
| Component | `Component: [Component Name]` |
| UI/UX | `UI/UX Design: [Component Name]` |
| Frontend | `Frontend Dev: [Component Name]` |
| Backend | `Backend Dev: [Component Name]` |
| QA | `Component QA: [Component Name]` |
| Integration | `Integration Testing: [Feature Name]` |
| Docs | `Documentation: [Feature Name]` |
| Release | `Release: [Feature Name]` |

## Tag Rules

Every task gets:
- `mvp-phase-1` — always
- Phase tag (`phase:spec`, `phase:frontend`, etc.) — per task type
- `approval-gate` — on any task requiring user approval
- `claude-code` — on tasks implemented by Claude Code
- `feature` — on feature parents only
- `component` — on component tasks only

## Key IDs (from WORKSPACE.md)

| Resource | ID |
|----------|-----|
| Product Space | `90166506901` |
| Backlog List | `901614372136` |
| Active Sprint List | `901614390914` |
| Ideas List | `901614379769` |
| Frontend List | `901614372123` |
| Backend List | `901614372124` |
| Database List | `901614372125` |
| DevOps List | `901614372126` |
| Design List | `901613884694` |
| QA & Bugs List | `901614372142` |
| Documentation List | `901614372331` |
| Abhijith (Spec/Data) | `278583396` |
| Dheeraj (Dev/QA) | `100996803` |

## Comments Discipline

**Comments are critical.** Every meaningful interaction with a task gets a comment.

### When picking up a task (session start):
```
Session started — [date]
Working on: [what specifically]
Approach: [high-level plan]
```

### During work (progress updates):
```
Progress Update — [date]

**Added:**
- [What was built/changed]

**Decisions:**
- [Any technical decisions made and why]

**Issues found:**
- [Bugs or enhancements discovered during work]
```

### When completing work:
```
Work Complete — [date]

**What was done:**
- [Bullet points of deliverables]

**Files changed:**
- [Key files created/modified]

**Testing:**
- [What was tested, results]

**Discovered issues:**
- [Bugs/enhancements found — with links to new tasks if created]
```

## Bugs & Enhancements Discovered During Work

When testing or implementing a feature, you will often discover issues that aren't part of the current task. Handle them properly:

### Enhancement (nice-to-have improvement):
1. Create as subtask under the **current feature parent** with name format: `Enhancement: [description]`
2. Tag with `mvp-phase-1` + relevant phase tag
3. Set priority based on impact (usually Normal or High)
4. Add description explaining: what was discovered, why it matters, what it depends on
5. Add a comment on the parent task noting the enhancement was created

### Bug (something broken):
1. Create in **QA & Bugs list** (`901614372142`) with name format: `Bug: [description]`
2. Tag with `mvp-phase-1`, `claude-code` (if found by Claude)
3. Set priority based on severity (Urgent for blockers, High for broken flows, Normal for cosmetic)
4. Add description: steps to reproduce, expected vs actual, affected feature
5. Link to the feature parent task
6. Add a comment on the parent task noting the bug was filed

### Standalone tasks that belong under a feature:
**Never create orphaned tasks in Backlog.** If the work relates to an existing feature, create it as a subtask of that feature parent. Only create standalone tasks for truly cross-cutting work (infra, tooling, DevOps).

## Rules

1. **Never skip approval gates** — every phase goes through `review` before proceeding
2. **Never hardcode IDs** — always reference WORKSPACE.md (this skill embeds key IDs above for convenience, but WORKSPACE.md is the source of truth)
3. **Never create freeform tasks** — always use a template from TEMPLATES.md
4. **Always add tags** — every task gets its phase tag + `mvp-phase-1`
5. **Always set dependencies** — per the hierarchy rules in TEMPLATES.md
6. **Batch parallel operations** — use parallel tool calls for independent ClickUp operations
7. **Comment on every transition** — add a comment explaining why when changing status
8. **Verify before marking done** — check all child tasks are done before marking parent done
9. **Always comment when picking up a task** — what you're doing and your approach
10. **Always comment when completing a task** — what was done, what was tested, issues found
11. **Never create orphaned tasks** — everything belongs under a feature parent or in QA & Bugs
12. **File bugs and enhancements immediately** — don't defer, create the task when discovered
