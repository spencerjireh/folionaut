import { z } from 'zod'

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    TURSO_DATABASE_URL: z.string().url(),
    TURSO_AUTH_TOKEN: z.string().min(1),
    REDIS_URL: z.string().url().optional(),
    ADMIN_API_KEY: z.string().default(''),
    LLM_PROVIDER: z.enum(['openai']).default('openai'),
    LLM_API_KEY: z.string().default(''),
    LLM_BASE_URL: z.string().url().optional(),
    LLM_MODEL: z.string().default('gpt-4o-mini'),
    LLM_MAX_TOKENS: z.coerce.number().default(1000),
    LLM_TEMPERATURE: z.coerce.number().default(0.7),
    LLM_REQUEST_TIMEOUT_MS: z.coerce.number().default(30000),
    LLM_MAX_RETRIES: z.coerce.number().default(3),
    REQUEST_TIMEOUT_MS: z.coerce.number().default(30000),
    CHAT_REQUEST_TIMEOUT_MS: z.coerce.number().default(60000),
    RATE_LIMIT_CAPACITY: z.coerce.number().default(5),
    RATE_LIMIT_REFILL_RATE: z.coerce.number().default(0.333),
    CONTENT_RATE_LIMIT_CAPACITY: z.coerce.number().default(60),
    CONTENT_RATE_LIMIT_REFILL_RATE: z.coerce.number().default(10),
    CORS_ORIGINS: z.string().default(''),
    OTEL_ENABLED: z.coerce.boolean().default(false),
    FEATURE_AI_CHAT: z.coerce.boolean().default(true),
    FEATURE_MCP_SERVER: z.coerce.boolean().default(true),
    FEATURE_ADMIN_API: z.coerce.boolean().default(true),
    FEATURE_RATE_LIMITING: z.coerce.boolean().default(true),
    FEATURE_AUDIT_LOG: z.coerce.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.FEATURE_AI_CHAT && !data.LLM_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'LLM_API_KEY is required when FEATURE_AI_CHAT is enabled',
        path: ['LLM_API_KEY'],
      })
    }
    if ((data.FEATURE_ADMIN_API || data.FEATURE_MCP_SERVER) && data.ADMIN_API_KEY.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'ADMIN_API_KEY must be at least 32 characters when FEATURE_ADMIN_API or FEATURE_MCP_SERVER is enabled',
        path: ['ADMIN_API_KEY'],
      })
    }
  })

export const env = envSchema.parse(process.env)
export type Env = z.infer<typeof envSchema>
