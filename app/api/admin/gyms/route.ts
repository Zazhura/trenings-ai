import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/auth/admin'
import type { Gym } from '@/types/gym'

/**
 * GET /api/admin/gyms
 * Get all gyms - Admin only
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminClient()

    const { data, error } = await supabase
      .from('gyms')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching gyms:', error)
      return NextResponse.json({ error: 'Failed to fetch gyms' }, { status: 500 })
    }

    // Map database rows to Gym type
    const gyms: Gym[] = (data || []).map((row: any) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    }))

    return NextResponse.json(gyms)
  } catch (error) {
    console.error('Error in GET /api/admin/gyms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/gyms
 * Create a new gym - Admin only
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { slug, name } = body

    if (!slug || !name) {
      return NextResponse.json({ error: 'slug and name are required' }, { status: 400 })
    }

    const supabase = getAdminClient()

    const { data, error } = await supabase
      .from('gyms')
      .insert({ slug, name })
      .select()
      .single()

    if (error) {
      console.error('Error creating gym:', error)
      return NextResponse.json({ error: 'Failed to create gym' }, { status: 500 })
    }

    const gym: Gym = {
      id: data.id,
      slug: data.slug,
      name: data.name,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    }

    return NextResponse.json(gym, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/gyms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
