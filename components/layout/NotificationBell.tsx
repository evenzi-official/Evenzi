'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { formatRelativeTime } from '@/lib/notifications/relativeTime'
import type { AppNotification } from '@/lib/types/notifications'

const POLL_MS = 60_000

const ICONS: Record<string, string> = {
  rsvp_received: 'how_to_reg',
  collaborator_added: 'person_add',
  expense_recorded: 'payments',
  invites_sent: 'forward_to_inbox',
}

function notificationIcon(type: string): string {
  return ICONS[type] ?? 'notifications'
}

export function NotificationBell(): React.ReactElement {
  const router = useRouter()
  const titleId = useId()
  const bellRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})

  const fetchNotifications = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    try {
      setError(false)
      const res = await fetch('/api/notifications?limit=20')
      if (!res.ok) {
        setError(true)
        return
      }
      const data = (await res.json()) as { notifications: AppNotification[]; unreadCount: number }
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    void fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    const tick = (): void => {
      if (document.hidden || open) return
      void fetchNotifications({ silent: true })
    }
    const id = window.setInterval(tick, POLL_MS)
    return () => window.clearInterval(id)
  }, [open, fetchNotifications])

  useEffect(() => {
    if (open) void fetchNotifications({ silent: true })
  }, [open, fetchNotifications])

  const positionPanel = useCallback((): void => {
    const bell = bellRef.current
    const panel = panelRef.current
    if (!bell || !panel) return
    const rect = bell.getBoundingClientRect()
    const panelW = panel.offsetWidth
    let rightOffset = Math.max(12, window.innerWidth - rect.right)
    if (rightOffset + panelW > window.innerWidth - 12) rightOffset = 12
    setPanelStyle({
      top: rect.bottom + 8,
      right: rightOffset,
    })
  }, [])

  useEffect(() => {
    if (!open) return
    positionPanel()
    window.addEventListener('resize', positionPanel)
    return () => window.removeEventListener('resize', positionPanel)
  }, [open, positionPanel, notifications.length, loading, error])

  const close = useCallback((): void => {
    setOpen(false)
    bellRef.current?.focus()
  }, [])

  const toggle = useCallback((e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    setOpen((prev) => !prev)
  }, [])

  useEffect(() => {
    if (!open) return

    const onClick = (e: MouseEvent): void => {
      const target = e.target as Node
      if (panelRef.current?.contains(target) || bellRef.current?.contains(target)) return
      close()
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close()
    }
    const onScroll = (): void => {
      close()
    }

    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll)
    }
  }, [open, close])

  const markAllRead = async (): Promise<void> => {
    const res = await fetch('/api/notifications/mark-all-read', { method: 'POST' })
    if (!res.ok) return
    const now = new Date().toISOString()
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })))
    setUnreadCount(0)
  }

  const handleItemClick = async (n: AppNotification): Promise<void> => {
    if (!n.readAt) {
      const res = await fetch(`/api/notifications/${n.id}`, { method: 'PATCH' })
      if (res.ok) {
        const now = new Date().toISOString()
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, readAt: now } : item))
        )
        setUnreadCount((c) => Math.max(0, c - 1))
      }
    }
    close()
    if (n.linkPath) router.push(n.linkPath)
  }

  const panel = (
    <div
      ref={panelRef}
      className={`fn-notif-panel${open ? ' is-open' : ''}`}
      role="dialog"
      aria-labelledby={titleId}
      style={panelStyle}
    >
      <header className="fn-notif-header">
        <p className="fn-notif-title" id={titleId}>
          Notifications
        </p>
        <button
          type="button"
          className="fn-notif-mark-all"
          onClick={() => void markAllRead()}
          disabled={unreadCount === 0}
        >
          Mark all read
        </button>
      </header>

      <ul className="fn-notif-list" tabIndex={0} aria-label="Notifications list">
        {loading && notifications.length === 0 && (
          <>
            {[0, 1, 2].map((i) => (
              <li key={i} className="fn-notif-item" aria-hidden="true">
                <span className="fn-notif-icon">
                  <span className="skeleton skeleton-circle" style={{ width: 34, height: 34, borderRadius: 12 }} />
                </span>
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-line skeleton-line-sm" style={{ width: '85%' }} />
                  <div className="skeleton skeleton-line skeleton-line-sm mt-2" style={{ width: '40%' }} />
                </div>
              </li>
            ))}
          </>
        )}

        {!loading && error && (
          <li className="fn-notif-item" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--muted)' }} aria-hidden="true">
              error
            </span>
            <p className="fn-notif-text">Could not load notifications.</p>
            <button type="button" className="fn-notif-mark-all" onClick={() => void fetchNotifications()}>
              Retry
            </button>
          </li>
        )}

        {!loading && !error && notifications.length === 0 && (
          <li className="fn-notif-item" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--muted)' }} aria-hidden="true">
              notifications_off
            </span>
            <p className="fn-notif-text">No notifications yet</p>
          </li>
        )}

        {!error &&
          notifications.map((n) => (
            <li
              key={n.id}
              className={`fn-notif-item${n.readAt ? '' : ' is-unread'}`}
            >
              <button
                type="button"
                onClick={() => void handleItemClick(n)}
                style={{
                  all: 'unset',
                  display: 'contents',
                  cursor: 'pointer',
                }}
              >
                <span className="fn-notif-icon" aria-hidden="true">
                  <span className="material-symbols-outlined">{notificationIcon(n.type)}</span>
                </span>
                <div>
                  <p className="fn-notif-text line-clamp-2">
                    <strong>{n.title}</strong>
                    {n.body ? ` — ${n.body}` : ''}
                  </p>
                  <p className="fn-notif-time">{formatRelativeTime(n.createdAt)}</p>
                  {!n.readAt && <span className="sr-only">Unread</span>}
                </div>
                <span className="fn-notif-unread" aria-hidden="true" />
              </button>
            </li>
          ))}
      </ul>

      <footer className="fn-notif-footer">
        <button
          type="button"
          className="fn-notif-view-all"
          aria-disabled="true"
          disabled
        >
          View all
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_forward
          </span>
        </button>
      </footer>
    </div>
  )

  return (
    <>
      <button
        ref={bellRef}
        type="button"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="fn-icon-btn"
        onClick={toggle}
      >
        <span aria-hidden="true" className="material-symbols-outlined">
          notifications
        </span>
        {unreadCount > 0 && <span aria-hidden="true" className="fn-dot" />}
      </button>
      {mounted && createPortal(panel, document.body)}
    </>
  )
}
