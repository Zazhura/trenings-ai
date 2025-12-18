import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/auth/admin'

/**
 * POST /api/admin/gyms/[gymId]/exercises/enable-all
 * Enable all exercises for a gym - Admin only
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

    const supabase = getAdminClient()

    // Get all exercises
    const { data: exercises, error: exercisesError } = await supabase
      .from('exercises')
      .select('id')

    if (exercisesError) {
      console.error('Error fetching exercises:', exercisesError)
      return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 })
    }

    if (!exercises || exercises.length === 0) {
      return NextResponse.json({ error: 'No exercises found' }, { status: 404 })
    }

    // Get existing gym_exercises to count what will be updated vs inserted
    const { data: existingGymExercises } = await supabase
      .from('gym_exercises')
      .select('exercise_id, is_enabled')
      .eq('gym_id', params.gymId)

    const existingMap = new Map(
      (existingGymExercises || []).map((ge: any) => [ge.exercise_id, ge.is_enabled])
    )

    let inserted = 0
    let updated = 0

    // Upsert all exercises
    // Using individual upserts to preserve used_count and last_used_at
    for (const exercise of exercises) {
      const exists = existingMap.has(exercise.id)
      const wasEnabled = existingMap.get(exercise.id) === true

      // Only upsert if it doesn't exist or if it's not already enabled
      if (!exists || !wasEnabled) {
        const { error: upsertErr } = await supabase
          .from('gym_exercises')
          .upsert({
            gym_id: params.gymId,
            exercise_id: exercise.id,
            is_enabled: true,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'gym_id,exercise_id',
          })

        if (upsertErr) {
          console.error('Error upserting gym_exercise:', upsertErr)
          continue
        }

        if (exists) {
          updated++
        } else {
          inserted++
        }
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      updated,
      total: inserted + updated,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/gyms/[gymId]/exercises/enable-all:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

