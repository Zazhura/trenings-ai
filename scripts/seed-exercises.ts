/**
 * Seed script for basic CrossFit and general training exercises
 * Run with: npx tsx scripts/seed-exercises.ts
 * 
 * Requires environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * 
 * These can be set in .env.local or passed as environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-exercises.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Try to load .env.local file if it exists
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const envFile = readFileSync(envPath, 'utf-8')
  
  envFile.split('\n').forEach((line) => {
    const trimmedLine = line.trim()
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return
    }
    
    // Handle both KEY=value and KEY="value" formats
    const equalIndex = trimmedLine.indexOf('=')
    if (equalIndex === -1) {
      return
    }
    
    const key = trimmedLine.substring(0, equalIndex).trim()
    let value = trimmedLine.substring(equalIndex + 1).trim()
    
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    
    // Only set if not already in process.env
    if (key && value && !process.env[key]) {
      process.env[key] = value
    }
  })
  
  console.log('✓ Loaded .env.local file')
  // Debug: Show which keys were loaded (without showing values)
  const loadedKeys = Object.keys(process.env).filter(key => 
    key.includes('SUPABASE') || key.includes('supabase')
  )
  if (loadedKeys.length > 0) {
    console.log(`✓ Found ${loadedKeys.length} Supabase-related environment variables`)
  }
} catch (error: any) {
  // .env.local doesn't exist or couldn't be read
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
  console.error('Found:')
  console.error(`  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}`)
  console.error(`  SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✓' : '✗'}`)
  console.error('')
  console.error('Please set the following environment variables in .env.local:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  console.error('')
  console.error('Make sure .env.local is in the project root directory.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface ExerciseSeed {
  name: string
  aliases: string[]
  category?: string
  equipment: string[]
  description?: string
}

const exercises: ExerciseSeed[] = [
  // CrossFit Fundamentals
  { name: 'Front Squat', aliases: ['Front squat', 'Knebøy foran'], category: 'strength', equipment: ['barbell'] },
  { name: 'Back Squat', aliases: ['Back squat', 'Knebøy bak'], category: 'strength', equipment: ['barbell'] },
  { name: 'Air Squat', aliases: ['Air squat', 'Kroppsvekt knebøy', 'Bodyweight squat'], category: 'strength', equipment: ['bodyweight'] },
  { name: 'Overhead Squat', aliases: ['Overhead squat', 'OH Squat'], category: 'strength', equipment: ['barbell'] },
  
  // Olympic Lifts
  { name: 'Power Clean', aliases: ['Power clean'], category: 'strength', equipment: ['barbell'] },
  { name: 'Squat Clean', aliases: ['Squat clean', 'Clean'], category: 'strength', equipment: ['barbell'] },
  { name: 'Power Snatch', aliases: ['Power snatch'], category: 'strength', equipment: ['barbell'] },
  { name: 'Squat Snatch', aliases: ['Squat snatch', 'Snatch'], category: 'strength', equipment: ['barbell'] },
  { name: 'Hang Clean', aliases: ['Hang clean'], category: 'strength', equipment: ['barbell'] },
  { name: 'Hang Snatch', aliases: ['Hang snatch'], category: 'strength', equipment: ['barbell'] },
  
  // Presses
  { name: 'Shoulder Press', aliases: ['Shoulder press', 'Strict press'], category: 'strength', equipment: ['barbell'] },
  { name: 'Push Press', aliases: ['Push press'], category: 'strength', equipment: ['barbell'] },
  { name: 'Push Jerk', aliases: ['Push jerk'], category: 'strength', equipment: ['barbell'] },
  { name: 'Split Jerk', aliases: ['Split jerk'], category: 'strength', equipment: ['barbell'] },
  { name: 'Thruster', aliases: ['Thruster'], category: 'strength', equipment: ['barbell', 'dumbbell'] },
  
  // Bodyweight
  { name: 'Push Up', aliases: ['Push up', 'Push-up', 'Pushup', 'Armheving'], category: 'strength', equipment: ['bodyweight'] },
  { name: 'Pull Up', aliases: ['Pull up', 'Pull-up', 'Pullup', 'Chin up'], category: 'strength', equipment: ['bodyweight'] },
  { name: 'Burpee', aliases: ['Burpee', 'Burpees'], category: 'cardio', equipment: ['bodyweight'] },
  { name: 'Sit Up', aliases: ['Sit up', 'Sit-up', 'Situps', 'Magebøy'], category: 'strength', equipment: ['bodyweight'] },
  { name: 'Plank', aliases: ['Plank', 'Planke'], category: 'strength', equipment: ['bodyweight'] },
  { name: 'Superman', aliases: ['Superman', 'Superman hold'], category: 'strength', equipment: ['bodyweight'] },
  { name: 'Dead Hang', aliases: ['Dead hang', 'Hang'], category: 'strength', equipment: ['bodyweight'] },
  { name: 'Scapula Push Up', aliases: ['Scapula push up', 'Scapular push up'], category: 'mobility', equipment: ['bodyweight'] },
  { name: 'Scapula Pull Up', aliases: ['Scapula pull up', 'Scapular pull up'], category: 'mobility', equipment: ['bodyweight'] },
  { name: 'Handstand Push Up', aliases: ['Handstand push up', 'HSPU'], category: 'strength', equipment: ['bodyweight'] },
  { name: 'Muscle Up', aliases: ['Muscle up'], category: 'strength', equipment: ['bodyweight'] },
  { name: 'Toes to Bar', aliases: ['Toes to bar', 'T2B'], category: 'strength', equipment: ['bodyweight'] },
  { name: 'Knee to Elbow', aliases: ['Knee to elbow', 'K2E'], category: 'strength', equipment: ['bodyweight'] },
  { name: 'Lunge', aliases: ['Lunge', 'Lunges', 'Utfall'], category: 'strength', equipment: ['bodyweight'] },
  { name: 'Jumping Jack', aliases: ['Jumping jack', 'Jumping jacks', 'Hoppende jekk'], category: 'cardio', equipment: ['bodyweight'] },
  { name: 'Mountain Climber', aliases: ['Mountain climber', 'Mountain climbers'], category: 'cardio', equipment: ['bodyweight'] },
  
  // Cardio
  { name: 'Run', aliases: ['Run', 'Running', 'Løp'], category: 'cardio', equipment: ['bodyweight'] },
  { name: 'Jog', aliases: ['Jog', 'Jogging'], category: 'cardio', equipment: ['bodyweight'] },
  { name: 'Sprint', aliases: ['Sprint', 'Sprinting'], category: 'cardio', equipment: ['bodyweight'] },
  { name: 'Row Erg', aliases: ['Row', 'Rowing', 'Roe', 'Roeergometer'], category: 'cardio', equipment: ['rower'] },
  { name: 'Bike Erg', aliases: ['Bike', 'Biking', 'Sykkel'], category: 'cardio', equipment: ['bike'] },
  { name: 'Ski Erg', aliases: ['Ski', 'Skiing', 'Skiergometer'], category: 'cardio', equipment: ['ski'] },
  { name: 'Double Under', aliases: ['Double under', 'Double unders', 'DU'], category: 'cardio', equipment: ['jump rope'] },
  { name: 'Single Under', aliases: ['Single under', 'Single unders', 'SU'], category: 'cardio', equipment: ['jump rope'] },
  
  // Equipment-based
  { name: 'Wall Ball', aliases: ['Wall ball', 'Wallball'], category: 'strength', equipment: ['medicine ball'] },
  { name: 'Kettlebell Swing', aliases: ['KB Swing', 'Kettlebell swing'], category: 'strength', equipment: ['kettlebell'] },
  { name: 'Deadlift', aliases: ['Deadlift', 'DL'], category: 'strength', equipment: ['barbell'] },
  { name: 'Sumo Deadlift', aliases: ['Sumo deadlift', 'Sumo DL'], category: 'strength', equipment: ['barbell'] },
  { name: 'Romanian Deadlift', aliases: ['RDL', 'Romanian deadlift'], category: 'strength', equipment: ['barbell'] },
  { name: 'Box Jump', aliases: ['Box jump', 'Box jumps'], category: 'cardio', equipment: ['box'] },
  { name: 'Dumbbell Thruster', aliases: ['DB Thruster', 'Dumbbell thruster'], category: 'strength', equipment: ['dumbbell'] },
  { name: 'Dumbbell Snatch', aliases: ['DB Snatch', 'Dumbbell snatch'], category: 'strength', equipment: ['dumbbell'] },
  { name: 'Dumbbell Clean', aliases: ['DB Clean', 'Dumbbell clean'], category: 'strength', equipment: ['dumbbell'] },
  { name: 'Dumbbell Press', aliases: ['DB Press', 'Dumbbell press'], category: 'strength', equipment: ['dumbbell'] },
  
  // Gymnastics
  { name: 'Ring Dip', aliases: ['Ring dip'], category: 'strength', equipment: ['rings'] },
  { name: 'Ring Muscle Up', aliases: ['Ring muscle up', 'RMU'], category: 'strength', equipment: ['rings'] },
  { name: 'Bar Muscle Up', aliases: ['Bar muscle up', 'BMU'], category: 'strength', equipment: ['bar'] },
  { name: 'Chest to Bar', aliases: ['Chest to bar', 'C2B'], category: 'strength', equipment: ['bar'] },
  
  // Additional common exercises
  { name: 'Russian Twist', aliases: ['Russian twist', 'Russian twists'], category: 'strength', equipment: ['bodyweight', 'medicine ball'] },
  { name: 'V-Up', aliases: ['V-up', 'V-ups'], category: 'strength', equipment: ['bodyweight'] },
  { name: 'Hollow Rock', aliases: ['Hollow rock', 'Hollow rocks'], category: 'strength', equipment: ['bodyweight'] },
  { name: 'Arch Rock', aliases: ['Arch rock', 'Arch rocks'], category: 'strength', equipment: ['bodyweight'] },
  { name: 'Pistol Squat', aliases: ['Pistol squat', 'Single leg squat'], category: 'strength', equipment: ['bodyweight'] },
  { name: 'Jump Rope', aliases: ['Jump rope', 'Rope jumping'], category: 'cardio', equipment: ['jump rope'] },
]

async function seedExercises() {
  console.log('Starting exercise seed...')
  console.log(`Seeding ${exercises.length} exercises`)

  let created = 0
  let skipped = 0
  let errors = 0

  for (const exercise of exercises) {
    try {
      // Check if exercise already exists
      const { data: existingData } = await supabase
        .from('exercises')
        .select('id')
        .eq('name', exercise.name)
        .single()

      // Cast result to avoid never type issue
      type ExerciseResult = { id?: string; [key: string]: unknown }
      const existing = (existingData ?? null) as ExerciseResult | null

      if (existing) {
        console.log(`⏭️  Skipped: ${exercise.name} (already exists)`)
        skipped++
        continue
      }

      // Build insert payload with explicit type
      const insertPayload: Record<string, unknown> = {
        name: exercise.name,
        aliases: exercise.aliases,
        category: exercise.category || null,
        equipment: exercise.equipment,
        description: exercise.description || null,
        status: 'active',
      }

      // Insert exercise
      const { data, error } = await (supabase
        .from('exercises') as any)
        .insert(insertPayload)
        .select()
        .single()

      if (error) {
        console.error(`❌ Error creating ${exercise.name}:`, error.message)
        errors++
      } else {
        console.log(`✅ Created: ${exercise.name}`)
        created++
      }
    } catch (error: any) {
      console.error(`❌ Unexpected error for ${exercise.name}:`, error.message)
      errors++
    }
  }

  console.log('\n📊 Seed Summary:')
  console.log(`   Created: ${created}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Errors: ${errors}`)
  console.log(`   Total: ${exercises.length}`)
}

seedExercises()
  .then(() => {
    console.log('\n✅ Seed completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seed failed:', error)
    process.exit(1)
  })

