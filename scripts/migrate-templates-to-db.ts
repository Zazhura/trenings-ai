/**
 * Migration script to move hardcoded templates to database
 * Run this once to seed the database with demo templates
 * 
 * Usage: npx tsx scripts/migrate-templates-to-db.ts <gym-id>
 */

import { getAllTemplates } from '@/lib/templates'
import { createTemplate } from '@/lib/templates/db-operations'

async function migrateTemplates(gymId: string) {
  console.log(`Migrating templates to gym ${gymId}...`)

  const templates = getAllTemplates()
  console.log(`Found ${templates.length} templates to migrate`)

  for (const template of templates) {
    console.log(`Migrating template: ${template.name}`)
    
    const result = await createTemplate(gymId, {
      name: template.name,
      description: template.description,
      blocks: template.blocks,
      is_demo: true, // Mark as demo templates
    })

    if (result) {
      console.log(`✅ Migrated: ${template.name} (ID: ${result.id})`)
    } else {
      console.error(`❌ Failed to migrate: ${template.name}`)
    }
  }

  console.log('Migration complete!')
}

// Get gym ID from command line argument
const gymId = process.argv[2]

if (!gymId) {
  console.error('Usage: npx tsx scripts/migrate-templates-to-db.ts <gym-id>')
  process.exit(1)
}

migrateTemplates(gymId)
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

