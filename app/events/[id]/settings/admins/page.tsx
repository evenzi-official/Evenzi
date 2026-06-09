import { PageFooter } from '@/components/layout/PageFooter'

export default function AdminsSettingsPage() {
  return (
    <main className="page-band reveal pt-6 md:pt-8 pb-24">
      <div className="es-content">
        <header className="es-content-head">
          <div>
            <h1 className="es-content-title">Admins</h1>
            <p className="es-content-lead">Manage who can access and edit this event.</p>
          </div>
          <div className="es-content-actions">
            <button type="button" className="btn-pill btn-pill-primary">
              <span aria-hidden="true" className="material-symbols-outlined">person_add</span>
              Invite admin
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
          </div>
        </header>

        {/* Owner row */}
        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">groups</span>
              Team members
            </h2>
            <p className="es-section-sub">People who can manage this event alongside you.</p>
          </header>

          <div className="scrollable-list">
            <div className="admin-row">
              <span className="admin-avatar" aria-hidden="true">A</span>
              <div className="admin-meta">
                <p className="font-display font-semibold text-sm text-ink">You (Owner)</p>
                <p className="text-xs text-muted">—</p>
              </div>
              <span className="status-badge status-badge--live">Owner</span>
            </div>
          </div>
        </section>

        {/* Invite section */}
        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">mail</span>
              Pending invites
            </h2>
          </header>
          <div className="empty-cta-card">
            <span className="empty-cta-icon" aria-hidden="true"><span className="material-symbols-outlined">person_add</span></span>
            <p className="empty-cta-title">No pending invites</p>
            <p className="empty-cta-sub">Invite collaborators to help manage your event.</p>
          </div>
        </section>
      </div>
      <PageFooter />
    </main>
  )
}
