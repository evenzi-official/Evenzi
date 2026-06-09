import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageFooter } from '@/components/layout/PageFooter'
import { FormGroup } from '@/components/ui/FormGroup'
import { FormInput } from '@/components/ui/FormInput'

export default async function GeneralSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('events').select('id, name').eq('id', id).single()
  if (!event) redirect('/home')

  return (
    <main className="page-band reveal pt-6 md:pt-8 pb-24">
      <div className="es-content">
        <header className="es-content-head">
          <div>
            <h1 className="es-content-title">General settings</h1>
            <p className="es-content-lead">Manage your event&apos;s core details and registration information.</p>
          </div>
          <div className="es-content-actions">
            <button type="button" className="btn-pill btn-pill-primary">
              <span aria-hidden="true" className="material-symbols-outlined">save</span>
              Save changes
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
          </div>
        </header>

        {/* Event identity */}
        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">badge</span>
              Event identity
            </h2>
            <p className="es-section-sub">The basics — visible to your guests across invites, the website, and the dashboard.</p>
          </header>
          <div className="es-field-grid">
            <FormGroup id="es-event-name" label="Event name" full>
              <FormInput id="es-event-name" type="text" defaultValue={event.name ?? ''} autoComplete="off" />
            </FormGroup>
            <FormGroup id="es-partner-one" label="Partner one">
              <FormInput id="es-partner-one" type="text" placeholder="Name" />
            </FormGroup>
            <FormGroup id="es-partner-two" label="Partner two">
              <FormInput id="es-partner-two" type="text" placeholder="Name" />
            </FormGroup>
          </div>
        </section>

        {/* Date & venue */}
        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">calendar_today</span>
              Date &amp; venue
            </h2>
            <p className="es-section-sub">When and where the main celebration takes place.</p>
          </header>
          <div className="es-field-grid">
            <FormGroup id="es-date" label="Event date">
              <FormInput id="es-date" type="date" />
            </FormGroup>
            <FormGroup id="es-venue" label="Venue name">
              <FormInput id="es-venue" type="text" placeholder="e.g. Rajasthan Heritage Palace" />
            </FormGroup>
            <FormGroup id="es-location" label="City / location" full>
              <FormInput id="es-location" type="text" placeholder="e.g. Udaipur, Rajasthan" />
            </FormGroup>
          </div>
        </section>

        {/* Danger zone */}
        <section className="es-section es-section--danger">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">warning</span>
              Danger zone
            </h2>
            <p className="es-section-sub">Irreversible actions — proceed with caution.</p>
          </header>
          <div className="es-danger-row">
            <div>
              <p className="font-display font-semibold text-sm text-ink">Delete this event</p>
              <p className="text-xs text-muted mt-0.5">Permanently removes all data, guests, and media. Cannot be undone.</p>
            </div>
            <button type="button" className="btn-pill btn-pill-danger shrink-0">
              <span aria-hidden="true" className="material-symbols-outlined">delete_forever</span>
              Delete event
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
          </div>
        </section>
      </div>

      <PageFooter />
    </main>
  )
}
