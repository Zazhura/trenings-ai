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
 * Auto-advance logic
 * Checks step_end_time or block_end_time based on view_mode
 * Advances to next step/block or sets ended status, increments state_version
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

  const viewMode = currentSession.view_mode || 'follow_steps'
  const now = new Date()
  let shouldAdvance = false
  let advanceToNextBlock = false

  if (viewMode === 'follow_steps') {
    // follow_steps mode: check step_end_time
    if (!currentSession.step_end_time) {
      // No step_end_time means untimed step - no auto-advance
      return null
    }

    const stepEndTime = new Date(currentSession.step_end_time)
    if (now.getTime() >= stepEndTime.getTime()) {
      shouldAdvance = true
      // Check if we need to advance to next block
      const templateSnapshot = currentSession.template_snapshot as TemplateSnapshot
      const currentBlock = templateSnapshot.blocks[currentSession.current_block_index]
      const currentStepIndex = currentSession.current_step_index
      
      if (currentStepIndex !== null && currentStepIndex + 1 >= currentBlock.steps.length) {
        // Last step in current block - advance to next block
        advanceToNextBlock = true
      }
    }
  } else {
    // Block modes: check block_end_time
    if (!currentSession.block_end_time) {
      // No block_end_time means untimed block - no auto-advance
      return null
    }

    const blockEndTime = new Date(currentSession.block_end_time)
    if (now.getTime() >= blockEndTime.getTime()) {
      shouldAdvance = true
      advanceToNextBlock = true
    }
  }

  if (!shouldAdvance) {
    return null
  }

  // Store old state for debug logging before advancing
  const oldBlockIndex = currentSession.current_block_index
  const oldStepIndex = currentSession.current_step_index
  const oldStateVersion = currentSession.state_version

  // Import nextBlock for block mode advancement
  const { nextBlock, nextStep } = await import('./session-operations')

  // Time to advance
  let updatedSession: SessionState | null = null
  if (advanceToNextBlock) {
    // Advance to next block
    const templateSnapshot = currentSession.template_snapshot as TemplateSnapshot
    const nextBlockIndex = currentSession.current_block_index + 1
    
    if (nextBlockIndex >= templateSnapshot.blocks.length) {
      // Last block - set status to ended
      const { data, error } = await supabase
        .from('sessions')
        .update({
          status: SessionStatus.ENDED,
          step_end_time: null,
          block_end_time: null,
          remaining_ms: null,
          state_version: currentSession.state_version + 1,
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) {
        console.error('Error ending session:', error)
        return null
      }

      updatedSession = dbToSessionState(data)
    } else {
      updatedSession = await nextBlock(sessionId)
    }
  } else {
    // Advance to next step (follow_steps mode)
    updatedSession = await nextStep(sessionId)
  }

  // Debug logging (dev only) when auto-advance actually triggers
  if (updatedSession && process.env.NODE_ENV === 'development') {
    console.log('AUTO_ADVANCE triggered', {
      sessionId,
      viewMode,
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

