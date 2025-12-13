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

  // Check if step_end_time has passed (guardrail)
  const isWaitingForNextStep =
    session.status === SessionStatus.RUNNING &&
    session.step_end_time &&
    new Date(session.step_end_time).getTime() <= Date.now()

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

  // Calculate progress
  const calculateProgress = () => {
    let totalSteps = 0
    let currentStepNumber = 0

    session.template_snapshot.blocks.forEach((block, blockIdx) => {
      block.steps.forEach((_, stepIdx) => {
        totalSteps++
        if (
          blockIdx < session.current_block_index ||
          (blockIdx === session.current_block_index &&
            stepIdx <= session.current_step_index)
        ) {
          currentStepNumber++
        }
      })
    })

    return { current: currentStepNumber, total: totalSteps }
  }

  const progress = calculateProgress()
  const nextStepPreview = getNextStepPreview()

  if (isWaitingForNextStep) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-6xl font-bold mb-4">Venter på neste steg</div>
        {currentBlock && currentStep && (
          <div className="text-3xl text-muted-foreground mt-4">
            {currentBlock.name} - {currentStep.title}
          </div>
        )}
      </div>
    )
  }

  if (!currentBlock || !currentStep) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-6xl font-bold">Ingen aktiv step</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="text-5xl font-bold mb-2">{currentBlock.name}</div>
        <div className="text-4xl text-muted-foreground">
          {currentStep.title}
        </div>
      </div>

      {/* Content Grid: Timer and Media */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 items-center">
        {/* Large Timer */}
        <div className="flex items-center justify-center">
          <CountdownTimer session={session} />
        </div>

        {/* Exercise Demo Media */}
        <div className="flex items-center justify-center">
          {currentStep.mediaUrl ? (
            <div className="w-full max-w-2xl aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center relative">
              <Image
                src={currentStep.mediaUrl}
                alt={currentStep.title}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-full max-w-2xl aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-4xl text-muted-foreground">Ingen demo tilgjengelig</div>
            </div>
          )}
        </div>
      </div>

      {/* Next Step Preview */}
      {nextStepPreview && (
        <div className="mb-8 p-6 bg-muted rounded-lg">
          <div className="text-2xl font-semibold mb-2">Neste:</div>
          <div className="text-xl">{nextStepPreview.block}</div>
          <div className="text-lg text-muted-foreground">
            {nextStepPreview.step.title}
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mb-4">
        <div className="flex justify-between text-2xl mb-2">
          <span>Steg {progress.current} av {progress.total}</span>
          <span>
            {Math.round((progress.current / progress.total) * 100)}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-4">
          <div
            className="bg-primary h-4 rounded-full transition-all duration-300"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

