'use client'

import { useEffect, useState } from 'react'
import { getExerciseDemo, normalizeExerciseName } from '@/lib/exercises/exerciseRegistry'
import { registerMissingDemo } from '@/lib/exercises/missingDemos'
import { setExerciseDebugInfo, type ExerciseDebugInfo } from '@/lib/exercises/debugInfo'
import { getExerciseMedia } from '@/lib/exercises/exerciseMediaPack'

interface ExerciseDemoProps {
  exerciseName: string
  isPaused: boolean
  debugMode?: boolean
}

// Track logged warnings to avoid spam
const loggedWarnings = new Set<string>()

/**
 * Exercise Demo Component
 * Displays exercise media (SVG) or placeholders
 */
export function ExerciseDemo({ exerciseName, debugMode = false }: ExerciseDemoProps) {
  const demo = getExerciseDemo(exerciseName)
  const normalizedKey = normalizeExerciseName(exerciseName)
  const media = getExerciseMedia(exerciseName)
  const [imageError, setImageError] = useState(false)

  // Dev logging for missing mappings (once per exercise)
  useEffect(() => {
    if (!demo && process.env.NODE_ENV === 'development') {
      const slug = normalizeExerciseName(exerciseName)
      const warningKey = `missing:${slug}`
      if (!loggedWarnings.has(warningKey)) {
        console.warn(`[ExerciseDemo] Missing mapping for: "${exerciseName}" (slug: "${slug}")`)
        loggedWarnings.add(warningKey)
      }
    }
  }, [exerciseName, demo])

  // Update debug info
  useEffect(() => {
    if (debugMode) {
      const debugInfo: ExerciseDebugInfo = {
        rawName: exerciseName,
        normalizedKey,
        registryHit: !!demo,
        assetPath: null,
        fetchStatus: 'idle',
        fetchError: null,
      }
      setExerciseDebugInfo(debugInfo)
    }
  }, [debugMode, exerciseName, normalizedKey, demo])

  // Register missing demo when placeholder is used
  useEffect(() => {
    if (!demo || demo.demo.kind === 'placeholder') {
      registerMissingDemo(normalizedKey)
    }
  }, [exerciseName, demo, normalizedKey])

  // Reset image error when exercise changes
  useEffect(() => {
    setImageError(false)
  }, [exerciseName])

  // Render exercise media or placeholder
  const displayName = demo?.name || exerciseName
  const hasMedia = media && !imageError

  return (
    <div className="w-full max-w-md min-h-[240px] md:min-h-[320px] lg:min-h-[420px] flex items-center justify-center">
      {/* Premium brand frame */}
      <div className="relative w-full h-full rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm flex flex-col items-center justify-center p-8">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-transparent via-gray-800/20 to-transparent pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10 text-center space-y-3">
          {hasMedia && media.type === 'svg' ? (
            <>
              <img
                src={media.src}
                alt={media.alt}
                className="w-48 h-48 md:w-64 md:h-64 object-contain filter brightness-0 invert"
                onError={() => setImageError(true)}
              />
              <div className="text-lg md:text-xl font-semibold text-gray-300">
                {displayName}
              </div>
            </>
          ) : (
            <>
              <div className="text-lg md:text-xl font-semibold text-gray-300">
                {displayName}
              </div>
              <div className="text-sm md:text-base text-gray-500 font-light">
                Demo kommer
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

