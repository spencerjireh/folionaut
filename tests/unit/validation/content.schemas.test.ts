import {
  SlugSchema,
  ContentTypeSchema,
  ContentStatusSchema,
  ContentListQuerySchema,
  AdminContentListQuerySchema,
  CreateContentRequestSchema,
  UpdateContentRequestSchema,
  ContentIdParamSchema,
  ContentTypeSlugParamsSchema,
  HistoryQuerySchema,
  DeleteQuerySchema,
  RestoreVersionRequestSchema,
} from '@/validation/content.schemas'
import { parseZodErrors } from '@/validation/parse-errors'

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
    it('should accept standard content types', () => {
      expect(ContentTypeSchema.parse('project')).toBe('project')
      expect(ContentTypeSchema.parse('experience')).toBe('experience')
      expect(ContentTypeSchema.parse('education')).toBe('education')
      expect(ContentTypeSchema.parse('skill')).toBe('skill')
      expect(ContentTypeSchema.parse('about')).toBe('about')
      expect(ContentTypeSchema.parse('contact')).toBe('contact')
    })

    it('should accept custom content types', () => {
      expect(ContentTypeSchema.parse('blog-post')).toBe('blog-post')
      expect(ContentTypeSchema.parse('certification')).toBe('certification')
      expect(ContentTypeSchema.parse('testimonial')).toBe('testimonial')
    })

    it('should reject uppercase characters', () => {
      expect(() => ContentTypeSchema.parse('INVALID')).toThrow()
      expect(() => ContentTypeSchema.parse('Blog')).toThrow()
    })

    it('should reject special characters', () => {
      expect(() => ContentTypeSchema.parse('invalid_type')).toThrow()
      expect(() => ContentTypeSchema.parse('invalid type')).toThrow()
      expect(() => ContentTypeSchema.parse('invalid!')).toThrow()
    })

    it('should reject empty string', () => {
      expect(() => ContentTypeSchema.parse('')).toThrow()
    })

    it('should reject types over 100 characters', () => {
      expect(() => ContentTypeSchema.parse('a'.repeat(101))).toThrow()
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

  describe('ContentListQuerySchema', () => {
    it('should accept empty query', () => {
      const result = ContentListQuerySchema.parse({})
      expect(result.status).toBe('published')
    })

    it('should accept valid type filter', () => {
      const result = ContentListQuerySchema.parse({ type: 'project' })
      expect(result.type).toBe('project')
    })

    it('should accept custom type filter', () => {
      const result = ContentListQuerySchema.parse({ type: 'blog-post' })
      expect(result.type).toBe('blog-post')
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

    it('should accept custom content type', () => {
      const data = {
        type: 'blog-post',
        slug: 'my-first-post',
        data: { title: 'Hello World', body: 'Content here' },
      }
      const result = CreateContentRequestSchema.parse(data)

      expect(result.type).toBe('blog-post')
    })

    it('should reject empty data object', () => {
      expect(() =>
        CreateContentRequestSchema.parse({
          type: 'project',
          slug: 'test',
          data: {},
        })
      ).toThrow()
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

    it('should accept custom type', () => {
      const result = ContentTypeSlugParamsSchema.parse({
        type: 'blog-post',
        slug: 'my-post',
      })

      expect(result.type).toBe('blog-post')
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

  describe('parseZodErrors', () => {
    it('should convert Zod errors to field map', () => {
      const result = SlugSchema.safeParse('')
      expect(result.success).toBe(false)
      if (!result.success) {
        const fields = parseZodErrors(result.error)
        expect(fields).toHaveProperty('_root')
      }
    })

    it('should use _root for root-level errors', () => {
      const result = SlugSchema.safeParse('')
      expect(result.success).toBe(false)
      if (!result.success) {
        const fields = parseZodErrors(result.error)
        expect(fields).toHaveProperty('_root')
      }
    })
  })
})
