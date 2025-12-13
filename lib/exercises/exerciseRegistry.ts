/**
 * Exercise Demo Registry
 * Maps exercise names (normalized to slugs) to demo configurations
 */

export type ExerciseDemo =
  | { kind: 'frames'; fps?: number; frames: string[] }
  | { kind: 'icon'; iconSvg: string }
  | { kind: 'text'; label: string }

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
 */
export function normalizeToSlug(name: string): string {
  return name
    .toLowerCase()
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
 * All exercises from templates should be represented here
 */
export const exerciseRegistry: Record<string, ExerciseEntry> = {
  // Common exercises with keyframe animations
  'squats': {
    name: 'Squats',
    demo: {
      kind: 'frames',
      fps: 2,
      frames: [
        // Standing
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
        // Mid-squat
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="80" r="20" fill="white"/><line x1="100" y1="100" x2="100" y2="220" stroke="white" stroke-width="4"/><line x1="100" y1="220" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="220" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
        // Deep squat
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="120" r="20" fill="white"/><line x1="100" y1="140" x2="100" y2="240" stroke="white" stroke-width="4"/><line x1="100" y1="240" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="240" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
        // Mid-squat (back up)
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="80" r="20" fill="white"/><line x1="100" y1="100" x2="100" y2="220" stroke="white" stroke-width="4"/><line x1="100" y1="220" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="220" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
      ],
    },
  },
  'push-ups': {
    name: 'Push-ups',
    demo: {
      kind: 'frames',
      fps: 2,
      frames: [
        // Up position
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="180" stroke="white" stroke-width="4"/><line x1="100" y1="180" x2="70" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="180" x2="130" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="180" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="180" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
        // Down position
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="80" r="20" fill="white"/><line x1="100" y1="100" x2="100" y2="210" stroke="white" stroke-width="4"/><line x1="100" y1="210" x2="70" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="210" x2="130" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="210" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="210" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
      ],
    },
  },
  'burpees': {
    name: 'Burpees',
    demo: {
      kind: 'frames',
      fps: 3,
      frames: [
        // Standing
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
        // Squat
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="20" fill="white"/><line x1="100" y1="120" x2="100" y2="240" stroke="white" stroke-width="4"/><line x1="100" y1="240" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="240" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
        // Plank
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="80" r="20" fill="white"/><line x1="100" y1="100" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
        // Jump up
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="40" r="20" fill="white"/><line x1="100" y1="60" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
      ],
    },
  },
  'lunges': {
    name: 'Lunges',
    demo: {
      kind: 'frames',
      fps: 2,
      frames: [
        // Standing
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
        // Lunge left
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="80" r="20" fill="white"/><line x1="100" y1="100" x2="100" y2="220" stroke="white" stroke-width="4"/><line x1="100" y1="220" x2="50" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="220" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
        // Standing
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
        // Lunge right
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="80" r="20" fill="white"/><line x1="100" y1="100" x2="100" y2="220" stroke="white" stroke-width="4"/><line x1="100" y1="220" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="220" x2="150" y2="280" stroke="white" stroke-width="4"/></svg>',
      ],
    },
  },
  'plank': {
    name: 'Plank',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="80" r="20" fill="white"/><line x1="100" y1="100" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
    },
  },
  'jumping-jacks': {
    name: 'Jumping Jacks',
    demo: {
      kind: 'frames',
      fps: 3,
      frames: [
        // Standing
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
        // Jump arms up
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="40" r="20" fill="white"/><line x1="100" y1="60" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="100" x2="60" y2="80" stroke="white" stroke-width="4"/><line x1="100" y1="100" x2="140" y2="80" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
        // Standing
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
      ],
    },
  },
  'mountain-climbers': {
    name: 'Mountain Climbers',
    demo: {
      kind: 'frames',
      fps: 4,
      frames: [
        // Plank position
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="80" r="20" fill="white"/><line x1="100" y1="100" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
        // Left leg up
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="80" r="20" fill="white"/><line x1="100" y1="100" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="240" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
        // Plank position
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="80" r="20" fill="white"/><line x1="100" y1="100" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
        // Right leg up
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="80" r="20" fill="white"/><line x1="100" y1="100" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="240" stroke="white" stroke-width="4"/></svg>',
      ],
    },
  },
  'situps': {
    name: 'Situps',
    demo: {
      kind: 'frames',
      fps: 2,
      frames: [
        // Lying down
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="200" r="20" fill="white"/><line x1="100" y1="220" x2="100" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="220" x2="70" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="220" x2="130" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="220" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="220" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
        // Sitting up
        '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="120" r="20" fill="white"/><line x1="100" y1="140" x2="100" y2="220" stroke="white" stroke-width="4"/><line x1="100" y1="220" x2="70" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="220" x2="130" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="220" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="220" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
      ],
    },
  },
  'sprint': {
    name: 'Sprint',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="100" x2="70" y2="120" stroke="white" stroke-width="4"/><line x1="100" y1="100" x2="130" y2="120" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
    },
  },
  'jump-rope': {
    name: 'Jump Rope',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/><path d="M 50 100 Q 100 80 150 100" stroke="white" stroke-width="3" fill="none"/></svg>',
    },
  },
  'row': {
    name: 'Row',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="80" r="20" fill="white"/><line x1="100" y1="100" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="120" x2="60" y2="140" stroke="white" stroke-width="4"/><line x1="100" y1="120" x2="140" y2="140" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
    },
  },

  // Fallback icons for all other exercises
  'lett-loping': {
    name: 'Lett løping',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
    },
  },
  'dynamisk-stretching': {
    name: 'Dynamisk stretching',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="150" x2="80" y2="130" stroke="white" stroke-width="3"/></svg>',
    },
  },
  'aktivering': {
    name: 'Aktivering',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
    },
  },
  'hvile': {
    name: 'Hvile',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="200" r="20" fill="white"/><line x1="100" y1="220" x2="100" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="220" x2="70" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="220" x2="130" y2="250" stroke="white" stroke-width="4"/><line x1="100" y1="220" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="220" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
    },
  },
  'stretching': {
    name: 'Stretching',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="150" x2="80" y2="130" stroke="white" stroke-width="3"/></svg>',
    },
  },
  'dynamisk-bevegelse': {
    name: 'Dynamisk bevegelse',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
    },
  },
  'pull-ups': {
    name: 'Pull-ups',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><line x1="100" y1="50" x2="100" y2="100" stroke="white" stroke-width="4"/><circle cx="100" cy="120" r="20" fill="white"/><line x1="100" y1="140" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
    },
  },
  'shoulder-press': {
    name: 'Shoulder press',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="80" r="20" fill="white"/><line x1="100" y1="100" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="120" x2="60" y2="100" stroke="white" stroke-width="4"/><line x1="100" y1="120" x2="140" y2="100" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
    },
  },
  'deadlifts': {
    name: 'Deadlifts',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="80" r="20" fill="white"/><line x1="100" y1="100" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/><rect x="80" y="220" width="40" height="10" fill="white"/></svg>',
    },
  },
  'russian-twists': {
    name: 'Russian twists',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="120" r="20" fill="white"/><line x1="100" y1="140" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/><circle cx="100" cy="100" r="15" fill="white"/></svg>',
    },
  },
  'lett-kardio': {
    name: 'Lett kardio',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
    },
  },
  'mobilitet': {
    name: 'Mobilitet',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
    },
  },
  'lett-bevegelse': {
    name: 'Lett bevegelse',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
    },
  },
  'hofteapning': {
    name: 'Hofteåpning',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="150" x2="80" y2="130" stroke="white" stroke-width="3"/></svg>',
    },
  },
  'ryggmobilitet': {
    name: 'Ryggmobilitet',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/><path d="M 100 150 Q 120 130 100 110" stroke="white" stroke-width="3" fill="none"/></svg>',
    },
  },
  'skulderbevegelse': {
    name: 'Skulderbevegelse',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="100" x2="70" y2="120" stroke="white" stroke-width="4"/><line x1="100" y1="100" x2="130" y2="120" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
    },
  },
  'ankelmobilitet': {
    name: 'Ankelmobilitet',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/><path d="M 70 280 Q 100 260 130 280" stroke="white" stroke-width="3" fill="none"/></svg>',
    },
  },
  'flow-sekvens-1': {
    name: 'Flow sekvens 1',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/><path d="M 100 150 Q 120 130 100 110 Q 80 130 100 150" stroke="white" stroke-width="3" fill="none"/></svg>',
    },
  },
  'flow-sekvens-2': {
    name: 'Flow sekvens 2',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/><path d="M 100 150 Q 120 130 100 110 Q 80 130 100 150" stroke="white" stroke-width="3" fill="none"/></svg>',
    },
  },
  'flow-sekvens-3': {
    name: 'Flow sekvens 3',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/><path d="M 100 150 Q 120 130 100 110 Q 80 130 100 150" stroke="white" stroke-width="3" fill="none"/></svg>',
    },
  },
  'dyp-stretching': {
    name: 'Dyp stretching',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="150" x2="80" y2="130" stroke="white" stroke-width="3"/></svg>',
    },
  },
  'steady-pace-loping': {
    name: 'Steady pace løping',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
    },
  },
  'lett-aktivitet': {
    name: 'Lett aktivitet',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
    },
  },
  'intensivt-arbeid': {
    name: 'Intensivt arbeid',
    demo: {
      kind: 'icon',
      iconSvg: '<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="50" r="20" fill="white"/><line x1="100" y1="70" x2="100" y2="200" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="70" y2="280" stroke="white" stroke-width="4"/><line x1="100" y1="200" x2="130" y2="280" stroke="white" stroke-width="4"/></svg>',
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

