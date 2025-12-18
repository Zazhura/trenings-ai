'use client'

import { useState } from 'react'
import { SessionState, SessionStatus } from '@/types/session'
import {
  pauseSession,
  resumeSession,
  stopSession,
  nextStep,
  prevStep,
  nextBlock,
  prevBlock,
} from '@/lib/session-operations'

interface SessionControlsProps {
  session: SessionState | null
  onSessionUpdate?: () => void
}

export function SessionControls({
  session,
  onSessionUpdate,
}: SessionControlsProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async (action: () => Promise<any>) => {
    if (!session || isLoading) return

    setIsLoading(true)
    try {
      await action()
      onSessionUpdate?.()
    } catch (error) {
      console.error('Error performing action:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) {
    return null
  }

  const isRunning = session.status === SessionStatus.RUNNING
  const isPaused = session.status === SessionStatus.PAUSED
  const isActive = isRunning || isPaused
  const viewMode = session.view_mode || 'follow_steps'
  const isFollowStepsMode = viewMode === 'follow_steps'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {/* Pause button - only enabled when running */}
        <button
          onClick={() => handleAction(() => pauseSession(session.id))}
          disabled={!isRunning || isLoading}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Pause
        </button>

        {/* Resume button - only enabled when paused */}
        <button
          onClick={() => handleAction(() => resumeSession(session.id))}
          disabled={!isPaused || isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Resume
        </button>

        {/* Stop button */}
        <button
          onClick={() => handleAction(() => stopSession(session.id))}
          disabled={isLoading}
          className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Stop
        </button>
      </div>

      {isActive && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {/* Prev Block button */}
            <button
              onClick={() => handleAction(() => prevBlock(session.id))}
              disabled={isLoading}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev Block
            </button>

            {/* Next Block button */}
            <button
              onClick={() => handleAction(() => nextBlock(session.id))}
              disabled={isLoading}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Block
            </button>
          </div>

          {/* Step controls - only enabled in follow_steps mode */}
          {isFollowStepsMode && (
            <div className="flex flex-wrap gap-2">
              {/* Prev Step button */}
              <button
                onClick={() => handleAction(() => prevStep(session.id))}
                disabled={isLoading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev Step
              </button>

              {/* Next Step button */}
              <button
                onClick={() => handleAction(() => nextStep(session.id))}
                disabled={isLoading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

