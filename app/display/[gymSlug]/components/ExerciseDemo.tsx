'use client'

import { useEffect, useState } from 'react'
import { getExerciseDemo, normalizeExerciseName } from '@/lib/exercises/exerciseRegistry'
import { registerMissingDemo } from '@/lib/exercises/missingDemos'
import { setExerciseDebugInfo, type ExerciseDebugInfo } from '@/lib/exercises/debugInfo'
import { ExerciseAnimation } from '@/components/exercises/ExerciseAnimation'

interface ExerciseDemoProps {
  exerciseName: string
  isPaused: boolean
  debugMode?: boolean
}

// Cache for loaded animations
const animationCache = new Map<string, object>()

// Track logged warnings to avoid spam
const loggedWarnings = new Set<string>()

/**
 * Exercise Demo Component
 * Displays exercise demos using Lottie animations or placeholders
 * Uses fetch with force-cache for smooth, flicker-free loading
 */
export function ExerciseDemo({ exerciseName, isPaused, debugMode = false }: ExerciseDemoProps) {
  const [animationData, setAnimationData] = useState<object | null>(null)
  const [fetchStatus, setFetchStatus] = useState<ExerciseDebugInfo['fetchStatus']>('idle')
  const [fetchError, setFetchError] = useState<string | null>(null)
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
        registryHit: !!demo && demo.demo.kind === 'lottie',
        assetPath: demo && demo.demo.kind === 'lottie' 
          ? (demo.demo as Extract<typeof demo.demo, { kind: 'lottie' }>).lottieFile 
          : null,
        fetchStatus,
        fetchError,
      }
      setExerciseDebugInfo(debugInfo)
    }
  }, [debugMode, exerciseName, normalizedKey, demo, fetchStatus, fetchError])

  // Register missing demo when placeholder is used
  useEffect(() => {
    if (!demo || demo.demo.kind === 'placeholder') {
      registerMissingDemo(normalizedKey)
    }
  }, [exerciseName, demo, normalizedKey])

  // Load Lottie animation with cache
  useEffect(() => {
    if (demo && demo.demo.kind === 'lottie') {
      const lottieDemo = demo.demo as Extract<typeof demo.demo, { kind: 'lottie' }>
      const fileUrl = lottieDemo.lottieFile

      // Check cache first
      if (animationCache.has(fileUrl)) {
        setAnimationData(animationCache.get(fileUrl)!)
        setFetchStatus('ok')
        setFetchError(null)
        return
      }

      setFetchStatus('loading')
      setFetchError(null)

      // Fetch with force-cache for optimal caching
      fetch(fileUrl, { cache: 'force-cache' })
        .then((res) => {
          if (res.status === 404) {
            const fullUrl = new URL(fileUrl, window.location.origin).href
            console.error(`[ExerciseDemo] 404 Not Found: ${fullUrl}`)
            setFetchStatus('404')
            setFetchError(`404: ${fullUrl}`)
            throw new Error(`404 Not Found: ${fileUrl}`)
          }
          if (!res.ok) {
            setFetchStatus('error')
            setFetchError(`HTTP ${res.status}: ${fileUrl}`)
            throw new Error(`Failed to load: ${fileUrl} (${res.status})`)
          }
          return res.json()
        })
        .then((data) => {
          animationCache.set(fileUrl, data)
          setAnimationData(data)
          setFetchStatus('ok')
          setFetchError(null)
        })
        .catch((err) => {
          // Log error once per file
          const errorKey = `error:${fileUrl}`
          if (!loggedWarnings.has(errorKey)) {
            console.error(`[ExerciseDemo] Failed to load animation: ${fileUrl}`, err)
            loggedWarnings.add(errorKey)
          }
          setAnimationData(null)
          // Only set error status if not already 404
          setFetchStatus((prev) => prev === '404' ? '404' : 'error')
          setFetchError(err.message || 'Unknown error')
        })
    } else {
      setAnimationData(null)
      setFetchStatus('idle')
      setFetchError(null)
    }
  }, [demo])

  // Render Lottie animation if available
  if (demo && demo.demo.kind === 'lottie') {
    return (
      <ExerciseAnimation
        animationData={animationData || undefined}
        paused={isPaused}
        className="w-full max-w-md"
      />
    )
  }

  // Render premium placeholder for exercises without animations
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

