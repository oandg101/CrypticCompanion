/**
 * ErrorBoundary
 *
 * Wraps the entire app. If any component throws during render,
 * this catches the error and shows a recovery UI instead of
 * a blank white screen.
 *
 * WHY a class component:
 *   React error boundaries must be class components — there is no
 *   functional component equivalent. This is a React constraint.
 *   (Hooks cannot catch render errors in sibling or child components.)
 *
 * BEHAVIOUR:
 *   - Shows the error message in a collapsible <details> block
 *   - "Try again" resets the boundary so the user can retry
 *   - Workspace data in localStorage is untouched — a refresh recovers it
 *   - Error is logged to console for debugging
 */

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Component tree crashed:', error)
    console.error('[ErrorBoundary] Component stack:', info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary" role="alert" aria-live="assertive">
          <div className="error-boundary__card">
            <h1 className="error-boundary__title">Something went wrong</h1>
            <p className="error-boundary__body">
              Your workspace data is safe — it's stored in your browser and
              won't be affected by this error. Try refreshing the page, or
              click below to attempt recovery without refreshing.
            </p>
            <button
              type="button"
              className="error-boundary__btn"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
            <details className="error-boundary__details">
              <summary>Technical details</summary>
              <pre className="error-boundary__trace">{this.state.error.message}</pre>
            </details>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
