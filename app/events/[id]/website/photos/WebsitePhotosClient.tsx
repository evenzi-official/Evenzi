'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'

export function WebsitePhotosClient({ eventId }: { eventId: string }) {
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [toast, setToast] = useState<string | null>(null)

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  function handleFiles() {
    flash('Website gallery upload is coming soon. For now, manage photos in your Media section.')
  }

  return (
    <>
      <div className="dp-tip-banner">
        <span className="material-symbols-outlined" aria-hidden="true">info</span>
        <span>
          These photos show on your website&apos;s <strong>Gallery</strong> page — not the site cover (that lives on Design).
          When Media &amp; Memories launches, shared albums will sync here automatically.
        </span>
      </div>

      <section className="clay-card dp-card dp-photos-card" data-photos-state="empty" aria-labelledby="ph-h">
        <header className="dp-card-head">
          <div>
            <h2 id="ph-h" className="dp-card-title">Gallery photos</h2>
            <p className="dp-card-sub">Guests see these on your Gallery page after they unlock your site.</p>
          </div>
          <div className="dp-card-head-aux">
            <input ref={galleryInputRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleFiles} />
            <button type="button" className="btn-pill btn-pill-primary" onClick={() => galleryInputRef.current?.click()}>
              <span aria-hidden="true" className="material-symbols-outlined">upload</span>
              Upload photos
            </button>
          </div>
        </header>

        <div className="empty-cta-card">
          <span className="empty-cta-icon" aria-hidden="true"><span className="material-symbols-outlined">collections</span></span>
          <p className="empty-cta-title">No gallery photos yet</p>
          <p className="empty-cta-sub">Website gallery upload is coming soon. Use Media for now — cover photos are set on the Design tab.</p>
          <div className="flex flex-wrap gap-3 justify-center mt-1">
            <button type="button" className="btn-pill btn-pill-secondary" onClick={() => galleryInputRef.current?.click()}>
              <span className="material-symbols-outlined" aria-hidden="true">upload</span>
              Upload photos
            </button>
            <Link href={`/events/${eventId}/media`} className="btn-pill btn-pill-ghost">
              <span className="material-symbols-outlined" aria-hidden="true">photo_library</span>
              Go to Media
            </Link>
          </div>
        </div>
      </section>

      <div className={`bc-toast${toast ? ' is-show' : ''}`} role="status" aria-live="polite">
        <span className="bc-live" aria-hidden="true" />
        <span>{toast ?? ''}</span>
      </div>
    </>
  )
}
