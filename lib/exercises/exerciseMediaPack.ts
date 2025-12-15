/**
 * Exercise Media Pack
 * Optional SVG-based media for exercises
 * Keys are normalized (lowercase, underscore)
 */

import { normalizeExerciseName } from './exerciseRegistry'

export type ExerciseMedia = {
  type: 'svg'
  src: string
  alt: string
}

/**
 * Exercise Media Pack
 * Maps normalized exercise keys to SVG media
 */
export const exerciseMediaPack: Record<string, ExerciseMedia> = {
  burpee: {
    type: 'svg',
    src: '/exercises/svg/burpee.svg',
    alt: 'Burpee exercise',
  },
  wall_ball: {
    type: 'svg',
    src: '/exercises/svg/wall_ball.svg',
    alt: 'Wall ball exercise',
  },
  kettlebell_swing: {
    type: 'svg',
    src: '/exercises/svg/kettlebell_swing.svg',
    alt: 'Kettlebell swing exercise',
  },
  box_jump: {
    type: 'svg',
    src: '/exercises/svg/box_jump.svg',
    alt: 'Box jump exercise',
  },
  thruster: {
    type: 'svg',
    src: '/exercises/svg/thruster.svg',
    alt: 'Thruster exercise',
  },
  pull_up: {
    type: 'svg',
    src: '/exercises/svg/pull_up.svg',
    alt: 'Pull-up exercise',
  },
  push_up: {
    type: 'svg',
    src: '/exercises/svg/push_up.svg',
    alt: 'Push-up exercise',
  },
  air_squat: {
    type: 'svg',
    src: '/exercises/svg/air_squat.svg',
    alt: 'Air squat exercise',
  },
  deadlift: {
    type: 'svg',
    src: '/exercises/svg/deadlift.svg',
    alt: 'Deadlift exercise',
  },
  sit_up: {
    type: 'svg',
    src: '/exercises/svg/sit_up.svg',
    alt: 'Sit-up exercise',
  },
}

/**
 * Get exercise media by normalized name
 * Uses normalizeExerciseName and converts dashes to underscores for matching
 */
export function getExerciseMedia(exerciseName: string): ExerciseMedia | null {
  // Normalize using the same function as exercise registry
  const normalizedSlug = normalizeExerciseName(exerciseName)
  
  // Convert dashes to underscores for media pack matching
  const normalized = normalizedSlug.replace(/-/g, '_')

  // Map common synonyms to media pack keys
  const synonymMap: Record<string, string> = {
    pushup: 'push_up',
    squat: 'air_squat',
    situp: 'sit_up',
  }

  const mapped = synonymMap[normalized] || normalized

  return exerciseMediaPack[mapped] || null
}

