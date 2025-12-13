import { createClient } from './supabase/client'
import { SessionStatus, SessionState, TemplateSnapshot } from '@/types/session'
import { nextStep } from './session-operations'

/**
 * Helper function to convert database response to SessionState
 */
function dbToSessionState(data: any): SessionState {
  return {
    id: data.id,
    gym_slug: data.gym_slug,
    status: data.status as SessionStatus,
    current_block_index: data.current_block_index,
    current_step_index: data.current_step_index,
    step_end_time: data.step_end_time ? new Date(data.step_end_time) : null,
    remaining_ms: data.remaining_ms,
    state_version: data.state_version,
    template_snapshot: data.template_snapshot as TemplateSnapshot,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  }
}

/**
 * Auto-advance logic
 * Checks step_end_time, advances to next step/block or sets ended status, increments state_version
 * TASK-053: Idempotent state updates - checks state_version to prevent duplicate auto-advance
 * If state_version has changed since we fetched the session, another process already advanced it
 */
export async function checkAndAdvanceSession(
  sessionId: string,
  expectedStateVersion?: number
): Promise<SessionState | null> {
  // Get current session state
  const supabase = createClient()
  const { data: currentSession, error: fetchError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (fetchError || !currentSession) {
    console.error('Error fetching session:', fetchError)
    return null
  }

  // TASK-053: Optimistic locking - check if state_version matches expected
  // If expectedStateVersion is provided and doesn't match, another process already updated
  if (
    expectedStateVersion !== undefined &&
    currentSession.state_version !== expectedStateVersion
  ) {
    // State was already updated by another process - return current state
    return dbToSessionState(currentSession)
  }

  // Only auto-advance if session is running
  if (currentSession.status !== SessionStatus.RUNNING) {
    return null
  }

  // Check if step_end_time has passed
  if (!currentSession.step_end_time) {
    // No step_end_time means session is paused or stopped
    return null
  }

  const stepEndTime = new Date(currentSession.step_end_time)
  const now = new Date()

  // Check if time has passed (with small buffer to handle timing issues)
  if (now.getTime() < stepEndTime.getTime()) {
    // Not time to advance yet
    return null
  }

  // Store old state for debug logging before advancing
  const oldBlockIndex = currentSession.current_block_index
  const oldStepIndex = currentSession.current_step_index
  const oldStateVersion = currentSession.state_version

  // Time to advance - use nextStep function which handles all the logic
  // This will advance to next step, next block, or set status=ended
  // nextStep increments state_version, making this idempotent
  const updatedSession = await nextStep(sessionId)

  // Debug logging (dev only) when auto-advance actually triggers
  if (updatedSession && process.env.NODE_ENV === 'development') {
    console.log('AUTO_ADVANCE triggered', {
      sessionId,
      oldStep: { block: oldBlockIndex, step: oldStepIndex },
      newStep: {
        block: updatedSession.current_block_index,
        step: updatedSession.current_step_index,
      },
      stateVersion: {
        old: oldStateVersion,
        new: updatedSession.state_version,
      },
    })
  }

  return updatedSession
}

/**
 * Check and advance all running sessions for a gym
 * Useful for periodic polling/cleanup
 */
export async function checkAndAdvanceGymSessions(
  gymSlug: string
): Promise<void> {
  // Get all running sessions for this gym
  const supabase = createClient()
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('gym_slug', gymSlug)
    .eq('status', SessionStatus.RUNNING)

  if (error) {
    console.error('Error fetching running sessions:', error)
    return
  }

  if (!sessions || sessions.length === 0) {
    return
  }

  // Check and advance each session
  for (const session of sessions) {
    await checkAndAdvanceSession(session.id)
  }
}

