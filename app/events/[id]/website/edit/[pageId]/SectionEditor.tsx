'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'

/* ── Types ─────────────────────────────────────────────────────────── */
type SectionType = 'heading' | 'photo' | 'photogrid' | 'schedule' | 'person' | 'hotel' | 'qa' | 'divider' | 'map' | 'countdown' | 'video'

type SectionData = Partial<{
  heading: string; body: string; twocol: boolean
  count: number
  name: string; date: string; time: string; venue: string; dress: string; note: string
  relation: string; side: string
  distance: string; link: string
  q: string; a: string
  address: string
  label: string
  url: string
}>

type Section = { uid: string; type: SectionType; data: SectionData; hidden: boolean; collapsed: boolean }

export type SectionSeed = { type: SectionType; data: SectionData }

/* ── Section type registry ─────────────────────────────────────────── */
const DEFS: Record<SectionType, { name: string; icon: string; desc: string; blank: SectionData }> = {
  heading:   { name: 'Heading + paragraph', icon: 'title',           desc: 'A title with body text.',           blank: { heading: '', body: '', twocol: false } },
  photo:     { name: 'Photo',               icon: 'image',           desc: 'A single image.',                   blank: {} },
  photogrid: { name: 'Photo grid',          icon: 'grid_view',       desc: '2–4 images in a grid.',             blank: { count: 4 } },
  schedule:  { name: 'Schedule item',       icon: 'event',           desc: 'A sub-event with time + venue.',    blank: { name: '', date: '', time: '', venue: '', dress: '', note: '' } },
  person:    { name: 'Person card',         icon: 'person',          desc: 'Photo, name, and relation.',        blank: { name: '', relation: '', side: 'Bride' } },
  hotel:     { name: 'Hotel / venue card',  icon: 'hotel',           desc: 'Hotel/venue with booking link.',    blank: { name: '', distance: '', link: '' } },
  qa:        { name: 'Q&A item',            icon: 'help',            desc: 'A question and answer.',            blank: { q: '', a: '' } },
  divider:   { name: 'Divider',             icon: 'horizontal_rule', desc: 'A line between sections.',          blank: {} },
  map:       { name: 'Map embed',           icon: 'map',             desc: 'An embedded location map.',         blank: { address: '' } },
  countdown: { name: 'Countdown',           icon: 'timer',           desc: 'A countdown to the big day.',       blank: { date: '', label: 'Until we celebrate' } },
  video:     { name: 'Video embed',         icon: 'movie',           desc: 'A YouTube/Vimeo embed.',            blank: { url: '' } },
}
const TYPE_ORDER: SectionType[] = ['heading', 'photo', 'photogrid', 'schedule', 'person', 'hotel', 'qa', 'divider', 'map', 'countdown', 'video']

function mkUid() { return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) }

function fromSeed(seeds: SectionSeed[]): Section[] {
  return seeds.map(s => ({ uid: mkUid(), type: s.type, data: { ...s.data }, hidden: false, collapsed: false }))
}

/* ── Section field editors ─────────────────────────────────────────── */
function Field({ label, name, value, ph, multiline, onChange }: {
  label: string; name: string; value: string; ph: string; multiline?: boolean
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="ep-field-label" htmlFor={name}>{label}</label>
      {multiline
        ? <textarea id={name} className="form-input" rows={3} placeholder={ph} defaultValue={value} onBlur={e => onChange(e.target.value)} />
        : <input id={name} className="form-input" type="text" placeholder={ph} defaultValue={value} onBlur={e => onChange(e.target.value)} />
      }
    </div>
  )
}

