import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/auth/admin'

/**
 * GET /api/admin/debug/templates
 * Debug endpoint to show template counts and details - Admin only
 * Uses admin client (service role) to bypass RLS
 */
export async function GET(request: NextRequest) {
  try {
    // Prod guard: Only allow in development or when NEXT_PUBLIC_DEBUG is true
    const isDebugMode = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEBUG === 'true'
    if (!isDebugMode) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Check admin access
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminClient()
    
    // Extract hostname from Supabase URL (for logging, not full URL)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const hostname = supabaseUrl ? new URL(supabaseUrl).hostname : 'unknown'
    
    console.log(`[debug/templates] Using Supabase hostname: ${hostname}`)

    // Get total count
    const { count: totalCount, error: totalError } = await supabase
      .from('templates')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      console.error('[debug/templates] Error counting total templates:', totalError)
    }

    // Get demo templates count
    const { count: demoCount, error: demoError } = await supabase
      .from('templates')
      .select('*', { count: 'exact', head: true })
      .eq('is_demo', true)

    if (demoError) {
      console.error('[debug/templates] Error counting demo templates:', demoError)
    }

    // Get templates grouped by gym_id (top 10)
    type GymGroupRow = { gym_id: string | null; is_demo: boolean }
    const { data: gymGroups, error: gymGroupsError } = await supabase
      .from('templates')
      .select('gym_id, is_demo')
    
    const gymCounts: Record<string, { total: number; demo: number; custom: number }> = {}
    if (gymGroups) {
      const typedGymGroups: GymGroupRow[] = gymGroups as GymGroupRow[]
      for (const template of typedGymGroups) {
        const gymId = template.gym_id
        if (!gymId) continue
        
        if (!gymCounts[gymId]) {
          gymCounts[gymId] = { total: 0, demo: 0, custom: 0 }
        }
        
        gymCounts[gymId].total++
        if (template.is_demo) {
          gymCounts[gymId].demo++
        } else {
          gymCounts[gymId].custom++
        }
      }
    }

    // Get gym names for the gym IDs
    const gymIds = Object.keys(gymCounts).slice(0, 10)
    const gymNames: Record<string, { name: string; slug: string }> = {}
    
    if (gymIds.length > 0) {
      type GymRow = { id: string; name: string; slug: string }
      const { data: gyms, error: gymsError } = await supabase
        .from('gyms')
        .select('id, name, slug')
        .in('id', gymIds)
      
      if (!gymsError && gyms) {
        const typedGyms: GymRow[] = gyms as GymRow[]
        for (const gym of typedGyms) {
          gymNames[gym.id] = { name: gym.name, slug: gym.slug }
        }
      }
    }

    // Format gym counts with names
    const gymCountsFormatted = Object.entries(gymCounts)
      .slice(0, 10)
      .map(([gymId, counts]) => ({
        gym_id: gymId,
        gym_name: gymNames[gymId]?.name || 'Unknown',
        gym_slug: gymNames[gymId]?.slug || 'unknown',
        ...counts,
      }))
      .sort((a, b) => b.total - a.total)

    // Get latest 20 templates
    type TemplateRow = { id: string; name: string; gym_id: string | null; is_demo: boolean; created_at: string; created_by: string | null }
    const { data: latestTemplates, error: latestError } = await supabase
      .from('templates')
      .select('id, name, gym_id, is_demo, created_at, created_by')
      .order('created_at', { ascending: false })
      .limit(20)

    if (latestError) {
      console.error('[debug/templates] Error fetching latest templates:', latestError)
    }

    // Get user emails for created_by IDs
    const typedLatestTemplates: TemplateRow[] = (latestTemplates || []) as TemplateRow[]
    const userIds = [...new Set(typedLatestTemplates
      .map(t => t.created_by)
      .filter(Boolean) as string[])]
    
    const userEmails: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
      if (!usersError && users) {
        for (const user of users.users) {
          userEmails[user.id] = user.email || 'unknown'
        }
      }
    }

    const latestFormatted = typedLatestTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      gym_id: t.gym_id,
      gym_name: t.gym_id ? (gymNames[t.gym_id]?.name || 'Unknown') : 'Unknown',
      gym_slug: t.gym_id ? (gymNames[t.gym_id]?.slug || 'unknown') : 'unknown',
      is_demo: t.is_demo || false,
      created_at: t.created_at,
      created_by: t.created_by,
      created_by_email: t.created_by ? (userEmails[t.created_by] || 'unknown') : null,
    }))

    return NextResponse.json({
      supabase_hostname: hostname,
      counts: {
        total: totalCount || 0,
        demo: demoCount || 0,
        custom: (totalCount || 0) - (demoCount || 0),
      },
      by_gym: gymCountsFormatted,
      latest: latestFormatted,
    })
  } catch (error) {
    console.error('[debug/templates] Error in GET /api/admin/debug/templates:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

