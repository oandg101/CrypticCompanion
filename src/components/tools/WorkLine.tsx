/**
 * WorkLine
 *
 * A horizontal row with a muted label on the left and content on the right.
 * The main structural element of the scratchpad.
 *
 * Example:
 *   <WorkLine label="Source">
 *     <input ... />
 *   </WorkLine>
 */

import { type ReactNode } from 'react'

interface WorkLineProps {
  label: string
  children: ReactNode
  /** Additional CSS classes on the outer wrapper */
  className?: string
}

export function WorkLine({ label, children, className }: WorkLineProps) {
  return (
    <div className={`work-line${className ? ` ${className}` : ''}`}>
      <span className="work-line__label">{label}</span>
      <div className="work-line__content">{children}</div>
    </div>
  )
}
