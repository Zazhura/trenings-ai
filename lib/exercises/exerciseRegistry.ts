/**
 * Exercise Demo Registry
 * Maps exercise names (normalized to slugs) to demo configurations
 */

export type ExerciseDemo =
  | { kind: 'lottie'; view: 'side'; lottieFile: string }
  | { kind: 'placeholder'; label: string }

export interface ExerciseEntry {
  name: string
  demo: ExerciseDemo
}

/**
 * Normalize exercise name to slug
 * - lowercase
 * - replace spaces with dashes
 * - handle Norwegian characters
 * - remove special characters
 * - map synonyms
 */
export function normalizeToSlug(name: string): string {
  // Map synonyms first
  const synonymMap: Record<string, string> = {
    'push-ups': 'pushup',
    'pushups': 'pushup',
    'jumping-jacks': 'jumping-jack',
    'jumping jacks': 'jumping-jack',
    'mountain-climbers': 'mountain-climber',
    'mountain climbers': 'mountain-climber',
    'situps': 'situp',
    'sit-ups': 'situp',
    'jump-rope': 'jump-rope',
    'jump rope': 'jump-rope',
    'squats': 'squat',
    'lunges': 'lunge',
    'burpees': 'burpee',
    'sprint': 'sprint',
    'row': 'row',
    'plank': 'plank',
  }

  const lowerName = name.toLowerCase().trim()
  const mapped = synonymMap[lowerName] || lowerName

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
 * Exercise Registry
 * Maps exercise slugs to Lottie animations or placeholders
 */
export const exerciseRegistry: Record<string, ExerciseEntry> = {
  // Exercises with Lottie side-view animations
  'squat': {
    name: 'Squats',
    demo: {
      kind: 'lottie',
      view: 'side',
      lottieFile: '/assets/exercises/squat_side.json',
    },
  },
  'pushup': {
    name: 'Push-ups',
    demo: {
      kind: 'lottie',
      view: 'side',
      lottieFile: '/assets/exercises/pushup_side.json',
    },
  },
  'burpee': {
    name: 'Burpees',
    demo: {
      kind: 'lottie',
      view: 'side',
      lottieFile: '/assets/exercises/burpee_side.json',
    },
  },
  'lunge': {
    name: 'Lunges',
    demo: {
      kind: 'lottie',
      view: 'side',
      lottieFile: '/assets/exercises/lunge_side.json',
    },
  },
  'plank': {
    name: 'Plank',
    demo: {
      kind: 'lottie',
      view: 'side',
      lottieFile: '/assets/exercises/plank_side.json',
    },
  },
  'jumping-jack': {
    name: 'Jumping Jacks',
    demo: {
      kind: 'lottie',
      view: 'side',
      lottieFile: '/assets/exercises/jumping_jack_side.json',
    },
  },
  'mountain-climber': {
    name: 'Mountain Climbers',
    demo: {
      kind: 'lottie',
      view: 'side',
      lottieFile: '/assets/exercises/mountain_climber_side.json',
    },
  },
  'situp': {
    name: 'Situps',
    demo: {
      kind: 'lottie',
      view: 'side',
      lottieFile: '/assets/exercises/situp_side.json',
    },
  },
  'sprint': {
    name: 'Sprint',
    demo: {
      kind: 'lottie',
      view: 'side',
      lottieFile: '/assets/exercises/sprint_side.json',
    },
  },
  'jump-rope': {
    name: 'Jump Rope',
    demo: {
      kind: 'lottie',
      view: 'side',
      lottieFile: '/assets/exercises/jump_rope_side.json',
    },
  },
  'row': {
    name: 'Row',
    demo: {
      kind: 'lottie',
      view: 'side',
      lottieFile: '/assets/exercises/row_side.json',
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
  const slug = normalizeToSlug(exerciseName)
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
