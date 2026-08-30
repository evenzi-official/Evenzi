import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import { MediaClient } from './MediaClient'
import { formatDuration } from '@/lib/media/formatDuration'

export default async function MediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('events').select('id, name').eq('id', id).single()
  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

  const [mediaResult, albumsResult, linksResult, storageResult] = await Promise.all([
    supabase
      .from('event_media')
      .select('*')
      .eq('event_id', id)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false }),
    supabase.from('event_albums').select('*').eq('event_id', id).order('display_order'),
    supabase.from('event_media_albums').select('media_id, album_id').eq('event_id', id),
    supabase.from('event_media_storage').select('*').eq('event_id', id).single(),
  ])

  const mediaRows = mediaResult.data ?? []
  const albumRows = albumsResult.data ?? []
  const linkRows = linksResult.data ?? []

  const albumIdsByMedia = new Map<string, string[]>()
  for (const link of linkRows as { media_id: string; album_id: string }[]) {
    const list = albumIdsByMedia.get(link.media_id) ?? []
    list.push(link.album_id)
    albumIdsByMedia.set(link.media_id, list)
  }

  const initialPhotos = mediaRows
    .filter((m: { kind: string }) => m.kind === 'photo')
    .map((m: { id: string; name: string | null; original_filename: string | null; created_at: string; taken_at: string | null; published: boolean }) => ({
      id: m.id,
      // Real URL is resolved client-side via the batched signed-URL fetch (Task 13) —
      // starts empty, MediaClient's resolveSrc() falls through to '' until urlCache populates.
      src: '',
      name: m.name ?? m.original_filename ?? 'Photo',
      albumIds: albumIdsByMedia.get(m.id) ?? [],
      uploadedAt: Date.parse(m.created_at),
      takenAt: m.taken_at ? Date.parse(m.taken_at) : undefined,
      published: m.published,
    }))

  const initialVideos = mediaRows
    .filter((m: { kind: string }) => m.kind === 'video')
    .map((m: { id: string; name: string | null; original_filename: string | null; created_at: string; taken_at: string | null; duration_sec: number | null }) => ({
      id: m.id,
      // Same as photos — resolved client-side via urlCache (Task 13).
      poster: '',
      name: m.name ?? m.original_filename ?? 'Video',
      duration: formatDuration(m.duration_sec ?? 0),
      albumIds: albumIdsByMedia.get(m.id) ?? [],
      uploadedAt: Date.parse(m.created_at),
      takenAt: m.taken_at ? Date.parse(m.taken_at) : undefined,
    }))

  const initialAlbums = albumRows.map((a: { id: string; name: string; is_custom: boolean }) => ({
    id: a.id,
    name: a.name,
    preset: !a.is_custom,
  }))

  const storage = storageResult.data
    ? {
        usedBytes: storageResult.data.used_bytes ?? 0,
        photoCount: storageResult.data.photo_count ?? 0,
        videoCount: storageResult.data.video_count ?? 0,
      }
    : { usedBytes: 0, photoCount: 0, videoCount: 0 }

  return (
    <div data-page="media">
      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: eventName.toUpperCase(), href: `/events/${id}` },
          { label: 'MEDIA' },
        ]}
        backHref={`/events/${id}`}
      />
      <main className="page-band pt-10 pb-24" id="md-main">
        <MediaClient
          eventName={eventName}
          eventId={id}
          initialPhotos={initialPhotos}
          initialVideos={initialVideos}
          initialAlbums={initialAlbums}
          storage={storage}
        />
      </main>
      <PageFooter />
    </div>
  )
}
