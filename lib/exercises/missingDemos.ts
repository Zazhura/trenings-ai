/**
 * Missing Demos Tracker
 * Tracks exercises that are rendered with placeholders
 */

const missingDemos = new Set<string>()

/**
 * Register an exercise slug that is missing a demo
 */
export function registerMissingDemo(slug: string): void {
  missingDemos.add(slug)
}

/**
 * Get all missing demo slugs
 */
export function getMissingDemos(): string[] {
  return Array.from(missingDemos).sort()
}

/**
 * Get count of missing demos
 */
export function getMissingDemosCount(): number {
  return missingDemos.size
}

/**
 * Clear all registered missing demos
 */
export function clearMissingDemos(): void {
  missingDemos.clear()
}

/**
 * Log missing demos summary (once)
 */
let hasLogged = false

export function logMissingDemosSummary(): void {
  if (hasLogged) return
  hasLogged = true

  const count = getMissingDemosCount()
  if (count === 0) {
    console.log('[ExerciseDemos] ✅ All exercises have demos')
    return
  }

  const slugs = getMissingDemos()
  console.group(`[ExerciseDemos] ⚠️ ${count} exercise(s) missing demos:`)
  slugs.forEach((slug) => {
    console.log(`  - ${slug}`)
  })
  console.groupEnd()
}

