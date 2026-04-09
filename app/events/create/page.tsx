'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { WizardProvider, useWizard } from '@/lib/contexts/WizardContext'
import { WizardProgress } from './components/WizardProgress'
import { Step1EventType } from './components/Step1EventType'
import Step2BasicDetails from './components/Step2BasicDetails'
import Step3SubEvents from './components/Step3SubEvents'

// ---- Inner wizard content (needs useSearchParams, wrapped in Suspense) ----

function WizardContent(): React.JSX.Element {
  const { state, dispatch } = useWizard()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Track last step we synced FROM the URL so we don't loop
  const lastUrlStep = useRef<number | null>(null)

  // Effect 1: URL → state (on mount and when URL changes)
  useEffect(() => {
    const stepParam = searchParams.get('step')
    const urlStep = stepParam ? parseInt(stepParam, 10) : 1
    if (
      !isNaN(urlStep) &&
      urlStep >= 1 &&
      urlStep !== state.currentStep &&
      urlStep !== lastUrlStep.current
    ) {
      lastUrlStep.current = urlStep
      dispatch({ type: 'GO_TO_STEP', payload: urlStep })
    }
  }, [searchParams, dispatch, state.currentStep])

  // Effect 2: state → URL (when state.currentStep changes)
  useEffect(() => {
    if (lastUrlStep.current === state.currentStep) {
      // This change originated from the URL — skip to avoid loop
      lastUrlStep.current = null
      return
    }
    const params = new URLSearchParams(searchParams.toString())
    params.set('step', String(state.currentStep))
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [state.currentStep, router, searchParams])

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
        // If no sub-events, step 3 is Review (handled by totalSteps logic)
        return (
          <div className="py-24 text-center" style={{ color: 'var(--color-text-muted)' }}>
            Review &amp; Confirm — coming in Task 10
          </div>
        )
      case 4:
        return (
          <div className="py-24 text-center" style={{ color: 'var(--color-text-muted)' }}>
            Review &amp; Confirm — coming in Task 10
          </div>
        )
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
          <span
            className="text-xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Evenzi
          </span>
        </div>

        {/* Progress bar — below logo row */}
        <WizardProgress />
      </header>

      {/* Main content */}
      <main className="flex-1 w-full">
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
