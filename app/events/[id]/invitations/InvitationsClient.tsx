'use client'

import React, { useEffect, useRef, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
type Layout = 'classic' | 'photo'
type SlotSize = 's' | 'm' | 'l'
type SlotKey = 'eyebrow' | 'couple' | 'invite' | 'date' | 'time' | 'venue' | 'message'

interface Template { id: string; name: string; style: string; layout: Layout }
export interface CardData {
  eyebrow: string; couple: string; invite: string
  date: string; time: string; venue: string; message: string
}

// ── Static data ───────────────────────────────────────────────────────────────
const TEMPLATES: Template[] = [
  { id: 'eternal',    name: 'Eternal',    style: 'Minimal', layout: 'classic' },
  { id: 'saffron',    name: 'Saffron',    style: 'Royal',   layout: 'classic' },
  { id: 'eucalyptus', name: 'Eucalyptus', style: 'Floral',  layout: 'classic' },
  { id: 'noir',       name: 'Noir',       style: 'Modern',  layout: 'classic' },
  { id: 'rosewater',  name: 'Rosewater',  style: 'Floral',  layout: 'classic' },
  { id: 'bloom',      name: 'Bloom',      style: 'Photo',   layout: 'photo'   },
  { id: 'moments',    name: 'Moments',    style: 'Photo',   layout: 'photo'   },
]
const STYLES = ['All', 'Minimal', 'Royal', 'Floral', 'Modern', 'Photo']
const SLOTS: { key: SlotKey; cls: string; ph: string }[] = [
  { key: 'eyebrow', cls: 'inv-eyebrow', ph: 'A line above' },
  { key: 'couple',  cls: 'inv-couple',  ph: 'Couple names' },
  { key: 'invite',  cls: 'inv-invite',  ph: 'Invitation line' },
  { key: 'date',    cls: 'inv-date',    ph: 'Date' },
  { key: 'time',    cls: 'inv-time',    ph: 'Time' },
  { key: 'venue',   cls: 'inv-venue',   ph: 'Venue' },
  { key: 'message', cls: 'inv-message', ph: 'A closing line' },
]
const SIZE_LABELS: Record<SlotSize, string> = { s: 'Small', m: 'Medium', l: 'Large' }
const SIZES: SlotSize[] = ['s', 'm', 'l']

// ── EditableSlot ──────────────────────────────────────────────────────────────
// Uncontrolled contenteditable — set once on mount, never overwritten by React.
// The card is re-keyed on template change which remounts and re-initializes.
interface EditableSlotProps {
  slotKey: SlotKey
  cls: string
  ph: string
  initialText: string
  onFocus: (key: SlotKey, el: HTMLElement) => void
  onInput: (key: SlotKey, value: string) => void
}
function EditableSlot({ slotKey, cls, ph, initialText, onFocus, onInput }: EditableSlotProps) {
  const ref = useRef<HTMLParagraphElement>(null)
  // Set content once on mount — never update to avoid caret jumping
  useEffect(() => {
    if (ref.current) ref.current.textContent = initialText
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <p
      ref={ref}
      className={`inv-slot ${cls}`}
      data-slot={slotKey}
      data-ph={ph}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      role="textbox"
      aria-label={`Edit ${ph}`}
      spellCheck={false}
      onFocus={(e) => onFocus(slotKey, e.currentTarget)}
      onInput={(e) => onInput(slotKey, (e.target as HTMLElement).textContent ?? '')}
    />
  )
}

// ── CardSlots ─────────────────────────────────────────────────────────────────
interface CardSlotsProps {
  data: CardData
  editable: boolean
  onSlotFocus?: (key: SlotKey, el: HTMLElement) => void
  onSlotInput?: (key: SlotKey, value: string) => void
}
function CardSlots({ data, editable, onSlotFocus, onSlotInput }: CardSlotsProps) {
  return (
    <>
      {SLOTS.map((slot) => (
        <React.Fragment key={slot.key}>
          {editable ? (
            <EditableSlot
              slotKey={slot.key}
              cls={slot.cls}
              ph={slot.ph}
              initialText={data[slot.key]}
              onFocus={onSlotFocus!}
              onInput={onSlotInput!}
            />
          ) : (
            <p className={`inv-slot ${slot.cls}`} data-slot={slot.key} data-ph={slot.ph}>
              {data[slot.key] || undefined}
            </p>
          )}
          {slot.key === 'time' && <span className="inv-rule" />}
        </React.Fragment>
      ))}
    </>
  )
}

// ── InvCard ───────────────────────────────────────────────────────────────────
interface InvCardProps {
  tpl: Template
  data: CardData
  editable?: boolean
  photoSrc?: string | null
  onPhotoClick?: () => void
  onSlotFocus?: (key: SlotKey, el: HTMLElement) => void
  onSlotInput?: (key: SlotKey, value: string) => void
}
function InvCard({ tpl, data, editable = false, photoSrc, onPhotoClick, onSlotFocus, onSlotInput }: InvCardProps) {
  const photoSlotProps = editable ? {
    'data-photo-slot': '',
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': 'Add a photo to the card',
    onClick: onPhotoClick,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPhotoClick?.() }
    },
  } : {}

  return (
    <article className="inv-card" data-tpl={tpl.id} data-layout={tpl.layout} aria-label="Invitation card">
      {tpl.layout === 'photo' ? (
        <>
          <div className="inv-card-photo" {...photoSlotProps}>
            {photoSrc ? (
              <img src={photoSrc} alt="" />
            ) : (
              <div className="inv-card-photo-empty">
                <span className="material-symbols-outlined" aria-hidden="true">add_a_photo</span>
                <span>{editable ? 'Add photo' : 'Photo'}</span>
              </div>
            )}
          </div>
          <div className="inv-card-body">
            <CardSlots data={data} editable={editable} onSlotFocus={onSlotFocus} onSlotInput={onSlotInput} />
          </div>
        </>
      ) : (
        <CardSlots data={data} editable={editable} onSlotFocus={onSlotFocus} onSlotInput={onSlotInput} />
      )}
    </article>
  )
}

