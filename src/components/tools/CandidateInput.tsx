/**
 * CandidateInput — Phase 6
 *
 * Phase 6 changes:
 *   - Semantic HTML: <ul>/<li> instead of <div role="list">/<span role="listitem">
 *   - Candidate starring: ★ button on each chip; starred candidate
 *     displays with green accent. Replaces the old hardcoded i===0 green.
 *   - Backspace on empty input removes last candidate (preserved)
 *
 * HOW STARRING WORKS:
 *   Each attempt has a `starredCandidate: string | null` field.
 *   Clicking ★ on an unstarred candidate stars it (and unstars any other).
 *   Clicking ★ on the starred candidate unstars it (sets to null).
 *   Removing a starred candidate automatically clears the star (store handles this).
 */

import { useState, useRef } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'

interface CandidateInputProps {
  attemptId: string
  candidates: string[]
  starredCandidate: string | null
}

export function CandidateInput({ attemptId, candidates, starredCandidate }: CandidateInputProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const addCandidate    = useWorkspaceStore((s) => s.addCandidate)
  const removeCandidate = useWorkspaceStore((s) => s.removeCandidate)
  const starCandidate   = useWorkspaceStore((s) => s.starCandidate)

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const word = inputValue.trim()
      if (word) {
        addCandidate(attemptId, word)
        setInputValue('')
      }
    }
    if (e.key === 'Backspace' && !inputValue && candidates.length > 0) {
      removeCandidate(attemptId, candidates[candidates.length - 1])
    }
  }

  function handleStarToggle(word: string) {
    // Star this word, or unstar if already starred
    starCandidate(attemptId, word === starredCandidate ? null : word)
  }

  return (
    <div className="candidate-section">
      {candidates.length > 0 && (
        <ul className="candidates" aria-label="Candidate words">
          {candidates.map((word) => {
            const isStarred = word === starredCandidate
            return (
              <li
                key={word}
                className={`candidate${isStarred ? ' candidate--starred' : ''}`}
              >
                {/* Star button — marks preferred candidate */}
                <button
                  type="button"
                  className="candidate__star"
                  onClick={() => handleStarToggle(word)}
                  aria-pressed={isStarred}
                  aria-label={isStarred
                    ? `${word} is your preferred candidate — click to unstar`
                    : `Star ${word} as preferred candidate`}
                  title={isStarred ? 'Unstar' : 'Star as preferred'}
                >
                  {isStarred ? '★' : '☆'}
                </button>

                {/* Word display */}
                <span className="candidate__word">{word}</span>

                {/* Remove button */}
                <button
                  type="button"
                  className="candidate__remove"
                  onClick={() => removeCandidate(attemptId, word)}
                  aria-label={`Remove candidate ${word}`}
                  title="Remove"
                >
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="candidate-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="candidate-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          placeholder="Type a candidate word, press Enter"
          aria-label="Add candidate word"
          maxLength={30}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
    </div>
  )
}
