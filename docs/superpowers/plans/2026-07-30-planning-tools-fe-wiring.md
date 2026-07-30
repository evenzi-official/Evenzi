# Planning Tools Backend-Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `app/events/[id]/planning/PlanningClient.tsx` from a client-state-only prototype (833 lines, zero persistence) into a fully working Planning Tools feature — real task CRUD, real budget/expense tracking, bulk actions, and a custom expense-type creator — reading and writing the already-live `event_tasks`/`event_budgets`/`event_expenses`/`event_expense_types` schema (migrations `planning_01`–`planning_07`, verified live 2026-07-30: 204 seeded tasks, 17 budgets, 170 expense-type rows, all 3 views, all 3 RPCs, RLS enabled).

**Architecture:** `page.tsx` stays a thin server component that fetches everything up front (tasks, budget summary, expenses, per-event expense types, resolved sub-events, the 2 catalogs) in one `Promise.all` and hands it to `PlanningClient`, which owns all list/filter/sort/selection/modal state (same shape as `GuestManagementClient.tsx`/`MediaClient.tsx`). Seven new API routes under `/api/events/[id]/planning/*` follow the exact validate→auth→zod→Supabase→JSON-response shape already used by `app/api/events/[id]/guests/route.ts`. No new shared components — the two new bulk-action pickers reuse `PlanningClient`'s own existing inline `.gm-setter` popover pattern (already built for the Filter/Sort buttons), not a new component.

**Tech Stack:** Next.js 14 App Router, Supabase (`@supabase/ssr`), Zod, existing shell CSS/JSX primitives (`designs/shared/shell.css`, `designs/pages/planning/planning.css` — already imported in `app/globals.css:9`, confirmed during planning, no CSS work needed).

## Global Constraints

- Every new API route must check `supabase.auth.getUser()` and return 401 before touching data — matches every existing `/api/events/**` route.
- RLS is owner-scoped on every planning table via `events.user_id` (inlined predicate, not `can_access_event()` yet — D26 in the data-model spec) — routes rely on RLS for authorization, no manual "does this event belong to this user" check, matching `guests/route.ts`.
- Catalog resolution is by **slug**, not by hardcoded id, and catalogs are fetched once server-side and cached client-side — matches `FE-INTEGRATION.md` §4's stated convention.
- Task creation always defaults to the `pending` status server-side (never accepted from the client) — mirrors `guests/route.ts` always defaulting new guests to the `pending` RSVP status.
- Full design: `docs/superpowers/specs/2026-07-30-planning-tools-fe-wiring-design.md`. Full data model: `docs/superpowers/specs/2026-06-14-planning-data-model-design.md`. FE recipes: `docs/data-model/FE-INTEGRATION.md` §4.

## Plan deviations from spec (decided during planning)

