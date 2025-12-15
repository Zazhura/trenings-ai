/**
 * Exercise Demo Registry
 * Maps exercise names (normalized to slugs) to demo configurations
 */

export type ExerciseDemo =
  | { kind: 'placeholder'; label: string }

export interface ExerciseEntry {
  name: string
  demo: ExerciseDemo
}

/**
 * Normalize exercise name to slug
 * - lowercase, trim
 * - remove parentheses and content
 * - remove rep-count patterns (e.g., "20x", "3x10")
 * - remove punctuation
 * - map synonyms
 * - handle Norwegian characters
 * - convert to slug format
 */
export function normalizeExerciseName(name: string): string {
  // Step 1: Basic cleanup
  let normalized = name.toLowerCase().trim()

  // Step 2: Remove parentheses and content inside
  normalized = normalized.replace(/\([^)]*\)/g, '')

  // Step 3: Remove rep-count patterns (e.g., "20x", "3x10", "10 reps")
  normalized = normalized.replace(/\d+x\s*/g, '')
  normalized = normalized.replace(/\d+\s*x\s*\d+/g, '')
  normalized = normalized.replace(/\d+\s*reps?/gi, '')

  // Step 4: Remove punctuation
  normalized = normalized.replace(/[.,;:!?'"`]/g, '')

  // Step 5: Map synonyms
  const synonymMap: Record<string, string> = {
    'push-ups': 'pushup',
    'pushups': 'pushup',
    'push up': 'pushup',
    'pushup': 'pushup',
    'jumping-jacks': 'jumping-jack',
    'jumping jacks': 'jumping-jack',
    'jumping jack': 'jumping-jack',
    'mountain-climbers': 'mountain-climber',
    'mountain climbers': 'mountain-climber',
    'mountain climber': 'mountain-climber',
    'situps': 'situp',
    'sit-ups': 'situp',
    'sit up': 'situp',
    'situp': 'situp',
    'jump-rope': 'jump-rope',
    'jump rope': 'jump-rope',
    'rope': 'jump-rope',
    'squats': 'squat',
    'squat': 'squat',
    'air squat': 'squat',
    'lunges': 'lunge',
    'lunge': 'lunge',
    'burpees': 'burpee',
    'burpee': 'burpee',
    'sprint': 'sprint',
    'row': 'row',
    'rower': 'row',
    'plank': 'plank',
  }

  const mapped = synonymMap[normalized] || normalized

  // Step 6: Convert to slug
  return mapped
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[æåä]/g, 'a')
    .replace(/[øö]/g, 'o')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * @deprecated Use normalizeExerciseName instead
 */
export function normalizeToSlug(name: string): string {
  return normalizeExerciseName(name)
}

/**
 * Exercise Registry
 * Maps exercise slugs to placeholders
 */
export const exerciseRegistry: Record<string, ExerciseEntry> = {
  // Exercises with placeholders
  'squat': {
    name: 'Squats',
    demo: {
      kind: 'placeholder',
      label: 'Squats',
    },
  },
  'pushup': {
    name: 'Push-ups',
    demo: {
      kind: 'placeholder',
      label: 'Push-ups',
    },
  },
  'burpee': {
    name: 'Burpees',
    demo: {
      kind: 'placeholder',
      label: 'Burpees',
    },
  },
  'lunge': {
    name: 'Lunges',
    demo: {
      kind: 'placeholder',
      label: 'Lunges',
    },
  },
  'plank': {
    name: 'Plank',
    demo: {
      kind: 'placeholder',
      label: 'Plank',
    },
  },
  'jumping-jack': {
    name: 'Jumping Jacks',
    demo: {
      kind: 'placeholder',
      label: 'Jumping Jacks',
    },
  },
  'mountain-climber': {
    name: 'Mountain Climbers',
    demo: {
      kind: 'placeholder',
      label: 'Mountain Climbers',
    },
  },
  'situp': {
    name: 'Situps',
    demo: {
      kind: 'placeholder',
      label: 'Situps',
    },
  },
  'sprint': {
    name: 'Sprint',
    demo: {
      kind: 'placeholder',
      label: 'Sprint',
    },
  },
  'jump-rope': {
    name: 'Jump Rope',
    demo: {
      kind: 'placeholder',
      label: 'Jump Rope',
    },
  },
  'row': {
    name: 'Row',
    demo: {
      kind: 'placeholder',
      label: 'Row',
    },
  },

  // Placeholders for exercises without animations
  'hvile': {
    name: 'Hvile',
    demo: {
      kind: 'placeholder',
      label: 'Hvile',
    },
  },
  'stretching': {
    name: 'Stretching',
    demo: {
      kind: 'placeholder',
      label: 'Stretching',
    },
  },
  'lett-loping': {
    name: 'Lett løping',
    demo: {
      kind: 'placeholder',
      label: 'Lett løping',
    },
  },
  'dynamisk-stretching': {
    name: 'Dynamisk stretching',
    demo: {
      kind: 'placeholder',
      label: 'Dynamisk stretching',
    },
  },
  'aktivering': {
    name: 'Aktivering',
    demo: {
      kind: 'placeholder',
      label: 'Aktivering',
    },
  },
  'dynamisk-bevegelse': {
    name: 'Dynamisk bevegelse',
    demo: {
      kind: 'placeholder',
      label: 'Dynamisk bevegelse',
    },
  },
  'pull-ups': {
    name: 'Pull-ups',
    demo: {
      kind: 'placeholder',
      label: 'Pull-ups',
    },
  },
  'shoulder-press': {
    name: 'Shoulder press',
    demo: {
      kind: 'placeholder',
      label: 'Shoulder press',
    },
  },
  'deadlifts': {
    name: 'Deadlifts',
    demo: {
      kind: 'placeholder',
      label: 'Deadlifts',
    },
  },
  'russian-twists': {
    name: 'Russian twists',
    demo: {
      kind: 'placeholder',
      label: 'Russian twists',
    },
  },
  'lett-kardio': {
    name: 'Lett kardio',
    demo: {
      kind: 'placeholder',
      label: 'Lett kardio',
    },
  },
  'mobilitet': {
    name: 'Mobilitet',
    demo: {
      kind: 'placeholder',
      label: 'Mobilitet',
    },
  },
  'lett-bevegelse': {
    name: 'Lett bevegelse',
    demo: {
      kind: 'placeholder',
      label: 'Lett bevegelse',
    },
  },
  'hofteapning': {
    name: 'Hofteåpning',
    demo: {
      kind: 'placeholder',
      label: 'Hofteåpning',
    },
  },
  'ryggmobilitet': {
    name: 'Ryggmobilitet',
    demo: {
      kind: 'placeholder',
      label: 'Ryggmobilitet',
    },
  },
  'skulderbevegelse': {
    name: 'Skulderbevegelse',
    demo: {
      kind: 'placeholder',
      label: 'Skulderbevegelse',
    },
  },
  'ankelmobilitet': {
    name: 'Ankelmobilitet',
    demo: {
      kind: 'placeholder',
      label: 'Ankelmobilitet',
    },
  },
  'flow-sekvens-1': {
    name: 'Flow sekvens 1',
    demo: {
      kind: 'placeholder',
      label: 'Flow sekvens 1',
    },
  },
  'flow-sekvens-2': {
    name: 'Flow sekvens 2',
    demo: {
      kind: 'placeholder',
      label: 'Flow sekvens 2',
    },
  },
  'flow-sekvens-3': {
    name: 'Flow sekvens 3',
    demo: {
      kind: 'placeholder',
      label: 'Flow sekvens 3',
    },
  },
  'dyp-stretching': {
    name: 'Dyp stretching',
    demo: {
      kind: 'placeholder',
      label: 'Dyp stretching',
    },
  },
  'steady-pace-loping': {
    name: 'Steady pace løping',
    demo: {
      kind: 'placeholder',
      label: 'Steady pace løping',
    },
  },
  'lett-aktivitet': {
    name: 'Lett aktivitet',
    demo: {
      kind: 'placeholder',
      label: 'Lett aktivitet',
    },
  },
  'intensivt-arbeid': {
    name: 'Intensivt arbeid',
    demo: {
      kind: 'placeholder',
      label: 'Intensivt arbeid',
    },
  },
}

/**
 * Get exercise demo by name (normalized to slug)
 */
export function getExerciseDemo(exerciseName: string): ExerciseEntry | null {
  const slug = normalizeExerciseName(exerciseName)
  return exerciseRegistry[slug] || null
}

/**
 * Get all exercise names from templates (for dev logging)
 */
export function getAllExerciseNamesFromTemplates(): string[] {
  const { getAllTemplates } = require('@/lib/templates')
  const templates = getAllTemplates()
  const exerciseNames = new Set<string>()

  templates.forEach((template: any) => {
    template.blocks.forEach((block: any) => {
      block.steps.forEach((step: any) => {
        exerciseNames.add(step.title)
      })
    })
  })

  return Array.from(exerciseNames).sort()
}
