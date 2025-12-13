import { createClient } from './supabase/client'
import { SessionStatus, SessionState, TemplateSnapshot } from '@/types/session'

/**
 * Start a new session from a template
 * Sets first block/step, status=running, step_end_time=now+duration
 */
export async function startSession(
  gymSlug: string,
  templateSnapshot: TemplateSnapshot
): Promise<SessionState | null> {
  // Validate template has blocks and steps
  if (!templateSnapshot.blocks || templateSnapshot.blocks.length === 0) {
    throw new Error('Template must have at least one block')
  }

  const firstBlock = templateSnapshot.blocks[0]
  if (!firstBlock.steps || firstBlock.steps.length === 0) {
    throw new Error('First block must have at least one step')
  }

  const firstStep = firstBlock.steps[0]
  const now = new Date()
  const stepEndTime = new Date(now.getTime() + firstStep.duration)

  const supabase = createClient()
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      gym_slug: gymSlug,
      status: SessionStatus.RUNNING,
      current_block_index: 0,
      current_step_index: 0,
      step_end_time: stepEndTime.toISOString(),
      remaining_ms: null, // null when running
      state_version: 1,
      template_snapshot: templateSnapshot,
    })
    .select()
    .single()

  if (error) {
    console.error('Error starting session:', error)
    return null
  }

  // Convert database response to SessionState
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
 * Pause a running session
 * Calculates remaining_ms = step_end_time - now (floor to 0), sets status=paused, removes step_end_time
 */
