'use client'

/**
 * DEV-ONLY sample page to test the Cloudflare R2 round-trip:
 * client optimize → presigned PUT → public/signed retrieval.
 * Visit /dev/r2-test in development. Not for production.
 */
import { useState } from 'react'
import { optimizeImage } from '@/lib/storage/imageOptimize'

type Visibility = 'public' | 'private'

interface UploadResult {
  key: string
  viewUrl: string
}

export default function R2TestPage() {
  const [file, setFile] = useState<File | null>(null)
  const [visibility, setVisibility] = useState<Visibility>('private')
  const [log, setLog] = useState<string[]>([])
  const [masterUrl, setMasterUrl] = useState<string | null>(null)
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const append = (line: string) => setLog((prev) => [...prev, line])
  const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`

  async function uploadBlob(blob: Blob, contentType: string, ext: string): Promise<UploadResult> {
    const res = await fetch('/api/dev/r2/upload-url', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contentType, ext, visibility }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'upload-url failed')

    const put = await fetch(data.url, {
      method: 'PUT',
      headers: { 'content-type': contentType },
      body: blob,
    })
    if (!put.ok) throw new Error(`PUT to R2 failed (${put.status})`)

    let viewUrl: string = data.publicUrl
    if (!viewUrl) {
      const signRes = await fetch('/api/dev/r2/sign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key: data.key }),
      })
      const signData = await signRes.json()
      if (!signRes.ok) throw new Error(signData.error || 'sign failed')
      viewUrl = signData.url
    }
    return { key: data.key, viewUrl }
  }

  async function handleUpload() {
    if (!file) return
    setBusy(true)
    setLog([])
    setMasterUrl(null)
    setThumbUrl(null)
    try {
      append(`Original: ${kb(file.size)} (${file.type || 'unknown'})`)
      const opt = await optimizeImage(file)
      append(
        `Optimized master: ${kb(opt.master.size)} @ ${opt.width}px .${opt.masterExt}` +
          (opt.reencoded ? '' : ' (kept original — WebP was larger)')
      )
      append(`Thumbnail: ${kb(opt.thumb.size)}`)
      const delta = ((opt.master.size - file.size) / file.size) * 100
      append(
        delta <= 0
          ? `Master is ${Math.abs(delta).toFixed(0)}% smaller than original`
          : `Master is ${delta.toFixed(0)}% larger than original`
      )

      const master = await uploadBlob(opt.master, opt.masterType, opt.masterExt)
      append(`Master uploaded → ${master.key}`)
      const thumb = await uploadBlob(opt.thumb, opt.thumbType, opt.thumbExt)
      append(`Thumb uploaded → ${thumb.key}`)

      setMasterUrl(master.viewUrl)
      setThumbUrl(thumb.viewUrl)
      append(`✅ Done (${visibility})`)
    } catch (err) {
      append(`❌ ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>R2 storage test</h1>
      <p style={{ color: '#666', marginBottom: 20 }}>
        Dev-only. Optimizes in the browser, uploads direct to Cloudflare R2, then displays it back.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        <input
          type="file"
          accept="image/*,.heic,.heif"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="radio"
              name="vis"
              checked={visibility === 'private'}
              onChange={() => setVisibility('private')}
            />
            Private (signed URL)
          </label>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="radio"
              name="vis"
              checked={visibility === 'public'}
              onChange={() => setVisibility('public')}
            />
            Public (media.evenzi.com)
          </label>
        </div>
        <button
          onClick={handleUpload}
          disabled={!file || busy}
          style={{
            alignSelf: 'flex-start',
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: busy || !file ? '#ccc' : '#e11d48',
            color: '#fff',
            fontWeight: 600,
            cursor: busy || !file ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? 'Working…' : 'Optimize + upload'}
        </button>
      </div>

      {log.length > 0 && (
        <pre
          data-testid="r2-log"
          style={{
            background: '#0b1020',
            color: '#cde',
            padding: 14,
            borderRadius: 8,
            fontSize: 13,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            marginBottom: 20,
          }}
        >
          {log.join('\n')}
        </pre>
      )}

      {(masterUrl || thumbUrl) && (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {thumbUrl && (
            <figure style={{ margin: 0 }}>
              <figcaption style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Thumbnail</figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbUrl} alt="thumbnail" style={{ width: 120, borderRadius: 8 }} />
            </figure>
          )}
          {masterUrl && (
            <figure style={{ margin: 0 }}>
              <figcaption style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Master</figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={masterUrl} alt="master" style={{ maxWidth: 360, borderRadius: 8 }} />
            </figure>
          )}
        </div>
      )}
    </main>
  )
}
