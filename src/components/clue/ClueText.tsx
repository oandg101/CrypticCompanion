/**
 * ClueText
 *
 * Phase 3: Words are now clickable.
 * Click any word to cycle its annotation: none → def → ind → fod → none
 *
 * The annotation cycle is deliberate and consistent so users develop
 * muscle memory: you always press once for definition, twice for indicator.
 *
 * Keyboard: Tab to focus a word, Enter or Space to cycle annotation.
 * Screen readers: each word announces its current annotation state.
 *
 * Space tokens are not annotatable (no role, no tab stop).
 */

import { useWorkspaceStore, selectActiveWorkspace } from '../../store/workspaceStore'
import { cn } from '../../utils/cn'
import type { AnnotationType, ClueWord } from '../../types'

// Annotation cycle: each click advances to the next state
const CYCLE: Record<AnnotationType, AnnotationType> = {
  none: 'def',
  def:  'ind',
  ind:  'fod',
  fod:  'none',
}

const ANNOTATION_CLASS: Record<AnnotationType, string> = {
  def:  'def-span',
  ind:  'ind-span',
  fod:  'fod-span',
  none: '',
}

const ANNOTATION_LABEL: Record<AnnotationType, string> = {
  none: 'unannotated',
  def:  'definition',
  ind:  'indicator',
  fod:  'fodder',
}

// ── Single annotatable word ───────────────────────────────────

function AnnotatableWord({
  word,
  index,
  onAnnotate,
}: {
  word: ClueWord
  index: number
  onAnnotate: (index: number, next: AnnotationType) => void
}) {
  const cls = ANNOTATION_CLASS[word.annotation]
  const next = CYCLE[word.annotation]
  const label = `"${word.text}" — ${ANNOTATION_LABEL[word.annotation]}. Click to mark as ${ANNOTATION_LABEL[next]}.`

  function handleClick() {
    onAnnotate(index, next)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onAnnotate(index, next)
    }
  }

  return (
    <span
      className={cn('clue-word', cls)}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      title={`Click to cycle annotation (currently: ${ANNOTATION_LABEL[word.annotation]})`}
    >
      {word.text}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────

export function ClueText() {
  const words = useWorkspaceStore((s) => selectActiveWorkspace(s).clue.words)
  const setWordAnnotation = useWorkspaceStore((s) => s.setWordAnnotation)

  return (
    <p className="clue__text" id="clue-text">
      {words.map((word, i) => {
        // Space tokens: render as plain text, not interactive
        if (!word.text.trim()) {
          return <span key={i} aria-hidden="true">{word.text}</span>
        }
        return (
          <AnnotatableWord
            key={i}
            word={word}
            index={i}
            onAnnotate={setWordAnnotation}
          />
        )
      })}
    </p>
  )
}
