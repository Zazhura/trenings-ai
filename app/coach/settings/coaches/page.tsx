'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getUserPrimaryGymClient } from '@/lib/auth/get-user-gym-client'
import { isGymAdminClient } from '@/lib/auth/roles-client'
import { getGymRoles, inviteCoach, removeCoach } from '@/lib/user-roles/db-operations'
import type { UserRoleRecord } from '@/types/user-role'
import type { Gym } from '@/types/gym'
import {
  pageHeaderClasses,
  pageTitleClasses,
  pageDescriptionClasses,
  spacing,
} from '@/lib/ui/layout'
import { createClient } from '@/lib/supabase/client'

export default function CoachesPage() {
  const [gym, setGym] = useState<Gym | null>(null)
  const [coaches, setCoaches] = useState<UserRoleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const userGym = await getUserPrimaryGymClient()
      if (!userGym) {
        console.error('No gym found')
        return
      }

      setGym(userGym)
      const admin = await isGymAdminClient(userGym.id)
      setIsAdmin(admin)

      if (admin) {
        const roles = await getGymRoles(userGym.id)
        setCoaches(roles.filter(r => r.role === 'coach'))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gym || !inviteEmail.trim()) {
      return
    }

    try {
      const result = await inviteCoach(gym.id, inviteEmail.trim())
      if (result) {
        setInviteEmail('')
        setShowInviteForm(false)
        loadData()
      } else {
        alert('Kunne ikke invitere coach. Sjekk at e-postadressen eksisterer i systemet.')
      }
    } catch (error) {
      console.error('Error inviting coach:', error)
      alert('Kunne ikke invitere coach')
    }
  }

  const handleRemove = async (userId: string) => {
    if (!gym) return
    if (!confirm('Er du sikker på at du vil fjerne denne coachen?')) {
      return
    }

    const success = await removeCoach(gym.id, userId)
    if (success) {
      loadData()
    }
  }

  const getUserEmail = async (userId: string): Promise<string> => {
    const supabase = createClient()
    const { data } = await supabase.auth.admin.getUserById(userId)
    return data?.user?.email || 'Ukjent'
  }

  if (loading) {
    return (
      <AppShell>
        <div className="text-center py-8">Laster...</div>
      </AppShell>
    )
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <div className={pageHeaderClasses}>
          <h1 className={pageTitleClasses}>Coach Management</h1>
          <p className={pageDescriptionClasses}>
            Kun Gym Admin kan administrere coacher.
          </p>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Du har ikke tilgang til denne siden.
          </CardContent>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className={pageHeaderClasses}>
        <h1 className={pageTitleClasses}>Coach Management</h1>
        <p className={pageDescriptionClasses}>
          Inviter og administrer coacher for {gym?.name}
        </p>
      </div>

      <div className={spacing.lg}>
        <div className="flex justify-end mb-6">
          <Button onClick={() => setShowInviteForm(true)}>
            + Inviter coach
          </Button>
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <Card className={spacing.md}>
            <CardHeader>
              <CardTitle>Inviter coach</CardTitle>
              <CardDescription>
                Coach må allerede ha en konto i systemet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">E-post</label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="coach@example.com"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Inviter</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowInviteForm(false)
                      setInviteEmail('')
                    }}
                  >
                    Avbryt
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Coaches List */}
        {coaches.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Ingen coacher inviterte ennå
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {coaches.map((coach) => (
              <Card key={coach.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Coach</CardTitle>
                      <CardDescription>User ID: {coach.user_id}</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleRemove(coach.user_id)}
                    >
                      Fjern
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}

