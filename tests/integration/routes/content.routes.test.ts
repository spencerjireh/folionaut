import request from 'supertest'
import express, { type Express } from 'express'
import { createContent, createProject, createAbout, createContact } from '../../helpers/test-factories'

const { mockContentRepository, mockEventEmitter } = vi.hoisted(() => ({
  mockContentRepository: {
    findPublished: vi.fn(),
    findBySlug: vi.fn(),
    getBundle: vi.fn(),
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

describe('Content Routes Integration', () => {
  let app: Express

  beforeEach(async () => {
    vi.clearAllMocks()

    // Dynamic import to apply mocks
    const { contentRouter } = await import('@/routes/v1/content.routes')
    const { errorHandlerMiddleware } = await import('@/middleware/error.middleware')
    const { requestIdMiddleware } = await import('@/middleware/request-id.middleware')
    const { requestContextMiddleware } = await import('@/middleware/request-context.middleware')

    app = express()
    app.use(requestIdMiddleware())
    app.use(requestContextMiddleware())
    app.use(express.json())
    app.use('/api/v1/content', contentRouter)
    app.use(errorHandlerMiddleware)
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('GET /api/v1/content', () => {
    it('should return list of published content', async () => {
      const mockData = [
        createProject({ id: 'content_1', slug: 'project-1' }),
        createProject({ id: 'content_2', slug: 'project-2' }),
      ]
      mockContentRepository.findPublished.mockResolvedValue(mockData)

      const response = await request(app).get('/api/v1/content')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.data[0].slug).toBe('project-1')
    })

    it('should filter by type query parameter', async () => {
      const mockData = [createProject({ id: 'content_1' })]
      mockContentRepository.findPublished.mockResolvedValue(mockData)

      const response = await request(app).get('/api/v1/content?type=project')

      expect(response.status).toBe(200)
      expect(mockContentRepository.findPublished).toHaveBeenCalledWith('project')
    })

    it('should return 400 for invalid type', async () => {
      const response = await request(app).get('/api/v1/content?type=invalid')

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should include ETag header', async () => {
      mockContentRepository.findPublished.mockResolvedValue([createProject()])

      const response = await request(app).get('/api/v1/content')

      expect(response.headers['etag']).toBeDefined()
    })

    it('should return 304 when ETag matches', async () => {
      const mockData = [createProject()]
      mockContentRepository.findPublished.mockResolvedValue(mockData)

      // First request to get ETag
      const firstResponse = await request(app).get('/api/v1/content')
      const etag = firstResponse.headers['etag']

      // Second request with If-None-Match
      const secondResponse = await request(app)
        .get('/api/v1/content')
        .set('If-None-Match', etag)

      expect(secondResponse.status).toBe(304)
    })

    it('should set Cache-Control header', async () => {
      mockContentRepository.findPublished.mockResolvedValue([])

      const response = await request(app).get('/api/v1/content')

      expect(response.headers['cache-control']).toContain('max-age=60')
    })

    it('should return empty array when no content', async () => {
      mockContentRepository.findPublished.mockResolvedValue([])

      const response = await request(app).get('/api/v1/content')

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual([])
    })
  })

  describe('GET /api/v1/content/bundle', () => {
    it('should return grouped content bundle', async () => {
      const mockBundle = {
        projects: [createProject()],
        experiences: [],
        education: [],
        skills: [],
        about: createAbout(),
        contact: createContact(),
      }
      mockContentRepository.getBundle.mockResolvedValue(mockBundle)

      const response = await request(app).get('/api/v1/content/bundle')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveProperty('projects')
      expect(response.body.data).toHaveProperty('experiences')
      expect(response.body.data).toHaveProperty('about')
      expect(response.body.data).toHaveProperty('contact')
    })

    it('should include ETag header', async () => {
      mockContentRepository.getBundle.mockResolvedValue({
        projects: [],
        experiences: [],
        education: [],
        skills: [],
        about: null,
        contact: null,
      })

      const response = await request(app).get('/api/v1/content/bundle')

      expect(response.headers['etag']).toBeDefined()
    })

    it('should return 304 when ETag matches', async () => {
      const mockBundle = {
        projects: [],
        experiences: [],
        education: [],
        skills: [],
        about: null,
        contact: null,
      }
      mockContentRepository.getBundle.mockResolvedValue(mockBundle)

      const firstResponse = await request(app).get('/api/v1/content/bundle')
      const etag = firstResponse.headers['etag']

      const secondResponse = await request(app)
        .get('/api/v1/content/bundle')
        .set('If-None-Match', etag)

      expect(secondResponse.status).toBe(304)
    })

    it('should set longer Cache-Control for bundle', async () => {
      mockContentRepository.getBundle.mockResolvedValue({
        projects: [],
        experiences: [],
        education: [],
        skills: [],
        about: null,
        contact: null,
      })

      const response = await request(app).get('/api/v1/content/bundle')

      expect(response.headers['cache-control']).toContain('max-age=300')
    })
  })

  describe('GET /api/v1/content/:type/:slug', () => {
    it('should return content by type and slug', async () => {
      const mockContent = createProject({ slug: 'my-project', status: 'published' })
      mockContentRepository.findBySlug.mockResolvedValue(mockContent)

      const response = await request(app).get('/api/v1/content/project/my-project')

      expect(response.status).toBe(200)
      expect(response.body.data.slug).toBe('my-project')
      expect(response.body.data.type).toBe('project')
    })

    it('should return 404 for non-existent content', async () => {
      mockContentRepository.findBySlug.mockResolvedValue(null)

      const response = await request(app).get('/api/v1/content/project/nonexistent')

      expect(response.status).toBe(404)
      expect(response.body.error.code).toBe('NOT_FOUND')
    })

    it('should return 404 for draft content', async () => {
      const draftContent = createProject({ status: 'draft' })
      mockContentRepository.findBySlug.mockResolvedValue(draftContent)

      const response = await request(app).get('/api/v1/content/project/draft-project')

      expect(response.status).toBe(404)
    })

    it('should return 404 for archived content', async () => {
      const archivedContent = createProject({ status: 'archived' })
      mockContentRepository.findBySlug.mockResolvedValue(archivedContent)

      const response = await request(app).get('/api/v1/content/project/archived-project')

      expect(response.status).toBe(404)
    })

    it('should return 400 for invalid type', async () => {
      const response = await request(app).get('/api/v1/content/invalid/my-slug')

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should include ETag header', async () => {
      const mockContent = createProject({ status: 'published' })
      mockContentRepository.findBySlug.mockResolvedValue(mockContent)

      const response = await request(app).get('/api/v1/content/project/my-project')

      expect(response.headers['etag']).toBeDefined()
    })

    it('should return 304 when ETag matches', async () => {
      const mockContent = createProject({ status: 'published' })
      mockContentRepository.findBySlug.mockResolvedValue(mockContent)

      const firstResponse = await request(app).get('/api/v1/content/project/my-project')
      const etag = firstResponse.headers['etag']

      const secondResponse = await request(app)
        .get('/api/v1/content/project/my-project')
        .set('If-None-Match', etag)

      expect(secondResponse.status).toBe(304)
    })

    it('should accept all valid content types', async () => {
      const types = ['project', 'experience', 'education', 'skill', 'about', 'contact']

      for (const type of types) {
        mockContentRepository.findBySlug.mockResolvedValue(
          createContent({ type: type as import('@/db/schema').ContentType, status: 'published' })
        )

        const response = await request(app).get(`/api/v1/content/${type}/test-slug`)
        expect(response.status).toBe(200)
      }
    })
  })

  describe('Error handling', () => {
    it('should return JSON error for repository errors', async () => {
      mockContentRepository.findPublished.mockRejectedValue(new Error('Database error'))

      const response = await request(app).get('/api/v1/content')

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('error')
    })

    it('should include request ID in error response', async () => {
      mockContentRepository.findPublished.mockRejectedValue(new Error('Error'))

      const response = await request(app).get('/api/v1/content')

      expect(response.headers['x-request-id']).toBeDefined()
    })
  })
})
