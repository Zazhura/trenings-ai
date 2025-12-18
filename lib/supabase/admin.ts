/**
 * Supabase admin client using service role key
 * This bypasses RLS and should ONLY be used in admin API routes
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

let adminClient: ReturnType<typeof createSupabaseClient> | null = null

/**
 * Get Supabase admin client (service role)
 * This bypasses RLS - use only in admin API routes with proper auth checks
 */
export function getAdminClient() {
  if (adminClient) {
    return adminClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClient
}

