'use client'

interface DebugFooterProps {
  gymSlug?: string
  gymId?: string
  currentSessionId?: string | null
}

export function DebugFooter({ gymSlug, gymId, currentSessionId }: DebugFooterProps) {
  // Only show in development or when NEXT_PUBLIC_DEBUG is true
  const isDebugMode =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_DEBUG === 'true'

  if (!isDebugMode) {
    return null
  }

  // Extract hostname from NEXT_PUBLIC_SUPABASE_URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseHostname = supabaseUrl
    ? new URL(supabaseUrl).hostname
    : 'N/A'

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-gray-400 text-xs px-4 py-2 border-t border-gray-800 z-50">
      <div className="flex flex-wrap items-center gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-500">DEBUG:</span>
          <span>Supabase:</span>
          <span className="font-mono text-gray-300">{supabaseHostname}</span>
        </div>
        {gymSlug && (
          <div className="flex items-center gap-2">
            <span>Gym Slug:</span>
            <span className="font-mono text-gray-300">{gymSlug}</span>
          </div>
        )}
        {gymId && (
          <div className="flex items-center gap-2">
            <span>Gym ID:</span>
            <span className="font-mono text-gray-300">{gymId}</span>
          </div>
        )}
        {currentSessionId ? (
          <div className="flex items-center gap-2">
            <span>Session ID:</span>
            <span className="font-mono text-gray-300">{currentSessionId}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>Session ID:</span>
            <span className="text-gray-500">Ingen aktiv session</span>
          </div>
        )}
      </div>
    </div>
  )
}

