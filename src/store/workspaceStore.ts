/**
 * workspaceStore — Phase 7a: Multi-workspace architecture
 *
 * SHAPE CHANGE:
 *   Before: { workspace: WorkspaceState }
 *   After:  { workspaces: WorkspaceState[], activeWorkspaceId: string }
 *
 * Each WorkspaceState is an independent clue + attempts.
 * The active workspace is the one currently displayed.
 * All existing actions operate on the active workspace only.
 *
 * NEW ACTIONS:
 *   addWorkspace    — creates a blank workspace and switches to it
 *   switchWorkspace — changes the active workspace
 *   closeWorkspace  — removes a workspace (guarded: min 1 remains)
 *
 * MIGRATION:
 *   localStorage key is kept as 'cryptic:workspace' (unchanged).
 *   The merge function detects the old single-workspace format
 *   ({ workspace: WorkspaceState }) and promotes it to the array
 *   format automatically — users keep all their work.
 *
 * HELPERS:
 *   selectActiveWorkspace(state) — returns the active WorkspaceState.
 *   Export and use in components instead of state.workspace.
 *
 *   patchActiveClue(state, patch) — returns updated workspaces array
 *   with the active workspace's clue patched.
 *
 *   patchActiveAttempt(state, attemptId, patch) — returns updated
 *   workspaces array with a specific attempt patched.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  WorkspaceState,
  AttemptState,
  AnnotationType,
  TileState,
  ToolMode,
  ConfidenceLevel,
  ClueAnnotation,
} from '../types'

// ── Attempt field defaults ────────────────────────────────────
// Single source of truth. Add new fields here for future phases.

const ATTEMPT_DEFAULTS: Omit<AttemptState, 'id'> = {
  title: 'Theory',
  strategy: '',
  workingAnswer: '',
  confidence: 0,
  toolMode: 'none',
  sourceText: '',
  scanText: '',
  tiles: [],
  notes: '',
  history: [],
  candidates: [],
  starredCandidate: null,
  collapsed: true,
}

// ── Workspace factory ─────────────────────────────────────────

/** Creates a blank workspace with one empty attempt */
function createBlankWorkspace(): WorkspaceState {
  const id = `ws-${Date.now()}`
  return {
    id,
    clue: {
      id: `clue-${Date.now()}`,
      reference: '',
      rawText: '',
      enumeration: '',
      notes: '',
      words: [],
    },
    attempts: [{
      ...ATTEMPT_DEFAULTS,
      id: `attempt-${Date.now()}`,
      title: 'Theory 1',
      strategy: '',
      collapsed: false,
    }],
  }
}

/** A workspace is considered empty if the clue has no text yet */
export function isWorkspaceEmpty(ws: WorkspaceState): boolean {
  return !ws.clue.rawText.trim()
}

// ── Default initial state ─────────────────────────────────────
// Shown on first visit (no localStorage data).

const INITIAL_WS_ID = 'workspace-initial'

const DEFAULT_WORKSPACES: WorkspaceState[] = [
  {
    id: INITIAL_WS_ID,
    clue: {
      id: 'demo-clue-1',
      reference: '14 Across',
      rawText: "Philosopher hidden in crypt and tomb's end (6)",
      enumeration: '(6)',
      notes: '',
      words: [
        { text: 'Philosopher', annotation: 'def' },
        { text: ' ',           annotation: 'none' },
        { text: 'hidden in',  annotation: 'ind' },
        { text: ' ',           annotation: 'none' },
        { text: 'crypt',       annotation: 'fod' },
        { text: ' ',           annotation: 'none' },
        { text: 'and',         annotation: 'fod' },
        { text: ' ',           annotation: 'none' },
        { text: "tomb's end",  annotation: 'fod' },
      ],
    },
    attempts: [
      {
        id: 'attempt-1',
        title: 'Hidden-word read',
        strategy: 'Following the "hidden in" indicator across the fodder',
        workingAnswer: '',
        confidence: 3,
        toolMode: 'hidden-word',
        sourceText: "crypt and tomb's end",
        scanText: '',
        tiles: [],
        notes: "Hidden-word fits the indicator and enumeration matches.\nCross-check: 23d ends in -A. ✓",
        history: ['tried CHRYSIPPUS — too long', 'tried ZENO — too short'],
        candidates: [],
        starredCandidate: null,
        collapsed: false,
      },
      {
        id: 'attempt-2',
        title: 'Anagram approach',
        strategy: 'If "hidden" were instead an anagram indicator',
        workingAnswer: '',
        confidence: 1,
        toolMode: 'anagram',
        sourceText: '',
        scanText: '',
        tiles: [],
        notes: '',
        history: [],
        candidates: [],
        starredCandidate: null,
        collapsed: true,
      },
      {
        id: 'attempt-3',
        title: 'Charade — letter parts',
        strategy: 'Building the answer from successive pieces',
        workingAnswer: 'SE___A',
        confidence: 2,
        toolMode: 'charade',
        sourceText: '',
        scanText: '',
        tiles: [],
        notes: '',
        history: [],
        candidates: [],
        starredCandidate: null,
        collapsed: true,
      },
    ],
  },
]

