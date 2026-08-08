import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getHelpCategory,
  listCategoryArticles,
  resolveHelpAudience,
} from '@/lib/help/queries'
import { HelpChrome, getHelpViewerEmail } from '@/components/help/HelpChrome'
import { HelpContactBand } from '@/components/help/HelpContactBand'

type Params = { category: string }

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { audience } = await resolveHelpAudience()
  const cat = await getHelpCategory(audience, params.category)
  if (!cat) {
    return { title: 'Help Centre' }
  }
  return {
    title: cat.name,
    description: cat.description,
    alternates: { canonical: `/help/${cat.slug}` },
  }
}

export default async function HelpCategoryPage({
  params,
}: {
  params: Params
}): Promise<React.ReactElement> {
  const { audience, userId } = await resolveHelpAudience()
  const signedIn = Boolean(userId)
  const cat = await getHelpCategory(audience, params.category)
  if (!cat) notFound()

  const articles = await listCategoryArticles(audience, cat.slug)
  const defaultEmail = signedIn ? await getHelpViewerEmail() : ''

  return (
    <HelpChrome
      breadcrumbItems={[
        { label: 'DASHBOARD', href: '/home' },
        { label: 'HELP', href: '/help' },
        { label: cat.name.toUpperCase() },
      ]}
      publicTrail={[
        { label: 'Help Centre', href: '/help' },
        { label: cat.name },
      ]}
    >
      <header className="section-head">
        <p className="section-head-eyebrow">
          <Link href="/help" className="hover:text-[var(--brand)]">
            HELP CENTRE
          </Link>
        </p>
        <h1 className="section-head-title">{cat.name}</h1>
        <p className="section-head-sub">{cat.description}</p>
      </header>

      {articles.length === 0 ? (
        <div className="nothing-yet py-14">
          <span className="nothing-yet-icon" aria-hidden="true">
            <span className="material-symbols-outlined">article</span>
          </span>
          <p className="nothing-yet-title">Nothing here yet</p>
          <p className="nothing-yet-sub">
            We haven&apos;t published articles in {cat.name} yet. Search across all topics, or send
            us your question.
          </p>
          <Link href="/help" className="btn-pill btn-pill-secondary" style={{ marginTop: '0.75rem' }}>
            Back to Help Centre
          </Link>
        </div>
      ) : (
        <ul className="m-0 mt-8 p-0 list-none flex flex-col" role="list">
          {articles.map((article) => (
            <li key={article.id}>
              <Link
                href={`/help/a/${article.slug}`}
                className="list-nav-row list-nav-row--no-icon"
              >
                <span className="list-nav-row-label">{article.question}</span>
                <span className="list-nav-row-chevron" aria-hidden="true">
                  <span className="material-symbols-outlined">chevron_right</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <HelpContactBand
        signedIn={signedIn}
        defaultEmail={defaultEmail}
        topicSlug={cat.slug}
        nextPath={`/help/${cat.slug}`}
      />
    </HelpChrome>
  )
}
