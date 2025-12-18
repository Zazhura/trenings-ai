/**
 * Seed script for demo templates for CrossFit Larvik
 * Run with: npx tsx scripts/seed-demo-templates.ts
 * 
 * Requires environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import type { Block } from '@/types/template'

// Try to load .env.local file if it exists
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const envFile = readFileSync(envPath, 'utf-8')
  
  envFile.split('\n').forEach((line) => {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return
    }
    
    const equalIndex = trimmedLine.indexOf('=')
    if (equalIndex === -1) {
      return
    }
    
    const key = trimmedLine.substring(0, equalIndex).trim()
    let value = trimmedLine.substring(equalIndex + 1).trim()
    
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    
    if (key && value && !process.env[key]) {
      process.env[key] = value
    }
  })
  
  console.log('✓ Loaded .env.local file')
} catch (error: any) {
  if (error.code === 'ENOENT') {
    console.log('ℹ️  .env.local file not found, using environment variables')
  } else {
    console.warn('⚠️  Warning: Could not read .env.local:', error.message)
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables!')
  console.error('')
  console.error('Please set the following environment variables in .env.local:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  process.exit(1)
}

// Log connection info
const hostname = supabaseUrl ? new URL(supabaseUrl).hostname : 'unknown'
console.log('📋 Supabase Connection Info:')
console.log(`   URL hostname: ${hostname}`)
console.log(`   SERVICE_ROLE_KEY exists: ${supabaseServiceKey ? 'true' : 'false'}`)
console.log(`   SERVICE_ROLE_KEY length: ${supabaseServiceKey?.length || 0} characters`)
console.log('')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Type definitions for database rows
type GymRow = { id?: string; slug?: string; name?: string; [key: string]: unknown }

/**
 * Find exercise by name (checks name and aliases)
 */
async function findExerciseByName(name: string): Promise<string | null> {
  const normalizedName = name.toLowerCase().trim()
  
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, aliases')
    .eq('status', 'active')
    .limit(100)

  if (error) {
    console.error(`Error fetching exercises:`, error)
    return null
  }

  // Cast result to avoid never[] type issue
  type ExerciseRow = { id?: string; name?: string; aliases?: string[]; [key: string]: unknown }
  const exerciseRows = (data ?? []) as ExerciseRow[]

  for (const exercise of exerciseRows) {
    if (exercise.name && exercise.name.toLowerCase() === normalizedName) {
      return exercise.id ?? null
    }
    if (exercise.aliases && Array.isArray(exercise.aliases)) {
      for (const alias of exercise.aliases) {
        if (alias.toLowerCase() === normalizedName) {
          return exercise.id ?? null
        }
      }
    }
  }

  // Try partial match
  for (const exercise of exerciseRows) {
    if (exercise.name && (exercise.name.toLowerCase().includes(normalizedName) || 
        normalizedName.includes(exercise.name.toLowerCase()))) {
      return exercise.id ?? null
    }
  }

  console.warn(`⚠️  Exercise not found: ${name}`)
  return null
}

/**
 * Get or create gym "CrossFit Larvik"
 * Also tries to find by name (case-insensitive) if slug doesn't match
 */
