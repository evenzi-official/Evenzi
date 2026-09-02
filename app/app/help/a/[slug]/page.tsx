import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  formatHelpDate,
  getPublishedArticle,
  resolveHelpAudience,
  stripMarkdownPreview,
} from '@/lib/help/queries'
import { HelpArticle } from '@/components/help/HelpArticle'
import { HelpChrome, getHelpViewerEmail } from '@/components/help/HelpChrome'
import { HelpContactBand } from '@/components/help/HelpContactBand'
import { HelpFeedbackRow } from '@/components/help/HelpFeedbackRow'

type Params = { slug: string }

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const article = await getPublishedArticle(params.slug)
  if (!article) {
    return { title: 'Article not found' }
  }

  const description = stripMarkdownPreview(article.answer, 150)
  const canonical = `/help/a/${article.slug}`

  return {
    title: article.question,
    description,
    alternates: { canonical },
    openGraph: {
      title: article.question,
      description,
      url: canonical,
      type: 'article',
      images: [
        {
          url: '/icons/icon-512.png',
          width: 512,
          height: 512,
          alt: 'Evenzi',
        },
      ],
    },
    twitter: {
      card: 'summary',
      title: article.question,
      description,
      images: ['/icons/icon-512.png'],
    },
  }
}

export default async function HelpArticlePage({
  params,
}: {
  params: Params
}): Promise<React.ReactElement> {
  const article = await getPublishedArticle(params.slug)
  if (!article) notFound()

  const { userId } = await resolveHelpAudience()
  const signedIn = Boolean(userId)
  const defaultEmail = signedIn ? await getHelpViewerEmail() : ''
  const updated = formatHelpDate(article.updatedAt)

  return (
    <HelpChrome
      breadcrumbItems={[
        { label: 'HELP CENTRE', href: '/help' },
        { label: article.categoryName.toUpperCase(), href: `/help/${article.categorySlug}` },
        { label: article.question },
      ]}
      publicTrail={[
        { label: 'Help Centre', href: '/help' },
        { label: article.categoryName, href: `/help/${article.categorySlug}` },
        { label: article.question },
      ]}
    >
      <article>
        <header className="max-w-[65ch]">
          <h1
            className="m-0 font-display font-bold text-[var(--ink)] text-[1.75rem] md:text-[2.25rem] leading-tight"
            style={{ overflowWrap: 'anywhere' }}
          >
            {article.question}
          </h1>
          <p className="mt-3 mb-0 text-sm text-[var(--muted)]">
            <Link
              href={`/help/${article.categorySlug}`}
              className="hover:text-[var(--brand)]"
            >
              {article.categoryName}
            </Link>
            {updated ? <> · Updated {updated}</> : null}
          </p>
        </header>

        <div className="mt-8 max-w-[65ch]">
          <HelpArticle answer={article.answer} />
        </div>

        <div className="mt-10 max-w-[65ch]">
          <HelpFeedbackRow articleSlug={article.slug} />
        </div>

        <p className="mt-8 mb-0 max-w-[65ch]">
          <Link
            href={`/help/${article.categorySlug}`}
            className="btn-pill btn-pill-secondary"
          >
            See all in {article.categoryName}
          </Link>
        </p>
      </article>

      <HelpContactBand
        signedIn={signedIn}
        defaultEmail={defaultEmail}
        topicSlug={article.categorySlug}
        articleSlug={article.slug}
        nextPath={`/help/a/${article.slug}`}
      />
    </HelpChrome>
  )
}
