'use client'

import { useState, useEffect } from 'react'
import { SessionState } from '@/types/session'
import { SessionStatus as StatusEnum } from '@/types/session'

interface SessionStatusProps {
  session: SessionState | null
}

export function SessionStatus({ session }: SessionStatusProps) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null)

  // Realtime countdown timer
  useEffect(() => {
    const calculateRemaining = () => {
      if (!session) {
        setRemainingMs(null)
        return
      }

      const viewMode = session.view_mode || 'follow_steps'
      
      // RUNNING: calculate from step_end_time or block_end_time based on view_mode
      if (session.status === StatusEnum.RUNNING) {
        if (viewMode === 'follow_steps' && session.step_end_time) {
          const now = Date.now()
          const endTime = new Date(session.step_end_time).getTime()
          const remaining = Math.max(0, endTime - now)
          setRemainingMs(remaining)
        } else if (viewMode !== 'follow_steps' && session.block_end_time) {
          const now = Date.now()
          const endTime = new Date(session.block_end_time).getTime()
          const remaining = Math.max(0, endTime - now)
          setRemainingMs(remaining)
        } else {
          setRemainingMs(null)
        }
      }
      // PAUSED: use remaining_ms directly (static)
      else if (
        session.status === StatusEnum.PAUSED &&
        session.remaining_ms !== null &&
        session.remaining_ms !== undefined
      ) {
        setRemainingMs(Math.max(0, session.remaining_ms))
      }
      // STOPPED/ENDED/null: show --:--
      else {
        setRemainingMs(null)
      }
    }

    // Calculate immediately
    calculateRemaining()

    // Only run interval if session is RUNNING (for realtime countdown)
    if (session && session.status === StatusEnum.RUNNING) {
      const viewMode = session.view_mode || 'follow_steps'
      const hasTimer = (viewMode === 'follow_steps' && session.step_end_time) ||
                       (viewMode !== 'follow_steps' && session.block_end_time)
      if (hasTimer) {
        const interval = setInterval(calculateRemaining, 1000)
        return () => clearInterval(interval)
      }
    }
  }, [session, session?.status, session?.step_end_time, session?.block_end_time, session?.view_mode, session?.remaining_ms])

  if (!session) {
    return null // Empty state is handled in parent component
  }

  const currentBlock =
    session.template_snapshot.blocks[session.current_block_index]
  const viewMode = session.view_mode || 'follow_steps'
  const currentStep = viewMode === 'follow_steps' && session.current_step_index !== null
    ? currentBlock?.steps[session.current_step_index]
    : null

  const getStatusColor = (status: string) => {
    switch (status) {
      case StatusEnum.RUNNING:
        return 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
      case StatusEnum.PAUSED:
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100'
      case StatusEnum.STOPPED:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100'
      case StatusEnum.ENDED:
        return 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
      default:
        return 'bg-muted'
    }
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getRemainingTimeDisplay = () => {
    if (remainingMs === null) {
      return '--:--'
    }
    return formatTime(remainingMs)
  }

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-lg ${getStatusColor(session.status)}`}>
        <div className="flex justify-between items-center">
          <span className="font-semibold">Status: {session.status}</span>
          <span className="text-sm">v{session.state_version}</span>
        </div>
      </div>

      {currentBlock && (
        <div className="p-4 bg-card rounded-lg border">
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Blokk</p>
              <p className="font-semibold">{currentBlock.name}</p>
            </div>
            {viewMode === 'follow_steps' && currentStep && (
              <div>
                <p className="text-sm text-muted-foreground">Steg</p>
                <p className="font-semibold">{currentStep.title}</p>
              </div>
            )}
            {viewMode !== 'follow_steps' && (
              <div>
                <p className="text-sm text-muted-foreground">Modus</p>
                <p className="font-semibold uppercase">
                  {viewMode === 'amrap' && 'AMRAP'}
                  {viewMode === 'emom' && 'EMOM'}
                  {viewMode === 'for_time' && 'FOR TIME'}
                  {viewMode === 'strength_sets' && 'STRENGTH SETS'}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Gjenstående tid</p>
              <p className="text-2xl font-bold tabular-nums">{getRemainingTimeDisplay()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

