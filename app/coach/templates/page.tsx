'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getUserPrimaryGymClient } from '@/lib/auth/get-user-gym-client'
import { getGymTemplates, duplicateTemplate, deleteTemplate, type DatabaseTemplate } from '@/lib/templates/db-operations'
import {
  pageHeaderClasses,
  pageTitleClasses,
  pageDescriptionClasses,
  spacing,
} from '@/lib/ui/layout'

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<DatabaseTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'demo' | 'custom'>('all')

  useEffect(() => {
    loadTemplates()
  }, [filter])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const gym = await getUserPrimaryGymClient()
      if (!gym) {
        console.error('No gym found for user')
        return
      }

      const allTemplates = await getGymTemplates(gym.id)
      
      let filtered = allTemplates
      if (filter === 'demo') {
        filtered = allTemplates.filter(t => t.is_demo)
      } else if (filter === 'custom') {
        filtered = allTemplates.filter(t => !t.is_demo)
      }

      setTemplates(filtered)
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = async (template: DatabaseTemplate) => {
    const newName = `${template.name} (Kopi)`
    const duplicated = await duplicateTemplate(template.id, newName)
    if (duplicated) {
      loadTemplates()
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne template?')) {
      return
    }

    const success = await deleteTemplate(templateId)
    if (success) {
      loadTemplates()
    }
  }

  return (
    <AppShell>
      <div className={pageHeaderClasses}>
        <h1 className={pageTitleClasses}>Templates</h1>
        <p className={pageDescriptionClasses}>
          Administrer templates for din gym. Demo templates er read-only, men kan dupliseres.
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
            variant={filter === 'demo' ? 'default' : 'outline'}
            onClick={() => setFilter('demo')}
          >
            Demo
          </Button>
          <Button
            variant={filter === 'custom' ? 'default' : 'outline'}
            onClick={() => setFilter('custom')}
          >
            Egne
          </Button>
          <div className="flex-1" />
          <Button onClick={() => router.push('/coach/templates/new')}>
            + Ny template
          </Button>
        </div>

        {/* Templates List */}
        {loading ? (
          <div className="text-center py-8">Laster...</div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Ingen templates funnet
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{template.name}</CardTitle>
                      {template.description && (
                        <CardDescription className="mt-1">
                          {template.description}
                        </CardDescription>
                      )}
                    </div>
                    {template.is_demo && (
                      <Badge variant="secondary">Demo</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 mb-4">
                    {template.blocks.length} blokk(er),{' '}
                    {template.blocks.reduce((sum, b) => sum + b.steps.length, 0)} steg
                  </div>
                  <div className="flex gap-2">
                    {template.is_demo ? (
                      <Button
                        variant="outline"
                        onClick={() => handleDuplicate(template)}
                      >
                        Dupliser
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/coach/templates/${template.id}`)}
                        >
                          Rediger
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDelete(template.id)}
                        >
                          Slett
                        </Button>
                      </>
                    )}
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

