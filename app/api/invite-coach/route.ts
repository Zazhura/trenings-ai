import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { inviteCoach } from '@/lib/user-roles/db-operations'
import { isGymAdmin } from '@/lib/auth/roles'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { gymId, userEmail } = body

    if (!gymId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing gymId or userEmail' },
        { status: 400 }
      )
    }

    // Check if user is gym admin
    const isAdmin = await isGymAdmin(gymId)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get user by email (list users and filter)
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      return NextResponse.json(
        { error: 'Failed to search for user' },
        { status: 500 }
      )
    }

    const targetUser = usersData.users.find(u => u.email === userEmail)

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userId = targetUser.id

    // Invite coach
    const result = await inviteCoach(gymId, userId)

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to invite coach' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, role: result })
  } catch (error) {
    console.error('Error inviting coach:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

