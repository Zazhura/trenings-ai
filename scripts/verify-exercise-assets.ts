#!/usr/bin/env tsx
/**
 * Verify Exercise Assets Script
 * Checks that all Lottie files referenced in exercise registry exist
 * Enforces pack_a structure - all assets must be in packs/pack_a/
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { exerciseRegistry } from '../lib/exercises/exerciseRegistry'

const REQUIRED_PACK = 'pack_a'
const publicAssetsDir = join(process.cwd(), 'public', 'assets', 'exercises')
const packDir = join(publicAssetsDir, 'packs', REQUIRED_PACK)

interface MissingAsset {
  slug: string
  name: string
  expectedFile: string
  pack: string
}

interface InvalidPath {
  slug: string
  name: string
  filePath: string
  reason: string
}

function verifyExerciseAssets(): void {
  const missing: MissingAsset[] = []
  const invalidPaths: InvalidPath[] = []

  console.log('🔍 Verifying exercise assets...\n')
  console.log(`📦 Enforcing pack structure: ${REQUIRED_PACK}\n`)

  // Check each registry entry
  for (const [slug, entry] of Object.entries(exerciseRegistry)) {
    if (entry.demo.kind === 'lottie') {
      const lottieDemo = entry.demo as Extract<typeof entry.demo, { kind: 'lottie' }>
      const filePath = lottieDemo.lottieFile
      const pack = lottieDemo.pack

      // Enforce pack_a requirement
      if (pack !== REQUIRED_PACK) {
        invalidPaths.push({
          slug,
          name: entry.name,
          filePath,
          reason: `Invalid pack: "${pack}". Must be "${REQUIRED_PACK}"`,
        })
        continue
      }

      // Enforce path structure - must be in packs/pack_a/
      if (!filePath.includes(`packs/${REQUIRED_PACK}/`)) {
        invalidPaths.push({
          slug,
          name: entry.name,
          filePath,
          reason: `Path must be in packs/${REQUIRED_PACK}/`,
        })
        continue
      }

      // Extract filename from path
      const fileName = filePath.split('/').pop() || ''
      const fullPath = join(packDir, fileName)

      if (!existsSync(fullPath)) {
        missing.push({
          slug,
          name: entry.name,
          expectedFile: fileName,
          pack: REQUIRED_PACK,
        })
      }
    }
  }

  // Report results
  const hasErrors = missing.length > 0 || invalidPaths.length > 0

  if (hasErrors) {
    if (invalidPaths.length > 0) {
      console.error(`❌ Found ${invalidPaths.length} invalid path(s):\n`)
      invalidPaths.forEach(({ slug, name, filePath, reason }) => {
        console.error(`   - ${name} (${slug})`)
        console.error(`     Path: ${filePath}`)
        console.error(`     Error: ${reason}`)
        console.error('')
      })
    }

    if (missing.length > 0) {
      console.error(`❌ Found ${missing.length} missing asset(s):\n`)
      missing.forEach(({ slug, name, expectedFile, pack }) => {
        console.error(`   - ${name} (${slug})`)
        console.error(`     Pack: ${pack}`)
        console.error(`     Expected: ${expectedFile}`)
        console.error(`     Path: ${join(packDir, expectedFile)}`)
        console.error('')
      })
    }

    console.error(`Total errors: ${invalidPaths.length + missing.length}`)
    process.exit(1)
  } else {
    console.log('✅ All exercise assets verified successfully!')
    console.log(`   Found ${Object.keys(exerciseRegistry).length} exercise(s) in registry`)
    console.log(`   All assets are in packs/${REQUIRED_PACK}/`)
    process.exit(0)
  }
}

// Run verification
try {
  verifyExerciseAssets()
} catch (error) {
  console.error('Error verifying assets:', error)
  process.exit(1)
}

