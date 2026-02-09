/**
 * Seed data module.
 * Provides profile data, content derivation, and ground truths.
 */

export { PROFILE_DATA, type ProfileData } from './data'
export { deriveSeedContent } from './content'
export type { CreateContentDto } from '@/db/models'
export { groundTruths, assertionRegex } from './ground-truths'

// Seed script entry point
if (import.meta.main) {
  const { deriveSeedContent } = await import('./content')

  console.log('Seed Content Preview:')
  console.log('=====================')

  const content = deriveSeedContent()
  for (const item of content) {
    console.log(`\n[${item.type}] ${item.slug}`)
    console.log(`  Status: ${item.status}`)
    console.log(`  Data: ${JSON.stringify(item.data, null, 2).slice(0, 200)}...`)
  }

  console.log(`\nTotal: ${content.length} content items`)
}