// ── Clue tokeniser ────────────────────────────────────────────

function tokenizeClue(text: string): ClueAnnotation['words'] {
  return text
    .split(/(\s+)/)
    .filter((s) => s.length > 0)
    .map((s) => ({ text: s, annotation: 'none' as AnnotationType }))
}

// ── Tile builder ──────────────────────────────────────────────

function buildTiles(text: string, existingTiles: TileState[]): TileState[] {
  const letters = text.toUpperCase().replace(/[^A-Z]/g, '')
  return letters.split('').map((letter, i) => {
    const existing = existingTiles.find((t) => t.position === i)
    return {
      id: `tile-${i}-${letter}`,
      letter,
      locked: existing?.letter === letter ? (existing.locked ?? false) : false,
      position: i,
    }
  })
}

// ── Store interface ───────────────────────────────────────────

interface WorkspaceStoreState {
  workspaces: WorkspaceState[]
  activeWorkspaceId: string

  // Workspace lifecycle
  addWorkspace: () => void
  switchWorkspace: (id: string) => void
  closeWorkspace: (id: string) => void

  // Clue actions (operate on active workspace)
  setClueNotes: (notes: string) => void
  setWordAnnotation: (wordIndex: number, annotation: AnnotationType) => void
  updateClue: (reference: string, rawText: string, enumeration: string) => void

  // Attempt lifecycle (operate on active workspace)
  setAttemptCollapsed: (id: string, collapsed: boolean) => void
  setActiveAttempt: (id: string) => void
  addAttempt: () => void
  removeAttempt: (id: string) => void

  // Attempt content
  updateAttemptTitle: (id: string, title: string) => void
  updateAttemptStrategy: (id: string, strategy: string) => void
  updateWorkingAnswer: (id: string, answer: string) => void
  setConfidence: (id: string, level: ConfidenceLevel) => void
  setToolMode: (id: string, mode: ToolMode) => void

  // Source / scan
  setAttemptSource: (id: string, text: string) => void
  setAttemptScan: (id: string, text: string) => void

  // Tiles
  toggleTileLock: (attemptId: string, tileId: string) => void
  reorderTiles: (attemptId: string, fromIndex: number, toIndex: number) => void
  shuffleTiles: (attemptId: string) => void
  resetTileOrder: (attemptId: string) => void

  // Notes & history
  updateAttemptNotes: (id: string, notes: string) => void
  addHistoryEntry: (id: string, entry: string) => void
  removeHistoryEntry: (id: string, index: number) => void

  // Candidates
  addCandidate: (id: string, word: string) => void
  removeCandidate: (id: string, word: string) => void
  starCandidate: (id: string, word: string | null) => void

  // Reset
  resetAttemptWorkspace: (id: string) => void
  resetWorkspace: () => void

  // Import
  /**
   * Add imported workspaces to the current session.
   * Re-generates IDs to avoid collisions with existing workspaces.
   * Applies ATTEMPT_DEFAULTS to fill any missing fields.
   * Switches to the first successfully imported workspace.
   */
  importWorkspaces: (incoming: WorkspaceState[]) => void
}

// ── Pure helpers ──────────────────────────────────────────────

/**
 * Returns the active WorkspaceState.
 * Falls back to the first workspace if activeWorkspaceId is stale.
 * Export this and use it in components instead of state.workspace.
 */
export function selectActiveWorkspace(state: WorkspaceStoreState): WorkspaceState {
  return (
    state.workspaces.find((w) => w.id === state.activeWorkspaceId) ??
    state.workspaces[0]
  )
}

/**
 * Returns a new workspaces array with the active workspace's clue patched.
 */
function patchActiveClue(
  state: WorkspaceStoreState,
  patch: Partial<ClueAnnotation>
): WorkspaceState[] {
  const activeId = state.activeWorkspaceId
  return state.workspaces.map((ws) =>
    ws.id === activeId
      ? { ...ws, clue: { ...ws.clue, ...patch } }
      : ws
  )
}

