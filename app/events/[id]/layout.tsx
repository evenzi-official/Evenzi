import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FloatingNav } from '@/components/layout/FloatingNav'
import { ToolRail } from '@/components/layout/ToolRail'
import { ScrollProgress } from '@/components/layout/ScrollProgress'
import { HelpFab } from '@/components/layout/HelpFab'
import { avatarInitial } from '@/lib/utils'
import { getAppBaseUrl } from '@/lib/url'

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

  const { data: ev } = await supabase
    .from('events')
    .select('slug')
    .eq('id', id)
    .single()

  const { data: siteSettings } = await supabase
    .from('event_website_settings')
    .select('site_offline')
    .eq('event_id', id)
    .single()

  const siteOffline = siteSettings?.site_offline ?? false // matches website/page.tsx — do not diverge
  const liveUrl = ev?.slug && !siteOffline ? `${getAppBaseUrl()}/e/${ev.slug}` : null

  return (
    <div className="min-h-dvh" data-page="event">
      <ScrollProgress />
      <FloatingNav eventId={id} userInitial={initial} avatarUrl={profile?.avatar_url ?? null} />
      <ToolRail eventId={id} isLive={liveUrl !== null} liveUrl={liveUrl} />
      {children}
      <HelpFab />
    </div>
  )
}
