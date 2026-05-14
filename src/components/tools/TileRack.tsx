/**
 * TileRack — Phase 4.1
 *
 * Manages the full letter manipulation interaction system.
 *
 * ══ INTERACTION MODEL ════════════════════════════════════════
 *
 * MOUSE / TOUCH:
 *   1. Click tile → "selected" (lifted; waiting to be placed)
 *   2. Click another tile → selected tile moves to that position
 *   3. Click selected tile again → deselect (put it down)
 *   4. Click lock icon → toggle confirmed state
 *
 * KEYBOARD (when a tile button is focused):
 *   Tab / Shift+Tab  → move focus between tiles
 *   Enter / Space    → select / confirm placement
 *   ← →              → when selected: move tile one step left/right,
 *                      follow focus to new position
 *                      when not selected: move focus only
 *   Escape           → cancel selection
 *   L                → toggle lock on focused tile
 *
 * ══ FIXES IN 4.1 ═════════════════════════════════════════════
 *
 *   - Removed TileWithRef (duplicated Tile rendering + DOM querying)
 *   - Now uses Tile component directly with buttonRef prop
 *   - Ref callbacks are cached per index (stable, no new closures per render)
 *   - Single aria-live region (was two, causing double-announcements)
 *   - Announcement deduplication: counter-keyed state prevents silent repeats
 *   - Fixed tiles[selectedIndex!]?.letter contradiction (consistent non-null)
 *   - Memoised onToggleLock to avoid unnecessary tile re-renders
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Tile } from './Tile'
import { useWorkspaceStore } from '../../store/workspaceStore'
import type { TileState } from '../../types'

interface TileRackProps {
  attemptId: string
  tiles: TileState[]
}

export function TileRack({ attemptId, tiles }: TileRackProps) {
  // ── Store actions ────────────────────────────────────────────
  const toggleTileLock      = useWorkspaceStore((s) => s.toggleTileLock)
  const reorderTiles        = useWorkspaceStore((s) => s.reorderTiles)
  const shuffleTiles        = useWorkspaceStore((s) => s.shuffleTiles)
  const resetTileOrder      = useWorkspaceStore((s) => s.resetTileOrder)
  const updateWorkingAnswer = useWorkspaceStore((s) => s.updateWorkingAnswer)

  // ── Selection state ──────────────────────────────────────────
  // null = no tile selected; number = index of the selected tile
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  // ── Announcements ────────────────────────────────────────────
  // Counter-keyed so that identical text still triggers a state update,
  // which re-fires the aria-live region for screen readers.
  const [announcement, setAnnouncement] = useState<{ text: string; seq: number }>({
    text: '',
    seq: 0,
  })
  function announce(text: string) {
    setAnnouncement((prev) => ({ text, seq: prev.seq + 1 }))
  }

  // ── Tile button refs ─────────────────────────────────────────
  // We need DOM refs to specific tile buttons so we can programmatically
  // focus them after arrow-key moves. We cache one stable ref callback
  // per tile index so Tile receives the same function reference across
  // renders (avoiding unnecessary re-renders from new function props).
  const tileButtonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const refCallbackCache = useRef<((el: HTMLButtonElement | null) => void)[]>([])

  function getTileRef(index: number): (el: HTMLButtonElement | null) => void {
    if (!refCallbackCache.current[index]) {
      refCallbackCache.current[index] = (el) => {
        tileButtonRefs.current[index] = el
      }
    }
    return refCallbackCache.current[index]
  }

  // Focus a tile button (called after arrow-key reordering).
  // rAF ensures the store update has flushed and the DOM has re-rendered.
  const focusTile = useCallback((index: number) => {
    requestAnimationFrame(() => {
      tileButtonRefs.current[index]?.focus()
    })
  }, [])

  // ── Deselect on tiles array rebuild ──────────────────────────
  // When source text changes, tiles are rebuilt as a new array reference.
  // Any pending selection is stale and must be cleared.
  const prevTilesRef = useRef(tiles)
  useEffect(() => {
    if (tiles !== prevTilesRef.current) {
      setSelectedIndex(null)
      prevTilesRef.current = tiles
    }
  }, [tiles])

  // ── Stable toggle-lock handler ───────────────────────────────
  // Memoised so all Tile components receive the same function reference.
  const handleToggleLock = useCallback(
    (id: string) => toggleTileLock(attemptId, id),
    [attemptId, toggleTileLock]
  )

  // ── Tile selection / placement ───────────────────────────────
  function handleSelect(index: number) {
    if (selectedIndex === null) {
      setSelectedIndex(index)
      announce(
        `${tiles[index].letter} selected at position ${index + 1}. ` +
        `Tap another tile to move it here, or press Escape to cancel.`
      )
    } else if (selectedIndex === index) {
      setSelectedIndex(null)
      announce(`${tiles[index].letter} deselected.`)
    } else {
      const movingLetter = tiles[selectedIndex].letter
      reorderTiles(attemptId, selectedIndex, index)
      setSelectedIndex(null)
      announce(`${movingLetter} moved to position ${index + 1}.`)
    }
  }

  // ── Keyboard handler ─────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (e.key) {

      case 'Escape':
        e.preventDefault()
        setSelectedIndex(null)
        announce('Selection cancelled.')
        break

      case 'ArrowLeft':
        e.preventDefault()
        if (selectedIndex === index && index > 0) {
          // Move selected tile one step left, follow focus
          reorderTiles(attemptId, index, index - 1)
          setSelectedIndex(index - 1)
          focusTile(index - 1)
          announce(`${tiles[index].letter} moved to position ${index}.`)
        } else if (selectedIndex === null && index > 0) {
          // No selection — move focus only
          focusTile(index - 1)
        }
        break

      case 'ArrowRight':
        e.preventDefault()
        if (selectedIndex === index && index < tiles.length - 1) {
          // Move selected tile one step right, follow focus
          reorderTiles(attemptId, index, index + 1)
          setSelectedIndex(index + 1)
          focusTile(index + 1)
          announce(`${tiles[index].letter} moved to position ${index + 2}.`)
        } else if (selectedIndex === null && index < tiles.length - 1) {
          // No selection — move focus only
          focusTile(index + 1)
        }
        break

      case 'l':
      case 'L':
        e.preventDefault()
        toggleTileLock(attemptId, tiles[index].id)
        // tiles[index].locked reflects the PRE-toggle state; flip it for the message
        announce(
          `${tiles[index].letter} ${tiles[index].locked ? 'unlocked' : 'locked — confirmed'}.`
        )
        break
    }
  }

  // ── Action bar handlers ──────────────────────────────────────
  function handleShuffle() {
    setSelectedIndex(null)
    shuffleTiles(attemptId)
    announce('Tiles shuffled into a new random order.')
  }

  function handleResetOrder() {
    setSelectedIndex(null)
    resetTileOrder(attemptId)
    announce('Tile order reset to match source text.')
  }

  function handleCopyToAnswer() {
    const arrangement = tiles.map((t) => t.letter).join('')
    updateWorkingAnswer(attemptId, arrangement)
    announce(`Arrangement ${arrangement} copied to working answer.`)
  }

  // ── Empty state ──────────────────────────────────────────────
  if (tiles.length === 0) {
    return (
      <p className="tiles-empty">
        Enter source text above — letters will appear here as tiles.
      </p>
    )
  }

  // ── Render ───────────────────────────────────────────────────
  const arrangement = tiles.map((t) => t.letter).join('')
  const hasSelection = selectedIndex !== null
  const selectedLetter = hasSelection ? tiles[selectedIndex].letter : null

  return (
    <div className="tile-rack">

      {/* ── Action bar ── */}
      <div className="tile-rack__actions" role="toolbar" aria-label="Tile actions">
        <span className="tile-rack__count">
          {tiles.length} {tiles.length === 1 ? 'tile' : 'tiles'}
        </span>

        <div className="tile-rack__btns">
          <button
            type="button"
            className="tile-action-btn"
            onClick={handleResetOrder}
            aria-label="Reset tile order to source text order"
            title="Reset tile order to match source text"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M2 8a6 6 0 1 1 1.2 3.6" />
              <path d="M2 12V8h4" />
            </svg>
            Reset
          </button>

          <button
            type="button"
            className="tile-action-btn"
            onClick={handleShuffle}
            aria-label="Shuffle tiles randomly"
            title="Shuffle tiles into a random order"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M2 5h2l2 6h4M10 5h4m0 0-2-2m2 2-2 2" />
              <path d="M4 11h2l2-2" />
              <path d="M10 11h4m0 0-2-2m2 2-2 2" />
            </svg>
            Shuffle
          </button>

          <button
            type="button"
            className="tile-action-btn tile-action-btn--copy"
            onClick={handleCopyToAnswer}
            aria-label={`Copy arrangement ${arrangement} to working answer`}
            title={`Copy current arrangement (${arrangement}) to working answer`}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M10 2H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5l-3-3z" />
              <path d="M10 2v3h3M8 9.5V7m0 0L6.5 8.5M8 7l1.5 1.5" />
            </svg>
            Copy
          </button>
        </div>
      </div>

      {/* ── Tile grid ── */}
      <div
        className="tiles"
        role="group"
        aria-label={
          hasSelection
            ? `Letter tiles — ${selectedLetter} selected. Tap another tile to move it.`
            : `Letter tiles — arrangement: ${arrangement}`
        }
      >
        {tiles.map((tile, index) => (
          <Tile
            key={tile.id}
            tile={tile}
            index={index}
            isSelected={selectedIndex === index}
            isTarget={hasSelection && selectedIndex !== index}
            onSelect={handleSelect}
            onToggleLock={handleToggleLock}
            onKeyDown={handleKeyDown}
            buttonRef={getTileRef(index)}
          />
        ))}
      </div>

      {/* ── Selection hint (visible) ── */}
      {hasSelection && (
        <p className="tile-rack__hint">
          <span className="tile-rack__hint-selected">{selectedLetter}</span>
          {' '}selected — tap a tile to move it · ← → · Esc to cancel
        </p>
      )}

      {/* ── Screen reader live region (single, sr-only) ── */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        key={announcement.seq}
      >
        {announcement.text}
      </div>

    </div>
  )
}
