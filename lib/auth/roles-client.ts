/**
 * Client-side role checking utilities
 */

import { createClient } from '@/lib/supabase/client'

/**
 * Check if user is gym_admin for a specific gym - Client version
 */
export async function isGymAdminClient(gymId: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('gym_id', gymId)
    .eq('role', 'gym_admin')
    .single()

  return !error && !!data
}

