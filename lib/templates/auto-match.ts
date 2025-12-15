/**
 * Auto-match exercise suggestions for template steps
 * Provides exercise matching with confidence scores
 */

import { autoMatchExercise, type ExerciseMatch } from '@/lib/exercises/db-operations'
import type { Step } from '@/types/template'

/**
 * Auto-match exercise for a step based on its title
 * Returns exercise match with confidence score
 */
export async function matchStepToExercise(step: Step): Promise<ExerciseMatch | null> {
  // If step already has exercise_id, return null (no need to match)
  if (step.exercise_id) {
    return null
  }

  // Use step title for matching
  return autoMatchExercise(step.title)
}

/**
 * Auto-match exercises for all steps in a template
 * Returns array of matches (one per step, null if no match or already matched)
 */
export async function matchTemplateSteps(steps: Step[]): Promise<(ExerciseMatch | null)[]> {
  const matches = await Promise.all(
    steps.map(step => matchStepToExercise(step))
  )
  return matches
}

