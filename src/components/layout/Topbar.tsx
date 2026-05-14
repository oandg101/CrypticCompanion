/**
 * Topbar — Phase 7b
 *
 * Phase 7b addition: SessionControls (export / import buttons)
 * inserted between the brand and the preference toggles.
 *
 * Layout:
 *   [Brand]  |  [Export] [Import]  |  [Dark | Expert | Breakdown | Reference]
 *
 * The session controls are separated from the brand and toggles
 * by subtle vertical rule borders, making the three groups visually
 * distinct without heavy chrome.
 */

import { Toggle } from '../common/Toggle'
import { SessionControls } from './SessionControls'
import { usePreferencesStore } from '../../store/preferencesStore'
import './Topbar.css'

export function Topbar() {
  const theme              = usePreferencesStore((s) => s.theme)
  const mode               = usePreferencesStore((s) => s.mode)
  const breakdownVisible   = usePreferencesStore((s) => s.breakdownVisible)
  const learningPanelOpen  = usePreferencesStore((s) => s.learningPanelOpen)
  const toggleTheme        = usePreferencesStore((s) => s.toggleTheme)
  const toggleMode         = usePreferencesStore((s) => s.toggleMode)
  const toggleBreakdown    = usePreferencesStore((s) => s.toggleBreakdown)
  const toggleLearningPanel = usePreferencesStore((s) => s.toggleLearningPanel)

  return (
    <header className="topbar" role="banner">

      {/* Brand */}
      <div className="brand">
        <span className="brand__mark" aria-label="Cryptic — solving companion">
          Cryptic
        </span>
        <span className="brand__sub" aria-hidden="true">
          solving companion
        </span>
      </div>

      {/* Session management — export / import */}
      <SessionControls />

      {/* Display preference toggles */}
      <nav className="toggles" aria-label="Display settings">

        <Toggle
          label={theme === 'light' ? 'Dark' : 'Light'}
          pressed={theme === 'dark'}
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        />

        <Toggle
          label={mode === 'beginner' ? 'Expert' : 'Beginner'}
          pressed={mode === 'expert'}
          onClick={toggleMode}
          aria-label={mode === 'beginner' ? 'Switch to expert mode' : 'Switch to beginner mode'}
        />

        <Toggle
          label="Breakdown"
          value={breakdownVisible ? 'On' : 'Off'}
          pressed={breakdownVisible}
          onClick={toggleBreakdown}
          aria-label={breakdownVisible ? 'Hide clue breakdown' : 'Show clue breakdown'}
        />

        <Toggle
          label="Reference"
          value={learningPanelOpen ? 'On' : 'Off'}
          pressed={learningPanelOpen}
          onClick={toggleLearningPanel}
          aria-label={learningPanelOpen ? 'Hide reference guide' : 'Show reference guide'}
          className={mode === 'expert' ? 'toggle--muted' : ''}
        />

      </nav>
    </header>
  )
}
