'use client'

import { useState } from 'react'

export function HelpFeedbackRow({
  articleSlug,
}: {
  articleSlug: string
}): React.ReactElement {
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  async function send(helpful: boolean): Promise<void> {
    if (pending || done) return
    setPending(true)
    try {
      await fetch('/api/help/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleSlug, helpful }),
      })
    } catch {
      // Still acknowledge — feedback is best-effort.
    } finally {
      setDone(true)
      setPending(false)
      if (!helpful) {
        document.getElementById('help-contact-band')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
    }
  }

  if (done) {
    return (
      <p className="m-0 text-xs text-[var(--muted)]" role="status">
        Thanks — noted.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="m-0 text-xs text-[var(--muted)]">Was this helpful?</p>
      <button
        type="button"
        className="btn-pill btn-pill-ghost btn-pill-sm"
        disabled={pending}
        onClick={() => void send(true)}
      >
        <span aria-hidden="true" className="material-symbols-outlined">
          thumb_up
        </span>
        Yes
      </button>
      <button
        type="button"
        className="btn-pill btn-pill-ghost btn-pill-sm"
        disabled={pending}
        onClick={() => void send(false)}
      >
        <span aria-hidden="true" className="material-symbols-outlined">
          thumb_down
        </span>
        No
      </button>
    </div>
  )
}
