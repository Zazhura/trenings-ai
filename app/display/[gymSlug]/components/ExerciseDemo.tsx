'use client'

import { useEffect } from 'react'
import { getExerciseDemo, normalizeExerciseName } from '@/lib/exercises/exerciseRegistry'
import { registerMissingDemo } from '@/lib/exercises/missingDemos'
import { setExerciseDebugInfo, type ExerciseDebugInfo } from '@/lib/exercises/debugInfo'

interface ExerciseDemoProps {
  exerciseName: string
  isPaused: boolean
  debugMode?: boolean
}

// Track logged warnings to avoid spam
const loggedWarnings = new Set<string>()

/**
 * Exercise Demo Component
 * Displays exercise placeholders
 */
export function ExerciseDemo({ exerciseName, debugMode = false }: ExerciseDemoProps) {
  const demo = getExerciseDemo(exerciseName)
  const normalizedKey = normalizeExerciseName(exerciseName)

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

  // Render premium placeholder for exercises
  const displayName = demo?.name || exerciseName
  return (
    <div className="w-full max-w-md min-h-[240px] md:min-h-[320px] lg:min-h-[420px] flex items-center justify-center">
      {/* Premium brand frame */}
      <div className="relative w-full h-full rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm flex flex-col items-center justify-center p-8">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-transparent via-gray-800/20 to-transparent pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10 text-center space-y-3">
          <div className="text-lg md:text-xl font-semibold text-gray-300">
            {displayName}
          </div>
          <div className="text-sm md:text-base text-gray-500 font-light">
            Demo kommer
          </div>
        </div>
      </div>
    </div>
  )
}

