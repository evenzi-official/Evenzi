'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { WizardProvider, useWizard } from '@/lib/contexts/WizardContext'
import { WizardProgress } from './components/WizardProgress'
import { Step1EventType } from './components/Step1EventType'
import Step2BasicDetails from './components/Step2BasicDetails'
import { Step3SubEvents } from './components/Step3SubEvents'
import { Step4ReviewConfirm } from './components/Step4ReviewConfirm'

// ---- Inner wizard content (needs useSearchParams, wrapped in Suspense) ----

function WizardContent(): React.JSX.Element {
  const { state, dispatch } = useWizard()
  const searchParams = useSearchParams()

  // Track last synced step to prevent loops
  const lastSyncedStep = useRef<number>(state.currentStep)

  // URL → state: only on initial mount (read step from URL if present)
  useEffect(() => {
    const stepParam = searchParams.get('step')
    if (stepParam) {
      const step = parseInt(stepParam, 10)
      if (!isNaN(step) && step >= 1 && step !== state.currentStep) {
        dispatch({ type: 'GO_TO_STEP', payload: step })
        lastSyncedStep.current = step
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // State → URL: use window.history.replaceState to avoid Next.js RSC refetch
  useEffect(() => {
    if (state.currentStep !== lastSyncedStep.current) {
      lastSyncedStep.current = state.currentStep
      const url = new URL(window.location.href)
      url.searchParams.set('step', String(state.currentStep))
      window.history.replaceState(null, '', url.toString())
    }
  }, [state.currentStep])

  // Render active step
  function renderStep(): React.JSX.Element {
    switch (state.currentStep) {
      case 1:
        return <Step1EventType />
      case 2:
        return <Step2BasicDetails />
      case 3:
        if (state.eventType?.hasSubEvents) {
          return <Step3SubEvents />
        }
        // No sub-events — step 3 is Review & Confirm
        return <Step4ReviewConfirm />
      case 4:
        return <Step4ReviewConfirm />
      default:
        return <Step1EventType />
    }
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header
        className="w-full border-b"
        style={{
          background: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center relative">
          <span
            className="text-xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Evenzi
          </span>
          <span
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              fontFamily: 'var(--font-manrope), sans-serif',
              fontSize: '14px',
              lineHeight: '20px',
              letterSpacing: '3.5px',
              color: 'var(--color-text-primary)',
            }}
          >
            CELEBRATORY CURATOR
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full">
        {/* Progress stepper — sits between header and step content */}
        <div
          style={{
            background: 'transparent',
            marginTop: '40px',
          }}
        >
          <WizardProgress />
        </div>
        {renderStep()}
      </main>

      {/* Footer */}
      <footer
        className="w-full border-t py-6"
        style={{
          background: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p
            className="text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            © 2026 Evenzi. All rights reserved.
          </p>
          <nav className="flex items-center gap-4">
            <a
              href="/privacy"
              className="text-sm hover:underline"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="text-sm hover:underline"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Terms
            </a>
            <a
              href="/help"
              className="text-sm hover:underline"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Help
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}

// ---- WizardShell — public page export ----

export default function CreateEventPage(): React.JSX.Element {
  return (
    <WizardProvider>
      <Suspense
        fallback={
          <div
            className="min-h-screen flex items-center justify-center"
            style={{ background: 'var(--color-bg-primary)' }}
          >
            <div style={{ color: 'var(--color-text-muted)' }}>Loading wizard…</div>
          </div>
        }
      >
        <WizardContent />
      </Suspense>
    </WizardProvider>
  )
}
