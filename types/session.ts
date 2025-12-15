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
}

/**
 * Step snapshot within block
 */
export interface StepSnapshot {
  title: string
  duration: number // Duration in milliseconds
  exercise_id?: string // Optional reference to global exercise library
  mediaUrl?: string // @deprecated - Use exercise_id instead. Kept for backward compatibility
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
  current_step_index: number
  step_end_time: Date | null // null when paused or stopped
  remaining_ms: number | null // null when running (use step_end_time instead)
  state_version: number // Incremented on each state update for optimistic locking
  template_snapshot: TemplateSnapshot
  created_at: Date
  updated_at: Date
}

