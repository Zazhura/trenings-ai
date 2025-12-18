import { createClient } from './supabase/client'
import { SessionState, TemplateSnapshot, SessionStatus } from '@/types/session'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Convert database row to SessionState
 */
function dbToSessionState(data: any): SessionState {
  return {
    id: data.id,
    gym_slug: data.gym_slug,
    status: data.status,
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
 * Subscribe to session state changes for a gym_slug
 * Returns a channel that can be used to unsubscribe
 */
export function subscribeToSessionChanges(
  gymSlug: string,
  callback: (sessionState: SessionState | null) => void
): RealtimeChannel {
  const supabase = createClient()
  const channel = supabase
    .channel(`sessions:${gymSlug}`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'sessions',
        filter: `gym_slug=eq.${gymSlug}`,
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          callback(null)
          return
        }

        if (payload.new) {
          const session = dbToSessionState(payload.new)
          // Only send active sessions (running/paused) to callback
          // If session is stopped/ended, send null instead
          if (
            session.status === SessionStatus.RUNNING ||
            session.status === SessionStatus.PAUSED
          ) {
            callback(session)
          } else {
            // Session is stopped or ended - treat as no active session
            callback(null)
          }
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * Get current active session for a gym_slug
 * Returns the most recent running/paused session, or null if none exists
 * Uses maybeSingle() to avoid 406 errors when no session exists
 */
export async function getCurrentSession(
  gymSlug: string
): Promise<SessionState | null> {
  const supabase = createClient()
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
    return null
  }

  if (!data) {
    return null
  }

  return dbToSessionState(data)
}

