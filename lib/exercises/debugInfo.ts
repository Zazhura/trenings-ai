/**
 * Debug Info Tracker for Exercise Demos
 * Tracks debug information for current exercise when debug mode is enabled
 */

export interface ExerciseDebugInfo {
  rawName: string
  normalizedKey: string
  registryHit: boolean
  assetPath: string | null
  fetchStatus: 'idle' | 'loading' | 'ok' | '404' | 'error'
  fetchError: string | null
}

let currentDebugInfo: ExerciseDebugInfo | null = null

/**
 * Set current exercise debug info
 */
export function setExerciseDebugInfo(info: ExerciseDebugInfo): void {
  currentDebugInfo = info
}

/**
 * Get current exercise debug info
 */
export function getExerciseDebugInfo(): ExerciseDebugInfo | null {
  return currentDebugInfo
}

/**
 * Clear debug info
 */
export function clearExerciseDebugInfo(): void {
  currentDebugInfo = null
}

