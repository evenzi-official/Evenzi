import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'

export default async function InvitationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('events').select('id, name').eq('id', id).single()
  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

  return (
    <div data-page="invitations">
      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: eventName.toUpperCase(), href: `/events/${id}` },
          { label: 'INVITATIONS' },
        ]}
        backHref={`/events/${id}`}
      />

      <main className="page-band pt-6 md:pt-8 pb-24">
        <header className="section-head reveal">
          <p className="section-head-eyebrow">Section</p>
          <div className="section-head-titlerow">
            <h1 className="section-head-title">Digital Invitations</h1>
          </div>
          <p className="section-head-sub">Send personalised invites via WhatsApp, email or SMS — track delivery in real time.</p>
        </header>

        {/* Stats */}
        <section className="gm-stats reveal" aria-label="Invitation summary">
          <div className="clay-card gm-rate" role="group" aria-labelledby="inv-rate-label">
            <span className="stat-icon"><span className="material-symbols-outlined icon-fill">mark_email_read</span></span>
            <div className="min-w-0 w-full">
              <p id="inv-rate-label" className="gm-rate-cap">Delivery rate</p>
              <p className="gm-rate-num">0%</p>
              <div className="pf-bar gm-rate-bar" />
              <p className="gm-rate-sub">0 sent · 0 delivered</p>
            </div>
          </div>
          <div className="gm-counts" role="group" aria-label="Invitation counts">
            {['Sent', 'Delivered', 'Opened', 'Pending', 'Failed'].map((lbl) => (
              <button key={lbl} type="button" className="clay-card gm-count">
                <span className="gm-count-num">0</span>
                <span className="gm-count-lbl">{lbl}</span>
              </button>
            ))}
          </div>
        </section>

        {/* List card */}
        <section className="clay-card gm-list-card reveal" aria-label="Invitations list">
          <div className="gm-toolbar">
            <div className="form-input-search gm-search">
              <span className="material-symbols-outlined" aria-hidden="true">search</span>
              <input className="form-input" type="search" placeholder="Search guests…" aria-label="Search" />
            </div>
            <div className="gm-toolbar-actions">
              <button type="button" className="btn-pill btn-pill-primary">
                <span className="material-symbols-outlined" aria-hidden="true">send</span>
                Send invites
                <span aria-hidden="true" className="btn-pill-spinner" />
              </button>
              <button type="button" className="btn-pill btn-pill-secondary gm-icon-btn">
                <span className="material-symbols-outlined" aria-hidden="true">filter_list</span>
                <span className="gm-btn-label">Filter</span>
              </button>
            </div>
          </div>

          <div className="dp-filter-chips" role="radiogroup" aria-label="Filter by status">
            {['All', 'Unsent', 'Sent', 'Delivered', 'Opened'].map((f, i) => (
              <button key={f} type="button" className={`dp-filter-chip${i === 0 ? ' is-active' : ''}`} role="radio" aria-checked={i === 0}>
                {f} 0
              </button>
            ))}
          </div>

          <div className="empty-cta-card">
            <span className="empty-cta-icon" aria-hidden="true"><span className="material-symbols-outlined">forward_to_inbox</span></span>
            <p className="empty-cta-title">No invitations sent yet</p>
            <p className="empty-cta-sub">Add guests first, then send invitations via WhatsApp, email or SMS.</p>
            <button type="button" className="btn-pill btn-pill-primary">
              <span className="material-symbols-outlined" aria-hidden="true">send</span>
              Send your first invite
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
          </div>
        </section>
      </main>

      <PageFooter />
    </div>
  )
}
