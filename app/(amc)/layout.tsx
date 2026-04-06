import { AmcSidebarNav } from '@/components/amc/shared/sidebar-nav'

export const metadata = {
  title: 'AMC — Agentic Mission Control',
}

export default function AmcLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-950">
      <AmcSidebarNav />
      <main className="flex-1 bg-gray-900 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  )
}
