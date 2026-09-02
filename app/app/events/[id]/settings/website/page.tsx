import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageFooter } from '@/components/layout/PageFooter'
import { WebsiteContent } from './WebsiteContent'

export default async function WebsiteSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: ev } = await supabase.from('events').select('id').eq('id', id).is('deleted_at', null).single()
  if (!ev) redirect('/home')

  // Use the view so we get computed expiry fields without needing a second query
  const { data: ws } = await supabase
    .from('event_website_settings_view')
    .select('website_password_enabled, search_indexing_enabled, announcement_banner_enabled, announcement_banner_text, site_offline, website_days_remaining, website_expired')
    .eq('event_id', id)
    .single()

  // website_days_remaining is a Postgres interval string, convert to number of days
  function parseDaysRemaining(raw: unknown): number | null {
    if (raw == null) return null
    if (typeof raw === 'number') return Math.max(0, Math.round(raw))
    // Postgres returns interval as string like "45 days" or "45 days 00:00:00"
    const match = String(raw).match(/(-?\d+)/)
    return match ? Math.max(0, parseInt(match[1], 10)) : null
  }

  return (
    <main className="page-band reveal pt-6 md:pt-8 pb-24">
      <WebsiteContent
        eventId={id}
        initial={{
          passwordEnabled:  ws?.website_password_enabled        ?? false,
          searchIndexing:   ws?.search_indexing_enabled         ?? false,
          bannerEnabled:    ws?.announcement_banner_enabled     ?? false,
          bannerText:       ws?.announcement_banner_text        ?? '',
          siteOffline:      ws?.site_offline                    ?? false,
          daysRemaining:    parseDaysRemaining(ws?.website_days_remaining),
          isExpired:        ws?.website_expired                 ?? false,
        }}
      />
      <PageFooter />
    </main>
  )
}
