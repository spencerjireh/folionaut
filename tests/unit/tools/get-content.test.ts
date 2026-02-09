
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

describe('getContent', () => {
  let getContent: typeof import('@/tools/core/get-content').getContent

  beforeEach(async () => {
    vi.clearAllMocks()
    const module = await import('@/tools/core/get-content')
    getContent = module.getContent
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('should get content item by type and slug', async () => {
    const mockItem = {
      id: 'cnt_1',
      slug: 'portfolio-website',
      type: 'project',
      data: { title: 'Portfolio Website', description: 'My portfolio' },
      status: 'published',
      version: 1,
      sortOrder: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    mockContentRepository.findBySlug.mockResolvedValue(mockItem)

    const result = await getContent({
      type: 'project',
      slug: 'portfolio-website',
    })

    expect(result.success).toBe(true)
    expect(result.data?.item.slug).toBe('portfolio-website')
    expect(result.data?.item.data).toEqual({ title: 'Portfolio Website', description: 'My portfolio' })
    expect(mockContentRepository.findBySlug).toHaveBeenCalledWith('project', 'portfolio-website')
  })

  it('should return error when content not found', async () => {
    mockContentRepository.findBySlug.mockResolvedValue(null)

    const result = await getContent({
      type: 'project',
      slug: 'non-existent',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Content not found: project/non-existent')
  })
})
