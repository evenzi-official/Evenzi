'use client'

import { useEffect, useState } from 'react'
import { urlBase64ToUint8Array } from '@/lib/notifications/urlBase64ToUint8Array'

type ToastTone = 'success' | 'error'
interface ToastState { message: string; tone: ToastTone }

interface Props {
  emailAlerts: boolean
  pushNotifications: boolean
  smsAlerts: boolean
  /** Server-passed VAPID public key — more reliable than NEXT_PUBLIC_* client inlining after mid-session env adds. */
  vapidPublicKey: string | null
}

interface ChoiceCardDef {
  key: 'email_alerts' | 'push_notifications' | 'sms_alerts'
  icon: string
  title: string
  desc: string
}

const CARDS: ChoiceCardDef[] = [
  { key: 'email_alerts', icon: 'mail', title: 'Email alerts', desc: 'Detailed event reports and guest list updates delivered to your inbox.' },
  { key: 'push_notifications', icon: 'notifications_active', title: 'Push notifications', desc: 'Real-time alerts for incoming RSVPs, vendor messages, and approvals.' },
  { key: 'sms_alerts', icon: 'sms', title: 'SMS alerts', desc: 'Critical day-of-event timing reminders sent to your mobile.' },
]

async function patchPreference(key: ChoiceCardDef['key'], value: boolean): Promise<boolean> {
  const res = await fetch('/api/settings/notifications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [key]: value }),
  })
  return res.ok
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error(`${label} timed out`)), ms)
    promise.then(
      (v) => { window.clearTimeout(t); resolve(v) },
      (e) => { window.clearTimeout(t); reject(e) },
    )
  })
}

async function enablePushSubscription(vapidPublic: string): Promise<void> {
  if (!vapidPublic) {
    throw new Error('Missing VAPID public key')
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push not supported in this browser')
  }

  // Drop a broken SW if middleware previously served /auth HTML as the script.
  const existing = await navigator.serviceWorker.getRegistration()
  if (existing) {
    try {
      const scriptUrl = existing.active?.scriptURL ?? existing.installing?.scriptURL ?? existing.waiting?.scriptURL
      if (scriptUrl && !scriptUrl.endsWith('/sw.js')) {
        await existing.unregister()
      }
    } catch {
      // continue and re-register
    }
  }

  let registration = await navigator.serviceWorker.getRegistration()
  if (!registration) {
    registration = await withTimeout(
      navigator.serviceWorker.register('/sw.js'),
      15_000,
      'Service worker register',
    )
  }
  registration = await withTimeout(navigator.serviceWorker.ready, 15_000, 'Service worker ready')

  const subscription = await withTimeout(
    registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublic) as BufferSource,
    }),
    20_000,
    'Push subscribe',
  )

  const json = subscription.toJSON()
  const endpoint = json.endpoint
  const p256dh = json.keys?.p256dh
  const auth = json.keys?.auth

  if (!endpoint || !p256dh || !auth) {
    throw new Error('Incomplete push subscription')
  }

  const res = await fetch('/api/notifications/push-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, p256dh, auth }),
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(errBody.error ?? `Subscribe failed (${res.status})`)
  }
}

async function disablePushSubscription(): Promise<void> {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (subscription) {
    const endpoint = subscription.endpoint
    try {
      await subscription.unsubscribe()
    } catch {
      // Continue to DELETE even if unsubscribe fails locally
    }

    const res = await fetch('/api/notifications/push-subscription', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    })

    if (!res.ok && res.status !== 404) {
      throw new Error('Failed to remove push subscription')
    }
  }
}

async function browserHasPushSubscription(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return Boolean(subscription)
  } catch {
    return false
  }
}

