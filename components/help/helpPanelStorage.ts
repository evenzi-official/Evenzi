export type HelpPanelNode =
  | 'root'
  | 'category'
  | 'answer'
  | 'search'
  | 'ticket'
  | 'success'

export type HelpPanelPersisted = {
  node: HelpPanelNode
  categorySlug: string | null
  articleSlug: string | null
  query: string
}

const STORAGE_KEY = 'evenzi.help-panel'

export const DEFAULT_PANEL_STATE: HelpPanelPersisted = {
  node: 'root',
  categorySlug: null,
  articleSlug: null,
  query: '',
}

export function loadPanelState(): HelpPanelPersisted {
  if (typeof window === 'undefined') return { ...DEFAULT_PANEL_STATE }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PANEL_STATE }
    const parsed = JSON.parse(raw) as Partial<HelpPanelPersisted>
    const node = parsed.node
    if (
      node !== 'root' &&
      node !== 'category' &&
      node !== 'answer' &&
      node !== 'search' &&
      node !== 'ticket' &&
      node !== 'success'
    ) {
      return { ...DEFAULT_PANEL_STATE }
    }
    return {
      node,
      categorySlug: typeof parsed.categorySlug === 'string' ? parsed.categorySlug : null,
      articleSlug: typeof parsed.articleSlug === 'string' ? parsed.articleSlug : null,
      query: typeof parsed.query === 'string' ? parsed.query : '',
    }
  } catch {
    return { ...DEFAULT_PANEL_STATE }
  }
}

export function savePanelState(state: HelpPanelPersisted): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* quota / private mode — navigation still works without persistence */
  }
}

/** Ticket drafts must not survive a route change (UI spec A10). */
export function resetTicketOnRouteChange(): void {
  const current = loadPanelState()
  if (current.node === 'ticket' || current.node === 'success') {
    savePanelState({ ...DEFAULT_PANEL_STATE })
  }
}
