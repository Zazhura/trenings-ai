/**
 * Database operations for Gyms
 * Platform Admin can create/manage gyms
 */

import { createClient } from '@/lib/supabase/client'
import type { Gym } from '@/types/gym'

/**
 * Get all gyms
 */
export async function getAllGyms(): Promise<Gym[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gyms')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching gyms:', error)
    return []
  }

  return (data || []).map(mapDbToGym)
}

/**
 * Get gym by ID
 */
export async function getGymById(id: string): Promise<Gym | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gyms')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return mapDbToGym(data)
}

/**
 * Get gym by slug
 */
export async function getGymBySlug(slug: string): Promise<Gym | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gyms')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    return null
  }

  return mapDbToGym(data)
}

/**
 * Create gym - Platform Admin only
 */
export async function createGym(gym: {
  slug: string
  name: string
}): Promise<Gym | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gyms')
    .insert({
      slug: gym.slug,
      name: gym.name,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating gym:', error)
    return null
  }

  return mapDbToGym(data)
}

/**
 * Map database row to Gym type
 */
function mapDbToGym(row: any): Gym {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  }
}

