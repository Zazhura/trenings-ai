/**
 * Session status enum matching PRD semantics
 */
export enum SessionStatus {
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ENDED = 'ended',
}

/**
 * Template snapshot stored in session state
 * Contains the full template structure at the time of session creation
 */
export interface TemplateSnapshot {
  blocks: BlockSnapshot[]
}

/**
 * Block snapshot within template
 */
export interface BlockSnapshot {
  name: string
  steps: StepSnapshot[]
  block_mode?: 'follow_steps' | 'amrap' | 'emom' | 'for_time' | 'strength_sets'
  block_duration_seconds?: number | null
  block_sets?: number | null
  block_rest_seconds?: number | null
}

/**
 * Step snapshot within block
 */
export interface StepSnapshot {
  title: string
  duration?: number // Duration in milliseconds (for time kind)
  exercise_id?: string // Optional reference to global exercise library
  mediaUrl?: string // @deprecated - Use exercise_id instead. Kept for backward compatibility
  step_kind?: 'reps' | 'time' | 'load' | 'note'
  reps?: number // For reps kind
  description?: string // Optional description/note
}

/**
 * Session state matching PRD semantics
 * Represents the current state of a training session
 */
export interface SessionState {
  id: string
  gym_slug: string
  status: SessionStatus
  current_block_index: number
  current_step_index: number | null // null when block_mode != follow_steps
  view_mode: 'follow_steps' | 'amrap' | 'emom' | 'for_time' | 'strength_sets' // Current block_mode
  step_end_time: Date | null // null when paused, stopped, or untimed step
  block_end_time: Date | null // null when paused, stopped, or untimed block
  remaining_ms: number | null // null when running (use step_end_time/block_end_time instead)
  state_version: number // Incremented on each state update for optimistic locking
  template_snapshot: TemplateSnapshot
  created_at: Date
  updated_at: Date
}

