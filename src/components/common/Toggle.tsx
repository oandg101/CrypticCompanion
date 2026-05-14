/**
 * Toggle — pill-shaped toggle button
 *
 * Used in the topbar for theme, mode, and breakdown controls.
 * Follows the design from CrypticUIDesign.html exactly.
 *
 * Props:
 *   label    — visible button text
 *   value    — optional secondary text (e.g. "On" / "Off")
 *   pressed  — aria-pressed state (is this toggle "on"?)
 *   onClick  — click handler
 *   className— optional extra CSS classes
 */


import { cn } from '../../utils/cn'

interface ToggleProps {
  label: string
  value?: string
  pressed: boolean
  onClick: () => void
  className?: string
  /** Accessible description if the label alone isn't clear */
  'aria-label'?: string
}

export function Toggle({
  label,
  value,
  pressed,
  onClick,
  className,
  'aria-label': ariaLabel,
}: ToggleProps) {
  return (
    <button
      type="button"
      className={cn('toggle', className)}
      aria-pressed={pressed}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span className="toggle__dot" aria-hidden="true" />
      <span className="toggle__label">{label}</span>
      {value !== undefined && (
        <span className="toggle__value">{value}</span>
      )}
    </button>
  )
}
