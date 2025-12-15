/**
 * Role checking utilities for multi-tenant access control
 */

import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/user-role'

/**
 * Get all roles for the current user
 */
export async function getUserRoles(): Promise<UserRole[]> {
  const supabase = await createClient()
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
 * Check if user is platform admin
 */
export async function isPlatformAdmin(): Promise<boolean> {
  const roles = await getUserRoles()
  return roles.includes('platform_admin')
}

/**
 * Get gym IDs where user is gym_admin
 */
export async function getUserGymAdminGyms(): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('gym_id')
    .eq('user_id', user.id)
    .eq('role', 'gym_admin')

  if (error || !data) {
    return []
  }

  return data.map(r => r.gym_id).filter((id): id is string => id !== null)
}

/**
 * Get gym IDs where user is coach or gym_admin
 */
export async function getUserGymGyms(): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('gym_id')
    .eq('user_id', user.id)
    .in('role', ['gym_admin', 'coach'])

  if (error || !data) {
    return []
  }

  return data.map(r => r.gym_id).filter((id): id is string => id !== null)
}

/**
 * Check if user has access to a specific gym (as gym_admin or coach)
 */
export async function hasGymAccess(gymId: string): Promise<boolean> {
  const gymIds = await getUserGymGyms()
  return gymIds.includes(gymId)
}

/**
 * Check if user is gym_admin for a specific gym
 */
export async function isGymAdmin(gymId: string): Promise<boolean> {
  const supabase = await createClient()
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

