'use client'

import { useEffect, useRef } from 'react'
import Lottie, { type LottieRefCurrentProps } from 'lottie-react'

interface ExerciseAnimationProps {
  animationData?: object
  paused?: boolean
  className?: string
}

/**
 * Exercise Animation Component using Lottie
 * Displays side-view exercise animations with pause/play support
 */
export function ExerciseAnimation({
  animationData,
  paused = false,
  className = '',
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

  if (!animationData) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 rounded-lg ${className}`}>
        <div className="text-gray-600 text-xl">DEMO MANGLER</div>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={true}
        autoplay={!paused}
        style={{ width: '100%', height: '100%', maxWidth: '400px', maxHeight: '400px' }}
      />
    </div>
  )
}

