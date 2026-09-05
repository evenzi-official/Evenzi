'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { GuestManagementInitialData, GuestRow, GuestTagOption } from '@/lib/types/guests'
import { GuestPicker, type PickerOption } from './GuestPicker'
import { GuestFormModal } from './GuestFormModal'
import { ImportCsvModal } from './ImportCsvModal'
import { TagManagerModal } from './TagManagerModal'
import { useBusy } from '@/components/ui/BusyProvider'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Portal } from '@/components/ui/Portal'
import { buildGuestInviteUrl, buildInviteText } from '@/lib/invitations/whatsappInvite'

type StatusFilter = 'all' | 'confirmed' | 'declined' | 'pending' | 'maybe'
type SortKey = 'name' | 'recent' | 'status'

const SORT_OPTIONS: PickerOption[] = [
  { value: 'name', label: 'Name A–Z' },
  { value: 'recent', label: 'Recently added' },
  { value: 'status', label: 'Status · needs attention' },
]
const STATUS_SORT_ORDER: Record<string, number> = { pending: 0, maybe: 1, confirmed: 2, declined: 3 }
const STATUS_CHIPS: readonly [StatusFilter, string][] = [
  ['all', 'All'], ['confirmed', 'Confirmed'], ['declined', 'Declined'], ['pending', 'Pending'], ['maybe', 'Maybe'],
]

type PickerState =
  | { kind: 'rsvp'; guestId: string; anchorRect: DOMRect }
  | { kind: 'sort'; anchorRect: DOMRect }
  | { kind: 'filter'; anchorRect: DOMRect }
  | { kind: 'assign'; guestId: string; anchorRect: DOMRect }
  | { kind: 'bulk-tag'; anchorRect: DOMRect }
  | { kind: 'bulk-assign'; anchorRect: DOMRect }
  | null

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return (a + b).toUpperCase()
}
function fmtPhone(p: string): string {
  if (!p) return 'No phone'
  // Stored values may already carry the +91 country code (or none). Normalise to
  // the last 10 digits so we never double-prefix ("+91 +91987 6543210").
  const digits = p.replace(/\D/g, '')
  const ten = digits.length > 10 ? digits.slice(-10) : digits
  return `+91 ${ten.replace(/(\d{5})(\d{5})/, '$1 $2')}`
}

