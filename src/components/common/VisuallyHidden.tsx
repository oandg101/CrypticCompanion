/**
 * VisuallyHidden
 *
 * Renders content that is invisible on screen but read by screen readers.
 * Use this whenever an interactive element (button, icon, etc.) needs
 * a text label that would be visually redundant but is required for
 * accessibility.
 *
 * Example:
 *   <button onClick={toggleTheme}>
 *     <SunIcon />
 *     <VisuallyHidden>Switch to dark mode</VisuallyHidden>
 *   </button>
 */

import { type ReactNode, type JSX } from 'react'

interface VisuallyHiddenProps {
  children: ReactNode
  /** HTML element to render. Defaults to 'span' (inline). Use 'p' for block context. */
  as?: keyof JSX.IntrinsicElements
}

export function VisuallyHidden({
  children,
  as: Tag = 'span',
}: VisuallyHiddenProps) {
  return <Tag className="sr-only">{children}</Tag>
}
