import { z } from 'zod'
import { parseZodErrors } from './parse-errors'
import { contentTypeEnum, contentStatusEnum } from '@/db/schema'
import { ValidationError } from '@/errors/app.error'

// Slug validation
export const SlugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only')

// Content type enum
export const ContentTypeSchema = z.enum(contentTypeEnum)

// Content status enum
export const ContentStatusSchema = z.enum(contentStatusEnum)

// Project data schema
export const ProjectDataSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  content: z.string().optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  links: z
    .object({
      github: z.string().url().optional(),
      live: z.string().url().optional(),
      demo: z.string().url().optional(),
    })
    .optional(),
  coverImage: z.string().url().optional(),
  featured: z.boolean().default(false),
})

// Page data schema
export const PageDataSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  image: z.string().url().optional(),
})

// Skills list data schema
export const SkillsListDataSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        category: z.enum(['language', 'framework', 'tool', 'soft']),
        icon: z.string().max(100).optional(),
        proficiency: z.number().int().min(1).max(5).optional(),
      })
    )
    .max(100),
})

// Experience list data schema
export const ExperienceListDataSchema = z.object({
  items: z
    .array(
      z.object({
        company: z.string().min(1).max(200),
        role: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        startDate: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM'),
        endDate: z
          .string()
          .regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM')
          .nullable(),
        location: z.string().max(100).optional(),
        type: z.enum(['full-time', 'part-time', 'contract', 'freelance']).optional(),
        skills: z.array(z.string().max(50)).max(20).default([]),
      })
    )
    .max(50),
})

// Education list data schema
export const EducationListDataSchema = z.object({
  items: z
    .array(
      z.object({
        institution: z.string().min(1).max(200),
        degree: z.string().min(1).max(200),
        field: z.string().max(200).optional(),
        startDate: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM'),
        endDate: z
          .string()
          .regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM')
          .nullable(),
        location: z.string().max(100).optional(),
        gpa: z.string().max(20).optional(),
        highlights: z.array(z.string().max(200)).max(10).optional(),
      })
    )
    .max(20),
})

// Site config data schema
export const SiteConfigDataSchema = z.object({
  name: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  email: z.string().email(),
  social: z.record(z.string().url()),
  chatEnabled: z.boolean().default(true),
  chatSystemPrompt: z.string().max(2000).optional(),
})

// Query schema for listing content (public)
export const ContentListQuerySchema = z.object({
  type: ContentTypeSchema.optional(),
  status: ContentStatusSchema.optional().default('published'),
})

// Admin-specific schemas
export const AdminContentListQuerySchema = z.object({
  type: ContentTypeSchema.optional(),
  status: ContentStatusSchema.optional(),
  includeDeleted: z.coerce.boolean().default(false),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const CreateContentRequestSchema = z.object({
  type: ContentTypeSchema,
  slug: SlugSchema.optional(), // auto-generated from data.title if not provided
  data: z.record(z.unknown()),
  status: ContentStatusSchema.default('draft'),
  sortOrder: z.number().int().default(0),
})

export const UpdateContentRequestSchema = z.object({
  slug: SlugSchema.optional(),
  data: z.record(z.unknown()).optional(),
  status: ContentStatusSchema.optional(),
  sortOrder: z.number().int().optional(),
})

export const RestoreVersionRequestSchema = z.object({
  version: z.number().int().min(1),
})

export const HistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const DeleteQuerySchema = z.object({
  hard: z.coerce.boolean().default(false),
})

export const ContentIdParamSchema = z.object({
  id: z.string().startsWith('content_'),
})

// Route params schema for type and slug
export const ContentTypeSlugParamsSchema = z.object({
  type: ContentTypeSchema,
  slug: SlugSchema,
})

// Type exports
export type ProjectData = z.infer<typeof ProjectDataSchema>
export type PageData = z.infer<typeof PageDataSchema>
export type SkillsListData = z.infer<typeof SkillsListDataSchema>
export type ExperienceListData = z.infer<typeof ExperienceListDataSchema>
export type EducationListData = z.infer<typeof EducationListDataSchema>
export type SiteConfigData = z.infer<typeof SiteConfigDataSchema>
export type ContentListQuery = z.infer<typeof ContentListQuerySchema>
export type ContentTypeSlugParams = z.infer<typeof ContentTypeSlugParamsSchema>
export type AdminContentListQuery = z.infer<typeof AdminContentListQuerySchema>
export type CreateContentRequest = z.infer<typeof CreateContentRequestSchema>
export type UpdateContentRequest = z.infer<typeof UpdateContentRequestSchema>
export type RestoreVersionRequest = z.infer<typeof RestoreVersionRequestSchema>
export type HistoryQuery = z.infer<typeof HistoryQuerySchema>
export type DeleteQuery = z.infer<typeof DeleteQuerySchema>
export type ContentIdParam = z.infer<typeof ContentIdParamSchema>

// Map content types to their data schemas
const contentDataSchemas: Record<string, z.ZodSchema> = {
  project: ProjectDataSchema,
  experience: ExperienceListDataSchema,
  education: EducationListDataSchema,
  skill: SkillsListDataSchema,
  about: PageDataSchema,
  contact: SiteConfigDataSchema,
}

/**
 * Validates data against the schema for a specific content type.
 * Throws ValidationError if data does not match the expected schema.
 */
export function validateContentData(
  type: (typeof contentTypeEnum)[number],
  data: Record<string, unknown>
): Record<string, unknown> {
  const schema = contentDataSchemas[type]
  if (!schema) {
    throw new Error(`No schema defined for content type: ${type}`)
  }

  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ValidationError('Invalid content data', parseZodErrors(result.error))
  }

  return result.data as Record<string, unknown>
}

// Re-export for backward compatibility
export { parseZodErrors } from './parse-errors'
