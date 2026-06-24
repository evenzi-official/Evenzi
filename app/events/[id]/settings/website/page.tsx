import { PageFooter } from '@/components/layout/PageFooter'
import { FormGroup } from '@/components/ui/FormGroup'
import { FormInput } from '@/components/ui/FormInput'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'

export default function WebsiteSettingsPage() {
  return (
    <main className="page-band reveal pt-6 md:pt-8 pb-24">
      <div className="es-content">
        <header className="es-content-head">
          <div>
            <h1 className="es-content-title">Website settings</h1>
            <p className="es-content-lead">Control visibility, custom domain, and SEO for your event website.</p>
          </div>
          <div className="es-content-actions">
            <button type="button" className="btn-pill btn-pill-primary">
              <span aria-hidden="true" className="material-symbols-outlined">save</span>
              Save changes
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
          </div>
        </header>

        {/* Visibility */}
        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">visibility</span>
              Visibility
            </h2>
          </header>
          <div className="es-toggle-list">
            <div className="es-toggle-row">
              <div>
                <p className="font-display font-semibold text-sm text-ink">Website is public</p>
                <p className="text-xs text-muted">Anyone with the link can view your event website.</p>
              </div>
              <ToggleSwitch id="ws-public" defaultChecked />
            </div>
            <div className="es-toggle-row">
              <div>
                <p className="font-display font-semibold text-sm text-ink">Show RSVP button</p>
                <p className="text-xs text-muted">Let guests RSVP directly from your website.</p>
              </div>
              <ToggleSwitch id="ws-rsvp" defaultChecked />
            </div>
          </div>
        </section>

        {/* Domain */}
        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">domain</span>
              Domain
            </h2>
            <p className="es-section-sub">Your site is available at a free Evenzi subdomain. Upgrade to use a custom domain.</p>
          </header>
          <div className="es-field-grid">
            <FormGroup id="ws-slug" label="Evenzi subdomain" full>
              <FormInput id="ws-slug" type="text" prefix="evenzi.app/" placeholder="your-event" />
            </FormGroup>
            <FormGroup id="ws-custom" label="Custom domain (Pro)" full>
              <FormInput id="ws-custom" type="text" placeholder="www.anyaandkabir.com" disabled />
            </FormGroup>
          </div>
        </section>
      </div>
      <PageFooter />
    </main>
  )
}