// ── InvitationsClient ─────────────────────────────────────────────────────────
export interface SavedCardProp {
  isCustom: boolean
  templateSlug: string | null
  cardUploadKey: string | null
  photoBgKey: string | null
  slots: {
    eyebrow: string
    couple: string
    invite: string
    date: string
    time: string
    venue: string
    message: string
  }
  slotSizes: Record<string, SlotSize>
}

interface InvitationsClientProps {
  eventName: string
  defaultData: CardData
  rsvpUrl: string
  savedCard?: SavedCardProp | null
  templateSlugToId?: Record<string, string>
}

export function InvitationsClient({ eventName, defaultData, rsvpUrl }: InvitationsClientProps) {
  const [view, setView] = useState<'gallery' | 'editor'>('gallery')
  const [filter, setFilter] = useState('All')
  const [tpl, setTpl] = useState<Template | null>(null)
  const [cardData, setCardData] = useState<CardData>(defaultData)
  const [mode, setMode] = useState<'template' | 'upload'>('template')
  const [uploadSrc, setUploadSrc] = useState<string | null>(null)
  const [photoSrc, setPhotoSrc] = useState<string | null>(null)
  const [edited, setEdited] = useState(false)
  const [cardKey, setCardKey] = useState(0)
  const [autosave, setAutosave] = useState('Draft only — not saved')

  // Toolbar
  const activeSlotRef = useRef<HTMLElement | null>(null)
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarSize, setToolbarSize] = useState<SlotSize>('m')

  // Modals
  const [showDiscard, setShowDiscard] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [shareCaption, setShareCaption] = useState('')

  // File inputs
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // ── helpers ─────────────────────────────────────────────────────────────────
  function markEdited() {
    setEdited(true)
    setAutosave('Draft only — not saved')
  }

  function buildCaption(data: CardData): string {
    const who = mode === 'upload' ? eventName : (data.couple || eventName)
    return `${who} invite you to their wedding on ${data.date || defaultData.date}.\nSee the invite & RSVP: ${rsvpUrl}`
  }

  // ── gallery ─────────────────────────────────────────────────────────────────
  const filteredTemplates = filter === 'All' ? TEMPLATES : TEMPLATES.filter((t) => t.style === filter)

  function openTemplate(tplId: string) {
    const found = TEMPLATES.find((t) => t.id === tplId)
    if (!found) return
    setTpl(found)
    setMode('template')
    setCardData({ ...defaultData })
    setPhotoSrc(null)
    setEdited(false)
    setAutosave('Draft only — not saved')
    setCardKey((k) => k + 1)
    setView('editor')
    window.scrollTo(0, 0)
  }

  function openUpload(src: string) {
    setTpl(null)
    setMode('upload')
    setUploadSrc(src)
    setEdited(true)
    setAutosave('Ready')
    setCardKey((k) => k + 1)
    setView('editor')
    window.scrollTo(0, 0)
  }

  // ── editor ───────────────────────────────────────────────────────────────────
  function handleBack() {
    if (edited) setShowDiscard(true)
    else setView('gallery')
  }

  function confirmDiscard() {
    setShowDiscard(false)
    setView('gallery')
  }

  function handleSlotFocus(key: SlotKey, el: HTMLElement) {
    activeSlotRef.current = el
    const size: SlotSize = el.classList.contains('is-sz-s') ? 's' : el.classList.contains('is-sz-l') ? 'l' : 'm'
    setToolbarSize(size)
    setShowToolbar(true)
  }

  function handleSlotInput(key: SlotKey, value: string) {
    setCardData((prev) => ({ ...prev, [key]: value }))
    markEdited()
  }

  // Hide toolbar when focus leaves both slot and toolbar
  function handleEditorFocusOut(e: React.FocusEvent) {
    const related = e.relatedTarget as HTMLElement | null
    if (related?.closest('.inv-slot') || related?.closest('.inv-toolbar')) return
    setTimeout(() => {
      const active = document.activeElement
      if (active?.closest('.inv-slot') || active?.closest('.inv-toolbar')) return
      setShowToolbar(false)
      activeSlotRef.current = null
    }, 80)
  }

  function bumpSize(dir: 1 | -1) {
    const el = activeSlotRef.current
    if (!el) return
    const cur: SlotSize = el.classList.contains('is-sz-s') ? 's' : el.classList.contains('is-sz-l') ? 'l' : 'm'
    const next = SIZES[Math.max(0, Math.min(2, SIZES.indexOf(cur) + dir))]
    el.classList.remove('is-sz-s', 'is-sz-l')
    if (next === 's') el.classList.add('is-sz-s')
    if (next === 'l') el.classList.add('is-sz-l')
    setToolbarSize(next)
    el.focus()
    markEdited()
  }

  // ── file uploads ─────────────────────────────────────────────────────────────
  function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !['image/jpeg', 'image/png'].includes(file.type)) return
    openUpload(URL.createObjectURL(file))
    e.target.value = ''
  }

  function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !['image/jpeg', 'image/png'].includes(file.type)) return
    setPhotoSrc(URL.createObjectURL(file))
    markEdited()
    e.target.value = ''
  }

  // ── share ────────────────────────────────────────────────────────────────────
  function handleShare() {
    setShareCaption(buildCaption(cardData))
    setShowShare(true)
  }

  function handleShareConfirm() {
    setShowShare(false)
    window.open(`https://wa.me/?text=${encodeURIComponent(shareCaption)}`, '_blank', 'noopener,noreferrer')
  }

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ════ GALLERY ════ */}
      <section
        className="inv-gallery"
        id="inv-gallery"
        aria-labelledby="inv-h"
        hidden={view !== 'gallery' || undefined}
      >
        <header className="section-head reveal">
          <p className="section-head-eyebrow">Section</p>
          <h1 className="section-head-title" id="inv-h">Invitations</h1>
          <p className="section-head-sub">Pick a card, make it yours, and share it with your guests on WhatsApp.</p>
        </header>

        <div className="dp-filter-chips inv-filters reveal" role="radiogroup" aria-label="Filter cards by style">
          {STYLES.map((style) => (
            <button
              key={style}
              type="button"
              className={`dp-filter-chip${filter === style ? ' is-active' : ''}`}
              role="radio"
              aria-checked={filter === style}
              onClick={() => setFilter(style)}
            >
              {style}
            </button>
          ))}
        </div>

        <div className="dp-tile-grid inv-grid reveal" aria-label="Invitation card templates">
          {filter === 'All' && (
            <button
              type="button"
              className="inv-tile inv-upload-tile"
              aria-label="Upload your own card"
              onClick={() => uploadInputRef.current?.click()}
            >
              <div className="inv-tile-card">
                <span className="material-symbols-outlined" aria-hidden="true">upload</span>
                <span className="inv-up-title">Upload your card</span>
                <span className="inv-up-sub">Already have a design? Use it as-is.</span>
              </div>
            </button>
          )}
          {filteredTemplates.map((t) => (
            <button
              key={t.id}
              type="button"
              className="inv-tile"
              aria-label={`Use the ${t.name} card (${t.style})`}
              onClick={() => openTemplate(t.id)}
            >
              <div className="inv-tile-card">
                <InvCard tpl={t} data={defaultData} />
              </div>
              <span className="inv-tile-name">
                {t.name}
                <span className="inv-tile-style">{t.style}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ════ EDITOR ════ */}
      <section
        className="inv-editor"
        id="inv-editor"
        aria-label="Card editor"
        hidden={view !== 'editor' || undefined}
        onBlurCapture={handleEditorFocusOut}
      >
        <div className="inv-editor-head reveal">
          <button type="button" className="btn-pill btn-pill-secondary" onClick={handleBack}>
            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            <span>Change template</span>
          </button>
          <span className="inv-autosave" aria-live="polite">
            <span className="material-symbols-outlined" aria-hidden="true">cloud_done</span>
            {' '}{autosave}
          </span>
        </div>

        {mode === 'template' && (
          <p className="inv-edit-hint">Tap any text on the card to edit it.</p>
        )}

        <div className="inv-editor-stage reveal">
          <div className="inv-card-frame">
            {mode === 'upload' && uploadSrc ? (
              <article key={cardKey} className="inv-card" data-mode="upload" aria-label="Invitation card preview">
                <img src={uploadSrc} alt="Your uploaded invitation card" />
              </article>
            ) : tpl ? (
              <InvCard
                key={cardKey}
                tpl={tpl}
                data={cardData}
                editable
                photoSrc={photoSrc}
                onPhotoClick={() => photoInputRef.current?.click()}
                onSlotFocus={handleSlotFocus}
                onSlotInput={handleSlotInput}
              />
            ) : null}
          </div>
        </div>

        {/* Floating text-size toolbar */}
        <div
          className="inv-toolbar"
          role="toolbar"
          aria-label="Text size"
          hidden={!showToolbar || undefined}
        >
          <button type="button" className="inv-tool-btn" aria-label="Smaller text" onClick={() => bumpSize(-1)}>
            <span className="material-symbols-outlined" aria-hidden="true">text_decrease</span>
          </button>
          <span className="inv-tool-label" aria-live="polite">{SIZE_LABELS[toolbarSize]}</span>
          <button type="button" className="inv-tool-btn" aria-label="Larger text" onClick={() => bumpSize(1)}>
            <span className="material-symbols-outlined" aria-hidden="true">text_increase</span>
          </button>
        </div>

        {/* Sticky action bar */}
        <div className="inv-actionbar reveal">
          <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setShowPreview(true)}>
            <span className="material-symbols-outlined" aria-hidden="true">visibility</span>
            <span>Preview</span>
          </button>
          <button
            type="button"
            className="btn-pill btn-pill-secondary"
            disabled
            aria-disabled="true"
            title="Card download is not available yet"
          >
            <span className="material-symbols-outlined" aria-hidden="true">download</span>
            <span>Download soon</span>
          </button>
          <button type="button" className="btn-pill btn-pill-primary" onClick={handleShare}>
            <span className="material-symbols-outlined" aria-hidden="true">share</span>
            <span>Share on WhatsApp</span>
          </button>
        </div>
      </section>

      {/* Hidden file inputs */}
      <label className="sr-only" htmlFor="inv-upload-input">Upload your own card image</label>
      <input
        type="file" id="inv-upload-input" ref={uploadInputRef}
        className="sr-only" accept="image/jpeg,image/png"
        onChange={handleUploadFile}
      />
      <label className="sr-only" htmlFor="inv-photo-input">Add a photo to the card</label>
      <input
        type="file" id="inv-photo-input" ref={photoInputRef}
        className="sr-only" accept="image/jpeg,image/png"
        onChange={handlePhotoFile}
      />

      {/* ════ MODALS ════ */}

      {/* Discard-template confirm */}
      {showDiscard && (
        <div
          className="modal-scrim is-open"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDiscard(false) }}
        >
          <div
            className="modal-card lg-glass-card modal-confirm-cautionary"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="inv-discard-title"
          >
            <span className="modal-confirm-icon is-cautionary" aria-hidden="true">
              <span className="material-symbols-outlined">restart_alt</span>
            </span>
            <h2 className="modal-confirm-title" id="inv-discard-title">Change template?</h2>
            <p className="modal-confirm-text">Your edits on this card will be cleared. Your other cards are unaffected.</p>
            <div className="modal-actions">
              <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setShowDiscard(false)}>Keep editing</button>
              <button type="button" className="btn-pill btn-pill-primary" onClick={confirmDiscard}>Change template</button>
            </div>
          </div>
        </div>
      )}

      {/* Full preview lightbox */}
      {showPreview && (
        <div
          className="modal-scrim modal-scrim-deep is-open"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPreview(false) }}
        >
          <div
            className="modal-card modal-image-lightbox inv-preview-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inv-preview-title"
          >
            <button
              className="modal-lightbox-close"
              type="button"
              aria-label="Close preview"
              onClick={() => setShowPreview(false)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
            <div className="inv-preview-stage">
              {mode === 'upload' && uploadSrc ? (
                <article className="inv-card" data-mode="upload">
                  <img src={uploadSrc} alt="Your uploaded invitation card" />
                </article>
              ) : tpl ? (
                <InvCard tpl={tpl} data={cardData} photoSrc={photoSrc} />
              ) : null}
            </div>
            <div className="modal-lightbox-bar">
              <div className="modal-lightbox-meta">
                <p className="modal-lightbox-title" id="inv-preview-title">Your invitation</p>
                <p className="modal-lightbox-sub">This is what your guests will see.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp share confirm */}
      {showShare && (
        <div
          className="modal-scrim is-open"
          onClick={(e) => { if (e.target === e.currentTarget) setShowShare(false) }}
        >
          <div
            className="modal-card lg-glass-card inv-share-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inv-share-title"
          >
            <div className="modal-head">
              <div className="modal-head-lead">
                <h2 className="modal-title" id="inv-share-title">Share on WhatsApp</h2>
                <p className="modal-sub">Your card downloads, then attaches in WhatsApp with this message.</p>
              </div>
              <button type="button" className="modal-close" aria-label="Close" onClick={() => setShowShare(false)}>
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
            <div className="inv-share-body">
              <div className="inv-share-thumb" aria-hidden="true">
                {mode === 'upload' && uploadSrc ? (
                  <article className="inv-card" data-mode="upload">
                    <img src={uploadSrc} alt="" />
                  </article>
                ) : tpl ? (
                  <InvCard tpl={tpl} data={cardData} photoSrc={photoSrc} />
                ) : null}
              </div>
              <div className="inv-share-msg">
                <p className="inv-share-label">Message</p>
                <p className="inv-share-text">{shareCaption}</p>
                <p className="inv-share-note">
                  <span className="material-symbols-outlined" aria-hidden="true">info</span>
                  {' '}The card is an image — it attaches from your downloads. The link opens your RSVP page.
                </p>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setShowShare(false)}>Cancel</button>
              <button type="button" className="btn-pill btn-pill-primary" onClick={handleShareConfirm}>
                <span className="material-symbols-outlined" aria-hidden="true">download</span>
                Download &amp; open WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
