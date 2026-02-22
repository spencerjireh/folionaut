import { describe, it, expect } from 'vitest'
import { formatBundleAsMarkdown } from '@/lib/portfolio'
import type { ContentBundle } from '@/db/models'

function makeItem(type: string, data: Record<string, unknown>, slug = 'test') {
  return {
    id: 'cnt_1',
    slug,
    type,
    data,
    status: 'published' as const,
    version: 1,
    sortOrder: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    deletedAt: null,
  }
}

describe('formatBundleAsMarkdown', () => {
  it('should format a full bundle correctly', () => {
    const bundle: ContentBundle = {
      about: [makeItem('about', { title: 'About Spencer', content: 'Spencer is a software engineer.' })],
      education: [makeItem('education', {
        items: [
          { institution: 'Mapua University', degree: 'BS', field: 'Computer Science', startDate: '2021-08', endDate: '2025-05' },
        ],
      })],
      contact: [makeItem('contact', {
        name: 'Spencer', title: 'Engineer', email: 'sp@test.com',
        social: { linkedin: 'https://linkedin.com/in/spencer', github: 'https://github.com/spencer' },
      })],
      experience: [makeItem('experience', {
        items: [
          { role: 'Senior Engineer', company: 'Acme', startDate: '2022-01', endDate: null },
          { role: 'Engineer', company: 'Beta', startDate: '2020-01', endDate: '2022-01' },
        ],
      })],
      skill: [makeItem('skill', {
        items: [
          { name: 'TypeScript', category: 'Language' },
          { name: 'Python', category: 'Language' },
          { name: 'React', category: 'Framework' },
        ],
      })],
      project: [
        makeItem('project', { title: 'Folionaut', description: 'Portfolio CMS', tags: ['ts', 'hono'], links: { github: 'https://github.com/x/folionaut' } }, 'folionaut'),
        makeItem('project', { title: 'ChatApp', description: 'Real-time chat' }, 'chatapp'),
      ],
      hobbies: [makeItem('hobbies', {
        items: [
          { name: 'Reading', description: 'Fiction and non-fiction' },
          { name: 'Chess', description: 'Plays casually online' },
        ],
      })],
    }

    const result = formatBundleAsMarkdown(bundle)

    expect(result).toContain('Spencer is a software engineer.')
    expect(result).toContain('BS in Computer Science at Mapua University (Graduated 2025-05)')
    expect(result).toContain('Name: Spencer')
    expect(result).toContain('Title: Engineer')
    expect(result).toContain('Email: sp@test.com')
    expect(result).toContain('LinkedIn: https://linkedin.com/in/spencer')
    expect(result).toContain('GitHub: https://github.com/spencer')
    expect(result).toContain('Senior Engineer at Acme (2022-01 - Present)')
    expect(result).toContain('Engineer at Beta (2020-01 - 2022-01)')
    expect(result).toContain('Language: TypeScript, Python')
    expect(result).toContain('Framework: React')
    expect(result).toContain('- Folionaut: Portfolio CMS (ts, hono) [GitHub]')
    expect(result).toContain('- ChatApp: Real-time chat')
    expect(result).toContain('- Reading: Fiction and non-fiction')
    expect(result).toContain('- Chess: Plays casually online')
  })

  it('should return fallbacks for empty bundle', () => {
    const result = formatBundleAsMarkdown({})

    expect(result).toContain('No about data')
    expect(result).toContain('No education data')
    expect(result).toContain('No contact data')
    expect(result).toContain('No experience data')
    expect(result).toContain('No skills data')
    expect(result).toContain('No projects')
    expect(result).toContain('No hobbies data')
  })

  it('should handle partial bundle with only contact', () => {
    const bundle: ContentBundle = {
      contact: [makeItem('contact', { name: 'Spencer', title: 'Dev', email: 'sp@x.com' })],
    }

    const result = formatBundleAsMarkdown(bundle)

    expect(result).toContain('Name: Spencer')
    expect(result).toContain('No experience data')
    expect(result).toContain('No skills data')
    expect(result).toContain('No projects')
  })

  it('should handle missing fields gracefully', () => {
    const bundle: ContentBundle = {
      contact: [makeItem('contact', {})],
      experience: [makeItem('experience', {})],
      skill: [makeItem('skill', {})],
      project: [makeItem('project', {})],
    }

    const result = formatBundleAsMarkdown(bundle)

    expect(result).toContain('Name: ')
    expect(result).toContain('- Untitled: ')
  })

  it('should truncate long project descriptions', () => {
    const longDesc = 'A'.repeat(200)
    const bundle: ContentBundle = {
      project: [makeItem('project', { title: 'Big', description: longDesc })],
    }

    const result = formatBundleAsMarkdown(bundle, { maxDescriptionLength: 50 })

    expect(result).toContain('Big: ' + 'A'.repeat(47) + '...')
    expect(result).not.toContain('A'.repeat(200))
  })

  it('should cap the number of projects', () => {
    const projects = Array.from({ length: 15 }, (_, i) =>
      makeItem('project', { title: `Project ${i}`, description: `Desc ${i}` }, `project-${i}`)
    )
    const bundle: ContentBundle = { project: projects }

    const result = formatBundleAsMarkdown(bundle, { maxProjects: 3 })

    expect(result).toContain('Project 0')
    expect(result).toContain('Project 2')
    expect(result).not.toContain('Project 3')
    expect(result).not.toContain('Project 14')
  })

  it('should not truncate descriptions within the limit', () => {
    const bundle: ContentBundle = {
      project: [makeItem('project', { title: 'Small', description: 'Short desc' })],
    }

    const result = formatBundleAsMarkdown(bundle, { maxDescriptionLength: 120 })

    expect(result).toContain('Small: Short desc')
    expect(result).not.toContain('...')
  })

  it('should format education with multiple entries', () => {
    const bundle: ContentBundle = {
      education: [makeItem('education', {
        items: [
          { institution: 'MIT', degree: 'MS', field: 'AI', startDate: '2025-09', endDate: null },
          { institution: 'Mapua', degree: 'BS', field: 'CS', startDate: '2021-08', endDate: '2025-05' },
        ],
      })],
    }

    const result = formatBundleAsMarkdown(bundle)

    expect(result).toContain('- MS in AI at MIT (2025-09 - Present)')
    expect(result).toContain('- BS in CS at Mapua (Graduated 2025-05)')
  })

  it('should format about section from content field', () => {
    const bundle: ContentBundle = {
      about: [makeItem('about', { title: 'About Me', content: 'Full-stack engineer with 5 years experience.' })],
    }

    const result = formatBundleAsMarkdown(bundle)

    expect(result).toContain('## About')
    expect(result).toContain('Full-stack engineer with 5 years experience.')
  })

  it('should format hobbies section with names and descriptions', () => {
    const bundle: ContentBundle = {
      hobbies: [makeItem('hobbies', {
        items: [
          { name: 'Reading', description: 'Fiction and non-fiction' },
          { name: 'Chess' },
          { name: 'Music production', description: 'Lo-fi beats' },
        ],
      })],
    }

    const result = formatBundleAsMarkdown(bundle)

    expect(result).toContain('## Hobbies')
    expect(result).toContain('- Reading: Fiction and non-fiction')
    expect(result).toContain('- Chess')
    expect(result).not.toContain('- Chess:')
    expect(result).toContain('- Music production: Lo-fi beats')
  })

  it('should place About and Education before Contact', () => {
    const bundle: ContentBundle = {
      about: [makeItem('about', { content: 'Bio text' })],
      education: [makeItem('education', { items: [{ institution: 'U', degree: 'BS', field: 'CS', startDate: '2021', endDate: null }] })],
      contact: [makeItem('contact', { name: 'Spencer', title: 'Dev', email: 'sp@x.com' })],
    }

    const result = formatBundleAsMarkdown(bundle)

    const aboutIndex = result.indexOf('## About')
    const educationIndex = result.indexOf('## Education')
    const contactIndex = result.indexOf('## Contact')

    expect(aboutIndex).toBeLessThan(educationIndex)
    expect(educationIndex).toBeLessThan(contactIndex)
  })

  it('should not append social lines when contact has no social data', () => {
    const bundle: ContentBundle = {
      contact: [makeItem('contact', { name: 'Spencer', title: 'Dev', email: 'sp@x.com' })],
    }

    const result = formatBundleAsMarkdown(bundle)

    expect(result).toContain('Name: Spencer')
    expect(result).not.toContain('LinkedIn:')
    expect(result).not.toContain('GitHub:')
    expect(result).not.toContain('Website:')
  })

  it('should not append link indicators when project has no links', () => {
    const bundle: ContentBundle = {
      project: [makeItem('project', { title: 'NoLinks', description: 'A project' })],
    }

    const result = formatBundleAsMarkdown(bundle)

    expect(result).toContain('- NoLinks: A project')
    expect(result).not.toContain('[')
  })

  it('should show both GitHub and Live link indicators when present', () => {
    const bundle: ContentBundle = {
      project: [makeItem('project', {
        title: 'Both',
        description: 'Has both',
        links: { github: 'https://github.com/x', live: 'https://example.com' },
      })],
    }

    const result = formatBundleAsMarkdown(bundle)

    expect(result).toContain('[GitHub, Live]')
  })
})