async function getOrCreateGym(): Promise<{ id: string; slug: string; name: string } | null> {
  const slug = 'crossfit-larvik'
  const name = 'CrossFit Larvik'

  // Try to find existing gym by slug
  const { data: existingBySlugData, error: findError } = await supabase
    .from('gyms')
    .select('id, slug, name')
    .eq('slug', slug)
    .single()

  // Cast result to avoid never type issue
  const existingBySlug = (existingBySlugData ?? null) as GymRow | null

  if (existingBySlug && !findError) {
    console.log(`✓ Found existing gym by slug: ${existingBySlug.name} (id: ${existingBySlug.id}, slug: ${existingBySlug.slug})`)
    return {
      id: existingBySlug.id || '',
      slug: existingBySlug.slug || '',
      name: existingBySlug.name || '',
    }
  }

  // Try to find by name (case-insensitive)
  const { data: existingByNameData, error: findByNameError } = await supabase
    .from('gyms')
    .select('id, slug, name')
    .ilike('name', name)
    .single()

  const existingByName = (existingByNameData ?? null) as GymRow | null

  if (existingByName && !findByNameError) {
    console.log(`✓ Found existing gym by name: ${existingByName.name} (id: ${existingByName.id}, slug: ${existingByName.slug})`)
    console.log(`⚠️  Note: Slug mismatch! Expected: ${slug}, Found: ${existingByName.slug}`)
    return {
      id: existingByName.id || '',
      slug: existingByName.slug || '',
      name: existingByName.name || '',
    }
  }

  // Build insert payload with explicit type
  const insertPayload: Record<string, unknown> = {
    slug,
    name,
  }

  // Create gym if not found
  const { data: newGymData, error: createError } = await (supabase
    .from('gyms') as any)
    .insert(insertPayload)
    .select('id, slug, name')
    .single()

  const newGym = (newGymData ?? null) as GymRow | null

  if (createError || !newGym) {
    console.error(`❌ Error creating gym:`, createError)
    if (createError) {
      console.error(`   Error message: ${createError.message}`)
      console.error(`   Error details:`, JSON.stringify(createError, null, 2))
    }
    throw new Error(`Failed to create gym: ${createError?.message || 'Unknown error'}`)
  }

  console.log(`✅ Created gym: ${newGym.name} (id: ${newGym.id}, slug: ${newGym.slug})`)
  return {
    id: newGym.id || '',
    slug: newGym.slug || '',
    name: newGym.name || '',
  }
}

/**
 * Get gym ID from environment variable or find by slug/name
 */
async function getTargetGymId(): Promise<string | null> {
  // Check for explicit gym ID or slug from environment
  const seedGymId = process.env.SEED_GYM_ID
  const seedGymSlug = process.env.SEED_GYM_SLUG || 'crossfit-larvik'
  
  if (seedGymId) {
    console.log(`📋 Using SEED_GYM_ID from environment: ${seedGymId}`)
    // Verify gym exists
    const { data: gymData, error } = await supabase
      .from('gyms')
      .select('id, slug, name')
      .eq('id', seedGymId)
      .single()
    
    const gym = (gymData ?? null) as GymRow | null
    
    if (error || !gym) {
      throw new Error(`Gym with ID ${seedGymId} not found: ${error?.message || 'Unknown error'}`)
    }
    
    console.log(`   Found gym: ${gym.name} (slug: ${gym.slug})`)
    return gym.id || null
  }
  
  // Use slug-based lookup
  const gym = await getOrCreateGym()
  if (!gym) {
    throw new Error('Failed to get or create gym')
  }
  
  return gym.id
}

