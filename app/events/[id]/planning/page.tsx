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
