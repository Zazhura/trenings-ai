import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { SessionState, SessionStatus, TemplateSnapshot } from '@/types/session'

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

    // Check if service role key is configured before calling getAdminClient()
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      console.error('[current-session] Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY - server configuration error' },
        { status: 500 }
      )
    }

    const supabase = getAdminClient()

    const nowIso = new Date().toISOString()
    const expectedStatuses = ['running', 'paused']

    // Debug: Get latest session for this gym_slug (without status filter) to see what exists
    type LatestSessionRow = { id?: string; status?: string; gym_slug?: string; created_at?: string; [key: string]: unknown }
    const { data: latestSessionData, error: latestError } = await supabase
      .from('sessions')
      .select('id, status, gym_slug, created_at')
      .eq('gym_slug', gymSlug)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    const latestSession = latestSessionData ? (latestSessionData as LatestSessionRow) : null

    // Get most recent running/paused session for this gym
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('gym_slug', gymSlug)
      .in('status', expectedStatuses)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[current-session] Error fetching current session:', error)
      return NextResponse.json(
        { 
          error: 'Failed to fetch session',
          debug: {
            gymSlug,
            nowIso,
            expectedStatuses,
            queryError: error.message,
            latestSession: latestSession ? {
              id: latestSession.id,
              status: latestSession.status,
              gym_slug: latestSession.gym_slug,
              created_at: latestSession.created_at,
            } : null,
          }
        },
        { status: 500 }
      )
    }

    // No active session found - return debug info
    if (!data) {
      return NextResponse.json({
        session: null,
        debug: {
          gymSlug,
          nowIso,
          expectedStatuses,
          queryTable: 'sessions',
          queryFilter: `gym_slug = '${gymSlug}' AND status IN (${expectedStatuses.join(', ')})`,
          latestSession: latestSession ? {
            id: latestSession.id,
            status: latestSession.status,
            gym_slug: latestSession.gym_slug,
            created_at: latestSession.created_at,
          } : null,
        }
      })
    }

    // Convert to SessionState and return
    const sessionState = dbToSessionState(data)
    
    // Return as JSON with debug info (dates will be serialized as ISO strings)
    return NextResponse.json({
      session: sessionState,
      debug: {
        gymSlug,
        nowIso,
        expectedStatuses,
        queryTable: 'sessions',
        queryFilter: `gym_slug = '${gymSlug}' AND status IN (${expectedStatuses.join(', ')})`,
        latestSession: latestSession ? {
          id: latestSession.id,
          status: latestSession.status,
          gym_slug: latestSession.gym_slug,
          created_at: latestSession.created_at,
        } : null,
      }
    })
  } catch (error) {
    console.error('Unexpected error in current-session endpoint:', error)
    
    // Check if error is about missing service role key
    if (error instanceof Error && error.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY - server configuration error' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

