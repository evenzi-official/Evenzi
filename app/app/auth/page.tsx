'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'signup' | 'login'>('login')
  const [phone, setPhone] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpLoading, setOtpLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const pinRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const supabase = createClient()

  const isLoading = otpLoading || googleLoading

  const title = otpSent
    ? 'Verify your number'
    : activeTab === 'login'
    ? 'Log in to your Evenzi account'
    : 'Create your Evenzi account'

  const lead = otpSent
    ? `We sent a 6-digit code to +91 ${phone}`
    : activeTab === 'login'
    ? 'Welcome back. Enter your number to continue.'
    : 'Enter your phone number to get started.'

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    return digits.startsWith('91') ? digits : '91' + digits
  }

  const flashToast = () => {
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }

  const handleSendOtp = async () => {
    setError('')
    setOtpLoading(true)
    try {
      const { error: err } = await supabase.auth.signInWithOtp({ phone: formatPhone(phone) })
      if (err) { setError(err.message); return }
      setOtpSent(true)
      flashToast()
      setTimeout(() => pinRefs.current[0]?.focus(), 100)
    } catch (e) {
      setError((e as Error).message || 'Failed to send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setError('')
    setOtpLoading(true)
    try {
      const { data, error: err } = await supabase.auth.verifyOtp({
        phone: formatPhone(phone),
        token: otp.join(''),
        type: 'sms',
      })
      if (err) { setError(err.message); return }
      if (data?.user) { router.push('/auth/role-selection'); return }
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) { router.push('/auth/role-selection'); return }
      setError('Verification succeeded but no session found. Please try again.')
    } catch (e) {
      setError((e as Error).message || 'Failed to verify OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (err) { setError(err.message); setGoogleLoading(false) }
    } catch (e) {
      setError((e as Error).message || 'Failed to sign in with Google')
      setGoogleLoading(false)
    }
  }

  const handlePinChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[idx] = digit
    setOtp(next)
    if (digit && idx < 5) pinRefs.current[idx + 1]?.focus()
  }

  const handlePinKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      const next = [...otp]
      next[idx - 1] = ''
      setOtp(next)
      pinRefs.current[idx - 1]?.focus()
    }
    if (e.key === 'Enter' && otp.every(d => d)) void handleVerifyOtp()
  }

  const handlePinPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = Array.from({ length: 6 }, (_, i) => pasted[i] ?? '')
    setOtp(next)
    pinRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const switchTab = (tab: 'signup' | 'login') => {
    setActiveTab(tab)
    setOtpSent(false)
    setOtp(['', '', '', '', '', ''])
    setError('')
  }

  const changePhone = () => {
    setOtpSent(false)
    setOtp(['', '', '', '', '', ''])
    setError('')
  }

  return (
    <div data-page="auth" className="page-bg page-shell">
      <header className="page-shell-header">
        <Link href="/" className="page-logo" aria-label="Evenzi home">Evenzi</Link>
        <div className="page-shell-actions">
          <ThemeToggle className="page-theme-toggle" />
          <Link href="/help" className="page-help">Need help?</Link>
        </div>
      </header>

      <main className="page-main page-main-center">
        <section className="auth-card clay-card" aria-labelledby="auth-title">
          <div className="auth-card-head">
            <h1 className="auth-card-title" id="auth-title" aria-live="polite">{title}</h1>
            <p className="auth-card-lead">{lead}</p>
          </div>

          {error && (
            <p className="form-error" role="alert" style={{ display: 'block' }}>
              {error}
            </p>
          )}

          {!otpSent ? (
            <>
              <div className="seg seg--fill" role="radiogroup" aria-label="Auth mode">
                <button
                  type="button"
                  role="radio"
                  className={`seg-item${activeTab === 'signup' ? ' is-active' : ''}`}
                  aria-checked={activeTab === 'signup'}
                  onClick={() => switchTab('signup')}
                  disabled={isLoading}
                >
                  <span>Sign Up</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  className={`seg-item${activeTab === 'login' ? ' is-active' : ''}`}
                  aria-checked={activeTab === 'login'}
                  onClick={() => switchTab('login')}
                  disabled={isLoading}
                >
                  <span>Log In</span>
                </button>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone Number</label>
                <div className="form-input form-input-group">
                  <span className="form-input-prefix" aria-hidden="true">+91</span>
                  <input
                    id="phone"
                    className="form-input-field"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="9999999999"
                    maxLength={10}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && phone.length >= 10 && void handleSendOtp()}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="button"
                className={`btn-pill btn-pill-primary btn-pill-lg${otpLoading ? ' is-loading' : ''}`}
                onClick={handleSendOtp}
                disabled={isLoading || phone.length < 10}
                aria-busy={otpLoading}
              >
                <span>Send OTP</span>
                <span aria-hidden="true" className="btn-pill-spinner" />
              </button>

              <div className="divider-or"><span>or</span></div>

              <button
                type="button"
                className={`btn-google${googleLoading ? ' is-loading' : ''}`}
                onClick={handleGoogleAuth}
                disabled={isLoading}
                aria-label="Continue with Google"
                aria-busy={googleLoading}
              >
                <svg className="btn-google-icon" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                <span>Continue with Google</span>
                <span aria-hidden="true" className="btn-pill-spinner" />
              </button>

              <p className="auth-policy">
                By continuing, you agree to our{' '}
                <a href="/legal/terms">Terms of Service</a> and <a href="/legal/privacy">Privacy Policy</a>
              </p>
            </>
          ) : (
            <>
              <div className="auth-verify-meta">
                <span className="auth-verify-phone">+91&nbsp;{phone}</span>
                <button
                  type="button"
                  className="auth-verify-change"
                  onClick={changePhone}
                  disabled={otpLoading}
                >
                  Change
                </button>
              </div>

              <div className="pin-input" data-len="6" role="group" aria-label="Enter 6-digit OTP">
                <span className="sr-only">Enter 6-digit OTP</span>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { pinRefs.current[idx] = el }}
                    className="pin-input-cell"
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handlePinChange(idx, e.target.value)}
                    onKeyDown={e => handlePinKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePinPaste : undefined}
                    disabled={otpLoading}
                    aria-label={`Digit ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                className={`btn-pill btn-pill-primary btn-pill-lg${otpLoading ? ' is-loading' : ''}`}
                onClick={handleVerifyOtp}
                disabled={otpLoading || otp.some(d => !d)}
                aria-busy={otpLoading}
              >
                <span>Verify OTP</span>
                <span aria-hidden="true" className="btn-pill-spinner" />
              </button>

              <div className="auth-resend">
                <button
                  type="button"
                  className="auth-resend-btn"
                  onClick={handleSendOtp}
                  disabled={otpLoading}
                >
                  Resend OTP
                </button>
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="page-shell-footer">
        © 2026 Evenzi · All rights reserved
      </footer>

      <div
        id="bc-toast"
        className={`bc-toast${toastVisible ? ' is-show' : ''}`}
        role="status"
        aria-live="polite"
      >
        <span className="bc-live" aria-hidden="true" />
        <span id="bc-toast-text">OTP SENT</span>
      </div>
    </div>
  )
}
