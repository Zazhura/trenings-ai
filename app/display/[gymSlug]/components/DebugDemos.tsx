'use client'

import { useEffect, useState } from 'react'
import { getMissingDemos, getMissingDemosCount } from '@/lib/exercises/missingDemos'

interface DebugDemosProps {
  isVisible: boolean
}

/**
 * Debug component to show missing demos
 * Only visible when ?debugDemos=1 is in URL
 */
export function DebugDemos({ isVisible }: DebugDemosProps) {
  const [missingDemos, setMissingDemos] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isVisible) return

    // Update missing demos periodically
    const updateMissing = () => {
      setMissingDemos(getMissingDemos())
    }

    updateMissing()
    const interval = setInterval(updateMissing, 1000)

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

  return (
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
  )
}

