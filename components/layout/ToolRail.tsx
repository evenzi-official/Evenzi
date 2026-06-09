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
  isLive?: boolean
}

export function ToolRail({ eventId, isLive = false }: ToolRailProps) {
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
      {isLive && (
        <span className="tr-status" aria-hidden="true">
          <span className="bc-live" />
          LIVE
        </span>
      )}
    </aside>
  )
}
