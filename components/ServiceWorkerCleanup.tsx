'use client'

import { useEffect } from 'react'

export function ServiceWorkerCleanup(): null {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations
        .filter((registration) => registration.active?.scriptURL.endsWith('/sw.js'))
        .forEach((registration) => {
          void registration.unregister()
        })
    })

    void caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        void caches.delete(cacheName)
      })
    })
  }, [])

  return null
}
