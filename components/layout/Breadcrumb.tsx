'use client'

import Link from 'next/link'
import { useState } from 'react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  backHref?: string
  backLabel?: string
  showCopy?: boolean
}

const Sep = () => (
  <li className="bc-sep" aria-hidden="true">
    <svg viewBox="0 0 12 12"><path d="M3.5 1.5 L8.5 6 L3.5 10.5" /></svg>
  </li>
)

export function Breadcrumb({ items, backHref, backLabel, showCopy = true }: BreadcrumbProps) {
  const resolvedBack = backHref ?? (items.length > 1 ? items[items.length - 2].href : '/home')
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div className="bc-wrap reveal">
      <nav className="bc-shell" aria-label="Breadcrumb">
        {resolvedBack && (
          <Link
            href={resolvedBack}
            className="bc-back"
            aria-label={`Back${backLabel ? ` to ${backLabel}` : ''}`}
          >
            <span aria-hidden="true" className="material-symbols-outlined">arrow_back</span>
          </Link>
        )}

        <ol className="bc-path">
          {items.map((item, i) => {
            const isLast = i === items.length - 1
            return (
              <>
                {i > 0 && <Sep key={`sep-${i}`} />}
                {isLast ? (
                  <li key={i} className="bc-active" aria-current="page">
                    <span className="bc-dot" aria-hidden="true" />
                    {item.label}
                  </li>
                ) : (
                  <li key={i}>
                    {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
                  </li>
                )}
              </>
            )
          })}
        </ol>

        {showCopy && (
          <>
            <span className="bc-divider hidden md:inline-block" aria-hidden="true" />
            <button
              type="button"
              className={`bc-copy${copied ? ' is-copied' : ''}`}
              aria-label={copied ? 'Link copied!' : 'Copy link'}
              onClick={handleCopy}
              title={copied ? 'Copied!' : 'Copy link'}
            >
              <span aria-hidden="true" className="material-symbols-outlined icon-sm-15">
                {copied ? 'check' : 'content_copy'}
              </span>
            </button>
          </>
        )}
      </nav>
    </div>
  )
}