1. **Toolbar counts stay client-computed** from the loaded task list (existing `useMemo` in `PlanningClient.tsx`), not fetched via `rpc('event_task_counts')`. The design spec §5 explicitly allows this as "a deliberate simplification, not a gap" — re-deriving from an already-loaded list avoids an extra round-trip on every filter change.
2. **Bulk "Set date" and "Assign" pickers drop the prototype's undo-toast.** The vanilla-JS prototype (`designs/pages/planning/planning.js:1208-1270`) shows an undo toast after each bulk action. This app has no existing toast-with-undo component (confirmed — `grep` for `actionLabel`/`onAction` across `app/**/*.tsx` returns nothing), and Guest Management's plan set the precedent for scoping down prototype interaction flourishes that aren't in the design doc's testing checklist (see `docs/superpowers/plans/2026-07-29-guest-management.md`, deviation #2). The two new bulk pickers reuse `PlanningClient`'s own `.gm-setter` inline popover (already built for Filter/Sort) with a plain confirm — no undo.
3. **Receipt upload is a UI-only stub, exactly as the prototype labels it** ("Prototype — won't save yet"). The file input accepts an image, shows a local preview via `URL.createObjectURL`, and the preview is discarded on submit — `receipt_key` is never set. This matches the data-model spec §12's explicit deferral ("Receipt upload — column exists; R2 upload/signed-URL serving is a backend follow-up").
4. **Custom expense-type creation inserts directly into `event_expense_types`** (per-event table), not `config.expense_types` (admin catalog) — matches the data-model spec's "Host '+ Add type' → `is_custom = true`" line exactly.

---

## File Structure

- `lib/types/planning.ts` — **create**: shared TypeScript types (`TaskRow`, `ExpenseRow`, `TaskPriorityOption`, `TaskStatusOption`, `ExpenseTypeOption`, `SubEventOption`, `BudgetSummary`, `PlanningInitialData`).
- `lib/validations/planning.ts` — **create**: Zod schemas (`uuidSchema`, `createTaskSchema`, `updateTaskSchema`, `bulkTaskActionSchema`, `upsertBudgetSchema`, `createExpenseSchema`, `updateExpenseSchema`, `createExpenseTypeSchema`).
- `app/api/events/[id]/planning/tasks/route.ts` — **create**: `POST` — create a task.
- `app/api/events/[id]/planning/tasks/[taskId]/route.ts` — **create**: `PATCH` (partial update, incl. done-toggle via `statusId`) + `DELETE`.
- `app/api/events/[id]/planning/tasks/bulk/route.ts` — **create**: `POST` — `{action:'complete'|'delete'|'setDate'|'assign', taskIds, ...}`.
- `app/api/events/[id]/planning/budget/route.ts` — **create**: `PUT` — upsert total budget.
- `app/api/events/[id]/planning/expenses/route.ts` — **create**: `POST` — create an expense.
- `app/api/events/[id]/planning/expenses/[expenseId]/route.ts` — **create**: `PATCH` + `DELETE`.
- `app/api/events/[id]/planning/expense-types/route.ts` — **create**: `POST` — custom per-event expense type.
- `app/events/[id]/planning/page.tsx` — **rewrite**: fetch all initial data server-side, pass typed props.
- `app/events/[id]/planning/PlanningClient.tsx` — **rewrite**: replace all client-only state mutations with real API calls; replace hardcoded `EXPENSE_TYPES`/`EVENT_SUBEVENTS` with props data; add "+ Add type" flow, receipt-upload stub, and the two bulk pickers.

---

## Task 1: Types and validation schemas

**Files:**
- Create: `lib/types/planning.ts`
- Create: `lib/validations/planning.ts`

**Interfaces:**
- Produces: `TaskRow`, `ExpenseRow`, `TaskPriorityOption`, `TaskStatusOption`, `ExpenseTypeOption`, `SubEventOption`, `BudgetSummary`, `PlanningInitialData` (consumed by Tasks 5, 6, 7); `uuidSchema`, `createTaskSchema`, `updateTaskSchema`, `bulkTaskActionSchema`, `upsertBudgetSchema`, `createExpenseSchema`, `updateExpenseSchema`, `createExpenseTypeSchema` (consumed by Tasks 2, 3, 4).

- [ ] **Step 1: Write `lib/types/planning.ts`**

```typescript
export interface TaskPriorityOption {
  id: string
  slug: 'low' | 'med' | 'high'
  name: string
  iconName: string | null
}

export interface TaskStatusOption {
  id: string
  slug: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  name: string
  category: 'open' | 'done' | 'dropped'
  iconName: string | null
}

export interface ExpenseTypeOption {
  id: string
  name: string
  iconName: string | null
  isCustom: boolean
}

export interface SubEventOption {
  id: string
  label: string
}

export interface TaskRow {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  subEventId: string | null
  priorityId: string
  statusId: string
}

export interface ExpenseRow {
  id: string
  amount: number
  expenseTypeId: string
  vendorName: string | null
  subEventId: string | null
  expenseDate: string | null
  description: string | null
}

export interface BudgetSummary {
  totalAmount: number
  spent: number
  remaining: number
}

export interface PlanningInitialData {
  eventName: string
  tasks: TaskRow[]
  expenses: ExpenseRow[]
  budget: BudgetSummary | null
  taskPriorities: TaskPriorityOption[]
  taskStatuses: TaskStatusOption[]
  expenseTypes: ExpenseTypeOption[]
  subEvents: SubEventOption[]
}
```

- [ ] **Step 2: Write `lib/validations/planning.ts`**

```typescript
import { z } from 'zod'

export const uuidSchema = z.string().uuid()

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task name is required').max(200),
  description: z.string().trim().max(1000).nullable().optional(),
  dueDate: isoDateSchema.nullable().optional(),
  subEventId: z.string().uuid().nullable().optional(),
  priorityId: z.string().uuid().optional(),
}).strict()

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  dueDate: isoDateSchema.nullable().optional(),
  subEventId: z.string().uuid().nullable().optional(),
  priorityId: z.string().uuid().optional(),
  statusId: z.string().uuid().optional(),
}).strict()

export const bulkTaskActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('complete'),
    taskIds: z.array(z.string().uuid()).min(1).max(500),
  }).strict(),
  z.object({
    action: z.literal('delete'),
    taskIds: z.array(z.string().uuid()).min(1).max(500),
  }).strict(),
  z.object({
    action: z.literal('setDate'),
    taskIds: z.array(z.string().uuid()).min(1).max(500),
    dueDate: isoDateSchema.nullable(),
  }).strict(),
  z.object({
    action: z.literal('assign'),
    taskIds: z.array(z.string().uuid()).min(1).max(500),
    subEventId: z.string().uuid().nullable(),
  }).strict(),
])

export const upsertBudgetSchema = z.object({
  totalAmount: z.number().positive('Enter a valid amount greater than zero'),
}).strict()

export const createExpenseSchema = z.object({
  amount: z.number().positive('Enter a valid amount greater than zero'),
  expenseTypeId: z.string().uuid(),
  vendorName: z.string().trim().max(200).nullable().optional(),
  subEventId: z.string().uuid().nullable().optional(),
  expenseDate: isoDateSchema.nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
}).strict()

export const updateExpenseSchema = z.object({
  amount: z.number().positive().optional(),
  expenseTypeId: z.string().uuid().optional(),
  vendorName: z.string().trim().max(200).nullable().optional(),
  subEventId: z.string().uuid().nullable().optional(),
  expenseDate: isoDateSchema.nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
}).strict()

export const createExpenseTypeSchema = z.object({
  name: z.string().trim().min(1, 'Enter a type name').max(60),
}).strict()
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "planning\.ts"`
Expected: no output (no errors referencing the two new files).

- [ ] **Step 4: Commit**

```bash
git add lib/types/planning.ts lib/validations/planning.ts
git commit -m "feat(planning): types + zod schemas for backend wiring"
```

---

## Task 2: Task CRUD API routes

**Files:**
- Create: `app/api/events/[id]/planning/tasks/route.ts`
- Create: `app/api/events/[id]/planning/tasks/[taskId]/route.ts`

**Interfaces:**
- Consumes: `uuidSchema`, `createTaskSchema`, `updateTaskSchema` (Task 1).
- Produces: `POST /api/events/[id]/planning/tasks` → `{ task: TaskRow }`; `PATCH`/`DELETE /api/events/[id]/planning/tasks/[taskId]`.

- [ ] **Step 1: Write `app/api/events/[id]/planning/tasks/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createTaskSchema, uuidSchema } from '@/lib/validations/planning'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = createTaskSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { title, description, dueDate, subEventId, priorityId } = parsed.data

    const { data: pendingStatus, error: statusError } = await supabase
      .schema('config').from('task_statuses').select('id').eq('slug', 'pending').single()
    if (statusError || !pendingStatus) {
      console.error('POST /api/events/[id]/planning/tasks: pending status lookup failed:', statusError)
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    let resolvedPriorityId = priorityId
    if (!resolvedPriorityId) {
      const { data: medPriority, error: prioError } = await supabase
        .schema('config').from('task_priorities').select('id').eq('slug', 'med').single()
      if (prioError || !medPriority) {
        console.error('POST /api/events/[id]/planning/tasks: med priority lookup failed:', prioError)
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
      }
      resolvedPriorityId = medPriority.id
    }

    const { data: taskRow, error: insertError } = await supabase
      .from('event_tasks')
      .insert({
        event_id: id,
        title,
        description: description ?? null,
        due_date: dueDate ?? null,
        sub_event_id: subEventId ?? null,
        priority_id: resolvedPriorityId,
        status_id: pendingStatus.id,
      })
      .select('id, title, description, due_date, sub_event_id, priority_id, status_id')
      .single()

    if (insertError || !taskRow) {
      console.error('POST /api/events/[id]/planning/tasks failed:', insertError)
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    return NextResponse.json({
      task: {
        id: taskRow.id,
        title: taskRow.title,
        description: taskRow.description,
        dueDate: taskRow.due_date,
        subEventId: taskRow.sub_event_id,
        priorityId: taskRow.priority_id,
        statusId: taskRow.status_id,
      },
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Write `app/api/events/[id]/planning/tasks/[taskId]/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { updateTaskSchema, uuidSchema } from '@/lib/validations/planning'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
): Promise<NextResponse> {
  try {
    const { id, taskId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(taskId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = updateTaskSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { title, description, dueDate, subEventId, priorityId, statusId } = parsed.data

    const patch: Record<string, unknown> = {}
    if (title !== undefined) patch.title = title
    if (description !== undefined) patch.description = description
    if (dueDate !== undefined) patch.due_date = dueDate
    if (subEventId !== undefined) patch.sub_event_id = subEventId
    if (priorityId !== undefined) patch.priority_id = priorityId
    if (statusId !== undefined) patch.status_id = statusId

    const { data: taskRow, error: updateError } = await supabase
      .from('event_tasks')
      .update(patch)
      .eq('id', taskId)
      .eq('event_id', id)
      .select('id, title, description, due_date, sub_event_id, priority_id, status_id')
      .single()

    if (updateError || !taskRow) {
      console.error('PATCH /api/events/[id]/planning/tasks/[taskId] failed:', updateError)
      return NextResponse.json({ error: 'Failed to update task' }, { status: 404 })
    }

    return NextResponse.json({
      task: {
        id: taskRow.id,
        title: taskRow.title,
        description: taskRow.description,
        dueDate: taskRow.due_date,
        subEventId: taskRow.sub_event_id,
        priorityId: taskRow.priority_id,
        statusId: taskRow.status_id,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
): Promise<NextResponse> {
  try {
    const { id, taskId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(taskId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error: deleteError } = await supabase
      .from('event_tasks').delete().eq('id', taskId).eq('event_id', id)

    if (deleteError) {
      console.error('DELETE /api/events/[id]/planning/tasks/[taskId] failed:', deleteError)
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Verify manually**

Run the dev server (`npm run dev`), sign in, then from the browser console on any event page:
```javascript
fetch('/api/events/<real-event-id>/planning/tasks', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ title: 'Test task' }) }).then(r => r.json()).then(console.log)
```
Expected: `{ task: { id: '<uuid>', title: 'Test task', ... } }` with `priorityId`/`statusId` populated (not null).

- [ ] **Step 4: Commit**

```bash
git add app/api/events/\[id\]/planning/tasks
git commit -m "feat(planning): task create/update/delete API routes"
```

---

## Task 3: Bulk task actions API route

**Files:**
- Create: `app/api/events/[id]/planning/tasks/bulk/route.ts`

**Interfaces:**
- Consumes: `bulkTaskActionSchema`, `uuidSchema` (Task 1).
- Produces: `POST /api/events/[id]/planning/tasks/bulk` → `{ success: true }`.

- [ ] **Step 1: Write the route**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { bulkTaskActionSchema, uuidSchema } from '@/lib/validations/planning'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = bulkTaskActionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    if (parsed.data.action === 'complete') {
      const { error } = await supabase.rpc('bulk_set_task_status', {
        p_task_ids: parsed.data.taskIds,
        p_status_slug: 'completed',
      })
      if (error) {
        console.error('POST .../tasks/bulk (complete) failed:', error)
        return NextResponse.json({ error: 'Failed to complete tasks' }, { status: 500 })
      }
    } else if (parsed.data.action === 'delete') {
      const { error } = await supabase.from('event_tasks')
        .delete().eq('event_id', id).in('id', parsed.data.taskIds)
      if (error) {
        console.error('POST .../tasks/bulk (delete) failed:', error)
        return NextResponse.json({ error: 'Failed to delete tasks' }, { status: 500 })
      }
    } else if (parsed.data.action === 'setDate') {
      const { error } = await supabase.from('event_tasks')
        .update({ due_date: parsed.data.dueDate }).eq('event_id', id).in('id', parsed.data.taskIds)
      if (error) {
        console.error('POST .../tasks/bulk (setDate) failed:', error)
        return NextResponse.json({ error: 'Failed to set due date' }, { status: 500 })
      }
    } else {
      const { error } = await supabase.from('event_tasks')
        .update({ sub_event_id: parsed.data.subEventId }).eq('event_id', id).in('id', parsed.data.taskIds)
      if (error) {
        console.error('POST .../tasks/bulk (assign) failed:', error)
        return NextResponse.json({ error: 'Failed to assign sub-event' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify manually**

```javascript
fetch('/api/events/<id>/planning/tasks/bulk', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'complete', taskIds: ['<task-uuid>'] }) }).then(r => r.json()).then(console.log)
```
Expected: `{ success: true }`. Then verify the task's `status_id` in the DB resolves to the `completed` slug.

- [ ] **Step 3: Commit**

```bash
git add app/api/events/\[id\]/planning/tasks/bulk
git commit -m "feat(planning): bulk task actions API route (complete/delete/setDate/assign)"
```

---

## Task 4: Budget, expense, and expense-type API routes

**Files:**
- Create: `app/api/events/[id]/planning/budget/route.ts`
- Create: `app/api/events/[id]/planning/expenses/route.ts`
- Create: `app/api/events/[id]/planning/expenses/[expenseId]/route.ts`
- Create: `app/api/events/[id]/planning/expense-types/route.ts`

**Interfaces:**
- Consumes: `upsertBudgetSchema`, `createExpenseSchema`, `updateExpenseSchema`, `createExpenseTypeSchema`, `uuidSchema` (Task 1).
- Produces: `PUT /api/events/[id]/planning/budget`, `POST/PATCH/DELETE .../expenses[/expenseId]`, `POST .../expense-types`.

- [ ] **Step 1: Write `app/api/events/[id]/planning/budget/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { upsertBudgetSchema, uuidSchema } from '@/lib/validations/planning'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = upsertBudgetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { error: upsertError } = await supabase
      .from('event_budgets')
      .upsert(
        { event_id: id, total_amount: parsed.data.totalAmount, modified_by: user.id },
        { onConflict: 'event_id' }
      )

    if (upsertError) {
      console.error('PUT /api/events/[id]/planning/budget failed:', upsertError)
      return NextResponse.json({ error: 'Failed to save budget' }, { status: 500 })
    }

    const { data: summary } = await supabase
      .from('event_budget_summary').select('total_amount, spent, remaining').eq('event_id', id).single()

    return NextResponse.json({
      budget: summary ? { totalAmount: summary.total_amount, spent: summary.spent, remaining: summary.remaining } : null,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Write `app/api/events/[id]/planning/expenses/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createExpenseSchema, uuidSchema } from '@/lib/validations/planning'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = createExpenseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { amount, expenseTypeId, vendorName, subEventId, expenseDate, description } = parsed.data

    const { data: expenseRow, error: insertError } = await supabase
      .from('event_expenses')
      .insert({
        event_id: id,
        expense_type_id: expenseTypeId,
        amount,
        vendor_name: vendorName ?? null,
        sub_event_id: subEventId ?? null,
        expense_date: expenseDate ?? null,
        description: description ?? null,
        created_by: user.id,
      })
      .select('id, amount, expense_type_id, vendor_name, sub_event_id, expense_date, description')
      .single()

    if (insertError || !expenseRow) {
      console.error('POST /api/events/[id]/planning/expenses failed:', insertError)
      return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
    }

    return NextResponse.json({
      expense: {
        id: expenseRow.id,
        amount: expenseRow.amount,
        expenseTypeId: expenseRow.expense_type_id,
        vendorName: expenseRow.vendor_name,
        subEventId: expenseRow.sub_event_id,
        expenseDate: expenseRow.expense_date,
        description: expenseRow.description,
      },
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Write `app/api/events/[id]/planning/expenses/[expenseId]/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { updateExpenseSchema, uuidSchema } from '@/lib/validations/planning'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
): Promise<NextResponse> {
  try {
    const { id, expenseId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(expenseId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = updateExpenseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { amount, expenseTypeId, vendorName, subEventId, expenseDate, description } = parsed.data

    const patch: Record<string, unknown> = {}
    if (amount !== undefined) patch.amount = amount
    if (expenseTypeId !== undefined) patch.expense_type_id = expenseTypeId
    if (vendorName !== undefined) patch.vendor_name = vendorName
    if (subEventId !== undefined) patch.sub_event_id = subEventId
    if (expenseDate !== undefined) patch.expense_date = expenseDate
    if (description !== undefined) patch.description = description

    const { data: expenseRow, error: updateError } = await supabase
      .from('event_expenses')
      .update(patch)
      .eq('id', expenseId)
      .eq('event_id', id)
      .select('id, amount, expense_type_id, vendor_name, sub_event_id, expense_date, description')
      .single()

    if (updateError || !expenseRow) {
      console.error('PATCH .../expenses/[expenseId] failed:', updateError)
      return NextResponse.json({ error: 'Failed to update expense' }, { status: 404 })
    }

    return NextResponse.json({
      expense: {
        id: expenseRow.id,
        amount: expenseRow.amount,
        expenseTypeId: expenseRow.expense_type_id,
        vendorName: expenseRow.vendor_name,
        subEventId: expenseRow.sub_event_id,
        expenseDate: expenseRow.expense_date,
        description: expenseRow.description,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
): Promise<NextResponse> {
  try {
    const { id, expenseId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(expenseId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error: deleteError } = await supabase
      .from('event_expenses').delete().eq('id', expenseId).eq('event_id', id)

    if (deleteError) {
      console.error('DELETE .../expenses/[expenseId] failed:', deleteError)
      return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Write `app/api/events/[id]/planning/expense-types/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createExpenseTypeSchema, uuidSchema } from '@/lib/validations/planning'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = createExpenseTypeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { data: typeRow, error: insertError } = await supabase
      .from('event_expense_types')
      .insert({
        event_id: id,
        name: parsed.data.name,
        icon_name: 'more_horiz',
        is_custom: true,
        source_slug: null,
      })
      .select('id, name, icon_name, is_custom')
      .single()

    if (insertError || !typeRow) {
      // unique(event_id, lower(name)) violation → 409, not 500
      const status = insertError?.code === '23505' ? 409 : 500
      console.error('POST .../expense-types failed:', insertError)
      return NextResponse.json({ error: status === 409 ? 'That type already exists' : 'Failed to create expense type' }, { status })
    }

    return NextResponse.json({
      expenseType: { id: typeRow.id, name: typeRow.name, iconName: typeRow.icon_name, isCustom: typeRow.is_custom },
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Verify manually**

Budget: `fetch('/api/events/<id>/planning/budget', {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({totalAmount: 500000})}).then(r=>r.json()).then(console.log)` → expect `{ budget: { totalAmount: 500000, spent: 0, remaining: 500000 } }`.
Expense-type: `fetch('/api/events/<id>/planning/expense-types', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name:'Mehendi Artist'})}).then(r=>r.json()).then(console.log)` → expect a 201 with `isCustom: true`; re-run with the same name → expect 409.

- [ ] **Step 6: Commit**

```bash
git add app/api/events/\[id\]/planning/budget app/api/events/\[id\]/planning/expenses app/api/events/\[id\]/planning/expense-types
git commit -m "feat(planning): budget upsert, expense CRUD, custom expense-type API routes"
```

---

## Task 5: Rewrite `page.tsx` — full server-side data fetch

**Files:**
- Modify: `app/events/[id]/planning/page.tsx` (currently 31 lines, fetches only `event.name`)

**Interfaces:**
- Consumes: `PlanningInitialData` and its constituent types (Task 1).
- Produces: `<PlanningClient initialData={PlanningInitialData} />` — Task 6/7 consume this prop shape.

- [ ] **Step 1: Rewrite the file**

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import { PlanningClient } from './PlanningClient'
import { uuidSchema } from '@/lib/validations/planning'
import type { PlanningInitialData } from '@/lib/types/planning'

export default async function PlanningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!uuidSchema.safeParse(id).success) redirect('/home')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: event } = await supabase.from('events').select('id, name').eq('id', id).single()
  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

  const [
    { data: taskRows },
    { data: expenseRows },
    { data: budgetSummary },
    { data: priorityRows },
    { data: statusRows },
    { data: expenseTypeRows },
    { data: subEventRows },
  ] = await Promise.all([
    supabase.from('event_tasks')
      .select('id, title, description, due_date, sub_event_id, priority_id, status_id')
      .eq('event_id', id).order('created_at', { ascending: true }),
    supabase.from('event_expenses')
      .select('id, amount, expense_type_id, vendor_name, sub_event_id, expense_date, description')
      .eq('event_id', id).order('expense_date', { ascending: false }),
    supabase.from('event_budget_summary').select('total_amount, spent, remaining').eq('event_id', id).maybeSingle(),
    supabase.schema('config').from('task_priorities').select('id, slug, name, icon_name').order('display_order', { ascending: true }),
    supabase.schema('config').from('task_statuses').select('id, slug, name, category, icon_name').order('display_order', { ascending: true }),
    supabase.from('event_expense_types').select('id, name, icon_name, is_custom').eq('event_id', id).eq('enabled', true).order('display_order', { ascending: true }),
    supabase.from('event_sub_events').select('id, custom_name, event_sub_type_id').eq('event_id', id).order('display_order', { ascending: true }),
  ])

  // Resolve sub-event display names off the config catalog — same two-step
  // pattern as app/events/[id]/guests/page.tsx (cross-schema embeds aren't available).
  const typeIds = Array.from(
    new Set((subEventRows ?? []).map((se) => se.event_sub_type_id).filter((t): t is string => t != null))
  )
  const typeNamesById: Record<string, string> = {}
  if (typeIds.length > 0) {
    const { data: typeRows } = await supabase.schema('config').from('event_sub_types').select('id, name').in('id', typeIds)
    for (const t of typeRows ?? []) typeNamesById[t.id] = t.name
  }

  const initialData: PlanningInitialData = {
    eventName,
    tasks: (taskRows ?? []).map((t) => ({
      id: t.id, title: t.title, description: t.description, dueDate: t.due_date,
      subEventId: t.sub_event_id, priorityId: t.priority_id, statusId: t.status_id,
    })),
    expenses: (expenseRows ?? []).map((e) => ({
      id: e.id, amount: e.amount, expenseTypeId: e.expense_type_id, vendorName: e.vendor_name,
      subEventId: e.sub_event_id, expenseDate: e.expense_date, description: e.description,
    })),
    budget: budgetSummary ? { totalAmount: budgetSummary.total_amount, spent: budgetSummary.spent, remaining: budgetSummary.remaining } : null,
    taskPriorities: (priorityRows ?? []).map((p) => ({ id: p.id, slug: p.slug as 'low' | 'med' | 'high', name: p.name, iconName: p.icon_name })),
    taskStatuses: (statusRows ?? []).map((s) => ({
      id: s.id, slug: s.slug as 'pending' | 'in_progress' | 'completed' | 'cancelled',
      name: s.name, category: s.category as 'open' | 'done' | 'dropped', iconName: s.icon_name,
    })),
    expenseTypes: (expenseTypeRows ?? []).map((t) => ({ id: t.id, name: t.name, iconName: t.icon_name, isCustom: t.is_custom })),
    subEvents: (subEventRows ?? []).map((se) => ({
      id: se.id, label: se.custom_name ?? (se.event_sub_type_id ? typeNamesById[se.event_sub_type_id] ?? 'Function' : 'Function'),
    })),
  }

  return (
    <div data-page="planning">
      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: eventName.toUpperCase(), href: `/events/${id}` },
          { label: 'PLANNING' },
        ]}
        backHref={`/events/${id}`}
      />
      <main className="page-band pt-10 pb-24">
        <PlanningClient eventId={id} initialData={initialData} />
      </main>
      <PageFooter />
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "planning/page\.tsx"`
Expected: errors referencing `PlanningClient`'s current prop signature (`{ eventName }`) — this is expected until Task 6 updates it. Confirm no *other* errors (typos, missing imports) in this file specifically.

- [ ] **Step 3: Commit**

```bash
git add app/events/\[id\]/planning/page.tsx
git commit -m "feat(planning): page.tsx fetches real tasks/budget/expenses/catalogs server-side"
```

---

## Task 6: `PlanningClient.tsx` — checklist wiring (tasks, priorities, statuses, sub-events)

**Files:**
- Modify: `app/events/[id]/planning/PlanningClient.tsx:1-233` (props, types, state init, task CRUD handlers)

**Interfaces:**
- Consumes: `PlanningInitialData`, `TaskRow`, `TaskPriorityOption`, `TaskStatusOption`, `SubEventOption` (Task 1); `POST/PATCH/DELETE .../tasks[/taskId]` (Task 2).
- Produces: updated `Task` shape and `resolvePriority`/`resolveStatus`/`subEventLabel` helpers — consumed by Task 8 (bulk wiring) and Task 7 (shares the same file).

This task changes the `Task` interface from the client-generated-number-id shape to the real DB shape, and rewires every task mutation (`handleTaskSubmit`, `toggleTaskDone`, `handleDeleteConfirm`'s task branch, `completeTasks`) to call the new API routes instead of `setTasks`-only.

- [ ] **Step 1: Replace the top of the file (imports, types, static data, component signature) through the end of `handleTaskSubmit`**

Replace `app/events/[id]/planning/PlanningClient.tsx:1-191` with:

```typescript
"use client"
import { useState, useRef, useMemo, useCallback } from 'react'
import type { PlanningInitialData, TaskRow, ExpenseRow } from '@/lib/types/planning'

type StatusFilter = 'all' | 'todo' | 'done' | 'overdue'
type SortKey = 'due' | 'priority' | 'label'
type TabId = 'checklist' | 'budget'
type ViewMode = 'list' | 'timeline'
type Priority = 'low' | 'med' | 'high'

type Task = TaskRow
type Expense = ExpenseRow
interface DeleteTarget { type: 'task' | 'expense' | 'bulk'; id?: string; ids?: string[] }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']
const PRIO_ORDER: Record<Priority, number> = { high: 0, med: 1, low: 2 }

function getToday() { return new Date().toISOString().slice(0, 10) }
function daysInMonth(y: number, m: number) {
  if (m === 2) return y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28
  return [4,6,9,11].includes(m) ? 30 : 31
}
function parseISO(iso: string) { return { y: +iso.slice(0,4), m: +iso.slice(5,7), d: +iso.slice(8,10) } }
function pad(n: number) { return n < 10 ? '0' + n : String(n) }
function toISO(o: { y: number; m: number; d: number }) { return `${o.y}-${pad(o.m)}-${pad(o.d)}` }
function addDaysISO(iso: string, n: number) {
  const o = parseISO(iso); o.d += n
  while (o.d > daysInMonth(o.y, o.m)) { o.d -= daysInMonth(o.y, o.m); o.m++; if (o.m > 12) { o.m = 1; o.y++ } }
  while (o.d < 1) { o.m--; if (o.m < 1) { o.m = 12; o.y-- }; o.d += daysInMonth(o.y, o.m) }
  return toISO(o)
}
function fmtDate(iso: string | null) {
  if (!iso) return 'No date'; const p = parseISO(iso); return `${p.d} ${MONTHS[p.m - 1]}`
}
function relDay(iso: string | null, today: string) {
  if (!iso) return 'No date'
  if (iso === today) return 'Today'
  if (iso === addDaysISO(today, 1)) return 'Tomorrow'
  return fmtDate(iso)
}
function dayOfWeek(iso: string) {
  const { y, m, d } = parseISO(iso); let yr = y, mo = m
  const t = [0,3,2,5,0,3,5,1,4,6,2,4]; if (mo < 3) yr--
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][(yr + Math.floor(yr/4) - Math.floor(yr/100) + Math.floor(yr/400) + t[mo-1] + d) % 7]
}
function groupHeading(iso: string, today: string) {
  if (iso === today) return 'Today'
  if (iso === addDaysISO(today, 1)) return 'Tomorrow'
  return `${dayOfWeek(iso)} ${fmtDate(iso)}`
}
function fmtINR(n: number | null) {
  if (n == null || isNaN(n)) return '₹0'
  const neg = n < 0; const s = String(Math.abs(Math.round(n)))
  if (s.length <= 3) return (neg ? '-₹' : '₹') + s
  const last3 = s.slice(-3); let rest = s.slice(0, -3); const parts: string[] = []
  while (rest.length > 2) { parts.unshift(rest.slice(-2)); rest = rest.slice(0, -2) }
  if (rest) parts.unshift(rest)
  return (neg ? '-₹' : '₹') + parts.join(',') + ',' + last3
}
function parseAmount(raw: string) {
  const s = raw.replace(/[,₹\s]/g, '')
  return !s || isNaN(Number(s)) || Number(s) <= 0 ? null : Math.round(Number(s))
}

export function PlanningClient({ eventId, initialData }: { eventId: string; initialData: PlanningInitialData }) {
  const { eventName, taskPriorities, taskStatuses, expenseTypes: initialExpenseTypes, subEvents } = initialData
  const TODAY = useMemo(getToday, [])
  const todayParsed = useMemo(() => parseISO(TODAY), [TODAY])

  const priorityBySlug = useMemo(() => new Map(taskPriorities.map(p => [p.slug, p])), [taskPriorities])
  const priorityById = useMemo(() => new Map(taskPriorities.map(p => [p.id, p])), [taskPriorities])
  const statusById = useMemo(() => new Map(taskStatuses.map(s => [s.id, s])), [taskStatuses])
  const doneStatus = useMemo(() => taskStatuses.find(s => s.slug === 'completed'), [taskStatuses])
  const pendingStatus = useMemo(() => taskStatuses.find(s => s.slug === 'pending'), [taskStatuses])

  const [activeTab, setActiveTab] = useState<TabId>('checklist')
  const [taskView, setTaskView] = useState<ViewMode>('list')
  const [tasks, setTasks] = useState<Task[]>(initialData.tasks)
  const [expenses, setExpenses] = useState<Expense[]>(initialData.expenses)
  const [budget, setBudget] = useState<{ totalAmount: number; spent: number; remaining: number } | null>(initialData.budget)
  const [expenseTypes, setExpenseTypes] = useState(initialExpenseTypes)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('due')
  const [subEventFilter, setSubEventFilter] = useState<string | null>(null)

  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const [timelineMonth, setTimelineMonth] = useState(todayParsed)
  const [timelineDayFilter, setTimelineDayFilter] = useState<string>('all')

  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<DeleteTarget | null>(null)

  const [pickerOpen, setPickerOpen] = useState<'sort' | 'filter' | 'bulkDate' | 'bulkAssign' | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function flashToast(message: string) {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  const [taskForm, setTaskForm] = useState({ label: '', due: '', subEvent: '', priority: 'med' as Priority, notes: '' })
  const [taskLabelErr, setTaskLabelErr] = useState(false)
  const [taskSaving, setTaskSaving] = useState(false)
  const [budgetForm, setBudgetForm] = useState('')
  const [budgetErr, setBudgetErr] = useState(false)
  const [budgetSaving, setBudgetSaving] = useState(false)
  const [expForm, setExpForm] = useState({ amount: '', type: expenseTypes[0]?.id ?? '', vendor: '', subEvent: '', date: TODAY, notes: '' })
  const [expAmtErr, setExpAmtErr] = useState(false)
  const [expSaving, setExpSaving] = useState(false)

  function subEventLabel(subEventId: string | null) {
    if (subEventId == null) return 'Whole event'
    return subEvents.find(s => s.id === subEventId)?.label ?? 'Function'
  }
  function typeById(id: string) {
    return expenseTypes.find(t => t.id === id) ?? expenseTypes[expenseTypes.length - 1]
  }
  function prioritySlug(priorityId: string): Priority {
    return (priorityById.get(priorityId)?.slug ?? 'med') as Priority
  }

  const isOverdue = useCallback((t: Task) => {
    const status = statusById.get(t.statusId)
    return status?.category === 'open' && t.dueDate != null && t.dueDate < TODAY
  }, [TODAY, statusById])
  const taskStatus = useCallback((t: Task): 'done' | 'overdue' | 'todo' => {
    const status = statusById.get(t.statusId)
    if (status?.category === 'done') return 'done'
    if (isOverdue(t)) return 'overdue'
    return 'todo'
  }, [isOverdue, statusById])

  const { visibleTasks, statusCounts, derive } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const base = tasks.filter(t => {
      if (q && !t.title.toLowerCase().includes(q)) return false
      if (subEventFilter !== null) { return subEventFilter === '' ? t.subEventId == null : t.subEventId === subEventFilter }
      return true
    })
    const sc = { all: base.length, todo: 0, done: 0, overdue: 0 }
    base.forEach(t => { const s = taskStatus(t); if (s === 'done') sc.done++; else if (s === 'overdue') sc.overdue++; else sc.todo++ })

    const filtered = statusFilter === 'all' ? base : base.filter(t => taskStatus(t) === statusFilter)
    const sort = (arr: Task[]) => {
      if (sortKey === 'priority') return [...arr].sort((a, b) => { const pa = PRIO_ORDER[prioritySlug(a.priorityId)], pb = PRIO_ORDER[prioritySlug(b.priorityId)]; return pa !== pb ? pa - pb : a.title.localeCompare(b.title) })
      if (sortKey === 'label') return [...arr].sort((a, b) => a.title.localeCompare(b.title))
      return [...arr].sort((a, b) => {
        const bk = (t: Task) => taskStatus(t) === 'done' ? 5 : !t.dueDate ? 4 : t.dueDate < TODAY ? 0 : t.dueDate === TODAY ? 1 : 2
        const ba = bk(a), bb = bk(b); if (ba !== bb) return ba - bb
        if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1
        const pa = PRIO_ORDER[prioritySlug(a.priorityId)], pb = PRIO_ORDER[prioritySlug(b.priorityId)]
        return pa !== pb ? pa - pb : a.title.localeCompare(b.title)
      })
    }

    const doneCount = tasks.filter(t => taskStatus(t) === 'done').length
    const totalItems = tasks.length
    const donePct = totalItems === 0 ? 0 : Math.round((doneCount / totalItems) * 100)
    const spent = expenses.reduce((s, e) => s + e.amount, 0)
    const remaining = budget == null ? null : budget.totalAmount - spent
    const overBy = budget != null && spent > budget.totalAmount ? spent - budget.totalAmount : 0
    const typeTotals: Record<string, number> = {}
    expenses.forEach(e => { typeTotals[e.expenseTypeId] = (typeTotals[e.expenseTypeId] || 0) + e.amount })

    return { visibleTasks: sort(filtered), statusCounts: sc, derive: { doneCount, totalItems, donePct, spent, remaining, overBy, isOver: overBy > 0, typeTotals } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, expenses, budget, statusFilter, searchQuery, sortKey, subEventFilter, taskStatus, TODAY, priorityById])

  const selectedIds = Object.keys(selected)
  const allDone = derive.totalItems > 0 && derive.doneCount === derive.totalItems

  // Task actions
  function openTaskModal(id: string | null) {
    setEditingTaskId(id)
    if (id) { const t = tasks.find(x => x.id === id); if (t) setTaskForm({ label: t.title, due: t.dueDate || '', subEvent: t.subEventId || '', priority: prioritySlug(t.priorityId), notes: t.description || '' }) }
    else setTaskForm({ label: '', due: '', subEvent: '', priority: 'med', notes: '' })
    setTaskLabelErr(false); setTaskModalOpen(true)
  }
  async function handleTaskSubmit(e: React.FormEvent) {
    e.preventDefault(); const label = taskForm.label.trim()
    if (!label) { setTaskLabelErr(true); return }
    setTaskLabelErr(false); setTaskSaving(true)
    const priorityId = priorityBySlug.get(taskForm.priority)?.id
    const payload = {
      title: label,
      description: taskForm.notes || null,
      dueDate: taskForm.due || null,
      subEventId: taskForm.subEvent || null,
      priorityId,
    }
    try {
      if (editingTaskId) {
        const res = await fetch(`/api/events/${eventId}/planning/tasks/${editingTaskId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })
        const data: { task?: Task; error?: string } = await res.json()
        if (!res.ok || !data.task) { flashToast('Could not save changes.'); return }
        setTasks(p => p.map(t => t.id === editingTaskId ? data.task! : t))
      } else {
        const res = await fetch(`/api/events/${eventId}/planning/tasks`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })
        const data: { task?: Task; error?: string } = await res.json()
        if (!res.ok || !data.task) { flashToast('Could not add task.'); return }
        setTasks(p => [...p, data.task!])
      }
      setTaskModalOpen(false); setEditingTaskId(null)
    } catch {
      flashToast('Could not save changes.')
    } finally {
      setTaskSaving(false)
    }
  }
  async function toggleTaskDone(id: string, done: boolean) {
    const targetStatus = done ? doneStatus : pendingStatus
    if (!targetStatus) return
    setTasks(p => p.map(t => t.id === id ? { ...t, statusId: targetStatus.id } : t))
    try {
      const res = await fetch(`/api/events/${eventId}/planning/tasks/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ statusId: targetStatus.id }),
      })
      if (!res.ok) throw new Error('failed')
    } catch {
      flashToast('Could not update task status.')
    }
  }
  async function completeTasks(ids: string[]) {
    if (!doneStatus || ids.length === 0) return
    setTasks(p => p.map(t => ids.includes(t.id) ? { ...t, statusId: doneStatus.id } : t))
    try {
      const res = await fetch(`/api/events/${eventId}/planning/tasks/bulk`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'complete', taskIds: ids }),
      })
      if (!res.ok) throw new Error('failed')
      flashToast(ids.length === 1 ? 'Task completed' : `${ids.length} tasks completed`)
    } catch {
      flashToast('Could not complete tasks.')
    }
  }
```

- [ ] **Step 2: Replace the Selection/Budget/Expense/Delete section, keeping expense form logic pointed at real ids**

Replace the old `// Selection` through `// Delete` block (original `PlanningClient.tsx:195-243`) with:

```typescript
  // Selection
  function enterSelect() { setSelecting(true); setSelected({}) }
  function exitSelect() { setSelecting(false); setSelected({}) }
  function toggleSelect(id: string) { setSelected(p => { const n = { ...p }; if (n[id]) delete n[id]; else n[id] = true; return n }) }

  // Delete
  function openDeleteConfirm(type: 'task' | 'expense' | 'bulk', id?: string, ids?: string[]) {
    setPendingDelete(type === 'bulk' ? { type, ids: ids || [] } : { type, id }); setDeleteModalOpen(true)
  }
  async function handleDeleteConfirm() {
    if (!pendingDelete) return
    if (pendingDelete.type === 'task' && pendingDelete.id) {
      const taskId = pendingDelete.id
      setTasks(p => p.filter(t => t.id !== taskId))
      try {
        const res = await fetch(`/api/events/${eventId}/planning/tasks/${taskId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('failed')
      } catch { flashToast('Could not delete task.') }
    } else if (pendingDelete.type === 'bulk' && pendingDelete.ids) {
      const ids = pendingDelete.ids
      setTasks(p => p.filter(t => !ids.includes(t.id))); exitSelect()
      try {
        const res = await fetch(`/api/events/${eventId}/planning/tasks/bulk`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', taskIds: ids }),
        })
        if (!res.ok) throw new Error('failed')
      } catch { flashToast('Could not delete tasks.') }
    } else if (pendingDelete.type === 'expense' && pendingDelete.id) {
      const expenseId = pendingDelete.id
      setExpenses(p => p.filter(e => e.id !== expenseId))
      try {
        const res = await fetch(`/api/events/${eventId}/planning/expenses/${expenseId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('failed')
      } catch { flashToast('Could not delete expense.') }
    }
    setPendingDelete(null); setDeleteModalOpen(false)
  }

  function getDeleteText() {
    if (!pendingDelete) return { title: 'Delete?', text: 'This cannot be undone.' }
    if (pendingDelete.type === 'task') { const item = tasks.find(t => t.id === pendingDelete.id); return { title: 'Delete this task?', text: item ? `Remove "${item.title}" from your tasks?` : 'Remove this task?' } }
    if (pendingDelete.type === 'bulk') return { title: `Delete ${pendingDelete.ids?.length} tasks?`, text: 'This cannot be undone.' }
    const exp = expenses.find(e => e.id === pendingDelete.id)
    return { title: 'Delete this expense?', text: exp ? `Remove ${fmtINR(exp.amount)} logged under ${typeById(exp.expenseTypeId).name}?` : 'Remove this expense entry?' }
  }
```

- [ ] **Step 3: Rename fields in the Timeline helpers and `TaskRow` component**

The functions between `handleTaskSubmit` and `openDeleteConfirm` (`getTimelineTasks`, `renderDatebarChips`, `renderAgenda`) and the `TaskRow` component + its props interface at the bottom of the file still reference the old field names (`t.due`, `t.label`) and `id: number`. Replace `getTimelineTasks` and `renderAgenda` (originally `PlanningClient.tsx:245-254` and `273-289`) with:

```typescript
  function getTimelineTasks() {
    const q = searchQuery.trim().toLowerCase()
    let filtered = tasks.filter(t => {
      if (q && !t.title.toLowerCase().includes(q)) return false
      if (subEventFilter !== null) return subEventFilter === '' ? t.subEventId == null : t.subEventId === subEventFilter
      return statusFilter === 'all' || taskStatus(t) === statusFilter
    })
    if (timelineDayFilter !== 'all') filtered = filtered.filter(t => t.dueDate === timelineDayFilter)
    return filtered
  }

  function renderAgenda() {
    const filtered = getTimelineTasks()
    if (timelineDayFilter !== 'all' && filtered.length === 0) {
      return <div className="plan-empty"><p className="plan-empty-title">Nothing due on {fmtDate(timelineDayFilter)}.</p></div>
    }
    const groups: Record<string, Task[]> = {}; const order: string[] = []
    filtered.forEach(t => { const k = t.dueDate || '__none__'; if (!groups[k]) { groups[k] = []; order.push(k) } groups[k].push(t) })
    order.sort((a, b) => a === '__none__' ? 1 : b === '__none__' ? -1 : a < b ? -1 : 1)
    return order.map(k => (
      <section key={k} className="task-date-group">
        <h3 className="task-date-group-title">{k === '__none__' ? 'No date' : groupHeading(k, TODAY)}</h3>
        <ul className="plan-agenda-group-list" role="list">
          {groups[k].map(t => <TaskRow key={t.id} task={t} taskStatus={taskStatus} isOverdue={isOverdue} selecting={selecting} selected={selected} TODAY={TODAY} subEventLabel={subEventLabel} prioritySlug={prioritySlug} toggleTaskDone={toggleTaskDone} toggleSelect={toggleSelect} openTaskModal={openTaskModal} openDeleteConfirm={openDeleteConfirm} />)}
        </ul>
      </section>
    ))
  }
```

Then replace the `TaskRow` component + its props interface at the bottom of the file (originally `PlanningClient.tsx:755-833`) with:

```typescript
// ── TaskRow ──────────────────────────────────────────────────────────────────
interface TaskRowProps {
  task: Task
  taskStatus: (t: Task) => 'done' | 'overdue' | 'todo'
  isOverdue: (t: Task) => boolean
  selecting: boolean
  selected: Record<string, boolean>
  TODAY: string
  subEventLabel: (subEventId: string | null) => string
  prioritySlug: (priorityId: string) => Priority
  toggleTaskDone: (id: string, done: boolean) => void
  toggleSelect: (id: string) => void
  openTaskModal: (id: string | null) => void
  openDeleteConfirm: (type: 'task' | 'expense' | 'bulk', id?: string, ids?: string[]) => void
}

function TaskRow({ task, taskStatus, isOverdue, selecting, selected, TODAY, subEventLabel, prioritySlug, toggleTaskDone, toggleSelect, openTaskModal, openDeleteConfirm }: TaskRowProps) {
  const st = taskStatus(task)
  const stLabel = st === 'done' ? 'Done' : st === 'overdue' ? 'Overdue' : 'To-do'
  const stIcon = st === 'done' ? 'check_circle' : st === 'overdue' ? 'warning' : 'radio_button_unchecked'
  const priority = prioritySlug(task.priorityId)
  const isDone = st === 'done'

  function handleSurfaceClick(e: React.MouseEvent) {
    if (selecting) { toggleSelect(task.id); return }
    const target = e.target as Element
    if (target.closest('.task-row-check') || target.closest('.task-status-badge') || target.closest('.task-row-rail')) return
    openTaskModal(task.id)
  }

  return (
    <li className={`task-row${selecting && selected[task.id] ? ' is-selected' : ''}${isOverdue(task) ? ' is-overdue' : ''}`} data-id={task.id}>
      <div className="task-row-surface" onClick={handleSurfaceClick}>
        {!selecting && (
          <label className="task-row-check" htmlFor={`plan-task-chk-${task.id}`} onClick={e => e.stopPropagation()}>
            <input type="checkbox" id={`plan-task-chk-${task.id}`} checked={isDone} onChange={e => toggleTaskDone(task.id, e.target.checked)} />
          </label>
        )}
        <div className="task-row-body">
          <span className="task-row-title" style={isDone ? { textDecoration: 'line-through', color: 'var(--muted)' } : undefined}>{task.title}</span>
          <div className="task-row-meta">
            <span className="task-due-chip">
              <span className="material-symbols-outlined" aria-hidden="true">event</span>
              {relDay(task.dueDate, TODAY)}
            </span>
            <span className="task-sub-chip" aria-label={`Sub-event: ${subEventLabel(task.subEventId)}`}>
              <span className="material-symbols-outlined" aria-hidden="true">celebration</span>
              {subEventLabel(task.subEventId)}
            </span>
            {(priority === 'high' || priority === 'low') && (
              <span className={`task-prio task-prio--${priority}`} aria-label={`Priority: ${priority === 'high' ? 'High' : 'Low'}`}>
                <span className="task-prio-dot" aria-hidden="true" />
                <span className="task-prio-label">{priority === 'high' ? 'High' : 'Low'}</span>
              </span>
            )}
          </div>
        </div>
        {!selecting ? (
          <span className={`task-status-badge status-badge task-status-badge--${st}`} aria-label={`Status: ${stLabel}`}>
            <span className="material-symbols-outlined" aria-hidden="true">{stIcon}</span>
            {stLabel}
          </span>
        ) : (
          <button type="button" className="task-row-bulk" role="checkbox" aria-checked={!!selected[task.id]} aria-label={`Select ${task.title}`} onClick={e => { e.stopPropagation(); toggleSelect(task.id) }}>
            <span className="material-symbols-outlined" aria-hidden="true">{selected[task.id] ? 'check_box' : 'check_box_outline_blank'}</span>
          </button>
        )}
      </div>
      {!selecting && (
        <div className="task-row-rail" aria-hidden="true">
          <button type="button" className="tr-swipe tr-swipe-done" tabIndex={-1} onClick={e => { e.stopPropagation(); toggleTaskDone(task.id, true) }}>
            <span className="material-symbols-outlined">check_circle</span><span>Complete</span>
          </button>
          <button type="button" className="tr-swipe tr-swipe-edit" tabIndex={-1} onClick={e => { e.stopPropagation(); openTaskModal(task.id) }}>
            <span className="material-symbols-outlined">edit</span><span>Edit</span>
          </button>
          <button type="button" className="tr-swipe tr-swipe-delete" tabIndex={-1} onClick={e => { e.stopPropagation(); openDeleteConfirm('task', task.id) }}>
            <span className="material-symbols-outlined">delete</span><span>Delete</span>
          </button>
        </div>
      )}
    </li>
  )
}
```

Finally, update every other JSX call site that renders `<TaskRow .../>` (the list-view `visibleTasks.map(...)` call, originally `PlanningClient.tsx:427`) to pass the two new props: add `subEventLabel={subEventLabel} prioritySlug={prioritySlug}` alongside the existing props.

- [ ] **Step 4: Verify manually**

`npm run dev`, open a real event's `/planning` page, add a task, edit it, toggle it done, bulk-select two and complete them, delete one, switch to Timeline view and confirm tasks group by date correctly. Reload the page after each action and confirm the change persisted (this is the whole point of the wiring pass).

- [ ] **Step 5: Commit**

```bash
git add app/events/\[id\]/planning/PlanningClient.tsx
git commit -m "feat(planning): wire task CRUD, done-toggle, and delete to real API"
```

---

## Task 7: `PlanningClient.tsx` — budget/expense wiring, "+ Add type", receipt-upload stub

**Files:**
- Modify: `app/events/[id]/planning/PlanningClient.tsx` (budget handlers, expense handlers, render section for the expense modal)

**Interfaces:**
- Consumes: `PUT .../budget`, `POST/PATCH .../expenses[/expenseId]`, `POST .../expense-types` (Tasks 2-4); `expenseTypes` state from Task 6.
- Produces: `receiptFile`/`receiptPreviewUrl` state and `openAddType`/`confirmAddType` handlers, consumed only within this file (Task 8's bulk pickers are independent).

- [ ] **Step 1: Replace the Budget/Expense handler block**

Replace the original `// Budget` and `// Expense` function blocks with:

```typescript
  // Budget
  function openBudgetModal() { setBudgetForm(budget != null ? String(budget.totalAmount) : ''); setBudgetErr(false); setBudgetModalOpen(true) }
  async function handleBudgetSubmit(e: React.FormEvent) {
    e.preventDefault(); const amt = parseAmount(budgetForm)
    if (amt == null) { setBudgetErr(true); return }
    setBudgetErr(false); setBudgetSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/planning/budget`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ totalAmount: amt }),
      })
      const data: { budget?: { totalAmount: number; spent: number; remaining: number }; error?: string } = await res.json()
      if (!res.ok || !data.budget) { flashToast('Could not save budget.'); return }
      setBudget(data.budget); setBudgetModalOpen(false)
    } catch {
      flashToast('Could not save budget.')
    } finally {
      setBudgetSaving(false)
    }
  }

  // Expense
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null)
  const [addTypeOpen, setAddTypeOpen] = useState(false)
  const [addTypeName, setAddTypeName] = useState('')
  const [addTypeSaving, setAddTypeSaving] = useState(false)

  function openExpenseModal(id: string | null) {
    setEditingExpenseId(id)
    if (id) { const x = expenses.find(e => e.id === id); if (x) setExpForm({ amount: String(x.amount), type: x.expenseTypeId, vendor: x.vendorName || '', subEvent: x.subEventId || '', date: x.expenseDate || TODAY, notes: x.description || '' }) }
    else setExpForm({ amount: '', type: expenseTypes[0]?.id ?? '', vendor: '', subEvent: '', date: TODAY, notes: '' })
    setExpAmtErr(false); setReceiptFile(null); setReceiptPreviewUrl(null); setAddTypeOpen(false); setAddTypeName('')
    setExpenseModalOpen(true)
  }
  async function handleExpenseSubmit(e: React.FormEvent) {
    e.preventDefault(); const amt = parseAmount(expForm.amount)
    if (amt == null) { setExpAmtErr(true); return }
    setExpAmtErr(false); setExpSaving(true)
    // Receipt upload is a UI-only stub this pass (design spec §12) — the file is
    // never sent; receipt_key stays unset on the server.
    const payload = {
      amount: amt,
      expenseTypeId: expForm.type,
      vendorName: expForm.vendor || null,
      subEventId: expForm.subEvent || null,
      expenseDate: expForm.date || TODAY,
      description: expForm.notes || null,
    }
    try {
      if (editingExpenseId) {
        const res = await fetch(`/api/events/${eventId}/planning/expenses/${editingExpenseId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })
        const data: { expense?: Expense; error?: string } = await res.json()
        if (!res.ok || !data.expense) { flashToast('Could not save expense.'); return }
        setExpenses(p => p.map(x => x.id === editingExpenseId ? data.expense! : x))
      } else {
        const res = await fetch(`/api/events/${eventId}/planning/expenses`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })
        const data: { expense?: Expense; error?: string } = await res.json()
        if (!res.ok || !data.expense) { flashToast('Could not add expense.'); return }
        setExpenses(p => [...p, data.expense!])
      }
      setExpenseModalOpen(false); setEditingExpenseId(null)
    } catch {
      flashToast('Could not save expense.')
    } finally {
      setExpSaving(false)
    }
  }
  function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl)
    setReceiptFile(file)
    setReceiptPreviewUrl(file ? URL.createObjectURL(file) : null)
  }
  function removeReceipt() {
    if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl)
    setReceiptFile(null); setReceiptPreviewUrl(null)
  }
  async function confirmAddType() {
    const name = addTypeName.trim()
    if (!name) return
    setAddTypeSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/planning/expense-types`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
      })
      const data: { expenseType?: { id: string; name: string; iconName: string | null; isCustom: boolean }; error?: string } = await res.json()
      if (!res.ok || !data.expenseType) { flashToast(data.error ?? 'Could not add type.'); return }
      setExpenseTypes(p => [...p, data.expenseType!])
      setExpForm(f => ({ ...f, type: data.expenseType!.id }))
      setAddTypeOpen(false); setAddTypeName('')
    } catch {
      flashToast('Could not add type.')
    } finally {
      setAddTypeSaving(false)
    }
  }
```

- [ ] **Step 2: Add the "+ Add type" trigger and receipt-upload block to the expense modal JSX**

In the expense modal's `<form>` (originally `PlanningClient.tsx:650-707`), replace the expense-type `<select>` form-group with:

```tsx
              <div className="form-group">
                <label className="form-label" htmlFor="plan-exp-type">Expense type</label>
                <div className="form-select">
                  <select id="plan-exp-type" name="type" className="form-input" value={expForm.type} onChange={e => setExpForm(f => ({ ...f, type: e.target.value }))}>
                    {expenseTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <span className="form-select-chevron material-symbols-outlined" aria-hidden="true">expand_more</span>
                </div>
                <div className="expense-type-add">
                  {!addTypeOpen ? (
                    <button type="button" className="expense-type-add-trigger" onClick={() => setAddTypeOpen(true)}>+ Add type</button>
                  ) : (
                    <div className="expense-type-add-panel">
                      <label className="sr-only" htmlFor="plan-exp-type-input">New expense type</label>
                      <input id="plan-exp-type-input" type="text" className="form-input" placeholder="New expense type" autoComplete="off" value={addTypeName} onChange={e => setAddTypeName(e.target.value)} />
                      <div className="expense-type-add-actions">
                        <button type="button" className="btn-pill btn-pill-secondary" onClick={() => { setAddTypeOpen(false); setAddTypeName('') }}>Cancel</button>
                        <button type="button" className="btn-pill btn-pill-primary" disabled={!addTypeName.trim() || addTypeSaving} onClick={confirmAddType}>Add</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
```

And add the receipt-upload block right after the vendor-name form-group and before `plan-modal-divider`:

```tsx
              <div className="form-group">
                <span className="form-label">Receipt <span className="form-label-opt">(optional)</span></span>
                <div className="receipt-upload">
                  <label className="receipt-upload-trigger" htmlFor="plan-receipt-file">
                    <span className="material-symbols-outlined" aria-hidden="true">upload_file</span>
                    <span>Upload receipt or image</span>
                  </label>
                  <p className="receipt-upload-hint">Prototype — won&apos;t save yet</p>
                  <input type="file" id="plan-receipt-file" accept="image/*" className="sr-only" onChange={handleReceiptChange} />
                  {receiptPreviewUrl && (
                    <div className="receipt-upload-preview">
                      <img src={receiptPreviewUrl} alt="" />
                      <span className="receipt-upload-name">{receiptFile?.name}</span>
                      <button type="button" className="receipt-upload-remove" onClick={removeReceipt}>Remove</button>
                    </div>
                  )}
                </div>
              </div>
```

- [ ] **Step 3: Verify manually**

Set a budget for an event with none, confirm the "Set budget" empty state switches to the stats view and persists on reload. Add an expense with a brand-new custom type via "+ Add type", confirm it appears in the dropdown and in "Spending by type" after saving. Attach an image via the receipt uploader, confirm the preview shows and "Remove" clears it, then save the expense and confirm it saved fine (receipt not required).

- [ ] **Step 4: Commit**

```bash
git add app/events/\[id\]/planning/PlanningClient.tsx
git commit -m "feat(planning): wire budget + expense CRUD, add custom expense-type creator and receipt-upload stub"
```

---

## Task 8: Bulk "Set date" and "Assign" pickers

**Files:**
- Modify: `app/events/[id]/planning/PlanningClient.tsx` (bulk bar JSX, two new inline pickers reusing the existing `.gm-setter` pattern)

**Interfaces:**
- Consumes: `POST .../tasks/bulk` with `action: 'setDate'|'assign'` (Task 3); `pickerOpen` state (extended in Task 6 to include `'bulkDate' | 'bulkAssign'`).

- [ ] **Step 1: Add the two bulk handlers**, right after `completeTasks` (from Task 6):

```typescript
  async function bulkSetDate(dueDate: string | null) {
    const ids = selectedIds
    if (ids.length === 0) return
    setTasks(p => p.map(t => ids.includes(t.id) ? { ...t, dueDate } : t))
    try {
      const res = await fetch(`/api/events/${eventId}/planning/tasks/bulk`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'setDate', taskIds: ids, dueDate }),
      })
      if (!res.ok) throw new Error('failed')
      flashToast(ids.length === 1 ? 'Due date updated' : `${ids.length} due dates updated`)
    } catch {
      flashToast('Could not update due date.')
    }
    exitSelect(); setPickerOpen(null)
  }
  async function bulkAssign(subEventId: string | null) {
    const ids = selectedIds
    if (ids.length === 0) return
    setTasks(p => p.map(t => ids.includes(t.id) ? { ...t, subEventId } : t))
    try {
      const res = await fetch(`/api/events/${eventId}/planning/tasks/bulk`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'assign', taskIds: ids, subEventId }),
      })
      if (!res.ok) throw new Error('failed')
      flashToast(ids.length === 1 ? 'Sub-event updated' : `${ids.length} tasks reassigned`)
    } catch {
      flashToast('Could not reassign tasks.')
    }
    exitSelect(); setPickerOpen(null)
  }
