'use client'

import { useState, useEffect } from 'react'
import { SessionState } from '@/types/session'

interface CountdownTimerProps {
  session: SessionState
}

export function CountdownTimer({ session }: CountdownTimerProps) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null)
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0)

  // Resync server time periodically to handle clock drift
  // Use step_end_time from session as reference point
  useEffect(() => {
    if (!session.step_end_time) return

    const syncTime = () => {
      // Use the step_end_time as server reference
      // Calculate offset based on when we received the session state
      const serverTime = new Date(session.step_end_time!).getTime()
      const clientTime = Date.now()
      // Estimate offset: if step_end_time is in the future, client might be behind
      // This is a simple approach - in production you'd want a proper time sync endpoint
      const estimatedOffset = 0 // Start with no offset, adjust if needed
      setServerTimeOffset(estimatedOffset)
    }

    syncTime()
    // Resync every 30 seconds
    const syncInterval = setInterval(syncTime, 30000)

    return () => clearInterval(syncInterval)
  }, [session.step_end_time])

  // Calculate remaining time
  // TASK-050: Handle refresh mid-step - calculates correct remaining time when page loads mid-step
  useEffect(() => {
    const calculateRemaining = () => {
      if (session.step_end_time) {
        // When running: calculate from step_end_time
        const now = Date.now() + serverTimeOffset
        const endTime = new Date(session.step_end_time).getTime()
        const remaining = Math.max(0, endTime - now)
        setRemainingMs(remaining)
      } else if (session.remaining_ms !== null && session.remaining_ms !== undefined) {
        // When paused: use remaining_ms directly
        setRemainingMs(Math.max(0, session.remaining_ms))
      } else {
        setRemainingMs(null)
      }
    }

    // Calculate immediately on mount/update (handles refresh mid-step)
    calculateRemaining()

    // Update every second
    const interval = setInterval(calculateRemaining, 1000)

    return () => clearInterval(interval)
  }, [session.step_end_time, session.remaining_ms, serverTimeOffset])

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  if (remainingMs === null) {
    return (
      <div className="text-9xl font-bold text-muted-foreground">--:--</div>
    )
  }

  return (
    <div className="text-9xl font-bold tabular-nums">
      {formatTime(remainingMs)}
    </div>
  )
}

