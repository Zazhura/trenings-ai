'use client'

import { useState, useEffect } from 'react'
import { getExerciseDemo, normalizeToSlug, type ExerciseDemo } from '@/lib/exercises/exerciseRegistry'

interface ExerciseDemoProps {
  exerciseName: string
  isPaused: boolean
}

/**
 * Exercise Demo Component
 * Displays exercise demos based on registry entry
 * - Frames: animated keyframes
 * - Icon: static SVG icon
 * - Text: fallback text label
 */
export function ExerciseDemo({ exerciseName, isPaused }: ExerciseDemoProps) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const demo = getExerciseDemo(exerciseName)

  // Dev logging for missing mappings
  useEffect(() => {
    if (!demo && process.env.NODE_ENV === 'development') {
      const slug = normalizeToSlug(exerciseName)
      console.warn(`[ExerciseDemo] Missing mapping for: "${exerciseName}" (slug: "${slug}")`)
    }
  }, [exerciseName, demo])

  // Animate frames if demo is frames type and not paused
  useEffect(() => {
    if (!demo || demo.demo.kind !== 'frames' || isPaused) {
      return
    }

    const framesDemo = demo.demo as Extract<ExerciseDemo, { kind: 'frames' }>
    const fps = framesDemo.fps || 2
    const frames = framesDemo.frames || []

    if (frames.length === 0) {
      return
    }

    const interval = setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % frames.length)
    }, 1000 / fps)

    return () => clearInterval(interval)
  }, [demo, isPaused])

  // Reset frame index when paused or demo changes
  useEffect(() => {
    if (isPaused || !demo || demo.demo.kind !== 'frames') {
      setCurrentFrameIndex(0)
    }
  }, [isPaused, demo])

  // Fallback if no demo found
  if (!demo) {
    return (
      <div className="w-full max-w-md aspect-square bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-gray-600 text-xl">Ingen demo</div>
      </div>
    )
  }

  const { demo: demoConfig } = demo

  // Render frames animation
  if (demoConfig.kind === 'frames') {
    const framesDemo = demoConfig as Extract<ExerciseDemo, { kind: 'frames' }>
    const frames = framesDemo.frames || []
    const currentFrame = frames[currentFrameIndex] || frames[0] || ''

    return (
      <div className="w-full max-w-md aspect-square bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
        <div
          className="w-full h-full flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: currentFrame }}
        />
      </div>
    )
  }

  // Render icon
  if (demoConfig.kind === 'icon') {
    const iconDemo = demoConfig as Extract<ExerciseDemo, { kind: 'icon' }>
    return (
      <div className="w-full max-w-md aspect-square bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
        <div
          className="w-full h-full flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: iconDemo.iconSvg }}
        />
      </div>
    )
  }

  // Render text fallback
  const textDemo = demoConfig as Extract<ExerciseDemo, { kind: 'text' }>
  return (
    <div className="w-full max-w-md aspect-square bg-gray-900 rounded-lg flex items-center justify-center">
      <div className="text-gray-300 text-xl">{textDemo.label || demo.name}</div>
    </div>
  )
}

