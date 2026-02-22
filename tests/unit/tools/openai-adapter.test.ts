
const { mockListContent, mockGetContent, mockSearchContent, mockListTypes } = vi.hoisted(() => ({
  mockListContent: vi.fn(),
  mockGetContent: vi.fn(),
  mockSearchContent: vi.fn(),
  mockListTypes: vi.fn(),
}))

vi.mock('@/tools/core', () => ({
  listContent: mockListContent,
  getContent: mockGetContent,
  searchContent: mockSearchContent,
  listTypes: mockListTypes,
}))

// Mock content repository (needed by core modules)
vi.mock('@/repositories/content.repository', () => ({
  contentRepository: {
    findAll: vi.fn(),
    findBySlug: vi.fn(),
    findPublished: vi.fn(),
  },
}))

describe('OpenAI Adapter', () => {
  let executeToolCall: typeof import('@/tools/openai-adapter').executeToolCall
  let chatToolDefinitions: typeof import('@/tools/openai-adapter').chatToolDefinitions

  beforeEach(async () => {
    vi.clearAllMocks()
    const module = await import('@/tools/openai-adapter')
    executeToolCall = module.executeToolCall
    chatToolDefinitions = module.chatToolDefinitions
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('chatToolDefinitions', () => {
    it('should have four tool definitions', () => {
      expect(chatToolDefinitions).toHaveLength(4)
    })

    it('should include list_types tool', () => {
      const listTypesTool = chatToolDefinitions.find((t) => t.name === 'list_types')
      expect(listTypesTool).toBeDefined()
      expect(listTypesTool?.description).toContain('content types')
      expect(listTypesTool?.parameters).toBeDefined()
    })

    it('should include list_content tool', () => {
      const listTool = chatToolDefinitions.find((t) => t.name === 'list_content')
      expect(listTool).toBeDefined()
      expect(listTool?.description).toContain('List')
      expect(listTool?.parameters).toBeDefined()
    })

    it('should include get_content tool', () => {
      const getTool = chatToolDefinitions.find((t) => t.name === 'get_content')
      expect(getTool).toBeDefined()
      expect(getTool?.description).toContain('Get')
      expect(getTool?.parameters).toBeDefined()
    })

    it('should include search_content tool', () => {
      const searchTool = chatToolDefinitions.find((t) => t.name === 'search_content')
      expect(searchTool).toBeDefined()
      expect(searchTool?.description).toContain('Search')
      expect(searchTool?.parameters).toBeDefined()
    })
  })

  describe('executeToolCall', () => {
    it('should execute list_content tool', async () => {
      mockListContent.mockResolvedValue({
        success: true,
        data: { items: [{ id: '1', slug: 'test' }] },
      })

      const result = await executeToolCall({
        id: 'call_123',
        type: 'function',
        function: {
          name: 'list_content',
          arguments: JSON.stringify({ type: 'project', status: 'published', limit: 50 }),
        },
      })

      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      expect(parsed.data.items).toHaveLength(1)
      expect(mockListContent).toHaveBeenCalledWith({ type: 'project', status: 'published', limit: 50 })
    })

    it('should execute get_content tool', async () => {
      mockGetContent.mockResolvedValue({
        success: true,
        data: { item: { id: '1', slug: 'portfolio' } },
      })

      const result = await executeToolCall({
        id: 'call_123',
        type: 'function',
        function: {
          name: 'get_content',
          arguments: JSON.stringify({ type: 'project', slug: 'portfolio' }),
        },
      })

      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      expect(parsed.data.item.slug).toBe('portfolio')
      expect(mockGetContent).toHaveBeenCalledWith({ type: 'project', slug: 'portfolio' })
    })

    it('should execute search_content tool', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        data: { items: [{ id: '1', slug: 'react-project' }] },
      })

      const result = await executeToolCall({
        id: 'call_123',
        type: 'function',
        function: {
          name: 'search_content',
          arguments: JSON.stringify({ query: 'react', limit: 10 }),
        },
      })

      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(true)
      expect(parsed.data.items).toHaveLength(1)
      expect(mockSearchContent).toHaveBeenCalledWith({ query: 'react', limit: 10 })
    })

    it('should return error for unknown tool', async () => {
      const result = await executeToolCall({
        id: 'call_123',
        type: 'function',
        function: {
          name: 'unknown_tool',
          arguments: '{}',
        },
      })

      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(false)
      expect(parsed.error).toBe('Unknown tool: unknown_tool')
    })

    it('should return error for invalid JSON arguments', async () => {
      const result = await executeToolCall({
        id: 'call_123',
        type: 'function',
        function: {
          name: 'list_content',
          arguments: 'invalid json',
        },
      })

      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(false)
      expect(parsed.error).toBe('Invalid JSON arguments')
    })
  })

  describe('metadata stripping', () => {
    const fullContentItem = {
      id: 'cnt_abc',
      slug: 'my-project',
      type: 'project',
      data: { title: 'My Project', description: 'A cool project' },
      status: 'published',
      version: 3,
      sortOrder: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-06-01T00:00:00Z',
    }

    it('should strip metadata from list_content items', async () => {
      mockListContent.mockResolvedValue({
        success: true,
        data: { items: [fullContentItem] },
      })

      const result = await executeToolCall({
        id: 'call_1',
        type: 'function',
        function: { name: 'list_content', arguments: JSON.stringify({ type: 'project' }) },
      })

      const parsed = JSON.parse(result)
      const item = parsed.data.items[0]
      expect(item).not.toHaveProperty('id')
      expect(item).not.toHaveProperty('version')
      expect(item).not.toHaveProperty('sortOrder')
      expect(item).not.toHaveProperty('createdAt')
      expect(item).not.toHaveProperty('updatedAt')
      expect(item).toHaveProperty('slug', 'my-project')
      expect(item).toHaveProperty('type', 'project')
      expect(item).toHaveProperty('data')
      expect(item).toHaveProperty('status', 'published')
    })

    it('should strip metadata from get_content item', async () => {
      mockGetContent.mockResolvedValue({
        success: true,
        data: { item: fullContentItem },
      })

      const result = await executeToolCall({
        id: 'call_1',
        type: 'function',
        function: { name: 'get_content', arguments: JSON.stringify({ type: 'project', slug: 'my-project' }) },
      })

      const parsed = JSON.parse(result)
      const item = parsed.data.item
      expect(item).not.toHaveProperty('id')
      expect(item).not.toHaveProperty('version')
      expect(item).toHaveProperty('slug', 'my-project')
      expect(item).toHaveProperty('data')
    })

    it('should pass through list_types result unchanged', async () => {
      const typesResult = {
        success: true,
        data: { types: [{ type: 'project', count: 3 }] },
      }
      mockListTypes.mockResolvedValue(typesResult)

      const result = await executeToolCall({
        id: 'call_1',
        type: 'function',
        function: { name: 'list_types', arguments: '{}' },
      })

      const parsed = JSON.parse(result)
      expect(parsed).toEqual(typesResult)
    })

    it('should pass through error results unchanged', async () => {
      const result = await executeToolCall({
        id: 'call_1',
        type: 'function',
        function: { name: 'unknown_tool', arguments: '{}' },
      })

      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(false)
      expect(parsed.error).toBe('Unknown tool: unknown_tool')
    })
  })

  describe('error handling', () => {
    it('should return error result when Zod validation fails', async () => {
      const { ZodError } = await import('zod')
      mockListContent.mockRejectedValue(
        new ZodError([
          {
            code: 'invalid_type',
            expected: 'string',
            received: 'number',
            path: ['type'],
            message: 'Expected string, received number',
          },
        ])
      )

      const result = await executeToolCall({
        id: 'call_123',
        type: 'function',
        function: {
          name: 'list_content',
          arguments: JSON.stringify({ type: 123 }),
        },
      })

      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(false)
      expect(parsed.error).toContain('Invalid tool arguments')
      expect(parsed.error).toContain('type')
    })

    it('should return error result when database throws', async () => {
      mockGetContent.mockRejectedValue(new Error('Database connection failed'))

      const result = await executeToolCall({
        id: 'call_123',
        type: 'function',
        function: {
          name: 'get_content',
          arguments: JSON.stringify({ type: 'project', slug: 'test' }),
        },
      })

      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(false)
      expect(parsed.error).toBe('Tool execution failed: Database connection failed')
    })

    it('should handle non-Error throws gracefully', async () => {
      mockSearchContent.mockRejectedValue('string error')

      const result = await executeToolCall({
        id: 'call_123',
        type: 'function',
        function: {
          name: 'search_content',
          arguments: JSON.stringify({ query: 'test' }),
        },
      })

      const parsed = JSON.parse(result)
      expect(parsed.success).toBe(false)
      expect(parsed.error).toBe('Tool execution failed: Unknown error')
    })
  })
})
