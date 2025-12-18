import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { SessionStatus, SessionState, TemplateSnapshot } from '@/types/session'
import { createTemplateSnapshotFromDb } from '@/lib/templates/db-operations'
import type { DatabaseTemplate, Block } from '@/types/template'

export const dynamic = 'force-dynamic'

/**
 * Convert database row to SessionState
 */
function dbToSessionState(data: any): SessionState {
  return {
    id: data.id,
    gym_slug: data.gym_slug,
    status: data.status as SessionStatus,
    current_block_index: data.current_block_index,
    current_step_index: data.current_step_index ?? null,
    view_mode: data.view_mode || 'follow_steps',
    step_end_time: data.step_end_time ? new Date(data.step_end_time) : null,
    block_end_time: data.block_end_time ? new Date(data.block_end_time) : null,
    remaining_ms: data.remaining_ms,
    state_version: data.state_version,
    template_snapshot: data.template_snapshot as TemplateSnapshot,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  }
}

/**
 * POST /api/coach/sessions/start
 * Start a new session from a template
 * Requires authentication and user must have access to the gym
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { gymSlug, templateId, templateSnapshot } = body

    console.log('[POST /api/coach/sessions/start] Received request:', {
      gymSlug,
      templateId,
      hasTemplateSnapshot: !!templateSnapshot,
    })

    if (!gymSlug) {
      return NextResponse.json(
        { error: 'gymSlug is required' },
        { status: 400 }
      )
    }

    if (!templateId && !templateSnapshot) {
      return NextResponse.json(
        { error: 'Either templateId or templateSnapshot is required' },
        { status: 400 }
      )
    }

    // Resolve gym_id from gym_slug first (needed for template lookup)
    const adminClient = getAdminClient()
    const { data: gymData, error: gymError } = await adminClient
      .from('gyms')
      .select('id, slug')
      .eq('slug', gymSlug)
      .maybeSingle()

    if (gymError) {
      console.error('[POST /api/coach/sessions/start] Error resolving gym:', gymError)
      return NextResponse.json(
        { error: 'Failed to resolve gym', details: gymError.message },
        { status: 500 }
      )
    }

    if (!gymData) {
      return NextResponse.json(
        { error: `Gym not found with slug: ${gymSlug}` },
        { status: 404 }
      )
    }

    const gymId = (gymData as any).id
    const resolvedGymSlug = (gymData as any).slug || gymSlug

    console.log('[POST /api/coach/sessions/start] Resolved gym:', {
      gymSlug,
      resolvedGymSlug,
      gymId,
    })

    // Resolve template_snapshot: either fetch from DB or use provided snapshot
    let finalTemplateSnapshot: TemplateSnapshot

    if (templateId) {
      // Fetch template from database and create snapshot
      console.log('[POST /api/coach/sessions/start] Fetching template from database:', templateId)
      
      const { data: templateData, error: templateError } = await adminClient
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .maybeSingle()

      if (templateError) {
        console.error('[POST /api/coach/sessions/start] Error fetching template:', templateError)
        return NextResponse.json(
          { error: 'Failed to fetch template', details: templateError instanceof Error ? templateError.message : String(templateError) },
          { status: 500 }
        )
      }

      if (!templateData) {
        return NextResponse.json(
          { error: `Template not found with id: ${templateId}` },
          { status: 404 }
        )
      }

      // Map database row to DatabaseTemplate
      type TemplateRow = { id?: string; gym_id?: string | null; name?: string; description?: string | null; blocks?: any; is_demo?: boolean; created_by?: string | null; created_at?: string; updated_at?: string; [key: string]: unknown }
      const templateRow = templateData as TemplateRow
      
      const dbTemplate: DatabaseTemplate = {
        id: templateRow.id!,
        gym_id: templateRow.gym_id || undefined,
        name: templateRow.name!,
        description: templateRow.description || undefined,
        is_demo: templateRow.is_demo || false,
        blocks: Array.isArray(templateRow.blocks) ? (templateRow.blocks as Block[]) : [],
        created_by: templateRow.created_by || undefined,
        created_at: new Date(templateRow.created_at!),
        updated_at: new Date(templateRow.updated_at!),
      }

      // Validate template has blocks
      if (!dbTemplate.blocks || dbTemplate.blocks.length === 0) {
        return NextResponse.json(
          { error: 'Template must have at least one block' },
          { status: 400 }
        )
      }

      // Create snapshot from database template
      finalTemplateSnapshot = createTemplateSnapshotFromDb(dbTemplate)
      
      console.log('[POST /api/coach/sessions/start] Created snapshot from database template:', {
        templateId: dbTemplate.id,
        templateName: dbTemplate.name,
        blocksCount: finalTemplateSnapshot.blocks.length,
      })
    } else if (templateSnapshot) {
      // Use provided snapshot, but validate it has blocks
      if (!templateSnapshot.blocks || !Array.isArray(templateSnapshot.blocks) || templateSnapshot.blocks.length === 0) {
        return NextResponse.json(
          { error: 'Template snapshot must have at least one block' },
          { status: 400 }
        )
      }

      finalTemplateSnapshot = templateSnapshot as TemplateSnapshot
      
      console.log('[POST /api/coach/sessions/start] Using provided template snapshot:', {
        blocksCount: finalTemplateSnapshot.blocks.length,
      })
    } else {
      // This should never happen due to validation above, but TypeScript needs it
      return NextResponse.json(
        { error: 'Either templateId or templateSnapshot is required' },
        { status: 400 }
      )
    }

    // Validate final template snapshot has blocks (should already be validated above)
    if (!finalTemplateSnapshot.blocks || finalTemplateSnapshot.blocks.length === 0) {
      return NextResponse.json(
        { error: 'Template must have at least one block' },
        { status: 400 }
      )
    }

    const firstBlock = finalTemplateSnapshot.blocks[0]
    const viewMode = firstBlock.block_mode || 'follow_steps'
    const now = new Date()

    // Initialize state based on view_mode
    let currentStepIndex: number | null = null
    let stepEndTime: Date | null = null
    let blockEndTime: Date | null = null

    if (viewMode === 'follow_steps') {
      // follow_steps mode: requires at least one step
      if (!firstBlock.steps || firstBlock.steps.length === 0) {
        return NextResponse.json(
          { error: 'First block must have at least one step in follow_steps mode' },
          { status: 400 }
        )
      }

      currentStepIndex = 0
      const firstStep = firstBlock.steps[0]
      
      // Check if step is timed (step_kind == 'time' and duration exists)
      const stepKind = firstStep.step_kind || 'note'
      if (stepKind === 'time' && firstStep.duration && firstStep.duration > 0) {
        stepEndTime = new Date(now.getTime() + firstStep.duration)
      }
      // else: stepEndTime remains null (untimed step)
    } else {
      // Block modes (amrap/emom/for_time/strength_sets): no step index
      currentStepIndex = null
      
      // Check if block has duration
      if (firstBlock.block_duration_seconds && firstBlock.block_duration_seconds > 0) {
        blockEndTime = new Date(now.getTime() + firstBlock.block_duration_seconds * 1000)
      }
      // else: blockEndTime remains null (untimed block)
    }

    // Check if service role key is configured before calling getAdminClient()
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      console.error('[POST /api/coach/sessions/start] Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY - server configuration error' },
        { status: 500 }
      )
    }

    const insertPayload: Record<string, unknown> = {
      gym_id: gymId,
      gym_slug: resolvedGymSlug,
      status: SessionStatus.RUNNING,
      current_block_index: 0,
      current_step_index: currentStepIndex,
      view_mode: viewMode,
      step_end_time: stepEndTime ? stepEndTime.toISOString() : null,
      block_end_time: blockEndTime ? blockEndTime.toISOString() : null,
      remaining_ms: null, // null when running
      state_version: 1,
      template_snapshot: finalTemplateSnapshot,
    }

    console.log('[POST /api/coach/sessions/start] Inserting session with template snapshot:', {
      gymSlug: resolvedGymSlug,
      gymId,
      blocksCount: finalTemplateSnapshot.blocks.length,
      firstBlockName: finalTemplateSnapshot.blocks[0]?.name,
    })


    const { data, error } = await (adminClient
      .from('sessions') as any)
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.error('[POST /api/coach/sessions/start] Error starting session:', error)
      return NextResponse.json(
        { error: 'Failed to start session', details: error.message },
        { status: 500 }
      )
    }

    console.log('[POST /api/coach/sessions/start] Session created successfully:', {
      id: data.id,
      gym_slug: data.gym_slug,
      status: data.status,
    })

    // Convert database response to SessionState
    const sessionState = dbToSessionState(data)

    return NextResponse.json(sessionState, { status: 201 })
  } catch (error) {
    console.error('[POST /api/coach/sessions/start] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