export function GuestManagementClient({ initialData }: { initialData: GuestManagementInitialData }): React.ReactElement {
  const { eventId, guests: initialGuests, rsvpStatuses, subEvents, tags: initialTags,
    eventSlug, defaultGuestMessage, siteOffline } = initialData

  const [guests, setGuests] = useState<GuestRow[]>(initialGuests)
  const [tags, setTags] = useState<GuestTagOption[]>(initialTags)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [subFilters, setSubFilters] = useState<string[]>([])
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [onlyUnassigned, setOnlyUnassigned] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [picker, setPicker] = useState<PickerState>(null)
  const [formModal, setFormModal] = useState<{ mode: 'add' | 'edit'; guest: GuestRow | null } | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [tagManagerOpen, setTagManagerOpen] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  type ToastState = { message: string; action?: { label: string; onClick: () => void } }
  const [toast, setToast] = useState<ToastState | null>(null)
  const { runBusy } = useBusy()
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const toastTimeoutRef = useRef<number | null>(null)

  const statusById = useMemo(() => new Map(rsvpStatuses.map((s) => [s.id, s])), [rsvpStatuses])
  const tagById = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags])

  function showToast(message: string, action?: ToastState['action']): void {
    if (toastTimeoutRef.current !== null) window.clearTimeout(toastTimeoutRef.current)
    setToast({ message, action })
    // Give an actionable toast (e.g. Undo) longer to be caught.
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null)
      toastTimeoutRef.current = null
    }, action ? 6000 : 2500)
  }
  // Message-only convenience — the signature child modals depend on.
  function flashToast(message: string): void { showToast(message) }

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) window.clearTimeout(toastTimeoutRef.current)
    }
  }, [])

  const counts = useMemo(() => {
    const c = { total: guests.length, confirmed: 0, declined: 0, pending: 0, maybe: 0 }
    for (const g of guests) {
      const slug = statusById.get(g.rsvpStatusId)?.slug
      if (slug && slug in c) (c as Record<string, number>)[slug] += 1
    }
    return c
  }, [guests, statusById])

  const zeroAssignedCount = useMemo(() => guests.filter((g) => g.subEventIds.length === 0).length, [guests])

  const visibleGuests = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = guests.filter((g) => {
      if (statusFilter !== 'all' && statusById.get(g.rsvpStatusId)?.slug !== statusFilter) return false
      if (onlyUnassigned && g.subEventIds.length !== 0) return false
      if (subFilters.length && !subFilters.some((s) => g.subEventIds.includes(s))) return false
      if (tagFilters.length && !tagFilters.some((t) => g.tagIds.includes(t))) return false
      if (!q) return true
      return g.name.toLowerCase().includes(q) || g.phone.includes(q) || fmtPhone(g.phone).toLowerCase().includes(q) || (g.email ?? '').toLowerCase().includes(q)
    })
    return [...filtered].sort((a, b) => {
      if (sortKey === 'recent') return b.createdAt.localeCompare(a.createdAt)
      if (sortKey === 'status') {
        const da = STATUS_SORT_ORDER[statusById.get(a.rsvpStatusId)?.slug ?? 'pending'] ?? 0
        const db = STATUS_SORT_ORDER[statusById.get(b.rsvpStatusId)?.slug ?? 'pending'] ?? 0
        return da !== db ? da - db : a.name.localeCompare(b.name)
      }
      return a.name.localeCompare(b.name)
    })
  }, [guests, search, statusFilter, subFilters, tagFilters, onlyUnassigned, sortKey, statusById])

  const responded = counts.confirmed + counts.declined + counts.maybe
  const responseRate = counts.total ? Math.round((responded / counts.total) * 100) : 0

  async function patchGuest(guestId: string, patch: Partial<Pick<GuestRow, 'rsvpStatusId' | 'subEventIds'>>): Promise<void> {
    const prevGuest = guests.find((g) => g.id === guestId)
    setGuests((gs) => gs.map((g) => (g.id === guestId ? { ...g, ...patch } : g)))
    try {
      const body: Record<string, unknown> = {}
      if (patch.rsvpStatusId !== undefined) body.rsvpStatusId = patch.rsvpStatusId
      if (patch.subEventIds !== undefined) body.subEventIds = patch.subEventIds
      const res = await fetch(`/api/events/${eventId}/guests/${guestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('failed')
      flashToast(patch.rsvpStatusId !== undefined ? 'RSVP updated' : 'Functions updated')
    } catch {
      if (prevGuest) {
        setGuests((gs) => gs.map((g) => (g.id === guestId
          ? { ...g, rsvpStatusId: prevGuest.rsvpStatusId, subEventIds: prevGuest.subEventIds }
          : g)))
      }
      flashToast("Couldn't update — try again")
    }
  }

  // ── WhatsApp invites (Path A) ─────────────────────────────────────────────
  const [sendQueueOpen, setSendQueueOpen] = useState(false)
  // Session-local "skip" set so a guest with no phone (or one the host passes on)
  // drops out of the queue without being marked invited. Queue position is
  // otherwise derived entirely from persisted `invited` state — no cursor — so it
  // survives the mobile app-switch into WhatsApp and back.
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set())

  const notInvitedCount = useMemo(() => guests.filter((g) => !g.invited).length, [guests])
  const sendQueue = useMemo(
    () => guests.filter((g) => !g.invited && !skippedIds.has(g.id)),
    [guests, skippedIds],
  )
  const currentInvitee = sendQueue[0] ?? null

  // Build the ready-to-open wa.me URL for a guest, or null if it can't be sent
  // (no event site yet, or no usable phone). origin is read at click time.
  function inviteUrlFor(g: GuestRow): string | null {
    if (!eventSlug) return null
    return buildGuestInviteUrl({
      guestName: g.name,
      phone: g.phone,
      defaultMessage: defaultGuestMessage,
      siteUrl: `${window.location.origin}/e/${eventSlug}`,
    })
  }

  async function markInvited(ids: string[], invited: boolean): Promise<boolean> {
    if (ids.length === 0) return true
    const prev = new Map(guests.filter((g) => ids.includes(g.id)).map((g) => [g.id, g.invited]))
    setGuests((gs) => gs.map((g) => (ids.includes(g.id) ? { ...g, invited } : g)))
    try {
      const res = await fetch(`/api/events/${eventId}/guests/mark-invited`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestIds: ids, invited }),
      })
      if (!res.ok) throw new Error('failed')
      return true
    } catch {
      // Roll back the optimistic change so UI and DB don't diverge.
      setGuests((gs) => gs.map((g) => (prev.has(g.id) ? { ...g, invited: prev.get(g.id) as boolean } : g)))
      flashToast("Couldn't update — try again")
      return false
    }
  }

  // Opening WhatsApp is the host's real action and the only signal we have, so we
  // mark invited on open — paired with an Undo toast and a per-row toggle for the
  // false-positive case where the host opens but doesn't actually send.
  function openWhatsApp(g: GuestRow): void {
    if (!eventSlug) { flashToast('Add your event website first to share an invite link'); return }
    const url = inviteUrlFor(g)
    if (!url) { flashToast(`${g.name} has no valid phone number`); return }
    window.open(url, '_blank', 'noopener,noreferrer')
    const wasInvited = g.invited
    void markInvited([g.id], true).then((ok) => {
      if (ok && !wasInvited) {
        showToast(`Marked ${g.name} as invited`, { label: 'Undo', onClick: () => { void markInvited([g.id], false) } })
      }
    })
  }

  function toggleInvited(g: GuestRow): void {
    void markInvited([g.id], !g.invited)
  }

  const canSendInvites = !!eventSlug

  function upsertGuest(guest: GuestRow): void {
    setGuests((gs) => (gs.some((g) => g.id === guest.id) ? gs.map((g) => (g.id === guest.id ? guest : g)) : [...gs, guest]))
  }
  function removeGuestLocal(guestId: string): void {
    setGuests((gs) => gs.filter((g) => g.id !== guestId))
    setSelectedIds((s) => { const next = new Set(s); next.delete(guestId); return next })
  }

  async function createTag(name: string): Promise<GuestTagOption> {
    const res = await fetch(`/api/events/${eventId}/guest-tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const data: { tag?: GuestTagOption } = await res.json()
    if (!res.ok || !data.tag) throw new Error('failed to create tag')
    setTags((t) => [...t, data.tag as GuestTagOption])
    return data.tag
  }

  function enterSelect(): void { setSelecting(true); setSelectedIds(new Set()) }
  function exitSelect(): void { setSelecting(false); setSelectedIds(new Set()) }
  function toggleSelect(guestId: string): void {
    setSelectedIds((s) => {
      const next = new Set(s)
      if (next.has(guestId)) next.delete(guestId); else next.add(guestId)
      return next
    })
  }
  const allVisibleSelected = visibleGuests.length > 0 && visibleGuests.every((g) => selectedIds.has(g.id))

  function selectAllVisible(): void {
    setSelectedIds(() => (allVisibleSelected ? new Set() : new Set(visibleGuests.map((g) => g.id))))
  }

  async function bulkAction(action: 'tag' | 'assign' | 'delete', payload?: { tagIds?: string[]; subEventIds?: string[] }): Promise<void> {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    const label = action === 'delete' ? 'Removing guests…' : action === 'tag' ? 'Tagging guests…' : 'Updating guests…'
    const res = await runBusy(() => fetch(`/api/events/${eventId}/guests/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, guestIds: ids, ...payload }),
    }), label)
    if (!res.ok) { flashToast('Bulk update failed'); return }
    const n = ids.length
    const plural = n === 1 ? '' : 's'
    if (action === 'delete') {
      setGuests((gs) => gs.filter((g) => !selectedIds.has(g.id)))
      flashToast(`Removed ${n} guest${plural}`)
      exitSelect()
    } else if (action === 'tag') {
      const addIds = payload?.tagIds ?? []
      setGuests((gs) => gs.map((g) => (selectedIds.has(g.id) ? { ...g, tagIds: Array.from(new Set([...g.tagIds, ...addIds])) } : g)))
      flashToast(`Tagged ${n} guest${plural}`)
    } else {
      const newSubEventIds = payload?.subEventIds ?? []
      setGuests((gs) => gs.map((g) => (selectedIds.has(g.id) ? { ...g, subEventIds: newSubEventIds } : g)))
      flashToast(`Set functions for ${n} guest${plural}`)
    }
  }

  function handleBulkDelete(): void {
    if (selectedIds.size === 0) return
    setConfirmBulkDelete(true)
  }

  async function confirmBulkDeleteAction(): Promise<void> {
    setBulkDeleting(true)
    try {
      await bulkAction('delete')
    } finally {
      setBulkDeleting(false)
      setConfirmBulkDelete(false)
    }
  }

  const zero = guests.length === 0
  const noMatches = !zero && visibleGuests.length === 0

  return (
    <main className="page-band pt-6 md:pt-8 pb-24">
      <header className="section-head reveal">
        <p className="section-head-eyebrow">Section</p>
        <div className="section-head-titlerow">
          <h1 className="section-head-title">Guest Management</h1>
        </div>
      </header>

      <section className="gm-stats reveal" aria-label="Guest list summary">
        <div className="clay-card gm-rate" role="group" aria-labelledby="gm-rate-label">
          <span className="stat-icon"><span className="material-symbols-outlined icon-fill">how_to_reg</span></span>
          <div className="min-w-0 w-full">
            <p id="gm-rate-label" className="gm-rate-cap">RSVP response rate</p>
            <p className="gm-rate-num">{responseRate}%</p>
            <div className="pf-bar gm-rate-bar"><span style={{ width: `${responseRate}%` }} /></div>
            <p className="gm-rate-sub">{responded} of {counts.total} responded</p>
          </div>
        </div>
        <div className="gm-counts" role="group" aria-label="Guest counts by status">
          {STATUS_CHIPS.map(([key, label]) => (
            <button
              key={key} type="button" className="clay-card gm-count" aria-pressed={statusFilter === key}
              onClick={() => {
                setStatusFilter(key)
                document.querySelector('.gm-list-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              <span className="gm-count-num">{key === 'all' ? counts.total : counts[key]}</span>
              <span className="gm-count-lbl">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="clay-card gm-list-card reveal" aria-label="Guest list">
        <div className="gm-toolbar">
          <div className={`form-input-search gm-search${search ? ' is-filled' : ''}`}>
            <span aria-hidden="true" className="material-symbols-outlined">search</span>
            <input
              className="form-input" type="search" placeholder="Search by name, phone, email…" aria-label="Search guests"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="form-input-search-clear" type="button" aria-label="Clear search" onClick={() => setSearch('')}>
                <span aria-hidden="true" className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
          <div className="gm-toolbar-actions">
            <button
              type="button" className="btn-pill btn-pill-secondary gm-icon-btn gm-send-btn"
              disabled={!canSendInvites}
              onClick={() => { setSkippedIds(new Set()); setSendQueueOpen(true) }}
              title={canSendInvites ? 'Send WhatsApp invitations' : 'Add your event website first to share an invite link'}
              aria-label="Send WhatsApp invitations"
            >
              <span aria-hidden="true" className="material-symbols-outlined">send</span>
              <span className="gm-btn-label">Send invites</span>
            </button>
            <button type="button" className="btn-pill btn-pill-secondary gm-icon-btn gm-import-btn" aria-label="Import guests from CSV" onClick={() => setImportOpen(true)}>
              <span aria-hidden="true" className="material-symbols-outlined">upload_file</span>
              <span className="gm-btn-label">Import</span>
            </button>
            <button
              type="button"
              className={`btn-pill btn-pill-secondary gm-icon-btn gm-filter-btn${subFilters.length + tagFilters.length > 0 ? ' is-active' : ''}`}
              aria-haspopup="true" aria-label="Filter by function or tag"
              onClick={(e) => setPicker({ kind: 'filter', anchorRect: e.currentTarget.getBoundingClientRect() })}
            >
              <span aria-hidden="true" className="material-symbols-outlined">filter_list</span>
              <span className="gm-btn-label">Filter</span>
              {subFilters.length + tagFilters.length > 0 && <span className="gm-filter-count">{subFilters.length + tagFilters.length}</span>}
            </button>
            <button
              type="button" className="btn-pill btn-pill-secondary gm-icon-btn gm-sort-btn" aria-haspopup="true" aria-label="Sort guests"
              onClick={(e) => setPicker({ kind: 'sort', anchorRect: e.currentTarget.getBoundingClientRect() })}
            >
              <span aria-hidden="true" className="material-symbols-outlined">swap_vert</span>
              <span className="gm-btn-label">{SORT_OPTIONS.find((o) => o.value === sortKey)?.label}</span>
            </button>
            <button type="button" className="btn-pill btn-pill-secondary gm-icon-btn gm-select-btn" aria-label="Select multiple guests" onClick={enterSelect}>
              <span aria-hidden="true" className="material-symbols-outlined">checklist</span>
              <span className="gm-btn-label">Select</span>
            </button>
          </div>
        </div>

        <div className="dp-filter-chips gm-filters" role="radiogroup" aria-label="Filter by RSVP status">
          {STATUS_CHIPS.map(([key, label]) => (
            <button
              key={key} type="button" className={`dp-filter-chip${statusFilter === key ? ' is-active' : ''}`}
              role="radio" aria-checked={statusFilter === key} onClick={() => setStatusFilter(key)}
            >
              {label} {key === 'all' ? counts.total : counts[key]}
            </button>
          ))}
        </div>

        {zeroAssignedCount > 0 && (
          <div className="gm-warn-banner" role="status">
            <span aria-hidden="true" className="material-symbols-outlined">warning</span>
            <span><strong>{zeroAssignedCount}</strong> guest{zeroAssignedCount === 1 ? '' : 's'} aren&apos;t invited to any function — they&apos;ll see nothing.</span>
            <button type="button" className="gm-warn-review" onClick={() => setOnlyUnassigned((v) => !v)}>
              {onlyUnassigned ? 'Show all' : 'Review'}
            </button>
          </div>
        )}

        <div className="guest-row-head" aria-hidden="true"><span /><span>Guest</span><span className="grh-rsvp">RSVP</span></div>

        {zero && (
          <div className="empty-cta-card gm-empty">
            <span className="empty-cta-icon" aria-hidden="true"><span className="material-symbols-outlined">group_add</span></span>
            <p className="empty-cta-title">No guests yet</p>
            <p className="empty-cta-sub">Add your first guest, or import a spreadsheet to bring your whole list in at once.</p>
            <div className="gm-empty-actions">
              <button type="button" className="btn-pill btn-pill-primary" onClick={() => setFormModal({ mode: 'add', guest: null })}>
                <span aria-hidden="true" className="material-symbols-outlined">person_add</span> Add your first guest
              </button>
              <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setImportOpen(true)}>
                <span aria-hidden="true" className="material-symbols-outlined">upload_file</span> Import CSV
              </button>
            </div>
          </div>
        )}

        {noMatches && (
          <div className="gm-empty gm-empty-filtered">
            <span className="empty-cta-icon" aria-hidden="true"><span className="material-symbols-outlined">search_off</span></span>
            <p className="empty-cta-title">No guests match</p>
            <p className="empty-cta-sub">{search ? `Nothing matches "${search}".` : 'Try a different search or filter.'}</p>
            <button
              type="button" className="btn-pill btn-pill-secondary"
              onClick={() => { setSearch(''); setStatusFilter('all'); setSubFilters([]); setTagFilters([]); setOnlyUnassigned(false) }}
            >
              Clear filters
            </button>
          </div>
        )}

        {!zero && !noMatches && (
          <ul className="guest-list" role="list" aria-label="Guests">
            {visibleGuests.map((g) => {
              const status = statusById.get(g.rsvpStatusId)
              const assignedCount = g.subEventIds.length
              const isSelected = selectedIds.has(g.id)
              return (
                <li key={g.id} className={`guest-row${isSelected ? ' is-selected' : ''}`}>
                  <div className="guest-row-surface">
                    <span className="guest-row-avatar" aria-hidden="true">{initials(g.name)}</span>
                    <button
                      type="button" className="guest-row-id"
                      role={selecting ? 'checkbox' : undefined} aria-checked={selecting ? isSelected : undefined}
                      aria-label={selecting ? `Select ${g.name}` : `Edit ${g.name}`}
                      onClick={() => (selecting ? toggleSelect(g.id) : setFormModal({ mode: 'edit', guest: g }))}
                    >
                      <span className="guest-row-name" title={g.name}>{g.name}</span>
                      <span className="guest-row-contact">{fmtPhone(g.phone)} · {g.email || 'No email'}</span>
                    </button>
                    <div className="guest-row-meta">
                      {!selecting && (
                        g.invited ? (
                          <button
                            type="button" className="guest-invite-chip guest-invite-done"
                            onClick={() => toggleInvited(g)}
                            title="Invited — tap to mark not invited"
                            aria-label={`${g.name} is invited. Tap to mark not invited.`}
                          >
                            <span aria-hidden="true" className="material-symbols-outlined">task_alt</span> Invited
                          </button>
                        ) : (
                          <span className="guest-invite-chip guest-invite-none">
                            <span aria-hidden="true" className="material-symbols-outlined">schedule_send</span> Not invited
                          </span>
                        )
                      )}
                      {assignedCount !== subEvents.length && (
                        <span
                          className={`guest-assign-chip${assignedCount === 0 ? ' is-none' : ''}`}
                          title={assignedCount === 0 ? 'Not invited to any function' : `${assignedCount} of ${subEvents.length} functions`}
                        >
                          <span aria-hidden="true" className="material-symbols-outlined">{assignedCount === 0 ? 'event_busy' : 'event'}</span>
                          {assignedCount}/{subEvents.length}
                        </span>
                      )}
                      {g.tagIds.slice(0, 2).map((tagId) => {
                        const t = tagById.get(tagId)
                        return t ? <span key={tagId} className="tag-chip"><span className="tag-chip-label">{t.name}</span></span> : null
                      })}
                      {g.tagIds.length > 2 && <span className="tag-chip tag-chip-more">+{g.tagIds.length - 2}</span>}
                    </div>
                    {/* RSVP pill must live INSIDE .guest-row-surface so its
                        `grid-area: rsvp` resolves against the surface grid
                        ("avatar id rsvp" / "avatar meta meta") and it sits
                        right-aligned in the row. Rendered as a sibling of the
                        surface, grid-area had no grid to resolve against and the
                        pill dropped to block flow (bottom-left). */}
                    <button
                      type="button" className={`guest-row-rsvp status-badge status-${status?.slug ?? 'pending'}`}
                      aria-haspopup="true" aria-label={`RSVP for ${g.name}: ${status?.name ?? 'Pending'}. Tap to change.`}
                      onClick={(e) => setPicker({ kind: 'rsvp', guestId: g.id, anchorRect: e.currentTarget.getBoundingClientRect() })}
                    >
                      <span className="status-dot" aria-hidden="true" /> {status?.name ?? 'Pending'}
                      <span aria-hidden="true" className="material-symbols-outlined">expand_more</span>
                    </button>
                  </div>
                  {!selecting && (
                    <div className="guest-row-rail" aria-hidden="true">
                      <button
                        type="button" className="gr-swipe gr-swipe-rsvp" tabIndex={-1}
                        onClick={(e) => setPicker({ kind: 'rsvp', guestId: g.id, anchorRect: e.currentTarget.getBoundingClientRect() })}
                      >
                        <span aria-hidden="true" className="material-symbols-outlined">how_to_reg</span><span>RSVP</span>
                      </button>
                      <button
                        type="button" className="gr-swipe gr-swipe-assign" tabIndex={-1}
                        onClick={(e) => setPicker({ kind: 'assign', guestId: g.id, anchorRect: e.currentTarget.getBoundingClientRect() })}
                      >
                        <span aria-hidden="true" className="material-symbols-outlined">event</span><span>Assign</span>
                      </button>
                      <button
                        type="button" className="gr-swipe gr-swipe-send" tabIndex={-1}
                        disabled={!canSendInvites}
                        onClick={() => openWhatsApp(g)}
                        title={canSendInvites ? 'Send WhatsApp invite' : 'Add your event website first'}
                      >
                        <span aria-hidden="true" className="material-symbols-outlined">send</span><span>Send</span>
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {selecting && (
        <div className="gm-bulkbar" role="toolbar" aria-label="Bulk actions">
          <span className="gm-bulk-count">{selectedIds.size} selected</span>
          <button type="button" className="gm-bulk-selectall" onClick={selectAllVisible}>
            {allVisibleSelected ? 'Clear' : 'Select all'}
          </button>
          <span className="gm-bulk-div" aria-hidden="true" />
          <button
            type="button" className="gm-bulk-act" disabled={selectedIds.size === 0}
            onClick={(e) => setPicker({ kind: 'bulk-tag', anchorRect: e.currentTarget.getBoundingClientRect() })}
          >
            <span aria-hidden="true" className="material-symbols-outlined">sell</span><span>Tag</span>
          </button>
          <button
            type="button" className="gm-bulk-act" disabled={selectedIds.size === 0}
            onClick={(e) => setPicker({ kind: 'bulk-assign', anchorRect: e.currentTarget.getBoundingClientRect() })}
          >
            <span aria-hidden="true" className="material-symbols-outlined">event</span><span>Assign</span>
          </button>
          <button type="button" className="gm-bulk-act" disabled={selectedIds.size === 0} onClick={() => { void handleBulkDelete() }}>
            <span aria-hidden="true" className="material-symbols-outlined">delete</span><span>Delete</span>
          </button>
          <button type="button" className="gm-bulk-cancel" aria-label="Exit selection" onClick={exitSelect}>
            <span aria-hidden="true" className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {!selecting && (
        <button type="button" className="gm-add-fab" aria-label="Add guest" title="Add guest" onClick={() => setFormModal({ mode: 'add', guest: null })}>
          <span aria-hidden="true" className="material-symbols-outlined">person_add</span>
        </button>
      )}

      {picker?.kind === 'rsvp' && (() => {
        const g = guests.find((x) => x.id === picker.guestId)
        if (!g) return null
        return (
          <GuestPicker
            anchorRect={picker.anchorRect} ariaLabel={`Set RSVP for ${g.name}`} title={<>RSVP for <strong>{g.name}</strong></>}
            options={rsvpStatuses.map((s) => ({ value: s.id, label: s.name, icon: s.iconName }))}
            current={g.rsvpStatusId} onPick={(val) => { setPicker(null); void patchGuest(g.id, { rsvpStatusId: val }) }}
            onClose={() => setPicker(null)}
          />
        )
      })()}

      {picker?.kind === 'sort' && (
        <GuestPicker
          anchorRect={picker.anchorRect} ariaLabel="Sort guests" title="Sort by" options={SORT_OPTIONS}
          current={sortKey} onPick={(val) => { setSortKey(val as SortKey); setPicker(null) }} onClose={() => setPicker(null)}
        />
      )}

      {picker?.kind === 'filter' && (
        <GuestPicker
          anchorRect={picker.anchorRect} ariaLabel="Filter by function or tag" title="Filter" multi
          options={[
            ...subEvents.map((se) => ({ value: `se:${se.id}`, label: se.label, group: 'Functions' })),
            ...tags.map((t) => ({ value: `tag:${t.id}`, label: t.name, group: 'Tags' })),
          ]}
          current={[...subFilters.map((s) => `se:${s}`), ...tagFilters.map((t) => `tag:${t}`)]}
          onApply={(vals) => {
            setSubFilters(vals.filter((v) => v.startsWith('se:')).map((v) => v.slice(3)))
            setTagFilters(vals.filter((v) => v.startsWith('tag:')).map((v) => v.slice(4)))
            setPicker(null)
          }}
          onClose={() => setPicker(null)}
        />
      )}

      {picker?.kind === 'assign' && (() => {
        const g = guests.find((x) => x.id === picker.guestId)
        if (!g) return null
        return (
          <GuestPicker
            anchorRect={picker.anchorRect} ariaLabel={`Functions for ${g.name}`} title="Invited to functions" multi
            options={subEvents.map((se) => ({ value: se.id, label: se.label }))} current={g.subEventIds}
            onApply={(vals) => { setPicker(null); void patchGuest(g.id, { subEventIds: vals }) }} onClose={() => setPicker(null)}
          />
        )
      })()}

      {picker?.kind === 'bulk-tag' && (
        <GuestPicker
          anchorRect={picker.anchorRect} ariaLabel="Add tags to selected guests" title="Add tags" multi
          options={tags.map((t) => ({ value: t.id, label: t.name }))} current={[]}
          onApply={(vals) => {
            setPicker(null)
            if (vals.length === 0) { flashToast('Select at least one tag'); return }
            void bulkAction('tag', { tagIds: vals })
          }}
          onClose={() => setPicker(null)}
        />
      )}

      {picker?.kind === 'bulk-assign' && (
        <GuestPicker
          anchorRect={picker.anchorRect} ariaLabel="Set functions for selected guests" title="Set functions — replaces current" multi
          options={subEvents.map((se) => ({ value: se.id, label: se.label }))} current={[]}
          onApply={(vals) => {
            setPicker(null)
            if (vals.length === 0) { flashToast('Select at least one function'); return }
            void bulkAction('assign', { subEventIds: vals })
          }}
          onClose={() => setPicker(null)}
        />
      )}

      {formModal && (
        <GuestFormModal
          eventId={eventId} mode={formModal.mode} guest={formModal.guest} rsvpStatuses={rsvpStatuses}
          subEvents={subEvents} tags={tags} onClose={() => setFormModal(null)} onSaved={upsertGuest}
          onRemoved={removeGuestLocal} onCreateTag={createTag} onManageTags={() => setTagManagerOpen(true)} flashToast={flashToast}
        />
      )}

      {importOpen && (
        <ImportCsvModal
          eventId={eventId} existingPhones={new Set(guests.map((g) => g.phone))}
          onClose={() => setImportOpen(false)}
          onImported={(imported, skipped) => {
            setGuests((gs) => [...gs, ...imported])
            const n = imported.length
            flashToast(`${n} guest${n === 1 ? '' : 's'} imported${skipped ? ` · ${skipped} duplicate${skipped === 1 ? '' : 's'} skipped` : ''}`)
          }}
          flashToast={flashToast}
        />
      )}

      {tagManagerOpen && (
        <TagManagerModal
          eventId={eventId} tags={tags} guests={guests} onClose={() => setTagManagerOpen(false)}
          onCreated={(t) => setTags((ts) => [...ts, t])}
          onDeleted={(tagId) => {
            setTags((ts) => ts.filter((t) => t.id !== tagId))
            setGuests((gs) => gs.map((g) => ({ ...g, tagIds: g.tagIds.filter((id) => id !== tagId) })))
          }}
          flashToast={flashToast}
        />
      )}

      <div className={`bc-toast${toast ? ' is-show' : ''}`} role="status" aria-live="polite">
        <span className="bc-live" aria-hidden="true" />
        <span>{toast?.message ?? ''}</span>
        {toast?.action && (
          <button
            type="button"
            className="ml-3 font-semibold underline underline-offset-2"
            onClick={() => { toast.action?.onClick(); setToast(null) }}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {sendQueueOpen && (
        <Portal>
          <div
            className="modal-scrim is-open"
            role="dialog" aria-modal="true" aria-labelledby="send-queue-title"
            onClick={(e) => { if (e.target === e.currentTarget) setSendQueueOpen(false) }}
          >
            <div className="modal-card lg-glass-card" style={{ maxWidth: '30rem' }}>
              <header className="es-content-head" style={{ marginBottom: '12px' }}>
                <div>
                  <h2 id="send-queue-title" className="es-section-title">
                    <span aria-hidden="true" className="material-symbols-outlined icon-fill">send</span>
                    Send WhatsApp invites
                  </h2>
                  <p className="es-section-sub" aria-live="polite">
                    {guests.length - notInvitedCount} of {guests.length} invited · {notInvitedCount} to go
                  </p>
                </div>
              </header>

              <p className="es-section-sub" style={{ marginBottom: '10px' }}>
                Sends from <strong>your own WhatsApp</strong>, one guest at a time — tap Open, send in WhatsApp, then Next.
              </p>
              {siteOffline && (
                <p className="form-error" role="status" style={{ marginBottom: '10px' }}>
                  <span aria-hidden="true" className="material-symbols-outlined">warning</span>
                  Your event site is offline — guests who tap the link won&apos;t see it until you publish.
                </p>
              )}

              {currentInvitee ? (
                <div className="es-section" style={{ marginBottom: '12px' }}>
                  <div className="guest-row-name" style={{ fontWeight: 700 }}>{currentInvitee.name}</div>
                  <div className="guest-row-contact" style={{ marginBottom: '10px' }}>{fmtPhone(currentInvitee.phone)}</div>
                  <label className="form-label" htmlFor="send-queue-preview">Message preview</label>
                  <textarea
                    id="send-queue-preview" className="form-textarea" readOnly rows={5}
                    value={buildInviteText({
                      guestName: currentInvitee.name,
                      defaultMessage: defaultGuestMessage,
                      siteUrl: eventSlug && typeof window !== 'undefined' ? `${window.location.origin}/e/${eventSlug}` : '',
                    })}
                  />
                  {!inviteUrlFor(currentInvitee) && (
                    <p className="form-error" role="alert" style={{ marginTop: '6px' }}>
                      <span aria-hidden="true" className="material-symbols-outlined">error</span>
                      No valid phone number — skip this guest or fix their number.
                    </p>
                  )}
                </div>
              ) : (
                <div className="es-section" style={{ textAlign: 'center', padding: '24px 0' }}>
                  <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--success, #16a34a)' }}>celebration</span>
                  <p className="es-section-sub" style={{ marginTop: '8px' }}>
                    {notInvitedCount === 0 ? 'Everyone has been invited.' : 'No one left in the queue.'}
                  </p>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setSendQueueOpen(false)}>
                  {currentInvitee ? 'Close' : 'Done'}
                </button>
                {currentInvitee && (
                  <>
                    <button
                      type="button" className="btn-pill btn-pill-ghost"
                      onClick={() => setSkippedIds((s) => new Set(s).add(currentInvitee.id))}
                    >
                      Skip
                    </button>
                    <button
                      type="button" className="btn-pill btn-pill-primary"
                      disabled={!inviteUrlFor(currentInvitee)}
                      autoFocus
                      onClick={() => openWhatsApp(currentInvitee)}
                    >
                      <span aria-hidden="true" className="material-symbols-outlined">open_in_new</span>
                      Open WhatsApp
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}

      <ConfirmDialog
        open={confirmBulkDelete}
        tone="danger"
        title={`Remove ${selectedIds.size} guest${selectedIds.size === 1 ? '' : 's'}?`}
        message="The selected guests and their RSVPs will be removed from this event. This can't be undone."
        confirmLabel="Remove"
        busy={bulkDeleting}
        onCancel={() => setConfirmBulkDelete(false)}
        onConfirm={() => { void confirmBulkDeleteAction() }}
      />
    </main>
  )
}