async function seedDemoTemplates() {
  console.log('Starting global demo template seed...')
  console.log('📋 Note: Demo templates are GLOBAL (gym_id = NULL) and visible to all gyms')

  // Note: We don't need a gym ID for demo templates since they're global
  // But we'll still log gym info if SEED_GYM_ID is set (for reference)
  const seedGymId = process.env.SEED_GYM_ID
  if (seedGymId) {
    const { data: gymDetailsData } = await supabase
      .from('gyms')
      .select('id, slug, name')
      .eq('id', seedGymId)
      .single()
    
    const gymDetails = (gymDetailsData ?? null) as GymRow | null
    
    if (gymDetails) {
      console.log(`\n📋 Reference gym (for logging only, templates are global):`)
      console.log(`   ID: ${gymDetails.id}`)
      console.log(`   Slug: ${gymDetails.slug}`)
      console.log(`   Name: ${gymDetails.name}`)
    }
  }
  
  // List all gyms for debugging
  console.log(`\n🔍 Listing all gyms in database:`)
  const { data: allGymsData, error: listGymsError } = await supabase
    .from('gyms')
    .select('id, slug, name')
    .order('name')
  
  if (listGymsError) {
    console.warn(`   ⚠️  Could not list gyms: ${listGymsError.message}`)
  } else {
    const allGyms = (allGymsData ?? []) as GymRow[]
    allGyms.forEach((g) => {
      console.log(`   ${g.name} (id: ${g.id}, slug: ${g.slug})`)
    })
  }

  // Find exercise IDs
  console.log('\nFinding exercises...')
  const exerciseIds: Record<string, string | null> = {}
  const exerciseNames = [
    'Dead Hang',
    'Superman',
    'Air Squat',
    'Scapula Push Up',
    'Scapula Pull Up',
    'Jog',
    'Front Squat',
    'Power Clean',
    'Double Under',
    'Push Up',
    'Wall Ball',
    'Deadlift',
    'Burpee',
    'Row Erg',
    'Back Squat',
    'Thruster',
    'Pull Up',
  ]

  for (const name of exerciseNames) {
    const id = await findExerciseByName(name)
    exerciseIds[name] = id
    if (id) {
      console.log(`  ✓ ${name}: ${id}`)
    }
  }

  // Template 1: CF Base – Warmup + Strength + AMRAP
  const template1: Block[] = [
    {
      name: 'Oppvarming',
      block_mode: 'follow_steps',
      steps: [
        {
          title: '2 runder: 30s dead hang, 20s superman, 10 air squats, 10 scapula push-up, 10 scapula pull-ups',
          step_kind: 'note',
        },
        {
          title: 'Easy jog',
          step_kind: 'time',
          duration: 5 * 60 * 1000, // 5:00 in milliseconds
          exercise_id: exerciseIds['Jog'] || undefined,
        },
      ],
    },
    {
      name: 'Strength',
      block_mode: 'strength_sets',
      block_sets: 4,
      block_rest_seconds: 2 * 60, // 2:00
      steps: [
        {
          title: 'Front Squat @70%',
          step_kind: 'load',
          exercise_id: exerciseIds['Front Squat'] || undefined,
        },
      ],
    },
    {
      name: 'AMRAP',
      block_mode: 'amrap',
      block_duration_seconds: 20 * 60, // 20:00
      steps: [
        {
          title: 'Power Clean',
          step_kind: 'reps',
          reps: 5,
          exercise_id: exerciseIds['Power Clean'] || undefined,
        },
        {
          title: 'Double Under',
          step_kind: 'reps',
          reps: 30,
          exercise_id: exerciseIds['Double Under'] || undefined,
        },
        {
          title: 'Push Up',
          step_kind: 'reps',
          reps: 10,
          exercise_id: exerciseIds['Push Up'] || undefined,
        },
        {
          title: 'Wall Ball',
          step_kind: 'reps',
          reps: 20,
          exercise_id: exerciseIds['Wall Ball'] || undefined,
        },
      ],
    },
  ]

  // Template 2: CF Base – EMOM + AMRAP
  const template2: Block[] = [
    {
      name: 'Oppvarming',
      block_mode: 'follow_steps',
      steps: [
        {
          title: 'Lett oppvarming',
          step_kind: 'note',
        },
      ],
    },
    {
      name: 'EMOM',
      block_mode: 'emom',
      block_duration_seconds: 10 * 60, // 10:00
      steps: [
        {
          title: 'Deadlift @70%',
          step_kind: 'reps',
          reps: 8,
          exercise_id: exerciseIds['Deadlift'] || undefined,
        },
      ],
    },
    {
      name: 'AMRAP',
      block_mode: 'amrap',
      block_duration_seconds: 20 * 60, // 20:00
      steps: [
        {
          title: 'Burpee',
          step_kind: 'reps',
          reps: 10,
          exercise_id: exerciseIds['Burpee'] || undefined,
        },
        {
          title: 'Row Erg',
          step_kind: 'reps',
          reps: 200, // meters
          exercise_id: exerciseIds['Row Erg'] || undefined,
        },
        {
          title: 'Air Squat',
          step_kind: 'reps',
          reps: 20,
          exercise_id: exerciseIds['Air Squat'] || undefined,
        },
      ],
    },
  ]

  // Template 3: CF Base – Strength + For Time
  const template3: Block[] = [
    {
      name: 'Oppvarming',
      block_mode: 'follow_steps',
      steps: [
        {
          title: 'Lett oppvarming',
          step_kind: 'note',
        },
      ],
    },
    {
      name: 'Strength',
      block_mode: 'strength_sets',
      block_sets: 5,
      block_rest_seconds: 2 * 60, // 2:00
      steps: [
        {
          title: 'Back Squat 5x5',
          step_kind: 'load',
          exercise_id: exerciseIds['Back Squat'] || undefined,
        },
      ],
    },
    {
      name: 'For Time',
      block_mode: 'for_time',
      block_duration_seconds: null, // No time cap specified
      steps: [
        {
          title: '21-15-9: Thruster + Pull-ups',
          step_kind: 'note',
          exercise_id: exerciseIds['Thruster'] || undefined,
        },
      ],
    },
  ]

  const templates = [
    {
      name: 'CF Base – Warmup + Strength + AMRAP',
      description: 'Standard CrossFit base template med oppvarming, styrke og AMRAP',
      blocks: template1,
    },
    {
      name: 'CF Base – EMOM + AMRAP',
      description: 'CrossFit base template med EMOM og AMRAP',
      blocks: template2,
    },
    {
      name: 'CF Base – Strength + For Time',
      description: 'CrossFit base template med styrke og For Time',
      blocks: template3,
    },
  ]

  let created = 0
  let skipped = 0
  let errors = 0

  for (const template of templates) {
    try {
      // Idempotent upsert: Use (is_demo=true, name) as unique key
      // First check if exists
      const { data: existingData, error: checkError } = await supabase
        .from('templates')
        .select('id, name, gym_id, is_demo')
        .is('gym_id', null)
        .eq('name', template.name)
        .eq('is_demo', true)
        .maybeSingle()

      // Cast result to avoid never type issue
      type TemplateRow = { id?: string; name?: string; gym_id?: string | null; is_demo?: boolean; [key: string]: unknown }
      const existing = (existingData ?? null) as TemplateRow | null

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is OK
        console.error(`❌ Error checking for existing template ${template.name}:`, checkError.message)
        throw new Error(`Failed to check template "${template.name}": ${checkError.message}`)
      }

      if (existing) {
        // Template exists - update it to ensure it's correct
        console.log(`🔄 Updating existing template: ${template.name} (id: ${existing.id})`)
        
        // Build update payload with explicit type
        const updatePayload: Record<string, unknown> = {
          gym_id: null, // Ensure it's global
          description: template.description,
          blocks: template.blocks as any, // JSONB
          is_demo: true,
        }
        
        const { data: updatedData, error: updateError } = await (supabase
          .from('templates') as any)
          .update(updatePayload)
          .eq('id', existing.id)
          .select('id, name, gym_id, is_demo')
          .single()

        const updated = (updatedData ?? null) as TemplateRow | null

        if (updateError) {
          console.error(`❌ Error updating ${template.name}:`, updateError.message)
          throw new Error(`Failed to update template "${template.name}": ${updateError.message}`)
        } else if (!updated) {
          console.error(`❌ Error updating ${template.name}: No data returned`)
          throw new Error(`Failed to update template "${template.name}": No data returned`)
        } else {
          console.log(`✅ Updated global demo template: ${template.name} (id: ${updated.id}, gym_id: NULL)`)
          skipped++ // Count as skipped since it already existed
        }
      } else {
        // Template doesn't exist - insert it
        console.log(`➕ Inserting new template: ${template.name}`)
        
        // Build insert payload with explicit type
        const insertPayload: Record<string, unknown> = {
          gym_id: null, // Global demo templates - visible to all gyms
          name: template.name,
          description: template.description,
          blocks: template.blocks as any, // JSONB
          is_demo: true,
        }
        
        const { data: insertedData, error: insertError } = await (supabase
          .from('templates') as any)
          .insert(insertPayload)
          .select('id, name, gym_id, is_demo')
          .single()

        const inserted = (insertedData ?? null) as TemplateRow | null

        if (insertError) {
          console.error(`❌ Error inserting ${template.name}:`, insertError.message)
          console.error(`   Error details:`, JSON.stringify(insertError, null, 2))
          throw new Error(`Failed to insert template "${template.name}": ${insertError.message}. Details: ${JSON.stringify(insertError)}`)
        } else if (!inserted) {
          console.error(`❌ Error inserting ${template.name}: No data returned`)
          throw new Error(`Failed to insert template "${template.name}": No data returned`)
        } else {
          console.log(`✅ Created global demo template: ${template.name} (id: ${inserted.id}, gym_id: NULL)`)
          created++
        }
      }
    } catch (error: any) {
      console.error(`❌ Unexpected error for ${template.name}:`, error.message)
      errors++
      throw error // Re-throw to stop on first error
    }
  }

  // Verify templates were created (global demo templates have gym_id = NULL)
  console.log('\n🔍 Verifying global demo templates in database...')
  
  // Count query
  const { count: globalDemoCount, error: countError } = await supabase
    .from('templates')
    .select('*', { count: 'exact', head: true })
    .is('gym_id', null)
    .eq('is_demo', true)

  if (countError) {
    console.error(`❌ Error counting templates:`, countError.message)
    throw new Error(`Failed to count templates: ${countError.message}`)
  }

  console.log(`   ✅ Global demo count: ${globalDemoCount || 0} templates (is_demo=true AND gym_id IS NULL)`)

  // Select query - get first 10 for verification
  const { data: verifyData, error: verifyError } = await supabase
    .from('templates')
    .select('id, name, gym_id, is_demo, created_at')
    .is('gym_id', null)
    .eq('is_demo', true)
    .order('created_at', { ascending: false })
    .limit(10)

  if (verifyError) {
    console.error(`❌ Error verifying templates:`, verifyError.message)
    throw new Error(`Failed to verify templates: ${verifyError.message}`)
  }

  console.log(`\n📋 Sample global demo templates (limit 10):`)
  if (verifyData && verifyData.length > 0) {
    verifyData.forEach((t: any) => {
      console.log(`   - ${t.name}`)
      console.log(`     id: ${t.id}`)
      console.log(`     gym_id: ${t.gym_id || 'NULL'}`)
      console.log(`     is_demo: ${t.is_demo}`)
      console.log(`     created_at: ${t.created_at}`)
      console.log('')
    })
  } else {
    console.log(`   ⚠️  No templates found!`)
  }

  // Verify we have at least 3 templates
  if (globalDemoCount === null || globalDemoCount < 3) {
    throw new Error(`❌ CRITICAL: Expected at least 3 global demo templates, but found ${globalDemoCount || 0}`)
  }

  console.log(`✅ Verification passed: Found ${globalDemoCount} global demo templates`)

  console.log('\n📊 Seed Summary:')
  console.log(`   Created: ${created}`)
  console.log(`   Updated/Skipped: ${skipped}`)
  console.log(`   Errors: ${errors}`)
  console.log(`   Total processed: ${templates.length}`)
  console.log(`   Verified in DB: ${globalDemoCount || 0} global demo templates`)
  
  if (errors > 0) {
    throw new Error(`Seed completed with ${errors} error(s)`)
  }
  
  if (globalDemoCount === null || globalDemoCount < 3) {
    throw new Error(`Expected at least 3 global demo templates in DB, but found ${globalDemoCount || 0}`)
  }
  
  if (created + skipped < 3) {
    throw new Error(`Expected to process 3 templates but only ${created + skipped} were processed`)
  }
}

seedDemoTemplates()
  .then(() => {
    console.log('\n✅ Seed completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seed failed:', error)
    process.exit(1)
  })

