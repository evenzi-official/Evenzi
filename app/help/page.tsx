import type { Metadata } from 'next'
import Link from 'next/link'
import {
  HELP_QUERY_MAX_LENGTH,
  HELP_QUERY_MIN_LENGTH,
} from '@/lib/help/search'
import {
  listFrequentArticles,
  listHelpCategories,
  resolveHelpAudience,
  searchHelpArticles,
} from '@/lib/help/queries'
import { HelpChrome, getHelpViewerEmail } from '@/components/help/HelpChrome'
import { HelpBrowseSection } from '@/components/help/HelpBrowseSection'
import { HelpContactBand } from '@/components/help/HelpContactBand'

export const metadata: Metadata = {
  title: 'Help Centre',
  description: 'Find an answer, or send us your question. We reply within 24 hours.',
  alternates: { canonical: '/help' },
}

type SearchParams = { q?: string | string[]; tab?: string | string[] }

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

function echoQuery(q: string): string {
  if (q.length <= 60) return q
  return `${q.slice(0, 28)}…${q.slice(-28)}`
}

export default async function HelpRootPage({
  searchParams,
}: {
  searchParams: SearchParams
}): Promise<React.ReactElement> {
  const { audience, userId } = await resolveHelpAudience()
  const signedIn = Boolean(userId)
  const defaultEmail = signedIn ? await getHelpViewerEmail() : ''
  const rawQ = firstParam(searchParams.q).trim()
  const q =
    rawQ.length > HELP_QUERY_MAX_LENGTH
      ? rawQ.slice(0, HELP_QUERY_MAX_LENGTH)
      : rawQ
  const searching = q.length >= HELP_QUERY_MIN_LENGTH
  const initialTab =
    firstParam(searchParams.tab).toLowerCase() === 'frequent' ? 'frequent' : 'topics'

  const [categories, search, frequent] = await Promise.all([
    listHelpCategories(audience),
    searching ? searchHelpArticles(audience, q) : Promise.resolve(null),
    listFrequentArticles(audience, 10),
  ])

  return (
    <HelpChrome>
      <header className="section-head">
        <p className="section-head-eyebrow">SUPPORT</p>
        <h1 className="section-head-title">Help Centre</h1>
        <p className="section-head-sub">
          Find an answer, or send us your question. We reply within 24 hours.
        </p>
      </header>

      <form
        action="/help"
        method="get"
        className="form-input-search mt-8 max-w-[640px]"
        role="search"
      >
        <span className="material-symbols-outlined form-input-search-icon" aria-hidden="true">
          search
        </span>
        <input
          type="search"
          name="q"
          className="form-input"
          defaultValue={q}
          placeholder="Search help articles"
          autoComplete="off"
          enterKeyHint="search"
          minLength={HELP_QUERY_MIN_LENGTH}
          maxLength={HELP_QUERY_MAX_LENGTH}
          aria-label="Search help articles"
        />
        {q ? (
          <Link
            href="/help"
            className="form-input-search-clear"
            aria-label="Clear search"
            style={{ display: 'inline-flex' }}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
          </Link>
        ) : null}
        <button type="submit" className="sr-only">
          Search
        </button>
      </form>

      {searching && search ? (
        <section className="mt-10" aria-live="polite">
          {search.resultCount > 0 ? (
            <>
              <p className="m-0 mb-4 text-sm text-[var(--muted)]">
                {search.resultCount}{' '}
                {search.resultCount === 1 ? 'result' : 'results'} for &lsquo;{echoQuery(q)}&rsquo;
              </p>
              <ul className="m-0 p-0 list-none flex flex-col" role="list">
                {search.results.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/help/a/${item.slug}`}
                      className="list-nav-row list-nav-row--no-icon"
                    >
                      <span className="min-w-0">
                        <span className="list-nav-row-label">{item.question}</span>
                        <span className="list-nav-row-sub block">{item.categoryName}</span>
                      </span>
                      <span className="list-nav-row-chevron" aria-hidden="true">
                        <span className="material-symbols-outlined">chevron_right</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="nothing-yet py-10">
              <span className="nothing-yet-icon" aria-hidden="true">
                <span className="material-symbols-outlined">search_off</span>
              </span>
              <p className="nothing-yet-title">No articles matched</p>
              <p className="nothing-yet-sub">
                Nothing in our help articles matches &ldquo;{echoQuery(q)}&rdquo;. Try a different
                word, or browse a topic below.
              </p>
            </div>
          )}

          {search.resultCount === 0 ? (
            <HelpBrowseSection
              categories={categories}
              frequent={frequent}
              initialTab="topics"
            />
          ) : null}
        </section>
      ) : (
        <>
          {q.length > 0 && q.length < HELP_QUERY_MIN_LENGTH ? (
            <p className="m-0 mt-8 mb-0 text-sm text-[var(--muted)]" role="status">
              Type at least {HELP_QUERY_MIN_LENGTH} characters to search.
            </p>
          ) : null}
          <HelpBrowseSection
            categories={categories}
            frequent={frequent}
            initialTab={initialTab}
          />
        </>
      )}

      <HelpContactBand
        signedIn={signedIn}
        defaultEmail={defaultEmail}
        nextPath="/help"
      />
    </HelpChrome>
  )
}
