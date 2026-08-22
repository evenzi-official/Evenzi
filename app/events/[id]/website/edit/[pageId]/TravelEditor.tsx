'use client'
import React, { useState } from 'react'
import { useBusy } from '@/components/ui/BusyProvider'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

type TravelPoint = {
  id: string
  kind: 'airport' | 'railway' | 'bus' | 'road' | 'other'
  name: string
  distance_text: string | null
  travel_time_text: string | null
  map_link: string | null
  note: string | null
  display_order: number
}

type Stay = {
  id: string
  name: string
  address: string | null
  phone: string | null
  price_band: 'budget' | 'mid' | 'luxury' | null
  distance_text: string | null
  map_link: string | null
  booking_url: string | null
  note: string | null
  display_order: number
}

const KIND_ICONS: Record<TravelPoint['kind'], string> = {
  airport: 'flight', railway: 'train', bus: 'directions_bus', road: 'directions_car', other: 'place',
}

const PRICE_LABELS: Record<string, string> = { budget: 'Budget', mid: 'Mid-range', luxury: 'Luxury' }

export default function TravelEditor({
  eventId,
  initialPoints,
  initialStays,
}: {
  eventId: string
  initialPoints: TravelPoint[]
  initialStays: Stay[]
}) {
  const [points, setPoints] = useState(initialPoints)
  const { runBusy } = useBusy()
  const [stays, setStays] = useState(initialStays)
  const [tab, setTab] = useState<'points' | 'stays'>('points')
  const [pending, setPending] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'point'; item: TravelPoint } | { type: 'stay'; item: Stay } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [ptForm, setPtForm] = useState({ kind: 'airport' as TravelPoint['kind'], name: '', distance_text: '', travel_time_text: '', map_link: '', note: '' })
  const [stayForm, setStayForm] = useState({ name: '', address: '', phone: '', price_band: '' as Stay['price_band'] | '', distance_text: '', map_link: '', booking_url: '', note: '' })

  async function addPoint() {
    if (!ptForm.name.trim()) return
    setPending('new')
    try {
      await runBusy(async () => {
        const res = await fetch(`/api/events/${eventId}/travel-points`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: ptForm.kind,
            name: ptForm.name.trim(),
            distance_text: ptForm.distance_text.trim() || null,
            travel_time_text: ptForm.travel_time_text.trim() || null,
            map_link: ptForm.map_link.trim() || null,
            note: ptForm.note.trim() || null,
            display_order: points.length,
          }),
        })
        if (res.ok) {
          const { point } = await res.json() as { point: TravelPoint }
          setPoints((prev) => [...prev, point])
          setPtForm({ kind: 'airport', name: '', distance_text: '', travel_time_text: '', map_link: '', note: '' })
          setShowForm(false)
        }
      }, 'Adding…')
    } finally { setPending(null) }
  }

  async function deletePoint(point: TravelPoint) {
    setDeleting(true)
    setPoints((prev) => prev.filter((p) => p.id !== point.id))
    try {
      await runBusy(
        () => fetch(`/api/events/${eventId}/travel-points/${point.id}`, { method: 'DELETE' })
          .then((res) => { if (!res.ok) throw new Error('delete failed') })
          .catch(() => setPoints((prev) => [...prev, point].sort((a, b) => a.display_order - b.display_order))),
        'Deleting…',
      )
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  async function addStay() {
    if (!stayForm.name.trim()) return
    setPending('new-stay')
    try {
      await runBusy(async () => {
        const res = await fetch(`/api/events/${eventId}/stays`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: stayForm.name.trim(),
            address: stayForm.address.trim() || null,
            phone: stayForm.phone.trim() || null,
            price_band: stayForm.price_band || null,
            distance_text: stayForm.distance_text.trim() || null,
            map_link: stayForm.map_link.trim() || null,
            booking_url: stayForm.booking_url.trim() || null,
            note: stayForm.note.trim() || null,
            display_order: stays.length,
          }),
        })
        if (res.ok) {
          const { stay } = await res.json() as { stay: Stay }
          setStays((prev) => [...prev, stay])
          setStayForm({ name: '', address: '', phone: '', price_band: '', distance_text: '', map_link: '', booking_url: '', note: '' })
          setShowForm(false)
        }
      }, 'Adding…')
    } finally { setPending(null) }
  }

  async function deleteStay(stay: Stay) {
    setDeleting(true)
    setStays((prev) => prev.filter((s) => s.id !== stay.id))
    try {
      await runBusy(
        () => fetch(`/api/events/${eventId}/stays/${stay.id}`, { method: 'DELETE' })
          .then((res) => { if (!res.ok) throw new Error('delete failed') })
          .catch(() => setStays((prev) => [...prev, stay].sort((a, b) => a.display_order - b.display_order))),
        'Deleting…',
      )
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  return (
    <div className="space-y-4 mt-6">
      {/* Tab switcher */}
      <div className="seg-wrap">
        <div className="seg">
          <button type="button" onClick={() => { setTab('points'); setShowForm(false) }}
            className={`seg-item ${tab === 'points' ? 'is-active' : ''}`}>
            <span className="material-symbols-outlined" aria-hidden="true">directions</span>
            Getting here
          </button>
          <button type="button" onClick={() => { setTab('stays'); setShowForm(false) }}
            className={`seg-item ${tab === 'stays' ? 'is-active' : ''}`}>
            <span className="material-symbols-outlined" aria-hidden="true">hotel</span>
            Places to stay
          </button>
        </div>
      </div>

      {tab === 'points' && (
        <>
          {points.length === 0 && !showForm && (
            <div className="clay-card p-8 text-center space-y-3">
              <span className="material-symbols-outlined text-4xl text-muted" aria-hidden="true">directions</span>
              <p className="font-display font-bold text-sm text-ink">No travel points yet</p>
              <p className="text-xs text-muted">Add airports, railway stations, and road directions.</p>
            </div>
          )}
          {points.map((pt) => (
            <div key={pt.id} className="clay-card flex items-start gap-3 p-4">
              <span className="w-9 h-9 rounded-xl bg-brand-tint text-brand flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined icon-fill">{KIND_ICONS[pt.kind]}</span>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm text-ink">{pt.name}</p>
                <p className="text-xs text-muted">{[pt.distance_text, pt.travel_time_text].filter(Boolean).join(' · ')}</p>
                {pt.note && <p className="text-xs text-muted mt-0.5">{pt.note}</p>}
              </div>
              <button type="button" onClick={() => setConfirmDelete({ type: 'point', item: pt })} disabled={!!pending || deleting} className="dp-icon-btn shrink-0" aria-label="Delete">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
              </button>
            </div>
          ))}
          {showForm ? (
            <div className="clay-card p-5 space-y-3">
              <h3 className="font-display font-bold text-sm text-ink">Add travel point</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={ptForm.kind} onChange={(e) => setPtForm((f) => ({ ...f, kind: e.target.value as TravelPoint['kind'] }))}>
                    <option value="airport">Airport</option>
                    <option value="railway">Railway</option>
                    <option value="bus">Bus</option>
                    <option value="road">Road</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={ptForm.name} onChange={(e) => setPtForm((f) => ({ ...f, name: e.target.value }))} placeholder="Indira Gandhi Airport" />
                </div>
                <div className="form-group">
                  <label className="form-label">Distance</label>
                  <input className="form-input" value={ptForm.distance_text} onChange={(e) => setPtForm((f) => ({ ...f, distance_text: e.target.value }))} placeholder="45 km" />
                </div>
                <div className="form-group">
                  <label className="form-label">Travel time</label>
                  <input className="form-input" value={ptForm.travel_time_text} onChange={(e) => setPtForm((f) => ({ ...f, travel_time_text: e.target.value }))} placeholder="~1 hr by cab" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Google Maps link</label>
                <input className="form-input" value={ptForm.map_link} onChange={(e) => setPtForm((f) => ({ ...f, map_link: e.target.value }))} placeholder="https://maps.google.com/…" />
              </div>
              <div className="form-group">
                <label className="form-label">Note</label>
                <input className="form-input" value={ptForm.note} onChange={(e) => setPtForm((f) => ({ ...f, note: e.target.value }))} placeholder="Cab recommended" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="btn-pill btn-pill-secondary btn-pill-sm">Cancel</button>
                <button type="button" onClick={addPoint} disabled={!ptForm.name.trim() || pending === 'new'} className="btn-pill btn-pill-primary btn-pill-sm">
                  {pending === 'new' ? 'Adding…' : 'Add'}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setShowForm(true)} className="btn-pill btn-pill-secondary">
              <span className="material-symbols-outlined" aria-hidden="true">add</span>
              Add travel point
            </button>
          )}
        </>
      )}

      {tab === 'stays' && (
        <>
          {stays.length === 0 && !showForm && (
            <div className="clay-card p-8 text-center space-y-3">
              <span className="material-symbols-outlined text-4xl text-muted" aria-hidden="true">hotel</span>
              <p className="font-display font-bold text-sm text-ink">No suggested stays yet</p>
              <p className="text-xs text-muted">Recommend hotels or guesthouses near the venue.</p>
            </div>
          )}
          {stays.map((stay) => (
            <div key={stay.id} className="clay-card flex items-start gap-3 p-4">
              <span className="w-9 h-9 rounded-xl bg-brand-tint text-brand flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined icon-fill">hotel</span>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm text-ink">{stay.name}</p>
                <p className="text-xs text-muted">{[stay.price_band ? PRICE_LABELS[stay.price_band] : null, stay.distance_text].filter(Boolean).join(' · ')}</p>
                {stay.address && <p className="text-xs text-muted">{stay.address}</p>}
              </div>
              <button type="button" onClick={() => setConfirmDelete({ type: 'stay', item: stay })} disabled={!!pending || deleting} className="dp-icon-btn shrink-0" aria-label="Delete">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
              </button>
            </div>
          ))}
          {showForm ? (
            <div className="clay-card p-5 space-y-3">
              <h3 className="font-display font-bold text-sm text-ink">Add suggested stay</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group col-span-2">
                  <label className="form-label">Hotel name</label>
                  <input className="form-input" value={stayForm.name} onChange={(e) => setStayForm((f) => ({ ...f, name: e.target.value }))} placeholder="The Grand Hyatt" />
                </div>
                <div className="form-group">
                  <label className="form-label">Price band</label>
                  <select className="form-select" value={stayForm.price_band ?? ''} onChange={(e) => setStayForm((f) => ({ ...f, price_band: (e.target.value || null) as Stay['price_band'] | '' }))}>
                    <option value="">—</option>
                    <option value="budget">Budget</option>
                    <option value="mid">Mid-range</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Distance from venue</label>
                  <input className="form-input" value={stayForm.distance_text} onChange={(e) => setStayForm((f) => ({ ...f, distance_text: e.target.value }))} placeholder="2 km" />
                </div>
                <div className="form-group col-span-2">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={stayForm.address} onChange={(e) => setStayForm((f) => ({ ...f, address: e.target.value }))} placeholder="12 MG Road, Bengaluru" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={stayForm.phone} onChange={(e) => setStayForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 …" />
                </div>
                <div className="form-group">
                  <label className="form-label">Google Maps link</label>
                  <input className="form-input" value={stayForm.map_link} onChange={(e) => setStayForm((f) => ({ ...f, map_link: e.target.value }))} placeholder="https://maps.google.com/…" />
                </div>
                <div className="form-group col-span-2">
                  <label className="form-label">Booking link</label>
                  <input className="form-input" value={stayForm.booking_url} onChange={(e) => setStayForm((f) => ({ ...f, booking_url: e.target.value }))} placeholder="https://booking.com/…" />
                </div>
                <div className="form-group col-span-2">
                  <label className="form-label">Note</label>
                  <input className="form-input" value={stayForm.note} onChange={(e) => setStayForm((f) => ({ ...f, note: e.target.value }))} placeholder="Mention Evenzi for a 10% discount" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="btn-pill btn-pill-secondary btn-pill-sm">Cancel</button>
                <button type="button" onClick={addStay} disabled={!stayForm.name.trim() || pending === 'new-stay'} className="btn-pill btn-pill-primary btn-pill-sm">
                  {pending === 'new-stay' ? 'Adding…' : 'Add'}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setShowForm(true)} className="btn-pill btn-pill-secondary">
              <span className="material-symbols-outlined" aria-hidden="true">add</span>
              Add stay
            </button>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        tone="danger"
        title={confirmDelete?.type === 'stay' ? 'Delete this stay?' : 'Delete this travel point?'}
        message={confirmDelete ? <>Remove <strong>{confirmDelete.item.name}</strong> from your travel page. This can&apos;t be undone.</> : ''}
        confirmLabel="Delete"
        busy={deleting}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return
          if (confirmDelete.type === 'point') void deletePoint(confirmDelete.item)
          else void deleteStay(confirmDelete.item)
        }}
      />
    </div>
  )
}
