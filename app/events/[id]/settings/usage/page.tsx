import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageFooter } from '@/components/layout/PageFooter'
import { getEventAccess } from '@/lib/auth/eventAccess'
import { UsageContent } from './UsageContent'

const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024 // matches MediaClient.tsx — reused, not reimplemented

export default async function UsageSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: ev } = await supabase
    .from('events')
    .select('id, plan_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (!ev) redirect('/home')

  const access = await getEventAccess(supabase, id, user.id)
  const canReadGuests = access.canRead('guests')
  const canReadPlanning = access.canRead('planning')
  const canReadMedia = access.canRead('media')

  const [{ data: media }, { data: hub }, { data: plansRaw }] = await Promise.all([
    supabase.from('event_media').select('byte_size').eq('event_id', id),
    supabase.from('event_hub_summary').select('guest_total, task_percent, budget_percent').eq('event_id', id).single(),
    supabase.schema('config').from('plans').select('id, slug, name, price_inr').eq('is_active', true).order('sort_order', { ascending: true }),
  ])

  const storageUsedBytes = (media ?? []).reduce((sum, m) => sum + (m.byte_size ?? 0), 0)
  const plans = plansRaw ?? []
  const currentPlan = plans.find(p => p.id === ev.plan_id) ?? plans.find(p => p.slug === 'free') ?? plans[0]

  return (
    <main className="page-band reveal pt-6 md:pt-8 pb-24">
      <UsageContent
        storageUsedBytes={storageUsedBytes}
        storageLimitBytes={STORAGE_LIMIT_BYTES}
        canReadMedia={canReadMedia}
        guestTotal={hub?.guest_total ?? 0}
        canReadGuests={canReadGuests}
        taskPercent={hub?.task_percent ?? null}
        budgetPercent={hub?.budget_percent ?? null}
        canReadPlanning={canReadPlanning}
        planName={currentPlan?.name ?? 'Free'}
      />
      <PageFooter />
    </main>
  )
}
