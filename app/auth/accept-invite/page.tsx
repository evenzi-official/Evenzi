import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function AcceptInvitePage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    return <InviteError message="Invalid invite link — no token found." />
  }

  const supabase = await createClient()

  // Look up the collaborator row by id (the token IS the row id)
  const { data: collab } = await supabase
    .from('event_collaborators')
    .select('id, event_id, invited_email, role, status')
    .eq('id', token)
    .single()

  if (!collab) {
    return <InviteError message="This invite link is invalid or has already been used." />
  }

  if (collab.status === 'active') {
    // Already accepted — just send them to the event
    redirect(`/events/${collab.event_id}`)
  }

  // Fetch event name for the UI
  const { data: event } = await supabase
    .from('events')
    .select('name')
    .eq('id', collab.event_id)
    .single()

  const eventName = event?.name ?? 'the event'
  const roleLabel = collab.role.charAt(0).toUpperCase() + collab.role.slice(1).replace(/-/g, ' ')

  // Check if the current user is logged in
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Not logged in — show sign-in prompt
    return (
      <InviteShell>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
          <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
            You&apos;re invited!
          </h1>
          <p style={{ margin: '0 0 4px', fontSize: 15, color: 'var(--muted)' }}>
            You&apos;ve been invited to join
          </p>
          <p style={{ margin: '0 0 24px', fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>
            {eventName}
          </p>
          <span style={{
            display: 'inline-block', padding: '4px 14px', borderRadius: 9999,
            background: 'var(--brand-tint)', color: 'var(--brand)',
            fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
            marginBottom: 32,
          }}>
            {roleLabel}
          </span>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
            Sign in or create an Evenzi account with{' '}
            <strong style={{ color: 'var(--ink)' }}>{collab.invited_email}</strong>{' '}
            to accept this invitation.
          </p>
          <Link
            href={`/auth?invite=${token}`}
            style={{
              display: 'inline-block', background: 'var(--brand)', color: '#fff',
              fontWeight: 700, fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase',
              padding: '14px 32px', borderRadius: 9999, textDecoration: 'none',
            }}
          >
            Sign in to accept
          </Link>
        </div>
      </InviteShell>
    )
  }

  // User is logged in — check email matches
  const userEmail = user.email?.toLowerCase().trim()
  const invitedEmail = collab.invited_email?.toLowerCase().trim()

  if (userEmail !== invitedEmail) {
    return (
      <InviteShell>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 800, color: 'var(--ink)' }}>
            Wrong account
          </h1>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
            This invite was sent to <strong style={{ color: 'var(--ink)' }}>{collab.invited_email}</strong>
            {' '}but you&apos;re signed in as <strong style={{ color: 'var(--ink)' }}>{user.email}</strong>.
            Please sign in with the correct account and try again.
          </p>
          <Link
            href="/auth"
            style={{
              display: 'inline-block', background: 'var(--brand)', color: '#fff',
              fontWeight: 700, fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase',
              padding: '14px 32px', borderRadius: 9999, textDecoration: 'none',
            }}
          >
            Switch account
          </Link>
        </div>
      </InviteShell>
    )
  }

  // Email matches — accept the invite
  const { error: updateError } = await supabase
    .from('event_collaborators')
    .update({
      status:      'active',
      user_id:     user.id,
      accepted_at: new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    })
    .eq('id', collab.id)

  if (updateError) {
    console.error('[accept-invite] Failed to accept invite:', updateError)
    return <InviteError message="Something went wrong accepting your invite — please try again." />
  }

  redirect(`/events/${collab.event_id}`)
}

// ── Shared layout shell ───────────────────────────────────────────────────────

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '24px 16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 24, padding: '48px 36px',
        boxShadow: 'var(--shadow-clay)',
      }}>
        {children}
      </div>
    </div>
  )
}

function InviteError({ message }: { message: string }) {
  return (
    <InviteShell>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>❌</div>
        <h1 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 800, color: 'var(--ink)' }}>
          Invalid invite
        </h1>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
          {message}
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block', color: 'var(--brand)',
            fontWeight: 700, fontSize: 13, textDecoration: 'none',
          }}
        >
          ← Go home
        </Link>
      </div>
    </InviteShell>
  )
}
