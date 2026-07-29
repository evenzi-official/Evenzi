'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AccountSection(): React.ReactElement {
  const router = useRouter()
  const supabase = createClient()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut(): Promise<void> {
    if (signingOut) return
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <section id="account" className="settings-section reveal">
      <header className="settings-section-head">
        <h2 className="section-rule">
          <span className="section-rule-bar" aria-hidden="true" />
          Account
        </h2>
      </header>
      <div className="clay-card settings-card-inner">
        <div className="settings-account">
          <div className="settings-account-body">
            <h3 className="settings-account-title">Sign out</h3>
            <p className="settings-account-desc">You&apos;ll need to sign in again with your phone number or Google account to keep planning your events.</p>
          </div>
          <button type="button" className="btn-pill btn-pill-danger" onClick={() => { void handleSignOut() }} disabled={signingOut}>
            <span aria-hidden="true" className="material-symbols-outlined">logout</span>
            <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
          </button>
        </div>
      </div>
    </section>
  )
}
