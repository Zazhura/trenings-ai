/**
 * Exercise types for Global Exercise Library
 */

export type ExerciseStatus = 'active' | 'archived'

export interface Exercise {
  id: string
  name: string // Primary name (English)
  aliases: string[] // Array of alternative names (Norwegian + English)
  category?: string // e.g., 'strength', 'cardio', 'mobility'
  equipment?: string // e.g., 'bodyweight', 'barbell', 'dumbbell'
  status: ExerciseStatus
  motion_asset_url?: string // URL to animated WebP (16:9 aspect ratio)
  video_asset_url?: string // Optional URL to MP4 video (H.264, muted/loop)
  poster_url?: string // Optional poster/still image for list views
  created_at: Date
  updated_at: Date
}

/**
 * Exercise media information
 */
export interface ExerciseMedia {
  type: 'motion' | 'video' | 'poster'
  url: string
  aspectRatio: '16:9'
}

/**
 * Exercise usage statistics
 */
export interface ExerciseUsage {
  exercise_id: string
  template_count: number
  step_count: number
}

