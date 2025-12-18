'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Navigation } from '@/app/coach/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  pageHeaderClasses,
  pageTitleClasses,
  pageDescriptionClasses,
  spacing,
} from '@/lib/ui/layout'

// Note: Using native select - can be replaced with shadcn Select component if available

interface GymUser {
  id: string
  email: string
  role: string
  created_at: string
}

export default function GymDetailPage() {
  const params = useParams()
  const gymId = params.gymId as string

  const [gym, setGym] = useState<{ id: string; name: string; slug: string } | null>(null)
  const [users, setUsers] = useState<GymUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [adding, setAdding] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'coach' | 'gym_admin'>('coach')

  useEffect(() => {
    loadGym()
    loadUsers()
  }, [gymId])

  const loadGym = async () => {
    try {
      const response = await fetch('/api/admin/gyms')
      if (!response.ok) return

      const gyms = await response.json()
      const foundGym = gyms.find((g: any) => g.id === gymId)
      if (foundGym) {
        setGym(foundGym)
      }
    } catch (error) {
      console.error('Error loading gym:', error)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/gyms/${gymId}/users`)
      if (!response.ok) {
        throw new Error('Failed to load users')
      }
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error loading users:', error)
      alert('Kunne ikke laste brukere')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)

    try {
      const response = await fetch(`/api/admin/gyms/${gymId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add user')
      }

      setEmail('')
      setRole('coach')
      setShowAddForm(false)
      loadUsers()
    } catch (error: any) {
      console.error('Error adding user:', error)
      alert(error.message || 'Kunne ikke legge til bruker')
    } finally {
      setAdding(false)
    }
  }

  return (
    <AppShell header={<Navigation />}>
      <div className={pageHeaderClasses}>
        <h1 className={pageTitleClasses}>{gym?.name || 'Gym Details'}</h1>
        <p className={pageDescriptionClasses}>
          Administrer brukere og øvelser for denne gymmen
        </p>
      </div>

      <div className={spacing.lg}>
        {/* Navigation */}
        <div className="flex gap-2 mb-6">
          <Link href="/admin/gyms">
            <Button variant="outline">← Tilbake til gyms</Button>
          </Link>
          <Link href={`/admin/gyms/${gymId}/exercises`}>
            <Button variant="outline">Administrer øvelser</Button>
          </Link>
        </div>

        {/* Users Section */}
        <Card className={spacing.md}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Brukere</CardTitle>
                <CardDescription>
                  Brukere tilknyttet denne gymmen
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddForm(true)}>+ Legg til bruker</Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add User Form */}
            {showAddForm && (
              <form onSubmit={handleAddUser} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="bruker@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rolle</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'coach' | 'gym_admin')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="coach">Coach</option>
                    <option value="gym_admin">Gym Admin</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={adding}>
                    {adding ? 'Legger til...' : 'Legg til'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false)
                      setEmail('')
                      setRole('coach')
                    }}
                  >
                    Avbryt
                  </Button>
                </div>
              </form>
            )}

            {/* Users List */}
            {loading ? (
              <div className="text-center py-8">Laster...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Ingen brukere tilknyttet denne gymmen
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-gray-500">
                        Tilknyttet: {new Date(user.created_at).toLocaleDateString('no-NO')}
                      </div>
                    </div>
                    <Badge variant={user.role === 'gym_admin' ? 'default' : 'secondary'}>
                      {user.role === 'gym_admin' ? 'Gym Admin' : 'Coach'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

