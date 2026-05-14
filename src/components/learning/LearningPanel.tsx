/**
 * LearningPanel — Phase 5
 *
 * A collapsible clue-type reference guide shown in the left rail.
 * Aimed at beginners; hidden by default in expert mode (CSS + store).
 *
 * STRUCTURE:
 *   LearningPanel (outer collapsible panel)
 *     └── ClueTypeCard × 6 (each independently collapsible)
 *           ├── Header: type name + brief + expand arrow
 *           └── Body: indicators · how-to · example
 *
 * PERSISTENCE:
 *   Panel open/closed state → preferencesStore.learningPanelOpen
 *   Individual card open/closed → local useState (not worth persisting)
 *
 * CONTENT POLICY (NON-NEGOTIABLE):
 *   All examples show MECHANISM only — how a clue TYPE works.
 *   None of this content relates to the user's active clue.
 *   No answer is ever provided, validated, or implied.
 */

import { useState } from 'react'
import { usePreferencesStore } from '../../store/preferencesStore'
import './LearningPanel.css'

// ── Clue type reference data ──────────────────────────────────
//
// Each entry explains the MECHANISM of a clue type.
// Examples use classic, widely-published teaching clues —
// they are not connected to the user's active puzzle.

interface ClueTypeEntry {
  id: string
  label: string
  /** One-line summary shown in the collapsed header */
  brief: string
  /** 2–3 sentences explaining how to identify and use this type */
  how: string
  /** Common indicator words that signal this clue type */
  indicators: string[]
  example: {
    /** A well-known teaching clue for this type */
    clue: string
    /** Structural breakdown — mechanism, not answer revelation */
    breakdown: string
    /** Additional observation about this clue type */
    note: string
  }
}

const CLUE_TYPES: ClueTypeEntry[] = [
  {
    id: 'hidden-word',
    label: 'Hidden word',
    brief: 'Answer concealed within the text',
    how: 'The answer lies consecutively across the words, spanning boundaries. Scan letter-by-letter ignoring spaces. The word count tells you how many letters to find.',
    indicators: ['hidden in', 'within', 'inside', 'found in', 'some of', 'part of', 'in', 'contains'],
    example: {
      clue: '"River in BrAZIL Even now" — AZILE → AISLE? No: brAZILen',
      breakdown: 'Read across word boundaries: brAZIL = look inside "Brazil" → AZIL. Try: thereIS Land → ISLAND. The answer spans two words.',
      note: 'The enumeration (letter count) confirms exactly where the hidden word starts and ends.',
    },
  },
  {
    id: 'anagram',
    label: 'Anagram',
    brief: 'Rearranged letters form the answer',
    how: 'An indicator word signals disorder or transformation. The fodder provides the exact letters to rearrange. The enumeration confirms the letter count matches.',
    indicators: ['mixed', 'confused', 'wild', 'broken', 'upset', 'around', 'arranged', 'troubled', 'out', 'wrong', 'oddly', 'somehow'],
    example: {
      clue: '"Dirty rat (4)" — indicator: dirty · fodder: RAT + one more letter?',
      breakdown: '"Dirty" signals anagram. Rearrange the letters of the fodder: RATS → STAR → ARTS → TARS. Each is a valid anagram; the definition narrows which is correct.',
      note: 'The indicator never contributes letters — only the fodder does. Count carefully.',
    },
  },
  {
    id: 'charade',
    label: 'Charade',
    brief: 'Parts of the answer built up in sequence',
    how: 'Each piece of the clue independently contributes letters that join in order. There is no indicator — the clue just builds the answer part by part. The enumeration confirms the total.',
    indicators: ['with', 'after', 'before', 'following', 'then', 'and', 'next to', 'plus', '(often no indicator at all)'],
    example: {
      clue: '"Musical note follows road (5)"',
      breakdown: 'ROAD = ST · musical note = RE → STARE? Or: road = AVE · note = DO → AVEDO? Work from the enumeration back. Each part maps to a word or abbreviation.',
      note: 'Charades often use abbreviations (st = street, do/re/mi = musical notes, N/S/E/W = compass points).',
    },
  },
  {
    id: 'double-def',
    label: 'Double definition',
    brief: 'Two separate definitions of one word',
    how: 'The clue is two (or rarely three) separate definitions of the same answer, with nothing else. These clues tend to be very short. Find a word that satisfies both definitions simultaneously.',
    indicators: ['(usually no indicator — the whole clue is two definitions)', '(very short clues are often double definitions)'],
    example: {
      clue: '"Fair copy (4)"',
      breakdown: 'Fair → JUST (equitable) · Copy → JUST (exactly, as in "just so"). One word satisfies both: JUST.',
      note: 'The answer satisfies BOTH halves independently. If you can only make one half work, keep looking.',
    },
  },
  {
    id: 'reversal',
    label: 'Reversal',
    brief: 'Answer or component reads backwards',
    how: 'An indicator signals that part of the clue should be read in reverse. For across clues: "back", "returning", "going west". For down clues: "up", "rising", "ascending" are common.',
    indicators: ['back', 'returning', 'reversed', 'going west', 'reflected', 'up (down clues)', 'rising', 'recalled', 'retired'],
    example: {
      clue: '"Port coming back around (4)"',
      breakdown: '"Coming back" = reversal indicator. PORT reversed = TROP. Or: search for a 4-letter port that reverses to a common word. The definition is the other half.',
      note: 'Only the fodder reverses — never the definition. Isolate the indicator carefully.',
    },
  },
  {
    id: 'container',
    label: 'Container',
    brief: 'One element placed inside another',
    how: 'One component wraps around another to form the answer. The indicator says which is inside which — "A holding B" puts B inside A. The order of wrapping changes the result entirely.',
    indicators: ['holding', 'around', 'outside', 'containing', 'about', 'swallowing', 'embracing', 'in', 'inside', 'within', 'hosted by'],
    example: {
      clue: '"Tin containing gold is a pest (6)"',
      breakdown: 'TIN (can = CAN) · gold = OR · CAN containing OR → C(OR)AN = CORAN? Or: TIN = SN · gold = AU → SN(AU)? Think: CAN around OR = C-OR-AN. Check enumeration.',
      note: 'Identify which element is the container and which is the insertion. The indicator makes this explicit.',
    },
  },
]

