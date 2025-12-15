'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Navigation } from '../../components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getUserPrimaryGymClient } from '@/lib/auth/get-user-gym-client'
import { createTemplate } from '@/lib/templates/db-operations'
import { TemplateEditor } from '../components/TemplateEditor'
import type { Block } from '@/types/template'
import {
  pageHeaderClasses,
  pageTitleClasses,
  pageDescriptionClasses,
  spacing,
} from '@/lib/ui/layout'

export default function NewTemplatePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Template må ha et navn')
      return
    }

    if (blocks.length === 0) {
      alert('Template må ha minst én blokk')
      return
    }

    setSaving(true)
    try {
      const gym = await getUserPrimaryGymClient()
      if (!gym) {
        alert('Ingen gym funnet')
        return
      }

      const template = await createTemplate(gym.id, {
        name,
        description: description || undefined,
        blocks,
      })

      if (template) {
        router.push('/coach/templates')
      }
    } catch (error) {
      console.error('Error creating template:', error)
      alert('Kunne ikke opprette template')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell header={<Navigation />}>
      <div className={pageHeaderClasses}>
        <h1 className={pageTitleClasses}>Ny template</h1>
        <p className={pageDescriptionClasses}>
          Opprett en ny template for din gym
        </p>
      </div>

      <div className={spacing.lg}>
        <Card>
          <CardHeader>
            <CardTitle>Template detaljer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Navn *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g., HIIT Cardio"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Beskrivelse</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g., Høyintensitet intervalltrening"
              />
            </div>
          </CardContent>
        </Card>

        <TemplateEditor blocks={blocks} onChange={setBlocks} />

        <div className="flex gap-2">
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

