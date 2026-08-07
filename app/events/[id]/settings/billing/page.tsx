import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageFooter } from '@/components/layout/PageFooter'

interface PlanRow {
  id: string
  slug: string
  name: string
  sort_order: number
  price_inr: number
  custom_domain: boolean
  priority_support: boolean
  ai_features: boolean
}

function planPerks(plan: PlanRow): string[] {
  const perks: string[] = []
  // Only claim features that exist as real columns / flags — numeric caps are not enforced yet.
  if (plan.slug === 'free') {
    perks.push('Public event website', 'Guest list & RSVP tools', 'Photo gallery', 'Planning checklist')
  }
  if (plan.slug === 'premium') {
    if (plan.custom_domain) perks.push('Custom domain support')
    if (plan.priority_support) perks.push('Priority support')
    perks.push('Everything in Free')
  }
  if (plan.slug === 'elite') {
    if (plan.ai_features) perks.push('AI photo curation')
    if (plan.priority_support) perks.push('Concierge-level support')
    perks.push('Everything in Premium')
  }
  return perks
}

function formatPrice(inr: number): string {
  if (inr === 0) return '₹0'
  return `₹${inr.toLocaleString('en-IN')}`
}

export default async function BillingSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: ev } = await supabase
    .from('events')
    .select('id, plan_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (!ev) redirect('/home')

  // Plans live in the config schema — use .schema('config')
  const { data: plansRaw } = await supabase
    .schema('config')
    .from('plans')
    .select('id, slug, name, sort_order, price_inr, custom_domain, priority_support, ai_features')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const plans = (plansRaw ?? []) as PlanRow[]
  const currentPlan = plans.find(p => p.id === ev.plan_id) ?? plans.find(p => p.slug === 'free') ?? plans[0]

  return (
    <main className="page-band reveal pt-6 md:pt-8 pb-24">
      <div className="es-content">
        <header className="es-content-head">
          <div>
            <h1 className="es-content-title">Plan &amp; billing</h1>
            <p className="es-content-lead">Manage your event&apos;s subscription and unlock advanced planning + media features.</p>
          </div>
        </header>

        {/* Current plan */}
        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">verified</span>
              Current plan
            </h2>
            <span className="es-section-tag">Active</span>
          </header>
          {currentPlan && (
            <div className="es-plan-header">
              <div className="es-plan-header-body">
                <p className="es-plan-name">{currentPlan.name} plan</p>
                <p className="es-section-sub">
                  {planPerks(currentPlan).slice(0, 2).join(' · ')}
                </p>
              </div>
              <p className="es-plan-header-price">
                {formatPrice(currentPlan.price_inr)}<span className="es-plan-header-unit">/event</span>
              </p>
            </div>
          )}
        </section>

        {/* Available plans */}
        <section className="es-section es-section--bare">
          <header className="es-section-head es-section-head--flush">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">workspace_premium</span>
              Available programs
            </h2>
            <p className="es-section-sub">All prices are per-event. No recurring charges.</p>
          </header>
          <div className="es-plans-grid">
            {plans.filter((plan) => plan.slug !== 'free').map((plan) => {
              const isCurrent = plan.id === ev.plan_id
              const isFeatured = plan.slug === 'elite'
              return (
                <article
                  key={plan.id}
                  className={`es-plan-card${isCurrent ? ' is-current' : ''}${isFeatured ? ' is-featured' : ''}`}
                >
                  {isCurrent && <span className="es-plan-tag es-plan-tag--ink">Current</span>}
                  {!isCurrent && isFeatured && <span className="es-plan-tag">Most popular</span>}
                  <h3 className="es-plan-name">{plan.name}</h3>
                  <p className="es-plan-price">
                    {formatPrice(plan.price_inr)}<span className="es-plan-price-unit">/event</span>
                  </p>
                  <p className="es-plan-desc">
                    {plan.slug === 'free'    && 'Perfect for small private events.'}
                    {plan.slug === 'premium' && 'For an unforgettable celebration.'}
                    {plan.slug === 'elite'   && 'The full Evenzi experience.'}
                  </p>
                  <ul className="es-plan-perks">
                    {planPerks(plan).map(perk => (
                      <li key={perk}>
                        <span aria-hidden="true" className="material-symbols-outlined icon-fill">check_circle</span>
                        {perk}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <button type="button" className="btn-pill btn-pill-secondary" disabled aria-disabled="true">Current plan</button>
                  ) : (
                    <button type="button" className="btn-pill btn-pill-secondary" disabled aria-disabled="true" title="Billing checkout is not available yet">
                      Coming soon
                    </button>
                  )}
                </article>
              )
            })}
          </div>
        </section>

        <div className="es-help-card">
          <div className="es-help-body">
            <span className="es-help-title">Questions about your plan?</span>
            <span className="es-help-desc">Our support team can help you compare features and find the right plan for your celebration.</span>
          </div>
          <a href="mailto:evenzi.official@gmail.com" className="btn-pill btn-pill-secondary">
            <span aria-hidden="true" className="material-symbols-outlined">support_agent</span>
            Contact support
          </a>
        </div>

      </div>
      <PageFooter />
    </main>
  )
}
