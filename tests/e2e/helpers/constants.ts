export const MOCK_LLM_PORT = 9876
export const E2E_BASE_URL = process.env.E2E_BASE_URL ?? ''
export const ADMIN_API_KEY =
  process.env.E2E_ADMIN_KEY ?? 'test-admin-api-key-that-is-at-least-32-chars'
export const IS_DEPLOYED = !!process.env.E2E_BASE_URL
export const IS_LOCAL_SERVER = !!process.env.E2E_LOCAL_SERVER