/**
 * Returns a new workspaces array with a specific attempt patched
 * inside the active workspace.
 */
function patchActiveAttempt(
  state: WorkspaceStoreState,
  attemptId: string,
  patch: Partial<AttemptState>
): WorkspaceState[] {
  const activeId = state.activeWorkspaceId
  return state.workspaces.map((ws) =>
    ws.id === activeId
      ? {
          ...ws,
          attempts: ws.attempts.map((a) =>
            a.id === attemptId ? { ...a, ...patch } : a
          ),
        }
      : ws
  )
}

/**
 * Returns a new workspaces array with all attempts in the active
 * workspace replaced by a mapped version.
 */
function mapActiveAttempts(
  state: WorkspaceStoreState,
  fn: (attempts: AttemptState[]) => AttemptState[]
): WorkspaceState[] {
  const activeId = state.activeWorkspaceId
  return state.workspaces.map((ws) =>
    ws.id === activeId ? { ...ws, attempts: fn(ws.attempts) } : ws
  )
}

// ── Store ─────────────────────────────────────────────────────

export const useWorkspaceStore = create<WorkspaceStoreState>()(
  persist(
    (set) => ({
      workspaces: DEFAULT_WORKSPACES,
      activeWorkspaceId: INITIAL_WS_ID,

      // ── Workspace lifecycle ──────────────────────────────

      addWorkspace: () =>
        set((state) => {
          if (state.workspaces.length >= 6) return state
          const newWs = createBlankWorkspace()
          return {
            workspaces: [...state.workspaces, newWs],
            activeWorkspaceId: newWs.id,
          }
        }),

      switchWorkspace: (id) =>
        set({ activeWorkspaceId: id }),

      closeWorkspace: (id) =>
        set((state) => {
          if (state.workspaces.length <= 1) return state
          const remaining = state.workspaces.filter((ws) => ws.id !== id)
          const newActiveId =
            state.activeWorkspaceId === id
              ? remaining[0].id
              : state.activeWorkspaceId
          return { workspaces: remaining, activeWorkspaceId: newActiveId }
        }),

      // ── Clue ────────────────────────────────────────────

      setClueNotes: (notes) =>
        set((state) => ({ workspaces: patchActiveClue(state, { notes }) })),

      updateClue: (reference, rawText, enumeration) =>
        set((state) => {
          const activeWs = selectActiveWorkspace(state)
          const textChanged = rawText !== activeWs.clue.rawText
          const words = textChanged ? tokenizeClue(rawText) : activeWs.clue.words
          return {
            workspaces: patchActiveClue(state, { reference, rawText, enumeration, words }),
          }
        }),

      setWordAnnotation: (wordIndex, annotation) =>
        set((state) => {
          const activeWs = selectActiveWorkspace(state)
          const words = [...activeWs.clue.words]
          words[wordIndex] = { ...words[wordIndex], annotation }
          return { workspaces: patchActiveClue(state, { words }) }
        }),

      // ── Attempt lifecycle ────────────────────────────────

      setAttemptCollapsed: (id, collapsed) =>
        set((state) => ({ workspaces: patchActiveAttempt(state, id, { collapsed }) })),

      setActiveAttempt: (id) =>
        set((state) => ({
          workspaces: mapActiveAttempts(state, (attempts) =>
            attempts.map((a) => ({ ...a, collapsed: a.id !== id }))
          ),
        })),

      addAttempt: () =>
        set((state) => {
          const activeWs = selectActiveWorkspace(state)
          const n = activeWs.attempts.length + 1
          const newAttempt: AttemptState = {
            ...ATTEMPT_DEFAULTS,
            id: `attempt-${Date.now()}`,
            title: `Theory ${n}`,
            strategy: '',
            collapsed: true,
          }
          return {
            workspaces: mapActiveAttempts(state, (attempts) => [
              ...attempts,
              newAttempt,
            ]),
          }
        }),

      removeAttempt: (id) =>
        set((state) => {
          const activeWs = selectActiveWorkspace(state)
          if (activeWs.attempts.length <= 1) return state
          return {
            workspaces: mapActiveAttempts(state, (attempts) =>
              attempts.filter((a) => a.id !== id)
            ),
          }
        }),

      // ── Attempt content ──────────────────────────────────

      updateAttemptTitle: (id, title) =>
        set((state) => ({ workspaces: patchActiveAttempt(state, id, { title }) })),

      updateAttemptStrategy: (id, strategy) =>
        set((state) => ({ workspaces: patchActiveAttempt(state, id, { strategy }) })),

      updateWorkingAnswer: (id, workingAnswer) =>
        set((state) => ({ workspaces: patchActiveAttempt(state, id, { workingAnswer }) })),

      setConfidence: (id, confidence) =>
        set((state) => ({ workspaces: patchActiveAttempt(state, id, { confidence }) })),

      setToolMode: (id, toolMode) =>
        set((state) => ({ workspaces: patchActiveAttempt(state, id, { toolMode }) })),

      // ── Source / scan ────────────────────────────────────

      setAttemptSource: (id, sourceText) =>
        set((state) => {
          const activeWs = selectActiveWorkspace(state)
          const attempt = activeWs.attempts.find((a) => a.id === id)
          const tiles = attempt ? buildTiles(sourceText, attempt.tiles) : []
          return { workspaces: patchActiveAttempt(state, id, { sourceText, tiles }) }
        }),

      setAttemptScan: (id, scanText) =>
        set((state) => ({ workspaces: patchActiveAttempt(state, id, { scanText }) })),

      // ── Tiles ────────────────────────────────────────────

      toggleTileLock: (attemptId, tileId) =>
        set((state) => {
          const activeWs = selectActiveWorkspace(state)
          const attempt = activeWs.attempts.find((a) => a.id === attemptId)
          if (!attempt) return state
          const tiles = attempt.tiles.map((t) =>
            t.id === tileId ? { ...t, locked: !t.locked } : t
          )
          return { workspaces: patchActiveAttempt(state, attemptId, { tiles }) }
        }),

      reorderTiles: (attemptId, fromIndex, toIndex) =>
        set((state) => {
          const activeWs = selectActiveWorkspace(state)
          const attempt = activeWs.attempts.find((a) => a.id === attemptId)
          if (!attempt || fromIndex === toIndex) return state
          if (
            fromIndex < 0 || toIndex < 0 ||
            fromIndex >= attempt.tiles.length ||
            toIndex >= attempt.tiles.length
          ) return state
          const tiles = [...attempt.tiles]
          const [moved] = tiles.splice(fromIndex, 1)
          tiles.splice(toIndex, 0, moved)
          return { workspaces: patchActiveAttempt(state, attemptId, { tiles }) }
        }),

      shuffleTiles: (attemptId) =>
        set((state) => {
          const activeWs = selectActiveWorkspace(state)
          const attempt = activeWs.attempts.find((a) => a.id === attemptId)
          if (!attempt || attempt.tiles.length < 2) return state
          const tiles = [...attempt.tiles]
          for (let i = tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[tiles[i], tiles[j]] = [tiles[j], tiles[i]]
          }
          return { workspaces: patchActiveAttempt(state, attemptId, { tiles }) }
        }),

      resetTileOrder: (attemptId) =>
        set((state) => {
          const activeWs = selectActiveWorkspace(state)
          const attempt = activeWs.attempts.find((a) => a.id === attemptId)
          if (!attempt) return state
          const tiles = [...attempt.tiles].sort((a, b) => a.position - b.position)
          return { workspaces: patchActiveAttempt(state, attemptId, { tiles }) }
        }),

      // ── Notes & history ──────────────────────────────────

      updateAttemptNotes: (id, notes) =>
        set((state) => ({ workspaces: patchActiveAttempt(state, id, { notes }) })),

      addHistoryEntry: (id, entry) =>
        set((state) => {
          const activeWs = selectActiveWorkspace(state)
          const attempt = activeWs.attempts.find((a) => a.id === id)
          if (!attempt) return state
          return {
            workspaces: patchActiveAttempt(state, id, {
              history: [...attempt.history, entry],
            }),
          }
        }),

      removeHistoryEntry: (id, index) =>
        set((state) => {
          const activeWs = selectActiveWorkspace(state)
          const attempt = activeWs.attempts.find((a) => a.id === id)
          if (!attempt) return state
          return {
            workspaces: patchActiveAttempt(state, id, {
              history: attempt.history.filter((_, i) => i !== index),
            }),
          }
        }),

      // ── Candidates ───────────────────────────────────────

      addCandidate: (id, word) =>
        set((state) => {
          const activeWs = selectActiveWorkspace(state)
          const attempt = activeWs.attempts.find((a) => a.id === id)
          if (!attempt || attempt.candidates.includes(word.toUpperCase())) return state
          return {
            workspaces: patchActiveAttempt(state, id, {
              candidates: [...attempt.candidates, word.toUpperCase()],
            }),
          }
        }),

      removeCandidate: (id, word) =>
        set((state) => {
          const activeWs = selectActiveWorkspace(state)
          const attempt = activeWs.attempts.find((a) => a.id === id)
          if (!attempt) return state
          return {
            workspaces: patchActiveAttempt(state, id, {
              candidates: attempt.candidates.filter((c) => c !== word),
              starredCandidate: attempt.starredCandidate === word ? null : attempt.starredCandidate,
            }),
          }
        }),

      starCandidate: (id, word) =>
        set((state) => ({ workspaces: patchActiveAttempt(state, id, { starredCandidate: word }) })),

      // ── Reset ────────────────────────────────────────────

      resetAttemptWorkspace: (id) =>
        set((state) => ({
          workspaces: patchActiveAttempt(state, id, {
            sourceText: '',
            scanText: '',
            tiles: [],
            candidates: [],
            workingAnswer: '',
            starredCandidate: null,
          }),
        })),

      resetWorkspace: () =>
        set((state) => {
          const fresh = createBlankWorkspace()
          // Reset only the active workspace to blank
          return {
            workspaces: state.workspaces.map((ws) =>
              ws.id === state.activeWorkspaceId ? { ...fresh, id: ws.id } : ws
            ),
          }
        }),

      importWorkspaces: (incoming) =>
        set((state) => {
          if (!incoming.length) return state

          const now = Date.now()
          // Cast to Partial so ?? fallbacks work for files missing optional fields
          const raw = incoming as Partial<WorkspaceState>[]
          const sanitized: WorkspaceState[] = raw.map((ws, i) => ({
            id: `ws-import-${now}-${i}`,
            clue: ws.clue ?? {
              id: `clue-import-${now}-${i}`,
              rawText: '',
              enumeration: '',
              notes: '',
              words: [],
            },
            attempts: (ws.attempts ?? []).map((a) => ({
              ...ATTEMPT_DEFAULTS,
              ...a,
            })),
          }))

          // Append after existing workspaces; first-imported becomes active
          const combined    = [...state.workspaces, ...sanitized]
          const capped      = combined.slice(0, 6)
          const newActiveId = sanitized[0]?.id ?? state.activeWorkspaceId

          // If the first imported workspace made it in, switch to it
          const finalActiveId = capped.some((w) => w.id === newActiveId)
            ? newActiveId
            : state.activeWorkspaceId

          return { workspaces: capped, activeWorkspaceId: finalActiveId }
        }),
    }),
    {
      name: 'cryptic:workspace', // key unchanged — merge handles format detection

      // ── Schema migration + merge ───────────────────────────
      //
      // Handles three formats:
      //   A) New multi-workspace:  { workspaces: [...], activeWorkspaceId: '...' }
      //   B) Old single-workspace: { workspace: WorkspaceState }  (pre-7a)
      //   C) No data (fresh):      falls through to defaults

      merge: (persisted, current) => {
        const p = persisted as Record<string, unknown>
        if (!p) return current

        // ── Format A: new multi-workspace data ──
        if (Array.isArray(p.workspaces) && (p.workspaces as unknown[]).length > 0) {
          return {
            ...current,
            workspaces: (p.workspaces as WorkspaceState[]).map((ws) => ({
              id: ws.id ?? `ws-${Math.random()}`,
              clue: ws.clue ?? current.workspaces[0].clue,
              attempts: (ws.attempts ?? []).map((a) => ({
                ...ATTEMPT_DEFAULTS,
                ...a,
              })),
            })),
            activeWorkspaceId:
              (p.activeWorkspaceId as string | undefined) ?? current.activeWorkspaceId,
          }
        }

        // ── Format B: old single-workspace (pre-Phase 7a) ──
        // Promote the single workspace into the new array format.
        if (p.workspace && typeof p.workspace === 'object') {
          const oldWs = p.workspace as WorkspaceState
          const wsId = `ws-migrated-${Date.now()}`
          return {
            ...current,
            workspaces: [{
              id: wsId,
              clue: oldWs.clue ?? current.workspaces[0].clue,
              attempts: (oldWs.attempts ?? []).map((a) => ({
                ...ATTEMPT_DEFAULTS,
                ...a,
              })),
            }],
            activeWorkspaceId: wsId,
          }
        }

        // ── Format C: no usable data ──
        return current
      },
    }
  )
)
