import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'

export default async function GuestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('events').select('id, name').eq('id', id).single()
  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

  return (
    <div data-page="guests">
      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: eventName.toUpperCase(), href: `/events/${id}` },
          { label: 'GUESTS' },
        ]}
        backHref={`/events/${id}`}
      />

      <main className="page-band pt-6 md:pt-8 pb-24">
        {/* Section head */}
        <header className="section-head reveal">
          <p className="section-head-eyebrow">Section</p>
          <div className="section-head-titlerow">
            <h1 className="section-head-title">Guest Management</h1>
          </div>
        </header>

        {/* Stats bar */}
        <section className="gm-stats reveal" aria-label="Guest list summary">
          <div className="clay-card gm-rate" role="group" aria-labelledby="gm-rate-label">
            <span className="stat-icon"><span className="material-symbols-outlined icon-fill">how_to_reg</span></span>
            <div className="min-w-0 w-full">
              <p id="gm-rate-label" className="gm-rate-cap">RSVP response rate</p>
              <p className="gm-rate-num">0%</p>
              <div className="pf-bar gm-rate-bar" />
              <p className="gm-rate-sub">0 of 0 responded</p>
            </div>
          </div>
          <div className="gm-counts" role="group" aria-label="Guest counts by status">
            {(['Total', 'Confirmed', 'Declined', 'Pending', 'Maybe'] as const).map((lbl) => (
              <button key={lbl} type="button" className="clay-card gm-count">
                <span className="gm-count-num">0</span>
                <span className="gm-count-lbl">{lbl}</span>
              </button>
            ))}
          </div>
        </section>

        {/* List card */}
        <section className="clay-card gm-list-card reveal" aria-label="Guest list">
          {/* Toolbar */}
          <div className="gm-toolbar">
            <div className="form-input-search gm-search">
              <span className="material-symbols-outlined" aria-hidden="true">search</span>
              <input className="form-input" type="search" placeholder="Search by name, phone, email…" aria-label="Search guests" />
              <button className="form-input-search-clear" type="button" aria-label="Clear search">
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
            <div className="gm-toolbar-actions">
              <button type="button" className="btn-pill btn-pill-secondary gm-icon-btn">
                <span className="material-symbols-outlined" aria-hidden="true">send</span>
                <span className="gm-btn-label">Send invites</span>
                <span aria-hidden="true" className="btn-pill-spinner" />
              </button>
              <button type="button" className="btn-pill btn-pill-secondary gm-icon-btn">
                <span className="material-symbols-outlined" aria-hidden="true">upload_file</span>
                <span className="gm-btn-label">Import</span>
              </button>
              <button type="button" className="btn-pill btn-pill-secondary gm-icon-btn">
                <span className="material-symbols-outlined" aria-hidden="true">filter_list</span>
                <span className="gm-btn-label">Filter</span>
              </button>
              <button type="button" className="btn-pill btn-pill-secondary gm-icon-btn">
                <span className="material-symbols-outlined" aria-hidden="true">swap_vert</span>
                <span className="gm-btn-label">Name A–Z</span>
              </button>
              <button type="button" className="btn-pill btn-pill-secondary gm-icon-btn">
                <span className="material-symbols-outlined" aria-hidden="true">checklist</span>
                <span className="gm-btn-label">Select</span>
              </button>
            </div>
          </div>

          {/* Filter chips */}
          <div className="dp-filter-chips gm-filters" role="radiogroup" aria-label="Filter by RSVP status">
            {['All', 'Confirmed', 'Declined', 'Pending', 'Maybe'].map((f, i) => (
              <button key={f} type="button" className={`dp-filter-chip${i === 0 ? ' is-active' : ''}`} role="radio" aria-checked={i === 0}>
                {f} 0
              </button>
            ))}
          </div>

          {/* Empty state */}
          <div className="empty-cta-card gm-empty">
            <span className="empty-cta-icon" aria-hidden="true"><span className="material-symbols-outlined">group_add</span></span>
            <p className="empty-cta-title">No guests yet</p>
            <p className="empty-cta-sub">Add your first guest, or import a spreadsheet to bring your whole list in at once.</p>
            <div className="gm-empty-actions">
              <button type="button" className="btn-pill btn-pill-primary">
                <span className="material-symbols-outlined" aria-hidden="true">person_add</span>
                Add your first guest
                <span aria-hidden="true" className="btn-pill-spinner" />
              </button>
              <button type="button" className="btn-pill btn-pill-secondary">
                <span className="material-symbols-outlined" aria-hidden="true">upload_file</span>
                Import CSV
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FAB */}
      <button type="button" className="fab" aria-label="Add guest">
        <span aria-hidden="true" className="material-symbols-outlined">person_add</span>
      </button>

      <PageFooter />
    </div>
  )
}
