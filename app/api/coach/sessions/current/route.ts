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
 * GET /api/coach/sessions/current
 * Get current active session for authenticated user's gym
 * Returns the most recent running/paused session, or null if none exists
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's gym slug
    const { data: gymData, error: gymError } = await supabase
      .from('user_roles')
      .select('gyms!inner(slug)')
      .eq('user_id', user.id)
      .in('role', ['gym_admin', 'coach'])
      .not('gym_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (gymError || !gymData) {
      return NextResponse.json(
        { error: 'User has no gym' },
        { status: 404 }
      )
    }

    const gymSlug = (gymData as any).gyms?.slug
    if (!gymSlug) {
      return NextResponse.json(
        { error: 'User gym not found' },
        { status: 404 }
      )
    }

    // Check if service role key is configured
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      console.error('[GET /api/coach/sessions/current] Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY - server configuration error' },
        { status: 500 }
      )
    }

    // Use admin client to bypass RLS and get current session
    const adminClient = getAdminClient()

    // Resolve gym_id from gym_slug
    const { data: gymLookupData, error: gymLookupError } = await adminClient
      .from('gyms')
      .select('id')
      .eq('slug', gymSlug)
      .maybeSingle()

    if (gymLookupError || !gymLookupData) {
      return NextResponse.json(
        { error: 'Gym not found' },
        { status: 404 }
      )
    }

    const gymId = (gymLookupData as any).id

    // Get most recent running/paused session for this gym
    const { data, error } = await adminClient
      .from('sessions')
      .select('*')
      .eq('gym_id', gymId)
      .in('status', ['running', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[GET /api/coach/sessions/current] Error fetching session:', error)
      return NextResponse.json(
        { error: 'Failed to fetch session', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({ session: null })
    }

    const sessionState = dbToSessionState(data)

    return NextResponse.json({ session: sessionState })
  } catch (error) {
    console.error('[GET /api/coach/sessions/current] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

