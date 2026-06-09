import { PageFooter } from '@/components/layout/PageFooter'
import { FormGroup } from '@/components/ui/FormGroup'
import { FormInput } from '@/components/ui/FormInput'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'

export default function RegistrySettingsPage() {
  return (
    <main className="page-band reveal pt-6 md:pt-8 pb-24">
      <div className="es-content">
        <header className="es-content-head">
          <div>
            <h1 className="es-content-title">Registry</h1>
            <p className="es-content-lead">Link your wedding registry and gift preferences for guests.</p>
          </div>
          <div className="es-content-actions">
            <button type="button" className="btn-pill btn-pill-primary">
              <span aria-hidden="true" className="material-symbols-outlined">save</span>
              Save changes
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
          </div>
        </header>

        {/* Registry links */}
        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">redeem</span>
              Registry links
            </h2>
            <p className="es-section-sub">Add links to external registries so guests can find your wishlist easily.</p>
          </header>
          <div className="es-field-grid">
            <FormGroup id="reg-amazon" label="Amazon wishlist URL" full>
              <FormInput id="reg-amazon" type="url" placeholder="https://www.amazon.in/…" />
            </FormGroup>
            <FormGroup id="reg-flipkart" label="Flipkart wishlist URL" full>
              <FormInput id="reg-flipkart" type="url" placeholder="https://www.flipkart.com/…" />
            </FormGroup>
            <FormGroup id="reg-other" label="Other registry URL" full>
              <FormInput id="reg-other" type="url" placeholder="https://…" />
            </FormGroup>
          </div>
        </section>

        {/* Cash fund */}
        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">currency_rupee</span>
              Cash &amp; UPI fund
            </h2>
          </header>
          <div className="es-toggle-list">
            <div className="es-toggle-row">
              <div>
                <p className="font-display font-semibold text-sm text-ink">Enable UPI donations</p>
                <p className="text-xs text-muted">Show your UPI QR code or ID for cash gifts.</p>
              </div>
              <ToggleSwitch id="upi-fund" />
            </div>
          </div>
          <div className="es-field-grid mt-4">
            <FormGroup id="reg-upi" label="UPI ID" full>
              <FormInput id="reg-upi" type="text" placeholder="name@upi" />
            </FormGroup>
          </div>
        </section>
      </div>
      <PageFooter />
    </main>
  )
}
