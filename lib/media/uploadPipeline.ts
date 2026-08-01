'use client'

import { optimizeImage } from '@/lib/storage/imageOptimize'

export interface UploadedMedia {
  id: string
  kind: 'photo' | 'video'
  storage_key: string
  thumbnail_key: string
  width: number
  height: number
  duration_sec: number | null
  byte_size: number
  created_at: string
}

interface PresignResponse {
  url: string
  key: string
}

async function getUploadUrl(
  eventId: string,
  kind: 'photo' | 'video',
  part: 'master' | 'thumb',
  contentType: string,
  signal: AbortSignal
): Promise<PresignResponse> {
  const res = await fetch(`/api/events/${eventId}/media/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, part, contentType }),
    signal,
  })
  if (!res.ok) throw new Error(`Failed to get upload URL (${res.status})`)
  return res.json()
}

/**
 * PUT a blob to R2 via XHR (fetch can't report upload progress).
 * XHR has no native AbortSignal support, so `signal`'s abort event is wired
 * to xhr.abort() manually — this is what actually cancels an in-flight PUT
 * when MediaClient unmounts mid-upload (spec §5's optimistic-preview lifecycle).
 */
function putWithProgress(url: string, blob: Blob, contentType: string, onProgress: (pct: number) => void, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Aborted', 'AbortError')); return }
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`PUT failed (${xhr.status})`)))
    xhr.onerror = () => reject(new Error('Network error during upload'))
    const onAbort = () => { xhr.abort(); reject(new DOMException('Aborted', 'AbortError')) }
    signal.addEventListener('abort', onAbort)
    xhr.onloadend = () => signal.removeEventListener('abort', onAbort)
    xhr.send(blob)
  })
}

function isSafariNative(): boolean {
  const ua = navigator.userAgent
  return /^((?!chrome|android|crios|fxios).)*safari/i.test(ua)
}

async function decodeHeicIfNeeded(file: File): Promise<File> {
  const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || /\.hei[cf]$/i.test(file.name)
  if (!isHeic || isSafariNative()) return file
  try {
    const heic2any = (await import('heic2any')).default as (opts: { blob: Blob; toType?: string; quality?: number }) => Promise<Blob | Blob[]>
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
    const blob = Array.isArray(converted) ? converted[0] : converted
    return new File([blob], file.name.replace(/\.hei[cf]$/i, '.jpg'), { type: 'image/jpeg' })
  } catch {
    throw new Error('This HEIC photo could not be converted — try exporting it as JPEG first.')
  }
}

export async function runPhotoUploadPipeline(
  file: File,
  eventId: string,
  onProgress: (pct: number) => void,
  signal: AbortSignal
): Promise<UploadedMedia> {
  const decoded = await decodeHeicIfNeeded(file)
  const optimized = await optimizeImage(decoded)

  const [masterPresign, thumbPresign] = await Promise.all([
    getUploadUrl(eventId, 'photo', 'master', optimized.masterType, signal),
    getUploadUrl(eventId, 'photo', 'thumb', optimized.thumbType, signal),
  ])

  let masterPct = 0
  let thumbPct = 0
  const report = () => onProgress(Math.round((masterPct + thumbPct) / 2))

  await Promise.all([
    putWithProgress(masterPresign.url, optimized.master, optimized.masterType, (p) => { masterPct = p; report() }, signal),
    putWithProgress(thumbPresign.url, optimized.thumb, optimized.thumbType, (p) => { thumbPct = p; report() }, signal),
  ])

  const res = await fetch(`/api/events/${eventId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'photo',
      masterKey: masterPresign.key,
      thumbKey: thumbPresign.key,
      contentType: optimized.masterType,
      width: optimized.width,
      height: optimized.height,
    }),
    signal,
  })
  if (!res.ok) throw new Error(`Failed to save photo (${res.status})`)
  return res.json()
}

const VIDEO_SEEK_TIMEOUT_MS = 8000

async function capturePosterFrame(file: File): Promise<{ blob: Blob; durationSec: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.src = URL.createObjectURL(file)

    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Video took too long to load a preview frame'))
    }, VIDEO_SEEK_TIMEOUT_MS)

    function cleanup() {
      clearTimeout(timeout)
      URL.revokeObjectURL(video.src)
    }

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration / 2)
    }
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) { cleanup(); reject(new Error('Canvas unavailable')); return }
      ctx.drawImage(video, 0, 0)
      canvas.toBlob((blob) => {
        cleanup()
        if (!blob) { reject(new Error('Poster capture failed')); return }
        resolve({ blob, durationSec: Math.round(video.duration), width: video.videoWidth, height: video.videoHeight })
      }, 'image/webp', 0.8)
    }
    video.onerror = () => { cleanup(); reject(new Error('Could not read this video file')) }
  })
}

export async function runVideoUploadPipeline(
  file: File,
  eventId: string,
  onProgress: (pct: number) => void,
  signal: AbortSignal
): Promise<UploadedMedia> {
  const poster = await capturePosterFrame(file)

  const [videoPresign, posterPresign] = await Promise.all([
    getUploadUrl(eventId, 'video', 'master', file.type, signal),
    getUploadUrl(eventId, 'video', 'thumb', 'image/webp', signal),
  ])

  let videoPct = 0
  let posterPct = 0
  const report = () => onProgress(Math.round((videoPct + posterPct) / 2))

  await Promise.all([
    putWithProgress(videoPresign.url, file, file.type, (p) => { videoPct = p; report() }, signal),
    putWithProgress(posterPresign.url, poster.blob, 'image/webp', (p) => { posterPct = p; report() }, signal),
  ])

  const res = await fetch(`/api/events/${eventId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'video',
      masterKey: videoPresign.key,
      thumbKey: posterPresign.key,
      contentType: file.type,
      width: poster.width,
      height: poster.height,
      durationSec: poster.durationSec,
    }),
    signal,
  })
  if (!res.ok) throw new Error(`Failed to save video (${res.status})`)
  return res.json()
}

/** Runs up to `concurrency` upload tasks at once; the rest queue. */
export function createUploadQueue(concurrency: number) {
  let active = 0
  const queue: (() => void)[] = []

  function next() {
    if (active >= concurrency || queue.length === 0) return
    active++
    const task = queue.shift()!
    task()
  }

  return {
    run<T>(fn: () => Promise<T>): Promise<T> {
      return new Promise((resolve, reject) => {
        queue.push(() => {
          fn()
            .then((v) => { active--; next(); resolve(v) })
            .catch((e) => { active--; next(); reject(e) })
        })
        next()
      })
    },
  }
}
