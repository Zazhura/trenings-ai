import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/auth/admin'
import type { Exercise, ExerciseStatus } from '@/types/exercise'

/**
 * Type for exercise updates (only updatable fields)
 */
type ExerciseUpdate = {
  name?: string
  aliases?: string[]
  category?: string | null
  equipment?: string[]
  description?: string | null
  video_url?: string | null
  status?: ExerciseStatus
}

/**
 * PATCH /api/admin/exercises/[id]
 * Update an exercise - Admin only
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin access
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, aliases, category, equipment, description, video_url, status } = body

    const supabase = getAdminClient()

    // Build update object
    const updates: ExerciseUpdate = {}
    if (name !== undefined) updates.name = name.trim()
    if (aliases !== undefined) {
      updates.aliases = Array.isArray(aliases) 
        ? aliases.map((a: string) => a.trim()).filter(Boolean) 
        : []
    }
    if (category !== undefined) updates.category = category || null
    if (equipment !== undefined) {
      updates.equipment = Array.isArray(equipment) ? equipment : (equipment ? [equipment] : [])
    }
    if (description !== undefined) updates.description = description || null
    if (video_url !== undefined) updates.video_url = video_url || null
    if (status !== undefined && (status === 'active' || status === 'archived')) {
      updates.status = status
    }

    // Update exercise
    // Use type assertion to work around Supabase strict typing
    const { data, error } = await (supabase
      .from('exercises') as any)
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating exercise:', error)
      return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
    }

    // Map database row to Exercise type
    const exercise: Exercise = {
      id: data.id,
      name: data.name,
      aliases: data.aliases || [],
      category: data.category || null,
      equipment: Array.isArray(data.equipment) ? data.equipment : (data.equipment ? [data.equipment] : []),
      description: data.description || null,
      video_url: data.video_url || null,
      media_svg_url: data.media_svg_url || null,
      status: (data.status as ExerciseStatus) || 'active',
      motion_asset_url: data.motion_asset_url || undefined,
      video_asset_url: data.video_asset_url || undefined,
      poster_url: data.poster_url || undefined,
      created_at: new Date(data.created_at),
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
    }

    return NextResponse.json(exercise)
  } catch (error) {
    console.error('Error in PATCH /api/admin/exercises/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

