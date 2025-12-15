'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  getAllExercises,
  getActiveExercises,
  createExercise,
  updateExercise,
} from '@/lib/exercises/db-operations'
import type { Exercise, ExerciseStatus } from '@/types/exercise'
import {
  pageHeaderClasses,
  pageTitleClasses,
  pageDescriptionClasses,
  spacing,
} from '@/lib/ui/layout'

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)

  useEffect(() => {
    loadExercises()
  }, [filter])

  const loadExercises = async () => {
    setLoading(true)
    try {
      const data = filter === 'all' 
        ? await getAllExercises()
        : filter === 'active'
        ? await getActiveExercises()
        : await getAllExercises().then(exs => exs.filter(e => e.status === 'archived'))
      setExercises(data)
    } catch (error) {
      console.error('Error loading exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const aliases = (formData.get('aliases') as string)
      .split(',')
      .map(a => a.trim())
      .filter(Boolean)
    const category = formData.get('category') as string || undefined
    const equipment = formData.get('equipment') as string || undefined

    const newExercise = await createExercise({
      name,
      aliases,
      category,
      equipment,
      status: 'active',
    })

    if (newExercise) {
      setShowCreateForm(false)
      loadExercises()
    }
  }

  const handleArchive = async (exercise: Exercise) => {
    const newStatus: ExerciseStatus = exercise.status === 'active' ? 'archived' : 'active'
    await updateExercise(exercise.id, { ...exercise, status: newStatus })
    loadExercises()
  }

  return (
    <AppShell>
      <div className={pageHeaderClasses}>
        <h1 className={pageTitleClasses}>Exercise Library</h1>
        <p className={pageDescriptionClasses}>
          Administrer globalt øvelsesbibliotek. Kun Platform Admin kan redigere.
        </p>
      </div>

      <div className={spacing.lg}>
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            Alle
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            onClick={() => setFilter('active')}
          >
            Aktive
          </Button>
          <Button
            variant={filter === 'archived' ? 'default' : 'outline'}
            onClick={() => setFilter('archived')}
          >
            Arkiverte
          </Button>
          <div className="flex-1" />
          <Button onClick={() => setShowCreateForm(true)}>
            + Ny øvelse
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card className={spacing.md}>
            <CardHeader>
              <CardTitle>Ny øvelse</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Navn (engelsk)</label>
                  <Input name="name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Aliases (kommaseparert, norsk + engelsk)
                  </label>
                  <Input name="aliases" placeholder="pushups, push-ups, armhevinger" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kategori</label>
                  <Input name="category" placeholder="strength, cardio, mobility" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Utstyr</label>
                  <Input name="equipment" placeholder="bodyweight, barbell, dumbbell" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Opprett</Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Avbryt
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Exercises List */}
        {loading ? (
          <div className="text-center py-8">Laster...</div>
        ) : exercises.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Ingen øvelser funnet
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {exercises.map((exercise) => (
              <Card key={exercise.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{exercise.name}</CardTitle>
                      {exercise.aliases.length > 0 && (
                        <CardDescription className="mt-1">
                          Aliases: {exercise.aliases.join(', ')}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={exercise.status === 'active' ? 'default' : 'secondary'}>
                        {exercise.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchive(exercise)}
                      >
                        {exercise.status === 'active' ? 'Arkiver' : 'Aktiver'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-gray-600">
                    {exercise.category && (
                      <div>
                        <span className="font-medium">Kategori:</span> {exercise.category}
                      </div>
                    )}
                    {exercise.equipment && (
                      <div>
                        <span className="font-medium">Utstyr:</span> {exercise.equipment}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Media:</span>{' '}
                      {exercise.motion_asset_url ? 'Motion' : 'Ingen'}
                      {exercise.video_asset_url && ' + Video'}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingExercise(exercise)}
                    >
                      Rediger
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}

