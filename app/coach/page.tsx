'use client'

import { useState, useEffect, useRef } from 'react'
import { Template } from '@/types/template'
import { TemplateSelector } from './components/TemplateSelector'
import { SessionStatus as SessionStatusComponent } from './components/SessionStatus'
import { SessionControls } from './components/SessionControls'
import { ErrorBoundary } from './components/ErrorBoundary'
import { startSession } from '@/lib/session-operations'
import { createTemplateSnapshot } from '@/lib/templates'
import { SessionState, SessionStatus } from '@/types/session'
import { subscribeToSessionChanges, getCurrentSession } from '@/lib/realtime'

function CoachPageContent() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  )
  const [isStarting, setIsStarting] = useState(false)
  const [currentSession, setCurrentSession] = useState<SessionState | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  
  // Use ref to track latest session state for polling (avoids stale closures)
  const sessionRef = useRef<SessionState | null>(null)
  
  // Update ref whenever session changes
  useEffect(() => {
    sessionRef.current = currentSession
  }, [currentSession])

  // TODO: Get gym_slug from user context or settings
  const gymSlug = 'default-gym'

  // Subscribe to session changes
  useEffect(() => {
    // Get initial session (only running/paused sessions)
    getCurrentSession(gymSlug).then(setCurrentSession)

    // Subscribe to changes
    // Note: subscribeToSessionChanges filters to only send running/paused sessions
    const channel = subscribeToSessionChanges(gymSlug, (session) => {
      // session will be null if stopped/ended, or a running/paused session
      setCurrentSession(session)
    })

    return () => {
      channel.unsubscribe()
    }
  }, [gymSlug])

  // Auto-advance polling when session is running
  // TASK-037: Robust polling with setInterval(1000) while status=running
  // TASK-053: Uses state_version for idempotent updates (optimistic locking)
  useEffect(() => {
    const sessionId = currentSession?.id
    const sessionStatus = currentSession?.status
    
    // Only poll when session exists and is running
    if (!sessionId || sessionStatus !== SessionStatus.RUNNING) {
      return
    }

    const interval = setInterval(async () => {
      // Get latest session state from ref (avoids stale closure)
      const latestSession = sessionRef.current
      
      // Double-check session still exists and is running
      if (!latestSession || latestSession.id !== sessionId || latestSession.status !== SessionStatus.RUNNING) {
        return
      }

      // Fetch fresh session state to check step_end_time
      // This ensures we're checking against the latest database state
      const { checkAndAdvanceSession } = await import('@/lib/auto-advance')
      
      // Store old state for debug logging
      const oldBlockIndex = latestSession.current_block_index
      const oldStepIndex = latestSession.current_step_index
      const oldStateVersion = latestSession.state_version
      
      // Call checkAndAdvanceSession with expected state_version for optimistic locking
      const updatedSession = await checkAndAdvanceSession(
        sessionId,
        oldStateVersion
      )
      
      // If session was advanced, update state and log debug info
      if (updatedSession && updatedSession.id === sessionId) {
        // Check if step actually changed (auto-advance triggered)
        if (
          updatedSession.current_block_index !== oldBlockIndex ||
          updatedSession.current_step_index !== oldStepIndex
        ) {
          // Debug logging (dev only)
          if (process.env.NODE_ENV === 'development') {
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
        }
        
        setCurrentSession(updatedSession)
      }
    }, 1000) // Check every second

    return () => clearInterval(interval)
  }, [currentSession?.id, currentSession?.status])

  const handleStartSession = async () => {
    if (!selectedTemplate) {
      setError('Vennligst velg en template først')
      return
    }

    setIsStarting(true)
    setError(null)

    try {
      const templateSnapshot = createTemplateSnapshot(selectedTemplate)
      const session = await startSession(gymSlug, templateSnapshot)

      if (session) {
        setCurrentSession(session)
      } else {
        setError('Kunne ikke starte session')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukjent feil')
    } finally {
      setIsStarting(false)
    }
  }

  // Helper: Check if there's an active session (running or paused)
  const hasActiveSession =
    currentSession &&
    (currentSession.status === SessionStatus.RUNNING ||
      currentSession.status === SessionStatus.PAUSED)

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Coach Dashboard</h1>
      
      <SessionStatusComponent session={currentSession} />

      {hasActiveSession && (
        <div className="mt-6">
          <SessionControls session={currentSession} />
        </div>
      )}

      <div className="mt-8">
        <TemplateSelector
          onSelect={setSelectedTemplate}
          selectedTemplateId={selectedTemplate?.id}
        />
        {selectedTemplate && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold">Valgt: {selectedTemplate.name}</p>
            </div>
            <button
              onClick={handleStartSession}
              disabled={isStarting || !!hasActiveSession}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting ? 'Starter...' : 'Start Session'}
            </button>
            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CoachPage() {
  return (
    <ErrorBoundary>
      <CoachPageContent />
    </ErrorBoundary>
  )
}

