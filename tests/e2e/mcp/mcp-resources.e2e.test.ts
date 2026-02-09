import { createMcpTestClient, type McpTestContext } from './helpers/mcp-test-client'

describe('MCP Resources (E2E)', () => {
  let ctx: McpTestContext

  beforeAll(async () => {
    ctx = await createMcpTestClient()

    // Seed via create_content tool
    await ctx.client.callTool({
      name: 'create_content',
      arguments: {
        type: 'project',
        slug: 'res-project-a',
        data: { title: 'Resource Project A', description: 'Project A', tags: ['node'] },
        status: 'published',
      },
    })

    await ctx.client.callTool({
      name: 'create_content',
      arguments: {
        type: 'project',
        slug: 'res-project-b',
        data: { title: 'Resource Project B', description: 'Project B', tags: ['python'] },
        status: 'published',
      },
    })

    await ctx.client.callTool({
      name: 'create_content',
      arguments: {
        type: 'skill',
        slug: 'res-skills',
        data: { items: [{ name: 'TypeScript', category: 'language' }] },
        status: 'published',
      },
    })
  }, 30000)

  afterAll(async () => {
    await ctx.cleanup()
  })

  it('folionaut://content returns all published items', async () => {
    const result = await ctx.client.readResource({ uri: 'folionaut://content' })

    expect(result.contents).toHaveLength(1)
    expect(result.contents[0].mimeType).toBe('application/json')

    const items = JSON.parse(result.contents[0].text as string)
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBeGreaterThanOrEqual(3)
  })

  it('folionaut://content/project returns only projects', async () => {
    const result = await ctx.client.readResource({ uri: 'folionaut://content/project' })

    const items = JSON.parse(result.contents[0].text as string)
    expect(Array.isArray(items)).toBe(true)
    for (const item of items) {
      expect(item.type).toBe('project')
    }
  })

  it('folionaut://content/skill returns only skills', async () => {
    const result = await ctx.client.readResource({ uri: 'folionaut://content/skill' })

    const items = JSON.parse(result.contents[0].text as string)
    expect(Array.isArray(items)).toBe(true)
    for (const item of items) {
      expect(item.type).toBe('skill')
    }
  })

  it('lists resource templates for dynamic type discovery', async () => {
    const result = await ctx.client.listResourceTemplates()

    expect(result.resourceTemplates).toBeDefined()
    const uriTemplates = result.resourceTemplates.map((r) => r.uriTemplate)
    expect(uriTemplates).toContain('folionaut://content/{type}')
    expect(uriTemplates).toContain('folionaut://content/{type}/{slug}')
  })

  it('lists available resources including static content resource', async () => {
    const result = await ctx.client.listResources()

    expect(result.resources).toBeDefined()
    const uris = result.resources.map((r) => r.uri)
    expect(uris).toContain('folionaut://content')
  })
})
