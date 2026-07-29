'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ToastTone = 'success' | 'error'
interface ToastState { message: string; tone: ToastTone }

interface Props {
  hasPassword: boolean
}

export function SecuritySection({ hasPassword }: Props): React.ReactElement {
  const supabase = createClient()
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  function flashToast(message: string, tone: ToastTone): void {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 3000)
  }

  async function handleSubmit(): Promise<void> {
    if (saving) return
    if (newPw.length < 8) {
      flashToast('New password must be at least 8 characters.', 'error')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) {
        flashToast(error.message, 'error')
        return
      }
      flashToast(hasPassword ? 'Password updated' : 'Password set — you can now also sign in with email + password', 'success')
      setCurrentPw('')
      setNewPw('')
    } catch {
      flashToast('Could not update password.', 'error')
    } finally {
      setSaving(false)
    }
  }

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
            {hasPassword && (
              <div className="form-group">
                <label className="form-label" htmlFor="current-pw">Current password</label>
                <div className="form-password">
                  <input
                    id="current-pw"
                    type={showCurrent ? 'text' : 'password'}
                    className="form-input"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="form-password-toggle"
                    aria-label={showCurrent ? 'Hide password' : 'Show password'}
                    onClick={() => setShowCurrent((v) => !v)}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined">
                      {showCurrent ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="new-pw">{hasPassword ? 'New password' : 'Set a password'}</label>
              <div className="form-password">
                <input
                  id="new-pw"
                  type={showNew ? 'text' : 'password'}
                  className="form-input"
                  placeholder={hasPassword ? 'Enter new password' : 'Add a password for email sign-in'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="form-password-toggle"
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                  onClick={() => setShowNew((v) => !v)}
                >
                  <span aria-hidden="true" className="material-symbols-outlined">
                    {showNew ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <p className="form-helper">At least 8 characters with one number and one symbol.</p>
            </div>
            <div className="settings-security-actions">
              <button type="button" className="btn-pill btn-pill-primary" onClick={() => { void handleSubmit() }} disabled={saving}>
                <span aria-hidden="true" className="material-symbols-outlined">lock_reset</span>
                {saving ? 'Saving…' : hasPassword ? 'Update password' : 'Set password'}
              </button>
              {toast && <span className={`ml-3 text-sm ${toast.tone === 'success' ? 'text-success' : 'text-error'}`}>{toast.message}</span>}
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
