/**
 * Database operations for Gym Templates
 * Gym Admin and Coach can CRUD templates for their gym
 */

import { createClient } from '@/lib/supabase/client'
import type { DatabaseTemplate, Block, Step } from '@/types/template'

/**
 * Get all templates for a gym
 */
export async function getGymTemplates(gymId: string): Promise<DatabaseTemplate[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('gym_id', gymId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching templates:', error)
    return []
  }

  return (data || []).map(mapDbToTemplate)
}

/**
 * Get template by ID
 */
export async function getTemplateById(id: string): Promise<DatabaseTemplate | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return mapDbToTemplate(data)
}

/**
 * Create template
 */
export async function createTemplate(
  gymId: string,
  template: {
    name: string
    description?: string
    blocks: Block[]
    is_demo?: boolean
  }
): Promise<DatabaseTemplate | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('templates')
    .insert({
      gym_id: gymId,
      name: template.name,
      description: template.description || null,
      blocks: template.blocks as any, // JSONB
      is_demo: template.is_demo || false,
      created_by: user?.id || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating template:', error)
    return null
  }

  return mapDbToTemplate(data)
}

/**
 * Update template
 */
export async function updateTemplate(
  id: string,
  updates: {
    name?: string
    description?: string
    blocks?: Block[]
  }
): Promise<DatabaseTemplate | null> {
  const supabase = createClient()
  const updateData: any = {}

  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description || null
  if (updates.blocks !== undefined) updateData.blocks = updates.blocks as any

  const { data, error } = await supabase
    .from('templates')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating template:', error)
    return null
  }

  return mapDbToTemplate(data)
}

/**
 * Delete template
 */
export async function deleteTemplate(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting template:', error)
    return false
  }

  return true
}

/**
 * Duplicate template (for demo templates)
 */
export async function duplicateTemplate(
  templateId: string,
  newName: string
): Promise<DatabaseTemplate | null> {
  const original = await getTemplateById(templateId)
  if (!original) {
    return null
  }

  return createTemplate(original.gym_id, {
    name: newName,
    description: original.description,
    blocks: original.blocks,
    is_demo: false, // Duplicated templates are not demo
  })
}

/**
 * Map database row to DatabaseTemplate type
 */
function mapDbToTemplate(row: any): DatabaseTemplate {
  return {
    id: row.id,
    gym_id: row.gym_id,
    name: row.name,
    description: row.description || undefined,
    is_demo: row.is_demo || false,
    blocks: row.blocks as Block[],
    created_by: row.created_by || undefined,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  }
}

