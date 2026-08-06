/* Evenzi service worker — browser push (Phase B) */

const EVENT_LINK_RE = /^\/events\/[0-9a-f-]{36}(\/[a-zA-Z0-9/_-]*)?$/

self.addEventListener('push', (event) => {
  let title = 'Evenzi'
  let body = ''
  let linkPath = null

  try {
    const data = event.data ? event.data.json() : {}
    if (typeof data.title === 'string' && data.title) title = data.title
    if (typeof data.body === 'string') body = data.body
    if (typeof data.linkPath === 'string') linkPath = data.linkPath
  } catch {
    // Non-JSON payload — show defaults
  }

  const options = {
    body,
    data: { linkPath },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const linkPath =
    event.notification &&
    event.notification.data &&
    event.notification.data.linkPath

  if (typeof linkPath !== 'string' || !EVENT_LINK_RE.test(linkPath)) {
    return
  }

  const targetUrl = new URL(linkPath, self.location.origin).href

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      for (const client of clientsList) {
        if (client.url === targetUrl && 'focus' in client) {
          await client.focus()
          return
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl)
      }
    })()
  )
})
