import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

interface Props {
  searchParams: Promise<{ token?: string }>
}

interface PendingInvite {
  id: string
  event_id: string
  event_name: string | null
  invited_email: string | null
  role: string
  status: string
}

export default async function AcceptInvitePage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    return <InviteError message="Invalid invite link — no token found." />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // get_pending_invite is no longer executable by anon (P0-1). Logged-out preview
  // uses service_role server-side and must NOT render invited_email.
  // Logged-in path uses the session client (authenticated GRANT).
  let inviteRows: unknown
  let lookupError: { message: string } | null = null
  if (user) {
    const result = await supabase.rpc('get_pending_invite', { p_token: token })
    inviteRows = result.data
    lookupError = result.error
  } else {
    try {
      const admin = createServiceClient()
      const result = await admin.rpc('get_pending_invite', { p_token: token })
      inviteRows = result.data
      lookupError = result.error
    } catch (err) {
      console.error('[accept-invite] service lookup failed:', err)
      return <InviteError message="This invite link is invalid or has already been used." />
    }
  }

  if (lookupError) {
    console.error('[accept-invite] get_pending_invite failed:', lookupError)
    return <InviteError message="This invite link is invalid or has already been used." />
  }

  const collab = (Array.isArray(inviteRows) ? inviteRows[0] : inviteRows) as PendingInvite | undefined

  if (!collab) {
    return <InviteError message="This invite link is invalid or has already been used." />
  }

  if (collab.status === 'active') {
    redirect('/home')
  }

  const eventName = collab.event_name ?? 'the event'
  const roleLabel = collab.role.charAt(0).toUpperCase() + collab.role.slice(1).replace(/-/g, ' ')

  if (!user) {
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
            Sign in or create an Evenzi account with the email address this invite was sent to,
            then open this link again to accept.
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

  const { data: acceptedEventId, error: acceptError } = await supabase.rpc('accept_event_invite', {
    p_token: token,
  })

  if (acceptError || !acceptedEventId) {
    console.error('[accept-invite] accept_event_invite failed:', acceptError)
    const msg = acceptError?.message ?? ''
    if (msg.includes('wrong account')) {
      return <InviteError message="This invite belongs to a different email address." />
    }
    return <InviteError message="Something went wrong accepting your invite — please try again." />
  }

  // Event hub + children are still owner-only RLS — co-hosts get app notFound (404)
  // on /events/[id]. Land on home until can_access_event ships (enhancement backlog).
  redirect('/home')
}

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
