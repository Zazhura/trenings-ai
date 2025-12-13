'use client'

import Image from 'next/image'
import { SessionState, SessionStatus } from '@/types/session'
import { CountdownTimer } from './CountdownTimer'

interface DisplayContentProps {
  session: SessionState
}

export function DisplayContent({ session }: DisplayContentProps) {
  const currentBlock =
    session.template_snapshot.blocks[session.current_block_index]
  const currentStep = currentBlock?.steps[session.current_step_index]

  const isRunning = session.status === SessionStatus.RUNNING
  const isPaused = session.status === SessionStatus.PAUSED

  // Get next step preview
  const getNextStepPreview = () => {
    if (!currentBlock || !currentStep) return null

    const nextStepIndex = session.current_step_index + 1
    if (nextStepIndex < currentBlock.steps.length) {
      return {
        block: currentBlock.name,
        step: currentBlock.steps[nextStepIndex],
      }
    }

    // Check if there's a next block
    const nextBlockIndex = session.current_block_index + 1
    if (
      nextBlockIndex < session.template_snapshot.blocks.length &&
      session.template_snapshot.blocks[nextBlockIndex].steps.length > 0
    ) {
      return {
        block: session.template_snapshot.blocks[nextBlockIndex].name,
        step: session.template_snapshot.blocks[nextBlockIndex].steps[0],
      }
    }

    return null
  }

  const nextStepPreview = getNextStepPreview()

  if (!currentBlock || !currentStep) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-8xl sm:text-9xl font-bold mb-8 text-gray-700">
            INGEN AKTIV STEP
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-12 sm:py-16">
      {/* PAUSED Banner */}
      {isPaused && (
        <div className="mb-8 px-8 py-4 bg-yellow-500 text-black rounded-lg">
          <div className="text-4xl sm:text-5xl font-bold text-center">
            PAUSE
          </div>
        </div>
      )}

      {/* Main Timer - Most Prominent */}
      <div className="mb-8 sm:mb-12">
        <CountdownTimer session={session} />
      </div>

      {/* Step Name - Large under timer */}
      <div className="mb-12 sm:mb-16 text-center max-w-5xl">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 break-words">
          {currentStep.title}
        </h1>
      </div>

      {/* Secondary Info Row */}
      <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
        {/* Block/Step Info */}
        <div className="space-y-2">
          <div className="text-lg sm:text-xl text-gray-400">Blokk</div>
          <div className="text-2xl sm:text-3xl font-semibold text-gray-300">
            {currentBlock.name}
          </div>
          <div className="text-base sm:text-lg text-gray-500">
            Steg {session.current_step_index + 1} av {currentBlock.steps.length}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <div className="text-lg sm:text-xl text-gray-400">Status</div>
          <div className="text-2xl sm:text-3xl font-semibold">
            {isRunning ? (
              <span className="text-green-400">KJØRER</span>
            ) : isPaused ? (
              <span className="text-yellow-400">PAUSET</span>
            ) : (
              <span className="text-gray-500">STOPPET</span>
            )}
          </div>
        </div>

        {/* Next Up */}
        <div className="space-y-2">
          <div className="text-lg sm:text-xl text-gray-400">Neste</div>
          {nextStepPreview ? (
            <>
              <div className="text-xl sm:text-2xl font-semibold text-gray-300">
                {nextStepPreview.step.title}
              </div>
              <div className="text-base sm:text-lg text-gray-500">
                {nextStepPreview.block}
              </div>
            </>
          ) : (
            <div className="text-xl sm:text-2xl text-gray-600">
              Ferdig
            </div>
          )}
        </div>
      </div>

      {/* Exercise Demo Media - Below secondary info */}
      {currentStep.mediaUrl && (
        <div className="mt-12 sm:mt-16 w-full max-w-4xl">
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
            <Image
              src={currentStep.mediaUrl}
              alt={currentStep.title}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  )
}

