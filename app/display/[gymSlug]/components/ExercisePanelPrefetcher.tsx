'use client'

import { useEffect } from 'react'
import type { Exercise } from '@/types/exercise'
import { getExerciseById } from '@/lib/exercises/db-operations'

interface ExercisePanelPrefetcherProps {
  exerciseId?: string
}

/**
 * Prefetches exercise media for the next step
 * This improves perceived performance when advancing to next step
 */
export function ExercisePanelPrefetcher({ exerciseId }: ExercisePanelPrefetcherProps) {
  useEffect(() => {
    if (!exerciseId) {
      return
    }

    // Prefetch exercise data and media
    getExerciseById(exerciseId)
      .then((exercise) => {
        if (!exercise) {
          return
        }

        // Prefetch motion asset if available
        if (exercise.motion_asset_url) {
          const link = document.createElement('link')
          link.rel = 'prefetch'
          link.as = 'image'
          link.href = exercise.motion_asset_url
          document.head.appendChild(link)
        }

        // Prefetch video asset if available
        if (exercise.video_asset_url) {
          const link = document.createElement('link')
          link.rel = 'prefetch'
          link.as = 'video'
          link.href = exercise.video_asset_url
          document.head.appendChild(link)
        }
      })
      .catch((error) => {
        // Silently fail prefetching - not critical
        console.debug('Prefetch failed:', error)
      })
  }, [exerciseId])

  // This component doesn't render anything
  return null
}

