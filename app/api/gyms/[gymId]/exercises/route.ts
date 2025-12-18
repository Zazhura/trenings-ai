import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import type { Exercise, ExerciseStatus } from '@/types/exercise'

export const dynamic = 'force-dynamic'

/**
 * GET /api/gyms/[gymId]/exercises
 * Get enabled exercises for a gym - Coach/Gym Admin only
 * Uses admin client to bypass RLS issues
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { gymId: string } }
) {
  try {
    // 1) Log params at request start
    console.log('[gym exercises] params', { gymIdParam: params.gymId })

    // 2) Verify authentication with regular client
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Log user after getUser()
    console.log('[gym exercises] user', { userId: user?.id, email: user?.email })

    // 3) Normalize gymId (check if UUID or slug)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    let resolvedGymId = params.gymId

    // If gymId doesn't match UUID regex, look up gym.id via slug
    if (!uuidRegex.test(params.gymId)) {
      const adminClient = getAdminClient()
      const { data: gymData, error: gymLookupError } = await adminClient
        .from('gyms')
        .select('id')
        .eq('slug', params.gymId)
        .maybeSingle()

      if (gymLookupError || !gymData) {
        console.error('[gym exercises] Gym lookup failed', { slug: params.gymId, error: gymLookupError })
        return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
      }

      resolvedGymId = (gymData as any).id
      console.log('[gym exercises] Resolved slug to UUID', { slug: params.gymId, gymId: resolvedGymId })
    }

    // 4) Use adminClient to verify membership (user belongs to gymId)
    const adminClient = getAdminClient()
    
    // Check membership: user_roles.user_id == user.id AND user_roles.gym_id == resolvedGymId
    const { data: membershipData, error: membershipError } = await adminClient
      .from('user_roles')
      .select('user_id, gym_id, role')
      .eq('user_id', user.id)
      .eq('gym_id', resolvedGymId)
      .maybeSingle()

    // If no membership found, return 403 with debug info
    if (!membershipData) {
      console.error('[gym exercises] access denied', {
        resolvedGymId,
        userId: user.id,
        membershipError,
      })
      return NextResponse.json(
        {
          error: 'Failed to verify access',
          debug: {
            resolvedGymId,
            userId: user.id,
          },
        },
        { status: 403 }
      )
    }

    // Handle membership check errors (DB errors)
    if (membershipError) {
      console.error('[gym exercises] Membership check DB error:', membershipError)
      return NextResponse.json({ error: 'Failed to verify access' }, { status: 500 })
    }

    console.log('[gym exercises] Membership verified', {
      userId: user.id,
      gymId: resolvedGymId,
      role: (membershipData as any).role,
    })

    // 5) Use adminClient to fetch enabled exercises via gym_exercises join
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || ''

    // Build query: join exercises with gym_exercises, filter by gym_id and is_enabled
    const exerciseQuery = adminClient
      .from('gym_exercises')
      .select(`
        exercises (
          id,
          name,
          aliases,
          category,
          equipment,
          video_url,
          status,
          search_text
        )
      `)
      .eq('gym_id', resolvedGymId)
      .eq('is_enabled', true)

    const { data: gymExercisesData, error: exercisesError } = await exerciseQuery

    if (exercisesError) {
      console.error('Error fetching exercises:', exercisesError)
      return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 })
    }

    // Map exercises from join result
    let exercises = (gymExercisesData || [])
      .map((ge: any) => {
        const exercise = ge.exercises
        if (!exercise) return null

        return {
          id: exercise.id,
          name: exercise.name,
          aliases: exercise.aliases || [],
          category: exercise.category || null,
          equipment: Array.isArray(exercise.equipment) 
            ? exercise.equipment 
            : (exercise.equipment ? [exercise.equipment] : []),
          video_url: exercise.video_url || null,
          status: (exercise.status as ExerciseStatus) || 'active',
          search_text: exercise.search_text || null,
        }
      })
      .filter((e: any) => e !== null)

    // Filter by search query if provided (server-side filtering)
    if (query.trim()) {
      const normalizedQuery = query.toLowerCase().trim()
      exercises = exercises.filter((e: any) => {
        const searchText = e.name?.toLowerCase() || ''
        const aliases = (e.aliases || []).map((a: string) => a.toLowerCase())
        const searchTextField = (e.search_text || '').toLowerCase()
        
        return (
          searchText.includes(normalizedQuery) ||
          aliases.some((a: string) => a.includes(normalizedQuery)) ||
          searchTextField.includes(normalizedQuery)
        )
      })
    }

    // Sort by name
    exercises.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))

    return NextResponse.json({
      items: exercises,
      total: exercises.length,
    })
  } catch (error) {
    console.error('Error in GET /api/gyms/[gymId]/exercises:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
