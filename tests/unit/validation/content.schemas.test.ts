import {
  SlugSchema,
  ContentTypeSchema,
  ContentStatusSchema,
  ProjectDataSchema,
  PageDataSchema,
  SkillsListDataSchema,
  ExperienceListDataSchema,
  ContentListQuerySchema,
  AdminContentListQuerySchema,
  CreateContentRequestSchema,
  UpdateContentRequestSchema,
  ContentIdParamSchema,
  ContentTypeSlugParamsSchema,
  HistoryQuerySchema,
  DeleteQuerySchema,
  RestoreVersionRequestSchema,
  validateContentData,
} from '@/validation/content.schemas'
import { parseZodErrors } from '@/validation/parse-errors'
import { ValidationError } from '@/errors/app.error'
import { ZodError } from 'zod'

describe('Content Validation Schemas', () => {
  describe('SlugSchema', () => {
    it('should accept valid slugs', () => {
      expect(SlugSchema.parse('hello-world')).toBe('hello-world')
      expect(SlugSchema.parse('project-123')).toBe('project-123')
      expect(SlugSchema.parse('a')).toBe('a')
    })

    it('should reject empty strings', () => {
      expect(() => SlugSchema.parse('')).toThrow()
    })

    it('should reject slugs with uppercase', () => {
      expect(() => SlugSchema.parse('Hello-World')).toThrow()
    })

    it('should reject slugs with special characters', () => {
      expect(() => SlugSchema.parse('hello_world')).toThrow()
      expect(() => SlugSchema.parse('hello world')).toThrow()
    })

    it('should reject slugs over 100 characters', () => {
      expect(() => SlugSchema.parse('a'.repeat(101))).toThrow()
    })
  })

  describe('ContentTypeSchema', () => {
    it('should accept valid content types', () => {
      expect(ContentTypeSchema.parse('project')).toBe('project')
      expect(ContentTypeSchema.parse('experience')).toBe('experience')
      expect(ContentTypeSchema.parse('education')).toBe('education')
      expect(ContentTypeSchema.parse('skill')).toBe('skill')
      expect(ContentTypeSchema.parse('about')).toBe('about')
      expect(ContentTypeSchema.parse('contact')).toBe('contact')
    })

    it('should reject invalid content types', () => {
      expect(() => ContentTypeSchema.parse('invalid')).toThrow()
    })
  })

  describe('ContentStatusSchema', () => {
    it('should accept valid statuses', () => {
      expect(ContentStatusSchema.parse('draft')).toBe('draft')
      expect(ContentStatusSchema.parse('published')).toBe('published')
      expect(ContentStatusSchema.parse('archived')).toBe('archived')
    })

    it('should reject invalid statuses', () => {
      expect(() => ContentStatusSchema.parse('pending')).toThrow()
    })
  })

  describe('ProjectDataSchema', () => {
    it('should validate valid project data', () => {
      const data = {
        title: 'My Project',
        description: 'A project description',
      }
      expect(() => ProjectDataSchema.parse(data)).not.toThrow()
    })

    it('should validate project with all fields', () => {
      const data = {
        title: 'My Project',
        description: 'A project description',
        content: 'Full content here',
        tags: ['typescript', 'node'],
        links: {
          github: 'https://github.com/user/repo',
          live: 'https://example.com',
        },
        coverImage: 'https://example.com/image.png',
        featured: true,
      }
      expect(() => ProjectDataSchema.parse(data)).not.toThrow()
    })

    it('should reject project without title', () => {
      expect(() => ProjectDataSchema.parse({ description: 'desc' })).toThrow()
    })

    it('should reject project without description', () => {
      expect(() => ProjectDataSchema.parse({ title: 'title' })).toThrow()
    })

    it('should reject invalid URLs in links', () => {
      expect(() =>
        ProjectDataSchema.parse({
          title: 'title',
          description: 'desc',
          links: { github: 'not-a-url' },
        })
      ).toThrow()
    })
  })

  describe('PageDataSchema', () => {
    it('should validate valid page data', () => {
      const data = {
        title: 'About Me',
        content: 'Content here',
      }
      expect(() => PageDataSchema.parse(data)).not.toThrow()
    })

    it('should accept optional image', () => {
      const data = {
        title: 'About',
        content: 'Content',
        image: 'https://example.com/image.png',
      }
      expect(() => PageDataSchema.parse(data)).not.toThrow()
    })
  })

  describe('SkillsListDataSchema', () => {
    it('should validate valid skills data', () => {
      const data = {
        items: [
          { name: 'TypeScript', category: 'language', proficiency: 5 },
          { name: 'React', category: 'framework' },
        ],
      }
      expect(() => SkillsListDataSchema.parse(data)).not.toThrow()
    })

    it('should reject invalid category', () => {
      expect(() =>
        SkillsListDataSchema.parse({
          items: [{ name: 'Test', category: 'invalid' }],
        })
      ).toThrow()
    })

    it('should reject proficiency out of range', () => {
      expect(() =>
        SkillsListDataSchema.parse({
          items: [{ name: 'Test', category: 'language', proficiency: 6 }],
        })
      ).toThrow()
    })
  })

  describe('ExperienceListDataSchema', () => {
    it('should validate valid experience data', () => {
      const data = {
        items: [
          {
            company: 'Test Corp',
            role: 'Developer',
            startDate: '2020-01',
            endDate: '2023-12',
          },
        ],
      }
      expect(() => ExperienceListDataSchema.parse(data)).not.toThrow()
    })

    it('should accept null endDate (current job)', () => {
      const data = {
        items: [
          {
            company: 'Test Corp',
            role: 'Developer',
            startDate: '2020-01',
            endDate: null,
          },
        ],
      }
      expect(() => ExperienceListDataSchema.parse(data)).not.toThrow()
    })

    it('should reject invalid date format', () => {
      expect(() =>
        ExperienceListDataSchema.parse({
          items: [
            {
              company: 'Test',
              role: 'Dev',
              startDate: '2020/01/01',
              endDate: null,
            },
          ],
        })
      ).toThrow()
    })
  })

  describe('ContentListQuerySchema', () => {
    it('should accept empty query', () => {
      const result = ContentListQuerySchema.parse({})
      expect(result.status).toBe('published')
    })

    it('should accept valid type filter', () => {
      const result = ContentListQuerySchema.parse({ type: 'project' })
      expect(result.type).toBe('project')
    })
  })

  describe('AdminContentListQuerySchema', () => {
    it('should provide defaults', () => {
      const result = AdminContentListQuerySchema.parse({})

      expect(result.includeDeleted).toBe(false)
      expect(result.limit).toBe(50)
      expect(result.offset).toBe(0)
    })

    it('should accept all filters', () => {
      const result = AdminContentListQuerySchema.parse({
        type: 'project',
        status: 'draft',
        includeDeleted: 'true',
        limit: '10',
        offset: '5',
      })

      expect(result.type).toBe('project')
      expect(result.status).toBe('draft')
      expect(result.includeDeleted).toBe(true)
      expect(result.limit).toBe(10)
      expect(result.offset).toBe(5)
    })
  })

  describe('CreateContentRequestSchema', () => {
    it('should validate minimal create request', () => {
      const data = {
        type: 'project',
        data: { title: 'Test', description: 'Desc' },
      }
      const result = CreateContentRequestSchema.parse(data)

      expect(result.type).toBe('project')
      expect(result.status).toBe('draft')
      expect(result.sortOrder).toBe(0)
    })

    it('should accept optional slug', () => {
      const data = {
        type: 'project',
        slug: 'my-project',
        data: { title: 'Test', description: 'Desc' },
      }
      const result = CreateContentRequestSchema.parse(data)

      expect(result.slug).toBe('my-project')
    })
  })

  describe('UpdateContentRequestSchema', () => {
    it('should accept empty update (no changes)', () => {
      expect(() => UpdateContentRequestSchema.parse({})).not.toThrow()
    })

    it('should accept partial updates', () => {
      const result = UpdateContentRequestSchema.parse({
        status: 'published',
      })

      expect(result.status).toBe('published')
      expect(result.slug).toBeUndefined()
    })
  })

  describe('ContentIdParamSchema', () => {
    it('should accept valid content IDs', () => {
      const result = ContentIdParamSchema.parse({ id: 'content_abc123' })
      expect(result.id).toBe('content_abc123')
    })

    it('should reject IDs without prefix', () => {
      expect(() => ContentIdParamSchema.parse({ id: 'abc123' })).toThrow()
    })
  })

  describe('ContentTypeSlugParamsSchema', () => {
    it('should validate type and slug params', () => {
      const result = ContentTypeSlugParamsSchema.parse({
        type: 'project',
        slug: 'my-project',
      })

      expect(result.type).toBe('project')
      expect(result.slug).toBe('my-project')
    })
  })

  describe('HistoryQuerySchema', () => {
    it('should provide defaults', () => {
      const result = HistoryQuerySchema.parse({})

      expect(result.limit).toBe(50)
      expect(result.offset).toBe(0)
    })
  })

  describe('DeleteQuerySchema', () => {
    it('should default hard to false', () => {
      const result = DeleteQuerySchema.parse({})
      expect(result.hard).toBe(false)
    })

    it('should parse hard=true', () => {
      const result = DeleteQuerySchema.parse({ hard: 'true' })
      expect(result.hard).toBe(true)
    })
  })

  describe('RestoreVersionRequestSchema', () => {
    it('should validate version number', () => {
      const result = RestoreVersionRequestSchema.parse({ version: 2 })
      expect(result.version).toBe(2)
    })

    it('should reject version 0', () => {
      expect(() => RestoreVersionRequestSchema.parse({ version: 0 })).toThrow()
    })
  })

  describe('validateContentData', () => {
    it('should validate project data', () => {
      const data = { title: 'Test', description: 'Desc' }
      const result = validateContentData('project', data)

      expect(result).toHaveProperty('title', 'Test')
    })

    it('should throw ValidationError for invalid data', () => {
      const data = { title: '' } // Missing description
      expect(() => validateContentData('project', data)).toThrow(ValidationError)

      try {
        validateContentData('project', data)
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError)
        expect((error as ValidationError).fields).toBeDefined()
      }
    })

    it('should throw for unknown content type', () => {
      expect(() =>
        validateContentData('unknown' as 'project', { title: 'Test' })
      ).toThrow('No schema defined for content type: unknown')
    })
  })

  describe('parseZodErrors', () => {
    it('should convert Zod errors to field map', () => {
      try {
        ProjectDataSchema.parse({ title: '' })
      } catch (error) {
        const fields = parseZodErrors(error as ZodError)
        expect(fields).toHaveProperty('title')
        expect(fields).toHaveProperty('description')
      }
    })

    it('should handle nested path errors', () => {
      try {
        ProjectDataSchema.parse({
          title: 'Test',
          description: 'Desc',
          links: { github: 'not-a-url' },
        })
      } catch (error) {
        const fields = parseZodErrors(error as ZodError)
        // Path is joined with dots, so check for the key directly
        expect('links.github' in fields).toBe(true)
      }
    })

    it('should use _root for root-level errors', () => {
      try {
        SlugSchema.parse('')
      } catch (error) {
        const fields = parseZodErrors(error as ZodError)
        expect(fields).toHaveProperty('_root')
      }
    })
  })
})
