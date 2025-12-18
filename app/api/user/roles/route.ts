import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/user/roles
 * Get user roles - Authenticated users only
 * Uses admin client to bypass RLS
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client to get roles
    const adminClient = getAdminClient()
    const { data: userRoles, error: rolesError } = await adminClient
      .from('user_roles')
      .select('role, gym_id')
      .eq('user_id', user.id)

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
    }

    const roles = (userRoles || []).map((ur: any) => ur.role)
    const isPlatformAdmin = roles.includes('platform_admin')
    const isAnyGymAdmin = roles.some((r: string) => r === 'gym_admin')

    return NextResponse.json({
      roles,
      isPlatformAdmin,
      isAnyGymAdmin,
    })
  } catch (error) {
    console.error('Error in GET /api/user/roles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

