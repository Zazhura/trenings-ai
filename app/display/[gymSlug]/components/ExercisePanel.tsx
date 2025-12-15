'use client'

import { useEffect, useState } from 'react'
import type { Exercise } from '@/types/exercise'
import { getExerciseById } from '@/lib/exercises/db-operations'

interface ExercisePanelProps {
  exerciseId?: string
  exerciseTitle?: string // Fallback title if exerciseId not available
  isPaused?: boolean
  debugMode?: boolean
}

/**
 * Exercise Panel Component
 * Displays exercise media (motion/video) with robust fallbacks
 * 
 * Fallback hierarchy:
 * 1. If exerciseId exists and has motion_asset_url → show motion
 * 2. If exerciseId exists and has video_asset_url → show video
 * 3. If exerciseId exists but no media → show "Media mangler for denne øvelsen"
 * 4. If exerciseId missing → show "Ingen øvelse koblet"
 * 5. If media fails to load → show "Media utilgjengelig"
 * 
 * Never shows blank/black surface
 */
export function ExercisePanel({ 
  exerciseId, 
  exerciseTitle,
  isPaused = false,
  debugMode = false 
}: ExercisePanelProps) {
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [mediaError, setMediaError] = useState(false)
  const [mediaType, setMediaType] = useState<'motion' | 'video' | null>(null)

  // Load exercise data when exerciseId changes
  useEffect(() => {
    if (!exerciseId) {
      setExercise(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setMediaError(false)
    getExerciseById(exerciseId)
      .then((ex) => {
        setExercise(ex)
        if (ex) {
          // Determine media type priority: motion > video
          if (ex.motion_asset_url) {
            setMediaType('motion')
          } else if (ex.video_asset_url) {
            setMediaType('video')
          } else {
            setMediaType(null)
          }
        }
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error loading exercise:', error)
        setExercise(null)
        setLoading(false)
      })
  }, [exerciseId])

  // Reset media error when exercise changes
  useEffect(() => {
    setMediaError(false)
  }, [exerciseId, mediaType])

  // Determine what to display
  const displayTitle = exercise?.name || exerciseTitle || 'Øvelse'
  const hasMedia = exercise && (exercise.motion_asset_url || exercise.video_asset_url) && !mediaError
  const mediaUrl = exercise?.motion_asset_url || exercise?.video_asset_url

  // Fallback states
  if (!exerciseId) {
    return (
      <div className="w-full max-w-4xl mx-auto aspect-video flex items-center justify-center">
        <div className="relative w-full h-full rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="text-2xl md:text-3xl font-semibold text-gray-400">
              Ingen øvelse koblet
            </div>
            {exerciseTitle && (
              <div className="text-lg md:text-xl text-gray-500">
                {exerciseTitle}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto aspect-video flex items-center justify-center">
        <div className="relative w-full h-full rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="text-xl md:text-2xl font-semibold text-gray-400">
              Laster øvelse...
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!exercise) {
    return (
      <div className="w-full max-w-4xl mx-auto aspect-video flex items-center justify-center">
        <div className="relative w-full h-full rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="text-2xl md:text-3xl font-semibold text-gray-400">
              Øvelse ikke funnet
            </div>
            {exerciseTitle && (
              <div className="text-lg md:text-xl text-gray-500">
                {exerciseTitle}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!hasMedia) {
    return (
      <div className="w-full max-w-4xl mx-auto aspect-video flex items-center justify-center">
        <div className="relative w-full h-full rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="text-2xl md:text-3xl font-semibold text-gray-300">
              {displayTitle}
            </div>
            <div className="text-lg md:text-xl text-gray-500">
              Media mangler for denne øvelsen
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render media
  return (
    <div className="w-full max-w-4xl mx-auto aspect-video">
      <div className="relative w-full h-full rounded-lg border border-gray-700/50 bg-black overflow-hidden">
        {mediaType === 'motion' && exercise.motion_asset_url && (
          <img
            src={exercise.motion_asset_url}
            alt={displayTitle}
            className="w-full h-full object-contain"
            onError={() => setMediaError(true)}
          />
        )}
        {mediaType === 'video' && exercise.video_asset_url && (
          <video
            src={exercise.video_asset_url}
            className="w-full h-full object-contain"
            muted
            loop
            autoPlay={!isPaused}
            playsInline
            onError={() => setMediaError(true)}
          />
        )}
        
        {/* Fallback overlay if media fails */}
        {mediaError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900/50 to-gray-800/30">
            <div className="text-center space-y-3">
              <div className="text-2xl md:text-3xl font-semibold text-gray-300">
                {displayTitle}
              </div>
              <div className="text-lg md:text-xl text-gray-500">
                Media utilgjengelig
              </div>
            </div>
          </div>
        )}

        {/* Debug info overlay */}
        {debugMode && (
          <div className="absolute top-2 left-2 bg-black/80 text-xs text-white p-2 rounded font-mono">
            <div>Exercise ID: {exerciseId || 'none'}</div>
            <div>Media Type: {mediaType || 'none'}</div>
            <div>Has Motion: {exercise.motion_asset_url ? 'yes' : 'no'}</div>
            <div>Has Video: {exercise.video_asset_url ? 'yes' : 'no'}</div>
            <div>Error: {mediaError ? 'yes' : 'no'}</div>
          </div>
        )}
      </div>
    </div>
  )
}

