/**
 * SessionControls — Phase 7b
 *
 * Two compact icon buttons in the Topbar for session management:
 *   ↓  Export — downloads all open workspaces as a .json file
 *   ↑  Import — opens a file picker and loads workspaces from a .json file
 *
 * STATUS MESSAGES:
 *   A brief inline message appears after each action and clears after 3 s.
 *   Success messages are green; errors are amber (non-blocking warnings).
 *   No modals, no interruptions.
 *
 * IMPORT BEHAVIOUR:
 *   Imported workspaces are ADDED to the current session — existing
 *   workspaces are not replaced. The app switches to the first imported
 *   workspace. Maximum 6 workspaces total; import is rejected if adding
 *   the file's workspaces would exceed this with a clear explanation.
 *
 * EXPORT BEHAVIOUR:
 *   All open workspaces are serialised and downloaded as:
 *     cryptic-session-YYYY-MM-DD.json  (multiple workspaces)
 *     cryptic-{ref}-YYYY-MM-DD.json    (single workspace with reference)
 *   The file can be re-imported on any device or browser.
 */

import { useRef, useState, useEffect } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { downloadSession, parseSessionFile } from '../../utils/session'
import './SessionControls.css'

const MAX_WORKSPACES = 6
const STATUS_DURATION_MS = 4000

interface Status {
  type: 'success' | 'error'
  message: string
}

export function SessionControls() {
  const workspaces      = useWorkspaceStore((s) => s.workspaces)
  const importWorkspaces = useWorkspaceStore((s) => s.importWorkspaces)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-clear status after STATUS_DURATION_MS
  function showStatus(next: Status) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setStatus(next)
    timerRef.current = setTimeout(() => setStatus(null), STATUS_DURATION_MS)
  }

  // Cleanup on unmount
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  // ── Export ──────────────────────────────────────────────────

  function handleExport() {
    try {
      downloadSession(workspaces)
      const count = workspaces.length
      showStatus({
        type: 'success',
        message: `${count} workspace${count !== 1 ? 's' : ''} exported`,
      })
    } catch (err) {
      showStatus({ type: 'error', message: 'Export failed — please try again.' })
      console.error('[SessionControls] export error:', err)
    }
  }

  // ── Import ──────────────────────────────────────────────────

  function handleImportClick() {
    // Reset the input value so re-selecting the same file triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = ''
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Check capacity before reading file
    const room = MAX_WORKSPACES - workspaces.length
    if (room <= 0) {
      showStatus({
        type: 'error',
        message: `Cannot import — you already have ${MAX_WORKSPACES} workspaces open. Close one first.`,
      })
      return
    }

    let parsed
    try {
      const text = await file.text()
      parsed = parseSessionFile(text)
    } catch (err) {
      showStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Could not read file.',
      })
      return
    }

    // Warn but continue if the file has more workspaces than we have room for
    const willImport = parsed.slice(0, room)
    const skipped    = parsed.length - willImport.length

    importWorkspaces(willImport)

    const imported = willImport.length
    const skippedNote = skipped > 0
      ? ` (${skipped} skipped — workspace limit reached)`
      : ''

    showStatus({
      type: 'success',
      message: `${imported} workspace${imported !== 1 ? 's' : ''} imported${skippedNote}`,
    })
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="session-controls" aria-label="Session management">
      {/* Export button */}
      <button
        type="button"
        className="session-btn"
        onClick={handleExport}
        aria-label={`Export all ${workspaces.length} workspace${workspaces.length !== 1 ? 's' : ''} to a file`}
        title="Export session to file"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 2v8M5 7l3 3 3-3" />
          <path d="M3 12h10" />
        </svg>
        <span className="session-btn__label">Export</span>
      </button>

      {/* Import button */}
      <button
        type="button"
        className="session-btn"
        onClick={handleImportClick}
        aria-label="Import workspaces from a file"
        title="Import session from file"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 10V2M5 5l3-3 3 3" />
          <path d="M3 12h10" />
        </svg>
        <span className="session-btn__label">Import</span>
      </button>

      {/* Hidden file input — triggered programmatically */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        aria-hidden="true"
        tabIndex={-1}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Inline status message — auto-clears */}
      {status && (
        <p
          className={`session-status session-status--${status.type}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {status.message}
        </p>
      )}
    </div>
  )
}
