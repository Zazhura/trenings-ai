import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/exercises?query=...
 * Search exercises by name or aliases
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || ''

    let queryBuilder = supabase
      .from('exercises')
      .select('*')
      .eq('status', 'active')
      .order('name')
      .limit(50)

    if (query.trim()) {
      const normalizedQuery = query.toLowerCase().trim()
      // Search in name or aliases
      queryBuilder = queryBuilder.or(
        `name.ilike.%${normalizedQuery}%,aliases.cs.{${normalizedQuery}}`
      )
    }

    const { data, error } = await queryBuilder

    if (error) {
      console.error('Error fetching exercises:', error)
      return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 })
    }

    // Map database rows to match Exercise type
    const exercises = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      aliases: row.aliases || [],
      category: row.category || null,
      equipment: row.equipment || [],
      description: row.description || null,
      video_url: row.video_url || null,
      media_svg_url: row.media_svg_url || null,
      created_at: row.created_at,
    }))

    return NextResponse.json(exercises)
  } catch (error) {
    console.error('Error in GET /api/exercises:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/exercises
 * Create a new exercise
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, aliases, category, equipment, description, video_url } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Insert exercise
    const { data, error } = await supabase
      .from('exercises')
      .insert({
        name: name.trim(),
        aliases: Array.isArray(aliases) ? aliases : [],
        category: category || null,
        equipment: Array.isArray(equipment) ? equipment : [],
        description: description || null,
        video_url: video_url || null,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating exercise:', error)
      return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 })
    }

    // Map database row to match Exercise type
    const exercise = {
      id: data.id,
      name: data.name,
      aliases: data.aliases || [],
      category: data.category || null,
      equipment: data.equipment || [],
      description: data.description || null,
      video_url: data.video_url || null,
      media_svg_url: data.media_svg_url || null,
      created_at: data.created_at,
    }

    return NextResponse.json(exercise, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/exercises:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

