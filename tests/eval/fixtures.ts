/**
 * Fixtures and seed data for LLM evaluations.
 * Uses the centralized seed data from @/seed.
 */

import { deriveSeedContent, groundTruths, PROFILE_DATA, type CreateContentDto } from '@/seed'

export const EVAL_SESSION_PREFIX = 'eval-'
export const EVAL_CONTENT_PREFIX = 'content_eval_'

interface SeedContent extends CreateContentDto {
  id: string
  version: number
}

/**
 * Gets all seed content with generated IDs.
 * Content is derived from the single source of truth in @/seed.
 */
export function getAllSeedContent(): SeedContent[] {
  return deriveSeedContent().map((content, i) => ({
    ...content,
    id: `${EVAL_CONTENT_PREFIX}${content.type}_${content.slug}`,
    version: 1,
  }))
}

/**
 * Creates a seed project for evaluation.
 * @deprecated Use getAllSeedContent() instead
 */
export function createSeedProject(overrides: Partial<SeedContent> = {}): SeedContent {
  const projects = getAllSeedContent().filter((c) => c.type === 'project')
  return { ...projects[0], ...overrides }
}

/**
 * Creates a seed experience for evaluation.
 * @deprecated Use getAllSeedContent() instead
 */
export function createSeedExperience(overrides: Partial<SeedContent> = {}): SeedContent {
  const experiences = getAllSeedContent().filter((c) => c.type === 'experience')
  return { ...experiences[0], ...overrides }
}

/**
 * Creates seed skills for evaluation.
 * @deprecated Use getAllSeedContent() instead
 */
export function createSeedSkill(overrides: Partial<SeedContent> = {}): SeedContent {
  const skills = getAllSeedContent().filter((c) => c.type === 'skill')
  return { ...skills[0], ...overrides }
}

/**
 * Creates seed about content for evaluation.
 * @deprecated Use getAllSeedContent() instead
 */
export function createSeedAbout(overrides: Partial<SeedContent> = {}): SeedContent {
  const about = getAllSeedContent().filter((c) => c.type === 'about')
  return { ...about[0], ...overrides }
}

/**
 * Default seed data for evaluations.
 */
export const defaultSeed = {
  get projects() {
    return getAllSeedContent().filter((c) => c.type === 'project')
  },
  get experiences() {
    return getAllSeedContent().filter((c) => c.type === 'experience')
  },
  get skills() {
    return getAllSeedContent().filter((c) => c.type === 'skill')
  },
  get about() {
    return getAllSeedContent().filter((c) => c.type === 'about')
  },
  get education() {
    return getAllSeedContent().filter((c) => c.type === 'education')
  },
  get contact() {
    return getAllSeedContent().filter((c) => c.type === 'contact')
  },
}

// Re-export ground truths for use in evaluations
export { groundTruths, PROFILE_DATA }
