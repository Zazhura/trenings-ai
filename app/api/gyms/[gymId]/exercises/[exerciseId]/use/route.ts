import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/gyms/[gymId]/exercises/[exerciseId]/use
 * Mark an exercise as used by a gym
 * Upserts gym_exercises and increments used_count + last_used_at
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { gymId: string; exerciseId: string } }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const gymId = params.gymId
    const exerciseId = params.exerciseId

    if (!gymId || !exerciseId) {
      return NextResponse.json({ error: 'Gym ID and Exercise ID are required' }, { status: 400 })
    }

    // Verify gym exists
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id')
      .eq('id', gymId)
      .single()

    if (gymError || !gym) {
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    }

    // Verify exercise exists
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .select('id')
      .eq('id', exerciseId)
      .single()

    if (exerciseError || !exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
    }

    // Upsert gym_exercises with increment
    // Use PostgreSQL's ON CONFLICT to handle upsert and increment
    const { data, error } = await supabase.rpc('increment_gym_exercise_use', {
      p_gym_id: gymId,
      p_exercise_id: exerciseId,
    })

    if (error) {
      // If RPC doesn't exist, fall back to manual upsert
      console.warn('RPC function not found, using manual upsert:', error.message)
      
      // Get current record if exists
      const { data: existing } = await supabase
        .from('gym_exercises')
        .select('used_count')
        .eq('gym_id', gymId)
        .eq('exercise_id', exerciseId)
        .single()

      const newUsedCount = (existing?.used_count || 0) + 1
      const now = new Date().toISOString()

      const { data: upsertData, error: upsertError } = await supabase
        .from('gym_exercises')
        .upsert({
          gym_id: gymId,
          exercise_id: exerciseId,
          is_enabled: true,
          used_count: newUsedCount,
          last_used_at: now,
        }, {
          onConflict: 'gym_id,exercise_id',
        })
        .select()
        .single()

      if (upsertError) {
        console.error('Error upserting gym_exercise:', upsertError)
        return NextResponse.json({ error: 'Failed to update exercise usage' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        used_count: upsertData.used_count,
        last_used_at: upsertData.last_used_at,
      })
    }

    return NextResponse.json({
      success: true,
      used_count: data?.used_count || 0,
      last_used_at: data?.last_used_at || null,
    })
  } catch (error) {
    console.error('Error in POST /api/gyms/[gymId]/exercises/[exerciseId]/use:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

