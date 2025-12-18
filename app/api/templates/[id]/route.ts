import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Type definitions for Supabase results
type TemplateRow = { id?: string; name?: string; gym_id?: string | null; description?: string | null; blocks?: unknown; is_demo?: boolean; created_by?: string | null; created_at?: string; updated_at?: string; [key: string]: unknown }
type TemplateCheckRow = { gym_id?: string | null; is_demo?: boolean; [key: string]: unknown }
type UserRoleRow = { gym_id?: string | null; role?: string; [key: string]: unknown }

/**
 * GET /api/templates/[id]
 * Get a single template by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templateId = params.id

    // Use admin client to bypass RLS
    const adminClient = getAdminClient()

    const { data: templateData, error } = await adminClient
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single()

    // Cast result to avoid never type issue
    const template = (templateData ?? null) as TemplateRow | null

    if (error || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: template.id,
      gym_id: template.gym_id || undefined,
      name: template.name,
      description: template.description || undefined,
      is_demo: template.is_demo || false,
      blocks: template.blocks,
      created_by: template.created_by || undefined,
      created_at: template.created_at,
      updated_at: template.updated_at,
    })
  } catch (error) {
    console.error('[GET /api/templates/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/templates/[id]
 * Update a template
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templateId = params.id
    const body = await request.json()
    const { name, description, blocks } = body

    // Use admin client to bypass RLS
    const adminClient = getAdminClient()

    // Check if template exists and user has permission (must be gym-specific, not demo)
    const { data: existingData, error: checkError } = await adminClient
      .from('templates')
      .select('gym_id, is_demo')
      .eq('id', templateId)
      .single()

    const existing = (existingData ?? null) as TemplateCheckRow | null

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    if (existing.is_demo) {
      return NextResponse.json(
        { error: 'Cannot update demo templates' },
        { status: 403 }
      )
    }

    // Get user's gym ID to verify ownership
    const { data: userRolesData, error: rolesError } = await adminClient
      .from('user_roles')
      .select('gym_id, role')
      .eq('user_id', user.id)
      .in('role', ['gym_admin', 'coach'])
      .not('gym_id', 'is', null)
      .limit(1)

    const userRoles = (userRolesData ?? []) as UserRoleRow[]

    if (rolesError || userRoles.length === 0) {
      return NextResponse.json(
        { error: 'User has no gym' },
        { status: 404 }
      )
    }

    const userGymId = userRoles[0]?.gym_id as string | null

    if (existing.gym_id !== userGymId) {
      return NextResponse.json(
        { error: 'Unauthorized to update this template' },
        { status: 403 }
      )
    }

    // Build update payload with explicit type
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (blocks !== undefined) updateData.blocks = blocks

    const { data: updatedData, error: updateError } = await (adminClient
      .from('templates') as any)
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single()

    const updated = (updatedData ?? null) as TemplateRow | null

    if (updateError || !updated) {
      console.error('[PATCH /api/templates/[id]] Error updating template:', updateError)
      return NextResponse.json(
        { error: 'Failed to update template', details: updateError?.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: updated.id,
      templateId: updated.id, // Also include templateId for consistency with POST
      gym_id: updated.gym_id || undefined,
      name: updated.name,
      description: updated.description || undefined,
      is_demo: updated.is_demo,
      blocks: updated.blocks,
      created_by: updated.created_by || undefined,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    })
  } catch (error) {
    console.error('[PATCH /api/templates/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/templates/[id]
 * Delete a template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templateId = params.id

    // Use admin client to bypass RLS
    const adminClient = getAdminClient()

    // Check if template exists and user has permission
    const { data: existingData, error: checkError } = await adminClient
      .from('templates')
      .select('gym_id, is_demo')
      .eq('id', templateId)
      .single()

    const existing = (existingData ?? null) as TemplateCheckRow | null

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    if (existing.is_demo) {
      return NextResponse.json(
        { error: 'Cannot delete demo templates' },
        { status: 403 }
      )
    }

    // Get user's gym ID to verify ownership
    const { data: userRolesData, error: rolesError } = await adminClient
      .from('user_roles')
      .select('gym_id, role')
      .eq('user_id', user.id)
      .in('role', ['gym_admin', 'coach'])
      .not('gym_id', 'is', null)
      .limit(1)

    const userRoles = (userRolesData ?? []) as UserRoleRow[]

    if (rolesError || userRoles.length === 0) {
      return NextResponse.json(
        { error: 'User has no gym' },
        { status: 404 }
      )
    }

    const userGymId = userRoles[0]?.gym_id as string | null

    if (existing.gym_id !== userGymId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this template' },
        { status: 403 }
      )
    }

    // Delete template
    const { error: deleteError } = await adminClient
      .from('templates')
      .delete()
      .eq('id', templateId)

    if (deleteError) {
      console.error('[DELETE /api/templates/[id]] Error deleting template:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete template', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/templates/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

