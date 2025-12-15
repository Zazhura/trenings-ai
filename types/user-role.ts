/**
 * User role types for multi-tenant access control
 */

export type UserRole = 'platform_admin' | 'gym_admin' | 'coach'

export interface UserRoleRecord {
  id: string
  user_id: string
  gym_id: string | null // NULL for platform_admin
  role: UserRole
  created_at: Date
  updated_at: Date
}

