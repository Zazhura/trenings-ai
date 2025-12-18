import { createClient } from './supabase/client'
import { SessionStatus, SessionState, TemplateSnapshot } from '@/types/session'

/**
 * Start a new session from a template
 * Sets first block/step, status=running, step_end_time/block_end_time based on block_mode
 */
export async function startSession(
  gymSlug: string,
  templateSnapshot: TemplateSnapshot
): Promise<SessionState | null> {
  // Validate template has blocks
  if (!templateSnapshot.blocks || templateSnapshot.blocks.length === 0) {
    throw new Error('Template must have at least one block')
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
      throw new Error('First block must have at least one step in follow_steps mode')
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

  const supabase = createClient()
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      gym_slug: gymSlug,
      status: SessionStatus.RUNNING,
      current_block_index: 0,
      current_step_index: currentStepIndex,
      view_mode: viewMode,
      step_end_time: stepEndTime ? stepEndTime.toISOString() : null,
      block_end_time: blockEndTime ? blockEndTime.toISOString() : null,
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
  return dbToSessionState(data)
}

/**
 * Pause a running session
 * Calculates remaining_ms from step_end_time or block_end_time, sets status=paused, removes timers
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

  // Calculate remaining_ms from active timer (step_end_time or block_end_time)
  const now = new Date()
  const stepEndTime = currentSession.step_end_time
    ? new Date(currentSession.step_end_time)
    : null
  const blockEndTime = currentSession.block_end_time
    ? new Date(currentSession.block_end_time)
    : null

  let remainingMs = 0
  if (stepEndTime) {
    remainingMs = Math.max(0, stepEndTime.getTime() - now.getTime())
  } else if (blockEndTime) {
    remainingMs = Math.max(0, blockEndTime.getTime() - now.getTime())
  }

  // Update session: set status=paused, remaining_ms, remove timers (set to null)
  const { data, error } = await supabase
    .from('sessions')
    .update({
      status: SessionStatus.PAUSED,
      remaining_ms: remainingMs,
      step_end_time: null,
      block_end_time: null,
      state_version: currentSession.state_version + 1,
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error pausing session:', error)
    return null
  }

  return dbToSessionState(data)
}

/**
 * Resume a paused session
 * Sets status=running, restores step_end_time or block_end_time based on view_mode
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

  const now = new Date()
  const viewMode = currentSession.view_mode || 'follow_steps'
  const updateData: any = {
    status: SessionStatus.RUNNING,
    remaining_ms: null,
    state_version: currentSession.state_version + 1,
  }

  // Restore appropriate timer based on view_mode
  if (viewMode === 'follow_steps') {
    // follow_steps: restore step_end_time if there was one
    if (currentSession.remaining_ms > 0) {
      updateData.step_end_time = new Date(now.getTime() + currentSession.remaining_ms).toISOString()
    }
    updateData.block_end_time = null
  } else {
    // Block modes: restore block_end_time if there was one
    if (currentSession.remaining_ms > 0) {
      updateData.block_end_time = new Date(now.getTime() + currentSession.remaining_ms).toISOString()
    }
    updateData.step_end_time = null
  }

  // Update session
  const { data, error } = await supabase
    .from('sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error resuming session:', error)
    return null
  }

  return dbToSessionState(data)
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
 * Advance to next step
 * Only works in follow_steps mode
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

  const viewMode = currentSession.view_mode || 'follow_steps'
  
  // Only allow nextStep in follow_steps mode
  if (viewMode !== 'follow_steps') {
    throw new Error('nextStep only works in follow_steps mode. Use nextBlock for other modes.')
  }

  const templateSnapshot = currentSession.template_snapshot as TemplateSnapshot
  const currentBlockIndex = currentSession.current_block_index
  const currentStepIndex = currentSession.current_step_index
  const isRunning = currentSession.status === SessionStatus.RUNNING
  const isPaused = currentSession.status === SessionStatus.PAUSED

  if (!isRunning && !isPaused) {
    throw new Error('Session must be running or paused to advance to next step')
  }

  if (currentStepIndex === null) {
    throw new Error('current_step_index must not be null in follow_steps mode')
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

      return dbToSessionState(data)
    }
  }

  // Get the next step and determine if it's timed
  const nextBlock = templateSnapshot.blocks[newBlockIndex]
  const nextStep = nextBlock.steps[newStepIndex]
  
  // Determine if next step is timed (only time kind steps with duration)
  const stepKind = nextStep.step_kind || 'note'
  const isTimedStep = stepKind === 'time' && nextStep.duration && nextStep.duration > 0
  const stepDuration = isTimedStep ? nextStep.duration : null

  const now = new Date()
  const updateData: any = {
    current_block_index: newBlockIndex,
    current_step_index: newStepIndex,
    step_end_time: null,
    block_end_time: null,
    state_version: currentSession.state_version + 1,
  }

  if (isTimedStep && stepDuration !== null && stepDuration !== undefined) {
    // Timed step: set timer
    if (isRunning) {
      // Start immediately with full duration
      updateData.step_end_time = new Date(now.getTime() + stepDuration).toISOString()
      updateData.remaining_ms = null
    } else if (isPaused) {
      // Remain paused, set remaining = full duration
      updateData.step_end_time = null
      updateData.remaining_ms = stepDuration
    }
  } else {
    // Untimed step: no timer
    updateData.step_end_time = null
    updateData.remaining_ms = null
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
 * Only works in follow_steps mode
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

  const viewMode = currentSession.view_mode || 'follow_steps'
  
  // Only allow prevStep in follow_steps mode
  if (viewMode !== 'follow_steps') {
    throw new Error('prevStep only works in follow_steps mode. Use prevBlock for other modes.')
  }

  const templateSnapshot = currentSession.template_snapshot as TemplateSnapshot
  const currentBlockIndex = currentSession.current_block_index
  const currentStepIndex = currentSession.current_step_index
  const isRunning = currentSession.status === SessionStatus.RUNNING
  const isPaused = currentSession.status === SessionStatus.PAUSED

  if (!isRunning && !isPaused) {
    throw new Error('Session must be running or paused to go to previous step')
  }

  if (currentStepIndex === null) {
    throw new Error('current_step_index must not be null in follow_steps mode')
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

  // Get the previous step and determine if it's timed
  const prevBlock = templateSnapshot.blocks[newBlockIndex]
  const prevStep = prevBlock.steps[newStepIndex]
  
  // Determine if prev step is timed (only time kind steps with duration)
  const stepKind = prevStep.step_kind || 'note'
  const isTimedStep = stepKind === 'time' && prevStep.duration && prevStep.duration > 0
  const stepDuration = isTimedStep ? prevStep.duration : null

  const now = new Date()
  const updateData: any = {
    current_block_index: newBlockIndex,
    current_step_index: newStepIndex,
    step_end_time: null,
    block_end_time: null,
    state_version: currentSession.state_version + 1,
  }

  if (isTimedStep && stepDuration !== null && stepDuration !== undefined) {
    // Timed step: set timer
    if (isRunning) {
      // Start immediately with full duration
      updateData.step_end_time = new Date(now.getTime() + stepDuration).toISOString()
      updateData.remaining_ms = null
    } else if (isPaused) {
      // Remain paused, set remaining = full duration
      updateData.step_end_time = null
      updateData.remaining_ms = stepDuration
    }
  } else {
    // Untimed step: no timer
    updateData.step_end_time = null
    updateData.remaining_ms = null
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
 * Works in all modes
 * Sets view_mode = new block_mode
 * Initializes state as in Start block
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
  const viewMode = newBlock.block_mode || 'follow_steps'
  const now = new Date()

  // Initialize state based on view_mode (same logic as startSession)
  let currentStepIndex: number | null = null
  let stepEndTime: Date | null = null
  let blockEndTime: Date | null = null

  if (viewMode === 'follow_steps') {
    // follow_steps mode: requires at least one step
    if (!newBlock.steps || newBlock.steps.length === 0) {
      throw new Error('Block must have at least one step in follow_steps mode')
    }

    currentStepIndex = 0
    const firstStep = newBlock.steps[0]
    
    // Check if step is timed (step_kind == 'time' and duration exists)
    const stepKind = firstStep.step_kind || 'note'
    if (stepKind === 'time' && firstStep.duration && firstStep.duration > 0) {
      if (isRunning) {
        stepEndTime = new Date(now.getTime() + firstStep.duration)
      } else if (isPaused) {
        // Remain paused, set remaining = full duration
        // stepEndTime remains null
      }
    }
    // else: stepEndTime remains null (untimed step)
  } else {
    // Block modes (amrap/emom/for_time/strength_sets): no step index
    currentStepIndex = null
    
    // Check if block has duration
    if (newBlock.block_duration_seconds && newBlock.block_duration_seconds > 0) {
      if (isRunning) {
        blockEndTime = new Date(now.getTime() + newBlock.block_duration_seconds * 1000)
      } else if (isPaused) {
        // Remain paused, set remaining = full duration
        // blockEndTime remains null
      }
    }
    // else: blockEndTime remains null (untimed block)
  }

  const updateData: any = {
    current_block_index: newBlockIndex,
    current_step_index: currentStepIndex,
    view_mode: viewMode,
    step_end_time: stepEndTime ? stepEndTime.toISOString() : null,
    block_end_time: blockEndTime ? blockEndTime.toISOString() : null,
    state_version: currentSession.state_version + 1,
  }

  // Handle paused state: set remaining_ms if there's a duration
  if (isPaused) {
    if (viewMode === 'follow_steps' && stepEndTime === null && newBlock.steps?.[0]) {
      const firstStep = newBlock.steps[0]
      const stepKind = firstStep.step_kind || 'note'
      if (stepKind === 'time' && firstStep.duration && firstStep.duration > 0) {
        updateData.remaining_ms = firstStep.duration
      } else {
        updateData.remaining_ms = null
      }
    } else if (viewMode !== 'follow_steps' && blockEndTime === null) {
      if (newBlock.block_duration_seconds && newBlock.block_duration_seconds > 0) {
        updateData.remaining_ms = newBlock.block_duration_seconds * 1000
      } else {
        updateData.remaining_ms = null
      }
    } else {
      // Already set timers above, remaining_ms should be null
      updateData.remaining_ms = null
    }
  } else {
    // Running: remaining_ms is null
    updateData.remaining_ms = null
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
 * Works in all modes
 * Sets view_mode = new block_mode
 * Initializes state as in Start block
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
  const viewMode = newBlock.block_mode || 'follow_steps'
  const now = new Date()

  // Initialize state based on view_mode (same logic as startSession)
  let currentStepIndex: number | null = null
  let stepEndTime: Date | null = null
  let blockEndTime: Date | null = null

  if (viewMode === 'follow_steps') {
    // follow_steps mode: requires at least one step
    if (!newBlock.steps || newBlock.steps.length === 0) {
      throw new Error('Block must have at least one step in follow_steps mode')
    }

    currentStepIndex = 0
    const firstStep = newBlock.steps[0]
    
    // Check if step is timed (step_kind == 'time' and duration exists)
    const stepKind = firstStep.step_kind || 'note'
    if (stepKind === 'time' && firstStep.duration && firstStep.duration > 0) {
      if (isRunning) {
        stepEndTime = new Date(now.getTime() + firstStep.duration)
      } else if (isPaused) {
        // Remain paused, set remaining = full duration
        // stepEndTime remains null
      }
    }
    // else: stepEndTime remains null (untimed step)
  } else {
    // Block modes (amrap/emom/for_time/strength_sets): no step index
    currentStepIndex = null
    
    // Check if block has duration
    if (newBlock.block_duration_seconds && newBlock.block_duration_seconds > 0) {
      if (isRunning) {
        blockEndTime = new Date(now.getTime() + newBlock.block_duration_seconds * 1000)
      } else if (isPaused) {
        // Remain paused, set remaining = full duration
        // blockEndTime remains null
      }
    }
    // else: blockEndTime remains null (untimed block)
  }

  const updateData: any = {
    current_block_index: newBlockIndex,
    current_step_index: currentStepIndex,
    view_mode: viewMode,
    step_end_time: stepEndTime ? stepEndTime.toISOString() : null,
    block_end_time: blockEndTime ? blockEndTime.toISOString() : null,
    state_version: currentSession.state_version + 1,
  }

  // Handle paused state: set remaining_ms if there's a duration
  if (isPaused) {
    if (viewMode === 'follow_steps' && stepEndTime === null && newBlock.steps?.[0]) {
      const firstStep = newBlock.steps[0]
      const stepKind = firstStep.step_kind || 'note'
      if (stepKind === 'time' && firstStep.duration && firstStep.duration > 0) {
        updateData.remaining_ms = firstStep.duration
      } else {
        updateData.remaining_ms = null
      }
    } else if (viewMode !== 'follow_steps' && blockEndTime === null) {
      if (newBlock.block_duration_seconds && newBlock.block_duration_seconds > 0) {
        updateData.remaining_ms = newBlock.block_duration_seconds * 1000
      } else {
        updateData.remaining_ms = null
      }
    } else {
      // Already set timers above, remaining_ms should be null
      updateData.remaining_ms = null
    }
  } else {
    // Running: remaining_ms is null
    updateData.remaining_ms = null
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
      block_end_time: null,
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