export async function pauseSession(sessionId: string): Promise<SessionState | null> {
  // First, get current session state
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

  // Validate session is running
  if (currentSession.status !== SessionStatus.RUNNING) {
    throw new Error('Session must be running to pause')
  }

  // Calculate remaining_ms = step_end_time - now (floor to 0)
  const now = new Date()
  const stepEndTime = currentSession.step_end_time
    ? new Date(currentSession.step_end_time)
    : null

  let remainingMs = 0
  if (stepEndTime) {
    remainingMs = Math.max(0, stepEndTime.getTime() - now.getTime())
  }

  // Update session: set status=paused, remaining_ms, remove step_end_time (set to null)
  const { data, error } = await supabase
    .from('sessions')
    .update({
      status: SessionStatus.PAUSED,
      remaining_ms: remainingMs,
      step_end_time: null,
      state_version: currentSession.state_version + 1,
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error pausing session:', error)
    return null
  }

  // Convert database response to SessionState
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
 * Resume a paused session
 * Sets status=running, step_end_time=now+remaining_ms
 */
export async function resumeSession(sessionId: string): Promise<SessionState | null> {
  // First, get current session state
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

  // Validate session is paused
  if (currentSession.status !== SessionStatus.PAUSED) {
    throw new Error('Session must be paused to resume')
  }

  // Validate remaining_ms exists
  if (currentSession.remaining_ms === null || currentSession.remaining_ms === undefined) {
    throw new Error('Session must have remaining_ms to resume')
  }

  // Set step_end_time = now + remaining_ms
  const now = new Date()
  const stepEndTime = new Date(now.getTime() + currentSession.remaining_ms)

  // Update session: set status=running, step_end_time, remaining_ms=null
  const { data, error } = await supabase
    .from('sessions')
    .update({
      status: SessionStatus.RUNNING,
      step_end_time: stepEndTime.toISOString(),
      remaining_ms: null,
      state_version: currentSession.state_version + 1,
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error resuming session:', error)
    return null
  }

  // Convert database response to SessionState
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
 * Advance to next step
 * If running: jump to next step and start it immediately with full duration (new step_end_time)
 * If paused: jump to next step, but remain paused and set remaining = full duration for the new step
 */
export async function nextStep(sessionId: string): Promise<SessionState | null> {
  // First, get current session state
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

  const templateSnapshot = currentSession.template_snapshot as TemplateSnapshot
  const currentBlockIndex = currentSession.current_block_index
  const currentStepIndex = currentSession.current_step_index
  const isRunning = currentSession.status === SessionStatus.RUNNING
  const isPaused = currentSession.status === SessionStatus.PAUSED

  if (!isRunning && !isPaused) {
    throw new Error('Session must be running or paused to advance to next step')
  }

  const currentBlock = templateSnapshot.blocks[currentBlockIndex]
  const nextStepIndex = currentStepIndex + 1

  let newBlockIndex = currentBlockIndex
  let newStepIndex = nextStepIndex

  // Check if there's a next step in current block
  if (nextStepIndex >= currentBlock.steps.length) {
    // Move to first step of next block
    newBlockIndex = currentBlockIndex + 1
    newStepIndex = 0

    // Check if we've reached the end
    if (newBlockIndex >= templateSnapshot.blocks.length) {
      // Last step in last block - set status to ended
      const { data, error } = await supabase
        .from('sessions')
        .update({
          status: SessionStatus.ENDED,
          step_end_time: null,
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

      return dbToSessionState(data)
    }
  }

  // Get the next step duration
  const nextBlock = templateSnapshot.blocks[newBlockIndex]
  const nextStep = nextBlock.steps[newStepIndex]
  const stepDuration = nextStep.duration

  const now = new Date()
  const updateData: any = {
    current_block_index: newBlockIndex,
    current_step_index: newStepIndex,
    state_version: currentSession.state_version + 1,
  }

  if (isRunning) {
    // Start immediately with full duration
    updateData.step_end_time = new Date(now.getTime() + stepDuration).toISOString()
    updateData.remaining_ms = null
  } else if (isPaused) {
    // Remain paused, set remaining = full duration
    updateData.step_end_time = null
    updateData.remaining_ms = stepDuration
  }

  const { data, error } = await supabase
    .from('sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error advancing to next step:', error)
    return null
  }

  return dbToSessionState(data)
}

/**
 * Go to previous step
 * Always "restart full duration" on previous step
 * If running: start immediately (new step_end_time)
 * If paused: remain paused, remaining = full duration
 */
export async function prevStep(sessionId: string): Promise<SessionState | null> {
  // First, get current session state
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

  const templateSnapshot = currentSession.template_snapshot as TemplateSnapshot
  const currentBlockIndex = currentSession.current_block_index
  const currentStepIndex = currentSession.current_step_index
  const isRunning = currentSession.status === SessionStatus.RUNNING
  const isPaused = currentSession.status === SessionStatus.PAUSED

  if (!isRunning && !isPaused) {
    throw new Error('Session must be running or paused to go to previous step')
  }

  let newBlockIndex = currentBlockIndex
  let newStepIndex = currentStepIndex - 1

  // Check if we need to go to previous block
  if (newStepIndex < 0) {
    // Move to last step of previous block
    newBlockIndex = currentBlockIndex - 1

    // Check if we've reached the beginning
    if (newBlockIndex < 0) {
      throw new Error('Cannot go before first step')
    }

    const prevBlock = templateSnapshot.blocks[newBlockIndex]
    newStepIndex = prevBlock.steps.length - 1
  }

  // Get the previous step duration
  const prevBlock = templateSnapshot.blocks[newBlockIndex]
  const prevStep = prevBlock.steps[newStepIndex]
  const stepDuration = prevStep.duration

  const now = new Date()
  const updateData: any = {
    current_block_index: newBlockIndex,
    current_step_index: newStepIndex,
    state_version: currentSession.state_version + 1,
  }

  if (isRunning) {
    // Start immediately with full duration
    updateData.step_end_time = new Date(now.getTime() + stepDuration).toISOString()
    updateData.remaining_ms = null
  } else if (isPaused) {
    // Remain paused, set remaining = full duration
    updateData.step_end_time = null
    updateData.remaining_ms = stepDuration
  }

  const { data, error } = await supabase
    .from('sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error going to previous step:', error)
    return null
  }

  return dbToSessionState(data)
}

/**
 * Go to next block
 * Goes to first step in target block (predictability)
 * Preserves running/paused mode:
 * - running → starts first step in target block immediately (new step_end_time)
 * - paused → changes "pointers" but remains paused (remaining = full duration for first step)
 */
export async function nextBlock(sessionId: string): Promise<SessionState | null> {
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

  const templateSnapshot = currentSession.template_snapshot as TemplateSnapshot
  const currentBlockIndex = currentSession.current_block_index
  const isRunning = currentSession.status === SessionStatus.RUNNING
  const isPaused = currentSession.status === SessionStatus.PAUSED

  if (!isRunning && !isPaused) {
    throw new Error('Session must be running or paused to go to next block')
  }

  const newBlockIndex = currentBlockIndex + 1

  if (newBlockIndex >= templateSnapshot.blocks.length) {
    throw new Error('Cannot go beyond last block')
  }

  const newBlock = templateSnapshot.blocks[newBlockIndex]
  const firstStep = newBlock.steps[0]
  const stepDuration = firstStep.duration

  const now = new Date()
  const updateData: any = {
    current_block_index: newBlockIndex,
    current_step_index: 0,
    state_version: currentSession.state_version + 1,
  }

  if (isRunning) {
    updateData.step_end_time = new Date(now.getTime() + stepDuration).toISOString()
    updateData.remaining_ms = null
  } else if (isPaused) {
    updateData.step_end_time = null
    updateData.remaining_ms = stepDuration
  }

  const { data, error } = await supabase
    .from('sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error going to next block:', error)
    return null
  }

  return dbToSessionState(data)
}

/**
 * Go to previous block
 * Goes to first step in target block (predictability)
 * Preserves running/paused mode:
 * - running → starts first step in target block immediately (new step_end_time)
 * - paused → changes "pointers" but remains paused (remaining = full duration for first step)
 */
export async function prevBlock(sessionId: string): Promise<SessionState | null> {
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

  const templateSnapshot = currentSession.template_snapshot as TemplateSnapshot
  const currentBlockIndex = currentSession.current_block_index
  const isRunning = currentSession.status === SessionStatus.RUNNING
  const isPaused = currentSession.status === SessionStatus.PAUSED

  if (!isRunning && !isPaused) {
    throw new Error('Session must be running or paused to go to previous block')
  }

  const newBlockIndex = currentBlockIndex - 1

  if (newBlockIndex < 0) {
    throw new Error('Cannot go before first block')
  }

  const newBlock = templateSnapshot.blocks[newBlockIndex]
  const firstStep = newBlock.steps[0]
  const stepDuration = firstStep.duration

  const now = new Date()
  const updateData: any = {
    current_block_index: newBlockIndex,
    current_step_index: 0,
    state_version: currentSession.state_version + 1,
  }

  if (isRunning) {
    updateData.step_end_time = new Date(now.getTime() + stepDuration).toISOString()
    updateData.remaining_ms = null
  } else if (isPaused) {
    updateData.step_end_time = null
    updateData.remaining_ms = stepDuration
  }

  const { data, error } = await supabase
    .from('sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error going to previous block:', error)
    return null
  }

  return dbToSessionState(data)
}

/**
 * Stop a session
 * Sets status=stopped
 */
export async function stopSession(sessionId: string): Promise<SessionState | null> {
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

  const { data, error } = await supabase
    .from('sessions')
    .update({
      status: SessionStatus.STOPPED,
      step_end_time: null,
      remaining_ms: null,
      state_version: currentSession.state_version + 1,
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error stopping session:', error)
    return null
  }

  return dbToSessionState(data)
}

