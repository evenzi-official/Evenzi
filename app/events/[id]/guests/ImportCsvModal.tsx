'use client'

import { useState } from 'react'
import type { GuestRow } from '@/lib/types/guests'

interface Props {
  eventId: string
  existingPhones: Set<string>
  onClose: () => void
  onImported: (guests: GuestRow[], skippedDuplicates: number) => void
  flashToast: (message: string) => void
}

interface ParsedRow {
  name: string
  phone: string
  email: string | null
  status: 'valid' | 'error' | 'duplicate'
  errorMessage?: string
}

/** Minimal RFC4180 parser — handles quoted fields with embedded commas/newlines. No library needed for a 3-column format. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some((f) => f.trim() !== '')) rows.push(row)
      row = []
    } else {
      field += c
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    if (row.some((f) => f.trim() !== '')) rows.push(row)
  }
  return rows
}

function validateRows(rows: string[][], existingPhones: Set<string>): ParsedRow[] {
  const [header, ...dataRows] = rows
  const nameIdx = header.findIndex((h) => h.trim().toLowerCase() === 'name')
  const phoneIdx = header.findIndex((h) => h.trim().toLowerCase() === 'phone')
  const emailIdx = header.findIndex((h) => h.trim().toLowerCase() === 'email')
  const seenPhones = new Set<string>()
  return dataRows.map((cells): ParsedRow => {
    const name = (cells[nameIdx] ?? '').trim()
    const phoneDigits = (cells[phoneIdx] ?? '').replace(/\D/g, '')
    const email = emailIdx > -1 ? (cells[emailIdx] ?? '').trim() || null : null
    if (!name) return { name, phone: phoneDigits, email, status: 'error', errorMessage: 'Missing name' }
    if (phoneDigits.length !== 10) return { name, phone: phoneDigits, email, status: 'error', errorMessage: 'Invalid phone number' }
    if (existingPhones.has(phoneDigits) || seenPhones.has(phoneDigits)) return { name, phone: phoneDigits, email, status: 'duplicate' }
    seenPhones.add(phoneDigits)
    return { name, phone: phoneDigits, email, status: 'valid' }
  })
}

function downloadTemplate(): void {
  const blob = new Blob(['Name,Phone,Email\n'], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'evenzi-guest-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function ImportCsvModal({ eventId, existingPhones, onClose, onImported, flashToast }: Props): React.ReactElement {
  const [fileName, setFileName] = useState<string | null>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const errorCount = rows.filter((r) => r.status === 'error').length
  const duplicateCount = rows.filter((r) => r.status === 'duplicate').length
  const validCount = rows.filter((r) => r.status === 'valid').length
  const canImport = rows.length > 0 && errorCount === 0 && consent && !importing

  async function handleFile(file: File): Promise<void> {
    setParseError(null)
    setRows([])
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
      setParseError("That doesn't look like a CSV. Export your sheet as .csv and try again.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setParseError('That file is over 5 MB. Trim it and try again.')
      return
    }
    const text = await file.text()
    const parsed = parseCsv(text)
    if (parsed.length < 2) {
      setParseError('No guest rows found in that file.')
      return
    }
    setFileName(file.name)
    setRows(validateRows(parsed, existingPhones))
  }

  async function handleImport(): Promise<void> {
    setImporting(true)
    try {
      const validRows = rows.filter((r) => r.status === 'valid').map((r) => ({ name: r.name, phone: r.phone, email: r.email }))
      const res = await fetch(`/api/events/${eventId}/guests/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guests: validRows }),
      })
      const data: { inserted?: GuestRow[]; skippedDuplicates?: number; error?: string } = await res.json()
      if (!res.ok || !data.inserted) { flashToast('Import failed. Try again.'); return }
      onImported(data.inserted, (data.skippedDuplicates ?? 0) + duplicateCount)
      onClose()
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="modal-scrim is-open" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card lg-glass-card" role="dialog" aria-modal="true" aria-labelledby="gm-import-h">
        <header className="modal-head">
          <div className="modal-head-lead">
            <h2 className="modal-title" id="gm-import-h">Import guests from a spreadsheet</h2>
            <p className="modal-sub">
              CSV with columns: <strong>Name, Phone, Email</strong>.{' '}
              <a href="#" className="gm-template-link" onClick={(e) => { e.preventDefault(); downloadTemplate() }}>Download template</a>
            </p>
          </div>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <span aria-hidden="true" className="material-symbols-outlined">close</span>
          </button>
        </header>

        <label
          className={`dp-dropzone${dragOver ? ' is-dragover' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const f = e.dataTransfer.files[0]
            if (f) void handleFile(f)
          }}
        >
          <span className="dp-dropzone-icon" aria-hidden="true"><span className="material-symbols-outlined">upload_file</span></span>
          <p className="dp-dropzone-title">{fileName ?? 'Tap to choose a CSV file'}</p>
          <p className="dp-dropzone-hint">{fileName ? 'Tap to choose a different file' : 'or drag it here · max 5 MB'}</p>
          <input
            type="file" accept=".csv,text/csv" className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f) }}
          />
        </label>

        {parseError && (
          <p className="form-error" role="alert"><span aria-hidden="true" className="material-symbols-outlined">error</span> {parseError}</p>
        )}

        {rows.length > 0 && (
          <>
            <p className="gm-import-result">
              <span aria-hidden="true" className="material-symbols-outlined">task_alt</span>
              {validCount} new guest{validCount === 1 ? '' : 's'}
              {duplicateCount > 0 && ` · ${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'} skipped`}
              {errorCount > 0 && ` · ${errorCount} row${errorCount === 1 ? '' : 's'} with errors`}
            </p>
            <div className="gm-import-preview">
              <table className="w-full text-sm">
                <thead>
                  <tr><th className="text-left">Name</th><th className="text-left">Phone</th><th className="text-left">Email</th><th className="text-left">Status</th></tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.name || '—'}</td>
                      <td>{r.phone || '—'}</td>
                      <td>{r.email || '—'}</td>
                      <td>
                        {r.status === 'valid' && <span className="text-success">Ready</span>}
                        {r.status === 'duplicate' && <span>Duplicate — skipped</span>}
                        {r.status === 'error' && <span className="text-error">{r.errorMessage}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <label className="form-check gm-consent">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>I confirm I have these guests&apos; consent to add their contact details to Evenzi.</span>
        </label>

        <div className="modal-actions">
          <button type="button" className="btn-pill btn-pill-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-pill btn-pill-primary" disabled={!canImport} onClick={() => { void handleImport() }}>
            {importing ? 'Importing…' : 'Import guests'}
          </button>
        </div>
      </div>
    </div>
  )
}
