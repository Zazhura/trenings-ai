import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/auth/admin'
import type { Exercise, ExerciseStatus } from '@/types/exercise'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/exercises
 * Get all exercises (including archived) - Admin only
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminClient()
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''

    let queryBuilder = supabase
      .from('exercises')
      .select('*')
      .order('name')

    // Search filter
    if (query.trim()) {
      const normalizedQuery = query.toLowerCase().trim()
      queryBuilder = queryBuilder.or(
        `name.ilike.%${normalizedQuery}%,aliases.cs.{${normalizedQuery}},search_text.ilike.%${normalizedQuery}%`
      )
    }

    // Category filter
    if (category) {
      queryBuilder = queryBuilder.eq('category', category)
    }

    // Status filter
    if (status && (status === 'active' || status === 'archived')) {
      queryBuilder = queryBuilder.eq('status', status)
    }

    const { data, error } = await queryBuilder

    if (error) {
      console.error('Error fetching exercises:', error)
      return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 })
    }

    // Cast result to avoid never[] type issue
    type ExerciseRow = { id?: string; name?: string; aliases?: string[]; category?: string | null; equipment?: string[] | string | null; description?: string | null; video_url?: string | null; media_svg_url?: string | null; status?: string; motion_asset_url?: string | null; video_asset_url?: string | null; poster_url?: string | null; created_at?: string; updated_at?: string | null; [key: string]: unknown }
    const exerciseRows = (data ?? []) as ExerciseRow[]

    // Map database rows to Exercise type
    const exercises = exerciseRows.map((row) => ({
      id: row.id,
      name: row.name,
      aliases: row.aliases || [],
      category: row.category || null,
      equipment: Array.isArray(row.equipment) ? row.equipment : (row.equipment ? [row.equipment] : []),
      description: row.description || null,
      video_url: row.video_url || null,
      media_svg_url: row.media_svg_url || null,
      status: (row.status as ExerciseStatus) || 'active',
      motion_asset_url: row.motion_asset_url || undefined,
      video_asset_url: row.video_asset_url || undefined,
      poster_url: row.poster_url || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at || undefined,
    }))

    return NextResponse.json(exercises)
  } catch (error) {
    console.error('Error in GET /api/admin/exercises:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/exercises
 * Create a new exercise - Admin only
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, aliases, category, equipment, description, video_url, status } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Build payload with explicit type
    const payload: Record<string, unknown> = {
      name: name.trim(),
      aliases: Array.isArray(aliases) ? aliases.map((a: string) => a.trim()).filter(Boolean) : [],
      category: category ?? null,
      equipment: Array.isArray(equipment) ? equipment : [],
      description: description ?? null,
      video_url: video_url ?? null,
      media_svg_url: undefined,
      status: status ?? 'active',
    }

    // Insert exercise
    const { data, error } = await supabase
      .from('exercises')
      .insert(payload as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating exercise:', error)
      return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 })
    }

    // Map database row to Exercise type
    const row = data as any
    const exercise: Exercise = {
      id: row.id,
      name: row.name,
      aliases: row.aliases || [],
      category: row.category || null,
      equipment: Array.isArray(row.equipment) ? row.equipment : (row.equipment ? [row.equipment] : []),
      description: row.description || null,
      video_url: row.video_url || null,
      media_svg_url: row.media_svg_url || null,
      status: (row.status as ExerciseStatus) || 'active',
      motion_asset_url: row.motion_asset_url || undefined,
      video_asset_url: row.video_asset_url || undefined,
      poster_url: row.poster_url || undefined,
      created_at: new Date(row.created_at),
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined,
    }

    return NextResponse.json(exercise, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/exercises:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

