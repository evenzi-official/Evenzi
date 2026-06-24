import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FloatingNav } from '@/components/layout/FloatingNav'
import { ToolRail } from '@/components/layout/ToolRail'
import { ScrollProgress } from '@/components/layout/ScrollProgress'
import { HelpFab } from '@/components/layout/HelpFab'

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  return (
    <div className="min-h-dvh" data-page="event">
      <ScrollProgress />
      <FloatingNav eventId={id} notificationCount={1} />
      <ToolRail eventId={id} isLive />
      {children}
      <HelpFab />
    </div>
  )
}
