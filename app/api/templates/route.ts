import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import type { DatabaseTemplate, Block } from '@/types/template'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/templates
 * Get templates for authenticated user's gym
 * Returns demo templates (global) and custom templates (gym-specific)
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Initialize admin client once per request
    const adminClient = getAdminClient()

    // Get user's gym ID using admin client
    const { data: userRolesData, error: rolesError } = await adminClient
      .from('user_roles')
      .select('gym_id, role')
      .eq('user_id', user.id)
      .in('role', ['gym_admin', 'coach'])
      .not('gym_id', 'is', null)
      .limit(1)

    // Cast result to avoid never[] type issue
    type UserRoleRow = { gym_id?: string; role?: string; [key: string]: unknown }
    const userRoles = (userRolesData ?? []) as UserRoleRow[]

    // Handle database errors gracefully
    if (rolesError) {
      console.error('[GET /api/templates] Error fetching user roles:', rolesError)
      return NextResponse.json(
        { error: 'Failed to fetch user gym information' },
        { status: 500 }
      )
    }

    // Handle missing gym gracefully - return empty arrays instead of error
    if (userRoles.length === 0) {
      return NextResponse.json({
        demo: [],
        own: [],
        all: [],
      })
    }

    const gymId = userRoles[0]?.gym_id
    if (!gymId || typeof gymId !== 'string') {
      return NextResponse.json({
        demo: [],
        own: [],
        all: [],
      })
    }

    // Get global demo templates (gym_id IS NULL, is_demo = true)
    const { data: demoTemplatesData, error: demoError } = await adminClient
      .from('templates')
      .select('*')
      .is('gym_id', null)
      .eq('is_demo', true)
      .order('created_at', { ascending: false })

    // Cast result to avoid never[] type issue
    type TemplateRow = { id?: string; gym_id?: string | null; name?: string; description?: string | null; blocks?: any; is_demo?: boolean; created_by?: string | null; created_at?: string; updated_at?: string; [key: string]: unknown }
    const demoTemplates = (demoTemplatesData ?? []) as TemplateRow[]

    if (demoError) {
      console.error('[GET /api/templates] Error fetching demo templates:', demoError)
      // Continue with empty array instead of failing
    }

    // Get gym-specific custom templates (gym_id = gymId, is_demo = false)
    const { data: ownTemplatesData, error: ownError } = await adminClient
      .from('templates')
      .select('*')
      .eq('gym_id', gymId)
      .eq('is_demo', false)
      .order('created_at', { ascending: false })

    // Cast result to avoid never[] type issue
    const ownTemplates = (ownTemplatesData ?? []) as TemplateRow[]

    if (ownError) {
      console.error('[GET /api/templates] Error fetching own templates:', ownError)
      // Continue with empty array instead of failing
    }

    // Map to DatabaseTemplate format - defensively handle missing/null fields
    const mapToTemplate = (row: any): DatabaseTemplate | null => {
      try {
        // Validate required fields
        if (!row.id || !row.name) {
          console.warn('[GET /api/templates] Skipping template with missing id or name:', row)
          return null
        }

        return {
          id: row.id,
          gym_id: row.gym_id || undefined,
          name: row.name,
          description: row.description || undefined,
          is_demo: row.is_demo || false,
          blocks: Array.isArray(row.blocks) ? (row.blocks as Block[]) : [],
          created_by: row.created_by || undefined,
          created_at: row.created_at ? new Date(row.created_at) : new Date(),
          updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
        }
      } catch (error) {
        console.error('[GET /api/templates] Error mapping template:', error, row)
        return null
      }
    }

    // Map templates and filter out nulls
    const demo = (demoTemplates || [])
      .map(mapToTemplate)
      .filter((t): t is DatabaseTemplate => t !== null)
    const own = (ownTemplates || [])
      .map(mapToTemplate)
      .filter((t): t is DatabaseTemplate => t !== null)
    const all = [...demo, ...own]

    return NextResponse.json({
      demo,
      own,
      all,
    })
  } catch (error) {
    console.error('[GET /api/templates] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/templates
 * Create a new template for authenticated user's gym
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Initialize admin client once per request
    const adminClient = getAdminClient()

    // Get user's gym ID using admin client
    const { data: userRolesData, error: rolesError } = await adminClient
      .from('user_roles')
      .select('gym_id, role')
      .eq('user_id', user.id)
      .in('role', ['gym_admin', 'coach'])
      .not('gym_id', 'is', null)
      .limit(1)

    // Cast result to avoid never[] type issue
    type UserRoleRow = { gym_id?: string; role?: string; [key: string]: unknown }
    const userRoles = (userRolesData ?? []) as UserRoleRow[]

    if (rolesError || userRoles.length === 0) {
      return NextResponse.json(
        { error: 'User has no gym' },
        { status: 404 }
      )
    }

    const gymId = userRoles[0]?.gym_id
    if (!gymId) {
      return NextResponse.json(
        { error: 'User has no gym' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, description, blocks } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      )
    }

    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
      return NextResponse.json(
        { error: 'Template must have at least one block' },
        { status: 400 }
      )
    }

    // Build insert payload with explicit type
    const insertPayload: Record<string, unknown> = {
      gym_id: gymId,
      name: name.trim(),
      description: description?.trim() || null,
      blocks: blocks as any, // JSONB
      is_demo: false,
      created_by: user.id,
    }

    // Use admin client to insert template
    const { data: templateData, error: insertError } = await (adminClient
      .from('templates') as any)
      .insert(insertPayload)
      .select()
      .single()

    // Cast result to avoid never type issue
    type TemplateResult = { id?: string; gym_id?: string | null; name?: string; description?: string | null; blocks?: any; is_demo?: boolean; created_by?: string | null; created_at?: string; updated_at?: string; [key: string]: unknown }
    const template = (templateData ?? {}) as TemplateResult

    if (insertError) {
      console.error('[POST /api/templates] Error creating template:', insertError)
      return NextResponse.json(
        { error: 'Failed to create template', details: insertError.message },
        { status: 500 }
      )
    }

    if (!template) {
      return NextResponse.json(
        { error: 'Template creation returned no data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      templateId: template.id,
      template: {
        id: template.id,
        gym_id: template.gym_id,
        name: template.name,
        description: template.description || undefined,
        is_demo: template.is_demo,
        blocks: template.blocks,
        created_by: template.created_by,
        created_at: template.created_at,
        updated_at: template.updated_at,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/templates] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

