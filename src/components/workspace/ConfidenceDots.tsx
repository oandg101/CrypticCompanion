/**
 * ConfidenceDots
 *
 * Visual indicator of how confident the user is in an attempt.
 * 0 dots = no confidence, 3 dots = high confidence.
 *
 * Fully accessible: uses aria-label to describe the level to screen readers.
 */

import { cn } from '../../utils/cn'
import type { ConfidenceLevel } from '../../types'

const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  0: 'No confidence',
  1: 'Low confidence',
  2: 'Medium confidence',
  3: 'High confidence',
}

interface ConfidenceDotsProps {
  level: ConfidenceLevel
}

export function ConfidenceDots({ level }: ConfidenceDotsProps) {
  return (
    <div
      className="attempt__confidence"
      aria-label={CONFIDENCE_LABELS[level]}
      role="img"
    >
      {([1, 2, 3] as const).map((i) => (
        <span
          key={i}
          className={cn('conf-dot', i <= level && 'conf-dot--on')}
        />
      ))}
    </div>
  )
}
