/**
 * App — root component
 *
 * Responsibilities:
 *   1. Reads preferences from the Zustand store
 *   2. Applies data-theme, data-mode, data-monochrome, data-reduced-motion,
 *      and data-font-size attributes to <html> so CSS can respond to them
 *   3. Renders the AppShell
 *
 * WHY data attributes on <html>?
 *   Our CSS token system uses attribute selectors like [data-theme="dark"]
 *   to switch colour palettes. This approach:
 *     - Requires zero JavaScript in CSS (no style injection)
 *     - Works before React hydrates (prevents colour flash)
 *     - Is easy to debug (visible in browser DevTools)
 */

import { useEffect } from "react"
import { AppShell } from './components/layout/AppShell'
import { usePreferencesStore } from './store/preferencesStore'

export default function App() {
  const theme = usePreferencesStore((s) => s.theme)
  const mode = usePreferencesStore((s) => s.mode)
  const monochromeMode = usePreferencesStore((s) => s.monochromeMode)
  const reducedMotion = usePreferencesStore((s) => s.reducedMotion)
  const fontSize = usePreferencesStore((s) => s.fontSize)

  // Sync all preference state → HTML element data attributes
  // This runs on every preference change, immediately
  useEffect(() => {
    const html = document.documentElement
    html.dataset.theme = theme
    html.dataset.mode = mode
    html.dataset.monochrome = String(monochromeMode)
    html.dataset.reducedMotion = String(reducedMotion)
    html.dataset.fontSize = fontSize
  }, [theme, mode, monochromeMode, reducedMotion, fontSize])

  return <AppShell />
}
