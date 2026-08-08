import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FloatingNav } from '@/components/layout/FloatingNav'
import { ScrollProgress } from '@/components/layout/ScrollProgress'
import { Breadcrumb, type BreadcrumbItem } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { avatarInitial } from '@/lib/utils'
import { resolveHelpAudience } from '@/lib/help/queries'

export type HelpChromeProps = {
  children: React.ReactNode
  /** Signed-in breadcrumb trail. Defaults to DASHBOARD → HELP. */
  breadcrumbItems?: BreadcrumbItem[]
  /** Optional simple trail for logged-out pages (no FloatingNav/Breadcrumb shell). */
  publicTrail?: Array<{ label: string; href?: string }>
}

/**
 * Auth-aware chrome for /help surfaces.
 * Signed in: FloatingNav + Breadcrumb + page-band + PageFooter.
 * Logged out: opaque page-shell header/footer (no backdrop-filter).
 */
export async function HelpChrome({
  children,
  breadcrumbItems,
  publicTrail,
}: HelpChromeProps): Promise<React.ReactElement> {
  const { userId } = await resolveHelpAudience()
  const signedIn = Boolean(userId)

  if (!signedIn) {
    return (
      <div data-page="help" className="page-bg page-shell">
        <header className="page-shell-header">
          <Link href="/" className="page-logo" aria-label="Evenzi home">
            Evenzi
          </Link>
          <div className="page-shell-actions">
            <ThemeToggle className="page-theme-toggle" />
            <Link href="/auth?next=/help" className="btn-pill btn-pill-secondary">
              Sign in
            </Link>
          </div>
        </header>

        <main className="page-band pt-10 md:pt-14 pb-20">
          {publicTrail && publicTrail.length > 0 ? (
            <nav className="mb-6 text-sm text-[var(--muted)]" aria-label="Breadcrumb">
              <ol className="m-0 p-0 list-none flex flex-wrap items-center gap-x-2 gap-y-1">
                {publicTrail.map((item, i) => {
                  const isLast = i === publicTrail.length - 1
                  return (
                    <li key={`${item.label}-${i}`} className="inline-flex items-center gap-2">
                      {i > 0 ? <span aria-hidden="true">/</span> : null}
                      {isLast || !item.href ? (
                        <span className="text-[var(--ink)]" aria-current={isLast ? 'page' : undefined}>
                          {item.label}
                        </span>
                      ) : (
                        <Link href={item.href} className="hover:text-[var(--brand)]">
                          {item.label}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ol>
            </nav>
          ) : null}
          {children}
        </main>

        <footer className="page-shell-footer">© 2026 Evenzi · All rights reserved</footer>
      </div>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase
        .from('user_profiles')
        .select('display_name, avatar_url, email')
        .eq('id', user.id)
        .single()
    : { data: null }

  const initial = avatarInitial(
    profile?.display_name ?? user?.email ?? user?.phone ?? 'User'
  )
  const items: BreadcrumbItem[] = breadcrumbItems ?? [
    { label: 'DASHBOARD', href: '/home' },
    { label: 'HELP' },
  ]

  return (
    <div data-page="help">
      <ScrollProgress />
      <FloatingNav userInitial={initial} avatarUrl={profile?.avatar_url ?? null} />
      <Breadcrumb items={items} backHref={items[0]?.href ?? '/home'} />
      <main className="page-band pt-10 md:pt-14 pb-20">{children}</main>
      <PageFooter />
    </div>
  )
}

/** Profile email for the ticket form when signed in. */
export async function getHelpViewerEmail(): Promise<string> {
  const { userId } = await resolveHelpAudience()
  if (!userId) return ''
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('email')
    .eq('id', userId)
    .single()
  return profile?.email ?? user?.email ?? ''
}
