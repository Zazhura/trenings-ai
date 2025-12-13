'use client'

import { useEffect, useState } from 'react'
import { getExerciseDemo, normalizeToSlug } from '@/lib/exercises/exerciseRegistry'
import { ExerciseAnimation } from '@/components/exercises/ExerciseAnimation'

interface ExerciseDemoProps {
  exerciseName: string
  isPaused: boolean
}

/**
 * Exercise Demo Component
 * Displays exercise demos using Lottie animations or placeholders
 */
export function ExerciseDemo({ exerciseName, isPaused }: ExerciseDemoProps) {
  const [animationData, setAnimationData] = useState<object | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const demo = getExerciseDemo(exerciseName)

  // Dev logging for missing mappings
  useEffect(() => {
    if (!demo && process.env.NODE_ENV === 'development') {
      const slug = normalizeToSlug(exerciseName)
      console.warn(`[ExerciseDemo] Missing mapping for: "${exerciseName}" (slug: "${slug}")`)
    }
  }, [exerciseName, demo])

  // Load Lottie animation data dynamically
  useEffect(() => {
    if (demo && demo.demo.kind === 'lottie') {
      const lottieDemo = demo.demo as Extract<typeof demo.demo, { kind: 'lottie' }>
      setIsLoading(true)
      fetch(lottieDemo.lottieFile)
        .then((res) => res.json())
        .then((data) => {
          setAnimationData(data)
          setIsLoading(false)
        })
        .catch((err) => {
          console.error(`[ExerciseDemo] Failed to load animation: ${lottieDemo.lottieFile}`, err)
          setIsLoading(false)
        })
    } else {
      setAnimationData(null)
    }
  }, [demo])

  // Render Lottie animation if available
  if (demo && demo.demo.kind === 'lottie') {
    if (isLoading) {
      return (
        <div className="w-full max-w-md aspect-square bg-gray-900 rounded-lg flex items-center justify-center">
          <div className="text-gray-600 text-xl">Laster...</div>
        </div>
      )
    }

    if (animationData) {
      return (
        <ExerciseAnimation
          animationData={animationData}
          paused={isPaused}
          className="w-full max-w-md aspect-square"
        />
      )
    }
  }

  // Render placeholder for exercises without animations
  return (
    <div className="w-full max-w-md aspect-square bg-gray-900 rounded-lg flex items-center justify-center">
      <div className="text-gray-600 text-xl">
        {demo?.demo.kind === 'placeholder' ? demo.demo.label : 'DEMO MANGLER'}
      </div>
    </div>
  )
}

