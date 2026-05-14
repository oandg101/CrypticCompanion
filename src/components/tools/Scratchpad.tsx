/**
 * Scratchpad — Phase 5
 *
 * Phase 5 addition: BeginnerTip — a small contextual hint card
 * shown at the top of each tool view when mode === 'beginner'.
 * In expert mode, BeginnerTip renders nothing (no DOM overhead).
 *
 * Tips explain HOW to use the tool — they do not reference the
 * active clue and never suggest or validate answers.
 */

import { useWorkspaceStore } from '../../store/workspaceStore'
import { usePreferencesStore } from '../../store/preferencesStore'
import { WorkLine } from './WorkLine'
import { TileRack } from './TileRack'
import { CandidateInput } from './CandidateInput'
import type { AttemptState } from '../../types'
import './Scratchpad.css'

// ── Null-safe field accessors ─────────────────────────────────
// Protect against stale localStorage missing new fields (Phase 3 fix)
const safeSource = (a: AttemptState): string => a.sourceText ?? ''
const safeScan   = (a: AttemptState): string => a.scanText   ?? ''

// ── BeginnerTip ───────────────────────────────────────────────
//
// Receives mode as a prop (read once by the parent Scratchpad component)
// rather than subscribing to the store itself. This keeps subscriptions
// to a single point and makes the component easier to test.

function BeginnerTip({ mode, children }: { mode: string; children: React.ReactNode }) {
  if (mode !== 'beginner') return null

  return (
    <div className="beginner-tip" role="note" aria-label="Tip for beginners">
      <svg
        className="beginner-tip__icon"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="6" />
        <path d="M8 7v4M8 5.5v.5" />
      </svg>
      <span className="beginner-tip__text">{children}</span>
    </div>
  )
}

// ── Source highlighting helper ────────────────────────────────

interface Segment { text: string; highlighted: boolean }

function highlightSource(source: string, needle: string): Segment[] {
  if (!needle.trim() || !source) {
    return [{ text: source, highlighted: false }]
  }
  const idx = source.toLowerCase().indexOf(needle.toLowerCase())
  if (idx === -1) return [{ text: source, highlighted: false }]
  return [
    { text: source.slice(0, idx), highlighted: false },
    { text: source.slice(idx, idx + needle.length), highlighted: true },
    { text: source.slice(idx + needle.length), highlighted: false },
  ]
}

// ── SourceDisplay ─────────────────────────────────────────────

function SourceDisplay({ source, highlight }: { source: string; highlight: string }) {
  const segments = highlightSource(source, highlight)
  return (
    <p className="source-string">
      {segments.map((seg, i) =>
        seg.highlighted
          ? <mark key={i}>{seg.text}</mark>
          : <span key={i}>{seg.text}</span>
      )}
    </p>
  )
}

// ── Shared inputs ─────────────────────────────────────────────

function SourceInput({ attemptId, value }: { attemptId: string; value: string }) {
  const setAttemptSource = useWorkspaceStore((s) => s.setAttemptSource)
  return (
    <input
      type="text"
      className="scratchpad-input"
      value={value}
      onChange={(e) => setAttemptSource(attemptId, e.target.value)}
      placeholder="Type or paste the fodder / source text"
      aria-label="Source text"
      autoComplete="off"
      spellCheck={false}
    />
  )
}

function ScanInput({
  attemptId,
  value,
  placeholder,
}: {
  attemptId: string
  value: string
  placeholder?: string
}) {
  const setAttemptScan = useWorkspaceStore((s) => s.setAttemptScan)
  return (
    <input
      type="text"
      className="scratchpad-input"
      value={value}
      onChange={(e) => setAttemptScan(attemptId, e.target.value)}
      placeholder={placeholder ?? 'What did you find?'}
      aria-label="Scan observation"
      autoComplete="off"
      spellCheck={false}
    />
  )
}

function WorkingAnswerInput({ attemptId, value }: { attemptId: string; value: string }) {
  const updateWorkingAnswer = useWorkspaceStore((s) => s.updateWorkingAnswer)
  return (
    <input
      type="text"
      className="scratchpad-input working-answer-input"
      value={value}
      onChange={(e) => updateWorkingAnswer(attemptId, e.target.value.toUpperCase())}
      placeholder="WORKING ANSWER"
      aria-label="Working answer — not validated"
      autoComplete="off"
      spellCheck={false}
      maxLength={30}
    />
  )
}

// ── Tool-specific views ───────────────────────────────────────

function HiddenWordView({ attempt, mode }: { attempt: AttemptState; mode: string }) {
  const source  = safeSource(attempt)
  const scan    = safeScan(attempt)
  const hasScan   = Boolean(scan.trim())
  const hasSource = Boolean(source.trim())

  return (
    <>
      <BeginnerTip mode={mode}>
        Type the fodder section into Source — the letters to scan across.
        Then type what you spotted hidden in Scan to highlight it.
        Tiles show each individual letter for closer inspection.
      </BeginnerTip>

      <WorkLine label="Source">
        <SourceInput attemptId={attempt.id} value={source} />
      </WorkLine>

      {hasSource && (
        <WorkLine label="Display">
          <SourceDisplay source={source} highlight={scan} />
        </WorkLine>
      )}

      <WorkLine label="Scan">
        <ScanInput
          attemptId={attempt.id}
          value={scan}
          placeholder="Type what you found hidden in the source"
        />
      </WorkLine>

      <WorkLine label="Tiles">
        <TileRack attemptId={attempt.id} tiles={attempt.tiles} />
      </WorkLine>

      {hasScan && (
        <WorkLine label="Found">
          <span className="work-line__pill" aria-live="polite">
            {scan.toUpperCase()}
          </span>
        </WorkLine>
      )}
    </>
  )
}

