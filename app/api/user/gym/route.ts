import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import type { Gym } from '@/types/gym'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/user/gym
 * Get user's primary gym - Authenticated users only
 * Uses service role to bypass RLS on user_roles table
 */
export async function GET(request: NextRequest) {
  try {
    // Use regular client for auth check only
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client (service role) to bypass RLS on user_roles
    const adminClient = getAdminClient()

    // Get gym IDs user has access to (bypasses RLS)
    const { data: userRoles, error: rolesError } = await adminClient
      .from('user_roles')
      .select('gym_id, role')
      .eq('user_id', user.id)
      .in('role', ['gym_admin', 'coach'])
      .not('gym_id', 'is', null)
      .limit(1)

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
      return NextResponse.json({ 
        error: 'Failed to fetch user roles', 
        details: rolesError.message,
        code: rolesError.code 
      }, { status: 500 })
    }

    if (!userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: 'No gym found for user' }, { status: 404 })
    }

    const gymId = (userRoles[0] as { gym_id: string; role: string }).gym_id
    if (!gymId) {
      return NextResponse.json({ error: 'No gym found' }, { status: 404 })
    }

    // Get gym details using admin client (bypasses RLS)
    const { data: gymData, error: gymError } = await adminClient
      .from('gyms')
      .select('*')
      .eq('id', gymId)
      .single()

    if (gymError) {
      console.error('Error fetching gym:', gymError)
      return NextResponse.json({ 
        error: 'Gym not found', 
        details: gymError.message,
        code: gymError.code 
      }, { status: 404 })
    }

    if (!gymData) {
      console.error('Gym data is null')
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    }

    const gym = {
      id: (gymData as any).id,
      slug: (gymData as any).slug,
      name: (gymData as any).name,
    }

    console.log('[api/user/gym] ok', { userId: user.id, gymId })

    return NextResponse.json({ gymId, gym })
  } catch (error) {
    console.error('Error in GET /api/user/gym:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

