'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TOOLS = [
  { id: 'guests',         label: 'Guest management',  icon: 'groups',            path: (id: string) => `/events/${id}/guests` },
  { id: 'invitations',   label: 'Invitations',         icon: 'forward_to_inbox',  path: (id: string) => `/events/${id}/invitations` },
  { id: 'planning',      label: 'Planning',             icon: 'checklist_rtl',     path: (id: string) => `/events/${id}/planning` },
  { id: 'media',         label: 'Media & memories',    icon: 'photo_library',     path: (id: string) => `/events/${id}/media` },
  { id: 'event-settings',label: 'Event settings',      icon: 'settings',          path: (id: string) => `/events/${id}/settings` },
] as const

interface ToolRailProps {
  eventId: string
  isLive: boolean
  liveUrl: string | null
}

export function ToolRail({ eventId, isLive, liveUrl }: ToolRailProps) {
  const pathname = usePathname()

  function isActive(toolId: string) {
    return pathname.includes(`/events/${eventId}/${toolId === 'event-settings' ? 'settings' : toolId}`)
  }

  return (
    <aside className="tool-rail" aria-label="Event tools">
      {TOOLS.map((tool) => (
        <Link
          key={tool.id}
          href={tool.path(eventId)}
          className={`tr-btn${isActive(tool.id) ? ' is-active' : ''}`}
          data-label={tool.label}
          data-page={tool.id}
          aria-label={tool.label}
        >
          <span aria-hidden="true" className="material-symbols-outlined icon-fill">{tool.icon}</span>
        </Link>
      ))}
      <span className="tr-divider" aria-hidden="true" />
      {isLive && liveUrl ? (
        <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="tr-status" aria-label="Site is live — open it">
          <span className="bc-live" />
          LIVE
        </a>
      ) : (
        <span className="tr-status is-offline" aria-label="Site is offline">
          <span className="bc-live is-offline-dot" aria-hidden="true" />
          OFFLINE
        </span>
      )}
    </aside>
  )
}
