/**
 * AttemptCard — Phase 6
 *
 * Phase 6 additions:
 *   - AttemptMetaEdit: inline title + strategy editing strip, shown
 *     when the attempt is expanded. Live-saves on change.
 *     Placed between the header and body to avoid nested-button issues.
 *   - aria-controls removed from toggle button (pointed to a
 *     conditionally-rendered element, which is invalid HTML).
 *     aria-expanded alone is sufficient and correct.
 */

import { useState } from 'react'
import { useWorkspaceStore, selectActiveWorkspace } from '../../store/workspaceStore'
import { ConfidenceDots } from './ConfidenceDots'
import { Toolbar } from '../tools/Toolbar'
import { Scratchpad } from '../tools/Scratchpad'
import type { AttemptState, ConfidenceLevel } from '../../types'

function formatAnswer(answer: string): string {
  return answer.toUpperCase().split('').join('\u2009')
}

// ── Header ────────────────────────────────────────────────────

function AttemptHeader({
  attempt,
  index,
  onToggle,
}: {
  attempt: AttemptState
  index: number
  onToggle: () => void
}) {
  const setConfidence = useWorkspaceStore((s) => s.setConfidence)
  const removeAttempt = useWorkspaceStore((s) => s.removeAttempt)
  const attemptCount  = useWorkspaceStore((s) => selectActiveWorkspace(s).attempts.length)
  const isActive      = !attempt.collapsed
  const padded        = String(index + 1).padStart(2, '0')

  function performDelete() {
    if (
      window.confirm(
        `Delete "${attempt.title}"?\n\nThis removes all notes, history, and working content. It cannot be undone.`
      )
    ) {
      removeAttempt(attempt.id)
    }
  }

  return (
    <div className="attempt__head">
      {/* Expand/collapse — aria-controls omitted (body is conditional in DOM) */}
      <button
        type="button"
        className="attempt__toggle"
        onClick={onToggle}
        aria-expanded={isActive}
      >
        <span className="attempt__num" aria-hidden="true">{padded}</span>
        <div className="attempt__title-block">
          <span className="attempt__title">{attempt.title}</span>
          <span className="attempt__strategy">{attempt.strategy}</span>
        </div>
        {attempt.workingAnswer ? (
          <span className="attempt__guess" aria-label={`Working answer: ${attempt.workingAnswer}`}>
            {formatAnswer(attempt.workingAnswer)}
          </span>
        ) : (
          <span className="attempt__guess attempt__guess--empty" aria-label="No working answer yet">
            no answer yet
          </span>
        )}
        <span className="attempt__caret" aria-hidden="true">▾</span>
      </button>

      <button
        type="button"
        className="attempt__conf-btn"
        onClick={() => {
          const next = ((attempt.confidence + 1) % 4) as ConfidenceLevel
          setConfidence(attempt.id, next)
        }}
        aria-label={`Confidence: ${attempt.confidence}/3 — click to increase`}
        title="Click to cycle confidence level"
      >
        <ConfidenceDots level={attempt.confidence} />
      </button>

      {attemptCount > 1 && (
        <button
          type="button"
          className="attempt__delete"
          onClick={performDelete}
          aria-label={`Delete theory: ${attempt.title}`}
          title="Delete this theory"
        >
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 4h10M5 4V2h4v2M5.5 7v4M8.5 7v4M3 4l1 8h6l1-8" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ── Meta edit strip ───────────────────────────────────────────
//
// Shown when the attempt is expanded. Two plain text inputs for
// title and strategy. Live-saves on change — no save button.
//
// WHY here and not in the header:
//   The header uses a <button> for expand/collapse. Putting inputs
//   inside a <button> is invalid HTML. This strip sits outside the
//   button, between header and body.

function AttemptMetaEdit({ attempt }: { attempt: AttemptState }) {
  const updateAttemptTitle    = useWorkspaceStore((s) => s.updateAttemptTitle)
  const updateAttemptStrategy = useWorkspaceStore((s) => s.updateAttemptStrategy)

  return (
    <div className="attempt__meta-edit" aria-label="Edit theory title and strategy">
      <input
        type="text"
        className="attempt__meta-input attempt__meta-input--title"
        value={attempt.title}
        onChange={(e) => updateAttemptTitle(attempt.id, e.target.value)}
        placeholder="Theory title"
        aria-label="Theory title"
        maxLength={60}
        autoComplete="off"
      />
      <input
        type="text"
        className="attempt__meta-input attempt__meta-input--strategy"
        value={attempt.strategy}
        onChange={(e) => updateAttemptStrategy(attempt.id, e.target.value)}
        placeholder="Describe your approach"
        aria-label="Theory strategy or approach"
        maxLength={120}
        autoComplete="off"
      />
    </div>
  )
}

// ── Collapsed preview ─────────────────────────────────────────

function CollapsedPreview({ attempt }: { attempt: AttemptState }) {
  const preview =
    attempt.candidates.length > 0
      ? `Candidates: ${attempt.candidates.join(' · ')}`
      : attempt.scanText
      ? attempt.scanText
      : attempt.notes
      ? attempt.notes.split('\n')[0]
      : attempt.strategy

  return (
    <div className="collapsed-preview" aria-hidden="true">
      {preview}
    </div>
  )
}

// ── Util sidebar ──────────────────────────────────────────────

function UtilSidebar({ attempt }: { attempt: AttemptState }) {
  const [newEntry, setNewEntry]  = useState('')
  const updateAttemptNotes       = useWorkspaceStore((s) => s.updateAttemptNotes)
  const addHistoryEntry          = useWorkspaceStore((s) => s.addHistoryEntry)
  const removeHistoryEntry       = useWorkspaceStore((s) => s.removeHistoryEntry)

  function handleAddEntry(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const entry = newEntry.trim()
      if (entry) {
        addHistoryEntry(attempt.id, entry)
        setNewEntry('')
      }
    }
  }

  return (
    <aside className="util" aria-label="Notes and history">
      <div className="util__section">
        <div className="util__label">Notes</div>
        <textarea
          className="util__notes util__notes--editable"
          value={attempt.notes}
          onChange={(e) => updateAttemptNotes(attempt.id, e.target.value)}
          placeholder="Add notes for this theory…"
          aria-label="Attempt notes"
          rows={4}
        />
      </div>

      <div className="util__section">
        <div className="util__label">History</div>
        {attempt.history.length > 0 && (
          <div className="util__history">
            {attempt.history.map((entry, i) => (
              <span key={i} className="util__history-entry">
                <span className="util__history-text">{entry}</span>
                <button
                  type="button"
                  className="util__history-remove"
                  onClick={() => removeHistoryEntry(attempt.id, i)}
                  aria-label={`Remove history entry: ${entry}`}
                >×</button>
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          className="util__history-input"
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          onKeyDown={handleAddEntry}
          placeholder="Log a step (Enter to add)"
          aria-label="Add history entry"
        />
      </div>
    </aside>
  )
}

// ── Main component ────────────────────────────────────────────

interface AttemptCardProps {
  attempt: AttemptState
  index: number
}

export function AttemptCard({ attempt, index }: AttemptCardProps) {
  const setActiveAttempt    = useWorkspaceStore((s) => s.setActiveAttempt)
  const setAttemptCollapsed = useWorkspaceStore((s) => s.setAttemptCollapsed)
  const isActive = !attempt.collapsed

  function handleToggle() {
    if (isActive) {
      setAttemptCollapsed(attempt.id, true)
    } else {
      setActiveAttempt(attempt.id)
    }
  }

  return (
    <article
      className="attempt"
      data-state={isActive ? 'active' : 'collapsed'}
      data-attempt={index + 1}
    >
      <AttemptHeader attempt={attempt} index={index} onToggle={handleToggle} />

      {/* Meta edit strip — only when expanded, sits above the body */}
      {isActive && <AttemptMetaEdit attempt={attempt} />}

      {!isActive && <CollapsedPreview attempt={attempt} />}

      {isActive && (
        <div
          className="attempt__body"
          role="region"
          aria-label={`${attempt.title} workspace`}
        >
          <div className="work">
            <Toolbar attemptId={attempt.id} activeMode={attempt.toolMode} />
            <Scratchpad attempt={attempt} />
          </div>
          <UtilSidebar attempt={attempt} />
        </div>
      )}
    </article>
  )
}
