'use client'

import { SessionState, SessionStatus } from '@/types/session'
import { CountdownTimer } from './CountdownTimer'
import { ExercisePanel } from './ExercisePanel'
import { ExercisePanelPrefetcher } from './ExercisePanelPrefetcher'

interface DisplayContentProps {
  session: SessionState
  debugMode?: boolean
}

export function DisplayContent({ session, debugMode = false }: DisplayContentProps) {
  const currentBlock =
    session.template_snapshot.blocks[session.current_block_index]
  const viewMode = session.view_mode || currentBlock?.block_mode || 'follow_steps'
  
  // Get current step (only in follow_steps mode)
  const currentStep = viewMode === 'follow_steps' && session.current_step_index !== null
    ? currentBlock?.steps[session.current_step_index]
    : null

  const isRunning = session.status === SessionStatus.RUNNING
  const isPaused = session.status === SessionStatus.PAUSED

  // Safety/fallback: Handle missing data
  if (!currentBlock) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-8xl sm:text-9xl font-bold mb-8 text-gray-700">
            MANGLER BLOKKDATA
          </div>
          <div className="text-2xl sm:text-3xl text-gray-500">
            Session ID: {session.id}
          </div>
        </div>
      </div>
    )
  }

  // Get next preview (step for follow_steps, block for other modes)
  const getNextPreview = () => {
    if (viewMode === 'follow_steps') {
      // Next step preview
      if (!currentStep || session.current_step_index === null) return null

      const nextStepIndex = session.current_step_index + 1
      if (nextStepIndex < currentBlock.steps.length) {
        return {
          type: 'step' as const,
          block: currentBlock.name,
          step: currentBlock.steps[nextStepIndex],
        }
      }

      // Check if there's a next block
      const nextBlockIndex = session.current_block_index + 1
      if (
        nextBlockIndex < session.template_snapshot.blocks.length &&
        session.template_snapshot.blocks[nextBlockIndex].steps.length > 0
      ) {
        return {
          type: 'step' as const,
          block: session.template_snapshot.blocks[nextBlockIndex].name,
          step: session.template_snapshot.blocks[nextBlockIndex].steps[0],
        }
      }
    } else {
      // Next block preview
      const nextBlockIndex = session.current_block_index + 1
      if (nextBlockIndex < session.template_snapshot.blocks.length) {
        return {
          type: 'block' as const,
          block: session.template_snapshot.blocks[nextBlockIndex],
        }
      }
    }

    return null
  }

  const nextPreview = getNextPreview()

  // Format step display based on step_kind
  const formatStepDisplay = (step: typeof currentStep) => {
    if (!step) return ''
    const kind = step.step_kind || 'note'
    
    if (kind === 'reps' && step.reps) {
      return `${step.title} (${step.reps} reps)`
    } else if (kind === 'time' && step.duration) {
      const seconds = Math.floor(step.duration / 1000)
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${step.title} (${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')})`
    } else if (kind === 'load') {
      return step.title
    } else {
      return step.title
    }
  }

  // Calculate elapsed seconds for EMOM minute indicator
  const getElapsedSeconds = (): number => {
    if (!currentBlock?.block_duration_seconds) return 0
    
    if (isRunning && session.block_end_time) {
      // Running: calculate elapsed from block_end_time
      const now = Date.now()
      const endTime = new Date(session.block_end_time).getTime()
      const remainingMs = Math.max(0, endTime - now)
      const remainingSeconds = Math.floor(remainingMs / 1000)
      const elapsed = currentBlock.block_duration_seconds - remainingSeconds
      return Math.max(0, elapsed)
    } else if (isPaused && session.remaining_ms !== null) {
      // Paused: calculate elapsed from remaining_ms
      const remainingSeconds = Math.floor(session.remaining_ms / 1000)
      const elapsed = currentBlock.block_duration_seconds - remainingSeconds
      return Math.max(0, elapsed)
    }
    
    return 0
  }

  const getCurrentMinute = (): number => {
    const elapsed = getElapsedSeconds()
    // Minute number (1-indexed): elapsed / 60 + 1
    return Math.floor(elapsed / 60) + 1
  }

  const getTotalMinutes = (): number => {
    if (!currentBlock?.block_duration_seconds) return 0
    return Math.ceil(currentBlock.block_duration_seconds / 60)
  }

  // Format rest seconds to mm:ss
  const formatRestSeconds = (seconds: number | null | undefined): string => {
    if (!seconds || seconds === 0) return ''
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }


  // Render block mode view (AMRAP/EMOM/For Time/Strength Sets)
  if (viewMode !== 'follow_steps') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-12 sm:py-16">
        {/* PAUSED Banner */}
        {isPaused && (
          <div className="mb-8 px-8 py-4 bg-yellow-500 text-black rounded-lg">
            <div className="text-4xl sm:text-5xl font-bold text-center">
              PAUSE
            </div>
          </div>
        )}

        {/* Block Title - Large */}
        <div className="mb-8 sm:mb-12 text-center max-w-5xl">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 break-words">
            {currentBlock.name}
          </h1>
          <div className="text-3xl sm:text-4xl font-semibold text-gray-300 uppercase">
            {viewMode === 'amrap' && 'AMRAP'}
            {viewMode === 'emom' && 'EMOM'}
            {viewMode === 'for_time' && 'FOR TIME'}
            {viewMode === 'strength_sets' && 'STRENGTH SETS'}
          </div>
          {/* EMOM Minute Indicator */}
          {viewMode === 'emom' && currentBlock.block_duration_seconds && (
            <div className="text-2xl sm:text-3xl font-semibold text-gray-400 mt-4">
              Minutt {getCurrentMinute()}/{getTotalMinutes()}
            </div>
          )}
        </div>

        {/* Block Timer - Large if block_end_time exists */}
        {session.block_end_time !== null ? (
          <div className="mb-8 sm:mb-12">
            <CountdownTimer session={session} />
          </div>
        ) : (
          // Untimed block indicator
          <div className="mb-8 sm:mb-12">
            <div className="text-4xl sm:text-5xl font-bold text-center text-gray-400">
              {isRunning ? 'KLAR' : isPaused ? 'PAUSET' : 'COACH STYRER'}
            </div>
          </div>
        )}

        {/* Steps List */}
        <div className="w-full max-w-4xl mb-12">
          <div className="space-y-4">
            {currentBlock.steps.map((step, index) => (
              <div
                key={index}
                className="bg-gray-800 bg-opacity-50 rounded-lg p-6 text-center"
              >
                <div className="text-2xl sm:text-3xl font-semibold text-white">
                  {formatStepDisplay(step)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="text-2xl sm:text-3xl font-semibold">
          {isRunning ? (
            <span className="text-green-400">KJØRER</span>
          ) : isPaused ? (
            <span className="text-yellow-400">PAUSET</span>
          ) : (
            <span className="text-gray-500">STOPPET</span>
          )}
        </div>
      </div>
    )
  }

  // Render follow_steps mode
  if (viewMode === 'follow_steps') {
    // Safety/fallback: Handle missing step
    if (!currentStep || session.current_step_index === null) {
      return (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-8xl sm:text-9xl font-bold mb-8 text-gray-700">
              INGEN AKTIV STEP
            </div>
            <div className="text-2xl sm:text-3xl text-gray-500">
              Session ID: {session.id}
            </div>
          </div>
        </div>
      )
    }

    // Check if current step is timed (only time kind steps have duration)
    const stepKind = currentStep.step_kind || 'note'
    const isTimedStep = stepKind === 'time' && currentStep.duration && currentStep.duration > 0
    const hasTimer = session.step_end_time !== null

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-12 sm:py-16">
      {/* PAUSED Banner */}
      {isPaused && (
        <div className="mb-8 px-8 py-4 bg-yellow-500 text-black rounded-lg">
          <div className="text-4xl sm:text-5xl font-bold text-center">
            PAUSE
          </div>
        </div>
      )}

      {/* Main Timer - Only show for timed steps */}
      {isTimedStep && hasTimer ? (
        <div className="mb-8 sm:mb-12">
          <CountdownTimer session={session} />
        </div>
      ) : (
        // Untimed step indicator
        <div className="mb-8 sm:mb-12">
          <div className="text-4xl sm:text-5xl font-bold text-center text-gray-400">
            {isRunning ? 'KLAR' : isPaused ? 'PAUSET' : 'COACH STYRER'}
          </div>
          {stepKind === 'reps' && currentStep.reps && (
            <div className="text-2xl sm:text-3xl text-gray-500 mt-2">
              {currentStep.reps} reps
            </div>
          )}
        </div>
      )}

      {/* Step Name - Large under timer */}
      <div className="mb-8 sm:mb-12 text-center max-w-5xl">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 break-words">
          {currentStep.title}
        </h1>
      </div>

      {/* Exercise Panel */}
      <div className="mb-12 sm:mb-16">
        <ExercisePanel 
          exerciseId={currentStep.exercise_id} 
          exerciseTitle={currentStep.title}
          isPaused={isPaused} 
          debugMode={debugMode} 
        />
      </div>

      {/* Prefetch next step's exercise media */}
      {nextPreview?.type === 'step' && nextPreview.step.exercise_id && (
        <ExercisePanelPrefetcher exerciseId={nextPreview.step.exercise_id} />
      )}

      {/* Secondary Info Row */}
      <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
        {/* Block/Step Info */}
        <div className="space-y-2">
          <div className="text-lg sm:text-xl text-gray-400">Blokk</div>
          <div className="text-2xl sm:text-3xl font-semibold text-gray-300">
            {currentBlock.name}
          </div>
          <div className="text-base sm:text-lg text-gray-500">
            Steg {session.current_step_index + 1} av {currentBlock.steps.length}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <div className="text-lg sm:text-xl text-gray-400">Status</div>
          <div className="text-2xl sm:text-3xl font-semibold">
            {isRunning ? (
              <span className="text-green-400">KJØRER</span>
            ) : isPaused ? (
              <span className="text-yellow-400">PAUSET</span>
            ) : (
              <span className="text-gray-500">STOPPET</span>
            )}
          </div>
        </div>

        {/* Next Up */}
        <div className="space-y-2">
          <div className="text-lg sm:text-xl text-gray-400">Neste</div>
          {nextPreview ? (
            <>
              {nextPreview.type === 'step' ? (
                <>
                  <div className="text-xl sm:text-2xl font-semibold text-gray-300">
                    {nextPreview.step.title}
                  </div>
                  <div className="text-base sm:text-lg text-gray-500">
                    {nextPreview.block}
                  </div>
                </>
              ) : (
                <div className="text-xl sm:text-2xl font-semibold text-gray-300">
                  {nextPreview.block.name}
                </div>
              )}
            </>
          ) : (
            <div className="text-xl sm:text-2xl text-gray-600">
              Ferdig
            </div>
          )}
        </div>
      </div>

    </div>
    )
  }

  // Fallback: Should not reach here, but handle gracefully
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl sm:text-9xl font-bold mb-8 text-gray-700">
          UKJENT MODUS
        </div>
        <div className="text-2xl sm:text-3xl text-gray-500">
          View mode: {viewMode}
        </div>
      </div>
    </div>
  )
}

