
const { mockContentRepository } = vi.hoisted(() => ({
  mockContentRepository: {
    findAll: vi.fn(),
    findBySlug: vi.fn(),
    findPublished: vi.fn(),
  },
}))

vi.mock('@/repositories/content.repository', () => ({
  contentRepository: mockContentRepository,
}))

describe('searchContent', () => {
  let searchContent: typeof import('@/tools/core/search-content').searchContent

  beforeEach(async () => {
    vi.clearAllMocks()
    const module = await import('@/tools/core/search-content')
    searchContent = module.searchContent
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('should search content by query in title', async () => {
    const mockItems = [
      {
        id: 'cnt_1',
        slug: 'react-project',
        type: 'project',
        data: { title: 'React Dashboard', description: 'A dashboard built with React' },
        status: 'published',
        version: 1,
        sortOrder: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'cnt_2',
        slug: 'vue-project',
        type: 'project',
        data: { title: 'Vue App', description: 'An app built with Vue' },
        status: 'published',
        version: 1,
        sortOrder: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]

    mockContentRepository.findPublished.mockResolvedValue(mockItems)

    const result = await searchContent({
      query: 'react',
      limit: 10,
    })

    expect(result.success).toBe(true)
    expect(result.data?.items).toHaveLength(1)
    expect(result.data?.items[0].slug).toBe('react-project')
  })

  it('should search content by query in description', async () => {
    const mockItems = [
      {
        id: 'cnt_1',
        slug: 'project-1',
        type: 'project',
        data: { title: 'Project 1', description: 'Uses TypeScript extensively' },
        status: 'published',
        version: 1,
        sortOrder: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]

    mockContentRepository.findPublished.mockResolvedValue(mockItems)

    const result = await searchContent({
      query: 'typescript',
      limit: 10,
    })

    expect(result.success).toBe(true)
    expect(result.data?.items).toHaveLength(1)
  })

  it('should search content by query in tags', async () => {
    const mockItems = [
      {
        id: 'cnt_1',
        slug: 'project-1',
        type: 'project',
        data: { title: 'Project 1', tags: ['nodejs', 'express', 'mongodb'] },
        status: 'published',
        version: 1,
        sortOrder: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]

    mockContentRepository.findPublished.mockResolvedValue(mockItems)

    const result = await searchContent({
      query: 'mongodb',
      limit: 10,
    })

    expect(result.success).toBe(true)
    expect(result.data?.items).toHaveLength(1)
  })

  it('should search content in nested items array', async () => {
    const mockItems = [
      {
        id: 'cnt_1',
        slug: 'skills',
        type: 'skill',
        data: {
          items: [
            { name: 'JavaScript', level: 'expert' },
            { name: 'Python', level: 'intermediate' },
          ],
        },
        status: 'published',
        version: 1,
        sortOrder: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]

    mockContentRepository.findPublished.mockResolvedValue(mockItems)

    const result = await searchContent({
      query: 'python',
      limit: 10,
    })

    expect(result.success).toBe(true)
    expect(result.data?.items).toHaveLength(1)
  })

  it('should filter by content type when provided', async () => {
    mockContentRepository.findPublished.mockResolvedValue([])

    await searchContent({
      query: 'test',
      type: 'project',
      limit: 10,
    })

    expect(mockContentRepository.findPublished).toHaveBeenCalledWith('project')
  })

  it('should apply limit to results', async () => {
    const mockItems = Array(20)
      .fill(null)
      .map((_, i) => ({
        id: `cnt_${i}`,
        slug: `project-${i}`,
        type: 'project',
        data: { title: `Project ${i}`, description: 'Test project' },
        status: 'published',
        version: 1,
        sortOrder: i,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }))

    mockContentRepository.findPublished.mockResolvedValue(mockItems)

    const result = await searchContent({
      query: 'test',
      limit: 5,
    })

    expect(result.success).toBe(true)
    expect(result.data?.items).toHaveLength(5)
  })

  it('should return empty array when no matches', async () => {
    const mockItems = [
      {
        id: 'cnt_1',
        slug: 'project-1',
        type: 'project',
        data: { title: 'Project 1' },
        status: 'published',
        version: 1,
        sortOrder: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]

    mockContentRepository.findPublished.mockResolvedValue(mockItems)

    const result = await searchContent({
      query: 'nonexistent',
      limit: 10,
    })

    expect(result.success).toBe(true)
    expect(result.data?.items).toHaveLength(0)
  })

  it('should be case-insensitive', async () => {
    const mockItems = [
      {
        id: 'cnt_1',
        slug: 'project-1',
        type: 'project',
        data: { title: 'UPPERCASE TITLE' },
        status: 'published',
        version: 1,
        sortOrder: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]

    mockContentRepository.findPublished.mockResolvedValue(mockItems)

    const result = await searchContent({
      query: 'uppercase',
      limit: 10,
    })

    expect(result.success).toBe(true)
    expect(result.data?.items).toHaveLength(1)
  })
})
