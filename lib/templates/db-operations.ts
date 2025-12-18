/**
 * Database operations for Gym Templates
 * Gym Admin and Coach can CRUD templates for their gym
 */

import { createClient } from '@/lib/supabase/client'
import type { DatabaseTemplate, Block, Step } from '@/types/template'
import type { TemplateSnapshot } from '@/types/session'

/**
 * Get all templates for a gym
 * Includes:
 * - Custom templates for the gym (gym_id = gymId, is_demo = false)
 * - Global demo templates (gym_id IS NULL, is_demo = true)
 */
export async function getGymTemplates(gymId: string): Promise<DatabaseTemplate[]> {
  const supabase = createClient()
  
  console.log('[getGymTemplates] Fetching templates for gym:', gymId)
  
  // Get custom templates for this gym
  const { data: customTemplates, error: customError } = await supabase
    .from('templates')
    .select('*')
    .eq('gym_id', gymId)
    .eq('is_demo', false)
    .order('created_at', { ascending: false })

  if (customError) {
    console.error('[getGymTemplates] Error fetching custom templates:', customError)
    console.error('[getGymTemplates] Error details:', JSON.stringify(customError, null, 2))
  }

  // Get global demo templates (gym_id IS NULL)
  const { data: demoTemplates, error: demoError } = await supabase
    .from('templates')
    .select('*')
    .is('gym_id', null)
    .eq('is_demo', true)
    .order('created_at', { ascending: false })

  if (demoError) {
    console.error('[getGymTemplates] Error fetching demo templates:', demoError)
    console.error('[getGymTemplates] Error details:', JSON.stringify(demoError, null, 2))
  }

  const allTemplates = [
    ...(customTemplates || []),
    ...(demoTemplates || []),
  ]

  const templates = allTemplates.map(mapDbToTemplate)
  console.log(`[getGymTemplates] Found ${templates.length} templates for gym ${gymId}`)
  console.log(`[getGymTemplates] Custom templates: ${templates.filter(t => !t.is_demo).length}`)
  console.log(`[getGymTemplates] Demo templates: ${templates.filter(t => t.is_demo).length}`)
  
  return templates
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

  console.log('Creating template:', {
    gymId,
    name: template.name,
    blocksCount: template.blocks.length,
    stepsCount: template.blocks.reduce((sum, b) => sum + b.steps.length, 0),
    isDemo: template.is_demo || false,
  })

  const { data, error } = await supabase
    .from('templates')
    .insert({
      gym_id: gymId,
      name: template.name,
      description: template.description || null,
      blocks: template.blocks as any, // JSONB - includes all block/step fields
      is_demo: template.is_demo || false,
      created_by: user?.id || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating template:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return null
  }

  const mapped = mapDbToTemplate(data)
  console.log('Template created successfully:', {
    id: mapped.id,
    name: mapped.name,
    gymId: mapped.gym_id,
    blocksCount: mapped.blocks.length,
  })
  return mapped
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
 * Duplicated templates always belong to user's gym (not global)
 */
export async function duplicateTemplate(
  templateId: string,
  newName: string
): Promise<DatabaseTemplate | null> {
  const original = await getTemplateById(templateId)
  if (!original) {
    return null
  }

  // Get user's gym ID (duplicated templates belong to user's gym, not global)
  const gymResponse = await fetch('/api/user/gym')
  if (!gymResponse.ok) {
    console.error('[duplicateTemplate] Failed to get user gym')
    return null
  }
  
  const gymData = await gymResponse.json()
  const userGymId = gymData.gymId
  
  if (!userGymId) {
    console.error('[duplicateTemplate] User has no gym')
    return null
  }

  return createTemplate(userGymId, {
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
    gym_id: row.gym_id || undefined, // Handle NULL gym_id for global demo templates
    name: row.name,
    description: row.description || undefined,
    is_demo: row.is_demo || false,
    blocks: row.blocks as Block[],
    created_by: row.created_by || undefined,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  }
}

/**
 * Create template snapshot from database template
 * Converts DatabaseTemplate to TemplateSnapshot format for session storage
 */
export function createTemplateSnapshotFromDb(template: DatabaseTemplate): TemplateSnapshot {
  return {
    blocks: template.blocks.map((block) => ({
      name: block.name,
      block_mode: block.block_mode,
      block_duration_seconds: block.block_duration_seconds,
      block_sets: block.block_sets,
      block_rest_seconds: block.block_rest_seconds,
      steps: block.steps.map((step) => ({
        title: step.title,
        duration: step.duration,
        exercise_id: step.exercise_id,
        step_kind: step.step_kind,
        reps: step.reps,
        mediaUrl: step.mediaUrl, // Include mediaUrl if present (backward compatibility)
      })),
    })),
  }
}

