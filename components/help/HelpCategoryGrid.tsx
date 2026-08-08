import Link from 'next/link'
import type { HelpCategory } from '@/lib/help/types'

export function HelpCategoryGrid({
  categories,
}: {
  categories: HelpCategory[]
}): React.ReactElement {
  return (
    <div className="dp-tile-grid" role="list" aria-label="Help topics">
      {categories.map((cat) => (
        <article key={cat.slug} className="dp-tile" role="listitem">
          <Link
            href={`/help/${cat.slug}`}
            className="dp-tile-link"
            aria-label={`${cat.name}${cat.articleCount > 0 ? `, ${cat.articleCount} articles` : ''}`}
          />
          <div
            className="flex items-center justify-center shrink-0 m-4 mb-0 rounded-[14px]"
            style={{
              width: 48,
              height: 48,
              background: 'var(--brand-tint)',
              color: 'var(--brand)',
            }}
            aria-hidden="true"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              {cat.iconName}
            </span>
          </div>
          <div className="dp-tile-meta" style={{ padding: '0.85rem 1rem 1.1rem', gap: '0.25rem' }}>
            <h2 className="dp-tile-name" style={{ fontSize: '1rem', margin: 0 }}>
              {cat.name}
            </h2>
            <p className="dp-tile-sub m-0" style={{ WebkitLineClamp: 1 }}>
              {cat.description}
            </p>
            {cat.articleCount > 0 ? (
              <p className="dp-tile-sub m-0 mt-1">
                {cat.articleCount} {cat.articleCount === 1 ? 'article' : 'articles'}
              </p>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  )
}
