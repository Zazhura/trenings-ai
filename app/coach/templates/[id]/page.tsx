'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getTemplateById, updateTemplate, deleteTemplate } from '@/lib/templates/db-operations'
import { TemplateEditor } from '../components/TemplateEditor'
import type { Block, DatabaseTemplate } from '@/types/template'
import {
  pageHeaderClasses,
  pageTitleClasses,
  pageDescriptionClasses,
  spacing,
} from '@/lib/ui/layout'

export default function EditTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string

  const [template, setTemplate] = useState<DatabaseTemplate | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTemplate()
  }, [templateId])

  const loadTemplate = async () => {
    setLoading(true)
    try {
      const data = await getTemplateById(templateId)
      if (data) {
        setTemplate(data)
        setName(data.name)
        setDescription(data.description || '')
        setBlocks(data.blocks)
      }
    } catch (error) {
      console.error('Error loading template:', error)
    } finally {
      setLoading(false)
    }
  }

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
      const updated = await updateTemplate(templateId, {
        name,
        description: description || undefined,
        blocks,
      })

      if (updated) {
        router.push('/coach/templates')
      }
    } catch (error) {
      console.error('Error updating template:', error)
      alert('Kunne ikke oppdatere template')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Er du sikker på at du vil slette denne template?')) {
      return
    }

    const success = await deleteTemplate(templateId)
    if (success) {
      router.push('/coach/templates')
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="text-center py-8">Laster...</div>
      </AppShell>
    )
  }

  if (!template) {
    return (
      <AppShell>
        <div className="text-center py-8">Template ikke funnet</div>
      </AppShell>
    )
  }

  if (template.is_demo) {
    return (
      <AppShell>
        <div className={pageHeaderClasses}>
          <h1 className={pageTitleClasses}>{template.name}</h1>
          <Badge variant="secondary">Demo - Read-only</Badge>
        </div>
        <div className={spacing.lg}>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="mb-4">Denne template er en demo og kan ikke redigeres.</p>
              <Button onClick={() => router.push('/coach/templates')}>
                Tilbake til templates
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className={pageHeaderClasses}>
        <h1 className={pageTitleClasses}>Rediger template</h1>
        <p className={pageDescriptionClasses}>
          Rediger template: {template.name}
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
            {saving ? 'Lagrer...' : 'Lagre endringer'}
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            Avbryt
          </Button>
          <Button variant="outline" onClick={handleDelete} className="ml-auto text-destructive">
            Slett
          </Button>
        </div>
      </div>
    </AppShell>
  )
}

