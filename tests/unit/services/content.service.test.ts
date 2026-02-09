import type { ContentWithData, ContentBundle, ContentHistory } from '@/db/models'

const { mockContentRepository, mockEventEmitter } = vi.hoisted(() => ({
  mockContentRepository: {
    findPublished: vi.fn(),
    findBySlug: vi.fn(),
    getBundle: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    findByIdIncludingDeleted: vi.fn(),
    slugExists: vi.fn(),
    create: vi.fn(),
    updateWithHistory: vi.fn(),
    delete: vi.fn(),
    hardDelete: vi.fn(),
    getHistory: vi.fn(),
    restoreVersion: vi.fn(),
  },
  mockEventEmitter: {
    emit: vi.fn(),
  },
}))

vi.mock('@/repositories', () => ({
  contentRepository: mockContentRepository,
}))

vi.mock('@/events', () => ({
  eventEmitter: mockEventEmitter,
}))

describe('ContentService', () => {
  let contentService: typeof import('@/services/content.service').contentService

  beforeEach(async () => {
    vi.clearAllMocks()

    // Dynamic import to apply mocks
    const module = await import('@/services/content.service')
    contentService = module.contentService
  })

  afterEach(() => {
    vi.resetModules()
  })

  // Test data factories
  const createContentItem = (overrides: Partial<ContentWithData> = {}): ContentWithData => ({
    id: 'cnt_123',
    type: 'project',
    slug: 'test-project',
    data: { title: 'Test Project', description: 'A test project' },
    status: 'published',
    version: 1,
    sortOrder: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    deletedAt: null,
    ...overrides,
  })

  describe('getPublishedContent', () => {
    it('should return published content with ETag', async () => {
      const mockContent = [createContentItem(), createContentItem({ id: 'cnt_456', slug: 'test-2' })]
      mockContentRepository.findPublished.mockResolvedValue(mockContent)

      const result = await contentService.getPublishedContent()

      expect(result.data).toEqual(mockContent)
      expect(result.etag).toBeDefined()
      expect(typeof result.etag).toBe('string')
    })

    it('should filter by type when provided', async () => {
      mockContentRepository.findPublished.mockResolvedValue([])

      await contentService.getPublishedContent({ type: 'experience' })

      expect(mockContentRepository.findPublished).toHaveBeenCalledWith('experience')
    })

    it('should pass undefined when no type filter', async () => {
      mockContentRepository.findPublished.mockResolvedValue([])

      await contentService.getPublishedContent()

      expect(mockContentRepository.findPublished).toHaveBeenCalledWith(undefined)
    })
  })

  describe('getByTypeAndSlug', () => {
    it('should return content when found and published', async () => {
      const mockContent = createContentItem()
      mockContentRepository.findBySlug.mockResolvedValue(mockContent)

      const result = await contentService.getByTypeAndSlug('project', 'test-project')

      expect(result.data).toEqual(mockContent)
      expect(result.etag).toBeDefined()
    })

    it('should throw NotFoundError when content not found', async () => {
      mockContentRepository.findBySlug.mockResolvedValue(null)

      await expect(contentService.getByTypeAndSlug('project', 'not-found')).rejects.toThrow()
    })

    it('should throw NotFoundError when content is not published', async () => {
      const draftContent = createContentItem({ status: 'draft' })
      mockContentRepository.findBySlug.mockResolvedValue(draftContent)

      await expect(contentService.getByTypeAndSlug('project', 'draft-project')).rejects.toThrow()
    })

    it('should throw NotFoundError when content is archived', async () => {
      const archivedContent = createContentItem({ status: 'archived' })
      mockContentRepository.findBySlug.mockResolvedValue(archivedContent)

      await expect(contentService.getByTypeAndSlug('project', 'archived-project')).rejects.toThrow()
    })
  })

  describe('getBundle', () => {
    it('should return bundle with ETag', async () => {
      const mockBundle: ContentBundle = {
        projects: [createContentItem()],
        experiences: [],
        education: [],
        skills: [],
        about: null,
        contact: null,
      }
      mockContentRepository.getBundle.mockResolvedValue(mockBundle)

      const result = await contentService.getBundle()

      expect(result.data).toEqual(mockBundle)
      expect(result.etag).toBeDefined()
    })
  })

  describe('validateListQuery', () => {
    it('should return empty options for empty query', () => {
      const result = contentService.validateListQuery({})

      expect(result).toEqual({ type: undefined })
    })

    it('should accept valid type filter', () => {
      const result = contentService.validateListQuery({ type: 'project' })

      expect(result.type).toBe('project')
    })

    it('should throw ValidationError for invalid type', () => {
      expect(() => contentService.validateListQuery({ type: 'invalid' })).toThrow()
    })
  })

  describe('validateTypeSlugParams', () => {
    it('should return valid type and slug', () => {
      const result = contentService.validateTypeSlugParams({ type: 'project', slug: 'my-project' })

      expect(result).toEqual({ type: 'project', slug: 'my-project' })
    })

    it('should throw ValidationError for invalid type', () => {
      expect(() => contentService.validateTypeSlugParams({ type: 'invalid', slug: 'test' })).toThrow()
    })

    it('should throw ValidationError for missing slug', () => {
      expect(() => contentService.validateTypeSlugParams({ type: 'project' })).toThrow()
    })
  })

  // Admin Methods
  describe('getAllContent', () => {
    it('should return all content for admin', async () => {
      const mockContent = [
        createContentItem(),
        createContentItem({ id: 'cnt_456', status: 'draft' }),
      ]
      mockContentRepository.findAll.mockResolvedValue(mockContent)

      const result = await contentService.getAllContent({})

      expect(result.data).toEqual(mockContent)
    })

    it('should pass options to repository', async () => {
      mockContentRepository.findAll.mockResolvedValue([])

      await contentService.getAllContent({
        type: 'project',
        status: 'draft',
        includeDeleted: true,
        limit: 10,
        offset: 5,
      })

      expect(mockContentRepository.findAll).toHaveBeenCalledWith({
        type: 'project',
        status: 'draft',
        includeDeleted: true,
        limit: 10,
        offset: 5,
      })
    })
  })

  describe('getContentById', () => {
    it('should return content by ID', async () => {
      const mockContent = createContentItem()
      mockContentRepository.findByIdIncludingDeleted.mockResolvedValue(mockContent)

      const result = await contentService.getContentById('cnt_123')

      expect(result.data).toEqual(mockContent)
    })

    it('should throw NotFoundError when not found', async () => {
      mockContentRepository.findByIdIncludingDeleted.mockResolvedValue(null)

      await expect(contentService.getContentById('cnt_404')).rejects.toThrow()
    })
  })

  describe('createContent', () => {
    it('should create content with valid data', async () => {
      const mockCreated = createContentItem()
      mockContentRepository.slugExists.mockResolvedValue(false)
      mockContentRepository.create.mockResolvedValue(mockCreated)

      const result = await contentService.createContent(
        {
          type: 'project',
          slug: 'test-project',
          data: { title: 'Test Project', description: 'A test project', technologies: [], links: {} },
        },
        'admin'
      )

      expect(result.data).toEqual(mockCreated)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('content:created', expect.any(Object))
    })

    it('should generate slug from title if not provided', async () => {
      const mockCreated = createContentItem({ slug: 'test-project' })
      mockContentRepository.slugExists.mockResolvedValue(false)
      mockContentRepository.create.mockResolvedValue(mockCreated)

      await contentService.createContent(
        {
          type: 'project',
          data: { title: 'Test Project', description: 'A test project', technologies: [], links: {} },
        },
        'admin'
      )

      expect(mockContentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'test-project' }),
        'admin'
      )
    })

    it('should throw ValidationError when slug required but no title', async () => {
      await expect(
        contentService.createContent(
          {
            type: 'project',
            data: { description: 'No title' },
          },
          'admin'
        )
      ).rejects.toThrow()
    })

    it('should throw ConflictError when slug exists', async () => {
      mockContentRepository.slugExists.mockResolvedValue(true)

      await expect(
        contentService.createContent(
          {
            type: 'project',
            slug: 'existing-slug',
            data: { title: 'Test', description: 'Test', technologies: [], links: {} },
          },
          'admin'
        )
      ).rejects.toThrow()
    })

    it('should emit content:created event', async () => {
      const mockCreated = createContentItem()
      mockContentRepository.slugExists.mockResolvedValue(false)
      mockContentRepository.create.mockResolvedValue(mockCreated)

      await contentService.createContent(
        {
          type: 'project',
          slug: 'test-project',
          data: { title: 'Test', description: 'Test', technologies: [], links: {} },
        },
        'admin'
      )

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('content:created', {
        id: mockCreated.id,
        type: mockCreated.type,
        slug: mockCreated.slug,
        version: mockCreated.version,
        changedBy: 'admin',
      })
    })
  })

  describe('updateContent', () => {
    it('should update existing content', async () => {
      const existing = createContentItem()
      const updated = createContentItem({ version: 2 })
      mockContentRepository.findById.mockResolvedValue(existing)
      mockContentRepository.slugExists.mockResolvedValue(false)
      mockContentRepository.updateWithHistory.mockResolvedValue(updated)

      const result = await contentService.updateContent(
        'cnt_123',
        { status: 'published' },
        'admin'
      )

      expect(result.data).toEqual(updated)
    })

    it('should throw NotFoundError when content not found', async () => {
      mockContentRepository.findById.mockResolvedValue(null)

      await expect(
        contentService.updateContent('cnt_404', { status: 'published' }, 'admin')
      ).rejects.toThrow()
    })

    it('should throw ConflictError when changing to existing slug', async () => {
      const existing = createContentItem()
      mockContentRepository.findById.mockResolvedValue(existing)
      mockContentRepository.slugExists.mockResolvedValue(true)

      await expect(
        contentService.updateContent('cnt_123', { slug: 'existing-slug' }, 'admin')
      ).rejects.toThrow()
    })

    it('should emit content:updated event with changed fields', async () => {
      const existing = createContentItem()
      const updated = createContentItem({ version: 2, status: 'archived' })
      mockContentRepository.findById.mockResolvedValue(existing)
      mockContentRepository.updateWithHistory.mockResolvedValue(updated)

      await contentService.updateContent('cnt_123', { status: 'archived' }, 'admin')

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('content:updated', expect.objectContaining({
        changedFields: expect.arrayContaining(['status']),
      }))
    })

    it('should throw NotFoundError when updateWithHistory returns null', async () => {
      const existing = createContentItem()
      mockContentRepository.findById.mockResolvedValue(existing)
      mockContentRepository.updateWithHistory.mockResolvedValue(null)

      await expect(
        contentService.updateContent('cnt_123', { status: 'published' }, 'admin')
      ).rejects.toThrow()
    })
  })

  describe('deleteContent', () => {
    describe('soft delete', () => {
      it('should soft delete content', async () => {
        const existing = createContentItem()
        mockContentRepository.findByIdIncludingDeleted.mockResolvedValue(existing)
        mockContentRepository.delete.mockResolvedValue(true)

        const result = await contentService.deleteContent('cnt_123', false, 'admin')

        expect(result.success).toBe(true)
        expect(mockContentRepository.delete).toHaveBeenCalledWith('cnt_123', 'admin')
      })

      it('should throw NotFoundError when content not found', async () => {
        mockContentRepository.findByIdIncludingDeleted.mockResolvedValue(null)

        await expect(
          contentService.deleteContent('cnt_404', false, 'admin')
        ).rejects.toThrow()
      })

      it('should emit content:deleted event with hard=false', async () => {
        const existing = createContentItem()
        mockContentRepository.findByIdIncludingDeleted.mockResolvedValue(existing)
        mockContentRepository.delete.mockResolvedValue(true)

        await contentService.deleteContent('cnt_123', false, 'admin')

        expect(mockEventEmitter.emit).toHaveBeenCalledWith('content:deleted', {
          id: 'cnt_123',
          type: existing.type,
          hard: false,
          changedBy: 'admin',
        })
      })

      it('should throw NotFoundError when delete returns false', async () => {
        const existing = createContentItem()
        mockContentRepository.findByIdIncludingDeleted.mockResolvedValue(existing)
        mockContentRepository.delete.mockResolvedValue(false)

        await expect(
          contentService.deleteContent('cnt_123', false, 'admin')
        ).rejects.toThrow()
      })
    })

    describe('hard delete', () => {
      it('should hard delete content', async () => {
        const existing = createContentItem()
        mockContentRepository.findByIdIncludingDeleted.mockResolvedValue(existing)
        mockContentRepository.hardDelete.mockResolvedValue(true)

        const result = await contentService.deleteContent('cnt_123', true, 'admin')

        expect(result.success).toBe(true)
        expect(mockContentRepository.hardDelete).toHaveBeenCalledWith('cnt_123')
      })

      it('should emit content:deleted event with hard=true', async () => {
        const existing = createContentItem()
        mockContentRepository.findByIdIncludingDeleted.mockResolvedValue(existing)
        mockContentRepository.hardDelete.mockResolvedValue(true)

        await contentService.deleteContent('cnt_123', true, 'admin')

        expect(mockEventEmitter.emit).toHaveBeenCalledWith('content:deleted', {
          id: 'cnt_123',
          type: existing.type,
          hard: true,
          changedBy: 'admin',
        })
      })

      it('should throw NotFoundError when hardDelete returns false', async () => {
        const existing = createContentItem()
        mockContentRepository.findByIdIncludingDeleted.mockResolvedValue(existing)
        mockContentRepository.hardDelete.mockResolvedValue(false)

        await expect(
          contentService.deleteContent('cnt_123', true, 'admin')
        ).rejects.toThrow()
      })
    })
  })

  describe('getContentHistory', () => {
    it('should return content history', async () => {
      const existing = createContentItem()
      const mockHistory: ContentHistory[] = [
        {
          id: 'hist_1',
          contentId: 'cnt_123',
          version: 2,
          data: '{}',
          changeType: 'updated',
          changedBy: 'admin',
          changeSummary: 'Updated to version 2',
          createdAt: '2024-01-02T00:00:00Z',
        },
        {
          id: 'hist_2',
          contentId: 'cnt_123',
          version: 1,
          data: '{}',
          changeType: 'created',
          changedBy: 'admin',
          changeSummary: 'Created',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ]
      mockContentRepository.findByIdIncludingDeleted.mockResolvedValue(existing)
      mockContentRepository.getHistory.mockResolvedValue(mockHistory)

      const result = await contentService.getContentHistory('cnt_123', 50, 0)

      expect(result.data).toEqual(mockHistory)
    })

    it('should throw NotFoundError when content not found', async () => {
      mockContentRepository.findByIdIncludingDeleted.mockResolvedValue(null)

      await expect(contentService.getContentHistory('cnt_404', 50, 0)).rejects.toThrow()
    })
  })

  describe('restoreContentVersion', () => {
    it('should restore content to previous version', async () => {
      const restored = createContentItem({ version: 3 })
      mockContentRepository.restoreVersion.mockResolvedValue(restored)

      const result = await contentService.restoreContentVersion('cnt_123', 1, 'admin')

      expect(result.data).toEqual(restored)
    })

    it('should emit content:restored event', async () => {
      const restored = createContentItem({ version: 3 })
      mockContentRepository.restoreVersion.mockResolvedValue(restored)

      await contentService.restoreContentVersion('cnt_123', 1, 'admin')

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('content:restored', {
        id: restored.id,
        type: restored.type,
        fromVersion: 1,
        toVersion: restored.version,
        changedBy: 'admin',
      })
    })

    it('should throw NotFoundError when content not found', async () => {
      mockContentRepository.restoreVersion.mockResolvedValue(null)
      mockContentRepository.findById.mockResolvedValue(null)

      await expect(
        contentService.restoreContentVersion('cnt_404', 1, 'admin')
      ).rejects.toThrow()
    })

    it('should throw NotFoundError when version not found', async () => {
      const existing = createContentItem()
      mockContentRepository.restoreVersion.mockResolvedValue(null)
      mockContentRepository.findById.mockResolvedValue(existing)

      await expect(
        contentService.restoreContentVersion('cnt_123', 999, 'admin')
      ).rejects.toThrow()
    })
  })

  describe('validation methods', () => {
    describe('validateAdminListQuery', () => {
      it('should accept valid admin query parameters', () => {
        const result = contentService.validateAdminListQuery({
          type: 'project',
          status: 'draft',
          includeDeleted: 'true',
          limit: '25',
          offset: '10',
        })

        expect(result.type).toBe('project')
        expect(result.status).toBe('draft')
        expect(result.includeDeleted).toBe(true)
        expect(result.limit).toBe(25)
        expect(result.offset).toBe(10)
      })

      it('should provide defaults for missing parameters', () => {
        const result = contentService.validateAdminListQuery({})

        expect(result.limit).toBe(50)
        expect(result.offset).toBe(0)
        expect(result.includeDeleted).toBe(false)
      })
    })

    describe('validateContentIdParam', () => {
      it('should accept valid content ID', () => {
        const result = contentService.validateContentIdParam({ id: 'content_abc123' })
        expect(result.id).toBe('content_abc123')
      })

      it('should reject invalid content ID format', () => {
        expect(() => contentService.validateContentIdParam({ id: 'invalid' })).toThrow()
      })
    })

    describe('validateCreateRequest', () => {
      it('should accept valid create request', () => {
        const result = contentService.validateCreateRequest({
          type: 'project',
          data: { title: 'Test', description: 'Test desc' },
        })

        expect(result.type).toBe('project')
      })

      it('should reject missing type', () => {
        expect(() =>
          contentService.validateCreateRequest({ data: { title: 'Test' } })
        ).toThrow()
      })
    })

    describe('validateUpdateRequest', () => {
      it('should accept valid update request', () => {
        const result = contentService.validateUpdateRequest({
          status: 'published',
        })

        expect(result.status).toBe('published')
      })

      it('should accept partial updates', () => {
        const result = contentService.validateUpdateRequest({
          sortOrder: 5,
        })

        expect(result.sortOrder).toBe(5)
      })
    })

    describe('validateHistoryQuery', () => {
      it('should provide defaults for empty query', () => {
        const result = contentService.validateHistoryQuery({})

        expect(result.limit).toBe(50)
        expect(result.offset).toBe(0)
      })
    })

    describe('validateRestoreRequest', () => {
      it('should accept valid version number', () => {
        const result = contentService.validateRestoreRequest({ version: 2 })

        expect(result.version).toBe(2)
      })

      it('should reject non-positive version', () => {
        expect(() => contentService.validateRestoreRequest({ version: 0 })).toThrow()
      })
    })

    describe('validateDeleteQuery', () => {
      it('should parse hard delete flag', () => {
        const result = contentService.validateDeleteQuery({ hard: 'true' })

        expect(result.hard).toBe(true)
      })

      it('should default to soft delete', () => {
        const result = contentService.validateDeleteQuery({})

        expect(result.hard).toBe(false)
      })
    })
  })
})
