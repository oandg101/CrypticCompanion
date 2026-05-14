/**
 * Toolbar — Phase 6
 *
 * Phase 6: Keyboard shortcuts for tool switching.
 *
 * SHORTCUTS (when focus is NOT in a text input):
 *   H → Hidden word
 *   A → Anagram
 *   C → Charade
 *   P → Pattern
 *   S → Synonyms
 *   Pressing the active tool's key deactivates it (back to 'none').
 *
 * WHY document-level listener (not a keydown on the toolbar):
 *   The toolbar is not always focused. Shortcuts need to work
 *   whenever the user is reading the clue or reviewing annotations —
 *   not just when the toolbar has focus.
 *
 *   Guard: shortcuts are suppressed when an INPUT, TEXTAREA, or SELECT
 *   is focused (user is typing), and when any modifier key is held.
 *
 * WHY only one Toolbar registers at a time:
 *   setActiveAttempt() collapses all other attempts, so only one
 *   Toolbar is ever mounted. No risk of conflicting listeners.
 */

import { useEffect } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import type { ToolMode } from '../../types'
import './Toolbar.css'

// ── SVG icons ─────────────────────────────────────────────────

const Icons = {
  HiddenWord: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M3 6h18M3 12h18M3 18h12" />
    </svg>
  ),
  Pattern: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  ),
  Anagram: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M4 4h16v16H4z" /><path d="M4 10h16M10 4v16" />
    </svg>
  ),
  Charade: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
  Synonyms: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Reset: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" />
    </svg>
  ),
}

// ── Tool definitions ──────────────────────────────────────────

const TOOLS: { mode: ToolMode; label: string; shortcut: string; Icon: () => JSX.Element }[] = [
  { mode: 'hidden-word', label: 'Hidden word', shortcut: 'H', Icon: Icons.HiddenWord },
  { mode: 'pattern',     label: 'Pattern',     shortcut: 'P', Icon: Icons.Pattern    },
  { mode: 'anagram',     label: 'Anagram',     shortcut: 'A', Icon: Icons.Anagram    },
  { mode: 'charade',     label: 'Charade',     shortcut: 'C', Icon: Icons.Charade    },
  { mode: 'synonyms',    label: 'Synonyms',    shortcut: 'S', Icon: Icons.Synonyms   },
]

// Map from key → ToolMode for the listener
const SHORTCUT_MAP: Record<string, ToolMode> = Object.fromEntries(
  TOOLS.map(({ mode, shortcut }) => [shortcut.toLowerCase(), mode])
)

// ── Component ─────────────────────────────────────────────────

interface ToolbarProps {
  attemptId: string
  activeMode: ToolMode
}

export function Toolbar({ attemptId, activeMode }: ToolbarProps) {
  const setToolMode           = useWorkspaceStore((s) => s.setToolMode)
  const resetAttemptWorkspace = useWorkspaceStore((s) => s.resetAttemptWorkspace)

  // ── Keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't fire when modifier keys are held (browser shortcuts)
      if (e.metaKey || e.ctrlKey || e.altKey) return

      // Don't fire when focus is in a text field (user is typing)
      const tag = (e.target as Element).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const mode = SHORTCUT_MAP[e.key.toLowerCase()]
      if (!mode) return

      e.preventDefault()
      // Toggle: pressing the active tool's key deactivates it
      setToolMode(attemptId, activeMode === mode ? 'none' : mode)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [attemptId, activeMode, setToolMode])

  function handleReset() {
    if (window.confirm('Clear source, scan, tiles, and candidates? Notes are kept.')) {
      resetAttemptWorkspace(attemptId)
    }
  }

  return (
    <div className="tools" role="toolbar" aria-label="Solving tools">
      {TOOLS.map(({ mode, label, shortcut, Icon }) => (
        <button
          key={mode}
          type="button"
          className="tool-btn"
          aria-pressed={activeMode === mode}
          onClick={() => setToolMode(attemptId, activeMode === mode ? 'none' : mode)}
          title={`${label} (${shortcut})`}
          aria-label={`${label} — keyboard shortcut: ${shortcut}`}
        >
          <Icon />
          {label}
        </button>
      ))}

      <span className="tool-divider" aria-hidden="true" />

      <button
        type="button"
        className="tool-btn tool-btn--reset"
        onClick={handleReset}
        title="Clear workspace (keeps notes)"
        aria-label="Reset workspace — clears source, tiles, and candidates"
      >
        <Icons.Reset />
        Reset
      </button>
    </div>
  )
}
