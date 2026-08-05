'use client'

import { useEffect, useState, type ReactElement } from 'react'

const DEFAULT_MESSAGE = (liveUrl: string): string =>
  `You're invited! View details & RSVP: ${liveUrl}`

export function ShareSiteDialog({
  liveUrl,
  qrDataUrl,
  compact = false,
}: {
  liveUrl: string
  qrDataUrl: string
  compact?: boolean
}): ReactElement {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState(() => DEFAULT_MESSAGE(liveUrl))

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function handleCopy(): void {
    navigator.clipboard.writeText(liveUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  const waHref = `https://wa.me/?text=${encodeURIComponent(message)}`

  return (
    <>
      <button
        type="button"
        className={`btn-pill btn-pill-primary shrink-0${compact ? ' btn-pill-sm' : ''}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span aria-hidden="true" className="material-symbols-outlined">ios_share</span>
        Share
      </button>

      <div
        id="wb-share-modal"
        className={`modal-scrim${open ? ' is-open' : ''}`}
        aria-hidden={!open}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false)
        }}
      >
        <div
          className="modal-card lg-glass-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wb-share-h"
        >
          <header className="modal-head">
            <div className="modal-head-lead">
              <h2 id="wb-share-h">Share your website</h2>
              <p className="modal-sub">Send guests the link — they&apos;ll RSVP from there.</p>
            </div>
            <button
              className="modal-close"
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </header>

          <section className="modal-section">
            <p className="modal-section-label">Site URL</p>
            <label className="form-label" htmlFor="wb-share-url">Your link</label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                id="wb-share-url"
                className="form-input min-w-0 flex-1"
                type="text"
                readOnly
                value={liveUrl}
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                type="button"
                className="btn-pill btn-pill-secondary shrink-0"
                onClick={handleCopy}
                aria-label={copied ? 'Link copied!' : 'Copy link'}
                title={copied ? 'Copied!' : 'Copy link'}
              >
                <span aria-hidden="true" className="material-symbols-outlined">
                  {copied ? 'check' : 'content_copy'}
                </span>
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </section>

          <section className="modal-section">
            <p className="modal-section-label">WhatsApp message</p>
            <label className="form-label" htmlFor="wb-wa-message">What your guests receive</label>
            <textarea
              id="wb-wa-message"
              className="form-input wb-wa-textarea"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="form-helper">Edit freely — this isn&apos;t saved.</p>
            <div className="wb-share-send-row">
              <a
                className="btn-pill btn-pill-primary"
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="material-symbols-outlined" aria-hidden="true">chat</span>
                Share on WhatsApp
              </a>
            </div>
          </section>

          <section className="modal-section">
            <p className="modal-section-label">QR code</p>
            <div className="wb-qr-panel">
              <div className="wb-qr-code">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt={`QR code for ${liveUrl}`} width={140} height={140} className="h-[140px] w-[140px]" />
              </div>
              <p className="wb-qr-hint">Guests can scan this to open your site.</p>
            </div>
          </section>

          <div className="modal-actions">
            <button type="button" className="btn-pill btn-pill-primary" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
