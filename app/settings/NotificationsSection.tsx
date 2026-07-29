'use client'

import { useState } from 'react'

type ToastTone = 'success' | 'error'
interface ToastState { message: string; tone: ToastTone }

interface Props {
  emailAlerts: boolean
  pushNotifications: boolean
  smsAlerts: boolean
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

export function NotificationsSection({ emailAlerts, pushNotifications, smsAlerts }: Props): React.ReactElement {
  const [state, setState] = useState({
    email_alerts: emailAlerts,
    push_notifications: pushNotifications,
    sms_alerts: smsAlerts,
  })
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<ToastState | null>(null)

  function flashToast(message: string, tone: ToastTone): void {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 3000)
  }

  async function toggle(key: ChoiceCardDef['key']): Promise<void> {
    if (pending[key]) return
    const next = !state[key]
    setPending((p) => ({ ...p, [key]: true }))
    setState((s) => ({ ...s, [key]: next })) // optimistic

    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: next }),
      })
      if (!res.ok) {
        setState((s) => ({ ...s, [key]: !next })) // revert on failure
        flashToast('Could not save preference.', 'error')
      }
    } catch {
      setState((s) => ({ ...s, [key]: !next }))
      flashToast('Could not save preference.', 'error')
    } finally {
      setPending((p) => ({ ...p, [key]: false }))
    }
  }

  return (
    <section id="notifications" className="settings-section reveal">
      <header className="settings-section-head">
        <h2 className="section-rule">
          <span className="section-rule-bar" aria-hidden="true" />
          Notification preferences
        </h2>
      </header>
      <div className="notif-prefs-grid">
        {CARDS.map((card) => {
          const active = state[card.key]
          return (
            <button
              key={card.key}
              type="button"
              className={`choice-card${active ? ' is-active' : ''}`}
              aria-pressed={active}
              disabled={pending[card.key]}
              onClick={() => { void toggle(card.key) }}
            >
              <span className="choice-card-icon" aria-hidden="true">
                <span className="material-symbols-outlined">{card.icon}</span>
              </span>
              <h3 className="choice-card-title">{card.title}</h3>
              <p className="choice-card-desc">{card.desc}</p>
              <span className="choice-card-state">
                <span className="choice-card-dot" aria-hidden="true">
                  <span className="material-symbols-outlined">check</span>
                </span>
                <span>{active ? 'Active' : 'Inactive'}</span>
              </span>
            </button>
          )
        })}
      </div>
      {toast && <p className={`mt-3 text-sm ${toast.tone === 'success' ? 'text-brand' : 'text-error'}`}>{toast.message}</p>}
    </section>
  )
}
