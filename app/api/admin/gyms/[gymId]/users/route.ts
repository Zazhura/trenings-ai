import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/admin'
import { getAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/admin/gyms/[gymId]/users
 * Get all users assigned to a gym
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { gymId: string } }
) {
  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = getAdminClient()

    // Get all user roles for this gym
    const { data: userRoles, error } = await adminClient
      .from('user_roles')
      .select('user_id, role, created_at')
      .eq('gym_id', params.gymId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching gym users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get user details for each user_id
    const userIds = userRoles?.map((ur) => ur.user_id) || []
    const users = []

    if (userIds.length > 0) {
      // Fetch user details from auth.users via admin client
      const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers()

      if (!authError && authUsers?.users) {
        for (const userRole of userRoles || []) {
          const authUser = authUsers.users.find((u) => u.id === userRole.user_id)
          if (authUser) {
            users.push({
              id: authUser.id,
              email: authUser.email,
              role: userRole.role,
              created_at: userRole.created_at,
            })
          }
        }
      }
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error in GET /api/admin/gyms/[gymId]/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/gyms/[gymId]/users
 * Assign a user to a gym with a role
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { gymId: string } }
) {
  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    if (!['coach', 'gym_admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be coach or gym_admin' },
        { status: 400 }
      )
    }

    const adminClient = getAdminClient()

    // Find user by email using admin API
    // Note: listUsers() might be paginated, so we need to handle that
    let user = null
    let page = 1
    const perPage = 1000

    while (!user) {
      const { data: authUsers, error: listError } = await adminClient.auth.admin.listUsers({
        page,
        perPage,
      })

      if (listError) {
        console.error('Error listing users:', listError)
        return NextResponse.json({ error: 'Failed to find user' }, { status: 500 })
      }

      if (!authUsers?.users || authUsers.users.length === 0) {
        break // No more users
      }

      user = authUsers.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

      if (user) {
        break // Found user
      }

      // If we got fewer users than perPage, we've reached the end
      if (authUsers.users.length < perPage) {
        break
      }

      page++
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found with that email' }, { status: 404 })
    }

    // Upsert user role
    const { data, error } = await adminClient
      .from('user_roles')
      .upsert(
        {
          user_id: user.id,
          gym_id: params.gymId,
          role: role,
        },
        {
          onConflict: 'user_id,gym_id,role',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Error upserting user role:', error)
      return NextResponse.json({ error: 'Failed to assign user' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: role,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/admin/gyms/[gymId]/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

