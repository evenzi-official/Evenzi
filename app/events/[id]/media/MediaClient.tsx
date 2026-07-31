'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { runPhotoUploadPipeline, runVideoUploadPipeline, createUploadQueue } from '@/lib/media/uploadPipeline'
import { formatDuration } from '@/lib/media/formatDuration'
import { useOptimisticMediaMutation } from '@/lib/media/useOptimisticMediaMutation'

interface Photo {
  id: string
  src: string
  name: string
  albumIds: string[]
  uploadedAt: number
  published: boolean
  takenAt?: number
}

interface Video {
  id: string
  poster: string
  name: string
  duration: string
  albumIds: string[]
  uploadedAt: number
  takenAt?: number
}

interface Album {
  id: string
  name: string
  preset: boolean
}

interface FilterOption {
  id: string | null
  label: string
  icon: string
  desc?: string
  active: boolean
}

interface UploadItem {
  id: string
  file: File
  kind: 'photo' | 'video'
  status: 'local-pending' | 'optimizing' | 'uploading' | 'committing' | 'committed' | 'failed'
  progress: number
  previewUrl: string
  error?: string
}

type SortKey = 'newest' | 'oldest' | 'name'
type MediaTab = 'photos' | 'videos' | 'albums'

const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024 // hardcoded per D34 — entitlements are [PLANNED]

function pad2(n: number) { return n < 10 ? '0' + n : '' + n }
function fmtDate(ms: number) {
  const d = new Date(ms)
  return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear()
}
function isoDay(ms: number) {
  const d = new Date(ms)
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
}
function fmtGB(bytes: number) {
  const gb = bytes / (1024 * 1024 * 1024)
  return (gb >= 10 ? Math.round(gb) : Math.round(gb * 10) / 10) + ' GB'
}
function albumCountLabel(np: number, nv: number) {
  const parts: string[] = []
  if (np) parts.push(np + (np === 1 ? ' photo' : ' photos'))
  if (nv) parts.push(nv + (nv === 1 ? ' video' : ' videos'))
  return parts.length ? parts.join(' · ') : '0 photos'
}

interface PhotoTileProps {
  photo: Photo
  selected: boolean
  isCover: boolean
  selectMode: boolean
  withActions: boolean
  onOpen: (id: string) => void
  onSelect: (id: string, on: boolean) => void
  onAssignOne: (id: string) => void
}

function PhotoTile({ photo, selected, isCover, selectMode, withActions, onOpen, onSelect, onAssignOne }: PhotoTileProps) {
  return (
    <article
      className={`dp-tile photo-tile${selected ? ' is-selected' : ''}`}
      data-photo-id={photo.id}
      {...(isCover ? { 'data-cover': 'true' } : {})}
    >
      <label className="photo-tile-select">
        <input
          type="checkbox"
          data-photo-select=""
          aria-label={`Select ${photo.name}`}
          checked={selected}
          onChange={(e) => onSelect(photo.id, e.target.checked)}
        />
        <span className="photo-tile-check">
          <span className="material-symbols-outlined">check</span>
        </span>
      </label>
      <button
        type="button"
        className="dp-tile-trigger"
        aria-label={`View ${photo.name} full size`}
        onClick={() => selectMode ? onSelect(photo.id, !selected) : onOpen(photo.id)}
      >
        <span className="dp-tile-thumb">
          <img src={photo.src} alt="" loading="lazy" />
        </span>
      </button>
      <span className="photo-tile-cover-badge" hidden={!isCover}>
        <span className="material-symbols-outlined">star</span>Cover
      </span>
      {withActions && (
        <div className="photo-tile-actions">
          <button
            type="button"
            className="photo-tile-action"
            aria-label={`Add ${photo.name} to album`}
            onClick={(e) => { e.stopPropagation(); onAssignOne(photo.id) }}
          >
            <span className="material-symbols-outlined">library_add</span>
          </button>
        </div>
      )}
    </article>
  )
}

interface VideoTileProps {
  video: Video
  selected: boolean
  selectMode: boolean
  withActions: boolean
  onOpen: (id: string) => void
  onSelect: (id: string, on: boolean) => void
  onAssignOne: (id: string) => void
}

function VideoTile({ video, selected, selectMode, withActions, onOpen, onSelect, onAssignOne }: VideoTileProps) {
  return (
    <article
      className={`dp-tile photo-tile video-tile${selected ? ' is-selected' : ''}`}
      data-video-id={video.id}
    >
      <label className="photo-tile-select">
        <input
          type="checkbox"
          data-video-select=""
          aria-label={`Select ${video.name}`}
          checked={selected}
          onChange={(e) => onSelect(video.id, e.target.checked)}
        />
        <span className="photo-tile-check">
          <span className="material-symbols-outlined">check</span>
        </span>
      </label>
      <button
        type="button"
        className="dp-tile-trigger"
        aria-label={`Play ${video.name} (${video.duration})`}
        onClick={() => selectMode ? onSelect(video.id, !selected) : onOpen(video.id)}
      >
        <span className="dp-tile-thumb">
          <img src={video.poster} alt="" loading="lazy" />
          <span className="media-vplay-badge">
            <span className="material-symbols-outlined">play_arrow</span>
          </span>
          <span className="media-vduration">{video.duration}</span>
        </span>
      </button>
      {withActions && (
        <div className="photo-tile-actions">
          <button
            type="button"
            className="photo-tile-action"
            aria-label={`Add ${video.name} to album`}
            onClick={(e) => { e.stopPropagation(); onAssignOne(video.id) }}
          >
            <span className="material-symbols-outlined">library_add</span>
          </button>
        </div>
      )}
    </article>
  )
}

interface MediaClientProps {
  eventName: string
  eventId: string
  initialPhotos: Photo[]
  initialVideos: Video[]
  initialAlbums: Album[]
  storage: { usedBytes: number; photoCount: number; videoCount: number }
}

