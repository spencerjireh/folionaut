import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  TURSO_DATABASE_URL: z.string().url(),
  TURSO_AUTH_TOKEN: z.string().min(1),
  REDIS_URL: z.string().url().optional(),
  ADMIN_API_KEY: z.string().min(32),
  LLM_PROVIDER: z.enum(['openai']).default('openai'),
  LLM_API_KEY: z.string().min(1),
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
  CORS_ORIGINS: z.string().default(''),
  OTEL_ENABLED: z.coerce.boolean().default(false),
})

export const env = envSchema.parse(process.env)
export type Env = z.infer<typeof envSchema>
