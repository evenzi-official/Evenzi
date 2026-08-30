'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { RoleSelectCard } from '@/components/auth/RoleSelectCard'
import { useBusy } from '@/components/ui/BusyProvider'
import { getAppBaseUrl, getMarketingBaseUrl } from '@/lib/url'

const APP_HELP_URL = `${getAppBaseUrl()}/help`
const MARKETING_BASE_URL = getMarketingBaseUrl()

export default function RoleSelectionPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const { setBusy } = useBusy()

  const handleContinue = async (role: 'host') => {
    setError('')
    setLoading(true)
    setBusy(true, 'Setting up your account…')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }


      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ role_slug: role })
        .eq('id', user.id)

      if (updateError) {
        console.error('Role update error:', updateError)
        setError('Failed to set your role. Please try again.')
        setLoading(false)
        setBusy(false)
        return
      }

      router.push('/home')
    } catch (err) {
      console.error('Role selection error:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
      setBusy(false)
    }
  }

  const handleBackToLogin = async () => {
    setBusy(true, 'Signing out…')
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <div className="page-bg page-shell">
      <header className="page-shell-header">
      <a href={MARKETING_BASE_URL} className="page-logo" aria-label="Evenzi home">Evenzi</a>
        <div className="page-shell-actions">
          <ThemeToggle className="page-theme-toggle" />
      <a href={APP_HELP_URL} className="page-help">Need help?</a>
        </div>
      </header>

      <main className="page-main page-main-center page-main-wide">
        <RoleSelectCard
          onContinue={handleContinue}
          loading={loading}
          error={error || undefined}
        />

        <button
          onClick={handleBackToLogin}
          className="inline-flex items-center gap-1.5 mt-5 px-4 py-2.5 min-h-[44px] rounded-full font-semibold text-xs tracking-[.04em] transition-colors self-center hover:text-[var(--brand)] hover:bg-[var(--brand-tint)]"
          style={{ color: 'var(--muted)' }}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Login
        </button>
      </main>

      <footer className="page-shell-footer">
        © 2026 Evenzi · All rights reserved
      </footer>
    </div>
  )
}
