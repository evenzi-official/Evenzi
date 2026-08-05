import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import { WebsitePhotosClient } from './WebsitePhotosClient'

interface Params { params: Promise<{ id: string }> }

export default async function WebsitePhotosPage({ params }: Params) {
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

  return (
    <div data-page="website-photos">
      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: eventName.toUpperCase(), href: `/events/${id}` },
          { label: 'WEBSITE', href: `/events/${id}/website` },
          { label: 'PHOTOS' },
        ]}
        backHref={`/events/${id}/website`}
      />

      <div className="bc-wrap reveal">
        <div className="seg-wrap seg-wrap--page">
          <nav className="seg" aria-label="Website sections">
            <Link href={`/events/${id}/website`} className="seg-item seg--page"><span className="material-symbols-outlined" aria-hidden="true">overview</span><span>Overview</span></Link>
            <Link href={`/events/${id}/website/design`} className="seg-item seg--page"><span className="material-symbols-outlined" aria-hidden="true">palette</span><span>Design</span></Link>
            <Link href={`/events/${id}/website/photos`} className="seg-item seg--page is-active" aria-current="page"><span className="material-symbols-outlined" aria-hidden="true">photo_library</span><span>Photos</span></Link>
            <Link href={`/events/${id}/website/edit`} className="seg-item seg--page"><span className="material-symbols-outlined" aria-hidden="true">edit_note</span><span>Pages</span></Link>
          </nav>
        </div>
      </div>

      <main className="page-band pt-6 md:pt-8 pb-24">
        <header className="section-head reveal">
          <p className="section-head-eyebrow">Website</p>
          <div className="section-head-titlerow">
            <h1 className="section-head-title">Photos</h1>
          </div>
          <p className="section-head-sub">Gallery photos shown to guests — different from your site cover on Design.</p>
        </header>

        <WebsitePhotosClient eventId={id} />
      </main>

      <PageFooter />
    </div>
  )
}
