'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister(): null {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    void (async () => {
      try {
        const existing = await navigator.serviceWorker.getRegistration()
        const scriptUrl =
          existing?.active?.scriptURL ??
          existing?.installing?.scriptURL ??
          existing?.waiting?.scriptURL
        // Middleware used to redirect /sw.js → /auth; purge that broken registration.
        if (existing && scriptUrl && !scriptUrl.endsWith('/sw.js')) {
          await existing.unregister()
        }
        await navigator.serviceWorker.register('/sw.js')
      } catch (err: unknown) {
        console.error('Service worker registration failed:', err)
      }
    })()
  }, [])

  return null
}
