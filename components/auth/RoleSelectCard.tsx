'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'

interface Props {
  onContinue: (role: 'host') => void
  loading: boolean
  error?: string
}

export function RoleSelectCard({ onContinue, loading, error }: Props) {
  const [selected, setSelected] = useState<'host' | null>(null)

  return (
    <div
      className="clay-card w-full flex flex-col gap-7"
      style={{ maxWidth: 540, padding: '2rem 1.75rem' }}
    >
      {/* Header */}
      <header className="flex flex-col items-center gap-2 text-center">
        <p
          className="inline-flex items-center gap-1.5 font-bold text-[11px] tracking-[.22em] uppercase m-0"
          style={{ color: 'var(--brand)' }}
        >
          <Icon name="check_circle" fill size="sm" aria-hidden />
          Welcome to Evenzi
        </p>
        <h1
          className="font-bold text-[1.625rem] sm:text-[1.875rem] leading-[1.15] tracking-[-0.015em] m-0"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
        >
          How will you use the platform?
        </h1>
        <p
          className="font-medium text-[13.5px] leading-relaxed m-0 max-w-[38ch]"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--muted)' }}
        >
          Pick the role that fits you — we&apos;ll tailor the next steps and your home screen to match.
        </p>
      </header>

      {/* Error */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="px-4 py-3 rounded-xl text-sm"
          style={{
            background: 'var(--danger-tint)',
            border: '1px solid var(--danger-line)',
            color: 'var(--danger-ink)',
          }}
        >
          {error}
        </div>
      )}

      {/* Role pills */}
      <div className="flex flex-col gap-4 w-full" role="radiogroup" aria-label="Select your role">
        {/* Host */}
        <button
          type="button"
          role="radio"
          aria-checked={selected === 'host'}
          className="radio-pill w-full text-left"
          style={{ borderRadius: 20, minHeight: 112, padding: '1.15rem 1.25rem', gap: '1rem', flexDirection: 'row', whiteSpace: 'normal' }}
          onClick={() => setSelected('host')}
        >
          <span
            className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center shrink-0 transition-colors duration-200"
            style={{
              background: selected === 'host' ? 'color-mix(in oklab, var(--brand) 18%, var(--card))' : 'var(--brand-tint)',
              color: 'var(--brand)',
            }}
          >
            <Icon name="celebration" fill size="lg" aria-hidden />
          </span>
          <span className="flex flex-col gap-[0.3rem] min-w-0 flex-1">
            <span
              className="font-bold text-[15px] leading-[1.25] tracking-[-0.005em]"
              style={{ color: selected === 'host' ? 'var(--brand)' : 'inherit' }}
            >
              Host / Event Owner
            </span>
            <span
              className="font-medium text-[13px] leading-relaxed line-clamp-3"
              style={{ color: 'var(--muted)' }}
            >
              Manage event details, guest lists, and create a beautiful event website. Collect all your memories in one place.
            </span>
          </span>
          <span
            className="w-6 h-6 rounded-full shrink-0 inline-flex items-center justify-center transition-colors duration-200"
            style={{
              border: selected === 'host' ? 'none' : '2px solid var(--line)',
              background: selected === 'host' ? 'var(--brand)' : 'transparent',
            }}
          >
            {selected === 'host' && (
              <Icon name="check" fill size="sm" className="text-white" aria-hidden />
            )}
          </span>
        </button>

        {/* Vendor (disabled) */}
        <button
          type="button"
          role="radio"
          aria-checked={false}
          aria-disabled="true"
          tabIndex={-1}
          className="radio-pill w-full text-left cursor-not-allowed"
          style={{ borderRadius: 20, minHeight: 112, padding: '1.15rem 1.25rem', gap: '1rem', flexDirection: 'row', whiteSpace: 'normal', opacity: 0.85 }}
        >
          <span
            className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center shrink-0"
            style={{ background: 'var(--line-soft)', color: 'var(--muted)' }}
          >
            <Icon name="storefront" fill size="lg" aria-hidden />
          </span>
          <span className="flex flex-col gap-[0.3rem] min-w-0 flex-1">
            <span className="font-bold text-[15px] leading-[1.25]" style={{ color: 'var(--muted)' }}>
              Vendor
            </span>
            <span className="font-medium text-[13px] leading-relaxed line-clamp-3" style={{ color: 'var(--muted)' }}>
              Manage your bookings, coordinate with hosts, and showcase your services to potential clients.
            </span>
          </span>
          <span className="role-tag-soon">Coming soon</span>
        </button>
      </div>

      {/* Continue */}
      <div className="flex justify-center">
        <button
          type="button"
          className={`btn-pill btn-pill-primary btn-pill-lg w-full justify-center${loading ? ' is-loading' : ''}`}
          disabled={!selected || loading}
          aria-disabled={!selected || loading}
          onClick={() => selected && onContinue(selected)}
        >
          <span>Continue</span>
          <span aria-hidden="true" className="material-symbols-outlined">arrow_forward</span>
          <span aria-hidden="true" className="btn-pill-spinner" />
        </button>
      </div>
    </div>
  )
}
