/**
 * Database operations for Global Exercise Library
 * Platform Admin only can write, all authenticated users can read
 */

import { createClient } from '@/lib/supabase/client'
import type { Exercise, ExerciseStatus } from '@/types/exercise'

/**
 * Get all active exercises
 */
export async function getActiveExercises(): Promise<Exercise[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('status', 'active')
    .order('name')

  if (error) {
    console.error('Error fetching exercises:', error)
    return []
  }

  return (data || []).map(mapDbToExercise)
}

/**
 * Search exercises via API (for client-side use)
 */
export async function searchExercisesAPI(query: string): Promise<Exercise[]> {
  try {
    const response = await fetch(`/api/exercises?query=${encodeURIComponent(query)}`)
    if (!response.ok) {
      return []
    }
    const data = await response.json()
    return data.map((row: any) => ({
      ...row,
      created_at: new Date(row.created_at),
    }))
  } catch (error) {
    console.error('Error searching exercises via API:', error)
    return []
  }
}

/**
 * Get all exercises (including archived) - Platform Admin only
 */
export async function getAllExercises(): Promise<Exercise[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching all exercises:', error)
    return []
  }

  return (data || []).map(mapDbToExercise)
}

/**
 * Get exercise by ID
 */
export async function getExerciseById(id: string): Promise<Exercise | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return mapDbToExercise(data)
}

/**
 * Search exercises by name or aliases
 */
export async function searchExercises(query: string): Promise<Exercise[]> {
  const supabase = createClient()
  const normalizedQuery = query.toLowerCase().trim()

  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('status', 'active')
    .or(`name.ilike.%${normalizedQuery}%,aliases.cs.{${normalizedQuery}}`)
    .order('name')
    .limit(20)

  if (error) {
    console.error('Error searching exercises:', error)
    return []
  }

  return (data || []).map(mapDbToExercise)
}

/**
 * Auto-match exercise based on step title
 * Returns exercise with confidence score (0-1)
 */
export interface ExerciseMatch {
  exercise: Exercise
  confidence: number // 0-1, where 1 is exact match
}

export async function autoMatchExercise(stepTitle: string): Promise<ExerciseMatch | null> {
  const normalizedTitle = stepTitle.toLowerCase().trim()
  
  // Get all active exercises
  const exercises = await getActiveExercises()
  
  if (exercises.length === 0) {
    return null
  }

  let bestMatch: ExerciseMatch | null = null
  let bestScore = 0

  for (const exercise of exercises) {
    // Check exact match on name
    if (exercise.name.toLowerCase() === normalizedTitle) {
      return { exercise, confidence: 1.0 }
    }

    // Check exact match on aliases
    const aliasMatch = exercise.aliases.some(
      alias => alias.toLowerCase() === normalizedTitle
    )
    if (aliasMatch) {
      return { exercise, confidence: 0.9 }
    }

    // Check partial match on name
    const nameLower = exercise.name.toLowerCase()
    if (nameLower.includes(normalizedTitle) || normalizedTitle.includes(nameLower)) {
      const score = Math.min(nameLower.length, normalizedTitle.length) / Math.max(nameLower.length, normalizedTitle.length)
      if (score > bestScore) {
        bestScore = score
        bestMatch = { exercise, confidence: score * 0.7 }
      }
    }

    // Check partial match on aliases
    for (const alias of exercise.aliases) {
      const aliasLower = alias.toLowerCase()
      if (aliasLower.includes(normalizedTitle) || normalizedTitle.includes(aliasLower)) {
        const score = Math.min(aliasLower.length, normalizedTitle.length) / Math.max(aliasLower.length, normalizedTitle.length)
        if (score > bestScore) {
          bestScore = score
          bestMatch = { exercise, confidence: score * 0.6 }
        }
      }
    }
  }

  // Only return if confidence is above threshold
  return bestMatch && bestMatch.confidence > 0.5 ? bestMatch : null
}

/**
 * Create exercise - Platform Admin only
 */
export async function createExercise(exercise: Omit<Exercise, 'id' | 'created_at' | 'updated_at'>): Promise<Exercise | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercises')
    .insert({
      name: exercise.name,
      aliases: exercise.aliases || [],
      category: exercise.category || null,
      equipment: Array.isArray(exercise.equipment) ? exercise.equipment : [],
      description: exercise.description || null,
      video_url: exercise.video_url || null,
      media_svg_url: exercise.media_svg_url || null,
      status: exercise.status || 'active',
      motion_asset_url: exercise.motion_asset_url || null,
      video_asset_url: exercise.video_asset_url || null,
      poster_url: exercise.poster_url || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating exercise:', error)
    return null
  }

  return mapDbToExercise(data)
}

/**
 * Create exercise via API (for client-side use)
 */
export async function createExerciseAPI(exercise: {
  name: string
  aliases?: string[]
  category?: string
  equipment?: string[]
  description?: string
  video_url?: string
}): Promise<Exercise | null> {
  try {
    const response = await fetch('/api/exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exercise),
    })
    if (!response.ok) {
      const error = await response.json()
      console.error('Error creating exercise via API:', error)
      return null
    }
    const data = await response.json()
    return {
      ...data,
      created_at: new Date(data.created_at),
    }
  } catch (error) {
    console.error('Error creating exercise via API:', error)
    return null
  }
}

/**
 * Update exercise - Platform Admin only
 */
export async function updateExercise(id: string, updates: Partial<Exercise>): Promise<Exercise | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercises')
    .update({
      name: updates.name,
      aliases: updates.aliases,
      category: updates.category,
      equipment: updates.equipment,
      status: updates.status,
      motion_asset_url: updates.motion_asset_url,
      video_asset_url: updates.video_asset_url,
      poster_url: updates.poster_url,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating exercise:', error)
    return null
  }

  return mapDbToExercise(data)
}

/**
 * Map database row to Exercise type
 */
function mapDbToExercise(row: any): Exercise {
  return {
    id: row.id,
    name: row.name,
    aliases: row.aliases || [],
    category: row.category || null,
    equipment: Array.isArray(row.equipment) ? row.equipment : (row.equipment ? [row.equipment] : []),
    description: row.description || null,
    video_url: row.video_url || null,
    media_svg_url: row.media_svg_url || null,
    status: (row.status as ExerciseStatus) || 'active',
    motion_asset_url: row.motion_asset_url || undefined,
    video_asset_url: row.video_asset_url || undefined,
    poster_url: row.poster_url || undefined,
    created_at: new Date(row.created_at),
    updated_at: row.updated_at ? new Date(row.updated_at) : undefined,
  }
}

