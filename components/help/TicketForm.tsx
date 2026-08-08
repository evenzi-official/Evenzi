'use client'

import { useId, useState, type FormEvent } from 'react'
import { SUPPORT_EMAIL, SUPPORT_MAILTO, SUPPORT_HOURS, SUPPORT_RESPONSE_HOURS } from '@/lib/constants/support'

export type TicketFormProps = {
  defaultEmail?: string
  topicSlug?: string
  articleSlug?: string
  pageUrl?: string
  onSuccess?: (reference: string) => void
  onCancel?: () => void
}

type SubmitState = 'idle' | 'submitting' | 'error'

/**
 * Shared ticket escalation form — used by the Help panel (A7) and /help contact band.
 * Submit stays enabled; failures keep field values and offer a mailto fallback on 2nd fail.
 */
export function TicketForm({
  defaultEmail = '',
  topicSlug,
  articleSlug,
  pageUrl,
  onSuccess,
  onCancel,
}: TicketFormProps): React.ReactElement {
  const formId = useId()
  const [email, setEmail] = useState(defaultEmail)
  const [message, setMessage] = useState('')
  const [state, setState] = useState<SubmitState>('idle')
  const [errorText, setErrorText] = useState<string | null>(null)
  const [failCount, setFailCount] = useState(0)

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setState('submitting')
    setErrorText(null)

    try {
      const res = await fetch('/api/help/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          message,
          topicSlug,
          articleSlug,
          pageUrl: pageUrl ?? (typeof window !== 'undefined' ? window.location.href : undefined),
        }),
      })

      const data = (await res.json().catch(() => ({}))) as {
        reference?: string
        error?: string
      }

      if (!res.ok || !data.reference) {
        const nextFails = failCount + 1
        setFailCount(nextFails)
        setState('error')
        setErrorText(
          data.error ?? 'Could not send that just now. Your message is still here — try again.'
        )
        return
      }

      setState('idle')
      onSuccess?.(data.reference)
    } catch {
      const nextFails = failCount + 1
      setFailCount(nextFails)
      setState('error')
      setErrorText('Could not send that just now. Your message is still here — try again.')
    }
  }

  const mailtoFallback =
    failCount >= 2
      ? SUPPORT_MAILTO('Help Centre — support request', message || undefined)
      : null

  return (
    <form id={formId} className="help-ticket-form flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <p className="text-sm text-[var(--muted)] m-0">
        We usually reply within {SUPPORT_RESPONSE_HOURS} hours ({SUPPORT_HOURS}).
      </p>

      {errorText ? (
        <div className="alert-banner alert-banner--error" role="alert">
          <p className="m-0">{errorText}</p>
          {mailtoFallback ? (
            <p className="m-0 mt-2">
              <a href={mailtoFallback} className="underline">
                Email {SUPPORT_EMAIL} instead
              </a>
            </p>
          ) : null}
        </div>
      ) : null}

      <label className="form-field">
        <span className="form-label">Email</span>
        <input
          type="email"
          name="email"
          className="form-input"
          autoComplete="email"
          required
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
        />
      </label>

      <label className="form-field">
        <span className="form-label">How can we help?</span>
        <textarea
          name="message"
          className="form-textarea"
          rows={5}
          required
          minLength={20}
          maxLength={2000}
          value={message}
          onChange={(ev) => setMessage(ev.target.value)}
          placeholder="Describe what you were trying to do and what went wrong."
        />
      </label>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="submit"
          className={`btn-pill btn-pill-primary${state === 'submitting' ? ' is-loading' : ''}`}
        >
          {state === 'submitting' ? 'Sending…' : 'Send message'}
        </button>
        {onCancel ? (
          <button type="button" className="btn-pill btn-pill-ghost" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}
