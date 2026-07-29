import { StatusBadge } from '@/components/ui/StatusBadge'

export interface SignInMethod {
  provider: 'google' | 'phone'
  label: string
  icon: string
  connected: boolean
  detail: string | null
}

interface Props {
  methods: SignInMethod[]
}

export function SecuritySection({ methods }: Props): React.ReactElement {
  return (
    <section id="security" className="settings-section reveal">
      <header className="settings-section-head">
        <h2 className="section-rule">
          <span className="section-rule-bar" aria-hidden="true" />
          Security
        </h2>
      </header>
      <div className="clay-card settings-card-inner">
        <div className="settings-security">
          <div className="settings-security-fields">
            <div className="space-y-4">
              {methods.map((m) => (
                <div key={m.provider} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-line-soft">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="material-symbols-outlined icon-fill text-brand">{m.icon}</span>
                    <div>
                      <p className="font-display font-semibold text-sm text-ink">{m.label}</p>
                      <p className="text-xs text-muted">{m.connected ? m.detail : 'Not connected'}</p>
                    </div>
                  </div>
                  <StatusBadge variant={m.connected ? 'success' : 'draft'}>
                    {m.connected ? 'Connected' : 'Not connected'}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </div>

          <div className="settings-security-divider">
            <h3 className="settings-2fa-title">Two-factor authentication</h3>
            <p className="settings-2fa-desc">Coming soon — add an extra layer of security to your account by requiring a verification code in addition to your password.</p>
            <div className="settings-2fa-toggle-row">
              <span className="settings-2fa-label">Enable 2FA</span>
              <button
                type="button"
                className="toggle-switch"
                role="switch"
                aria-checked={false}
                aria-label="Enable two-factor authentication (coming soon)"
                disabled
              >
                <span className="toggle-switch-thumb" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
