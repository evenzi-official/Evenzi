'use client'

import Link from 'next/link'
import { useId, useRef, useState } from 'react'
import {
  SUPPORT_EMAIL,
  SUPPORT_HOURS,
  SUPPORT_MAILTO,
  SUPPORT_RESPONSE_HOURS,
} from '@/lib/constants/support'
import { OverlaySurface } from '@/components/ui/OverlaySurface'
import { Portal } from '@/components/ui/Portal'
import { TicketForm } from '@/components/help/TicketForm'

export type HelpContactBandProps = {
  signedIn: boolean
  defaultEmail?: string
  topicSlug?: string
  articleSlug?: string
  /** Auth redirect target for signed-out Sign in CTA. */
  nextPath?: string
}

export function HelpContactBand({
  signedIn,
  defaultEmail = '',
  topicSlug,
  articleSlug,
  nextPath = '/help',
}: HelpContactBandProps): React.ReactElement {
  const titleId = useId()
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  const [reference, setReference] = useState<string | null>(null)

  function close(): void {
    setOpen(false)
  }

  if (!signedIn) {
    return (
      <section id="help-contact-band" className="clay-card mt-12 p-6 md:p-8" aria-labelledby="help-contact-title">
        <h2 id="help-contact-title" className="m-0 text-xl font-semibold text-[var(--ink)]">
          Need to talk to someone?
        </h2>
        <p className="mt-2 mb-5 text-sm text-[var(--muted)] max-w-prose">
          Filing a support ticket needs an Evenzi account, so we know which events to look at.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/auth?next=${encodeURIComponent(nextPath)}`}
            className="btn-pill btn-pill-primary"
          >
            Sign in to contact support
          </Link>
          <a
            href={SUPPORT_MAILTO('Help Centre — support request')}
            className="btn-pill btn-pill-secondary"
          >
            Email {SUPPORT_EMAIL}
          </a>
        </div>
      </section>
    )
  }

  return (
    <section id="help-contact-band" className="clay-card mt-12 p-6 md:p-8" aria-labelledby="help-contact-title">
      <h2 id="help-contact-title" className="m-0 text-xl font-semibold text-[var(--ink)]">
        Still need help?
      </h2>
      <p className="mt-2 mb-5 text-sm text-[var(--muted)] max-w-prose">
        We reply within {SUPPORT_RESPONSE_HOURS} hours ({SUPPORT_HOURS}). Send us your question and
        we&apos;ll follow up by email.
      </p>
      <button
        ref={triggerRef}
        type="button"
        className="btn-pill btn-pill-primary btn-pill-lg"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setReference(null)
          setOpen(true)
        }}
      >
        Contact support
      </button>

      <Portal>
        <div
          className={`modal-scrim${open ? ' is-open' : ''}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <OverlaySurface
            open={open}
            onClose={close}
            modal
            labelledBy={titleId}
            id="help-contact-ticket"
            className="modal-card clay-card"
            triggerRef={triggerRef}
          >
            <header className="modal-head">
              <div className="modal-head-lead">
                <h2 className="modal-title" id={titleId} tabIndex={-1}>
                  Contact support
                </h2>
              </div>
              <button type="button" className="modal-close" aria-label="Close" onClick={close}>
                <span aria-hidden="true" className="material-symbols-outlined">
                  close
                </span>
              </button>
            </header>

            <div className="modal-body">
              {reference ? (
                <div role="status" className="flex flex-col gap-3">
                  <p className="m-0 text-sm text-[var(--ink)]">
                    Thanks — we got your message. Your reference is{' '}
                    <strong>{reference}</strong>.
                  </p>
                  <button type="button" className="btn-pill btn-pill-primary self-start" onClick={close}>
                    Done
                  </button>
                </div>
              ) : (
                <TicketForm
                  defaultEmail={defaultEmail}
                  topicSlug={topicSlug}
                  articleSlug={articleSlug}
                  onCancel={close}
                  onSuccess={(ref) => setReference(ref)}
                />
              )}
            </div>
          </OverlaySurface>
        </div>
      </Portal>
    </section>
  )
}
