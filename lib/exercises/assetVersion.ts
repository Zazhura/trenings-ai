/**
 * Asset Version Helper
 * Returns a version string for cache-busting assets per deploy
 */

/**
 * Get asset version for cache-busting
 * - Uses VERCEL_GIT_COMMIT_SHA in production (first 7 chars)
 * - Falls back to timestamp in dev/local
 */
export function getAssetVersion(): string {
  // In Vercel, use git commit SHA
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
  }

  // In local dev, use timestamp (changes on each dev server restart)
  return Date.now().toString()
}

