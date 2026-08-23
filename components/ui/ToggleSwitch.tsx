'use client'
import { ReactElement, useState } from 'react'

interface ToggleSwitchProps {
  /** Stable id — applied to the switch button (also used for label association). */
  id: string
  /** Optional visible label rendered after the switch. */
  label?: string
  /** Controlled on-state. When provided, the component is controlled. */
  checked?: boolean
  /** Uncontrolled initial on-state. Ignored when `checked` is provided. */
  defaultChecked?: boolean
  /** Fired with the next on-state when the switch is toggled. */
  onChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  /** Accessible name when no visible `label` is rendered (e.g. a sibling caption). */
  ariaLabel?: string
}

/**
 * Shell-composed toggle. Renders the canonical `.toggle-switch` primitive
 * (see designs/shared/shell.css ~1247 / components.html B8):
 *   <button class="toggle-switch" role="switch" aria-checked><span class="toggle-switch-thumb"/></button>
 * The on-state visuals are driven entirely by `aria-checked="true"`, which the
 * shell selectors target — no invented classes.
 */
export function ToggleSwitch({
  id,
  label,
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  className = '',
  ariaLabel,
}: ToggleSwitchProps): ReactElement {
  const isControlled = checked !== undefined
  const [internalOn, setInternalOn] = useState(defaultChecked)
  const on = isControlled ? checked : internalOn

  const toggle = (): void => {
    const next = !on
    if (!isControlled) setInternalOn(next)
    onChange?.(next)
  }

  const button = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={on}
      aria-labelledby={label ? `${id}-label` : undefined}
      aria-label={!label ? ariaLabel : undefined}
      disabled={disabled}
      onClick={toggle}
      className={`toggle-switch ${className}`.trim()}
    >
      <span className="toggle-switch-thumb" aria-hidden="true" />
    </button>
  )

  if (!label) return button

  return (
    <span className="toggle-switch-row">
      {button}
      <span id={`${id}-label`} className="toggle-switch-label">
        {label}
      </span>
    </span>
  )
}
