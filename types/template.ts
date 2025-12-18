/**
 * Template types matching PRD structure
 * Templates define the structure of training sessions with blocks and steps
 */

/**
 * Step kind determines how the step is displayed and what fields are used
 */
export type StepKind = 'reps' | 'time' | 'load' | 'note'

/**
 * Step within a block
 */
export interface Step {
  title: string
  duration?: number // Duration in milliseconds (for time kind)
  exercise_id?: string // Optional reference to global exercise library
  mediaUrl?: string // @deprecated - Use exercise_id instead. Kept for backward compatibility
  step_kind?: StepKind // Default: 'note'
  reps?: number // For reps kind
}

/**
 * Block mode determines how the block is displayed on the display screen
 */
export type BlockMode = 'follow_steps' | 'amrap' | 'emom' | 'for_time' | 'strength_sets'

/**
 * Block containing multiple steps
 */
export interface Block {
  name: string
  steps: Step[]
  block_mode?: BlockMode // Default: 'follow_steps'
  block_duration_seconds?: number | null // For AMRAP/EMOM/For Time modes
  block_sets?: number | null // For strength_sets mode
  block_rest_seconds?: number | null // For strength_sets mode (rest between sets)
}

/**
 * Complete template structure (for hardcoded templates)
 */
export interface Template {
  id: string
  name: string
  description?: string
  blocks: Block[]
}

/**
 * Database-backed template structure
 */
export interface DatabaseTemplate {
  id: string
  gym_id?: string // Optional: NULL for global demo templates, UUID for gym-specific templates
  name: string
  description?: string
  is_demo: boolean
  blocks: Block[]
  created_by?: string
  created_at: Date
  updated_at: Date
}

