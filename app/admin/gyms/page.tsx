'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAllGyms, createGym } from '@/lib/gyms/db-operations'
import type { Gym } from '@/types/gym'
import {
  pageHeaderClasses,
  pageTitleClasses,
  pageDescriptionClasses,
  spacing,
} from '@/lib/ui/layout'

export default function GymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    loadGyms()
  }, [])

  const loadGyms = async () => {
    setLoading(true)
    try {
      const data = await getAllGyms()
      setGyms(data)
    } catch (error) {
      console.error('Error loading gyms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const slug = formData.get('slug') as string
    const name = formData.get('name') as string

    const newGym = await createGym({ slug, name })

    if (newGym) {
      setShowCreateForm(false)
      loadGyms()
    }
  }

  return (
    <AppShell>
      <div className={pageHeaderClasses}>
        <h1 className={pageTitleClasses}>Gyms</h1>
        <p className={pageDescriptionClasses}>
          Administrer gyms. Kun Platform Admin kan opprette nye gyms.
        </p>
      </div>

      <div className={spacing.lg}>
        <div className="flex justify-end mb-6">
          <Button onClick={() => setShowCreateForm(true)}>
            + Ny gym
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card className={spacing.md}>
            <CardHeader>
              <CardTitle>Ny gym</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Slug (URL-vennlig)</label>
                  <Input name="slug" required placeholder="crossfit-larvik" />
                  <p className="text-xs text-gray-500 mt-1">
                    Brukes i display URL: /display/{'{slug}'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Navn</label>
                  <Input name="name" required placeholder="CrossFit Larvik" />
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

        {/* Gyms List */}
        {loading ? (
          <div className="text-center py-8">Laster...</div>
        ) : gyms.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Ingen gyms funnet
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {gyms.map((gym) => (
              <Card key={gym.id}>
                <CardHeader>
                  <CardTitle>{gym.name}</CardTitle>
                  <CardDescription>Slug: {gym.slug}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    Display URL: <code className="bg-gray-100 px-1 rounded">/display/{gym.slug}</code>
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

