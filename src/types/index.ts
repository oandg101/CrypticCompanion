/* ============================================================
   Cryptic Companion — Core Type Definitions
   Phase 6: removed TileState.placed (dead field, never toggled),
            added AttemptState.starredCandidate
   ============================================================ */

// ── Clue annotation ──────────────────────────────────────────

export type AnnotationType = 'def' | 'ind' | 'fod' | 'none'

export interface ClueWord {
  text: string
  annotation: AnnotationType
}

export interface ClueAnnotation {
  id: string
  rawText: string
  enumeration: string
  words: ClueWord[]
  notes: string
  reference?: string
}

// ── Letter tiles ──────────────────────────────────────────────

export interface TileState {
  id: string
  letter: string
  /** Locked tiles are confirmed — visually distinct (green) */
  locked: boolean
  /**
   * Original position in the source text (0-indexed).
   * Set once by buildTiles and never changed.
   * Used by resetTileOrder to restore source-text order.
   */
  position: number
}

// ── Solving attempt ───────────────────────────────────────────

export type ToolMode =
  | 'none'
  | 'hidden-word'
  | 'anagram'
  | 'charade'
  | 'pattern'
  | 'synonyms'

export type ConfidenceLevel = 0 | 1 | 2 | 3

export interface AttemptState {
  id: string
  title: string
  strategy: string
  /**
   * Working answer — user-typed, NEVER validated.
   * May contain '_' for uncertain positions.
   */
  workingAnswer: string
  confidence: ConfidenceLevel
  toolMode: ToolMode
  tiles: TileState[]
  /** Source text for the current tool (e.g. fodder letters for anagram) */
  sourceText: string
  /** User's scan observation — what they spotted in the source */
  scanText: string
  notes: string
  history: string[]
  candidates: string[]
  /**
   * The candidate the user has starred as their preferred answer.
   * null = none starred. Cleared automatically if the starred word is removed.
   */
  starredCandidate: string | null
  collapsed: boolean
}

// ── Workspace ─────────────────────────────────────────────────

export interface WorkspaceState {
  /** Stable unique identifier — used as tab key and for active-workspace tracking */
  id: string
  clue: ClueAnnotation
  attempts: AttemptState[]
}

// ── Preferences ───────────────────────────────────────────────

export type Theme = 'light' | 'dark'
export type DensityMode = 'beginner' | 'expert'
export type FontSize = 'normal' | 'large'

export interface PreferencesState {
  theme: Theme
  mode: DensityMode
  breakdownVisible: boolean
  reducedMotion: boolean
  monochromeMode: boolean
  learningPanelOpen: boolean
  fontSize: FontSize
}