function SectionFields({ uid, type, data, onChange }: { uid: string; type: SectionType; data: SectionData; onChange: (d: SectionData) => void }) {
  const f = (label: string, key: keyof SectionData, ph: string, multi = false) => (
    <Field key={key} label={label} name={`${uid}-${key}`} value={(data[key] as string) ?? ''} ph={ph} multiline={multi}
      onChange={v => onChange({ ...data, [key]: v })} />
  )
  switch (type) {
    case 'heading':   return <>{f('Heading', 'heading', 'Section heading')}{f('Paragraph', 'body', 'Body text', true)}</>
    case 'photo':     return <p className="ep-field-help">Image upload — coming soon.</p>
    case 'photogrid': return <p className="ep-field-help">Photo grid ({data.count ?? 4} images) — upload coming soon.</p>
    case 'schedule':  return <>{f('Event name', 'name', 'e.g. Mehendi')}{f('Date', 'date', '14 Feb 2026')}{f('Time', 'time', '7:00 PM')}{f('Venue', 'venue', 'Venue name')}{f('Dress code', 'dress', 'e.g. Traditional')}{f('Note', 'note', 'Optional')}</>
    case 'person':    return <>{f('Name', 'name', 'Full name')}{f('Relation', 'relation', 'e.g. Sister of the Bride')}</>
    case 'hotel':     return <>{f('Name', 'name', 'Hotel / venue name')}{f('Distance / note', 'distance', 'e.g. 2 km from venue')}{f('Booking link', 'link', 'https://…')}</>
    case 'qa':        return <>{f('Question', 'q', 'Guest question')}{f('Answer', 'a', 'Your answer', true)}</>
    case 'divider':   return <p className="ep-field-help">A simple horizontal rule between sections.</p>
    case 'map':       return f('Address / place', 'address', 'Venue address')
    case 'countdown': return <>{f('Target date', 'date', '14 Feb 2026')}{f('Label', 'label', 'Until we celebrate')}</>
    case 'video':     return f('YouTube / Vimeo URL', 'url', 'https://youtube.com/…')
    default:          return null
  }
}

/* ── Section preview renders ───────────────────────────────────────── */
function SectionPreview({ sec }: { sec: Section }) {
  if (sec.hidden) return null
  const d = sec.data
  switch (sec.type) {
    case 'heading': return (
      <div className="epv-section">
        {d.heading && <p className="epv-heading">{d.heading}</p>}
        {d.body && <p className={`epv-paragraph${d.twocol ? ' epv-twocol' : ''}`}>{d.body}</p>}
        {!d.heading && !d.body && <p className="epv-paragraph" style={{ opacity: 0.35 }}>Heading + paragraph</p>}
      </div>
    )
    case 'photo': return <div className="epv-section"><div className="epv-photo"><span className="material-symbols-outlined" aria-hidden="true">image</span></div></div>
    case 'photogrid': return (
      <div className="epv-section">
        <div className="epv-photogrid">{Array.from({ length: d.count ?? 4 }).map((_, i) => (
          <div key={i} className="epv-photo"><span className="material-symbols-outlined" aria-hidden="true">image</span></div>
        ))}</div>
      </div>
    )
    case 'schedule': return (
      <div className="epv-section">
        <div className="epv-schedule">
          <p className="epv-schedule-name">{d.name || 'Sub-event'}</p>
          <p className="epv-schedule-meta">{[d.date, d.time].filter(Boolean).join(' · ')}{d.venue ? ` · ${d.venue}` : ''}</p>
        </div>
      </div>
    )
    case 'person': return (
      <div className="epv-section">
        <div className="epv-person">
          <div className="epv-person-avatar"><span className="material-symbols-outlined" aria-hidden="true">person</span></div>
          <div><p className="epv-person-name">{d.name || 'Name'}</p><p className="epv-person-rel">{d.relation || 'Relation'}</p></div>
        </div>
      </div>
    )
    case 'hotel': return (
      <div className="epv-section">
        <div className="epv-hotel">
          <div className="epv-hotel-thumb"><span className="material-symbols-outlined" aria-hidden="true">hotel</span></div>
          <div><p className="epv-hotel-name">{d.name || 'Hotel / venue'}</p><p className="epv-hotel-meta">{d.distance || 'Distance / booking note'}</p></div>
        </div>
      </div>
    )
    case 'qa': return (
      <div className="epv-section">
        <p className="epv-qa-q"><span className="material-symbols-outlined" aria-hidden="true">help</span>{d.q || 'Question?'}</p>
        <p className="epv-qa-a">{d.a || 'Answer text.'}</p>
      </div>
    )
    case 'divider': return <div className="epv-section"><hr className="epv-divider" /></div>
    case 'map': return (
      <div className="epv-section">
        <div className="epv-map">
          <span className="material-symbols-outlined" aria-hidden="true">map</span>
          <span className="epv-map-addr">{d.address || 'Venue address'}</span>
        </div>
      </div>
    )
    case 'countdown': return (
      <div className="epv-section">
        <div className="epv-countdown">
          <p className="epv-countdown-num">268 days</p>
          <p className="epv-countdown-label">{d.label || 'Until we celebrate'}</p>
        </div>
      </div>
    )
    case 'video': return (
      <div className="epv-section">
        <div className="epv-video"><span className="material-symbols-outlined" aria-hidden="true">play_circle</span></div>
      </div>
    )
    default: return null
  }
}

