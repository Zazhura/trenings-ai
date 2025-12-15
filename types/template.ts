/**
 * Template types matching PRD structure
 * Templates define the structure of training sessions with blocks and steps
 */

/**
 * Step within a block
 */
export interface Step {
  title: string
  duration: number // Duration in milliseconds
  exercise_id?: string // Optional reference to global exercise library
  mediaUrl?: string // @deprecated - Use exercise_id instead. Kept for backward compatibility
}

/**
 * Block containing multiple steps
 */
export interface Block {
  name: string
  steps: Step[]
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
  gym_id: string
  name: string
  description?: string
  is_demo: boolean
  blocks: Block[]
  created_by?: string
  created_at: Date
  updated_at: Date
}

