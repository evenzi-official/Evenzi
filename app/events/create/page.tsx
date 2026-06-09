'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { WizardProvider, useWizard } from '@/lib/contexts/WizardContext'
import { WizardStepper } from '@/components/ui/WizardStepper'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Step1EventType } from './components/Step1EventType'
import Step2BasicDetails from './components/Step2BasicDetails'
import { Step3SubEvents } from './components/Step3SubEvents'
import { Step4ReviewConfirm } from './components/Step4ReviewConfirm'

const WIZARD_STEPS = [
  { label: 'Selection' },
  { label: 'Details' },
  { label: 'Celebrations' },
  { label: 'Review' },
]

function WizardContent(): React.JSX.Element {
  const { state, dispatch } = useWizard()
  const searchParams = useSearchParams()
  const lastSyncedStep = useRef<number>(state.currentStep)

  // URL → state: only on initial mount
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

  // State → URL: avoid Next.js RSC refetch
  useEffect(() => {
    if (state.currentStep !== lastSyncedStep.current) {
      lastSyncedStep.current = state.currentStep
      const url = new URL(window.location.href)
      url.searchParams.set('step', String(state.currentStep))
      window.history.replaceState(null, '', url.toString())
    }
  }, [state.currentStep])

  function renderStep(): React.JSX.Element {
    switch (state.currentStep) {
      case 1: return <Step1EventType />
      case 2: return <Step2BasicDetails />
      case 3:
        if (state.eventType?.hasSubEvents) return <Step3SubEvents />
        return <Step4ReviewConfirm />
      case 4: return <Step4ReviewConfirm />
      default: return <Step1EventType />
    }
  }

  return (
    <div className="page-bg page-shell">
      {/* Header */}
      <header className="page-shell-header">
        <a href="/home" className="page-logo" aria-label="Evenzi home">Evenzi</a>
        <span className="page-eyebrow" aria-hidden="true">Celebratory Curator</span>
        <div className="page-shell-actions">
          <ThemeToggle className="page-theme-toggle" />
          <a href="/home" className="page-close" aria-label="Close wizard and return to dashboard">
            <span aria-hidden="true" className="material-symbols-outlined">close</span>
            <span className="page-close-label">Exit</span>
          </a>
        </div>
      </header>

      {/* Step indicator */}
      <WizardStepper steps={WIZARD_STEPS} currentStep={state.currentStep} />

      {/* Step content */}
      <main className="page-main">
        {renderStep()}
      </main>

      {/* Footer */}
      <footer className="page-shell-footer">
        © 2026 Evenzi · Crafted with care
      </footer>
    </div>
  )
}

export default function CreateEventPage(): React.JSX.Element {
  return (
    <WizardProvider>
      <Suspense
        fallback={
          <div className="page-bg page-shell min-h-dvh flex items-center justify-center">
            <div style={{ color: 'var(--muted)' }}>Loading…</div>
          </div>
        }
      >
        <WizardContent />
      </Suspense>
    </WizardProvider>
  )
}
