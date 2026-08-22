'use client'

import { useState, type ReactElement } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ShareSiteDialog } from './ShareSiteDialog'
import { useBusy } from '@/components/ui/BusyProvider'

export function SiteStatusCard({
  eventId,
  slug: initialSlug,
  liveUrl: initialLiveUrl,
  qrDataUrl,
  siteOffline: initialOffline,
  rsvpEnabled: initialRsvp,
  settingsHref,
}: {
  eventId: string
  slug: string | null
  liveUrl: string | null
  qrDataUrl: string | null
  siteOffline: boolean
  rsvpEnabled: boolean
  settingsHref: string
}): ReactElement {
  const [slug, setSlug] = useState(initialSlug)
  const [offline, setOffline] = useState(initialOffline)
  const [rsvp, setRsvp] = useState(initialRsvp)
  const [copied, setCopied] = useState(false)
  const [slugOpen, setSlugOpen] = useState(false)
  const [slugDraft, setSlugDraft] = useState(initialSlug ?? '')
  const [slugError, setSlugError] = useState<string | null>(null)
  const [savingSlug, setSavingSlug] = useState(false)
  const [busy, setBusy] = useState<'vis' | 'rsvp' | 'publish' | null>(null)
  const { runBusy } = useBusy()

  const liveUrl = slug && initialLiveUrl
    ? initialLiveUrl.replace(/\/e\/[^/]+$/, `/e/${slug}`)
    : initialLiveUrl
  const hostPrefix = (liveUrl ?? '').replace(/^https?:\/\//, '').replace(/\/e\/.*$/, '/e/')

  async function patchSettings(site_offline: boolean): Promise<boolean> {
    const res = await fetch(`/api/events/${eventId}/website-settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_offline }),
    })
    return res.ok
  }

  async function toggleVisibility(): Promise<void> {
    if (busy) return
    const next = !offline
    setBusy('vis')
    setOffline(next)
    const ok = await patchSettings(next).catch(() => false)
    if (!ok) setOffline(!next)
    setBusy(null)
  }

  async function publish(): Promise<void> {
    if (busy || !offline) return
    setBusy('publish')
    setOffline(false)
    const ok = await runBusy(() => patchSettings(false).catch(() => false), 'Publishing…')
    if (!ok) setOffline(true)
    setBusy(null)
  }

  async function toggleRsvp(): Promise<void> {
    if (busy) return
    const next = !rsvp
    setBusy('rsvp')
    setRsvp(next)
    try {
      const res = await fetch(`/api/events/${eventId}/guest-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rsvp_enabled: next }),
      })
      if (!res.ok) setRsvp(!next)
    } catch {
      setRsvp(!next)
    }
    setBusy(null)
  }

  function handleCopy(): void {
    if (!liveUrl) return
    navigator.clipboard.writeText(liveUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  async function saveSlug(): Promise<void> {
    const next = slugDraft.trim().toLowerCase()
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(next) || next.length < 3 || next.length > 80) {
      setSlugError('Use 3–80 lowercase letters, numbers, and hyphens.')
      return
    }
    setSavingSlug(true)
    setSlugError(null)
    try {
      const res = await runBusy(() => fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: next }),
      }), 'Saving URL…')
      if (res.status === 409) {
        setSlugError('That URL is taken.')
        return
      }
      if (!res.ok) {
        setSlugError('Couldn’t update the URL.')
        return
      }
      setSlug(next)
      setSlugOpen(false)
      window.location.reload()
    } finally {
      setSavingSlug(false)
    }
  }

  return (
    <section className="clay-card dp-card" id="publish" aria-labelledby="dp-url-h">
      <header className="dp-card-head dp-card-head-wrap">
        <div className="dp-card-head-lead">
          <h2 id="dp-url-h" className="dp-card-title">Site URL &amp; Status</h2>
          {offline ? (
            <StatusBadge variant="draft" dot>Draft</StatusBadge>
          ) : (
            <StatusBadge variant="live" dot>Published</StatusBadge>
          )}
        </div>
        <div className="dp-card-head-actions">
          {liveUrl ? (
            <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="btn-pill btn-pill-secondary btn-pill-sm">
              <span className="material-symbols-outlined" aria-hidden="true">visibility</span>
              Preview
            </a>
          ) : null}
          {offline ? (
            <button
              type="button"
              className="btn-pill btn-pill-secondary btn-pill-sm"
              onClick={publish}
              disabled={busy === 'publish' || !slug}
              aria-label="Publish website"
            >
              <span className="material-symbols-outlined" aria-hidden="true">rocket_launch</span>
              Publish
            </button>
          ) : null}
          {liveUrl && qrDataUrl ? (
            <ShareSiteDialog liveUrl={liveUrl} qrDataUrl={qrDataUrl} compact />
          ) : null}
        </div>
      </header>

      {slug ? (
        <div className="dp-url-row">
          <div className="dp-url-display">
            <span className="dp-url-prefix">{hostPrefix}</span>
            <span className="dp-url-slug">{slug}</span>
          </div>
          <div className="dp-url-actions">
            <button
              type="button"
              className="dp-icon-btn"
              aria-label={copied ? 'Link copied!' : 'Copy URL'}
              title={copied ? 'Copied!' : 'Copy URL'}
              onClick={handleCopy}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {copied ? 'check' : 'content_copy'}
              </span>
            </button>
            <button
              type="button"
              className="dp-icon-btn"
              aria-label="Edit URL slug"
              onClick={() => { setSlugDraft(slug); setSlugError(null); setSlugOpen(true) }}
            >
              <span className="material-symbols-outlined" aria-hidden="true">edit</span>
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted font-display mb-4">No site URL yet — it is created with the event.</p>
      )}

      <ul className="dp-status-list" aria-label="Site controls">
        <li className="dp-status-row">
          <div className="dp-status-meta">
            <span className="dp-status-label" id="dp-vis-label">Visibility</span>
            <span className="dp-status-help" id="dp-vis-help">
              {offline ? 'Currently in Draft — only you can see it' : `Live at ${hostPrefix}${slug ?? ''}`}
            </span>
          </div>
          <button
            type="button"
            className="toggle-switch"
            role="switch"
            aria-checked={!offline}
            aria-labelledby="dp-vis-label"
            aria-describedby="dp-vis-help"
            disabled={busy === 'vis' || !slug}
            onClick={toggleVisibility}
          >
            <span className="toggle-switch-thumb" aria-hidden="true" />
          </button>
        </li>
        <li className="dp-status-row">
          <div className="dp-status-meta">
            <span className="dp-status-label" id="dp-rsvp-label">RSVP collection</span>
            <span className="dp-status-help" id="dp-rsvp-help">
              {rsvp ? 'Accepting responses' : 'RSVP form is closed'}
            </span>
          </div>
          <button
            type="button"
            className="toggle-switch"
            role="switch"
            aria-checked={rsvp}
            aria-labelledby="dp-rsvp-label"
            aria-describedby="dp-rsvp-help"
            disabled={busy === 'rsvp'}
            onClick={toggleRsvp}
          >
            <span className="toggle-switch-thumb" aria-hidden="true" />
          </button>
        </li>
        <li className="dp-status-row">
          <div className="dp-status-meta">
            <span className="dp-status-label" id="dp-pwd-label">Private content lock</span>
            <span className="dp-status-help" id="dp-pwd-help">
              Guests need a phone match to unlock private pages.{' '}
              <Link href={settingsHref} className="text-brand font-semibold hover:underline">Optional site password</Link>
            </span>
          </div>
          <button
            type="button"
            className="toggle-switch"
            role="switch"
            aria-checked
            aria-labelledby="dp-pwd-label"
            aria-describedby="dp-pwd-help"
            disabled
            title="Always on — private pages require guest identification"
          >
            <span className="toggle-switch-thumb" aria-hidden="true" />
          </button>
        </li>
      </ul>

      <div className={`modal-scrim${slugOpen ? ' is-open' : ''}`} aria-hidden={!slugOpen}>
        <div className="modal-card lg-glass-card" role="dialog" aria-modal="true" aria-labelledby="dp-slug-h">
          <header className="modal-head">
            <div className="modal-head-lead">
              <h2 id="dp-slug-h">Edit site URL</h2>
              <p className="modal-sub">Letters, numbers, and hyphens only.</p>
            </div>
            <button type="button" className="modal-close" aria-label="Close" onClick={() => setSlugOpen(false)}>
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </header>
          <label className="form-label" htmlFor="dp-slug-input">Slug</label>
          <input
            id="dp-slug-input"
            className="form-input"
            value={slugDraft}
            onChange={(e) => setSlugDraft(e.target.value)}
            autoCapitalize="off"
            spellCheck={false}
          />
          {slugError ? <p className="form-error">{slugError}</p> : null}
          <div className="modal-actions">
            <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setSlugOpen(false)}>Cancel</button>
            <button type="button" className="btn-pill btn-pill-primary" onClick={saveSlug} disabled={savingSlug}>
              {savingSlug ? 'Saving…' : 'Save URL'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
