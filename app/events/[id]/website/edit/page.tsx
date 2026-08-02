import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import { StatusBadge } from '@/components/ui/StatusBadge'
import PagesListClient from './PagesListClient'

interface Params { params: Promise<{ id: string }> }

type ConfigPage = {
  id: string
  slug: string
  label: string
  icon: string | null
  tier: string
  display_order: number
}

export default async function EditPagesPage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: event } = await supabase
    .from('events')
    .select('id, name')
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()
  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

  const [pagesResult, configResult] = await Promise.all([
    supabase
      .from('event_website_pages')
      .select('id, page_id, is_visible, custom_title, display_order')
      .eq('event_id', id)
      .order('display_order'),
    supabase
      .schema('config')
      .from('website_pages')
      .select('id, slug, label, icon, tier, display_order') as unknown as Promise<{ data: ConfigPage[] | null; error: unknown }>,
  ])

  const configMap = new Map<string, ConfigPage>()
  if (configResult.data) {
    for (const p of configResult.data) configMap.set(p.id, p)
  }

  const pages = (pagesResult.data ?? []).map((p) => {
    const cfg = configMap.get(p.page_id)
    return {
      id: p.id,
      page_id: p.page_id,
      slug: cfg?.slug ?? p.page_id,
      label: p.custom_title ?? cfg?.label ?? 'Page',
      icon: cfg?.icon ?? 'web',
      tier: cfg?.tier ?? 'public',
      is_visible: p.is_visible,
      custom_title: p.custom_title,
      display_order: p.display_order,
    }
  })

  return (
    <div data-page="website-edit-pages">
      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: eventName.toUpperCase(), href: `/events/${id}` },
          { label: 'WEBSITE', href: `/events/${id}/website` },
          { label: 'PAGES' },
        ]}
        backHref={`/events/${id}/website`}
      />

      <div className="bc-wrap reveal">
        <div className="seg-wrap seg-wrap--page">
          <nav className="seg" aria-label="Website sections">
            <Link href={`/events/${id}/website`} className="seg-item seg--page"><span className="material-symbols-outlined" aria-hidden="true">overview</span><span>Overview</span></Link>
            <Link href={`/events/${id}/website/design`} className="seg-item seg--page"><span className="material-symbols-outlined" aria-hidden="true">palette</span><span>Design</span></Link>
            <Link href={`/events/${id}/website/photos`} className="seg-item seg--page"><span className="material-symbols-outlined" aria-hidden="true">photo_library</span><span>Photos</span></Link>
            <Link href={`/events/${id}/website/edit`} className="seg-item seg--page is-active" aria-current="page"><span className="material-symbols-outlined" aria-hidden="true">edit_note</span><span>Pages</span></Link>
          </nav>
        </div>
      </div>

      <main className="page-band pt-6 md:pt-8 pb-24">
        <header className="section-head reveal">
          <p className="section-head-eyebrow">Website</p>
          <div className="section-head-titlerow">
            <h1 className="section-head-title">Pages</h1>
          </div>
          <p className="section-head-sub">Manage the pages of your event website — toggle visibility, rename, and reorder.</p>
        </header>

        {pages.length === 0 ? (
          <div className="clay-card p-8 text-center space-y-3 mt-6">
            <span className="material-symbols-outlined text-4xl text-muted" aria-hidden="true">web</span>
            <p className="font-display font-bold text-sm text-ink">No pages set up yet</p>
            <p className="text-xs text-muted">Create an event first to get your website page list.</p>
          </div>
        ) : (
          <PagesListClient eventId={id} initialPages={pages} />
        )}
      </main>

      <PageFooter />
    </div>
  )
}
