/**
 * Client-side version of get-user-gym utilities
 * Uses API endpoint to avoid RLS issues
 */

import type { Gym } from '@/types/gym'

/**
 * Get user's primary gym (first gym they have access to) - Client version
 * Uses /api/user/gym endpoint to avoid RLS recursion issues
 */
export async function getUserPrimaryGymClient(): Promise<Gym | null> {
  try {
    const response = await fetch('/api/user/gym')
    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (!data.gym) {
      return null
    }

    // Map API response to Gym type
    return {
      id: data.gym.id,
      slug: data.gym.slug,
      name: data.gym.name,
      created_at: new Date(), // API doesn't return dates, use current date
      updated_at: new Date(),
    }
  } catch (error) {
    console.error('Error fetching user gym:', error)
    return null
  }
}

