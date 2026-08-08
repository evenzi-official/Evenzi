'use client'

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react'
import { useRouter } from 'next/navigation'
import { OverlaySurface } from '@/components/ui/OverlaySurface'
import { Portal } from '@/components/ui/Portal'
import { APP_HELP_CATEGORIES } from '@/lib/help/categories'
import { HELP_QUERY_MIN_LENGTH } from '@/lib/help/search'
import type { HelpArticle, HelpSearchResultItem } from '@/lib/help/types'
import { createClient } from '@/lib/supabase/client'
import { EscalateFooter } from '@/components/help/EscalateFooter'
import { HelpArticleBody } from '@/components/help/HelpArticleBody'
import { HelpSearchInput } from '@/components/help/HelpSearchInput'
import { TicketForm } from '@/components/help/TicketForm'
import {
  fetchCategoryArticles,
  fetchCategoryCounts,
  fetchPublishedArticle,
  formatHelpDate,
  patchQueryOutcome,
  searchHelp,
  showHelpToast,
  submitFeedback,
  truncateMiddle,
} from '@/components/help/helpPanelData'
import {
  DEFAULT_PANEL_STATE,
  loadPanelState,
  savePanelState,
  type HelpPanelPersisted,
} from '@/components/help/helpPanelStorage'

const HEAD_BTN: CSSProperties = {
  width: 44,
  height: 44,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 0,
  background: 'transparent',
  borderRadius: 10,
  cursor: 'pointer',
  color: 'var(--ink)',
  flexShrink: 0,
  position: 'relative',
}

export type HelpPanelProps = {
  open: boolean
  onClose: () => void
  triggerRef: RefObject<HTMLElement | null>
}

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = (): void => setMobile(mq.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return mobile
}

function useOnline(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  useEffect(() => {
    const goOnline = (): void => setOnline(true)
    const goOffline = (): void => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])
  return online
}

