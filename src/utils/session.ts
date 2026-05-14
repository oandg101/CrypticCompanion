/**
 * session.ts — session export / import utilities
 *
 * Pure functions only — no React, no Zustand, no side effects.
 * SessionControls.tsx calls these and handles the UI + store mutations.
 *
 * FILE FORMAT (version 1):
 * {
 *   "version": 1,
 *   "app": "cryptic-companion",
 *   "exported": "2024-01-15T14:30:00.000Z",
 *   "workspaces": [ WorkspaceState, ... ]
 * }
 *
 * The version field allows future migrations. The app field prevents
 * importing unrelated JSON files accidentally.
 *
 * OFFLINE NOTE:
 *   Cryptic Companion already works fully offline. Zustand persist
 *   writes every state change to localStorage synchronously. On the
 *   next visit — even with no network — the app loads instantly and
 *   all workspace data is restored from localStorage. No service
 *   worker is required for offline support.
 *
 *   Export/import serves a different purpose: letting users back up
 *   sessions to a file they control, share sessions with others, or
 *   move sessions between devices or browsers.
 */

import type { WorkspaceState } from '../types'

// ── File format ───────────────────────────────────────────────

export const SESSION_FORMAT_VERSION = 1

export interface SessionFile {
  version: number
  app: 'cryptic-companion'
  exported: string           // ISO 8601 timestamp
  workspaces: WorkspaceState[]
}

// ── Export ────────────────────────────────────────────────────

/**
 * Serialise workspaces to the session file format.
 */
export function serialiseSession(workspaces: WorkspaceState[]): SessionFile {
  return {
    version: SESSION_FORMAT_VERSION,
    app: 'cryptic-companion',
    exported: new Date().toISOString(),
    workspaces,
  }
}

/**
 * Generate a filename for the downloaded session file.
 * Uses the first workspace's clue reference if available.
 */
export function sessionFilename(workspaces: WorkspaceState[]): string {
  const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  if (workspaces.length === 1 && workspaces[0].clue.reference) {
    // Single workspace: "cryptic-14-across-2024-01-15.json"
    const ref = workspaces[0].clue.reference
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    return `cryptic-${ref}-${date}.json`
  }
  return `cryptic-session-${date}.json`
}

/**
 * Triggers a browser file download of the serialised session.
 * Uses a temporary anchor element — no server required.
 */
export function downloadSession(workspaces: WorkspaceState[]): void {
  const data    = serialiseSession(workspaces)
  const json    = JSON.stringify(data, null, 2)
  const blob    = new Blob([json], { type: 'application/json' })
  const url     = URL.createObjectURL(blob)
  const anchor  = document.createElement('a')

  anchor.href     = url
  anchor.download = sessionFilename(workspaces)
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  // Revoke after a tick to let the download start
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

// ── Import ────────────────────────────────────────────────────

/**
 * Parse and validate a session file JSON string.
 *
 * Returns the workspaces array on success.
 * Throws a descriptive Error on failure — callers should catch and
 * display the message to the user.
 */
export function parseSessionFile(text: string): WorkspaceState[] {
  let data: unknown

  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Could not read the file — it may be corrupted or not valid JSON.')
  }

  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid file format.')
  }

  const file = data as Record<string, unknown>

  if (file.app !== 'cryptic-companion') {
    throw new Error('This file was not created by Cryptic Companion.')
  }

  if (typeof file.version !== 'number') {
    throw new Error('Invalid file format — version field missing.')
  }

  if (file.version > SESSION_FORMAT_VERSION) {
    // Future format: attempt to import anyway, but warn
    console.warn(
      `[session] File version ${file.version} is newer than supported (${SESSION_FORMAT_VERSION}). ` +
      'Some data may not load correctly.'
    )
  }

  if (!Array.isArray(file.workspaces)) {
    throw new Error('Invalid file format — workspaces field missing.')
  }

  const workspaces = file.workspaces as WorkspaceState[]

  if (workspaces.length === 0) {
    throw new Error('The file contains no workspaces.')
  }

  // Light structural validation of each workspace
  workspaces.forEach((ws, i) => {
    if (typeof ws !== 'object' || ws === null) {
      throw new Error(`Workspace ${i + 1} is malformed.`)
    }
    if (typeof ws.clue !== 'object' || ws.clue === null) {
      throw new Error(`Workspace ${i + 1} is missing its clue data.`)
    }
    if (!Array.isArray(ws.attempts)) {
      throw new Error(`Workspace ${i + 1} is missing its attempts data.`)
    }
  })

  return workspaces
}
