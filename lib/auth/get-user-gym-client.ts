/**
 * Client-side version of get-user-gym utilities
 * Uses client-side Supabase client
 */

import { createClient } from '@/lib/supabase/client'
import { getGymById } from '@/lib/gyms/db-operations'
import type { Gym } from '@/types/gym'

/**
 * Get user's primary gym (first gym they have access to) - Client version
 */
export async function getUserPrimaryGymClient(): Promise<Gym | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('gym_id')
    .eq('user_id', user.id)
    .in('role', ['gym_admin', 'coach'])

  if (error || !data || data.length === 0) {
    return null
  }

  const gymId = data[0].gym_id
  if (!gymId) {
    return null
  }

  return getGymById(gymId)
}

