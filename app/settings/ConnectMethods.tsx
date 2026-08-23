'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBusy } from '@/components/ui/BusyProvider'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { SignInMethod } from './SecuritySection'

interface Props {
  methods: SignInMethod[]
  /** Total number of auth.identities on the account — the disconnect lockout guard. */
  identityCount: number
  userId: string
}

type PhoneStage = 'idle' | 'number' | 'otp'

const GENERIC_ERROR = 'Something went wrong. Please try again.'

/** Normalise a 10-digit Indian number to the +91 E.164 form Supabase expects. */
function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  return digits.startsWith('91') ? `+${digits}` : `+91${digits}`
}

export function ConnectMethods({ methods, identityCount, userId }: Props): React.ReactElement {
  const router = useRouter()
  const { setBusy } = useBusy()
  const supabase = createClient()

  // Google link
  const [googleError, setGoogleError] = useState<string | null>(null)

  // Phone link
  const [phoneStage, setPhoneStage] = useState<PhoneStage>('idle')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [phoneBusy, setPhoneBusy] = useState(false)
  const pinRefs = useRef<(HTMLInputElement | null)[]>([])

  // Disconnect
  const [confirmProvider, setConfirmProvider] = useState<'google' | 'phone' | null>(null)
  const [disconnectBusy, setDisconnectBusy] = useState(false)

  // ── Google ────────────────────────────────────────────────────────────────
  async function connectGoogle(): Promise<void> {
    setGoogleError(null)
    setBusy(true, 'Redirecting to Google…')
    try {
      const next = encodeURIComponent('/settings#security')
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` },
      })
      // On success the browser redirects away; reaching here means it failed.
      if (error) {
        setBusy(false)
        setGoogleError(
          error.status === 422
            ? 'Connecting Google is temporarily unavailable.'
            : /already/i.test(error.message)
            ? 'That Google account is already linked to another Evenzi account.'
            : GENERIC_ERROR,
        )
      }
    } catch {
      setBusy(false)
      setGoogleError(GENERIC_ERROR)
    }
  }

  // ── Phone ─────────────────────────────────────────────────────────────────
  function startPhone(): void {
    setPhoneError(null)
    setPhone('')
    setOtp(['', '', '', '', '', ''])
    setPhoneStage('number')
  }

  function cancelPhone(): void {
    setPhoneStage('idle')
    setPhoneError(null)
  }

  async function sendPhoneOtp(): Promise<void> {
    if (phone.length < 10) return
    setPhoneError(null)
    setPhoneBusy(true)
    try {
      const { error } = await supabase.auth.updateUser({ phone: toE164(phone) })
      if (error) {
        setPhoneError(
          /already|exists|registered/i.test(error.message)
            ? 'That phone number is already linked to another Evenzi account.'
            : error.message || GENERIC_ERROR,
        )
        return
      }
      setPhoneStage('otp')
      setTimeout(() => pinRefs.current[0]?.focus(), 50)
    } catch {
      setPhoneError(GENERIC_ERROR)
    } finally {
      setPhoneBusy(false)
    }
  }

  async function verifyPhoneOtp(): Promise<void> {
    if (otp.some((d) => !d)) return
    setPhoneError(null)
    setPhoneBusy(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: toE164(phone),
        token: otp.join(''),
        type: 'phone_change',
      })
      if (error) {
        setPhoneError(error.message || 'That code did not match. Please try again.')
        return
      }
      // Keep user_profiles.phone in sync with the newly linked auth phone.
      await supabase.from('user_profiles').update({ phone: toE164(phone) }).eq('id', userId)
      setPhoneStage('idle')
      router.refresh()
    } catch {
      setPhoneError(GENERIC_ERROR)
    } finally {
      setPhoneBusy(false)
    }
  }

  function handlePinChange(idx: number, val: string): void {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[idx] = digit
    setOtp(next)
    if (digit && idx < 5) pinRefs.current[idx + 1]?.focus()
  }

  function handlePinKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      const next = [...otp]
      next[idx - 1] = ''
      setOtp(next)
      pinRefs.current[idx - 1]?.focus()
    }
    if (e.key === 'Enter' && otp.every((d) => d)) void verifyPhoneOtp()
  }

  function handlePinPaste(e: React.ClipboardEvent<HTMLInputElement>): void {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    setOtp(Array.from({ length: 6 }, (_, i) => pasted[i] ?? ''))
    pinRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  // ── Disconnect ──────────────────────────────────────────────────────────────
  async function disconnect(provider: 'google' | 'phone'): Promise<void> {
    setDisconnectBusy(true)
    try {
      const { data, error: listErr } = await supabase.auth.getUserIdentities()
      const identities = data?.identities ?? []
      if (listErr || identities.length <= 1) {
        // Never remove the last method — this would lock the account out.
        setConfirmProvider(null)
        return
      }
      const identity = identities.find((i) => i.provider === provider)
      if (!identity) {
        setConfirmProvider(null)
        return
      }
      const { error } = await supabase.auth.unlinkIdentity(identity)
      setConfirmProvider(null)
      if (!error) router.refresh()
    } finally {
      setDisconnectBusy(false)
    }
  }

  const canDisconnect = identityCount >= 2

  return (
    <div className="space-y-4">
      {methods.map((m) => {
        const isPhoneFlow = m.provider === 'phone' && phoneStage !== 'idle'
        return (
          <div key={m.provider} className="rounded-2xl bg-line-soft">
            <div className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="material-symbols-outlined icon-fill text-brand">{m.icon}</span>
                <div>
                  <p className="font-display font-semibold text-sm text-ink">{m.label}</p>
                  <p className="text-xs text-muted">{m.connected ? m.detail : 'Not connected'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge variant={m.connected ? 'success' : 'draft'}>
                  {m.connected ? 'Connected' : 'Not connected'}
                </StatusBadge>
                {m.connected && canDisconnect && (
                  <button
                    type="button"
                    className="btn-pill btn-pill-ghost btn-pill-sm"
                    onClick={() => setConfirmProvider(m.provider)}
                  >
                    Disconnect
                  </button>
                )}
                {!m.connected && m.provider === 'google' && (
                  <button type="button" className="btn-pill btn-pill-primary btn-pill-sm" onClick={() => void connectGoogle()}>
                    Connect
                  </button>
                )}
                {!m.connected && m.provider === 'phone' && phoneStage === 'idle' && (
                  <button type="button" className="btn-pill btn-pill-primary btn-pill-sm" onClick={startPhone}>
                    Connect
                  </button>
                )}
              </div>
            </div>

            {m.provider === 'google' && googleError && (
              <p className="form-error px-4 pb-3" role="alert" style={{ display: 'block' }}>{googleError}</p>
            )}

            {isPhoneFlow && (
              <div className="px-4 pb-4 pt-1 space-y-3">
                {phoneError && (
                  <p className="form-error" role="alert" style={{ display: 'block' }}>{phoneError}</p>
                )}

                {phoneStage === 'number' && (
                  <>
                    <div className="form-group">
                      <label className="form-label" htmlFor="connect-phone">Enter your phone number</label>
                      <div className="form-input form-input-group">
                        <span className="form-input-prefix" aria-hidden="true">+91</span>
                        <input
                          id="connect-phone"
                          className="form-input-field"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          placeholder="9999999999"
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          onKeyDown={(e) => e.key === 'Enter' && phone.length >= 10 && void sendPhoneOtp()}
                          disabled={phoneBusy}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={`btn-pill btn-pill-primary btn-pill-sm${phoneBusy ? ' is-loading' : ''}`}
                        onClick={() => void sendPhoneOtp()}
                        disabled={phoneBusy || phone.length < 10}
                        aria-busy={phoneBusy}
                      >
                        <span>Send code</span>
                        <span aria-hidden="true" className="btn-pill-spinner" />
                      </button>
                      <button type="button" className="btn-pill btn-pill-ghost btn-pill-sm" onClick={cancelPhone} disabled={phoneBusy}>
                        Cancel
                      </button>
                    </div>
                  </>
                )}

                {phoneStage === 'otp' && (
                  <>
                    <p className="text-xs text-muted">We sent a 6-digit code to +91 {phone}</p>
                    <div className="pin-input" data-len="6" role="group" aria-label="Enter 6-digit code">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => { pinRefs.current[idx] = el }}
                          className="pin-input-cell"
                          type="tel"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handlePinChange(idx, e.target.value)}
                          onKeyDown={(e) => handlePinKeyDown(idx, e)}
                          onPaste={idx === 0 ? handlePinPaste : undefined}
                          disabled={phoneBusy}
                          aria-label={`Digit ${idx + 1}`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={`btn-pill btn-pill-primary btn-pill-sm${phoneBusy ? ' is-loading' : ''}`}
                        onClick={() => void verifyPhoneOtp()}
                        disabled={phoneBusy || otp.some((d) => !d)}
                        aria-busy={phoneBusy}
                      >
                        <span>Verify &amp; connect</span>
                        <span aria-hidden="true" className="btn-pill-spinner" />
                      </button>
                      <button type="button" className="btn-pill btn-pill-ghost btn-pill-sm" onClick={cancelPhone} disabled={phoneBusy}>
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}

      <ConfirmDialog
        open={confirmProvider !== null}
        title="Disconnect this sign-in method?"
        message={`You will no longer be able to sign in with ${confirmProvider === 'google' ? 'Google' : 'your phone number'}. You can reconnect it any time.`}
        confirmLabel="Disconnect"
        tone="danger"
        busy={disconnectBusy}
        onConfirm={() => { if (confirmProvider) void disconnect(confirmProvider) }}
        onCancel={() => setConfirmProvider(null)}
      />
    </div>
  )
}
