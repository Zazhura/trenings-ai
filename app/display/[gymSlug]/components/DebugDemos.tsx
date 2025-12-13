'use client'

import { useEffect, useState } from 'react'
import { getMissingDemos, getMissingDemosCount } from '@/lib/exercises/missingDemos'
import { getExerciseDebugInfo, type ExerciseDebugInfo } from '@/lib/exercises/debugInfo'

interface DebugDemosProps {
  isVisible: boolean
}

/**
 * Debug component to show missing demos and current exercise debug info
 * Only visible when ?debugDemos=1 is in URL
 */
export function DebugDemos({ isVisible }: DebugDemosProps) {
  const [missingDemos, setMissingDemos] = useState<string[]>([])
  const [debugInfo, setDebugInfo] = useState<ExerciseDebugInfo | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isVisible) return

    // Update missing demos and debug info periodically
    const update = () => {
      setMissingDemos(getMissingDemos())
      setDebugInfo(getExerciseDebugInfo())
    }

    update()
    const interval = setInterval(update, 500)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  const count = getMissingDemosCount()
  const displayList = missingDemos.slice(0, 10)
  const hasMore = missingDemos.length > 10

  const handleCopy = () => {
    const text = missingDemos.join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const getStatusColor = (status: ExerciseDebugInfo['fetchStatus']) => {
    switch (status) {
      case 'ok':
        return 'text-green-400'
      case '404':
        return 'text-red-400'
      case 'error':
        return 'text-red-400'
      case 'loading':
        return 'text-yellow-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <>
      {/* Current Exercise Debug Info - Bottom Left */}
      {debugInfo && (
        <div className="fixed bottom-4 left-4 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg max-w-sm z-50">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Current Exercise</h3>
          <div className="space-y-2 text-xs font-mono">
            <div>
              <span className="text-gray-500">Raw:</span>{' '}
              <span className="text-gray-300">{debugInfo.rawName}</span>
            </div>
            <div>
              <span className="text-gray-500">Key:</span>{' '}
              <span className="text-gray-300">{debugInfo.normalizedKey}</span>
            </div>
            <div>
              <span className="text-gray-500">Registry:</span>{' '}
              <span className={debugInfo.registryHit ? 'text-green-400' : 'text-red-400'}>
                {debugInfo.registryHit ? '✓ Hit' : '✗ Miss'}
              </span>
            </div>
            {debugInfo.assetPath && (
              <div>
                <span className="text-gray-500">Asset:</span>{' '}
                <span className="text-gray-300 break-all">{debugInfo.assetPath}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Fetch:</span>{' '}
              <span className={getStatusColor(debugInfo.fetchStatus)}>
                {debugInfo.fetchStatus}
              </span>
            </div>
            {debugInfo.fetchError && (
              <div className="text-red-400 break-all">
                {debugInfo.fetchError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Missing Demos List - Bottom Right */}
      <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg max-w-sm z-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-300">
            Missing demos: {count}
          </h3>
          {count > 0 && (
            <button
              onClick={handleCopy}
              className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
        {count === 0 ? (
          <p className="text-xs text-green-400">✅ All exercises have demos</p>
        ) : (
          <div className="space-y-1">
            <ul className="text-xs text-gray-400 space-y-1 max-h-48 overflow-y-auto">
              {displayList.map((slug) => (
                <li key={slug} className="font-mono">
                  {slug}
                </li>
              ))}
            </ul>
            {hasMore && (
              <p className="text-xs text-gray-500">
                ... and {missingDemos.length - 10} more
              </p>
            )}
          </div>
        )}
      </div>
    </>
  )
}

