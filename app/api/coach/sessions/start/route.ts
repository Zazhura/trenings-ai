import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { SessionStatus, SessionState, TemplateSnapshot } from '@/types/session'

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
    const { gymSlug, templateSnapshot } = body

    console.log('[POST /api/coach/sessions/start] Received request:', {
      gymSlug,
      templateId: templateSnapshot?.blocks?.[0]?.name || 'unknown',
      hasTemplateSnapshot: !!templateSnapshot,
    })

    if (!gymSlug || !templateSnapshot) {
      return NextResponse.json(
        { error: 'gymSlug and templateSnapshot are required' },
        { status: 400 }
      )
    }

    // Resolve gym_id from gym_slug
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

    // Validate template has blocks
    if (!templateSnapshot.blocks || templateSnapshot.blocks.length === 0) {
      return NextResponse.json(
        { error: 'Template must have at least one block' },
        { status: 400 }
      )
    }

    const firstBlock = templateSnapshot.blocks[0]
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
      template_snapshot: templateSnapshot,
    }

    console.log('[POST /api/coach/sessions/start] Inserting session with gym_slug:', gymSlug)

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

