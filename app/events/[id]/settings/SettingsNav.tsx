'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SETTINGS_TABS = [
  { href: (id: string) => `/events/${id}/settings`,          label: 'General',        icon: 'tune',        exact: true  },
  { href: (id: string) => `/events/${id}/settings/website`,  label: 'Website',        icon: 'language',    exact: false },
  { href: (id: string) => `/events/${id}/settings/admins`,   label: 'Admins',         icon: 'groups',      exact: false },
  { href: (id: string) => `/events/${id}/settings/guests`,   label: 'Guest list',     icon: 'how_to_reg',  exact: false },
  { href: (id: string) => `/events/${id}/settings/registry`, label: 'Registry',       icon: 'redeem',      exact: false },
  { href: (id: string) => `/events/${id}/settings/billing`,  label: 'Plan & billing', icon: 'credit_card', exact: false },
] as const

export function SettingsNav({ id }: { id: string }) {
  const pathname = usePathname()

  return (
    <div className="seg-wrap seg-wrap--page reveal">
      <nav className="seg" aria-label="Event settings sections">
        {SETTINGS_TABS.map((tab) => {
          const tabHref = tab.href(id)
          const active = tab.exact ? pathname === tabHref : pathname.startsWith(tabHref)
          return (
            <Link
              key={tab.label}
              href={tabHref}
              className={`seg-item seg--page${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="material-symbols-outlined" aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
