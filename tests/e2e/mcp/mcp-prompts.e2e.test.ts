import { createMcpTestClient, type McpTestContext } from './helpers/mcp-test-client'

describe('MCP Prompts (E2E)', () => {
  let ctx: McpTestContext

  beforeAll(async () => {
    ctx = await createMcpTestClient()

    // Seed published content via tools
    await ctx.client.callTool({
      name: 'create_content',
      arguments: {
        type: 'project',
        slug: 'prompt-project',
        data: {
          title: 'Prompt Test Project',
          description: 'A project for prompt testing',
          tags: ['typescript', 'node'],
          content: 'Detailed content about this project.',
        },
        status: 'published',
      },
    })

    await ctx.client.callTool({
      name: 'create_content',
      arguments: {
        type: 'skill',
        slug: 'prompt-skills',
        data: {
          items: [
            { name: 'TypeScript', category: 'language', proficiency: 5 },
            { name: 'Python', category: 'language', proficiency: 4 },
            { name: 'React', category: 'framework', proficiency: 4 },
          ],
        },
        status: 'published',
      },
    })

    await ctx.client.callTool({
      name: 'create_content',
      arguments: {
        type: 'experience',
        slug: 'prompt-experience',
        data: {
          items: [
            {
              company: 'Acme Corp',
              role: 'Senior Developer',
              startDate: '2022-01',
              endDate: null,
              skills: ['TypeScript'],
            },
          ],
        },
        status: 'published',
      },
    })

    await ctx.client.callTool({
      name: 'create_content',
      arguments: {
        type: 'contact',
        slug: 'prompt-contact',
        data: {
          name: 'Test User',
          title: 'Full Stack Developer',
          email: 'test@example.com',
          social: {},
        },
        status: 'published',
      },
    })
  }, 30000)

  afterAll(async () => {
    await ctx.cleanup()
  })

  it('listPrompts returns all 3 prompts with name and description', async () => {
    const result = await ctx.client.listPrompts()

    expect(result.prompts.length).toBe(3)
    const names = result.prompts.map((p) => p.name)
    expect(names).toContain('summarize_portfolio')
    expect(names).toContain('explain_project')
    expect(names).toContain('compare_skills')
  })

  describe('summarize_portfolio', () => {
    const audiences = ['recruiter', 'technical', 'general'] as const

    it.each(audiences)('with audience=%s returns messages with portfolio data', async (audience) => {
      const result = await ctx.client.getPrompt({
        name: 'summarize_portfolio',
        arguments: { audience },
      })

      expect(result.messages).toBeDefined()
      expect(result.messages.length).toBeGreaterThan(0)
      expect(result.messages[0].role).toBe('user')

      const text =
        typeof result.messages[0].content === 'string'
          ? result.messages[0].content
          : (result.messages[0].content as { text: string }).text

      expect(text).toContain(audience)
    })
  })

  describe('explain_project', () => {
    it('with valid slug returns project prompt', async () => {
      const result = await ctx.client.getPrompt({
        name: 'explain_project',
        arguments: { slug: 'prompt-project', depth: 'overview' },
      })

      expect(result.messages).toBeDefined()
      expect(result.messages.length).toBeGreaterThan(0)

      const text =
        typeof result.messages[0].content === 'string'
          ? result.messages[0].content
          : (result.messages[0].content as { text: string }).text

      expect(text).toContain('Prompt Test Project')
    })

    it('with non-existent slug returns error message', async () => {
      const result = await ctx.client.getPrompt({
        name: 'explain_project',
        arguments: { slug: 'nonexistent-project', depth: 'overview' },
      })

      expect(result.messages).toBeDefined()
      const text =
        typeof result.messages[0].content === 'string'
          ? result.messages[0].content
          : (result.messages[0].content as { text: string }).text

      expect(text).toContain('not found')
    })
  })

  describe('compare_skills', () => {
    it('with required skills returns comparison prompt', async () => {
      const result = await ctx.client.getPrompt({
        name: 'compare_skills',
        arguments: {
          requiredSkills: 'TypeScript,Python,Go',
          niceToHave: 'React,Vue',
        },
      })

      expect(result.messages).toBeDefined()
      expect(result.messages.length).toBeGreaterThan(0)

      const text =
        typeof result.messages[0].content === 'string'
          ? result.messages[0].content
          : (result.messages[0].content as { text: string }).text

      expect(text).toContain('TypeScript')
      expect(text).toContain('Skills Comparison')
    })
  })
})
