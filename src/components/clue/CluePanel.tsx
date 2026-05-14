/**
 * CluePanel
 *
 * The sticky left rail. Composes:
 *   - ClueCard     (clue text with annotations)
 *   - ClueBreakdown (breakdown analysis, collapsible via topbar toggle)
 *
 * This component owns no state — it only assembles children.
 * It is sticky on desktop, static on tablet/mobile (handled by CSS).
 */

import { ClueCard } from './ClueCard'
import { ClueBreakdown } from './ClueBreakdown'
import { LearningPanel } from '../learning/LearningPanel'
import './CluePanel.css'

export function CluePanel() {
  return (
    <aside className="clue-panel" aria-label="Clue and breakdown">
      <ClueCard />
      <ClueBreakdown />
      <LearningPanel />
    </aside>
  )
}
