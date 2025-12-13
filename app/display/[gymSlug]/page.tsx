'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { SessionState, SessionStatus } from '@/types/session'
import { getCurrentSession, subscribeToSessionChanges } from '@/lib/realtime'
import { DisplayContent } from './components/DisplayContent'
import { ErrorBoundary } from './components/ErrorBoundary'
import { DebugDemos } from './components/DebugDemos'

function DisplayPageContent({
  params,
}: {
  params: { gymSlug: string }
}) {
  const searchParams = useSearchParams()
  const [session, setSession] = useState<SessionState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const showDebugDemos = searchParams.get('debugDemos') === '1'

  useEffect(() => {
    let channel: ReturnType<typeof subscribeToSessionChanges> | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const setupSubscription = async () => {
      try {
        // Get initial session state (TASK-050: handles refresh mid-step)
        const initialSession = await getCurrentSession(params.gymSlug)
        setSession(initialSession)
        setIsLoading(false)

        // Subscribe to realtime changes
        channel = subscribeToSessionChanges(params.gymSlug, (newSession) => {
          setSession(newSession)
          setIsLoading(false)
        })

        // TASK-052: Handle Realtime reconnection
        // Listen for connection state changes
        channel.on('system', {}, (payload) => {
          if (payload.status === 'SUBSCRIBED') {
            // Reconnected - fetch latest state
            getCurrentSession(params.gymSlug)
              .then((latestSession) => {
                setSession(latestSession)
              })
              .catch(console.error)
          }
        })
      } catch (error) {
        console.error('Error setting up subscription:', error)
        setIsLoading(false)

        // TASK-052: Retry connection after delay
        reconnectTimeout = setTimeout(() => {
          setupSubscription()
        }, 5000)
      }
    }

    setupSubscription()

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
    }
  }, [params.gymSlug])

  // Scoreboard layout with dark "kino-mode" theme
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
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
              Kobler til Realtime...
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
        <DisplayContent session={session} />
      )}
      
      {/* Fullscreen hint - desktop only */}
      <div className="hidden md:block fixed bottom-4 right-4 text-xs text-gray-600">
        Trykk F11 for fullskjerm
      </div>

      {/* Debug demos - only when ?debugDemos=1 */}
      <DebugDemos isVisible={showDebugDemos} />
    </div>
  )
}

export default function DisplayPage(props: { params: { gymSlug: string } }) {
  return (
    <ErrorBoundary>
      <DisplayPageContent {...props} />
    </ErrorBoundary>
  )
}