// ── ClueTypeCard ──────────────────────────────────────────────

function ClueTypeCard({
  entry,
  isExpanded,
  onToggle,
}: {
  entry: ClueTypeEntry
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="ct-card" data-type={entry.id}>
      {/* ── Card toggle header ── */}
      <button
        type="button"
        className="ct-card__toggle"
        aria-expanded={isExpanded}
        onClick={onToggle}
      >
        <span className="ct-card__pip" aria-hidden="true" />
        <span className="ct-card__name">{entry.label}</span>
        <span className="ct-card__brief" aria-hidden="true">{entry.brief}</span>
        <svg
          className="ct-card__arrow"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 2l4 4-4 4" />
        </svg>
      </button>

      {/* ── Card body (expanded) ── */}
      {isExpanded && (
        <div className="ct-card__body">

          {/* How it works */}
          <div>
            <div className="ct-card__section-label">How it works</div>
            <p className="ct-card__how">{entry.how}</p>
          </div>

          {/* Indicators */}
          <div>
            <div className="ct-card__section-label">Look for</div>
            <div className="ct-card__indicators" aria-label="Common indicator words">
              {entry.indicators.map((word) => (
                <span key={word} className="ct-card__indicator">{word}</span>
              ))}
            </div>
          </div>

          {/* Example */}
          <div>
            <div className="ct-card__section-label">Example</div>
            <div className="ct-card__example">
              <p className="ct-card__ex-clue">"{entry.example.clue}"</p>
              <p className="ct-card__ex-breakdown">{entry.example.breakdown}</p>
              <p className="ct-card__ex-note">{entry.example.note}</p>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

// ── LearningPanel ─────────────────────────────────────────────

export function LearningPanel() {
  const learningPanelOpen = usePreferencesStore((s) => s.learningPanelOpen)
  const toggleLearningPanel = usePreferencesStore((s) => s.toggleLearningPanel)

  // Which clue type cards are individually expanded (local — not persisted)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  function toggleCard(id: string) {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <section
      className="learning-panel"
      aria-label="Clue type reference guide"
      // data-open used by density.css to allow expert users to force-show the panel
      data-open={String(learningPanelOpen)}
    >
      {/* ── Panel toggle header ── */}
      <button
        type="button"
        className="learning-panel__header"
        aria-expanded={learningPanelOpen}
        onClick={toggleLearningPanel}
      >
        <div className="learning-panel__title">
          <span className="learning-panel__label">Reference</span>
          <span className="learning-panel__badge" aria-label="Beginner guide">Guide</span>
        </div>
        <svg
          className="learning-panel__chevron"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M2 5l5 5 5-5" />
        </svg>
      </button>

      {/* ── Panel body ── */}
      {learningPanelOpen && (
        <div className="learning-panel__body">
          {CLUE_TYPES.map((entry) => (
            <ClueTypeCard
              key={entry.id}
              entry={entry}
              isExpanded={expandedCards.has(entry.id)}
              onToggle={() => toggleCard(entry.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
