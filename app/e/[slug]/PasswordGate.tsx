'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBusy } from '@/components/ui/BusyProvider'

export default function PasswordGate({ slug }: { slug: string }) {
  const router = useRouter()
  const { runBusy } = useBusy()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canSubmit = password.trim().length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await runBusy(async () => {
        const res = await fetch(`/api/e/${slug}/verify-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        })
        if (res.ok) {
          router.refresh()
        } else {
          const data = await res.json().catch(() => ({}))
          if (res.status === 429) setError('Too many attempts — please try again later.')
          else setError(data.error ?? 'Incorrect password. Please try again.')
        }
      }, 'Unlocking…')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#faf9f7', color: '#292524' }}>
      <div className="w-full max-w-sm text-center">
        <p className="text-xs tracking-widest uppercase text-stone-400 mb-4">Private Website</p>
        <h1 className="font-serif text-3xl text-stone-800 italic mb-8">Enter the password to continue</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Website password"
            required
            autoFocus
            className="w-full px-4 py-3 border border-stone-200 rounded-lg text-sm bg-white text-center focus:outline-none focus:border-stone-400 transition-colors"
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={!canSubmit || loading}
            aria-busy={loading}
            className="w-full py-3 bg-stone-800 text-white text-sm tracking-widest uppercase rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Checking…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
