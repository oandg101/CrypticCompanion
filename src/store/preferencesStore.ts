/**
 * preferencesStore — user interface preferences
 *
 * Persisted automatically to localStorage under the key 'cryptic:preferences'.
 * On next visit, the user's last theme/mode/etc. is restored instantly.
 *
 * HOW ZUSTAND WORKS (brief explanation for new developers):
 *   - `create()(...)` creates the store
 *   - `persist(...)` wraps it so state is saved to localStorage
 *   - Components call `usePreferencesStore(selector)` to subscribe
 *     to specific slices — they only re-render when THAT slice changes
 *   - Actions (functions in the store) call `set(...)` to update state
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, DensityMode, FontSize } from '../types'

// ── State shape ───────────────────────────────────────────────

interface PreferencesStoreState {
  // State
  theme: Theme
  mode: DensityMode
  breakdownVisible: boolean
  reducedMotion: boolean
  monochromeMode: boolean
  learningPanelOpen: boolean
  fontSize: FontSize

  // Actions
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  toggleMode: () => void
  setMode: (mode: DensityMode) => void
  toggleBreakdown: () => void
  setBreakdownVisible: (visible: boolean) => void
  toggleReducedMotion: () => void
  toggleMonochrome: () => void
  toggleLearningPanel: () => void
  setFontSize: (size: FontSize) => void
}

// ── Store definition ──────────────────────────────────────────

export const usePreferencesStore = create<PreferencesStoreState>()(
  persist(
    (set) => ({
      // ── Defaults ──
      // These values are used on first visit (before any localStorage data exists).
      theme: 'light',
      mode: 'beginner',
      breakdownVisible: true,
      reducedMotion: false,
      monochromeMode: false,
      learningPanelOpen: true,   // open by default; beginners benefit from reference
      fontSize: 'normal',

      // ── Actions ──
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),

      setTheme: (theme) => set({ theme }),

      toggleMode: () =>
        set((state) => ({
          mode: state.mode === 'beginner' ? 'expert' : 'beginner',
        })),

      setMode: (mode) => set({ mode }),

      toggleBreakdown: () =>
        set((state) => ({ breakdownVisible: !state.breakdownVisible })),

      setBreakdownVisible: (visible) => set({ breakdownVisible: visible }),

      toggleReducedMotion: () =>
        set((state) => ({ reducedMotion: !state.reducedMotion })),

      toggleMonochrome: () =>
        set((state) => ({ monochromeMode: !state.monochromeMode })),

      toggleLearningPanel: () =>
        set((state) => ({ learningPanelOpen: !state.learningPanelOpen })),

      setFontSize: (size) => set({ fontSize: size }),
    }),
    {
      name: 'cryptic:preferences',

      // ── Schema migration guard ─────────────────────────────
      // Same pattern as workspaceStore. If a new preference field is added
      // in a later phase, existing users get its default value automatically
      // rather than undefined. Spread persisted values over current defaults.
      merge: (persisted, current) => {
        const p = persisted as typeof current
        if (!p) return current
        // Spread persisted over current so: new fields get defaults,
        // existing fields keep the user's saved values.
        return { ...current, ...p }
      },

      // Only persist state keys, not action functions
      partialize: (state) => ({
        theme: state.theme,
        mode: state.mode,
        breakdownVisible: state.breakdownVisible,
        reducedMotion: state.reducedMotion,
        monochromeMode: state.monochromeMode,
        learningPanelOpen: state.learningPanelOpen,
        fontSize: state.fontSize,
      }),
    }
  )
)

// ── Convenience selectors ──────────────────────────────────────
// Import these in components to avoid re-typing the selector

export const useTheme = () => usePreferencesStore((s) => s.theme)
export const useMode = () => usePreferencesStore((s) => s.mode)
export const useBreakdownVisible = () =>
  usePreferencesStore((s) => s.breakdownVisible)
