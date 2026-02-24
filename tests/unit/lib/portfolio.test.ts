import { describe, it, expect } from 'vitest'
import { formatBundleAsMarkdown, bundleTypeNames } from '@/lib/portfolio'
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
  describe('legacy seed shape (nested data.items[])', () => {
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
  })

  describe('live DB shape (separate rows, flat fields)', () => {
    it('should format bio type with name and blurb', () => {
      const bundle: ContentBundle = {
        bio: [makeItem('bio', {
          name: 'Spencer Jireh',
          lastName: 'Cebrian',
          title: 'Software Engineer',
          blurb: ['Passionate about building things.', 'Loves open source.'],
        })],
      }

      const result = formatBundleAsMarkdown(bundle)

      expect(result).toContain('## About')
      expect(result).toContain('Name: Spencer Jireh Cebrian')
      expect(result).toContain('Title: Software Engineer')
      expect(result).toContain('Passionate about building things. Loves open source.')
    })

    it('should format education as separate rows', () => {
      const bundle: ContentBundle = {
        education: [
          makeItem('education', { degree: 'BS Computer Science', institution: 'Mapua University', year: '2021-2025' }, 'mapua'),
          makeItem('education', { degree: 'MS AI', institution: 'MIT', year: '2025-2027' }, 'mit'),
        ],
      }

      const result = formatBundleAsMarkdown(bundle)

      expect(result).toContain('- BS Computer Science at Mapua University (2021-2025)')
      expect(result).toContain('- MS AI at MIT (2025-2027)')
    })

    it('should format contact with flat fields', () => {
      const bundle: ContentBundle = {
        contact: [makeItem('contact', {
          title: 'Contact',
          subtitle: 'Get in touch',
          email: 'spencer@example.com',
          github: 'https://github.com/spencer',
          linkedin: 'https://linkedin.com/in/spencer',
        })],
      }

      const result = formatBundleAsMarkdown(bundle)

      expect(result).toContain('Email: spencer@example.com')
      expect(result).toContain('GitHub: https://github.com/spencer')
      expect(result).toContain('LinkedIn: https://linkedin.com/in/spencer')
    })

    it('should format experience as separate rows with description and tech', () => {
      const bundle: ContentBundle = {
        experience: [
          makeItem('experience', {
            title: 'Senior Engineer', company: 'Acme Corp',
            duration: '2022-Present', year: '2022',
            description: 'Building scalable APIs',
            tech: ['Python', 'FastAPI', 'PostgreSQL'],
          }, 'acme'),
          makeItem('experience', { title: 'Engineer', company: 'Beta Inc', duration: '2020-2022' }, 'beta'),
        ],
      }

      const result = formatBundleAsMarkdown(bundle)

      expect(result).toContain('- Senior Engineer at Acme Corp (2022-Present)')
      expect(result).toContain('Building scalable APIs')
      expect(result).toContain('Tech: Python, FastAPI, PostgreSQL')
      expect(result).toContain('- Engineer at Beta Inc (2020-2022)')
    })

    it('should format skills grouped by tier with context', () => {
      const bundle: ContentBundle = {
        skill: [
          makeItem('skill', { name: 'TypeScript', tier: 'Language', context: 'Primary language' }, 'ts'),
          makeItem('skill', { name: 'Python', tier: 'Language' }, 'py'),
          makeItem('skill', { name: 'React', tier: 'Framework', context: 'Used with Next.js' }, 'react'),
        ],
      }

      const result = formatBundleAsMarkdown(bundle)

      expect(result).toContain('TypeScript (Primary language)')
      expect(result).toContain('Python')
      expect(result).not.toContain('Python (') // no context = no parens
      expect(result).toContain('React (Used with Next.js)')
    })

    it('should format projects with descriptions array and links array', () => {
      const bundle: ContentBundle = {
        project: [
          makeItem('project', {
            title: 'Folionaut',
            descriptions: ['A headless portfolio CMS', 'Built with Hono'],
            tags: ['typescript'],
            techStack: ['Hono', 'Drizzle'],
            links: [{ label: 'GitHub', url: 'https://github.com/x/folionaut' }],
          }, 'folionaut'),
        ],
      }

      const result = formatBundleAsMarkdown(bundle)

      expect(result).toContain('- Folionaut: A headless portfolio CMS (typescript) [GitHub]')
    })

    it('should format hobby as separate rows', () => {
      const bundle: ContentBundle = {
        hobby: [
          makeItem('hobby', { name: 'Reading', description: 'Fiction and non-fiction' }, 'reading'),
          makeItem('hobby', { name: 'Chess' }, 'chess'),
        ],
      }

      const result = formatBundleAsMarkdown(bundle)

      expect(result).toContain('## Hobbies')
      expect(result).toContain('- Reading: Fiction and non-fiction')
      expect(result).toContain('- Chess')
      expect(result).not.toContain('- Chess:')
    })

    it('should format link type', () => {
      const bundle: ContentBundle = {
        link: [makeItem('link', {
          github: 'https://github.com/spencer',
          linkedin: 'https://linkedin.com/in/spencer',
          email: 'spencer@example.com',
          resumePath: '/resume.pdf',
        })],
      }

      const result = formatBundleAsMarkdown(bundle)

      expect(result).toContain('## Links')
      expect(result).toContain('GitHub: https://github.com/spencer')
      expect(result).toContain('Resume: /resume.pdf')
    })
  })

  describe('empty and partial bundles', () => {
    it('should return empty string for empty bundle', () => {
      const result = formatBundleAsMarkdown({})
      expect(result).toBe('')
    })

    it('should handle partial bundle with only contact -- no fallback placeholders', () => {
      const bundle: ContentBundle = {
        contact: [makeItem('contact', { name: 'Spencer', title: 'Dev', email: 'sp@x.com' })],
      }

      const result = formatBundleAsMarkdown(bundle)

      expect(result).toContain('Name: Spencer')
      // Missing types should NOT appear at all
      expect(result).not.toContain('Experience')
      expect(result).not.toContain('Skills')
      expect(result).not.toContain('Projects')
    })

    it('should skip sections with empty item arrays', () => {
      const bundle: ContentBundle = {
        contact: [makeItem('contact', { name: 'Spencer', title: 'Dev', email: 'sp@x.com' })],
        experience: [],
        skill: [],
      }

      const result = formatBundleAsMarkdown(bundle)

      expect(result).toContain('Name: Spencer')
      expect(result).not.toContain('Experience')
      expect(result).not.toContain('Skills')
    })
  })

  describe('unknown types via generic fallback', () => {
    it('should render unknown type using title/description fields', () => {
      const bundle: ContentBundle = {
        certification: [
          makeItem('certification', { title: 'AWS Solutions Architect', description: 'Associate level' }, 'aws'),
          makeItem('certification', { title: 'GCP Professional', description: 'Cloud Engineer' }, 'gcp'),
        ],
      }

      const result = formatBundleAsMarkdown(bundle)

      expect(result).toContain('## Certification')
      expect(result).toContain('- AWS Solutions Architect: Associate level')
      expect(result).toContain('- GCP Professional: Cloud Engineer')
    })

    it('should render unknown type using name field as fallback label', () => {
      const bundle: ContentBundle = {
        award: [
          makeItem('award', { name: 'Best Paper', description: 'ICSE 2025' }, 'best-paper'),
        ],
      }

      const result = formatBundleAsMarkdown(bundle)

      expect(result).toContain('## Award')
      expect(result).toContain('- Best Paper: ICSE 2025')
    })
  })

  describe('project formatting options', () => {
    it('should handle missing fields gracefully', () => {
      const bundle: ContentBundle = {
        contact: [makeItem('contact', {})],
        project: [makeItem('project', {})],
      }

      const result = formatBundleAsMarkdown(bundle)

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

    it('should not append link indicators when project has no links', () => {
      const bundle: ContentBundle = {
        project: [makeItem('project', { title: 'NoLinks', description: 'A project' })],
      }

      const result = formatBundleAsMarkdown(bundle)

      expect(result).toContain('- NoLinks: A project')
      expect(result).not.toContain('[')
    })

    it('should show both GitHub and Live link indicators when present (legacy links object)', () => {
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

  describe('section ordering', () => {
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

    it('should sort unknown types alphabetically after known types', () => {
      const bundle: ContentBundle = {
        project: [makeItem('project', { title: 'P1', description: 'Desc' })],
        zebra: [makeItem('zebra', { name: 'Z' })],
        alpha: [makeItem('alpha', { name: 'A' })],
      }

      const result = formatBundleAsMarkdown(bundle)

      const projectIndex = result.indexOf('## Projects')
      const alphaIndex = result.indexOf('## Alpha')
      const zebraIndex = result.indexOf('## Zebra')

      expect(projectIndex).toBeLessThan(alphaIndex)
      expect(alphaIndex).toBeLessThan(zebraIndex)
    })
  })

  describe('contact edge cases', () => {
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
  })
})

describe('bundleTypeNames', () => {
  it('should return sorted type names from bundle', () => {
    const bundle: ContentBundle = {
      project: [],
      bio: [],
      experience: [],
      contact: [],
    }

    const result = bundleTypeNames(bundle)

    expect(result).toEqual(['bio', 'contact', 'experience', 'project'])
  })

  it('should place unknown types alphabetically after known types', () => {
    const bundle: ContentBundle = {
      project: [],
      zebra: [],
      bio: [],
      alpha: [],
    }

    const result = bundleTypeNames(bundle)

    expect(result).toEqual(['bio', 'project', 'alpha', 'zebra'])
  })

  it('should return empty array for empty bundle', () => {
    expect(bundleTypeNames({})).toEqual([])
  })
})
