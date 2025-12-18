import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/auth/admin'
import type { Gym } from '@/types/gym'

export const dynamic = 'force-dynamic'

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

    // Cast result to avoid never[] type issue
    type GymRow = { id?: string; slug?: string; name?: string; created_at?: string; updated_at?: string; [key: string]: unknown }
    const gymRows = (data ?? []) as GymRow[]

    // Map database rows to Gym type
    const gyms: Gym[] = gymRows
      .filter((row): row is GymRow & { id: string; slug: string; name: string; created_at: string; updated_at: string } => 
        !!row.id && !!row.slug && !!row.name && !!row.created_at && !!row.updated_at
      )
      .map((row) => ({
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

    // Build insert payload with explicit type
    const insertPayload: Record<string, unknown> = {
      slug,
      name,
    }

    const { data, error } = await (supabase
      .from('gyms') as any)
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.error('Error creating gym:', error)
      return NextResponse.json({ error: 'Failed to create gym' }, { status: 500 })
    }

    // Cast result to avoid never type issue
    type GymResult = { id?: string; slug?: string; name?: string; created_at?: string; updated_at?: string; [key: string]: unknown }
    const result = (data ?? {}) as GymResult

    const gym: Gym = {
      id: result.id || '',
      slug: result.slug || '',
      name: result.name || '',
      created_at: new Date(result.created_at || Date.now()),
      updated_at: new Date(result.updated_at || Date.now()),
    }

    return NextResponse.json(gym, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/gyms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
