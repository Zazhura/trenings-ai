'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AppShell } from '@/components/layout/AppShell'
import { Navigation } from '../../components/Navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// Template creation now uses API endpoint
import type { Block, Step, StepKind, BlockMode } from '@/types/template'
import type { Exercise } from '@/types/exercise'
import {
  pageHeaderClasses,
  pageTitleClasses,
  pageDescriptionClasses,
  spacing,
} from '@/lib/ui/layout'

type ExerciseCategory = 'all' | 'strength' | 'cardio' | 'mobility' | 'gymnastics'

interface DraggableExercise extends Exercise {
  id: string
}

// Step interface extended for UI
interface StepWithId extends Step {
  id?: string
}

export default function NewTemplatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editTemplateId = searchParams.get('edit') // If present, we're editing an existing template
  
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory>('all')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [lastActiveBlockIndex, setLastActiveBlockIndex] = useState<number | null>(null)
  const [isDemo, setIsDemo] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (editTemplateId) {
      loadTemplate(editTemplateId)
    } else {
      loadExercises()
    }
  }, [editTemplateId])

  const loadTemplate = async (templateId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/templates/${templateId}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error loading template:', errorData)
        alert(`Kunne ikke laste template: ${errorData.error || 'Ukjent feil'}`)
        router.push('/coach/templates')
        return
      }

      const data = await response.json()
      if (data) {
        setTemplateName(data.name || '')
        setTemplateDescription(data.description || '')
        setIsDemo(data.is_demo || false)
        // Hydrate blocks from template snapshot
        setBlocks(data.blocks || [])
      }
      
      // Load exercises after template is loaded
      await loadExercises()
    } catch (error) {
      console.error('Error loading template:', error)
      alert('Kunne ikke laste template. Sjekk konsollen for detaljer.')
      router.push('/coach/templates')
    } finally {
      setLoading(false)
    }
  }

  const loadExercises = async () => {
    try {
      // First get user's gym via API (server-side, bypasses RLS issues)
      const gymResponse = await fetch('/api/user/gym')
      if (!gymResponse.ok) {
        console.error('Failed to fetch gym:', gymResponse.status, gymResponse.statusText)
        setLoading(false)
        return
      }
      
      const gymData = await gymResponse.json()
      if (!gymData || !gymData.gymId || !gymData.gym) {
        console.error('No gym found')
        setLoading(false)
        return
      }

      console.log('Loading exercises for gym:', gymData.gymId)
      const response = await fetch(`/api/gyms/${gymData.gymId}/exercises`)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to fetch exercises:', response.status, response.statusText, errorText)
        setLoading(false)
        return
      }

      const data = await response.json()
      // API returns { items: [...], total: <count> }
      const exercisesList = data.items || data || []
      console.log('Loaded exercises:', exercisesList.length, exercisesList)
      // API already filters to enabled exercises, so use data directly
      setExercises(exercisesList)
    } catch (error) {
      console.error('Error loading exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredExercises = useMemo(() => {
    console.log('Filtering exercises:', {
      total: exercises.length,
      category: selectedCategory,
      searchQuery,
    })
    
    let filtered = exercises

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((e) => 
        e.category?.toLowerCase() === selectedCategory.toLowerCase()
      )
      console.log('After category filter:', filtered.length)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((e) =>
        e.name.toLowerCase().includes(query) ||
        e.aliases.some((alias) => alias.toLowerCase().includes(query))
      )
      console.log('After search filter:', filtered.length)
    }

    console.log('Final filtered exercises:', filtered.length)
    return filtered
  }, [exercises, selectedCategory, searchQuery])

  const categories = useMemo(() => {
    const cats = new Set<string>()
    exercises.forEach((e) => {
      if (e.category) cats.add(e.category.toLowerCase())
    })
    return Array.from(cats).sort()
  }, [exercises])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    // Debug logging
    console.log('DND', { active: active.id, over: over?.id })

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Check if dragging from exercise library (lib:<exerciseId>)
    if (activeId.startsWith('lib:')) {
      const exerciseId = activeId.replace('lib:', '')
      const draggedExercise = exercises.find((e) => e.id === exerciseId)
      
      if (draggedExercise) {
        // Dropping exercise into add-zone (block-add:<blockIndex>)
        if (overId.startsWith('block-add:')) {
          const blockIndex = parseInt(overId.replace('block-add:', ''))
          if (!isNaN(blockIndex) && blockIndex >= 0 && blockIndex < blocks.length) {
            addStepToBlock(blockIndex, draggedExercise)
          }
        }
        // Dropping exercise onto a step (step:<blockIndex>-<stepIndex>) - replace exercise
        else if (overId.startsWith('step:')) {
          const parts = overId.replace('step:', '').split('-')
          if (parts.length === 2) {
            const blockIndex = parseInt(parts[0])
            const stepIndex = parseInt(parts[1])
            if (!isNaN(blockIndex) && !isNaN(stepIndex)) {
              updateStepExercise(blockIndex, stepIndex, draggedExercise)
            }
          }
        }
      }
      return
    }

    // Reordering steps within a block (step:<blockIndex>-<stepIndex>)
    if (activeId.startsWith('step:') && overId.startsWith('step:')) {
      const activeParts = activeId.replace('step:', '').split('-')
      const overParts = overId.replace('step:', '').split('-')
      
      if (activeParts.length === 2 && overParts.length === 2) {
        const activeBlockIndex = parseInt(activeParts[0])
        const activeStepIndex = parseInt(activeParts[1])
        const overBlockIndex = parseInt(overParts[0])
        const overStepIndex = parseInt(overParts[1])

        if (activeBlockIndex === overBlockIndex) {
          // Same block - reorder
          const newBlocks = [...blocks]
          const block = newBlocks[activeBlockIndex]
          const newSteps = arrayMove(block.steps, activeStepIndex, overStepIndex)
          newBlocks[activeBlockIndex] = { ...block, steps: newSteps }
          setBlocks(newBlocks)
        } else {
          // Different block - move step
          const newBlocks = [...blocks]
          const sourceBlock = newBlocks[activeBlockIndex]
          const targetBlock = newBlocks[overBlockIndex]
          const step = sourceBlock.steps[activeStepIndex]

          const newSourceSteps = sourceBlock.steps.filter((_, i) => i !== activeStepIndex)
          const newTargetSteps = [...targetBlock.steps]
          newTargetSteps.splice(overStepIndex, 0, step)

          newBlocks[activeBlockIndex] = { ...sourceBlock, steps: newSourceSteps }
          newBlocks[overBlockIndex] = { ...targetBlock, steps: newTargetSteps }
          setBlocks(newBlocks)
        }
      }
    }
  }

  const addStepToBlock = (blockIndex: number, exercise: Exercise) => {
    const newBlocks = [...blocks]
    const block = newBlocks[blockIndex]
    const stepId = `step:${crypto.randomUUID()}`
    const newStep: StepWithId = {
      id: stepId,
      title: exercise.name,
      exercise_id: exercise.id,
      step_kind: 'note', // Default to note
    }
    newBlocks[blockIndex] = {
      ...block,
      steps: [...block.steps, newStep],
    }
    setBlocks(newBlocks)
  }

  const updateStepExercise = (blockIndex: number, stepIndex: number, exercise: Exercise) => {
    const newBlocks = [...blocks]
    const block = newBlocks[blockIndex]
    const step = block.steps[stepIndex]
    newBlocks[blockIndex] = {
      ...block,
      steps: block.steps.map((s, i) =>
        i === stepIndex
          ? { ...s, title: exercise.name, exercise_id: exercise.id }
          : s
      ),
    }
    setBlocks(newBlocks)
  }

  const updateStep = (blockIndex: number, stepIndex: number, updates: Partial<Step>) => {
    const newBlocks = [...blocks]
    const block = newBlocks[blockIndex]
    newBlocks[blockIndex] = {
      ...block,
      steps: block.steps.map((s, i) =>
        i === stepIndex ? { ...s, ...updates } : s
      ),
    }
    setBlocks(newBlocks)
  }

  const deleteStep = (blockIndex: number, stepIndex: number) => {
    const newBlocks = [...blocks]
    const block = newBlocks[blockIndex]
    newBlocks[blockIndex] = {
      ...block,
      steps: block.steps.filter((_, i) => i !== stepIndex),
    }
    setBlocks(newBlocks)
  }

  const addBlock = () => {
    setBlocks([...blocks, { name: `Blokk ${blocks.length + 1}`, steps: [] }])
  }

  const deleteBlock = (blockIndex: number) => {
    setBlocks(blocks.filter((_, i) => i !== blockIndex))
  }

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('Template må ha et navn')
      return
    }

    if (blocks.length === 0) {
      alert('Template må ha minst én blokk')
      return
    }

    // Validate that time-steps have duration > 0
    const hasInvalidTimeSteps = blocks.some((block) =>
      block.steps.some((step) => {
        const kind = step.step_kind || 'note'
        return kind === 'time' && (!step.duration || step.duration <= 0)
      })
    )

    if (hasInvalidTimeSteps) {
      const proceed = confirm(
        'Noen time-steps har ikke satt tid. Vil du fortsette likevel?'
      )
      if (!proceed) return
    }

    setSaving(true)
    try {
      console.log('Saving template via API:', {
        name: templateName,
        blocksCount: blocks.length,
        stepsCount: blocks.reduce((sum, b) => sum + b.steps.length, 0),
      })

      const url = editTemplateId ? `/api/templates/${editTemplateId}` : '/api/templates'
      const method = editTemplateId ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription || undefined,
          blocks,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.details || 'Ukjent feil'
        console.error('Failed to create template:', errorData)
        alert(`Kunne ikke opprette template: ${errorMessage}`)
        return
      }

      const data = await response.json()
      
      // For POST (create), API returns { templateId, template }
      // For PATCH (update), API returns { id, ... } or just success
      const templateId = data.templateId || data.id || editTemplateId
      
      if (templateId || editTemplateId) {
        console.log('Template saved successfully:', {
          id: templateId || editTemplateId,
          name: templateName,
          isEdit: !!editTemplateId,
        })
        // Redirect to templates list
        router.push('/coach/templates')
        router.refresh() // Refresh to update Next.js cache
      } else {
        console.error('No template ID in response:', data)
        alert('Kunne ikke opprette template. Ingen template ID returnert.')
      }
    } catch (error) {
      console.error('Error creating template:', error)
      alert('Kunne ikke opprette template: ' + (error instanceof Error ? error.message : 'Ukjent feil'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell header={<Navigation />}>
      <div className={pageHeaderClasses}>
        <h1 className={pageTitleClasses}>
          {editTemplateId ? 'Rediger template' : 'Ny template'}
        </h1>
        <p className={pageDescriptionClasses}>
          Bygg template med drag-and-drop
        </p>
      </div>

      <div className={spacing.lg}>
        {/* Template Name and Description */}
        <div className="mb-4 space-y-2">
          <Input
            placeholder="Template navn..."
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="max-w-md"
            disabled={isDemo}
          />
          {editTemplateId && (
            <Input
              placeholder="Beskrivelse (valgfritt)..."
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              className="max-w-md"
              disabled={isDemo}
            />
          )}
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Workout Sheet (A4 look) */}
            <div className="lg:col-span-2">
              <div className="bg-white border-2 border-gray-300 shadow-lg p-8 min-h-[800px]">
                <h2 className="text-2xl font-bold mb-6">Workout Sheet</h2>

                {blocks.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="mb-4">Ingen blokker ennå</p>
                    <Button onClick={addBlock}>Legg til blokk</Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {blocks.map((block, blockIndex) => (
                      <BlockCard
                        key={blockIndex}
                        block={block}
                        blockIndex={blockIndex}
                        exercises={exercises}
                        onUpdateBlock={(name) => {
                          const newBlocks = [...blocks]
                          newBlocks[blockIndex].name = name
                          setBlocks(newBlocks)
                        }}
                        onUpdateStep={updateStep}
                        onDeleteStep={deleteStep}
                        onDeleteBlock={() => deleteBlock(blockIndex)}
                        onSetActive={() => setLastActiveBlockIndex(blockIndex)}
                        onUpdateBlockMode={(blockIdx, mode, durationSeconds, sets, restSeconds) => {
                          const newBlocks = [...blocks]
                          newBlocks[blockIdx] = {
                            ...newBlocks[blockIdx],
                            block_mode: mode,
                            block_duration_seconds: durationSeconds || null,
                            block_sets: sets || null,
                            block_rest_seconds: restSeconds || null,
                          }
                          setBlocks(newBlocks)
                        }}
                      />
                    ))}
                    <Button onClick={addBlock} variant="outline">
                      + Legg til blokk
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Exercise Library */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-[800px] flex flex-col">
                <h2 className="text-xl font-bold mb-4">Exercise Library</h2>

                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2 mb-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Setting category to: all')
                      setSelectedCategory('all')
                    }}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    Alle
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        console.log('Setting category to:', cat)
                        setSelectedCategory(cat as ExerciseCategory)
                      }}
                      className={`px-3 py-1 text-sm rounded capitalize transition-colors ${
                        selectedCategory === cat
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <Input
                  placeholder="Søk øvelser..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-4"
                />

                {/* Exercise List */}
                <div className="flex-1 overflow-y-auto space-y-2">
                  {loading ? (
                    <div className="text-center py-8">Laster...</div>
                  ) : exercises.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Ingen øvelser tilgjengelig</p>
                      <p className="text-xs mt-2">Sørg for at øvelser er aktivert for din gym</p>
                    </div>
                  ) : filteredExercises.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Ingen øvelser funnet</p>
                      <p className="text-xs mt-2">
                        {searchQuery && `Søk: ${searchQuery}`}
                        {selectedCategory !== 'all' && `Kategori: ${selectedCategory}`}
                      </p>
                    </div>
                  ) : (
                    filteredExercises.map((exercise) => (
                      <ExerciseItem
                        key={exercise.id}
                        exercise={exercise}
                        onAddToBlock={(exercise) => {
                          // Use last active block, or first block if none
                          const targetBlockIndex = lastActiveBlockIndex !== null
                            ? lastActiveBlockIndex
                            : blocks.length > 0 ? 0 : null
                          
                          if (targetBlockIndex !== null && targetBlockIndex >= 0 && targetBlockIndex < blocks.length) {
                            addStepToBlock(targetBlockIndex, exercise)
                          } else if (blocks.length === 0) {
                            // No blocks exist, create one and add exercise
                            const newBlock: Block = { name: 'Blokk 1', steps: [] }
                            setBlocks([newBlock])
                            // Add exercise after state update
                            setTimeout(() => {
                              addStepToBlock(0, exercise)
                            }, 0)
                          }
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            <DragOverlay>
              {activeId ? (
                activeId.startsWith('lib:') ? (
                  <div className="p-3 bg-white border border-gray-200 rounded shadow-lg">
                    {exercises.find((e) => e.id === activeId.replace('lib:', ''))?.name}
                  </div>
                ) : null
              ) : null}
            </DragOverlay>
          </div>
        </DndContext>

        {/* Save Button */}
        <div className="flex gap-2 mt-6">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Lagrer...' : 'Lagre template'}
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            Avbryt
          </Button>
        </div>
      </div>
    </AppShell>
  )
}

// Exercise Item Component (draggable, but not sortable)
function ExerciseItem({
  exercise,
  onAddToBlock,
}: {
  exercise: Exercise
  onAddToBlock?: (exercise: Exercise) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lib:${exercise.id}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 select-none"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <div className="font-medium">{exercise.name}</div>
          {exercise.category && (
            <div className="text-xs text-gray-500 capitalize">{exercise.category}</div>
          )}
        </div>
        <div className="flex gap-1">
          {/* Drag handle */}
          <div
            {...listeners}
            className="cursor-move text-gray-400 hover:text-gray-600 px-1"
            title="Dra for å legge til"
          >
            ⋮⋮
          </div>
          {/* Click to add button */}
          {onAddToBlock && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddToBlock(exercise)
              }}
              className="text-blue-600 hover:text-blue-700 px-2 py-1 text-sm font-medium"
              title="Klikk for å legge til"
            >
              +
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Add Zone Component (dedicated dropzone)
function AddZone({ blockIndex }: { blockIndex: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `block-add:${blockIndex}`,
  })

  return (
    <div
      ref={setNodeRef}
      className={`w-full min-h-[56px] border-2 border-dashed rounded transition-colors flex items-center justify-center ${
        isOver
          ? 'border-blue-500 bg-blue-50 border-solid'
          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
      }`}
    >
      <span className="text-sm text-gray-600 font-medium">
        Slipp øvelse her for å legge til
      </span>
    </div>
  )
}

// Block Card Component
function BlockCard({
  block,
  blockIndex,
  exercises,
  onUpdateBlock,
  onUpdateStep,
  onDeleteStep,
  onDeleteBlock,
  onSetActive,
  onUpdateBlockMode,
}: {
  block: Block
  blockIndex: number
  exercises: Exercise[]
  onUpdateBlock: (name: string) => void
  onUpdateStep: (blockIndex: number, stepIndex: number, updates: Partial<Step>) => void
  onDeleteStep: (blockIndex: number, stepIndex: number) => void
  onDeleteBlock: () => void
  onSetActive: () => void
  onUpdateBlockMode?: (
    blockIndex: number,
    mode: Block['block_mode'],
    durationSeconds?: number | null,
    sets?: number | null,
    restSeconds?: number | null
  ) => void
}) {
  // Generate step IDs - use index-based ID for sortable context
  const stepIds = block.steps.map((_, i) => `step:${blockIndex}-${i}`)

  const blockMode = block.block_mode || 'follow_steps'
  const [blockDurationDigits, setBlockDurationDigits] = useState<string>('')
  const [isBlockDurationFocused, setIsBlockDurationFocused] = useState<boolean>(false)
  const [blockRestDigits, setBlockRestDigits] = useState<string>('')
  const [isBlockRestFocused, setIsBlockRestFocused] = useState<boolean>(false)

  // Initialize block duration digits from block_duration_seconds
  useEffect(() => {
    // Ensure block_duration_seconds is a valid number (not NaN, not null, not undefined)
    const durationSeconds = typeof block.block_duration_seconds === 'number' && 
      !isNaN(block.block_duration_seconds) && 
      block.block_duration_seconds > 0
      ? block.block_duration_seconds
      : null
    
    if (durationSeconds) {
      const mins = Math.floor(durationSeconds / 60)
      const secs = durationSeconds % 60
      setBlockDurationDigits(`${mins.toString().padStart(2, '0')}${secs.toString().padStart(2, '0')}`)
    } else {
      setBlockDurationDigits('')
    }
  }, [block.block_duration_seconds])

  // Initialize block rest digits from block_rest_seconds
  useEffect(() => {
    // Ensure block_rest_seconds is a valid number (not NaN, not null, not undefined)
    const restSeconds = typeof block.block_rest_seconds === 'number' && 
      !isNaN(block.block_rest_seconds) && 
      block.block_rest_seconds > 0
      ? block.block_rest_seconds
      : null
    
    if (restSeconds) {
      const mins = Math.floor(restSeconds / 60)
      const secs = restSeconds % 60
      setBlockRestDigits(`${mins.toString().padStart(2, '0')}${secs.toString().padStart(2, '0')}`)
    } else {
      setBlockRestDigits('')
    }
  }, [block.block_rest_seconds])

  const parseDigitsToSeconds = (digits: string): number | null => {
    const trimmed = digits.trim()
    if (trimmed === '') return null
    if (!/^\d+$/.test(trimmed)) return null

    const len = trimmed.length
    if (len === 1 || len === 2) {
      return parseInt(trimmed)
    } else if (len === 3 || len === 4) {
      const mm = parseInt(trimmed.slice(0, -2)) || 0
      const ss = parseInt(trimmed.slice(-2)) || 0
      if (ss >= 60) return null
      return mm * 60 + ss
    } else if (len === 5 || len === 6) {
      const hh = parseInt(trimmed.slice(0, -4)) || 0
      const mm = parseInt(trimmed.slice(-4, -2)) || 0
      const ss = parseInt(trimmed.slice(-2)) || 0
      if (mm >= 60 || ss >= 60) return null
      return hh * 3600 + mm * 60 + ss
    }
    return null
  }

  const formatSecondsToDisplay = (seconds: number | null): string => {
    if (seconds === null || seconds === 0) return ''
    const totalMins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${totalMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getBlockDurationDisplay = (): string => {
    if (!blockDurationDigits) return ''
    if (isBlockDurationFocused) return blockDurationDigits
    const seconds = parseDigitsToSeconds(blockDurationDigits)
    return formatSecondsToDisplay(seconds)
  }

  const getBlockRestDisplay = (): string => {
    if (!blockRestDigits) return ''
    if (isBlockRestFocused) return blockRestDigits
    const seconds = parseDigitsToSeconds(blockRestDigits)
    return formatSecondsToDisplay(seconds)
  }

  const handleBlockDurationBlur = () => {
    setIsBlockDurationFocused(false)
    const seconds = parseDigitsToSeconds(blockDurationDigits)
    if (onUpdateBlockMode) {
      onUpdateBlockMode(blockIndex, blockMode, seconds, block.block_sets, block.block_rest_seconds)
    }
    if (seconds !== null && seconds > 0) {
      const totalMins = Math.floor(seconds / 60)
      const secs = seconds % 60
      setBlockDurationDigits(`${totalMins.toString().padStart(2, '0')}${secs.toString().padStart(2, '0')}`)
    } else {
      setBlockDurationDigits('')
    }
  }

  const handleBlockRestBlur = () => {
    setIsBlockRestFocused(false)
    const seconds = parseDigitsToSeconds(blockRestDigits)
    if (onUpdateBlockMode) {
      onUpdateBlockMode(blockIndex, blockMode, block.block_duration_seconds, block.block_sets, seconds)
    }
    if (seconds !== null && seconds > 0) {
      const totalMins = Math.floor(seconds / 60)
      const secs = seconds % 60
      setBlockRestDigits(`${totalMins.toString().padStart(2, '0')}${secs.toString().padStart(2, '0')}`)
    } else {
      setBlockRestDigits('')
    }
  }

  return (
    <div
      className="border rounded-lg p-4 bg-white border-gray-200"
      onClick={onSetActive}
      onFocus={onSetActive}
    >
      <div className="flex items-center justify-between mb-3">
        <Input
          value={block.name}
          onChange={(e) => onUpdateBlock(e.target.value)}
          className="font-semibold flex-1"
          placeholder="Blokk navn"
          onClick={(e) => {
            e.stopPropagation()
            onSetActive()
          }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onDeleteBlock()
          }}
          className="ml-2"
        >
          Slett
        </Button>
      </div>

      {/* Block Mode Selector */}
      <div className="mb-3 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Modus:</label>
        <select
          value={blockMode}
          onChange={(e) => {
            const newMode = e.target.value as Block['block_mode']
            if (onUpdateBlockMode) {
              if (newMode === 'strength_sets') {
                onUpdateBlockMode(blockIndex, newMode, null, block.block_sets || null, block.block_rest_seconds || null)
              } else if (newMode === 'follow_steps') {
                onUpdateBlockMode(blockIndex, newMode, null, null, null)
              } else {
                onUpdateBlockMode(blockIndex, newMode, block.block_duration_seconds || null, null, null)
              }
            }
          }}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="follow_steps">Følg steps</option>
          <option value="amrap">AMRAP</option>
          <option value="emom">EMOM</option>
          <option value="for_time">For Time</option>
          <option value="strength_sets">Strength Sets</option>
        </select>

        {/* Block Duration Input (for AMRAP/EMOM/For Time) */}
        {(blockMode === 'amrap' || blockMode === 'emom' || blockMode === 'for_time') && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Total tid:</label>
            <Input
              type="text"
              inputMode="numeric"
              value={getBlockDurationDisplay()}
              onChange={(e) => {
                const inputValue = e.target.value.replace(/\D/g, '')
                const digitsOnly = inputValue.slice(0, 6)
                setBlockDurationDigits(digitsOnly)
              }}
              onFocus={() => setIsBlockDurationFocused(true)}
              onBlur={handleBlockDurationBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }
              }}
              className="text-sm w-20"
              placeholder="2000"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            />
            {blockMode === 'emom' && (
              <span className="text-xs text-gray-500">Pause er resten av minuttet</span>
            )}
          </div>
        )}

        {/* Strength Sets Inputs */}
        {blockMode === 'strength_sets' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sets:</label>
              <Input
                type="number"
                inputMode="numeric"
                value={typeof block.block_sets === 'number' && !isNaN(block.block_sets) ? block.block_sets : ''}
                onChange={(e) => {
                  const inputValue = e.target.value.trim()
                  let value: number | null = null
                  if (inputValue !== '') {
                    const parsed = parseInt(inputValue, 10)
                    if (!isNaN(parsed) && parsed > 0) {
                      value = parsed
                    }
                  }
                  if (onUpdateBlockMode) {
                    onUpdateBlockMode(blockIndex, blockMode, null, value, block.block_rest_seconds || null)
                  }
                }}
                onBlur={(e) => {
                  // On blur, if empty, ensure block_sets is null
                  if (e.target.value.trim() === '' && onUpdateBlockMode) {
                    onUpdateBlockMode(blockIndex, blockMode, null, null, block.block_rest_seconds || null)
                  }
                }}
                className="text-sm w-16"
                placeholder="4"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                min="1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Rest:</label>
              <Input
                type="text"
                inputMode="numeric"
                value={getBlockRestDisplay()}
                onChange={(e) => {
                  const inputValue = e.target.value.replace(/\D/g, '')
                  const digitsOnly = inputValue.slice(0, 6)
                  setBlockRestDigits(digitsOnly)
                }}
                onFocus={() => setIsBlockRestFocused(true)}
                onBlur={handleBlockRestBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur()
                  }
                }}
                className="text-sm w-20"
                placeholder="0200"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>

      {/* Steps Table */}
      <div className="border border-gray-200 rounded mb-3">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-medium">Øvelse</th>
              <th className="px-3 py-2 text-left text-sm font-medium">Kind</th>
              <th className="px-3 py-2 text-left text-sm font-medium">Beskrivelse</th>
              <th className="px-3 py-2 text-left text-sm font-medium">Tid/Reps</th>
              <th className="px-3 py-2 text-left text-sm font-medium w-16"></th>
            </tr>
          </thead>
          <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
            <tbody>
              {block.steps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-gray-500 text-sm">
                    Bruk &quot;Slipp øvelse her&quot;-sonen under for å legge til steps
                  </td>
                </tr>
              ) : (
                block.steps.map((step, stepIndex) => {
                  const exercise = exercises.find((e) => e.id === step.exercise_id)
                  return (
                    <StepRow
                      key={stepIndex}
                      step={step}
                      stepIndex={stepIndex}
                      blockIndex={blockIndex}
                      exercise={exercise}
                      onUpdate={(updates) => onUpdateStep(blockIndex, stepIndex, updates)}
                      onDelete={() => onDeleteStep(blockIndex, stepIndex)}
                    />
                  )
                })
              )}
            </tbody>
          </SortableContext>
        </table>
      </div>

      {/* Add Zone - dedicated dropzone */}
      <AddZone blockIndex={blockIndex} />
    </div>
  )
}

// Step Row Component (sortable)
function StepRow({
  step,
  stepIndex,
  blockIndex,
  exercise,
  onUpdate,
  onDelete,
}: {
  step: Step
  stepIndex: number
  blockIndex: number
  exercise?: Exercise
  onUpdate: (updates: Partial<Step>) => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `step:${blockIndex}-${stepIndex}`,
  })

  const stepKind = step.step_kind || 'note'
  
  // Local state for raw digits input (only 0-9)
  const [timeDigits, setTimeDigits] = useState<string>('')
  const [timeError, setTimeError] = useState<string>('')
  const [isFocused, setIsFocused] = useState<boolean>(false)

  // Initialize timeDigits from step.duration when step changes
  useEffect(() => {
    // Ensure duration is a valid number (not NaN, not null, not undefined)
    const duration = typeof step.duration === 'number' && !isNaN(step.duration) && step.duration > 0
      ? step.duration
      : null
    
    if (duration) {
      const seconds = Math.floor(duration / 1000)
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      // Store as digits without colon (e.g., "0030" for 00:30)
      setTimeDigits(`${mins.toString().padStart(2, '0')}${secs.toString().padStart(2, '0')}`)
    } else {
      setTimeDigits('')
    }
    setTimeError('')
  }, [step.duration])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Parse digits to seconds based on length
  const parseDigitsToSeconds = (digits: string): { seconds: number | null; error: string } => {
    const trimmed = digits.trim()
    
    if (trimmed === '') {
      return { seconds: null, error: '' }
    }

    // Only allow digits
    if (!/^\d+$/.test(trimmed)) {
      return { seconds: null, error: 'Kun tall tillatt' }
    }

    const len = trimmed.length

    if (len === 1 || len === 2) {
      // 1-2 digits: seconds (SS)
      const seconds = parseInt(trimmed)
      return { seconds, error: '' }
    } else if (len === 3 || len === 4) {
      // 3-4 digits: MMSS
      const mm = parseInt(trimmed.slice(0, -2)) || 0
      const ss = parseInt(trimmed.slice(-2)) || 0
      if (ss >= 60) {
        return { seconds: null, error: 'Sekunder må være < 60' }
      }
      return { seconds: mm * 60 + ss, error: '' }
    } else if (len === 5 || len === 6) {
      // 5-6 digits: HHMMSS
      const hh = parseInt(trimmed.slice(0, -4)) || 0
      const mm = parseInt(trimmed.slice(-4, -2)) || 0
      const ss = parseInt(trimmed.slice(-2)) || 0
      if (mm >= 60 || ss >= 60) {
        return { seconds: null, error: 'Minutter og sekunder må være < 60' }
      }
      const totalSeconds = hh * 3600 + mm * 60 + ss
      return { seconds: totalSeconds, error: '' }
    } else {
      return { seconds: null, error: 'Maks 6 siffer' }
    }
  }

  // Format seconds to mm:ss display string
  const formatSecondsToDisplay = (seconds: number | null): string => {
    if (seconds === null || seconds === 0) {
      return ''
    }
    const totalMins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${totalMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get display value: show raw digits while focused, formatted mm:ss when not focused
  const getDisplayValue = (): string => {
    if (!timeDigits) return ''
    if (isFocused) {
      // While typing: show raw digits
      return timeDigits
    } else {
      // When not focused: show formatted mm:ss
      const { seconds } = parseDigitsToSeconds(timeDigits)
      if (seconds === null) return timeDigits
      return formatSecondsToDisplay(seconds)
    }
  }

  const handleTimeBlur = () => {
    setIsFocused(false)
    const { seconds, error } = parseDigitsToSeconds(timeDigits)
    
    if (error) {
      setTimeError(error)
      return
    }
    
    // Update the step duration: null/undefined => undefined (not 0, not NaN)
    if (seconds === null || seconds === undefined) {
      onUpdate({ duration: undefined })
      setTimeDigits('')
    } else if (seconds > 0) {
      onUpdate({ duration: seconds * 1000 })
      // Format display: keep digits without colon for next edit
      const totalMins = Math.floor(seconds / 60)
      const secs = seconds % 60
      // Store as digits (e.g., "0030" for 00:30)
      setTimeDigits(`${totalMins.toString().padStart(2, '0')}${secs.toString().padStart(2, '0')}`)
    } else {
      onUpdate({ duration: undefined })
      setTimeDigits('')
    }
    setTimeError('')
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="border-t border-gray-200 hover:bg-gray-50"
    >
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div
            {...listeners}
            className="cursor-move text-gray-400 hover:text-gray-600 select-none"
            style={{ touchAction: 'none' }}
          >
            ⋮⋮
          </div>
          <div className="flex-1 text-sm font-medium">
            {exercise ? exercise.name : step.title || '(Ingen øvelse)'}
          </div>
        </div>
      </td>
      <td className="px-3 py-2">
        <select
          value={stepKind}
          onChange={(e) => {
            const newKind = e.target.value as Step['step_kind']
            const updates: Partial<Step> = { step_kind: newKind }
            // Clear fields that don't apply to new kind
            if (newKind !== 'time') {
              updates.duration = undefined
            }
            if (newKind !== 'reps') {
              updates.reps = undefined
            }
            onUpdate(updates)
          }}
          className="px-2 py-1 border border-gray-300 rounded text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="note">Note</option>
          <option value="reps">Reps</option>
          <option value="time">Time</option>
          <option value="load">Load</option>
        </select>
      </td>
      <td className="px-3 py-2">
        <Input
          value={step.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="text-sm"
          placeholder={
            stepKind === 'load' 
              ? 'F.eks. 4x8 @70%'
              : stepKind === 'note'
              ? 'Beskrivelse'
              : 'Beskrivelse (f.eks. 10 reps)'
          }
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        />
      </td>
      <td className="px-3 py-2">
        {stepKind === 'time' && (
          <div className="flex flex-col">
            <Input
              type="text"
              inputMode="numeric"
              value={getDisplayValue()}
              onChange={(e) => {
                // Extract only digits from input (ignore ":" and other chars)
                const inputValue = e.target.value.replace(/\D/g, '')
                // Limit to 6 digits max
                const digitsOnly = inputValue.slice(0, 6)
                setTimeDigits(digitsOnly)
                setTimeError('')
              }}
              onFocus={() => {
                setIsFocused(true)
              }}
              onBlur={handleTimeBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }
              }}
              className={`text-sm w-20 ${timeError ? 'border-red-500' : ''}`}
              placeholder="0030"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{ pointerEvents: 'auto' }}
            />
            {timeError && (
              <span className="text-xs text-red-500 mt-1">{timeError}</span>
            )}
          </div>
        )}
        {stepKind === 'reps' && (
          <Input
            type="number"
            inputMode="numeric"
            value={typeof step.reps === 'number' && !isNaN(step.reps) ? step.reps : ''}
            onChange={(e) => {
              const inputValue = e.target.value.trim()
              if (inputValue === '') {
                onUpdate({ reps: undefined })
              } else {
                const parsed = parseInt(inputValue, 10)
                if (!isNaN(parsed) && parsed >= 0) {
                  onUpdate({ reps: parsed })
                }
              }
            }}
            onBlur={(e) => {
              // On blur, if empty, ensure reps is undefined (not null)
              if (e.target.value.trim() === '') {
                onUpdate({ reps: undefined })
              }
            }}
            className="text-sm w-20"
            placeholder="30"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            min="0"
          />
        )}
        {(stepKind === 'note' || stepKind === 'load') && (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="px-3 py-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700"
        >
          ×
        </Button>
      </td>
    </tr>
  )
}
