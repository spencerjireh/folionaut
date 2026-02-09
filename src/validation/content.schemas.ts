import { z } from 'zod'
import { CONTENT_TYPE_PATTERN, contentStatusEnum } from '@/db/schema'

// Slug validation
export const SlugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only')

// Content type (free-form string, lowercase alphanumeric with hyphens)
export const ContentTypeSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(CONTENT_TYPE_PATTERN, 'Type must be lowercase alphanumeric with hyphens only')

// Content status enum
export const ContentStatusSchema = z.enum(contentStatusEnum)

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
  data: z.record(z.unknown()).refine(
    (obj) => Object.keys(obj).length > 0,
    'Data must not be empty'
  ),
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
export type ContentListQuery = z.infer<typeof ContentListQuerySchema>
export type ContentTypeSlugParams = z.infer<typeof ContentTypeSlugParamsSchema>
export type AdminContentListQuery = z.infer<typeof AdminContentListQuerySchema>
export type CreateContentRequest = z.infer<typeof CreateContentRequestSchema>
export type UpdateContentRequest = z.infer<typeof UpdateContentRequestSchema>
export type RestoreVersionRequest = z.infer<typeof RestoreVersionRequestSchema>
export type HistoryQuery = z.infer<typeof HistoryQuerySchema>
export type DeleteQuery = z.infer<typeof DeleteQuerySchema>
export type ContentIdParam = z.infer<typeof ContentIdParamSchema>

// Re-export for backward compatibility
export { parseZodErrors } from './parse-errors'