export function MediaClient({ eventName: _eventName, eventId, initialPhotos, initialVideos, initialAlbums, storage }: MediaClientProps) {
  const mediaMutation = useOptimisticMediaMutation()

  // ── Photos state
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [photoSort, setPhotoSort] = useState<SortKey>('newest')
  const [photoFilterAlbumId, setPhotoFilterAlbumId] = useState<string | null>(null)
  const [photoDateFrom, setPhotoDateFrom] = useState<number | null>(null)
  const [photoDateTo, setPhotoDateTo] = useState<number | null>(null)
  const [photoSelectMode, setPhotoSelectMode] = useState(false)
  const [photoSelected, setPhotoSelected] = useState<Record<string, boolean>>({})
  const [coverId, setCoverId] = useState<string | null>(null)
  const [lbIndex, setLbIndex] = useState(-1)
  const [lbIds, setLbIds] = useState<string[]>([])

  // ── Videos state
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  const [videoSort, setVideoSort] = useState<SortKey>('newest')
  const [videoFilterAlbumId, setVideoFilterAlbumId] = useState<string | null>(null)
  const [videoDateFrom, setVideoDateFrom] = useState<number | null>(null)
  const [videoDateTo, setVideoDateTo] = useState<number | null>(null)
  const [videoSelectMode, setVideoSelectMode] = useState(false)
  const [videoSelected, setVideoSelected] = useState<Record<string, boolean>>({})
  const [vLbIndex, setVLbIndex] = useState(-1)
  const [vLbIds, setVLbIds] = useState<string[]>([])

  // ── Shared
  const [albums, setAlbums] = useState<Album[]>(initialAlbums)
  const [activeTab, setActiveTab] = useState<MediaTab>('photos')
  const albumSeqRef = useRef(0)

  // ── Upload pipeline state
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([])
  const uploadQueueRef = useRef(createUploadQueue(3))
  // Every in-flight upload gets its own AbortController so unmount can cancel
  // the real XHR/fetch calls (lib/media/uploadPipeline.ts wires the signal
  // into xhr.abort()), not just stop local state updates.
  const controllersRef = useRef<Map<string, AbortController>>(new Map())
  // Tracks blob: preview URLs still awaiting their real signed URL from Task 13's
  // batch fetch, so that effect can revoke them the instant a real URL arrives —
  // this ref is the single source of truth for outstanding blob URLs (both this
  // step's unmount cleanup and Task 13's revoke-on-arrival logic read/write it).
  const blobUrlsRef = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    return () => {
      controllersRef.current.forEach((controller) => controller.abort())
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateUploadItem(id: string, patch: Partial<UploadItem>) {
    setUploadItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }

  async function handleFilesPicked(files: FileList, kind: 'photo' | 'video') {
    const newItems: UploadItem[] = Array.from(files).map((file) => ({
      id: `up-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      kind,
      status: 'local-pending',
      progress: 0,
      previewUrl: URL.createObjectURL(file),
    }))
    setUploadItems((prev) => [...prev, ...newItems])

    newItems.forEach((item) => {
      const controller = new AbortController()
      controllersRef.current.set(item.id, controller)

      uploadQueueRef.current.run(async () => {
        updateUploadItem(item.id, { status: 'optimizing' })
        try {
          const runner = kind === 'photo' ? runPhotoUploadPipeline : runVideoUploadPipeline
          updateUploadItem(item.id, { status: 'uploading' })
          const saved = await runner(item.file, eventId, (pct) => {
            updateUploadItem(item.id, { progress: pct })
          }, controller.signal)
          updateUploadItem(item.id, { status: 'committed', progress: 100 })
          // Track this blob URL as "outstanding" — Task 13's signed-URL batch
          // effect will pick up `saved.id`, and once the real URL lands in
          // urlCache it revokes this entry and removes it from the map.
          blobUrlsRef.current.set(saved.id, item.previewUrl)

          if (kind === 'photo') {
            setPhotos((prev) => [{
              id: saved.id,
              src: item.previewUrl,
              name: item.file.name,
              albumIds: [],
              uploadedAt: Date.parse(saved.created_at),
              published: false,
            }, ...prev])
          } else {
            setVideos((prev) => [{
              id: saved.id,
              poster: item.previewUrl,
              name: item.file.name,
              duration: formatDuration(saved.duration_sec ?? 0),
              albumIds: [],
              uploadedAt: Date.parse(saved.created_at),
            }, ...prev])
          }
        } catch (err) {
          if ((err as { name?: string })?.name !== 'AbortError') {
            updateUploadItem(item.id, { status: 'failed', error: err instanceof Error ? err.message : 'Upload failed' })
          }
        } finally {
          controllersRef.current.delete(item.id)
        }
      })
    })
  }

  function retryUpload(itemId: string) {
    const item = uploadItems.find((it) => it.id === itemId)
    if (!item) return
    setUploadItems((prev) => prev.filter((it) => it.id !== itemId))
    handleFilesPicked({ 0: item.file, length: 1, item: () => item.file } as unknown as FileList, item.kind)
  }

  // ── Modal states
  const [albumModalOpen, setAlbumModalOpen] = useState(false)
  const [albumModalMode, setAlbumModalMode] = useState<'create' | 'rename'>('create')
  const [albumModalId, setAlbumModalId] = useState<string | null>(null)
  const [albumName, setAlbumName] = useState('')
  const [albumNameError, setAlbumNameError] = useState(false)

  const [albumMenuOpen, setAlbumMenuOpen] = useState(false)
  const [albumMenuId, setAlbumMenuId] = useState<string | null>(null)

  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignMode, setAssignMode] = useState<'add' | 'remove'>('add')
  const [assignIds, setAssignIds] = useState<string[]>([])
  const [assignKind, setAssignKind] = useState<'photo' | 'video'>('photo')
  const [assignChosen, setAssignChosen] = useState<Record<string, boolean>>({})

  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [filterTitle, setFilterTitle] = useState('')
  const [filterSub, setFilterSub] = useState('Pick one.')
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([])
  const filterPickRef = useRef<((id: string | null) => void) | null>(null)

  const [dateModalOpen, setDateModalOpen] = useState(false)
  const [dateModalKind, setDateModalKind] = useState<'photo' | 'video'>('photo')
  const [dateInputFrom, setDateInputFrom] = useState('')
  const [dateInputTo, setDateInputTo] = useState('')

  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false)
  const [bulkDeleteKind, setBulkDeleteKind] = useState<'photo' | 'video'>('photo')

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [vlightboxOpen, setVlightboxOpen] = useState(false)
  const [removePhotoModalOpen, setRemovePhotoModalOpen] = useState(false)
  const [removePhotoId, setRemovePhotoId] = useState<string | null>(null)
  const [deleteAlbumModalOpen, setDeleteAlbumModalOpen] = useState(false)
  const [deleteAlbumId, setDeleteAlbumId] = useState<string | null>(null)

  // ── Derived
  const derived = useMemo(() => {
    function cmpNewest(a: { uploadedAt: number }, b: { uploadedAt: number }) { return b.uploadedAt - a.uploadedAt }
    function photoCmp() {
      if (photoSort === 'oldest') return (a: Photo, b: Photo) => a.uploadedAt - b.uploadedAt
      if (photoSort === 'name') return (a: Photo, b: Photo) => a.name.localeCompare(b.name, undefined, { numeric: true })
      return cmpNewest
    }
    function videoCmp() {
      if (videoSort === 'oldest') return (a: Video, b: Video) => a.uploadedAt - b.uploadedAt
      if (videoSort === 'name') return (a: Video, b: Video) => a.name.localeCompare(b.name, undefined, { numeric: true })
      return cmpNewest
    }

    let vp = photos.slice()
    if (photoFilterAlbumId) vp = vp.filter(p => p.albumIds.includes(photoFilterAlbumId))
    if (photoDateFrom != null) vp = vp.filter(p => (p.takenAt ?? p.uploadedAt) >= photoDateFrom)
    if (photoDateTo != null) vp = vp.filter(p => (p.takenAt ?? p.uploadedAt) <= photoDateTo)
    vp.sort(photoCmp())

    let vv = videos.slice()
    if (videoFilterAlbumId) vv = vv.filter(v => v.albumIds.includes(videoFilterAlbumId))
    if (videoDateFrom != null) vv = vv.filter(v => (v.takenAt ?? v.uploadedAt) >= videoDateFrom)
    if (videoDateTo != null) vv = vv.filter(v => (v.takenAt ?? v.uploadedAt) <= videoDateTo)
    vv.sort(videoCmp())

    const pct = STORAGE_LIMIT_BYTES > 0
      ? Math.min(100, Math.round((storage.usedBytes / STORAGE_LIMIT_BYTES) * 100))
      : 0
    const ms = storage.usedBytes >= STORAGE_LIMIT_BYTES ? 'atcap'
      : storage.usedBytes / STORAGE_LIMIT_BYTES >= 0.8 ? 'near' : 'healthy'

    function dateLabel(from: number | null, to: number | null) {
      if (from && to) return fmtDate(from) + ' – ' + fmtDate(to)
      if (from) return 'From ' + fmtDate(from)
      if (to) return 'Until ' + fmtDate(to)
      return null
    }

    const emptyAlbums = albums.filter(a =>
      !photos.some(p => p.albumIds.includes(a.id)) && !videos.some(v => v.albumIds.includes(a.id))
    )
    const filledAlbums = albums.filter(a =>
      photos.some(p => p.albumIds.includes(a.id)) || videos.some(v => v.albumIds.includes(a.id))
    )

    const lbPhoto = lbIndex >= 0 && lbIndex < lbIds.length
      ? photos.find(p => p.id === lbIds[lbIndex]) ?? null : null
    const vLbVideo = vLbIndex >= 0 && vLbIndex < vLbIds.length
      ? videos.find(v => v.id === vLbIds[vLbIndex]) ?? null : null

    return {
      visiblePhotos: vp,
      visibleVideos: vv,
      photoSelectedCount: Object.keys(photoSelected).length,
      videoSelectedCount: Object.keys(videoSelected).length,
      recentPhotos: photos.slice().sort(cmpNewest).slice(0, 12),
      recentVideos: videos.slice().sort(cmpNewest).slice(0, 12),
      emptyAlbums,
      filledAlbums,
      meterState: ms,
      meterPct: pct,
      meterText: fmtGB(storage.usedBytes) + ' of ' + fmtGB(STORAGE_LIMIT_BYTES) + ' used',
      meterNote: ms === 'near' ? "You're close to your storage limit."
        : ms === 'atcap' ? 'Storage full — remove photos or upgrade soon.' : null,
      photoSortLabel: photoSort === 'oldest' ? 'Oldest' : photoSort === 'name' ? 'Name A–Z' : 'Newest',
      videoSortLabel: videoSort === 'oldest' ? 'Oldest' : videoSort === 'name' ? 'Name A–Z' : 'Newest',
      photoFilterAlbumLabel: photoFilterAlbumId ? (albums.find(a => a.id === photoFilterAlbumId)?.name ?? null) : null,
      videoFilterAlbumLabel: videoFilterAlbumId ? (albums.find(a => a.id === videoFilterAlbumId)?.name ?? null) : null,
      photoDateLabel: dateLabel(photoDateFrom, photoDateTo),
      videoDateLabel: dateLabel(videoDateFrom, videoDateTo),
      lbPhoto,
      vLbVideo,
    }
  }, [photos, videos, albums, storage,
      photoSort, photoFilterAlbumId, photoDateFrom, photoDateTo,
      videoSort, videoFilterAlbumId, videoDateFrom, videoDateTo,
      photoSelected, videoSelected, lbIndex, lbIds, vLbIndex, vLbIds])

  // ── Keyboard: arrow nav in lightbox
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (lightboxOpen) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); setLbIndex(i => Math.max(0, i - 1)) }
        else if (e.key === 'ArrowRight') { e.preventDefault(); setLbIndex(i => Math.min(lbIds.length - 1, i + 1)) }
      } else if (vlightboxOpen) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); setVLbIndex(i => Math.max(0, i - 1)) }
        else if (e.key === 'ArrowRight') { e.preventDefault(); setVLbIndex(i => Math.min(vLbIds.length - 1, i + 1)) }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen, vlightboxOpen, lbIds.length, vLbIds.length])

  // ── Handlers

  function switchTab(tab: MediaTab) {
    if (tab !== 'photos' && photoSelectMode) { setPhotoSelectMode(false); setPhotoSelected({}) }
    if (tab !== 'videos' && videoSelectMode) { setVideoSelectMode(false); setVideoSelected({}) }
    setActiveTab(tab)
  }

  function togglePhotoSelect(id: string, on: boolean) {
    setPhotoSelected(prev => { const n = { ...prev }; if (on) n[id] = true; else delete n[id]; return n })
  }
  function togglePhotoSelectMode() {
    if (photoSelectMode) { setPhotoSelectMode(false); setPhotoSelected({}) }
    else setPhotoSelectMode(true)
  }

  function toggleVideoSelect(id: string, on: boolean) {
    setVideoSelected(prev => { const n = { ...prev }; if (on) n[id] = true; else delete n[id]; return n })
  }
  function toggleVideoSelectMode() {
    if (videoSelectMode) { setVideoSelectMode(false); setVideoSelected({}) }
    else setVideoSelectMode(true)
  }

  function openPhotoLightbox(photoId: string) {
    const ids = derived.visiblePhotos.map(p => p.id)
    const idx = ids.indexOf(photoId)
    setLbIds(idx === -1 ? [photoId] : ids)
    setLbIndex(idx === -1 ? 0 : idx)
    setLightboxOpen(true)
  }

  function openVideoLightbox(videoId: string) {
    const ids = derived.visibleVideos.map(v => v.id)
    const idx = ids.indexOf(videoId)
    setVLbIds(idx === -1 ? [videoId] : ids)
    setVLbIndex(idx === -1 ? 0 : idx)
    setVlightboxOpen(true)
  }

  function openAlbumModal(renameId?: string) {
    setAlbumModalMode(renameId ? 'rename' : 'create')
    setAlbumModalId(renameId ?? null)
    setAlbumName(renameId ? (albums.find(a => a.id === renameId)?.name ?? '') : '')
    setAlbumNameError(false)
    setAlbumModalOpen(true)
  }

  function submitAlbumForm() {
    const name = albumName.trim()
    if (!name) { setAlbumNameError(true); return }
    if (albumModalMode === 'rename' && albumModalId) {
      setAlbums(prev => prev.map(a => a.id === albumModalId ? { ...a, name } : a))
    } else {
      albumSeqRef.current++
      setAlbums(prev => [...prev, { id: 'al-' + albumSeqRef.current, name, preset: false }])
    }
    setAlbumModalOpen(false)
  }

  function deleteAlbum(id: string) {
    setAlbums(prev => prev.filter(a => a.id !== id))
    setPhotos(prev => prev.map(p => ({ ...p, albumIds: p.albumIds.filter(aid => aid !== id) })))
    setVideos(prev => prev.map(v => ({ ...v, albumIds: v.albumIds.filter(aid => aid !== id) })))
    if (photoFilterAlbumId === id) setPhotoFilterAlbumId(null)
    if (videoFilterAlbumId === id) setVideoFilterAlbumId(null)
  }

  function openAssign(mode: 'add' | 'remove', ids: string[], kind: 'photo' | 'video') {
    if (!ids.length) return
    setAssignMode(mode); setAssignIds(ids); setAssignKind(kind); setAssignChosen({})
    setAssignModalOpen(true)
  }

  function submitAssign() {
    const aids = Object.keys(assignChosen)
    if (!aids.length) return
    if (assignKind === 'photo') {
      setPhotos(prev => prev.map(p => {
        if (!assignIds.includes(p.id)) return p
        const next = p.albumIds.slice()
        aids.forEach(aid => {
          const i = next.indexOf(aid)
          if (assignMode === 'add' && i === -1) next.push(aid)
          if (assignMode === 'remove' && i !== -1) next.splice(i, 1)
        })
        return { ...p, albumIds: next }
      }))
    } else {
      setVideos(prev => prev.map(v => {
        if (!assignIds.includes(v.id)) return v
        const next = v.albumIds.slice()
        aids.forEach(aid => {
          const i = next.indexOf(aid)
          if (assignMode === 'add' && i === -1) next.push(aid)
          if (assignMode === 'remove' && i !== -1) next.splice(i, 1)
        })
        return { ...v, albumIds: next }
      }))
    }
    setAssignModalOpen(false)
  }

  function openFilterSheet(cfg: { title: string; sub?: string; options: FilterOption[]; onPick: (id: string | null) => void }) {
    setFilterTitle(cfg.title); setFilterSub(cfg.sub ?? 'Pick one.')
    setFilterOptions(cfg.options); filterPickRef.current = cfg.onPick
    setFilterModalOpen(true)
  }

  function openPhotoSortSheet() {
    openFilterSheet({
      title: 'Sort photos', sub: 'Choose an order.',
      options: [
        { id: 'newest', label: 'Newest first', icon: 'arrow_downward', active: photoSort === 'newest' },
        { id: 'oldest', label: 'Oldest first', icon: 'arrow_upward', active: photoSort === 'oldest' },
        { id: 'name', label: 'Name A–Z', icon: 'sort_by_alpha', active: photoSort === 'name' },
      ],
      onPick: (id) => { if (id) setPhotoSort(id as SortKey) },
    })
  }
  function openPhotoAlbumFilter() {
    const opts: FilterOption[] = [{ id: null, label: 'All albums', icon: 'apps', active: !photoFilterAlbumId }]
    albums.forEach(a => opts.push({
      id: a.id, label: a.name, icon: 'photo_album',
      desc: photos.filter(p => p.albumIds.includes(a.id)).length + ' photos',
      active: photoFilterAlbumId === a.id,
    }))
    openFilterSheet({ title: 'Filter by album', options: opts, onPick: (id) => setPhotoFilterAlbumId(id) })
  }
  function openPhotoDateModal() {
    setDateModalKind('photo')
    setDateInputFrom(photoDateFrom ? isoDay(photoDateFrom) : '')
    setDateInputTo(photoDateTo ? isoDay(photoDateTo) : '')
    setDateModalOpen(true)
  }

  function openVideoSortSheet() {
    openFilterSheet({
      title: 'Sort videos', sub: 'Choose an order.',
      options: [
        { id: 'newest', label: 'Newest first', icon: 'arrow_downward', active: videoSort === 'newest' },
        { id: 'oldest', label: 'Oldest first', icon: 'arrow_upward', active: videoSort === 'oldest' },
        { id: 'name', label: 'Name A–Z', icon: 'sort_by_alpha', active: videoSort === 'name' },
      ],
      onPick: (id) => { if (id) setVideoSort(id as SortKey) },
    })
  }
  function openVideoAlbumFilter() {
    const opts: FilterOption[] = [{ id: null, label: 'All albums', icon: 'apps', active: !videoFilterAlbumId }]
    albums.forEach(a => opts.push({
      id: a.id, label: a.name, icon: 'photo_album',
      desc: videos.filter(v => v.albumIds.includes(a.id)).length + ' videos',
      active: videoFilterAlbumId === a.id,
    }))
    openFilterSheet({ title: 'Filter by album', options: opts, onPick: (id) => setVideoFilterAlbumId(id) })
  }
  function openVideoDateModal() {
    setDateModalKind('video')
    setDateInputFrom(videoDateFrom ? isoDay(videoDateFrom) : '')
    setDateInputTo(videoDateTo ? isoDay(videoDateTo) : '')
    setDateModalOpen(true)
  }

  function applyDateFilter() {
    let f = dateInputFrom, t = dateInputTo
    if (f && t && f > t) { [f, t] = [t, f] }
    const from = f ? new Date(f + 'T00:00:00').getTime() : null
    const to = t ? new Date(t + 'T23:59:59').getTime() : null
    if (dateModalKind === 'video') { setVideoDateFrom(from); setVideoDateTo(to) }
    else { setPhotoDateFrom(from); setPhotoDateTo(to) }
    setDateModalOpen(false)
  }

  function removePhoto(id: string) {
    const snapshot = photos
    const snapshotCoverId = coverId
    mediaMutation.run({
      apply: () => {
        const next = photos.filter(p => p.id !== id)
        if (coverId === id) setCoverId(next.length ? next.slice().sort((a, b) => b.uploadedAt - a.uploadedAt)[0].id : null)
        setPhotos(next)
        togglePhotoSelect(id, false)
        setLightboxOpen(false); setRemovePhotoModalOpen(false)
      },
      revert: () => { setPhotos(snapshot); setCoverId(snapshotCoverId) },
      request: () => fetch(`/api/events/${eventId}/media/${id}`, { method: 'DELETE' }).then((res) => {
        if (!res.ok && res.status !== 204) throw new Error('Failed to delete photo')
      }),
    })
  }

  function removeVideo(id: string) {
    const snapshot = videos
    mediaMutation.run({
      apply: () => {
        setVideos(prev => prev.filter(v => v.id !== id))
        toggleVideoSelect(id, false)
        setVlightboxOpen(false)
      },
      revert: () => setVideos(snapshot),
      request: () => fetch(`/api/events/${eventId}/media/${id}`, { method: 'DELETE' }).then((res) => {
        if (!res.ok && res.status !== 204) throw new Error('Failed to delete video')
      }),
    })
  }

  function bulkDeletePhotos() {
    const ids = Object.keys(photoSelected)
    if (!ids.length) return
    const snapshot = photos
    const snapshotCoverId = coverId
    mediaMutation.run<{ deleted: string[]; failed: { id: string; reason: string }[] }>({
      apply: () => {
        const next = photos.filter(p => !ids.includes(p.id))
        if (ids.includes(coverId ?? '')) setCoverId(next.length ? next.slice().sort((a, b) => b.uploadedAt - a.uploadedAt)[0].id : null)
        setPhotos(next); setPhotoSelectMode(false); setPhotoSelected({}); setBulkDeleteModalOpen(false)
      },
      revert: () => { setPhotos(snapshot); setCoverId(snapshotCoverId) },
      request: async () => {
        const res = await fetch(`/api/events/${eventId}/media/bulk-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        })
        if (!res.ok) throw new Error('Failed to delete photos')
        const result = await res.json()
        // Selection clears entirely regardless of partial failure (spec §5 rule).
        // Any failed ids are restored to the grid — the optimistic delete over-removed them.
        if (result.failed.length > 0) {
          const failedIds = new Set(result.failed.map((f: { id: string }) => f.id))
          setPhotos((prev) => {
            const restored = snapshot.filter((p) => failedIds.has(p.id))
            return [...restored, ...prev]
          })
        }
        return result
      },
    })
  }

  function bulkDeleteVideos() {
    const ids = Object.keys(videoSelected)
    if (!ids.length) return
    const snapshot = videos
    mediaMutation.run<{ deleted: string[]; failed: { id: string; reason: string }[] }>({
      apply: () => {
        setVideos(prev => prev.filter(v => !ids.includes(v.id)))
        setVideoSelectMode(false); setVideoSelected({}); setBulkDeleteModalOpen(false)
      },
      revert: () => setVideos(snapshot),
      request: async () => {
        const res = await fetch(`/api/events/${eventId}/media/bulk-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        })
        if (!res.ok) throw new Error('Failed to delete videos')
        const result = await res.json()
        if (result.failed.length > 0) {
          const failedIds = new Set(result.failed.map((f: { id: string }) => f.id))
          setVideos((prev) => {
            const restored = snapshot.filter((v) => failedIds.has(v.id))
            return [...restored, ...prev]
          })
        }
        return result
      },
    })
  }

  function openAlbum(albumId: string) {
    setPhotoFilterAlbumId(albumId); setVideoFilterAlbumId(albumId); setActiveTab('photos')
  }

  function getAssignableAlbums() {
    if (assignMode === 'add') return albums.slice()
    const present: Record<string, boolean> = {}
    assignIds.forEach(id => {
      const item = assignKind === 'photo' ? photos.find(p => p.id === id) : videos.find(v => v.id === id)
      if (item) item.albumIds.forEach(a => { present[a] = true })
    })
    return albums.filter(a => present[a.id])
  }

  function albumPhotos(albumId: string) { return photos.filter(p => p.albumIds.includes(albumId)) }
  function albumVideos(albumId: string) { return videos.filter(v => v.albumIds.includes(albumId)) }

  const { visiblePhotos, visibleVideos, photoSelectedCount, videoSelectedCount,
          recentPhotos, recentVideos, emptyAlbums, filledAlbums,
          meterState, meterPct, meterText, meterNote,
          photoSortLabel, videoSortLabel,
          photoFilterAlbumLabel, videoFilterAlbumLabel,
          photoDateLabel, videoDateLabel, lbPhoto, vLbVideo } = derived

  const menuAlbum = albumMenuId ? albums.find(a => a.id === albumMenuId) : null
  const photoIsEmpty = photos.length === 0
  const videoIsEmpty = videos.length === 0

  return (
    <>
      <header className="section-head reveal">
        <p className="section-head-eyebrow">Section</p>
        <h1 className="section-head-title">Media &amp; Memories</h1>
        <p className="section-head-sub">Upload, organize, and relive every moment from your celebration.</p>
      </header>

      {mediaMutation.error && (
        <div className="media-error-banner" role="alert">
          {mediaMutation.error}
          <button type="button" onClick={mediaMutation.clearError} aria-label="Dismiss">×</button>
        </div>
      )}

      {/* Storage meter */}
      <section
        className="clay-card media-storage-meter reveal"
        id="md-meter"
        data-meter-state={meterState}
        aria-labelledby="md-meter-h"
      >
        <div className="media-meter-lead">
          <span className="media-meter-icon" aria-hidden="true">
            <span className="material-symbols-outlined">
              {meterState === 'atcap' ? 'error' : meterState === 'near' ? 'warning' : 'cloud_done'}
            </span>
          </span>
          <div className="media-meter-meta">
            <h2 className="media-meter-title" id="md-meter-h">Storage</h2>
            <p className="media-meter-text">{meterText}</p>
            {meterNote && <p className="media-meter-note">{meterNote}</p>}
          </div>
        </div>
        <div
          className="media-meter-track"
          role="progressbar"
          aria-labelledby="md-meter-h"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={meterPct}
        >
          <span className="media-meter-fill" style={{ width: meterPct + '%' }} />
        </div>
        <div className="media-meter-cta">
          <span className="media-meter-cta-copy">More storage coming soon</span>
          <button type="button" className="btn-pill btn-pill-secondary">
            <span className="material-symbols-outlined" aria-hidden="true">notifications</span>
            Notify me
          </button>
        </div>
      </section>

      {/* Tab nav */}
      <div className="seg-wrap reveal">
        <nav className="seg" role="tablist" aria-label="Media sections">
          {([
            { id: 'photos', label: 'Photos', icon: 'photo_library' },
            { id: 'videos', label: 'Videos', icon: 'movie' },
            { id: 'albums', label: 'Albums', icon: 'photo_album' },
          ] as { id: MediaTab; label: string; icon: string }[]).map(tab => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`md-tab-${tab.id}`}
              className={`seg-item seg--page${activeTab === tab.id ? ' is-active' : ''}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`md-panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => switchTab(tab.id)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ── Panel: Photos */}
      <section id="md-panel-photos" role="tabpanel" aria-labelledby="md-tab-photos" className="media-panel reveal" hidden={activeTab !== 'photos'}>
        <div className="media-upload" aria-labelledby="md-upload-h">
          <h2 className="sr-only" id="md-upload-h">Upload photos</h2>
          <button
            type="button"
            className={`dp-dropzone dp-dropzone--multi${photoIsEmpty ? ' is-hero' : ''}`}
            aria-describedby="md-dropzone-hint"
            onClick={() => (document.getElementById('md-file-input') as HTMLInputElement | null)?.click()}
          >
            <span className="dp-dropzone-icon" aria-hidden="true">
              <span className="material-symbols-outlined">add_photo_alternate</span>
            </span>
            <span className="dp-dropzone-title">
              {photoIsEmpty ? 'Add your first photos' : 'Drag photos here, or tap to browse'}
            </span>
            {photoIsEmpty && (
              <span className="dp-dropzone-sub">
                Upload your favourite moments — organize them into albums and relive the day.
              </span>
            )}
            <span className="dp-dropzone-hint" id="md-dropzone-hint">JPG, PNG, HEIC · up to 10 MB each</span>
          </button>
          <label className="sr-only" htmlFor="md-file-input">Choose photos to upload</label>
          <input
            type="file"
            id="md-file-input"
            className="media-file-input"
            multiple
            accept="image/jpeg,image/png,image/heic"
            onChange={(e) => { if (e.target.files?.length) handleFilesPicked(e.target.files, 'photo'); e.target.value = '' }}
          />
          <ul className="media-upload-progress" role="list">
            {uploadItems.map((item) => (
              <li key={item.id} className={`media-upload-item media-upload-item--${item.status}`}>
                <span className="media-upload-item-name">{item.file.name}</span>
                {item.status !== 'failed' && item.status !== 'committed' && (
                  <span className="media-upload-item-pct" aria-hidden="true">{item.progress}%</span>
                )}
                <span className="sr-only" aria-live="polite">
                  {item.status === 'uploading' && item.progress === 0 ? 'Upload started' : ''}
                  {item.status === 'committed' ? 'Upload complete' : ''}
                  {item.status === 'failed' ? `Upload failed: ${item.error}` : ''}
                </span>
                {item.status === 'failed' && (
                  <button type="button" className="media-upload-item-retry" onClick={() => retryUpload(item.id)}>Retry</button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="media-recent" aria-labelledby="md-recent-h">
          <header className="section-head section-head--compact">
            <p className="section-head-eyebrow">Latest</p>
            <h2 className="section-head-title" id="md-recent-h">Recent uploads</h2>
          </header>
          {recentPhotos.length > 0 ? (
            <div className="media-recent-scroller">
              <ul className="media-recent-strip" role="list" aria-label="Recent uploads">
                {recentPhotos.map(p => (
                  <li key={p.id}>
                    <PhotoTile photo={p} selected={!!photoSelected[p.id]} isCover={p.id === coverId}
                      selectMode={photoSelectMode} withActions
                      onOpen={openPhotoLightbox} onSelect={togglePhotoSelect}
                      onAssignOne={(id) => openAssign('add', [id], 'photo')} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="media-empty-copy">Your latest uploads will appear here.</p>
          )}
        </div>

        <div
          className="clay-card media-all"
          data-photos-state={photoIsEmpty ? 'empty' : 'populated'}
          data-select-mode={photoSelectMode ? 'on' : 'off'}
          aria-labelledby="md-all-h"
        >
          <header className="media-all-head">
            <div className="media-all-lead">
              <h2 className="media-all-title" id="md-all-h">All photos</h2>
              <p className="media-all-sub" aria-live="polite">
                <span>{visiblePhotos.length}</span> photos · everything you&apos;ve uploaded, across every album.
              </p>
            </div>
            <div className="media-all-aux">
              <button type="button" className="btn-pill btn-pill-secondary"
                      aria-pressed={photoSelectMode} onClick={togglePhotoSelectMode}>
                <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
                <span>{photoSelectMode ? 'Done' : 'Select'}</span>
              </button>
            </div>
          </header>
          <div className="media-toolbar" role="group" aria-label="Sort and filter photos">
            <button type="button" className="btn-pill btn-pill-secondary media-tool" aria-haspopup="dialog" onClick={openPhotoSortSheet}>
              <span className="material-symbols-outlined" aria-hidden="true">swap_vert</span>
              <span className="media-tool-label">Sort: <span>{photoSortLabel}</span></span>
            </button>
            <span className="media-toolbar-div" aria-hidden="true" />
            <button type="button" className={`btn-pill btn-pill-secondary media-tool${photoFilterAlbumId ? ' is-active' : ''}`}
                    aria-haspopup="dialog" onClick={openPhotoAlbumFilter}>
              <span className="material-symbols-outlined" aria-hidden="true">photo_album</span>
              <span className="media-tool-label">Album</span>
            </button>
            <button type="button" className={`btn-pill btn-pill-secondary media-tool${photoDateFrom || photoDateTo ? ' is-active' : ''}`}
                    aria-haspopup="dialog" onClick={openPhotoDateModal}>
              <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
              <span className="media-tool-label">Dates</span>
            </button>
          </div>
          {(photoFilterAlbumLabel || photoDateLabel) && (
            <div className="dp-filter-chips media-active-filter">
              {photoFilterAlbumLabel && (
                <button type="button" className="dp-filter-chip is-active"
                        aria-label={`Clear filter: ${photoFilterAlbumLabel}`}
                        onClick={() => setPhotoFilterAlbumId(null)}>
                  {photoFilterAlbumLabel}<span className="material-symbols-outlined">close</span>
                </button>
              )}
              {photoDateLabel && (
                <button type="button" className="dp-filter-chip is-active"
                        aria-label={`Clear filter: ${photoDateLabel}`}
                        onClick={() => { setPhotoDateFrom(null); setPhotoDateTo(null) }}>
                  {photoDateLabel}<span className="material-symbols-outlined">close</span>
                </button>
              )}
              <button type="button" className="media-clear-all"
                      onClick={() => { setPhotoFilterAlbumId(null); setPhotoDateFrom(null); setPhotoDateTo(null) }}>
                Clear all
              </button>
            </div>
          )}
          <div className="dp-tile-grid" aria-label="All photos">
            {visiblePhotos.map(p => (
              <PhotoTile key={p.id} photo={p} selected={!!photoSelected[p.id]} isCover={p.id === coverId}
                selectMode={photoSelectMode} withActions={false}
                onOpen={openPhotoLightbox} onSelect={togglePhotoSelect}
                onAssignOne={(id) => openAssign('add', [id], 'photo')} />
            ))}
          </div>
          {photoIsEmpty && (
            <div className="photos-empty">
              <span className="photos-empty-icon" aria-hidden="true"><span className="material-symbols-outlined">photo_library</span></span>
              <p className="photos-empty-title">No photos yet</p>
              <p className="photos-empty-help">Photos you upload will appear here — use the dropzone above to add your first ones.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Panel: Albums */}
      <section id="md-panel-albums" role="tabpanel" aria-labelledby="md-tab-albums" className="media-panel reveal" hidden={activeTab !== 'albums'}>
        <div className="media-albums">
          {emptyAlbums.length > 0 && (
            <>
              <p className="media-empty-copy media-preset-note">
                These albums are ready and waiting — they&apos;ll appear as cards once they hold photos.
              </p>
              <div className="dp-filter-chips media-preset-chips" aria-label="Albums waiting for photos">
                {emptyAlbums.map(a => <span key={a.id} className="dp-filter-chip">{a.name}</span>)}
              </div>
            </>
          )}
          <div className="dp-tile-grid media-albums-grid">
            {filledAlbums.map(a => {
              const ap = albumPhotos(a.id).sort((x, y) => y.uploadedAt - x.uploadedAt)
              const av = albumVideos(a.id).sort((x, y) => y.uploadedAt - x.uploadedAt)
              const np = ap.length, nv = av.length
              const coverSrc = np ? ap[0].src : av[0]?.poster ?? ''
              const label = albumCountLabel(np, nv)
              return (
                <article key={a.id} className="dp-tile album-card" data-album-id={a.id}>
                  <button type="button" className="dp-tile-link album-card-open"
                          aria-label={`Open ${a.name} album — ${label}`}
                          onClick={() => openAlbum(a.id)} />
                  <div>
                    <span className="dp-tile-thumb">
                      <img src={coverSrc} alt="" loading="lazy" />
                      {!np && nv > 0 && (
                        <span className="media-vplay-badge"><span className="material-symbols-outlined">play_arrow</span></span>
                      )}
                    </span>
                    <div className="dp-tile-meta">
                      <span className="dp-tile-name" title={a.name}>{a.name}</span>
                      <span className="dp-tile-sub album-card-count">{label}</span>
                    </div>
                  </div>
                  <button type="button" className="photo-tile-action" aria-label={`${a.name} album options`}
                          onClick={() => { setAlbumMenuId(a.id); setAlbumMenuOpen(true) }}>
                    <span className="material-symbols-outlined">more_horiz</span>
                  </button>
                </article>
              )
            })}
            <button type="button" className="empty-cta-card" onClick={() => openAlbumModal()}>
              <span className="empty-cta-icon" aria-hidden="true"><span className="material-symbols-outlined">add</span></span>
              <p className="empty-cta-title">Create album</p>
              <p className="empty-cta-sub">Name a moment worth grouping.</p>
            </button>
          </div>
        </div>
      </section>

      {/* ── Panel: Videos */}
      <section id="md-panel-videos" role="tabpanel" aria-labelledby="md-tab-videos" className="media-panel reveal" hidden={activeTab !== 'videos'}>
        <div className="media-upload" aria-labelledby="md-vupload-h">
          <h2 className="sr-only" id="md-vupload-h">Upload videos</h2>
          <button
            type="button"
            className={`dp-dropzone dp-dropzone--multi${videoIsEmpty ? ' is-hero' : ''}`}
            aria-describedby="md-vdropzone-hint"
            onClick={() => (document.getElementById('md-vfile-input') as HTMLInputElement | null)?.click()}
          >
            <span className="dp-dropzone-icon" aria-hidden="true"><span className="material-symbols-outlined">video_call</span></span>
            <span className="dp-dropzone-title">
              {videoIsEmpty ? 'Add your first videos' : 'Drag videos here, or tap to browse'}
            </span>
            {videoIsEmpty && (
              <span className="dp-dropzone-sub">Share clips from your celebration — relive the day in motion.</span>
            )}
            <span className="dp-dropzone-hint" id="md-vdropzone-hint">MP4, MOV · up to 200 MB each</span>
          </button>
          <label className="sr-only" htmlFor="md-vfile-input">Choose videos to upload</label>
          <input
            type="file"
            id="md-vfile-input"
            className="media-file-input"
            multiple
            accept="video/mp4,video/quicktime"
            onChange={(e) => { if (e.target.files?.length) handleFilesPicked(e.target.files, 'video'); e.target.value = '' }}
          />
          <ul className="media-upload-progress" role="list" aria-live="polite" />
        </div>

        <div className="media-recent" aria-labelledby="md-vrecent-h">
          <header className="section-head section-head--compact">
            <p className="section-head-eyebrow">Latest</p>
            <h2 className="section-head-title" id="md-vrecent-h">Recent videos</h2>
          </header>
          {recentVideos.length > 0 ? (
            <div className="media-recent-scroller">
              <ul className="media-recent-strip" role="list" aria-label="Recent videos">
                {recentVideos.map(v => (
                  <li key={v.id}>
                    <VideoTile video={v} selected={!!videoSelected[v.id]} selectMode={videoSelectMode} withActions
                      onOpen={openVideoLightbox} onSelect={toggleVideoSelect}
                      onAssignOne={(id) => openAssign('add', [id], 'video')} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="media-empty-copy">Your latest videos will appear here.</p>
          )}
        </div>

        <div
          className="clay-card media-all"
          data-photos-state={videoIsEmpty ? 'empty' : 'populated'}
          data-select-mode={videoSelectMode ? 'on' : 'off'}
          aria-labelledby="md-vall-h"
        >
          <header className="media-all-head">
            <div className="media-all-lead">
              <h2 className="media-all-title" id="md-vall-h">All videos</h2>
              <p className="media-all-sub" aria-live="polite">
                <span>{visibleVideos.length}</span> videos · everything you&apos;ve uploaded.
              </p>
            </div>
            <div className="media-all-aux">
              <button type="button" className="btn-pill btn-pill-secondary"
                      aria-pressed={videoSelectMode} onClick={toggleVideoSelectMode}>
                <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
                <span>{videoSelectMode ? 'Done' : 'Select'}</span>
              </button>
            </div>
          </header>
          <div className="media-toolbar" role="group" aria-label="Sort and filter videos">
            <button type="button" className="btn-pill btn-pill-secondary media-tool" aria-haspopup="dialog" onClick={openVideoSortSheet}>
              <span className="material-symbols-outlined" aria-hidden="true">swap_vert</span>
              <span className="media-tool-label">Sort: <span>{videoSortLabel}</span></span>
            </button>
            <span className="media-toolbar-div" aria-hidden="true" />
            <button type="button" className={`btn-pill btn-pill-secondary media-tool${videoFilterAlbumId ? ' is-active' : ''}`}
                    aria-haspopup="dialog" onClick={openVideoAlbumFilter}>
              <span className="material-symbols-outlined" aria-hidden="true">photo_album</span>
              <span className="media-tool-label">Album</span>
            </button>
            <button type="button" className={`btn-pill btn-pill-secondary media-tool${videoDateFrom || videoDateTo ? ' is-active' : ''}`}
                    aria-haspopup="dialog" onClick={openVideoDateModal}>
              <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
              <span className="media-tool-label">Dates</span>
            </button>
          </div>
          {(videoFilterAlbumLabel || videoDateLabel) && (
            <div className="dp-filter-chips media-active-filter">
              {videoFilterAlbumLabel && (
                <button type="button" className="dp-filter-chip is-active"
                        aria-label={`Clear filter: ${videoFilterAlbumLabel}`}
                        onClick={() => setVideoFilterAlbumId(null)}>
                  {videoFilterAlbumLabel}<span className="material-symbols-outlined">close</span>
                </button>
              )}
              {videoDateLabel && (
                <button type="button" className="dp-filter-chip is-active"
                        aria-label={`Clear filter: ${videoDateLabel}`}
                        onClick={() => { setVideoDateFrom(null); setVideoDateTo(null) }}>
                  {videoDateLabel}<span className="material-symbols-outlined">close</span>
                </button>
              )}
              <button type="button" className="media-clear-all"
                      onClick={() => { setVideoFilterAlbumId(null); setVideoDateFrom(null); setVideoDateTo(null) }}>
                Clear all
              </button>
            </div>
          )}
          <div className="dp-tile-grid" aria-label="All videos">
            {visibleVideos.map(v => (
              <VideoTile key={v.id} video={v} selected={!!videoSelected[v.id]}
                selectMode={videoSelectMode} withActions={false}
                onOpen={openVideoLightbox} onSelect={toggleVideoSelect}
                onAssignOne={(id) => openAssign('add', [id], 'video')} />
            ))}
          </div>
          {videoIsEmpty && (
            <div className="photos-empty">
              <span className="photos-empty-icon" aria-hidden="true"><span className="material-symbols-outlined">movie</span></span>
              <p className="photos-empty-title">No videos yet</p>
              <p className="photos-empty-help">Upload clips from your celebration — they&apos;ll appear here.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Bulk bar: Photos */}
      <div className="bulk-bar" hidden={!photoSelectMode || photoSelectedCount === 0}>
        <span className="bulk-bar-count">{photoSelectedCount} selected</span>
        <span className="bulk-bar-div" aria-hidden="true" />
        <button type="button" className="bulk-bar-act" onClick={() => openAssign('add', Object.keys(photoSelected), 'photo')}>
          <span aria-hidden="true" className="material-symbols-outlined">library_add</span>
          <span className="bulk-bar-act-label">Add to album</span>
        </button>
        <button type="button" className="bulk-bar-act" onClick={() => openAssign('remove', Object.keys(photoSelected), 'photo')}>
          <span aria-hidden="true" className="material-symbols-outlined">folder_off</span>
          <span className="bulk-bar-act-label">Remove from album</span>
        </button>
        <button type="button" className="bulk-bar-act bulk-bar-act--danger"
                onClick={() => { setBulkDeleteKind('photo'); setBulkDeleteModalOpen(true) }}>
          <span aria-hidden="true" className="material-symbols-outlined">delete</span>
          <span className="bulk-bar-act-label">Delete</span>
        </button>
        <button type="button" className="bulk-bar-cancel" aria-label="Clear selection"
                onClick={() => { setPhotoSelected({}) }}>
          <span aria-hidden="true" className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* ── Bulk bar: Videos */}
      <div className="bulk-bar" hidden={!videoSelectMode || videoSelectedCount === 0}>
        <span className="bulk-bar-count">{videoSelectedCount} selected</span>
        <span className="bulk-bar-div" aria-hidden="true" />
        <button type="button" className="bulk-bar-act" onClick={() => openAssign('add', Object.keys(videoSelected), 'video')}>
          <span aria-hidden="true" className="material-symbols-outlined">library_add</span>
          <span className="bulk-bar-act-label">Add to album</span>
        </button>
        <button type="button" className="bulk-bar-act" onClick={() => openAssign('remove', Object.keys(videoSelected), 'video')}>
          <span aria-hidden="true" className="material-symbols-outlined">folder_off</span>
          <span className="bulk-bar-act-label">Remove from album</span>
        </button>
        <button type="button" className="bulk-bar-act bulk-bar-act--danger"
                onClick={() => { setBulkDeleteKind('video'); setBulkDeleteModalOpen(true) }}>
          <span aria-hidden="true" className="material-symbols-outlined">delete</span>
          <span className="bulk-bar-act-label">Delete</span>
        </button>
        <button type="button" className="bulk-bar-cancel" aria-label="Clear selection"
                onClick={() => { setVideoSelected({}) }}>
          <span aria-hidden="true" className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* ── Modal: Create / Rename album */}
      <div className={`modal-scrim${albumModalOpen ? ' is-open' : ''}`} aria-hidden={!albumModalOpen}>
        <div className="modal-card lg-glass-card" role="dialog" aria-modal="true" aria-labelledby="md-album-title">
          <div className="modal-head">
            <div className="modal-head-lead">
              <h2 className="modal-title" id="md-album-title">
                {albumModalMode === 'rename' ? 'Rename album' : 'Create album'}
              </h2>
              <p className="modal-sub">
                {albumModalMode === 'rename' ? 'Give this album a clearer name.' : 'Group photos so the day is easy to relive.'}
              </p>
            </div>
            <button type="button" className="modal-close" aria-label="Close" onClick={() => setAlbumModalOpen(false)}>
              <span aria-hidden="true" className="material-symbols-outlined">close</span>
            </button>
          </div>
          <form noValidate onSubmit={(e) => { e.preventDefault(); submitAlbumForm() }}>
            <div className="form-group">
              <label className="form-label" htmlFor="md-album-name">
                Album name <span className="req-mark" aria-hidden="true">*</span>
              </label>
              <input className="form-input" id="md-album-name" type="text" maxLength={90} placeholder="e.g. Haldi"
                     value={albumName} aria-invalid={albumNameError ? 'true' : undefined}
                     onChange={(e) => { setAlbumName(e.target.value); if (albumNameError) setAlbumNameError(false) }} />
              {albumNameError && (
                <p className="form-error">
                  <span aria-hidden="true" className="material-symbols-outlined">error</span>
                  <span>Give your album a name.</span>
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setAlbumModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn-pill btn-pill-primary">
                {albumModalMode === 'rename' ? 'Save name' : 'Create album'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Modal: Album options menu */}
      <div className={`modal-scrim${albumMenuOpen ? ' is-open' : ''}`} aria-hidden={!albumMenuOpen}>
        <div className="modal-card lg-glass-card" role="dialog" aria-modal="true" aria-labelledby="md-album-menu-title">
          <div className="modal-head">
            <div className="modal-head-lead">
              <h2 className="modal-title" id="md-album-menu-title">Album options</h2>
              <p className="modal-sub">{menuAlbum?.name ?? ''}</p>
            </div>
            <button type="button" className="modal-close" aria-label="Close" onClick={() => setAlbumMenuOpen(false)}>
              <span aria-hidden="true" className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="gm-setter-opts">
            <button type="button" className="gm-setter-opt" onClick={() => {
              const id = albumMenuId; setAlbumMenuOpen(false); if (id) openAlbumModal(id)
            }}>
              <span aria-hidden="true" className="material-symbols-outlined">edit</span>
              Rename album
            </button>
            <button type="button" className="gm-setter-opt" onClick={() => {
              setDeleteAlbumId(albumMenuId); setAlbumMenuOpen(false); setDeleteAlbumModalOpen(true)
            }}>
              <span aria-hidden="true" className="material-symbols-outlined">folder_off</span>
              Delete album
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal: Assign to album */}
      <div className={`modal-scrim${assignModalOpen ? ' is-open' : ''}`} aria-hidden={!assignModalOpen}>
        <div className="modal-card modal-picker-grid lg-glass-card" role="dialog" aria-modal="true" aria-labelledby="md-assign-title">
          <div className="modal-head">
            <div className="modal-head-lead">
              <h2 className="modal-title" id="md-assign-title">
                {assignMode === 'add' ? 'Add to album' : 'Remove from album'}
              </h2>
              <p className="modal-sub">
                {assignMode === 'add'
                  ? `Choose albums for the selected ${assignKind === 'video' ? 'videos' : 'photos'}.`
                  : `Choose which albums to take the selected ${assignKind === 'video' ? 'videos' : 'photos'} out of.`}
              </p>
            </div>
            <button type="button" className="modal-close" aria-label="Close" onClick={() => setAssignModalOpen(false)}>
              <span aria-hidden="true" className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="modal-picker-body">
            {getAssignableAlbums().length === 0 ? (
              <p className="modal-picker-tile-desc">
                {assignMode === 'remove' ? "These items aren't filed in any album yet." : 'No albums yet — create one first.'}
              </p>
            ) : getAssignableAlbums().map(a => {
              const chosen = !!assignChosen[a.id]
              const count = assignKind === 'photo' ? albumPhotos(a.id).length : albumVideos(a.id).length
              return (
                <button key={a.id} type="button" className={`modal-picker-tile${chosen ? ' is-selected' : ''}`}
                        aria-pressed={chosen} onClick={() => setAssignChosen(prev => {
                          const n = { ...prev }; if (n[a.id]) delete n[a.id]; else n[a.id] = true; return n
                        })}>
                  <span className="modal-picker-tile-icon" aria-hidden="true">
                    <span className="material-symbols-outlined">photo_album</span>
                  </span>
                  <span className="modal-picker-tile-name">{a.name}</span>
                  <span className="modal-picker-tile-desc">{count} {assignKind === 'photo' ? 'photos' : 'videos'}</span>
                  <span className="modal-picker-tile-check" aria-hidden="true">
                    <span className="material-symbols-outlined">check_circle</span>
                  </span>
                </button>
              )
            })}
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setAssignModalOpen(false)}>Cancel</button>
            <button type="button" className="btn-pill btn-pill-primary"
                    disabled={Object.keys(assignChosen).length === 0} onClick={submitAssign}>
              {assignMode === 'add' ? 'Add' : 'Remove'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal: Sort / Filter picker */}
      <div className={`modal-scrim${filterModalOpen ? ' is-open' : ''}`} aria-hidden={!filterModalOpen}>
        <div className="modal-card modal-picker-grid lg-glass-card" role="dialog" aria-modal="true" aria-labelledby="md-filter-title">
          <div className="modal-head">
            <div className="modal-head-lead">
              <h2 className="modal-title" id="md-filter-title">{filterTitle}</h2>
              <p className="modal-sub">{filterSub}</p>
            </div>
            <button type="button" className="modal-close" aria-label="Close" onClick={() => setFilterModalOpen(false)}>
              <span aria-hidden="true" className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="modal-picker-body" role="radiogroup" aria-labelledby="md-filter-title">
            {filterOptions.map(opt => (
              <button key={opt.id ?? '__all__'} type="button"
                      className={`modal-picker-tile${opt.active ? ' is-selected' : ''}`}
                      role="radio" aria-checked={opt.active}
                      onClick={() => { setFilterModalOpen(false); filterPickRef.current?.(opt.id) }}>
                <span className="modal-picker-tile-icon" aria-hidden="true">
                  <span className="material-symbols-outlined">{opt.icon}</span>
                </span>
                <span className="modal-picker-tile-name">{opt.label}</span>
                {opt.desc && <span className="modal-picker-tile-desc">{opt.desc}</span>}
                <span className="modal-picker-tile-check" aria-hidden="true">
                  <span className="material-symbols-outlined">check_circle</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Modal: Date range */}
      <div className={`modal-scrim${dateModalOpen ? ' is-open' : ''}`} aria-hidden={!dateModalOpen}>
        <div className="modal-card lg-glass-card" role="dialog" aria-modal="true" aria-labelledby="md-date-title">
          <div className="modal-head">
            <div className="modal-head-lead">
              <h2 className="modal-title" id="md-date-title">Filter by date</h2>
              <p className="modal-sub">Show {dateModalKind === 'video' ? 'videos' : 'photos'} taken within a date range.</p>
            </div>
            <button type="button" className="modal-close" aria-label="Close" onClick={() => setDateModalOpen(false)}>
              <span aria-hidden="true" className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="media-date-fields">
            <div className="form-group">
              <label className="form-label" htmlFor="md-date-from">From</label>
              <input className="form-input" id="md-date-from" type="date"
                     value={dateInputFrom} onChange={(e) => setDateInputFrom(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="md-date-to">To</label>
              <input className="form-input" id="md-date-to" type="date"
                     value={dateInputTo} onChange={(e) => setDateInputTo(e.target.value)} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-pill btn-pill-secondary" onClick={() => {
              if (dateModalKind === 'video') { setVideoDateFrom(null); setVideoDateTo(null) }
              else { setPhotoDateFrom(null); setPhotoDateTo(null) }
              setDateModalOpen(false)
            }}>Clear</button>
            <button type="button" className="btn-pill btn-pill-primary" onClick={applyDateFilter}>Apply</button>
          </div>
        </div>
      </div>

      {/* ── Modal: Bulk delete confirm */}
      <div className={`modal-scrim${bulkDeleteModalOpen ? ' is-open' : ''}`} aria-hidden={!bulkDeleteModalOpen}>
        <div className="modal-card lg-glass-card modal-confirm-cautionary" role="alertdialog" aria-modal="true" aria-labelledby="md-bulk-del-title">
          <span className="modal-confirm-icon is-cautionary" aria-hidden="true">
            <span className="material-symbols-outlined">delete</span>
          </span>
          <h2 className="modal-confirm-title" id="md-bulk-del-title">
            Remove these {bulkDeleteKind === 'video' ? 'videos' : 'photos'}?
          </h2>
          <p className="modal-confirm-text">
            {bulkDeleteKind === 'video' ? videoSelectedCount : photoSelectedCount}{' '}
            {bulkDeleteKind === 'video'
              ? (videoSelectedCount === 1 ? 'video' : 'videos')
              : (photoSelectedCount === 1 ? 'photo' : 'photos')}{' '}
            will be removed from your gallery. You can undo right after.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setBulkDeleteModalOpen(false)}>Keep them</button>
            <button type="button" className="btn-pill btn-pill-primary"
                    onClick={() => bulkDeleteKind === 'video' ? bulkDeleteVideos() : bulkDeletePhotos()}>
              Remove {bulkDeleteKind === 'video' ? 'videos' : 'photos'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal: Photo lightbox */}
      <div className={`modal-scrim modal-scrim-deep${lightboxOpen ? ' is-open' : ''}`} aria-hidden={!lightboxOpen}>
        <div className="modal-card modal-image-lightbox" role="dialog" aria-modal="true" aria-labelledby="md-lb-title">
          <button className="modal-lightbox-close" type="button" aria-label="Close" onClick={() => setLightboxOpen(false)}>
            <span aria-hidden="true" className="material-symbols-outlined">close</span>
          </button>
          {lbPhoto && (
            <>
              <img className="modal-lightbox-img" src={lbPhoto.src} alt={lbPhoto.name} />
              <div className="modal-lightbox-nav">
                <button type="button" className="modal-lightbox-nav-btn modal-lightbox-nav-prev"
                        aria-label="Previous photo" disabled={lbIndex <= 0}
                        onClick={() => setLbIndex(i => Math.max(0, i - 1))}>
                  <span aria-hidden="true" className="material-symbols-outlined">chevron_left</span>
                </button>
                <button type="button" className="modal-lightbox-nav-btn modal-lightbox-nav-next"
                        aria-label="Next photo" disabled={lbIndex >= lbIds.length - 1}
                        onClick={() => setLbIndex(i => Math.min(lbIds.length - 1, i + 1))}>
                  <span aria-hidden="true" className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
              <div className="modal-lightbox-bar">
                <div className="modal-lightbox-meta">
                  <p className="modal-lightbox-title" id="md-lb-title">{lbPhoto.name}</p>
                  <p className="modal-lightbox-sub">Uploaded {fmtDate(lbPhoto.uploadedAt)}</p>
                </div>
                <div className="modal-lightbox-actions">
                  <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setCoverId(lbPhoto.id)}>
                    <span aria-hidden="true" className="material-symbols-outlined">star</span>Set cover
                  </button>
                  <button type="button" className="btn-pill btn-pill-secondary"
                          onClick={() => { setLightboxOpen(false); openAssign('add', [lbPhoto.id], 'photo') }}>
                    <span aria-hidden="true" className="material-symbols-outlined">library_add</span>Add to album
                  </button>
                  <button type="button" className="btn-pill btn-pill-secondary"
                          onClick={() => { setRemovePhotoId(lbPhoto.id); setRemovePhotoModalOpen(true) }}>
                    <span aria-hidden="true" className="material-symbols-outlined">delete</span>Remove
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modal: Video lightbox */}
      <div className={`modal-scrim modal-scrim-deep${vlightboxOpen ? ' is-open' : ''}`} aria-hidden={!vlightboxOpen}>
        <div className="modal-card modal-image-lightbox" role="dialog" aria-modal="true" aria-labelledby="md-vlb-title">
          <button className="modal-lightbox-close" type="button" aria-label="Close" onClick={() => setVlightboxOpen(false)}>
            <span aria-hidden="true" className="material-symbols-outlined">close</span>
          </button>
          {vLbVideo && (
            <>
              <div className="media-vplayer">
                <img className="modal-lightbox-img" src={vLbVideo.poster} alt={vLbVideo.name} />
                <button type="button" className="media-vplay" aria-label="Play video">
                  <span aria-hidden="true" className="material-symbols-outlined">play_arrow</span>
                </button>
                <span className="media-vduration media-vduration--lg" aria-hidden="true">{vLbVideo.duration}</span>
              </div>
              <div className="modal-lightbox-nav">
                <button type="button" className="modal-lightbox-nav-btn modal-lightbox-nav-prev"
                        aria-label="Previous video" disabled={vLbIndex <= 0}
                        onClick={() => setVLbIndex(i => Math.max(0, i - 1))}>
                  <span aria-hidden="true" className="material-symbols-outlined">chevron_left</span>
                </button>
                <button type="button" className="modal-lightbox-nav-btn modal-lightbox-nav-next"
                        aria-label="Next video" disabled={vLbIndex >= vLbIds.length - 1}
                        onClick={() => setVLbIndex(i => Math.min(vLbIds.length - 1, i + 1))}>
                  <span aria-hidden="true" className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
              <div className="modal-lightbox-bar">
                <div className="modal-lightbox-meta">
                  <p className="modal-lightbox-title" id="md-vlb-title">{vLbVideo.name}</p>
                  <p className="modal-lightbox-sub">{vLbVideo.duration} · uploaded {fmtDate(vLbVideo.uploadedAt)}</p>
                </div>
                <div className="modal-lightbox-actions">
                  <button type="button" className="btn-pill btn-pill-secondary"
                          onClick={() => { setVlightboxOpen(false); openAssign('add', [vLbVideo.id], 'video') }}>
                    <span aria-hidden="true" className="material-symbols-outlined">library_add</span>Add to album
                  </button>
                  <button type="button" className="btn-pill btn-pill-secondary"
                          onClick={() => removeVideo(vLbVideo.id)}>
                    <span aria-hidden="true" className="material-symbols-outlined">delete</span>Remove
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modal: Remove photo confirm */}
      <div className={`modal-scrim${removePhotoModalOpen ? ' is-open' : ''}`} aria-hidden={!removePhotoModalOpen}>
        <div className="modal-card lg-glass-card modal-confirm-cautionary" role="alertdialog" aria-modal="true" aria-labelledby="md-remove-title">
          <span className="modal-confirm-icon is-cautionary" aria-hidden="true">
            <span className="material-symbols-outlined">delete</span>
          </span>
          <h2 className="modal-confirm-title" id="md-remove-title">Remove this photo?</h2>
          <p className="modal-confirm-text">It&apos;ll be permanently removed from your gallery. This can&apos;t be undone.</p>
          <div className="modal-actions">
            <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setRemovePhotoModalOpen(false)}>Keep it</button>
            <button type="button" className="btn-pill btn-pill-primary"
                    onClick={() => { if (removePhotoId) removePhoto(removePhotoId) }}>
              Remove photo
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal: Delete album confirm */}
      <div className={`modal-scrim${deleteAlbumModalOpen ? ' is-open' : ''}`} aria-hidden={!deleteAlbumModalOpen}>
        <div className="modal-card lg-glass-card modal-confirm-cautionary" role="alertdialog" aria-modal="true" aria-labelledby="md-del-album-title">
          <span className="modal-confirm-icon is-cautionary" aria-hidden="true">
            <span className="material-symbols-outlined">folder_off</span>
          </span>
          <h2 className="modal-confirm-title" id="md-del-album-title">Remove this album?</h2>
          <p className="modal-confirm-text">Your photos stay safe in All Photos — only the album is removed.</p>
          <div className="modal-actions">
            <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setDeleteAlbumModalOpen(false)}>Keep album</button>
            <button type="button" className="btn-pill btn-pill-primary"
                    onClick={() => { if (deleteAlbumId) { deleteAlbum(deleteAlbumId); setDeleteAlbumModalOpen(false) } }}>
              Remove album
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
