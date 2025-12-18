/**
 * Exercise types for Global Exercise Library
 */

export type ExerciseStatus = 'active' | 'archived'

export interface Exercise {
  id: string
  name: string // Primary name (English)
  aliases: string[] // Array of alternative names (Norwegian + English)
  category?: string | null // e.g., 'strength', 'cardio', 'mobility'
  equipment: string[] // Array of equipment types, e.g., ['bodyweight'], ['barbell'], ['dumbbell', 'kettlebell']
  description?: string | null
  video_url?: string | null // Optional URL to video
  media_svg_url?: string | null // Optional URL to SVG media
  status?: ExerciseStatus // Optional for backward compatibility
  motion_asset_url?: string // @deprecated - kept for backward compatibility
  video_asset_url?: string // @deprecated - kept for backward compatibility
  poster_url?: string // Optional poster/still image for list views
  created_at: Date
  updated_at?: Date
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

/**
 * Exercise with gym-specific information
 */
export interface GymExercise extends Exercise {
  is_enabled_in_gym?: boolean | null
  used_count_in_gym?: number
  last_used_at_in_gym?: string | null
  is_in_gym?: boolean
}

