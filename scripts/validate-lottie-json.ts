#!/usr/bin/env tsx
/**
 * Validate Lottie JSON Files Script
 * Validates that all JSON files in pack_a are valid JSON and won't crash the display
 */

import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

const packDir = join(process.cwd(), 'public', 'assets', 'exercises', 'packs', 'pack_a')

interface ValidationError {
  fileName: string
  error: string
  line?: number
  column?: number
}

function validateLottieJsonFiles(): void {
  const errors: ValidationError[] = []

  console.log('🔍 Validating Lottie JSON files...\n')
  console.log(`📦 Pack directory: ${packDir}\n`)

  // Check if pack directory exists
  if (!existsSync(packDir)) {
    console.error(`❌ Pack directory does not exist: ${packDir}`)
    process.exit(1)
  }

  // Read all JSON files in pack_a
  const files = readdirSync(packDir).filter((file) => file.endsWith('.json'))

  if (files.length === 0) {
    console.error(`❌ No JSON files found in ${packDir}`)
    process.exit(1)
  }

  console.log(`Found ${files.length} JSON file(s) to validate:\n`)

  // Validate each file
  for (const fileName of files) {
    const filePath = join(packDir, fileName)
    
    try {
      const fileContent = readFileSync(filePath, 'utf-8')
      
      // Try to parse JSON
      try {
        const parsed = JSON.parse(fileContent)
        
        // Basic validation: check if it has required Lottie structure
        if (typeof parsed !== 'object' || parsed === null) {
          errors.push({
            fileName,
            error: 'Root must be an object',
          })
          continue
        }

        // Check for basic Lottie properties
        if (!parsed.v && !parsed.version) {
          console.warn(`⚠️  ${fileName}: Missing version field (may still be valid)`)
        }

        console.log(`✅ ${fileName}: Valid JSON`)
      } catch (parseError) {
        const error = parseError as Error & { line?: number; column?: number }
        errors.push({
          fileName,
          error: error.message,
          line: error.line,
          column: error.column,
        })
        console.error(`❌ ${fileName}: Parse error`)
        console.error(`   ${error.message}`)
        if (error.line) {
          console.error(`   Line ${error.line}, Column ${error.column || '?'}`)
        }
      }
    } catch (readError) {
      const error = readError as Error
      errors.push({
        fileName,
        error: `Failed to read file: ${error.message}`,
      })
      console.error(`❌ ${fileName}: Read error`)
      console.error(`   ${error.message}`)
    }
  }

  // Report results
  console.log('')

  if (errors.length === 0) {
    console.log('✅ All JSON files are valid!')
    console.log(`   Validated ${files.length} file(s)`)
    process.exit(0)
  } else {
    console.error(`❌ Found ${errors.length} invalid file(s):\n`)
    errors.forEach(({ fileName, error, line, column }) => {
      console.error(`   - ${fileName}`)
      console.error(`     Error: ${error}`)
      if (line) {
        console.error(`     Line: ${line}${column ? `, Column: ${column}` : ''}`)
      }
      console.error('')
    })
    console.error(`Total: ${errors.length} invalid file(s)`)
    process.exit(1)
  }
}

// Run validation
try {
  validateLottieJsonFiles()
} catch (error) {
  console.error('Error validating files:', error)
  process.exit(1)
}

