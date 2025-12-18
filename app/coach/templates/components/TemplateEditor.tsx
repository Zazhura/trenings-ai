'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { Block, Step } from '@/types/template'
import { matchStepToExercise } from '@/lib/templates/auto-match'
import { searchExercisesAPI, createExerciseAPI } from '@/lib/exercises/db-operations'
import type { Exercise, GymExercise } from '@/types/exercise'
import { getUserPrimaryGymClient } from '@/lib/auth/get-user-gym-client'
import { spacing } from '@/lib/ui/layout'

interface TemplateEditorProps {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
}

interface CreateExerciseModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (exercise: Exercise) => void
}

function CreateExerciseModal({ isOpen, onClose, onCreate }: CreateExerciseModalProps) {
  const [name, setName] = useState('')
  const [aliases, setAliases] = useState('')
  const [category, setCategory] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsCreating(true)
    try {
      const aliasesArray = aliases
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0)

      const newExercise = await createExerciseAPI({
        name: name.trim(),
        aliases: aliasesArray,
        category: category.trim() || undefined,
        video_url: videoUrl.trim() || undefined,
      })

      if (newExercise) {
        onCreate(newExercise)
        setName('')
        setAliases('')
        setCategory('')
        setVideoUrl('')
        onClose()
      }
    } catch (error) {
      console.error('Error creating exercise:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md m-4">
        <CardHeader>
          <CardTitle>Opprett ny øvelse</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Navn *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="f.eks., Front Squat"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Aliaser (kommaseparert)</label>
              <Input
                value={aliases}
                onChange={(e) => setAliases(e.target.value)}
                placeholder="f.eks., Front squat, Knebøy foran"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kategori</label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="f.eks., strength, cardio"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Video URL</label>
              <Input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Avbryt
              </Button>
              <Button type="submit" disabled={isCreating || !name.trim()}>
                {isCreating ? 'Oppretter...' : 'Opprett'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

interface ExerciseSelectorProps {
  value: string | undefined
  onChange: (exerciseId: string | undefined) => void
  onCreateExercise: (exercise: Exercise) => void
}

function ExerciseSelector({ value, onChange, onCreateExercise }: ExerciseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [exercises, setExercises] = useState<GymExercise[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<GymExercise | null>(null)
  const [gymId, setGymId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load gym ID on mount
  useEffect(() => {
    getUserPrimaryGymClient().then((gym) => {
      if (gym) {
        setGymId(gym.id)
      }
    })
  }, [])

  // Load exercises when gymId is available or searchQuery changes
  useEffect(() => {
    if (!gymId) return

    const loadExercises = async () => {
      setIsLoading(true)
      try {
        const queryParam = searchQuery.trim() ? `?query=${encodeURIComponent(searchQuery.trim())}` : ''
        const response = await fetch(`/api/gyms/${gymId}/exercises${queryParam}`)
        if (response.ok) {
          const data = await response.json()
          // API returns {items: [...], total: number}, extract items array
          const exercisesArray = Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : [])
          setExercises(exercisesArray)
        } else {
          console.error('Failed to load exercises')
          setExercises([])
        }
      } catch (error) {
        console.error('Error loading exercises:', error)
        setExercises([])
      } finally {
        setIsLoading(false)
      }
    }

    // If searchQuery is empty, load immediately (for default "most used" list)
    // Otherwise, debounce the search
    if (!searchQuery.trim()) {
      loadExercises()
    } else {
      const timeoutId = setTimeout(() => {
        loadExercises()
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, gymId])


  useEffect(() => {
    // Load selected exercise details
    if (value && Array.isArray(exercises)) {
      const exercise = exercises.find((e) => e.id === value)
      setSelectedExercise(exercise || null)
    } else {
      setSelectedExercise(null)
    }
  }, [value, exercises])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = async (exercise: GymExercise) => {
    onChange(exercise.id)
    setShowDropdown(false)
    setSearchQuery('')

    // Mark exercise as used in gym
    if (gymId && exercise.id) {
      try {
        await fetch(`/api/gyms/${gymId}/exercises/${exercise.id}/use`, {
          method: 'POST',
        })
      } catch (error) {
        console.error('Error marking exercise as used:', error)
        // Don't fail the selection if this fails
      }
    }
  }

  const handleCreateNew = () => {
    setShowCreateModal(true)
    setShowDropdown(false)
  }

  const handleExerciseCreated = (exercise: Exercise) => {
    onCreateExercise(exercise)
    onChange(exercise.id)
    setShowCreateModal(false)
    setSearchQuery('')
  }

  // Exercises are already filtered by API, but we can add client-side filtering if needed
  const filteredExercises = exercises

  return (
    <div className="relative flex-1">
      <Input
        ref={inputRef}
        value={showDropdown ? searchQuery : selectedExercise?.name || ''}
        onChange={(e) => {
          setSearchQuery(e.target.value)
          setShowDropdown(true)
        }}
        onFocus={() => {
          setShowDropdown(true)
          // If no search query and no exercises loaded, trigger a load
          if (!searchQuery.trim() && gymId && exercises.length === 0 && !isLoading) {
            // Force reload by clearing and resetting searchQuery
            setSearchQuery(' ')
            setTimeout(() => setSearchQuery(''), 0)
          }
        }}
        placeholder="Søk etter øvelse..."
        className="w-full"
      />
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {isLoading ? (
            <div className="p-2 text-sm text-gray-500">Laster...</div>
          ) : filteredExercises.length > 0 ? (
            <>
              {!searchQuery.trim() && filteredExercises.length > 0 && (
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                  Mest brukt
                </div>
              )}
              {filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => handleSelect(exercise)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                    exercise.is_in_gym ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{exercise.name}</div>
                      {exercise.aliases.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {exercise.aliases.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                    {exercise.is_in_gym && (
                      <Badge variant="secondary" className="text-xs ml-2">
                        {exercise.used_count_in_gym || 0}x
                      </Badge>
                    )}
                  </div>
                  {!exercise.is_in_gym && searchQuery.trim() && (
                    <div className="text-xs text-gray-400 mt-1">Globalt bibliotek</div>
                  )}
                </button>
              ))}
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-t"
                >
                  <div className="font-medium text-blue-600">
                    + Opprett ny øvelse: &quot;{searchQuery}&quot;
                  </div>
                </button>
              )}
            </>
          ) : (
            <div className="p-2">
              {searchQuery.trim() ? (
                <>
                  <div className="text-sm text-gray-500 mb-2">Ingen treff</div>
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border rounded"
                  >
                    <div className="font-medium text-blue-600">
                      + Opprett ny øvelse: &quot;{searchQuery}&quot;
                    </div>
                  </button>
                </>
              ) : (
                <div className="text-sm text-gray-500">
                  Ingen øvelser brukt ennå. Søk etter en øvelse for å begynne.
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <CreateExerciseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleExerciseCreated}
      />
    </div>
  )
}

export function TemplateEditor({ blocks, onChange }: TemplateEditorProps) {

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
                              value={formatDuration(step.duration ?? 0)}
                              onChange={(e) => {
                                const duration = parseDuration(e.target.value)
                                if (!isNaN(duration) && duration > 0) {
                                  updateStep(blockIndex, stepIndex, { duration })
                                }
                              }}
                              placeholder="Varighet (MM:SS eller sekunder)"
                              className="w-32"
                            />
                            <ExerciseSelector
                              value={step.exercise_id}
                              onChange={(exerciseId) =>
                                updateStep(blockIndex, stepIndex, {
                                  exercise_id: exerciseId,
                                })
                              }
                              onCreateExercise={(exercise) => {
                                // Exercise is automatically selected via onChange callback
                              }}
                            />
                            {step.exercise_id && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  updateStep(blockIndex, stepIndex, {
                                    exercise_id: undefined,
                                  })
                                }
                              >
                                Fjern
                              </Button>
                            )}
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