```

- [ ] **Step 2: Replace the bulk bar JSX** (originally `PlanningClient.tsx:722-742`) with a version that adds the two buttons + pickers:

```tsx
      {selecting && (
        <div className="bulk-bar" id="plan-bulkbar" role="toolbar" aria-label="Bulk task actions">
          <span className="bulk-bar-count"><span id="plan-sel-count">{selectedIds.length}</span> selected</span>
          <button type="button" className="bulk-bar-selectall" onClick={() => {
            const vis = visibleTasks.length
            if (selectedIds.length >= vis && vis > 0) { setSelected({}) }
            else { const n: Record<string, boolean> = {}; visibleTasks.forEach(t => { n[t.id] = true }); setSelected(n) }
          }}>{selectedIds.length >= visibleTasks.length && visibleTasks.length > 0 ? 'Clear' : 'Select all'}</button>
          <span className="bulk-bar-div" aria-hidden="true" />
          <button type="button" className="bulk-bar-act" disabled={selectedIds.length === 0} onClick={() => { completeTasks(selectedIds); exitSelect() }}>
            <span className="material-symbols-outlined" aria-hidden="true">check_circle</span><span className="bulk-bar-act-label">Complete</span>
          </button>
          <div style={{ position: 'relative' }}>
            <button type="button" className="bulk-bar-act" disabled={selectedIds.length === 0} aria-haspopup="true" aria-expanded={pickerOpen === 'bulkDate'} onClick={() => setPickerOpen(p => p === 'bulkDate' ? null : 'bulkDate')}>
              <span className="material-symbols-outlined" aria-hidden="true">event</span><span className="bulk-bar-act-label">Set date</span>
            </button>
            {pickerOpen === 'bulkDate' && (
              <>
                <div className="gm-setter-scrim" onClick={() => setPickerOpen(null)} />
                <div className="gm-setter" role="dialog" aria-modal="true" aria-label="Set due date for selected tasks">
                  <p className="gm-setter-title">Set due date</p>
                  <div className="gm-setter-opts" role="menu">
                    {[
                      { value: TODAY, label: 'Today', icon: 'today' },
                      { value: addDaysISO(TODAY, 1), label: 'Tomorrow', icon: 'event' },
                      { value: addDaysISO(TODAY, 7), label: 'In one week', icon: 'date_range' },
                      { value: '', label: 'No date', icon: 'event_busy' },
                    ].map(o => (
                      <button key={o.label} type="button" className="gm-setter-opt" role="menuitem" onClick={() => bulkSetDate(o.value || null)}>
                        <span className="material-symbols-outlined" aria-hidden="true">{o.icon}</span>{o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button type="button" className="bulk-bar-act" disabled={selectedIds.length === 0} aria-haspopup="true" aria-expanded={pickerOpen === 'bulkAssign'} onClick={() => setPickerOpen(p => p === 'bulkAssign' ? null : 'bulkAssign')}>
              <span className="material-symbols-outlined" aria-hidden="true">celebration</span><span className="bulk-bar-act-label">Assign</span>
            </button>
            {pickerOpen === 'bulkAssign' && (
              <>
                <div className="gm-setter-scrim" onClick={() => setPickerOpen(null)} />
                <div className="gm-setter" role="dialog" aria-modal="true" aria-label="Assign sub-event for selected tasks">
                  <p className="gm-setter-title">Assign sub-event</p>
                  <div className="gm-setter-opts" role="menu">
                    <button type="button" className="gm-setter-opt" role="menuitem" onClick={() => bulkAssign(null)}>
                      <span className="material-symbols-outlined" aria-hidden="true">celebration</span>Whole event
                    </button>
                    {subEvents.map(s => (
                      <button key={s.id} type="button" className="gm-setter-opt" role="menuitem" onClick={() => bulkAssign(s.id)}>
                        <span className="material-symbols-outlined" aria-hidden="true">event</span>{s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <button type="button" className="bulk-bar-act" disabled={selectedIds.length === 0} onClick={() => openDeleteConfirm('bulk', undefined, selectedIds)}>
            <span className="material-symbols-outlined" aria-hidden="true">delete</span><span className="bulk-bar-act-label">Delete</span>
          </button>
          <button type="button" className="bulk-bar-cancel" aria-label="Cancel selection" onClick={exitSelect}>
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>
      )}
```

- [ ] **Step 3: Add the toast render** near the top of the returned JSX (right after the opening `<>`):

```tsx
      {toast && <div className="bc-toast is-show" role="status" aria-live="polite"><span className="bc-live" aria-hidden="true" /><span>{toast}</span></div>}
```

- [ ] **Step 4: Verify manually**

Select 2+ tasks, use "Set date" → "Tomorrow", confirm both tasks' due dates update and persist on reload. Use "Assign" → pick a real sub-event, confirm both tasks show that sub-event's label and persist on reload.

- [ ] **Step 5: Commit**

```bash
git add app/events/\[id\]/planning/PlanningClient.tsx
git commit -m "feat(planning): bulk Set-date and Assign pickers, ported from the design prototype"
```

---

## Task 9: Full functional + breakpoint testing pass

**Files:** none (verification only)

- [ ] **Step 1: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: no errors under `app/events/[id]/planning/`, `app/api/events/[id]/planning/`, `lib/types/planning.ts`, `lib/validations/planning.ts`.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no new errors in the files touched by this plan.

- [ ] **Step 3: Live browser pass at all 6 breakpoints**

360px, 390px, 414px, 768px, 1024px, 1440px. At each: add/edit/delete a task, toggle done, set a budget, add/edit/delete an expense (incl. one with a custom "+ Add type" type and one with a receipt preview), select 2+ tasks and run Complete/Set date/Assign/Delete from the bulk bar. Reload after each mutation and confirm it persisted. This is the step that caught real defects on Guest Mgmt and User Settings that a clean type-check missed — do not skip it.

- [ ] **Step 4: Whole-file review**

Re-read the final `PlanningClient.tsx` end to end for leftover references to the old `number`-id `Task`/`Expense` shape or the old hardcoded `EXPENSE_TYPES`/`EVENT_SUBEVENTS` arrays (both should be fully removed by Task 6/7 — this step just confirms nothing was missed).

- [ ] **Step 5: Update tracking docs**

Update the Planning Tools row in `CLAUDE.md`'s MVP Phase 1 backlog table to **DONE**, and update `docs/NEXT-SESSION.md`'s "Remaining work" table (currently rows Planning/Invitations/Media) to drop the Planning row.

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md docs/NEXT-SESSION.md
git commit -m "docs: mark Planning Tools DONE after backend-wiring pass"
```
