/**
 * Database operations for User Roles
 * Platform Admin: Full CRUD
 * Gym Admin: Invite coaches (insert coach roles for own gym)
 */

import { createClient } from '@/lib/supabase/client'
import type { UserRole, UserRoleRecord } from '@/types/user-role'

/**
 * Invite coach to gym - Gym Admin only
 * Note: This requires user_id, not email, because admin API is server-side only
 * For email-based invites, use an API route that calls this with user_id
 */
export async function inviteCoach(
  gymId: string,
  userId: string
): Promise<UserRoleRecord | null> {
  const supabase = createClient()

  // Check if role already exists
  const { data: existing } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .eq('gym_id', gymId)
    .eq('role', 'coach')
    .single()

  if (existing) {
    // Role already exists, return it
    return mapDbToUserRole(existing)
  }

  // Create new role
  const { data, error } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      gym_id: gymId,
      role: 'coach',
    })
    .select()
    .single()

  if (error) {
    console.error('Error inviting coach:', error)
    return null
  }

  return mapDbToUserRole(data)
}

/**
 * Get roles for a gym
 */
export async function getGymRoles(gymId: string): Promise<UserRoleRecord[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .eq('gym_id', gymId)
    .order('created_at')

  if (error) {
    console.error('Error fetching gym roles:', error)
    return []
  }

  return (data || []).map(mapDbToUserRole)
}

/**
 * Remove coach from gym - Gym Admin only
 */
export async function removeCoach(gymId: string, userId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('gym_id', gymId)
    .eq('user_id', userId)
    .eq('role', 'coach')

  if (error) {
    console.error('Error removing coach:', error)
    return false
  }

  return true
}

/**
 * Map database row to UserRoleRecord type
 */
function mapDbToUserRole(row: any): UserRoleRecord {
  return {
    id: row.id,
    user_id: row.user_id,
    gym_id: row.gym_id,
    role: row.role as UserRole,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  }
}

