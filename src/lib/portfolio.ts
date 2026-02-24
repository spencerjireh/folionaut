import type { ContentBundle, ContentWithData } from '@/db/models'

const DEFAULT_MAX_PROJECTS = 10
const DEFAULT_MAX_DESCRIPTION_LENGTH = 120

export interface FormatBundleOptions {
  maxProjects?: number
  maxDescriptionLength?: number
}

// --- Section ordering and display titles ---

const SECTION_ORDER = [
  'bio', 'about', 'education', 'contact', 'experience',
  'skill', 'project', 'hobby', 'hobbies', 'link',
]

const SECTION_TITLES: Record<string, string> = {
  bio: 'About',
  about: 'About',
  education: 'Education',
  contact: 'Contact',
  experience: 'Experience',
  skill: 'Skills',
  project: 'Projects',
  hobby: 'Hobbies',
  hobbies: 'Hobbies',
  link: 'Links',
}

// --- Formatter registry ---

interface FormatterContext {
  items: ContentWithData[]
  maxProjects: number
  maxDescLen: number
}

type SectionFormatter = (ctx: FormatterContext) => string

const formatters = new Map<string, SectionFormatter>()

// --- Individual formatters ---
// Each handles two shapes:
//   1. Live DB: separate rows with flat `data` fields
//   2. Legacy seed: single row with nested `data.items[]` array

function formatBioItems({ items }: FormatterContext): string {
  if (items.length === 0) return ''
  const d = items[0].data
  const parts: string[] = []
  if (d.name || d.lastName) {
    parts.push(`Name: ${[d.name, d.lastName].filter(Boolean).join(' ')}`)
  }
  if (d.title) parts.push(`Title: ${d.title}`)
  if (Array.isArray(d.blurb) && d.blurb.length > 0) {
    parts.push((d.blurb as string[]).join(' '))
  }
  if (d.content) parts.push(String(d.content))
  return parts.join('\n')
}

formatters.set('bio', formatBioItems)
formatters.set('about', formatBioItems)

formatters.set('education', ({ items }) => {
  if (items.length === 0) return ''
  const first = items[0].data

  // Legacy seed shape: single row with nested items array
  if (Array.isArray(first.items)) {
    const legacyItems = first.items as Array<{
      institution: string; degree: string; field: string
      startDate: string; endDate?: string | null
    }>
    const now = new Date()
    return legacyItems.map((edu) => {
      if (!edu.endDate) {
        return `- ${edu.degree} in ${edu.field} at ${edu.institution} (${edu.startDate} - Present)`
      }
      const endDate = new Date(edu.endDate)
      const status = endDate <= now ? 'Graduated' : 'Expected'
      return `- ${edu.degree} in ${edu.field} at ${edu.institution} (${status} ${edu.endDate})`
    }).join('\n')
  }

  // Live DB shape: separate rows with { degree, institution, year }
  return items.map((item) => {
    const d = item.data
    const degree = d.degree ?? ''
    const institution = d.institution ?? ''
    const year = d.year ?? ''
    if (d.field) {
      return `- ${degree} in ${d.field} at ${institution} (${year})`
    }
    return `- ${degree} at ${institution} (${year})`
  }).join('\n')
})

formatters.set('contact', ({ items }) => {
  if (items.length === 0) return ''
  const d = items[0].data
  const lines: string[] = []

  if (d.name) lines.push(`Name: ${d.name}`)
  if (d.title || d.subtitle) lines.push(`Title: ${d.title ?? d.subtitle ?? ''}`)
  if (d.email) lines.push(`Email: ${d.email}`)

  // Live shape: flat fields
  if (d.linkedin) lines.push(`LinkedIn: ${d.linkedin}`)
  if (d.github) lines.push(`GitHub: ${d.github}`)

  // Legacy shape: nested social object (only if flat fields absent)
  if (!d.linkedin && !d.github) {
    const social = d.social as Record<string, string> | undefined
    if (social) {
      if (social.linkedin) lines.push(`LinkedIn: ${social.linkedin}`)
      if (social.github) lines.push(`GitHub: ${social.github}`)
      if (social.website) lines.push(`Website: ${social.website}`)
    }
  }

  return lines.join('\n')
})

