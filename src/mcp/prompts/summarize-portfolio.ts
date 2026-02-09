import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { contentRepository } from '@/repositories/content.repository'
import { SummarizePortfolioPromptArgsShape } from '../schemas'

export function registerSummarizePortfolio(server: McpServer) {
  server.prompt(
    'summarize_portfolio',
    'Generate a summary of the portfolio tailored to a specific audience',
    SummarizePortfolioPromptArgsShape,
    async (args) => {
      const params = args
      const bundle = await contentRepository.getBundle()

      // Prepare portfolio data
      const projects = bundle['project'] ?? []
      const projectSummaries = projects.map((p) => {
        const data = p.data as Record<string, unknown>
        const title = data.title ?? 'Untitled'
        const description = data.description ?? ''
        const tags = Array.isArray(data.tags) ? (data.tags as string[]).join(', ') : ''
        return `- ${title}: ${description}${tags ? ` (Tags: ${tags})` : ''}`
      })

      let skillsSummary = ''
      const skills = bundle['skill'] ?? []
      if (skills.length > 0) {
        const skillsData = skills[0].data as Record<string, unknown>
        const items = (skillsData.items ?? []) as Array<{
          name: string
          category: string
          proficiency?: number
        }>
        const byCategory: Record<string, string[]> = {}
        for (const skill of items) {
          if (!byCategory[skill.category]) byCategory[skill.category] = []
          byCategory[skill.category].push(skill.name)
        }
        skillsSummary = Object.entries(byCategory)
          .map(([cat, names]) => `${cat}: ${names.join(', ')}`)
          .join('\n')
      }

      let experienceSummary = ''
      const experiences = bundle['experience'] ?? []
      if (experiences.length > 0) {
        const expData = experiences[0].data as Record<string, unknown>
        const items = (expData.items ?? []) as Array<{
          role: string
          company: string
          startDate: string
          endDate?: string | null
        }>
        experienceSummary = items
          .map(
            (exp) =>
              `- ${exp.role} at ${exp.company} (${exp.startDate} - ${exp.endDate ?? 'Present'})`
          )
          .join('\n')
      }

      let contactInfo = ''
      const contacts = bundle['contact'] ?? []
      if (contacts.length > 0) {
        const contactData = contacts[0].data as Record<string, unknown>
        const name = contactData.name ?? ''
        const title = contactData.title ?? ''
        const email = contactData.email ?? ''
        contactInfo = `Name: ${name}\nTitle: ${title}\nEmail: ${email}`
      }

      // Build audience-specific instructions
      let instructions = ''
      switch (params.audience) {
        case 'recruiter':
          instructions = `You are summarizing this portfolio for a recruiter. Focus on:
- Professional experience and career progression
- Key skills and technologies relevant to job roles
- Notable projects and their business impact
- Overall fit for typical software engineering roles
Keep the summary concise and highlight what makes this candidate stand out.`
          break
        case 'technical':
          instructions = `You are summarizing this portfolio for a technical audience (other developers, tech leads).Focus on:
- Technical skills depth and breadth
- Interesting technical challenges solved in projects
- Technologies and frameworks used
- Code quality indicators and best practices
Provide a technically detailed summary.`
          break
        case 'general':
          instructions = `You are summarizing this portfolio for a general audience. Focus on:
- Overall professional background
- What kind of work this person does
- Key projects in accessible terms
- Professional strengths
Keep the summary easy to understand without technical jargon.`
          break
      }

      const portfolioData = `
## Contact Information
${contactInfo}

## Experience
${experienceSummary || 'No experience data available'}

## Skills
${skillsSummary || 'No skills data available'}

## Projects
${projectSummaries.length > 0 ? projectSummaries.join('\n') : 'No projects available'}
`

      return {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: `${instructions}\n\nHere is the portfolio data:\n${portfolioData}\n\nPlease provide a comprehensive summary for the ${params.audience} audience.`,
            },
          },
        ],
      }
    }
  )
}
