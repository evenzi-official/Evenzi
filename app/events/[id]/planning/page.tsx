import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'

export default async function PlanningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('events').select('id, name').eq('id', id).single()
  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

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

      <main className="page-band pt-6 md:pt-8 pb-24">
        <header className="section-head reveal">
          <p className="section-head-eyebrow">Section</p>
          <div className="section-head-titlerow">
            <h1 className="section-head-title">Planning</h1>
          </div>
          <p className="section-head-sub">Checklist and budget tracker for your event.</p>
        </header>

        {/* Tab toggle: Checklist / Budget */}
        <div className="seg-wrap seg-wrap--page reveal">
          <nav className="seg" aria-label="Planning sections">
            <button type="button" className="seg-item seg--page is-active">
              <span className="material-symbols-outlined" aria-hidden="true">checklist_rtl</span>
              <span>Checklist</span>
            </button>
            <button type="button" className="seg-item seg--page">
              <span className="material-symbols-outlined" aria-hidden="true">payments</span>
              <span>Budget</span>
            </button>
          </nav>
        </div>

        {/* Checklist card */}
        <section className="clay-card p-7 md:p-8 reveal" aria-label="Planning checklist">
          <div className="flex items-center justify-between mb-6 gap-4">
            <div>
              <p className="text-xs font-display font-bold tracking-[0.35em] text-brand mb-2">TO-DO</p>
              <h2 className="font-display font-bold text-2xl text-ink">Your checklist</h2>
            </div>
            <button type="button" className="btn-pill btn-pill-primary">
              <span aria-hidden="true" className="material-symbols-outlined">add</span>
              Add task
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
          </div>

          <div className="empty-cta-card">
            <span className="empty-cta-icon" aria-hidden="true"><span className="material-symbols-outlined">checklist_rtl</span></span>
            <p className="empty-cta-title">No tasks yet</p>
            <p className="empty-cta-sub">Build your planning checklist — add tasks, deadlines, and vendor notes.</p>
            <button type="button" className="btn-pill btn-pill-primary">
              <span className="material-symbols-outlined" aria-hidden="true">add_task</span>
              Add your first task
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
          </div>
        </section>

        {/* Budget card */}
        <section className="clay-card p-7 md:p-8 reveal mt-6" aria-label="Budget tracker">
          <div className="flex items-center justify-between mb-6 gap-4">
            <div>
              <p className="text-xs font-display font-bold tracking-[0.35em] text-brand mb-2">FINANCES</p>
              <h2 className="font-display font-bold text-2xl text-ink">Budget tracker</h2>
            </div>
            <button type="button" className="btn-pill btn-pill-secondary">
              <span aria-hidden="true" className="material-symbols-outlined">add</span>
              Add expense
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[{ label: 'Total budget', val: '—' }, { label: 'Spent', val: '—' }, { label: 'Remaining', val: '—' }].map((s) => (
              <div key={s.label} className="clay-card p-5">
                <p className="text-[10px] font-display font-bold tracking-[0.25em] text-muted uppercase">{s.label}</p>
                <p className="font-display font-bold text-2xl text-ink mt-1">{s.val}</p>
              </div>
            ))}
          </div>

          <div className="empty-cta-card">
            <span className="empty-cta-icon" aria-hidden="true"><span className="material-symbols-outlined">payments</span></span>
            <p className="empty-cta-title">No expenses yet</p>
            <p className="empty-cta-sub">Track vendor payments, deposits, and other costs.</p>
          </div>
        </section>
      </main>

      <PageFooter />
    </div>
  )
}