export function HelpPanel({ open, onClose, triggerRef }: HelpPanelProps): React.ReactElement | null {
  const router = useRouter()
  const isMobile = useIsMobile()
  const online = useOnline()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const escalateRef = useRef<HTMLDivElement>(null)
  const historyPushedRef = useRef(false)
  const closingViaPopRef = useRef(false)
  const queryRefId = useRef<string | null>(null)
  const searchAbortRef = useRef<AbortController | null>(null)
  const searchSkeletonTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const articleTitleHint = useRef<string | null>(null)

  const [persisted, setPersisted] = useState<HelpPanelPersisted>(DEFAULT_PANEL_STATE)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})
  const [counts, setCounts] = useState<Record<string, number> | null | undefined>(undefined)
  const [countsError, setCountsError] = useState(false)
  const [categoryDesc, setCategoryDesc] = useState('')
  const [categoryArticles, setCategoryArticles] = useState<
    Array<{ id: string; slug: string; question: string }>
  >([])
  const [categoryTotal, setCategoryTotal] = useState(0)
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [categoryShowSkeleton, setCategoryShowSkeleton] = useState(false)
  const [categoryError, setCategoryError] = useState(false)
  const [article, setArticle] = useState<HelpArticle | null>(null)
  const [articleLoading, setArticleLoading] = useState(false)
  const [articleError, setArticleError] = useState(false)
  const [feedbackDone, setFeedbackDone] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState<HelpSearchResultItem[] | null>(null)
  const [searchConfident, setSearchConfident] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchShowSkeleton, setSearchShowSkeleton] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const [ticketEmail, setTicketEmail] = useState('')
  const [successRef, setSuccessRef] = useState<string | null>(null)
  const [successEmail, setSuccessEmail] = useState('')
  const successHeadingRef = useRef<HTMLHeadingElement>(null)
  const liveId = useId()

  const node = persisted.node
  const categorySlug = persisted.categorySlug
  const articleSlug = persisted.articleSlug
  const query = persisted.query

  const transition = useCallback((next: HelpPanelPersisted): void => {
    setPersisted(next)
    savePanelState(next)
  }, [])

  // Restore persisted navigation when opening.
  useEffect(() => {
    if (!open) return
    const stored = loadPanelState()
    setPersisted(stored)
    setSearchInput(stored.query)
    articleTitleHint.current = null
    setFeedbackDone(false)
    setSuccessRef(null)
    titleRef.current?.focus()
    // Defer focus to after paint — OverlaySurface mounts asynchronously.
    requestAnimationFrame(() => titleRef.current?.focus())
  }, [open])

  // Mobile history entry for Android hardware Back.
  useEffect(() => {
    if (!open) return
    if (!isMobile) return
    if (historyPushedRef.current) return
    window.history.pushState({ evenziHelpPanel: true }, '')
    historyPushedRef.current = true

    function onPopState(): void {
      if (!historyPushedRef.current) return
      historyPushedRef.current = false
      closingViaPopRef.current = true
      onClose()
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [open, isMobile, onClose])

  // Pop the throwaway entry when closing from UI (not via popstate).
  useEffect(() => {
    if (open) return
    if (closingViaPopRef.current) {
      closingViaPopRef.current = false
      return
    }
    if (historyPushedRef.current) {
      historyPushedRef.current = false
      window.history.back()
    }
  }, [open])

  // Position docked panel above the FAB.
  const positionPanel = useCallback((): void => {
    if (isMobile) {
      setPanelStyle({})
      return
    }
    const fab = triggerRef.current
    if (!fab) {
      setPanelStyle({
        bottom: 'calc(5.75rem + env(safe-area-inset-bottom, 0px))',
        right: 'max(1.25rem, calc(1.25rem + env(safe-area-inset-right, 0px)))',
        width: 400,
        maxWidth: 'calc(100vw - 2rem)',
        maxHeight: 'min(78dvh, 640px)',
        display: 'flex',
        flexDirection: 'column',
      })
      return
    }
    const rect = fab.getBoundingClientRect()
    setPanelStyle({
      bottom: Math.max(12, window.innerHeight - rect.top + 12),
      right: Math.max(12, window.innerWidth - rect.right),
      width: 400,
      maxWidth: 'calc(100vw - 2rem)',
      maxHeight: 'min(78dvh, 640px)',
      display: 'flex',
      flexDirection: 'column',
    })
  }, [isMobile, triggerRef])

  useEffect(() => {
    if (!open) return
    positionPanel()
    window.addEventListener('resize', positionPanel)
    return () => window.removeEventListener('resize', positionPanel)
  }, [open, positionPanel, node])

  // Prefill ticket email from session.
  useEffect(() => {
    if (!open) return
    void (async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setTicketEmail(user?.email ?? '')
      } catch {
        setTicketEmail('')
      }
    })()
  }, [open])

  // A1 category counts.
  const loadCounts = useCallback(async (): Promise<void> => {
    setCountsError(false)
    setCounts(undefined)
    const result = await fetchCategoryCounts()
    if (result === null) {
      setCountsError(true)
      setCounts(null)
    } else {
      setCounts(result)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    if (node === 'root' || node === 'search') void loadCounts()
  }, [open, node, loadCounts])

  // A3 category articles.
  useEffect(() => {
    if (!open || node !== 'category' || !categorySlug) return
    let cancelled = false
    setCategoryError(false)
    setCategoryLoading(true)
    setCategoryShowSkeleton(false)
    const timer = setTimeout(() => {
      if (!cancelled) setCategoryShowSkeleton(true)
    }, 250)

    void fetchCategoryArticles(categorySlug).then((result) => {
      if (cancelled) return
      clearTimeout(timer)
      setCategoryLoading(false)
      setCategoryShowSkeleton(false)
      if (!result) {
        setCategoryError(true)
        setCategoryArticles([])
        setCategoryTotal(0)
        setCategoryDesc('')
        return
      }
      setCategoryDesc(result.description)
      setCategoryArticles(result.articles.slice(0, 5))
      setCategoryTotal(result.total)
    })

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [open, node, categorySlug])

  // A4 article body.
  useEffect(() => {
    if (!open || node !== 'answer' || !articleSlug) return
    let cancelled = false
    setArticleError(false)
    setArticleLoading(true)
    setFeedbackDone(false)

    void fetchPublishedArticle(articleSlug).then((result) => {
      if (cancelled) return
      setArticleLoading(false)
      if (!result) {
        setArticleError(true)
        setArticle(null)
        return
      }
      setArticle(result)
      articleTitleHint.current = result.question
      if (queryRefId.current) {
        void patchQueryOutcome(queryRefId.current, { resolved: true })
      }
    })

    return () => {
      cancelled = true
    }
  }, [open, node, articleSlug])

  // Focus success heading.
  useEffect(() => {
    if (node === 'success') {
      requestAnimationFrame(() => successHeadingRef.current?.focus())
    }
  }, [node, successRef])

  const runSearch = useCallback(
    async (q: string): Promise<void> => {
      const trimmed = q.trim()
      searchAbortRef.current?.abort()
      if (searchSkeletonTimer.current) {
        clearTimeout(searchSkeletonTimer.current)
        searchSkeletonTimer.current = null
      }

      if (trimmed.length < HELP_QUERY_MIN_LENGTH) {
        setSearchLoading(false)
        setSearchShowSkeleton(false)
        setSearchResults(null)
        setSearchError(false)
        if (node === 'search') {
          transition({
            node: categorySlug ? 'category' : 'root',
            categorySlug,
            articleSlug: null,
            query: '',
          })
        }
        return
      }

      transition({
        node: 'search',
        categorySlug,
        articleSlug: null,
        query: trimmed,
      })

      if (!navigator.onLine) {
        setSearchError(true)
        setSearchLoading(false)
        setSearchShowSkeleton(false)
        setSearchResults([])
        setSearchConfident(false)
        return
      }

      const ac = new AbortController()
      searchAbortRef.current = ac
      setSearchLoading(true)
      setSearchShowSkeleton(false)
      setSearchError(false)
      searchSkeletonTimer.current = setTimeout(() => {
        if (!ac.signal.aborted) setSearchShowSkeleton(true)
      }, 250)

      try {
        const data = await searchHelp(trimmed, ac.signal)
        if (ac.signal.aborted) return
        queryRefId.current = data.queryRef
        setSearchResults(data.results)
        setSearchConfident(data.confident)
        setSearchError(false)
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return
        setSearchError(true)
        setSearchResults([])
        setSearchConfident(false)
      } finally {
        if (searchSkeletonTimer.current) {
          clearTimeout(searchSkeletonTimer.current)
          searchSkeletonTimer.current = null
        }
        if (!ac.signal.aborted) {
          setSearchLoading(false)
          setSearchShowSkeleton(false)
        }
      }
    },
    [categorySlug, node, transition]
  )

  const goRoot = useCallback((): void => {
    setSearchInput('')
    queryRefId.current = null
    transition({ ...DEFAULT_PANEL_STATE })
  }, [transition])

  const goCategory = useCallback(
    (slug: string): void => {
      setSearchInput('')
      transition({
        node: 'category',
        categorySlug: slug,
        articleSlug: null,
        query: '',
      })
    },
    [transition]
  )

  const openArticleFromRow = useCallback(
    (slug: string, title: string, fromSearch: boolean, resultCategorySlug?: string): void => {
      articleTitleHint.current = title
      transition({
        node: 'answer',
        categorySlug: fromSearch ? resultCategorySlug ?? categorySlug : categorySlug,
        articleSlug: slug,
        query: fromSearch ? query || searchInput.trim() : '',
      })
    },
    [categorySlug, query, searchInput, transition]
  )

  const goTicket = useCallback((): void => {
    if (queryRefId.current) {
      void patchQueryOutcome(queryRefId.current, { escalated: true })
    }
    transition({
      node: 'ticket',
      categorySlug,
      articleSlug,
      query,
    })
  }, [articleSlug, categorySlug, query, transition])

  const goBack = useCallback((): void => {
    if (node === 'success' || node === 'ticket') {
      if (articleSlug) {
        transition({ node: 'answer', categorySlug, articleSlug, query })
      } else if (query) {
        transition({ node: 'search', categorySlug, articleSlug: null, query })
      } else if (categorySlug) {
        transition({ node: 'category', categorySlug, articleSlug: null, query: '' })
      } else {
        goRoot()
      }
      return
    }
    if (node === 'answer') {
      if (query) {
        transition({ node: 'search', categorySlug, articleSlug: null, query })
      } else if (categorySlug) {
        transition({ node: 'category', categorySlug, articleSlug: null, query: '' })
      } else {
        goRoot()
      }
      return
    }
    if (node === 'search' || node === 'category') {
      goRoot()
    }
  }, [articleSlug, categorySlug, goRoot, node, query, transition])

  const navigateAway = useCallback(
    (href: string): void => {
      onClose()
      router.push(href)
    },
    [onClose, router]
  )

  const categoryMeta = APP_HELP_CATEGORIES.find((c) => c.slug === categorySlug)
  const categoryName = categoryMeta?.name ?? 'Help Centre'

  const titleText = ((): string => {
    switch (node) {
      case 'root':
        return 'Help Centre'
      case 'category':
        return categoryName
      case 'answer':
        return article?.question ?? articleTitleHint.current ?? 'Article'
      case 'search':
        return 'Search results'
      case 'ticket':
      case 'success':
        return 'Contact support'
      default:
        return 'Help Centre'
    }
  })()

  const backLabel = ((): string | null => {
    if (node === 'root') return null
    if (node === 'category' || node === 'search') return 'Back to topics'
    if (node === 'answer') {
      if (query) return 'Back to results'
      return `Back to ${categoryName}`
    }
    if (node === 'ticket' || node === 'success') {
      if (articleSlug) return `Back to ${article?.question ?? articleTitleHint.current ?? 'article'}`
      if (query) return 'Back to results'
      if (categorySlug) return `Back to ${categoryName}`
      return 'Back to topics'
    }
    return 'Back'
  })()

  const showSearch =
    node === 'root' || node === 'category' || node === 'search'
  const showEscalate =
    node === 'root' ||
    node === 'category' ||
    node === 'answer' ||
    node === 'search'
  const noMatch =
    node === 'search' &&
    !searchLoading &&
    !searchError &&
    searchResults !== null &&
    (!searchConfident || searchResults.length === 0)

  const escalateLead = noMatch
    ? "Can't find it? Send us your question and a person will reply."
    : 'Still stuck?'

  const head = (
    <header
      className="help-panel-head shrink-0 flex items-center gap-1 px-2"
      style={{
        height: 56,
        borderBottom: '1px solid var(--line-soft)',
        position: isMobile ? 'sticky' : 'static',
        top: 0,
        background: 'var(--card)',
        zIndex: 1,
      }}
    >
      {backLabel ? (
        <button
          type="button"
          style={HEAD_BTN}
          aria-label={backLabel}
          onClick={goBack}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            chevron_left
          </span>
        </button>
      ) : (
        <span style={{ width: 44, height: 44, flexShrink: 0 }} aria-hidden="true" />
      )}
      <h2
        id="help-panel-title"
        ref={titleRef}
        tabIndex={-1}
        className="m-0 flex-1 truncate text-center text-[15px] font-bold text-[var(--ink)] outline-none"
        style={{ letterSpacing: '-0.01em' }}
        aria-live="polite"
      >
        {titleText}
      </h2>
      <button
        type="button"
        style={HEAD_BTN}
        aria-label="Close Help Centre"
        onClick={onClose}
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          close
        </span>
      </button>
    </header>
  )

  const offlineBanner =
    !online ? (
      <div className="alert-banner alert-banner--info mx-4 mt-3" role="alert">
        <p className="m-0">You&apos;re offline. Search and articles need a connection.</p>
      </div>
    ) : null

  const countsBanner =
    online && countsError && node === 'root' ? (
      <div className="alert-banner alert-banner--danger mx-4 mt-3" role="alert">
        <p className="m-0">Couldn&apos;t load help topics. Check your connection.</p>
        <button type="button" className="btn-pill btn-pill-ghost btn-pill-sm" onClick={() => void loadCounts()}>
          Try again
        </button>
      </div>
    ) : null

  const body = (
    <div className="help-panel-body flex-1 overflow-y-auto overscroll-contain px-4 py-3">
      {offlineBanner}
      {countsBanner}

      {showSearch ? (
        <div className="mb-3">
          <HelpSearchInput
            value={searchInput}
            onChange={setSearchInput}
            onDebouncedChange={(v) => {
              void runSearch(v)
            }}
            debounceMs={300}
            disabled={!online}
            helperText={
              !online
                ? 'Search needs a connection'
                : searchInput.trim().length > 0 &&
                    searchInput.trim().length < HELP_QUERY_MIN_LENGTH
                  ? 'Keep typing to search.'
                  : undefined
            }
          />
        </div>
      ) : null}

      {node === 'root' ? (
        <>
          <h3 className="section-rule m-0 mb-2">
            <span className="section-rule-bar" aria-hidden="true" />
            Browse topics
          </h3>
          <ul role="list" className="m-0 flex list-none flex-col gap-0.5 p-0">
            {APP_HELP_CATEGORIES.map((cat) => {
              const count = counts?.[cat.slug]
              const showCount =
                counts !== undefined && counts !== null && typeof count === 'number' && count > 0
              const showSkeleton = counts === undefined
              return (
                <li key={cat.slug}>
                  <button
                    type="button"
                    className="list-nav-row"
                    onClick={() => goCategory(cat.slug)}
                  >
                    <span className="list-nav-row-icon" aria-hidden="true">
                      <span className="material-symbols-outlined">{cat.iconName}</span>
                    </span>
                    <span>
                      <span className="list-nav-row-label">{cat.name}</span>
                      {showSkeleton ? (
                        <span
                          className="skeleton skeleton-line mt-1 block"
                          style={{ width: 28, height: 10 }}
                          aria-hidden="true"
                        />
                      ) : showCount ? (
                        <span className="list-nav-row-sub">
                          {count} {count === 1 ? 'article' : 'articles'}
                        </span>
                      ) : null}
                    </span>
                    <span className="list-nav-row-chevron" aria-hidden="true">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      ) : null}

      {node === 'category' ? (
        <>
          {categoryDesc ? (
            <p className="m-0 mb-3 text-[13px] text-[var(--muted)]">{categoryDesc}</p>
          ) : null}
          {categoryError ? (
            <div className="alert-banner alert-banner--danger" role="alert">
              <p className="m-0">Couldn&apos;t load articles in this topic.</p>
              <button
                type="button"
                className="btn-pill btn-pill-ghost btn-pill-sm"
                onClick={() => {
                  if (categorySlug) goCategory(categorySlug)
                }}
              >
                Try again
              </button>
            </div>
          ) : null}
          {categoryLoading && categoryShowSkeleton ? (
            <div className="flex flex-col gap-2" aria-hidden="true">
              {[85, 70, 90].map((w) => (
                <div
                  key={w}
                  className="skeleton skeleton-line"
                  style={{ width: `${w}%`, height: 56, borderRadius: 10 }}
                />
              ))}
            </div>
          ) : null}
          {!categoryLoading && !categoryError && categoryTotal === 0 ? (
            <div className="flex flex-col items-center px-4 py-8 text-center">
              <span
                className="material-symbols-outlined mb-2 text-[32px] text-[var(--muted-soft)]"
                aria-hidden="true"
              >
                article
              </span>
              <p className="m-0 text-[15px] font-bold text-[var(--ink)]">Nothing here yet</p>
              <p className="m-0 mt-2 text-[13px] text-[var(--muted)]">
                We haven&apos;t published articles in {categoryName} yet. Search across all
                topics, or send us your question.
              </p>
            </div>
          ) : null}
          {!categoryLoading && categoryArticles.length > 0 ? (
            <ul role="list" className="m-0 flex list-none flex-col gap-0.5 p-0">
              {categoryArticles.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    className="list-nav-row list-nav-row--no-icon"
                    onClick={() => openArticleFromRow(a.slug, a.question, false)}
                  >
                    <span>
                      <span className="list-nav-row-label">{a.question}</span>
                    </span>
                    <span className="list-nav-row-chevron" aria-hidden="true">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {!categoryLoading && categoryTotal > 5 && categorySlug ? (
            <button
              type="button"
              className="btn-pill btn-pill-ghost mt-3 w-full justify-center"
              onClick={() => navigateAway(`/help/${categorySlug}`)}
            >
              See all {categoryTotal} in {categoryName}
            </button>
          ) : null}
        </>
      ) : null}

      {node === 'answer' ? (
        <>
          <h3 className="m-0 text-[17px] font-bold leading-snug text-[var(--ink)]">
            {article?.question ?? articleTitleHint.current ?? '…'}
          </h3>
          {(article?.categoryName || categoryName) && (
            <p
              className="m-0 mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]"
            >
              {article?.categoryName ?? categoryName}
              {article?.updatedAt ? ` · Updated ${formatHelpDate(article.updatedAt)}` : null}
            </p>
          )}
          {articleError ? (
            <div className="alert-banner alert-banner--danger mt-3" role="alert">
              <p className="m-0">Couldn&apos;t load this article.</p>
              <button
                type="button"
                className="btn-pill btn-pill-ghost btn-pill-sm"
                onClick={() => {
                  if (articleSlug) {
                    openArticleFromRow(
                      articleSlug,
                      articleTitleHint.current ?? '',
                      Boolean(query)
                    )
                  }
                }}
              >
                Try again
              </button>
            </div>
          ) : null}
          {articleLoading && !article ? (
            <div className="mt-4 flex flex-col gap-2" aria-hidden="true">
              {[100, 95, 88, 60].map((w) => (
                <div
                  key={w}
                  className="skeleton skeleton-line"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          ) : null}
          {article ? (
            <div className="mt-4">
              <HelpArticleBody
                answer={article.answer}
                onInternalArticle={(slug) => openArticleFromRow(slug, '', Boolean(query))}
              />
            </div>
          ) : null}
          {article && !articleError ? (
            <div className="mt-5 flex flex-col gap-3">
              {feedbackDone ? (
                <p className="m-0 text-xs text-[var(--muted)]" role="status">
                  Thanks — noted.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[var(--muted)]">Was this helpful?</span>
                  <button
                    type="button"
                    className="btn-pill btn-pill-ghost btn-pill-sm"
                    onClick={() => {
                      void submitFeedback(article.slug, true)
                      setFeedbackDone(true)
                    }}
                  >
                    <span className="material-symbols-outlined mr-1 text-[16px]" aria-hidden="true">
                      thumb_up
                    </span>
                    Yes
                  </button>
                  <button
                    type="button"
                    className="btn-pill btn-pill-ghost btn-pill-sm"
                    onClick={() => {
                      void submitFeedback(article.slug, false)
                      setFeedbackDone(true)
                      escalateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                    }}
                  >
                    <span className="material-symbols-outlined mr-1 text-[16px]" aria-hidden="true">
                      thumb_down
                    </span>
                    No
                  </button>
                </div>
              )}
              <button
                type="button"
                className="btn-pill btn-pill-ghost btn-pill-sm self-start"
                onClick={() => navigateAway(`/help/a/${article.slug}`)}
              >
                Open as page
                <span className="material-symbols-outlined ml-1 text-[16px]" aria-hidden="true">
                  open_in_new
                </span>
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {node === 'search' ? (
        <>
          <p
            id={liveId}
            className="m-0 mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]"
            aria-live="polite"
          >
            {searchLoading
              ? 'Searching…'
              : noMatch
                ? `No articles matched "${truncateMiddle(query)}"`
                : searchResults
                  ? `${searchResults.length} result${searchResults.length === 1 ? '' : 's'} for "${truncateMiddle(query)}"`
                  : null}
          </p>
          {searchError ? (
            <div className="alert-banner alert-banner--danger" role="alert">
              <p className="m-0">Couldn&apos;t search just now. Check your connection.</p>
              <button
                type="button"
                className="btn-pill btn-pill-ghost btn-pill-sm"
                onClick={() => void runSearch(query)}
              >
                Try again
              </button>
            </div>
          ) : null}
          {searchShowSkeleton ? (
            <div className="flex flex-col gap-2" aria-hidden="true">
              {[85, 70, 90].map((w) => (
                <div
                  key={w}
                  className="skeleton skeleton-line"
                  style={{ width: `${w}%`, height: 56, borderRadius: 10 }}
                />
              ))}
            </div>
          ) : null}
          {noMatch ? (
            <div className="flex flex-col items-center px-2 py-6 text-center">
              <span
                className="material-symbols-outlined mb-2 text-[32px] text-[var(--muted-soft)]"
                aria-hidden="true"
              >
                search_off
              </span>
              <h3 className="m-0 text-[15px] font-bold text-[var(--ink)]">No articles matched</h3>
              <p className="m-0 mt-2 text-[13px] text-[var(--muted)]">
                Nothing in our help articles matches &quot;{truncateMiddle(query)}&quot;. Try a
                different word, or browse a topic below.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {APP_HELP_CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    className="tag-chip"
                    onClick={() => goCategory(cat.slug)}
                  >
                    <span className="tag-chip-label">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {!searchLoading &&
          !noMatch &&
          searchResults &&
          searchResults.length > 0 ? (
            <ul role="list" className="m-0 flex list-none flex-col gap-0.5 p-0">
              {searchResults.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className="list-nav-row list-nav-row--no-icon"
                    onClick={() => openArticleFromRow(r.slug, r.question, true, r.categorySlug)}
                  >
                    <span>
                      <span className="list-nav-row-label">{r.question}</span>
                      <span className="list-nav-row-sub">{r.categoryName}</span>
                    </span>
                    <span className="list-nav-row-chevron" aria-hidden="true">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}

      {node === 'ticket' ? (
        <TicketForm
          key={`${categorySlug ?? ''}-${articleSlug ?? ''}`}
          defaultEmail={ticketEmail}
          topicSlug={categorySlug ?? undefined}
          articleSlug={articleSlug ?? undefined}
          onCancel={goBack}
          onSuccess={(reference, email) => {
            setSuccessRef(reference)
            setSuccessEmail(email)
            transition({
              node: 'success',
              categorySlug,
              articleSlug,
              query,
            })
          }}
        />
      ) : null}

      {node === 'success' && successRef ? (
        <div className="flex flex-col items-stretch py-4" role="status">
          <span
            className="material-symbols-outlined mb-3 text-[40px] text-[var(--success)]"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            check_circle
          </span>
          <h3
            ref={successHeadingRef}
            tabIndex={-1}
            className="m-0 text-[17px] font-bold text-[var(--ink)] outline-none"
          >
            Message sent
          </h3>
          <p className="m-0 mt-2 text-sm text-[var(--ink-soft)]">
            A member of our team will reply to <strong>{successEmail || 'your email'}</strong>{' '}
            within 24 hours.
          </p>
          <div className="mt-4">
            <p className="form-label m-0 mb-1">Your reference</p>
            <div className="clay-pill flex items-center gap-2 bg-[var(--line-soft)] px-3 py-2">
              <code className="flex-1 text-[15px] font-bold tabular-nums text-[var(--ink)]">
                {successRef}
              </code>
              <button
                type="button"
                style={HEAD_BTN}
                aria-label="Copy reference"
                onClick={() => {
                  void navigator.clipboard?.writeText(successRef).then(() => {
                    showHelpToast('REFERENCE COPIED')
                  })
                }}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  content_copy
                </span>
              </button>
            </div>
            <p className="m-0 mt-2 text-xs text-[var(--muted)]">Quote this if you follow up.</p>
          </div>
          <button
            type="button"
            className="btn-pill btn-pill-primary mt-6 w-full justify-center"
            onClick={() => {
              savePanelState({ ...DEFAULT_PANEL_STATE })
              onClose()
            }}
          >
            Done
          </button>
        </div>
      ) : null}
    </div>
  )

  const footer = showEscalate ? (
    <div ref={escalateRef}>
      <EscalateFooter
        lead={escalateLead}
        helperText={
          !online ? "You'll be able to send this once you're back online" : undefined
        }
        actions={[
          {
            id: 'contact',
            label: 'Contact support',
            variant: noMatch ? 'primary' : 'secondary',
            fullWidth: noMatch,
            disabled: !online,
            onClick: goTicket,
          },
          {
            id: 'open-page',
            label: 'Open Help Centre',
            variant: 'ghost',
            desktopOnly: true,
            icon: 'open_in_new',
            onClick: () => navigateAway('/help'),
          },
        ]}
      />
    </div>
  ) : null

  const surface = isMobile ? (
    <OverlaySurface
      open={open}
      onClose={onClose}
      modal
      labelledBy="help-panel-title"
      id="help-panel"
      className="modal-scrim is-open"
      triggerRef={triggerRef}
    >
      <div
        className="modal-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 1rem)',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {head}
        {body}
        {footer}
      </div>
    </OverlaySurface>
  ) : (
    <OverlaySurface
      open={open}
      onClose={onClose}
      modal={false}
      labelledBy="help-panel-title"
      id="help-panel"
      className=""
      triggerRef={triggerRef}
    >
      <div className="dock-panel dock-panel--origin-br is-open" style={panelStyle}>
        {head}
        {body}
        {footer}
      </div>
    </OverlaySurface>
  )

  // Keep OverlaySurface mounted while closed so focus-return on the FAB runs.
  // A0: OverlaySurface returns null when open=false — panel is not in the DOM.
  return <Portal>{surface}</Portal>
}
