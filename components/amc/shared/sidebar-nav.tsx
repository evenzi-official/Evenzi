'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/amc',           label: 'Overview',  icon: '⬡' },
  { href: '/amc/projects',  label: 'Projects',  icon: '◈' },
  { href: '/amc/kanban',    label: 'Kanban',     icon: '⊞' },
  { href: '/amc/agents',    label: 'Agents',     icon: '◎' },
  { href: '/amc/team',      label: 'Team',       icon: '◉' },
  { href: '/amc/memory',    label: 'Memory',     icon: '◷' },
  { href: '/amc/docs',      label: 'Docs',       icon: '◫' },
]

export function AmcSidebarNav() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen bg-gray-950 text-gray-300 flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-800">
        <span className="text-white font-semibold text-sm tracking-wide">
          ⬡ AMC
        </span>
        <p className="text-gray-500 text-xs mt-0.5">Agentic Mission Control</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors
                ${isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }
              `}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800">
        <p className="text-gray-600 text-xs">v1.0 · Evenzi</p>
      </div>
    </aside>
  )
}
