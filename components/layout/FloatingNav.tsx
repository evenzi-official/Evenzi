'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'

interface FloatingNavProps {
  eventId?: string
  notificationCount?: number
  userInitial?: string
  /** Profile photo. Falls back to `userInitial` when absent. */
  avatarUrl?: string | null
  /** Shows the "Create event" button before the notification bell. Home only. */
  showCreateEvent?: boolean
  /** Renders a neutral shimmer in place of the avatar. For loading skeletons. */
  avatarLoading?: boolean
}

export function FloatingNav({
  eventId,
  notificationCount = 0,
  userInitial = 'A',
  avatarUrl = null,
  showCreateEvent = false,
  avatarLoading = false,
}: FloatingNavProps) {
  const pathname = usePathname()
  const isWebsite = pathname.includes('/website')
  const isDashboard = !isWebsite
  const isSettings = pathname === '/settings'

  return (
    <nav className="floating-nav" aria-label="Main">
      <div className="floating-nav-inner">
        <Link href="/home" className="fn-logo-link" aria-label="Evenzi home">
          <span className="fn-logo">EVENZI</span>
          <span className="hidden sm:flex flex-col leading-tight border-l border-brand/30 pl-3" aria-hidden="true">
            <span className="font-display font-bold text-[9px] tracking-[0.35em] text-brand/85">CAPTURE</span>
            <span className="font-display font-bold text-[9px] tracking-[0.35em] text-brand/85">SHARE · CHERISH</span>
          </span>
        </Link>

        {eventId && (
          <div className="nav-tabs inline-flex" role="tablist" aria-label="Primary view">
            <Link
              href={`/events/${eventId}`}
              className={`nav-tab${isDashboard ? ' is-active' : ''}`}
              aria-label="Dashboard"
              aria-current={isDashboard ? 'page' : undefined}
            >
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">dashboard</span>
              <span className="nav-tab-label">Dashboard</span>
            </Link>
            <Link
              href={`/events/${eventId}/website`}
              className={`nav-tab${isWebsite ? ' is-active' : ''}`}
              aria-label="Website"
              aria-current={isWebsite ? 'page' : undefined}
            >
              <span aria-hidden="true" className="material-symbols-outlined">language</span>
              <span className="nav-tab-label">Website</span>
            </Link>
          </div>
        )}

        {!eventId && <span aria-hidden="true" />}

        <div className="fn-actions">
          {showCreateEvent && (
            <Link href="/events/create" className="dash-create-btn" aria-label="Create new event">
              <span aria-hidden="true" className="material-symbols-outlined">add</span>
              <span className="dash-create-label">Create event</span>
            </Link>
          )}
          <button
            aria-label={notificationCount > 0 ? `Notifications, ${notificationCount} unread` : 'Notifications'}
            className="fn-icon-btn"
          >
            <span aria-hidden="true" className="material-symbols-outlined">notifications</span>
            {notificationCount > 0 && <span aria-hidden="true" className="fn-dot" />}
          </button>
          <ThemeToggle />
          <Link
            href="/settings"
            aria-label="Settings"
            aria-current={isSettings ? 'page' : undefined}
            className="fn-icon-btn"
          >
            <span aria-hidden="true" className={`material-symbols-outlined${isSettings ? ' icon-fill' : ''}`}>settings</span>
          </Link>
          <span className="fn-divider hidden sm:inline-block" aria-hidden="true" />
          <button aria-label="Account menu" className="fn-avatar">
            {avatarLoading ? (
              <span className="skeleton skeleton-circle" style={{ width: '100%', height: '100%' }} />
            ) : avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="fn-avatar-img" />
            ) : (
              userInitial
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}
