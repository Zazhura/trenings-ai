'use client'

import { useEffect, useState } from 'react'
import { SessionState, SessionStatus } from '@/types/session'
import { getCurrentSession, subscribeToSessionChanges } from '@/lib/realtime'
import { DisplayContent } from './components/DisplayContent'
import { ErrorBoundary } from './components/ErrorBoundary'

function DisplayPageContent({
  params,
}: {
  params: { gymSlug: string }
}) {
  const [session, setSession] = useState<SessionState | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  // TASK-057: Add loading states
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-6xl font-bold mb-4">Laster...</p>
          <p className="text-2xl text-muted-foreground">
            Kobler til Realtime...
          </p>
        </div>
      </div>
    )
  }

  // No active session
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-6xl font-bold text-muted-foreground">
          Ingen aktiv økt
        </div>
      </div>
    )
  }

  // Session ended
  if (session.status === SessionStatus.ENDED) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-6xl font-bold">Økt ferdig</div>
      </div>
    )
  }

  // Session stopped
  if (session.status === SessionStatus.STOPPED) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-6xl font-bold">Økt stoppet</div>
      </div>
    )
  }

  // Active session - show content
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <DisplayContent session={session} />
      </div>
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

