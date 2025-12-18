'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Navigation } from '@/app/coach/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { GymExercise } from '@/types/exercise'
import type { Gym } from '@/types/gym'
import {
  pageHeaderClasses,
  pageTitleClasses,
  pageDescriptionClasses,
  spacing,
} from '@/lib/ui/layout'

export default function GymExercisesPage() {
  const params = useParams()
  const gymId = params.gymId as string

  const [gym, setGym] = useState<Gym | null>(null)
  const [allExercises, setAllExercises] = useState<GymExercise[]>([])
  const [enabledExercises, setEnabledExercises] = useState<GymExercise[]>([])
  const [mostUsedExercises, setMostUsedExercises] = useState<GymExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set())
  const [showConfirmEnableAll, setShowConfirmEnableAll] = useState(false)
  const [enableAllResult, setEnableAllResult] = useState<{ inserted: number; updated: number; total: number } | null>(null)
  const [enablingAll, setEnablingAll] = useState(false)

  useEffect(() => {
    loadGym()
    if (gymId) {
      loadExercises()
    }
  }, [gymId])

  useEffect(() => {
    if (gymId && searchQuery) {
      loadExercises()
    }
  }, [searchQuery])

  const loadGym = async () => {
    try {
      const response = await fetch('/api/admin/gyms')
      if (!response.ok) throw new Error('Failed to load gyms')
      const gyms = await response.json()
      const foundGym = gyms.find((g: Gym) => g.id === gymId)
      setGym(foundGym || null)
    } catch (error) {
      console.error('Error loading gym:', error)
    }
  }

  const loadExercises = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('query', searchQuery)

      const response = await fetch(`/api/admin/gyms/${gymId}/exercises?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to load exercises')
      }
      const data = await response.json()
      setAllExercises(data)

      // Filter enabled exercises (sorted alphabetically)
      const enabled = data
        .filter((e: GymExercise) => e.is_enabled_in_gym === true)
        .sort((a: GymExercise, b: GymExercise) => a.name.localeCompare(b.name))
      setEnabledExercises(enabled)

      // Filter most used exercises (sorted by used_count desc)
      const mostUsed = data
        .filter((e: GymExercise) => e.used_count_in_gym > 0)
        .sort((a: GymExercise, b: GymExercise) => b.used_count_in_gym - a.used_count_in_gym)
        .slice(0, 20) // Top 20
      setMostUsedExercises(mostUsed)
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

  const toggleExercise = async (exerciseId: string, currentEnabled: boolean | null) => {
    const newEnabled = !currentEnabled
    try {
      const response = await fetch(`/api/admin/gyms/${gymId}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: exerciseId,
          is_enabled: newEnabled,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to toggle exercise')
      }

      loadExercises()
    } catch (error) {
      console.error('Error toggling exercise:', error)
      alert('Kunne ikke oppdatere øvelse')
    }
  }

  const handleEnableSelected = async () => {
    try {
      const promises = Array.from(selectedExercises).map((exerciseId) =>
        fetch(`/api/admin/gyms/${gymId}/exercises`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exercise_id: exerciseId,
            is_enabled: true,
          }),
        })
      )

      await Promise.all(promises)
      setSelectedExercises(new Set())
      loadExercises()
    } catch (error) {
      console.error('Error enabling selected exercises:', error)
      alert('Kunne ikke aktivere valgte øvelser')
    }
  }

  const toggleSelect = (exerciseId: string) => {
    const newSelected = new Set(selectedExercises)
    if (newSelected.has(exerciseId)) {
      newSelected.delete(exerciseId)
    } else {
      newSelected.add(exerciseId)
    }
    setSelectedExercises(newSelected)
  }

  const handleEnableAll = async () => {
    setEnablingAll(true)
    setShowConfirmEnableAll(false)
    setEnableAllResult(null)

    try {
      const response = await fetch(`/api/admin/gyms/${gymId}/exercises/enable-all`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to enable all exercises')
      }

      const result = await response.json()
      setEnableAllResult(result)
      
      // Reload exercises to show updated list
      await loadExercises()
    } catch (error) {
      console.error('Error enabling all exercises:', error)
      alert('Kunne ikke aktivere alle øvelser')
    } finally {
      setEnablingAll(false)
    }
  }

  return (
    <AppShell header={<Navigation />}>
      <div className={pageHeaderClasses}>
        <h1 className={pageTitleClasses}>
          {gym ? `Øvelser for ${gym.name}` : 'Laster...'}
        </h1>
        <p className={pageDescriptionClasses}>
          Aktiver/deaktiver øvelser for denne gymmen og se mest brukte.
        </p>
      </div>

      <div className={spacing.lg}>
        {/* Search */}
        <Card className={spacing.md}>
          <CardHeader>
            <CardTitle>Søk globale øvelser</CardTitle>
          </CardHeader>
          <CardContent>
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
            {selectedExercises.size > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedExercises.size} valgt{selectedExercises.size !== 1 ? 'e' : ''}
                </span>
                <Button onClick={handleEnableSelected} size="sm">
                  Aktiver valgte
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedExercises(new Set())}
                >
                  Avbryt valg
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enabled Exercises */}
        <Card className={spacing.md}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Aktiverte øvelser ({enabledExercises.length})</CardTitle>
                <CardDescription>Sortert alfabetisk</CardDescription>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowConfirmEnableAll(true)}
                disabled={enablingAll}
              >
                {enablingAll ? 'Aktiverer...' : 'Aktiver alle øvelser'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {enableAllResult && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm font-medium text-green-800">
                  Alle øvelser aktivert!
                </div>
                <div className="text-sm text-green-700 mt-1">
                  {enableAllResult.inserted > 0 && (
                    <span>{enableAllResult.inserted} nye øvelser aktivert. </span>
                  )}
                  {enableAllResult.updated > 0 && (
                    <span>{enableAllResult.updated} eksisterende øvelser oppdatert. </span>
                  )}
                  Totalt: {enableAllResult.total} øvelser aktivert.
                </div>
              </div>
            )}
            {showConfirmEnableAll && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="font-medium text-red-800 mb-2">
                  Bekreft aktivering av alle øvelser
                </div>
                <div className="text-sm text-red-700 mb-4">
                  Dette vil aktivere alle øvelser i det globale biblioteket for denne gymmen.
                  Eksisterende bruksstatistikk (used_count, last_used_at) vil bli beholdt.
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleEnableAll}
                    disabled={enablingAll}
                  >
                    {enablingAll ? 'Aktiverer...' : 'Bekreft'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirmEnableAll(false)}
                    disabled={enablingAll}
                  >
                    Avbryt
                  </Button>
                </div>
              </div>
            )}
            {loading ? (
              <div className="text-center py-4">Laster...</div>
            ) : enabledExercises.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Ingen aktiverte øvelser
              </div>
            ) : (
              <div className="grid gap-2">
                {enabledExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{exercise.name}</div>
                      {exercise.category && (
                        <div className="text-sm text-gray-600">{exercise.category}</div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExercise(exercise.id, exercise.is_enabled_in_gym)}
                    >
                      Deaktiver
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Used Exercises */}
        <Card className={spacing.md}>
          <CardHeader>
            <CardTitle>Mest brukte øvelser</CardTitle>
            <CardDescription>Sortert etter bruksfrekvens</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Laster...</div>
            ) : mostUsedExercises.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Ingen bruksstatistikk tilgjengelig
              </div>
            ) : (
              <div className="grid gap-2">
                {mostUsedExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{exercise.name}</div>
                      <div className="text-sm text-gray-600">
                        Brukt {exercise.used_count_in_gym} gang{exercise.used_count_in_gym !== 1 ? 'er' : ''}
                      </div>
                    </div>
                    <Badge variant={exercise.is_enabled_in_gym ? 'default' : 'secondary'}>
                      {exercise.is_enabled_in_gym ? 'Aktivert' : 'Deaktivert'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Exercises (from search) */}
        {searchQuery && (
          <Card className={spacing.md}>
            <CardHeader>
              <CardTitle>Søkeresultater ({allExercises.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Laster...</div>
              ) : allExercises.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Ingen øvelser funnet
                </div>
              ) : (
                <div className="grid gap-2">
                  {allExercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedExercises.has(exercise.id)}
                          onChange={() => toggleSelect(exercise.id)}
                          className="h-4 w-4"
                        />
                        <div>
                          <div className="font-medium">{exercise.name}</div>
                          {exercise.category && (
                            <div className="text-sm text-gray-600">{exercise.category}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={exercise.is_enabled_in_gym ? 'default' : 'secondary'}>
                          {exercise.is_enabled_in_gym ? 'Aktivert' : 'Ikke aktivert'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleExercise(exercise.id, exercise.is_enabled_in_gym)}
                        >
                          {exercise.is_enabled_in_gym ? 'Deaktiver' : 'Aktiver'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}

