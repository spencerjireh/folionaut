import type { ContentBundle } from '@/db/models'

const DEFAULT_MAX_PROJECTS = 10
const DEFAULT_MAX_DESCRIPTION_LENGTH = 120

export interface FormatBundleOptions {
  maxProjects?: number
  maxDescriptionLength?: number
}

/**
 * Format a content bundle as a concise markdown summary.
 * Used by both the chat system prompt and the MCP summarize-portfolio prompt.
 */
export function formatBundleAsMarkdown(
  bundle: ContentBundle,
  options: FormatBundleOptions = {}
): string {
  const maxProjects = options.maxProjects ?? DEFAULT_MAX_PROJECTS
  const maxDescLen = options.maxDescriptionLength ?? DEFAULT_MAX_DESCRIPTION_LENGTH

  const aboutSummary = formatAbout(bundle['about'] ?? [])
  const educationSummary = formatEducation(bundle['education'] ?? [])
  const contactInfo = formatContact(bundle['contact'] ?? [])
  const experienceSummary = formatExperience(bundle['experience'] ?? [])
  const skillsSummary = formatSkills(bundle['skill'] ?? [])
  const projectsSummary = formatProjects(bundle['project'] ?? [], maxProjects, maxDescLen)
  const hobbiesSummary = formatHobbies(bundle['hobbies'] ?? [])

  return `## About
${aboutSummary || 'No about data'}

## Education
${educationSummary || 'No education data'}

## Contact
${contactInfo || 'No contact data'}

## Experience
${experienceSummary || 'No experience data'}

## Skills
${skillsSummary || 'No skills data'}

## Projects
${projectsSummary || 'No projects'}

## Hobbies
${hobbiesSummary || 'No hobbies data'}`
}

function formatAbout(aboutItems: ContentBundle[string]): string {
  if (aboutItems.length === 0) return ''
  const d = aboutItems[0].data
  return String(d.content ?? '')
}

function formatEducation(educationItems: ContentBundle[string]): string {
  if (educationItems.length === 0) return ''
  const d = educationItems[0].data
  const items = (d.items ?? []) as Array<{
    institution: string
    degree: string
    field: string
    startDate: string
    endDate?: string | null
  }>
  const now = new Date()
  return items
    .map((edu) => {
      if (!edu.endDate) {
        return `- ${edu.degree} in ${edu.field} at ${edu.institution} (${edu.startDate} - Present)`
      }
      const endDate = new Date(edu.endDate)
      const status = endDate <= now ? 'Graduated' : 'Expected'
      return `- ${edu.degree} in ${edu.field} at ${edu.institution} (${status} ${edu.endDate})`
    })
    .join('\n')
}

function formatContact(contacts: ContentBundle[string]): string {
  if (contacts.length === 0) return ''
  const d = contacts[0].data
  const lines = [
    `Name: ${d.name ?? ''}`,
    `Title: ${d.title ?? ''}`,
    `Email: ${d.email ?? ''}`,
  ]
  const social = d.social as Record<string, string> | undefined
  if (social) {
    if (social.linkedin) lines.push(`LinkedIn: ${social.linkedin}`)
    if (social.github) lines.push(`GitHub: ${social.github}`)
    if (social.website) lines.push(`Website: ${social.website}`)
  }
  return lines.join('\n')
}

function formatExperience(experiences: ContentBundle[string]): string {
  if (experiences.length === 0) return ''
  const d = experiences[0].data
  const items = (d.items ?? []) as Array<{
    role: string
    company: string
    startDate: string
    endDate?: string | null
  }>
  return items
    .map((exp) => `- ${exp.role} at ${exp.company} (${exp.startDate} - ${exp.endDate ?? 'Present'})`)
    .join('\n')
}

function formatSkills(skills: ContentBundle[string]): string {
  if (skills.length === 0) return ''
  const d = skills[0].data
  const items = (d.items ?? []) as Array<{ name: string; category: string }>
  const byCategory: Record<string, string[]> = {}
  for (const skill of items) {
    if (!byCategory[skill.category]) byCategory[skill.category] = []
    byCategory[skill.category].push(skill.name)
  }
  return Object.entries(byCategory)
    .map(([cat, names]) => `${cat}: ${names.join(', ')}`)
    .join('\n')
}

function formatHobbies(hobbiesItems: ContentBundle[string]): string {
  if (hobbiesItems.length === 0) return ''
  const d = hobbiesItems[0].data
  const items = (d.items ?? []) as Array<{ name: string; description?: string }>
  return items
    .map((h) => (h.description ? `- ${h.name}: ${h.description}` : `- ${h.name}`))
    .join('\n')
}

function formatProjects(
  projects: ContentBundle[string],
  maxProjects: number,
  maxDescLen: number
): string {
  if (projects.length === 0) return ''
  return projects
    .slice(0, maxProjects)
    .map((p) => {
      const d = p.data
      const title = String(d.title ?? 'Untitled')
      let description = String(d.description ?? '')
      if (description.length > maxDescLen) {
        description = description.slice(0, maxDescLen - 3) + '...'
      }
      const tags = Array.isArray(d.tags) ? (d.tags as string[]).join(', ') : ''
      const links = d.links as Record<string, string> | undefined
      const linkLabels: string[] = []
      if (links?.github) linkLabels.push('GitHub')
      if (links?.live) linkLabels.push('Live')
      const linkSuffix = linkLabels.length > 0 ? ` [${linkLabels.join(', ')}]` : ''
      return `- ${title}: ${description}${tags ? ` (${tags})` : ''}${linkSuffix}`
    })
    .join('\n')
}
