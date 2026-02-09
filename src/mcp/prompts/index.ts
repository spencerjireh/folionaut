import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerSummarizePortfolio } from './summarize-portfolio'
import { registerExplainProject } from './explain-project'
import { registerCompareSkills } from './compare-skills'

export function registerPrompts(server: McpServer) {
  registerSummarizePortfolio(server)
  registerExplainProject(server)
  registerCompareSkills(server)
}
