/**
 * Supabase admin client using service role key
 * This bypasses RLS and should ONLY be used in admin API routes
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

let adminClient: ReturnType<typeof createSupabaseClient> | null = null

/**
 * Get Supabase admin client (service role)
 * This bypasses RLS - use only in admin API routes with proper auth checks
 * 
 * Checks for service role key in this order:
 * 1. SUPABASE_SERVICE_ROLE_KEY (primary)
 * 2. NEXT_SUPABASE_SERVICE_ROLE_KEY (fallback)
 * 
 * Throws error if neither is found
 */
export function getAdminClient() {
  if (adminClient) {
    return adminClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Try primary key first, then fallback
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClient
}

