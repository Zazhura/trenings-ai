import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/user/gym/[gymId]/is-admin
 * Check if user is gym_admin for a specific gym
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { gymId: string } }
) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client to check role
    const adminClient = getAdminClient()
    const { data: userRole, error: rolesError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('gym_id', params.gymId)
      .eq('role', 'gym_admin')
      .limit(1)

    if (rolesError) {
      console.error('Error checking gym admin:', rolesError)
      return NextResponse.json({ error: 'Failed to check role' }, { status: 500 })
    }

    const isGymAdmin = userRole && userRole.length > 0

    return NextResponse.json({ isGymAdmin })
  } catch (error) {
    console.error('Error in GET /api/user/gym/[gymId]/is-admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

