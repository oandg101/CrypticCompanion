/**
 * AppShell — Phase 7a
 *
 * Phase 7a: WorkspaceTabBar added between Topbar and main content.
 * The tab bar is sticky directly below the Topbar.
 * CluePanel's sticky top offset is updated via --shell-offset token.
 */

import { Topbar } from './Topbar'
import { WorkspaceTabBar } from './WorkspaceTabBar'
import { MainGrid } from './MainGrid'
import './AppShell.css'

export function AppShell() {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <Topbar />
      <WorkspaceTabBar />

      <main id="main-content" className="app-shell__main">
        <MainGrid />
      </main>
    </div>
  )
}
