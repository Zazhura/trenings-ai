/**
 * Client-side role checking utilities
 */

import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types/user-role'

/**
 * Get all roles for the current user - Client version
 */
export async function getUserRolesClient(): Promise<UserRole[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  if (error || !data) {
    return []
  }

  return data.map(r => r.role as UserRole)
}

/**
 * Check if user is platform admin - Client version
 */
export async function isPlatformAdminClient(): Promise<boolean> {
  const roles = await getUserRolesClient()
  return roles.includes('platform_admin')
}

/**
 * Check if user is gym_admin for any gym - Client version
 */
export async function isAnyGymAdminClient(): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'gym_admin')
    .limit(1)

  return !error && !!data && data.length > 0
}

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

