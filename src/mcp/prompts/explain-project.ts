import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { contentRepository } from '@/repositories/content.repository'
import { ExplainProjectPromptArgsShape } from '../schemas'
import type { ProjectData } from '@/validation/content.schemas'

export function registerExplainProject(server: McpServer) {
  server.prompt(
    'explain_project',
    'Generate an explanation of a specific project at varying levels of detail',
    ExplainProjectPromptArgsShape,
    async (args) => {
      const params = args
      const project = await contentRepository.findBySlug('project', params.slug)

      if (!project) {
        return {
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: `Error: Project not found with slug "${params.slug}". Please check the slug and try again.`,
              },
            },
          ],
        }
      }

      const data = project.data as ProjectData

      const projectInfo = `
## Project: ${data.title}

**Description:** ${data.description}

**Tags:** ${data.tags.join(', ')}

**Featured:** ${data.featured ? 'Yes' : 'No'}

**Links:**
${data.links?.github ? `- GitHub: ${data.links.github}` : ''}
${data.links?.live ? `- Live: ${data.links.live}` : ''}
${data.links?.demo ? `- Demo: ${data.links.demo}` : ''}

**Full Content:**
${data.content || 'No detailed content available'}
`

      let instructions = ''
      switch (params.depth) {
        case 'overview':
          instructions = `Provide a brief overview of this project in 2-3 sentences. Focus on:
- What the project does
- The main technology/approach used
- The key value or purpose`
          break
        case 'detailed':
          instructions = `Provide a detailed explanation of this project. Cover:
- What problem it solves
- Key features and functionality
- Technologies and architecture choices
- Notable implementation details
Aim for 2-3 paragraphs.`
          break
        case 'deep-dive':
          instructions = `Provide a comprehensive deep-dive into this project. Include:
- Full context and problem statement
- Detailed feature breakdown
- Technical architecture and design decisions
- Technologies used and why they were chosen
- Challenges faced and how they were solved
- Potential improvements or future directions
Be thorough and technical.`
          break
      }

      return {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: `${instructions}\n\nHere is the project information:\n${projectInfo}`,
            },
          },
        ],
      }
    }
  )
}
