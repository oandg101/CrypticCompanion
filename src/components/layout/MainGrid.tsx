/**
 * MainGrid
 *
 * The primary page layout. Two columns:
 *   Left  — CluePanel: sticky clue card and breakdown annotations
 *   Right — WorkspaceStack: the solving attempts (3+)
 *
 * On tablet (≤1024px): collapses to single column, CluePanel first.
 * On mobile (≤640px): tighter padding, same single-column flow.
 *
 * This component only handles layout. No business logic here.
 */

import { CluePanel } from '../clue/CluePanel'
import { WorkspaceStack } from '../workspace/WorkspaceStack'
import './MainGrid.css'

export function MainGrid() {
  return (
    <div className="main-grid">
      {/* Left rail — sticky, contains clue text and breakdown */}
      <CluePanel />

      {/* Right — scrollable stack of solving attempts */}
      <WorkspaceStack />
    </div>
  )
}