export function NotificationsSection({
  emailAlerts,
  pushNotifications,
  smsAlerts,
  vapidPublicKey,
}: Props): React.ReactElement {
  // Pref can be true in DB with no device subscription (defaults + never granted).
  // UI "Active" means this browser is actually subscribed.
  const [state, setState] = useState({
    email_alerts: emailAlerts,
    push_notifications: false,
    sms_alerts: smsAlerts,
  })
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<ToastState | null>(null)
  const [pushBlocked, setPushBlocked] = useState(false)
  const [pushReady, setPushReady] = useState(false)

  useEffect(() => {
    void (async () => {
      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
        setPushBlocked(true)
        setPushReady(true)
        return
      }
      const subscribed = await browserHasPushSubscription()
      setState((s) => ({
        ...s,
        // Only show Active when this device has a live PushManager subscription
        push_notifications: pushNotifications && subscribed,
      }))
      setPushReady(true)
    })()
  }, [pushNotifications])

  function flashToast(message: string, tone: ToastTone): void {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 3000)
  }

  async function toggleEmailOrSms(key: 'email_alerts' | 'sms_alerts'): Promise<void> {
    if (pending[key]) return
    const next = !state[key]
    setPending((p) => ({ ...p, [key]: true }))
    setState((s) => ({ ...s, [key]: next }))

    try {
      const ok = await patchPreference(key, next)
      if (!ok) {
        setState((s) => ({ ...s, [key]: !next }))
        flashToast('Could not save preference.', 'error')
      }
    } catch {
      setState((s) => ({ ...s, [key]: !next }))
      flashToast('Could not save preference.', 'error')
    } finally {
      setPending((p) => ({ ...p, [key]: false }))
    }
  }

  async function togglePush(): Promise<void> {
    const key = 'push_notifications'
    if (pending[key]) return

    const next = !state[key]

    if (next) {
      if (typeof Notification === 'undefined') {
        flashToast('Push not supported in this browser.', 'error')
        return
      }

      if (Notification.permission === 'denied') {
        setPushBlocked(true)
        flashToast('Push blocked in browser settings', 'error')
        return
      }

      setPending((p) => ({ ...p, [key]: true }))
      setState((s) => ({ ...s, [key]: true }))

      try {
        let permission: NotificationPermission = Notification.permission
        if (permission === 'default') {
          permission = await Notification.requestPermission()
        }

        if (permission !== 'granted') {
          setState((s) => ({ ...s, [key]: false }))
          if (permission === 'denied') {
            setPushBlocked(true)
            flashToast('Push blocked in browser settings', 'error')
          } else {
            flashToast('Could not enable push notifications.', 'error')
          }
          return
        }

        setPushBlocked(false)
        if (!vapidPublicKey) {
          throw new Error('Missing VAPID public key')
        }
        await enablePushSubscription(vapidPublicKey)
        const ok = await patchPreference(key, true)
        if (!ok) {
          setState((s) => ({ ...s, [key]: false }))
          flashToast('Could not save preference.', 'error')
        }
      } catch (err) {
        setState((s) => ({ ...s, [key]: false }))
        const msg = err instanceof Error ? err.message : ''
        if (/permission denied/i.test(msg)) {
          flashToast('Push blocked by the browser. Allow notifications for this site, then try again.', 'error')
        } else {
          const detail = msg ? ` (${msg})` : ''
          flashToast(`Could not enable push notifications.${detail}`, 'error')
        }
      } finally {
        setPending((p) => ({ ...p, [key]: false }))
      }
      return
    }

    // Turn OFF
    setPending((p) => ({ ...p, [key]: true }))
    setState((s) => ({ ...s, [key]: false }))

    try {
      await disablePushSubscription()
      const ok = await patchPreference(key, false)
      if (!ok) {
        setState((s) => ({ ...s, [key]: true }))
        flashToast('Could not save preference.', 'error')
      }
    } catch {
      setState((s) => ({ ...s, [key]: true }))
      flashToast('Could not disable push notifications.', 'error')
    } finally {
      setPending((p) => ({ ...p, [key]: false }))
    }
  }

  async function toggle(key: ChoiceCardDef['key']): Promise<void> {
    if (key === 'push_notifications') {
      await togglePush()
      return
    }
    await toggleEmailOrSms(key)
  }

  return (
    <section id="notifications" className="settings-section reveal" data-vapid={vapidPublicKey ?? ''}>
      <header className="settings-section-head">
        <h2 className="section-rule">
          <span className="section-rule-bar" aria-hidden="true" />
          Notification preferences
        </h2>
      </header>
      <div className="notif-prefs-grid">
        {CARDS.map((card) => {
          const active = state[card.key]
          const isPush = card.key === 'push_notifications'
          const blocked = isPush && pushBlocked
          const pushPendingHydrate = isPush && !pushReady
          return (
            <button
              key={card.key}
              type="button"
              className={`choice-card${active ? ' is-active' : ''}${blocked ? ' is-blocked' : ''}`}
              aria-pressed={active}
              aria-disabled={blocked ? true : undefined}
              disabled={pending[card.key] || pushPendingHydrate}
              onClick={() => { void toggle(card.key) }}
            >
              <span className="choice-card-icon" aria-hidden="true">
                <span className="material-symbols-outlined">{card.icon}</span>
              </span>
              <h3 className="choice-card-title">{card.title}</h3>
              <p className="choice-card-desc">
                {blocked
                  ? 'Blocked in browser settings. Enable notifications for this site to turn push back on.'
                  : card.desc}
              </p>
              <span className="choice-card-state">
                <span className="choice-card-dot" aria-hidden="true">
                  <span className="material-symbols-outlined">
                    {blocked ? 'block' : 'check'}
                  </span>
                </span>
                <span>{blocked ? 'Blocked' : active ? 'Active' : 'Inactive'}</span>
              </span>
            </button>
          )
        })}
      </div>
      {toast && <p className={`mt-3 text-sm ${toast.tone === 'success' ? 'text-brand' : 'text-error'}`}>{toast.message}</p>}
    </section>
  )
}
