import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { contentRepository } from '@/repositories/content.repository'
import { formatBundleAsMarkdown } from '@/lib/portfolio'

export function registerSummarizePortfolio(server: McpServer) {
  server.prompt(
    'summarize_portfolio',
    'Generate a summary of the entire portfolio',
    {},
    async () => {
      const bundle = await contentRepository.getBundle()
      const portfolioData = formatBundleAsMarkdown(bundle)

      return {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: `Summarize this portfolio, covering professional background, key skills, notable projects, and career trajectory.\n\nHere is the portfolio data:\n${portfolioData}`,
            },
          },
        ],
      }
    }
  )
}