function AnagramView({ attempt, mode }: { attempt: AttemptState; mode: string }) {
  const source = safeSource(attempt)
  const scan   = safeScan(attempt)

  return (
    <>
      <BeginnerTip mode={mode}>
        Enter the fodder letters in the Letters field — they appear as tiles.
        Click tiles to rearrange them. Use Shuffle to spark new arrangements.
        Copy your best arrangement into the working answer with the Copy button.
      </BeginnerTip>

      <WorkLine label="Letters">
        <SourceInput attemptId={attempt.id} value={source} />
      </WorkLine>

      <WorkLine label="Tiles">
        <TileRack attemptId={attempt.id} tiles={attempt.tiles} />
      </WorkLine>

      <WorkLine label="Note">
        <ScanInput
          attemptId={attempt.id}
          value={scan}
          placeholder="Observations about the anagram"
        />
      </WorkLine>
    </>
  )
}

function CharadeView({ attempt, mode }: { attempt: AttemptState; mode: string }) {
  const source = safeSource(attempt)
  const scan   = safeScan(attempt)

  return (
    <>
      <BeginnerTip mode={mode}>
        Enter the component parts in Parts (e.g. abbreviations, short words).
        Note how they join together in Combined. The tiles help verify
        the letter count and order of the assembled answer.
      </BeginnerTip>

      <WorkLine label="Parts">
        <SourceInput attemptId={attempt.id} value={source} />
      </WorkLine>

      <WorkLine label="Combined">
        <ScanInput
          attemptId={attempt.id}
          value={scan}
          placeholder="How the parts combine (e.g. SE + NE + CA)"
        />
      </WorkLine>

      <WorkLine label="Tiles">
        <TileRack attemptId={attempt.id} tiles={attempt.tiles} />
      </WorkLine>
    </>
  )
}

function PatternView({ attempt, mode }: { attempt: AttemptState; mode: string }) {
  const source = safeSource(attempt)
  const scan   = safeScan(attempt)

  return (
    <>
      <BeginnerTip mode={mode}>
        Enter the letter pattern you know in Pattern — use _ for unknown
        positions (e.g. S_NE_A for a 6-letter word). Add any other
        constraints or cross-checked letters in Notes.
      </BeginnerTip>

      <WorkLine label="Pattern">
        <SourceInput attemptId={attempt.id} value={source} />
      </WorkLine>

      <WorkLine label="Notes">
        <ScanInput
          attemptId={attempt.id}
          value={scan}
          placeholder="Pattern constraints (e.g. S_NE_A)"
        />
      </WorkLine>
    </>
  )
}

function SynonymsView({ attempt, mode }: { attempt: AttemptState; mode: string }) {
  const source = safeSource(attempt)
  const scan   = safeScan(attempt)

  return (
    <>
      <BeginnerTip mode={mode}>
        Type the definition word or phrase in Define. Explore synonyms,
        related concepts, and word associations in Ideas. The definition
        is usually at the start or end of the clue.
      </BeginnerTip>

      <WorkLine label="Define">
        <SourceInput attemptId={attempt.id} value={source} />
      </WorkLine>

      <WorkLine label="Ideas">
        <ScanInput
          attemptId={attempt.id}
          value={scan}
          placeholder="Synonyms or related words you're exploring"
        />
      </WorkLine>
    </>
  )
}

function EmptyView({ mode }: { mode: string }) {
  return (
    <div className="scratchpad-empty">
      <p className="scratchpad-empty__prompt">
        Select a tool above to begin working.
      </p>
      {mode === 'beginner' ? (
        <span className="scratchpad-empty__hint">
          Not sure which tool to use? Check the Reference guide in the left panel.
        </span>
      ) : (
        <span className="scratchpad-empty__hint">
          Hidden word · Anagram · Charade · Pattern · Synonyms
        </span>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

interface ScratchpadProps {
  attempt: AttemptState
}

export function Scratchpad({ attempt }: ScratchpadProps) {
  const mode = usePreferencesStore((s) => s.mode)

  return (
    <div className="scratchpad">
      {attempt.toolMode === 'hidden-word' && <HiddenWordView attempt={attempt} mode={mode} />}
      {attempt.toolMode === 'anagram'     && <AnagramView   attempt={attempt} mode={mode} />}
      {attempt.toolMode === 'charade'     && <CharadeView   attempt={attempt} mode={mode} />}
      {attempt.toolMode === 'pattern'     && <PatternView   attempt={attempt} mode={mode} />}
      {attempt.toolMode === 'synonyms'    && <SynonymsView  attempt={attempt} mode={mode} />}
      {attempt.toolMode === 'none'        && <EmptyView mode={mode} />}

      <hr className="scratchpad-divider" />

      <WorkLine label="Answer">
        <WorkingAnswerInput
          attemptId={attempt.id}
          value={attempt.workingAnswer}
        />
      </WorkLine>

      <WorkLine label="Candidates">
        <CandidateInput
          attemptId={attempt.id}
          candidates={attempt.candidates}
          starredCandidate={attempt.starredCandidate ?? null}
        />
      </WorkLine>
    </div>
  )
}
