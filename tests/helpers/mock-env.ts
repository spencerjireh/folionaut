/**
 * Test environment variables setup.
 * These values are used to initialize the test environment.
 */
export const TEST_ENV = {
  NODE_ENV: 'test',
  PORT: '3001',
  TURSO_DATABASE_URL: 'file::memory:?cache=shared',
  TURSO_AUTH_TOKEN: 'test-auth-token-placeholder',
  REDIS_URL: undefined,
  ADMIN_API_KEY: 'test-admin-api-key-that-is-at-least-32-chars',
  LLM_PROVIDER: 'openai',
  LLM_API_KEY: 'test-llm-api-key',
  LLM_MODEL: 'gpt-4o-mini',
  LLM_MAX_TOKENS: '500',
  LLM_TEMPERATURE: '0.7',
  LLM_REQUEST_TIMEOUT_MS: '30000',
  LLM_MAX_RETRIES: '3',
  REQUEST_TIMEOUT_MS: '30000',
  CHAT_REQUEST_TIMEOUT_MS: '60000',
  RATE_LIMIT_CAPACITY: '10',
  RATE_LIMIT_REFILL_RATE: '1',
  CORS_ORIGINS: 'http://localhost:3000',
  OTEL_ENABLED: 'false',
}

/**
 * Sets up the test environment variables.
 * Call this before importing any modules that depend on env.
 */
export function setupTestEnv(): void {
  Object.entries(TEST_ENV).forEach(([key, value]) => {
    if (value !== undefined) {
      process.env[key] = value
    } else {
      delete process.env[key]
    }
  })
}

/**
 * Returns a valid admin API key for tests.
 */
export function getTestAdminKey(): string {
  return TEST_ENV.ADMIN_API_KEY
}

/**
 * Returns an invalid admin API key for tests.
 */
export function getInvalidAdminKey(): string {
  return 'invalid-admin-key-that-is-also-32-chars'
}
