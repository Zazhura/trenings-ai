'use client'

import { useState } from 'react'
import { Template } from '@/types/template'
import { getAllTemplates } from '@/lib/templates'

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
      <h2 className="text-2xl font-semibold">Velg Template</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              selectedTemplateId === template.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
            {template.description && (
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {template.blocks.length} blokk(er)
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

