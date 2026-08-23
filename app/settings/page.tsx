import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FloatingNav } from '@/components/layout/FloatingNav'
import { ScrollProgress } from '@/components/layout/ScrollProgress'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import { avatarInitial, formatPhone } from '@/lib/utils'
import { ProfileSection } from './ProfileSection'
import { SecuritySection, type SignInMethod } from './SecuritySection'
import { NotificationsSection } from './NotificationsSection'
import { AccountSection } from './AccountSection'

export default async function UserSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('display_name, email, phone, avatar_url')
    .eq('id', user.id)
    .single()

  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('email_alerts, push_notifications, sms_alerts')
    .eq('user_id', user.id)
    .single()

  const identities = user.identities ?? []
  const googleIdentity = identities.find((i) => i.provider === 'google')
  const methods: SignInMethod[] = [
    {
      provider: 'google',
      label: 'Google',
      icon: 'account_circle',
      connected: Boolean(googleIdentity),
      detail: profile?.email ?? user.email ?? null,
    },
    {
      provider: 'phone',
      label: 'Phone number',
      icon: 'phone_iphone',
      connected: Boolean(profile?.phone ?? user.phone),
      detail: formatPhone(profile?.phone ?? user.phone ?? null),
    },
  ]
  const identityCount = identities.length
  const displayName = profile?.display_name ?? null
  const initial = avatarInitial(displayName ?? user.email ?? user.phone ?? 'User')

  return (
    <div data-page="settings">
      <ScrollProgress />
      <FloatingNav userInitial={initial} avatarUrl={profile?.avatar_url ?? null} />

      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: 'SETTINGS' },
        ]}
        backHref="/home"
      />

      <main className="page-band pt-10 md:pt-14 pb-20">
        <header className="reveal">
          <p className="settings-eyebrow">Account</p>
          <h1 className="settings-h1">Settings</h1>
          <p className="settings-lead">Manage your profile, security, and how you&apos;d like to be notified about events you host or collaborate on.</p>
        </header>

        <ProfileSection
          userId={user.id}
          displayName={displayName}
          email={profile?.email ?? user.email ?? null}
          phone={profile?.phone ?? user.phone ?? null}
          avatarUrl={profile?.avatar_url ?? null}
        />
        <SecuritySection methods={methods} identityCount={identityCount} userId={user.id} />
        <NotificationsSection
          emailAlerts={preferences?.email_alerts ?? true}
          pushNotifications={preferences?.push_notifications ?? true}
          smsAlerts={preferences?.sms_alerts ?? false}
          vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
        />
        <AccountSection />
      </main>

      <PageFooter />
    </div>
  )
}