formatters.set('experience', ({ items }) => {
  if (items.length === 0) return ''
  const first = items[0].data

  // Legacy seed shape: single row with nested items array
  if (Array.isArray(first.items)) {
    const legacyItems = first.items as Array<{
      role: string; company: string; startDate: string; endDate?: string | null
    }>
    return legacyItems.map((exp) => {
      const parts = [`- ${exp.role} at ${exp.company} (${exp.startDate} - ${exp.endDate ?? 'Present'})`]
      if ('description' in exp) parts.push(`  ${(exp as Record<string, unknown>).description}`)
      return parts.join('\n')
    }).join('\n')
  }

  // Live DB shape: separate rows with { year, title, company, duration, description, tech }
  return items.map((item) => {
    const d = item.data
    const role = d.title ?? d.role ?? ''
    const company = d.company ?? ''
    const period = d.duration ?? d.year ?? ''
    const parts = [`- ${role} at ${company} (${period})`]
    if (d.description) parts.push(`  ${d.description}`)
    const tech = Array.isArray(d.tech) ? (d.tech as string[]) : []
    if (tech.length > 0) parts.push(`  Tech: ${tech.join(', ')}`)
    return parts.join('\n')
  }).join('\n')
})

formatters.set('skill', ({ items }) => {
  if (items.length === 0) return ''
  const first = items[0].data

  // Legacy seed shape: single row with nested items array
  if (Array.isArray(first.items)) {
    const legacyItems = first.items as Array<{ name: string; category: string }>
    const byCategory: Record<string, string[]> = {}
    for (const skill of legacyItems) {
      if (!byCategory[skill.category]) byCategory[skill.category] = []
      byCategory[skill.category].push(skill.name)
    }
    return Object.entries(byCategory)
      .map(([cat, names]) => `${cat}: ${names.join(', ')}`)
      .join('\n')
  }

  // Live DB shape: separate rows with { name, context, tier }
  const byTier: Record<string, string[]> = {}
  for (const item of items) {
    const d = item.data
    const tier = String(d.tier ?? d.category ?? 'Other')
    const name = String(d.name ?? '')
    const ctx = d.context ? ` (${d.context})` : ''
    if (!byTier[tier]) byTier[tier] = []
    byTier[tier].push(`${name}${ctx}`)
  }
  return Object.entries(byTier)
    .map(([tier, entries]) => `${tier}: ${entries.join(', ')}`)
    .join('\n')
})

formatters.set('project', ({ items, maxProjects, maxDescLen }) => {
  if (items.length === 0) return ''
  return items
    .slice(0, maxProjects)
    .map((p) => {
      const d = p.data
      const title = String(d.title ?? 'Untitled')

      // Live shape uses descriptions[] array, legacy uses description string
      let description = ''
      if (Array.isArray(d.descriptions) && d.descriptions.length > 0) {
        description = String((d.descriptions as string[])[0])
      } else {
        description = String(d.description ?? '')
      }
      if (description.length > maxDescLen) {
        description = description.slice(0, maxDescLen - 3) + '...'
      }

      const tags = Array.isArray(d.tags) ? (d.tags as string[]).join(', ') : ''
      const techStack = Array.isArray(d.techStack) ? (d.techStack as string[]).join(', ') : ''
      const tagStr = tags || techStack

      // Live shape: links is array of { label, url }
      // Legacy shape: links is object { github, live }
      const linkLabels: string[] = []
      if (Array.isArray(d.links)) {
        for (const link of d.links as Array<{ label: string; url: string }>) {
          linkLabels.push(link.label)
        }
      } else {
        const links = d.links as Record<string, string> | undefined
        if (links?.github) linkLabels.push('GitHub')
        if (links?.live) linkLabels.push('Live')
      }
      const linkSuffix = linkLabels.length > 0 ? ` [${linkLabels.join(', ')}]` : ''

      return `- ${title}: ${description}${tagStr ? ` (${tagStr})` : ''}${linkSuffix}`
    })
    .join('\n')
})

