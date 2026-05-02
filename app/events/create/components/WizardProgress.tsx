'use client'

import { useWizard } from '@/lib/contexts/WizardContext'

interface StepDef {
  label: string
}

const STEPS_4: StepDef[] = [
  { label: 'EVENT TYPE' },
  { label: 'DETAILS' },
  { label: 'SUB-EVENTS' },
  { label: 'REVIEW' },
]

const STEPS_3: StepDef[] = [
  { label: 'EVENT TYPE' },
  { label: 'DETAILS' },
  { label: 'REVIEW' },
]

export function WizardProgress(): React.JSX.Element {
  const { state } = useWizard()
  const { currentStep, totalSteps } = state
  const steps = totalSteps === 4 ? STEPS_4 : STEPS_3

  return (
    <nav aria-label="Event creation progress" style={{ width: '100%', padding: '16px 32px', display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep
          const isLast = index === steps.length - 1

          return (
            <div
              key={stepNumber}
              aria-current={isActive ? 'step' : undefined}
              style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
            >
              {/* Circle + Label group */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                {/* Step circle */}
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    minWidth: '34px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px',
                    lineHeight: 1,
                    userSelect: 'none',
                    transition: 'background 0.3s, box-shadow 0.3s',
                    background:
                      isActive || isCompleted ? 'var(--color-primary)' : '#EBEBEB',
                    color: isActive || isCompleted ? '#ffffff' : '#AAAAAA',
                    boxShadow: isActive
                      ? '0 0 0 4px rgba(180,0,40,0.12)'
                      : 'none',
                  }}
                >
                  {isCompleted ? (
                    <svg
                      width="13"
                      height="10"
                      viewBox="0 0 13 10"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M1.5 5L5 8.5L11.5 1.5"
                        stroke="white"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>

                {/* Step label — hidden on mobile via className */}
                <span
                  className="hidden sm:block"
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.12em',
                    whiteSpace: 'nowrap',
                    fontWeight: isActive ? 700 : 500,
                    transition: 'color 0.2s',
                    color: isActive
                      ? 'var(--color-primary)'
                      : isCompleted
                      ? '#777777'
                      : '#AAAAAA',
                  }}
                >
                  {`STEP ${stepNumber}: ${step.label}`}
                </span>
              </div>

              {/* Connector line between steps */}
              {!isLast && (
                <div
                  style={{
                    width: '80px',
                    height: '1px',
                    margin: '0 12px',
                    flexShrink: 0,
                    transition: 'background 0.3s',
                    background: isCompleted ? 'var(--color-primary)' : '#E0E0E0',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
