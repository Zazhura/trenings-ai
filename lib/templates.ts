import { Template } from '@/types/template'
import { TemplateSnapshot } from '@/types/session'

/**
 * Hardcoded training templates
 * Each template contains blocks with steps, all durations are in milliseconds
 */

export const templates: Template[] = [
  {
    id: 'warmup-strength',
    name: 'Oppvarming + Styrke',
    description: 'Standard oppvarming etterfulgt av styrkeøkter',
    blocks: [
      {
        name: 'Oppvarming',
        steps: [
          { title: 'Lett løping', duration: 5 * 60 * 1000 }, // 5 minutter
          { title: 'Dynamisk stretching', duration: 3 * 60 * 1000 }, // 3 minutter
          { title: 'Aktivering', duration: 2 * 60 * 1000 }, // 2 minutter
        ],
      },
      {
        name: 'Styrke',
        steps: [
          { title: 'Squats', duration: 45 * 1000, mediaUrl: '/media/squats.svg' }, // 45 sekunder
          { title: 'Hvile', duration: 15 * 1000 }, // 15 sekunder
          { title: 'Squats', duration: 45 * 1000, mediaUrl: '/media/squats.gif' },
          { title: 'Hvile', duration: 15 * 1000 },
          { title: 'Squats', duration: 45 * 1000, mediaUrl: '/media/squats.gif' },
          { title: 'Hvile', duration: 15 * 1000 },
        ],
      },
      {
        name: 'Avslutning',
        steps: [
          { title: 'Stretching', duration: 5 * 60 * 1000 }, // 5 minutter
        ],
      },
    ],
  },
  {
    id: 'hiit-cardio',
    name: 'HIIT Cardio',
    description: 'Høyintensitet intervalltrening',
    blocks: [
      {
        name: 'Oppvarming',
        steps: [
          { title: 'Lett løping', duration: 3 * 60 * 1000 }, // 3 minutter
          { title: 'Dynamisk bevegelse', duration: 2 * 60 * 1000 }, // 2 minutter
        ],
      },
      {
        name: 'HIIT Intervaller',
        steps: [
          { title: 'Sprint', duration: 30 * 1000, mediaUrl: '/media/sprint.svg' }, // 30 sekunder
          { title: 'Hvile', duration: 30 * 1000 }, // 30 sekunder
          { title: 'Sprint', duration: 30 * 1000, mediaUrl: '/media/sprint.gif' },
          { title: 'Hvile', duration: 30 * 1000 },
          { title: 'Sprint', duration: 30 * 1000, mediaUrl: '/media/sprint.gif' },
          { title: 'Hvile', duration: 30 * 1000 },
          { title: 'Sprint', duration: 30 * 1000, mediaUrl: '/media/sprint.gif' },
          { title: 'Hvile', duration: 30 * 1000 },
          { title: 'Sprint', duration: 30 * 1000, mediaUrl: '/media/sprint.gif' },
          { title: 'Hvile', duration: 30 * 1000 },
        ],
      },
      {
        name: 'Avslutning',
        steps: [
          { title: 'Lett løping', duration: 3 * 60 * 1000 }, // 3 minutter
          { title: 'Stretching', duration: 5 * 60 * 1000 }, // 5 minutter
        ],
      },
    ],
  },
  {
    id: 'full-body',
    name: 'Fullkropp',
    description: 'Komplett fullkroppstrening',
    blocks: [
      {
        name: 'Oppvarming',
        steps: [
          { title: 'Lett kardio', duration: 5 * 60 * 1000 }, // 5 minutter
          { title: 'Mobilitet', duration: 3 * 60 * 1000 }, // 3 minutter
        ],
      },
      {
        name: 'Øvre kropp',
        steps: [
          { title: 'Push-ups', duration: 45 * 1000, mediaUrl: '/media/pushups.svg' }, // 45 sekunder
          { title: 'Hvile', duration: 15 * 1000 }, // 15 sekunder
          { title: 'Pull-ups', duration: 45 * 1000, mediaUrl: '/media/pullups.svg' },
          { title: 'Hvile', duration: 15 * 1000 },
          { title: 'Shoulder press', duration: 45 * 1000, mediaUrl: '/media/shoulder-press.svg' },
          { title: 'Hvile', duration: 15 * 1000 },
        ],
      },
      {
        name: 'Nedre kropp',
        steps: [
          { title: 'Squats', duration: 45 * 1000, mediaUrl: '/media/squats.svg' }, // 45 sekunder
          { title: 'Hvile', duration: 15 * 1000 }, // 15 sekunder
          { title: 'Lunges', duration: 45 * 1000, mediaUrl: '/media/lunges.svg' },
          { title: 'Hvile', duration: 15 * 1000 },
          { title: 'Deadlifts', duration: 45 * 1000, mediaUrl: '/media/deadlifts.svg' },
          { title: 'Hvile', duration: 15 * 1000 },
        ],
      },
      {
        name: 'Kjerne',
        steps: [
          { title: 'Plank', duration: 60 * 1000, mediaUrl: '/media/plank.svg' }, // 60 sekunder
          { title: 'Hvile', duration: 30 * 1000 }, // 30 sekunder
          { title: 'Russian twists', duration: 45 * 1000, mediaUrl: '/media/russian-twists.svg' },
          { title: 'Hvile', duration: 15 * 1000 },
        ],
      },
      {
        name: 'Avslutning',
        steps: [
          { title: 'Stretching', duration: 5 * 60 * 1000 }, // 5 minutter
        ],
      },
    ],
  },
  {
    id: 'mobility-flow',
    name: 'Mobilitet og Flow',
    description: 'Fokus på mobilitet og flytende bevegelser',
    blocks: [
      {
        name: 'Oppvarming',
        steps: [
          { title: 'Lett bevegelse', duration: 3 * 60 * 1000 }, // 3 minutter
        ],
      },
      {
        name: 'Mobilitet',
        steps: [
          { title: 'Hofteåpning', duration: 2 * 60 * 1000 }, // 2 minutter
          { title: 'Ryggmobilitet', duration: 2 * 60 * 1000 }, // 2 minutter
          { title: 'Skulderbevegelse', duration: 2 * 60 * 1000 }, // 2 minutter
          { title: 'Ankelmobilitet', duration: 2 * 60 * 1000 }, // 2 minutter
        ],
      },
      {
        name: 'Flow',
        steps: [
          { title: 'Flow sekvens 1', duration: 3 * 60 * 1000 }, // 3 minutter
          { title: 'Flow sekvens 2', duration: 3 * 60 * 1000 }, // 3 minutter
          { title: 'Flow sekvens 3', duration: 3 * 60 * 1000 }, // 3 minutter
        ],
      },
      {
        name: 'Avslutning',
        steps: [
          { title: 'Dyp stretching', duration: 5 * 60 * 1000 }, // 5 minutter
        ],
      },
    ],
  },
  {
    id: 'endurance',
    name: 'Utholdenhet',
    description: 'Langvarig utholdenhetstrening',
    blocks: [
      {
        name: 'Oppvarming',
        steps: [
          { title: 'Lett løping', duration: 5 * 60 * 1000 }, // 5 minutter
        ],
      },
      {
        name: 'Hovedøkt',
        steps: [
          { title: 'Steady pace løping', duration: 20 * 60 * 1000 }, // 20 minutter
          { title: 'Hvile', duration: 2 * 60 * 1000 }, // 2 minutter
          { title: 'Steady pace løping', duration: 15 * 60 * 1000 }, // 15 minutter
        ],
      },
      {
        name: 'Avslutning',
        steps: [
          { title: 'Lett løping', duration: 3 * 60 * 1000 }, // 3 minutter
          { title: 'Stretching', duration: 5 * 60 * 1000 }, // 5 minutter
        ],
      },
    ],
  },
  {
    id: 'tabata',
    name: 'Tabata',
    description: 'Klassisk Tabata-intervalltrening',
    blocks: [
      {
        name: 'Oppvarming',
        steps: [
          { title: 'Lett aktivitet', duration: 3 * 60 * 1000 }, // 3 minutter
        ],
      },
      {
        name: 'Tabata Runde 1',
        steps: [
          { title: 'Intensivt arbeid', duration: 20 * 1000, mediaUrl: '/media/burpees.svg' }, // 20 sekunder
          { title: 'Hvile', duration: 10 * 1000 }, // 10 sekunder
          { title: 'Intensivt arbeid', duration: 20 * 1000, mediaUrl: '/media/burpees.gif' },
          { title: 'Hvile', duration: 10 * 1000 },
          { title: 'Intensivt arbeid', duration: 20 * 1000, mediaUrl: '/media/burpees.gif' },
          { title: 'Hvile', duration: 10 * 1000 },
          { title: 'Intensivt arbeid', duration: 20 * 1000, mediaUrl: '/media/burpees.gif' },
          { title: 'Hvile', duration: 10 * 1000 },
        ],
      },
      {
        name: 'Tabata Runde 2',
        steps: [
          { title: 'Intensivt arbeid', duration: 20 * 1000 }, // 20 sekunder
          { title: 'Hvile', duration: 10 * 1000 }, // 10 sekunder
          { title: 'Intensivt arbeid', duration: 20 * 1000 },
          { title: 'Hvile', duration: 10 * 1000 },
          { title: 'Intensivt arbeid', duration: 20 * 1000 },
          { title: 'Hvile', duration: 10 * 1000 },
          { title: 'Intensivt arbeid', duration: 20 * 1000 },
          { title: 'Hvile', duration: 10 * 1000 },
        ],
      },
      {
        name: 'Avslutning',
        steps: [
          { title: 'Stretching', duration: 5 * 60 * 1000 }, // 5 minutter
        ],
      },
    ],
  },
]

/**
 * Get template by ID
 */
export function getTemplateById(id: string): Template | undefined {
  return templates.find((t) => t.id === id)
}

/**
 * Get all templates
 */
export function getAllTemplates(): Template[] {
  return templates
}

/**
 * Create template snapshot from template
 * Serializes template to JSON format for storage in session
 * Includes all block and step fields for proper display handling
 */
export function createTemplateSnapshot(template: Template): TemplateSnapshot {
  return {
    blocks: template.blocks.map((block) => ({
      name: block.name,
      block_mode: block.block_mode || 'follow_steps', // Default to follow_steps
      block_duration_seconds: block.block_duration_seconds ?? null,
      block_sets: block.block_sets ?? null,
      block_rest_seconds: block.block_rest_seconds ?? null,
      steps: block.steps.map((step) => ({
        title: step.title,
        duration: step.duration ?? undefined, // Duration in milliseconds (for time kind)
        exercise_id: step.exercise_id ?? undefined,
        mediaUrl: step.mediaUrl ?? undefined, // @deprecated - backward compatibility
        step_kind: step.step_kind ?? 'note', // Default to note
        reps: step.reps ?? undefined, // For reps kind
      })),
    })),
  }
}

