'use client'

import { useId, useState, type FormEvent } from 'react'
import { SUPPORT_EMAIL, SUPPORT_MAILTO, SUPPORT_HOURS, SUPPORT_RESPONSE_HOURS } from '@/lib/constants/support'
import { useBusy } from '@/components/ui/BusyProvider'

export type TicketFormProps = {
  defaultEmail?: string
  topicSlug?: string
  articleSlug?: string
  pageUrl?: string
  onSuccess?: (reference: string, email: string) => void
  onCancel?: () => void
}

type SubmitState = 'idle' | 'submitting' | 'error'

const MESSAGE_MIN = 20
const MESSAGE_MAX = 2000

type FieldErrors = {
  email?: string
  message?: string
}

type TicketErrorBody = {
  reference?: string
  error?: string
  details?: {
    email?: string[]
    message?: string[]
  }
}

function friendlyMessageError(raw: string | undefined, length: number): string {
  if (length < MESSAGE_MIN) {
    const left = MESSAGE_MIN - length
    return `Please write at least ${MESSAGE_MIN} characters (${left} more to go).`
  }
  if (length > MESSAGE_MAX) {
    return `Please keep your message under ${MESSAGE_MAX} characters.`
  }
  if (raw?.toLowerCase().includes('required')) {
    return 'Please describe what you need help with.'
  }
  return raw ?? 'Please check your message and try again.'
}

function friendlyEmailError(raw: string | undefined): string {
  if (!raw) return 'Please enter a valid email address.'
  if (/email|invalid/i.test(raw)) return 'Please enter a valid email address.'
  return raw
}

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
  const { runBusy } = useBusy()
  const [email, setEmail] = useState(defaultEmail)
  const [message, setMessage] = useState('')
  const [state, setState] = useState<SubmitState>('idle')
  const [errorText, setErrorText] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [failCount, setFailCount] = useState(0)

  const trimmedMessage = message.trim()
  const messageLen = trimmedMessage.length

  function validateLocal(): FieldErrors {
    const next: FieldErrors = {}
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Please enter a valid email address.'
    }
    if (messageLen < MESSAGE_MIN) {
      next.message = friendlyMessageError(undefined, messageLen)
    } else if (messageLen > MESSAGE_MAX) {
      next.message = friendlyMessageError(undefined, messageLen)
    }
    return next
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setErrorText(null)

    const local = validateLocal()
    if (local.email || local.message) {
      setFieldErrors(local)
      setState('error')
      setErrorText('Please fix the highlighted fields and try again.')
      return
    }

    setFieldErrors({})
    setState('submitting')

    try {
      const res = await runBusy(() => fetch('/api/help/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          message,
          topicSlug,
          articleSlug,
          pageUrl: pageUrl ?? (typeof window !== 'undefined' ? window.location.href : undefined),
        }),
      }), 'Sending…')

      const data = (await res.json().catch(() => ({}))) as TicketErrorBody

      if (!res.ok || !data.reference) {
        const nextFails = failCount + 1
        setFailCount(nextFails)
        setState('error')

        const fromApi: FieldErrors = {}
        if (data.details?.email?.[0]) {
          fromApi.email = friendlyEmailError(data.details.email[0])
        }
        if (data.details?.message?.[0]) {
          fromApi.message = friendlyMessageError(data.details.message[0], messageLen)
        }
        setFieldErrors(fromApi)

        setErrorText(
          fromApi.email || fromApi.message
            ? 'Please fix the highlighted fields and try again.'
            : (data.error ??
                'Could not send that just now. Your message is still here — try again.')
        )
        return
      }

      setState('idle')
      setFieldErrors({})
      onSuccess?.(data.reference, email)
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
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? `${formId}-email-err` : undefined}
          value={email}
          onChange={(ev) => {
            setEmail(ev.target.value)
            if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }))
          }}
        />
        {fieldErrors.email ? (
          <p id={`${formId}-email-err`} className="form-error" role="alert">
            <span className="material-symbols-outlined" aria-hidden="true">
              error
            </span>
            {fieldErrors.email}
          </p>
        ) : null}
      </label>

      <label className="form-field">
        <span className="form-label">How can we help?</span>
        <textarea
          name="message"
          className="form-textarea"
          rows={5}
          required
          minLength={MESSAGE_MIN}
          maxLength={MESSAGE_MAX}
          aria-invalid={fieldErrors.message ? true : undefined}
          aria-describedby={`${formId}-message-hint${fieldErrors.message ? ` ${formId}-message-err` : ''}`}
          value={message}
          onChange={(ev) => {
            setMessage(ev.target.value)
            if (fieldErrors.message) setFieldErrors((f) => ({ ...f, message: undefined }))
          }}
          placeholder="Describe what you were trying to do and what went wrong."
        />
        <p id={`${formId}-message-hint`} className="form-helper m-0 mt-1">
          At least {MESSAGE_MIN} characters
          {messageLen > 0 ? ` · ${messageLen}/${MESSAGE_MAX}` : ''}
        </p>
        {fieldErrors.message ? (
          <p id={`${formId}-message-err`} className="form-error" role="alert">
            <span className="material-symbols-outlined" aria-hidden="true">
              error
            </span>
            {fieldErrors.message}
          </p>
        ) : null}
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