/* ── Add-section picker modal ──────────────────────────────────────── */
function AddSectionModal({ onAdd, onClose }: { onAdd: (t: SectionType) => void; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onEsc)
    cardRef.current?.querySelector<HTMLElement>('.modal-picker-tile')?.focus()
    return () => document.removeEventListener('keydown', onEsc)
  }, [onClose])

  return (
    <div
      className="modal-scrim is-open"
      role="presentation"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={cardRef}
        className="modal-card lg-glass-card modal-picker-grid"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ep-as-h"
      >
        <header className="modal-head">
          <div className="modal-head-lead">
            <h2 id="ep-as-h">Add a section</h2>
            <p className="modal-sub">Pick a section type to add to this page.</p>
          </div>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </header>

        <div className="modal-picker-body" role="radiogroup" aria-label="Section type">
          {TYPE_ORDER.map(t => (
            <button
              key={t}
              type="button"
              className="modal-picker-tile"
              role="radio"
              aria-checked="false"
              onClick={() => { onAdd(t); onClose() }}
            >
              <span className="modal-picker-tile-icon" aria-hidden="true">
                <span className="material-symbols-outlined">{DEFS[t].icon}</span>
              </span>
              <span className="modal-picker-tile-name">{DEFS[t].name}</span>
              <span className="modal-picker-tile-desc">{DEFS[t].desc}</span>
              <span className="modal-picker-tile-check" aria-hidden="true">
                <span className="material-symbols-outlined">check_circle</span>
              </span>
            </button>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-pill btn-pill-secondary" type="button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

/* ── Main SectionEditor component ──────────────────────────────────── */
export default function SectionEditor({
  eventId,
  pageId,
  seeds = [],
}: {
  eventId: string
  pageId: string
  seeds?: SectionSeed[]
}) {
  const storageKey = `evz:sections:${eventId}:${pageId}`
  const [sections, setSections] = useState<Section[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [saved, setSaved] = useState(true)
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit')
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      // Hydrate from local draft once per storage key — intentional sync-on-mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage bootstrap
      if (raw) { setSections(JSON.parse(raw) as Section[]); return }
    } catch { /* ignore */ }
    if (seeds.length) setSections(fromSeed(seeds))
  }, [storageKey, seeds])

  const persist = useCallback((next: Section[]) => {
    setSaved(false)
    try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* ignore */ }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => setSaved(true), 600)
  }, [storageKey])

  function update(next: Section[]) { setSections(next); persist(next) }

  function addSection(type: SectionType) {
    update([...sections, { uid: mkUid(), type, data: { ...DEFS[type].blank }, hidden: false, collapsed: false }])
  }

  function removeSection(uid: string) { update(sections.filter(s => s.uid !== uid)) }

  function moveSection(uid: string, dir: -1 | 1) {
    const idx = sections.findIndex(s => s.uid === uid)
    const next = [...sections]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    update(next)
  }

  function toggleHidden(uid: string) {
    update(sections.map(s => s.uid === uid ? { ...s, hidden: !s.hidden } : s))
  }

  function toggleCollapsed(uid: string) {
    update(sections.map(s => s.uid === uid ? { ...s, collapsed: !s.collapsed } : s))
  }

  function updateData(uid: string, data: SectionData) {
    update(sections.map(s => s.uid === uid ? { ...s, data } : s))
  }

  function collapseAll() {
    const allCollapsed = sections.every(s => s.collapsed)
    update(sections.map(s => ({ ...s, collapsed: !allCollapsed })))
  }

  const n = sections.length

  return (
    <>
      {/* Mobile Edit | Preview toggle */}
      <div className="ep-view-toggle-wrap">
        <div className="ep-view-toggle" role="radiogroup" aria-label="Editor view">
          <button type="button" className={`ep-view-btn${mobileView === 'edit' ? ' is-active' : ''}`}
            role="radio" aria-checked={mobileView === 'edit'} onClick={() => setMobileView('edit')}>
            <span className="material-symbols-outlined" aria-hidden="true">edit_note</span>
            Edit
          </button>
          <button type="button" className={`ep-view-btn${mobileView === 'preview' ? ' is-active' : ''}`}
            role="radio" aria-checked={mobileView === 'preview'} onClick={() => setMobileView('preview')}>
            <span className="material-symbols-outlined" aria-hidden="true">visibility</span>
            Preview
          </button>
        </div>
      </div>

      <main className="dp-shell reveal" data-ep-view={mobileView}>

        {/* LEFT — editor ──────────────────────────────────── */}
        <div className="dp-col-left">

          {/* Page meta / autosave indicator */}
          <div className="ep-meta clay-card">
            <div className="ep-meta-lead">
              <span className="ep-saved" role="status" aria-live="polite">
                <span className="material-symbols-outlined" aria-hidden="true">{saved ? 'cloud_done' : 'cloud_sync'}</span>
                <span className="ep-saved-txt">{saved ? 'Saved locally' : 'Saving…'}</span>
              </span>
            </div>
            <p className="text-xs text-muted" style={{ fontSize: '0.72rem' }}>
              Content saved in your browser — server sync planned
            </p>
          </div>

          {/* Section control bar */}
          {n > 0 && (
            <div className="ep-section-bar">
              <span className="ep-section-count">{n} {n === 1 ? 'section' : 'sections'}</span>
              <button type="button" className="ep-collapse-btn" onClick={collapseAll}>
                <span className="material-symbols-outlined" aria-hidden="true">unfold_less</span>
                {sections.every(s => s.collapsed) ? 'Expand all' : 'Collapse all'}
              </button>
            </div>
          )}

          {/* Section list */}
          {n === 0 ? (
            <div className="ep-empty">
              <span className="material-symbols-outlined ep-empty-icon" aria-hidden="true">post_add</span>
              <p className="ep-empty-title">No sections yet</p>
              <p className="ep-empty-help">Add your first section to start building this page.</p>
            </div>
          ) : (
            <ul className="dp-section-list" role="list" aria-label="Page sections">
              {sections.map((sec, idx) => {
                const def = DEFS[sec.type]
                return (
                  <li key={sec.uid}
                    className={`dp-section-block${sec.hidden ? ' is-hidden' : ''}${sec.collapsed ? ' is-collapsed' : ''}`}
                    role="group" aria-label={def.name} data-uid={sec.uid}>
                    <div className="dp-section-head">
                      <button className="dp-section-drag" type="button" aria-disabled="true"
                        title="Drag reorder coming soon" aria-label="Reorder — use ▲▼ buttons">
                        <span className="material-symbols-outlined" aria-hidden="true">drag_indicator</span>
                      </button>
                      <span className="dp-section-type">
                        <span className="material-symbols-outlined" aria-hidden="true">{def.icon}</span>
                        {def.name}
                      </span>
                      <div className="dp-section-actions">
                        <button className="dp-icon-btn-sm" type="button" aria-label="Move up"
                          aria-disabled={idx === 0} onClick={() => idx > 0 && moveSection(sec.uid, -1)}>
                          <span className="material-symbols-outlined" aria-hidden="true">keyboard_arrow_up</span>
                        </button>
                        <button className="dp-icon-btn-sm" type="button" aria-label="Move down"
                          aria-disabled={idx === n - 1} onClick={() => idx < n - 1 && moveSection(sec.uid, 1)}>
                          <span className="material-symbols-outlined" aria-hidden="true">keyboard_arrow_down</span>
                        </button>
                        <button className="dp-icon-btn-sm" type="button"
                          aria-label={sec.hidden ? 'Show section' : 'Hide section'}
                          onClick={() => toggleHidden(sec.uid)}>
                          <span className="material-symbols-outlined" aria-hidden="true">
                            {sec.hidden ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                        <button className="dp-icon-btn-sm" type="button" aria-label="Remove section"
                          onClick={() => removeSection(sec.uid)}>
                          <span className="material-symbols-outlined" aria-hidden="true">delete_outline</span>
                        </button>
                        <button className="dp-icon-btn-sm dp-section-collapse" type="button"
                          aria-label={sec.collapsed ? 'Expand section' : 'Collapse section'}
                          aria-expanded={!sec.collapsed}
                          onClick={() => toggleCollapsed(sec.uid)}>
                          <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
                        </button>
                      </div>
                    </div>
                    <div className="dp-section-body">
                      <SectionFields key={sec.uid} uid={sec.uid} type={sec.type} data={sec.data}
                        onChange={d => updateData(sec.uid, d)} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Add section */}
          <button className="ep-add-section" type="button" onClick={() => setShowPicker(true)}>
            <span className="material-symbols-outlined" aria-hidden="true">add</span>
            Add section
          </button>
        </div>

        {/* RIGHT — live preview ───────────────────────────── */}
        <aside className="dp-col-right" aria-label="Live preview">
          <section className="clay-card dp-card ep-preview-card" aria-labelledby="ep-prev-h">
            <header className="dp-card-head">
              <div>
                <h2 id="ep-prev-h" className="dp-card-title">Preview</h2>
                <p className="dp-card-sub">What guests see on this page</p>
              </div>
              <div className="device-toggle" role="radiogroup" aria-label="Preview device">
                <button
                  type="button"
                  className={`device-toggle-btn${device === 'mobile' ? ' is-active' : ''}`}
                  role="radio"
                  aria-checked={device === 'mobile'}
                  aria-label="Mobile preview"
                  onClick={() => setDevice('mobile')}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">phone_iphone</span>
                </button>
                <button
                  type="button"
                  className={`device-toggle-btn${device === 'desktop' ? ' is-active' : ''}`}
                  role="radio"
                  aria-checked={device === 'desktop'}
                  aria-label="Desktop preview"
                  onClick={() => setDevice('desktop')}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">desktop_windows</span>
                </button>
              </div>
            </header>
            <div className="dp-preview-stage" data-device-stage={device}>
              <div className="dp-preview-frame is-page-scoped is-scrollable" data-palette="brand-red" data-font="poppins"
                role="img" aria-label="Live preview (decorative — your fields are the source of truth)">
                <div className="dp-preview-screen" aria-hidden="true">
                  <div className="dp-preview-content">
                    {sections.filter(s => !s.hidden).length === 0 ? (
                      <p className="epv-empty">Add sections to see a preview here.</p>
                    ) : (
                      sections.map(sec => <SectionPreview key={sec.uid} sec={sec} />)
                    )}
                  </div>
                </div>
              </div>
              <p className="dp-preview-caption">
                <span className="material-symbols-outlined" aria-hidden="true">info</span>
                Preview only — edit the fields on the left.
              </p>
            </div>
          </section>
        </aside>

      </main>

      {showPicker && <AddSectionModal onAdd={addSection} onClose={() => setShowPicker(false)} />}
    </>
  )
}
