'use client'

export function RegistryContent() {
  return (
    <>
      <div className="es-content">
        <header className="es-content-head">
          <div>
            <h1 className="es-content-title">Registry settings</h1>
            <p className="es-content-lead">Registry and cash-fund support is coming soon — check back after launch.</p>
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
                  disabled
                  title="Registry links — coming soon"
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
                  defaultValue="View our registry"
                  disabled
                  title="Registry links — coming soon"
                />
                <p className="form-helper">This is what guests see on your event page.</p>
              </div>
              <button
                type="button"
                className="btn-pill btn-pill-primary es-btn-self"
                disabled
                title="Registry links — coming soon"
                aria-label="Add link (coming soon)"
              >
                <span aria-hidden="true" className="material-symbols-outlined">add_link</span>
                Add link
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
                    disabled
                    title="Cash funds — coming soon"
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
                      disabled
                      title="Cash funds — coming soon"
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
                    disabled
                    title="Cash funds — coming soon"
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn-pill btn-pill-primary es-btn-self"
                disabled
                title="Cash funds — coming soon"
                aria-label="Create fund (coming soon)"
              >
                <span aria-hidden="true" className="material-symbols-outlined">add</span>
                Create fund
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
                <span className="es-preview-muted">Coming soon</span>
              </p>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
