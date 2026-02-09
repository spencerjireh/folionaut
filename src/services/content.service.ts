import { contentRepository } from '@/repositories'
import { NotFoundError, ValidationError, ConflictError } from '@/errors/app.error'
import { generateETag } from '@/lib/etag'
import { slugify, generateUniqueSlug } from '@/lib/slugify'
import {
  ContentListQuerySchema,
  ContentTypeSlugParamsSchema,
  AdminContentListQuerySchema,
  CreateContentRequestSchema,
  UpdateContentRequestSchema,
  ContentIdParamSchema,
  HistoryQuerySchema,
  RestoreVersionRequestSchema,
  DeleteQuerySchema,
  validateContentData,
} from '@/validation/content.schemas'
import { validate } from '@/validation/validate'
import type { ContentType, ContentWithData, ContentBundle, ContentHistory } from '@/db/models'
import { eventEmitter } from '@/events'
import type { ContentListOptions, ServiceResponse } from './content.types'

export type { ContentListOptions, ServiceResponse } from './content.types'

class ContentService {
  /**
   * Get all published content, optionally filtered by type.
   */
  async getPublishedContent(
    options?: ContentListOptions
  ): Promise<ServiceResponse<ContentWithData[]>> {
    const data = await contentRepository.findPublished(options?.type)
    const etag = generateETag(data)
    return { data, etag }
  }

  /**
   * Get a single content item by type and slug.
   * Throws NotFoundError if not found or not published.
   */
  async getByTypeAndSlug(
    type: ContentType,
    slug: string
  ): Promise<ServiceResponse<ContentWithData>> {
    const content = await contentRepository.findBySlug(type, slug)

    if (!content) {
      throw new NotFoundError('Content', `${type}/${slug}`)
    }

    if (content.status !== 'published') {
      throw new NotFoundError('Content', `${type}/${slug}`)
    }

    const etag = generateETag(content)
    return { data: content, etag }
  }

  /**
   * Get all published content grouped by type.
   */
  async getBundle(): Promise<ServiceResponse<ContentBundle>> {
    const data = await contentRepository.getBundle()
    const etag = generateETag(data)
    return { data, etag }
  }

  /**
   * Validate and parse content list query parameters.
   */
  validateListQuery(query: unknown): ContentListOptions {
    const result = validate(ContentListQuerySchema, query, 'Invalid query parameters')
    return { type: result.type }
  }

  /**
   * Validate and parse type/slug route parameters.
   */
  validateTypeSlugParams(params: unknown): { type: ContentType; slug: string } {
    return validate(ContentTypeSlugParamsSchema, params, 'Invalid parameters')
  }

  // ============================================
  // Admin Methods
  // ============================================

  /**
   * Validate admin content list query parameters.
   */
  validateAdminListQuery(query: unknown) {
    return validate(AdminContentListQuerySchema, query, 'Invalid query parameters')
  }

  /**
   * Validate content ID parameter.
   */
  validateContentIdParam(params: unknown): { id: string } {
    return validate(ContentIdParamSchema, params, 'Invalid content ID')
  }

  /**
   * Validate create content request.
   */
  validateCreateRequest(body: unknown) {
    return validate(CreateContentRequestSchema, body, 'Invalid request body')
  }

  /**
   * Validate update content request.
   */
  validateUpdateRequest(body: unknown) {
    return validate(UpdateContentRequestSchema, body, 'Invalid request body')
  }

  /**
   * Validate history query parameters.
   */
  validateHistoryQuery(query: unknown) {
    return validate(HistoryQuerySchema, query, 'Invalid query parameters')
  }

  /**
   * Validate restore version request.
   */
  validateRestoreRequest(body: unknown) {
    return validate(RestoreVersionRequestSchema, body, 'Invalid request body')
  }

  /**
   * Validate delete query parameters.
   */
  validateDeleteQuery(query: unknown) {
    return validate(DeleteQuerySchema, query, 'Invalid query parameters')
  }

  /**
   * Get all content (admin view), including drafts and optionally deleted.
   */
  async getAllContent(options: {
    type?: ContentType
    status?: 'draft' | 'published' | 'archived'
    includeDeleted?: boolean
    limit?: number
    offset?: number
  }): Promise<{ data: ContentWithData[] }> {
    const data = await contentRepository.findAll(options)
    return { data }
  }

  /**
   * Get a single content item by ID (admin view).
   * Returns content regardless of status.
   */
  async getContentById(id: string): Promise<{ data: ContentWithData }> {
    const content = await contentRepository.findByIdIncludingDeleted(id)
    if (!content) {
      throw new NotFoundError('Content', id)
    }
    return { data: content }
  }

