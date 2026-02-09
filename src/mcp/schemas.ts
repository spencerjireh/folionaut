import { z } from 'zod'

// Re-export shared tool schemas from validation layer
export {
  ContentTypeSchema,
  ContentStatusSchema,
  ListContentInputSchema,
  GetContentInputSchema,
  SearchContentInputSchema,
  CreateContentInputSchema,
  UpdateContentInputSchema,
  DeleteContentInputSchema,
  type ListContentInput,
  type GetContentInput,
  type SearchContentInput,
  type CreateContentInput,
  type UpdateContentInput,
  type DeleteContentInput,
} from '@/validation/tool.schemas'

// Keep prompt schemas (specialized by design)
export const SummarizePortfolioArgsSchema = z.object({
  audience: z.enum(['recruiter', 'technical', 'general']),
})

export const ExplainProjectArgsSchema = z.object({
  slug: z.string(),
  depth: z.enum(['overview', 'detailed', 'deep-dive']),
})

export const CompareSkillsArgsSchema = z.object({
  requiredSkills: z.array(z.string().min(1)).min(1),
  niceToHave: z.array(z.string().min(1)).optional(),
})

// MCP Prompt argument shapes (MCP prompts receive string arguments from users)
export const CompareSkillsPromptArgsShape = {
  requiredSkills: z.string().min(1).describe('Comma-separated list of required skills for the job'),
  niceToHave: z.string().optional().describe('Comma-separated list of nice-to-have skills'),
}

export const ExplainProjectPromptArgsShape = {
  slug: z.string().describe('The project slug to explain'),
  depth: z
    .enum(['overview', 'detailed', 'deep-dive'])
    .describe('Level of detail: overview, detailed, or deep-dive'),
}

export const SummarizePortfolioPromptArgsShape = {
  audience: z
    .enum(['recruiter', 'technical', 'general'])
    .describe('Target audience: recruiter, technical, or general'),
}

// Type exports
export type SummarizePortfolioArgs = z.infer<typeof SummarizePortfolioArgsSchema>
export type ExplainProjectArgs = z.infer<typeof ExplainProjectArgsSchema>
export type CompareSkillsArgs = z.infer<typeof CompareSkillsArgsSchema>
