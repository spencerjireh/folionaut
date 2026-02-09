import request from 'supertest'
import express, { type Express } from 'express'
import { createContent, createProject, createContentHistory } from '../../helpers/test-factories'

const { mockContentRepository, mockEventEmitter, mockCache, TEST_ADMIN_KEY } = vi.hoisted(() => ({
  mockContentRepository: {
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
  mockCache: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(true),
  },
  TEST_ADMIN_KEY: 'test-admin-api-key-that-is-at-least-32-chars',
}))

vi.mock('@/repositories', () => ({
  contentRepository: mockContentRepository,
}))

vi.mock('@/events', () => ({
  eventEmitter: mockEventEmitter,
}))

vi.mock('@/cache', () => ({
  getCache: () => mockCache,
  CacheKeys: {
    IDEMPOTENCY: (key: string) => `idempotency:${key}`,
    CONTENT_LIST: (type?: string) => type ? `content:list:${type}` : 'content:list',
    CONTENT_BUNDLE: 'content:bundle',
    RATE_LIMIT: (key: string) => `rate:${key}`,
  },
  CacheTTL: {
    IDEMPOTENCY: 86400,
    CONTENT_LIST: 300,
    CONTENT_BUNDLE: 600,
    RATE_LIMIT: 60,
  },
}))

vi.mock('@/config/env', () => ({
  env: {
    NODE_ENV: 'test',
    ADMIN_API_KEY: TEST_ADMIN_KEY,
  },
}))

