import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { contentRepository } from '@/repositories/content.repository'
import { SummarizePortfolioPromptArgsShape } from '../schemas'
import type {
  ProjectData,
  SkillsListData,
  ExperienceListData,
  SiteConfigData,
} from '@/validation/content.schemas'

export function registerSummarizePortfolio(server: McpServer) {
  server.prompt(
    'summarize_portfolio',
    'Generate a summary of the portfolio tailored to a specific audience',
    SummarizePortfolioPromptArgsShape,
    async (args) => {
      const params = args
      const bundle = await contentRepository.getBundle()

      // Prepare portfolio data
      const projectSummaries = bundle.projects.map((p) => {
        const data = p.data as ProjectData
        return `- ${data.title}: ${data.description} (Tags: ${data.tags.join(', ')})`
      })

      let skillsSummary = ''
      if (bundle.skills.length > 0) {
        const skillsData = bundle.skills[0].data as SkillsListData
        const byCategory: Record<string, string[]> = {}
        for (const skill of skillsData.items) {
          if (!byCategory[skill.category]) byCategory[skill.category] = []
          byCategory[skill.category].push(skill.name)
        }
        skillsSummary = Object.entries(byCategory)
          .map(([cat, skills]) => `${cat}: ${skills.join(', ')}`)
          .join('\n')
      }

      let experienceSummary = ''
      if (bundle.experiences.length > 0) {
        const expData = bundle.experiences[0].data as ExperienceListData
        experienceSummary = expData.items
          .map(
            (exp) =>
              `- ${exp.role} at ${exp.company} (${exp.startDate} - ${exp.endDate ?? 'Present'})`
          )
          .join('\n')
      }

      let contactInfo = ''
      if (bundle.contact) {
        const contactData = bundle.contact.data as SiteConfigData
        contactInfo = `Name: ${contactData.name}\nTitle: ${contactData.title}\nEmail: ${contactData.email}`
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
