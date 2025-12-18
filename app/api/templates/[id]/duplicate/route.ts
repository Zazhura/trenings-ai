/**
 * API route: POST /api/templates/[id]/duplicate
 * Duplicates a template (creates a copy with " (kopi)" suffix)
 * Uses admin client to bypass RLS
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const templateId = params.id

    // Get user's gym ID using admin client
    const adminClient = getAdminClient()
    const { data: userRoles, error: rolesError } = await adminClient
      .from('user_roles')
      .select('gym_id, role')
      .eq('user_id', user.id)
      .in('role', ['gym_admin', 'coach'])
      .not('gym_id', 'is', null)
      .limit(1)

    if (rolesError || !userRoles || userRoles.length === 0) {
      return NextResponse.json(
        { error: 'User has no gym' },
        { status: 404 }
      )
    }

    const userGymId = (userRoles[0] as { gym_id: string; role: string }).gym_id
    if (!userGymId) {
      return NextResponse.json(
        { error: 'User has no gym' },
        { status: 404 }
      )
    }

    // Use admin client (already initialized above)

    const { data: original, error: readError } = await adminClient
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (readError || !original) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Create duplicate with " (kopi)" suffix
    const newName = `${original.name} (kopi)`

    // Insert new template using admin client
    // Duplicated templates always belong to user's gym (not global)
    const { data: duplicated, error: insertError } = await adminClient
      .from('templates')
      .insert({
        gym_id: userGymId, // Duplicated templates belong to user's gym
        name: newName,
        description: original.description || null,
        blocks: original.blocks, // JSONB
        is_demo: false, // Duplicated templates are not demo
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError || !duplicated) {
      console.error('[POST /api/templates/[id]/duplicate] Error duplicating template:', insertError)
      return NextResponse.json(
        { error: 'Failed to duplicate template', details: insertError?.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: duplicated.id,
      name: duplicated.name,
      gym_id: duplicated.gym_id,
    })
  } catch (error) {
    console.error('[POST /api/templates/[id]/duplicate] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


