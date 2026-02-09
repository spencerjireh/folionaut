/**
 * Test helpers index file.
 * Re-exports all helper utilities for easy importing.
 */

// Environment helpers
export { setupTestEnv, getTestAdminKey, getInvalidAdminKey, TEST_ENV } from './mock-env'

// Cache helpers
export {
  MockCacheProvider,
  getMockCache,
  resetMockCache,
  createMockCache,
} from './mock-cache'

// LLM helpers
export {
  MockLLMProvider,
  getMockLLM,
  resetMockLLM,
  createMockLLM,
  type MockLLMConfig,
} from './mock-llm'

// Test factories
export {
  resetIdCounter,
  createContent,
  createProject,
  createExperience,
  createSkill,
  createAbout,
  createContact,
  createContentHistory,
  createChatSession,
  createChatMessage,
  createUserMessage,
  createAssistantMessage,
  createProjectData,
  createExperienceData,
  createSkillsData,
  createContentBundle,
} from './test-factories'

// Test app helpers
export {
  createTestApp,
  createTestAppWithErrorHandler,
  addErrorHandler,
} from './test-app'

// Test database helpers
export {
  createTestDb,
  initializeSchema,
  cleanupTestDb,
  closeTestDb,
  type TestDb,
} from './test-db'
