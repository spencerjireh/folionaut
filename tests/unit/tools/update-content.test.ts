
const { mockContentRepository, mockValidateContentData } = vi.hoisted(() => ({
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
  mockValidateContentData: vi.fn(),
}))

vi.mock('@/repositories/content.repository', () => ({
  contentRepository: mockContentRepository,
}))

vi.mock('@/validation/content.schemas', () => ({
  validateContentData: mockValidateContentData,
}))

describe('updateContent', () => {
  let updateContent: typeof import('@/tools/core/update-content').updateContent

  const existingItem = {
    id: 'content_1',
    slug: 'test-project',
    type: 'project',
    data: { title: 'Old Title', description: 'Old', tags: [] },
    status: 'published',
    version: 1,
    sortOrder: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    const module = await import('@/tools/core/update-content')
    updateContent = module.updateContent
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('should update content with valid input', async () => {
    const updatedData = { title: 'New Title', description: 'New', tags: [] }
    mockContentRepository.findById.mockResolvedValue(existingItem)
    mockValidateContentData.mockReturnValue(updatedData)
    mockContentRepository.updateWithHistory.mockResolvedValue({
      ...existingItem,
      data: updatedData,
      version: 2,
      updatedAt: '2024-01-02T00:00:00Z',
    })

    const result = await updateContent({
      id: 'content_1',
      data: updatedData,
    })

    expect(result.success).toBe(true)
    expect(result.data?.item.version).toBe(2)
    expect(result.data?.item.data).toEqual(updatedData)
  })

  it('should return error when content not found', async () => {
    mockContentRepository.findById.mockResolvedValue(null)

    const result = await updateContent({
      id: 'content_999',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Content not found')
  })

  it('should return error on validation failure', async () => {
    const { ValidationError } = await import('@/errors/app.error')
    mockContentRepository.findById.mockResolvedValue(existingItem)
    mockValidateContentData.mockImplementation(() => {
      throw new ValidationError('Invalid', { title: 'Title is required' })
    })

    const result = await updateContent({
      id: 'content_1',
      data: {},
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Validation failed')
  })

  it('should return error on slug conflict', async () => {
    mockContentRepository.findById.mockResolvedValue(existingItem)
    mockContentRepository.slugExists.mockResolvedValue(true)

    const result = await updateContent({
      id: 'content_1',
      slug: 'taken-slug',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Slug already exists')
  })

  it('should return error when updateWithHistory returns null', async () => {
    mockContentRepository.findById.mockResolvedValue(existingItem)
    mockContentRepository.updateWithHistory.mockResolvedValue(null)

    const result = await updateContent({
      id: 'content_1',
      status: 'archived',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Update failed')
  })
})
