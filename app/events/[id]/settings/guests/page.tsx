import { PageFooter } from '@/components/layout/PageFooter'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'

export default function GuestListSettingsPage() {
  return (
    <main className="page-band reveal pt-6 md:pt-8 pb-24">
      <div className="es-content">
        <header className="es-content-head">
          <div>
            <h1 className="es-content-title">Guest list</h1>
            <p className="es-content-lead">Configure RSVP options, dietary questions, and guest-list behaviour.</p>
          </div>
          <div className="es-content-actions">
            <button type="button" className="btn-pill btn-pill-primary">
              <span aria-hidden="true" className="material-symbols-outlined">save</span>
              Save changes
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
          </div>
        </header>

        {/* RSVP settings */}
        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">how_to_reg</span>
              RSVP settings
            </h2>
          </header>
          <div className="es-toggle-list">
            <div className="es-toggle-row">
              <div>
                <p className="font-display font-semibold text-sm text-ink">Allow +1 responses</p>
                <p className="text-xs text-muted">Let guests indicate if they are bringing a plus one.</p>
              </div>
              <ToggleSwitch id="allow-plus-one" defaultChecked />
            </div>
            <div className="es-toggle-row">
              <div>
                <p className="font-display font-semibold text-sm text-ink">Collect dietary preferences</p>
                <p className="text-xs text-muted">Ask guests about dietary restrictions during RSVP.</p>
              </div>
              <ToggleSwitch id="dietary-prefs" defaultChecked />
            </div>
            <div className="es-toggle-row">
              <div>
                <p className="font-display font-semibold text-sm text-ink">Collect hotel booking preference</p>
                <p className="text-xs text-muted">Show accommodation options in the RSVP form.</p>
              </div>
              <ToggleSwitch id="hotel-pref" />
            </div>
          </div>
        </section>

        {/* Export */}
        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">download</span>
              Export
            </h2>
            <p className="es-section-sub">Download your guest list as a spreadsheet.</p>
          </header>
          <button type="button" className="btn-pill btn-pill-secondary">
            <span aria-hidden="true" className="material-symbols-outlined">download</span>
            Export CSV
            <span aria-hidden="true" className="btn-pill-spinner" />
          </button>
        </section>
      </div>
      <PageFooter />
    </main>
  )
}
