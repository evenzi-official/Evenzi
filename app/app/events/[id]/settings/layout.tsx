import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { SettingsNav } from './SettingsNav'
import { createClient } from '@/lib/supabase/server'

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase
    .from('events')
    .select('name')
    .eq('id', id)
    .single()

  const eventLabel = (event?.name ?? 'Event').toUpperCase()

  return (
    <div data-page="event-settings">
      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: eventLabel, href: `/events/${id}` },
          { label: 'EVENT SETTINGS' },
        ]}
        backHref={`/events/${id}`}
      />
      <SettingsNav id={id} />
      {children}
    </div>
  )
}
