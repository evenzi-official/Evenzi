'use client'

import { useEffect, useState } from 'react'
import { renderHelpMarkdown } from '@/lib/help/markdown'

/**
 * Client-safe article body. Runs the same sanitised Markdown pipeline as the
 * server `HelpArticle` component so the panel does not need a fetch round-trip
 * for HTML — only the raw answer string from the catalog.
 */
export function HelpArticleBody({
  answer,
  onInternalArticle,
}: {
  answer: string
  /** Panel navigation for `/help/a/{slug}` links inside the answer. */
  onInternalArticle?: (slug: string) => void
}): React.ReactElement {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void renderHelpMarkdown(answer).then((rendered) => {
      if (!cancelled) setHtml(rendered)
    })
    return () => {
      cancelled = true
    }
  }, [answer])

  if (!html) {
    return (
      <div className="flex flex-col gap-2" aria-hidden="true">
        <div className="skeleton skeleton-line" style={{ width: '100%' }} />
        <div className="skeleton skeleton-line" style={{ width: '95%' }} />
        <div className="skeleton skeleton-line" style={{ width: '88%' }} />
        <div className="skeleton skeleton-line" style={{ width: '60%' }} />
      </div>
    )
  }

  return (
    <div
      className="prose"
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={(e) => {
        if (!onInternalArticle) return
        const target = (e.target as HTMLElement).closest('a')
        if (!target) return
        const href = target.getAttribute('href')
        if (!href) return
        try {
          const url = new URL(href, window.location.origin)
          const match = url.pathname.match(/^\/help\/a\/([^/]+)\/?$/)
          if (match && url.origin === window.location.origin) {
            e.preventDefault()
            onInternalArticle(decodeURIComponent(match[1]))
          }
        } catch {
          /* ignore malformed hrefs */
        }
      }}
    />
  )
}
