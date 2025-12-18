/**
 * Ensure owner/coach membership for a user in a gym
 * Idempotent: only creates if missing, does nothing if already exists
 */

import { getAdminClient } from '@/lib/supabase/admin'

/**
 * Ensure user has coach or gym_admin role for a gym
 * If no role exists, creates gym_admin role (owner)
 * If role already exists, does nothing
 */
export async function ensureOwnerCoachMembership(
  userId: string,
  gymId: string
): Promise<{ created: boolean; role: string }> {
  const adminClient = getAdminClient()

  // Check if user already has a role for this gym
  const { data: existingRoles, error: checkError } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('gym_id', gymId)
    .in('role', ['gym_admin', 'coach'])
    .limit(1)
    .maybeSingle()

  if (checkError) {
    console.error('[ensureOwnerCoachMembership] Error checking existing roles:', checkError)
    throw new Error(`Failed to check existing roles: ${checkError.message}`)
  }

  // If role already exists, return early
  type RoleRow = { role?: string; [key: string]: unknown }
  if (existingRoles) {
    const roleRow = existingRoles as RoleRow
    return { created: false, role: roleRow.role || 'coach' }
  }

  // No role exists - create gym_admin role (owner)
  const { data: newRole, error: insertError } = await (adminClient
    .from('user_roles') as any)
    .insert({
      user_id: userId,
      gym_id: gymId,
      role: 'gym_admin', // Owner gets gym_admin role
    })
    .select('role')
    .single()

  if (insertError) {
    console.error('[ensureOwnerCoachMembership] Error creating role:', insertError)
    throw new Error(`Failed to create role: ${insertError.message}`)
  }

  const newRoleRow = newRole as RoleRow
  console.log('[ensureOwnerCoachMembership] Created gym_admin role', {
    userId,
    gymId,
    role: newRoleRow.role,
  })

  return { created: true, role: newRoleRow.role || 'gym_admin' }
}

