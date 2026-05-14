/**
 * CluePartCard
 *
 * Renders a single clue-part analysis card.
 * Used for definition, indicator, and fodder parts.
 *
 * The "beginner-only" hint text is hidden in expert mode
 * automatically via CSS: [data-mode="expert"] .beginner-only { display: none; }
 * No React logic needed — the CSS reads the data attribute on <html>.
 */



interface CluePartCardProps {
  /** Which part of the clue this card represents */
  type: 'def' | 'ind' | 'fod'
  /** The word(s) from the clue text that belong to this part */
  text: string
  /** Short descriptor shown in the card header */
  descriptor: string
  /** Hint text for beginners — hidden in expert mode */
  hint: string
}

/** Display names and subtitles for each part type */
const PART_META: Record<'def' | 'ind' | 'fod', { heading: string; subtitle: string }> = {
  def: {
    heading:  'Definition',
    subtitle: 'what it means',
  },
  ind: {
    heading:  'Indicator',
    subtitle: 'signals the clue type',
  },
  fod: {
    heading:  'Fodder',
    subtitle: 'raw material',
  },
}

export function CluePartCard({ type, text, descriptor, hint }: CluePartCardProps) {
  const meta = PART_META[type]

  return (
    <section
      className={`part part--${type}`}
      aria-label={`${meta.heading}: ${text}`}
    >
      <header className="part__head">
        <span>{meta.heading}</span>
        <span className="part__head-right">{meta.subtitle}</span>
      </header>

      <div className="part__body">
        {/* The quoted text — uses coloured typography from CSS */}
        <p className="part__quote">
          &ldquo;{text}&rdquo;
        </p>

        {/* Hint visible in beginner mode only — CSS hides in expert */}
        <p className="part__hint beginner-only">
          {hint}
          {descriptor && (
            <> <span className="mono">{descriptor}</span></>
          )}
        </p>
      </div>
    </section>
  )
}
