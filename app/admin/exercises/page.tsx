'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Navigation } from '@/app/coach/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'archived'>('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    loadExercises()
  }, [categoryFilter, statusFilter])

  const loadExercises = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('query', searchQuery)
      if (categoryFilter) params.set('category', categoryFilter)
      if (statusFilter) params.set('status', statusFilter)

      const response = await fetch(`/api/admin/exercises?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to load exercises')
      }
      const data = await response.json()
      setExercises(data)

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(data.map((e: Exercise) => e.category).filter(Boolean))
      ) as string[]
      setCategories(uniqueCategories.sort())
    } catch (error) {
      console.error('Error loading exercises:', error)
      alert('Kunne ikke laste øvelser')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadExercises()
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
    const equipment = (formData.get('equipment') as string)
      .split(',')
      .map(e => e.trim())
      .filter(Boolean)
    const description = formData.get('description') as string || undefined
    const video_url = formData.get('video_url') as string || undefined
    const status = (formData.get('status') as string) || 'active'

    try {
      const response = await fetch('/api/admin/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          aliases,
          category,
          equipment,
          description,
          video_url,
          status,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create exercise')
      }

      setShowCreateForm(false)
      loadExercises()
    } catch (error) {
      console.error('Error creating exercise:', error)
      alert('Kunne ikke opprette øvelse')
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingExercise) return

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const aliases = (formData.get('aliases') as string)
      .split(',')
      .map(a => a.trim())
      .filter(Boolean)
    const category = formData.get('category') as string || undefined
    const equipment = (formData.get('equipment') as string)
      .split(',')
      .map(e => e.trim())
      .filter(Boolean)
    const description = formData.get('description') as string || undefined
    const video_url = formData.get('video_url') as string || undefined
    const status = formData.get('status') as string || 'active'

    try {
      const response = await fetch(`/api/admin/exercises/${editingExercise.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          aliases,
          category,
          equipment,
          description,
          video_url,
          status,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update exercise')
      }

      setEditingExercise(null)
      loadExercises()
    } catch (error) {
      console.error('Error updating exercise:', error)
      alert('Kunne ikke oppdatere øvelse')
    }
  }

  const handleArchive = async (exercise: Exercise) => {
    const newStatus: ExerciseStatus = exercise.status === 'active' ? 'archived' : 'active'
    try {
      const response = await fetch(`/api/admin/exercises/${exercise.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update exercise')
      }

      loadExercises()
    } catch (error) {
      console.error('Error archiving exercise:', error)
      alert('Kunne ikke arkivere øvelse')
    }
  }

  return (
    <AppShell header={<Navigation />}>
      <div className={pageHeaderClasses}>
        <h1 className={pageTitleClasses}>Exercise Library</h1>
        <p className={pageDescriptionClasses}>
          Administrer globalt øvelsesbibliotek. Kun Platform Admin kan redigere.
        </p>
      </div>

      <div className={spacing.lg}>
        {/* Search and Filters */}
        <Card className={spacing.md}>
          <CardHeader>
            <CardTitle>Søk og filtre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Søk etter navn eller aliases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch}>Søk</Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="">Alle kategorier</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as '' | 'active' | 'archived')}
                  className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="">Alle statuser</option>
                  <option value="active">Aktive</option>
                  <option value="archived">Arkiverte</option>
                </select>
                <div className="flex-1" />
                <Button 
                  onClick={() => {
                    setEditingExercise(null) // Close edit form if open
                    setShowCreateForm(true)
                  }}
                >
                  + Ny øvelse
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Form */}
        {showCreateForm && (
          <Card className={spacing.md}>
            <CardHeader>
              <CardTitle>Ny øvelse</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Navn (engelsk) *</label>
                  <Input name="name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Aliases (kommaseparert)
                  </label>
                  <Input name="aliases" placeholder="pushups, push-ups, armhevinger" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kategori</label>
                  <Input name="category" placeholder="strength, cardio, mobility" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Utstyr (kommaseparert)</label>
                  <Input name="equipment" placeholder="bodyweight, barbell, dumbbell" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Beskrivelse</label>
                  <Input name="description" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Video URL</label>
                  <Input name="video_url" type="url" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    name="status"
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    defaultValue="active"
                  >
                    <option value="active">Aktiv</option>
                    <option value="archived">Arkivert</option>
                  </select>
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

        {/* Edit Form */}
        {editingExercise && (
          <Card className={spacing.md} id="edit-exercise-form">
            <CardHeader>
              <CardTitle>Rediger øvelse: {editingExercise.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Navn (engelsk) *</label>
                  <Input name="name" defaultValue={editingExercise.name} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Aliases (kommaseparert)
                  </label>
                  <Input
                    name="aliases"
                    defaultValue={editingExercise.aliases.join(', ')}
                    placeholder="pushups, push-ups, armhevinger"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kategori</label>
                  <Input name="category" defaultValue={editingExercise.category || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Utstyr (kommaseparert)</label>
                  <Input
                    name="equipment"
                    defaultValue={Array.isArray(editingExercise.equipment) ? editingExercise.equipment.join(', ') : editingExercise.equipment || ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Beskrivelse</label>
                  <Input name="description" defaultValue={editingExercise.description || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Video URL</label>
                  <Input name="video_url" type="url" defaultValue={editingExercise.video_url || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    name="status"
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    defaultValue={editingExercise.status || 'active'}
                  >
                    <option value="active">Aktiv</option>
                    <option value="archived">Arkivert</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Lagre endringer</Button>
                  <Button type="button" variant="outline" onClick={() => setEditingExercise(null)}>
                    Avbryt
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Exercises Table */}
        {loading ? (
          <div className="text-center py-8">Laster...</div>
        ) : exercises.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Ingen øvelser funnet
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Navn</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Kategori</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Aliases</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Video</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Handlinger</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercises.map((exercise) => (
                      <tr key={exercise.id} className="border-t">
                        <td className="px-4 py-3 font-medium">{exercise.name}</td>
                        <td className="px-4 py-3">{exercise.category || '-'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={exercise.status === 'active' ? 'default' : 'secondary'}>
                            {exercise.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {exercise.aliases.length > 0 ? (
                            <span title={exercise.aliases.join(', ')}>
                              {exercise.aliases.length} alias{exercise.aliases.length !== 1 ? 'es' : ''}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {exercise.video_url ? (
                            <Badge variant="outline">Ja</Badge>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowCreateForm(false) // Close create form if open
                                setEditingExercise(exercise)
                                // Scroll to edit form after a short delay to ensure it's rendered
                                setTimeout(() => {
                                  const editForm = document.getElementById('edit-exercise-form')
                                  if (editForm) {
                                    editForm.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                  }
                                }, 100)
                              }}
                            >
                              Rediger
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleArchive(exercise)}
                            >
                              {exercise.status === 'active' ? 'Arkiver' : 'Aktiver'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
