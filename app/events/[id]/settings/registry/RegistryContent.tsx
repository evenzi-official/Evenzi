'use client'

import { useState } from 'react'

export function RegistryContent() {
  const [registryUrl, setRegistryUrl]       = useState('')
  const [registryLabel, setRegistryLabel]   = useState('View our registry')
  const [fundName, setFundName]             = useState('')
  const [fundGoal, setFundGoal]             = useState('')
  const [fundMessage, setFundMessage]       = useState('')
  const [savingLink, setSavingLink]         = useState(false)
  const [savingFund, setSavingFund]         = useState(false)
  const [toast, setToast]                   = useState<string | null>(null)

  function flashToast(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3000)
  }

  function handleSaveLink() {
    setSavingLink(true)
    window.setTimeout(() => { setSavingLink(false); flashToast('Registry link saved') }, 900)
  }

  function handleSaveFund() {
    setSavingFund(true)
    window.setTimeout(() => { setSavingFund(false); flashToast('Cash fund created') }, 900)
  }

  return (
    <>
      <div className="es-content">
        <header className="es-content-head">
          <div>
            <h1 className="es-content-title">Registry settings</h1>
            <p className="es-content-lead">Add an external registry, set up a cash fund, or do both. Guests pick the option they prefer.</p>
          </div>
        </header>

        <div className="es-registry-grid">
          <div className="es-registry-stack">

            {/* Link external registry */}
            <section className="es-section">
              <header className="es-section-head">
                <h2 className="es-section-title">
                  <span aria-hidden="true" className="material-symbols-outlined icon-fill">link</span>
                  Link external registry
                </h2>
                <p className="es-section-sub">Already set up on Amazon, Zola, or another service? Paste your registry URL — we&apos;ll embed a button on your event website.</p>
              </header>
              <div className="form-group">
                <label className="form-label" htmlFor="es-registry-url">Registry URL</label>
                <input
                  id="es-registry-url"
                  type="url"
                  className="form-input"
                  placeholder="https://www.amazon.com/wedding/registry/..."
                  autoComplete="off"
                  value={registryUrl}
                  onChange={(e) => setRegistryUrl(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="es-registry-label">Button label</label>
                <input
                  id="es-registry-label"
                  type="text"
                  className="form-input"
                  maxLength={40}
                  autoComplete="off"
                  value={registryLabel}
                  onChange={(e) => setRegistryLabel(e.target.value)}
                />
                <p className="form-helper">This is what guests see on your event page.</p>
              </div>
              <button
                type="button"
                className={`btn-pill btn-pill-primary es-btn-self${savingLink ? ' is-loading' : ''}`}
                onClick={handleSaveLink}
                disabled={savingLink}
                aria-busy={savingLink}
              >
                <span aria-hidden="true" className="material-symbols-outlined">add_link</span>
                Add link
                <span aria-hidden="true" className="btn-pill-spinner" />
              </button>
            </section>

            {/* Cash fund */}
            <section className="es-section">
              <header className="es-section-head">
                <h2 className="es-section-title">
                  <span aria-hidden="true" className="material-symbols-outlined icon-fill">savings</span>
                  Create a cash fund
                </h2>
                <p className="es-section-sub">Let guests contribute directly to a goal — honeymoon, home, education. Payouts via UPI or bank transfer.</p>
              </header>
              <div className="es-field-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="es-fund-name">Fund name</label>
                  <input
                    id="es-fund-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Honeymoon Fund"
                    maxLength={40}
                    autoComplete="off"
                    value={fundName}
                    onChange={(e) => setFundName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="es-fund-goal">Goal (₹, optional)</label>
                  <div className="form-input form-input-group">
                    <span className="form-input-prefix" aria-hidden="true">₹</span>
                    <input
                      id="es-fund-goal"
                      type="number"
                      min={0}
                      inputMode="numeric"
                      className="form-input-field"
                      placeholder="200000"
                      autoComplete="off"
                      value={fundGoal}
                      onChange={(e) => setFundGoal(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group is-full">
                  <label className="form-label" htmlFor="es-fund-message">Message for guests</label>
                  <textarea
                    id="es-fund-message"
                    className="form-textarea"
                    maxLength={200}
                    placeholder="Your gift helps us create memories that last a lifetime."
                    value={fundMessage}
                    onChange={(e) => setFundMessage(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="button"
                className={`btn-pill btn-pill-primary es-btn-self${savingFund ? ' is-loading' : ''}`}
                onClick={handleSaveFund}
                disabled={savingFund}
                aria-busy={savingFund}
              >
                <span aria-hidden="true" className="material-symbols-outlined">add</span>
                Create fund
                <span aria-hidden="true" className="btn-pill-spinner" />
              </button>
            </section>
          </div>

          {/* Guest view preview */}
          <div className="es-preview-card">
            <p className="es-preview-eyebrow">Guest view preview</p>
            <p className="es-preview-title">Registry section</p>
            <p className="es-preview-body">This is what your guests will see on the event website&apos;s <strong>Registry</strong> tab.</p>
            <div className="es-preview-box">
              <span className="material-symbols-outlined icon-fill" aria-hidden="true">redeem</span>
              <p>
                Empty preview<br />
                <span className="es-preview-muted">Save a registry above to populate</span>
              </p>
            </div>
          </div>
        </div>

        <footer className="es-footer">
          <span>© 2026 Evenzi · All rights reserved</span>
          <div className="es-footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Help</a>
          </div>
        </footer>
      </div>

      {/* Toast */}
      <div className={`bc-toast${toast ? ' is-show' : ''}`} role="status" aria-live="polite">
        <span className="bc-live" aria-hidden="true" />
        <span>{toast ?? ''}</span>
      </div>
    </>
  )
}
