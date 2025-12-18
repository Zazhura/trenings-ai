/**
 * Admin authentication utilities
 * Checks for platform_admin role OR email allowlist (ADMIN_EMAILS env var)
 */

import { createClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from './roles'

/**
 * Check if user is admin (platform_admin role OR in ADMIN_EMAILS allowlist)
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || !user.email) {
    return false
  }

  // First check for platform_admin role
  const hasRole = await isPlatformAdmin()
  if (hasRole) {
    return true
  }

  // Fallback: check email allowlist
  const adminEmails = process.env.ADMIN_EMAILS
  if (adminEmails) {
    const emails = adminEmails.split(',').map(e => e.trim().toLowerCase())
    return emails.includes(user.email.toLowerCase())
  }

  return false
}

