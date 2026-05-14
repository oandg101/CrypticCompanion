/**
 * ClueBreakdown
 *
 * Shows when `breakdownVisible` is true in the preferences store.
 * Derives the def/ind/fod parts from the clue's word annotations.
 *
 * Words are annotated by clicking them in ClueText (Phase 3 feature).
 */

import { useWorkspaceStore, selectActiveWorkspace } from '../../store/workspaceStore'
import { usePreferencesStore } from '../../store/preferencesStore'
import { CluePartCard } from './CluePartCard'
import type { AnnotationType, ClueWord } from '../../types'

/** Collects all words with a given annotation into a single string */
function extractPart(words: ClueWord[], type: AnnotationType): string {
  return words
    .filter((w) => w.annotation === type)
    .map((w) => w.text.trim())
    .filter(Boolean)
    .join(' ')
}

/** Hint text for each part type — educational, never reveals answers */
const HINTS: Record<'def' | 'ind' | 'fod', string> = {
  def: 'The definition is usually at the start or end of the clue. It tells you what the answer means.',
  ind: 'The indicator signals how the wordplay works. Look for words suggesting rearrangement, concealment, or reversal.',
  fod: 'The fodder is the raw material the wordplay operates on. The indicator tells you what to do with it.',
}

export function ClueBreakdown() {
  const words = useWorkspaceStore((s) => selectActiveWorkspace(s).clue.words)
  const breakdownVisible = usePreferencesStore((s) => s.breakdownVisible)

  if (!breakdownVisible) return null

  const defText = extractPart(words, 'def')
  const indText = extractPart(words, 'ind')
  const fodText = extractPart(words, 'fod')

  const hasAnyAnnotation = defText || indText || fodText

  return (
    <div className="breakdown" aria-label="Clue breakdown">
      {/* Section label */}
      <div className="breakdown__header">
        <span className="breakdown__label">Breakdown</span>
      </div>

      {!hasAnyAnnotation ? (
        <p className="breakdown__empty">
          No parts annotated yet. Click words in the clue above to annotate them.
        </p>
      ) : (
        <>
          {defText && (
            <CluePartCard
              type="def"
              text={defText}
              descriptor=""
              hint={HINTS.def}
            />
          )}
          {indText && (
            <CluePartCard
              type="ind"
              text={indText}
              descriptor=""
              hint={HINTS.ind}
            />
          )}
          {fodText && (
            <CluePartCard
              type="fod"
              text={fodText}
              descriptor=""
              hint={HINTS.fod}
            />
          )}
        </>
      )}
    </div>
  )
}
