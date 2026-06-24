import Link from 'next/link'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

const SETTINGS_TABS = [
  { href: (id: string) => `/events/${id}/settings`,          label: 'General',       icon: 'tune',        segment: '' },
  { href: (id: string) => `/events/${id}/settings/website`,  label: 'Website',       icon: 'language',    segment: 'website' },
  { href: (id: string) => `/events/${id}/settings/admins`,   label: 'Admins',        icon: 'groups',      segment: 'admins' },
  { href: (id: string) => `/events/${id}/settings/guests`,   label: 'Guest list',    icon: 'how_to_reg',  segment: 'guests' },
  { href: (id: string) => `/events/${id}/settings/registry`, label: 'Registry',      icon: 'redeem',      segment: 'registry' },
  { href: (id: string) => `/events/${id}/settings/billing`,  label: 'Plan & billing', icon: 'credit_card', segment: 'billing' },
] as const

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div data-page="event-settings">
      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: 'EVENT', href: `/events/${id}` },
          { label: 'EVENT SETTINGS' },
        ]}
        backHref={`/events/${id}`}
      />

      <div className="seg-wrap seg-wrap--page reveal">
        <nav className="seg" aria-label="Event settings sections">
          {SETTINGS_TABS.map((tab) => (
            <Link
              key={tab.segment}
              href={tab.href(id)}
              className="seg-item seg--page"
            >
              <span className="material-symbols-outlined" aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {children}
    </div>
  )
}
