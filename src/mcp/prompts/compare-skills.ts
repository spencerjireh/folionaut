import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { contentRepository } from '@/repositories/content.repository'
import { CompareSkillsArgsSchema, CompareSkillsPromptArgsShape } from '../schemas'
import type { SkillsListData } from '@/validation/content.schemas'

export function registerCompareSkills(server: McpServer) {
  server.prompt(
    'compare_skills',
    'Compare portfolio skills against job requirements',
    CompareSkillsPromptArgsShape,
    async (args) => {
      // Parse comma-separated strings into arrays, filtering empty entries
      const requiredSkills = args.requiredSkills
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
      const niceToHave = args.niceToHave
        ? args.niceToHave
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : undefined

      const params = CompareSkillsArgsSchema.parse({
        requiredSkills,
        niceToHave,
      })

      const skillsContent = await contentRepository.findPublished('skill')

      let portfolioSkills: string[] = []
      let skillDetails: Array<{ name: string; category: string; proficiency?: number }> = []

      if (skillsContent.length > 0) {
        const skillsData = skillsContent[0].data as SkillsListData
        portfolioSkills = skillsData.items.map((s) => s.name.toLowerCase())
        skillDetails = skillsData.items.map((s) => ({
          name: s.name,
          category: s.category,
          proficiency: s.proficiency,
        }))
      }

      // Categorize required skills
      const matchedRequired: string[] = []
      const missingRequired: string[] = []
      for (const skill of params.requiredSkills) {
        if (portfolioSkills.includes(skill.toLowerCase())) {
          matchedRequired.push(skill)
        } else {
          missingRequired.push(skill)
        }
      }

      // Categorize nice-to-have skills
      const matchedNice: string[] = []
      const missingNice: string[] = []
      if (params.niceToHave) {
        for (const skill of params.niceToHave) {
          if (portfolioSkills.includes(skill.toLowerCase())) {
            matchedNice.push(skill)
          } else {
            missingNice.push(skill)
          }
        }
      }

      const analysis = `
## Job Skills Comparison

### Required Skills
**Matched (${matchedRequired.length}/${params.requiredSkills.length}):**
${matchedRequired.length > 0 ? matchedRequired.map((s) => `- ${s}`).join('\n') : '- None'}

**Missing:**
${missingRequired.length > 0 ? missingRequired.map((s) => `- ${s}`).join('\n') : '- None'}

${
  params.niceToHave
    ? `### Nice-to-Have Skills
**Matched (${matchedNice.length}/${params.niceToHave.length}):**
${matchedNice.length > 0 ? matchedNice.map((s) => `- ${s}`).join('\n') : '- None'}

**Missing:**
${missingNice.length > 0 ? missingNice.map((s) => `- ${s}`).join('\n') : '- None'}`
    : ''
}

### Portfolio Skills (for reference)
${skillDetails.map((s) => `- ${s.name} (${s.category}${s.proficiency ? `, proficiency: ${s.proficiency}/5` : ''})`).join('\n')}
`

      const matchPercentage = Math.round(
        (matchedRequired.length / params.requiredSkills.length) * 100
      )

      return {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: `Analyze how well this portfolio matches the job requirements. The required skills match rate is ${matchPercentage}%.

${analysis}

Please provide:
1. An overall assessment of the match
2. Analysis of the skill gaps
3. Related skills in the portfolio that might partially address gaps
4. Recommendations for the candidate`,
            },
          },
        ],
      }
    }
  )
}
