/**
 * Client-side image optimization (browser-only).
 * Produces a high-cap WebP master + a small WebP thumbnail before upload,
 * so R2 only ever stores optimized images. Handles HEIC/HEIF via heic2any.
 *
 * "Keep-smaller" guard: for already-efficient inputs (graphics/screenshots),
 * a lossy WebP re-encode can be LARGER than the original. When the original is
 * smaller in bytes AND already within the dimension cap, we keep the original
 * bytes/format as the master instead of bloating storage.
 */

const ALLOWED_KEEP_TYPES = ['image/webp', 'image/jpeg', 'image/png', 'image/avif']

export interface OptimizedImage {
  master: Blob
  /** Master MIME type (e.g. image/webp, or the original's type when kept). */
  masterType: string
  /** Master file extension (no dot). */
  masterExt: string
  thumb: Blob
  thumbType: string
  thumbExt: string
  width: number
  height: number
  /** True when the WebP re-encode won; false when we kept the original bytes. */
  reencoded: boolean
}

const MASTER_MAX_EDGE = 4096
const THUMB_MAX_EDGE = 400
const MASTER_QUALITY = 0.85
const THUMB_QUALITY = 0.8

function extFromType(type: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/gif': 'gif',
  }
  return map[type] || 'bin'
}

async function decodeToBitmap(file: Blob): Promise<ImageBitmap> {
  const type = (file as File).type || ''
  const name = (file as File).name || ''
  const isHeic = type === 'image/heic' || type === 'image/heif' || /\.hei[cf]$/i.test(name)

  if (isHeic) {
    const heic2any = (await import('heic2any')).default as (opts: {
      blob: Blob
      toType?: string
      quality?: number
    }) => Promise<Blob | Blob[]>
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
    const blob = Array.isArray(converted) ? converted[0] : converted
    return createImageBitmap(blob, { imageOrientation: 'from-image' })
  }

  return createImageBitmap(file, { imageOrientation: 'from-image' })
}

function scaleDims(w: number, h: number, max: number): { w: number; h: number } {
  if (w <= max && h <= max) return { w, h }
  const ratio = w > h ? max / w : max / h
  return { w: Math.round(w * ratio), h: Math.round(h * ratio) }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

async function encode(
  bitmap: ImageBitmap,
  maxEdge: number,
  quality: number
): Promise<{ blob: Blob; ext: 'webp' | 'jpeg'; w: number; h: number }> {
  const { w, h } = scaleDims(bitmap.width, bitmap.height, maxEdge)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(bitmap, 0, 0, w, h)

  let blob = await canvasToBlob(canvas, 'image/webp', quality)
  let ext: 'webp' | 'jpeg' = 'webp'
  if (!blob) {
    blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    ext = 'jpeg'
  }
  if (!blob) throw new Error('Image encoding failed')
  return { blob, ext, w, h }
}

/**
 * Optimize a user-selected image into a master + thumbnail.
 * Throws a typed Error if the file cannot be decoded (caller should reject it).
 */
export async function optimizeImage(file: Blob): Promise<OptimizedImage> {
  let bitmap: ImageBitmap
  try {
    bitmap = await decodeToBitmap(file)
  } catch {
    throw new Error('Could not read this image. Supported: JPEG, PNG, WebP, AVIF, HEIC.')
  }

  try {
    const origW = bitmap.width
    const origH = bitmap.height
    const enc = await encode(bitmap, MASTER_MAX_EDGE, MASTER_QUALITY)
    const thumb = await encode(bitmap, THUMB_MAX_EDGE, THUMB_QUALITY)

    // Keep-smaller guard: prefer the original when it's smaller, already an
    // allowed type, and within the dimension cap (so we don't skip a needed downscale).
    const origType = (file as File).type || ''
    const withinCap = Math.max(origW, origH) <= MASTER_MAX_EDGE
    const keepOriginal =
      withinCap &&
      file.size > 0 &&
      file.size < enc.blob.size &&
      ALLOWED_KEEP_TYPES.includes(origType)

    const master = keepOriginal ? file : enc.blob
    const masterType = keepOriginal ? origType : `image/${enc.ext}`
    const masterExt = keepOriginal ? extFromType(origType) : enc.ext

    return {
      master,
      masterType,
      masterExt,
      thumb: thumb.blob,
      thumbType: `image/${thumb.ext}`,
      thumbExt: thumb.ext,
      width: keepOriginal ? origW : enc.w,
      height: keepOriginal ? origH : enc.h,
      reencoded: !keepOriginal,
    }
  } finally {
    bitmap.close?.()
  }
}
