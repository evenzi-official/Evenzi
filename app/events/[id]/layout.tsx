import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FloatingNav } from '@/components/layout/FloatingNav'
import { ToolRail } from '@/components/layout/ToolRail'
import { ScrollProgress } from '@/components/layout/ScrollProgress'
import { HelpFab } from '@/components/layout/HelpFab'
import { avatarInitial } from '@/lib/utils'

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

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single()

  const initial = avatarInitial(
    profile?.display_name?.trim() || user.email?.trim() || user.phone?.trim() || 'User'
  )

  return (
    <div className="min-h-dvh" data-page="event">
      <ScrollProgress />
      <FloatingNav eventId={id} notificationCount={1} userInitial={initial} avatarUrl={profile?.avatar_url ?? null} />
      <ToolRail eventId={id} isLive />
      {children}
      <HelpFab />
    </div>
  )
}