describe('Admin Content Routes Integration', () => {
  let app: Express

  beforeEach(async () => {
    vi.clearAllMocks()
    // Reset mock cache methods after clearAllMocks
    mockCache.get.mockResolvedValue(null)
    mockCache.set.mockResolvedValue(undefined)
    mockCache.delete.mockResolvedValue(true)

    // Dynamic import to apply mocks
    const { adminContentRouter } = await import('@/routes/v1/admin/content.routes')
    const { errorHandlerMiddleware } = await import('@/middleware/error.middleware')
    const { requestIdMiddleware } = await import('@/middleware/request-id.middleware')
    const { requestContextMiddleware } = await import('@/middleware/request-context.middleware')

    app = express()
    app.use(requestIdMiddleware())
    app.use(requestContextMiddleware())
    app.use(express.json())
    app.use('/api/v1/admin/content', adminContentRouter)
    app.use(errorHandlerMiddleware)
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('Authentication', () => {
    it('should return 401 without X-Admin-Key header', async () => {
      const response = await request(app).get('/api/v1/admin/content')

      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })

    it('should return 401 with invalid X-Admin-Key', async () => {
      const response = await request(app)
        .get('/api/v1/admin/content')
        .set('X-Admin-Key', 'invalid-key-that-is-also-at-least-32-chars')

      expect(response.status).toBe(401)
    })

    it('should allow access with valid X-Admin-Key', async () => {
      mockContentRepository.findAll.mockResolvedValue([])

      const response = await request(app)
        .get('/api/v1/admin/content')
        .set('X-Admin-Key', TEST_ADMIN_KEY)

      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/v1/admin/content', () => {
    it('should return all content including drafts', async () => {
      const mockData = [
        createProject({ id: 'content_1', status: 'draft' }),
        createProject({ id: 'content_2', status: 'published' }),
      ]
      mockContentRepository.findAll.mockResolvedValue(mockData)

      const response = await request(app)
        .get('/api/v1/admin/content')
        .set('X-Admin-Key', TEST_ADMIN_KEY)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)
    })

    it('should filter by type', async () => {
      mockContentRepository.findAll.mockResolvedValue([])

      await request(app)
        .get('/api/v1/admin/content?type=project')
        .set('X-Admin-Key', TEST_ADMIN_KEY)

      expect(mockContentRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'project' })
      )
    })

    it('should filter by status', async () => {
      mockContentRepository.findAll.mockResolvedValue([])

      await request(app)
        .get('/api/v1/admin/content?status=draft')
        .set('X-Admin-Key', TEST_ADMIN_KEY)

      expect(mockContentRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'draft' })
      )
    })

    it('should include deleted when requested', async () => {
      mockContentRepository.findAll.mockResolvedValue([])

      await request(app)
        .get('/api/v1/admin/content?includeDeleted=true')
        .set('X-Admin-Key', TEST_ADMIN_KEY)

      expect(mockContentRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ includeDeleted: true })
      )
    })

    it('should paginate with limit and offset', async () => {
      mockContentRepository.findAll.mockResolvedValue([])

      await request(app)
        .get('/api/v1/admin/content?limit=10&offset=5')
        .set('X-Admin-Key', TEST_ADMIN_KEY)

      expect(mockContentRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 5 })
      )
    })
  })

  describe('POST /api/v1/admin/content', () => {
    it('should create content with valid data', async () => {
      const mockCreated = createProject({ id: 'content_new', slug: 'new-project' })
      mockContentRepository.slugExists.mockResolvedValue(false)
      mockContentRepository.create.mockResolvedValue(mockCreated)

      const response = await request(app)
        .post('/api/v1/admin/content')
        .set('X-Admin-Key', TEST_ADMIN_KEY)
        .send({
          type: 'project',
          slug: 'new-project',
          data: { title: 'New Project', description: 'A new project', technologies: [], links: {} },
        })

      expect(response.status).toBe(201)
      expect(response.body.data.slug).toBe('new-project')
    })

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/admin/content')
        .set('X-Admin-Key', TEST_ADMIN_KEY)
        .send({
          data: { title: 'Missing type' },
        })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 409 for duplicate slug', async () => {
      mockContentRepository.slugExists.mockResolvedValue(true)

      const response = await request(app)
        .post('/api/v1/admin/content')
        .set('X-Admin-Key', TEST_ADMIN_KEY)
        .send({
          type: 'project',
          slug: 'existing-slug',
          data: { title: 'Duplicate', description: 'Dup', technologies: [], links: {} },
        })

      expect(response.status).toBe(409)
      expect(response.body.error.code).toBe('CONFLICT')
    })

    it('should support idempotency key', async () => {
      const mockCreated = createProject({ id: 'content_idem' })
      mockContentRepository.slugExists.mockResolvedValue(false)
      mockContentRepository.create.mockResolvedValue(mockCreated)
      mockCache.get.mockResolvedValue(null)

      const idempotencyKey = 'unique-key-123'

      const response1 = await request(app)
        .post('/api/v1/admin/content')
        .set('X-Admin-Key', TEST_ADMIN_KEY)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          type: 'project',
          slug: 'idem-project',
          data: { title: 'Idempotent', description: 'Test', technologies: [], links: {} },
        })

      expect(response1.status).toBe(201)
    })

    it('should emit content:created event', async () => {
      const mockCreated = createProject()
      mockContentRepository.slugExists.mockResolvedValue(false)
      mockContentRepository.create.mockResolvedValue(mockCreated)

      await request(app)
        .post('/api/v1/admin/content')
        .set('X-Admin-Key', TEST_ADMIN_KEY)
        .send({
          type: 'project',
          slug: 'event-test',
          data: { title: 'Event Test', description: 'Test', technologies: [], links: {} },
        })

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'content:created',
        expect.any(Object)
      )
    })
  })

  describe('GET /api/v1/admin/content/:id', () => {
    it('should return content by ID', async () => {
      const mockContent = createProject({ id: 'content_abc123' })
      mockContentRepository.findByIdIncludingDeleted.mockResolvedValue(mockContent)

      const response = await request(app)
        .get('/api/v1/admin/content/content_abc123')
        .set('X-Admin-Key', TEST_ADMIN_KEY)

      expect(response.status).toBe(200)
      expect(response.body.data.id).toBe('content_abc123')
    })

    it('should return 404 for non-existent ID', async () => {
      mockContentRepository.findByIdIncludingDeleted.mockResolvedValue(null)

      const response = await request(app)
        .get('/api/v1/admin/content/content_notfound')
        .set('X-Admin-Key', TEST_ADMIN_KEY)

      expect(response.status).toBe(404)
    })

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/v1/admin/content/invalid-id')
        .set('X-Admin-Key', TEST_ADMIN_KEY)

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/v1/admin/content/:id', () => {
    it('should update content', async () => {
      const existing = createProject({ id: 'content_update123', version: 1 })
      const updated = createProject({ id: 'content_update123', version: 2, status: 'published' })
      mockContentRepository.findById.mockResolvedValue(existing)
      mockContentRepository.updateWithHistory.mockResolvedValue(updated)

      const response = await request(app)
        .put('/api/v1/admin/content/content_update123')
        .set('X-Admin-Key', TEST_ADMIN_KEY)
        .send({ status: 'published' })

      expect(response.status).toBe(200)
      expect(response.body.data.version).toBe(2)
    })

    it('should return 404 for non-existent content', async () => {
      mockContentRepository.findById.mockResolvedValue(null)

      const response = await request(app)
        .put('/api/v1/admin/content/content_notfound1')
        .set('X-Admin-Key', TEST_ADMIN_KEY)
        .send({ status: 'published' })

      expect(response.status).toBe(404)
    })

    it('should return 409 when changing to existing slug', async () => {
      const existing = createProject({ id: 'content_slugtest1' })
      mockContentRepository.findById.mockResolvedValue(existing)
      mockContentRepository.slugExists.mockResolvedValue(true)

      const response = await request(app)
        .put('/api/v1/admin/content/content_slugtest1')
        .set('X-Admin-Key', TEST_ADMIN_KEY)
        .send({ slug: 'taken-slug' })

      expect(response.status).toBe(409)
    })

    it('should emit content:updated event', async () => {
      const existing = createProject({ id: 'content_eventest1' })
      const updated = createProject({ id: 'content_eventest1', version: 2 })
      mockContentRepository.findById.mockResolvedValue(existing)
      mockContentRepository.updateWithHistory.mockResolvedValue(updated)

      await request(app)
        .put('/api/v1/admin/content/content_eventest1')
        .set('X-Admin-Key', TEST_ADMIN_KEY)
        .send({ status: 'archived' })

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'content:updated',
        expect.any(Object)
      )
    })
  })

  describe('DELETE /api/v1/admin/content/:id', () => {
    describe('soft delete (default)', () => {
      it('should soft delete content', async () => {
        const existing = createProject({ id: 'content_delete123' })
        mockContentRepository.findByIdIncludingDeleted.mockResolvedValue(existing)
        mockContentRepository.delete.mockResolvedValue(true)

        const response = await request(app)
          .delete('/api/v1/admin/content/content_delete123')
          .set('X-Admin-Key', TEST_ADMIN_KEY)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(mockContentRepository.delete).toHaveBeenCalledWith('content_delete123', expect.any(String))
      })

      it('should return 404 for non-existent content', async () => {
        mockContentRepository.findByIdIncludingDeleted.mockResolvedValue(null)

        const response = await request(app)
          .delete('/api/v1/admin/content/content_notfound1')
          .set('X-Admin-Key', TEST_ADMIN_KEY)

        expect(response.status).toBe(404)
      })
    })

    describe('hard delete', () => {
      it('should hard delete with hard=true query', async () => {
        const existing = createProject({ id: 'content_hardel123' })
        mockContentRepository.findByIdIncludingDeleted.mockResolvedValue(existing)
        mockContentRepository.hardDelete.mockResolvedValue(true)

        const response = await request(app)
          .delete('/api/v1/admin/content/content_hardel123?hard=true')
          .set('X-Admin-Key', TEST_ADMIN_KEY)

        expect(response.status).toBe(200)
        expect(mockContentRepository.hardDelete).toHaveBeenCalledWith('content_hardel123')
      })
    })

    it('should emit content:deleted event', async () => {
      const existing = createProject({ id: 'content_delevnt1' })
      mockContentRepository.findByIdIncludingDeleted.mockResolvedValue(existing)
      mockContentRepository.delete.mockResolvedValue(true)

      await request(app)
        .delete('/api/v1/admin/content/content_delevnt1')
        .set('X-Admin-Key', TEST_ADMIN_KEY)

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'content:deleted',
        expect.objectContaining({ id: 'content_delevnt1' })
      )
    })
  })

  describe('GET /api/v1/admin/content/:id/history', () => {
    it('should return version history', async () => {
      const existing = createProject({ id: 'content_histtest1' })
      const mockHistory = [
        createContentHistory({ contentId: 'content_histtest1', version: 2, changeType: 'updated' }),
        createContentHistory({ contentId: 'content_histtest1', version: 1, changeType: 'created' }),
      ]
      mockContentRepository.findByIdIncludingDeleted.mockResolvedValue(existing)
      mockContentRepository.getHistory.mockResolvedValue(mockHistory)

      const response = await request(app)
        .get('/api/v1/admin/content/content_histtest1/history')
        .set('X-Admin-Key', TEST_ADMIN_KEY)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)
    })

    it('should return 404 for non-existent content', async () => {
      mockContentRepository.findByIdIncludingDeleted.mockResolvedValue(null)

      const response = await request(app)
        .get('/api/v1/admin/content/content_notfound1/history')
        .set('X-Admin-Key', TEST_ADMIN_KEY)

      expect(response.status).toBe(404)
    })

    it('should paginate history', async () => {
      const existing = createProject({ id: 'content_histpage1' })
      mockContentRepository.findByIdIncludingDeleted.mockResolvedValue(existing)
      mockContentRepository.getHistory.mockResolvedValue([])

      await request(app)
        .get('/api/v1/admin/content/content_histpage1/history?limit=10&offset=5')
        .set('X-Admin-Key', TEST_ADMIN_KEY)

      expect(mockContentRepository.getHistory).toHaveBeenCalledWith('content_histpage1', 10, 5)
    })
  })

  describe('POST /api/v1/admin/content/:id/restore', () => {
    it('should restore content to previous version', async () => {
      const restored = createProject({ id: 'content_restore1', version: 3 })
      mockContentRepository.restoreVersion.mockResolvedValue(restored)

      const response = await request(app)
        .post('/api/v1/admin/content/content_restore1/restore')
        .set('X-Admin-Key', TEST_ADMIN_KEY)
        .send({ version: 1 })

      expect(response.status).toBe(200)
      expect(response.body.data.version).toBe(3)
    })

    it('should return 400 for missing version', async () => {
      const response = await request(app)
        .post('/api/v1/admin/content/content_restore1/restore')
        .set('X-Admin-Key', TEST_ADMIN_KEY)
        .send({})

      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid version', async () => {
      const response = await request(app)
        .post('/api/v1/admin/content/content_restore1/restore')
        .set('X-Admin-Key', TEST_ADMIN_KEY)
        .send({ version: 0 })

      expect(response.status).toBe(400)
    })

    it('should return 404 when content or version not found', async () => {
      mockContentRepository.restoreVersion.mockResolvedValue(null)
      mockContentRepository.findById.mockResolvedValue(null)

      const response = await request(app)
        .post('/api/v1/admin/content/content_notfound1/restore')
        .set('X-Admin-Key', TEST_ADMIN_KEY)
        .send({ version: 1 })

      expect(response.status).toBe(404)
    })

    it('should emit content:restored event', async () => {
      const restored = createProject({ id: 'content_restevnt', version: 3 })
      mockContentRepository.restoreVersion.mockResolvedValue(restored)

      await request(app)
        .post('/api/v1/admin/content/content_restevnt/restore')
        .set('X-Admin-Key', TEST_ADMIN_KEY)
        .send({ version: 1 })

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'content:restored',
        expect.objectContaining({ fromVersion: 1 })
      )
    })
  })
})
