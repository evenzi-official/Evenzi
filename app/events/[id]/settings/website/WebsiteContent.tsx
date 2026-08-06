'use client'

import { useState } from 'react'

interface InitialWebsiteSettings {
  passwordEnabled: boolean
  searchIndexing:  boolean
  bannerEnabled:   boolean
  bannerText:      string
  siteOffline:     boolean
  daysRemaining:   number | null
  isExpired:       boolean
}

interface Props {
  eventId: string
  initial: InitialWebsiteSettings
}

export function WebsiteContent({ eventId, initial }: Props) {
  const [passwordProtect, setPasswordProtect] = useState(initial.passwordEnabled)
  const [sitePassword, setSitePassword]       = useState('')
  const [searchIndex, setSearchIndex]         = useState(initial.searchIndexing)
  const [showBanner, setShowBanner]           = useState(initial.bannerEnabled)
  const [bannerText, setBannerText]           = useState(initial.bannerText)
  const [siteOffline, setSiteOffline]         = useState(initial.siteOffline)
  const [saving, setSaving]                   = useState(false)
  const [takingOffline, setTakingOffline]     = useState(false)
  const [toast, setToast]                     = useState<string | null>(null)

  const daysLabel = initial.isExpired
    ? 'Expired'
    : initial.daysRemaining != null
      ? `${initial.daysRemaining} day${initial.daysRemaining === 1 ? '' : 's'} remaining`
      : '—'

  function flashToast(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3000)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/website-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_password_enabled:    passwordProtect,
          ...(passwordProtect && sitePassword.trim() ? { website_password: sitePassword.trim() } : {}),
          search_indexing_enabled:     searchIndex,
          announcement_banner_enabled: showBanner,
          announcement_banner_text:    bannerText || null,
          site_offline:                siteOffline,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        flashToast((err as { error?: string }).error ?? 'Failed to save — please try again')
      } else {
        setSitePassword('')
        flashToast('Website settings saved')
      }
    } catch {
      flashToast('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleOffline() {
    const next = !siteOffline
    setTakingOffline(true)
    try {
      const res = await fetch(`/api/events/${eventId}/website-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_offline: next }),
      })
      if (!res.ok) {
        flashToast('Failed to update — please try again')
      } else {
        setSiteOffline(next)
        flashToast(next ? 'Site taken offline' : 'Site is back online')
      }
    } catch {
      flashToast('Network error — please try again')
    } finally {
      setTakingOffline(false)
    }
  }

  return (
    <>
      <div className="es-content">
        <header className="es-content-head">
          <div>
            <h1 className="es-content-title">Website settings</h1>
            <p className="es-content-lead">Control how your event website looks, behaves, and reaches the right people.</p>
          </div>
          <div className="es-content-actions">
            <button
              type="button"
              className={`btn-pill btn-pill-primary${saving ? ' is-loading' : ''}`}
              onClick={handleSave}
              disabled={saving}
              aria-busy={saving}
            >
              <span aria-hidden="true" className="material-symbols-outlined">save</span>
              Save changes
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
          </div>
        </header>

        {/* Countdown banner */}
        <section className="es-section es-section--highlight">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">schedule</span>
              Website expiry countdown
            </h2>
            <span className={`es-section-tag${initial.isExpired ? ' is-danger' : ''}`}>{daysLabel}</span>
          </header>
          <p className="es-section-sub">Your event website stays online for 60 days after the event date. Renew anytime from <strong>Plan &amp; billing</strong> to keep your photos &amp; memories on a custom URL.</p>
        </section>

        {/* Privacy & access */}
        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">lock</span>
              Privacy &amp; access
            </h2>
            <p className="es-section-sub">Decide who can view your event page and how they verify their access.</p>
          </header>
          <div className="es-toggle-row">
            <div className="es-toggle-body">
              <span className="es-toggle-title">Password protect website</span>
              <span className="es-toggle-desc">Visitors enter a password before they can see your event details.</span>
            </div>
            <button type="button" className="toggle-switch" role="switch" aria-checked={passwordProtect} aria-label="Password protect website" onClick={() => setPasswordProtect(v => !v)}>
              <span className="toggle-switch-thumb" aria-hidden="true" />
            </button>
          </div>
          {passwordProtect && (
            <div className="form-group es-field-spaced">
              <label className="form-label" htmlFor="es-site-password">New website password</label>
              <input
                id="es-site-password"
                type="text"
                className="form-input"
                maxLength={40}
                autoComplete="off"
                placeholder="Enter a new password to update it"
                value={sitePassword}
                onChange={(e) => setSitePassword(e.target.value)}
              />
              <p className="form-helper">Leave blank to keep the current password. Tip — use a short word your families can remember.</p>
            </div>
          )}
        </section>

        {/* Search engine indexing */}
        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">search</span>
              Search engine indexing
            </h2>
            <p className="es-section-sub">Allow Google &amp; other search engines to index your website &amp; help guests find it.</p>
          </header>
          <div className="es-toggle-row">
            <div className="es-toggle-body">
              <span className="es-toggle-title">Allow search indexing</span>
              <span className="es-toggle-desc">Off by default for privacy — turn on for public, ticketed events.</span>
            </div>
            <button type="button" className="toggle-switch" role="switch" aria-checked={searchIndex} aria-label="Allow search indexing" onClick={() => setSearchIndex(v => !v)}>
              <span className="toggle-switch-thumb" aria-hidden="true" />
            </button>
          </div>
        </section>

        {/* Manage website content */}
        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">web</span>
              Website content
            </h2>
            <p className="es-section-sub">Pages, design, and photos live in the website editor — not here.</p>
          </header>
          <a href={`/events/${eventId}/website`} className="btn-pill btn-pill-secondary es-btn-self">
            <span aria-hidden="true" className="material-symbols-outlined">arrow_forward</span>
            Manage your website
          </a>
        </section>

        {/* Announcement banner */}
        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">campaign</span>
              Announcement banner
            </h2>
            <p className="es-section-sub">Show a short message at the top of your website — venue updates, weather notes, dress code.</p>
          </header>
          <div className="es-toggle-row">
            <div className="es-toggle-body">
              <span className="es-toggle-title">Display announcement banner</span>
              <span className="es-toggle-desc">Visible to all visitors on every page.</span>
            </div>
            <button type="button" className="toggle-switch" role="switch" aria-checked={showBanner} aria-label="Display announcement banner" onClick={() => setShowBanner(v => !v)}>
              <span className="toggle-switch-thumb" aria-hidden="true" />
            </button>
          </div>
          <div className="form-group es-field-spaced">
            <label className="form-label" htmlFor="es-banner-text">Banner text</label>
            <textarea
              id="es-banner-text"
              className="form-textarea"
              maxLength={160}
              placeholder="e.g. Outdoor ceremony — please bring sunglasses"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
            />
            <p className="form-helper">Keep it under 160 characters for clean mobile rendering.</p>
          </div>
        </section>

        {/* Take website offline */}
        <section className="es-section is-danger">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">power_off</span>
              Take website offline
            </h2>
            <p className="es-section-sub">Temporarily hide the public website. RSVPs, photos, and admin views stay accessible.</p>
          </header>
          <div className="es-toggle-row is-danger">
            <div className="es-toggle-body">
              <span className="es-toggle-title">Make site visible only to admins</span>
              <span className="es-toggle-desc">
                {siteOffline
                  ? 'Your site is currently offline — guests cannot access it.'
                  : 'Hide your event page from anyone without admin access.'}
              </span>
            </div>
            <button
              type="button"
              className={`btn-pill btn-pill-danger${takingOffline ? ' is-loading' : ''}`}
              onClick={handleToggleOffline}
              disabled={takingOffline}
              aria-busy={takingOffline}
            >
              <span aria-hidden="true" className="material-symbols-outlined">
                {siteOffline ? 'power' : 'power_settings_new'}
              </span>
              {siteOffline ? 'Bring back online' : 'Take offline'}
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
          </div>
        </section>

      </div>

      <div className={`bc-toast${toast ? ' is-show' : ''}`} role="status" aria-live="polite">
        <span className="bc-live" aria-hidden="true" />
        <span>{toast ?? ''}</span>
      </div>
    </>
  )
}
