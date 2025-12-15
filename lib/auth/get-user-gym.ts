/**
 * Get user's gym information
 * Returns the first gym the user has access to (gym_admin or coach role)
 */

import { getUserGymGyms } from './roles'
import { getGymById } from '@/lib/gyms/db-operations'
import type { Gym } from '@/types/gym'

/**
 * Get user's primary gym (first gym they have access to)
 */
export async function getUserPrimaryGym(): Promise<Gym | null> {
  const gymIds = await getUserGymGyms()
  
  if (gymIds.length === 0) {
    return null
  }

  // Return first gym
  return getGymById(gymIds[0])
}

/**
 * Get all gyms user has access to
 */
export async function getUserGyms(): Promise<Gym[]> {
  const gymIds = await getUserGymGyms()
  
  if (gymIds.length === 0) {
    return []
  }

  const gyms = await Promise.all(
    gymIds.map(id => getGymById(id))
  )

  return gyms.filter((gym): gym is Gym => gym !== null)
}

