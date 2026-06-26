import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageFooter } from '@/components/layout/PageFooter'
import { AdminsContent } from './AdminsContent'

function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

export default async function AdminsSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: ev } = await supabase
    .from('events')
    .select('id, user_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (!ev) redirect('/home')

  // Fetch owner profile
  const { data: ownerProfile } = await supabase
    .from('user_profiles')
    .select('display_name, email')
    .eq('id', ev.user_id)
    .single()

  // Fetch collaborators (left join with user_profiles via user_id if accepted)
  const { data: collabRows } = await supabase
    .from('event_collaborators')
    .select('id, user_id, invited_email, role, status')
    .eq('event_id', id)
    .order('created_at', { ascending: true })

  // Fetch profiles for accepted collaborators
  const acceptedUserIds = (collabRows ?? [])
    .filter(r => r.user_id != null)
    .map(r => r.user_id as string)

  const profilesById = new Map<string, { display_name: string | null; email: string | null }>()
  if (acceptedUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, email')
      .in('id', acceptedUserIds)
    for (const p of profiles ?? []) profilesById.set(p.id, p)
  }

  const collaborators = (collabRows ?? []).map(r => {
    const profile = r.user_id ? profilesById.get(r.user_id) : null
    const name = profile?.display_name ?? r.invited_email ?? 'Unknown'
    const email = profile?.email ?? r.invited_email ?? ''
    return {
      id: r.id as string,
      displayName: name,
      email,
      role: r.role as string,
      status: r.status as 'active' | 'pending',
      initials: initials(name),
    }
  })

  return (
    <main className="page-band reveal pt-6 md:pt-8 pb-24">
      <AdminsContent
        eventId={id}
        ownerName={ownerProfile?.display_name ?? 'Owner'}
        ownerEmail={ownerProfile?.email ?? ''}
        ownerInitials={initials(ownerProfile?.display_name)}
        collaborators={collaborators}
      />
      <PageFooter />
    </main>
  )
}
