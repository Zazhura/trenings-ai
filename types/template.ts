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
  mediaUrl?: string // Optional media URL for exercise demo (e.g., image or gif)
}

/**
 * Block containing multiple steps
 */
export interface Block {
  name: string
  steps: Step[]
}

/**
 * Complete template structure
 */
export interface Template {
  id: string
  name: string
  description?: string
  blocks: Block[]
}

