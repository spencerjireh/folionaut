
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

describe('deleteContent', () => {
  let deleteContent: typeof import('@/tools/core/delete-content').deleteContent

  const existingItem = {
    id: 'content_1',
    slug: 'test-project',
    type: 'project',
    data: { title: 'Test', description: 'Test', tags: [] },
    status: 'published',
    version: 1,
    sortOrder: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    const module = await import('@/tools/core/delete-content')
    deleteContent = module.deleteContent
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('should delete content successfully', async () => {
    mockContentRepository.findById.mockResolvedValue(existingItem)
    mockContentRepository.delete.mockResolvedValue(true)

    const result = await deleteContent({ id: 'content_1' })

    expect(result.success).toBe(true)
    expect(result.data?.id).toBe('content_1')
    expect(result.data?.type).toBe('project')
    expect(result.data?.slug).toBe('test-project')
    expect(mockContentRepository.delete).toHaveBeenCalledWith('content_1')
  })

  it('should return error when content not found', async () => {
    mockContentRepository.findById.mockResolvedValue(null)

    const result = await deleteContent({ id: 'content_999' })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Content not found')
  })

  it('should return error when repo delete fails', async () => {
    mockContentRepository.findById.mockResolvedValue(existingItem)
    mockContentRepository.delete.mockResolvedValue(false)

    const result = await deleteContent({ id: 'content_1' })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Delete failed')
  })
})
