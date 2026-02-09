import { createMcpTestClient, type McpTestContext } from './helpers/mcp-test-client'

describe('MCP Tools (E2E)', () => {
  let ctx: McpTestContext

  beforeAll(async () => {
    ctx = await createMcpTestClient()
  }, 30000)

  afterAll(async () => {
    await ctx.cleanup()
  })

  it('listTools returns all 6 tools with name, description, and inputSchema', async () => {
    const result = await ctx.client.listTools()

    expect(result.tools.length).toBe(6)
    const names = result.tools.map((t) => t.name)
    expect(names).toContain('list_content')
    expect(names).toContain('get_content')
    expect(names).toContain('search_content')
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
        slug: 'mcp-test-project',
        data: { title: 'MCP Test', description: 'Created via MCP', tags: ['mcp'] },
        status: 'published',
      },
    })

    expect(result.isError).toBeFalsy()
    const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text)
    expect(parsed.item).toHaveProperty('id')
    expect(parsed.item.slug).toBe('mcp-test-project')
  })

  it('duplicate slug returns error', async () => {
    // First create should succeed (or already exists from previous test)
    await ctx.client.callTool({
      name: 'create_content',
      arguments: {
        type: 'project',
        slug: 'dup-slug',
        data: { title: 'Dup 1', description: 'First', tags: [] },
      },
    })

    const result = await ctx.client.callTool({
      name: 'create_content',
      arguments: {
        type: 'project',
        slug: 'dup-slug',
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
      arguments: { type: 'project', slug: 'mcp-test-project' },
    })

    expect(result.isError).toBeFalsy()
    const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text)
    expect(parsed.item).toBeDefined()
    expect(parsed.item.slug).toBe('mcp-test-project')
    expect(parsed.item.data).toHaveProperty('title', 'MCP Test')
  })

  it('search_content returns items envelope', async () => {
    const result = await ctx.client.callTool({
      name: 'search_content',
      arguments: { query: 'MCP Test' },
    })

    expect(result.isError).toBeFalsy()
    const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text)
    expect(parsed.items).toBeDefined()
    expect(Array.isArray(parsed.items)).toBe(true)
    expect(parsed.items.length).toBeGreaterThan(0)
  })

  it('update_content increments version', async () => {
    // Get the ID via get_content
    const getResult = await ctx.client.callTool({
      name: 'get_content',
      arguments: { type: 'project', slug: 'mcp-test-project' },
    })
    const getParsed = JSON.parse((getResult.content as Array<{ text: string }>)[0].text)
    const id = getParsed.item.id

    const updateResult = await ctx.client.callTool({
      name: 'update_content',
      arguments: {
        id,
        data: { title: 'MCP Updated', description: 'Updated via MCP', tags: ['mcp', 'updated'] },
      },
    })

    expect(updateResult.isError).toBeFalsy()
    const parsed = JSON.parse((updateResult.content as Array<{ text: string }>)[0].text)
    expect(parsed.item).toBeDefined()
    expect(parsed.item.version).toBe(2)
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
