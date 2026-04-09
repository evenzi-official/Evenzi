'use client'

import { useWizard } from '@/lib/contexts/WizardContext'

const STEP_LABELS: Record<number, string> = {
  1: 'Event Type',
  2: 'Sub-Events',
  3: 'Basic Details',
  4: 'Review & Confirm',
}

function getStepLabel(step: number, totalSteps: number): string {
  if (totalSteps === 3) {
    // Without sub-events: step 3 is Review & Confirm
    if (step === 3) return 'Review & Confirm'
    return STEP_LABELS[step] ?? `Step ${step}`
  }
  return STEP_LABELS[step] ?? `Step ${step}`
}

export function WizardProgress(): React.JSX.Element {
  const { state } = useWizard()
  const { currentStep, totalSteps } = state

  const label = getStepLabel(currentStep, totalSteps)
  const progressPercent = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
      {/* Step label */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step {currentStep} of {totalSteps}: {label}
        </span>
        <span
          className="text-sm"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {progressPercent}%
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--color-border)' }}
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Step ${currentStep} of ${totalSteps}`}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-in-out"
          style={{
            width: `${progressPercent}%`,
            background: 'var(--color-text-primary)',
          }}
        />
      </div>
    </div>
  )
}
