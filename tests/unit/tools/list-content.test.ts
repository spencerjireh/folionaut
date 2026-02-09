
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

describe('listContent', () => {
  let listContent: typeof import('@/tools/core/list-content').listContent

  beforeEach(async () => {
    vi.clearAllMocks()
    const module = await import('@/tools/core/list-content')
    listContent = module.listContent
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('should list content items by type', async () => {
    const mockItems = [
      {
        id: 'cnt_1',
        slug: 'project-1',
        type: 'project',
        data: { title: 'Project 1' },
        status: 'published',
        version: 1,
        sortOrder: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'cnt_2',
        slug: 'project-2',
        type: 'project',
        data: { title: 'Project 2' },
        status: 'published',
        version: 1,
        sortOrder: 1,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
    ]

    mockContentRepository.findAll.mockResolvedValue(mockItems)

    const result = await listContent({
      type: 'project',
      status: 'published',
      limit: 50,
    })

    expect(result.success).toBe(true)
    expect(result.data?.items).toHaveLength(2)
    expect(result.data?.items[0].slug).toBe('project-1')
    expect(mockContentRepository.findAll).toHaveBeenCalledWith({
      type: 'project',
      status: 'published',
      limit: 50,
    })
  })

  it('should return empty array when no items found', async () => {
    mockContentRepository.findAll.mockResolvedValue([])

    const result = await listContent({
      type: 'project',
      status: 'published',
      limit: 50,
    })

    expect(result.success).toBe(true)
    expect(result.data?.items).toHaveLength(0)
  })

  it('should apply default status when not provided', async () => {
    mockContentRepository.findAll.mockResolvedValue([])

    await listContent({
      type: 'project',
    })

    expect(mockContentRepository.findAll).toHaveBeenCalledWith({
      type: 'project',
      status: 'published',
      limit: 50,
    })
  })
})
