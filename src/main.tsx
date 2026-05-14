/**
 * main.tsx — application entry point
 *
 * CSS import order matters:
 *   1. tokens.css       → CSS custom properties (must load first)
 *   2. typography.css   → font imports + scale (uses token vars)
 *   3. globals.css      → body/reset + ErrorBoundary styles
 *   4. accessibility.css → focus/motion/sr utilities (highest specificity)
 *   5. density.css      → beginner/expert layout overrides
 *   6. reset.css        → minimal browser reset (replaces Tailwind Preflight)
 *
 * ErrorBoundary wraps App so any uncaught render error shows a
 * recovery UI instead of a blank screen.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { ErrorBoundary } from './components/common/ErrorBoundary'

import './styles/tokens.css'
import './styles/typography.css'
import './styles/globals.css'
import './styles/accessibility.css'
import './styles/density.css'
import './styles/reset.css'

import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
