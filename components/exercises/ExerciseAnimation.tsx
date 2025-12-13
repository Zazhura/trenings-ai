'use client'

import { useEffect, useRef } from 'react'
import Lottie, { type LottieRefCurrentProps } from 'lottie-react'

interface ExerciseAnimationProps {
  animationData?: object
  paused?: boolean
  className?: string
  debugMode?: boolean
}

/**
 * Exercise Animation Component using Lottie
 * Displays side-view exercise animations with pause/play support
 * Fixed height to prevent layout jumps
 */
export function ExerciseAnimation({
  animationData,
  paused = false,
  className = '',
  debugMode = false,
}: ExerciseAnimationProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null)

  // Control animation playback based on paused state
  useEffect(() => {
    if (!lottieRef.current) return

    if (paused) {
      lottieRef.current.pause()
    } else {
      lottieRef.current.play()
    }
  }, [paused])

  // Skeleton placeholder with same height to prevent layout jump
  if (!animationData) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-900 rounded-lg min-h-[240px] md:min-h-[320px] lg:min-h-[420px] ${className}`}
      >
        <div className="text-gray-600 text-xl">DEMO MANGLER</div>
      </div>
    )
  }

  return (
    <div
      className={`relative flex items-center justify-center bg-white/5 rounded-lg overflow-hidden min-h-[240px] md:min-h-[320px] lg:min-h-[420px] ${className}`}
    >
      {/* Debug indicator */}
      {debugMode && (
        <div className="absolute top-2 left-2 text-xs text-green-400 z-10 bg-black/50 px-2 py-1 rounded">
          rendered: true
        </div>
      )}
      
      {/* Lottie wrapper with explicit sizing */}
      <div className="w-full h-full exerciseAnim">
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={true}
          autoplay={!paused}
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid meet',
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )
}

