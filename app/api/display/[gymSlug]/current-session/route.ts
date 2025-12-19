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
    // Try primary key first, then fallback
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
    const serviceKeyPresent = !!serviceRoleKey
    const usingServiceRole = serviceKeyPresent
    
    if (!serviceKeyPresent) {
      console.error('[current-session] Missing SUPABASE_SERVICE_ROLE_KEY and NEXT_SUPABASE_SERVICE_ROLE_KEY environment variables')
      return NextResponse.json(
        { 
          error: 'Missing SUPABASE_SERVICE_ROLE_KEY - server configuration error',
          debug: {
            serviceKeyPresent: false,
            usingServiceRole: false,
            supabaseUrlHost: process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null,
          }
        },
        { status: 500 }
      )
    }

    const supabase = getAdminClient()
    const supabaseUrlHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null

    const nowIso = new Date().toISOString()
    const expectedStatuses = ['running', 'paused']

    console.log('[GET /api/display/[gymSlug]/current-session] Querying for gym_slug:', gymSlug, {
      serviceKeyPresent,
      usingServiceRole,
      supabaseUrlHost,
    })

    // Resolve gym_id from gym_slug
    type GymRow = { id?: string; slug?: string; [key: string]: unknown }
    const { data: gymData, error: gymError } = await supabase
      .from('gyms')
      .select('id, slug')
      .eq('slug', gymSlug)
      .maybeSingle()

    if (gymError) {
      console.error('[current-session] Error resolving gym:', gymError)
      return NextResponse.json(
        {
          error: 'Failed to resolve gym',
          debug: {
            serviceKeyPresent,
            usingServiceRole,
            supabaseUrlHost,
            gymSlug,
            gymError: {
              message: gymError.message,
              code: gymError.code,
              details: gymError.details,
            },
          }
        },
        { status: 500 }
      )
    }

    const gym = gymData ? (gymData as GymRow) : null
    const gymId = gym?.id

    console.log('[GET /api/display/[gymSlug]/current-session] Resolved gym:', {
      gymSlug,
      gymId,
      gymSlugFromDb: gym?.slug,
      serviceKeyPresent,
      usingServiceRole,
      supabaseUrlHost,
    })

    // SANITY CHECK: Try to fetch specific known session ID to verify DB access
    const knownSessionId = 'e28af78e-b123-4942-a6aa-074448204464'
    type SanityCheckRow = { id?: string; status?: string; gym_id?: string; gym_slug?: string; [key: string]: unknown }
    const { data: sanityCheckData, error: sanityCheckError } = await supabase
      .from('sessions')
      .select('id, status, gym_id, gym_slug')
      .eq('id', knownSessionId)
      .maybeSingle()
    
    const sanityCheckRow = sanityCheckData ? (sanityCheckData as SanityCheckRow) : null
    const sanityCheckFound = !!sanityCheckRow
    console.log('[GET /api/display/[gymSlug]/current-session] Sanity check:', {
      knownSessionId,
      sanityCheckFound,
      sanityCheckError: sanityCheckError ? {
        message: sanityCheckError.message,
        code: sanityCheckError.code,
      } : null,
      sanityCheckData: sanityCheckRow ? {
        id: sanityCheckRow.id,
        status: sanityCheckRow.status,
        gym_id: sanityCheckRow.gym_id,
        gym_slug: sanityCheckRow.gym_slug,
      } : null,
    })

    // Debug: Get latest session for this gym (without status filter) to see what exists
    type LatestSessionRow = { id?: string; status?: string; gym_id?: string; gym_slug?: string; created_at?: string; [key: string]: unknown }
    
    // Try querying by gym_id first, fallback to gym_slug if gym_id is null
    let latestQuery = supabase
      .from('sessions')
      .select('id, status, gym_id, gym_slug, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (gymId) {
      latestQuery = latestQuery.eq('gym_id', gymId)
    } else {
      latestQuery = latestQuery.eq('gym_slug', gymSlug)
    }
    
    const { data: latestSessionData, error: latestError } = await latestQuery.maybeSingle()
    
    if (latestError) {
      console.error('[current-session] Error fetching latest session:', latestError)
      return NextResponse.json(
        {
          error: 'Failed to fetch latest session',
          debug: {
            serviceKeyPresent,
            usingServiceRole,
            supabaseUrlHost,
            gymId: gymId || null,
            gymSlug,
            latestError: {
              message: latestError.message,
              code: latestError.code,
              details: latestError.details,
            },
            sanityCheckFound,
          }
        },
        { status: 500 }
      )
    }
    
    const latestSession = latestSessionData ? (latestSessionData as LatestSessionRow) : null

    // Debug: Verify admin client can see sessions (count all sessions for this gym)
    let totalSessionsCount: number | null = null
    if (gymId) {
      const { count, error: countError } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', gymId)
      
      if (countError) {
        console.error('[current-session] Error counting sessions:', countError)
      } else {
        totalSessionsCount = count
      }
      
      console.log('[GET /api/display/[gymSlug]/current-session] Admin client verification:', {
        gymId,
        totalSessionsCount,
        usingServiceRole,
        countError: countError ? {
          message: countError.message,
          code: countError.code,
        } : null,
      })
    }

    // Get most recent running/paused session for this gym
    // Try gym_id first, fallback to gym_slug
    // IMPORTANT: Log the exact status filter values being sent
    console.log('[GET /api/display/[gymSlug]/current-session] Building query with status filter:', {
      expectedStatuses,
      statusFilterValues: expectedStatuses, // Explicit logging
      gymId: gymId || null,
      gymSlug,
    })
    
    let sessionQuery = supabase
      .from('sessions')
      .select('*')
      .in('status', expectedStatuses)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (gymId) {
      sessionQuery = sessionQuery.eq('gym_id', gymId)
    } else {
      sessionQuery = sessionQuery.eq('gym_slug', gymSlug)
    }
    
    const { data, error, count } = await sessionQuery.maybeSingle()

    // Log actual query result
    type SessionRow = { id?: string; status?: string; gym_id?: string; gym_slug?: string; [key: string]: unknown }
    const sessionRow = data ? (data as SessionRow) : null
    const actualResultCount = sessionRow ? 1 : 0
    console.log('[GET /api/display/[gymSlug]/current-session] Query result:', {
      actualResultCount,
      hasData: !!sessionRow,
      dataId: sessionRow?.id || null,
      dataStatus: sessionRow?.status || null,
      dataGymId: sessionRow?.gym_id || null,
      dataGymSlug: sessionRow?.gym_slug || null,
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
      } : null,
    })

    if (error) {
      console.error('[current-session] Error fetching current session:', error)
      return NextResponse.json(
        { 
          error: 'Failed to fetch session',
          debug: {
            serviceKeyPresent,
            usingServiceRole,
            supabaseUrlHost,
            gymId: gymId || null,
            gymSlug,
            nowIso,
            expectedStatuses,
            statusFilterValues: expectedStatuses,
            actualResultCount,
            queryError: {
              message: error.message,
              code: error.code,
              details: error.details,
            },
            latestSession: latestSession ? {
              id: latestSession.id,
              status: latestSession.status,
              gym_id: latestSession.gym_id,
              gym_slug: latestSession.gym_slug,
              created_at: latestSession.created_at,
            } : null,
            sanityCheckFound,
            totalSessionsCount,
          }
        },
        { status: 500 }
      )
    }

    // No active session found - return 500 with debug info (fail-fast, don't return 200 null)
    if (!sessionRow) {
      console.error('[GET /api/display/[gymSlug]/current-session] No active session found but query succeeded', {
        gymSlug,
        gymId,
        expectedStatuses,
        statusFilterValues: expectedStatuses,
        actualResultCount,
        latestSession: latestSession ? {
          id: latestSession.id,
          status: latestSession.status,
          gym_slug: latestSession.gym_slug,
        } : null,
        sanityCheckFound,
        totalSessionsCount,
      })
      
      return NextResponse.json(
        {
          error: 'No active session found',
          debug: {
            serviceKeyPresent,
            usingServiceRole,
            supabaseUrlHost,
            gymId: gymId || null,
            gymSlug,
            nowIso,
            expectedStatuses,
            statusFilterValues: expectedStatuses,
            actualResultCount,
            queryTable: 'sessions',
            queryFilter: gymId 
              ? `gym_id = '${gymId}' AND status IN (${expectedStatuses.map(s => `'${s}'`).join(', ')})`
              : `gym_slug = '${gymSlug}' AND status IN (${expectedStatuses.map(s => `'${s}'`).join(', ')})`,
            latestSession: latestSession ? {
              id: latestSession.id,
              status: latestSession.status,
              gym_id: latestSession.gym_id,
              gym_slug: latestSession.gym_slug,
              created_at: latestSession.created_at,
            } : null,
            sanityCheckFound,
            totalSessionsCount,
          }
        },
        { status: 500 }
      )
    }

    // Convert to SessionState and return
    const sessionState = dbToSessionState(sessionRow)
    
    // Return as JSON with debug info (dates will be serialized as ISO strings)
    return NextResponse.json({
      session: sessionState,
      debug: {
        serviceKeyPresent,
        usingServiceRole,
        supabaseUrlHost,
        gymId: gymId || null,
        gymSlug,
        nowIso,
        expectedStatuses,
        statusFilterValues: expectedStatuses,
        actualResultCount: 1,
        queryTable: 'sessions',
        queryFilter: gymId 
          ? `gym_id = '${gymId}' AND status IN (${expectedStatuses.map(s => `'${s}'`).join(', ')})`
          : `gym_slug = '${gymSlug}' AND status IN (${expectedStatuses.map(s => `'${s}'`).join(', ')})`,
        latestSession: latestSession ? {
          id: latestSession.id,
          status: latestSession.status,
          gym_id: latestSession.gym_id,
          gym_slug: latestSession.gym_slug,
          created_at: latestSession.created_at,
        } : null,
        sanityCheckFound,
        totalSessionsCount,
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

