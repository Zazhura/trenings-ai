'use client'

import { Template } from '@/types/template'
import { getAllTemplates } from '@/lib/templates'
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
  const templates = getAllTemplates()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-1">Velg template</h2>
        <p className="text-sm text-muted-foreground">
          Velg en treningsmal for å starte en ny økt
        </p>
      </div>
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
    </div>
  )
}

