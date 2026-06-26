import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { SettingsNav } from './SettingsNav'

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
      <SettingsNav id={id} />
      {children}
    </div>
  )
}
