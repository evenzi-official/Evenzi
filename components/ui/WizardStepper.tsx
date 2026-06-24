import { Fragment } from 'react'

interface Step {
  label: string
}

interface WizardStepperProps {
  steps: Step[]
  currentStep: number
}

export function WizardStepper({ steps, currentStep }: WizardStepperProps) {
  return (
    <div className="flex justify-center w-full max-w-[760px] mx-auto px-5 pt-2 pb-4">
      <ol className="cw-stepper" aria-label="Wizard progress">
        {steps.map((step, i) => {
          const num = i + 1
          const isActive = num === currentStep
          const isDone = num < currentStep
          return (
            <Fragment key={num}>
              {i > 0 && (
                <li
                  className={`cw-step-connector${isDone ? ' is-done' : ''}`}
                  aria-hidden="true"
                />
              )}
              <li
                className={`cw-step${isActive ? ' is-active' : ''}${isDone ? ' is-done' : ''}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <span className="cw-step-num">
                  {isDone ? (
                    <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>check</span>
                  ) : num}
                </span>
                <span className="cw-step-label">{step.label}</span>
              </li>
            </Fragment>
          )
        })}
      </ol>
    </div>
  )
}
