/**
 * cn — class name utility
 *
 * Joins class name strings together, ignoring any falsy values.
 * This lets you write conditional classNames cleanly:
 *
 *   cn('btn', isActive && 'btn--active', className)
 *
 * This is intentionally tiny — no need for clsx or classnames packages.
 */
export function cn(
  ...classes: (string | undefined | null | false | 0)[]
): string {
  return classes.filter(Boolean).join(' ')
}
