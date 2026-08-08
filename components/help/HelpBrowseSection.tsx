'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HelpCategoryGrid } from '@/components/help/HelpCategoryGrid'
import type { HelpCategory } from '@/lib/help/types'

export type FrequentArticleLink = {
  id: string
  slug: string
  question: string
  categoryName: string
}

type BrowseTab = 'topics' | 'frequent'

/**
 * Browse topics ↔ Frequent toggle for `/help`.
 * Frequent tab only renders when there is at least one curated article.
 */
export function HelpBrowseSection({
  categories,
  frequent,
  initialTab = 'topics',
}: {
  categories: HelpCategory[]
  frequent: FrequentArticleLink[]
  initialTab?: BrowseTab
}): React.ReactElement {
  const hasFrequent = frequent.length > 0
  const [tab, setTab] = useState<BrowseTab>(
    hasFrequent && initialTab === 'frequent' ? 'frequent' : 'topics'
  )

  return (
    <section className="mt-10">
      {hasFrequent ? (
        <div
          className="seg seg--fill mb-6 max-w-[420px]"
          role="radiogroup"
          aria-label="Help browse mode"
        >
          <button
            type="button"
            role="radio"
            aria-checked={tab === 'topics'}
            className={`seg-item${tab === 'topics' ? ' is-active' : ''}`}
            onClick={() => setTab('topics')}
          >
            Browse topics
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={tab === 'frequent'}
            className={`seg-item${tab === 'frequent' ? ' is-active' : ''}`}
            onClick={() => setTab('frequent')}
          >
            Frequent
          </button>
        </div>
      ) : (
        <h2 className="section-rule mb-4">
          <span className="section-rule-bar" />
          Browse topics
        </h2>
      )}

      {tab === 'frequent' && hasFrequent ? (
        <ul className="m-0 flex list-none flex-col p-0" role="list">
          {frequent.map((item) => (
            <li key={item.id}>
              <Link href={`/help/a/${item.slug}`} className="list-nav-row list-nav-row--no-icon">
                <span className="min-w-0">
                  <span className="list-nav-row-label">{item.question}</span>
                  {item.categoryName ? (
                    <span className="list-nav-row-sub block">{item.categoryName}</span>
                  ) : null}
                </span>
                <span className="list-nav-row-chevron" aria-hidden="true">
                  <span className="material-symbols-outlined">chevron_right</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <HelpCategoryGrid categories={categories} />
      )}
    </section>
  )
}
