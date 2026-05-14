/**
 * WorkspaceStack
 *
 * Renders all solving attempts as an accordion list.
 * Reads from the workspace store — fully reactive to state changes.
 *
 * Includes an "Add theory" button (Phase 2 functional — adds a blank attempt).
 * Attempt bodies are placeholders; Phase 3 fills in the interactive scratchpad.
 */

import { useWorkspaceStore, selectActiveWorkspace } from '../../store/workspaceStore'
import { AttemptCard } from './AttemptCard'
import './WorkspaceStack.css'

export function WorkspaceStack() {
  const attempts = useWorkspaceStore((s) => selectActiveWorkspace(s).attempts)
  const addAttempt = useWorkspaceStore((s) => s.addAttempt)

  return (
    <section className="workspace-stack" aria-label="Solving attempts">

      {attempts.map((attempt, index) => (
        <AttemptCard
          key={attempt.id}
          attempt={attempt}
          index={index}
        />
      ))}

      {/* Add theory button */}
      <button
        className="workspace-stack__add"
        onClick={addAttempt}
        aria-label="Add a new solving theory"
        type="button"
      >
        <span className="workspace-stack__add-icon" aria-hidden="true">+</span>
        Add theory
      </button>

    </section>
  )
}
