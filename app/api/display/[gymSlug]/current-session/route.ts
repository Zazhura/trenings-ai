import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { SessionState, SessionStatus, TemplateSnapshot } from '@/types/session'

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
 * GET /api/display/[gymSlug]/current-session
 * Returns current active session state for a gym_slug
 * Uses admin client for read-only access (bypasses RLS)
 * Returns null if no active session exists
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { gymSlug: string } }
) {
  try {
    const { gymSlug } = params

    if (!gymSlug) {
      return NextResponse.json(
        { error: 'gymSlug is required' },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    // Get most recent running/paused session for this gym
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('gym_slug', gymSlug)
      .in('status', ['running', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching current session:', error)
      return NextResponse.json(
        { error: 'Failed to fetch session' },
        { status: 500 }
      )
    }

    // No active session found
    if (!data) {
      return NextResponse.json(null)
    }

    // Convert to SessionState and return
    const sessionState = dbToSessionState(data)
    
    // Return as JSON (dates will be serialized as ISO strings)
    return NextResponse.json(sessionState)
  } catch (error) {
    console.error('Unexpected error in current-session endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

