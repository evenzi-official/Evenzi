'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GuestLookupForm({ slug }: { slug: string }) {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/e/${slug}/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), name: name.trim() }),
      })
      if (res.ok) {
        setSuccess(true)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        if (res.status === 429) setError('Too many attempts — please try again later.')
        else setError(data.error ?? 'We couldn\'t find you on the guest list. Check your details and try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="text-3xl mb-3">✓</div>
        <p className="font-serif text-xl text-stone-700">Welcome! Loading your invitation…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
      <div>
        <label className="block text-xs font-medium tracking-widest uppercase text-stone-500 mb-2">
          Your Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="As on the invitation"
          required
          className="w-full px-4 py-3 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:border-stone-400 transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs font-medium tracking-widest uppercase text-stone-500 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          required
          className="w-full px-4 py-3 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:border-stone-400 transition-colors"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-stone-800 text-white text-sm tracking-widest uppercase rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Checking…' : 'Find My Invitation'}
      </button>
    </form>
  )
}
