'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'

export function WebsitePhotosClient({ eventId }: { eventId: string }) {
  const coverInputRef  = useRef<HTMLInputElement>(null)
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
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <p className="text-xs font-display font-bold tracking-[0.35em] text-brand mb-1">GALLERY</p>
          <h2 className="font-display font-bold text-xl text-ink">Website gallery</h2>
        </div>
        <input ref={galleryInputRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleFiles} />
        <button type="button" className="btn-pill btn-pill-primary" onClick={() => galleryInputRef.current?.click()}>
          <span aria-hidden="true" className="material-symbols-outlined">upload</span>
          Upload photos
        </button>
      </div>

      {/* Cover photo */}
      <div className="mb-8">
        <p className="text-xs font-display font-bold tracking-[0.3em] text-muted uppercase mb-3">Cover photo</p>
        <input ref={coverInputRef} type="file" accept="image/*" className="sr-only" onChange={handleFiles} />
        <button
          type="button"
          className="w-full h-48 rounded-3xl bg-line-soft border-2 border-dashed border-line flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-brand/40 transition-colors"
          onClick={() => coverInputRef.current?.click()}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-3xl text-muted">add_photo_alternate</span>
          <p className="text-sm font-display font-semibold text-muted">Click to set cover photo</p>
        </button>
      </div>

      {/* Gallery photos */}
      <div>
        <p className="text-xs font-display font-bold tracking-[0.3em] text-muted uppercase mb-3">Gallery photos</p>
        <div className="empty-cta-card">
          <span className="empty-cta-icon" aria-hidden="true"><span className="material-symbols-outlined">collections</span></span>
          <p className="empty-cta-title">No gallery photos yet</p>
          <p className="empty-cta-sub">Upload photos to display in the gallery section of your event website.</p>
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
      </div>

      <div className={`bc-toast${toast ? ' is-show' : ''}`} role="status" aria-live="polite">
        <span className="bc-live" aria-hidden="true" />
        <span>{toast ?? ''}</span>
      </div>
    </>
  )
}
