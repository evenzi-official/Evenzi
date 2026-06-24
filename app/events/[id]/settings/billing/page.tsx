import { PageFooter } from '@/components/layout/PageFooter'

const PLANS = [
  { id: 'free',    name: 'Free',    price: '₹0',     desc: 'Perfect to get started.',                 features: ['1 event', '50 guests', 'Basic website'] },
  { id: 'starter', name: 'Starter', price: '₹999',   desc: 'For intimate celebrations.',               features: ['1 event', '200 guests', 'Custom domain', 'WhatsApp invites'] },
  { id: 'pro',     name: 'Pro',     price: '₹2,999', desc: 'For large, multi-ceremony weddings.',       features: ['3 events', 'Unlimited guests', 'Custom domain', 'Priority support', 'Analytics'] },
] as const

export default function BillingSettingsPage() {
  return (
    <main className="page-band reveal pt-6 md:pt-8 pb-24">
      <div className="es-content">
        <header className="es-content-head">
          <div>
            <h1 className="es-content-title">Plan &amp; billing</h1>
            <p className="es-content-lead">Manage your subscription and payment details.</p>
          </div>
        </header>

        {/* Current plan */}
        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">workspace_premium</span>
              Current plan
            </h2>
          </header>
          <div className="clay-card p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-display font-bold tracking-[0.25em] text-muted uppercase">Active plan</p>
              <p className="font-display font-bold text-2xl text-ink mt-1">Free</p>
              <p className="text-sm text-muted mt-1">₹0 / month · renews never</p>
            </div>
            <span className="status-badge status-badge--live">Active</span>
          </div>
        </section>

        {/* Plan comparison */}
        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">upgrade</span>
              Upgrade your plan
            </h2>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <div key={plan.id} className={`clay-card p-6${plan.id === 'pro' ? ' ring-2 ring-brand' : ''}`}>
                <p className="font-display font-bold text-xs tracking-[0.3em] text-muted uppercase mb-2">{plan.name}</p>
                <p className="font-display font-bold text-3xl text-ink">{plan.price}<span className="text-sm text-muted font-normal"> /event</span></p>
                <p className="text-xs text-muted mt-2 mb-4">{plan.desc}</p>
                <ul className="space-y-1.5 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="text-xs text-ink-soft flex items-center gap-2">
                      <span aria-hidden="true" className="material-symbols-outlined icon-sm-18 text-brand icon-fill">check_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button type="button" className={`btn-pill w-full justify-center ${plan.id === 'free' ? 'btn-pill-secondary' : 'btn-pill-primary'}`} disabled={plan.id === 'free'}>
                  {plan.id === 'free' ? 'Current plan' : `Upgrade to ${plan.name}`}
                  <span aria-hidden="true" className="btn-pill-spinner" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
      <PageFooter />
    </main>
  )
}
