'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Navigation } from '../components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { DatabaseTemplate } from '@/types/template'
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
  const [filter, setFilter] = useState<'all' | 'demo' | 'custom' | 'debug'>('all')
  const [debugTemplates, setDebugTemplates] = useState<DatabaseTemplate[]>([])
  const [debugLoading, setDebugLoading] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [filter])

  // Refresh templates when page becomes visible (handles back navigation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadTemplates()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [filter])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      console.log(`[TemplatesPage] Loading templates via API, filter: ${filter}`)

      const response = await fetch('/api/templates')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[TemplatesPage] Failed to load templates:', errorData)
        alert(`Kunne ikke laste templates: ${errorData.error || 'Ukjent feil'}`)
        return
      }

      const data = await response.json()
      const { demo = [], own = [], all = [] } = data

      console.log(`[TemplatesPage] Templates loaded:`)
      console.log(`   Demo: ${demo.length}`)
      console.log(`   Own: ${own.length}`)
      console.log(`   All: ${all.length}`)

      let filtered: DatabaseTemplate[] = []
      if (filter === 'demo') {
        filtered = demo
      } else if (filter === 'custom') {
        filtered = own
      } else if (filter === 'all') {
        filtered = all
      } else if (filter === 'debug') {
        // Debug tab - load from admin debug endpoint
        await loadDebugTemplates()
        return
      }

      setTemplates(filtered)
    } catch (error) {
      console.error('[TemplatesPage] Error loading templates:', error)
      alert('Kunne ikke laste templates. Sjekk konsollen for detaljer.')
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = async (template: DatabaseTemplate) => {
    try {
      const response = await fetch(`/api/templates/${template.id}/duplicate`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        alert(`Kunne ikke duplisere template: ${errorData.error || 'Ukjent feil'}`)
        return
      }

      const data = await response.json()
      if (data.id) {
        // Redirect to edit page for the new template
        router.push(`/coach/templates/${data.id}`)
      }
    } catch (error) {
      console.error('[TemplatesPage] Error duplicating template:', error)
      alert('Kunne ikke duplisere template. Sjekk konsollen for detaljer.')
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne template?')) {
      return
    }

    try {
      // TODO: Implement DELETE endpoint if needed
      // For now, we'll keep using the client-side delete
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        alert(`Kunne ikke slette template: ${errorData.error || 'Ukjent feil'}`)
        return
      }

      loadTemplates()
    } catch (error) {
      console.error('[TemplatesPage] Error deleting template:', error)
      alert('Kunne ikke slette template. Sjekk konsollen for detaljer.')
    }
  }

  const loadDebugTemplates = async () => {
    setDebugLoading(true)
    try {
      const response = await fetch('/api/admin/debug/templates')
      if (!response.ok) {
        console.error('[TemplatesPage] Failed to load debug templates')
        return
      }
      const debugData = await response.json()
      
      // Convert latest templates to DatabaseTemplate format
      const converted = (debugData.latest || []).map((t: any) => ({
        id: t.id,
        gym_id: t.gym_id || undefined,
        name: t.name,
        description: undefined,
        is_demo: t.is_demo,
        blocks: [], // We don't need blocks for debug view
        created_by: t.created_by || undefined,
        created_at: new Date(t.created_at),
        updated_at: new Date(t.created_at),
      }))
      
      setDebugTemplates(converted)
    } catch (error) {
      console.error('[TemplatesPage] Error loading debug templates:', error)
    } finally {
      setDebugLoading(false)
    }
  }

  useEffect(() => {
    if (filter === 'debug') {
      loadDebugTemplates()
    }
  }, [filter])

  return (
    <AppShell header={<Navigation />}>
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
          {process.env.NEXT_PUBLIC_DEBUG_TEMPLATES === 'true' && (
            <Button
              variant={filter === 'debug' ? 'default' : 'outline'}
              onClick={() => setFilter('debug')}
              className="text-orange-600 border-orange-600"
            >
              All (debug)
            </Button>
          )}
          <div className="flex-1" />
          <Button onClick={() => router.push('/coach/templates/new')}>
            + Ny template
          </Button>
        </div>

        {/* Templates List */}
        {filter === 'debug' ? (
          debugLoading ? (
            <div className="text-center py-8">Laster debug templates...</div>
          ) : debugTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Ingen debug templates funnet
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Debug: All Templates (via Admin API, limit 50)</CardTitle>
                <CardDescription>
                  Dette viser alle templates fra databasen uten filter (via admin client)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {debugTemplates.map((template) => (
                    <Card key={template.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{template.name}</CardTitle>
                            <CardDescription className="mt-1">
                              Gym ID: {template.gym_id}
                            </CardDescription>
                          </div>
                          {template.is_demo && (
                            <Badge variant="secondary">Demo</Badge>
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        ) : loading ? (
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
                      <>
                        <Button
                          onClick={() => handleDuplicate(template)}
                        >
                          Bruk
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/coach/templates/${template.id}`)}
                        >
                          Vis
                        </Button>
                      </>
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
                          onClick={() => handleDuplicate(template)}
                        >
                          Dupliser
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDelete(template.id)}
                          className="text-destructive"
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

