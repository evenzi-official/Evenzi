'use client'

import { useState, type ReactElement } from 'react'

type Device = 'mobile' | 'desktop'

export function LivePreviewCard({
  liveUrl,
}: {
  liveUrl: string | null
}): ReactElement {
  const [device, setDevice] = useState<Device>('mobile')

  return (
    <section className="clay-card dp-card" aria-labelledby="dp-prev-h">
      <header className="dp-card-head">
        <div>
          <h2 id="dp-prev-h" className="dp-card-title">Live preview</h2>
          <p className="dp-card-sub">What guests see when they open your site</p>
        </div>
        <div className="device-toggle" role="radiogroup" aria-label="Preview device">
          <button
            type="button"
            className={`device-toggle-btn${device === 'mobile' ? ' is-active' : ''}`}
            role="radio"
            aria-checked={device === 'mobile'}
            aria-label="Mobile preview"
            onClick={() => setDevice('mobile')}
          >
            <span className="material-symbols-outlined" aria-hidden="true">phone_iphone</span>
          </button>
          <button
            type="button"
            className={`device-toggle-btn${device === 'desktop' ? ' is-active' : ''}`}
            role="radio"
            aria-checked={device === 'desktop'}
            aria-label="Desktop preview"
            onClick={() => setDevice('desktop')}
          >
            <span className="material-symbols-outlined" aria-hidden="true">desktop_windows</span>
          </button>
        </div>
      </header>

      <div className="dp-preview-stage" data-device-stage={device}>
        <div className="dp-preview-frame" aria-label="Live preview of your event website">
          <div className="dp-preview-screen">
            {liveUrl ? (
              <iframe
                src={liveUrl}
                title="Live preview of your event website"
                className="block h-full w-full border-0 bg-white"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
                <span className="material-symbols-outlined text-muted" aria-hidden="true">link_off</span>
                <p className="font-display text-sm font-semibold text-ink">No site URL yet</p>
                <p className="text-xs text-muted">Set one in Website Settings to preview what guests will see.</p>
              </div>
            )}
          </div>
        </div>
        <p className="dp-preview-caption">
          <span className="material-symbols-outlined" aria-hidden="true">info</span>
          Public hero shows to anyone with the link. Private details unlock with phone match or password.
        </p>
      </div>
    </section>
  )
}
