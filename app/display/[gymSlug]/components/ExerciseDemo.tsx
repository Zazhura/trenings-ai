'use client'

import { useEffect, useState } from 'react'
import { getExerciseDemo, normalizeExerciseName } from '@/lib/exercises/exerciseRegistry'
import { ExerciseAnimation } from '@/components/exercises/ExerciseAnimation'

interface ExerciseDemoProps {
  exerciseName: string
  isPaused: boolean
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
export function ExerciseDemo({ exerciseName, isPaused }: ExerciseDemoProps) {
  const [animationData, setAnimationData] = useState<object | null>(null)
  const demo = getExerciseDemo(exerciseName)

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

  // Load Lottie animation with cache
  useEffect(() => {
    if (demo && demo.demo.kind === 'lottie') {
      const lottieDemo = demo.demo as Extract<typeof demo.demo, { kind: 'lottie' }>
      const fileUrl = lottieDemo.lottieFile

      // Check cache first
      if (animationCache.has(fileUrl)) {
        setAnimationData(animationCache.get(fileUrl)!)
        return
      }

      // Fetch with force-cache for optimal caching
      fetch(fileUrl, { cache: 'force-cache' })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to load: ${fileUrl}`)
          }
          return res.json()
        })
        .then((data) => {
          animationCache.set(fileUrl, data)
          setAnimationData(data)
        })
        .catch((err) => {
          // Log error once per file
          const errorKey = `error:${fileUrl}`
          if (!loggedWarnings.has(errorKey)) {
            console.error(`[ExerciseDemo] Failed to load animation: ${fileUrl}`, err)
            loggedWarnings.add(errorKey)
          }
          setAnimationData(null)
        })
    } else {
      setAnimationData(null)
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

  // Render placeholder for exercises without animations (same height as animation)
  return (
    <div className="w-full max-w-md bg-gray-900 rounded-lg flex items-center justify-center min-h-[240px] md:min-h-[320px] lg:min-h-[420px]">
      <div className="text-gray-600 text-xl">
        {demo?.demo.kind === 'placeholder' ? demo.demo.label : 'DEMO MANGLER'}
      </div>
    </div>
  )
}