  /**
   * Create new content.
   */
  async createContent(
    dto: {
      type: ContentType
      slug?: string
      data: Record<string, unknown>
      status?: 'draft' | 'published' | 'archived'
      sortOrder?: number
    },
    changedBy: string
  ): Promise<{ data: ContentWithData }> {
    // Validate data against type-specific schema
    const validatedData = validateContentData(dto.type, dto.data)

    // Generate slug if not provided
    let slug = dto.slug
    if (!slug) {
      const title = (dto.data as { title?: string }).title
      if (!title) {
        throw new ValidationError('Slug is required when data.title is not provided', {
          slug: ['Required'],
        })
      }
      const baseSlug = slugify(title)
      slug = await generateUniqueSlug(baseSlug, async (testSlug) => {
        return contentRepository.slugExists(dto.type, testSlug)
      })
    } else {
      // Check if slug already exists
      const exists = await contentRepository.slugExists(dto.type, slug)
      if (exists) {
        throw new ConflictError(`Slug '${slug}' already exists for type '${dto.type}'`, 'slug')
      }
    }

    const data = await contentRepository.create(
      {
        type: dto.type,
        slug,
        data: validatedData,
        status: dto.status ?? 'draft',
        sortOrder: dto.sortOrder ?? 0,
      },
      changedBy
    )

    eventEmitter.emit('content:created', {
      id: data.id,
      type: data.type as ContentType,
      slug: data.slug,
      version: data.version,
      changedBy,
    })

    return { data }
  }

  /**
   * Update existing content.
   */
  async updateContent(
    id: string,
    dto: {
      slug?: string
      data?: Record<string, unknown>
      status?: 'draft' | 'published' | 'archived'
      sortOrder?: number
    },
    changedBy: string
  ): Promise<{ data: ContentWithData }> {
    // Check if content exists
    const existing = await contentRepository.findById(id)
    if (!existing) {
      throw new NotFoundError('Content', id)
    }

    // Validate data if provided
    let validatedData = dto.data
    if (dto.data) {
      validatedData = validateContentData(existing.type as ContentType, dto.data)
    }

    // Check slug uniqueness if changing
    if (dto.slug && dto.slug !== existing.slug) {
      const slugExists = await contentRepository.slugExists(
        existing.type as ContentType,
        dto.slug,
        id
      )
      if (slugExists) {
        throw new ConflictError(
          `Slug '${dto.slug}' already exists for type '${existing.type}'`,
          'slug'
        )
      }
    }

    const previousVersion = existing.version
    const data = await contentRepository.updateWithHistory(
      id,
      {
        slug: dto.slug,
        data: validatedData,
        status: dto.status,
        sortOrder: dto.sortOrder,
      },
      changedBy
    )

    if (!data) {
      throw new NotFoundError('Content', id)
    }

    // Determine which fields changed
    const changedFields: string[] = []
    if (dto.slug !== undefined && dto.slug !== existing.slug) changedFields.push('slug')
    if (dto.data !== undefined) changedFields.push('data')
    if (dto.status !== undefined && dto.status !== existing.status) changedFields.push('status')
    if (dto.sortOrder !== undefined && dto.sortOrder !== existing.sortOrder)
      changedFields.push('sortOrder')

    eventEmitter.emit('content:updated', {
      id: data.id,
      type: data.type as ContentType,
      version: data.version,
      previousVersion,
      changedFields,
      changedBy,
    })

    return { data }
  }

  /**
   * Delete content (soft or hard delete).
   */
  async deleteContent(id: string, hard: boolean, changedBy: string): Promise<{ success: boolean }> {
    // Get content type before deletion for event emission
    const existing = await contentRepository.findByIdIncludingDeleted(id)
    if (!existing) {
      throw new NotFoundError('Content', id)
    }

    if (hard) {
      const success = await contentRepository.hardDelete(id)
      if (!success) {
        throw new NotFoundError('Content', id)
      }

      eventEmitter.emit('content:deleted', {
        id,
        type: existing.type as ContentType,
        hard: true,
        changedBy,
      })

      return { success: true }
    }

    const success = await contentRepository.delete(id, changedBy)
    if (!success) {
      throw new NotFoundError('Content', id)
    }

    eventEmitter.emit('content:deleted', {
      id,
      type: existing.type as ContentType,
      hard: false,
      changedBy,
    })

    return { success: true }
  }

  /**
   * Get content version history.
   */
  async getContentHistory(
    id: string,
    limit: number,
    offset: number
  ): Promise<{ data: ContentHistory[] }> {
    // Check if content exists (including deleted)
    const content = await contentRepository.findByIdIncludingDeleted(id)
    if (!content) {
      throw new NotFoundError('Content', id)
    }

    const data = await contentRepository.getHistory(id, limit, offset)
    return { data }
  }

  /**
   * Restore content to a previous version.
   */
  async restoreContentVersion(
    id: string,
    version: number,
    changedBy: string
  ): Promise<{ data: ContentWithData }> {
    const data = await contentRepository.restoreVersion(id, version, changedBy)

    if (!data) {
      // Determine if content or version doesn't exist
      const content = await contentRepository.findById(id)
      if (!content) {
        throw new NotFoundError('Content', id)
      }
      throw new NotFoundError('Version', `${id}@${version}`)
    }

    eventEmitter.emit('content:restored', {
      id: data.id,
      type: data.type as ContentType,
      fromVersion: version,
      toVersion: data.version,
      changedBy,
    })

    return { data }
  }
}

export const contentService = new ContentService()
