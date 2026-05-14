/**
 * Tile — Phase 4.1
 *
 * A single letter tile in the TileRack.
 *
 * INTERACTION MODEL:
 *   Click tile body      → select for rearrangement (or confirm swap)
 *   Click lock button    → toggle locked/confirmed state
 *   L key (focused)      → toggle lock (keyboard shortcut, no tab stop needed)
 *   Escape (focused)     → cancel current selection
 *   ← → arrow keys       → move selected tile left/right (handled in TileRack)
 *
 * WHY a separate lock button:
 *   Click is consumed by the rearrangement system. Lock needs its own affordance.
 *   The lock button has tabIndex={-1}: keyboard users access lock via the L key
 *   on the main tile button — no extra tab stops added to the rack.
 *
 * WHY buttonRef as a prop (not useRef internally):
 *   TileRack needs to programmatically focus specific tiles after arrow-key
 *   moves. Accepting buttonRef as a prop lets TileRack register the DOM
 *   button directly without DOM querying or forwardRef complexity.
 *
 * VISUAL STATES (set via .tile-wrap class modifiers):
 *   default     → paper card, ink border
 *   is-selected → lifted 4px, green border, soft glow — "held in hand"
 *   is-target   → dashed border, slight nudge — "drop here"
 *   is-locked   → green tint, solid border — "confirmed"
 */

import { cn } from '../../utils/cn'
import type { TileState } from '../../types'

interface TileProps {
  tile: TileState
  index: number
  isSelected: boolean
  /** True when another tile is selected and this one is a valid drop target */
  isTarget: boolean
  onSelect: (index: number) => void
  onToggleLock: (id: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => void
  /** Ref callback — TileRack uses this to focus tiles after keyboard moves */
  buttonRef?: (el: HTMLButtonElement | null) => void
}

export function Tile({
  tile,
  index,
  isSelected,
  isTarget,
  onSelect,
  onToggleLock,
  onKeyDown,
  buttonRef,
}: TileProps) {
  const lockLabel = tile.locked
    ? `Unlock ${tile.letter} — currently confirmed`
    : `Lock ${tile.letter} to confirm it`

  const bodyLabel = isSelected
    ? `${tile.letter}, position ${index + 1} — selected. Tap another tile to move it · ← → to move · Escape to cancel`
    : isTarget
    ? `${tile.letter}, position ${index + 1} — tap to move selected tile here`
    : `${tile.letter}, position ${index + 1} — tap to select · L to lock`

  return (
    <div
      className={cn(
        'tile-wrap',
        isSelected  && 'is-selected',
        isTarget    && 'is-target',
        tile.locked && 'is-locked',
      )}
    >
      {/* Main tile body — handles selection and keyboard events */}
      <button
        ref={buttonRef}
        type="button"
        className="tile-body"
        onClick={() => onSelect(index)}
        onKeyDown={(e) => onKeyDown(e, index)}
        aria-label={bodyLabel}
        aria-pressed={isSelected}
      >
        <span className="tile-letter" aria-hidden="true">{tile.letter}</span>
        <span className="tile-pos"    aria-hidden="true">{index + 1}</span>
      </button>

      {/* Lock toggle — overlay button, mouse/touch only (keyboard: L key) */}
      <button
        type="button"
        className="tile-lock-btn"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation()
          onToggleLock(tile.id)
        }}
        aria-label={lockLabel}
        title={lockLabel}
      >
        {tile.locked ? (
          <svg viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
            <rect x="2" y="2" width="6" height="6" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="2" y="2" width="6" height="6" rx="1" />
          </svg>
        )}
      </button>
    </div>
  )
}
