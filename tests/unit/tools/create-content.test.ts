
const { mockContentRepository } = vi.hoisted(() => ({
  mockContentRepository: {
    findAll: vi.fn(),
    findBySlug: vi.fn(),
    findPublished: vi.fn(),
    findById: vi.fn(),
    slugExists: vi.fn(),
    create: vi.fn(),
    updateWithHistory: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/repositories/content.repository', () => ({
  contentRepository: mockContentRepository,
}))

describe('createContent', () => {
  let createContent: typeof import('@/tools/core/create-content').createContent

  beforeEach(async () => {
    vi.clearAllMocks()
    const module = await import('@/tools/core/create-content')
    createContent = module.createContent
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('should create content with valid input', async () => {
    const data = { title: 'Test Project', description: 'A test', tags: [] }
    mockContentRepository.slugExists.mockResolvedValue(false)
    mockContentRepository.create.mockResolvedValue({
      id: 'content_1',
      slug: 'test-project',
      type: 'project',
      data,
      status: 'draft',
      version: 1,
      sortOrder: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    })

    const result = await createContent({
      type: 'project',
      slug: 'test-project',
      data,
    })

    expect(result.success).toBe(true)
    expect(result.data?.item.id).toBe('content_1')
    expect(result.data?.item.slug).toBe('test-project')
    expect(mockContentRepository.create).toHaveBeenCalled()
  })

  it('should auto-generate slug from title', async () => {
    const data = { title: 'My New Project', description: 'Desc', tags: [] }
    mockContentRepository.slugExists.mockResolvedValue(false)
    mockContentRepository.create.mockResolvedValue({
      id: 'content_2',
      slug: 'my-new-project',
      type: 'project',
      data,
      status: 'draft',
      version: 1,
      sortOrder: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    })

    const result = await createContent({
      type: 'project',
      data,
    })

    expect(result.success).toBe(true)
    expect(result.data?.item.slug).toBe('my-new-project')
  })

  it('should return error when slug is missing and cannot be generated', async () => {
    const result = await createContent({
      type: 'skill',
      data: { items: [] },
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Slug is required')
  })

  it('should return error on duplicate slug', async () => {
    mockContentRepository.slugExists.mockResolvedValue(true)

    const result = await createContent({
      type: 'project',
      slug: 'existing-slug',
      data: { title: 'Test', description: 'D', tags: [] },
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Slug already exists')
  })

  it('should create content with custom type', async () => {
    const data = { title: 'My First Post', body: 'Content here' }
    mockContentRepository.slugExists.mockResolvedValue(false)
    mockContentRepository.create.mockResolvedValue({
      id: 'content_3',
      slug: 'my-first-post',
      type: 'blog-post',
      data,
      status: 'draft',
      version: 1,
      sortOrder: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    })

    const result = await createContent({
      type: 'blog-post',
      slug: 'my-first-post',
      data,
    })

    expect(result.success).toBe(true)
    expect(result.data?.item.type).toBe('blog-post')
  })
})
