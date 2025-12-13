#!/usr/bin/env tsx
/**
 * Verify Exercise Assets Script
 * Checks that all Lottie files referenced in exercise registry exist
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { exerciseRegistry } from '../lib/exercises/exerciseRegistry'

const publicAssetsDir = join(process.cwd(), 'public', 'assets', 'exercises')

interface MissingAsset {
  slug: string
  name: string
  expectedFile: string
}

function verifyExerciseAssets(): void {
  const missing: MissingAsset[] = []

  console.log('🔍 Verifying exercise assets...\n')

  // Check each registry entry
  for (const [slug, entry] of Object.entries(exerciseRegistry)) {
    if (entry.demo.kind === 'lottie') {
      const lottieDemo = entry.demo as Extract<typeof entry.demo, { kind: 'lottie' }>
      const filePath = lottieDemo.lottieFile

      // Extract filename from path (e.g., "/assets/exercises/squat_side.json" -> "squat_side.json")
      const fileName = filePath.split('/').pop() || ''
      const fullPath = join(publicAssetsDir, fileName)

      if (!existsSync(fullPath)) {
        missing.push({
          slug,
          name: entry.name,
          expectedFile: fileName,
        })
      }
    }
  }

  // Report results
  if (missing.length === 0) {
    console.log('✅ All exercise assets verified successfully!')
    console.log(`   Found ${Object.keys(exerciseRegistry).length} exercise(s) in registry`)
    process.exit(0)
  } else {
    console.error(`❌ Found ${missing.length} missing asset(s):\n`)
    missing.forEach(({ slug, name, expectedFile }) => {
      console.error(`   - ${name} (${slug})`)
      console.error(`     Expected: ${expectedFile}`)
      console.error(`     Path: ${join(publicAssetsDir, expectedFile)}`)
      console.error('')
    })
    console.error(`Total: ${missing.length} missing file(s)`)
    process.exit(1)
  }
}

// Run verification
try {
  verifyExerciseAssets()
} catch (error) {
  console.error('Error verifying assets:', error)
  process.exit(1)
}

