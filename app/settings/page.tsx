import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FloatingNav } from '@/components/layout/FloatingNav'
import { ScrollProgress } from '@/components/layout/ScrollProgress'
import { HelpFab } from '@/components/layout/HelpFab'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import { FormGroup } from '@/components/ui/FormGroup'
import { FormInput } from '@/components/ui/FormInput'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'

const SETTINGS_SECTIONS = [
  { id: 'profile',       icon: 'person',         label: 'Profile' },
  { id: 'notifications', icon: 'notifications',  label: 'Notifications' },
  { id: 'security',      icon: 'lock',           label: 'Security' },
  { id: 'appearance',    icon: 'palette',         label: 'Appearance' },
] as const

export default async function UserSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  return (
    <div data-page="settings">
      <ScrollProgress />
      <FloatingNav />

      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: 'SETTINGS' },
        ]}
        backHref="/home"
      />

      <main className="page-band pt-6 md:pt-8 pb-24">
        <header className="section-head reveal">
          <p className="section-head-eyebrow">Account</p>
          <div className="section-head-titlerow">
            <h1 className="section-head-title">Settings</h1>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 mt-8">
          {/* Sidebar nav */}
          <nav className="flex flex-row lg:flex-col gap-1" aria-label="Settings sections">
            {SETTINGS_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-display font-semibold text-muted hover:bg-brand-tint hover:text-brand transition-colors"
              >
                <span aria-hidden="true" className="material-symbols-outlined icon-fill icon-sm-18">{s.icon}</span>
                {s.label}
              </a>
            ))}
          </nav>

          {/* Content */}
          <div className="flex flex-col gap-6">
            {/* Profile */}
            <section id="profile" className="clay-card p-7 md:p-8 reveal scroll-mt-28">
              <h2 className="es-content-title mb-1">Profile</h2>
              <p className="es-content-lead mb-6">Your personal information and display name.</p>
              <div className="flex items-center gap-5 mb-6">
                <button type="button" className="w-16 h-16 rounded-full bg-brand text-white font-display font-bold text-2xl flex items-center justify-center shrink-0 hover:bg-brand-hover transition-colors" aria-label="Change avatar">
                  {user.email?.[0]?.toUpperCase() ?? 'A'}
                </button>
                <div>
                  <p className="font-display font-semibold text-sm text-ink">{user.email}</p>
                  <button type="button" className="text-xs font-display font-semibold text-brand hover:underline mt-0.5">Change photo</button>
                </div>
              </div>
              <div className="es-field-grid">
                <FormGroup id="s-name" label="Display name">
                  <FormInput id="s-name" type="text" placeholder="Your name" />
                </FormGroup>
                <FormGroup id="s-email" label="Email address">
                  <FormInput id="s-email" type="email" defaultValue={user.email ?? ''} readOnly />
                </FormGroup>
                <FormGroup id="s-phone" label="Phone number">
                  <FormInput id="s-phone" type="tel" prefix="+91" placeholder="9999999999" />
                </FormGroup>
              </div>
              <div className="mt-4">
                <button type="button" className="btn-pill btn-pill-primary">
                  <span aria-hidden="true" className="material-symbols-outlined">save</span>
                  Save profile
                  <span aria-hidden="true" className="btn-pill-spinner" />
                </button>
              </div>
            </section>

            {/* Notifications */}
            <section id="notifications" className="clay-card p-7 md:p-8 reveal scroll-mt-28">
              <h2 className="es-content-title mb-1">Notifications</h2>
              <p className="es-content-lead mb-6">Choose how and when Evenzi contacts you.</p>
              <div className="es-toggle-list">
                {[
                  { id: 'n-rsvp',    label: 'RSVP updates',       desc: 'Notify when a guest RSVPs.' },
                  { id: 'n-invite',  label: 'Invite delivered',    desc: 'Notify when invites are delivered.' },
                  { id: 'n-tips',    label: 'Planning tips',       desc: 'Weekly tips to help you stay on track.' },
                  { id: 'n-promo',   label: 'Product updates',     desc: 'Hear about new Evenzi features.' },
                ].map((n) => (
                  <div key={n.id} className="es-toggle-row">
                    <div>
                      <p className="font-display font-semibold text-sm text-ink">{n.label}</p>
                      <p className="text-xs text-muted">{n.desc}</p>
                    </div>
                    <ToggleSwitch id={n.id} defaultChecked={n.id !== 'n-promo'} />
                  </div>
                ))}
              </div>
            </section>

            {/* Security */}
            <section id="security" className="clay-card p-7 md:p-8 reveal scroll-mt-28">
              <h2 className="es-content-title mb-1">Security</h2>
              <p className="es-content-lead mb-6">Manage your login methods and active sessions.</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-line-soft">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="material-symbols-outlined icon-fill text-brand">phone_iphone</span>
                    <div>
                      <p className="font-display font-semibold text-sm text-ink">Phone OTP</p>
                      <p className="text-xs text-muted">Signed in with +91 •••• ••••</p>
                    </div>
                  </div>
                  <span className="status-badge status-badge--success">Active</span>
                </div>
                <button type="button" className="btn-pill btn-pill-secondary w-full justify-center">
                  <span aria-hidden="true" className="material-symbols-outlined">logout</span>
                  Sign out of all devices
                  <span aria-hidden="true" className="btn-pill-spinner" />
                </button>
              </div>
            </section>

            {/* Appearance */}
            <section id="appearance" className="clay-card p-7 md:p-8 reveal scroll-mt-28">
              <h2 className="es-content-title mb-1">Appearance</h2>
              <p className="es-content-lead mb-6">Customise how Evenzi looks for you.</p>
              <div className="es-toggle-row">
                <div>
                  <p className="font-display font-semibold text-sm text-ink">Dark mode</p>
                  <p className="text-xs text-muted">Use the dark theme across Evenzi.</p>
                </div>
                <ToggleSwitch id="dark-mode" />
              </div>
            </section>
          </div>
        </div>
      </main>

      <HelpFab />
      <PageFooter />
    </div>
  )
}
