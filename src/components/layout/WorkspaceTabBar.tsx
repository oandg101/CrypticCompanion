/**
 * WorkspaceTabBar — Phase 7a
 *
 * A horizontal strip of tabs — one per open workspace — sitting
 * between the Topbar and the main content area. Both sticky.
 *
 * LAYOUT:
 *   [14 Across (6) ×] [23 Down (5) ×] [New clue ×] [+ New clue]
 *
 * Each tab shows:
 *   - Clue reference (e.g. "14 Across") or "New clue" if blank
 *   - Enumeration (e.g. "(6)") in muted text
 *   - A × close button (hidden when only one workspace is open)
 *
 * The + button adds a new workspace (max 6).
 *
 * CLOSE BEHAVIOUR:
 *   - Empty workspaces (blank clue) close without confirmation.
 *   - Workspaces with content confirm before closing.
 *   - Closing the active workspace switches to the first remaining.
 *
 * KEYBOARD:
 *   Tab/Shift-Tab between tabs.
 *   Enter/Space activates the hovered tab.
 *   The × close button is a separate focus stop within each tab group.
 */

import { useWorkspaceStore, isWorkspaceEmpty } from '../../store/workspaceStore'
import './WorkspaceTabBar.css'

export function WorkspaceTabBar() {
  const workspaces      = useWorkspaceStore((s) => s.workspaces)
  const activeId        = useWorkspaceStore((s) => s.activeWorkspaceId)
  const addWorkspace    = useWorkspaceStore((s) => s.addWorkspace)
  const switchWorkspace = useWorkspaceStore((s) => s.switchWorkspace)
  const closeWorkspace  = useWorkspaceStore((s) => s.closeWorkspace)

  function handleClose(e: React.MouseEvent, wsId: string) {
    e.stopPropagation()
    const ws = workspaces.find((w) => w.id === wsId)
    if (!ws) return
    if (
      !isWorkspaceEmpty(ws) &&
      !window.confirm(
        `Close "${ws.clue.reference || 'this clue'}"?\n\nAll notes and theories for this clue will be lost.`
      )
    ) return
    closeWorkspace(wsId)
  }

  const canAdd = workspaces.length < 6

  return (
    <nav className="ws-tabbar" aria-label="Open clue workspaces">
      {workspaces.map((ws) => {
        const isActive  = ws.id === activeId
        const label     = ws.clue.reference || 'New clue'
        const hasEnum   = Boolean(ws.clue.enumeration)
        const isEmpty   = isWorkspaceEmpty(ws)

        return (
          <div
            key={ws.id}
            className={`ws-tab${isActive ? ' ws-tab--active' : ''}${isEmpty ? ' ws-tab--empty' : ''}`}
          >
            {/* Switch button — the main clickable area */}
            <button
              type="button"
              className="ws-tab__btn"
              onClick={() => switchWorkspace(ws.id)}
              aria-current={isActive ? 'true' : undefined}
              aria-label={`Switch to ${label}${hasEnum ? ' ' + ws.clue.enumeration : ''}`}
            >
              <span className="ws-tab__ref">{label}</span>
              {hasEnum && (
                <span className="ws-tab__enum" aria-hidden="true">
                  {ws.clue.enumeration}
                </span>
              )}
            </button>

            {/* Close button — hidden when only one workspace */}
            {workspaces.length > 1 && (
              <button
                type="button"
                className="ws-tab__close"
                onClick={(e) => handleClose(e, ws.id)}
                aria-label={`Close ${label} workspace`}
                title={`Close ${label}`}
              >
                <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M2 2l6 6M8 2l-6 6" />
                </svg>
              </button>
            )}
          </div>
        )
      })}

      {/* Add new workspace button */}
      {canAdd && (
        <button
          type="button"
          className="ws-add-btn"
          onClick={addWorkspace}
          aria-label="Open a new clue workspace"
          title="New clue workspace"
        >
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M7 2v10M2 7h10" />
          </svg>
          <span>New clue</span>
        </button>
      )}
    </nav>
  )
}
