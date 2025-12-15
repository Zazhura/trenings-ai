'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { Block, Step } from '@/types/template'
import { matchStepToExercise } from '@/lib/templates/auto-match'
import { getActiveExercises } from '@/lib/exercises/db-operations'
import type { Exercise } from '@/types/exercise'
import { spacing } from '@/lib/ui/layout'

interface TemplateEditorProps {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
}

export function TemplateEditor({ blocks, onChange }: TemplateEditorProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])

  useEffect(() => {
    loadExercises()
  }, [])

  const loadExercises = async () => {
    const data = await getActiveExercises()
    setExercises(data)
  }

  const addBlock = () => {
    onChange([
      ...blocks,
      {
        name: `Blokk ${blocks.length + 1}`,
        steps: [],
      },
    ])
  }

  const updateBlock = (index: number, updates: Partial<Block>) => {
    const newBlocks = [...blocks]
    newBlocks[index] = { ...newBlocks[index], ...updates }
    onChange(newBlocks)
  }

  const deleteBlock = (index: number) => {
    if (confirm('Er du sikker på at du vil slette denne blokken?')) {
      const newBlocks = blocks.filter((_, i) => i !== index)
      onChange(newBlocks)
    }
  }

  const addStep = (blockIndex: number) => {
    const newBlocks = [...blocks]
    newBlocks[blockIndex].steps.push({
      title: '',
      duration: 60 * 1000, // 1 minute default
    })
    onChange(newBlocks)
  }

  const updateStep = (blockIndex: number, stepIndex: number, updates: Partial<Step>) => {
    const newBlocks = [...blocks]
    newBlocks[blockIndex].steps[stepIndex] = {
      ...newBlocks[blockIndex].steps[stepIndex],
      ...updates,
    }
    onChange(newBlocks)
  }

  const deleteStep = (blockIndex: number, stepIndex: number) => {
    const newBlocks = [...blocks]
    newBlocks[blockIndex].steps = newBlocks[blockIndex].steps.filter(
      (_, i) => i !== stepIndex
    )
    onChange(newBlocks)
  }

  const handleStepTitleChange = async (
    blockIndex: number,
    stepIndex: number,
    title: string
  ) => {
    updateStep(blockIndex, stepIndex, { title })

    // Auto-match exercise
    const step = blocks[blockIndex].steps[stepIndex]
    const match = await matchStepToExercise({ ...step, title })
    if (match && match.confidence > 0.5) {
      updateStep(blockIndex, stepIndex, {
        exercise_id: match.exercise.id,
      })
    }
  }

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${seconds}s`
  }

  const parseDuration = (value: string): number => {
    // Parse MM:SS or SS format
    if (value.includes(':')) {
      const [minutes, seconds] = value.split(':').map(Number)
      return (minutes * 60 + seconds) * 1000
    }
    return Number(value) * 1000
  }

  return (
    <div className={spacing.lg}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Blokker og steg</h2>
        <Button onClick={addBlock}>+ Legg til blokk</Button>
      </div>

      {blocks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Ingen blokker. Legg til en blokk for å begynne.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {blocks.map((block, blockIndex) => (
            <Card key={blockIndex}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Input
                      value={block.name}
                      onChange={(e) =>
                        updateBlock(blockIndex, { name: e.target.value })
                      }
                      className="text-lg font-semibold"
                      placeholder="Blokk navn"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteBlock(blockIndex)}
                  >
                    Slett blokk
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {block.steps.map((step, stepIndex) => (
                    <div
                      key={stepIndex}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={step.title}
                            onChange={(e) =>
                              handleStepTitleChange(
                                blockIndex,
                                stepIndex,
                                e.target.value
                              )
                            }
                            placeholder="Steg navn (f.eks., Squats)"
                          />
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              value={formatDuration(step.duration)}
                              onChange={(e) => {
                                const duration = parseDuration(e.target.value)
                                if (!isNaN(duration) && duration > 0) {
                                  updateStep(blockIndex, stepIndex, { duration })
                                }
                              }}
                              placeholder="Varighet (MM:SS eller sekunder)"
                              className="w-32"
                            />
                            <select
                              value={step.exercise_id || ''}
                              onChange={(e) =>
                                updateStep(blockIndex, stepIndex, {
                                  exercise_id: e.target.value || undefined,
                                })
                              }
                              className="flex-1 px-3 py-2 border rounded-md"
                            >
                              <option value="">Ingen øvelse koblet</option>
                              {exercises.map((ex) => (
                                <option key={ex.id} value={ex.id}>
                                  {ex.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          {step.exercise_id && (
                            <Badge variant="secondary" className="text-xs">
                              Øvelse koblet
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteStep(blockIndex, stepIndex)}
                        >
                          Slett
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addStep(blockIndex)}
                    className="w-full"
                  >
                    + Legg til steg
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

