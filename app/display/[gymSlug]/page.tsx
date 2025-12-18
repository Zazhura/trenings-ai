'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { SessionState, SessionStatus } from '@/types/session'
import { DisplayContent } from './components/DisplayContent'
import { ErrorBoundary } from './components/ErrorBoundary'
import { DebugDemos } from './components/DebugDemos'
import { DebugFooter } from '@/components/debug/DebugFooter'

/**
 * Fetch current session from API endpoint
 */
async function fetchCurrentSession(gymSlug: string): Promise<SessionState | null> {
  try {
    const response = await fetch(`/api/display/${gymSlug}/current-session`)
    if (!response.ok) {
      console.error('Failed to fetch current session:', response.statusText)
      return null
    }
    const data = await response.json()
    
    // Handle new response format with debug info
    const session = data.session || data
    
    if (!session) {
      // Log debug info if available
      if (data.debug) {
        console.log('[fetchCurrentSession] Debug info:', data.debug)
      }
      return null
    }
    
    // Convert ISO strings back to Date objects
    return {
      ...session,
      step_end_time: session.step_end_time ? new Date(session.step_end_time) : null,
      block_end_time: session.block_end_time ? new Date(session.block_end_time) : null,
      created_at: new Date(session.created_at),
      updated_at: new Date(session.updated_at),
    } as SessionState
  } catch (error) {
    console.error('Error fetching current session:', error)
    return null
  }
}

function DisplayPageContent({
  params,
}: {
  params: { gymSlug: string }
}) {
  const searchParams = useSearchParams()
  const [session, setSession] = useState<SessionState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const showDebugDemos = searchParams.get('debugDemos') === '1'
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const previousSessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Fetch initial session state on mount
    fetchCurrentSession(params.gymSlug).then((initialSession) => {
      setSession(initialSession)
      setIsLoading(false)
      previousSessionIdRef.current = initialSession?.id || null
    })

    // Start polling every 1000ms
    pollingIntervalRef.current = setInterval(async () => {
      const currentSession = await fetchCurrentSession(params.gymSlug)
      
      // Update session state (React will handle re-render only if changed)
      setSession((prevSession) => {
        // Only update if session actually changed
        if (!prevSession && !currentSession) {
          return prevSession // Both null, no change
        }
        if (!prevSession || !currentSession) {
          previousSessionIdRef.current = currentSession?.id || null
          return currentSession // One is null, update
        }
        
        // Compare key fields to detect changes
        const changed = 
          prevSession.id !== currentSession.id ||
          prevSession.status !== currentSession.status ||
          prevSession.current_block_index !== currentSession.current_block_index ||
          prevSession.current_step_index !== currentSession.current_step_index ||
          prevSession.state_version !== currentSession.state_version ||
          prevSession.step_end_time?.getTime() !== currentSession.step_end_time?.getTime() ||
          prevSession.block_end_time?.getTime() !== currentSession.block_end_time?.getTime()

        if (changed) {
          previousSessionIdRef.current = currentSession.id
          return currentSession
        }
        
        return prevSession // No change, keep previous
      })
      setIsLoading(false)
    }, 1000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [params.gymSlug])

  // Scoreboard layout with dark "kino-mode" theme
  return (
    <>
      <div className="min-h-screen bg-black text-white flex flex-col pb-12">
        {isLoading ? (
          // Loading skeleton - no layout jump
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-9xl font-bold tabular-nums text-gray-700 mb-8">
                00:00
              </div>
              <div className="text-4xl font-semibold text-gray-500 mb-4 max-w-2xl">
                Laster...
              </div>
              <div className="text-xl text-gray-600">
                Laster session...
              </div>
            </div>
          </div>
        ) : !session || 
            session.status === SessionStatus.STOPPED || 
            session.status === SessionStatus.ENDED ? (
          // Empty state: No session, stopped, or ended
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center max-w-4xl">
              <div className="text-8xl sm:text-9xl font-bold mb-8 text-gray-700">
                VENTER PÅ COACH
              </div>
              <div className="text-2xl sm:text-3xl text-gray-400">
                Ingen aktiv økt
              </div>
            </div>
          </div>
        ) : (
          // Active session - show scoreboard
          <DisplayContent session={session} debugMode={showDebugDemos} />
        )}
        
        {/* Fullscreen hint - desktop only */}
        <div className="hidden md:block fixed bottom-4 right-4 text-xs text-gray-600">
          Trykk F11 for fullskjerm
        </div>

        {/* Debug demos - only when ?debugDemos=1 */}
        <DebugDemos isVisible={showDebugDemos} />
      </div>
      <DebugFooter
        gymSlug={params.gymSlug}
        currentSessionId={session?.id}
      />
    </>
  )
}

export default function DisplayPage(props: { params: { gymSlug: string } }) {
  return (
    <ErrorBoundary>
      <DisplayPageContent {...props} />
    </ErrorBoundary>
  )
}

