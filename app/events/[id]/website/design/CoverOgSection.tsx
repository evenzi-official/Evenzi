'use client'

import { useRef, useState } from 'react'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif'

export default function CoverOgSection({
  eventId,
  coverPreviewUrl: initialCoverUrl,
  ogPreviewUrl: initialOgUrl,
  hasCover: initialHasCover,
  hasCustomOg: initialHasOg,
}: {
  eventId: string
  coverPreviewUrl: string | null
  ogPreviewUrl: string | null
  hasCover: boolean
  hasCustomOg: boolean
}) {
  const coverInput = useRef<HTMLInputElement>(null)
  const ogInput = useRef<HTMLInputElement>(null)
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl)
  const [ogUrl, setOgUrl] = useState(initialOgUrl)
  const [hasCover, setHasCover] = useState(initialHasCover)
  const [customOg, setCustomOg] = useState(initialHasOg)
  const [busy, setBusy] = useState<'cover' | 'og' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function upload(purpose: 'cover' | 'og', file: File): Promise<string | null> {
    setBusy(purpose)
    setError(null)
    try {
      const presign = await fetch(`/api/events/${eventId}/website-design/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose, contentType: file.type }),
      })
      if (!presign.ok) throw new Error('Could not start upload')
      const { url, key } = (await presign.json()) as { url: string; key: string }

      const put = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!put.ok) throw new Error('Upload failed')

      const commit = await fetch(`/api/events/${eventId}/website-design/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose, key, contentType: file.type }),
      })
      if (!commit.ok) throw new Error('Could not save image')
      const data = (await commit.json()) as { previewUrl?: string }
      return data.previewUrl ?? URL.createObjectURL(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      return null
    } finally {
      setBusy(null)
    }
  }

  async function onCover(file: File | undefined) {
    if (!file) return
    const preview = await upload('cover', file)
    if (preview) {
      setCoverUrl(preview)
      setHasCover(true)
    }
  }

  async function onOg(file: File | undefined) {
    if (!file) return
    const preview = await upload('og', file)
    if (preview) setOgUrl(preview)
  }

  async function toggleCustomOg() {
    const next = !customOg
    setCustomOg(next)
    if (next) return
    try {
      await fetch(`/api/events/${eventId}/website-design`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ og_image_key: null }),
      })
      setOgUrl(null)
    } catch {
      setCustomOg(true)
    }
  }

  return (
    <section className="clay-card dp-card reveal mt-6" id="cover" aria-labelledby="dp-cov-h">
      <header className="dp-card-head">
        <div>
          <h2 id="dp-cov-h" className="dp-card-title">Cover &amp; social-share image</h2>
          <p className="dp-card-sub">Cover appears on the hero. Social-share is what WhatsApp and Instagram show.</p>
        </div>
      </header>

      <input
        ref={coverInput}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => { void onCover(e.target.files?.[0]); e.target.value = '' }}
      />
      <input
        ref={ogInput}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => { void onOg(e.target.files?.[0]); e.target.value = '' }}
      />

      <div className="dp-cover-block">
        <div className="dp-cover-preview" data-cover-state={hasCover && coverUrl ? 'loaded' : 'empty'} aria-label="Current cover image">
          {hasCover && coverUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl} alt="Cover photo" />
              <button
                type="button"
                className="dp-cover-replace"
                onClick={() => coverInput.current?.click()}
                disabled={busy === 'cover'}
                aria-label="Replace cover photo"
              >
                <span className="material-symbols-outlined" aria-hidden="true">add_photo_alternate</span>
                {busy === 'cover' ? 'Uploading…' : 'Replace cover'}
              </button>
            </>
          ) : (
            <div className="dp-cover-empty">
              <span className="material-symbols-outlined" aria-hidden="true">add_photo_alternate</span>
              <p className="dp-cover-empty-title">Add a cover photo</p>
              <p className="dp-cover-empty-hint">Recommend 1600 × 900 · crop-on-upload coming later</p>
              <button
                type="button"
                className="btn-pill btn-pill-primary btn-pill-sm"
                onClick={() => coverInput.current?.click()}
                disabled={busy === 'cover'}
              >
                <span className="material-symbols-outlined" aria-hidden="true">upload</span>
                {busy === 'cover' ? 'Uploading…' : 'Upload cover'}
              </button>
            </div>
          )}
        </div>
        <p className="dp-cover-meta">
          <span className="material-symbols-outlined dp-cover-meta-icon" aria-hidden="true">photo</span>
          Upload only for now — crop UI coming later.
        </p>
      </div>

      <hr className="section-rule" />

      <div className="dp-og-block">
        <div className="dp-og-toggle-row">
          <div className="dp-og-toggle-meta">
            <span className="dp-og-toggle-label" id="dp-og-toggle-lbl">Use a custom social-share image</span>
            <span className="dp-og-toggle-hint" id="dp-og-toggle-hint">Off = we derive from your cover.</span>
          </div>
          <button
            type="button"
            className="toggle-switch"
            role="switch"
            aria-checked={customOg}
            aria-labelledby="dp-og-toggle-lbl"
            aria-describedby="dp-og-toggle-hint"
            onClick={() => { void toggleCustomOg() }}
          >
            <span className="toggle-switch-thumb" aria-hidden="true" />
          </button>
        </div>

        {!customOg ? (
          <>
            <div className="dp-og-preview" data-dp-og-state="auto">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt="Social share preview (auto-derived from cover)" />
              ) : (
                <div className="dp-cover-empty" style={{ minHeight: 120 }}>
                  <p className="dp-cover-empty-hint">Upload a cover to preview the share image.</p>
                </div>
              )}
            </div>
            <p className="dp-og-caption">
              <span className="material-symbols-outlined" aria-hidden="true">auto_awesome</span>
              Auto-derived from your cover
            </p>
          </>
        ) : (
          <>
            <div className="dp-og-preview" data-dp-og-state="custom">
              {ogUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ogUrl} alt="Custom social-share image" />
              ) : (
                <div className="dp-cover-empty" style={{ minHeight: 140 }}>
                  <p className="dp-cover-empty-title">Add a share image</p>
                  <button
                    type="button"
                    className="btn-pill btn-pill-primary btn-pill-sm"
                    onClick={() => ogInput.current?.click()}
                    disabled={busy === 'og'}
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">upload</span>
                    {busy === 'og' ? 'Uploading…' : 'Upload image'}
                  </button>
                </div>
              )}
            </div>
            {ogUrl ? (
              <p className="dp-og-caption">
                <button type="button" className="btn-pill btn-pill-secondary btn-pill-sm" onClick={() => ogInput.current?.click()} disabled={busy === 'og'}>
                  Replace
                </button>
              </p>
            ) : null}
          </>
        )}
      </div>

      {error ? <p className="form-error mt-3">{error}</p> : null}
    </section>
  )
}
