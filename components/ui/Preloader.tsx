'use client'

import { useEffect, useState } from 'react'

type Phase = 'show' | 'hiding' | 'done'

/**
 * Full-screen brand preloader shown on the initial app load.
 * Mounted once in the root layout — because the layout doesn't remount on
 * client-side navigation, it only appears on a real page load / refresh.
 * Fades out once the window has loaded (with a small minimum display time),
 * then removes itself from the DOM.
 */
export function Preloader(): React.JSX.Element | null {
  const [phase, setPhase] = useState<Phase>('show')

  useEffect(() => {
    const MIN_MS = 1100
    const start = performance.now()

    function beginHide(): void {
      const wait = Math.max(0, MIN_MS - (performance.now() - start))
      window.setTimeout(() => setPhase('hiding'), wait)
    }

    if (document.readyState === 'complete') {
      beginHide()
      return
    }
    window.addEventListener('load', beginHide, { once: true })
    const fallback = window.setTimeout(beginHide, 4000) // never hang the splash
    return () => {
      window.removeEventListener('load', beginHide)
      window.clearTimeout(fallback)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'hiding') return
    const t = window.setTimeout(() => setPhase('done'), 600) // matches CSS fade
    return () => window.clearTimeout(t)
  }, [phase])

  if (phase === 'done') return null

  return (
    <div className={`preloader${phase === 'hiding' ? ' is-hiding' : ''}`} role="status" aria-label="Loading Evenzi">
      <div className="preloader-inner">
        <span className="preloader-logo">EVENZI</span>
        <span className="preloader-bar" aria-hidden="true">
          <span className="preloader-bar-fill" />
        </span>
        <span className="preloader-tag">CAPTURE · SHARE · CHERISH</span>
      </div>
    </div>
  )
}
