import { sanitizeSlug } from './sanitize'

/**
 * Converts a string to a URL-friendly slug.
 * Uses sanitizeSlug for consistent formatting.
 */
export function slugify(title: string): string {
  return sanitizeSlug(title)
}

/**
 * Generates a unique slug by appending -1, -2, etc. if conflicts exist.
 */
export async function generateUniqueSlug(
  baseSlug: string,
  existsCheck: (slug: string) => Promise<boolean>
): Promise<string> {
  const sanitized = sanitizeSlug(baseSlug)

  // Check if base slug is available
  if (!(await existsCheck(sanitized))) {
    return sanitized
  }

  // Try appending numbers until we find an available slug
  let counter = 1
  const maxAttempts = 100

  while (counter <= maxAttempts) {
    const candidateSlug = `${sanitized}-${counter}`
    if (!(await existsCheck(candidateSlug))) {
      return candidateSlug
    }
    counter++
  }

  // Fallback: append timestamp if all numeric suffixes are taken
  return `${sanitized}-${Date.now()}`
}
