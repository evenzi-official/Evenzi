'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { GuestManagementInitialData, GuestRow, GuestTagOption } from '@/lib/types/guests'
import { GuestPicker, type PickerOption } from './GuestPicker'
import { GuestFormModal } from './GuestFormModal'
import { ImportCsvModal } from './ImportCsvModal'
import { TagManagerModal } from './TagManagerModal'

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
  return p ? `+91 ${p.replace(/(\d{5})(\d{5})/, '$1 $2')}` : 'No phone'
}

export function GuestManagementClient({ initialData }: { initialData: GuestManagementInitialData }): React.ReactElement {
  const { eventId, guests: initialGuests, rsvpStatuses, subEvents, tags: initialTags } = initialData

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
  const [toast, setToast] = useState<string | null>(null)
  const toastTimeoutRef = useRef<number | null>(null)

  const statusById = useMemo(() => new Map(rsvpStatuses.map((s) => [s.id, s])), [rsvpStatuses])
  const tagById = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags])

  function flashToast(message: string): void {
    if (toastTimeoutRef.current !== null) window.clearTimeout(toastTimeoutRef.current)
    setToast(message)
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null)
      toastTimeoutRef.current = null
    }, 2500)
  }

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
    const res = await fetch(`/api/events/${eventId}/guests/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, guestIds: ids, ...payload }),
    })
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

  async function handleBulkDelete(): Promise<void> {
    const n = selectedIds.size
    if (!window.confirm(`Remove ${n} guest${n === 1 ? '' : 's'}? This can't be undone.`)) return
    await bulkAction('delete')
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
              type="button" className="btn-pill btn-pill-secondary gm-icon-btn gm-send-btn" disabled
              title="WhatsApp sending — coming soon" aria-label="Send WhatsApp invitations (coming soon)"
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
                      {!g.invited && (
                        <span className="guest-invite-chip guest-invite-none">
                          <span aria-hidden="true" className="material-symbols-outlined">schedule_send</span> Not invited
                        </span>
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
                  </div>
                  <button
                    type="button" className={`guest-row-rsvp status-badge status-${status?.slug ?? 'pending'}`}
                    aria-haspopup="true" aria-label={`RSVP for ${g.name}: ${status?.name ?? 'Pending'}. Tap to change.`}
                    onClick={(e) => setPicker({ kind: 'rsvp', guestId: g.id, anchorRect: e.currentTarget.getBoundingClientRect() })}
                  >
                    <span className="status-dot" aria-hidden="true" /> {status?.name ?? 'Pending'}
                    <span aria-hidden="true" className="material-symbols-outlined">expand_more</span>
                  </button>
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
                      <button type="button" className="gr-swipe gr-swipe-send" tabIndex={-1} disabled title="WhatsApp sending — coming soon">
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
        <span>{toast ?? ''}</span>
      </div>
    </main>
  )
}
