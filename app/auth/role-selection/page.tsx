'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { RoleSelectCard } from '@/components/auth/RoleSelectCard'

export default function RoleSelectionPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleContinue = async (role: 'host') => {
    setError('')
    setLoading(true)

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
        return
      }

      router.push('/home')
    } catch (err) {
      console.error('Role selection error:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleBackToLogin = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <div className="page-bg page-shell">
      <header className="page-shell-header">
        <Link href="/" className="page-logo" aria-label="Evenzi home">Evenzi</Link>
        <div className="page-shell-actions">
          <ThemeToggle className="page-theme-toggle" />
          <a href="mailto:evenzi.official@gmail.com" className="page-help">Need help?</a>
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
