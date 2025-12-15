'use client'

import { useState, useEffect } from 'react'
import { Template, DatabaseTemplate } from '@/types/template'
import { getAllTemplates } from '@/lib/templates'
import { getUserPrimaryGymClient } from '@/lib/auth/get-user-gym-client'
import { getGymTemplates } from '@/lib/templates/db-operations'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TemplateSelectorProps {
  onSelect: (template: Template) => void
  selectedTemplateId?: string
}

export function TemplateSelector({
  onSelect,
  selectedTemplateId,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      // Try to load from database first
      const gym = await getUserPrimaryGymClient()
      if (gym) {
        const dbTemplates = await getGymTemplates(gym.id)
        // Convert DatabaseTemplate to Template format
        const convertedTemplates: Template[] = dbTemplates.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          blocks: t.blocks,
        }))
        setTemplates(convertedTemplates)
        setLoading(false)
        return
      }
    } catch (error) {
      console.error('Error loading templates from database:', error)
    }

    // Fallback to hardcoded templates
    const hardcodedTemplates = getAllTemplates()
    setTemplates(hardcodedTemplates)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">Velg template</h2>
          <p className="text-sm text-muted-foreground">
            Laster templates...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-1">Velg template</h2>
        <p className="text-sm text-muted-foreground">
          Velg en treningsmal for å starte en ny økt
        </p>
      </div>
      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Ingen templates tilgjengelig
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => {
          const isSelected = selectedTemplateId === template.id
          return (
            <Card
              key={template.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isSelected && 'ring-2 ring-primary ring-offset-2'
              )}
              onClick={() => onSelect(template)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(template)
                }
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant="secondary" className="ml-2">
                    {template.blocks.length} blokk{template.blocks.length !== 1 ? 'er' : ''}
                  </Badge>
                </div>
                {template.description && (
                  <CardDescription className="mt-2">
                    {template.description}
                  </CardDescription>
                )}
              </CardHeader>
            </Card>
          )
        })}
        </div>
      )}
    </div>
  )
}