function formatHobbiesItems({ items }: FormatterContext): string {
  if (items.length === 0) return ''
  const first = items[0].data

  // Legacy seed shape: single row with nested items array
  if (Array.isArray(first.items)) {
    const legacyItems = first.items as Array<{ name: string; description?: string }>
    return legacyItems
      .map((h) => (h.description ? `- ${h.name}: ${h.description}` : `- ${h.name}`))
      .join('\n')
  }

  // Live DB shape: separate rows with { name, description }
  return items
    .map((item) => {
      const d = item.data
      const name = d.name ?? ''
      const desc = d.description
      return desc ? `- ${name}: ${desc}` : `- ${name}`
    })
    .join('\n')
}

formatters.set('hobby', formatHobbiesItems)
formatters.set('hobbies', formatHobbiesItems)

formatters.set('link', ({ items }) => {
  if (items.length === 0) return ''
  const d = items[0].data
  const lines: string[] = []
  if (d.github) lines.push(`GitHub: ${d.github}`)
  if (d.linkedin) lines.push(`LinkedIn: ${d.linkedin}`)
  if (d.email) lines.push(`Email: ${d.email}`)
  if (d.resumePath) lines.push(`Resume: ${d.resumePath}`)
  return lines.join('\n')
})

// --- Key aliases (multiple DB types that map to one section) ---

const KEY_ALIASES: Record<string, string> = {
  about: 'bio',
  hobbies: 'hobby',
}

// --- Shared helpers ---

function compareSectionOrder(a: string, b: string): number {
  const ai = SECTION_ORDER.indexOf(a)
  const bi = SECTION_ORDER.indexOf(b)
  if (ai !== -1 && bi !== -1) return ai - bi
  if (ai !== -1) return -1
  if (bi !== -1) return 1
  return a.localeCompare(b)
}

// --- Generic fallback for unknown types ---

function formatGeneric({ items }: FormatterContext): string {
  if (items.length === 0) return ''
  return items
    .map((item) => {
      const d = item.data
      const label = d.title ?? d.name ?? item.slug ?? ''
      const desc = d.description ?? d.content ?? ''
      return desc ? `- ${label}: ${desc}` : `- ${label}`
    })
    .join('\n')
}

// --- Main entry point ---

/**
 * Format a content bundle as a concise markdown summary.
 * Used by both the chat system prompt and the MCP summarize-portfolio prompt.
 *
 * Iterates over actual bundle keys (the DB types), not a hardcoded list.
 * Known types appear first in SECTION_ORDER; unknown types sort alphabetically after.
 */
export function formatBundleAsMarkdown(
  bundle: ContentBundle,
  options: FormatBundleOptions = {}
): string {
  const maxProjects = options.maxProjects ?? DEFAULT_MAX_PROJECTS
  const maxDescLen = options.maxDescriptionLength ?? DEFAULT_MAX_DESCRIPTION_LENGTH

  // Merge aliased keys (e.g. about -> bio, hobbies -> hobby) so we
  // never emit two sections with the same display title.
  const merged: Record<string, ContentWithData[]> = {}
  for (const [key, items] of Object.entries(bundle)) {
    if (!items || items.length === 0) continue
    const canonical = KEY_ALIASES[key] ?? key
    if (!merged[canonical]) merged[canonical] = []
    merged[canonical].push(...items)
  }

  const keys = Object.keys(merged)
  if (keys.length === 0) return ''

  const sorted = keys.sort(compareSectionOrder)

  const sections: string[] = []

  for (const key of sorted) {
    const items = merged[key]
    const ctx: FormatterContext = { items, maxProjects, maxDescLen }
    const formatter = formatters.get(key) ?? formatGeneric
    const content = formatter(ctx)

    if (!content) continue

    const title = SECTION_TITLES[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
    sections.push(`## ${title}\n${content}`)
  }

  return sections.join('\n\n')
}

/**
 * Returns the sorted list of type keys present in a bundle.
 * Useful for telling the LLM which content types are available.
 */
export function bundleTypeNames(bundle: ContentBundle): string[] {
  return Object.keys(bundle).sort(compareSectionOrder)
}
