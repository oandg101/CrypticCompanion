/**
 * ClueCard — Phase 5.1 / 5.2
 *
 * Two modes: display and edit.
 *
 * DISPLAY MODE (default):
 *   Clue number badge, reference, annotated text, word count,
 *   enumeration. A pencil button in the eyebrow row enters edit mode.
 *
 * EDIT MODE:
 *   Inline form: Reference · Clue textarea · Enumeration input.
 *   Escape cancels. Save is disabled while clue textarea is empty.
 *
 * ANNOTATION BEHAVIOUR ON SAVE:
 *   If the clue text changed → word annotations are cleared and the
 *   store re-tokenises the new text. If only reference/enumeration
 *   changed → annotations are preserved.
 */

import { useState, useRef, useEffect } from 'react'
import { useWorkspaceStore, selectActiveWorkspace } from '../../store/workspaceStore'
import { ClueText } from './ClueText'

// ── Helpers ───────────────────────────────────────────────────

function parseLetterCount(enumeration: string): number {
  const digits = enumeration.match(/\d+/g)
  if (!digits) return 0
  return digits.reduce((sum, n) => sum + parseInt(n, 10), 0)
}

function extractClueNumber(reference: string | undefined): string {
  if (!reference) return '?'
  const match = reference.match(/^\d+/)
  return match ? match[0] : '?'
}

function countWords(rawText: string): number {
  return rawText.replace(/\s*\(\d[\d,\-]*\)\s*$/, '').split(/\s+/).filter(Boolean).length
}

// ── Edit form ─────────────────────────────────────────────────

interface EditFormProps {
  initialRef: string
  initialText: string
  initialEnum: string
  onSave: (ref: string, text: string, enumeration: string) => void
  onCancel: () => void
}

function EditForm({ initialRef, initialText, initialEnum, onSave, onCancel }: EditFormProps) {
  const [ref, setRef]       = useState(initialRef)
  const [text, setText]     = useState(initialText)
  const [enumVal, setEnum]  = useState(initialEnum)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
    textareaRef.current?.select()
  }, [])

  // Derive warning directly — no need for a callback prop
  const willResetAnnotations = text.trim() !== initialText.trim()

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const trimmedText = text.trim()
    if (!trimmedText) return
    onSave(ref.trim(), trimmedText, enumVal.trim())
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onCancel()
  }

  return (
    <form className="clue-edit-form" onSubmit={handleSave} onKeyDown={handleKeyDown} aria-label="Edit clue">

      <div className="clue-edit-form__row">
        <label className="clue-edit-form__label" htmlFor="clue-ref">Reference</label>
        <input
          id="clue-ref"
          type="text"
          className="clue-edit-form__input"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="e.g. 14 Across"
          autoComplete="off"
        />
      </div>

      <div className="clue-edit-form__row">
        <label className="clue-edit-form__label" htmlFor="clue-text-input">Clue</label>
        <textarea
          id="clue-text-input"
          ref={textareaRef}
          className="clue-edit-form__textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="The full clue text"
          rows={3}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="clue-edit-form__row">
        <label className="clue-edit-form__label" htmlFor="clue-enum">Letters</label>
        <input
          id="clue-enum"
          type="text"
          className="clue-edit-form__input clue-edit-form__input--enum"
          value={enumVal}
          onChange={(e) => setEnum(e.target.value)}
          placeholder="(6)"
          autoComplete="off"
        />
      </div>

      {willResetAnnotations && (
        <p className="clue-edit-form__warning" role="alert">
          Changing the clue text will clear all word annotations.
        </p>
      )}

      <div className="clue-edit-form__actions">
        <button type="button" className="clue-edit-form__btn clue-edit-form__btn--cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="clue-edit-form__btn clue-edit-form__btn--save" disabled={!text.trim()}>
          Save clue
        </button>
      </div>

    </form>
  )
}

// ── Main component ────────────────────────────────────────────

export function ClueCard() {
  const clue       = useWorkspaceStore((s) => selectActiveWorkspace(s).clue)
  const updateClue = useWorkspaceStore((s) => s.updateClue)
  const [isEditing, setIsEditing] = useState(false)

  const clueNumber       = extractClueNumber(clue.reference)
  const letterCount      = parseLetterCount(clue.enumeration)
  const wordCount        = countWords(clue.rawText)
  const referenceDisplay = clue.reference?.toLowerCase() ?? 'unknown'

  function handleSave(ref: string, text: string, enumeration: string) {
    updateClue(ref, text, enumeration)
    setIsEditing(false)
  }

  return (
    <div className="clue-card" role="region" aria-label="Current clue">

      {isEditing ? (
        <EditForm
          initialRef={clue.reference ?? ''}
          initialText={clue.rawText}
          initialEnum={clue.enumeration}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <>
          <div className="clue__eyebrow">
            <span className="clue__num" aria-hidden="true">{clueNumber}</span>
            <span>
              {referenceDisplay}
              {letterCount > 0 && ` · ${letterCount} letter${letterCount !== 1 ? 's' : ''}`}
            </span>

            <button
              type="button"
              className="clue__edit-btn"
              onClick={() => setIsEditing(true)}
              aria-label="Edit this clue"
              title="Edit clue text, reference and enumeration"
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 2l2 2-7 7H3v-2l7-7z" />
                <path d="M9 3l2 2" />
              </svg>
              Edit
            </button>
          </div>

          <ClueText />

          <div className="clue__meta">
            <span>{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
            <span className="clue__enum" aria-label={`Enumeration: ${clue.enumeration}`}>
              {clue.enumeration}
            </span>
          </div>
        </>
      )}

    </div>
  )
}
