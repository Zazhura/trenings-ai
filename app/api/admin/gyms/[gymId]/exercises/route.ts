import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/auth/admin'
import type { Exercise, ExerciseStatus } from '@/types/exercise'

/**
 * GET /api/admin/gyms/[gymId]/exercises
 * Get exercises for a gym with enable/disable status and usage stats - Admin only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { gymId: string } }
) {
  try {
    // Check admin access
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminClient()
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || ''
    const enabled = searchParams.get('enabled') // 'true' | 'false' | null

    // Get all exercises
    let exerciseQuery = supabase
      .from('exercises')
      .select('*')
      .order('name')

    // Search filter
    if (query.trim()) {
      const normalizedQuery = query.toLowerCase().trim()
      exerciseQuery = exerciseQuery.or(
        `name.ilike.%${normalizedQuery}%,aliases.cs.{${normalizedQuery}},search_text.ilike.%${normalizedQuery}%`
      )
    }

    const { data: exercisesData, error: exercisesError } = await exerciseQuery

    if (exercisesError) {
      console.error('Error fetching gym exercises:', exercisesError)
      return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 })
    }

    // Get gym_exercises for this gym
    const { data: gymExercisesData, error: gymExercisesError } = await supabase
      .from('gym_exercises')
      .select('*')
      .eq('gym_id', params.gymId)

    if (gymExercisesError) {
      console.error('Error fetching gym_exercises:', gymExercisesError)
    }

    // Create a map of exercise_id -> gym_exercise data
    const gymExercisesMap = new Map(
      (gymExercisesData || []).map((ge: any) => [ge.exercise_id, ge])
    )

    // Map and filter exercises
    let exercises = (exercisesData || []).map((row: any) => {
      const gymExercise = gymExercisesMap.get(row.id)
      return {
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
        is_enabled_in_gym: gymExercise?.is_enabled ?? null,
        used_count_in_gym: gymExercise?.used_count ?? 0,
        last_used_at_in_gym: gymExercise?.last_used_at || null,
        is_in_gym: !!gymExercise,
      }
    })

    // Filter by enabled status
    if (enabled === 'true') {
      exercises = exercises.filter((e: any) => e.is_enabled_in_gym === true)
    } else if (enabled === 'false') {
      exercises = exercises.filter((e: any) => e.is_enabled_in_gym === false || e.is_enabled_in_gym === null)
    }

    return NextResponse.json(exercises)
  } catch (error) {
    console.error('Error in GET /api/admin/gyms/[gymId]/exercises:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/gyms/[gymId]/exercises
 * Toggle enable/disable exercise for gym - Admin only
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { gymId: string } }
) {
  try {
    // Check admin access
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { exercise_id, is_enabled } = body

    if (!exercise_id || typeof is_enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'exercise_id and is_enabled (boolean) are required' },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    // Upsert gym_exercise
    const { data, error } = await supabase
      .from('gym_exercises')
      .upsert({
        gym_id: params.gymId,
        exercise_id,
        is_enabled,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'gym_id,exercise_id',
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating gym exercise:', error)
      return NextResponse.json({ error: 'Failed to update gym exercise' }, { status: 500 })
    }

    return NextResponse.json({
      gym_id: data.gym_id,
      exercise_id: data.exercise_id,
      is_enabled: data.is_enabled,
      used_count: data.used_count,
      last_used_at: data.last_used_at,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/gyms/[gymId]/exercises:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

