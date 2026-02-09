import { createMcpTestClient, type McpTestContext } from './helpers/mcp-test-client'

describe('MCP Tools (E2E)', () => {
  let ctx: McpTestContext
  let seededProjectId: string

  beforeAll(async () => {
    ctx = await createMcpTestClient()

    // Seed a project that read/update tests can reference
    const seedResult = await ctx.client.callTool({
      name: 'create_content',
      arguments: {
        type: 'project',
        slug: 'mcp-seeded-project',
        data: { title: 'MCP Seeded', description: 'Seeded via beforeAll', tags: ['seeded'] },
        status: 'published',
      },
    })
    const parsed = JSON.parse((seedResult.content as Array<{ text: string }>)[0].text)
    seededProjectId = parsed.item.id
  }, 30000)

  afterAll(async () => {
    await ctx.cleanup()
  })

  it('listTools returns all 7 tools with name, description, and inputSchema', async () => {
    const result = await ctx.client.listTools()

    expect(result.tools.length).toBe(7)
    const names = result.tools.map((t) => t.name)
    expect(names).toContain('list_content')
    expect(names).toContain('get_content')
    expect(names).toContain('search_content')
    expect(names).toContain('list_types')
    expect(names).toContain('create_content')
    expect(names).toContain('update_content')
    expect(names).toContain('delete_content')

    for (const tool of result.tools) {
      expect(typeof tool.name).toBe('string')
      expect(typeof tool.description).toBe('string')
      expect(tool.inputSchema).toBeDefined()
    }
  })

  it('create_content returns item with id and slug', async () => {
    const result = await ctx.client.callTool({
      name: 'create_content',
      arguments: {
        type: 'project',
        slug: 'mcp-create-test',
        data: { title: 'MCP Create Test', description: 'Created via MCP', tags: ['mcp'] },
        status: 'published',
      },
    })

    expect(result.isError).toBeFalsy()
    const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text)
    expect(parsed.item).toHaveProperty('id')
    expect(parsed.item.slug).toBe('mcp-create-test')
  })

  it('duplicate slug returns error', async () => {
    // First create should succeed
    await ctx.client.callTool({
      name: 'create_content',
      arguments: {
        type: 'project',
        slug: 'mcp-dup-slug',
        data: { title: 'Dup 1', description: 'First', tags: [] },
      },
    })

    const result = await ctx.client.callTool({
      name: 'create_content',
      arguments: {
        type: 'project',
        slug: 'mcp-dup-slug',
        data: { title: 'Dup 2', description: 'Second', tags: [] },
      },
    })

    expect(result.isError).toBe(true)
  })

  it('list_content returns items envelope', async () => {
    const result = await ctx.client.callTool({
      name: 'list_content',
      arguments: { type: 'project' },
    })

    expect(result.isError).toBeFalsy()
    const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text)
    expect(parsed.items).toBeDefined()
    expect(Array.isArray(parsed.items)).toBe(true)
    expect(parsed.items.length).toBeGreaterThan(0)
  })

  it('get_content returns item envelope', async () => {
    const result = await ctx.client.callTool({
      name: 'get_content',
      arguments: { type: 'project', slug: 'mcp-seeded-project' },
    })

    expect(result.isError).toBeFalsy()
    const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text)
    expect(parsed.item).toBeDefined()
    expect(parsed.item.slug).toBe('mcp-seeded-project')
    expect(parsed.item.data).toHaveProperty('title', 'MCP Seeded')
  })

  it('search_content returns items envelope', async () => {
    const result = await ctx.client.callTool({
      name: 'search_content',
      arguments: { query: 'MCP Seeded' },
    })

    expect(result.isError).toBeFalsy()
    const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text)
    expect(parsed.items).toBeDefined()
    expect(Array.isArray(parsed.items)).toBe(true)
    expect(parsed.items.length).toBeGreaterThan(0)
  })

  it('update_content increments version', async () => {
    const updateResult = await ctx.client.callTool({
      name: 'update_content',
      arguments: {
        id: seededProjectId,
        data: { title: 'MCP Updated', description: 'Updated via MCP', tags: ['mcp', 'updated'] },
      },
    })

    expect(updateResult.isError).toBeFalsy()
    const parsed = JSON.parse((updateResult.content as Array<{ text: string }>)[0].text)
    expect(parsed.item).toBeDefined()
    expect(parsed.item.version).toBe(2)
  })

  it('list_types returns types with counts', async () => {
    const result = await ctx.client.callTool({
      name: 'list_types',
      arguments: {},
    })

    expect(result.isError).toBeFalsy()
    const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text)
    expect(parsed.types).toBeDefined()
    expect(Array.isArray(parsed.types)).toBe(true)

    const projectType = parsed.types.find((t: { type: string }) => t.type === 'project')
    expect(projectType).toBeDefined()
    expect(projectType.count).toBeGreaterThan(0)
  })

  it('create and list custom type via MCP', async () => {
    await ctx.client.callTool({
      name: 'create_content',
      arguments: {
        type: 'blog-post',
        slug: 'mcp-custom-type',
        data: { title: 'Custom Type Post', body: 'Content here' },
        status: 'published',
      },
    })

    const typesResult = await ctx.client.callTool({
      name: 'list_types',
      arguments: {},
    })

    const types = JSON.parse((typesResult.content as Array<{ text: string }>)[0].text)
    const blogType = types.types.find((t: { type: string }) => t.type === 'blog-post')
    expect(blogType).toBeDefined()
    expect(blogType.count).toBeGreaterThanOrEqual(1)

    // Verify list_content works with custom type
    const listResult = await ctx.client.callTool({
      name: 'list_content',
      arguments: { type: 'blog-post' },
    })

    const listParsed = JSON.parse((listResult.content as Array<{ text: string }>)[0].text)
    expect(listParsed.items.length).toBeGreaterThanOrEqual(1)
  })

  it('delete_content removes item from list', async () => {
    // Create a throwaway item
    const createResult = await ctx.client.callTool({
      name: 'create_content',
      arguments: {
        type: 'project',
        slug: 'delete-me-mcp',
        data: { title: 'Delete Me', description: 'Will be deleted', tags: [] },
        status: 'published',
      },
    })
    const created = JSON.parse((createResult.content as Array<{ text: string }>)[0].text)
    const id = created.item.id

    const deleteResult = await ctx.client.callTool({
      name: 'delete_content',
      arguments: { id },
    })

    expect(deleteResult.isError).toBeFalsy()
    const deleted = JSON.parse((deleteResult.content as Array<{ text: string }>)[0].text)
    expect(deleted.id).toBe(id)
    expect(deleted.type).toBe('project')
    expect(deleted.slug).toBe('delete-me-mcp')

    // Verify it's gone from list
    const listResult = await ctx.client.callTool({
      name: 'list_content',
      arguments: { type: 'project' },
    })
    const listParsed = JSON.parse((listResult.content as Array<{ text: string }>)[0].text)
    const slugs = listParsed.items.map((i: { slug: string }) => i.slug)
    expect(slugs).not.toContain('delete-me-mcp')
  })
})
