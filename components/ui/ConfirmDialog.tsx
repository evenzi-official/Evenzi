'use client'

import { useEffect, useId, useState } from 'react'
import { Portal } from '@/components/ui/Portal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: React.ReactNode
  /** Called when the user confirms. Keep the async work in the caller; pair with useBusy for the freeze. */
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  /** 'danger' → red confirm button + delete icon; 'cautionary' → primary button + warning icon. */
  tone?: 'danger' | 'cautionary'
  /** Material Symbols icon name. Defaults by tone. */
  icon?: string
  /** While true, buttons disable and the confirm button shows a spinner; Esc/scrim dismissal is blocked. */
  busy?: boolean
  /**
   * When set, renders a "type <requireText> to confirm" input and disables the
   * confirm button until it matches (case-insensitive). Use for hard-destructive actions.
   */
  requireText?: string
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'cautionary',
  icon,
  busy = false,
  requireText,
}: ConfirmDialogProps): React.ReactElement {
  const [typed, setTyped] = useState('')
  const [prevOpen, setPrevOpen] = useState(open)
  const titleId = useId()

  // Reset the type-to-confirm field whenever the dialog transitions to open.
  // Render-time reset (React's blessed pattern) rather than an effect.
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setTyped('')
  }

  // Esc cancels — but never mid-action.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  const resolvedIcon = icon ?? (tone === 'danger' ? 'delete_forever' : 'warning')
  const confirmBtnClass = tone === 'danger' ? 'btn-pill btn-pill-danger' : 'btn-pill btn-pill-primary'
  const textGateFailed = requireText != null && typed.trim().toUpperCase() !== requireText.trim().toUpperCase()

  return (
    <Portal>
      <div
        className={`modal-scrim${open ? ' is-open' : ''}`}
        aria-hidden={!open}
        onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel() }}
      >
        {open ? (
          <div className="modal-card modal-confirm-cautionary" role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
            <button
              className="modal-close modal-close--corner"
              type="button"
              aria-label="Close"
              onClick={onCancel}
              disabled={busy}
            >
              <span aria-hidden="true" className="material-symbols-outlined">close</span>
            </button>
            <span className="modal-confirm-icon is-cautionary" aria-hidden="true">
              <span className="material-symbols-outlined">{resolvedIcon}</span>
            </span>
            <h2 className="modal-confirm-title" id={titleId}>{title}</h2>
            <div className="modal-confirm-text">{message}</div>

            {requireText != null ? (
              <div className="form-group">
                <label className="form-label" htmlFor={`${titleId}-gate`}>
                  Type <strong>{requireText}</strong> to confirm
                </label>
                <input
                  id={`${titleId}-gate`}
                  type="text"
                  className="form-input"
                  autoComplete="off"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  disabled={busy}
                />
              </div>
            ) : null}

            <div className="modal-actions">
              <button type="button" className="btn-pill btn-pill-secondary" onClick={onCancel} disabled={busy}>
                {cancelLabel}
              </button>
              <button
                type="button"
                className={`${confirmBtnClass}${busy ? ' is-loading' : ''}`}
                onClick={onConfirm}
                disabled={busy || textGateFailed}
                aria-busy={busy}
              >
                {confirmLabel}
                <span aria-hidden="true" className="btn-pill-spinner" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </Portal>
  )
}
