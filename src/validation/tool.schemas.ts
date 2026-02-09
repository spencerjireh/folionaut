import { z } from 'zod'
import { contentTypeEnum, contentStatusEnum } from '@/db/schema'

// Content type and status schemas using existing enums
export const ContentTypeSchema = z.enum(contentTypeEnum)
export const ContentStatusSchema = z.enum(contentStatusEnum)

// Generic tool input schemas
export const ListContentInputSchema = z.object({
  type: ContentTypeSchema.describe('Content type to list'),
  status: ContentStatusSchema.default('published').describe('Filter by status'),
  limit: z.number().min(1).max(100).default(50).describe('Maximum items to return'),
})

export const GetContentInputSchema = z.object({
  type: ContentTypeSchema.describe('Content type'),
  slug: z.string().describe('Content slug identifier'),
})

export const SearchContentInputSchema = z.object({
  query: z.string().describe('Search query'),
  type: ContentTypeSchema.optional().describe('Filter by content type'),
  limit: z.number().min(1).max(50).default(10).describe('Maximum items to return'),
})

// Write tool schemas
export const CreateContentInputSchema = z.object({
  type: ContentTypeSchema.describe('Content type to create'),
  slug: z.string().optional().describe('URL-friendly slug (auto-generated if not provided)'),
  data: z.record(z.unknown()).describe('Content data matching the type schema'),
  status: ContentStatusSchema.default('draft').describe('Initial status'),
  sortOrder: z.number().default(0).describe('Sort order for display'),
})

export const UpdateContentInputSchema = z.object({
  id: z.string().describe('Content ID to update'),
  slug: z.string().optional().describe('New slug'),
  data: z.record(z.unknown()).optional().describe('Updated content data'),
  status: ContentStatusSchema.optional().describe('New status'),
  sortOrder: z.number().optional().describe('New sort order'),
})

export const DeleteContentInputSchema = z.object({
  id: z.string().describe('Content ID to delete'),
})

// Type exports
export type ListContentInput = z.infer<typeof ListContentInputSchema>
export type GetContentInput = z.infer<typeof GetContentInputSchema>
export type SearchContentInput = z.infer<typeof SearchContentInputSchema>
export type CreateContentInput = z.infer<typeof CreateContentInputSchema>
export type UpdateContentInput = z.infer<typeof UpdateContentInputSchema>
export type DeleteContentInput = z.infer<typeof DeleteContentInputSchema>
